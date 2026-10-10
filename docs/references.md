# 官方资料与调研记录

实际开发以 DeepSeek Harness 官方文档和目标安装版本为准。本文件区分项目创建阶段记录、2026-10-09 静态复核和用户确认的产品决策，不将不同设备/工具的证据混写成同一次 live 验证。

## 当前验证基线（2026-10-09）

本轮新增实现依据：用户要求实际官网数据，采用 Desktop Browser 嵌入候选路线，详情见 architecture/requirements。旧创建阶段摘要及历史模型 API 资料不构成独立本地聊天的数据源许可。

- 本次 macOS 安装包：DSH **0.2.0-rc.2**，Cordis **4.0.4**，浏览器共享 React **18.3.1**；UI renderer/layout/sidebar/conversation 包 **0.2.0-rc.2**。这是安装产物证据，不是对所有设备的版本承诺。
- 官方 tag：`dsh-v0.2.0-rc.2`；commit：`639ed015397290b3745d163aafe02ffee4aa3f84`。不同版本先重新核查契约。
- 官方入门、打包、Client Modules、Slots、Web Client、Sidebar/Layout/右栏正文已读取；初始环境曾只获得检索摘要，不再代表当前文档读取状态。
- 本次 Codex 工具中没有 Cordis Inspect；下面的 live 查询是项目创建阶段的记录。本次复核用官方固定版本源码及安装产物，未调用业务接口、未热加载插件。
- 产品规则已由用户确认：未登录/未授权禁用整个切换控件并保持 HARNESS；CHAT 登出立即回 HARNESS，然后禁用控件；不提供匿名聊天或匿名迁移。此规则不证明官方授权事件与网页历史接口已经可用。

## DSH 官方插件开发文档

