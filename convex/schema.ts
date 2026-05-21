import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  commandBriefings: defineTable({
    title: v.string(),
    doctrine: v.string(),
    protocol: v.string(),
    completed: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_completed", ["completed"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    pictureUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),
});
