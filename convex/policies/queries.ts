/**
 * Policy CRUD: list and get policies (Admin configures via mutations).
 */
import { v } from "convex/values";
import { query } from "../_generated/server";

export const listPolicies = query({
  args: {
    type: v.optional(v.union(v.literal("food"), v.literal("pharma"))),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("policies"),
      _creationTime: v.number(),
      name: v.string(),
      type: v.union(v.literal("food"), v.literal("pharma")),
      rules: v.any(),
      active: v.boolean(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const list = args.type !== undefined
      ? await ctx.db.query("policies").withIndex("by_type", (i) => i.eq("type", args.type!)).collect()
      : await ctx.db.query("policies").collect();
    const filtered = args.activeOnly ? list.filter((p) => p.active) : list;
    return filtered.map((p) => ({
      _id: p._id,
      _creationTime: p._creationTime,
      name: p.name,
      type: p.type,
      rules: p.rules,
      active: p.active,
      updatedAt: p.updatedAt,
    }));
  },
});

export const getPolicy = query({
  args: { policyId: v.id("policies") },
  returns: v.union(
    v.object({
      _id: v.id("policies"),
      _creationTime: v.number(),
      name: v.string(),
      type: v.union(v.literal("food"), v.literal("pharma")),
      rules: v.any(),
      active: v.boolean(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.policyId);
    if (!p) return null;
    return {
      _id: p._id,
      _creationTime: p._creationTime,
      name: p.name,
      type: p.type,
      rules: p.rules,
      active: p.active,
      updatedAt: p.updatedAt,
    };
  },
});
