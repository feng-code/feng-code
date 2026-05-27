import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://feng-code.github.io/feng-code";
const postsDir = path.resolve("src/content/posts");
const publicDir = path.resolve("public");
const requiredFields = ["slug", "title", "date", "updated", "category", "series", "quality", "tags", "minutes", "summary"];

function normalizeMarkdown(markdown) {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
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

function parseMeta(markdown, filePath) {
  const normalized = normalizeMarkdown(markdown).trim();
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`Missing or invalid front matter: ${filePath}\nExpected file to start with:\n---\nslug: your-slug\n...\n---`);
  }

  const meta = {};
  match[1].split("\n").forEach((line, index) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    if (idx <= 0) {
      throw new Error(`Invalid front matter line ${index + 2} in ${filePath}: ${line}`);
    }
    meta[line.slice(0, idx).trim()] = parseFrontMatterValue(line.slice(idx + 1));
  });

  for (const field of requiredFields) {
    if (meta[field] === undefined || meta[field] === "" || (Array.isArray(meta[field]) && meta[field].length === 0)) {
      throw new Error(`Markdown front matter missing required field "${field}": ${filePath}`);
    }
  }

  if (!Array.isArray(meta.tags)) {
    throw new Error(`Markdown front matter field "tags" must be an array like [RTOS, 调试]: ${filePath}`);
  }

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
  if (!fs.existsSync(postsDir)) {
    throw new Error(`Posts directory not found: ${postsDir}`);
  }

  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No markdown posts found in ${postsDir}`);
  }

  return files
    .map((file) => {
      const filePath = path.join(postsDir, file);
      const markdown = fs.readFileSync(filePath, "utf-8");
      return parseMeta(markdown, filePath);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function buildSitemap(posts) {
  const staticUrls = ["/", "/write/", "/#/archive", "/#/about", "/#/projects", "/#/roadmap", "/#/series/rtos", "/#/series/tbox", "/#/series/driver", "/#/series/growth"];
  const postUrls = posts.map((post) => `/#/posts/${post.slug}`);
  const urls = [...staticUrls, ...postUrls];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${siteUrl}${url}</loc>\n    <lastmod>${posts[0]?.updated || posts[0]?.date}</lastmod>\n  </url>`)
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
  try {
    const posts = readPosts();
    fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, "sitemap.xml"), buildSitemap(posts));
    fs.writeFileSync(path.join(publicDir, "rss.xml"), buildRss(posts));
    fs.writeFileSync(path.join(publicDir, "robots.txt"), buildRobots());
    console.log(`Generated feeds for ${posts.length} posts.`);
  } catch (error) {
    console.error("\n[generate-feeds] Markdown validation failed.");
    console.error(error.message);
    console.error("\nFix the Markdown file above, then commit again.\n");
    process.exit(1);
  }
}

main();
