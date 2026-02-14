"use node";

/**
 * AI chatbox assistant for the About page: cold-chain Q&A using OpenAI.
 * Uses OPENAI_API_KEY in Convex env.
 */
import { v } from "convex/values";
import { action } from "../_generated/server";

const OPENAI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a helpful cold chain compliance assistant for ThermoGuard. You answer questions about:
- Cold chain monitoring for food (HACCP/FSMA) and pharmaceuticals (GDP/GxP)
- Temperature excursions, compliance, and audit trails
- Best practices for shipping temperature-sensitive goods

Keep answers concise (2-4 sentences unless the user asks for detail). Be professional and factual. If you don't know something, say so.`;

export const sendMessage = action({
  args: {
    message: v.string(),
    history: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        })
      )
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return "AI assistant is not configured (missing API key). Please contact support.";
    }

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    if (args.history && args.history.length > 0) {
      const recent = args.history.slice(-10);
      for (const m of recent) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: "user", content: args.message });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: 400,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return `Sorry, I couldn't process that. (Error: ${res.status})`;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "No response.";
    return content;
  },
});
