import { coursePaths } from "./content/course-paths.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeSlug(value) {
  const slug = String(value ?? "");
  return /^[a-zA-Z0-9_-]+$/.test(slug) ? slug : "";
}

function getCurrentSeriesId() {
  const clean = window.location.hash.replace(/^#\/?/, "");
  const [page, seriesId] = clean.split("/");
  return page === "series" ? seriesId : null;
}

function removeCoursePathCard() {
  document.querySelector(".course-path-card")?.remove();
}

function renderCoursePath() {
  removeCoursePathCard();

  const seriesId = getCurrentSeriesId();
  if (!seriesId) return;

  const path = coursePaths.find((item) => item.id === seriesId);
  const hero = document.querySelector(".series-hero");
  if (!path || !hero) return;

  const card = document.createElement("section");
  card.className = "course-path-card";
  card.innerHTML = `
    <div class="course-path-head">
      <strong>${escapeHtml(path.title)}</strong>
      <p>把专题文章组织成可连续学习的课程路径，而不是零散文章列表。</p>
    </div>
    <div class="course-path-meta">
      <div>
        <span>适合谁</span>
        <p>${escapeHtml(path.audience)}</p>
      </div>
      <div>
        <span>学习目标</span>
        <p>${escapeHtml(path.goal)}</p>
      </div>
    </div>
    <div class="course-lessons">
      ${path.lessons.map((lesson, index) => {
        const slug = safeSlug(lesson.slug);
        const href = slug ? `#/posts/${slug}` : "#/";
        return `
          <a class="course-lesson" href="${href}">
            <span class="course-lesson-index">${index + 1}</span>
            <span>
              <span class="course-lesson-title">${escapeHtml(lesson.title)}</span>
              <span class="course-lesson-goal">${escapeHtml(lesson.goal)}</span>
            </span>
            <span class="course-lesson-status">第 ${index + 1} 课</span>
          </a>
        `;
      }).join("")}
    </div>
  `;

  hero.appendChild(card);
}

function bootCoursePathEnhancement() {
  renderCoursePath();

  window.addEventListener("hashchange", () => {
    setTimeout(renderCoursePath, 80);
  });

  const observer = new MutationObserver(() => {
    if (getCurrentSeriesId() && document.querySelector(".series-hero") && !document.querySelector(".course-path-card")) {
      renderCoursePath();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCoursePathEnhancement);
} else {
  bootCoursePathEnhancement();
}
