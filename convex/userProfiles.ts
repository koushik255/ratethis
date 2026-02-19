import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} characters` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be at most ${USERNAME_MAX_LENGTH} characters` };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
  }
  return { valid: true };
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { favorites: 0, watched: 0, lists: 0, friends: 0 };

    const [favorites, watched, lists, friendshipsAsUser1, friendshipsAsUser2] = await Promise.all([
      ctx.db
        .query("userAnime")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isFavorite"), true))
        .collect(),
      ctx.db
        .query("userAnime")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isWatched"), true))
        .collect(),
      ctx.db
        .query("animeLists")
        .withIndex("by_authorId", (q) => q.eq("authorId", userId))
        .collect(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", userId))
        .collect(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId2", (q) => q.eq("userId2", userId))
        .collect(),
    ]);

    return {
      favorites: favorites.length,
      watched: watched.length,
      lists: lists.length,
      friends: friendshipsAsUser1.length + friendshipsAsUser2.length,
    };
  },
});

export const getProfileByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return profile;
  },
});

export const getProfileByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .unique();

    return profile;
  },
});

export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const validation = validateUsername(args.username);
    if (!validation.valid) {
      return { available: false, error: validation.error };
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .unique();

    return { available: !existingProfile, error: existingProfile ? "Username is already taken" : undefined };
  },
});

export const updateProfile = mutation({
  args: {
    profilePicture: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    username: v.optional(v.string()),
    malUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const updateData: {
      profilePicture?: string;
      displayName?: string;
      bio?: string;
      username?: string;
      usernameLastChangedAt?: number;
      malUsername?: string;
    } = {
      profilePicture: args.profilePicture,
      displayName: args.displayName,
      bio: args.bio,
      malUsername: args.malUsername,
    };

    // Handle username update
    if (args.username !== undefined) {
      const normalizedUsername = args.username.toLowerCase();

      // Validate username format
      const validation = validateUsername(normalizedUsername);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check if user already has this username
      if (existingProfile?.username === normalizedUsername) {
        // No change needed
      } else {
        // Check if username is already taken by someone else
        const existingUserWithUsername = await ctx.db
          .query("userProfiles")
          .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
          .unique();

        if (existingUserWithUsername && existingUserWithUsername.userId !== userId) {
          throw new Error("Username is already taken");
        }

        // Check cooldown if user already has a username
        if (existingProfile?.username && existingProfile.usernameLastChangedAt) {
          const timeSinceLastChange = Date.now() - existingProfile.usernameLastChangedAt;
          if (timeSinceLastChange < USERNAME_CHANGE_COOLDOWN_MS) {
            const daysRemaining = Math.ceil((USERNAME_CHANGE_COOLDOWN_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000));
            throw new Error(`You can change your username again in ${daysRemaining} days`);
          }
        }

        updateData.username = normalizedUsername;
        updateData.usernameLastChangedAt = Date.now();
      }
    }

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, updateData);
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        profilePicture: args.profilePicture,
        displayName: args.displayName,
        bio: args.bio,
        username: updateData.username,
        usernameLastChangedAt: updateData.usernameLastChangedAt,
        malUsername: args.malUsername,
      });
    }

    return { success: true, username: updateData.username };
  },
});

export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [favorites, watched, lists, friendshipsAsUser1, friendshipsAsUser2] = await Promise.all([
      ctx.db
        .query("userAnime")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isFavorite"), true))
        .collect(),
      ctx.db
        .query("userAnime")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("isWatched"), true))
        .collect(),
      ctx.db
        .query("animeLists")
        .withIndex("by_authorId", (q) => q.eq("authorId", args.userId))
        .collect(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", args.userId))
        .collect(),
      ctx.db
        .query("friendships")
        .withIndex("by_userId2", (q) => q.eq("userId2", args.userId))
        .collect(),
    ]);

    return {
      favorites: favorites.length,
      watched: watched.length,
      lists: lists.length,
      friends: friendshipsAsUser1.length + friendshipsAsUser2.length,
    };
  },
});