- [DeepSeek Harness 官网：Developer Preview / Everything is a plugin](https://www.deepseek.com/harness/en/) — 官方产品介绍，说明 DSH 基于 Cordis 插件体系。
- [Your first plugin](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/) — 官方插件入门；已读正文，插件导出 `apply(ctx: Context)`，教程通过 patch 加载。
- [Plugin configuration](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/config) — 官方 Config schema / 插件入口资料。
- [Package and install a plugin](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish) — 官方打包/安装教程；bundle 用 `dsh.bundle.patch` 指向 Cordis patch，涉及 Host 共享包时应按官方 peer/dev dependency 规范配置。
- [Cordis Tutorial](https://deepseek-harness.github.io/deepseek-harness/en/develop/cordis-tutorial/) — Cordis 插件生命周期、Service 与组合机制。

## DSH 官方 Web Client / Slots 文档

- [Web Client architecture](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/web-client) — 官方 Web Client 架构：client modules、API Gateway、Slots 等基础设施。
- [Client Modules](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/client-modules) — 官方说明 package 声明 `dsh.client`（`platform: 'web'`、可选 `inject`）并通过 `exports['./client']` 暴露 browser bundle；browser 模块表采用 lazy-CJS factory。
- [Web Client Slots](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/slots) — Slot 类型、注册、inject、生命周期与替换行为。
- [Right Sidebar](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/sidebar-right) — 右侧栏与 layout/slot 能力说明。
- [Cookbook: adding a package](https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/adding-a-package) — 官方 workspace 包结构和约束；用于核对 Host/Client package 结构。
- [Cookbook: live configuration forms](https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/adding-a-settings-card) — 官方 client bundle / client module 以及 package UI 示例。
- [DeepSeek AI 官方仓库：deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — 源码、package 和 bundle patch 可对照当前版本。

## 固定版本 UI 证据

- [0.2.0-rc.2 SidebarRoot](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-sidebar/src/client/SidebarRoot.tsx#L223) — 品牌有 `aria-hidden` 祖先；Web/Windows外层触发New Session；独立New Session按钮不在 `sidebar.workspaces` 内；折叠时品牌名不显示。该Slot仍仅作装饰，W013以自有锚点+独立shell.overlay实现视觉品牌位置；Mac实测不等于Web/Windows外层点击行为已验收。
- [0.2.0-rc.2 Sidebar 注册](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-sidebar/src/client/index.ts) — 品牌、workspace、footer 和 panel list 等槽的声明及生命周期参考。
- [0.2.0-rc.2 Layout 服务](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-layout/src/client/service.ts) — `panelInfo`、主面板导航及布局服务契约；恢复原 panel ID 与盲目返回默认 Conversation 不同。
- [Layout 包文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-layout/README.md) 与 [Sidebar 包文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-sidebar/README.md) — 了解当前设计；master 可能领先，涉及行为时用固定版本核查。
- [Client 构建 preset](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/tsdown.client.ts) 与 [Modules README](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/modules/README.md) — lazy-CJS、共享模块身份、依赖图与 external 规则。当前构建仍须在匹配版本中实际验证。

安装产物静态复核还确认：自有 `main` panel 被选中时，内置右栏按 `activePanelId` 隐藏，并保留 Session 子树。优先验证这种导航行为，不能先用 `closeRightbar/openRightbar` 改写原呈现状态。标签/全屏/宽度恢复仍需真实往返测试。详见 [审查快照](review-2026-10-09.md) 与当前 [架构](architecture.md)。

## DeepSeek Chat / 开源边界

- [DeepSeek V3 官方模型仓库](https://github.com/deepseek-ai/DeepSeek-V3) — 开源模型相关代码；不能据此推断 chat.deepseek.com 前端、服务端、账号历史 API 开源或允许第三方调用。
- [DeepSeek API 官方文档](https://api-docs.deepseek.com/en/) — 公开 API 文档入口；API 对话不等于网页账号历史同步。
- [DeepSeek 官网](https://www.deepseek.com/) — 官方产品入口。
- [DeepSeek Chat](https://chat.deepseek.com/) — 本次新建浏览器页未登录访问转到 `/sign_in`，没有匿名聊天入口；用户随后独立验证未登录无法免费对话，并据此确认插件授权门槛。页面观察不等于第三方授权契约。
- [Responses API](https://api-docs.deepseek.com/api/create-response/) — 明确模型 API 无状态，历史由调用方提供；不能作为网页账号历史同步的证据。
- [DeepSeek 隐私政策](https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html) — 2026-02-10 版本的注册登录说明和用户手动导出历史路径；手动导入未验证，不能代替自动同步。

## 项目创建阶段的 Inspect 摘要（历史记录，待各设备重新查询）

原记录来自创建项目时的 DSH Web Client 连接，记载查询了 `Slots.listSubTree`、`Service.listService` 和 Host Config directory；本次 Codex 未重复查询，不将这些名称当作业务 API：

- `sidebar.brand.name`：品牌 mark 旁的单槽，当前 occupied，可通过插件贡献内容替换。
- `sidebar.workspaces`：Workspace Browser 区域单槽，拥有者属性含 `wide` 与 `expandSidebar`，替换风险为 `shadows-shipped-ui`。
- `main`：开放 key 的 keyed slot，当前已有 `conversation`、`plugins`；可注册自有 panel key。
- `sidebar.panellist`：按 id 对应 main panel 的 panel navigation list slot。
- Client `layout` Service 有 `selectPanel(panelId | null)`、`closeRightbar()`、`openRightbar(track, fullscreen)`。
- Host Service catalog 有 `deepseekAccount`、`authorization`、`credentials`；这不能证明网页对话历史开放。未发现可确认账号历史同步的依据。

该历史 Inspect 未返回运行时精确 DSH 版本。单槽存在不等于可交互，服务存在不等于网页历史接口开放；使用当前修订的架构和固定版本证据，不能直接照历史猜测实现。

## 后续必须补齐的官方证据

2026-10-10 安装问题复核：[官方打包文档的 GitHub 构建脚本说明](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish#installing-from-github-the-build-script-catch) 明确指出 Git 只取得源码，作者必须提供自包含 prepare，用户需为 pnpm 授予该包的构建许可；预构建 tarball 不需要此许可。本机 Desktop profile 的实际安装缺少 Host/Client lib 入口，不能以先前 tarball 验证推断 Git 安装可用。

1. 在目标设备先 Inspect `list`，获取准确的账号授权 Provider/Method，再确认读取状态、订阅登出/授权失效、账号切换和取消请求的契约。不读取原始密码/Cookie/token。
2. 确认所有进入 CHAT 的入口及新建/快捷键路径如何统一受授权门槛约束。
3. 用真实 DSH 加载插件，验证 panel 切换、原侧栏恢复、右栏恢复和插件禁用/卸载。
4. 网页历史读取/同步需要单独的官方第三方授权与 API 文档；目前未找到，继续标为待验证。

每项新增证据记录日期、实际版本、官方 URL/tag/commit 或 Inspect 的准确 Provider/Method、观察结果、限制及可复现步骤。不要依赖某台设备的本地安装路径或临时提取副本接力。

## 第三方资料（辅助，不作为规范）

- [dsh-plugin-dev-guide](https://github.com/anweat/dsh-plugin-dev-guide) — 第三方开发指南，自述基于官方文档整理。
- [dsh-plugin.org](https://dsh-plugin.org/tutorials/develop-plugin-guide) — 第三方教程。

第三方资料仅用于定位线索；遇到冲突以 DSH 官方文档、当前 package contracts 和 Inspect 结果为准。

## 本轮固定公开契约证据（2026-10-09）

全部链接固定 commit `639ed015397290b3745d163aafe02ffee4aa3f84`，本轮无 live Inspect。对应源码路径和行号在 architecture 中列出；无需安装提取文件才能接力。

- [安全账号 getState/getProfile/watch](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/credentials/deepseek-account/src/index.ts)；[credential-stored 与资料类型](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/credentials/deepseek-account/src/types.ts)。ready 且 stable profile ID 才确认门槛；不读取凭据。
- [官方账号 Provider 的登出/拒绝/资料和 record key](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/credentials/deepseek-account-platform/src/index.ts)；[不含内容的 record-updated 事件](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/credentials/credentials/src/types.ts)。只观察固定 key，不调用 readRecord 或 secrets 方法。
- [公开 DesktopBrowserBridge types](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-sidebar-browser/src/types.ts)；[官方 preload Browser 桥](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/apps/desktop/src/preload-browser.ts)。只提供 acquire/release/approved popup，没有网页身份或登出通知。
- [主进程 Guest 安全与存储策略](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/apps/desktop/src/browser-guests.ts)；[官方 Browser bootstrap 属性](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-sidebar-browser/src/client/electron/ElectronWebviewPresentation.ts)。固定隔离，内存分区，无原生下载/设备权限许可。
- [main 只渲染当前键](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-layout/src/client/AppFrame.tsx)；[Slots 定义](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-layout/src/client/index.ts)。保活容器置于自己的 additive shell.overlay，以自己的 main ref 矩形定位。
- [官方 Typert Gateway 调用/严格验证/取消](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/api/gateway/README.md)。本仓库 server.test 使用实际目标 Cordis/Typert/Gateway 在无网络的假账号服务上验证绑定，不冒充真实账号测试。
- 2026-10-10授权pending核查：上述Gateway文档明确每个namespace是独立`remote.<namespace>`服务；Cordis4.0.4发布包`lib/types/registry.d.ts`的`Context.inject`定义说明按服务可用性加载/卸载回调。实际插件Context复现缺`remote.dshDuo`注入错误，root Context调用不触发此限制；生产Client回归已纳入server.test，没有live Inspect或凭据读取。
- 本机 app.asar 只读元数据/公开 bundled main/preload 核对确实为 rc.2，存在上述 Browser 桥；没有修改安装包或读取用户会话。
- 官网公开无凭据 HTTP HEAD 返回 429，浏览器抓取也受限。这不是 iframe CSP/XFO 的可靠证据，不能声称 Web iframe 可用；Desktop 路线依赖其公开顶层 guest，实际官网登录及聊天仍待实测。

## W013品牌入口证据（2026-10-10）

固定commit仍为 `639ed015397290b3745d163aafe02ffee4aa3f84`，无live Inspect。上述SidebarRoot及Sidebar注册源码、[固定Slots owner类型](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-slots/src/index.ts)证实品牌name允许自有宽度、祖先隐藏与24px裁剪，shell.overlay为独立交互扩展层；公开ui-sidebar/client不导出SidebarRoot。

`@deepseek-ai/dsh-client-ui-primitives@0.2.0-rc.2`发布包的BrandWordmark本身含DeepSeek文字和HARNESS徽标，includeMark=false只去掉鱼图。插件仅在自己渲染的SVG外套视口裁掉徽标，不选择/修改内置SVG。预览从已安装发布包取未改的FishLogo/BrandWordmark片段，不依赖临时提取副本。

Mac真实DSH的AX/截图确认顶部按钮可达、鼠标及Shift-Tab/Enter可切换，折叠隐藏展开恢复，禁用恢复原徽标；官网页面在既有网页登录状态下显示历史导航，没有记录历史标题/URL或发送消息。其他平台、完整右栏矩阵与两端历史一致性仍待验收，见handoff/worklog。本轮web工具读取固定GitHub页面遇Cache miss；契约核查使用已取得的固定源码与发布包，不将抓取失败写成新成功证据。

## W015共用侧栏与有限官网适配证据（2026-10-10）

- [固定Sidebar Slot契约](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-sidebar/src/client/contract/slots.ts)：sidebar.workspaces拥有整块浏览区域，owner仅wide/expandSidebar；顶部New Session回调属于SidebarRoot私有注入，settings为独立foot。发布包类型与固定SidebarRoot源码再次核对，无live Inspect。
- [固定Workspace导航实现](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/client/ui-workspace/src/client/navigation.ts)：startSession直接选择/建立Harness会话，无公开模式替换或veto回调；本轮没有猴子补丁或修改该服务。
- [Electron公开webview.executeJavaScript](https://www.electronjs.org/docs/latest/api/webview-tag#webviewexecutejavascriptcode-usergesture)：仅用于插件自己的批准guest中执行用户已允许的DOM界面适配。文档为当前公开API，目标rc.2实际方法可用性另由本机列表/新建/选中实测确认，不能写成DSH提供了历史API。
- 本轮成功重读官方Slots文档及上述固定navigation/index源码；官网实际可访问导航链接结构由本机页面观察确认。只保存技术证据和结果摘要，不将个人历史标题/链接或正文写入仓库文档。
