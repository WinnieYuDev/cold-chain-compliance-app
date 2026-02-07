/**
 * Shared types for policy rules and evaluation (used in Convex and lib).
 */

export type PolicyRules = {
  minTempC?: number;
  maxTempC?: number;
  maxDurationMinutes?: number;
  repeatedMinorCount?: number;
  frozenMaxTempC?: number; // for food frozen
};

export type Reading = {
  timestamp: number;
  temperature: number;
};

export type ViolationKind = "threshold_high" | "threshold_low" | "duration" | "repeated_minor";

export type Violation = {
  kind: ViolationKind;
  severity: "low" | "medium" | "high" | "critical";
  startTime: number;
  endTime: number;
  durationMinutes: number;
  ruleViolated: string;
  temperature?: number;
};
