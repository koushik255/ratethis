import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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

export const updateProfile = mutation({
  args: {
    profilePicture: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    
    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        profilePicture: args.profilePicture,
        displayName: args.displayName,
        bio: args.bio,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        profilePicture: args.profilePicture,
        displayName: args.displayName,
        bio: args.bio,
      });
    }
    
    return { success: true };
  },
});