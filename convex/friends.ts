import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get current user's friends
export const getMyFriends = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all friendships where user is either userId1 or userId2
    const [friendshipsAsUser1, friendshipsAsUser2] = await Promise.all([
      ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", userId))
        .collect(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId2", (q) => q.eq("userId2", userId))
        .collect(),
    ]);

    // Extract friend userIds
    const friendIds = [
      ...friendshipsAsUser1.map((f) => f.userId2),
      ...friendshipsAsUser2.map((f) => f.userId1),
    ];

    if (friendIds.length === 0) return [];

    // Batch fetch all friend profiles
    const friendProfiles = await Promise.all(
      friendIds.map((id) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .unique()
      )
    );

    return friendProfiles
      .filter(Boolean)
      .map((profile) => ({
        userId: profile!.userId,
        displayName: profile!.displayName || "anonymous",
        username: profile!.username,
        profilePicture: profile!.profilePicture,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

// Get pending friend requests for current user
export const getFriendRequests = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { sent: [], received: [] };

    // Get received pending requests
    const receivedRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiverId_status", (q) =>
        q.eq("receiverId", userId).eq("status", "pending")
      )
      .order("desc")
      .take(50);

    // Get sent pending requests
    const sentRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_senderId_status", (q) =>
        q.eq("senderId", userId).eq("status", "pending")
      )
      .order("desc")
      .take(50);

    // Fetch sender profiles for received requests
    const receivedWithProfiles = await Promise.all(
      receivedRequests.map(async (req) => {
        const sender = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", req.senderId))
          .unique();
        return {
          ...req,
          senderDisplayName: sender?.displayName || "anonymous",
          senderProfilePicture: sender?.profilePicture,
        };
      })
    );

    // Fetch receiver profiles for sent requests
    const sentWithProfiles = await Promise.all(
      sentRequests.map(async (req) => {
        const receiver = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", req.receiverId))
          .unique();
        return {
          ...req,
          receiverDisplayName: receiver?.displayName || "anonymous",
          receiverProfilePicture: receiver?.profilePicture,
        };
      })
    );

    return {
      received: receivedWithProfiles,
      sent: sentWithProfiles,
    };
  },
});

// Search users by display name
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 20;
    const searchTerm = args.query.toLowerCase().trim();

    if (!searchTerm) return [];

    // Get all user profiles (in production, you'd want a search index)
    // For now, we'll filter profiles that match the search
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId")
      .take(100);

    // Filter matching profiles and exclude current user
    const matchingProfiles = profiles
      .filter(
        (p) =>
          p.userId !== userId &&
          (p.displayName?.toLowerCase().includes(searchTerm) ||
           p.username?.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit);

    // Check friendship status for each user
    const profilesWithStatus = await Promise.all(
      matchingProfiles.map(async (profile) => {
        // Check if already friends
        const [friendship1, friendship2] = await Promise.all([
          ctx.db
            .query("friendships")
            .withIndex("by_userId1_userId2", (q) =>
              q.eq("userId1", userId).eq("userId2", profile.userId)
            )
            .unique(),
          ctx.db
            .query("friendships")
            .withIndex("by_userId1_userId2", (q) =>
              q.eq("userId1", profile.userId).eq("userId2", userId)
            )
            .unique(),
        ]);

        const isFriend = !!(friendship1 || friendship2);

        // Check for pending requests
        const [sentRequest, receivedRequest] = await Promise.all([
          ctx.db
            .query("friendRequests")
            .withIndex("by_senderId_receiverId", (q) =>
              q.eq("senderId", userId).eq("receiverId", profile.userId)
            )
            .unique(),
          ctx.db
            .query("friendRequests")
            .withIndex("by_senderId_receiverId", (q) =>
              q.eq("senderId", profile.userId).eq("receiverId", userId)
            )
            .unique(),
        ]);

        let requestStatus: "none" | "pending_sent" | "pending_received" = "none";
        if (sentRequest?.status === "pending") {
          requestStatus = "pending_sent";
        } else if (receivedRequest?.status === "pending") {
          requestStatus = "pending_received";
        }

        return {
          userId: profile.userId,
          displayName: profile.displayName || "anonymous",
          username: profile.username,
          profilePicture: profile.profilePicture,
          isFriend,
          requestStatus,
        };
      })
    );

    return profilesWithStatus;
  },
});

