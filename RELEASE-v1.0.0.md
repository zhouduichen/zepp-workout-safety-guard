# 运动异常守护 v1.0.0 — 发布说明

## 构建信息

| 项目 | 值 |
|---|---|
| 应用名称 | WorkoutSafetyGuard |
| 版本 | 1.0.0 |
| appId | 1116573 |
| 目标 API | 3.0 |
| 提交哈希 | `2c2a3ee` (`codex/demo-alpha-review`) |
| 构建时间 | 2026-06-22 22:21 |
| 构建产物 | `dist/1116573-WorkoutSafetyGuard-1.0.0-20260622222102.zab` (957 KB) |
| SHA-256 | `BED6659322E8F1FC2F28A55CE78843AAB9472D63265D688C17CC2BA140FCD128` |
| 模拟器目标 | Amazfit Balance 2 |

## 包含模块

- 首页仪表盘（守护状态、联系人、事件队列、趋势条）
- 首次引导（8 步说明 + 权限请求 + 演练）
- 求助页（30 秒倒计时、GPS、立即联系、取消确认弹窗）
- 事件历史（摘要统计、事件时间线、标记安全、清空）
- Secondary Widget（负一屏快捷入口）
- App Service 后台守护（自动检测、Alarm 升级、本地警报）
- Side Service + 演示调度器（蓝牙协议、去重、模拟投递）
- 设置页（手机端：联系人、阈值配置）
- 12 个安全场景回归模拟器

## 英文文案

手表页面、Secondary Widget、通知和手机设置页默认使用英文；安装包仅发布 `en-US` 元数据。

## 验证结果

| 检查项 | 结果 |
|---|---|
| `npm test` | 174/174 通过 |
| `npm run validate` | 通过 |
| `node scripts/simulate-scenarios.mjs` | 12/12 场景通过 |
| `zeus build` | 通过 |
| 包内抽查 | 480x480 圆屏、390x450 方屏均仅含 `en-US` |

## 操作流畅度改进（本次新增）

- 求助页"立即联系"按钮添加防重复点击锁
- 求助页"打开电话"按钮添加离开状态守卫
- 历史页"标记安全"和"清空"添加防重复点击守卫
- 演练页"开始演练"防重复触发
- 倒计时更新使用 `setProperty(prop.MORE, ...)`，避免全页重建
- 显示专用文本和装饰元素启用 `setEnable(false)` 优化
- 页面销毁时正确清理控制器、定时器和 GPS

## 已知限制

- **仅模拟器验证**：未在真机上运行
- **无真实短信/电话**：演示调度器仅返回模拟结果，`autoContactDispatch` 为 `false`
- **BLE 和 Alarm**：在模拟器中无法完整验证，需要真机测试
- **GPS**：仅在前台求助页运行，首次发送求助后再获取位置
- **Secondary Widget**：在模拟器中行为有限
- **后台传感器**：自动检测依赖真实心率、计步和佩戴传感器

## 后续步骤

1. 在 `Amazfit Balance 2` 模拟器中手动测试：
   - 确认取消流程无卡死
   - 快速点击不产生重复操作
   - 倒计时显示流畅
2. 真机验证（见 `docs/verification/true-device-runbook.md`）
3. 校准假阳性率（见 `docs/verification/calibration-log-template.md`）
4. 替换演示调度器为生产后端（需安全审查和法律审批）
