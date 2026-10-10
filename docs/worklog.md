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
