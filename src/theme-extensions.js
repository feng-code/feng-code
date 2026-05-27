import { themes, defaultThemeId, getThemeById } from "./themes.js";

const THEME_KEY = "blog-theme-id";
let observerStarted = false;
let pollTimer = null;
let styleObserver = null;
let applying = false;

function getBlogRoot() {
  return document.querySelector(".blog-app");
}

function getCurrentThemeId() {
  return localStorage.getItem(THEME_KEY) || defaultThemeId;
}

function closePicker() {
  const picker = document.querySelector(".theme-picker");
  if (!picker) return;
  picker.classList.remove("open");
  picker.querySelector(".theme-picker-trigger")?.setAttribute("aria-expanded", "false");
}

function updatePickerState(theme) {
  const picker = document.querySelector(".theme-picker");
  if (!picker || !theme) return;

  picker.querySelector(".theme-current-name").textContent = theme.name;
  const currentDot = picker.querySelector(".theme-current-dot");
  if (currentDot) currentDot.style.setProperty("--dot", theme.accent);

  picker.querySelectorAll(".theme-option").forEach((button) => {
    const active = button.dataset.themeId === theme.id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", active ? "true" : "false");
  });
}

function applyTheme(themeId, options = {}) {
  const theme = getThemeById(themeId || defaultThemeId);
  const root = getBlogRoot();
  if (!theme || !root) return false;

  applying = true;
  Object.entries(theme.vars).forEach(([key, value]) => {
    // 用 important 抵消 App.jsx 旧主题状态在滚动/路由刷新时重新写入的问题。
    root.style.setProperty(key, value, "important");
  });
  applying = false;

  root.dataset.theme = theme.id;
  if (options.save !== false) localStorage.setItem(THEME_KEY, theme.id);
  updatePickerState(theme);
  return true;
}

function makeThemeOption(theme) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-option";
  button.dataset.themeId = theme.id;
  button.setAttribute("role", "menuitemradio");
  button.setAttribute("aria-checked", "false");
  button.innerHTML = `
    <span class="theme-dot" style="--dot:${theme.accent}"></span>
    <span class="theme-option-text">
      <strong>${theme.name}</strong>
      <small>${theme.id}</small>
    </span>
  `;
  button.addEventListener("click", () => {
    applyTheme(theme.id);
    closePicker();
  });
  return button;
}

function buildThemePicker() {
  const current = getThemeById(getCurrentThemeId());
  const wrap = document.createElement("div");
  wrap.className = "theme-picker";
  wrap.innerHTML = `
    <button type="button" class="theme-picker-trigger" aria-expanded="false" aria-haspopup="true">
      <span class="theme-dot theme-current-dot" style="--dot:${current.accent}"></span>
      <span>主题</span>
      <strong class="theme-current-name">${current.name}</strong>
    </button>
    <div class="theme-picker-panel" role="menu" aria-label="选择主题">
      <div class="theme-panel-head">
        <strong>选择主题</strong>
        <span>${themes.length} 套阅读风格</span>
      </div>
      <div class="theme-options"></div>
    </div>
  `;

  const trigger = wrap.querySelector(".theme-picker-trigger");
  const options = wrap.querySelector(".theme-options");
  themes.forEach((theme) => options.appendChild(makeThemeOption(theme)));

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = wrap.classList.toggle("open");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  return wrap;
}

function rebuildThemeList() {
  const themeList = document.querySelector(".theme-list");
  if (!themeList) return false;

  themeList.innerHTML = "";
  themeList.appendChild(buildThemePicker());
  themeList.dataset.themeSource = "src/themes.js:picker";

  applyTheme(getCurrentThemeId(), { save: false });
  observeRootStyle();
  return true;
}

function observeRootStyle() {
  const root = getBlogRoot();
  if (!root || styleObserver) return;

  styleObserver = new MutationObserver(() => {
    if (applying) return;
    requestAnimationFrame(() => applyTheme(getCurrentThemeId(), { save: false }));
  });

  styleObserver.observe(root, {
    attributes: true,
    attributeFilter: ["style"],
  });
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

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".theme-picker")) closePicker();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePicker();
    });

    const observer = new MutationObserver(() => {
      const themeList = document.querySelector(".theme-list");
      if (themeList && themeList.dataset.themeSource !== "src/themes.js:picker") {
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
