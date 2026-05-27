import React, { useEffect, useMemo, useState } from "react";

const iconMap = {
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z",
  calendar: "M7 2v4 M17 2v4 M3 10h18 M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  chevronRight: "M9 18l6-6-6-6",
  github: "M9 19c-5 1.5-5-2.5-7-3 M15 22v-3.5c0-1 .2-1.7-.5-2 3.2-.4 6.5-1.6 6.5-7A5.4 5.4 0 0 0 19.5 5 5 0 0 0 19.4 1s-1.3-.4-4.4 1.6a15.4 15.4 0 0 0-8 0C3.9.6 2.6 1 2.6 1a5 5 0 0 0-.1 4A5.4 5.4 0 0 0 1 9.5c0 5.4 3.3 6.6 6.5 7-.4.2-.7.7-.8 1.3-.7.3-2.5.8-3.7-1",
  layers: "M12 2l10 5-10 5L2 7l10-5z M2 12l10 5 10-5 M2 17l10 5 10-5",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
  pen: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  search: "M21 21l-4.3-4.3 M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z",
  sparkles: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z M5 3v4 M3 5h4 M19 17v4 M17 19h4",
  sun: "M12 4V2 M12 22v-2 M4.9 4.9 3.5 3.5 M20.5 20.5l-1.4-1.4 M4 12H2 M22 12h-2 M4.9 19.1l-1.4 1.4 M20.5 3.5l-1.4 1.4 M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z M7.5 7.5h.01",
};

const themes = [
  { id: "light", name: "清雅白", icon: "sun", vars: { "--bg": "#f8fafc", "--panel": "#ffffff", "--soft": "#f1f5f9", "--text": "#0f172a", "--muted": "#64748b", "--line": "#e2e8f0", "--accent": "#2563eb", "--accent-soft": "#dbeafe", "--shadow": "0 22px 55px rgba(15, 23, 42, 0.08)" } },
  { id: "ink", name: "墨黑夜读", icon: "moon", vars: { "--bg": "#09090b", "--panel": "#18181b", "--soft": "#27272a", "--text": "#fafafa", "--muted": "#a1a1aa", "--line": "#3f3f46", "--accent": "#a78bfa", "--accent-soft": "#2e1065", "--shadow": "0 22px 55px rgba(0, 0, 0, 0.35)" } },
  { id: "paper", name: "暖纸笔记", icon: "book", vars: { "--bg": "#fbf3e4", "--panel": "#fffaf0", "--soft": "#f7e8c8", "--text": "#342313", "--muted": "#8a6a43", "--line": "#ead7b7", "--accent": "#b45309", "--accent-soft": "#fed7aa", "--shadow": "0 22px 55px rgba(120, 53, 15, 0.12)" } },
  { id: "terminal", name: "终端青", icon: "layers", vars: { "--bg": "#061014", "--panel": "#0b1f26", "--soft": "#10323b", "--text": "#e6fffb", "--muted": "#8dd9d2", "--line": "#164e58", "--accent": "#22d3ee", "--accent-soft": "#083344", "--shadow": "0 22px 55px rgba(0, 0, 0, 0.38)" } },
];

const posts = [
  { title: "RTOS 多任务设计：事件、队列、状态机如何分层", date: "2026-05-27", category: "嵌入式架构", tags: ["RTOS", "ThreadX", "状态机"], minutes: 12, summary: "从输入源、实时性、阻塞点、共享资源四个维度，拆解一个稳定 RTOS 业务框架的设计方法。", content: "优秀的 RTOS 项目不是功能来一个任务开一个，而是先识别输入源，再定义事件边界，最后让状态机负责业务阶段切换。队列用于传递数据，事件用于通知，状态机用于管理阶段。" },
  { title: "TBOX 低功耗链路复盘：唤醒信号不等于系统唤醒", date: "2026-05-22", category: "TBOX 实战", tags: ["TBOX", "低功耗", "WAKEUP_OUT"], minutes: 9, summary: "把系统休眠、外设唤醒、总线使能、协议执行、云端上报拆成独立链路，避免误判。", content: "WAKEUP_OUT 只能说明外设侧被拉醒或保持，不能直接证明主系统已经退出低功耗。工程上要分层验证：系统状态、模块状态、总线状态、协议状态、上报状态。" },
  { title: "UART DMA + IDLE 接收：为什么协议层还需要流式解析", date: "2026-05-18", category: "驱动开发", tags: ["UART", "DMA", "协议解析"], minutes: 10, summary: "DMA/IDLE 只负责搬运字节，不负责保证一帧完整。协议层必须处理半包、粘包、错包。", content: "DMA 空闲中断只能告诉你一段时间内没有新字节到达，不能保证这一批数据就是完整帧。因此协议解析应采用固定头、长度、校验、状态机的流式模型。" },
  { title: "源码阅读方法：先抓结构体，再看谁赋值、谁读取", date: "2026-05-12", category: "学习方法", tags: ["源码阅读", "工程能力", "方法论"], minutes: 7, summary: "读源码不要只看接口名，先找核心结构体和调用链，再结合日志验证真实语义。", content: "变量名和函数名只能作为线索，不能直接当真实语义。真正可靠的是：谁初始化、谁赋值、谁读取、在哪条调用链生效，以及运行日志是否能验证。" },
];

