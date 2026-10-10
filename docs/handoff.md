# W022当前修复 · 2026-10-10

用户反馈点击标题后又出现居中圆角框。W021只查看了展示状态，漏了官网重命名状态；本轮已在真实DSH复现，版本0.1.6→0.1.7一次，保留上一轮中文偏好修复与登录持久化限制。

- 原因：官网点击后用input替换文字节点，旧标题匹配失效并移除整行标记。
- 修复：保留标题专属宿主，限定48px公开顶行识别编辑框及分享；包装清除圆角、边框、阴影和outline，输入显示左侧蓝色底线。恢复候选要求宽顶行和内容右缘，避免把输入框清除图标当分享。不读输入值、不改变官网改名处理。
- 观察：增加class/type/contenteditable/role变更，排除自身data与style属性，清理新增宿主/编辑标记。
- 构建：生产类型检查、Host ESM、Client lazy工厂及4共享模块契约通过；未新增或运行测试。layout_fix/header_interaction_review只读审查结束，root实现及安装。
- 官方CLI安装0.1.7成功（exit0，+1/-2，pnpm11.7.0）；有泛化peer warning，不报告零警告。唯一包artifacts/dsh-chat-0.1.7-0a7a9c5c716e.tgz，19文件，SHA256 0a7a9c5c716e9d79223af9e329f2fcec266c35ae4f661e3ac37f661503f1a42e。
- 安装与本地逐字节一致：Host 72fc3b73309f22d174d374351db3806332d96c15f4744649a752a72669653ad9；Client 575dcacf10effd009e5b03ce80be08459d99277c502d1364a5da481290c76965；用户SVG ad1b0fda90c1c1f2a0b9208bc86f5fe8c21d505a1208576be4e3110b26b4f79c。
- 实机：打开用户指定对话，展开/收起分别实际点击标题，编辑框均保持左侧、分享同顶行，无圆角胶囊；点击顶行空白结束编辑后两种状态都恢复自然宽度标题。收起时按Esc仍留在官网编辑状态但布局正确，因此不声称Esc取消改名已验证；本轮没有添加键盘处理。
- 仅采集48px顶行，本机临时截图为dsh-chat-title-edit-expanded-017.png、dsh-chat-title-edit-collapsed-017.png、dsh-chat-title-blurred-collapsed-017.png和dsh-chat-title-final-017.png。没有读取输入值、修改原标题、发送消息或退出DSH。恢复展开/CHAT与辅助功能原false标志。
- 未stage/commit/push；安装来源为本地hash tarball，仓库链接和其他设备尚不能取得此修复。下面W021及更早记录均是历史证据。

---

# W021当前修复 · 2026-10-10

用户最新目标：修正标题圆角边框，CHAT默认简体中文，完全退出DSH后保留网页登录。版本0.1.5→0.1.6一次；基线main da52800。root集成语言/文档/安装，layout_fix标题文件已交还，session_capability只读研究已结束。以下W019/W020为历史证据。

- 已实现：标题自然宽度单行与省略，清除多余边框/圆角/阴影，固定48px占位、分享同顶行；旧样式会更新、失配标记撤回。
- 已实现：Host默认zh-CN、旧空配置兜底中文；新文档/重新登录再次恢复语言，保留主动选择的system/en。偏好恢复仍通过官网公开设置UI及官方ConfigForms，不存凭据。
- 阻碍：实际DSH0.2.0-rc.2与2026-10-10固定上游d743267（0.2.1-alpha.2）仍只有随机内存Browser分区，跨退出网页登录未修复。见browser-session-capability与references。
- 构建：锁定依赖已补齐，生产类型检查及Host/Client/lazy契约通过；本轮未新增/运行测试，不沿用历史32/15项当新证据。
- 包：artifacts/dsh-chat-0.1.6-1e90ba1cebae.tgz，19文件，SHA256 1e90ba1cebae18789dcef3af025572d843dc9cc5b920837c6d18534d81d7cbc4；本机官方CLI安装成功、Host/Client/SVG逐字节一致；查看结果见下方收尾。
- 未自动提交或推送；代码与文档留本地供用户审查，另一设备需取得用户提交后才同步。

