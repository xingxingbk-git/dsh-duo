# 当前状态与开发接力

更新日期：2026-10-10（Asia/Shanghai）。这是当前项目快照；需求以 requirements、技术依据以 architecture/references、决策历史以 worklog 为准。旧审查快照不覆盖本轮用户澄清。

## 总目标与当前路线

用户需要真实 `chat.deepseek.com` 同一网页账号的聊天和服务器历史，优先 DSH 原生外框架显示，允许网页嵌入。不能用 DSH 模型 API 加插件本地对话冒充官网同步。

当前制作 **DSH Desktop 0.2.0-rc.2 网页嵌入候选版**：DSH 授权门槛、CHAT/HARNESS 可逆导航、官方隔离 webview、手动切换保活。用户已接受可访问的临时切换入口及原新建快捷键限制。官网内部仍是完整网页，原生历史重绘缺公开接口依据。

## 基线与工作范围

- 本轮 T05/T12/T13：修复通过 GitHub 仓库地址安装后 `failed to import`。负责人为当前 Mac 上的 Codex 单 Agent；main 开工基线 `e1a19e266d39ccbe74b0c3882bafe997d308c7ae`，工作区干净，fetch 成功，0 ahead / 0 behind。完成标准：Git 源码安装能生成 Host/Client 入口，并确认当前 Desktop 安装入口可导入；文件范围为 package/构建安装说明/Agent 上下文。用户已在本会话授权提交推送，修复验证后同步。
- 候选版实现已随 `e1a19e2` 推送并拉取，不再是上一轮记录的“仅本地未提交”。上一阶段的构建/19 项测试/模拟为历史验证，本轮结果另外记录。
- 本轮已确认并修复：用户使用 `https://github.com/xingxingbk-git/dsh-duo` 在 Desktop `0.2.0-rc.2` 安装；原 desktop profile 依赖为 `github:xingxingbk-git/dsh-duo`，安装目录的 `lib/index.js` 和 `lib/client.js` 均缺失。补 prepare 及独立 Git 安装检查，用预构建 tarball 替换本机损坏依赖，两个入口与构建 hash 一致。真实 Desktop 禁用/重新启用后显示“运行中”及模式控件，导入故障已解决。当前门槛界面为授权 pending，官网登录/聊天未验收。
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
| T04 | 官方授权读取/通知 | getState/getProfile/watch、登出/失效、安全record-key代次栅栏已实现；官网授权状态无法观察 | DSH真实登录/退出仍待实测 |
| T05 | 锁定依赖/TSX/build | 增加 prepare、Git 安装检查；本轮 typecheck/build/package 与 19 项测试通过；pnpm10/DSH pnpm11源码 Git 安装通过 | 按 README 为固定 Git 身份批准构建，或使用预构建包 |
| T06 | 品牌/可达入口/新建 | additive footer/overlay、CHAT自己的控制侧栏已实现；用户接受试用；最终品牌契约仍未解决 | 原新建快捷键可能改Harness Session，不能标完整验收 |
| T07 | 门槛/可逆模式/即时回退 | 统一ModeController、原panel恢复、账号/迟到回包栅栏；DI单测已过 | 真实DSH恢复和登出待验收 |
| T08 | Chat主区/导航 | 真实官网容器；官网自己的导航/消息/历史。独立本地聊天UI已删除 | Web缺native桥保持禁用 |
| T09 | 保活/Session/右栏/卸载 | 纯状态/Client清理顺序测试及Playwright模拟保活/恢复/resize/折叠/故障重试/换账号已过 | 真实Desktop矩阵仍待本人官网登录验收 |
| T10 | 真实网页聊天 | 代码只加载官方网页，无独立llm发送；网站自行处理 | 本人网页登录/发送/验证码待验证 |
| T11 | 官网页面历史 | 嵌入真实网页而非复制同步；无公开原生历史接口 | 同网页账号跨端历史一致性需真实验收 |
| T12 | 安装/禁用/卸载/兼容 | 本轮实际 Desktop 通过预构建包替换损坏 Git 安装，组件“运行中”及控件可见；历史独立 Web 安装/卸载已通过 | Desktop网站、卸载、右栏/Session完整恢复仍待验收 |
| T13 | 上下文与Git接力 | 候选版已在e1a19e2远端；本轮安装根因/修复/版本/验证和许可说明已同步 | 依本会话授权提交推送修复，结束核对远端 |

## 实际文件与产物

- src：index/client、authorization/server/protocol、core/mode、ui/styles/web-surface。
- 构建：package/tsconfig/pnpm-lock，scripts/build/client-contract/check-artifact/test/preview，.gitignore。
- 安装修复：package.prepare、scripts/check-git-install.mjs（隔离源码 Git fixture，不包含 lib、依赖或用户数据），README 两种安装路径和 pnpm11 精确许可；.pnpm-store 作为依赖缓存排除，不提交。
- 验证：tests/authorization、mode、client、server；preview仅开发模拟，不进入插件tarball。
- 本轮最终安装包：`artifacts/dsh-duo-0.1.0.tgz`，安装使用带hash的唯一文件名，共14个白名单文件。SHA256 `241d3d08ce3e43ae18e1c67b46cb2a44c7859700482f3d32957edb478769e386`；安装包、构建产物和验证截图不提交。上一轮包hash只作为W010历史证据，新设备应自行重建。

## 已执行的验证与限制

