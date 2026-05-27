function parseFrontMatterValue(value) {
  const v = String(value ?? "").trim();
  if (/^\d+$/.test(v)) return Number(v);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return v.replace(/^[\'\"]|[\'\"]$/g, "");
}

function normalizeMarkdown(markdown) {
  return String(markdown ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function slugFromPath(filePath) {
  return filePath
    .split("/")
    .pop()
    .replace(/\.md$/i, "")
    .trim();
}

function getFirstMeaningfulLine(markdown) {
  return normalizeMarkdown(markdown)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && line !== "---");
}

function fallbackMeta(markdown, filePath) {
  const title = getFirstMeaningfulLine(markdown) || slugFromPath(filePath);
  const summary = normalizeMarkdown(markdown)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && line !== title && line !== "---") || "这是一篇技术复盘文章。";

  return {
    slug: slugFromPath(filePath),
    title,
    date: "2026-05-27",
    updated: "2026-05-27",
    category: "系统架构",
    series: "rtos",
    quality: "架构",
    tags: ["RTOS", "架构", "多任务"],
    minutes: 20,
    featured: false,
    audience: ["正在设计 RTOS 多任务框架的人", "想提升系统架构能力的人"],
    takeaways: ["RTOS 多任务框架设计方法", "任务/队列/事件/状态机分层思路"],
    summary,
  };
}

function looksLikeSectionTitle(line, prevLine, nextLine) {
  const text = line.trim();
  if (!text || text.length > 90) return false;
  if (!/^\d+(?:\.\d+)*\. ?\S+/.test(text) && !/^\d+(?:\.\d+)*\s+\S+/.test(text)) return false;
  const prevBlank = !String(prevLine ?? "").trim();
  const nextBlank = !String(nextLine ?? "").trim();
  return prevBlank || nextBlank;
}

function normalizeBodyForMarkdown(body, title) {
  const normalized = normalizeMarkdown(body);
  const lines = normalized.split("\n");
  let titleSkipped = false;

  return lines
    .map((line, index) => {
      const trimmed = line.trim();

      // 普通长文经常第一行就是标题。文章页已经有 h1，这里去掉重复标题。
      if (!titleSkipped && trimmed && trimmed === title) {
        titleSkipped = true;
        return "";
      }

      const prev = lines[index - 1];
      const next = lines[index + 1];
      if (looksLikeSectionTitle(line, prev, next)) {
        const level = /^\d+\.\d+/.test(trimmed) ? "###" : "##";
        return `${level} ${trimmed}`;
      }

      return line;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHeadings(markdown) {
  return normalizeMarkdown(markdown)
    .split("\n")
    .map((line) => line.match(/^(#{2,4})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({ level: match[1].length, text: match[2].trim() }));
}

export function parseMarkdownPost(markdown, filePath = "unknown.md") {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    const meta = fallbackMeta(normalized, filePath);
    const rawMarkdown = normalizeBodyForMarkdown(normalized, meta.title);
    return { ...meta, rawMarkdown, headings: extractHeadings(rawMarkdown) };
  }

  const meta = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      meta[line.slice(0, idx).trim()] = parseFrontMatterValue(line.slice(idx + 1));
    }
  });

  const fallback = fallbackMeta(normalized, filePath);
  const finalMeta = { ...fallback, ...meta };
  const rawMarkdown = normalizeBodyForMarkdown(match[2], finalMeta.title);
  return { ...finalMeta, rawMarkdown, headings: extractHeadings(rawMarkdown) };
}

// Vite 会在构建时自动扫描 posts 目录下所有 Markdown 文件。
// 后续新增文章时，只需要新增 src/content/posts/*.md，不需要再手动修改本文件。
const markdownModules = import.meta.glob("./posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const posts = Object.entries(markdownModules)
  .map(([filePath, markdown]) => parseMarkdownPost(markdown, filePath))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
