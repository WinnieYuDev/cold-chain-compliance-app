/**
 * Policy engine: pure evaluation of temperature readings against policy rules.
 * No DB access; call from mutations/actions that have loaded readings and policy.
 * Food: HACCP/FSMA-style (cold 2-8°C or frozen <-18°C).
 * Pharma: GDP/GxP-style (2-8°C, stricter duration).
 */
import type { PolicyRules, Reading, Violation } from "../lib/types";

/** Default rules for food cold chain */
const DEFAULT_FOOD_RULES: Required<Pick<PolicyRules, "minTempC" | "maxTempC" | "maxDurationMinutes" | "repeatedMinorCount">> & { frozenMaxTempC?: number } = {
  minTempC: 2,
  maxTempC: 8,
  maxDurationMinutes: 30,
  repeatedMinorCount: 3,
  frozenMaxTempC: -18,
};

/** Default rules for pharma */
const DEFAULT_PHARMA_RULES: Required<Pick<PolicyRules, "minTempC" | "maxTempC" | "maxDurationMinutes" | "repeatedMinorCount">> = {
  minTempC: 2,
  maxTempC: 8,
  maxDurationMinutes: 15,
  repeatedMinorCount: 2,
};

function getRules(rules: PolicyRules, policyType: "food" | "pharma"): PolicyRules {
  const base = policyType === "food" ? { ...DEFAULT_FOOD_RULES, ...rules } : { ...DEFAULT_PHARMA_RULES, ...rules };
  return base;
}

/**
 * Evaluate a sorted (by timestamp) list of readings against policy rules.
 * Returns list of violations: threshold, duration, or repeated minor.
 */
export function evaluatePolicy(
  readings: Reading[],
  policyRules: PolicyRules,
  policyType: "food" | "pharma"
): Violation[] {
  const rules = getRules(policyRules, policyType);
  const minTemp = rules.minTempC ?? 2;
  const maxTemp = rules.maxTempC ?? 8;
  const maxDurationMin = rules.maxDurationMinutes ?? (policyType === "pharma" ? 15 : 30);
  const repeatedCount = rules.repeatedMinorCount ?? (policyType === "pharma" ? 2 : 3);
  const frozenMax = rules.frozenMaxTempC;

  const violations: Violation[] = [];
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);

  // Frozen product (food only): use frozenMaxTempC if provided and product is frozen
  const isFrozen = frozenMax != null && sorted.length > 0 && sorted[0].temperature < 0;
  const effectiveMax = isFrozen && frozenMax != null ? frozenMax : maxTemp;
  const effectiveMin = isFrozen && frozenMax != null ? undefined : minTemp;

  // 1) Threshold violations and duration
  let excursionStart: number | null = null;
  let excursionMaxSeverity: "low" | "medium" | "high" | "critical" = "low";
  let excursionPeakTemp: number | null = null;

  for (const r of sorted) {
    const overMax = r.temperature > effectiveMax;
    const underMin = effectiveMin != null && r.temperature < effectiveMin;
    const inViolation = overMax || underMin;

    if (inViolation) {
      if (excursionStart === null) {
        excursionStart = r.timestamp;
        excursionPeakTemp = r.temperature;
        excursionMaxSeverity = severityFromTemp(r.temperature, effectiveMin, effectiveMax, policyType);
      } else {
        excursionPeakTemp = excursionPeakTemp != null ? (overMax ? Math.max(excursionPeakTemp, r.temperature) : Math.min(excursionPeakTemp, r.temperature)) : r.temperature;
        const s = severityFromTemp(r.temperature, effectiveMin, effectiveMax, policyType);
        if (severityRank(s) > severityRank(excursionMaxSeverity)) excursionMaxSeverity = s;
      }
    } else {
      if (excursionStart !== null) {
        const endTime = r.timestamp;
        const durationMinutes = (endTime - excursionStart) / (60 * 1000);
        const wasHigh = (excursionPeakTemp ?? 0) > effectiveMax;
        const ruleViolated = durationMinutes > maxDurationMin ? "duration" : wasHigh ? "threshold_high" : "threshold_low";
        const severity = durationMinutes > maxDurationMin ? (policyType === "pharma" ? "high" : "medium") : excursionMaxSeverity;
        violations.push({
          kind: ruleViolated === "duration" ? "duration" : wasHigh ? "threshold_high" : "threshold_low",
          severity,
          startTime: excursionStart,
          endTime,
          durationMinutes,
          ruleViolated,
          temperature: excursionPeakTemp ?? undefined,
        });
        excursionStart = null;
        excursionPeakTemp = null;
      }
    }
  }
  if (excursionStart !== null && sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    const durationMinutes = (last.timestamp - excursionStart) / (60 * 1000);
    const overMax = (excursionPeakTemp ?? 0) > effectiveMax;
    violations.push({
      kind: durationMinutes > maxDurationMin ? "duration" : overMax ? "threshold_high" : "threshold_low",
      severity: durationMinutes > maxDurationMin ? (policyType === "pharma" ? "high" : "medium") : excursionMaxSeverity,
      startTime: excursionStart,
      endTime: last.timestamp,
      durationMinutes,
      ruleViolated: durationMinutes > maxDurationMin ? "duration" : overMax ? "threshold_high" : "threshold_low",
      temperature: excursionPeakTemp ?? undefined,
    });
  }

  // 2) Repeated minor violations (short spikes)
  const minorSpikes: Array<{ start: number; end: number }> = [];
  let spikeStart: number | null = null;
  const spikeMaxMin = 5; // consider spike if under 5 min
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const overMax = r.temperature > effectiveMax;
    const underMin = effectiveMin != null && r.temperature < effectiveMin;
    if (overMax || underMin) {
      if (spikeStart === null) spikeStart = r.timestamp;
    } else {
      if (spikeStart !== null) {
        const durationMin = (r.timestamp - spikeStart) / (60 * 1000);
        if (durationMin <= spikeMaxMin) minorSpikes.push({ start: spikeStart, end: r.timestamp });
        spikeStart = null;
      }
    }
  }
  if (minorSpikes.length >= repeatedCount) {
    const first = minorSpikes[0];
    const last = minorSpikes[minorSpikes.length - 1];
    violations.push({
      kind: "repeated_minor",
      severity: policyType === "pharma" ? "medium" : "low",
      startTime: first.start,
      endTime: last.end,
      durationMinutes: (last.end - first.start) / (60 * 1000),
      ruleViolated: "repeated_minor",
    });
  }

  return violations;
}

function severityFromTemp(
  temp: number,
  min: number | undefined,
  max: number,
  _policyType: "food" | "pharma"
): "low" | "medium" | "high" | "critical" {
  if (temp > max) {
    if (temp - max >= 5) return "critical";
    if (temp - max >= 3) return "high";
    return "medium";
  }
  if (min != null && temp < min) {
    if (min - temp >= 5) return "critical";
    if (min - temp >= 2) return "high";
    return "medium";
  }
  return "low";
}

function severityRank(s: "low" | "medium" | "high" | "critical"): number {
  switch (s) {
    case "low": return 0;
    case "medium": return 1;
    case "high": return 2;
    case "critical": return 3;
  }
}
