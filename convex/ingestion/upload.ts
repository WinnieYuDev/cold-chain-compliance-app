"use node";

/**
 * Process uploaded file from storage: parse CSV/JSON, normalize, then call internal mutation to insert and trigger detection.
 */
import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { parseCSV, parseJSON } from "./parse";

export const processUpload = action({
  args: {
    storageId: v.id("_storage"),
    facilityId: v.id("facilities"),
    policyId: v.id("policies"),
    format: v.union(v.literal("csv"), v.literal("json")),
  },
  returns: v.object({
    success: v.boolean(),
    rowsProcessed: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) {
      return { success: false, rowsProcessed: 0, message: "File not found" };
    }
    const text = await blob.text();
    const source = args.format === "csv" ? "csv" : "api";
    const rows = args.format === "csv"
      ? parseCSV(text, source)
      : parseJSON(JSON.parse(text), source);

    if (rows.length === 0) {
      return { success: false, rowsProcessed: 0, message: "No valid rows parsed" };
    }

    await ctx.runMutation(internal.ingestion.mutations.ingestReadings, {
      rows: rows.map((r) => ({
        shipmentId: r.shipmentId,
        timestamp: r.timestamp,
        temperature: r.temperature,
        productType: r.productType,
        facilityId: r.facilityId,
        source: r.source,
      })),
      facilityId: args.facilityId,
      policyId: args.policyId,
    });

    return { success: true, rowsProcessed: rows.length };
  },
});
