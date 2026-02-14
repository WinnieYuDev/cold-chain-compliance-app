/**
 * Ingestion: generate upload URL; internal mutation to insert normalized readings and trigger detection.
 */
import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

const normalizedRowValidator = v.object({
  shipmentId: v.string(),
  timestamp: v.number(),
  temperature: v.number(),
  productType: v.string(),
  facilityId: v.optional(v.string()),
  source: v.string(),
});

/** Public: get upload URL for client to upload CSV/JSON */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Internal: insert normalized readings, create shipments if needed, run excursion detection */
export const ingestReadings = internalMutation({
  args: {
    rows: v.array(normalizedRowValidator),
    facilityId: v.id("facilities"),
    policyId: v.id("policies"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.rows.length === 0) return null;

    const shipmentIdToDocId: Record<string, Id<"shipments">> = {};
    const byShipment = new Map<string, typeof args.rows>();
    for (const row of args.rows) {
      const key = row.shipmentId;
      if (!shipmentIdToDocId[key]) {
        const existing = await ctx.db
          .query("shipments")
          .withIndex("by_shipment_id", (q) => q.eq("shipmentId", key))
          .first();
        if (existing) {
          shipmentIdToDocId[key] = existing._id;
        } else {
          const id = await ctx.db.insert("shipments", {
            shipmentId: key,
            facilityId: args.facilityId,
            productType: row.productType,
            policyId: args.policyId,
          });
          shipmentIdToDocId[key] = id;
        }
      }
      if (!byShipment.has(key)) byShipment.set(key, []);
      byShipment.get(key)!.push(row);
    }

    const docIdsToDetect: Id<"shipments">[] = [];
    for (const [shipmentIdKey, rows] of Array.from(byShipment.entries())) {
      const shipDocId = shipmentIdToDocId[shipmentIdKey]!;
      for (const row of rows) {
        await ctx.db.insert("temperatureReadings", {
          shipmentId: shipDocId,
          timestamp: row.timestamp,
          temperature: row.temperature,
          source: row.source,
        });
      }
      docIdsToDetect.push(shipDocId);
    }

    for (const sid of docIdsToDetect) {
      await ctx.scheduler.runAfter(0, internal.excursions.detect.runForShipment, { shipmentId: sid });
    }
    return null;
  },
});
