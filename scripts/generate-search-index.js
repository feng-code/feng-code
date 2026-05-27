import fs from "node:fs";
import path from "node:path";

const postsDir = path.resolve("src/content/posts");
const publicDir = path.resolve("public");
const outputFile = path.join(publicDir, "search-index.json");

function normalize(markdown) {
  return String(markdown ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function parseValue(value) {
  const v = String(value ?? "").trim();
  if (/^\d+$/.test(v)) return Number(v);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
  }
  return v.replace(/^[\'\"]|[\'\"]$/g, "");
}

function parsePost(markdown, file) {
  const normalized = normalize(markdown);
  const slugFromFile = file.replace(/\.md$/i, "");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  const fallbackTitle = normalized.split("\n").map((line) => line.trim()).find(Boolean) || slugFromFile;
  const meta = {
    slug: slugFromFile,
    title: fallbackTitle,
    date: "2026-05-27",
    updated: "2026-05-27",
    category: "系统架构",
    series: "rtos",
    quality: "架构",
    tags: ["RTOS", "架构", "多任务"],
    summary: "这是一篇技术文章。",
  };

  let body = normalized;

  if (match) {
    match[1].split("\n").forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > -1) {
        meta[line.slice(0, idx).trim()] = parseValue(line.slice(idx + 1));
      }
    });
    body = match[2];
  }

  const text = normalize(body)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()+|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    slug: meta.slug,
    title: meta.title,
    date: meta.date,
    updated: meta.updated,
    category: meta.category,
    series: meta.series,
    quality: meta.quality,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    summary: meta.summary,
    url: `#/posts/${meta.slug}`,
    text,
  };
}

function main() {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md")).sort();
  const posts = files.map((file) => {
    const markdown = fs.readFileSync(path.join(postsDir, file), "utf-8");
    return parsePost(markdown, file);
  });

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify({ generatedAt: new Date().toISOString(), posts }, null, 2), "utf-8");
  console.log(`Generated search index for ${posts.length} posts.`);
}

main();
