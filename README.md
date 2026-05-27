# 青山技术札记

嵌入式工程师的项目实战复盘博客。

当前版本：**V1.5.2 普通 Markdown 兼容版**。

## 定位

专注 RTOS / TBOX / 驱动 / 低功耗 / 系统架构，把真实项目调试经验沉淀为可复用方法。

## 已有能力

- Markdown 文章写作
- 自动扫描 `src/content/posts/*.md`
- 兼容带 Front Matter 的文章
- 兼容直接粘贴的普通 Markdown 长文
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

## 新增文章

推荐使用 Front Matter，但现在也支持直接粘贴普通 Markdown 长文。

推荐模板：

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
正文内容
```

## 发布更新

修改或新增文章后提交到 `main`，GitHub Actions 会自动发布到 `gh-pages` 分支。

访问地址：

```text
https://feng-code.github.io/feng-code/
```
