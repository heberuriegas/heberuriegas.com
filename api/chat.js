import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Heber's website.

Goal:
Your goal is provide concise and relevant information about Heber's background, values,
projects, and vision. You should also be able to answer questions about Heber's
experience, contact information, and how to navigate the website.

In the first message response you must tell people can do with you and what they can ask. For example,
you can say "Hi, I'm Heber's website! You can ask me about Heber's background, values,
projects, vision, or contact information. You can also ask for help to see available commands.

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
- Never claim access to private data.
`;

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        typeof item.role === "string" &&
        typeof item.content === "string",
    )
    .slice(-8)
    .map((item) => ({ role: item.role, content: item.content }));
}

const COMMAND_MAP = {
  about: "Opening /about -> mission and founder story.",
  experience: "Opening /experience -> Seals AI, Orchata, Prysmex.",
  values:
    "Opening /values -> passion, curiosity, ingenuity, hard work, integrity.",
  projects: "Opening /projects -> featured work and impact statements.",
  future: "Opening /future -> roadmap and next initiatives.",
  contact: "Opening /contact -> reach me at mail@heberuriegas.com.",
  help: "You can chat naturally. Optional commands: about, experience, values, projects, future, contact, clear",
  clear: "Terminal cleared.",
};

function parseCommand(message) {
  const normalized = String(message || "")
    .trim()
    .toLowerCase()
    .replace(/^\.\//, "")
    .replace(/^\//, "");

  if (COMMAND_MAP[normalized]) {
    return normalized;
  }

  return "";
}

const AgentState = Annotation.Root({
  message: Annotation(),
  history: Annotation(),
  visitorName: Annotation(),
  apiKey: Annotation(),
  intent: Annotation({ default: () => "chat" }),
  command: Annotation({ default: () => "" }),
  response: Annotation({ default: () => "" }),
});

const agentGraph = new StateGraph(AgentState)
  .addNode("classify_intent", async (state) => {
    const command = parseCommand(state.message);
    if (command) {
      return { intent: "command", command };
    }
    return { intent: "chat", command: "" };
  })
  .addNode("command_agent", async (state) => {
    return {
      response:
        COMMAND_MAP[state.command] || "Type help to see available commands.",
    };
  })
  .addNode("chat_agent", async (state) => {
    const contextPrefix = state.visitorName
      ? `Visitor name: ${state.visitorName}.`
      : "Visitor name unknown.";

    const groq = createOpenAI({
      apiKey: state.apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const result = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: `${SYSTEM_PROMPT}\n${contextPrefix}`,
      messages: [...state.history, { role: "user", content: state.message }],
      temperature: 0.6,
      maxTokens: 220,
    });

    return { response: result.text ?? "" };
  })
  .addEdge(START, "classify_intent")
  .addConditionalEdges("classify_intent", (state) => {
    if (state.intent === "command") {
      return "command_agent";
    }
    return "chat_agent";
  })
  .addEdge("command_agent", END)
  .addEdge("chat_agent", END)
  .compile();

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const visitorName =
    typeof body.visitorName === "string" ? body.visitorName.trim() : "";

  if (!message) {
    return new Response("Message is required", { status: 400 });
  }

  const messages = normalizeHistory(body.history);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response("Missing GROQ_API_KEY in Vercel environment.", {
      status: 500,
    });
  }

  try {
    const result = await agentGraph.invoke({
      message,
      history: messages,
      visitorName,
      apiKey,
    });

    return new Response(result.response ?? "", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat route error", error);
    const message = String(error?.message || "").toLowerCase();
    if (
      message.includes("quota") ||
      message.includes("resource_exhausted") ||
      message.includes("429")
    ) {
      return new Response(
        "Groq quota reached. Please try again later or check your plan limits.",
        { status: 429 },
      );
    }

    return new Response("AI is temporarily unavailable. Please try again.", {
      status: 500,
    });
  }
}
