import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("commandBriefings").withIndex("by_created_at").order("desc").take(8);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    doctrine: v.string(),
    protocol: v.string(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const title = args.title.trim();

    if (!title) {
      throw new Error("Briefing title is required.");
    }

    return await ctx.db.insert("commandBriefings", {
      title,
      doctrine: args.doctrine,
      protocol: args.protocol,
      completed: false,
      createdAt: Date.now(),
    });
  },
});

export const setCompleted = mutation({
  args: {
    briefingId: v.id("commandBriefings"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    await ctx.db.patch(args.briefingId, {
      completed: args.completed,
    });
  },
});

export const remove = mutation({
  args: {
    briefingId: v.id("commandBriefings"),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    await ctx.db.delete(args.briefingId);
  },
});
