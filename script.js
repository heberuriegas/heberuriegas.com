const yearEl = document.getElementById("year");
const pageBg = document.querySelector(".page-bg");
const BG_THEME_INDEX_KEY = "heber-bg-theme-index";

if (pageBg) {
  const backgroundThemes = [
    {
      id: "forest",
      image:
        "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2200&q=80",
    },
    {
      id: "mountains",
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=80",
    },
    {
      id: "beach",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=80",
    },
    {
      id: "trekking",
      image:
        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2200&q=80",
    },
    {
      id: "american-football",
      image: "./nfl-game-bg.jpg",
    },
    {
      id: "rock-concert",
      image:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=2200&q=80",
    },
    {
      id: "earth-from-space",
      image:
        "https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg",
    },
  ];

  function applyBackgroundTheme(theme) {
    pageBg.style.setProperty("--bg-image", `url("${theme.image}")`);
    pageBg.setAttribute("data-theme", theme.id);
  }

  function getStoredThemeIndex() {
    try {
      const raw = window.localStorage.getItem(BG_THEME_INDEX_KEY);
      const value = Number(raw);
      if (Number.isInteger(value) && value >= 0) {
        return value % backgroundThemes.length;
      }
    } catch (_error) {
      // ignore storage errors (private mode, blocked storage, etc.)
    }
    return -1;
  }

  function storeThemeIndex(index) {
    try {
      window.localStorage.setItem(BG_THEME_INDEX_KEY, String(index));
    } catch (_error) {
      // ignore storage errors
    }
  }

  function rotateBackgroundTheme() {
    const currentIndex = getStoredThemeIndex();
    const nextIndex = (currentIndex + 1) % backgroundThemes.length;
    const selectedTheme = backgroundThemes[nextIndex];
    applyBackgroundTheme(selectedTheme);
    storeThemeIndex(nextIndex);
  }

  rotateBackgroundTheme();

  window.rotateBackgroundTheme = rotateBackgroundTheme;
}

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  reveals.forEach((el) => observer.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in-view"));
}

const intro = document.getElementById("intro");
if (intro && "IntersectionObserver" in window) {
  const introObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
        document.body.classList.add("in-intro");
      } else {
        document.body.classList.remove("in-intro");
      }
    },
    { threshold: [0, 0.45, 0.7, 1] }
  );

  introObserver.observe(intro);
}

const terminalOutput = document.getElementById("terminal-output");

