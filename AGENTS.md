# dsh-duo：Agent / Codex 开发指南

## 项目目标
为 DSH 提供可逆的 CHAT / HARNESS 模式切换。项目入口为 `src/index.ts`（Host）与 `src/client.ts`（Web Client）；bundle/client manifest 在 `package.json`，Cordis profile layer 在 `cordis.patch.yml`。完整需求见 [docs/requirements.md](docs/requirements.md)，版本与扩展契约见 [docs/architecture.md](docs/architecture.md)。

## 已确认产品决策（2026-10-09）
- 未登录或未获得有效 DeepSeek 账号授权时，保持 HARNESS，整个 `CHAT | HARNESS` 切换控件置灰、禁用；HARNESS 自身仍正常可用。
- CHAT 中退出登录或官方确认授权失效时，立即回 HARNESS，恢复原工作区/面板，然后禁用切换控件；自动回退不等待用户确认或请求取消完成。
- 启动时授权未确认，默认 HARNESS 并禁用控件；首次确认/重新授权有效后启用控件，不自动进入 CHAT。同一账号授权持续有效的刷新不改变用户已选择的模式。普通网络故障不等同于已确认退出登录。
- 不提供匿名 CHAT，也不做匿名会话登录合并；本地缓存不能绕过账号授权门槛。API key 或其他模型配置不能自行替代本需求中的 DeepSeek 账号登录授权。
- 登录授权门槛是产品决策；授权状态接口/事件与网页历史同步接口是否可用是技术验证事项，不能混为已支持。

## 仓库与信息来源
- 仓库：`git@github.com:xingxingbk-git/dsh-duo.git`；默认协作分支 `main`。
- 项目理解必须来自已提交的仓库文件，不依赖某台设备的聊天历史、Codex 全局记忆、安装路径或 `/tmp` 提取文件。
- 当前需求以 `docs/requirements.md` 为准；技术证据及限制以 `docs/architecture.md` 为准；阶段安排以 `docs/roadmap.md` 为准；最新进展、验证结果和下一步以 [docs/handoff.md](docs/handoff.md) 为准。
- `docs/review-2026-10-09.md` 是历史审查快照，存在后续已修订的建议；不要用历史建议覆盖当前已确认需求。冲突时遵循用户最新指令并同步所有受影响文档。

## 开始工作前
1. 阅读本文件、README、需求、架构、路线、资料来源和 `docs/handoff.md`。确认当前阶段与尚未验证事项。
2. 检查 `git status`、当前分支和远程进展；联网可用时先 `git fetch origin`。仅在工作区干净且可快进时更新当前分支，不覆盖别人的修改，不强推。不要擅自初始化另一个仓库或把未提交工作丢弃。
3. 记录当前设备上的 DSH、Cordis、React、Node.js、pnpm 版本及可用工具；上一次验证目标是 DSH 0.2.0-rc.2 / Cordis 4.0.4 / React 18.3.1，不代表所有设备都相同。优先引用对应官方 tag/commit，而不是默认套用 master。
4. 查阅适配当前 DSH 版本的官方插件开发文档。
5. 对服务、事件、配置、Slot 或主题等未知 API，先调用 Cordis Inspect `list`，再使用准确 Provider/Method 查询；禁止猜测 API 名称或把查询工具当成业务 API。若 Inspect 不可用，记录限制，可继续只读官方源码核查和不依赖该接口的工作，但不可将静态证据写成 live Inspect 或调用猜测的接口。
6. 记录已确认能力、版本、来源、限制及验证步骤。接力先完成一个可验证阶段，不重复宣称历史未完成的构建/安装已通过。

## 实现约束
- 只用官方 Cordis 插件、Slots、layout 与模块加载扩展点；不改 DSH 安装包，不注入 DOM，不覆写核心状态。
- 拓展 UI 前先确认 Slot 契约及 owner props；对于 `shadows-shipped-ui` Slot，仅在需要的模式注册、切回 Harness 时及时 dispose，让内置 occupant 恢复。
- CHAT/HARNESS 切换必须可逆；不静默丢弃 Harness 状态、聊天草稿或正在生成的回答。
- 所有进入 CHAT 的路径（切换按钮、快捷键、主面板入口、恢复状态）都必须使用同一授权门槛，不能只置灰一个按钮。
- 退出登录/授权失效后禁止新的 CHAT 请求，按已确认的官方取消能力终止该账号在途请求，隔离迟到结果；不阻塞回 HARNESS。保存草稿/已接收内容需遵守账号隔离与已确认的数据策略，不能继续使用旧授权或自动上传给另一账号。
- CHAT 模式隐藏 Harness 专属右侧栏；离开 CHAT 时要恢复用户原来的面板状态，而不只是无条件打开/关闭。
- 在 0.2.0-rc.2 中先验证独立 `main` 面板自然隐藏右栏和原 `activePanelId` 恢复，不默认调用 `closeRightbar/openRightbar`。品牌名槽在 `aria-hidden` 祖先内，Web/Windows 还有外层新会话按钮；未解决 owner 契约前不能直接塞入交互控件。原新建会话/快捷键也必须核查 CHAT 行为。
- 不读取/持久化用户密码、Cookie、访问令牌；不得模拟网页登录或调用未公开 Web API。登录历史同步仅使用官方明确支持的授权/API。
- 不自动合并本地缓存与账号历史，不把模型 API 能力误称为网页历史同步。
- 每个阶段写可复现的构建/测试步骤；验证插件禁用/卸载后 DSH 原行为恢复。

## 协作与交付
- 先更新需求/验收标准，再实现；一次变更聚焦一个可验证阶段。
- 新增模块/依赖需核对目标 DSH 版本兼容性；peer 依赖不可无理由捆绑第二份 Cordis / React 实例。
- README 说明构建、安装、权限、数据流与限制；任何未验证能力标记为“待验证”，不可写成已支持。
- 每次需求、实现或验证状态变化，同步更新受影响的需求/架构/路线/README 以及 `docs/handoff.md`；通用协作规则或稳定约束变化也同步本文件，不把临时运行日志堆进本文件。
- 结束或交接前在 `docs/handoff.md` 写清：完成内容、未完成内容、目标与实测版本、执行过的命令及结果、限制、下一步、需要用户决定的事项。失败/未执行/仅静态确认分别标明。
- 已获本次提交/推送授权时，将代码与对应文档一起提交，检查实际提交文件及远端分支，再推送；没有推送授权时保留可审查修改并报告。不要推送密码、Cookie、访问令牌、个人会话、安装包、提取副本、依赖或构建产物。
- 若提交/推送失败，保留本地成果并在交接中说明，不能声称跨设备已同步。新设备通过正常 clone/fetch 获取仓库，再按上述开始工作流程接力。
