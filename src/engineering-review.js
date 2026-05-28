function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getArticleText() {
  return document.querySelector(".article")?.textContent || "";
}

function getArticleTitle() {
  return document.querySelector(".article h1")?.textContent?.trim() || "当前文章";
}

function classifyProblem(text) {
  const t = text.toLowerCase();
  if (t.includes("低功耗") || t.includes("wakeup") || t.includes("休眠")) return "低功耗 / 唤醒链路";
  if (t.includes("uart") || t.includes("dma") || t.includes("rs485") || t.includes("协议")) return "驱动 / 协议链路";
  if (t.includes("rtos") || t.includes("threadx") || t.includes("任务") || t.includes("队列")) return "RTOS / 多任务架构";
  if (t.includes("源码") || t.includes("结构体") || t.includes("调用链")) return "源码阅读 / 调用链分析";
  return "工程复盘 / 方法沉淀";
}

function inferLayer(text) {
  const t = text.toLowerCase();
  const layers = [];
  if (t.includes("中断") || t.includes("dma") || t.includes("uart")) layers.push("驱动/中断/DMA");
  if (t.includes("rtos") || t.includes("threadx") || t.includes("任务") || t.includes("队列")) layers.push("RTOS/任务调度");
  if (t.includes("协议") || t.includes("rs485") || t.includes("ack")) layers.push("协议链路");
  if (t.includes("云") || t.includes("上报") || t.includes("mqtt")) layers.push("云端上报");
  if (t.includes("状态机") || t.includes("状态")) layers.push("状态机");
  return layers.slice(0, 3).join(" / ") || "应用逻辑 / 系统集成";
}

function buildReviewCard() {
  const article = document.querySelector(".article");
  if (!article || article.querySelector(".engineering-review-card")) return;

  const text = getArticleText();
  const title = getArticleTitle();
  const summary = article.querySelector(".article-summary")?.textContent?.trim() || "围绕问题定位、工程取舍和复盘沉淀展开。";
  const anchor = article.querySelector(".post-tags") || article.querySelector(".preview-meta") || article.querySelector("h1");

  const card = document.createElement("section");
  card.className = "engineering-review-card";
  card.innerHTML = `
    <div class="engineering-review-head">
      <strong>工程复盘卡片</strong>
      <span>${escapeHtml(classifyProblem(`${title} ${text}`))}</span>
    </div>
    <div class="engineering-review-grid">
      <div class="engineering-review-item">
        <b>问题层级</b>
        <p>${escapeHtml(inferLayer(`${title} ${text}`))}</p>
      </div>
      <div class="engineering-review-item">
        <b>分析入口</b>
        <p>${escapeHtml(summary)}</p>
      </div>
      <div class="engineering-review-item">
        <b>推荐验证</b>
        <p>优先补关键日志、状态变量、输入输出链路和通过标准，先闭环再扩大修改范围。</p>
      </div>
      <div class="engineering-review-item">
        <b>工程原则</b>
        <p>区分事实、推断和假设；优先最小修改、低风险验证和可回归测试。</p>
      </div>
    </div>
  `;

  anchor?.insertAdjacentElement("afterend", card);
}

function removeReviewCard() {
  document.querySelector(".engineering-review-card")?.remove();
}

function enhanceReviewCard() {
  const isArticle = window.location.hash.replace(/^#\/?/, "").startsWith("posts/");
  if (!isArticle) {
    removeReviewCard();
    return;
  }
  buildReviewCard();
}

function bootEngineeringReview() {
  enhanceReviewCard();
  window.addEventListener("hashchange", () => setTimeout(enhanceReviewCard, 100));
  const observer = new MutationObserver(() => {
    if (document.querySelector(".article") && !document.querySelector(".engineering-review-card")) enhanceReviewCard();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootEngineeringReview);
} else {
  bootEngineeringReview();
}
