export const config = {
  runtime: "nodejs",
};

const MAX_FIELD_LENGTH = 1200;

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end(text);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function shortText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function extractProviderError(payloadText) {
  const raw = shortText(payloadText);
  if (!raw) {
    return "Unknown provider error";
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.message === "string" && parsed.message.trim()) {
      return shortText(parsed.message);
    }
    if (typeof parsed?.error === "string" && parsed.error.trim()) {
      return shortText(parsed.error);
    }
  } catch (_error) {
    // keep raw string fallback
  }

  return raw;
}

function cleanValue(value) {
  return String(value || "").trim().slice(0, MAX_FIELD_LENGTH);
}

function isValidEmail(email) {
  const normalized = cleanValue(email);
  if (!normalized) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function toHtmlList(answers) {
  return Object.entries(answers)
    .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
    .join("");
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

  const serviceType = cleanValue(body.serviceType);
  const subjectLabel = cleanValue(body.subjectLabel);
  const visitorName = cleanValue(body.visitorName) || "Unknown visitor";
  const visitorEmail = cleanValue(body.visitorEmail);
  const contextSummary = cleanValue(body.contextSummary);
  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  if (!serviceType || !subjectLabel) {
    sendJson(res, 400, { ok: false, error: "Missing service fields" });
    return;
  }

  if (visitorEmail && !isValidEmail(visitorEmail)) {
    sendJson(res, 400, { ok: false, error: "Invalid visitor email" });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    sendJson(res, 500, { ok: false, error: "Missing RESEND_API_KEY in environment." });
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "Heber Uriegas <mail@heberuriegas.com>";
  const to = process.env.CONTACT_TO_EMAIL || "mail@heberuriegas.com";
  const subject = `[${subjectLabel}] ${visitorName}`;

  const textBody = [
    `New website lead: ${serviceType}`,
    `Name: ${visitorName}`,
    `Email: ${visitorEmail || "Not provided"}`,
    "",
    "Captured details:",
    ...Object.entries(answers).map(([k, v]) => `- ${k}: ${cleanValue(v)}`),
    "",
    `Context summary: ${contextSummary || "n/a"}`,
  ].join("\n");

  const htmlBody = `
    <h2>New Website Lead: ${serviceType}</h2>
    <p><strong>Name:</strong> ${visitorName}</p>
    <p><strong>Email:</strong> ${visitorEmail || "Not provided"}</p>
    <h3>Captured details</h3>
    <ul>${toHtmlList(answers)}</ul>
    <p><strong>Context summary:</strong> ${contextSummary || "n/a"}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: textBody,
        html: htmlBody,
        reply_to: visitorEmail || undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error", errText);
      sendJson(res, 502, {
        ok: false,
        error: "Email provider rejected the request",
        providerError: extractProviderError(errText),
      });
      return;
    }

    const providerResult = await response.json().catch(() => ({}));
    sendJson(res, 200, {
      ok: true,
      message: "Email sent successfully",
      emailId: typeof providerResult?.id === "string" ? providerResult.id : "",
      serviceType,
    });
  } catch (error) {
    console.error("Contact route error", error);
    sendJson(res, 500, {
      ok: false,
      error: "Failed to send email",
      detail: shortText(error?.message || ""),
    });
  }
}
