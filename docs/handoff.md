# 当前状态与开发接力

更新日期：2026-10-10（Asia/Shanghai）。W016 / 0.1.2本地实现、构建与分层检查已完成，交还用户验收；无进行中Agent负责人。需求以requirements、技术依据以architecture/references、历史以worklog为准。

## 总目标与当前路线

为DSH提供可逆CHAT/HARNESS切换：CHAT使用真实官网聊天与服务器历史，HARNESS恢复原工作区。共用原SidebarRoot，只在CHAT替换sidebar.workspaces；导航镜像由用户批准的有限官网DOM适配实现，不能用模型API或本地记录冒充官网历史。

W016按最新截图将切换器靠右并自动填充品牌间距；CHAT隐藏原插件行、顶部新会话转交官网；删除常驻网页刷新/官网导航按钮和插件底部提示，保留故障重试及折叠后的展开/模式入口。DSH侧栏适配是用户明确批准的有限例外，不是官方新建API，也不扩大为任意核心DOM修改。DSH与网页登录仍独立，未发现Chat SSO桥。

## 基线、分工与交付

- W016归T03/T06/T08/T13，单Agent/Codex/macOS。目标/完成标准为上述截图行为逐项验证，区分模拟、实机及受限项；范围src/sidebar-adapter、client/ui/styles/web-surface、preview及受影响文档。未新增依赖或修改Host账号策略、DSH安装包、其它插件、核心状态或凭据。
- 开工main干净，fetch成功，HEAD/origin/main为f3ab5c75ae6580583e5dfd3ca283222269235c85，0/0。W014/W015已经由用户手动提交同步；worklog保留它们当时尚未提交的历史记录，不能当作当前状态。
- package.json从0.1.1递增到0.1.2一次。本轮修正/重打包仍为0.1.2；下一轮独立修复为0.1.3，跨设备先fetch核对。版本规则以AGENTS为准。
- 用户先验收、自行通过Codex右上角stage/commit/push；Agent未执行任何提交/推送/tag。本轮代码与上下文仅本地，未跨设备同步。代码和文档需一起由用户提交，另一设备拉取后才获得新上下文。
- 本轮实读DSH0.2.0-rc.2、Node24.15.0、项目pnpm10.33.2；官方CLI内置pnpm11.7.0，依赖Cordis4.0.4/React18.3.1。无live Cordis Inspect，官方契约以固定commit639ed015397290b3745d163aafe02ffee4aa3f84及对应发布类型核查，不冒称live查询。

## 全部任务当前快照

| ID | 目标 | 当前成果/证据 | 下一步/限制 |
|---|---|---|---|
| T01 | Host/Client、manifest、patch | 安全账号桥、Client真实网页容器已实现 | 完整官网验收见T10/T11 |
| T02 | 官方能力与版本 | 固定源码、发布类型和本机版本核对 | 新设备重新核对；仍无live Inspect |
| T03 | 需求/授权/数据源 | 官网路线、两个有限DOM例外、手动Git和patch+1同步 | 用户需求以requirements/AGENTS为准 |
| T04 | 官方授权/通知 | namespace修复、35秒期限、getState/getProfile/watch及代次栅栏 | 实际DSH退出/换账号待验收；无Chat SSO/官方退出通知桥 |
| T05 | 依赖/构建/安装 | 0.1.2 typecheck、27项回归、打包及安装hash匹配通过 | Git源码安装沿用已验证prepare路径；新远程代码尚未推送 |
| T06 | 品牌/新建 | 靠右控件实机可见；顶部click转交官网，鼠标/Enter模拟通过 | 已登录官网顶部新建待用户验收；菜单/快捷键仍Harness；其它平台未测 |
| T07 | 门槛/可逆/回退 | 模拟含超时/迟到/退出隔离；实机往返及首次授权保持Harness | 真实账号退出/失效回退待验收 |
| T08 | CHAT主区/导航 | W015官网分组/选择/＋新建实测；W016插件行/工具条/提示清理实测 | 空账号/分页、全部官网管理动作及布局变化扩测 |
| T09 | 保活/原面板/撤回 | W015草稿往返保活；W016原会话/关闭右栏返回，折叠可达 | 完整右栏矩阵/Chat中卸载待测；授权变化时草稿仍有限制 |
| T10 | 官网聊天 | 官网可加载；本轮实机为登录视图，未输入凭据或发送消息 | 首次登录/验证码/发送/流式待用户验收 |
| T11 | 官网历史 | W015真实列表已显示，不复制/合并本地历史 | 另一浏览器同账号、新会话跨端同步待验收 |
| T12 | 禁用/兼容 | 最终包本机启用；Harness中禁用恢复原徽标、重启用恢复通过 | 完整卸载/Chat禁用及Windows/Linux未验收 |
| T13 | 上下文/Git接力 | 当前目标/实现/失败/证据/限制均已本地同步，阶段负责人已交还用户 | 用户验收和手动Git；不宣称本轮已跨设备同步 |

