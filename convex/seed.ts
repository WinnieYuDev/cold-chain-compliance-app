/**
 * Seed: facilities, policies, users, shipments, temperature readings,
 * sample excursions and audit logs for demo.
 */
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const run = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Facilities
    const facilityA = await ctx.db.insert("facilities", {
      name: "North Region Warehouse",
      region: "North",
      type: "warehouse",
    });
    const facilityB = await ctx.db.insert("facilities", {
      name: "Central Distribution",
      region: "Central",
      type: "warehouse",
    });
    const facilityC = await ctx.db.insert("facilities", {
      name: "Pharma Cold Transport",
      region: "East",
      type: "transport",
    });

    // Policies: Food (HACCP/FSMA-style) and Pharma (GDP/GxP-style)
    const foodPolicyId = await ctx.db.insert("policies", {
      name: "Food Cold Chain (HACCP/FSMA)",
      type: "food",
      rules: {
        minTempC: 2,
        maxTempC: 8,
        maxDurationMinutes: 30,
        repeatedMinorCount: 3,
        frozenMaxTempC: -18,
      },
      active: true,
      updatedAt: now,
    });
    const pharmaPolicyId = await ctx.db.insert("policies", {
      name: "Pharma GDP/GxP 2-8°C",
      type: "pharma",
      rules: {
        minTempC: 2,
        maxTempC: 8,
        maxDurationMinutes: 15,
        repeatedMinorCount: 2,
      },
      active: true,
      updatedAt: now,
    });

    // Company for demo users
    const demoCompanyId = await ctx.db.insert("companies", {
      name: "Demo Company",
      slug: "demo-company",
      createdAt: now,
    });

    // Demo users (one per role) linked to demo company.
    // To sign in, use Register to create a new company and admin, or add auth accounts separately.
    await ctx.db.insert("users", {
      email: "admin@coldchain.demo",
      name: "Admin User",
      role: "admin",
      companyId: demoCompanyId,
    });
    await ctx.db.insert("users", {
      email: "supervisor@coldchain.demo",
      name: "Supervisor User",
      role: "supervisor",
      companyId: demoCompanyId,
    });
    await ctx.db.insert("users", {
      email: "viewer@coldchain.demo",
      name: "Viewer User",
      role: "viewer",
      companyId: demoCompanyId,
    });

    // Shipments: 2 food, 2 pharma
    const shipment1 = await ctx.db.insert("shipments", {
      shipmentId: "FOOD-001",
      facilityId: facilityA,
      productType: "dairy",
      policyId: foodPolicyId,
      metadata: { origin: "Farm A", destination: "Retail B" },
    });
    const shipment2 = await ctx.db.insert("shipments", {
      shipmentId: "FOOD-002",
      facilityId: facilityB,
      productType: "frozen",
      policyId: foodPolicyId,
      metadata: { origin: "Plant X" },
    });
    const shipment3 = await ctx.db.insert("shipments", {
      shipmentId: "PHARMA-001",
      facilityId: facilityC,
      productType: "vaccine",
      policyId: pharmaPolicyId,
      metadata: { batch: "VX-2024-001" },
    });
    const shipment4 = await ctx.db.insert("shipments", {
      shipmentId: "PHARMA-002",
      facilityId: facilityC,
      productType: "biologic",
      policyId: pharmaPolicyId,
    });

    // Temperature readings: in-range and some excursions
    const baseTime = now - 2 * oneDayMs;
    for (let i = 0; i < 48; i++) {
      const ts = baseTime + i * 60 * 60 * 1000;
      await ctx.db.insert("temperatureReadings", {
        shipmentId: shipment1,
        timestamp: ts,
        temperature: 4 + (i % 3),
        source: "csv",
      });
    }
    // One excursion for shipment1: spike at index 24
    await ctx.db.insert("temperatureReadings", {
      shipmentId: shipment1,
      timestamp: baseTime + 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      temperature: 12,
      source: "csv",
    });

    for (let i = 0; i < 24; i++) {
      await ctx.db.insert("temperatureReadings", {
        shipmentId: shipment3,
        timestamp: baseTime + i * 60 * 60 * 1000,
        temperature: 5,
        source: "api",
      });
    }
    // Excursion for pharma: out of range
    await ctx.db.insert("temperatureReadings", {
      shipmentId: shipment3,
      timestamp: baseTime + 12 * 60 * 60 * 1000,
      temperature: 1,
      source: "api",
    });

    for (let i = 0; i < 12; i++) {
      await ctx.db.insert("temperatureReadings", {
        shipmentId: shipment2,
        timestamp: baseTime + i * 2 * 60 * 60 * 1000,
        temperature: -20,
        source: "csv",
      });
    }

    for (let i = 0; i < 20; i++) {
      await ctx.db.insert("temperatureReadings", {
        shipmentId: shipment4,
        timestamp: baseTime + i * 60 * 60 * 1000,
        temperature: 6,
        source: "api",
      });
    }

    // Sample excursions
    const readingExcursion = await ctx.db
      .query("temperatureReadings")
      .withIndex("by_shipment_id_and_timestamp", (q) =>
        q.eq("shipmentId", shipment1).eq("timestamp", baseTime + 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      )
      .first();
    if (readingExcursion) {
      await ctx.db.insert("excursions", {
        shipmentId: shipment1,
        readingId: readingExcursion._id,
        startTime: readingExcursion.timestamp,
        endTime: readingExcursion.timestamp + 15 * 60 * 1000,
        policyId: foodPolicyId,
        ruleViolated: "threshold_high",
        severity: "medium",
        durationMinutes: 15,
        detectedAt: now - oneDayMs,
      });
    }
    await ctx.db.insert("excursions", {
      shipmentId: shipment3,
      startTime: baseTime + 12 * 60 * 60 * 1000,
      endTime: baseTime + 12 * 60 * 60 * 1000 + 20 * 60 * 1000,
      policyId: pharmaPolicyId,
      ruleViolated: "threshold_low",
      severity: "high",
      durationMinutes: 20,
      detectedAt: now - oneDayMs,
    });

    // Risk scores
    await ctx.db.insert("riskScores", {
      shipmentId: shipment1,
      score: "medium",
      scoreValue: 55,
      factors: ["duration", "single_excursion"],
      computedAt: now,
      aiSummary: "Single temperature spike detected; recommend review of handling at checkpoint.",
    });
    await ctx.db.insert("riskScores", {
      shipmentId: shipment3,
      score: "high",
      scoreValue: 78,
      factors: ["duration", "pharma_critical_range"],
      computedAt: now,
      aiSummary: "Sub-2°C excursion in vaccine shipment; potency impact assessment recommended.",
    });
    await ctx.db.insert("riskScores", {
      shipmentId: shipment2,
      score: "low",
      scoreValue: 10,
      factors: [],
      computedAt: now,
    });
    await ctx.db.insert("riskScores", {
      shipmentId: shipment4,
      score: "low",
      scoreValue: 15,
      factors: [],
      computedAt: now,
    });

    // Audit logs (append-only)
    await ctx.db.insert("auditLogs", {
      timestamp: now - oneDayMs,
      shipmentId: shipment1,
      facilityId: facilityA,
      eventType: "excursion_detected",
      ruleViolated: "threshold_high",
      severity: "medium",
      correctiveAction: "Quarantine batch; QA review",
      details: { temperatureC: 12, durationMinutes: 15 },
      aiExplanation: "Temperature exceeded 8°C for 15 minutes. Per HACCP, product should be quarantined and assessed for spoilage risk.",
    });
    await ctx.db.insert("auditLogs", {
      timestamp: now - oneDayMs,
      shipmentId: shipment3,
      facilityId: facilityC,
      eventType: "excursion_detected",
      ruleViolated: "threshold_low",
      severity: "high",
      correctiveAction: "Hold shipment; stability review",
      details: { temperatureC: 1, durationMinutes: 20 },
      aiExplanation: "Temperature fell below 2°C. Per GDP, potency and stability must be evaluated before release.",
    });
    await ctx.db.insert("auditLogs", {
      timestamp: now - 2 * 60 * 60 * 1000,
      facilityId: facilityA,
      eventType: "data_ingestion",
      details: { source: "csv", records: 49 },
    });

    // AI insights (dashboard cards)
    await ctx.db.insert("aiInsights", {
      shipmentId: shipment1,
      type: "excursion_analysis",
      content: "Single 15-min spike to 12°C. Risk of spoilage is moderate; recommend QA hold and sampling before release.",
    });
    await ctx.db.insert("aiInsights", {
      shipmentId: shipment3,
      type: "excursion_analysis",
      content: "Vaccine shipment experienced sub-2°C for 20 minutes. Regulatory guidance suggests potency testing before distribution.",
    });
    await ctx.db.insert("aiInsights", {
      type: "policy_recommendation",
      content: "Consider tightening max duration for pharma cold chain from 15 to 10 minutes based on recent excursion frequency.",
    });

    return null;
  },
});
