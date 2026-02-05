import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getMyFavorites = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userAnimeItems = await ctx.db
      .query("userAnime")
      .withIndex("by_userId_favorite", (q) =>
        q.eq("userId", userId).eq("isFavorite", true)
      )
      .collect();

    const animeItems = await Promise.all(
      userAnimeItems.map(async (item) => {
        const anime = await ctx.db.get(item.animeId);
        return anime;
      })
    );

    return animeItems.filter((anime): anime is NonNullable<typeof anime> => anime !== null);
  },
});

export const getMyWatched = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const userAnimeItems = await ctx.db
      .query("userAnime")
      .withIndex("by_userId_watched", (q) =>
        q.eq("userId", userId).eq("isWatched", true)
      )
      .collect();

    const result = await Promise.all(
      userAnimeItems.map(async (item) => {
        const anime = await ctx.db.get(item.animeId);
        if (!anime) return null;
        return {
          ...anime,
          watchedAt: item.watchedAt,
          watchedComment: item.watchedComment,
        };
      })
    );

    return result.filter((item): item is NonNullable<typeof item> => item !== null);
  },
});

export const getUserAnimeStatus = query({
  args: { animeId: v.id("anime") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const userAnimeItem = await ctx.db
      .query("userAnime")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .unique();

    if (!userAnimeItem) return null;

    return {
      isFavorite: userAnimeItem.isFavorite,
      isWatched: userAnimeItem.isWatched,
    };
  },
});

export const toggleFavorite = mutation({
  args: { animeId: v.id("anime") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userAnime")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .unique();

    if (existing) {
      if (existing.isFavorite) {
        // Remove favorite
        await ctx.db.patch(existing._id, { 
          isFavorite: false,
          updatedAt: Date.now(),
        });
      } else {
        // Add favorite
        await ctx.db.patch(existing._id, { 
          isFavorite: true,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Create new with favorite
      await ctx.db.insert("userAnime", {
        userId,
        animeId: args.animeId,
        isFavorite: true,
        isWatched: false,
        updatedAt: Date.now(),
      });
    }
  },
});

export const toggleWatched = mutation({
  args: { 
    animeId: v.id("anime"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userAnime")
      .withIndex("by_userId_animeId", (q) =>
        q.eq("userId", userId).eq("animeId", args.animeId)
      )
      .unique();

    if (existing) {
      if (existing.isWatched) {
        // Unwatch - clear everything
        await ctx.db.patch(existing._id, { 
          isWatched: false,
          watchedAt: undefined,
          watchedComment: undefined,
          updatedAt: Date.now(),
        });
      } else {
        // Mark as watched
        await ctx.db.patch(existing._id, { 
          isWatched: true,
          watchedAt: Date.now(),
          watchedComment: args.comment,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Create new as watched
      await ctx.db.insert("userAnime", {
        userId,
        animeId: args.animeId,
        isFavorite: false,
        isWatched: true,
        watchedAt: Date.now(),
        watchedComment: args.comment,
        updatedAt: Date.now(),
      });
    }
  },
});
