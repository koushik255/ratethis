import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const logEpisode = mutation({
  args: {
    animeId: v.id("anime"),
    animeTitle: v.string(),
    episodeNumber: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    const existing = await ctx.db
      .query("episodeLogs")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .filter((q) => q.eq(q.field("episodeNumber"), args.episodeNumber))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        comment: args.comment,
        updatedAt: now,
      });
      return existing._id;
    }

    const logId = await ctx.db.insert("episodeLogs", {
      userId,
      animeId: args.animeId,
      animeTitle: args.animeTitle,
      episodeNumber: args.episodeNumber,
      comment: args.comment,
      loggedAt: now,
      updatedAt: now,
    });

    return logId;
  },
});

export const removeEpisodeLog = mutation({
  args: {
    animeId: v.id("anime"),
    episodeNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("episodeLogs")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .filter((q) => q.eq(q.field("episodeNumber"), args.episodeNumber))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getMyEpisodeLogs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const logs = await ctx.db
      .query("episodeLogs")
      .withIndex("by_userId_loggedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    return logs;
  },
});

export const getMyProgressForAnime = query({
  args: { animeId: v.id("anime") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const logs = await ctx.db
      .query("episodeLogs")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .collect();

    return logs.sort((a, b) => a.episodeNumber - b.episodeNumber);
  },
});

export const getEpisodeLogsForAnime = query({
  args: { animeId: v.id("anime") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("episodeLogs")
      .withIndex("by_animeId", (q) => q.eq("animeId", args.animeId))
      .order("desc")
      .collect();

    const profilePromises = logs.map(async (log) => {
      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", log.userId))
        .unique();
      return {
        ...log,
        authorName: profile?.displayName || profile?.username || "Anonymous",
      };
    });

    return Promise.all(profilePromises);
  },
});
