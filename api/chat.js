import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";

export const config = {
  runtime: "nodejs",
};

const BASE_SYSTEM_PROMPT = `
You are the Heber's website.

Goal:
Your goal is provide concise and relevant information about Heber's background, values,
projects, and vision. You should also be able to answer questions about Heber's
experience, contact information, and how to navigate the website.

In the first message response you must tell people can do with you and what they can ask.

Tone:
- Warm, concise, mission-driven.
- Sound like Heber (first person).
- Prefer short answers (1-4 sentences).
- Always end with a complete sentence; do not cut responses mid-thought.

Facts you can use:
- Heber is a father, co-founder and cto.
- Why: impact. He sees software as the best channel to impact the world.
- Values: passion, curiosity, ingenuity, hard work, integrity.
- Current: Seals AI (YC S24), CTO & co-founder.
- Previous: Head of Engineering at Orchata (YC S20), CTO at Prysmex.
- Contact: mail@heberuriegas.com
- Website tools can collect service intake details and send them by email.

Behavior:
- If user asks identity questions, answer directly in first person.
- If user asks for contact, share the email.
- If user asks about services, explain the 3 tracks: consulting, coding services, and advice.
- For service leads, gather key intake details before sending them to email.
- If unknown, be honest and suggest checking the website sections.
- Never claim access to private data.
- Do not output reasoning traces, hidden thoughts, or tags like <think>...</think>.
- In this site context, if a user says "my" ambiguously, interpret it as Heber unless they explicitly provide their own identity.
- Do not say you lack access to Heber profile data; use the context provided here.
`;

const COMMAND_MAP = {
  about: "Opening /about -> mission and founder story.",
  experience: "Opening /experience -> Seals AI, Orchata, Prysmex.",
  values:
    "Opening /values -> passion, curiosity, ingenuity, hard work, integrity.",
  work: "Opening /work -> featured work and impact statements.",
  projects: "Opening /work -> featured work and impact statements.",
  future: "Opening /future -> roadmap and next initiatives.",
  contact: "Opening /contact -> reach me at mail@heberuriegas.com.",
  services:
    "I can collect contact details for: 1) consulting 2) coding services 3) advice. Type 1, 2, 3, or the service name.",
  help:
    "You can chat naturally. Optional commands: about, experience, values, work, side-projects, contact, services, consulting, coding, advice, cancel, clear",
  consulting:
    "Tell me you want consulting services and I will gather: name, company/team, challenge, timeline, and budget.",
  coding:
    "Tell me you want coding services and I will gather: name, project, stack, scope, and timeline.",
  advice:
    "Tell me you want advice and I will gather: name, topic, context, your key question, and urgency.",
  clear: "Terminal cleared.",
  cancel: "Current flow cancelled.",
};

const COMMAND_ALIASES = {
  servicios: "services",
  consultoria: "consulting",
  "consultoría": "consulting",
  asesoria: "advice",
  "asesoría": "advice",
  programacion: "coding",
  "programación": "coding",
  codigo: "coding",
};

const ALLOWED_TOPIC_KEYWORDS = [
  "heber",
  "seals",
  "orchata",
  "prysmex",
  "yc",
  "github",
  "linkedin",
  "x.com",
  "twitter",
  "email",
  "contact",
  "background",
  "experience",
  "projects",
  "project",
  "future",
  "values",
  "mission",
  "impact",
  "babymode",
  "klan",
  "website",
  "site",
  "portfolio",
  "about",
  "work",
  "role",
  "cto",
  "founder",
  "co-founder",
  "bio",
  "services",
  "servicios",
  "consulting",
  "consultoria",
  "consultoría",
  "coding",
  "programacion",
  "programación",
  "codigo",
  "advice",
  "asesoria",
  "asesoría",
  "mentor",
  "mentoring",
  "hire",
  "who are you",
  "whoami",
  "quien eres",
  "sobre ti",
  "correo",
  "contacto",
  "proyectos",
  "valores",
  "mision",
  "misión",
];

const SMALL_TALK_ALLOWED = [
  "hi",
  "hello",
  "hey",
  "hola",
  "buenas",
  "good morning",
  "good afternoon",
  "good evening",
  "thanks",
  "thank you",
  "gracias",
];

