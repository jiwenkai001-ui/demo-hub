# AGENTS.md — restaurant-ordering-dual-demo

## 模块定位
- 本模块用于客户演示“餐桌扫码点餐 + 收银机 Web 端 + 双打印机同步出票”全链路。
- 技术栈：纯静态 `HTML + CSS + JavaScript`。
- 目标：本地可直接预览，服务器静态部署后可跨地址演示。

## 目录结构
- `index.html`：总入口，包含双端入口与餐桌扫码链接。
- `mini-app.html`：顾客点餐端（模拟微信手机号授权登录）。
- `cashier-web.html`：收银机端（账号密码登录）。
- `assets/shared.js`：订单、流水号、打印任务、跨页面同步逻辑。
- `assets/common.css`：全局视觉变量与通用组件。
- `assets/mini-app.*`：点餐端 UI 与业务逻辑。
- `assets/cashier-web.*`：收银端 UI、订单队列、票据渲染逻辑。
- `DESIGN.md`：唯一设计约束源。
- `.codex-log/`：任务留痕文档。

## 关键约定
- 收银端演示账号：`cashier_demo / Cashier@2026`。
- 小程序端无需账号密码，登录方式固定为“微信手机号授权”模拟流程。
- 订单存储键：`restaurant_ordering_orders_v1`。
- 流水号存储键：`restaurant_ordering_sequence_v1`。
- 打印任务存储键：`restaurant_ordering_print_jobs_v1`。
- 跨设备实时同步：由 `serve_demo.py` 提供 `/api/*` 同步接口；仅静态托管时不保证跨设备实时。
- 订单状态：
  - `pending_payment`：顾客已下单待支付。
  - `paid`：顾客已支付，触发收银与后厨同步出票。
- 支付方式支持：微信支付、支付宝、云闪付、微信零钱、银行卡（演示模拟）。
- 菜单支持分类导航、总览卡片与菜品图片展示。
- 小程序端提供底部常驻结算栏，保证长列表滚动时可直接结算。
- 小程序端包含会员中心预留模块，仅展示功能入口与说明，不含真实业务交互。
- 扫码链接带 `table` 参数时，小程序端可自动模拟微信授权并直接进入点餐页。
- 总入口支持二维码墙，按桌位生成通用扫码二维码并附带 `table` 参数。
- 收银与后厨出票通过同一已支付订单触发，默认同时生成两份票据任务。

## 已知注意事项
- 该 Demo 为单机演示，不包含后端服务和真实打印机驱动。
- 多标签页联动依赖浏览器的 `BroadcastChannel` 与 `storage` 事件。
- 若需真实扫码与真实出票，需要后续对接二维码服务、打印机网关与后端接口。
