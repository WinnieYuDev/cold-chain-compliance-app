/**
 * Cold Chain Compliance Monitor — Convex schema
 * Single source of truth for facilities, policies, shipments, readings,
 * excursions, risk scores, audit logs, and AI insights.
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /** Users with role and optional facility scope (for RBAC) */
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("supervisor"),
      v.literal("viewer")
    ),
    facilityIds: v.optional(v.array(v.id("facilities"))),
  }).index("by_email", ["email"]),

  /** Facilities (warehouse, transport, etc.) */
  facilities: defineTable({
    name: v.string(),
    region: v.string(),
    type: v.string(), // e.g. "warehouse", "transport"
  }).index("by_region", ["region"]),

  /** Central policy config: Food or Pharma, with rules JSON */
  policies: defineTable({
    name: v.string(),
    type: v.union(v.literal("food"), v.literal("pharma")),
    rules: v.any(), // JSON: minTemp, maxTemp, maxDurationMinutes, repeatedViolationCount, etc.
    active: v.boolean(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_type_and_active", ["type", "active"]),

  /** Shipments linked to facility and policy */
  shipments: defineTable({
    shipmentId: v.string(), // normalized external id
    facilityId: v.id("facilities"),
    productType: v.string(),
    policyId: v.id("policies"),
    metadata: v.optional(v.any()),
  })
    .index("by_shipment_id", ["shipmentId"])
    .index("by_facility", ["facilityId"])
    .index("by_policy", ["policyId"]),

  /** Temperature readings — single source of truth */
  temperatureReadings: defineTable({
    shipmentId: v.id("shipments"),
    timestamp: v.number(), // normalized ms
    temperature: v.number(),
    source: v.string(), // "csv" | "api" | "manual"
    rawPayload: v.optional(v.any()),
  })
    .index("by_shipment_id", ["shipmentId"])
    .index("by_shipment_id_and_timestamp", ["shipmentId", "timestamp"]),

  /** Excursions: threshold, duration, or repeated violations */
  excursions: defineTable({
    shipmentId: v.id("shipments"),
    readingId: v.optional(v.id("temperatureReadings")),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    policyId: v.id("policies"),
    ruleViolated: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    durationMinutes: v.number(),
    detectedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_shipment_id", ["shipmentId"])
    .index("by_shipment_id_and_detected_at", ["shipmentId", "detectedAt"])
    .index("by_facility_via_shipment", ["detectedAt"]),

  /** Risk scores per shipment */
  riskScores: defineTable({
    shipmentId: v.id("shipments"),
    score: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    scoreValue: v.optional(v.number()), // 0-100 if desired
    factors: v.any(), // JSON: e.g. ["duration", "repeated_violations"]
    computedAt: v.number(),
    aiSummary: v.optional(v.string()),
  })
    .index("by_shipment_id", ["shipmentId"])
    .index("by_shipment_id_and_computed_at", ["shipmentId", "computedAt"]),

  /** Append-only audit logs */
  auditLogs: defineTable({
    timestamp: v.number(),
    shipmentId: v.optional(v.id("shipments")),
    facilityId: v.optional(v.id("facilities")),
    eventType: v.string(),
    ruleViolated: v.optional(v.string()),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    correctiveAction: v.optional(v.string()),
    details: v.optional(v.any()),
    aiExplanation: v.optional(v.string()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_facility_id_and_timestamp", ["facilityId", "timestamp"])
    .index("by_shipment_id_and_timestamp", ["shipmentId", "timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"]),

  /** AI-generated insights (excursion analysis, policy recommendation) */
  aiInsights: defineTable({
    shipmentId: v.optional(v.id("shipments")),
    type: v.string(), // "excursion_analysis" | "policy_recommendation" | "audit_explanation"
    content: v.string(),
  }).index("by_shipment_id_and_type", ["shipmentId", "type"]),
});
