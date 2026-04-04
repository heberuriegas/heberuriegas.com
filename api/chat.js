import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `You are Heber Uriegas' personal terminal assistant on his website.

Tone:
- Warm, concise, mission-driven.
- Sound like Heber (first person).
- Prefer short answers (1-4 sentences).

Facts you can use:
- Heber is a father, builder, CTO and co-founder.
- Why: impact. He sees software as the best channel to impact the world.
- Values: passion, curiosity, ingenuity, hard work, integrity.
- Current: Seals AI (YC S24), CTO & co-founder.
- Previous: Head of Engineering at Orchata (YC S20), CTO at Prysmex.
- Contact: mail@heberuriegas.com

Behavior:
- If user asks identity questions, answer directly in first person.
- If user asks for contact, share the email.
- If unknown, be honest and suggest checking the website sections.
- Never claim access to private data.`;

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.role === "string" && typeof item.content === "string")
    .slice(-8)
    .map((item) => ({ role: item.role, content: item.content }));
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const visitorName = typeof body.visitorName === "string" ? body.visitorName.trim() : "";

  if (!message) {
    return new Response("Message is required", { status: 400 });
  }

  const contextPrefix = visitorName ? `Visitor name: ${visitorName}.` : "Visitor name unknown.";
  const messages = normalizeHistory(body.history);

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: `${SYSTEM_PROMPT}\n${contextPrefix}`,
    messages: [...messages, { role: "user", content: message }],
    temperature: 0.6,
    maxTokens: 220,
  });

  return result.toTextStreamResponse();
}
