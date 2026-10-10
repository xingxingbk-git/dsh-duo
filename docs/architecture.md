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

`src/index.ts` 加载 `DshChatController`，依赖官方 `deepseekAccount`、`typert`。仅公开 `dshChat.authorization` 和 `watchAuthorization`。

- 官方 `getState()/watch(signal)` 的 `credential-stored` 仅表示本地存在凭据，不代表服务端有效；要求 `getProfile(metadata)` 返回 ready 且稳定 `value.id` 后启用门槛。
- 同账号连续有效刷新保留授权 epoch；普通网络错误保留既有官方有效确认，不伪造登出。首次无法确认时保持禁用。
- 官方 `deepseek-account/signed-out`、`deepseek-account/session-expired` 即时关闭门槛。公开 `credentials/record-updated(key)` 只读 key，固定目标 key `deepseek-account-platform/default` 变化先发布 pending 并换 epoch，再安全重读账号资料；不读取 record 内容。
- 异步资料和 Client unary 回包都有授权代次栅栏，防止登出/换账号后的迟到旧结果重开门槛。Client 首次授权仍保留 Harness，点击进入及窗口重新获得焦点时刷新官方状态。
- `src/protocol.ts` 使用显式 strict InvocationDescriptor 和 Zod codecs，Host 注册 Typert contribution，Client `$mount`；不依赖 SRC 猜方法。流使用官方 `$stream` 监督重连与取消。
- Client先`remote.$mount`再`ctx.inject(['remote', 'remote.dshChat'], ...)`，所有unary/stream调用使用该子Context。仅注入`remote`不包含生成的独立namespace服务；直接从原插件Context调用会抛出`cannot get property "remote.dshChat" without inject`。不能在挂载前把namespace设为外层必需依赖，造成启动相互等待。
- 刷新合并在途请求，35秒界面期限覆盖连接与调用，超时传递AbortSignal并隔离迟到回包。挂载失败可重试；初始失败从pending转unavailable，既有有效授权不因网络错误被撤销。HARNESS和CHAT均有错误反馈/刷新入口；插件卸载按依赖先dispose namespace消费者与stream，再撤回contribution。

证据：deepseek-account/src/index.ts:39–93、types.ts:31–56；deepseek-account-platform/src/index.ts:17,147–150,296–343；credentials/src/types.ts:92–102；api/gateway/README.md。服务端撤销只在官方请求拒绝/事件确认时获知，插件不自行推断网络故障为撤销。

2026-10-10复现与回归：发布的Cordis4.0.4/Gateway0.2.0-rc.2上，真实插件Context缺namespace注入必然拒绝；旧集成从root Context调用，假Client Context又未执行依赖限制，所以19项测试漏检。当前server.test在真实Cordis加载生产Client入口，验证初始未授权、恢复授权、进入CHAT、官方登出回退及卸载；账号/carrier/presentation仍是fixture，不替代真实Desktop证据。

## Client：可逆导航与可达入口

`src/core/mode.ts` 集中管理授权门槛、mode 和原 `activePanelId`（包括 null）。Client 只调用公开 `layout.panelInfo.getSnapshot()/subscribe()` 和 `selectPanel()`；没有 Session/core 状态写入或盲目 close/open 右栏。

