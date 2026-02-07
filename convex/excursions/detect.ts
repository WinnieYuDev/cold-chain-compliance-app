/**
 * Excursion detection: after ingestion, evaluate policy and create
 * excursions + audit log entries. Idempotent by (shipmentId, startTime) window.
 */
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { evaluatePolicy } from "../policies/engine";
import type { Reading } from "../lib/types";

/** Run detection for a shipment after new readings are ingested */
export const runForShipment = internalMutation({
  args: {
    shipmentId: v.id("shipments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) return null;

    const policy = await ctx.db.get(shipment.policyId);
    if (!policy || !policy.active) return null;

    const readings = await ctx.db
      .query("temperatureReadings")
      .withIndex("by_shipment_id_and_timestamp", (q) => q.eq("shipmentId", args.shipmentId))
      .order("asc")
      .collect();

    const readingList: Reading[] = readings.map((r) => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
    }));
    const violations = evaluatePolicy(readingList, (policy.rules || {}) as { minTempC?: number; maxTempC?: number; maxDurationMinutes?: number; repeatedMinorCount?: number; frozenMaxTempC?: number }, policy.type);

    const now = Date.now();
    for (const v of violations) {
      // Idempotency: skip if we already have an excursion for this shipment + startTime
      const existing = await ctx.db
        .query("excursions")
        .withIndex("by_shipment_id_and_detected_at", (q) =>
          q.eq("shipmentId", args.shipmentId).gte("detectedAt", v.startTime - 60000).lte("detectedAt", v.startTime + 60000)
        )
        .first();
      if (existing) continue;

      const readingId = readings.find((r) => r.timestamp === v.startTime)?._id;
      await ctx.db.insert("excursions", {
        shipmentId: args.shipmentId,
        readingId,
        startTime: v.startTime,
        endTime: v.endTime,
        policyId: shipment.policyId,
        ruleViolated: v.ruleViolated,
        severity: v.severity,
        durationMinutes: v.durationMinutes,
        detectedAt: now,
      });

      const auditLogId = await ctx.runMutation(internal.audit.createAuditLog, {
        timestamp: now,
        shipmentId: args.shipmentId,
        facilityId: shipment.facilityId,
        eventType: "excursion_detected",
        ruleViolated: v.ruleViolated,
        severity: v.severity,
        correctiveAction: "Review and quarantine as per policy",
        details: { temperatureC: v.temperature, durationMinutes: v.durationMinutes, startTime: v.startTime, endTime: v.endTime },
      });
      const detailsSummary = `Temperature ${v.temperature ?? "N/A"}°C, duration ${v.durationMinutes} min`;
      await ctx.scheduler.runAfter(0, internal.ai.analysis.explainAuditLog, {
        auditLogId,
        eventType: "excursion_detected",
        ruleViolated: v.ruleViolated,
        severity: v.severity,
        detailsSummary,
      });
    }

    await ctx.scheduler.runAfter(0, internal.risk.mutations.computeAndPersist, {
      shipmentId: args.shipmentId,
    });
    return null;
  },
});
