# 当前状态与开发接力

更新日期：2026-10-10（Asia/Shanghai）。这是当前项目快照；需求以 requirements、技术依据以 architecture/references、决策历史以 worklog 为准。旧审查快照不覆盖本轮用户澄清。

## 总目标与当前路线

用户需要真实 `chat.deepseek.com` 同一网页账号的聊天和服务器历史，优先 DSH 原生外框架显示，允许网页嵌入。不能用 DSH 模型 API 加插件本地对话冒充官网同步。

当前制作 **DSH Desktop 0.2.0-rc.2 网页嵌入候选版**：DSH 授权门槛、CHAT/HARNESS 可逆导航、官方隔离 webview、手动切换保活。用户已接受可访问的临时切换入口及原新建快捷键限制。官网内部仍是完整网页，原生历史重绘缺公开接口依据。

## 基线与工作范围

- 当前本轮 T04/T07/T12/T13已完成授权pending修复与本机复验，交还用户验收；单Agent、无进行中的分工。main基线`f6cf716bd186f8a154acd02e82155b459f68c40d`，开工工作区干净，fetch无新进展。实际文件：src/client.ts、src/ui.tsx、tests/client.test.ts、tests/server.test.ts、README、AGENTS及受影响docs；Host/账号策略未改。目标与完成标准：真实Desktop授权不无限pending，账号门槛保留，出错可见且可重试；本机授权收敛、刷新、禁用/启用已通过，网络/超时分支为fixture验证。
- 最新交付约束：用户先验收，并自行通过Codex右上角手动提交/推送；Agent不自动stage/commit/push，除非用户另行明确要求本轮Git操作。本轮修改仅本地，尚未跨设备同步。f6cf716是历史交付，不授权后续自动交付。W011“运行中”只证明启用，不能作为当时授权链路已验收的证据。
- 根因：Client仅inject remote，却调用独立服务remote.dshDuo；真实插件Context拒绝，错误未展示且状态保留pending。修复为先mount再动态注入namespace，从子Context调用；初始失败收敛unavailable、35秒期限/取消/迟到隔离、挂载失败可重试、HARNESS和CHAT均可刷新。旧root Context集成与宽松fake漏掉依赖限制；真实插件Context已覆盖。普通网络故障继续保留既有有效账号及模式。

- W011历史 T05/T12/T13：修复GitHub地址安装`failed to import`，基线e1a19e2，已按当时授权提交并推送f6cf716；完成Git源码构建与当前Desktop入口导入，详情见worklog。该阶段授权已被上述新交付流程替代。
- 候选版实现已随 `e1a19e2` 推送并拉取，不再是上一轮记录的“仅本地未提交”。上一阶段的构建/19 项测试/模拟为历史验证，本轮结果另外记录。
- W011安装根因：用户以仓库URL安装，两个lib入口均缺失；补prepare及独立Git安装检查，用预构建tarball修复当前profile。导入故障已解决，当时授权pending未完成验收；W012已另外修复并实测授权确认，不能将这两次结果混写。
- 本轮环境：DSH `0.2.0-rc.2`（应用 Info.plist 与官方 CLI --version）；Node `v24.15.0`，项目 pnpm `10.33.2`，DSH bundled pnpm 元数据/实际安装 `11.7.0`。本包实际开发依赖 Cordis `4.0.4` / React `18.3.1` 与锁文件一致；无 live Inspect，未访问用户凭据或网页聊天。
- 上一候选版实现阶段环境：DSH Info.plist/app.asar package `0.2.0-rc.2`、Cordis archive metadata `4.0.4`、官方 npm React/client `18.3.1`；Node `v24.14.1` / pnpm `10.33.2`。本轮实际工具版本及Desktop安装见上文，不混作同一次验证。
- 本轮工具没有 live Cordis Inspect。静态契约固定在官方 commit `639ed015397290b3745d163aafe02ffee4aa3f84`，本机公开 native Browser/preload 入口也做了只读核对；不读取凭据或修改安装包。
- 上一候选版实现阶段的历史分工已结束：主 Agent 集成；auth_contract 授权桥/protocol/server；ui_contract UI/styles/网页容器/preview；build_setup 依赖/构建/验证。无子 Agent 持有中的文件锁。本轮安装修复由单 Agent 完成，无并行委派。

## 全部任务当前快照

