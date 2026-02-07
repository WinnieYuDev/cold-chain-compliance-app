/**
 * Append-only audit log. All writes go through createAuditLog.
 * Optional patch for aiExplanation only.
 */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const severityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

/** Internal: append one audit log entry (immutable) */
export const createAuditLog = internalMutation({
  args: {
    timestamp: v.number(),
    shipmentId: v.optional(v.id("shipments")),
    facilityId: v.optional(v.id("facilities")),
    eventType: v.string(),
    ruleViolated: v.optional(v.string()),
    severity: v.optional(severityValidator),
    correctiveAction: v.optional(v.string()),
    details: v.optional(v.any()),
    aiExplanation: v.optional(v.string()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      timestamp: args.timestamp,
      shipmentId: args.shipmentId,
      facilityId: args.facilityId,
      eventType: args.eventType,
      ruleViolated: args.ruleViolated,
      severity: args.severity,
      correctiveAction: args.correctiveAction,
      details: args.details,
      aiExplanation: args.aiExplanation,
    });
  },
});

/** Patch aiExplanation only (for AI-generated explanation later) */
export const patchAuditExplanation = internalMutation({
  args: {
    auditLogId: v.id("auditLogs"),
    aiExplanation: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.auditLogId, { aiExplanation: args.aiExplanation });
    return null;
  },
});
