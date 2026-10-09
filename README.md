# dsh-duo

**dsh-duo** 是 DeepSeek Harness（DSH）的模式切换插件，目标是在同一应用中提供 `CHAT | HARNESS` 两种体验：普通聊天与原有 Agent 工作区。

当前版本处于早期开发阶段，模式切换、账号授权联动及聊天功能尚未实现，也尚未完成构建和安装验证。

## 功能设计

- **CHAT**：接近 DeepSeek 网页聊天的体验，提供对话导航与聊天主区，隐藏 Harness 专属右侧栏。
- **HARNESS**：保留 DSH 原有 Agent 功能；从 CHAT 返回时恢复此前的工作区和面板状态。
- **模式选择器**：保留 DeepSeek 图标，在品牌区域提供 `CHAT | HARNESS` 切换，白底表示当前选项。

以上为插件的功能设计，当前尚未提供可运行实现。

## 登录要求

- 未登录或未获得有效 DeepSeek 账号授权：保持 HARNESS，整个切换控件置灰禁用，HARNESS 原功能仍可使用。
- CHAT 中退出登录或授权失效：立即返回 HARNESS，再禁用切换控件。
- 首次登录或重新授权成功：启用切换控件，由用户主动进入 CHAT。
- 不提供匿名 CHAT；API key 或其它模型配置不能替代 DeepSeek 账号登录授权。

有效账号授权不代表网页对话历史可同步。网页历史同步尚未获得官方接口支持证据，当前不支持。

## 构建与安装

需要 Node.js、pnpm 和与目标 DSH 版本匹配的依赖。当前参考版本为 DSH **0.2.0-rc.2**，实际兼容性尚未验证。

源码构建命令：

```bash
pnpm install
pnpm typecheck
pnpm build
```

预期输出为 `lib/index.js` 和 `lib/client.js`。上述完整构建流程及 DSH 加载尚未验证；安装方式参见 [DSH 官方插件安装文档](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)。

## 数据与权限

插件设计仅使用 DSH 官方扩展点，不修改 DSH 安装包，不自行读取或保存密码、浏览器 Cookie 和访问令牌。账号授权仅使用官方明确支持的机制。

聊天数据来源、缓存位置和保存策略尚未确定；当前没有实现聊天数据处理，也不会自动合并本地缓存与网页账号历史。

源码仓库：[xingxingbk-git/dsh-duo](https://github.com/xingxingbk-git/dsh-duo)。
