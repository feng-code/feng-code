import fs from "node:fs";
import path from "node:path";

const postsDir = path.resolve("src/content/posts");
const requiredFields = ["slug", "title", "date", "updated", "category", "series", "quality", "tags", "minutes", "summary"];

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

function parseFrontMatter(markdown, filePath) {
  const match = normalize(markdown).match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {
      ok: true,
      warning: `${filePath} has no front matter. It will use fallback metadata, but standard front matter is recommended.`,
      meta: null,
    };
  }

  const meta = {};
  match[1].split("\n").forEach((line, index) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    if (idx <= 0) {
      throw new Error(`Invalid front matter line ${index + 2}: ${filePath}\n${line}`);
    }
    meta[line.slice(0, idx).trim()] = parseValue(line.slice(idx + 1));
  });

  for (const field of requiredFields) {
    if (meta[field] === undefined || meta[field] === "" || (Array.isArray(meta[field]) && meta[field].length === 0)) {
      throw new Error(`Missing required field "${field}": ${filePath}`);
    }
  }

  if (!Array.isArray(meta.tags)) {
    throw new Error(`Field "tags" must be an array like [RTOS, 调试]: ${filePath}`);
  }

  return { ok: true, warning: null, meta };
}

function main() {
  const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md")).sort();
  const slugs = new Map();
  const warnings = [];

  if (files.length === 0) {
    throw new Error(`No markdown posts found in ${postsDir}`);
  }

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const markdown = fs.readFileSync(filePath, "utf-8");
    const result = parseFrontMatter(markdown, filePath);
    if (result.warning) warnings.push(result.warning);

    if (result.meta?.slug) {
      if (slugs.has(result.meta.slug)) {
        throw new Error(`Duplicate slug "${result.meta.slug}":\n- ${slugs.get(result.meta.slug)}\n- ${filePath}`);
      }
      slugs.set(result.meta.slug, filePath);
    }
  }

  warnings.forEach((warning) => console.warn(`[validate-posts] ${warning}`));
  console.log(`Validated ${files.length} markdown posts.`);
}

try {
  main();
} catch (error) {
  console.error("\n[validate-posts] Validation failed.");
  console.error(error.message);
  console.error("\nFix the markdown file above, then commit again.\n");
  process.exit(1);
}