## W016实现与失败记录

- 品牌装饰与锚点仍由官方sidebar.brand.name提供，交互层位于shell.overlay，避开aria-hidden/外层button。限定sidebar-adapter从自有品牌元素识别官方SlotOutlet包装及原侧栏结构，标记品牌flex、插件行/空导航及新会话按钮；click捕获先阻止Harness回调，再调用统一官网门槛。网页登录页/未就绪时新建禁用，Harness恢复原按钮状态，禁用撤回属性和监听器。
- 绑定归Client生命周期，品牌因折叠卸载时仍保留，展开重新绑定；只观察已定位sidebar root的childList，不读私有状态或全局凭据。不匹配时留原行为并在自有交互层提示，不能静默宣称顶部语义完成。
- 首次模拟遗漏renderer的data-slot/display:contents包装，实机安全退出并提示不兼容；已修正准确包装定位及fixture。首次6702d7a11fc6和中间2cae9acb7dce包均被下方最终包取代，接力不能选旧hash，也不为同轮重测再涨号。
- W012 namespace/授权错误收敛仍保留，未把传输故障判作登出。顶部菜单/系统快捷键仍由Harness管理，不在此次DOM例外内。

## 本轮验证与最终产物

- pnpm typecheck通过；pnpm test为27/27。覆盖生产Client真实Cordis/Gateway Context、授权/迟到/模式/导航边界；新增侧栏行为另在真实浏览器DOM fixture验证，不把27项当作DSH GUI结果。
- pnpm preview使用生产UI、ModeController、sidebar-adapter和官网DOM适配函数，CSP禁止官网联网。验证原顶部鼠标/Enter只触发官网新建一次且无Harness新建，切回原点击恢复、插件行恢复；品牌间距填充、官网登录视图禁用新建、折叠仍隐藏插件行/可展开、退出回Harness/释放guest通过。已读取模拟浏览器warn/error为空；官网账号/layout/guest仍fixture。
- 本机最终包：品牌右边缘对齐侧栏留白，原材质/真实账号区持续保留；CHAT插件行隐藏、主区常驻工具按钮/底部提示消失；官网sign_in时原顶部和＋均禁用。往返恢复同一原Harness会话及关闭右栏；折叠备用展开正常；Harness中禁用原HARNESS徽标恢复，重启用授权收敛且保持Harness。顶部已登录官网新建尚未实测，不能用模拟代替。
- 最终包artifacts/dsh-duo-0.1.2-373eab046e75.tgz，SHA256 373eab046e7518c4ff8ead34944d3b9c54cbfc80fe099e7490ec9ee3b59d68fb；通用0.1.2.tgz内容相同。16个白名单文件，单lazy-CJS工厂、3个共享baseline，无额外React/Cordis实例。README与包内版本/文本已核对。
- 官方CLI预构建--ignore-scripts更新desktop；实读安装版本0.1.2，Host hash c8ceb119f9245f836d5146f2c2f6978d4cbce114cb46ffbbe4fa0512c473de54，Client hash 2e39529e8fece89140ef4efa053bd4c3f49bea7b1c2be0cf6efab418628b3604均匹配build。CLI原profile泛化peer warning保留，未阻止加载；不报告无警告安装。
- 实机验收图output/playwright/dsh-duo-0.1.2-chat.png仅本地且Git排除；仓库不存个人导航标题/链接/正文/凭据。最终DSH保留CHAT官网登录视图，未填写账号/验证码、未登录或发送消息，没有验收草稿。当前截图不证明已登录新建。

## 限制与可执行下一步

1. 用户在官网正常完成登录后验收顶部新会话是否清空到官网空对话、不改变Harness会话，再检查发送/另一浏览器同账号历史；不要读取/迁移Cookie或抓私有API。
2. DSH Platform/API授权和Chat网页登录独立；官方Browser分区仅存续当前进程。没有查到Chat SSO桥，不能保证自动共用登录、同账号匹配或官网退出立即回Harness。官网登录视图检测不是DSH授权失效证据。
3. 菜单/快捷键新建、全部网页管理动作、空账号/分页、DSH真实退出/换账号、完整右栏/卸载矩阵及其它平台继续保留待验收状态。
4. 卸载/授权代次变化释放guest，无法提取网页未发送草稿或调用私有停止生成；下载/设备权限/外部OAuth受官方Browser策略限制。Web缺桥禁用，无未经验证iframe回退。
5. 本轮无待决定的设计事项；接力先读AGENTS、需求/架构与此快照，再fetch核对用户是否已经提交。本阶段不再涨号；下一轮独立修复0.1.3。

历史构建、Git安装、授权修复、品牌裁剪、官网列表和决策变化见worklog W010–W016。README只介绍产品使用与限制，不承担Agent上下文同步。
