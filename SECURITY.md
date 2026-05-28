# Security Policy

本项目是一个托管在 GitHub Pages 上的个人技术博客，主要用于发布嵌入式、RTOS、TBOX、驱动开发和工程复盘类文章。

## 站点安全边界

当前站点具备以下特征：

- 不提供用户登录。
- 不收集用户密码。
- 不收集手机号。
- 不收集银行卡或信用卡信息。
- 不提供软件下载诱导。
- 不包含广告脚本。
- 不包含第三方统计脚本。
- 不包含外部 iframe。
- 不主动跳转到第三方站点。
- 静态资源由本仓库构建并通过 GitHub Pages 发布。

## 已采取的安全措施

- 启用 Content Security Policy，默认只允许加载本站资源。
- 禁止 `object-src`。
- 禁止外部表单提交。
- 禁止被第三方页面嵌入。
- 对搜索结果、课程路径、工程复盘卡片中的动态内容进行 HTML 转义。
- 构建前执行 Markdown 文章校验、RSS/Sitemap 生成和搜索索引生成。

## 构建与发布

站点通过 GitHub Actions 构建并发布到 GitHub Pages。

推荐本地检查命令：

```bash
npm run check
```

该命令会执行：

```bash
npm run validate:posts
npm run generate:feeds
npm run generate:search
npm run build
```

## 报告安全问题

如果你发现任何可疑行为或安全问题，请通过 GitHub Issue 或 Pull Request 反馈。

请勿在公开 issue 中提交敏感信息。
