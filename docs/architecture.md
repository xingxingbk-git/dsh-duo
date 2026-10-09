# 架构与可行性

状态：2026-10-09 完成文档/安装元数据审查并更新授权门槛方案；插件仍为空实现，完整构建、加载、授权观察和 UI 行为待验证。本轮没有可用的 live Cordis Inspect 连接，创建阶段的 Inspect 摘要只作为旧记录，不能写成当前实测结果。

## 目标版本与证据

- 目标安装版本：DSH `0.2.0-rc.2`、Cordis `4.0.4`、React `18.3.1`。来源为本轮读取的目标安装包元数据；插件的实际安装与运行兼容性仍待验证。
- 官方源码核对固定在 commit `639ed015397290b3745d163aafe02ffee4aa3f84`，避免将不断变化的 master 当成目标契约：[官方源码快照](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。
- 本轮已阅读官方插件打包、Client Modules、Slots、Web Client 与相关官方源码正文，不再只是搜索摘要。来源索引与核对范围见 [references.md](references.md)。
- 服务、事件、配置、Slot owner props 与主题未知能力仍须在目标运行时先调用 Cordis Inspect `list`，再以准确 Provider/Method 查询；未取得当前连接时不能猜业务 API 或把 Inspect 查询方法当业务调用。

## 插件包组成与构建边界

- `package.json`：`dsh.bundle.patch` 加 `dsh.client`（`platform: web`、客户端插件依赖边、`exports['./client']`）。
- `cordis.patch.yml`：将 Host Cordis plugin `dsh-duo` 插入 profile 插件树。
- `src/index.ts`：Host half 入口。后续是否需要 Host 来承接官方账号观察或聊天请求，由官方服务契约决定；当前为空实现。
- `src/client.ts`：browser Client half 入口；通过官方 Slots/layout 扩展 UI，当前为空实现。
- `scripts/build.mjs`：TypeScript 输出 Host 入口，再生成 lazy-CJS browser factory。factory 外壳形式与官方构建方案一致，不能由此推断整体产物已兼容。

现有 `*` peer/dev 范围仍是占位，尚无锁文件与已安装依赖。实现阶段应将 DSH 包与上述目标发布线对齐，保持共享 Cordis/React 实例，不捆绑第二份运行时。官方公开包的 `latest` 标签不保证与目标 DSH 相同，不能用通配依赖代替兼容验证。

现有构建脚本将全部 `@deepseek-ai/*` 作为 external；这只在当前 type-only import 骨架中未触发请求。后续必须区分隐式共享基线、`dsh.client.inject` 的插件依赖边，以及 `dsh.client.external` 的精确非基线模块请求。不可让无法由模块表回答的任意 require 进入产物。React/TSX 类型检查、CSS/资源与可清理样式生命周期也需在 UI 阶段补齐；当前只含 `.ts` 的配置不具备完整 UI 构建准备。

## UI 扩展点审查

创建阶段旧 Inspect 记录包含 `sidebar.brand.name`、`sidebar.workspaces`、`main`、`sidebar.panellist` 和 layout 服务目录，未记录精确运行时版本。以下结合固定官方源码指出方案与限制；必须在目标运行时复查注册、props、生命周期和行为。

| 目标 | 扩展点/证据 | 修正后的方案与限制 |
|---|---|---|
| 品牌区域模式选择器 | 旧记录的 `sidebar.brand.name` single Slot；官方源码显示品牌区域的可访问性/点击约束 | 保留独立品牌 mark。该区域受 `aria-hidden`、外层 New Session 行为及折叠不可达影响，不能直接塞入交互控件就验收；先发现官方可交互扩展办法，保证按钮与禁用说明可达且不误触 New Session |
| CHAT 左侧导航 | 旧记录的 `sidebar.workspaces` single Slot，owner props 包括 `wide`、`expandSidebar`，替换风险 `shadows-shipped-ui` | 仅在 CHAT 注册自己的导航，退出时 dispose 恢复内置 occupant。还须处理 workspace 区之外的原新建会话入口、品牌点击、快捷键及其他 Harness 导航，单换此 Slot 不够 |
| CHAT 主面板 | `main` keyed Slot；以自有 key（如 `dsh-duo-chat`）打开 panel | 使用官方 panel 导航；进入前保存原 `activePanelId`，退出时恢复原值，不一律 `selectPanel(null)`。键名、注册方式及状态读取/观察方式需复查 |
| 隐藏 Harness 右栏 | 官方 main panel 布局已有原生隐藏右栏行为 | 优先使用自有 main panel 的原生行为，避免调用 `closeRightbar()` 后另行重建用户 rightbar 状态。验证 open/closed、tab、width、fullscreen 均不改变；显式 close/open 只在官方读取/恢复契约确认后作为备选 |
| panel 导航及侧栏折叠 | 旧记录的 `sidebar.panellist` list Slot 与 main panel 对应关系 | 是否需要可发现入口由可达性方案决定；任何入口都受同一账号门槛，不能绕过置灰控件进入 CHAT |

首选注册策略：插件生存期内注册可达的模式入口与 Chat main panel；只有 mode 为 CHAT 时占用聊天侧栏位置，并以 disposer 管理覆盖贡献。强制退出或插件停用时，先恢复 Harness 导航和原 panel，再清理 Chat 覆盖项，具体清理顺序须按官方生命周期实测。优先使用窄槽，不将整个 sidebar 替换当作默认方案；若品牌契约确需更大范围的官方 Slot 替换，先核查 owner、子槽生命周期、内置功能与恢复，再同步架构和验收范围。不得注入 DOM 或覆写核心状态。

## 授权状态与模式控制

产品门槛已确认：未登录/未授权整个控件 disabled；启动 pending 默认为 HARNESS；首次确认授权或重新登录只启用控件并保持 HARNESS；同账号持续有效的刷新/订阅通知保持用户当前选定模式；CHAT 中登出或官方确认授权失效立即回 HARNESS 后禁用；重新授权不自动进入 CHAT。

`pending`、`authorized`、`unauthorized` 是插件拟议的归一化状态名，**不是已发现的 DSH API 或事件名**。官方授权读取、持续观察、账号标识、退出与撤销事件尚未确认。实现须在能力发现后编写适配器，不能从服务名字、网络错误或私有请求猜授权状态。

| 输入 | Mode controller 行为 |
|---|---|
| 初始化，尚无官方确认的当前账号授权 | `mode = harness`；门槛关闭；不恢复历史 CHAT 选择 |
| 首次确认当前账号有效授权 | 打开门槛，保持 HARNESS；等待用户手动选择 CHAT |
| 同账号授权持续有效的刷新/订阅通知 | 门槛保持开放，保留用户当前 CHAT/HARNESS；不触发模式切换、重置对话或覆盖原 panel 快照 |
| 已授权用户手动选择 CHAT | 再检查门槛与账号身份，记录原 panel，激活 Chat 导航并打开自有 main panel |
| 用户手动返回 HARNESS | 恢复原 panel 和内置导航，保留 Chat 草稿/已接收内容 |
| 退出登录、官方确认授权失效/撤销或更换账号 | 同一流程立即关闭发送门槛、切回 HARNESS、禁用控件并清理 Chat 导航；请求取消异步进行，不阻塞界面切回 |
| 网络或服务错误 | 单独更新错误状态，不伪造官方登出/撤销；启动未确认授权时仍关闭门槛 |
| 再次授权确认 | 门槛重新开放，保持 HARNESS，不自动恢复 CHAT |

所有进入 CHAT 的入口和发送 callback 共享门槛；不能只在按钮上设置 disabled。发送前再次检查当前账号与官方确认状态，避免退出和点击发送之间的竞争。强制退出流程不弹保存确认，必须以保留已有数据的方式完成。

账号失效/切换时，按已确认的官方取消能力结束旧账号流式请求；取消完成前即阻止新发送并隔离旧请求回调。旧请求不得将结果写入新账号，已接收内容与草稿保留在原账号边界内。取消机制尚未确认前，真实聊天的退出验收不能标记通过。数据落盘位置、保留期限、同账号恢复、导出/删除与缓存策略待定。

## 目标模块与数据流

- `Authorization adapter`：从官方公开能力读取/观察当前 DeepSeek 账号授权状态及身份，转换为插件门槛；不读取密码、Cookie 或自行保存令牌。
- `Mode controller`：维护 mode 与进入前的 Harness panel 快照，统一处理手动切换、授权失效、账号切换和插件卸载。
- `Mode switcher UI`：显示当前模式、白底选中态、整个控件禁用态及原因；可访问入口方案先通过验证。
- `Chat navigation + main view`：受门槛控制的独立导航和 main panel，不操作 Harness session；新建/快捷入口有明确 Chat 行为。
- `Conversation provider`：在授权能力确认后，逐步验证列表、读取、发送、流式返回、停止、删除；UI spike 使用 mock，不将 mock/local 数据称为网页账号历史。
- `Persistence`：按账号隔离草稿与已接收内容；保存、恢复、导出和清除策略确定后再实现。授权秘密仅由官方授权/凭据机制托管。

## DeepSeek 网页账号历史边界

创建阶段旧 Host catalog 出现过 `deepseekAccount`、`authorization`、`credentials`。这些名字只说明发现过相关服务，未证明插件可观察授权，也未证明 chat.deepseek.com 的历史开放。本轮没有 live Inspect，因此不能据此写出具体方法或事件。

账号授权是进入 CHAT 的必要门槛；真实聊天发送、网页历史同步及迁移是独立能力。即使 DSH 授权账号可调用模型，也不等于网页历史自动可用。账号同步仅在官方明确支持第三方授权与历史接口后评估，禁止借用 Cookie、模拟登录或调用未公开 Web API。本插件不开放匿名聊天，也不自动合并不同账号或来源的对话。

## 验证阶段与记录

1. **能力发现**：目标运行时 Inspect `list` → 准确 Provider/Method；核对官方授权状态/通知、账号标识、main/layout、品牌交互和快捷入口契约。无法确认时保持 HARNESS 禁用，不伪造登录支持。
2. **可复现构建与加载**：对齐版本后安装锁定依赖，执行 `pnpm typecheck`、`pnpm build`，检查 Host/browser 产物与模块请求；在独立开发 profile 安装、dump-config、启动及删除验证。
3. **受授权门槛控制的 UI spike**：用 mock Chat panel/可测试的授权适配输入覆盖 requirements 的验收矩阵，并明确哪些结论仅来自 mock；验证原 panel、右栏、session、草稿、快捷键和卸载恢复。
4. **真实账号与聊天**：官方授权流程、退出/撤销观察及流式取消实测；网络错误与确认登出分别测试，账号切换不串数据。
5. **网页历史独立评估**：仅用官方明确支持的第三方授权与历史接口验证，不因前述阶段通过就声称支持网页同步。

每项记录日期、目标 DSH/Cordis/React 版本、官方固定来源、操作步骤、结果、mock/实测边界和兼容限制。当前只完成静态审查与构建脚本语法检查，未安装依赖、未执行完整 build、未向 GUI 加载插件。
