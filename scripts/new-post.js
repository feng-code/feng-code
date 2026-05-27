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

const args = process.argv.slice(2);
const typeArgIndex = args.findIndex((arg) => arg.startsWith("--type="));
const type = typeArgIndex >= 0 ? args[typeArgIndex].replace("--type=", "") : "debug";
const title = args.filter((_, index) => index !== typeArgIndex).join(" ").trim();

const templateMap = {
  debug: {
    category: "嵌入式实战",
    series: "tbox",
    quality: "复盘",
    tags: "[调试, 复盘, 最小闭环]",
    audience: "[正在定位类似问题的人, 想学习工程化排查方法的人]",
    takeaways: "[现象到根因的分析链路, 最小修改和验证闭环]",
    body: `## 结论
先给出核心判断：更可能是哪一层的问题，以及最小处理方向。

## 背景
说明项目场景、问题现象、版本、复现条件。

## 已知事实
只写已经被源码、日志、报文或实验确认的信息。

## 最高优先级假设
列出 1~3 个最可能原因，并说明为什么优先验证它们。

## 插桩点
说明要加哪些日志，观察哪些变量、状态、报文、时序。

## 根因
说明最终确认的根因，以及证据是什么。

## 最小修改方案
说明改哪里、为什么、影响范围。

## 验证方法
列出日志、测试用例、通过标准。

## 风险与复盘
沉淀经验，避免下次重复踩坑。`,
  },
  source: {
    category: "源码阅读",
    series: "growth",
    quality: "源码",
    tags: "[源码阅读, 调用链, 工程能力]",
    audience: "[想提升源码阅读效率的人, 容易被接口名误导的人]",
    takeaways: "[结构体优先阅读法, 谁赋值谁读取追踪法]",
    body: `## 结论
先说明这个模块解决什么问题，以及阅读源码时最核心的抓手是什么。

## 关键结构体 / 宏 / 函数
贴出最关键的定义，保留原始名称。

## 字段和参数解释
逐项解释字段、参数、返回值的真实作用。

## 初始化链路
说明谁初始化、谁赋值、在哪个阶段生效。

## 调用链
按调用顺序说明谁调用谁、关键分支在哪里。

## 谁读取 / 谁修改
追踪关键字段的读写点，避免只看名称猜语义。

## 工程意义
说明这种设计的好处、代价和适用场景。

## 调试方法
说明如何用日志、断点、搜索、实验验证理解是否正确。`,
  },
  arch: {
    category: "系统架构",
    series: "rtos",
    quality: "架构",
    tags: "[架构设计, RTOS, 模块边界]",
    audience: "[正在做模块拆分的人, 想提升系统设计能力的人]",
    takeaways: "[边界划分方法, 方案取舍和风险控制]",
    body: `## 结论
先给推荐方案，并说明为什么它是当前约束下的更优解。

## 目标
说明这个架构要解决的问题和成功标准。

## 边界和约束
说明硬件、RTOS、协议、功耗、存储、时序、维护成本等约束。

## 输入源和输出链路
列出输入事件、数据流、控制流和输出动作。

## 模块划分
说明每个模块的职责、边界、依赖和禁止事项。

## 状态机 / 队列 / 事件设计
说明哪些用状态机，哪些用队列，哪些用事件通知。

## 关键风险
分析并发、阻塞、队列满、事件丢失、重入、异常恢复等风险。

## 推荐方案
给出最小可落地方案，避免过度设计。

## 验证和演进
说明如何验证，以及后续如何逐步演进。`,
  },
  tutorial: {
    category: "学习教程",
    series: "growth",
    quality: "教程",
    tags: "[教程, 学习路线, 工程实践]",
    audience: "[正在入门这个主题的人, 想系统学习的人]",
    takeaways: "[知识框架, 示例和常见坑]",
    body: `## 结论
先说明这个主题的核心价值，以及学习它要抓住哪条主线。

## 问题背景
说明为什么需要学习这个知识点，它解决什么工程问题。

## 层级框架
从硬件、驱动、RTOS、协议、应用等层级建立整体图景。

## 核心机制
解释最关键的机制和运行原理。

## 链路 / 时序
用步骤描述完整链路，说明关键状态变化。

## 关键结构 / 接口 / 函数
列出实际工程中最常见的结构和接口。

## 示例
给出一个最小可运行或最小可理解示例。

## 常见坑
列出容易误解或踩坑的地方。

## 调试方法
说明如何验证、如何定位、如何复盘。`,
  },
};

if (!title) {
  console.error("Usage: npm run new:post -- \"文章标题\" --type=debug|source|arch|tutorial");
  process.exit(1);
}

const template = templateMap[type] || templateMap.debug;
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
category: ${template.category}
series: ${template.series}
quality: ${template.quality}
tags: ${template.tags}
minutes: 8
featured: false
audience: ${template.audience}
takeaways: ${template.takeaways}
summary: 一句话说明这篇文章解决什么问题。
---

${template.body}
`;

fs.mkdirSync(postsDir, { recursive: true });
fs.writeFileSync(filePath, content, "utf-8");
console.log(`Created: ${filePath}`);
console.log(`Template type: ${type}`);
