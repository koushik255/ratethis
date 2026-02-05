import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getLists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const lists = await ctx.db
      .query("animeLists")
      .withIndex("by_updatedAt", (q) => q)
      .order("desc")
      .take(limit);

    const listsWithAuthors = await Promise.all(
      lists.map(async (list) => {
        const author = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", list.authorId))
          .unique();

        return {
          ...list,
          authorDisplayName: author?.displayName || "anonymous",
        };
      })
    );

    return listsWithAuthors;
  },
});

export const getMyLists = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const lists = await ctx.db
      .query("animeLists")
      .withIndex("by_authorId", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();

    return lists;
  },
});

export const getList = query({
  args: { listId: v.id("animeLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return null;

    const author = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", list.authorId))
      .unique();

    const listItems = await ctx.db
      .query("animeListItems")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .order("desc")
      .collect();

    const animeItems = await Promise.all(
      listItems.map(async (item) => {
        const anime = await ctx.db.get(item.animeId);
        return anime;
      })
    );

    return {
      ...list,
      authorDisplayName: author?.displayName || "anonymous",
      items: animeItems.filter((anime): anime is NonNullable<typeof anime> => anime !== null),
    };
  },
});

export const createList = mutation({
  args: {
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const wordCount = args.description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 300) {
      throw new Error("Description exceeds 300 words");
    }

    const now = Date.now();
    const listId = await ctx.db.insert("animeLists", {
      title: args.title,
      description: args.description,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
      itemCount: 0,
    });

    return listId;
  },
});

export const addToList = mutation({
  args: {
    listId: v.id("animeLists"),
    animeId: v.id("anime"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("List not found");

    if (list.authorId !== userId) {
      throw new Error("Not authorized to modify this list");
    }

    const existing = await ctx.db
      .query("animeListItems")
      .withIndex("by_listId", (q) => 
        q.eq("listId", args.listId)
      )
      .filter((q) => q.eq(q.field("animeId"), args.animeId))
      .unique();

    if (existing) {
      throw new Error("Anime already in list");
    }

    await ctx.db.insert("animeListItems", {
      listId: args.listId,
      animeId: args.animeId,
      addedAt: Date.now(),
    });

    await ctx.db.patch(args.listId, {
      itemCount: list.itemCount + 1,
      updatedAt: Date.now(),
    });
  },
});

export const removeFromList = mutation({
  args: {
    listId: v.id("animeLists"),
    animeId: v.id("anime"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("List not found");

    if (list.authorId !== userId) {
      throw new Error("Not authorized to modify this list");
    }

    const existing = await ctx.db
      .query("animeListItems")
      .withIndex("by_listId", (q) => 
        q.eq("listId", args.listId)
      )
      .filter((q) => q.eq(q.field("animeId"), args.animeId))
      .unique();

    if (!existing) {
      throw new Error("Anime not in list");
    }

    await ctx.db.delete(existing._id);

    await ctx.db.patch(args.listId, {
      itemCount: Math.max(0, list.itemCount - 1),
      updatedAt: Date.now(),
    });
  },
});

export const deleteList = mutation({
  args: { listId: v.id("animeLists") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("List not found");

    if (list.authorId !== userId) {
      throw new Error("Not authorized to delete this list");
    }

    const listItems = await ctx.db
      .query("animeListItems")
      .withIndex("by_listId", (q) => q.eq("listId", args.listId))
      .collect();

    for (const item of listItems) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.listId);
  },
});

export const isAnimeInList = query({
  args: {
    listId: v.id("animeLists"),
    animeId: v.id("anime"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const list = await ctx.db.get(args.listId);
    if (!list || list.authorId !== userId) return false;

    const existing = await ctx.db
      .query("animeListItems")
      .withIndex("by_listId", (q) => 
        q.eq("listId", args.listId)
      )
      .filter((q) => q.eq(q.field("animeId"), args.animeId))
      .unique();

    return !!existing;
  },
});