| ID | 目标 | 本轮实际成果与状态 | 依赖/负责人下一步 |
|---|---|---|---|
| T01 | Host/Client、manifest、patch骨架 | 已转为功能源码，Host安全账号桥、Client真实网页容器 | 本轮集成；真实安装见T12 |
| T02 | 目标官方能力与版本 | 固定源码+安装版入口核对；无live Inspect | 后续设备复核版本与工具 |
| T03 | 需求/授权规则/数据源 | 已同步用户官网数据澄清、允许嵌入/临时入口；保留原最终目标 | requirements为准，不再问本地聊天保存 |
| T04 | 官方授权读取/通知 | Client namespace注入已修复；本机官方授权确认及刷新通过；getState/getProfile/watch/登出栅栏已实现 | DSH实际退出/换账号待用户验收；官网状态无法观察 |
| T05 | 锁定依赖/TSX/build | 增加 prepare、Git 安装检查；本轮 typecheck/build/package 与 19 项测试通过；pnpm10/DSH pnpm11源码 Git 安装通过 | 按 README 为固定 Git 身份批准构建，或使用预构建包 |
| T06 | 品牌/可达入口/新建 | additive footer/overlay、CHAT自己的控制侧栏已实现；用户接受试用；最终品牌契约仍未解决 | 原新建快捷键可能改Harness Session，不能标完整验收 |
| T07 | 门槛/可逆模式/即时回退 | 动态依赖、失败/超时/重试、账号/迟到栅栏测试通过；首次授权/刷新/启用真实保持HARNESS | 真实CHAT往返和登出待验收 |
| T08 | Chat主区/导航 | 真实官网容器；官网自己的导航/消息/历史。独立本地聊天UI已删除 | Web缺native桥保持禁用 |
| T09 | 保活/Session/右栏/卸载 | 纯状态/Client清理顺序测试及Playwright模拟保活/恢复/resize/折叠/故障重试/换账号已过 | 真实Desktop矩阵仍待本人官网登录验收 |
| T10 | 真实网页聊天 | 代码只加载官方网页，无独立llm发送；网站自行处理 | 本人网页登录/发送/验证码待验证 |
| T11 | 官网页面历史 | 嵌入真实网页而非复制同步；无公开原生历史接口 | 同网页账号跨端历史一致性需真实验收 |
| T12 | 安装/禁用/卸载/兼容 | 当前Desktop已装本地修复包，hash匹配；授权收敛、刷新、禁用撤回及重新启用通过 | 官网、CHAT禁用/卸载、右栏/Session完整恢复仍待验收 |
| T13 | 上下文与Git接力 | 远端截至f6cf716；W012代码/根因/验证/用户手动Git流程文档仅本地完成 | 用户验收并手动提交/推送后另一设备才能同步 |

## 实际文件与产物

- src：index/client、authorization/server/protocol、core/mode、ui/styles/web-surface。
- 构建：package/tsconfig/pnpm-lock，scripts/build/client-contract/check-artifact/test/preview，.gitignore。
- 安装修复：package.prepare、scripts/check-git-install.mjs（隔离源码 Git fixture，不包含 lib、依赖或用户数据），README 两种安装路径和 pnpm11 精确许可；.pnpm-store 作为依赖缓存排除，不提交。
- 验证：tests/authorization、mode、client、server；preview仅开发模拟，不进入插件tarball。
- 当前W012安装包：`artifacts/dsh-duo-0.1.0.tgz`，本机安装唯一hash文件`dsh-duo-0.1.0-20bac1a168cd.tgz`，14个白名单文件，SHA256 `20bac1a168cdf9587cefecb4d4bc219ee687377f7e082379699cea65372abe19`。两个已安装lib入口与当前build逐一hash匹配。产物不提交，新设备从源码重建；W010/W011产物仅历史记录。

## 已执行的验证与限制

