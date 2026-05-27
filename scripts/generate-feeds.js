import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://feng-code.github.io/feng-code";
const postsDir = path.resolve("src/content/posts");
const publicDir = path.resolve("public");

function normalizeMarkdown(markdown) {
  return String(markdown ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

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

function slugFromFile(file) {
  return file.replace(/\.md$/i, "").trim();
}

function fallbackMeta(markdown, file) {
  const lines = normalizeMarkdown(markdown).split("\n").map((line) => line.trim());
  const title = lines.find((line) => line && line !== "---") || slugFromFile(file);
  const summary = lines.find((line) => line && line !== title && line !== "---") || "这是一篇技术文章。";
  return {
    slug: slugFromFile(file),
    title,
    date: "2026-05-27",
    updated: "2026-05-27",
    category: "系统架构",
    series: "rtos",
    quality: "架构",
    tags: ["RTOS", "架构", "多任务"],
    minutes: 20,
    summary,
  };
}

function parseMeta(markdown, file) {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    console.warn(`[generate-feeds] ${file} has no front matter, using fallback metadata.`);
    return fallbackMeta(normalized, file);
  }

  const meta = fallbackMeta(normalized, file);
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > -1) {
      meta[line.slice(0, idx).trim()] = parseFrontMatterValue(line.slice(idx + 1));
    }
  });
  return meta;
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readPosts() {
  return fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const markdown = fs.readFileSync(path.join(postsDir, file), "utf-8");
      return parseMeta(markdown, file);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function buildSitemap(posts) {
  const staticUrls = ["/", "/write/", "/#/archive", "/#/about", "/#/projects", "/#/roadmap", "/#/series/rtos", "/#/series/tbox", "/#/series/driver", "/#/series/growth"];
  const postUrls = posts.map((post) => `/#/posts/${post.slug}`);
  const urls = [...staticUrls, ...postUrls];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${siteUrl}${url}</loc>\n    <lastmod>${posts[0]?.updated || posts[0]?.date || "2026-05-27"}</lastmod>\n  </url>`)
    .join("\n")}\n</urlset>\n`;
}

function buildRss(posts) {
  const items = posts
    .map((post) => {
      const pubDate = new Date(post.date).toUTCString();
      return `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${siteUrl}/#/posts/${post.slug}</link>\n      <guid>${siteUrl}/#/posts/${post.slug}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${escapeXml(post.summary)}</description>\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>青山技术札记</title>\n    <link>${siteUrl}/</link>\n    <description>嵌入式工程师的 RTOS、驱动、TBOX、系统架构实战笔记。</description>\n    <language>zh-CN</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

function main() {
  const posts = readPosts();
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), buildSitemap(posts));
  fs.writeFileSync(path.join(publicDir, "rss.xml"), buildRss(posts));
  fs.writeFileSync(path.join(publicDir, "robots.txt"), buildRobots());
  console.log(`Generated feeds for ${posts.length} posts.`);
}

main();
