# 青山技术札记

一个适合嵌入式工程师的个人技术博客首页。

## 功能

- 多主题切换
- 文章搜索
- 分类筛选
- 标签筛选
- 文章预览
- Markdown 写作模板复制
- GitHub Pages 自动部署

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 部署

本仓库已配置 GitHub Actions：

```text
.github/workflows/deploy.yml
```

进入仓库 Settings -> Pages，将 Source 设置为 GitHub Actions。

部署完成后访问：

```text
https://feng-code.github.io/feng-code/
```

## 后续演进

当前文章数据在 `src/App.jsx` 的 `posts` 数组中。后续可以升级为 Markdown/MDX 文件驱动。
