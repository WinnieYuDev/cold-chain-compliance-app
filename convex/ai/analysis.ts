"use node";

/**
 * AI analysis via OpenAI: excursion explanation, audit log explanation, policy recommendation.
 * Uses OPENAI_API_KEY in Convex env. Outputs are concise and regulator-friendly.
 */
import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const OPENAI_MODEL = "gpt-4o-mini";

async function chatCompletion(
  apiKey: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  return content;
}

/**
 * Generate regulator-friendly excursion analysis and store in aiInsights.
 */
export const analyzeExcursion = internalAction({
  args: {
    shipmentId: v.id("shipments"),
    excursionSummary: v.string(),
    ruleViolated: v.string(),
    severity: v.string(),
    temperatureC: v.optional(v.number()),
    durationMinutes: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return "AI analysis unavailable (no API key).";

    const systemPrompt = `You are a cold chain compliance analyst. Write a single short paragraph (2-3 sentences) that:
1. Explains the excursion in plain language suitable for regulators (HACCP/FSMA or GDP/GxP).
2. States the recommended corrective action.
Keep the tone professional and factual. No bullet points.`;
    const userContent = `Excursion: ${args.excursionSummary}. Rule violated: ${args.ruleViolated}. Severity: ${args.severity}.${args.temperatureC != null ? ` Temperature: ${args.temperatureC}°C.` : ""} Duration: ${args.durationMinutes} minutes. Provide analysis and corrective action.`;

    const content = await chatCompletion(apiKey, systemPrompt, userContent);
    await ctx.runMutation(internal.ai.storage.storeInsight, {
      shipmentId: args.shipmentId,
      type: "excursion_analysis",
      content,
    });
    return content;
  },
});

/**
 * Generate audit-log explanation for an existing log entry (patch aiExplanation).
 */
export const explainAuditLog = internalAction({
  args: {
    auditLogId: v.id("auditLogs"),
    eventType: v.string(),
    ruleViolated: v.optional(v.string()),
    severity: v.optional(v.string()),
    detailsSummary: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const systemPrompt = `You are a compliance auditor. In one sentence, write a regulator-friendly explanation for this audit event. Be factual and concise.`;
    const userContent = `Event: ${args.eventType}.${args.ruleViolated ? ` Rule: ${args.ruleViolated}.` : ""}${args.severity ? ` Severity: ${args.severity}.` : ""} Details: ${args.detailsSummary}.`;

    const explanation = await chatCompletion(apiKey, systemPrompt, userContent);
    await ctx.runMutation(internal.audit.patchAuditExplanation, {
      auditLogId: args.auditLogId,
      aiExplanation: explanation,
    });
    return null;
  },
});

/**
 * Policy recommendation from recent excursion patterns; store in aiInsights (global).
 */
export const recommendPolicy = action({
  args: {
    recentExcursionSummary: v.string(),
    policyType: v.union(v.literal("food"), v.literal("pharma")),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return "Policy recommendation unavailable (no API key).";

    const systemPrompt = `You are a cold chain policy expert. Based on the described excursion pattern, suggest one concrete policy tweak (e.g. tighten duration limit or threshold). Write 1-2 sentences only. Reference ${args.policyType === "pharma" ? "GDP/GxP" : "HACCP/FSMA"} where relevant.`;
    const content = await chatCompletion(apiKey, systemPrompt, args.recentExcursionSummary);
    await ctx.runMutation(internal.ai.storage.storeInsight, {
      type: "policy_recommendation",
      content,
    });
    return content;
  },
});
