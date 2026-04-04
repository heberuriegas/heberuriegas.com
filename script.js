const yearEl = document.getElementById("year");

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
    fontFamily: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace',
    fontSize: 14,
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
  fitAddon.fit();

  window.addEventListener("resize", () => fitAddon.fit());

  const prompt = "guest@heberuriegas:~$ ";
  let buffer = "";
  let visitorName = "";
  const history = [];
  const commandHistory = [];
  let historyIndex = -1;
  let isBusy = false;

  const commands = {
    help: { text: "Commands: about, experience, values, projects, future, contact, clear" },
    about: { text: "Opening /about -> mission and founder story.", section: "about" },
    experience: { text: "Opening /experience -> Seals AI, Orchata, Prysmex.", section: "experience" },
    values: { text: "Opening /values -> passion, curiosity, ingenuity, hard work, integrity.", section: "values" },
    projects: { text: "Opening /projects -> featured work and impact statements.", section: "projects" },
    future: { text: "Opening /future -> roadmap and next initiatives.", section: "future" },
    contact: { text: "Opening /contact -> reach me at mail@heberuriegas.com.", section: "contact" },
  };

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

  function handleLocalInput(input) {
    const normalized = input.toLowerCase();

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
      say("I am Heber: father, builder, CTO and co-founder. Mission: software for impact.");
      return true;
    }

    return false;
  }

  async function askAgent(message) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        visitorName,
        history,
      }),
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

    if (normalized === "clear") {
      term.clear();
      say("Terminal cleared.");
      return;
    }

    const match = commands[normalized];
    if (match) {
      say(match.text);
      if (match.section) {
        openSection(match.section);
      }
      return;
    }

    if (handleLocalInput(raw)) {
      return;
    }

    try {
      await askAgent(raw);
    } catch (_error) {
      say("I could not reach the AI right now. Try again in a moment.");
    }
  }

  say("Hi Guest, welcome to my corner of the internet.");
  say("I am Heber - father, builder, CTO and co-founder. I am glad you are here. What is your name?");
  system("Tip: type `my name is Ana` or use commands like `about`, `projects`, `contact`.");
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
