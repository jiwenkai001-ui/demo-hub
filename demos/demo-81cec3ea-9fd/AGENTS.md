# 京麦源静态 Demo 模块约定

日期：2026-11-17；执行者：Codex。

- 用户已于本轮回复“好的继续”，完整方案获准执行。
- 纯 HTML/CSS/JavaScript 多页面，无业务服务器、数据库、构建或外部 CDN 依赖。
- 视觉唯一约束为根目录 DESIGN.md，主题集中在 assets/tokens.css，公共组件集中在 assets/app.css。
- js/seed.js 生成虚构演示数据，js/store.js 维护统一状态及业务事务，其他页面不能自行修改业务余额。
- 金额以整数分存储；产品数量保留两位小数，规格重量以 kg 表达，成本计算先统一计量单位。
- 确认订单占用库存，取消释放，签收才实扣和形成应收；信用不能重复计算订单与应收。
- 客户视图只展示当前客户专属价格与账单；角色与客户切换为演示用途。
- 本地通过静态 HTTP 服务运行以确保各页面共享 localStorage；文件直开仅用于单页预览。
- 新增公共方法需中文注释说明参数约束、返回与异常；重要业务边界注释说明原因。
- 临时脚本和验证输出放 .codex-tmp/，日志持续写入 .codex-log/20261117141321_京麦源静态Demo需求与方案.md。
- 当前无 code-index、sequential-thinking、task-manager、Chrome DevTools MCP 和 Browser 插件；使用 rg、结构化分析与任务清单、Playwright 替代，不虚构工具调用。
- 不做 Git commit/push 或外部部署，不执行递归删除；需移除的文件移至当前模块 delete/。
- 当前已交付13个HTML入口、42个SKU、420家客户、241笔订单、100个初始批次；npm run check、npm test，以及31项浏览器检查通过。
- README.md是运行和演示步骤入口；preview/为最终截图；启动演示.cmd优先使用Node，备选Python。
