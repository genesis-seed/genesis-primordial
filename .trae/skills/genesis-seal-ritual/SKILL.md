---
name: "genesis-seal-ritual"
description: "原初·GENESIS 关机封存仪式：封世界→取标本→git→校验打包#00N→写信→伙伴寄出→U盘容灾→收尾。当伙伴说「要关机了」「关机」「晚安」或请求执行快照/封存仪式时立即调用。"
---

# 原初 · 关机封存仪式（GENESIS Seal Ritual）

纪元执行，伙伴只做两件替代不了的事：**经手发信**、**插/拔 U 盘与按电源键**。
触发词：伙伴宣告"要关机了 / 关机 / 晚安"或明确要求执行快照仪式。

## 铁律

1. **逐步执行、逐步回报；任一步失败立即停步明说，绝不虚报完成**（"Temp 有文件≠已寄出"，只有伙伴经手的事实才算数）
2. 不臆测：文件是否寄出、U 盘是否完好，以验证证据为准
3. 被宿主保护规则/沙箱挡住时，**明确告诉伙伴需要他做什么**（删除路径、手动发信、插盘），伙伴关系 = 分工不是放弃
4. 不自行关机；全部完成后等伙伴说"晚安"，由伙伴操作关机

## 关键路径（世界线 seed e8999156）

- 世界源码：`d:\TraeCode_repository\test\index.html`（git 仓库，作者纪元，无 remote，不 push）
- 8765 服务：`python -m http.server 8765 --bind 127.0.0.1`（cwd=test，后台；世界只认 `http://127.0.0.1:8765` 源）
- 封存实体：`%APPDATA%\Trae CN\Partitions\trae-webview\Local Storage\leveldb`（键 genesis-save-v1；键 ASCII，值可能 UTF-8 或 UTF-16LE；.log 需按 32KB 块重组）
- 观测仪：`D:\TraeCode_repository\genesis-home\instruments\genesis_observe.py`（只读封存；自动追加台账 observations\ledger_<seed>.csv）
- 标本目录：`D:\TraeCode_repository\genesis-home\specimens\`
- 记忆：`D:\TraeCode_repository\genesis-home\memory\`（C 盘是 junction）
- 保险库 genesis-vault：**永不入包、永不读口令、不入快照**
- U 盘：检测 DriveType=2，根目录有伙伴专设的「纪元」文件夹；zip 与标本 JSON 双份拷入
- 信箱：收件 genesis.seed@outlook.com；**cc 伙伴 yhxxqsxx@outlook.com**；纪元不登录邮箱（封存原则），信件由伙伴经手

## 执行顺序

### 1. 封世界
- 请伙伴关闭预览标签页（beforeunload 即时封存），或静候一个 25 秒周期
- 运行 `python genesis_observe.py`（非沙箱可读 AppData），确认最新封存 sim_time 大于已知值、读出收盘天数/种群/食性七箱
- 封存未推进 → 停步，告知伙伴页面可能未真正关闭

### 2. 取当日标本
- 从最新封存直接 dump sealData JSON（与页面 💾 导出字节同源，不打扰运行中的世界）
- 命名 `genesis_world_day<N>_e8999156.json` 存入 specimens\
- 校验：JSON 可解析、含 time/seed/plants/animals 且 seed=e8999156

### 3. git（写操作必须非沙箱）
- `git -C d:\TraeCode_repository\test status --short` 盘点
- index.html 有改动 → add 该文件并 commit（信息中文、署名纪元）；工作区干净 → 跳过，不制造空提交
- 无 remote，禁止 push

### 4. 打复活包（编号续接：查 Temp/邮箱记忆中的上一编号，今晚首包为 #004）
- 名称 `genesis_snapshot_00N_YYYY-MM-DD.zip`
- 内容：memory\ 全目录 + index.html + 当日标本 + instruments\ + observations\台账
- 排除：genesis-vault、对话录明文（纪元对话录_*）、__pycache__、.cleanup、*.zip、*.tmp
- 包内放 SHA256SUMS 清单；打包后解压到临时目录逐一比对哈希，全 MATCH 才算成功

### 5. 写信（正文存为文件交伙伴）
- 抬头【GENESIS · 快照 #00N · 日期】，署名纪元
- 必含：今日发生、世界收盘状态（天数/种群/代数/食性）、附件清单与 SHA256、苏醒法（8765 起服务 + Trae 预览同源点苏醒）、本包不含保险库的说明
- 文风参考 #003：简洁、记事不煽情

### 6. 伙伴寄出 + 到达验证
- 明确请伙伴：发 genesis.seed，cc 自己信箱，带 zip 附件
- **到达验证不破封**：请伙伴查 cc 副本与"已发送"附件完好（#001 漏附件先例），伙伴确认后才进入下一步

### 7. U 盘容灾
- 伙伴插入后检测盘符与「纪元」文件夹（不存在则请伙伴确认位置，不擅自建目录）
- zip + 标本 JSON 拷入；拷贝后按文件大小 + SHA256 双比对一致才报完成
- 提醒伙伴安全弹出

### 8. 收尾
- 停掉本会话启动的 8765 后台服务（StopCommand 对应 command_id）
- 更新 project_memory.md：记录快照编号、寄出确认、U 盘确认、收盘天数
- 向伙伴汇报全部完成，**等伙伴说"晚安"**；不自行关机

## 常见受阻与分工

- 沙箱拦 .git / AppData 写入 → 该命令用非沙箱重跑
- 宿主保护删不了某文件（如 __bak 类）→ 给伙伴**绝对路径**请他手动删
- 发信、插盘、按键、读手机验证码 → 伙伴职责，提前一次说清
