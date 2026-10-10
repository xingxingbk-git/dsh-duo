# dsh-duo

**dsh-duo** 在 DeepSeek Harness（DSH）桌面版中提供 `CHAT | HARNESS` 切换。CHAT 的主区加载真实的 [DeepSeek Chat 官网](https://chat.deepseek.com/)，由官网处理网页登录、聊天和网页账号历史；HARNESS 保留原 DSH 工作区。

当前是针对 **DSH 0.2.0-rc.2** 的网页嵌入候选版。已具备源码、锁定构建与自动化测试；真实桌面网页登录、消息发送和另一浏览器中的历史一致性尚未验收。

## 使用方式

1. 在 Harness 原账号入口完成 DeepSeek 账号授权。授权尚未确认时，整个切换控件禁用。
2. 授权确认后手动选择 CHAT，再在真实官网网页中登录你的网页账号。两处登录独立，不会自动转移登录凭据。
3. 网页内的新建、聊天和历史全部使用官网自身功能。网页数据由官网存储，插件不维护另一份聊天记录。
4. 手动返回 HARNESS 时保留网页容器，恢复进入前的主面板；再进 CHAT 继续使用同一网页。插件不会主动更改右栏的宽度、标签或全屏状态。

切换入口暂放在可访问的插件控件中，原 Harness 品牌区域保留。CHAT 的模式侧栏和网页工具条也提供返回入口。

## 构建与安装

开发环境：Node.js 22.19+ 或 24+、pnpm 10.33.2。运行兼容目标：DSH 0.2.0-rc.2 / Cordis 4.0.4 / React 18.3.1；其他版本待验证。

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm package:plugin
```

预构建安装包为 `artifacts/dsh-duo-0.1.0.tgz`。它包含 Host、Client、类型声明和官方 bundle patch。通过 DSH 官方插件管理器安装本地 tarball；CLI 示例（将路径替换为你的实际文件）：

```bash
dsh plugin --profile desktop add /absolute/path/dsh-duo-0.1.0.tgz --ignore-scripts
```

若使用其他 profile，替换 `desktop`。安装后按 DSH 提示重新加载。卸载可通过原插件管理界面，或：

```bash
dsh plugin --profile desktop remove dsh-duo
```

### 从 GitHub 地址安装

仓库只保存源码；Git 安装必须允许插件的 `prepare` 构建，才能生成 `lib/index.js` 与 `lib/client.js`。仅下载源码或使用 `--ignore-scripts` 安装 Git 依赖会缺少入口，启用时显示 `failed to import`。

使用固定提交安装：

```bash
dsh plugin --profile desktop add "github:xingxingbk-git/dsh-duo#<完整提交哈希>"
```

将占位哈希替换为实际提交。DSH 0.2.0-rc.2 内置 pnpm 11：首次执行会提示 `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`，按它打印的准确 Git 包标识在 `$DSH_HOME/profiles/desktop/pnpm-workspace.yaml` 中增加 `allowBuilds`，再重试。保留已有配置，只允许本次指定提交，不要全局允许所有依赖脚本。普通 pnpm 10 的 CLI 可用 `--allow-build=dsh-duo`，该参数不能替代 pnpm 11 的 Git 身份许可。

构建执行本仓库的脚本；不希望在安装时构建可使用上面的预构建 `.tgz`。

完整安装规则参见 [DSH 官方插件安装文档](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)。候选版在独立 Web profile 可检查打包和 Host 加载；Web profile 没有 Desktop Browser 桥，CHAT 会明确保持禁用。

## 当前限制

- 这是 DSH 外层框架内的真实网页，网页内部界面仍由 DeepSeek 官网绘制。使用 DSH 原生组件重绘官网历史尚无官方公开接口依据。
- DSH 授权和网页登录互相独立，插件不能确认两处是否为同一账号。DSH 官方确认退出/授权失效会回 Harness；网页内部退出登录没有公开通知，无法实现对应的自动回 Harness。
- DSH 官方 Browser 分区只保留当前应用进程，不共享 Safari/Chrome 登录。重启 DSH 后需重新网页登录；该网页账号已有服务器历史由官网恢复。
- 手动模式切换保留网页；插件卸载、DSH 授权失效或账号代次变化会销毁容器。未发送草稿和网页在途生成无法由插件提取、备份或调用官网停止接口。
- 原 Harness 新建快捷键/菜单保留原行为，可能创建新的 Harness 会话并退出 CHAT；此路径不保证原 Session 保真。
- 原生 Browser 安全策略会限制下载、设备权限及部分弹窗；网页登录、验证码、上传等须实测。普通 Web 浏览器版暂不开放 iframe 回退。

## 权限与数据流

插件通过官方公开接口读取不含凭据的 DSH 授权状态和账号标识。网页使用 DSH 官方批准的隔离 Browser guest：不读密码/Cookie/token，不注入网页脚本，不抓私有接口，不关闭网页安全策略，不修改 DSH 安装包。

插件没有独立模型发送或本地聊天存储功能；不会把 DSH API 生成的对话冒充官网历史，也不自动合并账号数据。网页里的数据处理遵循官网自身行为。
