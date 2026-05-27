import fs from "node:fs";
import path from "node:path";

function pad(num) {
  return String(num).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toSlug(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[：:，,。.!！?？/\\\s]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const title = process.argv.slice(2).join(" ").trim();

if (!title) {
  console.error("Usage: npm run new:post -- \"文章标题\"");
  process.exit(1);
}

const slug = toSlug(title) || `post-${Date.now()}`;
const date = today();
const postsDir = path.resolve("src/content/posts");
const filePath = path.join(postsDir, `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`Post already exists: ${filePath}`);
  process.exit(1);
}

const content = `---
slug: ${slug}
title: ${title}
date: ${date}
updated: ${date}
category: 嵌入式实战
series: tbox
quality: 复盘
tags: [RTOS, 调试, 状态机]
minutes: 8
featured: false
audience: [适合阅读的人群]
takeaways: [读完能得到什么]
summary: 一句话说明这篇文章解决什么问题。
---

## 结论
先给出核心判断。

## 背景
说明项目场景、问题现象、版本、复现条件。

## 已知事实
只写已经被源码、日志、报文或实验确认的信息。

## 原因分析
区分事实、推断、假设。

## 最小修改方案
说明改哪里、为什么、影响范围。

## 验证方法
列出日志、测试用例、通过标准。

## 风险与复盘
沉淀经验，避免下次重复踩坑。
`;

fs.mkdirSync(postsDir, { recursive: true });
fs.writeFileSync(filePath, content, "utf-8");
console.log(`Created: ${filePath}`);
