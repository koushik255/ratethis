import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  let season: string;
  if (month >= 0 && month <= 2) {
    season = "winter";
  } else if (month >= 3 && month <= 5) {
    season = "spring";
  } else if (month >= 6 && month <= 8) {
    season = "summer";
  } else {
    season = "fall";
  }
  
  return { season, year };
}

// Insert a single anime entry
export const insert = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    episodes: v.optional(v.number()),
    status: v.string(),
    animeSeason: v.optional(v.object({
      season: v.optional(v.string()),
      year: v.optional(v.number()),
    })),
    picture: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.object({
      value: v.optional(v.number()),
      unit: v.optional(v.string()),
    })),
    score: v.optional(v.object({
      arithmeticGeometricMean: v.optional(v.number()),
      arithmeticMean: v.optional(v.number()),
      median: v.optional(v.number()),
    })),
    sources: v.array(v.string()),
    synonyms: v.array(v.string()),
    studios: v.array(v.string()),
    producers: v.array(v.string()),
    relatedAnime: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("anime", args);
  },
});

// Search anime by title using Convex search index
export const searchByTitle = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit }) => {
    const animes = await ctx.db
      .query("anime")
      .withSearchIndex("search_title", (q) => q.search("title", searchQuery))
      .take(limit ?? 50);
    
    return animes;
  },
});

