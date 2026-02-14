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

const excursionReturn = v.object({
  _id: v.id("excursions"),
  shipmentId: v.id("shipments"),
  ruleViolated: v.string(),
  severity: v.string(),
  durationMinutes: v.number(),
  detectedAt: v.number(),
  startTime: v.number(),
  endTime: v.optional(v.number()),
});

const readingReturn = v.object({
  _id: v.id("temperatureReadings"),
  timestamp: v.number(),
  temperature: v.number(),
  shipmentId: v.id("shipments"),
});

const aiInsightReturn = v.object({
  _id: v.id("aiInsights"),
  shipmentId: v.optional(v.id("shipments")),
  type: v.string(),
  content: v.string(),
});

export const getShipmentDetail = query({
  args: { shipmentId: v.id("shipments") },
  returns: v.union(
    v.null(),
    v.object({
      shipment: v.object({
        _id: v.id("shipments"),
        shipmentId: v.string(),
        facilityId: v.id("facilities"),
        productType: v.string(),
        policyId: v.id("policies"),
      }),
      facilityName: v.string(),
      policyName: v.string(),
      policyType: v.union(v.literal("food"), v.literal("pharma")),
      readings: v.array(readingReturn),
      excursions: v.array(excursionReturn),
      riskScore: v.union(
        v.null(),
        v.object({
          score: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
          scoreValue: v.optional(v.number()),
          aiSummary: v.optional(v.string()),
          computedAt: v.number(),
        })
      ),
      aiInsights: v.array(aiInsightReturn),
    })
  ),
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) return null;

    const facility = await ctx.db.get(shipment.facilityId);
    const policy = await ctx.db.get(shipment.policyId);
    const facilityName = facility?.name ?? "—";
    const policyName = policy?.name ?? "—";
    const policyType = policy?.type ?? "food";

    const readings = await ctx.db
      .query("temperatureReadings")
      .withIndex("by_shipment_id_and_timestamp", (q) => q.eq("shipmentId", args.shipmentId))
      .order("desc")
      .take(200);

    const excursions = await ctx.db
      .query("excursions")
      .withIndex("by_shipment_id_and_detected_at", (q) => q.eq("shipmentId", args.shipmentId))
      .order("desc")
      .take(50);

    const riskRows = await ctx.db
      .query("riskScores")
      .withIndex("by_shipment_id_and_computed_at", (q) => q.eq("shipmentId", args.shipmentId))
      .order("desc")
      .take(1);
    const riskScore = riskRows[0]
      ? {
          score: riskRows[0].score,
          scoreValue: riskRows[0].scoreValue,
          aiSummary: riskRows[0].aiSummary,
          computedAt: riskRows[0].computedAt,
        }
      : null;

    const aiInsights = await ctx.db
      .query("aiInsights")
      .withIndex("by_shipment_id_and_type", (q) => q.eq("shipmentId", args.shipmentId))
      .collect();

    return {
      shipment: {
        _id: shipment._id,
        shipmentId: shipment.shipmentId,
        facilityId: shipment.facilityId,
        productType: shipment.productType,
        policyId: shipment.policyId,
      },
      facilityName,
      policyName,
      policyType,
      readings: readings.map((r) => ({
        _id: r._id,
        timestamp: r.timestamp,
        temperature: r.temperature,
        shipmentId: r.shipmentId,
      })),
      excursions: excursions.map((e) => ({
        _id: e._id,
        shipmentId: e.shipmentId,
        ruleViolated: e.ruleViolated,
        severity: e.severity,
        durationMinutes: e.durationMinutes,
        detectedAt: e.detectedAt,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      riskScore,
      aiInsights: aiInsights.map((i) => ({
        _id: i._id,
        shipmentId: i.shipmentId,
        type: i.type,
        content: i.content,
      })),
    };
  },
});
