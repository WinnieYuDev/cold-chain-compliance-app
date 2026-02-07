/**
 * Risk scoring: compute and persist risk for a shipment (called after excursion detection).
 */
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { computeRiskScore } from "./scoring";

/** Internal: compute risk from current excursions and upsert riskScores (latest per shipment) */
export const computeAndPersist = internalMutation({
  args: {
    shipmentId: v.id("shipments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const shipment = await ctx.db.get(args.shipmentId);
    if (!shipment) return null;

    const policy = await ctx.db.get(shipment.policyId);
    const policyType = (policy?.type ?? "food") as "food" | "pharma";

    const excursions = await ctx.db
      .query("excursions")
      .withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
      .collect();

    const result = computeRiskScore(
      excursions.map((e) => ({
        severity: e.severity,
        durationMinutes: e.durationMinutes,
        ruleViolated: e.ruleViolated,
      })),
      policyType
    );

    const now = Date.now();
    const existing = await ctx.db
      .query("riskScores")
      .withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
      .order("desc")
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        score: result.score,
        scoreValue: result.scoreValue,
        factors: result.factors,
        computedAt: now,
      });
    } else {
      await ctx.db.insert("riskScores", {
        shipmentId: args.shipmentId,
        score: result.score,
        scoreValue: result.scoreValue,
        factors: result.factors,
        computedAt: now,
      });
    }
    return null;
  },
});