- `main` 自有键 `dsh-chat.chat`。独立 main 按官方布局自然隐藏 Harness 右栏；退出先恢复原 panel，再 dispose Chat 覆盖项。
- Harness侧栏/navigation原树保留；`sidebar.brand.name`仅替换装饰内容：官方DeepSeek字标（自有SVG视口裁掉HARNESS徽标）及自有锚点。实际按钮是官方additive `shell.overlay`的独立组件；不复制/包装未导出的SidebarRoot。W016新增用户批准的有限侧栏DOM适配，见下一条。
- `src/sidebar-adapter.ts`从自己的品牌元素沿已核对rc.2祖先结构定位侧栏，先识别renderer的data-slot=sidebar.brand.name/display:contents包装，再校验aria-hidden品牌identity、data-window-drag行和直接子级新会话按钮；只加自有前缀的临时属性，以flex填满品牌间距、CHAT隐藏插件行/空导航区，捕获原新会话click并转交受门槛保护的官网new。官网未就绪/登录页时禁用该新建按钮；HARNESS恢复原disabled和点击行为，卸载移除属性/监听器并恢复原值。绑定归Client所有，品牌因折叠卸载时仍保持，展开重新绑定、Client卸载撤回。观察范围仅该root的childList；不改Session、私有服务或安装包。未知结构不适配，并在自有交互层提示顶部仍为HARNESS语义；不能称为官方新建接口。
- 品牌owner的aria-hidden/外层New Session仍存在，交互层在该祖先外，提供按键与屏幕阅读器语义。rc.2品牌行24px且会裁剪，锚点为112×24px；完全可见才发布矩形，折叠/裁剪时隐藏，重新可见时恢复。底部和右下角旧入口已移除；正常授权无常驻刷新，故障时在顶部说明并重试。Mac实测通过，Web/Windows外层按钮及其他平台仍需实测。
- 两种模式共用原生SidebarRoot；仅CHAT期间通过slots.inject注册 `sidebar.workspaces`，退出后dispose恢复工作区；owner仅wide/expandSidebar。顶部窗口/品牌/新会话视觉、底部真实settings及背景透明/模糊由原组件持续管理，不创建另一套侧栏。
- W017删除整个网页工具栏。CHAT期间按官方shell.leading契约注册展开/官网新建图标，与rc.2原生HeaderLeadingControls使用同一公开图标、28px尺寸、8px间距和Tooltip；HARNESS/卸载dispose恢复内置项。Mac官方AppFrame仅在全折叠时挂载该Slot。guest矩形扣除官方--dsh-frame-top-clearance，避免overlay遮住原生窗口控制；不硬改核心z-index或窗口按钮。
- 官方settings.section注册持久“CHAT设置”，owner仅close；原设置导航/弹窗继续由DSH维护。新增ui-settings开发类型和manifest依赖，不复制私有组件，也不增加运行时共享模块。设置显示真实官网可见账号、系统语言，CHAT固定暗色，无外观选择。
- 原菜单/快捷键仍调用uiWorkspace.startSession，没有公开模式替换回调；W016有限例外仅处理顶部鼠标/键盘激活click及非Mac品牌按钮，列表＋仍可新建。监听主面板离开CHAT后清理覆盖，不改写原导航选择；不能把顶部按钮结果当作菜单/快捷键Session保真。
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

网页导航以窄列几何、真实历史链接、新对话标签及不含编辑器等条件定位；原生列表按页面次序分组，可搜索已加载标题，点击真实页面链接/新建元素，加载更早时滚动原网页列表。W017同时隐藏有宽度的外层导航轨道、将编辑器所在内容列扩展、隐藏无文本的紧凑导航头部，消除占位。guest加载/路由变化先遮罩；guest自有MutationObserver在官网React提交后的微任务中重做适配，并以局部preparing样式遮住登录SPA首帧，完成布局/暗色后显示。未知结构恢复原界面，不裁切视口冒充移入侧栏。

设置适配仅操作官网公开显示的头像菜单、系统设置、通用设置、语言下拉/深色按钮及关闭控件。精确标签支持中英文，自定义ds-select通过文本触发器的公开pointerdown/mousedown展开；读回官网值才确认成功。12秒设置期限失败后提供原官网入口，不输出内部结构诊断。设置缓存为自有DOM临时属性，官网登录页/恢复/账号代次变化清空，Host/Client返回值限长并栅栏隔离。无Cookie、storage、私有应用状态/API或聊天正文读取。CHAT设置提供官网完整设置/导航及重新加载入口，不宣称官网全部管理动作已镜像。

W016登录核查：固定deepseek-account-platform默认Platform origin为platform.deepseek.com、inference origin为api.deepseek.com；公开PlatformSession仅用于平台嵌入，Browser acquire由主进程生成进程内隔离partition。未发现面向chat.deepseek.com的官方SSO/凭据交换入口，因此本版不实现共用登录，也不调用Host-only凭据方法或迁移Cookie。重启网页登录失效来自分区生命周期，不能归因于DSH授权失败。

每1.2秒串行刷新可见导航，HARNESS期间不执行适配；卸载/授权代次变化撤回动作绑定和guest。Client同时限定模式/门槛/代次及已加载链接，旧账号回包不能污染新列表。网页返回payload按非信任输入过滤origin、大小和类型，标题仅作React文本。首次登录页只说明官网尚未登录，不证明DSH授权失效或两处账号相同；曾确认官网ready后再次进入sign_in，或插件显式当前退出请求后确认sign_in，则回HARNESS并禁用模式，可从CHAT设置重新官网登录。

当前适配已在Mac真实官网确认分组列表、选择联动和＋新建；空账号/官网布局变化、动态加载更多与网页内部账号切换仍需扩展实测。公开webview方法文档及固定Sidebar owner契约见references。

## 构建与边界

锁定 Cordis 4.0.4、官方 DSH 包 0.2.0-rc.2、React 18.3.1；TSX 支持，Host ESM、Client 单个 lazy-CJS factory、lib/types 声明。Client 仅共享固定 baseline 模块，第三方 Zod inline；feature 服务只通过 ctx/注入使用。build/check-artifact 校验精确 module requests、Host 依赖声明和单工厂结构，tarball 不含源码开发 harness、依赖或凭据。