const writingTemplate = `---
title: "这里填写文章标题"
date: "2026-05-27"
category: "嵌入式实战"
tags: ["RTOS", "调试", "状态机"]
summary: "一句话说明这篇文章解决什么问题。"
---

# 结论

先给出核心判断。

# 背景

说明项目场景、问题现象、版本、复现条件。

# 原因分析

区分事实、推断、假设。

# 最小修改方案

说明改哪里、为什么、影响范围。

# 验证方法

列出日志、测试用例、通过标准。

# 风险与复盘

沉淀经验，避免下次重复踩坑。
`;

const styles = `
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}button,input{font:inherit}button{cursor:pointer}.blog-app{min-height:100vh;background:var(--bg);color:var(--text);transition:background .25s ease,color .25s ease}.container{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:24px 0 36px}.nav{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px;border:1px solid var(--line);border-radius:28px;background:var(--panel);box-shadow:var(--shadow);position:sticky;top:14px;z-index:10}.brand{display:flex;align-items:center;gap:12px}.logo{width:46px;height:46px;display:grid;place-items:center;border-radius:18px;color:var(--accent);background:var(--accent-soft);flex:0 0 auto}.brand-title{margin:0;font-size:18px;font-weight:800;letter-spacing:-.02em}.brand-subtitle{margin:3px 0 0;color:var(--muted);font-size:13px}.theme-list{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.theme-btn,.pill-btn,.primary-btn,.secondary-btn,.tag-btn{border:0;border-radius:999px;transition:transform .18s ease,border-color .18s ease,opacity .18s ease,background .18s ease}.theme-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid var(--line);background:var(--soft);color:var(--muted);font-size:13px}.theme-btn.active{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);font-weight:700}.theme-btn:hover,.pill-btn:hover,.tag-btn:hover,.secondary-btn:hover{transform:translateY(-1px);border-color:var(--accent)}.hero-grid{display:grid;grid-template-columns:1.12fr .88fr;gap:22px;padding:30px 0 22px}.card{border:1px solid var(--line);border-radius:32px;background:var(--panel);box-shadow:var(--shadow)}.hero-card{padding:38px;animation:rise .48s ease both}.badge{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:14px;font-weight:700}h1{max-width:760px;margin:22px 0 0;font-size:clamp(36px,6vw,66px);line-height:1.03;letter-spacing:-.06em}.hero-desc{max-width:720px;margin:22px 0 0;color:var(--muted);font-size:17px;line-height:1.9}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.primary-btn{padding:13px 19px;background:var(--accent);color:white;font-weight:800;box-shadow:0 14px 30px rgba(37,99,235,.16)}.secondary-btn{padding:12px 18px;border:1px solid var(--line);background:var(--soft);color:var(--text);font-weight:800;text-decoration:none}.workbench{padding:26px;animation:rise .48s .08s ease both}.card-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.card-title-row h2,.side-card h3{margin:0}.small-badge{padding:6px 10px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:12px}.workflow{display:grid;gap:12px}.workflow-item{padding:15px;border-radius:20px;background:var(--soft)}.workflow-item strong{display:block;margin-bottom:6px}.workflow-item span{color:var(--muted);font-size:14px;line-height:1.65}.content-grid{display:grid;grid-template-columns:330px 1fr;gap:22px}.sidebar{display:grid;align-content:start;gap:16px}.side-card{padding:20px}.search-box{display:flex;align-items:center;gap:9px;padding:12px 14px;border-radius:18px;background:var(--soft);color:var(--muted)}.search-box input{width:100%;border:0;outline:0;background:transparent;color:var(--text)}.filter-list,.tag-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.pill-btn{padding:9px 12px;background:var(--soft);color:var(--muted);font-size:13px;border:1px solid transparent}.pill-btn.active{background:var(--accent);color:#fff;font-weight:800}.tag-btn{padding:8px 11px;border:1px solid var(--line);background:transparent;color:var(--muted);font-size:13px}.deploy-list{margin:12px 0 0;padding-left:20px;color:var(--muted);font-size:14px;line-height:1.9}.main-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.92fr);gap:22px}.post-list{display:grid;align-content:start;gap:14px}.post-card{text-align:left;width:100%;padding:20px;border:1px solid var(--line);border-radius:26px;background:var(--panel);color:var(--text);box-shadow:var(--shadow)}.post-card.active{border-color:var(--accent);background:var(--accent-soft)}.post-card:hover{transform:translateY(-2px);border-color:var(--accent)}.post-meta{display:flex;flex-wrap:wrap;gap:12px;align-items:center;color:var(--muted);font-size:12px}.post-card h2{margin:12px 0 0;font-size:20px;line-height:1.35}.post-card p{margin:12px 0 0;color:var(--muted);line-height:1.75;font-size:14px}.post-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.post-tags span{padding:6px 10px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:12px}.preview-card{padding:26px;position:sticky;top:112px;align-self:start}.preview-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.category{padding:8px 12px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:800;font-size:13px}.preview-card h2{margin:0;font-size:clamp(26px,3.2vw,36px);line-height:1.18;letter-spacing:-.04em}.preview-meta{color:var(--muted);font-size:14px;margin:14px 0 0}.preview-content{margin-top:22px;padding:20px;border-radius:24px;background:var(--soft);line-height:1.95}.empty{padding:24px;color:var(--muted);line-height:1.8}.footer{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:28px;padding:18px 20px;color:var(--muted);font-size:14px}.footer-right{display:flex;align-items:center;gap:8px}.toast{position:fixed;right:20px;bottom:20px;padding:13px 16px;border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--text);box-shadow:var(--shadow);z-index:30}@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@media(max-width:980px){.nav,.footer{align-items:flex-start;flex-direction:column}.theme-list{justify-content:flex-start}.hero-grid,.content-grid,.main-grid{grid-template-columns:1fr}.preview-card{position:static}}@media(max-width:560px){.container{width:min(100% - 20px,1180px);padding-top:12px}.hero-card{padding:26px}.workbench,.preview-card,.side-card{padding:18px}h1{letter-spacing:-.04em}}
`;

