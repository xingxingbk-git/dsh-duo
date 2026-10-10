# 当前状态与开发接力

更新日期：2026-10-10（Asia/Shanghai），W015（0.1.1共用侧栏及官网列表镜像）本地实现/分层检查已完成，交还用户验收；无进行中Agent分工。顶部原新建语义等未完成项保留。需求以requirements、技术依据以architecture/references、历史以worklog为准；旧审查快照及旧聊天不覆盖当前需求。

## 总目标与当前路线

为DSH提供可逆CHAT/HARNESS切换，CHAT使用真实官网聊天与历史，HARNESS恢复原工作区。两种模式共用原SidebarRoot，仅CHAT替换sidebar.workspaces，镜像用户允许读取的官网导航；成功后隐藏重复网页侧栏。不能用模型API/本地记录冒充官网同步。DSH授权与网页登录独立，DOM界面适配不是官方历史API。

顶部DeepSeek品牌后的白底选中切换器已按最新截图实现；原静态HARNESS徽标、Harness底部模式/刷新入口及右下角浮动框已移除。正常授权不显示常驻刷新，失败在顶部提示并提供重试。折叠时隐藏品牌控件，展开恢复。

## 基线、分工与交付状态

- W015/T06/T08/T09/T13：按用户三张截图共用原DSH侧栏，仅替换必要区域；官网真实分组导航已在左侧实测。单Agent/Codex/macOS，已交还用户；main基线c169200，开工W014四份未提交文档全部保留，fetch后0/0。范围src/client/ui/styles/web-surface/website-navigation、preview、受影响测试及主文档；仅shadow官方sidebar.workspaces。用户已明确允许有限官网DOM界面适配；公开顶部New Session替换回调仍缺失，不能改DSH核心。版本0.1.0→0.1.1已递增一次，27项测试及最终构建/安装核对通过，等待用户验收；不自动Git操作。
- W014归入T03/T13，单Agent/Codex/macOS；目标与完成标准为把用户“每轮修复自动patch+1”写入统一入口及交接，保持手动Git流程，接力不重复加号。本轮仅AGENTS、requirements、handoff/worklog四份文档，已完成规则同步并交还用户，无进行中分工。README不承载此开发规则。
- W014开工main干净，HEAD及origin/main为 `c169200fe362c14d71ecc8a9740b711377eca27f`，fetch后0/0；W013已提交并同步，不再是未提交UI。35da7f0/W012、f6cf716/W011是历史基线，经过见worklog。本轮Agent未执行提交/推送。
- 最新版本：package.json为0.1.1；W015已执行0.1.0→0.1.1一次，之后调试/重打包不再涨号。W014当时仅文档保持0.1.0的历史记录见worklog。下一轮独立修复为0.1.2，跨设备先fetch核对；详细规则以AGENTS“协作与交付”为准。
- 最新交付规则：用户先验收，自行通过Codex右上角stage/commit/push；Agent不自动执行。W014/W015修改仅本地可审查，尚未跨设备同步。历史推送授权不延续到后续修改，涨版本也不授权提交或打tag。
- W013实现范围：src/client/ui/styles；preview/main、scripts/preview/test、tests/server呈现fixture；README及受影响Agent文档。Host/账号策略、依赖、原Harness导航和快捷键未改。
- W014重新核对Node24.15.0、项目pnpm10.33.2、Cordis4.0.4、React18.3.1；本轮无业务API/运行时变更，无需重新加载插件。最近W013实测DSH0.2.0-rc.2、bundled pnpm11.7.0；固定官方commit `639ed015397290b3745d163aafe02ffee4aa3f84`，无live Inspect。下方UI/官网验证均为W013结果，不混作W014新实测。

## 全部任务当前快照

