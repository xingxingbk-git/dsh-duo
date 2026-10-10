# 项目决策与工作记录

本文件记录全项目的关键工作历史及理由，包含需求、调研、设计、实现、验证、失败尝试、协作和 Git 交付。当前状态以 [handoff.md](handoff.md) 为准，详细需求/架构不在此重复全文。只追加有实质影响的阶段摘要，不复制完整聊天或敏感数据。

## 记录格式

每条记录使用稳定 ID、日期（Asia/Shanghai）、任务 ID，写明目标/触发、实际工作和文件/产物、发现或决策及理由、验证/失败与限制、对后续任务的影响、下一步及已有提交/交付证据。尚未完成的 Git 操作不能写成成功；当前条目所在提交用 Git 查，不硬编码自身哈希。

## W001 · 2026-10-09 · T01/T03 · 初始项目与原始目标

- 起点：用户说明已通过 DSH 创造模式建立骨架及需求，要求核查官方插件文档、框架正确性和可行性。
- 总目标：品牌区两段式 CHAT/HARNESS、白底选中态、Chat 导航与聊天主区、隐藏 Harness 右栏、可逆恢复，以及登录/未登录和网页历史处理。
- 既有产物：Host/Client 空入口、bundle/client manifest、Cordis patch、构建脚本、需求/架构/路线/参考与 AGENTS 文档。
- 状态边界：这是文件结构，不是已运行的插件；初始匿名/API 备选和品牌槽可直接交互等建议已由后续 W002/W003 修订。

## W002 · 2026-10-09 · T02/T04/T05/T06/T09/T11 · 官方能力及骨架审查

- 工作：阅读官方文档正文，核对安装 DSH 0.2.0-rc.2 / Cordis 4.0.4 / React 18.3.1 和固定官方 commit；只读复核品牌、侧栏、main/layout 与右栏；审查构建/依赖。产物是 [审查快照](review-2026-10-09.md)，固定来源见 references。
- 关键发现：品牌名受 aria-hidden 与外层新建会话行为限制，折叠后不可见；换 workspace 列表不覆盖 shell 新建/快捷键；独立 main panel 可自然隐藏右栏，应恢复原 panel ID；网页同步没有官方第三方能力证据。
- 方案修正及原因：不直接向品牌名槽放交互按钮；优先验证原生 panel 导航而不是盲目 close/open 右栏；依赖通配、TSX/React/样式准备先修，不能以骨架存在判定可加载。
- 失败/限制：创建阶段曾遇官方域名抓取错误，仅有摘要；后续成功读正文，旧限制不再代表文档未读。本次缺 live Cordis Inspect，静态源码不能代替运行验证；Git 最初不是仓库。
- 验证：`node --check scripts/build.mjs` 及 JSON 检查通过；未 install/typecheck/build/安装/热加载，无功能验收。不同设备重新核对版本，不依赖临时提取文件。
- 影响：T04/T06 的官方契约发现先于真实授权 UI；T05 构建可独立准备；T09/T11 保留未验证边界。

## W003 · 2026-10-09 · T03/T07/T10 · 用户确认账号授权门槛

- 触发：用户独立验证官网未登录无法免费对话，明确要求未授权置灰整个切换控件、CHAT 登出立即回 HARNESS。
- 决策：不提供匿名 CHAT/匿名合并；首次/重新授权启用控件但不自动进入；同账号持续有效刷新保持当前模式；网络故障不冒充确认登出；所有进入/发送路径共享门槛。
- 理由与边界：遵循用户产品要求，同时保留草稿/已接收内容与账号隔离；取消请求不阻塞界面回退。授权状态接口、取消能力与网页历史同步仍分别待验证，不因需求确认就宣称实现。
- 文件：requirements/architecture/roadmap/README/AGENTS/references/handoff；审查文件标为历史快照。
- 影响：原未登录本地/API 备选不再适用。继续工作无需重新询问用户是否允许匿名，真实数据源与存储仍待确定。

## W004 · 2026-10-09 · T13 · 首次仓库同步

