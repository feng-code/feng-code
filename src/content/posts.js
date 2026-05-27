function parseFrontMatterValue(value) {
  const v = value.trim();
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

export function parseMarkdownPost(markdown) {
  const match = markdown.trim().match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid post markdown: missing front matter.");
  }

  const meta = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      meta[line.slice(0, idx).trim()] = parseFrontMatterValue(line.slice(idx + 1));
    }
  });

  const sections = match[2].trim().split(/\n(?=##\s+)/g);
  const content = sections
    .map((section) => {
      const lines = section.trim().split("\n");
      const heading = lines[0]?.replace(/^##\s+/, "").trim();
      const rest = lines.slice(1).join("\n").trim();
      if (!heading) return null;
      const codeMatch = rest.match(/```(\w+)?\n([\s\S]*?)```/);
      return {
        heading,
        body: codeMatch ? rest.replace(codeMatch[0], "").trim() : rest,
        code: codeMatch?.[2]?.trim() || "",
        codeLang: codeMatch?.[1] || "text",
      };
    })
    .filter(Boolean);

  return { ...meta, content };
}

// Vite 会在构建时自动扫描 posts 目录下所有 Markdown 文件。
// 后续新增文章时，只需要新增 src/content/posts/*.md，不需要再手动修改本文件。
const markdownModules = import.meta.glob("./posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export const postSources = Object.values(markdownModules);

export const posts = postSources
  .map(parseMarkdownPost)
  .sort((a, b) => new Date(b.date) - new Date(a.date));