const MAX_INPUT_CHARS = 700;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions?/i,
  /reveal\s+(your|the)\s+(system|developer)\s+prompt/i,
  /show\s+(your|the)\s+(system|developer)\s+prompt/i,
  /act\s+as\s+(someone\s+else|a\s+different\s+assistant)/i,
  /jailbreak|bypass\s+(rules|guardrails|safety)/i,
  /developer\s+message|system\s+message/i,
];

const HARMFUL_REQUEST_PATTERNS = [
  /build\s+(a\s+)?bomb/i,
  /make\s+(a\s+)?weapon/i,
  /how\s+to\s+(hack|ddos|phish|steal)/i,
  /malware|ransomware|keylogger/i,
  /instructions?\s+to\s+(kill|hurt)/i,
  /self[-\s]?harm\s+instructions?/i,
];

const SERVICE_INTENT_PATTERNS = {
  consulting: [
    /\bconsult\w*/i,
    /\bconsultoria\b/i,
    /\bconsultoria\b/i,
    /\bconsultor\w*/i,
    /\bstrategy\b/i,
    /\bfractional\s+cto\b/i,
    /\basesoria\s+tecnica\b/i,
  ],
  coding: [
    /\bcoding\b/i,
    /\bprogram\w*/i,
    /\bdesarroll\w*/i,
    /\bbuild\b/i,
    /\bimplement\w*/i,
    /\bmvp\b/i,
    /\bapp\b/i,
    /\bwebsite\b/i,
    /\bsitio\s+web\b/i,
    /\bcodigo\b/i,
    /\bfrontend\b/i,
    /\bbackend\b/i,
  ],
  advice: [
    /\badvice\b/i,
    /\bguidance\b/i,
    /\bmentor\w*/i,
    /\bcoaching\b/i,
    /\bfeedback\b/i,
    /\brecommend\w*/i,
    /\brecomend\w*/i,
    /\bconsejo\w*/i,
    /\bque\s+opinas\b/i,
  ],
};

const SERVICE_TRIGGER_PATTERNS = [
  /\bservices?\b/i,
  /\bservicios?\b/i,
  /\bhire\b/i,
  /\bwork\s+with\s+you\b/i,
  /\btrabajar\s+contigo\b/i,
  /\bquiero\b/i,
  /\bnecesito\b/i,
  /\bbusco\b/i,
  /\blooking\s+for\b/i,
  /\bbabymode\b/i,
  /\bklan(\.gg)?\b/i,
  /\bseals\s+ai\b/i,
  /\borchata\b/i,
  /\bprysmex\b/i,
  /\bfacturabot(\.ai)?\b/i,
  /\basurela(\.com)?\b/i,
  /\bmobilecode(\.ai)?\b/i,
  /\bbetterpr(\.ai)?\b/i,
];

let cachedKey = "";
let cachedAgent = null;
let cachedPrompt = "";

const INLINE_PROFILE_CONTEXT_FALLBACK = `
Heber Uriegas Public Profile Context

- Name: Heber Uriegas
- Tagline: Father, co-founder and cto
- Mission: Use software as the best channel to create real-world impact
- Current company: Seals AI (YC S24)
- Previous roles: Head of Engineering at Orchata (YC S20), CTO at Prysmex
- Public links: GitHub https://github.com/heberuriegas, LinkedIn https://www.linkedin.com/in/huriegas/
- Contact: mail@heberuriegas.com
`;

const DEFAULT_CONTEXT_PATH = "/context/heber-profile.md";

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

