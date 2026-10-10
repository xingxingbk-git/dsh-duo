# 当前状态与开发接力

更新日期：2026-10-10（Asia/Shanghai），当前阶段W013。需求以requirements、技术依据以architecture/references、历史以worklog为准；旧审查快照及旧聊天不覆盖当前需求。

## 总目标与当前路线

为DSH提供可逆的CHAT/HARNESS切换，CHAT使用真实 `chat.deepseek.com` 的聊天与服务器历史，HARNESS恢复原工作区。允许官方Desktop Browser网页嵌入；不能用模型API及插件本地记录冒充官网同步。DSH账号门槛与网页登录是独立会话，网页原生历史重绘缺公开接口。

顶部DeepSeek品牌后的白底选中切换器已按最新截图实现；原静态HARNESS徽标、Harness底部模式/刷新入口及右下角浮动框已移除。正常授权不显示常驻刷新，失败在顶部提示并提供重试。折叠时隐藏品牌控件，展开恢复。

## 基线、分工与交付状态

- W013归入T06/T12/T13；目标为顶部唯一Harness模式入口、授权门槛和故障重试、鼠标/键盘、折叠及禁用恢复。单Agent/Codex/macOS负责，无并行委派，无其他Agent占用文件。完成本阶段后交还用户验收，无遗留“进行中”负责人。
- 开工main干净，HEAD及origin/main为 `35da7f0d787b9503739d2bddc10e0cecec748939`，fetch后0/0。W012授权pending修复已由用户手动提交/推送；W011安装修复 `f6cf716` 是历史，不是当前基线。旧验证/失败经过见worklog W010–W012。
- 本轮实际范围：src/client/ui/styles；preview/main、scripts/preview/test、tests/server呈现fixture；README及AGENTS、requirements、architecture、roadmap、references、handoff/worklog。Host/账号策略、依赖、原Harness导航和快捷键未改。
- 最新交付规则：用户先验收，自行通过Codex右上角stage/commit/push；Agent不自动执行。本轮代码与文档仅本地可审查，尚未跨设备同步。历史推送授权不延续到后续修改。
- 本轮环境：DSH 0.2.0-rc.2、Cordis4.0.4、React18.3.1、Node24.15.0、项目pnpm10.33.2、DSH bundled pnpm11.7.0。固定官方commit `639ed015397290b3745d163aafe02ffee4aa3f84`；无live Cordis Inspect，静态源码/发布包与实机结果分别记录。

## 全部任务当前快照

| ID | 目标 | 当前成果与状态 | 下一步/依赖 |
|---|---|---|---|
| T01 | Host/Client、manifest、patch | 安全账号桥、Client真实网页容器已实现 | 安装与完整官网验收分别见T12/T10 |
| T02 | 官方能力与版本 | 固定源码及实际发布/安装版核对；无live Inspect | 新设备重新核对版本及工具 |
| T03 | 需求/授权/数据源 | 官网数据路线、截图顶部入口、手动Git流程已同步 | requirements为准，保留最终未完成项 |
| T04 | 官方授权读取/通知 | namespace注入修复；本机确认/重新启用收敛；getState/getProfile/watch与登出栅栏 | 实际DSH退出/换账号待用户验收；官网状态无法观察 |
| T05 | 依赖/TSX/build/安装 | prepare及Git安装检查；23项测试、typecheck与打包检查 | Git安装历史pnpm10/11分别通过；当前未提交UI不能从远端安装 |
| T06 | 品牌入口/新建 | 装饰品牌槽+独立overlay；Mac顶部按钮、白底、键盘、折叠、禁用恢复通过 | Windows/Linux、完整辅助技术待测；原新建快捷键仍可能建Harness session |
| T07 | 门槛/可逆/回退 | fixture含失败/35秒期限/迟到/账号栅栏；Mac手动CHAT往返、首次授权保持Harness通过 | 真实退出/失效回退待用户验收 |
| T08 | CHAT主区/导航 | 官网页面与既有网页登录状态的历史导航在本机显示，Harness专属右栏不显示 | 原生历史重绘未支持；Web缺native桥禁用 |
| T09 | 保活/Session/右栏/撤回 | 模拟保活/释放通过；Mac往返恢复原会话与已关闭右栏、禁用撤回通过 | 打开/不同tab/width/fullscreen完整矩阵及CHAT中卸载待测 |
| T10 | 真实网页聊天 | 本机真实网页加载，未发送消息 | 首次登录/验证码/发送/流式及草稿待用户验收 |
| T11 | 官网历史 | 现有历史列表已显示，不复制/合并本地历史 | 同账号另一浏览器一致性及新对话同步待验收 |
| T12 | 安装/禁用/兼容 | 当前本地候选包更新desktop；禁用原徽标恢复、重启用顶部入口恢复通过 | 完整卸载/CHAT禁用/其他平台待测 |
| T13 | 上下文/Git接力 | 当前代码、需求、证据、结果和失败经过已同步仓库文档 | 本轮仅本地，用户验收并手动提交推送后跨设备同步 |

