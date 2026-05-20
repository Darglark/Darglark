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
});
