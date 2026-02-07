/**
 * Store AI-generated insights (internal mutation called from AI actions).
 */
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const storeInsight = internalMutation({
  args: {
    shipmentId: v.optional(v.id("shipments")),
    type: v.string(),
    content: v.string(),
  },
  returns: v.id("aiInsights"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      shipmentId: args.shipmentId,
      type: args.type,
      content: args.content,
    });
  },
});