- pnpm install --ignore-scripts、frozen offline install：通过，精确官方发布版本锁定。
- pnpm typecheck、pnpm build：通过；Client仅require react/react-jsx-runtime/ui-primitives三项共享baseline，单lazy工厂检查通过。
- 当前W012：pnpm typecheck、test（23/23）、package:plugin通过。真实Cordis4.0.4/Gateway0.2.0-rc.2从插件Context加载生产Client，覆盖缺依赖拒绝、未授权、恢复授权、进入CHAT、官方登出回退及卸载。Client增加初始调用/挂载失败、重试、35秒超时迟到隔离及已授权网络故障测试；账号/carrier/presentation是fixture，不是Desktop或真实网页登录证据。
- 历史W010/W011：19/19曾通过，但只从root Context调用Gateway和宽松fake Client，未覆盖真实插件namespace依赖，不能继续用它证明授权链路正确。构建、Git安装、独立Host和模拟界面结果保留如下，与当前实测分开。
- 最终 pnpm package:plugin 与 git diff --check：通过。Client单工厂、3项共享baseline；tarball不含preview/tests/scripts或依赖。
- 独立profile：`DSH_HOME=/tmp/dsh-duo-validation-home`，duo-validation从官方web初始化。最终包换用含hash的临时新路径安装，安装后Host/Client文件hash与build一致；官方CLI启动的临时只读诊断确认dshDuo.authorization/watchAuthorization真实存在（仅typeof，无账号调用）。卸载后bundle/dependency撤回、dump-config与安装前逐字一致；不加诊断的原Host再次启动成功，无loader错误。匿名HTTP401是官方门槛，不算网页成功。两个验证进程均停止，3097已释放，含临时传输token的原始日志已清理。没有触碰用户DSH profile或安装包；该Web进程无Desktop桥，不能当native嵌入验收。
- pnpm preview + Playwright CLI：复用生产组件/ModeController，账号/layout/native guest均模拟，CSP禁止联网官网。初始禁用、首次授权不自动进入、手动往返同一lease/loadURL与Harness草稿、同账号刷新、窄窗口resize、56px侧栏折叠定位、render-process-gone显式重试释放旧lease、登出即时恢复并释放、账号B新分区均通过。模拟console为0 errors/0 warnings。截图在output/playwright，均明确写有未加载官网；pnpm preview可重建，不打入安装包。
- 官网公开无凭据HEAD返回429；不能判断普通iframe允许。未登录、未发送官网或模型请求，未读取真实用户profile。
- 真实Desktop网站加载、登录、发送、跨端历史、原生右栏/Session和Desktop禁用/卸载恢复仍待验收。
- 本轮已执行 `pnpm install --frozen-lockfile --ignore-scripts`、`pnpm typecheck`、`pnpm test`（19/19）、`pnpm package:plugin`；构建及 tarball 通过。`pnpm check:git-install` 用 pnpm10.33.2 通过；设置 DSH_DUO_INSTALL_PNPM 为官方 bundled pnpm 后，11.7.0 在精确 allowBuilds 许可下通过，安装包 Host 实际 import 与 Client 单工厂契约通过。
- 失败尝试：pnpm11仅 `--allow-build=dsh-duo` 返回 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`；独立 fixture 加准确 `dsh-duo@<Git specifier>#<sha>` 的 allowBuilds 后通过，README同步区别。不全局开放脚本权限。
- 当前W012 Desktop实测：官方CLI在desktop更新唯一hash修复包（--ignore-scripts），核对Host/Client安装hash；应用自动重载后AX显示CHAT/HARNESS均可用、HARNESS选中、pending文字消失，无错误。点击刷新仍保持；在原插件页禁用后自己的控件撤回，重新启用后授权再次正常确认且HARNESS选中。截图与AX直接确认，不依赖头像推断。未登出、未换账号、未进入官网/发送消息，未改其他插件、账号资料或安装包；CLI泛化peer警告未阻止实际加载。
- 本轮没有新增驻留服务。未stage/commit/push，代码和文档保留本地可审查成果；git diff --check及最终Git状态见W012结束记录。用户手动交付前不声称跨设备已同步。

## 必须保留的产品边界

1. DSH授权与网页登录独立。DSH官方登出可自动回Harness；网页内部登出无公开通知，不能承诺同样联动或账号匹配。
2. Browser storage进程内存隔离；重启需重新网页登录，不转移浏览器Cookie。手动模式往返保留文档；授权代次变化/卸载销毁guest，插件无法提取网页草稿或调用私有停止生成。
3. 原Harness新建快捷键保留，可能新建Session；自动退出CHAT只处理布局，不能保证原Session完整保真。
4. 下载/设备权限/外部OAuth弹窗受官方固定安全策略限制；网站具体功能待实测。未关闭webSecurity、注入脚本、抓私有接口或改安装包。
5. 这是候选网页嵌入；原生重绘、最终品牌位、其他版本与Web iframe不宣称支持。

## 可执行下一步

1. 当前Mac已装本地W012修复，授权不再卡住，可直接验收；其他设备尚不能从远端获得本轮未提交内容。用户先验收，再自行通过Codex右上角提交/推送代码与上下文，另一设备正常fetch后重建tarball或按README授予固定Git构建许可。
2. 验证原panel/右栏/Session、网页草稿、DSH登出和卸载；网站内部登出仍记录限制。Desktop晚到acquire/网络/进程故障仍须实测。不要通过Cookie/token或网页私有API实现“同步”。
3. 如修改并重装同版本tarball，DSH内的pnpm可能把同路径识别为Already up to date；即便--force也不可直接当作更新成功。本轮改用含hash的新路径并核对安装文件hash后才确认当前包。新设备无需依赖/tmp产物，直接重建并给新包唯一文件名。
4. 将用户官网/恢复/登出验收结果及时更新当前快照/worklog。无需让用户重述已确认需求；默认保留本地修改供验收与用户手动Git交付。当前真实授权确认不等于官网登录、聊天和历史已验收。
