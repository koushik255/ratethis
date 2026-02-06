import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Get comments for a list with threading support
export const getListComments = query({
  args: { 
    listId: v.id("animeLists"),
    limit: v.optional(v.number()),
    parentId: v.optional(v.id("animeListComments")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let comments;
    if (args.parentId) {
      // Get replies to specific comment
      comments = await ctx.db
        .query("animeListComments")
        .withIndex("by_listId_parentId", (q) => 
          q.eq("listId", args.listId).eq("parentCommentId", args.parentId)
        )
        .order("asc")
        .take(limit);
    } else {
      // Get top-level comments
      comments = await ctx.db
        .query("animeListComments")
        .withIndex("by_listId", (q) => q.eq("listId", args.listId))
        .filter((q) => q.eq(q.field("parentCommentId"), undefined))
        .order("asc")
        .take(limit);
    }

    const commentsWithAuthors = await Promise.all(
      comments
        .filter(comment => !comment.isDeleted) // Hide deleted comments
        .map(async (comment) => {
          const author = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q) => q.eq("userId", comment.authorId))
            .unique();
          
          return {
            ...comment,
            authorDisplayName: author?.displayName || "anonymous",
            authorProfilePicture: author?.profilePicture,
            isOwnComment: false, // Will be set by caller if needed
          };
        })
    );

    return commentsWithAuthors;
  },
});

// Get comment count for a list
export const getListCommentCount = query({
  args: { listId: v.id("animeLists") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("animeListComments")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();
    
    return comments.length;
  },
});

// Create a new comment
export const createComment = mutation({
  args: {
    listId: v.id("animeLists"),
    content: v.string(),
    parentCommentId: v.optional(v.id("animeListComments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate content length
    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment exceeds 2000 characters");
    }

    const now = Date.now();
    
    // If replying to another comment, verify parent exists
    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId);
      if (!parent || parent.listId !== args.listId) {
        throw new Error("Parent comment not found");
      }
    }

    const commentId = await ctx.db.insert("animeListComments", {
      listId: args.listId,
      authorId: userId,
      content: args.content,
      createdAt: now,
      updatedAt: now,
      parentCommentId: args.parentCommentId,
      replyCount: 0,
      isDeleted: false,
    });

    // Update parent reply count if this is a reply
    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId);
      if (parent) {
        await ctx.db.patch(args.parentCommentId, {
          replyCount: parent.replyCount + 1,
          updatedAt: now,
        });
      }
    }

    return commentId;
  },
});

// Edit an existing comment
export const editComment = mutation({
  args: {
    commentId: v.id("animeListComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to edit this comment");
    }

    if (comment.isDeleted) {
      throw new Error("Cannot edit deleted comment");
    }

    if (args.content.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment exceeds 2000 characters");
    }

    // Prevent editing after 1 hour (optional)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - comment.createdAt > oneHour) {
      throw new Error("Cannot edit comment after 1 hour");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Delete a comment (soft delete)
export const deleteComment = mutation({
  args: { commentId: v.id("animeListComments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      content: "[deleted]",
      updatedAt: Date.now(),
    });

    // Update parent reply count if this was a reply
    if (comment.parentCommentId) {
      const parent = await ctx.db.get(comment.parentCommentId);
      if (parent) {
        await ctx.db.patch(comment.parentCommentId, {
          replyCount: Math.max(0, parent.replyCount - 1),
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Rate limiting check (basic implementation)
export const canUserComment = query({
  args: { listId: v.id("animeLists") },
  handler: async (ctx, _args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    // Check if user has commented in the last 30 seconds
    const thirtySecondsAgo = Date.now() - (30 * 1000);
    const recentComments = await ctx.db
      .query("animeListComments")
      .withIndex("by_authorId", (q) => q.eq("authorId", userId))
      .filter((q) => 
        q.gte(q.field("createdAt"), thirtySecondsAgo)
      )
      .collect();

    return recentComments.length === 0;
  },
});