let searchIndex = null;
let searchLoading = null;

async function loadSearchIndex() {
  if (searchIndex) return searchIndex;
  if (searchLoading) return searchLoading;

  searchLoading = fetch("./search-index.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      searchIndex = data.posts || [];
      return searchIndex;
    })
    .catch((error) => {
      console.error("[search]", error);
      searchIndex = [];
      return searchIndex;
    });

  return searchLoading;
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase().trim();
}

function scorePost(post, keyword) {
  const q = normalizeText(keyword);
  if (!q) return 0;

  let score = 0;
  const title = normalizeText(post.title);
  const summary = normalizeText(post.summary);
  const tags = normalizeText((post.tags || []).join(" "));
  const body = normalizeText(post.text);

  if (title.includes(q)) score += 80;
  if (summary.includes(q)) score += 40;
  if (tags.includes(q)) score += 30;
  if (body.includes(q)) score += 10;
  if (title === q) score += 60;

  return score;
}

function getSnippet(text, keyword) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  const lower = source.toLowerCase();
  const q = keyword.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) return source.slice(0, 110) + (source.length > 110 ? "..." : "");
  const start = Math.max(0, idx - 45);
  const end = Math.min(source.length, idx + q.length + 70);
  return `${start > 0 ? "..." : ""}${source.slice(start, end)}${end < source.length ? "..." : ""}`;
}

function renderResults(posts, keyword) {
  const results = document.querySelector(".search-results");
  const hint = document.querySelector(".search-hint");
  if (!results || !hint) return;

  const q = keyword.trim();
  if (!q) {
    results.innerHTML = "";
    hint.textContent = "输入关键词搜索标题、摘要、标签和正文。建议搜索：RTOS、低功耗、UART、状态机。";
    return;
  }

  const matched = posts
    .map((post) => ({ post, score: scorePost(post, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  hint.textContent = matched.length ? `找到 ${matched.length} 条相关结果` : "没有找到相关结果，换个关键词试试。";
  results.innerHTML = matched
    .map(({ post }) => `
      <a class="search-result" href="${post.url}">
        <div class="search-result-title">
          <span>${post.title}</span>
          <span>${post.quality || "文章"}</span>
        </div>
        <p>${getSnippet(post.summary || post.text, q)}</p>
        <div class="search-meta">
          <span>${post.category || "未分类"}</span>
          <span>${post.series || "series"}</span>
          ${(post.tags || []).slice(0, 4).map((tag) => `<span>#${tag}</span>`).join("")}
        </div>
      </a>
    `)
    .join("");
}

function closeSearch() {
  document.querySelector(".search-overlay")?.classList.remove("open");
}

async function openSearch() {
  ensureSearchOverlay();
  const overlay = document.querySelector(".search-overlay");
  const input = document.querySelector(".search-input");
  overlay?.classList.add("open");
  input?.focus();
  const posts = await loadSearchIndex();
  renderResults(posts, input?.value || "");
}

function ensureSearchTrigger() {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks || navLinks.querySelector(".site-search-trigger")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "site-search-trigger";
  button.innerHTML = `<span>⌘</span><strong>搜索</strong>`;
  button.addEventListener("click", openSearch);
  navLinks.appendChild(button);
}

function ensureSearchOverlay() {
  if (document.querySelector(".search-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "search-overlay";
  overlay.innerHTML = `
    <div class="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">
      <div class="search-head">
        <label class="search-input-wrap">
          <span>搜索</span>
          <input class="search-input" placeholder="搜索 RTOS、低功耗、UART、状态机..." />
        </label>
        <button class="search-close" type="button" aria-label="关闭搜索">×</button>
      </div>
      <div class="search-body">
        <div class="search-hint">输入关键词搜索标题、摘要、标签和正文。</div>
        <div class="search-results"></div>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest(".search-close")) closeSearch();
    if (event.target.closest(".search-result")) closeSearch();
  });

  overlay.querySelector(".search-input").addEventListener("input", async (event) => {
    const posts = await loadSearchIndex();
    renderResults(posts, event.target.value);
  });

  document.body.appendChild(overlay);
}

function bootSearchEnhancement() {
  ensureSearchTrigger();
  ensureSearchOverlay();

  document.addEventListener("keydown", (event) => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const combo = isMac ? event.metaKey && event.key.toLowerCase() === "k" : event.ctrlKey && event.key.toLowerCase() === "k";
    if (combo) {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape") closeSearch();
  });

  const observer = new MutationObserver(() => ensureSearchTrigger());
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSearchEnhancement);
} else {
  bootSearchEnhancement();
}
