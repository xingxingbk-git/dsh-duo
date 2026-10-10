# 架构与可行性

状态：2026-10-10，Desktop 真实网页嵌入候选版。用户的数据源澄清见 requirements；状态、分工和实际验证见 handoff。静态源码、mock、构建与真实网页验收分别记录。

## 固定基线与来源

- 本机 DSH Info.plist / app.asar package：`0.2.0-rc.2`；archive 只读元数据证实 Cordis `4.0.4`。React 与客户端构建基线为 `18.3.1`；依赖锁定对应 npm 发布包。
- 官方固定源码 tag `dsh-v0.2.0-rc.2`、commit [`639ed015397290b3745d163aafe02ffee4aa3f84`](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。本轮重读官方 Slots、Client Modules、打包文档，并核对安装版 main/preload 的公开 Browser 入口。
- 当前工具目录无 live Cordis Inspect；所有新接口来自固定官方公开类型、源码和安装版入口的只读核查，不声称 live Inspect 成功。

## 产品与数据来源

CHAT 直接呈现 `https://chat.deepseek.com/`，由网站自行处理登录、会话和服务器历史。插件不实现另一个模型聊天服务，不持久化/合并网页历史。用户2026-10-10允许有限DOM适配，当前在原DSH侧栏镜像已加载的官网导航元数据；这是界面适配，不是官方历史API。

DSH 账号授权仅控制插件模式门槛；网页内部账号由真实页面处理。两者没有公开身份匹配或登出通知桥。DSH 登出即时回 Harness 的实现不等于网页内部登出已联动。

## Host：无凭据授权状态桥

`src/index.ts` 加载 `DuoController`，依赖官方 `deepseekAccount`、`typert`。仅公开 `dshDuo.authorization` 和 `watchAuthorization`。

- 官方 `getState()/watch(signal)` 的 `credential-stored` 仅表示本地存在凭据，不代表服务端有效；要求 `getProfile(metadata)` 返回 ready 且稳定 `value.id` 后启用门槛。
- 同账号连续有效刷新保留授权 epoch；普通网络错误保留既有官方有效确认，不伪造登出。首次无法确认时保持禁用。
- 官方 `deepseek-account/signed-out`、`deepseek-account/session-expired` 即时关闭门槛。公开 `credentials/record-updated(key)` 只读 key，固定目标 key `deepseek-account-platform/default` 变化先发布 pending 并换 epoch，再安全重读账号资料；不读取 record 内容。
- 异步资料和 Client unary 回包都有授权代次栅栏，防止登出/换账号后的迟到旧结果重开门槛。Client 首次授权仍保留 Harness，点击进入及窗口重新获得焦点时刷新官方状态。
- `src/protocol.ts` 使用显式 strict InvocationDescriptor 和 Zod codecs，Host 注册 Typert contribution，Client `$mount`；不依赖 SRC 猜方法。流使用官方 `$stream` 监督重连与取消。
- Client先`remote.$mount`再`ctx.inject(['remote', 'remote.dshDuo'], ...)`，所有unary/stream调用使用该子Context。仅注入`remote`不包含生成的独立namespace服务；直接从原插件Context调用会抛出`cannot get property "remote.dshDuo" without inject`。不能在挂载前把namespace设为外层必需依赖，造成启动相互等待。
- 刷新合并在途请求，35秒界面期限覆盖连接与调用，超时传递AbortSignal并隔离迟到回包。挂载失败可重试；初始失败从pending转unavailable，既有有效授权不因网络错误被撤销。HARNESS和CHAT均有错误反馈/刷新入口；插件卸载按依赖先dispose namespace消费者与stream，再撤回contribution。

证据：deepseek-account/src/index.ts:39–93、types.ts:31–56；deepseek-account-platform/src/index.ts:17,147–150,296–343；credentials/src/types.ts:92–102；api/gateway/README.md。服务端撤销只在官方请求拒绝/事件确认时获知，插件不自行推断网络故障为撤销。

2026-10-10复现与回归：发布的Cordis4.0.4/Gateway0.2.0-rc.2上，真实插件Context缺namespace注入必然拒绝；旧集成从root Context调用，假Client Context又未执行依赖限制，所以19项测试漏检。当前server.test在真实Cordis加载生产Client入口，验证初始未授权、恢复授权、进入CHAT、官方登出回退及卸载；账号/carrier/presentation仍是fixture，不替代真实Desktop证据。

## Client：可逆导航与可达入口

`src/core/mode.ts` 集中管理授权门槛、mode 和原 `activePanelId`（包括 null）。Client 只调用公开 `layout.panelInfo.getSnapshot()/subscribe()` 和 `selectPanel()`；没有 Session/core 状态写入或盲目 close/open 右栏。

- `main` 自有键 `dsh-duo.chat`。独立 main 按官方布局自然隐藏 Harness 右栏；退出先恢复原 panel，再 dispose Chat 覆盖项。
- Harness侧栏/navigation原树保留；`sidebar.brand.name`仅替换装饰内容：官方DeepSeek字标（自有SVG视口裁掉HARNESS徽标）及自有锚点。实际按钮是官方additive `shell.overlay` 的独立组件，ref/ResizeObserver/IntersectionObserver只测自己的元素；不查改核心DOM，不复制/包装未导出的SidebarRoot。
- 品牌owner的aria-hidden/外层New Session仍存在，交互层在该祖先外，提供按键与屏幕阅读器语义。rc.2品牌行24px且会裁剪，锚点为112×24px；完全可见才发布矩形，折叠/裁剪时隐藏，重新可见时恢复。底部和右下角旧入口已移除；正常授权无常驻刷新，故障时在顶部说明并重试。Mac实测通过，Web/Windows外层按钮及其他平台仍需实测。
- 两种模式共用原生SidebarRoot及shell.leading。仅CHAT期间通过slots.inject注册 `sidebar.workspaces`，退出后dispose恢复工作区；owner仅wide/expandSidebar。顶部窗口/品牌/新会话视觉、底部真实settings及背景透明/模糊由原组件持续管理，不创建另一套侧栏。
- Mac折叠时main扩展至窗口左沿，保活网页层会覆盖原shell.leading。品牌锚点不可见时，网页工具条通过公开layout.toggleSidebar提供展开入口和备用模式按钮；展开后撤回备用控件，不改原shell.leading注册。
- 原顶部新会话按钮、菜单与快捷键调用私有注入的uiWorkspace.startSession，没有公开模式替换回调，保留HARNESS行为；CHAT新建使用列表标题旁的＋操作官网。监听主面板离开CHAT后清理覆盖，不改写原导航选择；不能保证原新建路径的Session保真。此限制仍未解决，不能声称顶部按钮已统一CHAT语义。
- 所有注册与 stream 都由 Cordis enclosing effect 管理，末尾清理先恢复 panel，再卸载贡献和 guest。完整 Desktop 卸载恢复还需真实验收。

证据：ui-layout/src/client/service.ts:18–49、AppFrame.tsx:40–42；ui-sidebar/src/client/index.ts:65–99、SidebarRoot.tsx:223–249,304–310；ui-slots/src/index.ts:1241–1246；shortcuts/src/client/native.ts:17–30。

## Desktop：真实网页和文档保活

`src/web-surface.tsx` 使用公开 `dshDesktop.browser` (`protocolVersion:1`) 的 `acquire(workspace)/release(lease)/onOpenRequested()`。公开类型来自 ui-sidebar-browser/types，安装版本也只读确认该桥存在。

1. 申请受主进程批准的 lease/partition。
2. React 在自己的 Slot 组件树创建 `<webview name=lease partition=批准值 src=about:blank#lease>`。
3. 首次dom-ready调用公开原生loadURL加载官网；后续使用Electron公开executeJavaScript运行下述用户允许的有限界面适配，不读取秘密。
4. 网页长期挂载在自己的 additive shell.overlay。自己的 main 占位元素通过 ref/ResizeObserver 报告自身矩形，容器定位到主区；不查询或修改 DSH 核心元素。
5. 手动返回 Harness 只隐藏容器；再次进入仍是同一文档。授权代次变化、账号变化或插件卸载释放 guest；异步 acquire 若已被取消则立即 release。

官方 main 只挂载当前键，直接把 webview 放入 main 会丢失网页文档，因此采用保活 overlay。布局、保活、晚到 acquire 与释放结果需要 mock 和真实 Desktop 分开验收。

主进程校验 lease 并强制 `sandbox:true`、`contextIsolation:true`、`webSecurity:true`、`nodeIntegration:false`。插件不改安装包、header 或安全配置。Browser storage 按插件指定的安全账号隔离身份管理，但实际网页登录身份不可验证；内存分区仅存续当前进程，不共享系统浏览器凭据。

证据：ui-sidebar-browser/src/types.ts:19–26、ElectronWebviewPresentation.ts:52–60；apps/desktop/src/preload-browser.ts:7–31、main.ts:229–235、browser-guests.ts:29–41,72–95。原生 Platform View 只支持 usage/top-up，不用于任意 Chat URL。

## 官网导航适配（W015 / 0.1.1）

`src/website-navigation.ts`为自包含DOM适配函数，经Electron公开webview.executeJavaScript仅在插件持有的批准guest执行。限定HTTPS官方origin及已在页面出现的 `/a/chat/s/<id>` 链接，读取标题/分组/选中路径，不访问正文、Cookie、storage、应用私有全局、凭据或请求接口。没有额外依赖、preload或安全策略修改。

网页导航以窄列几何、真实历史链接、新对话标签及不含编辑器等条件定位；原生列表按页面次序分组，可搜索已加载标题，点击真实页面链接/新建元素，加载更早时滚动原网页列表。承接成功才加入可撤回的局部style隐藏网页侧栏；用户可通过工具条“官网导航”恢复原页面账号/搜索/管理入口。没有项目创建、假历史或另一份聊天数据。页面结构变化或出错清空镜像、撤回隐藏样式并提示使用官网原导航。

每1.2秒串行刷新可见导航，HARNESS期间不执行适配；卸载/授权代次变化撤回动作绑定和guest。Client同时限定模式/门槛/代次及已加载链接，旧账号回包不能污染新列表。网页返回payload按非信任输入过滤origin、大小和类型，标题仅作React文本。登录页路径只能说明页面在登录视图，不证明DSH授权失效或两处账号相同，不自动回HARNESS。

当前适配已在Mac真实官网确认分组列表、选择联动和＋新建；空账号/官网布局变化、动态加载更多与网页内部账号切换仍需扩展实测。公开webview方法文档及固定Sidebar owner契约见references。

## 构建与边界

锁定 Cordis 4.0.4、官方 DSH 包 0.2.0-rc.2、React 18.3.1；TSX 支持，Host ESM、Client 单个 lazy-CJS factory、lib/types 声明。Client 仅共享固定 baseline 模块，第三方 Zod inline；feature 服务只通过 ctx/注入使用。build/check-artifact 校验精确 module requests、Host 依赖声明和单工厂结构，tarball 不含源码开发 harness、依赖或凭据。

Git 安装与预构建 tarball 是独立交付路径。仓库不提交 lib，Git 安装通过 `prepare` 运行本包自包含构建脚本；它依赖本包已声明的开发依赖，不需要旁边的 DSH monorepo 或临时提取文件。pnpm 的构建许可必须显式授予 dsh-duo，不能把 `--ignore-scripts` 用于源码 Git 安装；预构建 tarball 无需安装时构建。DSH bundled pnpm 11.7.0 必须在 profile 的 allowBuilds 批准准确 Git 身份，单独 `--allow-build=dsh-duo` 会失败。2026-10-10 实际 Git 安装曾因没有 prepare 而缺失两个 lib 入口，先前 tarball 检查没有覆盖这一问题，修复与复验见 handoff/worklog。

浏览器 Web profile 缺少 Desktop bridge 时保持 Harness 禁用，无未经验证的 iframe 回退。官网公开无凭据 HEAD 返回 429，不能据此断定 iframe 嵌入策略。

## 尚未成立的能力

- 实机官网已加载并显示既有网页登录状态的历史导航；首次登录/验证码/发送、两端同网页账号历史一致性仍未验收。
- 官网内部登出自动切回、网页账号与 DSH 账号匹配、网页原生历史 API。
- 卸载/授权变化时未发送网页草稿保留与官网流式取消；插件不能提取或调用这些内部能力。
- 网站下载、设备权限、外部 OAuth 弹窗等受原生 Browser 固定策略限制；当前仅在同 guest 接受官方 Chat HTTPS popup。
- 其他DSH版本、Web iframe、Windows/Linux品牌入口实测及完整屏幕阅读器验收。Mac顶部品牌位置已通过本轮实机检查；剩余项不因typecheck/build/mock通过自动变成支持。
