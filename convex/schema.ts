import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  anime: defineTable({
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
  })
    .index("by_title", ["title"])
    .index("by_type", ["type"])
    .index("by_year", ["animeSeason.year"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["type", "status"],
    }),

  userProfiles: defineTable({
    userId: v.string(),
    profilePicture: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]),

  userAnime: defineTable({
    userId: v.string(),
    animeId: v.id("anime"),
    isFavorite: v.boolean(),
    isWatched: v.boolean(),
    watchedAt: v.optional(v.number()),
    watchedComment: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_favorite", ["userId", "isFavorite"])
    .index("by_userId_watched", ["userId", "isWatched"])
    .index("by_userId_animeId", ["userId", "animeId"]),
});