// Check friendship status with another user
export const getFriendshipStatus = query({
  args: {
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { status: "not_authenticated" };

    if (userId === args.otherUserId) {
      return { status: "self" };
    }

    // Check if already friends
    const [friendship1, friendship2] = await Promise.all([
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", userId).eq("userId2", args.otherUserId)
        )
        .unique(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", args.otherUserId).eq("userId2", userId)
        )
        .unique(),
    ]);

    if (friendship1 || friendship2) {
      return { status: "friends" };
    }

    // Check for pending requests
    const [sentRequest, receivedRequest] = await Promise.all([
      ctx.db
        .query("friendRequests")
        .withIndex("by_senderId_receiverId", (q) =>
          q.eq("senderId", userId).eq("receiverId", args.otherUserId)
        )
        .unique(),
      ctx.db
        .query("friendRequests")
        .withIndex("by_senderId_receiverId", (q) =>
          q.eq("senderId", args.otherUserId).eq("receiverId", userId)
        )
        .unique(),
    ]);

    if (sentRequest?.status === "pending") {
      return { status: "request_sent", requestId: sentRequest._id };
    }

    if (receivedRequest?.status === "pending") {
      return { status: "request_received", requestId: receivedRequest._id };
    }

    return { status: "none" };
  },
});

// Send a friend request
export const sendFriendRequest = mutation({
  args: {
    receiverId: v.string(),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");

    if (senderId === args.receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if users are already friends
    const [friendship1, friendship2] = await Promise.all([
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", senderId).eq("userId2", args.receiverId)
        )
        .unique(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", args.receiverId).eq("userId2", senderId)
        )
        .unique(),
    ]);

    if (friendship1 || friendship2) {
      throw new Error("Already friends with this user");
    }

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_senderId_receiverId", (q) =>
        q.eq("senderId", senderId).eq("receiverId", args.receiverId)
      )
      .unique();

    if (existingRequest?.status === "pending") {
      throw new Error("Friend request already sent");
    }

    // If previous request was declined, update it
    if (existingRequest) {
      await ctx.db.patch(existingRequest._id, {
        status: "pending",
        updatedAt: Date.now(),
      });
      return existingRequest._id;
    }

    // Create new friend request
    const now = Date.now();
    const requestId = await ctx.db.insert("friendRequests", {
      senderId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return requestId;
  },
});

// Accept a friend request
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Friend request not found");

    if (request.receiverId !== userId) {
      throw new Error("Not authorized to accept this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request is not pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    // Create friendship (store with ordered IDs)
    const userId1 = request.senderId < request.receiverId ? request.senderId : request.receiverId;
    const userId2 = request.senderId < request.receiverId ? request.receiverId : request.senderId;

    await ctx.db.insert("friendships", {
      userId1,
      userId2,
      createdAt: Date.now(),
    });

    return true;
  },
});

// Decline a friend request
export const declineFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Friend request not found");

    if (request.receiverId !== userId) {
      throw new Error("Not authorized to decline this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request is not pending");
    }

    await ctx.db.patch(args.requestId, {
      status: "declined",
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Cancel a sent friend request
export const cancelFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Friend request not found");

    if (request.senderId !== userId) {
      throw new Error("Not authorized to cancel this request");
    }

    if (request.status !== "pending") {
      throw new Error("Can only cancel pending requests");
    }

    await ctx.db.delete(args.requestId);

    return true;
  },
});

// Remove a friend
export const removeFriend = mutation({
  args: {
    friendId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Find and delete friendship
    const [friendship1, friendship2] = await Promise.all([
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", userId).eq("userId2", args.friendId)
        )
        .unique(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId1_userId2", (q) =>
          q.eq("userId1", args.friendId).eq("userId2", userId)
        )
        .unique(),
    ]);

    const friendship = friendship1 || friendship2;
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    await ctx.db.delete(friendship._id);

    // Also clean up any existing friend requests between these users
    const [request1, request2] = await Promise.all([
      ctx.db
        .query("friendRequests")
        .withIndex("by_senderId_receiverId", (q) =>
          q.eq("senderId", userId).eq("receiverId", args.friendId)
        )
        .unique(),
      ctx.db
        .query("friendRequests")
        .withIndex("by_senderId_receiverId", (q) =>
          q.eq("senderId", args.friendId).eq("receiverId", userId)
        )
        .unique(),
    ]);

    if (request1) await ctx.db.delete(request1._id);
    if (request2) await ctx.db.delete(request2._id);

    return true;
  },
});
