# AGENTS.md — hanfu-queue-demo

## 模块定位
- 本模块用于客户演示“汉服商户排队叫号”双端单队列全流程。
- 技术栈：纯静态 `HTML + CSS + JavaScript` + `Python serve_demo.py`。
- 目标：本地可随时改，服务器可简单部署，任意网络地址可演示访问。

## 目录结构
- `index.html`：总入口，包含双端入口与顾客端二维码扫码模拟入口。
- `customer.html`：顾客取号端 H5。
- `merchant.html`：商户叫号端 H5。
- `assets/common.css`：统一主题变量与组件样式。
- `assets/i18n.js`：中英文词典、语言切换与页面翻译挂载。
- `assets/shared.js`：公共 API 封装与状态工具。
- `assets/customer.js`：顾客端交互逻辑。
- `assets/merchant.js`：商户端叫号控制逻辑。
- `assets/display.js`：大屏展示逻辑。
- `serve_demo.py`：静态服务与实时同步 API。
- `data/state.json`：演示状态文件。
- `DESIGN.md`：唯一设计约束源。
- `.codex-log/`：过程留痕。

## 关键约定
- 业务类型固定单类：`general`。
- 号段前缀：`H`，每日递增。
- 队列状态：`waiting / called / passed / completed`。
- 当前叫号由 `currentCall` 表示，只允许单个当前号。
- 每日单号：同一 `deviceId` 在同一天仅能持有一个有效号单（`waiting/called/passed`），再次扫码会返回原号进度。
- 重置接口：`POST /api/demo/reset`，演示开场建议先执行。
- 语言切换：四个页面统一提供 `中文/EN` 切换，语言状态存储在 `localStorage` 的 `hanfu_queue_lang`。
- 跨域策略：服务端默认输出 `Access-Control-Allow-Origin: *` 与 `OPTIONS` 预检支持。

## 已知注意事项
- 当前项目按用户要求不自动添加统计埋点，如需接入需用户明确下达指令。
- 只有通过 `serve_demo.py` 启动时，跨设备实时同步才可用。
- 若演示网络环境受限，请确认 `8800` 端口可访问。
