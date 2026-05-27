function getRoute() {
  const clean = window.location.hash.replace(/^#\/?/, "");
  const [page, slug] = clean.split("/");
  return { page: page || "home", slug };
}

function getArticleTitle() {
  return document.querySelector(".article h1")?.textContent?.trim() || "当前文章";
}

function removeNode(selector) {
  document.querySelector(selector)?.remove();
}

async function copyCurrentLink(button) {
  try {
    await navigator.clipboard.writeText(window.location.href);
    const old = button.textContent;
    button.textContent = "已复制";
    setTimeout(() => (button.textContent = old), 1400);
  } catch {
    window.prompt("复制文章链接", window.location.href);
  }
}

function buildBreadcrumb() {
  removeNode(".article-breadcrumb");
  const route = getRoute();
  if (route.page !== "posts") return;

  const article = document.querySelector(".article");
  if (!article) return;

  const breadcrumb = document.createElement("nav");
  breadcrumb.className = "article-breadcrumb";
  breadcrumb.setAttribute("aria-label", "Breadcrumb");
  breadcrumb.innerHTML = `
    <a href="#/">首页</a>
    <span class="sep">/</span>
    <a href="#/series/rtos">专题</a>
    <span class="sep">/</span>
    <span>${getArticleTitle()}</span>
  `;
  article.prepend(breadcrumb);
}

function buildReadingTools() {
  removeNode(".reading-tools");

  const tools = document.createElement("div");
  tools.className = "reading-tools";
  tools.innerHTML = `
    <button type="button" class="reading-tool-btn" data-action="copy">复制链接</button>
    <button type="button" class="reading-tool-btn" data-action="wide">宽阅读</button>
    <button type="button" class="reading-tool-btn" data-action="top">顶部</button>
  `;

  tools.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "copy") copyCurrentLink(button);
    if (action === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    if (action === "wide") {
      const root = document.querySelector(".blog-app");
      root?.classList.toggle("wide-reading");
      button.textContent = root?.classList.contains("wide-reading") ? "标准宽度" : "宽阅读";
    }
  });

  document.body.appendChild(tools);
}

function appendArticleFooterNote() {
  removeNode(".article-footer-note");
  const article = document.querySelector(".article");
  if (!article) return;

  const note = document.createElement("div");
  note.className = "article-footer-note";
  note.innerHTML = `<strong>持续更新：</strong>技术内容会随项目实践和认知升级持续修订。如果你发现问题，可以通过 GitHub 仓库反馈。`;
  article.appendChild(note);
}

function enhancePage() {
  const route = getRoute();
  document.body.classList.toggle("is-article-page", route.page === "posts");

  if (route.page === "posts") {
    buildBreadcrumb();
    buildReadingTools();
    appendArticleFooterNote();
  } else {
    removeNode(".article-breadcrumb");
    removeNode(".article-footer-note");
    removeNode(".reading-tools");
    document.querySelector(".blog-app")?.classList.remove("wide-reading");
  }
}

function bootExperienceEnhancements() {
  enhancePage();

  window.addEventListener("hashchange", () => {
    setTimeout(enhancePage, 80);
  });

  const observer = new MutationObserver(() => {
    const route = getRoute();
    if (route.page === "posts" && document.querySelector(".article") && !document.querySelector(".article-breadcrumb")) {
      enhancePage();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootExperienceEnhancements);
} else {
  bootExperienceEnhancements();
}
