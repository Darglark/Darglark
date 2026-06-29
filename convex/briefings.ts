import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

const commandBriefingReturn = v.object({
  _id: v.id("commandBriefings"),
  _creationTime: v.number(),
  title: v.string(),
  doctrine: v.string(),
  protocol: v.string(),
  completed: v.boolean(),
  createdAt: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(commandBriefingReturn),
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
  returns: v.id("commandBriefings"),
  handler: async (ctx, args) => {
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.briefingId, {
      completed: args.completed,
    });
    return null;
  },
});

export const remove = mutation({
  args: {
    briefingId: v.id("commandBriefings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.briefingId);
    return null;
  },
});