function Icon({ name, size = 18, className = "" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={iconMap[name] || iconMap.book} /></svg>;
}
function getCategories(postList) { return ["全部", ...Array.from(new Set(postList.map((post) => post.category)))]; }
function getAllTags(postList) { return Array.from(new Set(postList.flatMap((post) => post.tags))); }
function filterPosts(postList, query, activeCategory) { const keyword = query.trim().toLowerCase(); return postList.filter((post) => { const matchCategory = activeCategory === "全部" || post.category === activeCategory; const haystack = [post.title, post.summary, post.category, ...post.tags].join(" ").toLowerCase(); return matchCategory && (!keyword || haystack.includes(keyword)); }); }
function createSlug(title) { return title.trim().toLowerCase().replace(/[：:，,。./\\\s]+/g, "-").replace(/^-+|-+$/g, ""); }
function runSmokeTests() { console.assert(posts.length > 0, "Blog should contain at least one post."); console.assert(themes.length >= 2, "Blog should contain at least two themes."); console.assert(getCategories(posts).includes("嵌入式架构"), "Categories should include post categories."); console.assert(getAllTags(posts).includes("RTOS"), "Tags should include post tags."); console.assert(filterPosts(posts, "ThreadX", "全部").length === 1, "Search should match post tags."); console.assert(filterPosts(posts, "", "驱动开发").length === 1, "Category filter should work."); console.assert(filterPosts(posts, "不存在的关键词", "全部").length === 0, "Search should support empty result."); }
if (typeof window !== "undefined") runSmokeTests();
function getInitialThemeId() { if (typeof window === "undefined") return "light"; const saved = window.localStorage.getItem("blog-theme-id"); return themes.some((theme) => theme.id === saved) ? saved : "light"; }

function BlogApp() {
  const [themeId, setThemeId] = useState(getInitialThemeId);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [selectedPost, setSelectedPost] = useState(posts[0]);
  const [toast, setToast] = useState("");
  const theme = themes.find((item) => item.id === themeId) || themes[0];
  const categories = useMemo(() => getCategories(posts), []);
  const allTags = useMemo(() => getAllTags(posts), []);
  const filteredPosts = useMemo(() => filterPosts(posts, query, activeCategory), [query, activeCategory]);
  const previewPost = filteredPosts.some((post) => post.title === selectedPost.title) ? selectedPost : filteredPosts[0] || selectedPost;
  useEffect(() => { window.localStorage.setItem("blog-theme-id", themeId); }, [themeId]);
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timer); }, [toast]);
  async function copyTemplate() { try { await navigator.clipboard.writeText(writingTemplate); setToast("Markdown 写作模板已复制"); } catch { setToast("当前浏览器不支持自动复制，可在代码中查看 writingTemplate"); } }
  return <main className="blog-app" style={theme.vars}><style>{styles}</style><div className="container"><nav className="nav"><div className="brand"><div className="logo"><Icon name="pen" size={22}/></div><div><p className="brand-title">青山技术札记</p><p className="brand-subtitle">Embedded · Architecture · Notes</p></div></div><div className="theme-list" aria-label="主题切换">{themes.map((item)=><button key={item.id} type="button" onClick={()=>setThemeId(item.id)} className={`theme-btn ${item.id===themeId?"active":""}`} aria-pressed={item.id===themeId}><Icon name={item.icon} size={15}/>{item.name}</button>)}</div></nav><section className="hero-grid"><div className="card hero-card"><div className="badge"><Icon name="sparkles" size={16}/>写技术、做复盘、沉淀工程能力</div><h1>把调试经验，沉淀成可复用的工程知识库。</h1><p className="hero-desc">一个适合嵌入式工程师的个人博客：首页简洁、主题可切换、文章按专题组织。当前版本是纯 React + 内置 CSS，适合直接放进 Vite 项目并部署到 GitHub Pages。</p><div className="hero-actions"><button type="button" className="primary-btn" onClick={copyTemplate}>复制写作模板</button><a className="secondary-btn" href="#posts">查看专题索引</a></div></div><aside className="card workbench"><div className="card-title-row"><h2>写作工作台</h2><span className="small-badge">GitHub Pages Ready</span></div><div className="workflow">{[["问题背景","现象、环境、版本、复现条件"],["根因分析","事实 / 推断 / 假设分开写"],["最小修改","改动点、影响范围、副作用"],["验证闭环","日志、用例、回归测试、结论"]].map(([title,desc])=><div key={title} className="workflow-item"><strong>{title}</strong><span>{desc}</span></div>)}</div></aside></section><section className="content-grid" id="posts"><aside className="sidebar"><div className="card side-card"><label className="search-box"><Icon name="search" size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="搜索文章、标签、专题..."/></label><div className="filter-list">{categories.map((category)=><button key={category} type="button" onClick={()=>setActiveCategory(category)} className={`pill-btn ${activeCategory===category?"active":""}`}>{category}</button>)}</div></div><div className="card side-card"><h3><Icon name="tag" size={18}/> 热门标签</h3><div className="tag-list">{allTags.map((tag)=><button key={tag} type="button" onClick={()=>setQuery(tag)} className="tag-btn">#{tag}</button>)}</div></div><div className="card side-card"><h3>部署检查项</h3><ol className="deploy-list"><li>Vite 项目中放入 App.jsx。</li><li>vite.config.js 配置 GitHub Pages base。</li><li>GitHub Actions 执行 npm run build。</li><li>Pages Source 选择 GitHub Actions。</li></ol></div></aside><div className="main-grid"><section className="post-list">{filteredPosts.length===0?<div className="card empty">没有匹配到文章。可以清空搜索关键词，或者切换到“全部”分类。</div>:filteredPosts.map((post)=><button key={createSlug(post.title)} type="button" onClick={()=>setSelectedPost(post)} className={`post-card ${previewPost.title===post.title?"active":""}`}><div className="post-meta"><span><Icon name="calendar" size={14}/> {post.date}</span><span>{post.minutes} min read</span></div><h2>{post.title}</h2><p>{post.summary}</p><div className="post-tags">{post.tags.map((tag)=><span key={tag}>#{tag}</span>)}</div></button>)}</section><article className="card preview-card"><div className="preview-head"><span className="category">{previewPost.category}</span><Icon name="chevronRight" size={20}/></div><h2>{previewPost.title}</h2><p className="preview-meta">{previewPost.date} · {previewPost.minutes} 分钟阅读 · /posts/{createSlug(previewPost.title)}</p><div className="preview-content">{previewPost.content}</div><div className="post-tags">{previewPost.tags.map((tag)=><span key={tag}>#{tag}</span>)}</div></article></div></section><footer className="card footer"><span>© 2026 青山技术札记 · 用文章记录工程判断和成长路径</span><span className="footer-right"><Icon name="github" size={17}/> GitHub Pages / RSS / About</span></footer></div>{toast?<div className="toast" role="status">{toast}</div>:null}</main>;
}

export default BlogApp;
