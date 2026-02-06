import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// Search anime by title using Convex search index with provider priority deduplication
export const searchByTitle = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, limit }) => {
    // Use Convex search index for full-text search across all entries
    const animes = await ctx.db
      .query("anime")
      .withSearchIndex("search_title", (q) => q.search("title", searchQuery))
      .take((limit ?? 50) * 3); // Get more results to account for duplicates
    
    // Deduplicate by provider priority
    // Priority: MyAnimeList (3) > AniDB (2) > AniList (1) > Others (0)
    
    // Group by canonical ID (MyAnimeList ID or normalized title)
    const groupedByMal = new Map<string, { anime: any; priority: number }>();
    const groupedByTitle = new Map<string, { anime: any; priority: number }>();
    
    for (const anime of animes) {
      // Extract MyAnimeList ID if available
      let malId = "";
      let bestPriority = 0;
      
      for (const source of anime.sources) {
        if (source.includes("myanimelist.net")) {
          const match = source.match(/myanimelist\.net\/anime\/(\d+)/);
          if (match) {
            malId = match[1];
            bestPriority = Math.max(bestPriority, 3);
          }
        } else if (source.includes("anidb.net")) {
          bestPriority = Math.max(bestPriority, 2);
        } else if (source.includes("anilist.co")) {
          bestPriority = Math.max(bestPriority, 1);
        }
      }
      
      const normalizedTitle = anime.title.toLowerCase().trim();
      
      // If has MAL ID, group by that
      if (malId) {
        const key = `mal:${malId}`;
        const existing = groupedByMal.get(key);
        if (!existing || bestPriority > existing.priority) {
          groupedByMal.set(key, { anime, priority: bestPriority });
        }
      } else {
        // No MAL ID - check if this title matches any existing MAL entry
        let matchedMalKey: string | null = null;
        for (const [key, { anime: existingAnime }] of groupedByMal) {
          if (existingAnime.title.toLowerCase().trim() === normalizedTitle) {
            matchedMalKey = key;
            break;
          }
        }
        
        if (matchedMalKey) {
          // This entry matches a MAL entry - skip it (MAL version is better)
          continue;
        }
        
        // No MAL match - group by title
        const existing = groupedByTitle.get(normalizedTitle);
        if (!existing || bestPriority > existing.priority) {
          groupedByTitle.set(normalizedTitle, { anime, priority: bestPriority });
        }
      }
    }
    
    // Combine results: MAL entries first, then title-grouped entries
    const results = [
      ...Array.from(groupedByMal.values()).map(({ anime }) => anime),
      ...Array.from(groupedByTitle.values()).map(({ anime }) => anime),
    ];
    
    return results.slice(0, limit ?? 50);
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

// Simple title lookup - returns just the top match for MAL matching
export const getTopMatchByTitle = query({
  args: {
    title: v.string(),
  },
  handler: async (ctx, { title }) => {
    // Use the existing search function but return only the first result
    const searchResults = await ctx.db
      .query("anime")
      .withSearchIndex("search_title", (q) => q.search("title", title))
      .take(1);
    
    return searchResults[0] || null;
  },
});
