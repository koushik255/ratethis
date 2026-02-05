import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

const VALID_TAGS = ["anime", "manga", "visual novel"] as const;

function getPreview(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "..." : "");
}

export const getThreads = query({
  args: { 
    tag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    let threads;
    if (args.tag && VALID_TAGS.includes(args.tag as typeof VALID_TAGS[number])) {
      threads = await ctx.db
        .query("forumThreads")
        .withIndex("by_tag", (q) => q.eq("tag", args.tag as typeof VALID_TAGS[number]))
        .order("desc")
        .take(limit);
    } else {
      threads = await ctx.db
        .query("forumThreads")
        .withIndex("by_updatedAt", (q) => q)
        .order("desc")
        .take(limit);
    }

    const threadsWithAuthors = await Promise.all(
      threads.map(async (thread) => {
        const author = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", thread.authorId))
          .unique();
        
        return {
          ...thread,
          authorDisplayName: author?.displayName || "anonymous",
          authorProfilePicture: author?.profilePicture,
          preview: getPreview(thread.content),
        };
      })
    );

    return threadsWithAuthors;
  },
});

export const getThread = query({
  args: { threadId: v.id("forumThreads") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) return null;

    const author = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", thread.authorId))
      .unique();

    return {
      ...thread,
      authorDisplayName: author?.displayName || "anonymous",
      authorProfilePicture: author?.profilePicture,
    };
  },
});

export const getThreadReplies = query({
  args: { 
    threadId: v.id("forumThreads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    const posts = await ctx.db
      .query("forumPosts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .take(limit);

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", post.authorId))
          .unique();
        
        return {
          ...post,
          authorDisplayName: author?.displayName || "anonymous",
          authorProfilePicture: author?.profilePicture,
        };
      })
    );

    return postsWithAuthors;
  },
});

export const createThread = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tag: v.union(v.literal("anime"), v.literal("manga"), v.literal("visual novel")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const threadId = await ctx.db.insert("forumThreads", {
      title: args.title,
      content: args.content,
      authorId: userId,
      tag: args.tag,
      createdAt: now,
      updatedAt: now,
      replyCount: 0,
    });

    return threadId;
  },
});

export const createReply = mutation({
  args: {
    threadId: v.id("forumThreads"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");

    const now = Date.now();
    
    await ctx.db.insert("forumPosts", {
      threadId: args.threadId,
      content: args.content,
      authorId: userId,
      createdAt: now,
    });

    await ctx.db.patch(args.threadId, {
      replyCount: thread.replyCount + 1,
      updatedAt: now,
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("forumThreads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");
    
    if (thread.authorId !== userId) {
      throw new Error("Not authorized to delete this thread");
    }

    const posts = await ctx.db
      .query("forumPosts")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    await ctx.db.delete(args.threadId);
  },
});

export const deleteReply = mutation({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    
    if (post.authorId !== userId) {
      throw new Error("Not authorized to delete this reply");
    }

    const thread = await ctx.db.get(post.threadId);
    if (thread) {
      await ctx.db.patch(post.threadId, {
        replyCount: Math.max(0, thread.replyCount - 1),
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.postId);
  },
});
