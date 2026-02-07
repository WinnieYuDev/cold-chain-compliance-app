/**
 * Mock API: generate sample readings and ingest (for demo without file upload).
 */
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const ingestMockData = action({
  args: {
    facilityId: v.id("facilities"),
    policyId: v.id("policies"),
    shipmentId: v.string(),
    productType: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    rowsProcessed: v.number(),
  }),
  handler: async (ctx, args) => {
    const count = Math.min(args.count ?? 24, 100);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const rows: Array<{
      shipmentId: string;
      timestamp: number;
      temperature: number;
      productType: string;
      source: string;
    }> = [];
    for (let i = 0; i < count; i++) {
      const ts = now - (count - i) * oneHour;
      const temp = 4 + Math.sin(i * 0.5) * 2 + (i === 5 ? 6 : 0); // one spike at i=5
      rows.push({
        shipmentId: args.shipmentId.toUpperCase(),
        timestamp: ts,
        temperature: temp,
        productType: args.productType,
        source: "api",
      });
    }
    await ctx.runMutation(internal.ingestion.mutations.ingestReadings, {
      rows,
      facilityId: args.facilityId,
      policyId: args.policyId,
    });
    return { success: true, rowsProcessed: rows.length };
  },
});
