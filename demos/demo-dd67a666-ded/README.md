# 宠物医院内部管理软件（Pet Hospital Cloud）

围绕宠物医院**诊疗**与**经营**两大场景的一体化管理系统，包含 **Web 管理后台** 与 **客户端小程序 H5** 两端：

| 端 | 地址 | 说明 |
|---|---|---|
| 管理后台 | `http://127.0.0.1:8000/` | 医生 / 医技 / 店长使用的 PC 端工作台 |
| 客户端小程序 | `http://127.0.0.1:8000/mp` | 宠主使用的手机端 H5（模拟微信小程序） |

**零外部依赖**：后端仅用 Python 标准库 `sqlite3` + FastAPI，前端为原生 JS SPA，无 CDN、无构建步骤，克隆即可离线运行。

---

## 一、快速开始

```bash
# 1. 安装依赖（仅 3 个）
pip install fastapi uvicorn pillow

# 2. 一键启动（自动建库 + 灌入演示数据 + 起服务）
./start.sh

# 3. 访问
#    管理后台   http://127.0.0.1:8000/
#    小程序端   http://127.0.0.1:8000/mp
```

重新生成演示数据（会清空重灌）：`python3 backend/seed.py`

> 演示账号：小程序登录页内置 8 个演示宠主，点击即登录；管理后台免登录（admin · 店长）。

---

## 二、五大产品体系

### 1. 电子病历 EMR —— 诊疗流程标准化

- **预约登记 → 到店接诊 → 体征测量 → SOAP 病历 → 处方 → 收费** 全流程数字化
- 预约到店一键接诊，自动生成病历号与就诊记录
- 生命体征九项：体温 / 心率 / 呼吸 / 体重 / CRT / 黏膜 / 疼痛评分 / BCS
- SOAP 四段式病程记录，支持病历模板快填
- 处方开药**自动扣减库存并计入账单**
- 疫苗档案：核苗记录、到期提醒、狂犬疫苗票据号
- 就诊状态机：待接诊 → 诊疗中 → 待缴费 → 已完成

### 2. 化验室系统 LIS —— 设备数据直读

- **支持三种仪器回传协议自动解析**：ASTM E1381、HL7 OBX、JSON
- 粘贴原始报文 → 自动匹配检验项目 → 按参考区间计算标志位（正常 / 偏高 / 偏低 / 危急）
- 设备档案管理：迈瑞五分类血球仪、IDEXX 生化、血气分析仪等（在线 / 离线状态）
- 设备通讯日志全留存，可追溯每次数据接收
- 化验开单自动计费；「设备回传」一键模拟仪器上报全套结果（演示用）
- 危急值自动标红提醒

### 3. 影像管理 —— DR / B 超归档与阅片

- Study / Instance 两级归档（检查 → 序列 → 影像实例），含 DICOM 风格 StudyUID
- 内置**阅片器**：缩放、平移、窗宽窗位调节、反色、重置
- 影像上传（base64，自动读取宽高尺寸）
- 影像登记自动计入就诊账单；检查报告图文编辑

### 4. 经营管理系统 CRM —— 全生命周期 + 精准营销

- **客户 360° 视图**：宠物档案、消费汇总、就诊历史、随访记录
- 会员体系：会员卡开卡 / 充值 / 消费扣余额 / 积分，多等级（普通 / 银卡 / 金卡 / 钻石）
- **精准营销**：按「生命周期阶段 × 消费金额 × 沉默天数」三维圈选人群
  - 例：*幼年期 + 消费 ≥ 500 元 + 90 天未到店* → 批量发券 + 自动生成回访任务
- 营销活动管理、优惠券发放与核销、生日 / 复诊 / 疫苗到期自动提醒
- 科室业绩、医生业绩、营收趋势看板

### 5. 进销存管理 —— 药品耗材采销存一体

- 商品档案：药品 / 耗材 / 疫苗 / 食品，多单位、多仓库
- 批次管理 + **效期预警**（临期 90 天标黄、过期标红）
- 库存双阈值预警：低于安全库存 / 高于最高库存
- 采购流程：采购单 → 收货入库 → 自动生成批次 + 库存流水
- 处方发药、收费退费均自动登记库存流水，账实一致
- 盘点调整、库存流水全程可查

### 6. 收费管理

- 账单自动归集：挂号 / 诊疗 / 化验 / 影像 / 药品 / 耗材
- 支持会员卡扣余额、优惠券、单项优惠、退费
- 营收统计：日营收趋势、科室业绩、支付方式分布

---

## 三、客户端小程序（H5）

以手机版 H5 完整模拟微信小程序体验（390×844 视口、底部 TabBar、底部弹层）：

| 模块 | 功能 |
|---|---|
| 首页 | 会员卡余额 / 积分 / 优惠券 / 累计消费，宠物横滑卡片，健康提醒，即将到来的预约 |
| 预约就诊 | 四步向导：选宠物 → 选医生 → 选就诊类型 → 选时段（含号源状态） |
| 在线问诊 | 会话列表 + 聊天气泡，**关键词智能应答**（呕吐 / 食欲 / 疫苗 / 驱虫 / 皮肤 / 术后等场景） |
| 诊疗记录 | 病历列表 → 详情（生命体征 / SOAP / 处方 / 化验 / 影像） |
| 检验报告 | 报告列表 → 详情（参考区间、异常标记、危急值提示） |
| 影像资料 | DR / B 超缩略图网格 → 阅片 |
| 费用账单 | 账单明细 → **在线支付**（微信支付 / 会员卡余额） |
| 优惠券 / 提醒 | 卡券包、到期排序；疫苗 / 驱虫 / 复诊提醒 |

