# 架构与可行性

状态：2026-10-09，Desktop 真实网页嵌入候选版。用户的数据源澄清见 requirements；状态、分工和实际验证见 handoff。静态源码、mock、构建与真实网页验收分别记录。

## 固定基线与来源

- 本机 DSH Info.plist / app.asar package：`0.2.0-rc.2`；archive 只读元数据证实 Cordis `4.0.4`。React 与客户端构建基线为 `18.3.1`；依赖锁定对应 npm 发布包。
- 官方固定源码 tag `dsh-v0.2.0-rc.2`、commit [`639ed015397290b3745d163aafe02ffee4aa3f84`](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。本轮重读官方 Slots、Client Modules、打包文档，并核对安装版 main/preload 的公开 Browser 入口。
- 当前工具目录无 live Cordis Inspect；所有新接口来自固定官方公开类型、源码和安装版入口的只读核查，不声称 live Inspect 成功。

## 产品与数据来源

CHAT 直接呈现 `https://chat.deepseek.com/`，由网站自行处理登录、会话和服务器历史。插件不实现另一个模型聊天服务，不缓存/合并网页历史。DSH 原生重绘网站历史需要官方第三方接口，目前未发现。

DSH 账号授权仅控制插件模式门槛；网页内部账号由真实页面处理。两者没有公开身份匹配或登出通知桥。DSH 登出即时回 Harness 的实现不等于网页内部登出已联动。

## Host：无凭据授权状态桥

`src/index.ts` 加载 `DuoController`，依赖官方 `deepseekAccount`、`typert`。仅公开 `dshDuo.authorization` 和 `watchAuthorization`。

- 官方 `getState()/watch(signal)` 的 `credential-stored` 仅表示本地存在凭据，不代表服务端有效；要求 `getProfile(metadata)` 返回 ready 且稳定 `value.id` 后启用门槛。
- 同账号连续有效刷新保留授权 epoch；普通网络错误保留既有官方有效确认，不伪造登出。首次无法确认时保持禁用。
- 官方 `deepseek-account/signed-out`、`deepseek-account/session-expired` 即时关闭门槛。公开 `credentials/record-updated(key)` 只读 key，固定目标 key `deepseek-account-platform/default` 变化先发布 pending 并换 epoch，再安全重读账号资料；不读取 record 内容。
- 异步资料和 Client unary 回包都有授权代次栅栏，防止登出/换账号后的迟到旧结果重开门槛。Client 首次授权仍保留 Harness，点击进入及窗口重新获得焦点时刷新官方状态。
- `src/protocol.ts` 使用显式 strict InvocationDescriptor 和 Zod codecs，Host 注册 Typert contribution，Client `$mount`；不依赖 SRC 猜方法。流使用官方 `$stream` 监督重连与取消。

证据：deepseek-account/src/index.ts:39–93、types.ts:31–56；deepseek-account-platform/src/index.ts:17,147–150,296–343；credentials/src/types.ts:92–102；api/gateway/README.md。服务端撤销只在官方请求拒绝/事件确认时获知，插件不自行推断网络故障为撤销。

## Client：可逆导航与可达入口

`src/core/mode.ts` 集中管理授权门槛、mode 和原 `activePanelId`（包括 null）。Client 只调用公开 `layout.panelInfo.getSnapshot()/subscribe()` 和 `selectPanel()`；没有 Session/core 状态写入或盲目 close/open 右栏。

- `main` 自有键 `dsh-duo.chat`。独立 main 按官方布局自然隐藏 Harness 右栏；退出先恢复原 panel，再 dispose Chat 覆盖项。
- 原 Harness 保留；插件入口是 additive `sidebar.footer.action` 和 `shell.overlay`。CHAT 时才 shadow `sidebar` 与 macOS 折叠 `shell.leading`，离开后 dispose 恢复原 occupant。
- `sidebar.brand.name` 的 aria-hidden/外层 New Session 与折叠契约仍不允许合格的交互切换器。用户已接受候选入口；不宣称品牌位已完成。
- 原新建快捷键没有完整公开模式拦截，保留原行为。监听主面板离开 CHAT 后清理覆盖，不改写原导航选择；不能保证此路径原 Session 没有被新建动作替换。
- 所有注册与 stream 都由 Cordis enclosing effect 管理，末尾清理先恢复 panel，再卸载贡献和 guest。完整 Desktop 卸载恢复还需真实验收。

证据：ui-layout/src/client/service.ts:18–49、AppFrame.tsx:40–42；ui-sidebar/src/client/index.ts:65–99、SidebarRoot.tsx:223–249,304–310；ui-slots/src/index.ts:1241–1246；shortcuts/src/client/native.ts:17–30。

## Desktop：真实网页和文档保活

`src/web-surface.tsx` 使用公开 `dshDesktop.browser` (`protocolVersion:1`) 的 `acquire(workspace)/release(lease)/onOpenRequested()`。公开类型来自 ui-sidebar-browser/types，安装版本也只读确认该桥存在。

1. 申请受主进程批准的 lease/partition。
2. React 在自己的 Slot 组件树创建 `<webview name=lease partition=批准值 src=about:blank#lease>`。
3. 首次 dom-ready 调用公开原生 `loadURL('https://chat.deepseek.com/')`。不执行网页脚本或读取 DOM/秘密。
4. 网页长期挂载在自己的 additive shell.overlay。自己的 main 占位元素通过 ref/ResizeObserver 报告自身矩形，容器定位到主区；不查询或修改 DSH 核心元素。
5. 手动返回 Harness 只隐藏容器；再次进入仍是同一文档。授权代次变化、账号变化或插件卸载释放 guest；异步 acquire 若已被取消则立即 release。

官方 main 只挂载当前键，直接把 webview 放入 main 会丢失网页文档，因此采用保活 overlay。布局、保活、晚到 acquire 与释放结果需要 mock 和真实 Desktop 分开验收。

主进程校验 lease 并强制 `sandbox:true`、`contextIsolation:true`、`webSecurity:true`、`nodeIntegration:false`。插件不改安装包、header 或安全配置。Browser storage 按插件指定的安全账号隔离身份管理，但实际网页登录身份不可验证；内存分区仅存续当前进程，不共享系统浏览器凭据。

证据：ui-sidebar-browser/src/types.ts:19–26、ElectronWebviewPresentation.ts:52–60；apps/desktop/src/preload-browser.ts:7–31、main.ts:229–235、browser-guests.ts:29–41,72–95。原生 Platform View 只支持 usage/top-up，不用于任意 Chat URL。

## 构建与边界

锁定 Cordis 4.0.4、官方 DSH 包 0.2.0-rc.2、React 18.3.1；TSX 支持，Host ESM、Client 单个 lazy-CJS factory、lib/types 声明。Client 仅共享固定 baseline 模块，第三方 Zod inline；feature 服务只通过 ctx/注入使用。build/check-artifact 校验精确 module requests、Host 依赖声明和单工厂结构，tarball 不含源码开发 harness、依赖或凭据。

浏览器 Web profile 缺少 Desktop bridge 时保持 Harness 禁用，无未经验证的 iframe 回退。官网公开无凭据 HEAD 返回 429，不能据此断定 iframe 嵌入策略。

## 尚未成立的能力

- 真实 Desktop 登录/验证码/发送、两端同网页账号历史一致性。
- 官网内部登出自动切回、网页账号与 DSH 账号匹配、网页原生历史 API。
- 卸载/授权变化时未发送网页草稿保留与官网流式取消；插件不能提取或调用这些内部能力。
- 网站下载、设备权限、外部 OAuth 弹窗等受原生 Browser 固定策略限制；当前仅在同 guest 接受官方 Chat HTTPS popup。
- 其他 DSH 版本、Web iframe 和最终品牌位置。上述不因 typecheck/build/mock 通过自动变成支持。
