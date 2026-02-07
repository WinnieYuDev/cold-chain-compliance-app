/**
 * Risk scoring: compute Low/Medium/High from excursions; persist in riskScores.
 */

export type ExcursionForScoring = {
  severity: "low" | "medium" | "high" | "critical";
  durationMinutes: number;
  ruleViolated: string;
};

export type RiskResult = {
  score: "low" | "medium" | "high";
  scoreValue: number; // 0-100
  factors: string[];
};

/**
 * Pure function: compute risk from list of excursions (e.g. for one shipment).
 */
export function computeRiskScore(
  excursions: ExcursionForScoring[],
  policyType: "food" | "pharma"
): RiskResult {
  const factors: string[] = [];
  if (excursions.length === 0) {
    return { score: "low", scoreValue: 10, factors: [] };
  }

  const hasCritical = excursions.some((e) => e.severity === "critical");
  const hasHigh = excursions.some((e) => e.severity === "high");
  const hasMedium = excursions.some((e) => e.severity === "medium");
  const totalDuration = excursions.reduce((s, e) => s + e.durationMinutes, 0);
  const durationThreshold = policyType === "pharma" ? 15 : 30;
  const repeated = excursions.filter((e) => e.ruleViolated === "repeated_minor").length;

  if (totalDuration > durationThreshold * 2) factors.push("duration");
  if (repeated >= (policyType === "pharma" ? 2 : 3)) factors.push("repeated_violations");
  if (hasCritical) factors.push("critical_severity");
  if (hasHigh) factors.push("high_severity");
  if (excursions.length > 1) factors.push("multiple_excursions");

  let scoreValue = 15;
  if (hasCritical) scoreValue = Math.max(scoreValue, 85);
  if (hasHigh) scoreValue = Math.max(scoreValue, 65);
  if (hasMedium) scoreValue = Math.max(scoreValue, 45);
  if (totalDuration > durationThreshold) scoreValue = Math.min(100, scoreValue + 20);
  if (repeated > 0) scoreValue = Math.min(100, scoreValue + 15);
  scoreValue = Math.min(100, scoreValue + (excursions.length - 1) * 10);

  const score: "low" | "medium" | "high" =
    scoreValue >= 65 ? "high" : scoreValue >= 35 ? "medium" : "low";

  return { score, scoreValue, factors };
}