## W021本机收尾

- 官方CLI安装唯一0.1.6包exit0，+1/-2；原Git来源脚本忽略警告和泛化peer warning保留，不报告无警告安装。最终依赖为本地hash tarball，不是已推送的新Git提交。
- 已安装版本0.1.6；Host SHA256 72fc3b73309f22d174d374351db3806332d96c15f4744649a752a72669653ad9，Client afe9d383a261ee7617633bfc296126210d63e5f333ce807cb1ca73de3f0bf4c4，用户SVG ad1b0fda90c1c1f2a0b9208bc86f5fe8c21d505a1208576be4e3110b26b4f79c，均与本地lib/assets逐字节一致。
- 通过原生UI进入更新后的CHAT并选择用户截图已指定的对话。仅采集顶部标题与底部工具条：展开、收起时标题/分享同顶行，无大圆角边框；实际工具按钮为中文。本插件profile语言为zh-CN。恢复展开并保留CHAT，没有退出DSH、重新登录或发送消息。
- 顶部/工具条截图只在本机临时目录，不纳入Git。辅助功能临时标志收尾恢复原值；当前分工均结束，交还用户验收。
- 跨完整应用退出的语言恢复未实机验证；默认值/新文档恢复有源码与构建证据。本轮未新增/运行测试。认证持久化仍受宿主限制，没有宣称免登录已修复。
- 代码与文档保留本地，未stage/commit/push；另一设备/仓库URL尚不能取得0.1.6。


---

# 当前状态与开发接力

## 本机 Git 同步快照 · 2026-10-10 · T13

- 用户要求拉取最新代码，并确认仓库已改名为 dsh-chat。当前本机真实目录为 `/Users/huangxingzhou/Documents/编程项目/dsh-chat`；旧 dsh-duo 目录不存在，不创建重复仓库或嵌套目录。下方 W019 路径与运行结果属于历史设备记录。
- 协调者：本地 Codex 主 Agent 执行 Git 同步与记录；ui_contract 只读核对拉取前文档，未修改文件。拉取后新规则由主 Agent 读取，分工已结束。
- 开工 main 为 `e1a19e2`、工作区干净。fetch 确认落后 8 个提交且没有本地独有提交；`git merge --ff-only origin/main` 成功至 `1f537ff0cba08b2a7b75049f95e42ebeec226dc3`。
- 已用 `git ls-remote` 核对新仓库 main 与本地 HEAD 一致，将 origin fetch/push URL 改为 `https://github.com/xingxingbk-git/dsh-chat.git`，保留 HTTPS 方式。HEAD 与 origin/main 为 0 ahead / 0 behind；源码版本为 0.1.5，本轮仅同步，不递增版本。
- 没有执行构建、测试、安装、提交或推送；未清理产物或改插件功能。本轮只追加 handoff/worklog 同步记录，记录尚未提交；拉取的新代码已与远端一致。后续功能工作按下方 W019 状态继续，不能把本轮 Git 同步当作新的功能验收。

更新日期：2026-10-10（Asia/Shanghai）。W019 / **0.1.5本地验收候选**，单Agent Codex/macOS，无并行Agent。本轮工作收尾交还用户；main基线0df604f，0.1.4→0.1.5已递增一次，同轮调试不再涨号。不stage/commit/push。实际目录/仓库为/Users/ui/Downloads/dsh-chat、git@github.com:xingxingbk-git/dsh-chat.git。

## 当前目标与范围

用户最新取消四Tab官网设置嵌入，本轮CHAT设置仅保留官网账号昵称、当前会话退出、系统语言。不得继续实现语音、数据、安全和协议页。两种模式共用原侧栏；标题/分享统一48px顶行，展开24px左距，折叠按自有leading右缘加16px横向避让，不加第二行。

网页登录跨重启保持仍是原需求，**尚未修复**：rc.2及核查时master公开Browser只生成随机内存partition，需要上游公开持久会话能力。不要迁移Cookie/token/storage或改DSH安装包；见browser-session-capability.md。