- 用户授权连接 `git@github.com:xingxingbk-git/dsh-duo.git` 并推送项目。SSH 查询确认当时远端无 refs，初始化本地 main、添加 origin，使用既有 Git 身份。
- 文件：首次提交 15 个项目文件，包含骨架、全部方案和接力文档；未上传依赖、构建产物、安装包、临时提取副本或凭据。
- 执行限制：普通沙箱不允许写 `.git`，按用户已授权范围经工具权限提升完成 Git 操作；这不是产品或仓库故障，不需要修改安装包/权限作为后续实现步骤。
- 交付：`git push -u origin main` 成功；本地 HEAD、远端 main 和远端默认 HEAD 同为 [`bb182ff`](https://github.com/xingxingbk-git/dsh-duo/commit/bb182ff70177c14da9b5f95b6ea9ea9f7b0180df)，工作区干净。
- 验证：文档一致性、相对链接、JSON、暂存差异检查通过；没有执行功能构建/测试。

## W005 · 2026-10-09 · T13 · 全项目上下文同步机制

- 触发：用户澄清要同步所有工作内容、任务目标与完整项目上下文，不能仅维护最近的登录规则。
- 工作：AGENTS 增加总览和开工/过程/交接/并行/Git 协议；handoff 增加总目标、全任务 ID/依赖/状态/负责人/文件范围与集成要求；新增本文件保存决策及失败尝试历史；同步 README、需求协作验收和阶段说明。
- 结构理由：AGENTS 做入口与规则，handoff 做当前快照，worklog 做可追溯历史；详细内容仍在需求/架构/路线/来源主文档，避免重复全文产生分歧。
- 并行工作：协调 Agent 负责文档整合，另一 Agent 只读审查覆盖与一致性；无插件功能开发。Owner 记录是协作快照，不能当跨设备自动文件锁。
- 同步边界：只有正常提交、成功推送及另一端拉取后仓库上下文才会传播，不承诺正在运行的聊天或未提交改动实时自动同步。离线/失败需明确记录。
- 验证：9 份 Markdown 的本地链接/代码围栏、13 个任务 ID 及依赖引用、`git diff --check` 已通过；功能源码/依赖未改，完整构建和真实 DSH 测试未执行。
- 交付追踪：本条与共享上下文文件一起提交；本条所在提交由 `git log` 查询，跨设备接力重新 fetch 并核对远端 main，不把文档中的历史基线当作最新提交。最后一个已有明确哈希的历史交付记录见 W004。
- 下一步：T04 官方授权及 UI 契约发现；T05 兼容构建准备可并行。接力先读入口/当前快照/近期工作记录，再登记任务。

## W006 · 2026-10-09 · T13 · README 产品说明与 Agent 上下文职责

- 触发：用户明确 README 应介绍插件，不用于保持多 Agent 上下文；项目目标、计划与记忆应依靠 Agent 文档同步。
- 决策：AGENTS 统一组织共享上下文，handoff/worklog 继续维护任务快照和工作历史；README 只保留插件用途、功能设计、登录要求、构建安装、权限与限制。
- 工作：重写 README，移除同步协议、任务/进度清单、接力步骤和开发文档目录；AGENTS 增加文档职责，调整 README 更新条件；同步 requirements 协作验收及 handoff 当前状态。
- 替代关系：W005 的全项目上下文机制继续适用，但 README 承载同步说明的做法由本条替代；以后不能把“同步所有工作”理解为在 README 复制任务和记忆。
- 交付范围：README、AGENTS、requirements、handoff、worklog；单 Agent 完成文档整理，未改源码/依赖或运行功能。
- 验证：9 份 Markdown 的本地链接/代码围栏、13 个任务 ID/引用、README 职责边界及文档一致性检查通过，`git diff --check` 通过；完整构建及 DSH 功能测试未执行。本条所在提交和远端同步以实际 Git 检查为准。
- 下一步：保持 T04/T05 的既有开发主线；每阶段成果写入 Agent 上下文，只将影响插件使用者的信息更新到 README。

## W007 · 2026-10-09 · T13 · 当前项目状态梳理

- 触发：用户要求梳理当前插件项目内容和进度。
- 工作：重新阅读 AGENTS、README、需求、架构、路线、资料、handoff/worklog、Host/Client 入口、manifest、patch、构建脚本及历史审查快照；执行 `git fetch origin --prune`、Git 对齐检查和工具版本记录。
- 当前事实：审阅开始时工作区干净；HEAD `a95f64d` 与 `origin/main` 0 ahead / 0 behind。Host/Client `apply` 均为空，尚未安装依赖、生成 lockfile、执行 typecheck/build、安装/加载插件或运行授权/UI/聊天测试。
- 环境记录：当前 shell 的 Node.js 为 `v24.15.0`、pnpm 为 `11.7.0`，`dsh` 不在 PATH；项目文档中的 DSH `0.2.0-rc.2` / Cordis `4.0.4` / React `18.3.1` 是静态审查基线，非本轮运行时连接验证。
- 影响：没有修改运行代码或产品决策；下一主线仍是 T04（官方授权/账号状态与 UI 契约 live 能力发现）和可独立推进的 T05（版本对齐、依赖/TSX/样式构建准备）。本条更新 handoff/worklog 以满足跨设备接力；未提交、未推送。

## W008 · 2026-10-09 · T04–T10/T12/T13 · 插件实现开工

- 触发：用户要求阅读项目文档并制作 dsh-duo。已重新读取全部当前需求、架构、路线、来源和交接记录；本轮基线 main `93702ea`，fetch 成功，工作区开工干净。
- 分工：主 Agent 集成 src/文档及验证；授权与 UI 子 Agent 只读核对固定官方源码；构建子 Agent 仅修改 package/tsconfig/build/lockfile。未授权提交/推送，保留本地可审查成果。
- 当前环境：DSH `0.2.0-rc.2`（本机 Info.plist），Node.js `v24.14.1`、pnpm `10.33.2`；无 live Cordis Inspect 工具。继续静态官方契约核查，不伪造 live 结果。
- 阶段状态：本轮候选版实现与安全验证已结束，最终产物、验证结果、未完成项和下一步见 W010 与 handoff；真实Desktop验收尚未完成。

## W009 · 2026-10-09 · T03/T04/T06–T12 · 数据源澄清与真实网页嵌入

- 用户澄清：希望直接使用 DeepSeek 网页的页面数据、聊天和同账号历史；对话应由网站保存并在网页即时可见，优先用 DSH 框架显示，也允许直接内嵌网页。此前讨论“插件自己的聊天记录如何保存”源于错误的数据源理解，已被本条替代。
- 实现调整：移除初写的 llm/models/chat RPC 和独立本地聊天 UI。Host 仅保留不含凭据的 DSH 授权状态桥；Client 转为使用公开 Desktop Browser lease 和真实网页。没有发送真实模型请求、收费请求或上传聊天内容。
- 用户允许先试用可访问的入口及原新建快捷键限制。原品牌位仍是最终目标；不把临时入口写成原品牌验收完成。
- 官方与安装版证据：Desktop 0.2.0-rc.2 主窗口确有 `dshDesktop.browser` 和受批准 lease 的 webview；原生 main 会卸载非当前键，因此容器保活放在自己的 shell.overlay，占位 main 仅报告插件自己元素的矩形。手动回 Harness 隐藏容器，避免网页文档被销毁。
- 边界：DSH 与网页授权不共享；公开桥无法观察网页身份/登出，Browser 分区只保留当前进程且拒绝下载/设备权限。不能用 URL/title 猜授权、注入网页脚本、读 Cookie/token 或修改网页安全策略。网页登录/历史一致性尚无实测；无公开原生历史 API。
- 官网公开 HEAD 返回 429，不能从这次受限响应推断 iframe 允许或禁止；候选版仅在具有官方 Desktop 桥时开放，不做未经验证的 Web iframe 回退。
- 产物与完成验证见 W010，源码与上下文尚未提交/推送。

## W010 · 2026-10-09 · T01/T04–T13 · 网页候选版交付与分层验证

- 完成：Host无凭据授权桥、strict Typert协议、统一ModeController、CHAT临时可达入口/自己的侧栏与main、官方Desktop Browser lease和真实官网容器。手动切换保活，DSH登出/授权变化先恢复，再释放旧guest；显式故障重试只替换失败容器。原独立模型聊天和本地记录已删除。
- 文件：src/index/client/authorization/protocol/server/core/mode/ui/styles/web-surface；package/tsconfig/pnpm-lock及build/client-contract/check-artifact/test/preview脚本；tests、开发preview；README及Agent上下文主文档。授权、UI、构建三个子Agent分工完成后交还协调者；共享文档由协调者整合。
- 构建：冻结离线安装、pnpm typecheck/build/test/package:plugin、git diff --check均通过；19/19测试，真实Cordis/Registry/Host Gateway/Client lazyCJS配合本地carrier及安全账户fixture，验证协议挂载/严格校验/unary/stream/卸载。模拟或本地carrier不是DSH GUI、真实账户或官网验收。
- 安装包：artifacts/dsh-duo-0.1.0.tgz，14个白名单文件，SHA256 2c4d8b27b297e5448d9665eb09d90acd833d6544475996ead9643fc2d3f08f26；Client只请求React、JSX runtime、官方ui-primitives三个baseline，Zod内联，无第二份Cordis/React实例。
- 真实Host安装检查：独立/tmp的web profile安装最终hash命名tgz，核对安装文件hash；官方CLI运行时临时只读诊断确认两个dshDuo方法真实挂载，不调用账号。卸载后bundle/依赖撤回且配置与安装前逐字一致，原Host重启无loader错误。匿名HTTP401属官方门槛。专用验证进程停止，端口释放，含临时传输token的原始日志清理；用户真实profile未触碰。
- 浏览器模拟：pnpm preview复用实际组件和ModeController，native guest/授权/layout是fixture且CSP禁止访问官网。Playwright通过授权禁用/首次保持Harness、往返同lease与Harness草稿、同账号刷新、resize/折叠、进程故障显式重试、登出释放、换账号新分区；0 errors/0 warnings。截图为明确标记“未加载官网”的模拟界面，不能证明真实网页数据。
- 失败尝试与修复：Playwright首次因沙箱DNS失败，授权工具网络后CLI可用；折叠模拟最初超时，核对官方AppFrame固定grid列后发现preview缺owner约束，仅补开发wrapper并重测通过，生产无改动。官方Client直接Node ESM导入因window不存在失败，改按正式lazyCJS契约测。pnpm同路径同版本tgz --force仍报Already up to date且装着旧骨架，改唯一hash路径并核对hash才计成功；remove不接受--ignore-scripts，专用profile改--config.ignore-scripts=true完成。
- 限制与交接：没有真实Desktop官网登录、消息、验证码/上传、两端历史、原生Session/右栏和Desktop禁用/卸载证据。DSH登录与网页登录独立，内部网页退出不可观察；草稿提取/网页生成取消和原生历史重绘缺公开能力。下一步由用户本人完成网页登录并用非敏感对话验收。此阶段源码、任务与上下文仅本地保存，未提交/未推送，不声称跨设备已同步。
- 结束检查：再次fetch成功，HEAD与origin/main仍0 ahead/0 behind；Markdown本地链接、package JSON和差异格式检查通过。模拟浏览器/preview及隔离Host服务均已关闭，未停止用户DSH。安装说明已在Codex面板打开。

## W011 · 2026-10-10 · T05/T12/T13 · Git 安装导入失败修复

- 触发：用户从 GitHub 仓库 URL 安装，DSH 0.2.0-rc.2 启用提示 dsh-duo failed to import。main基线e1a19e2，开工工作区干净，fetch后0 ahead/0 behind；单Agent负责构建/安装和上下文，无并行文件所有者。
- 根因证据：本机desktop profile依赖为github:xingxingbk-git/dsh-duo；实际安装lib/index.js和lib/client.js都不存在。仓库不提交lib，package缺prepare。官方打包文档明确描述这种Git源码安装失败；上一阶段只验证tarball，未覆盖Git路径。e1a19e2已推送，W010当时“仅本地”不是当前同步状态。
- 修复：package增加自包含prepare和check:git-install；独立临时Git源码fixture排除lib/依赖/用户数据，验证实际包管理器安装、Host import和Client注册；README区分Git构建许可与预构建tarball，验收/架构/路线/资料/AGENTS与handoff同步；依赖缓存排除，未改聊天源码或账号策略。
- 环境：当前Mac DSH 0.2.0-rc.2（Info.plist/CLI），Node v24.15.0，项目pnpm10.33.2，DSH bundled pnpm11.7.0；开发依赖Cordis4.0.4/React18.3.1；无live Inspect，不读取密码/Cookie/token或会话内容。
- 验证：冻结安装、typecheck、19/19测试、构建/pack及artifact契约通过。pnpm10的Git安装通过；pnpm11仅--allow-build首次失败，按其打印的准确Git身份配置fixture allowBuilds后通过。把Git身份许可直接套到pnpm10会报INVALID_VERSION_UNION，检查脚本已按实际包管理器主版本分开配置两种许可。没有全局放开依赖脚本，也未改变用户profile的脚本许可。
- 当前设备修复：官方CLI在desktop profile用hash命名tarball替换损坏的dsh-duo依赖（--ignore-scripts），两个安装入口hash匹配构建；原UI关闭/重新启用插件后，AX/截图显示“运行中”和两个模式控件。界面处于授权pending，未进入官网或发送消息；启用成功不代表聊天、授权或网页历史已验收。
- 交付/下一步：依本会话既有授权提交推送代码和上下文，远端状态以实际Git核对为准；安装包和构建产物不提交。下一步由用户完成正常授权/网页登录，真实官网、右栏/Session与卸载恢复仍需验证。测试fixture自动清理，没有驻留新增服务。

## W012 · 2026-10-10 · T04/T07/T12/T13 · 授权一直 pending 与本地验收流程

- 触发：用户指出真实Desktop持续显示“正在确认 DSH 的 DeepSeek 账号授权”，不是正常完成状态；W011只确认组件启用，没有验证授权检查收敛。
- 开工：main基线f6cf716，工作区干净、fetch没有新提交；单Agent排查实际Client/Host调用、Cordis插件Context依赖和失败反馈。当前修复/验证已结束，交还用户验收，没有其他Agent占用文件。
- 用户新决策：后续修改先本地验收，由用户自行通过Codex右上角手动提交/推送；Agent不自动stage/commit/push，除非另行收到本轮明确Git指令。此前持续推送约定由本条替代，已写入AGENTS，不自动撤销历史提交。
- 当前限制：无live Inspect，依据目标官方源码和实际发布的Cordis/Gateway包复现；不读取密码/Cookie/token或个人对话。修复、实测与失败尝试结束时补充本条和handoff。
- 根因已复现：Client挂载贡献后从只inject remote的插件Context读取独立remote.dshDuo，被Cordis拒绝；旧测试调用root Context/宽松fake，漏掉依赖限制。初始错误只保存在connectionError但未改变pending且HARNESS未展示错误/刷新入口，导致永久等待。是否缺typert的猜测被实际挂载成功反证，没有加入无依据依赖。
- 实现与回归：挂载后动态注入remote.dshDuo，从子Context调用unary/stream；挂载失败可重试，刷新合并并加35秒期限和AbortSignal，初始错误收敛unavailable；普通网络故障不撤销已有有效授权。HARNESS/CHAT显示错误和刷新入口。23/23测试通过，真实Cordis/Gateway加载生产Client，含授权/登出/卸载；纯Client增加失败、重挂载、超时迟到、已授权网络故障测试。
- 验证调整：首次typecheck要求异步effect每个分支返回cleanup，已修正；测试fake async effect需观察失败Promise，真实Slots fixture改为Cordis Service以拥有正确Context生命周期。最终typecheck/test通过，不能把这些fixture修正当作DSH实测。
- 当前设备实测：pnpm package:plugin和单lazy工厂/3共享baseline检查通过；14文件tarball SHA256 20bac1a168cdf9587cefecb4d4bc219ee687377f7e082379699cea65372abe19，经官方CLI更新desktop依赖（ignore-scripts），两个安装入口hash匹配。DSH自动重载后授权确认完成，CHAT按钮可用、HARNESS保持选中、pending消失；刷新结果保持；禁用控件撤回、重新启用再次正常确认，AX/截图直接验证。CLI peer泛化warning未妨碍真实加载。未退出账号、加载官网、发送消息或改其他插件。
- 交接：实际文件/版本/根因/验证分层和下一步已同步handoff；完整官网、历史、CHAT中的退出/卸载、右栏/Session矩阵仍待用户验收。本轮代码与文档均未提交/推送，新设备尚不能取得这份上下文；用户自行验收和手动Git交付。
- 结束检查：git diff --check通过；main/HEAD仍f6cf716，12个源码/测试/文档文件为未暂存修改，无新增提交或推送，构建产物未进入Git。

## W013 · 2026-10-10 · T06/T12/T13 · 顶部品牌模式入口

- 用户截图明确：去品牌后HARNESS徽标，将底部切换器移至顶部品牌区域，删除底部刷新及右下角浮动框；本轮按此替代W009临时footer/overlay入口。
- 基线：35da7f0d787b9503739d2bddc10e0cecec748939，用户已手动交付W012；工作区干净，fetch后0/0。初次fetch因沙箱不能写FETCH_HEAD失败，读操作提升后成功。版本仍DSH0.2.0-rc.2/Node24.15.0/pnpm10.33.2，Cordis4.0.4/React18.3.1；单Agent，无并行委派。
- 官方证据：固定SidebarRoot品牌在aria-hidden且Web/Windows外层New Session；brand.name owner允许自己的内容/宽度，shell.overlay公开支持独立交互层。计划用非交互字标/定位锚点和独立层按钮，实现视觉品牌位且保留Harness原树；不套用隐藏区域按钮，不读/改核心DOM或包装包内SidebarRoot。
- 当前工作范围/验收见handoff；正常状态取消常驻刷新，故障状态保留可用的顶部重试，授权规则与原账号菜单保留。尚未完成真实Desktop验收；修改默认本地供用户验收与手动Git交付。
- 实现：品牌name只放官方字标及自有锚点，独立shell.overlay按钮对齐自有ref矩形；CHAT品牌为自己的交互区。取消footer注册/右下角组件和正常常驻刷新，故障显示顶部重试；Host及账号门槛不改。官方BrandWordmark包含徽标，用自有SVG视口裁去并按比例缩放，不修改核心SVG。
- 失败与修正：普通预览品牌行60px时通过，首次实机按钮缺失；28px锚点在官方24px裁剪行不满足0.99可见阈值。仅改锚点24px后实机出现，预览也改为24px裁剪以覆盖此条件。未直接猜改owner或放宽遮蔽判断。文档批量Python写入遇stdin编码错误，未写入任何文件，已改用apply_patch；web固定GitHub页Cache miss不算新成功证据。
- 浏览器模拟：生产组件+ModeController，官网被CSP禁止；24px裁剪顶部可见，交互层无aria-hidden/外层button祖先；pending/失败disabled、顶部重试、Enter切CHAT、退出恢复并disabled通过，console 0 warnings/0 errors。账号/layout/lease仍fixture。
- Mac实测：更新本地唯一hash包后自动重载，顶部白底Harness可见，底部/右下角旧控件消失。侧栏折叠隐藏展开恢复；鼠标与Shift-Tab/Enter切CHAT，官网现有登录状态与历史导航可见；未发送或存储私人历史信息。返回原会话及已关闭右栏；插件页禁用恢复原徽标，重新启用授权收敛且Harness选中。首次登录/验证码/发送/跨端历史、其他平台及完整恢复矩阵仍未验收。
- 上下文：AGENTS/requirements/architecture/roadmap/references/handoff已更新当前阶段，W012用户手动提交状态与当前35da7f0基线已纠正，旧长验证记录以worklog历史引用保留；README仅调整用户功能与真实能力边界。无进行中分工，完成本阶段交还用户验收，不自动Git交付。
- 最终验证：pnpm typecheck、test（23/23）、package:plugin通过；单lazy工厂/3共享baseline，14文件tarball。最终SHA256 `77a175008dd8a25151fd5abc4f934614f80bde2b6f07de5175e2ac8aff85e839`，唯一hash包经官方CLI安装，Host/Client逐一hash匹配build。最终AX再次确认顶部两个可用按钮、Harness选中；截图仅本地output/playwright/dsh-duo-brand-header.png。开发preview进程和Agent临时tab已关闭，DSH保持原会话/Harness；未stage/commit/push。
- 结束Git检查：git diff --check通过，15个源码/测试/文档文件为未暂存修改；暂存区空，main/HEAD仍35da7f0，与origin/main为0/0。W013未跨设备同步，构建包/截图被Git排除，等待用户验收和手动交付。

## W014 · 2026-10-10 · T03/T13 · 修复自动递增补丁版本

- 用户要求以后每次修复自动递增一个修复版本号，纳入所有设备/Agent的统一规则，不使用Codex全局记忆或README保存开发约定。
- 开工main干净，HEAD/origin/main为c169200fe362c14d71ecc8a9740b711377eca27f，fetch后0/0；W013已同步远端。本轮单Agent/Codex/macOS，仅AGENTS、requirements、handoff/worklog四份文档，无代码/运行时变更。
- 规则：每完成一轮修复，在构建/打包交付本地验收前将package.json第三段加1，同轮调试/测试重跑不重复涨；接力记录旧值、新值及是否已递增。纯文档/分析/验证不涨，不追溯历史修复，不随版本变动自动commit/tag/push。当前0.1.0→0.1.0，本轮未递增，下次实际修复为0.1.1。
- 当前Node24.15.0/pnpm10.33.2/Cordis4.0.4/React18.3.1已核对；DSH版本/实机证据沿用W013，不冒称本轮新验收。不调用未知API、不构建/重装、不改兼容目标或依赖。
- 完成标准：规则写入AGENTS，需求引用与handoff当前基线、版本和任务状态同步；已完成并交还用户，无进行中分工。仅本地待用户手动Git交付，验证结果见结束记录。
- 结束检查：git diff --check通过；仅上述四份文档未暂存，暂存区为空，package.json实读仍0.1.0。本轮未递增版本、未stage/commit/tag/push，未修改README或运行时；下一轮修复按新规则执行。

## W015 · 2026-10-10 · T06/T08/T09/T13 · 共用原侧栏与真实列表目标

- 用户三张截图指出CHAT完整替换sidebar造成品牌/顶部位置、颜色/透明/模糊、账号区域全部改变，并把真实网页列表留在主区。要求共用原DSH外壳，仅改变必要元素，将官网分组列表放左侧且不创建项目。
- main基线c169200fe362c14d71ecc8a9740b711377eca27f，W014四份未提交规则文档保留；fetch后0/0。单Agent/Codex/macOS，版本计划0.1.0→0.1.1（本轮尚未递增），代码和上下文仅本地供用户验收，不Git交付。
- 固定rc.2发布类型/SidebarRoot核对：sidebar.workspaces是可独立替换的中间浏览区域，原sidebar负责顶部New Session、品牌、面板入口和底部settings；ui-sidebar/client只导出类型/apply，不导出SidebarRoot。列表owner仅wide/expandSidebar，不提供官网数据；New Session回调为原registrant私有uiWorkspace.startSession。无live Inspect，官方当前Slots文档已读取但行为以固定rc.2为准。
- 优先恢复原侧栏并仅替换workspaces，取消插件解释页及完整sidebar/shell.leading覆盖。官网历史原生列表与官网新建需要额外能力，已询问用户是否允许有限网页DOM界面适配（不读凭据/不调私有API）；回复前不实施依赖动作。不能假列表或视口裁切冒充原生同步，不修改DSH核心状态/安装包。
- 用户随后明确回复「允许网页界面适配，实现左侧真实列表」。已更新稳定约束和需求，官网DOM全面禁止由有限界面适配替代；DSH核心DOM禁止仍保留。下一步核对Electron公开webview执行能力并实施官网界面镜像，结构不匹配时恢复原官网导航。
- 实机折叠发现main扩展至左沿，网页overlay遮住原shell.leading展开按钮；补工具条备用展开/模式入口，仅品牌锚点不可见时显示，展开后消失。继续共用原sidebar/shell.leading，不覆盖DSH DOM；仍为同轮0.1.1，不二次涨号。此次失败/修正保留，不能以expanded截图证明collapsed可达。
- 实现文件：src/client仅CHAT注入sidebar.workspaces；ui/styles移除独立侧栏解释页、蓝色品牌和假账号；web-surface保活guest并串行有限DOM适配/8秒检查期限；新增website-navigation自包含origin/链接/列几何限制、清空/恢复原导航。preview始终共用外壳，增加生产适配函数的DOM fixture；client/server fixture与导航输入回归同步。稳定入口/需求/架构/路线/资料/handoff及使用者README已更新，没有把Agent计划写入README。
- 实际版本0.1.0→0.1.1且已递增一次。pnpm typecheck、pnpm test（27/27）、pnpm package:plugin/artifact检查通过。CSP隔离preview验证分组/选中/新建、空列表、登录视图、结构变化清空并撤回隐藏style、恢复/退出释放，浏览器0 errors/0 warnings；不是官网真实空账号/登出证据。
- Mac实测在已有网页登录状态下真实列表移到原左栏、选择右侧对应对话、＋官网新建、原顶部/材质/账号持续保留；往返原Harness会话和未发送草稿保活通过，验收草稿已清除，未发送消息。最终包再测列表/选中及折叠→备用展开→原顶部恢复通过。原顶部新会话/菜单/快捷键仍走Harness，缺公开替换回调，不能称为统一新建语义；真实空账号/分页/首次登录/消息/跨端历史/账号回退与完整右栏矩阵待验收。
- 最终本地包artifacts/dsh-duo-0.1.1-9654619f1e2f.tgz，SHA256 9654619f1e2fd4dfa0b48b146eb1006e65ba236bf94de876ea4e2113907b8535；官方CLI更新desktop，安装版本0.1.1且Host/Client hash逐项匹配build（完整值见handoff）。CLI泛化peer warning保留，不影响本次启用。前两个候选包已被此最终包取代，接力不要选旧hash。
- 单Agent工作交还用户验收，无进行中分工；源代码/上下文仅本地，未stage/commit/tag/push，远端仍c169200。仍按用户手动Git流程；本轮接力不再涨号，下轮独立修复为0.1.2。截图本地Git排除，仓库不写个人历史标题/链接/正文或凭据。
- 收尾git diff --check通过、暂存区为空；preview服务和本轮创建的官网检查/模拟浏览器页关闭。最终DSH保留CHAT、已选官网对话、空输入供用户验收；没有发送消息或留下验收草稿，不新增全球记忆。

## W016 · 2026-10-10 · T03/T06/T08/T13 · 截图交互与界面收敛

- 用户指出切换器需靠右/自动间距、CHAT顶部新会话必须新建Chat、隐藏插件行、删除网页工具按钮和插件底部提示，并询问官网能否共用DSH登录。
- 单Agent/Codex/macOS；开工main干净，fetch成功，HEAD/origin/main均f3ab5c75ae6580583e5dfd3ca283222269235c85，0/0。此前W014/W015已由用户提交同步，保留历史记录中的当时状态。本轮无stage/commit/tag/push授权。
- 先同步需求/完成标准，范围自有UI、样式、允许范围内的适配、相关测试和文档。版本0.1.1→计划0.1.2，尚未递增；实际DSH0.2.0-rc.2、Node24.15.0、项目pnpm10.33.2已核对，无live Inspect。
- 固定SidebarRoot与发布类型再次确认：品牌父级为收缩inline-flex，原新会话回调私有，panellist贡献仅控制图标/标签不控制外层按钮。仅替换图标为null不能隐藏插件行，也不能改变新建回调；尚未实施DSH核心DOM适配。
- 官方面向浏览器的lease由主进程生成进程内隔离partition；公开deepseekAccount提供Platform/inference会话，未见Chat网页登录SSO桥。继续记录来源/边界，不读取用户凭据。
- 用户明确选择「允许限定侧栏适配（推荐，保留原侧栏外观）」；已将三个行为与撤回/结构校验边界写入AGENTS和需求。该例外不放宽官网凭据/私有API禁令，也不允许服务猴子补丁、安装包或核心状态修改；原按钮捕获点击包括鼠标/键盘产生的click，菜单/快捷键另列未完成。
- 版本已于构建前从0.1.1递增为0.1.2一次。初次模拟新建/恢复通过，首次实机却显示侧栏不兼容：固定ui-renderer的SlotOutlet有data-slot/display:contents包装，源码SidebarRoot静态树与实际DOM相差一层，原fixture漏了该层。适配安全退出，没有在错误节点打补丁；已针对准确brand.name包装修正并补fixture，后续打包仍为同轮0.1.2。首次候选包6702d7a11fc6已被后续最终包取代，不用旧包交接。
- 完成：src/sidebar-adapter从自有品牌Slot校验原侧栏，品牌flex剩余间距自动填充、CHAT隐藏插件行/空nav、原新会话捕获click转交统一门槛下官网new；登录视图/未就绪禁用新建，Harness恢复原状态，Client卸载撤回属性/监听器。绑定归Client、品牌折叠卸载不丢绑定。ui/styles/web-surface删除常驻工具按钮/底部提示，故障卡片保留重试及折叠备用入口；未知结构在自有交互层提示原顶部限制。未改Host授权、依赖、安全策略、安装包、核心状态或其它插件。
- 验证：pnpm typecheck、test（27/27）、package:plugin/artifact通过；生产适配+DOM fixture验证原顶部鼠标/Enter仅官网新建、无Harness新建、Harness恢复原点击/插件行、登录页禁用、退出恢复/释放及折叠绑定。最后补准确SlotOutlet包装后再次验证顶部Enter/隐藏/无错误提示；浏览器warn/error为空，CSP不联网，不冒称官网实测。
- 实机最终0.1.2：靠右控件对齐侧栏留白，原材质/真实账号区保留；CHAT插件行隐藏，网页工具按钮/底部提示移除，官网sign_in时原新会话和＋禁用；往返回同一原Harness会话和关闭右栏，折叠备用展开正常。Harness插件页禁用恢复原HARNESS徽标、重启用授权收敛且保持Harness；最终再进入CHAT供验收。没有输入凭据/验证码、登录或发送消息。已登录官网顶部新建、菜单/快捷键、首次登录/发送/跨端历史等未验收/未实现项见handoff。
- 登录结论限当前已核查公开能力：Platform/API账号授权与独立Browser进程内分区，不存在已确认Chat SSO入口。没有调用Host-only凭据方法或移植Cookie；不能把DSH有效授权说成官网免登录。README只同步影响使用者的功能/权限/限制，全部开发上下文由AGENTS及需求/架构/路线/资料/handoff/worklog维护。
- 最终包artifacts/dsh-duo-0.1.2-373eab046e75.tgz，SHA256 373eab046e7518c4ff8ead34944d3b9c54cbfc80fe099e7490ec9ee3b59d68fb；16白名单文件、单lazy工厂/3共享baseline。官方CLI更新desktop，实际0.1.2、Host hash c8ceb119f9245f836d5146f2c2f6978d4cbce114cb46ffbbe4fa0512c473de54、Client hash 2e39529e8fece89140ef4efa053bd4c3f49bea7b1c2be0cf6efab418628b3604均匹配。中间2cae9acb7dce及首包均被最终包取代。CLI泛化peer warning仍记录，没有冒称零警告。
- 本阶段完成并交还用户验收，无进行中负责人；main仍f3ab5c7，本轮源码/上下文仅本地，未stage/commit/tag/push。临时preview服务/浏览器页关闭；实机截图output/playwright/dsh-duo-0.1.2-chat.png仅本地Git排除。最终DSH保持CHAT官网登录视图，无测试草稿或消息，不写全球记忆。下一轮独立修复0.1.3，本轮不可再重复涨号。
- 收尾检查：8份当前Markdown链接/代码围栏及git diff --check通过；暂存区为空，15份当前源码/文档文件为本地修改/新增，HEAD/origin仍f3ab5c7且0/0。最终包内README与工作区hash一致，所有产物/截图均未进入Git；没有本轮远程安装新提交的验证，因为尚未推送。