| ID | 目标 | 当前成果与状态 | 下一步/依赖 |
|---|---|---|---|
| T01 | Host/Client、manifest、patch | 安全账号桥、Client真实网页容器已实现 | 安装与完整官网验收分别见T12/T10 |
| T02 | 官方能力与版本 | 固定源码及实际发布/安装版核对；无live Inspect | 新设备重新核对版本及工具 |
| T03 | 需求/授权/数据源 | 官网路线、顶部入口、手动Git及修复自动patch+1规则已同步文档 | requirements/AGENTS为准，保留最终未完成项 |
| T04 | 官方授权读取/通知 | namespace注入修复；本机确认/重新启用收敛；getState/getProfile/watch与登出栅栏 | 实际DSH退出/换账号待用户验收；官网登录视图可识别，仍无身份/退出通知桥 |
| T05 | 依赖/TSX/build/安装 | W015为0.1.1，27项测试/typecheck/package通过，安装Host/Client逐项hash匹配 | Git安装历史pnpm10/11通过；本轮未提交，不复验远程URL新代码 |
| T06 | 品牌入口/新建 | 两种模式沿用原品牌/顶部；CHAT列表旁＋新建官网对话已实測 | 原顶部新会话/菜单/快捷键仍走Harness，公开替换回调缺失；其他平台待测 |
| T07 | 门槛/可逆/回退 | fixture含失败/35秒期限/迟到/账号栅栏；Mac手动CHAT往返、首次授权保持Harness通过 | 真实退出/失效回退待用户验收 |
| T08 | CHAT主区/导航 | W015原侧栏中间显示真实官网分组/选中态，点击打开对应页面，重复网页侧栏隐藏 | DOM适配，不是历史API；空账号/分页真实场景待扩测，Web缺桥禁用 |
| T09 | 保活/Session/右栏/撤回 | W015实测往返恢复原会话，官网未发送验收草稿保留且已清除；模拟回退/释放通过 | 完整右栏矩阵和CHAT中卸载待测，卸载/授权变化草稿仍有限制 |
| T10 | 真实网页聊天 | 本机官网加载；未发送草稿往返保留已实测、验收草稿已清除，未发送消息 | 首次登录/验证码/发送/流式待用户验收 |
| T11 | 官网历史 | 现有历史列表已显示，不复制/合并本地历史 | 同账号另一浏览器一致性及新对话同步待验收 |
| T12 | 安装/禁用/兼容 | 当前本地候选包更新desktop；禁用原徽标恢复、重启用顶部入口恢复通过 | 完整卸载/CHAT禁用/其他平台待测 |
| T13 | 上下文/Git接力 | W014/W015代码、需求、架构、资料、路线与交接已本地更新，无进行中负责人 | 用户验收后手动提交推送，其他设备才能获得新上下文 |

## 实现与失败原因

sidebar.brand.name仅渲染字标/自有锚点，独立shell.overlay对齐自身ref；按钮在aria-hidden/外层New Session祖先外。W015两种模式共用原SidebarRoot和shell.leading，仅CHAT注入sidebar.workspaces，退出dispose。底部真实settings不替换；不查改DSH核心DOM，不复制未导出的SidebarRoot。

官方BrandWordmark的SVG本身含HARNESS徽标，includeMark=false不足以去掉；用自有外层SVG视口仅显示DeepSeek文字，窄宽度按比例缩小。首次普通预览通过，但实机没有按钮：28px锚点被官方24px品牌行裁剪，严格可见性判断未通过。单变量改为24px后实机显示；预览改成相同24px裁剪行，避免重复漏检。只改自有组件/CSS，未扩大内置owner。

W012的授权修复保持：先mount协议、后动态inject `remote.dshDuo`；初始失败收敛unavailable，35秒期限、AbortSignal与迟到隔离、挂载失败重试；普通网络错误不撤销已确认有效账号。

## 最近W015验证分层与产物

- 版本0.1.0→0.1.1，本轮已递增一次；Node24.15.0/项目pnpm10.33.2，实际DSH0.2.0-rc.2/Cordis4.0.4/React18.3.1，DSH内置pnpm11.7.0；固定官方commit仍为639ed015，无live Inspect。
- pnpm typecheck通过；pnpm test为27/27，新增局部Slot生命周期、不覆盖原sidebar/settings/leading、旧账号列表/动作隔离及不可信导航URL过滤回归。pnpm package:plugin与artifact契约检查通过，prepare及共享模块依赖保持；未新增依赖。
- pnpm preview浏览器模拟使用生产DOM适配函数，CSP禁止官网联网。验证真实DOM fixture分组、点击/选中/新建、空列表、结构变化清空列表并撤回隐藏样式、登录页清空、恢复、退出DSH释放guest/禁用。浏览器开发日志0 errors/0 warnings；这些是模拟证据，不能代替真官网空账号/登出验证。
- Mac真实官网：原DSH顶部/背景材质/底部账号持续保留，真实官网分组导航位于原左栏；选择条目打开对应右侧页面且高亮，＋新建回官网空对话，未创建项目。主区重复官网侧栏隐藏；“官网导航”可恢复原导航。手动返回恢复原Harness会话/工作区，重进保留未发送验收草稿，已清除且没有发送消息。最终包重装后再验列表/选中/折叠展开；折叠时有备用展开及模式按钮，展开后撤回，原上方布局保持。
- 最终包artifacts/dsh-duo-0.1.1-9654619f1e2f.tgz，SHA256 9654619f1e2fd4dfa0b48b146eb1006e65ba236bf94de876ea4e2113907b8535；安装版本实读0.1.1，Host hash c8ceb119f9245f836d5146f2c2f6978d4cbce114cb46ffbbe4fa0512c473de54、Client hash da0169946e842f604a956d68bc5982ed6941d3e8242f25d137975ac52e30e70e与build匹配。CLI有原profile泛化peer warning，未阻止启用/实际界面；不把该warning写成无警告安装。
- 本地截图output/playwright/dsh-duo-shared-sidebar-chat.png与dsh-duo-shared-sidebar-harness.png仅作视觉验收，Git排除；新设备从仓库重建，不依赖截图或安装路径。未改DSH安装包、安全配置、其他插件或账号凭据。代码/上下文未stage/commit/tag/push，远端仍c169200；下一步用户验收与手动Git。
- 收尾git diff --check通过，暂存区为空；本轮preview服务和两个临时浏览器页已关闭，DSH保留最终CHAT/已选官网对话供验收，网页输入为空。无进行中Agent负责人或待用户补充的需求。