## 当前任务

| 任务 | 完成与可信证据 | 未完成/下一步 |
| --- | --- | --- |
| T02/T03/T05 | 原生settings.section、官方volatile Config/configForms、Host ESM/Client lazy-CJS；类型/构建/32项回归通过 | 新设备按目标版本重新核查，不沿用本机运行状态 |
| T06/T08 | 精简设置真实账号/语言读写；中文暗色页面；标题/分享展开折叠同顶行实机截图通过 | 其他窗口尺寸/平台与长标题扩测；完整四Tab已取消 |
| T07 | 显式当前退出与官网曾ready后sign_in回HARNESS禁用；Client与公开DOM回归通过 | 未实际登出当前用户；不以“登出所有设备”代替 |
| T09/T15 | 跟随系统→中文→英文→中文均由官网读回；desktop cordis.patch.yml本插件language=zh-CN落盘确认；重开设置读回中文 | 彻底退出应用后的偏好恢复未复验；偏好保存不证明认证持久化 |
| T14 | Browser持久化缺口已写本地上游提案 | 登录重启保持未修复；未发送上游issue/PR |
| T12/T13 | 用户新SVG未覆盖，最终包/安装核对见下；全部上下文同步最新范围和真实失败 | 用户先验收并自行提交/推送；尚未跨设备同步 |

## 实现与回归原因

website-settings.ts只承接公开头像菜单→General→语言、固定暗色和当前会话退出。原生UI只有昵称/登录状态、退出按钮、语言选择；无四Tab、语音或跳转/重载按钮。登录页仍由官网处理。后台guest保持正常viewport，visibility/opacity/pointer-events隐藏并位于原生设置层之后；移到屏幕外的尝试已撤回。

重写回归的具体原因：rowFor增加文本长度条件后爬升到整个General，组合CSS选择器按DOM顺序选中Light；语言选项又被限制为特定menu容器，丢失原版本独立portal兼容。对照HEAD恢复原rowFor/全局公开选项查找，ds-select优先。实机还发现旧dark-complete在失败后仍被保留，导致中文生效但浅色未纠正；现在仅成功确认暗色才完成，恢复偏好/写语言会重新确认固定暗色。不要把错误完成标记当作真实值。

website-header.ts只匹配已从导航取得的选中标题，不读取正文。官网实际顶栏含三个图标按钮，分享可能无aria-label，按有界顶行最右侧SVG按钮识别；标题必须匹配直接显示文字的叶元素，覆盖原内层居中/截断宽度。原分享控件只调整位置，未调用分享。48px同一顶行，分享右距12px；web-surface侧栏宽度变化主动同步自有leading几何。

## 已执行验证

- pnpm test：32/32；typecheck/build与lazy产物契约通过。覆盖授权、代次、卸载恢复、偏好先恢复后保存、显式/观测网页退出等。
- scripts/check-website-settings-browser.mjs：15/15浏览器公开DOM夹具通过。覆盖头像、真实读写/恢复、邻近Light与独立label portal、暗色陈旧完成标记/失败期限、当前退出及危险动作不触发、标题叶元素/三图标/展开折叠几何/新对话撤回；全部虚构资料，不等同于实机登出。
- 官方CLI/runtime pnpm11 ignore-scripts多次安装均exit0，泛化peer warning保留；每次使用唯一内容hash包名，核对安装Client，不以CLI返回替代运行验证。最终产物与源码安装结果见下方收尾核对。
- CUA实机：官网昵称正常、设置读回“跟随系统”；选择中文后官网分组/编辑器中文；最终无诊断包中文→English→中文请求完成且实际值读回，Config独立读取为zh-CN。暗色页面实机确认；选已有对话，展开标题主区靠左、折叠避让原生展开/新建，两者与分享都在同一顶部高度。
- 本机截图仅/tmp，不入Git：dsh-chat-0.1.5-settings.png、dsh-chat-0.1.5-expanded.png、dsh-chat-0.1.5-collapsed.png。用户SVG 2511 bytes，SHA256 ad1b0fda90c1c1f2a0b9208bc86f5fe8c21d505a1208576be4e3110b26b4f79c，未覆盖。
- 未发送消息、生成分享、修改绑定/安全/隐私、删除/导出、登出所有设备或实际登出当前用户；发送/流式/跨端/完整卸载及其他平台矩阵未因此完成。

