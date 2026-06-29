import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";

const userReturn = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  tokenIdentifier: v.string(),
  name: v.string(),
  email: v.string(),
  pictureUrl: v.optional(v.string()),
  role: v.union(v.literal("user"), v.literal("admin")),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

export const storeUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: identity.email ?? existingUser.email,
        name: identity.name ?? existingUser.name,
        pictureUrl: identity.pictureUrl ?? existingUser.pictureUrl,
        updatedAt: Date.now(),
      });

      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "Anonymous Commander",
      email: identity.email ?? "",
      pictureUrl: identity.pictureUrl,
      role: "user",
      createdAt: Date.now(),
    });
  },
});

export const current = query({
  args: {},
  returns: v.union(userReturn, v.null()),
  handler: async (ctx) => {
    return await getCurrentUserOrNull(ctx);
  },
});

export const requireCurrentUser = query({
  args: {},
  returns: userReturn,
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