// Get single anime by ID
export const getById = query({
  args: {
    id: v.id("anime"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get anime by MAL ID (for top anime cache lookups)
export const getByMalId = query({
  args: {
    malId: v.string(),
  },
  handler: async (ctx, { malId }) => {
    const anime = await ctx.db
      .query("anime")
      .withIndex("by_malId", (q) => q.eq("malId", malId))
      .first();
    return anime;
  },
});

// Get multiple anime by MAL IDs (batch lookup)
export const getByMalIds = query({
  args: {
    malIds: v.array(v.string()),
  },
  handler: async (ctx, { malIds }) => {
    const results = await Promise.all(
      malIds.map(async (malId) => {
        const anime = await ctx.db
          .query("anime")
          .withIndex("by_malId", (q) => q.eq("malId", malId))
          .first();
        return anime;
      })
    );
    return results.filter((anime) => anime !== null);
  },
});

// Simple title lookup - returns just the top match for MAL matching
export const getTopMatchByTitle = query({
  args: {
    title: v.string(),
  },
  handler: async (ctx, { title }) => {
    const searchResults = await ctx.db
      .query("anime")
      .withSearchIndex("search_title", (q) => q.search("title", title))
      .take(1);
    
    return searchResults[0] || null;
  },
});

export const getTopRatedCurrentSeason = query({
  args: {},
  handler: async (ctx) => {
    const { season, year } = getCurrentSeason();
    
    const allAnimeForYear = await ctx.db
      .query("anime")
      .withIndex("by_year", (q) => q.eq("animeSeason.year", year))
      .collect();
    
    const seasonAnime = allAnimeForYear.filter((anime) => {
      const animeSeason = anime.animeSeason?.season?.toLowerCase();
      return animeSeason === season.toLowerCase();
    });
    
    const currentlyAiring = seasonAnime.filter((anime) => {
      const status = anime.status?.toLowerCase() || "";
      const isNotAired = status.includes("not yet aired") || status === "upcoming" || status.includes("not yet");
      return !isNotAired;
    });
    
    const withScore = currentlyAiring.filter(
      (anime) => anime.score?.arithmeticMean !== undefined && anime.score.arithmeticMean > 0
    );
    
    withScore.sort((a, b) => {
      const scoreA = a.score?.arithmeticMean ?? 0;
      const scoreB = b.score?.arithmeticMean ?? 0;
      return scoreB - scoreA;
    });
    
    const top15 = withScore.slice(0, 15);
    
    return {
      anime: top15,
      season,
      year,
    };
  },
});

// Migration helpers - for database deduplication

export const getAllAnime = query({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cursor, limit }) => {
    const results = await ctx.db
      .query("anime")
      .paginate({
        cursor: cursor ?? null,
        numItems: limit ?? 500,
      });
    return {
      page: results.page,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
});

export const clearAllAnime = mutation({
  args: {
    batch: v.optional(v.number()),
  },
  handler: async (ctx, { batch }) => {
    const batchSize = batch ?? 1000;
    
    const userAnime = await ctx.db.query("userAnime").take(batchSize);
    for (const item of userAnime) {
      await ctx.db.delete(item._id);
    }
    
    const listComments = await ctx.db.query("animeListComments").take(batchSize);
    for (const item of listComments) {
      await ctx.db.delete(item._id);
    }
    
    const commentVotes = await ctx.db.query("animeListCommentVotes").take(batchSize);
    for (const item of commentVotes) {
      await ctx.db.delete(item._id);
    }
    
    const listItems = await ctx.db.query("animeListItems").take(batchSize);
    for (const item of listItems) {
      await ctx.db.delete(item._id);
    }
    
    const lists = await ctx.db.query("animeLists").take(batchSize);
    for (const item of lists) {
      await ctx.db.delete(item._id);
    }
    
    const cache = await ctx.db.query("topAnimeCache").take(batchSize);
    for (const item of cache) {
      await ctx.db.delete(item._id);
    }
    
    const anime = await ctx.db.query("anime").take(batchSize);
    for (const item of anime) {
      await ctx.db.delete(item._id);
    }
    
    const hasMore = userAnime.length === batchSize || 
                   listComments.length === batchSize || 
                   commentVotes.length === batchSize || 
                   listItems.length === batchSize || 
                   lists.length === batchSize || 
                   cache.length === batchSize || 
                   anime.length === batchSize;
    
    return {
      userAnimeCleared: userAnime.length,
      listCommentsCleared: listComments.length,
      commentVotesCleared: commentVotes.length,
      listItemsCleared: listItems.length,
      listsCleared: lists.length,
      cacheCleared: cache.length,
      animeCleared: anime.length,
      hasMore,
    };
  },
});

export const clearAuthSessions = mutation({
  args: {
    batch: v.optional(v.number()),
  },
  handler: async (ctx, { batch }) => {
    const batchSize = batch ?? 1000;
    
    const sessions = await ctx.db.query("authSessions").take(batchSize);
    for (const item of sessions) {
      await ctx.db.delete(item._id);
    }
    
    const refreshTokens = await ctx.db.query("authRefreshTokens").take(batchSize);
    for (const item of refreshTokens) {
      await ctx.db.delete(item._id);
    }
    
    const hasMore = sessions.length === batchSize || refreshTokens.length === batchSize;
    
    return {
      sessionsCleared: sessions.length,
      refreshTokensCleared: refreshTokens.length,
      hasMore,
    };
  },
});

export const bulkInsert = mutation({
  args: {
    animes: v.array(v.object({
      title: v.string(),
      type: v.string(),
      episodes: v.optional(v.number()),
      status: v.string(),
      animeSeason: v.optional(v.object({
        season: v.optional(v.string()),
        year: v.optional(v.number()),
      })),
      picture: v.optional(v.string()),
      thumbnail: v.optional(v.string()),
      malId: v.optional(v.string()),
      duration: v.optional(v.object({
        value: v.optional(v.number()),
        unit: v.optional(v.string()),
      })),
      score: v.optional(v.object({
        arithmeticGeometricMean: v.optional(v.number()),
        arithmeticMean: v.optional(v.number()),
        median: v.optional(v.number()),
      })),
      sources: v.array(v.string()),
      synonyms: v.array(v.string()),
      studios: v.array(v.string()),
      producers: v.array(v.string()),
      relatedAnime: v.array(v.string()),
      tags: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const anime of args.animes) {
      try {
        await ctx.db.insert("anime", anime);
        imported++;
      } catch (error) {
        failed++;
        if (errors.length < 10) {
          errors.push(`${anime.title}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return {
      imported,
      failed,
      total: args.animes.length,
      errors,
    };
  },
});