## 实现与失败原因

`sidebar.brand.name`祖先有aria-hidden，Web/Windows还包含New Session按钮。因此槽仅渲染非交互字标与自有锚点；独立 `shell.overlay` 组件测自己的ref矩形并对齐，按钮不在隐藏/按钮祖先内。不查改核心DOM，不复制未导出的SidebarRoot。CHAT仅按需shadow原侧栏及shell.leading，离开及时dispose。

官方BrandWordmark的SVG本身含HARNESS徽标，includeMark=false不足以去掉；用自有外层SVG视口仅显示DeepSeek文字，窄宽度按比例缩小。首次普通预览通过，但实机没有按钮：28px锚点被官方24px品牌行裁剪，严格可见性判断未通过。单变量改为24px后实机显示；预览改成相同24px裁剪行，避免重复漏检。只改自有组件/CSS，未扩大内置owner。

W012的授权修复保持：先mount协议、后动态inject `remote.dshDuo`；初始失败收敛unavailable，35秒期限、AbortSignal与迟到隔离、挂载失败重试；普通网络错误不撤销已确认有效账号。

## 验证分层与产物

- 自动化：最终 `pnpm typecheck`、`pnpm test`（23/23）、`pnpm package:plugin` 均通过。23项覆盖真实Cordis/Gateway插件Context与生产Client，账号/carrier/presentation仍是fixture，不能替代真实账号或几何检查。单lazy-CJS工厂、react/jsx-runtime/ui-primitives三项共享baseline；14文件tarball不包含preview/tests/scripts/依赖或用户数据。
- 浏览器模拟：`pnpm preview`复用生产组件和ModeController；CSP禁止官网联网。24px品牌裁剪下顶部控件可见；未授权禁用、授权失败顶部重试、Enter切CHAT、退出回Harness并禁用通过。交互层无aria-hidden/外层button祖先，警告/错误为0。历史模拟保活/迟到释放/账号隔离不冒充官网结果。
- Mac实机：官方CLI以唯一hash路径更新现有desktop插件（预构建包 `--ignore-scripts`）；泛化peer warning未阻止加载。原徽标、底部与右下角入口消失；顶部白底HARNESS且授权已确认。鼠标点击CHAT、Shift-Tab/Enter切CHAT、返回原会话、已关闭右栏恢复通过；侧栏收起控件撤回、展开恢复。原插件页禁用后徽标恢复、重新启用后授权正常且Harness选中。
- 本轮CHAT真实加载官网，既有网页登录状态及历史导航可见；未登录/登出网页、未读凭据、未发送消息或验证跨端一致性。没有将历史标题、链接或聊天内容存入仓库文档。
- 本轮实机截图 `output/playwright/dsh-duo-brand-header.png` 仅本地且被Git排除；新设备依照上述步骤复现，不依赖此图片或临时源码副本。
- 当前本地包 `artifacts/dsh-duo-0.1.0-77a175008dd8.tgz`，SHA256 `77a175008dd8a25151fd5abc4f934614f80bde2b6f07de5175e2ac8aff85e839`；安装的Host/Client与最终build逐一hash匹配。新设备从源码重建，产物不提交。同版本重装必须用唯一文件名并比较安装hash，不能将Already up to date当更新成功。
- 本轮不修改DSH安装包、其他插件或账号资料。开发预览服务和临时浏览器已关闭；DSH保留原会话/Harness供用户验收。

历史验证详见worklog W010（独立Web Host、mock）、W011（Git缺prepare、精确pnpm11许可）、W012（真实Context依赖和pending修复）；不能用旧19项/root Context结果证明现在的授权链路正确。README的Git与tarball安装路径分别验证，未提交修改不能声称远端URL已更新。

## 必须保留的边界与下一步

1. DSH授权与网页登录独立；官网内部登出无公开通知，不能承诺自动回Harness或账号匹配。重启需重新网页登录，不迁移浏览器Cookie。
2. 手动模式往返保留文档；授权代次变化/卸载销毁guest，无法提取网页草稿或调用私有停止生成。原新建快捷键可能替换Harness session，仍未完整保真。
3. 下载、设备权限、外部OAuth弹窗受官方安全策略限制；Web iframe、其他DSH版本、Windows/Linux品牌按钮仍待验证。
4. 用户先验收顶部布局和使用体验；继续完成官网首次登录/消息发送/另一浏览器同账号历史、右栏完整矩阵、DSH退出/换账号及CHAT中禁用/卸载。不让用户重述既有需求，不抓私有API代替同步。
5. 本轮没有需要重新确认的产品决策。代码与文档保留本地，用户手动Git交付后其他设备正常fetch并构建；Agent不得自行提交或推送。