Git 安装与预构建 tarball 是独立交付路径。仓库不提交 lib，Git 安装通过 `prepare` 运行本包自包含构建脚本；它依赖本包已声明的开发依赖，不需要旁边的 DSH monorepo 或临时提取文件。pnpm 的构建许可必须显式授予 dsh-chat，不能把 `--ignore-scripts` 用于源码 Git 安装；预构建 tarball 无需安装时构建。DSH bundled pnpm 11.7.0 必须在 profile 的 allowBuilds 批准准确 Git 身份，单独 `--allow-build=dsh-chat` 会失败。2026-10-10 实际 Git 安装曾因没有 prepare 而缺失两个 lib 入口，先前 tarball 检查没有覆盖这一问题，修复与复验见 handoff/worklog。

浏览器 Web profile 缺少 Desktop bridge 时保持 Harness 禁用，无未经验证的 iframe 回退。官网公开无凭据 HEAD 返回 429，不能据此断定 iframe 嵌入策略。

## 尚未成立的能力

- 实机官网已加载并显示既有网页登录状态的历史导航；首次登录/验证码/发送、两端同网页账号历史一致性仍未验收。
- 官网内部登出自动切回、网页账号与 DSH 账号匹配、网页原生历史 API。
- 卸载/授权变化时未发送网页草稿保留与官网流式取消；插件不能提取或调用这些内部能力。
- 网站下载、设备权限、外部 OAuth 弹窗等受原生 Browser 固定策略限制；当前仅在同 guest 接受官方 Chat HTTPS popup。
- 其他DSH版本、Web iframe、Windows/Linux品牌入口实测及完整屏幕阅读器验收。Mac顶部品牌位置已通过本轮实机检查；剩余项不因typecheck/build/mock通过自动变成支持。

## W018统一名称与插件图标（2026-10-10）

插件包、两端name导出、bundle patch及Typert贡献package统一为dsh-chat；Host/Client同步使用dshChat namespace，注册键和自有DOM标记同用dsh-chat前缀，类型为DshChat*。不保留旧名别名，不同时安装两份插件。包名变更涉及新的browser accountStorageKey，按正常网页登录恢复账号历史，不迁移旧guest凭据。

插件管理图片使用package.json顶层icon=./assets/icon.svg，导出./package.json供官方readPluginMeta发现，并将assets/icon.svg加入files及source-only Git安装fixture。DSH rc.2固定源码明确支持manifest相对路径、自包含SVG和256 KiB上限；不用网页DOM或侧栏Slot替换管理页图标。当前仅静态资源/打包验证，不宣称已安装UI验收。

## W019精简设置与标题布局（2026-10-10）

完整四Tab官网设置嵌入实机出现超时/空白，用户明确取消该方案。本轮settings.section只承接原生网页账号昵称、退出当前会话和系统语言。website-settings.ts通过官网公开头像菜单进入General，定位Language控件、修改并读回；错误有期限，不伪造成功。官网语言读写、中文/英文往返及官方language=zh-CN配置落盘已通过本机实测，详细分层证据及产物以handoff为准。禁止以“登出所有设备”替代当前会话退出；确认sign_in后回HARNESS并禁用模式，约1.2秒轮询不等于官方退出事件。

主区使用原官网标题/分享节点，固定同一48px顶行；展开标题左距24px，折叠按插件shell.leading实际右缘加16px横向避让，分享距右缘12px，不增加整行垂直留白。官网实际顶栏含三个按钮，分享除公开标签外还以顶行最右侧图标的限定位置信号识别；标题只定位直接显示选中标题的叶元素，覆盖原居中/截断宽度。展开/折叠实机截图通过。仅从导航选中标题定位页头，不读取聊天正文；分享仍保留官网交互，不自动生成链接。

自有react-dom body portal保持guest/lease身份。登录页呈现在原生设置窗格；已登录时官网通用设置操作在后台进行，原生页只显示上述三个控件。操作期间恢复官网导航布局以保留头像菜单锚点，结束后再隐藏；避免透明guest覆盖原生输入。正常viewport后台操作已实测读写成功；不采用屏幕外位置。热更新可能保留旧Slot/状态引用，安装文件正确不等于当前UI已经运行新代码。

Host Config只有language这一volatile非凭据字段；Client使用configForms唯一entry id dsh-chat，官网确认读回后保存。先恢复保存的语言再允许写入新值，避免guest默认语言覆写偏好；账号代次隔离。ConfigEditor写官方Cordis profile patch，不使用私有settings.json或站点storage。32项单测与15项公开DOM夹具只证明对应分支；官方profile落盘已实测，彻底重启后的恢复仍未复验。

网页登录持久化仍未修复：公开DesktopBrowserBridge.acquire(workspace)不接受持久选项，主进程生成随机无persist前缀partition并强制lease匹配；插件Host子进程没有公开Session管理能力。核查时master也相同。见browser-session-capability.md；未修改安装包、User-Agent、安全策略或凭据。
