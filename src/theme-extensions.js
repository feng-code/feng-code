const extraThemes = [
  {
    id: "terminal",
    name: "终端青",
    accent: "#22d3ee",
    vars: {
      "--bg": "#061014",
      "--panel": "#0b1f26",
      "--soft": "#10323b",
      "--text": "#e6fffb",
      "--muted": "#8dd9d2",
      "--line": "#164e58",
      "--accent": "#22d3ee",
      "--accent-soft": "#083344",
      "--code-bg": "#020617",
      "--code-text": "#cffafe",
      "--shadow": "0 22px 55px rgba(0,0,0,.38)",
    },
  },
  {
    id: "ocean",
    name: "海盐蓝",
    accent: "#0ea5e9",
    vars: {
      "--bg": "#eef8ff",
      "--panel": "#ffffff",
      "--soft": "#dff3ff",
      "--text": "#082f49",
      "--muted": "#3f6f8f",
      "--line": "#bae6fd",
      "--accent": "#0ea5e9",
      "--accent-soft": "#e0f2fe",
      "--code-bg": "#082f49",
      "--code-text": "#e0f2fe",
      "--shadow": "0 22px 55px rgba(14,165,233,.13)",
    },
  },
  {
    id: "forest",
    name: "松林绿",
    accent: "#059669",
    vars: {
      "--bg": "#f0fdf4",
      "--panel": "#ffffff",
      "--soft": "#dcfce7",
      "--text": "#052e16",
      "--muted": "#3f6f55",
      "--line": "#bbf7d0",
      "--accent": "#059669",
      "--accent-soft": "#d1fae5",
      "--code-bg": "#052e16",
      "--code-text": "#dcfce7",
      "--shadow": "0 22px 55px rgba(5,150,105,.12)",
    },
  },
  {
    id: "dusk",
    name: "霞光紫",
    accent: "#c026d3",
    vars: {
      "--bg": "#fff7ed",
      "--panel": "#fffafd",
      "--soft": "#fae8ff",
      "--text": "#3b0764",
      "--muted": "#7e4b8f",
      "--line": "#f5d0fe",
      "--accent": "#c026d3",
      "--accent-soft": "#fae8ff",
      "--code-bg": "#3b0764",
      "--code-text": "#fae8ff",
      "--shadow": "0 22px 55px rgba(192,38,211,.12)",
    },
  },
  {
    id: "graphite",
    name: "石墨灰",
    accent: "#64748b",
    vars: {
      "--bg": "#111827",
      "--panel": "#1f2937",
      "--soft": "#374151",
      "--text": "#f9fafb",
      "--muted": "#cbd5e1",
      "--line": "#4b5563",
      "--accent": "#94a3b8",
      "--accent-soft": "#334155",
      "--code-bg": "#030712",
      "--code-text": "#f8fafc",
      "--shadow": "0 22px 55px rgba(0,0,0,.36)",
    },
  },
];

const EXTRA_THEME_KEY = "blog-extra-theme-id";

function getBlogRoot() {
  return document.querySelector(".blog-app");
}

function applyExtraTheme(themeId) {
  const theme = extraThemes.find((item) => item.id === themeId);
  const root = getBlogRoot();
  if (!theme || !root) return false;

  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  document.querySelectorAll(".theme-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.extraTheme === theme.id);
  });

  return true;
}

function clearExtraTheme() {
  localStorage.removeItem(EXTRA_THEME_KEY);
  document.querySelectorAll(".theme-btn[data-extra-theme]").forEach((button) => {
    button.classList.remove("active");
  });
}

function makeThemeButton(theme) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-btn extra-theme-btn";
  button.dataset.extraTheme = theme.id;
  button.innerHTML = `<span class="theme-dot" style="--dot:${theme.accent}"></span>${theme.name}`;
  button.addEventListener("click", () => {
    localStorage.setItem(EXTRA_THEME_KEY, theme.id);
    applyExtraTheme(theme.id);
  });
  return button;
}

function ensureExtraThemeButtons() {
  const themeList = document.querySelector(".theme-list");
  if (!themeList) return;

  for (const theme of extraThemes) {
    if (!themeList.querySelector(`[data-extra-theme="${theme.id}"]`)) {
      themeList.appendChild(makeThemeButton(theme));
    }
  }

  const saved = localStorage.getItem(EXTRA_THEME_KEY);
  if (saved) applyExtraTheme(saved);
}

function bootThemeExtension() {
  ensureExtraThemeButtons();

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".theme-btn");
    if (button && !button.dataset.extraTheme) {
      clearExtraTheme();
    }
  });

  const observer = new MutationObserver(() => {
    ensureExtraThemeButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener("hashchange", () => {
    requestAnimationFrame(ensureExtraThemeButtons);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootThemeExtension);
} else {
  bootThemeExtension();
}