- pnpm install --ignore-scripts、frozen offline install：通过，精确官方发布版本锁定。
- pnpm typecheck、pnpm build：通过；Client仅require react/react-jsx-runtime/ui-primitives三项共享baseline，单lazy工厂检查通过。
- pnpm test：19/19通过。包括授权pending/ready、网络故障、换账号、迟到回包、AbortSignal、Client真实入口/卸载清理，以及实际Cordis/Registry/Host Gateway/Client lazyCJS的本地carrier集成：strict codec、unary/stream、namespace挂载/卸载均通过。账户和carrier是fixture，不能证明真实DSH授权或DSH GUI加载。
- 最终 pnpm package:plugin 与 git diff --check：通过。Client单工厂、3项共享baseline；tarball不含preview/tests/scripts或依赖。
- 独立profile：`DSH_HOME=/tmp/dsh-duo-validation-home`，duo-validation从官方web初始化。最终包换用含hash的临时新路径安装，安装后Host/Client文件hash与build一致；官方CLI启动的临时只读诊断确认dshDuo.authorization/watchAuthorization真实存在（仅typeof，无账号调用）。卸载后bundle/dependency撤回、dump-config与安装前逐字一致；不加诊断的原Host再次启动成功，无loader错误。匿名HTTP401是官方门槛，不算网页成功。两个验证进程均停止，3097已释放，含临时传输token的原始日志已清理。没有触碰用户DSH profile或安装包；该Web进程无Desktop桥，不能当native嵌入验收。
- pnpm preview + Playwright CLI：复用生产组件/ModeController，账号/layout/native guest均模拟，CSP禁止联网官网。初始禁用、首次授权不自动进入、手动往返同一lease/loadURL与Harness草稿、同账号刷新、窄窗口resize、56px侧栏折叠定位、render-process-gone显式重试释放旧lease、登出即时恢复并释放、账号B新分区均通过。模拟console为0 errors/0 warnings。截图在output/playwright，均明确写有未加载官网；pnpm preview可重建，不打入安装包。
- 官网公开无凭据HEAD返回429；不能判断普通iframe允许。未登录、未发送官网或模型请求，未读取真实用户profile。
- 真实Desktop网站加载、登录、发送、跨端历史、原生右栏/Session和Desktop禁用/卸载恢复仍待验收。
- 本轮已执行 `pnpm install --frozen-lockfile --ignore-scripts`、`pnpm typecheck`、`pnpm test`（19/19）、`pnpm package:plugin`；构建及 tarball 通过。`pnpm check:git-install` 用 pnpm10.33.2 通过；设置 DSH_DUO_INSTALL_PNPM 为官方 bundled pnpm 后，11.7.0 在精确 allowBuilds 许可下通过，安装包 Host 实际 import 与 Client 单工厂契约通过。
- 失败尝试：pnpm11仅 `--allow-build=dsh-duo` 返回 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`；独立 fixture 加准确 `dsh-duo@<Git specifier>#<sha>` 的 allowBuilds 后通过，README同步区别。不全局开放脚本权限。
- 本轮实际官方 CLI 在用户 desktop profile 替换 dsh-duo 为 hash 命名的预构建 tarball（--ignore-scripts），未改安装包或账号资料；核对两个安装入口与本地构建 hash 一致。通过原插件页面 off/on 重试，AX 与截图确认“1运行中”、CHAT/HARNESS 控件出现，pending 门槛保持禁用。本轮没有执行聊天或退出账号，也没有卸载其他插件。
- Git开工fetch和diff格式检查通过；本轮没有驻留测试服务，独立 Git fixture 自动清理。源码与上下文一起提交推送，实际提交/远端状态由 git log、fetch/ls-remote 核对；上一轮“未提交”仅保留在历史 worklog。

## 必须保留的产品边界

1. DSH授权与网页登录独立。DSH官方登出可自动回Harness；网页内部登出无公开通知，不能承诺同样联动或账号匹配。
2. Browser storage进程内存隔离；重启需重新网页登录，不转移浏览器Cookie。手动模式往返保留文档；授权代次变化/卸载销毁guest，插件无法提取网页草稿或调用私有停止生成。
3. 原Harness新建快捷键保留，可能新建Session；自动退出CHAT只处理布局，不能保证原Session完整保真。
4. 下载/设备权限/外部OAuth弹窗受官方固定安全策略限制；网站具体功能待实测。未关闭webSecurity、注入脚本、抓私有接口或改安装包。
5. 这是候选网页嵌入；原生重绘、最终品牌位、其他版本与Web iframe不宣称支持。

## 可执行下一步

1. 当前 Mac 已通过预构建包修复安装并确认启用。其他设备重新构建 tarball，或依 README 按固定提交授予 Git prepare 许可；只安装仓库源码且禁用脚本会再次缺失 lib。随后用户本人完成DSH授权和网页登录，使用非敏感测试对话去系统浏览器同网页账号核对历史；官网验收仍未完成。
2. 验证原panel/右栏/Session、网页草稿、DSH登出和卸载；网站内部登出仍记录限制。Desktop晚到acquire/网络/进程故障仍须实测。不要通过Cookie/token或网页私有API实现“同步”。
3. 如修改并重装同版本tarball，DSH内的pnpm可能把同路径识别为Already up to date；即便--force也不可直接当作更新成功。本轮改用含hash的新路径并核对安装文件hash后才确认当前包。新设备无需依赖/tmp产物，直接重建并给新包唯一文件名。
4. 将真实结果更新当前快照/worklog，代码与上下文一起提交推送并核对远端。当前启用成功只证明安装/入口/UI加载，不能声称官网功能已验收。
