# 官网会话持久化所需的宿主能力

这是上游能力提案，不是已存在API，也不表示本插件已实现重启免登录。目标：用户在插件管理的chat.deepseek.com中正常登录后，退出并重开DSH可恢复同一网页账号会话；账号退出、DSH账号换代、卸载清理有明确行为。

## 已确认阻碍

2026-10-10再次核查：本机DSH0.2.0-rc.2发布产物仍使用下述内存分区。官方最新0.2.1-alpha.2/固定master d743267388641bc76f17c45ce8b4c231aed1d32c也明确Cookie和网页存储不会跨应用重启；升级到该版本不能解决。见[官方Browser限制](https://github.com/deepseek-ai/deepseek-harness/blob/d743267388641bc76f17c45ce8b4c231aed1d32c/packages/client/ui-sidebar-browser/README.md#known-limitations-and-deferred-work)。本轮0.1.6仅恢复语言偏好，没有实现认证持久化。

目标DSH 0.2.0-rc.2公开DesktopBrowserBridge仅提供acquire(workspace)、release(lease)、onOpenRequested。browser-guests主进程随机生成无persist前缀的隔离partition，并在will-attach时强制检查；当前master也未公开持久会话选项。官网认证状态属于Electron主进程Session，插件Host子进程和ConfigForms无法改变其存储生命周期。临时内存偏好缓存、页面localStorage或DSH平台账号登录都不能代替Chat登录Session。

## 建议契约

由DSH主进程提供受限、可选的持久Browser会话能力：固定插件身份、账号隔离键、明确允许origin、生命周期和用户清理入口。主进程维护稳定的persistent partition与lease对应关系，仍保留现有contextIsolation/nodeIntegration、安全校验、下载/设备权限限制；插件只接收已批准lease/partition，无法读出Cookie/token或其它插件会话。

应区分“隐藏/释放视图”和“退出账号/清理会话”，定义账号授权变化与卸载时是否保留用户选择的网页Session。不能把workspace自由字符串当任意持久分区访问权，也不能让插件指定已有系统浏览器/平台账号分区。

## 验收标准

- 正常官网UI登录；退出并重启DSH，同一账号恢复，无插件凭据读写。
- Chat语言/语音分别用官方配置恢复；与网页Session成功恢复各自验证，不能混作一个结果。
- 同账号模式/设置往返保留草稿；换账号和确认退出后不显示旧账号列表、数据或迟到响应。
- 不同插件/不同账号分区不可串用；篡改lease/partition仍拒绝。
- 明确清理、卸载、丢失会话/认证过期和官网环境警告的用户流程。

在宿主提供并验证该能力之前，dsh-chat必须如实保留“重启需官网重新登录”的限制；不得修改已安装DSH主进程、迁移凭据或绕过官网检测。后续可以先向上游提交能力需求或源码PR，但需用户另行授权对外提交。
