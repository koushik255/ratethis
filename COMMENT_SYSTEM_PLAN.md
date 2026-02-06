# Comment System Implementation Plan

## Database Schema Additions

### 1. animeListComments Table
```typescript
animeListComments: defineTable({
  listId: v.id("animeLists"),
  authorId: v.string(),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  parentCommentId: v.optional(v.id("animeListComments")), // For nested replies
  replyCount: v.number(),
  isDeleted: v.boolean(),
})
.index("by_listId", ["listId"])
.index("by_authorId", ["authorId"])
.index("by_parentId", ["parentCommentId"])
.index("by_createdAt", ["createdAt"])
.index("by_listId_parentId", ["listId", "parentCommentId"]),
```

### 2. animeListCommentVotes Table (Optional - for future voting system)
```typescript
animeListCommentVotes: defineTable({
  commentId: v.id("animeListComments"),
  userId: v.string(),
  voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  createdAt: v.number(),
})
.index("by_commentId", ["commentId"])
.index("by_userId", ["userId"])
.index("by_commentId_userId", ["commentId", "userId"]),
```

## Field Specifications

### animeListComments Fields
- **listId**: Links comment to specific anime list
- **authorId**: Comment author's user ID (from auth system)
- **content**: Comment text content
- **createdAt**: Unix timestamp for ordering
- **updatedAt**: For edit tracking
- **parentCommentId**: For threaded replies (null for top-level comments)
- **replyCount**: Denormalized count for performance
- **isDeleted**: Soft delete flag

## Index Strategy
- **Primary queries**: by_listId for fetching comments per list
- **Threading**: by_listId_parentId for efficient nested comment loading
- **Author lookup**: by_authorId for user comment history
- **Time ordering**: by_createdAt for chronological display
- **Pagination**: All indexes support efficient range queries