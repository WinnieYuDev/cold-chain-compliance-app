/**
 * Policy mutations: create and update (Admin only; enforce in UI or via auth).
 */
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createPolicy = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("food"), v.literal("pharma")),
    rules: v.any(),
    active: v.boolean(),
    createdBy: v.optional(v.id("users")),
  },
  returns: v.id("policies"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("policies", {
      name: args.name,
      type: args.type,
      rules: args.rules,
      active: args.active,
      createdBy: args.createdBy,
      updatedAt: now,
    });
  },
});

export const updatePolicy = mutation({
  args: {
    policyId: v.id("policies"),
    name: v.optional(v.string()),
    rules: v.optional(v.any()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.policyId);
    if (!existing) throw new Error("Policy not found");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.rules !== undefined) updates.rules = args.rules;
    if (args.active !== undefined) updates.active = args.active;
    await ctx.db.patch(args.policyId, updates as Record<string, unknown>);
    return null;
  },
});
