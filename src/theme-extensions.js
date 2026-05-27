import { themes, defaultThemeId, getThemeById } from "./themes.js";

const THEME_KEY = "blog-theme-id";
let observerStarted = false;
let pollTimer = null;

function getBlogRoot() {
  return document.querySelector(".blog-app");
}

function applyTheme(themeId) {
  const theme = getThemeById(themeId || defaultThemeId);
  const root = getBlogRoot();
  if (!theme || !root) return false;

  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  document.querySelectorAll(".theme-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeId === theme.id);
  });

  root.dataset.theme = theme.id;
  localStorage.setItem(THEME_KEY, theme.id);
  return true;
}

function makeThemeButton(theme) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-btn";
  button.dataset.themeId = theme.id;
  button.setAttribute("aria-label", `切换到${theme.name}主题`);
  button.innerHTML = `<span class="theme-dot" style="--dot:${theme.accent}"></span><span>${theme.name}</span>`;
  button.addEventListener("click", () => applyTheme(theme.id));
  return button;
}

function rebuildThemeList() {
  const themeList = document.querySelector(".theme-list");
  if (!themeList) return false;

  const saved = localStorage.getItem(THEME_KEY) || defaultThemeId;

  // 统一由 src/themes.js 生成主题按钮，避免 App.jsx 内部旧主题数组造成只显示 3 个的问题。
  themeList.innerHTML = "";
  themes.forEach((theme) => themeList.appendChild(makeThemeButton(theme)));
  themeList.dataset.themeSource = "src/themes.js";

  applyTheme(saved);
  return true;
}

function startPollingUntilReady() {
  let count = 0;
  if (pollTimer) window.clearInterval(pollTimer);

  pollTimer = window.setInterval(() => {
    count += 1;
    const ok = rebuildThemeList();
    if (ok || count > 40) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 250);
}

function bootThemeSystem() {
  rebuildThemeList();
  startPollingUntilReady();

  if (!observerStarted) {
    observerStarted = true;

    const observer = new MutationObserver(() => {
      const themeList = document.querySelector(".theme-list");
      if (themeList && themeList.dataset.themeSource !== "src/themes.js") {
        rebuildThemeList();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("hashchange", () => {
      requestAnimationFrame(rebuildThemeList);
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootThemeSystem);
} else {
  bootThemeSystem();
}

window.__qingshanThemes = {
  themes,
  apply: applyTheme,
  rebuild: rebuildThemeList,
};