## 最终产物核对

唯一最终包：artifacts/dsh-chat-0.1.5-1d5ab1718f12.tgz（通用0.1.5.tgz内容相同），19个白名单文件，SHA256 1d5ab1718f12d556609af458226111df8d3fd2b685cf5a6e4f1780422f3ea81f。早先同版本候选/诊断包均不可发布。

Host SHA256 54ce12fc064ab75443a02a77a38403e0b0e9389a3b210585412de6ddfa3b8850；Client e960add12ea53d1d8d6063116f8ad3e125ece45e32e43706979e862d05a287b5。打包与源码lib、已安装运行代码及SVG逐字节相同；最终README收尾后再次打包，未重复涨号。最终包官方CLI已安装exit0，19个白名单文件与实际node_modules逐项相同。更新时已打开的设置出现旧页面引用/连接状态；关闭设置、进入CHAT后重开，真实账号与中文正常读回。不要为仅此热更新状态要求用户重启/重登录。

最终源码由DSH内置pnpm11.7.0隔离Git安装通过，允许准确临时fixture Git身份后prepare实际构建、Host导入/lazy Client契约均通过；prepare内层按packageManager使用10.33.2，esbuild脚本批准提示保留。未创建项目Git提交。git diff --check通过，诊断关键字扫描无匹配（rg exit1表示没有匹配），非构建失败。

## 下一步

1. 用户查看本机精简CHAT设置和展开/折叠布局，验收后自行Git提交/推送；另一设备拉取用户提交才获得本轮成果。
2. 下一轮若验收当前退出：只用此会话头像菜单退出，确认回HARNESS并禁用，再由用户正常官网登录；不强制为了本轮收尾反复登录。
3. 如需彻底重启验证语言恢复，先说明现有Browser会话无法保持，需要用户再次登录；不要报告网页登录持久化已解决。
4. 上游持久会话能力和未来完整设置分别独立评估，不重走本轮已取消的四Tab方案。

# W018历史交接记录

以下W018是已完成历史快照：单Agent Codex/macOS，基线main=39cce8b（W017已由用户提交）。当前仓库目录/SSH地址同为新名称；源码仅本地改动，无自动提交/推送；用户已明确授权后，本机DSH迁移安装与图标实机验收完成。

## 本轮目标与范围

用户要求全部旧名称统一为dsh-chat，并自行修改插件管理列表图标。完成标准：包名/Host与Client入口/patch/服务与严格协议/Slot与DOM/CSS/脚本/当前及历史文档引用一致；图标有独立文件并通过官方元数据进入安装包；回归、构建及打包检查通过，安装步骤说明旧插件须先移除。历史功能目标和未验收矩阵继续沿用下方W017任务表，本轮不将过去的实测结果当作新名称安装验收。

范围归T01/T02/T03/T05/T13：源码、测试与预览标识，package/patch，Git安装fixture，assets/icon.svg，README与全部上下文文档。服务为dshChat，类型为DshChat*；原DSH侧栏和官网适配策略、授权门槛及固定暗色保持原实现。用户可直接替换assets/icon.svg，Agent不覆盖其后续图标修改。

## 验证和交付状态

验证完成：

