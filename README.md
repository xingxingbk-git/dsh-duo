# dsh-duo

**dsh-duo** 是一个 DeepSeek Harness（DSH）插件项目：为现有 Harness 工作区增加 `CHAT | HARNESS` 模式切换。项目按 DSH 的 Cordis bundle + browser client plugin 结构搭建；当前是待构建验证的骨架，模式 UI、授权联动、聊天会话和账号历史同步尚未实现。

仓库：[xingxingbk-git/dsh-duo](https://github.com/xingxingbk-git/dsh-duo)。当前方案、进展与接力入口见 [AGENTS.md](AGENTS.md) 和 [docs/handoff.md](docs/handoff.md)。

## 已确认的登录规则

- 未登录或未获得有效 DeepSeek 账号授权：保持 HARNESS，整个切换控件置灰、禁用，HARNESS 原功能可继续使用。
- CHAT 中退出登录或官方确认授权失效：立即恢复 HARNESS 和此前工作区/面板，再禁用切换控件；不等待用户确认。
- 启动时授权未确认：默认 HARNESS 并禁用控件。首次确认/重新授权有效后启用控件，由用户主动进入 CHAT；同账号持续有效的状态刷新不改变当前模式。
- 不提供匿名 CHAT，不做匿名聊天登录合并，也不通过本地缓存或其它 API key 绕过账号门槛。

这是已经确认的产品规则，尚未实现。官方登录状态读取、订阅和撤销接口仍待核查；普通断网不能直接当作退出登录。有效账号授权也不代表网页对话历史接口已开放。

## 项目结构

```text
.
├── package.json           # dsh.bundle + dsh.client manifest
├── cordis.patch.yml       # 将 Host 插件插入 profile 的插件树
├── tsconfig.json
├── scripts/build.mjs      # Host TS + DSH lazy-CJS browser bundle
├── src/
│   ├── index.ts           # Cordis Host 半插件入口
│   └── client.ts          # Web Client 半插件入口
├── docs/
│   ├── requirements.md    # 需求与验收标准
│   ├── architecture.md    # 已确认扩展点、架构和风险
│   ├── roadmap.md         # 开发阶段
│   ├── references.md      # 官方资料与调研记录
│   ├── handoff.md         # 当前状态、验证结果与下一步接力
│   └── review-2026-10-09.md # 历史审查快照
└── AGENTS.md              # Codex / Agent 协作指南
```

## 构建

需要 Node.js / pnpm，以及与目标 DSH 版本兼容的 `@deepseek-ai/*` 包。已核对的安装目标为 **DSH 0.2.0-rc.2 / Cordis 4.0.4 / React 18.3.1**；不同设备必须重新核对版本。当前依赖仍使用 `*`、没有锁文件，首次完整构建前应先对齐依赖和 React/TSX 构建配置。

```bash
pnpm install
pnpm typecheck
pnpm build
```

预期构建输出 `lib/index.js`（Host plugin）及 `lib/client.js`（DSH 浏览器模块表使用的 lazy-CJS factory）。以上完整流程尚未执行；当前只通过构建脚本语法及 JSON 检查。安装/加载需按目标版本的[官方插件教程](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)使用独立开发 profile，桌面 GUI 路径仍待验证。

## 当前能力状态

- [x] DSH package manifest、bundle patch、Host 与 Client 双入口的项目结构。
- [x] 项目创建阶段的 Inspect 记录，以及 0.2.0-rc.2 官方源码/安装产物静态审查。
- [x] 登录授权门槛、退出自动回退及跨设备接力规范已写入文档。
- [ ] `CHAT | HARNESS` 切换控件与可逆模式状态。
- [ ] 官方授权状态读取/订阅、控件禁用及退出自动回退。
- [ ] Chat 导航、对话主面板和 Harness 右侧面板恢复。
- [ ] 授权门槛下的真实聊天数据源；mock 仅用于开发验证。
- [ ] DeepSeek 网页账号历史同步：仅在存在官方支持的第三方授权/API 后评估，不承诺抓取或私有接口方案。

## 需求与协作文档

- [需求与验收标准](docs/requirements.md)
- [架构与可行性](docs/architecture.md)
- [开发路线](docs/roadmap.md)
- [官方资料与参考](docs/references.md)
- [Codex / Agent 指南](AGENTS.md)
- [当前状态与接力记录](docs/handoff.md)

## 在另一台设备接力

```bash
git clone git@github.com:xingxingbk-git/dsh-duo.git
cd dsh-duo
git status
```

先读 `AGENTS.md` 和 `docs/handoff.md`，再读需求、架构与路线；核对本机 DSH 版本与 Inspect 工具，不依赖前一台设备的聊天记录或临时文件。已有 checkout 先 fetch，工作区干净时再快进更新。每个阶段同步实现、需求及接力记录，并通过正常提交/推送传递成果。

## 数据与安全原则

不读取浏览器 Cookie、不保存用户密码/令牌、不调用未公开的网页版接口，也不把本地对话误称为 DeepSeek 网页账号历史。详见 [需求规格](docs/requirements.md) 和 [架构说明](docs/architecture.md)。
