import { v } from "convex/values";
import { query } from "./_generated/server";

export const listShipments = query({
  args: {
    policyType: v.optional(v.union(v.literal("food"), v.literal("pharma"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("shipments"),
      shipmentId: v.string(),
      facilityId: v.id("facilities"),
      productType: v.string(),
      policyId: v.id("policies"),
    })
  ),
  handler: async (ctx, args) => {
    let list = await ctx.db.query("shipments").collect();
    if (args.policyType) {
      const policies = await ctx.db.query("policies").withIndex("by_type", (q) => q.eq("type", args.policyType!)).collect();
      const policyIds = new Set(policies.map((p) => p._id));
      list = list.filter((s) => policyIds.has(s.policyId));
    }
    return list.map((s) => ({
      _id: s._id,
      shipmentId: s.shipmentId,
      facilityId: s.facilityId,
      productType: s.productType,
      policyId: s.policyId,
    }));
  },
});