## W013历史验证（不作为W015新执行结果）

- 自动化：最终 `pnpm typecheck`、`pnpm test`（23/23）、`pnpm package:plugin` 均通过。23项覆盖真实Cordis/Gateway插件Context与生产Client，账号/carrier/presentation仍是fixture，不能替代真实账号或几何检查。单lazy-CJS工厂、react/jsx-runtime/ui-primitives三项共享baseline；14文件tarball不包含preview/tests/scripts/依赖或用户数据。
- 浏览器模拟：`pnpm preview`复用生产组件和ModeController；CSP禁止官网联网。24px品牌裁剪下顶部控件可见；未授权禁用、授权失败顶部重试、Enter切CHAT、退出回Harness并禁用通过。交互层无aria-hidden/外层button祖先，警告/错误为0。历史模拟保活/迟到释放/账号隔离不冒充官网结果。
- Mac实机：官方CLI以唯一hash路径更新现有desktop插件（预构建包 `--ignore-scripts`）；泛化peer warning未阻止加载。原徽标、底部与右下角入口消失；顶部白底HARNESS且授权已确认。鼠标点击CHAT、Shift-Tab/Enter切CHAT、返回原会话、已关闭右栏恢复通过；侧栏收起控件撤回、展开恢复。原插件页禁用后徽标恢复、重新启用后授权正常且Harness选中。
- 本轮CHAT真实加载官网，既有网页登录状态及历史导航可见；未登录/登出网页、未读凭据、未发送消息或验证跨端一致性。没有将历史标题、链接或聊天内容存入仓库文档。
- 本轮实机截图 `output/playwright/dsh-duo-brand-header.png` 仅本地且被Git排除；新设备依照上述步骤复现，不依赖此图片或临时源码副本。
- W013历史包0.1.0及hash见worklog；当前包以W015最终核对记录为准。新设备从源码重建，产物不提交。同版本重装用唯一文件名并比较安装hash，不能将Already up to date当更新成功。
- 本轮不修改DSH安装包、其他插件或账号资料。开发预览服务和临时浏览器已关闭；DSH保留原会话/Harness供用户验收。

历史验证详见worklog W010（独立Web Host、mock）、W011（Git缺prepare、精确pnpm11许可）、W012（真实Context依赖和pending修复）、W013（顶部入口）；不能用旧19项/root Context结果证明当前授权链路正确。README的Git与tarball安装路径分别验证；W014只检查文档差异和版本保持0.1.0，不重跑产品测试或重装。

## 必须保留的边界与下一步

1. DSH授权与网页登录独立；官网内部登出无公开通知，不能承诺自动回Harness或账号匹配。重启需重新网页登录，不迁移浏览器Cookie。
2. 手动模式往返保留文档；授权代次变化/卸载销毁guest，无法提取网页草稿或调用私有停止生成。原新建快捷键可能替换Harness session，仍未完整保真。
3. 下载、设备权限、外部OAuth弹窗受官方安全策略限制；Web iframe、其他DSH版本、Windows/Linux品牌按钮仍待验证。
4. 用户先验收顶部布局和使用体验；继续完成官网首次登录/消息发送/另一浏览器同账号历史、右栏完整矩阵、DSH退出/换账号及CHAT中禁用/卸载。不让用户重述既有需求，不抓私有API代替同步。
5. W015已涨到0.1.1，接力本轮不可再涨；下一轮独立修复为0.1.2。代码和全部受影响上下文保留本地，用户手动Git后其他设备正常fetch；没有待用户决定的事项。不要为原顶部新建缺回调而猴子补丁核心。