---

## 四、跨模块联动（开箱即体验的完整业务闭环）

```
小程序预约 ──┬─→ 管理后台接诊 ──→ 自动生成电子病历
             └─→ 到店前自动推送提醒

接诊后开处方 ──→ 自动扣减药品库存（批次先进先出思路）──→ 自动计入就诊账单
开化验单 ────→ 自动计费 ──→ 仪器 ASTM 报文直读 ──→ 结果入库 + 危急值标记
登记影像检查 ──→ 自动计费 ──→ 归档至影像管理
会员卡收费 ──→ 自动扣余额 + 记积分
采购收货 ────→ 自动入库 + 生成批次 + 库存流水
```

---

## 五、目录结构

```
pethospital/
├── start.sh                  # 一键启动（建库 + 种子 + 服务）
├── requirements.txt
├── backend/
│   ├── main.py               # FastAPI 应用入口（92 条路由、三级静态挂载）
│   ├── db.py                 # sqlite3 线程级连接封装（q/q1/val/run/where_clause/page_clause）
│   ├── schema.py             # 31 张表 DDL（六大体系 + 小程序）
│   ├── seed.py               # 演示数据（含 PIL 合成 X 光/B 超影像）
│   ├── helpers.py            # 跨模块联动（计费 / 库存 / 分页）
│   ├── utils.py
│   ├── static/               # 上传影像等静态资源
│   └── routers/
│       ├── emr.py            # 客户/宠物/预约/就诊/体征/SOAP/处方/疫苗/模板
│       ├── lis.py            # 设备/项目/申请单/结果/设备数据直读（ASTM·HL7·JSON）
│       ├── imaging.py        # Study/Instance/上传/报告
│       ├── crm.py            # 客户经营/会员卡/营销/优惠券/回访/精准营销
│       ├── inventory.py      # 商品/批次/采购/入库/盘点/流水
│       ├── billing.py        # 账单/收费/退费/营收统计
│       ├── dashboard.py      # 工作台 KPI 与待办
│       └── portal.py         # 小程序端 25+ 接口（含问诊智能应答）
├── frontend/                 # 管理后台 SPA（原生 JS，零依赖）
│   ├── index.html
│   ├── assets/app.js         # 自研迷你框架：hash 路由 / 表格 / 表单 / 图表 / 模态框
│   ├── assets/app.css        # 完整设计系统
│   └── views/                # dashboard / patients / appointments / visits /
│                             # lis / imaging / crm / inventory / billing / consult
├── client/                   # 客户端小程序 H5
│   ├── index.html            # 手机外壳 + #content + TabBar
│   ├── style.css
│   └── app.js                # 16 个小程序页面 + 预约向导 + 问诊 + 在线支付
├── data/pethospital.db       # SQLite 数据库（自动生成）
├── docs/                     # 系统截图
└── uploads/                  # 影像文件
```

---

## 六、演示数据规模

```
owners 30 · pets 45 · staff 10 · appointments 82 · visits 79
lab_devices 4 · lab_items 12 · lab_orders 43 · lab_results 174
imaging_studies 28 · imaging_instances 67
products 24 · batches 24 · purchase_orders 6 · invoices 79
membership_cards 8 · campaigns 3 · coupons 30 · followups 25
consultations 12 · reminders 40+
```

---

## 七、技术说明

- **数据层**：`sqlite3` 标准库 + `threading.local()` 每线程一连接，WAL 模式，31 张表全外键约束
- **后端**：FastAPI 92 条 REST 接口，Pydantic 模型校验，CORS 全开
- **前端**：原生 JS 自研迷你框架（视图注册 / hash 路由 / 字段驱动表单 / 纯 CSS 图表），图标全部内联 SVG
- **影像**：离线环境用 PIL 合成类 X 光 / B 超灰度图作为演示影像
- **测试**：Playwright 无头浏览器冒烟测试覆盖管理后台 10 个视图 + 小程序 16 个页面，console / pageerror 零报错

## 八、API 一览（部分）

```
POST /api/portal/login                          小程序登录（手机号）
GET  /api/portal/{oid}/overview                 首页概览
POST /api/portal/{oid}/appointments             小程序预约
POST /api/portal/{oid}/consultations            发起问诊
POST /api/portal/consultations/{id}/messages    问诊发言（触发智能应答）
POST /api/portal/{oid}/invoices/{iid}/pay       小程序在线支付

POST /api/emr/appointments/{id}/checkin         预约到店接诊（自动生成病历）
POST /api/lis/device/push                       设备数据直读（ASTM/HL7/JSON）
POST /api/imaging/studies/{id}/instances        影像上传
POST /api/crm/segments                          精准营销人群圈选
POST /api/crm/dispatch                          批量发券 + 生成回访
POST /api/inv/purchase-orders/{id}/receive      采购收货入库
POST /api/bill/invoices/{id}/pay                收费（会员卡自动扣余额）
```

完整接口见各 `backend/routers/*.py` 源码，均带中文注释；交互式文档见启动后的 `http://127.0.0.1:8000/docs`。
