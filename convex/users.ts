/**
 * User and RBAC: get current user, list users (for Admin).
 * In production, use Convex Auth and enforce role in each protected function.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getCurrentUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
      role: v.union(v.literal("admin"), v.literal("supervisor"), v.literal("viewer")),
      facilityIds: v.optional(v.array(v.id("facilities"))),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      facilityIds: user.facilityIds,
    };
  },
});

export const listUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
      role: v.union(v.literal("admin"), v.literal("supervisor"), v.literal("viewer")),
    })
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
    }));
  },
});
