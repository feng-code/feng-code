import rtosTaskDesign from "./posts/rtos-task-design.md?raw";
import tboxLowPowerChain from "./posts/tbox-low-power-chain.md?raw";
import uartDmaIdleParser from "./posts/uart-dma-idle-parser.md?raw";
import sourceReadingMethod from "./posts/source-reading-method.md?raw";

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

export const postSources = [
  rtosTaskDesign,
  tboxLowPowerChain,
  uartDmaIdleParser,
  sourceReadingMethod,
];

export const posts = postSources
  .map(parseMarkdownPost)
  .sort((a, b) => new Date(b.date) - new Date(a.date));
