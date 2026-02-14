/**
 * User and RBAC: get current user (getMe), list users (for Admin).
 * Uses Convex Auth; auth identity is used for getMe.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import { auth } from "./auth";

const userProfileValidator = v.union(
  v.object({
    _id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("supervisor"), v.literal("viewer"))
    ),
    companyId: v.optional(v.id("companies")),
    facilityIds: v.optional(v.array(v.id("facilities"))),
  }),
  v.null()
);

/** Current authenticated user profile (role, companyId, etc.) or null if not signed in. */
export const getMe = query({
  args: {},
  returns: userProfileValidator,
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      facilityIds: user.facilityIds,
    };
  },
});

export const getCurrentUser = query({
  args: { userId: v.id("users") },
  returns: userProfileValidator,
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      facilityIds: user.facilityIds,
    };
  },
});

export const listUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      role: v.optional(
        v.union(v.literal("admin"), v.literal("supervisor"), v.literal("viewer"))
      ),
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