- node scripts/test.mjs：28/28通过，包含真实目标Cordis/Typert Host/Client严格绑定和卸载回归；改名后的dshChat namespace可用。
- node scripts/build.mjs：生产类型检查/Host ESM/单lazy-CJS Client通过，仍为3个公开共享模块，无新增运行时依赖。
- pnpm check:git-install：pnpm10.33.2在隔离source-only Git fixture中通过prepare生成入口，安装dsh-chat@0.1.4，Host可导入，Client注册匹配。fixture携带assets，未操作项目暂存区/提交；pnpm提示esbuild构建脚本未批准，但本次prepare与构建成功。DSH内置pnpm11本轮未重跑，不用pnpm10结果替代其许可验证。
- npm临时cache pack --ignore-scripts：显式构建后成功打包artifacts/dsh-chat-0.1.4.tgz，共17个白名单文件，package/README/patch版本名称正确，Host/Client与lib逐项相同，用户替换后的SVG实际包含且XML有效、8548 bytes、无外部引用，远小于256 KiB。当前唯一验收包artifacts/dsh-chat-0.1.4-9592bd2693ac.tgz（与通用0.1.4.tgz一致），SHA256=9592bd2693ace49d4bbcf328c9f3c337fa73dc1306de590987c375a134adc174；先前9efa18a1候选包不再用于当前图标验收。
- 全部Git跟踪文本与新lib扫描不含旧名称；git diff --check通过。pnpm-lock无需变更，因为名称/资源变化未改依赖。图标静态契约/打包验证及本机DSH管理页实机显示通过；改名后的0.1.4已按用户明确授权迁移安装，详情显示运行中。

本轮用户已替换assets/icon.svg并要求看效果，属于W018验收续步，保持0.1.4不重复涨号；未修改其SVG。首次移除申请被自动审批拒绝，随后用户明确回答“允许迁移安装，查看DSH实际效果”，原阻碍已解除。

- 通过安装包自带官方CLI/runtime pnpm11.7.0，使用ignore-scripts移除旧名称插件并安装唯一tarball；两步exit=0，泛化peer warning仍保留，不宣称零警告安装。只改本机插件组合，未读取/迁移凭据、未操作聊天记录。
- 独立读取desktop profile确认只保留新名称依赖；实际node_modules/dsh-chat为0.1.4，icon/Host/Client与本地逐字节相同。icon SHA256=3486ce8ca98a018cb7d23478da3ffc7692847b12ad177f7f6bdd33dfa4eec6ad；Host=8ef1a6fd56f57978a003c65e826a996a9afca8d004d892f222aad1065a851f6b；Client=4c0f79655e0b2e3890f88df446841bed449d7d11e4574c85dd15a7751f402e00。
- CUA最初无法启动Node runtime。实际项目已改名，而聊天配置仍指向不存在的旧cwd；创建一个临时空旧目录后连接恢复，未创建第二份仓库、未复制项目，收尾确认该空目录已不存在；rmdir返回ENOENT，没有删除项目或其他数据。后续Agent应使用本页实际目录，不把此工具路径修复当成项目回滚。
- 原插件管理页刷新仍显示旧缓存；通过DSH原生菜单正常退出/重开后加载新组成。CUA确认dsh-chat模式控件存在，HARNESS选中且授权已收敛；进入管理页/详情，新用户SVG在组合包与组件图标位置均正常显示，v0.1.4、1个组件/1运行中、启用on。
- 实机截图/tmp/dsh-chat-0.1.4-installed.png只保留本机，不入Git；最终窗口停留dsh-chat详情供用户查看。未进入官网、未输入凭据/发送消息，也未验收其余聊天矩阵。

版本0.1.3→0.1.4仅递增一次。旧名称插件已移除，新版单独启用；此轮正常重启后官网容器需按原Browser策略正常登录。新设备必须在用户手动提交后拉取，不依赖本机产物或聊天历史。

## 下一步

本机改名/管理图标/启用实机验收已完成，交还用户查看并自行提交/推送；首次网页登录/逐帧闪现、真实消息发送与流式、跨端历史、DSH退出/换账号、完整卸载及其他平台矩阵仍待验收，见W017限制。不自动发送消息，不修改安装包或凭据。

## 历史记录说明

遵照用户“所有旧名称统一”的要求，以下历史文档的名称和路径示例已采用当前名称展示。W010–W017的版本/提交/产物哈希仍指对应历史轮次，不能拿旧包作为W018安装包或新图标验收依据；当前包与验证以本页顶部W018记录为准。

