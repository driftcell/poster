# Poster 邮局

一个以电子邮件为入口的公开信箱。任何人给 `poster@driftcell.dev` 发邮件，经 AI 审核后公开展示；读者可以用每封信专属的子地址回信，并通过 Atom 订阅。

线上地址：<https://poster.driftcell.dev>

## 工作原理

```
邮件 ──► Email Routing (catch-all) ──► email() handler ──► R2（原始 MIME）
                                          │                    │
                                          └────► Queue ◄───────┘
                                                    │
                                                    ▼
                                          queue() consumer：
                                          postal-mime 解析
                                          → 发件人 HMAC-SHA256（加盐）
                                          → DeepSeek 自动审核
                                          → D1
                                                    │
                          ┌─────────────────────────┼──────────────────┐
                          ▼                         ▼                  ▼
                    /admin 人工后台           公开展示页            Atom 订阅
                 （Cloudflare Access）    （含回信地址）       （信件/回信）
```

- **email() handler 只做毫秒级操作**（存 R2、投 Queue）：email 事件没有重试，失败即退信，重活全部异步
- **Queue 消费端**：重试 3 次后进死信队列；用 RFC Message-ID 去重
- **AI 审核**（deepseek-v4-flash）：只自动通过、永不自动拒绝；API 异常回退人工
- **公开待审核区**（`/pending`）：排队中的信件/回信对外可见，标题与正文在服务端打码（`redact`，只留标点和形状），原文不下发
- **回信**：信件和每条回信都有 `poster+<token>@` 地址（token = HMAC(id, salt)），支持回复回信（楼层引用）
- **SEO**：sitemap.xml、OG/JSON-LD、公开页面 `cache-control` 触发边缘缓存（adapter 内置 Cache API），审核动作主动清缓存

## 技术栈

SvelteKit 2 + Svelte 5 · @sveltejs/adapter-cloudflare · Cloudflare Workers / D1 / R2 / Queues / Email Routing / Access · DeepSeek API

## 目录结构

```
src/routes/          站点页面（首页、信件详情、/pending 公开待审核区、/admin 审核后台、atom.xml、sitemap.xml、附件服务）
src/lib/server/      D1 查询、Atom 生成、缓存清除
src/lib/             共享类型与工具（假名、文本、时间）
worker/              自定义 Worker 入口（包装 adapter 产物，追加 email/queue handler）
migrations/          D1 数据库迁移
tests/               Vitest 单元测试
```

## 开发

```sh
pnpm install
pnpm dev          # vite dev，platformProxy 本地模拟 D1/R2/Queue
pnpm check        # svelte-kit sync + svelte-check
pnpm lint         # prettier + eslint
pnpm test         # vitest
```

push 到 GitHub 后：Actions 跑 check/lint/test/build，Cloudflare Workers Builds 自动部署。

本地密钥放 `.dev.vars`（已 gitignore）。

## 构建与部署

```sh
pnpm build        # vite build，adapter 产物写入 .svelte-kit/cloudflare
pnpm run deploy   # wrangler deploy（注意是 pnpm run deploy，pnpm deploy 是 pnpm 内建命令）
```

仓库里有两个 wrangler 配置，职责不同：

| 文件                     | 用途                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `wrangler.jsonc`         | 部署/开发用：`main = worker/index.ts`，含 D1/R2/Queue 全部绑定                                      |
| `wrangler.adapter.jsonc` | 仅构建时给 adapter 用（adapter 会覆盖其 `main` 指向的文件，即 `.svelte-kit/cloudflare/_worker.js`） |

生产 secrets 通过 `wrangler secret put` 设置：`HASH_SALT`（发件人哈希盐）、`ADMIN_EMAIL`（Access 白名单）、`DEEPSEEK_API_KEY`。

D1 迁移：`pnpm exec wrangler d1 migrations apply poster-db --remote`（本地加 `--local`）。