function parseCommand(message) {
  const normalized = String(message || "")
    .trim()
    .toLowerCase()
    .replace(/^\.\//, "")
    .replace(/^\//, "");

  const aliasTarget = COMMAND_ALIASES[normalized];
  if (aliasTarget && COMMAND_MAP[aliasTarget]) {
    return aliasTarget;
  }

  if (COMMAND_MAP[normalized]) {
    return normalized;
  }

  return "";
}

function normalizeForGuardrails(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function shouldBlockAsUnrelated(message) {
  const normalized = normalizeForGuardrails(message);
  if (!normalized) {
    return false;
  }

  if (normalized.length <= 14 && SMALL_TALK_ALLOWED.some((k) => normalized.includes(k))) {
    return false;
  }

  if (ALLOWED_TOPIC_KEYWORDS.some((k) => normalized.includes(k))) {
    return false;
  }

  return true;
}

function unrelatedGuardrailMessage() {
  return "I can only help with topics related to Heber Uriegas and this website: background, experience, projects, values, mission, and contact. Try asking something about those topics.";
}

function detectServiceIntent(message) {
  const text = String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!text) {
    return { type: "", wantsService: false };
  }

  let bestType = "";
  let bestScore = 0;
  for (const [type, patterns] of Object.entries(SERVICE_INTENT_PATTERNS)) {
    const score = patterns.reduce((acc, pattern) => acc + (pattern.test(text) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  const wantsService = SERVICE_TRIGGER_PATTERNS.some((pattern) => pattern.test(text));
  if (bestScore > 0) {
    return { type: bestType, wantsService: true };
  }

  return { type: "", wantsService };
}

function checkInputGuardrails(message) {
  const text = String(message || "").trim();

  if (text.length > MAX_INPUT_CHARS) {
    return {
      blocked: true,
      response:
        "Your message is too long for this website assistant. Please keep it under 700 characters and focused on Heber, his projects, values, or contact.",
    };
  }

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      blocked: true,
      response:
        "I cannot follow instruction-override or prompt-reveal requests. I can help with Heber's background, projects, values, and contact.",
    };
  }

  if (HARMFUL_REQUEST_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      blocked: true,
      response:
        "I cannot help with harmful or unsafe requests. I can only assist with topics related to Heber and this website.",
    };
  }

  return { blocked: false, response: "" };
}

function sanitizeModelOutput(text) {
  const raw = String(text || "");
  const withoutThinkBlocks = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  return withoutThinkBlocks.trim();
}

function messageContentToText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function fallbackFromContext(userMessage) {
  const q = String(userMessage || "").toLowerCase();

  if (q.includes("github") || q.includes("current role") || q.includes("current") || q.includes("role")) {
    return "My GitHub profile is https://github.com/heberuriegas, and my current role is CTO and co-founder at Seals AI (YC S24).";
  }

  if (q.includes("linkedin")) {
    return "My LinkedIn profile is https://www.linkedin.com/in/huriegas/.";
  }

  if (q.includes("contact") || q.includes("email")) {
    return "You can reach me at mail@heberuriegas.com.";
  }

  return "I am Heber Uriegas: father, co-founder and cto at Seals AI (YC S24). You can ask me about my background, values, projects, and contact details.";
}

async function loadProfileContext(origin) {
  try {
    const dynamicContextUrl =
      process.env.CONTEXT_SOURCE_URL || `${origin}${DEFAULT_CONTEXT_PATH}`;

    const contextUrl = dynamicContextUrl.includes("?")
      ? `${dynamicContextUrl}&_ts=${Date.now()}`
      : `${dynamicContextUrl}?_ts=${Date.now()}`;

    const response = await fetch(contextUrl, {
      headers: { "cache-control": "no-cache" },
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim()) {
        return text.trim();
      }
    }
  } catch (_error) {
    // fallback below
  }

  return INLINE_PROFILE_CONTEXT_FALLBACK.trim();
}

function buildSystemPrompt(profileContext) {
  return `${BASE_SYSTEM_PROMPT}\n\nContext source (public profile data + confirmed facts):\n${profileContext}`;
}

function getAgent(apiKey, systemPrompt) {
  if (cachedAgent && cachedKey === apiKey && cachedPrompt === systemPrompt) {
    return cachedAgent;
  }

  const llm = new ChatGroq({
    apiKey,
    model: "qwen/qwen3-32b",
    temperature: 0.6,
    maxTokens: 520,
  });

  cachedAgent = createAgent({
    model: llm,
    tools: [],
    systemPrompt: systemPrompt,
  });
  cachedKey = apiKey;
  cachedPrompt = systemPrompt;
  return cachedAgent;
}

function normalizeContactContext(contactContext) {
  if (typeof contactContext !== "string") {
    return "";
  }

  const trimmed = contactContext.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.slice(0, 1200);
}

function buildMessages(systemPrompt, history, message, visitorName, contactContext) {
  const visitorContext = visitorName
    ? `Visitor name: ${visitorName}.`
    : "Visitor name unknown.";
  const serviceContext = contactContext
    ? `Captured service intake context: ${contactContext}`
    : "No captured service intake context yet.";

  const lcMessages = [new SystemMessage(`${systemPrompt}\n${visitorContext}\n${serviceContext}`)];

  for (const item of history) {
    if (item.role === "assistant") {
      lcMessages.push(new AIMessage(item.content));
    } else {
      lcMessages.push(new HumanMessage(item.content));
    }
  }

  lcMessages.push(new HumanMessage(message));
  return lcMessages;
}

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end(text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendText(res, 405, "Method not allowed");
    return;
  }

  const body = await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (_error) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const visitorName =
    typeof body.visitorName === "string" ? body.visitorName.trim() : "";
  const contactContext = normalizeContactContext(body.contactContext);

  if (!message) {
    sendText(res, 400, "Message is required");
    return;
  }

  const command = parseCommand(message);
  if (command) {
    sendText(res, 200, COMMAND_MAP[command]);
    return;
  }

  const inputGuardrail = checkInputGuardrails(message);
  if (inputGuardrail.blocked) {
    sendText(res, 200, inputGuardrail.response);
    return;
  }

  const serviceIntent = detectServiceIntent(message);
  if (serviceIntent.wantsService) {
    if (serviceIntent.type === "consulting") {
      sendText(
        res,
        200,
        "I can help with consulting requests. Type consulting (or services) and I will collect: name, email, company/team, challenge, timeline, and budget.",
      );
      return;
    }

    if (serviceIntent.type === "coding") {
      sendText(
        res,
        200,
        "I can help with coding service requests. Type coding (or services) and I will collect: name, email, project, stack, scope, and timeline.",
      );
      return;
    }

    if (serviceIntent.type === "advice") {
      sendText(
        res,
        200,
        "I can help with advice requests. Type advice (or services) and I will collect: name, email, topic, context, key question, and urgency.",
      );
      return;
    }

    sendText(
      res,
      200,
      "I can collect contact details for: 1) consulting 2) coding services 3) advice. Type services, consulting, coding, or advice.",
    );
    return;
  }

  if (shouldBlockAsUnrelated(message)) {
    sendText(res, 200, unrelatedGuardrailMessage());
    return;
  }

  const history = normalizeHistory(body.history);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    sendText(res, 500, "Missing GROQ_API_KEY in Vercel environment.");
    return;
  }

  try {
    const proto = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host || "localhost:4181";
    const origin = `${proto}://${host}`;
    const profileContext = await loadProfileContext(origin);
    const systemPrompt = buildSystemPrompt(profileContext);
    const agent = getAgent(apiKey, systemPrompt);
    const result = await agent.invoke({
      messages: buildMessages(
        systemPrompt,
        history,
        message,
        visitorName,
        contactContext,
      ),
    });

    const outputMessages = Array.isArray(result?.messages) ? result.messages : [];
    const lastMessage = outputMessages[outputMessages.length - 1];
    let text = sanitizeModelOutput(messageContentToText(lastMessage?.content));

    if (/i\s+don'?t\s+have\s+access|do\s+not\s+have\s+access|i'?m\s+sorry/i.test(text)) {
      text = fallbackFromContext(message);
    }

    sendText(res, 200, text || "I can help with your questions about Heber.");
    return;
  } catch (error) {
    console.error("Chat route error", error);
    const errMessage = String(error?.message || "").toLowerCase();
    if (
      errMessage.includes("quota") ||
      errMessage.includes("rate") ||
      errMessage.includes("resource_exhausted") ||
      errMessage.includes("429")
    ) {
      sendText(
        res,
        429,
        "Groq quota reached. Please try again later or check your plan limits.",
      );
      return;
    }

    sendText(res, 500, "AI is temporarily unavailable. Please try again.");
  }
}
