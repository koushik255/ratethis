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
    username: v.optional(v.string()),
    usernameLastChangedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),

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

  forumThreads: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    tag: v.union(v.literal("anime"), v.literal("manga"), v.literal("visual novel")),
    createdAt: v.number(),
    updatedAt: v.number(),
    replyCount: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_tag", ["tag"])
    .index("by_updatedAt", ["updatedAt"]),

  forumPosts: defineTable({
    threadId: v.id("forumThreads"),
    content: v.string(),
    authorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_authorId", ["authorId"]),

  animeLists: defineTable({
    title: v.string(),
    description: v.string(),
    authorId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    itemCount: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_updatedAt", ["updatedAt"]),

  animeListItems: defineTable({
    listId: v.id("animeLists"),
    animeId: v.id("anime"),
    addedAt: v.number(),
  })
    .index("by_listId", ["listId"])
    .index("by_animeId", ["animeId"]),

  animeListComments: defineTable({
    listId: v.id("animeLists"),
    authorId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    parentCommentId: v.optional(v.id("animeListComments")),
    replyCount: v.number(),
    isDeleted: v.boolean(),
  })
    .index("by_listId", ["listId"])
    .index("by_authorId", ["authorId"])
    .index("by_parentId", ["parentCommentId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_listId_parentId", ["listId", "parentCommentId"]),

  animeListCommentVotes: defineTable({
    commentId: v.id("animeListComments"),
    userId: v.string(),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
    createdAt: v.number(),
  })
    .index("by_commentId", ["commentId"])
    .index("by_userId", ["userId"])
    .index("by_commentId_userId", ["commentId", "userId"]),

  friendRequests: defineTable({
    senderId: v.string(),
    receiverId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_senderId", ["senderId"])
    .index("by_receiverId", ["receiverId"])
    .index("by_senderId_status", ["senderId", "status"])
    .index("by_receiverId_status", ["receiverId", "status"])
    .index("by_senderId_receiverId", ["senderId", "receiverId"]),

  friendships: defineTable({
    userId1: v.string(),
    userId2: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId1", ["userId1"])
    .index("by_userId2", ["userId2"])
    .index("by_userId1_userId2", ["userId1", "userId2"]),
});
