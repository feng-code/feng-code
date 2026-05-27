# 青山技术札记

嵌入式工程师的项目实战复盘博客。

当前版本：**V1.4 易写作版**。

## 定位

专注 RTOS / TBOX / 驱动 / 低功耗 / 系统架构，把真实项目调试经验沉淀为可复用方法。

## 已有能力

- Markdown 文章写作
- 自动扫描 `src/content/posts/*.md`
- 一键生成文章模板
- 精选文章
- 专题系列
- 推荐阅读路径
- 文章详情页
- 文章目录 TOC
- 代码块复制
- 文章归档
- 项目作品集
- 技术路线图
- About 页面
- RSS / Sitemap / robots 自动生成
- GitHub Pages 自动部署

## 本地运行

```bash
npm install
npm run dev
```

## 新增文章：推荐方式

运行：

```bash
npm run new:post -- "你的文章标题"
```

它会自动生成：

```text
src/content/posts/your-post-title.md
```

然后你只需要编辑这个 Markdown 文件即可。

## 新增文章：手动方式

也可以直接新增：

```text
src/content/posts/your-post-slug.md
```

不需要再修改 `src/content/posts.js`，系统会自动扫描 `posts` 目录下所有 `.md` 文件。

文章模板：

```md
---
slug: your-post-slug
title: 这里填写文章标题
date: 2026-05-27
updated: 2026-05-27
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
```

## 发布更新

修改或新增文章后：

```bash
git add .
git commit -m "content: add new post"
git push origin main
```

GitHub Actions 会自动：

```text
npm install
npm run build
生成 RSS / Sitemap / robots
发布到 gh-pages 分支
更新 GitHub Pages
```

## 构建

```bash
npm run build
```

构建前会自动执行：

```bash
node scripts/generate-feeds.js
```

自动生成：

```text
public/rss.xml
public/sitemap.xml
public/robots.txt
```

## 页面入口

```text
#/                  首页
#/archive           归档
#/about             关于
#/projects          项目作品集
#/roadmap           技术路线图
#/series/rtos       RTOS 专题
#/series/tbox       TBOX 专题
#/series/driver     驱动与协议专题
#/series/growth     成长专题
```

## 部署

仓库已配置 GitHub Actions：

```text
.github/workflows/deploy.yml
```

推送到 `main` 后自动构建，并发布到 `gh-pages` 分支。

GitHub Pages 设置：

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: / root
```

访问地址：

```text
https://feng-code.github.io/feng-code/
```
