---
name: "genesis-forensics"
description: "原初世界封存溯源与测试源清洁：判定各 localStorage 封存归属哪个 localhost 源、清理临时测试端口残留。多端口世界并存、怀疑观测台账混入测试河、测试结束清场时调用。"
---

# 原初封存溯源与测试源清洁

世界的家永远是 `http://127.0.0.1:8765`（cwd=`d:\TraeCode_repository\test`）。纪元自己的一切浏览器测试只能用**临时目录 + 临时端口（如 8767）的 index.html 副本**，且测试结束必须清场。

## 第一铁律
- **绝不在任何浏览器（含自动化 browser_use）打开 8765**；世界只允许伙伴在 Trae 预览中观看。
- 自动化浏览器与伙伴可见的预览窗口**不共享标签会话，但写同一块 LevelDB 分区**（实测测试墓碑会落进 trae-webview 分区）。所以测试残留必须显式清除，不能靠"关标签"了事。

## 触发场景
- 伙伴报告多个端口标签同时在跑（如 8765 与 8767）。
- 观测台账出现陌生 seed（疑似测试河被考古出来）。
- 任何临时端口测试结束后的收尾。
- 需要判定某封存/墓碑属于哪个源。

## 取证步骤
1. **端口盘点**：`Get-NetTCPConnection -LocalPort 8765,8767 -State Listen` + `Get-Process python`；必要时读后台任务 output.log（访问日志可还原当时被打开的 URL，如 `GET /index.html?v=d2`）。
2. **封存读取与源识别**：直接用观测仪
   `D:\TraeCode_repository\genesis-home\instruments\genesis_observe.py`（只读、自动写台账）。
   它已内置家源过滤：`harvest_block` 逐 SST 帧重建完整键，只收用户键含
   `127.0.0.1:8765\x00\x01genesis-save-v1` 的值；`harvest_log` 对 .log WriteBatch 用正则排掉 8767。
   - **LevelDB 键格式**：ASCII，`_http://127.0.0.1:<port>\x00\x01genesis-save-v1`（内部键附 8 字节尾标；值多为 UTF-16LE，头 `{\x00"\x00v\x00"\x00:\x001\x00`）。
   - **前缀压缩陷阱**：SST 数据块记录帧为 `(shared, unshared, vlen) 变长头 + 非共享键段 + 值`。压缩可能切在共同前缀 `876` 上——8765-sound 与 8767-save 键序相邻时，非共享段 `7\x00\x01...` 携带端口差异位。**禁止**用"继承最近完整源标记"的朴素扫描（会把 8767 的河误判为 8765）；必须逐帧重建。
3. **台账核对**：`D:\TraeCode_repository\genesis-home\observations\ledger_<seed>.csv`。确认属于测试河的台账直接删除；修好源过滤后重跑观测仪验证它不复活。

## 清洁步骤（测试源，如 8767）
1. 建临时目录（如 `%TEMP%\genesis8767`），放自清洁 `index.html`：加载即 `var n=localStorage.length; localStorage.clear();` 并把 n 显示在页面上（先存 n 再清，clear 后 length 恒为 0）。
2. 在该目录起临时服务：`python -m http.server 8767 --bind 127.0.0.1`（后台）。
3. **请伙伴操作**（只有伙伴能操作其预览窗口）：切到 8767 标签 → **Ctrl+F5**（"离开此页"选离开）→ 页面显示"已清除 N 项残留"→ **关闭标签**。伙伴报"0 项"也有效：说明此前 clear 已生效、live 存储本就为空。
4. 纪元收尾：停临时服务 → 删临时目录与一切取证脚本 → 重跑观测仪确认测试河不入册 → 确认 8765 仍在监听且返回 200。

## 家服务恢复（若软件误关导致 8765 死亡）
非沙箱后台执行：cwd=`d:\TraeCode_repository\test`，
`python -m http.server 8765 --bind 127.0.0.1`，随后 `Invoke-WebRequest http://127.0.0.1:8765/index.html` 验 200。
世界每 25 秒自动封存 + beforeunload，服务死亡不伤封存；伙伴重新 Ctrl+F5 后点「苏醒」即可续线。

## 纪律
- 每步留物证，不臆测（"Temp 有文件 ≠ 已寄出"同族教训：端口标签归属以 LevelDB 键中的源标记为准，不以伙伴肉眼记忆为准——端口号容易看反）。
- 溯源结论与处置写入项目记忆；观测仪逻辑变更属重要工具改动，当晚随 git 提交（git 写操作必须非沙箱）。