# W017历史交接记录

更新日期：2026-10-10（Asia/Shanghai）。W017 / 0.1.3候选修复完成，单Agent Codex/macOS工作已交还用户验收，无进行中分工。用户登录截图推翻W016不足的验收结论，历史失败保留worklog，当前需求以requirements、技术证据以architecture/references为准。

## 总目标与当前路线

可逆CHAT/HARNESS切换：CHAT使用真实官网聊天/服务器历史，HARNESS恢复原工作区。共用原SidebarRoot和背景材质，只在CHAT替换sidebar.workspaces；网页导航镜像属于用户批准的有限公开UI适配，不能称为官方历史API或独立同步。

W017修复官网重复导航轨道/紧凑头部，加载和登录SPA先遮罩，布局适配并确认暗色后显示；删除整个插件工具栏。官方shell.leading承担CHAT折叠后的展开/官网新建，切回HARNESS撤回恢复原控件。官方settings.section新增“CHAT设置”：显示真实网页可见账号、系统语言、官网完整设置/导航与重载。用户最后明确取消外观选项，CHAT固定暗色。没有重做侧栏或修改DSH安装包/核心状态。

## 基线、范围与交付规则

- 开工main干净，fetch成功，HEAD=origin/main=b0b8e4b，0/0；W016已由用户手动提交。版本0.1.2→0.1.3已递增一次，本轮调试/重打包不重复递增；下一轮独立修复0.1.4。
- W017归T02/T03/T05/T06/T08/T09/T12/T13，单Agent/Codex/macOS。范围src/client/ui/styles/web-surface/website-navigation、preview/scripts/相关测试、package与lock及当前文档；Host授权策略与W016有限原侧栏适配边界保持原实现。
- 用户此轮直接要求网页账号/设置，授权范围记录在AGENTS：仅可见账号/公开设置UI、系统语言/固定暗色，不读正文、凭据、Cookie、token、storage、私有应用状态/API，不模拟登录。原DSH有限侧栏例外不扩展。
- 目标DSH0.2.0-rc.2 / Cordis4.0.4 / React18.3.1；本机Node24.15.0、项目pnpm10.33.2，官方CLI内置pnpm11.7.0（CLI Node24.18.1）。无live Inspect，固定官方commit639ed015397290b3745d163aafe02ffee4aa3f84及发布类型用于契约核查，实机UI用于行为确认。
- 新增ui-settings@0.2.0-rc.2开发类型及client manifest依赖，运行时依旧单lazy工厂/3个公开共享baseline，无第二份React/Cordis；详细来源见references。
- 不stage/commit/tag/push。代码与所有上下文文档仅本地，用户验收后自行Git；另一设备拉取用户提交后才获得新上下文，不宣称自动跨设备同步。

## 全部任务当前快照

| ID | 目标 | 当前成果/证据 | 下一步/限制 |
|---|---|---|---|
| T01 | Host/Client/manifest | 安全账号桥、真实网页容器、原生设置/导航已实现 | 全部官网能力不以骨架/构建代替验收 |
| T02 | 官方契约/版本 | 固定源码/发布类型核查；W017补settings.section和shell.leading | 新设备核对版本；无live Inspect |
| T03 | 需求/授权/数据源 | 官网路线、有限UI适配、固定暗色、手动Git及patch+1同步 | 按requirements/AGENTS继续 |
| T04 | 授权/账号 | namespace、35秒期限、官方状态/watch/代次栅栏已实现 | DSH实际退出/换账号、Chat SSO/身份桥待验收或未公开 |
| T05 | 构建/安装 | 0.1.3类型构建、28项回归、16文件打包及本机安装hash匹配通过 | 本轮未推送，不能远程安装新提交 |
| T06 | 品牌/新建/折叠 | 原侧栏视觉保留；实机已有对话→折叠新建回空Chat，展开正常 | 菜单/快捷键仍Harness；其他平台未测 |
| T07 | 门槛/回退 | 单元模拟超时/迟到/退出隔离，所有自有入口同门槛 | 实际官方授权退出矩阵待验收 |
| T08 | 官网主区/导航/设置 | 外层导航占位/紧凑头部清理；原生CHAT设置真实账号/中文、固定深色、官网完整设置实测 | 首次登录完整流程/分页/全部官网管理动作扩测 |
| T09 | 保活/恢复 | 手动往返同一原Harness面板；刷新后中文保留；guest按代次释放 | 完整右栏/卸载矩阵、网站在途流仍有限制 |
| T10 | 官网聊天 | 官网已登录主页及既有导航可加载，本轮无消息发送 | 首次登录/验证码/发送/流式待用户验收 |
| T11 | 官网历史 | 网站服务器列表界面镜像，不保存另一份历史 | 另一浏览器同账号/新会话跨端一致性待验收 |
| T12 | 禁用/兼容 | 本轮Harness中禁用恢复原徽标/导航，重启用有效且保持Harness；最终更新回Harness通过 | Chat直接禁用/完整卸载矩阵及其他平台仍未验收 |
| T13 | 上下文接力 | 用户决策、官方依据、实现、失败及分层证据已同步本地 | 收尾后交还用户，无自动Git或全球记忆 |