if (terminalOutput && window.Terminal && window.FitAddon) {
  const term = new window.Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.22,
    allowTransparency: true,
    theme: {
      background: "#0b1a13",
      foreground: "#d9f8e7",
      cursor: "#8ff0b8",
      black: "#0b1a13",
      green: "#8ff0b8",
      brightGreen: "#b2ffd0",
      white: "#d9f8e7",
    },
  });

  const fitAddon = new window.FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalOutput);

  let fitFrame = 0;
  function fitTerminal() {
    if (fitFrame) {
      cancelAnimationFrame(fitFrame);
    }
    fitFrame = requestAnimationFrame(() => {
      fitAddon.fit();
      fitFrame = 0;
    });
  }

  fitTerminal();
  window.addEventListener("resize", fitTerminal);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitTerminal);
  }

  if (window.ResizeObserver) {
    const terminalResizeObserver = new window.ResizeObserver(() => fitTerminal());
    terminalResizeObserver.observe(terminalOutput);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitTerminal()).catch(() => {});
  }

  setTimeout(() => fitTerminal(), 120);

  const prompt = "\x1b[36myou\x1b[0m> ";
  let buffer = "";
  let visitorName = "";
  const history = [];
  const commandHistory = [];
  let historyIndex = -1;
  let isBusy = false;
  let activeIntake = null;
  let pendingServiceChoice = false;
  let contactContextSummary = "";
  const STRICT_SERVICE_ROUTING = true;

  const contactIntakeConfigs = {
    consulting: {
      label: "consulting",
      questions: [
        { key: "name", question: "Great. What is your name?" },
        { key: "email", question: "What is your email?" },
        { key: "company", question: "What company or team are you with?" },
        { key: "challenge", question: "What challenge are you trying to solve?" },
        { key: "timeline", question: "What is your desired timeline?" },
        { key: "budget", question: "Any budget range in mind?" },
      ],
    },
    coding: {
      label: "coding services",
      questions: [
        { key: "name", question: "Great. What is your name?" },
        { key: "email", question: "What is your email?" },
        { key: "project", question: "What do you want built?" },
        { key: "stack", question: "Preferred tech stack or constraints?" },
        { key: "scope", question: "What is the expected scope (MVP, feature, full product)?" },
        { key: "timeline", question: "When do you want to start and ship?" },
      ],
    },
    advice: {
      label: "advice",
      questions: [
        { key: "name", question: "Great. What is your name?" },
        { key: "email", question: "What is your email?" },
        { key: "topic", question: "What topic do you want advice on?" },
        { key: "context", question: "What is your current situation in 2-3 lines?" },
        { key: "question", question: "What is your most important question right now?" },
        { key: "urgency", question: "How urgent is it?" },
      ],
    },
    "project-discussion": {
      label: "project discussion",
      questions: [
        { key: "name", question: "Great. What is your name?" },
        { key: "email", question: "What is your email?" },
        { key: "project", question: "Which project do you want to discuss?" },
        { key: "goal", question: "What is the main goal of this discussion?" },
        { key: "timeline", question: "When do you want to talk?" },
      ],
    },
  };

  const commands = {
    help: { text: "You can chat naturally. Optional commands: about, experience, values, work, side-projects, contact, services, consulting, coding, advice, project-discussion, cancel, clear" },
    about: { text: "Opening /about -> mission and founder story.", section: "about" },
    experience: { text: "Opening /experience -> Seals AI, Orchata, Prysmex.", section: "experience" },
    values: { text: "Opening /values -> passion, curiosity, ingenuity, hard work, integrity.", section: "values" },
    work: { text: "Opening /work -> featured work and impact statements.", section: "work" },
    projects: { text: "Opening /work -> featured work and impact statements.", section: "work" },
    future: { text: "Opening /side-projects -> roadmap and next initiatives.", section: "side-projects" },
    "side-projects": { text: "Opening /side-projects -> roadmap and next initiatives.", section: "side-projects" },
    sideprojects: { text: "Opening /side-projects -> roadmap and next initiatives.", section: "side-projects" },
    contact: { text: "Opening /contact -> reach me at mail@heberuriegas.com.", section: "contact" },
    services: { text: "I can collect contact details for: 1) consulting 2) coding services 3) advice 4) project discussion. Type 1, 2, 3, 4, or the service name." },
    "project-discussion": { text: "Starting project discussion intake. I will collect name, email, project, goal, and preferred timeline." },
    projectdiscussion: { text: "Starting project discussion intake. I will collect name, email, project, goal, and preferred timeline." },
  };

  const SERVICE_INTENT_PATTERNS = {
    consulting: [
      /\bconsult\w*/,
      /\bconsultoria\b/,
      /\bconsultoria\b/,
      /\bconsultor\w*/,
      /\bstrategy\b/,
      /\barchitect\w*/,
      /\bcto\s+as\s+a\s+service\b/,
      /\bfractional\s+cto\b/,
      /\btechnical\s+direction\b/,
      /\bassessment\b/,
      /\bauditor\w*/,
      /\broadmap\b/,
      /\bdiagnostico\b/,
      /\basesoria\s+tecnica\b/,
    ],
    coding: [
      /\bcoding\b/,
      /\bprogram\w*/,
      /\bdesarroll\w*/,
      /\bbuild\b/,
      /\bimplement\w*/,
      /\bship\b/,
      /\bfreelance\b/,
      /\bcontract\w*/,
      /\boutsource\w*/,
      /\bdev\s+shop\b/,
      /\bmvp\b/,
      /\bfeature\b/,
      /\bapp\b/,
      /\bwebsite\b/,
      /\bweb\s*site\b/,
      /\bsitio\s+web\b/,
      /\bcodigo\b/,
      /\bbackend\b/,
      /\bfrontend\b/,
      /\bapi\b/,
    ],
    advice: [
      /\badvice\b/,
      /\bguidance\b/,
      /\bmentor\w*/,
      /\bcoaching\b/,
      /\bfeedback\b/,
      /\breview\b/,
      /\bopinion\b/,
      /\bopinion\b/,
      /\brecomend\w*/,
      /\bconsejo\w*/,
      /\bhelp\s+me\s+decide\b/,
      /\bque\s+me\s+recomiendas\b/,
      /\bque\s+opinas\b/,
    ],
    "project-discussion": [
      /\bproject\s+discussion\b/,
      /\bdiscuss\s+(a\s+)?project\b/,
      /\bproject\s+call\b/,
      /\bdiscovery\s+call\b/,
      /\bhablar\s+de\s+proyecto\b/,
      /\bdiscutir\s+proyecto\b/,
      /\bplaticar\s+proyecto\b/,
    ],
  };

  const SERVICE_TRIGGER_PATTERNS = [
    /\bservices?\b/,
    /\bservicios?\b/,
    /\bhire\b/,
    /\bwork\s+with\s+you\b/,
    /\btrabajar\s+contigo\b/,
    /\bquiero\b/,
    /\bnecesito\b/,
    /\bbusco\b/,
    /\blooking\s+for\b/,
    /\bbabymode\b/,
    /\bklan(\.gg)?\b/,
    /\bseals\s+ai\b/,
    /\borchata\b/,
    /\bprysmex\b/,
    /\bfacturabot(\.ai)?\b/,
    /\basurela(\.com)?\b/,
    /\bmobilecode(\.ai)?\b/,
    /\bbetterpr(\.ai)?\b/,
  ];

  function say(text) {
    term.writeln(`\x1b[32mheber\x1b[0m> ${text}`);
  }

  function system(text) {
    term.writeln(`\x1b[90m${text}\x1b[0m`);
  }

  function openSection(id) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function normalizeServiceType(input) {
    const value = String(input || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (value === "1" || value.includes("consult")) {
      return "consulting";
    }
    if (
      value === "2" ||
      value.includes("coding") ||
      value.includes("development") ||
      value.includes("build") ||
      value.includes("programacion") ||
      value.includes("codigo")
    ) {
      return "coding";
    }
    if (
      value === "3" ||
      value.includes("advice") ||
      value.includes("mentoring") ||
      value.includes("help") ||
      value.includes("asesoria") ||
      value.includes("consejo")
    ) {
      return "advice";
    }
    if (
      value === "4" ||
      value.includes("project discussion") ||
      value.includes("discuss project") ||
      value.includes("discuss a project") ||
      value.includes("project call") ||
      value.includes("discovery call") ||
      value.includes("hablar de proyecto")
    ) {
      return "project-discussion";
    }
    return "";
  }

  function detectServiceIntent(input) {
    const text = String(input || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (!text) {
      return { type: "", wantsService: false };
    }

    const directType = normalizeServiceType(text);
    if (directType) {
      return { type: directType, wantsService: true };
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

  function formatIntakeKey(key) {
    if (key === "name") return "Name";
    if (key === "company") return "Company/Team";
    if (key === "email") return "Email";
    if (key === "challenge") return "Challenge";
    if (key === "timeline") return "Timeline";
    if (key === "budget") return "Budget";
    if (key === "project") return "Project";
    if (key === "stack") return "Tech Stack";
    if (key === "scope") return "Scope";
    if (key === "topic") return "Topic";
    if (key === "context") return "Context";
    if (key === "question") return "Key Question";
    if (key === "urgency") return "Urgency";
    if (key === "goal") return "Discussion Goal";
    return key;
  }

  function startIntake(type) {
    const config = contactIntakeConfigs[type];
    if (!config) {
      return;
    }

    pendingServiceChoice = false;
    activeIntake = {
      type,
      answers: {},
      questionIndex: 0,
    };
    say(`Perfect - let us capture your ${config.label} request.`);
    system("You can type cancel anytime to stop this flow.");
    say(config.questions[0].question);
  }

  function startServicePicker() {
    pendingServiceChoice = true;
    say("What do you need help with?");
    say("1) Consulting services");
    say("2) Coding services");
    say("3) Advice");
    say("4) Project discussion");
    say("Type 1, 2, 3, 4, or the service name.");
  }

  async function submitLeadToEmail(payload) {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    let payloadData = null;
    if (contentType.includes("application/json")) {
      payloadData = await response.json().catch(() => null);
    }

    if (!response.ok) {
      const errText = payloadData ? "" : await response.text().catch(() => "");
      const message =
        payloadData?.providerError ||
        payloadData?.detail ||
        payloadData?.error ||
        errText ||
        `Contact API failed (${response.status})`;
      throw new Error(message);
    }

    if (payloadData) {
      return payloadData;
    }

    return { ok: true };
  }

  async function finishIntake() {
    if (!activeIntake) {
      return;
    }

    const config = contactIntakeConfigs[activeIntake.type];
    const answers = activeIntake.answers;
    const name = answers.name || "there";
    const summaryLines = Object.entries(answers).map(
      ([key, value]) => `${formatIntakeKey(key)}: ${value}`
    );
    contactContextSummary = `Service interest: ${config.label}. ${summaryLines.join(" | ")}`;

    say(`Thanks, ${name}. I captured your ${config.label} request.`);
    summaryLines.forEach((line) => say(line));

    const subjectLabel =
      activeIntake.type === "consulting"
        ? "Consulting Request"
        : activeIntake.type === "coding"
          ? "Coding Services Request"
          : activeIntake.type === "advice"
            ? "Advice Request"
            : "Project Discussion Request";
    try {
      const emailResult = await submitLeadToEmail({
        serviceType: activeIntake.type,
        subjectLabel,
        visitorName: name,
        visitorEmail: answers.email || "",
        answers,
        contextSummary: contactContextSummary,
      });
      say("Done. I sent your request details to mail@heberuriegas.com.");
      if (emailResult?.emailId) {
        system(`Delivery confirmation: ${emailResult.emailId}`);
      }
      say("I will follow up by email soon.");
    } catch (_error) {
      const reason = String(_error?.message || "").trim();
      say("I could not send the email automatically right now.");
      if (reason) {
        system(`Reason: ${reason}`);
      }
      if (reason.includes("404")) {
        system("Local hint: run with `vercel dev` so /api/contact exists.");
      }
      if (reason.toLowerCase().includes("missing resend_api_key")) {
        system("Local hint: set RESEND_API_KEY in .env.local.");
      }
      if (
        reason.toLowerCase().includes("verify") ||
        reason.toLowerCase().includes("domain") ||
        reason.toLowerCase().includes("from")
      ) {
        system("Resend hint: verify heberuriegas.com and sender mail@heberuriegas.com.");
      }
      say(`Please email mail@heberuriegas.com with subject: [${subjectLabel}] ${name}`);
      say("You can also add links, docs, or screenshots to speed up the conversation.");
    }

    history.push({ role: "assistant", content: `Saved contact context: ${contactContextSummary}` });

    activeIntake = null;
  }

  async function handleIntakeInput(input) {
    const value = String(input || "").trim();
    if (!activeIntake || !value) {
      return false;
    }

    const config = contactIntakeConfigs[activeIntake.type];
    const question = config.questions[activeIntake.questionIndex];
    if (!question) {
      return false;
    }

    activeIntake.answers[question.key] = value;
    activeIntake.questionIndex += 1;

    const nextQuestion = config.questions[activeIntake.questionIndex];
    if (nextQuestion) {
      say(nextQuestion.question);
    } else {
      await finishIntake();
    }

    return true;
  }

  function handleLocalInput(input) {
    const normalized = input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("my name is ")) {
      visitorName = input.split(/my name is /i)[1]?.trim() || "friend";
      say(`Great to meet you, ${visitorName}.`);
      return true;
    }

    if (normalized.startsWith("name ")) {
      visitorName = input.slice(5).trim() || "friend";
      say(`Great to meet you, ${visitorName}.`);
      return true;
    }

    if (normalized.includes("who are you") || normalized.includes("whoami")) {
      say("I am Heber: father, co-founder and cto. Mission: software for impact.");
      return true;
    }

    const serviceIntent = detectServiceIntent(input);
    if (serviceIntent.wantsService) {
      if (serviceIntent.type) {
        startIntake(serviceIntent.type);
      } else {
        startServicePicker();
      }
      return true;
    }

    if (
      (normalized.includes("contact") && normalized.includes("service")) ||
      (normalized.includes("contacto") && normalized.includes("servicio"))
    ) {
      startServicePicker();
      return true;
    }

    return false;
  }

  async function askAgent(message) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, visitorName, history, contactContext: contactContextSummary }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Chat backend unavailable");
    }

    let typingHintVisible = false;
    const typingHintTimeout = setTimeout(() => {
      typingHintVisible = true;
      system("Heber is typing...");
    }, 280);

    let wroteAssistantPrefix = false;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (!wroteAssistantPrefix) {
        clearTimeout(typingHintTimeout);
        if (typingHintVisible) {
          term.write("\x1b[1A\x1b[2K\r");
        }
        term.write("\x1b[32mheber\x1b[0m> ");
        wroteAssistantPrefix = true;
      }

      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      term.write(chunk);
    }

    clearTimeout(typingHintTimeout);
    if (!wroteAssistantPrefix) {
      if (typingHintVisible) {
        term.write("\x1b[1A\x1b[2K\r");
      }
      term.write("\x1b[32mheber\x1b[0m> ");
    }

    term.write("\r\n");
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: full.trim() });
  }

  async function executeInput(raw) {
    const normalized = raw.replace(/^\.\//, "").toLowerCase();

    if (typeof window.rotateBackgroundTheme === "function") {
      window.rotateBackgroundTheme();
    }

    if (normalized === "cancel") {
      if (activeIntake || pendingServiceChoice) {
        activeIntake = null;
        pendingServiceChoice = false;
        say("Contact flow cancelled.");
      } else {
        say("No active flow to cancel.");
      }
      return;
    }

    if (activeIntake) {
      await handleIntakeInput(raw);
      return;
    }

    if (pendingServiceChoice) {
      const type = normalizeServiceType(raw);
      if (!type) {
        say("Please choose 1, 2, 3, or type consulting, coding, or advice.");
        return;
      }
      startIntake(type);
      return;
    }

    if (normalized === "clear") {
      term.clear();
      say("Terminal cleared.");
      return;
    }

    const match = commands[normalized];
    if (match) {
      say(match.text);
      if (normalized === "services") {
        pendingServiceChoice = true;
      }
      if (
        normalized === "consulting" ||
        normalized === "coding" ||
        normalized === "advice" ||
        normalized === "project-discussion" ||
        normalized === "projectdiscussion"
      ) {
        const serviceType = normalized === "projectdiscussion" ? "project-discussion" : normalized;
        startIntake(serviceType);
      }
      if (match.section) {
        openSection(match.section);
      }
      return;
    }

    if (handleLocalInput(raw)) {
      return;
    }

    if (STRICT_SERVICE_ROUTING) {
      const serviceIntent = detectServiceIntent(raw);
      if (serviceIntent.wantsService) {
        if (serviceIntent.type) {
          startIntake(serviceIntent.type);
        } else {
          startServicePicker();
        }
        return;
      }
    }

    try {
      await askAgent(raw);
    } catch (_error) {
      say("I could not reach the AI right now. Try again in a moment.");
    }
  }

  say("Hi.");
  say("I am Heber - father, co-founder and cto. I am glad you are here. What is your name?");
  system("Tip: chat naturally or use short commands like about, work, contact, or services.");
  term.write(prompt);

  function redrawInput() {
    term.write(`\x1b[2K\r${prompt}${buffer}`);
  }

  term.onData((data) => {
    if (isBusy) {
      if (data === "\u0003") {
        term.write("^C\r\n");
      }
      return;
    }

    if (data === "\r") {
      term.write("\r\n");
      const raw = buffer.trim();
      buffer = "";
      historyIndex = -1;
      if (raw) {
        commandHistory.push(raw);
        isBusy = true;
        void executeInput(raw).finally(() => {
          isBusy = false;
          term.write(prompt);
        });
      } else {
        term.write(prompt);
      }
      return;
    }

    if (data === "\u007f") {
      if (buffer.length > 0) {
        buffer = buffer.slice(0, -1);
        term.write("\b \b");
      }
      return;
    }

    if (data === "\u0003") {
      buffer = "";
      term.write("^C\r\n");
      term.write(prompt);
      return;
    }

    if (data === "\x1b[A") {
      if (!commandHistory.length) {
        return;
      }
      if (historyIndex === -1) {
        historyIndex = commandHistory.length - 1;
      } else if (historyIndex > 0) {
        historyIndex -= 1;
      }
      buffer = commandHistory[historyIndex] || "";
      redrawInput();
      return;
    }

    if (data === "\x1b[B") {
      if (!commandHistory.length) {
        return;
      }
      if (historyIndex >= 0 && historyIndex < commandHistory.length - 1) {
        historyIndex += 1;
        buffer = commandHistory[historyIndex] || "";
      } else {
        historyIndex = -1;
        buffer = "";
      }
      redrawInput();
      return;
    }

    if (data >= " " && data <= "~") {
      buffer += data;
      term.write(data);
    }
  });
}
