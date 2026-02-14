/**
 * Dashboard queries: KPIs, recent data for charts and tables.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";

export const kpis = query({
  args: {
    policyType: v.optional(v.union(v.literal("food"), v.literal("pharma"))),
  },
  returns: v.object({
    totalShipments: v.number(),
    openExcursions: v.number(),
    highRiskCount: v.number(),
    auditEventsToday: v.number(),
  }),
  handler: async (ctx, args) => {
    const shipments = await ctx.db.query("shipments").collect();
    let shipmentIds = shipments.map((s) => s._id);
    if (args.policyType) {
      const policies = await ctx.db.query("policies").withIndex("by_type", (q) => q.eq("type", args.policyType!)).collect();
      const policyIds = new Set(policies.map((p) => p._id));
      shipmentIds = shipments.filter((s) => policyIds.has(s.policyId)).map((s) => s._id);
    }

    const excursions = await ctx.db.query("excursions").collect();
    const openExcursions = excursions.filter((e) => shipmentIds.includes(e.shipmentId) && !e.resolvedAt).length;

    const riskScores = await ctx.db.query("riskScores").collect();
    const highRiskCount = riskScores.filter((r) => shipmentIds.includes(r.shipmentId) && r.score === "high").length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const auditLogs = await ctx.db.query("auditLogs").collect();
    const auditEventsToday = auditLogs.filter((a) => a.timestamp >= todayMs).length;

    return {
      totalShipments: shipmentIds.length,
      openExcursions,
      highRiskCount,
      auditEventsToday,
    };
  },
});

export const recentTemperatureReadings = query({
  args: {
    shipmentId: v.optional(v.id("shipments")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("temperatureReadings"),
      timestamp: v.number(),
      temperature: v.number(),
      shipmentId: v.id("shipments"),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.shipmentId) {
      const list = await ctx.db
        .query("temperatureReadings")
        .withIndex("by_shipment_id_and_timestamp", (q) => q.eq("shipmentId", args.shipmentId!))
        .order("desc")
        .take(limit);
      return list.map((r) => ({ _id: r._id, timestamp: r.timestamp, temperature: r.temperature, shipmentId: r.shipmentId }));
    }
    const all = await ctx.db.query("temperatureReadings").order("desc").take(limit * 3);
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, limit).map((r) => ({ _id: r._id, timestamp: r.timestamp, temperature: r.temperature, shipmentId: r.shipmentId }));
  },
});

export const recentExcursions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("excursions"),
      shipmentId: v.id("shipments"),
      ruleViolated: v.string(),
      severity: v.string(),
      durationMinutes: v.number(),
      detectedAt: v.number(),
      startTime: v.number(),
      endTime: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const list = await ctx.db.query("excursions").order("desc").take(limit);
    return list.map((e) => ({
      _id: e._id,
      shipmentId: e.shipmentId,
      ruleViolated: e.ruleViolated,
      severity: e.severity,
      durationMinutes: e.durationMinutes,
      detectedAt: e.detectedAt,
      startTime: e.startTime,
      endTime: e.endTime,
    }));
  },
});

export const recentAuditLogs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("auditLogs"),
      timestamp: v.number(),
      eventType: v.string(),
      ruleViolated: v.optional(v.string()),
      severity: v.optional(v.string()),
      aiExplanation: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    const list = await ctx.db.query("auditLogs").withIndex("by_timestamp").order("desc").take(limit);
    return list.map((a) => ({
      _id: a._id,
      timestamp: a.timestamp,
      eventType: a.eventType,
      ruleViolated: a.ruleViolated,
      severity: a.severity,
      aiExplanation: a.aiExplanation,
    }));
  },
});

export const aiInsightsList = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiInsights"),
      shipmentId: v.optional(v.id("shipments")),
      type: v.string(),
      content: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    let list = await ctx.db.query("aiInsights").order("desc").take(limit * 2);
    if (args.type) list = list.filter((i) => i.type === args.type);
    return list.slice(0, limit).map((i) => ({
      _id: i._id,
      shipmentId: i.shipmentId,
      type: i.type,
      content: i.content,
    }));
  },
});