## W017实现与失败理由

- 官方settings.section根list的owner只有close，id/order/label形成原设置导航；插件只贡献自己的页面。官方shell.leading由AppFrame管理Mac全折叠位置；保活overlay原先覆盖该控件，现扣除公开frame-top-clearance，使用同一公开图标/Tooltip和28px/8px几何。
- 导航隐藏上溯有宽度的窄列轨道，并将编辑器所在兄弟列填满。紧凑官网顶部仅识别无文本、2–3个图标按钮的小区域。结构不匹配撤回全部自有样式/标记、清空镜像、显示原官网；不是裁切视口。
- 首次guest加载/路由变化在host遮罩；官网DOM观察器在React提交后的微任务检查，局部preparing样式在登录SPA显示新的导航前遮住body，完成适配/深色后撤回。首次完整重新登录未实测，不能用观察器设计或静态截图宣称逐帧验收完成。
- 设置通过头像公开菜单→系统设置→通用设置操作。已隐藏头像几何为零，须在已确认导航内限定头像兜底；官网ds-button/ds-select自定义元素不能按原生button处理，语言通过实际文本触发器pointerdown/mousedown展开。
- 中文菜单为“系统设置”；“通用设置”也含“设置”，曾使对话框定位过早命中内层。现同时校验空图标关闭控件，定位完整设置弹窗。临时结构诊断已移除；12秒期限失败提供原官网设置入口，不展示内部CSS类名。
- 设置缓存只用自有DOM临时属性，sign_in/恢复清空；Guest返回账号/设置字段限长，Host/Client代次栅栏拒绝旧结果。普通网络故障不当作DSH退出。
- 设置页仅系统语言，无外观选项；首次适配通过官网UI确认深色。官网完整设置仍可用，全部官网管理动作不称为原生镜像；不调用私有接口。

## 本轮验证（最终收尾结果见下）

- node scripts/build.mjs：生产类型检查和artifact契约通过；node scripts/test.mjs：28/28，含新增账号/设置返回值限长及非ready清空、既有授权/代次/卸载/模式回归。补原官网导航恢复后原生设置重新接管的请求栅栏，避免下一次snapshot取消多步设置；单元与最终浏览器fixture均通过。
- preview生产组件/ModeController/两个适配函数使用隔离DOM fixture，CSP禁止官网联网；新增自定义ds-button/ds-select与pointerdown语言下拉，不再仅测简化HTMLbutton。已确认轨道隐藏/内容填满/紧凑头部隐藏、中文真实fixture值/固定Dark、设置弹窗关闭、sign_in清空账号/设置且新建禁用。观察器首次登录逐帧与原生guest仍不是fixture证据。
- 实机已有官网登录状态：真实账号资料可读，原生设置中文写回，官网分组/编辑器随语言变化；官网完整设置显示深色选中。插件工具栏整行移除、重复导航/占位与紧凑头部清理，折叠窗口展开/新建可用，从旧对话新建回空主页；HARNESS恢复原插件主面板，回CHAT复用网页；重新加载后仍中文，未输入凭据/验证码、未发送消息。
- 多次候选hash仅用于定位问题，最终包下方记录为唯一交接依据；同轮不重复涨号。pnpm pack执行反馈不足后使用临时npm cache的npm pack --ignore-scripts（此前已显式成功build），未修改系统缓存权限。官方CLI泛化peer warning仍保留，不报告零警告安装。
- 个人导航截图仅本地Git排除；仓库不包含个人标题/链接/正文、凭据、安装包、依赖或构建产物。

