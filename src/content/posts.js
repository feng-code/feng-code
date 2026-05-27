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

function parseBodyBlocks(body) {
  const normalizedBody = normalizeMarkdown(body);
  if (!normalizedBody) {
    return [{ heading: "正文", body: "这篇文章还没有正文内容。", code: "", codeLang: "text" }];
  }

  const sections = normalizedBody.split(/\n(?=(?:##\s+|\d+\.\s+))/g);
  const blocks = sections
    .map((section, index) => {
      const lines = section.trim().split("\n");
      let heading = lines[0]?.replace(/^##\s+/, "").replace(/^\d+\.\s+/, "").trim();
      let rest = lines.slice(1).join("\n").trim();

      if (!heading) return null;
      if (index === 0 && !/^##\s+/.test(lines[0]) && !/^\d+\.\s+/.test(lines[0])) {
        rest = section.trim();
        heading = "背景";
      }

      const codeMatch = rest.match(/```(\w+)?\n([\s\S]*?)```/);
      return {
        heading,
        body: codeMatch ? rest.replace(codeMatch[0], "").trim() : rest,
        code: codeMatch?.[2]?.trim() || "",
        codeLang: codeMatch?.[1] || "text",
      };
    })
    .filter(Boolean);

  return blocks.length > 0 ? blocks : [{ heading: "正文", body: normalizedBody, code: "", codeLang: "text" }];
}

function fallbackMeta(markdown, filePath) {
  const lines = normalizeMarkdown(markdown).split("\n").map((line) => line.trim());
  const title = lines.find((line) => line && line !== "---") || slugFromPath(filePath);
  const summary = lines.find((line) => line && line !== title && line !== "---") || "这是一篇技术复盘文章。";

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

export function parseMarkdownPost(markdown, filePath = "unknown.md") {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return { ...fallbackMeta(normalized, filePath), content: parseBodyBlocks(normalized) };
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
  return { ...finalMeta, content: parseBodyBlocks(match[2]) };
}

// Vite 会在构建时自动扫描 posts 目录下所有 Markdown 文件。
// 后续新增文章时，只需要新增 src/content/posts/*.md，不需要再手动修改本文件。
const markdownModules = import.meta.glob("./posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const postSources = Object.values(markdownModules);

export const posts = Object.entries(markdownModules)
  .map(([filePath, markdown]) => parseMarkdownPost(markdown, filePath))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
