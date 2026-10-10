# 开发路线

状态：2026-10-10。数据源按用户澄清改为 DeepSeek 网页本身；不做 DSH 模型加本地对话替代。候选版先用官方 Desktop Browser 嵌入，原生网页历史重绘等待公开契约。

## 阶段 0：需求与官方契约

已完成当前需求阅读、固定版本源码与本机公开 Browser 入口核对。安全 DSH 账号资料/观察、Typert strict descriptors、main/layout/Browser lease 契约已核对。无 live Cordis Inspect，不能把静态核查称作 live 查询。

## 阶段 1：构建与安全模式控制

实现锁定依赖、TSX、Host/browser 打包及 tarball；账号门槛、授权代次栅栏、模式控制、原 panel 恢复与 Core 单元测试。具体已执行结果以 handoff 为准。真实 DSH 与网站登录联动仍不以单测代替。

2026-10-10 修复源码 Git 安装缺少 prepare 的交付问题；普通 pnpm 10 与 DSH bundled pnpm 11 的固定提交构建许可分别复验，保留 tarball 安装路径。真实 Desktop 已确认插件启用及控件显示，这不等于网站验收。

同日用户发现授权持续pending。已补Client独立remote namespace动态注入、初始失败收敛、35秒期限和刷新入口；23项测试含真实插件Context回归通过。当前Desktop授权收敛实测见handoff，官网与完整恢复矩阵仍待验收。

## 阶段 2：真实网页容器候选版

通过Desktop Browser lease创建安全webview；main占位自然隐藏右栏，persistent shell.overlay保留网站文档。仅测自有矩形，手动切换不销毁网页。入口已按2026-10-10截图移至顶部品牌：装饰槽仅放字标/锚点，官方overlay提供独立交互层；移除底部和角落旧入口。Mac鼠标/键盘、折叠、往返、禁用恢复实测通过，其他平台待验证；保留原快捷键限制说明。

使用开发 harness 验证 guest 创建、加载错误、手动切换保活、账号代次销毁和晚到申请清理；harness 不加载真实官网，不把 mock 网页称作真实聊天。

## 阶段 3：真实 Desktop 验收

在用户自己的 DSH Desktop 安装预构建包；本人在真实官网正常登录，确认验证码和聊天可用，发送一条可识别的非敏感测试对话，再在系统浏览器同账号确认历史。只通过用户正常网页操作，不采集/迁移密码、Cookie 或 token。

验证 Harness 原 panel/右栏/Session、往返时网站草稿与网页流继续、DSH 官方登出回退、禁用/卸载原 UI 恢复。独立 Web profile 只能验证 Host 加载和缺少 native bridge 时的禁用，不能代替 Desktop。网站内部登出通知缺失时如实标注未实现。

## 阶段 4：原目标的剩余契约

品牌视觉位置已用官方装饰槽和独立overlay解决，继续验证其他平台与辅助技术。等待或核实新建快捷键模式拦截、网页账号/退出通知及历史API；接口成立后才能用DSH原生UI绘制网页内容并保持同一数据。没有接口时维持真实网页呈现，不抓私有API，不伪造同步。

## 阶段 5：发布

真实 Desktop 验收完成后再考虑对外发布、兼容范围、升级/回滚和网站权限限制。产品说明与Agent状态保持职责分离。当前用户先验收，再自行通过Codex右上角提交/推送代码和上下文；Agent默认只保留本地修改，未提交/推送内容不声称跨设备同步。