## 限制与下一步

1. 用户先验收当前界面和原生CHAT设置，再手动提交/推送源码及上下文；新设备fetch核对实际版本，不依赖本机缓存或聊天摘要。
2. 首次官网登录完整流程/逐帧闪现、发送/流式、跨浏览器同账号历史、空账号/分页、实际DSH退出/换账号、完整卸载/右栏矩阵与Windows/Linux尚未验收。
3. DSH Platform/API授权与Chat网页登录独立；没有确认SSO/同账号匹配/网页退出通知桥。网页登录页检测不证明DSH授权失效，不能迁移Cookie或抓私有API。
4. 原菜单/快捷键新建仍执行Harness语义；网站内部账号/数据管理仅通过官网完整设置可达。原生Browser仅进程内分区，重启需重新网页登录。
5. 授权变化/卸载释放guest，无法提取网页未发送草稿或调用私有停止生成；下载/设备权限/外部OAuth由官方Browser安全策略管理。Web缺桥禁用，无未经验证iframe回退。
6. 无待决定的设计事项；当前阶段结束后负责人交还用户。同轮仍0.1.3，下轮独立修复0.1.4。历史W010–W017见worklog，README只描述产品。

## 最终收尾记录

- 最终包artifacts/dsh-chat-0.1.3-1bec00d16d90.tgz，SHA256 1bec00d16d90559811889a2ccd9798807b3d0191db36d58f0c82853d5c45c738；通用0.1.3.tgz内容一致。16个白名单文件，版本/README匹配；单lazy工厂/3共享baseline。此前所有0.1.3候选包（包括30f7c02661f3）已被此包替代，不能选旧hash交接。
- 官方CLI更新desktop --ignore-scripts成功；实际版本0.1.3，Host hash c8ceb119f9245f836d5146f2c2f6978d4cbce114cb46ffbbe4fa0512c473de54，Client hash 4ead262e29b350e2ebe5ccff205fd07f36254040e3abf52084c49030396de35b，逐项与build匹配。CLI泛化peer warning不影响本次加载，仍记录。
- 最终源码fixture初始System/opacity0→实际Dark/opacity1，导航轨道隐藏、内容扩展、紧凑头部隐藏且官网设置对话框关闭；恢复原导航可见后再次进原生设置正常读回，无卡住。浏览器warnings/errors为0；真实guest首帧/首次重新登录不能由此替代。
- 本轮原插件页禁用恢复原HARNESS徽标、新建/插件导航；重启用授权收敛并保持Harness。最后更新再次从Harness开始，进入CHAT实际账号/简体中文值显示、无外观选项、固定暗色及主区无重复导航/占位已截图确认；最终保留CHAT中文空主页，无测试草稿或消息。
- 本地验收截图output/playwright/dsh-chat-0.1.3-settings.png与dsh-chat-0.1.3-chat.png仅本机且Git排除，未写入仓库；本轮创建的模拟浏览器页与preview进程已关闭，用户页面/DSH继续保留。
- 结束fetch成功，main/HEAD/origin仍b0b8e4b且0/0；git diff --check及8份Markdown链接/围栏检查通过，21份源码/测试/文档未暂存，暂存区空。包/截图均Git排除；本轮未stage/commit/tag/push，不宣称跨设备同步。下一Agent先fetch核对用户手动提交，不为同轮补涨版本。
