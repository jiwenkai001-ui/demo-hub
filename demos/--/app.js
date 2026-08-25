const state = {
  page: "dashboard",
  orderFilter: "all",
  roleIndex: 0,
  paid: false,
  installAssigned: false,
  salesConfirmed: false,
  financeConfirmed: false
};

const roles = ["总经理", "销售", "财务", "库房", "安装"];

const customer = {
  name: "李女士",
  phone: "138****9086",
  source: "小区拓客活动",
  demand: "三室两厅中央空调 + 厨房家电联购",
  budget: "62,800",
  stage: "方案确认",
  owner: "销售 王敏",
  compare: "对比周期 3 天"
};

const retailOrder = {
  no: "LS20260714-018",
  title: "李女士家装中央空调订单",
  amount: "58,600",
  deposit: "10,000",
  products: "中央空调一拖四、厨房烟灶套装",
  warehouse: "厂家云仓开单",
  delivery: "待送货签收",
  installer: "直营安装一组",
  address: "高新区某小区 12-1802"
};

const channelOrders = [
  {
    no: "QD20260714-006",
    dealer: "宝鸡陈仓专卖店",
    type: "向公司采购",
    flow: "纯设备批发",
    amount: "126,400",
    status: "待出库"
  },
  {
    no: "QD20260714-009",
    dealer: "商洛丹凤经销商",
    type: "厂家直下",
    flow: "业绩同步",
    amount: "84,200",
    status: "已汇总"
  },
  {
    no: "QD20260714-012",
    dealer: "宝鸡眉县专卖店",
    type: "向公司采购",
    flow: "批发 + 配套安装",
    amount: "73,600",
    status: "待派工"
  }
];

const app = document.querySelector("#app");
const title = document.querySelector("#screen-title");
const toast = document.querySelector("#toast");

function money(value) {
  return `¥${value}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function paymentStatus() {
  return state.paid ? "已收全款" : "仅收定金";
}

function settlementReady() {
  return state.installAssigned && state.salesConfirmed && state.financeConfirmed;
}

function setPage(page) {
  state.page = page;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.page === page);
  });
  render();
}

function render() {
  const screens = {
    dashboard: ["今日工作台", renderDashboard],
    crm: ["客户 CRM", renderCrm],
    orders: ["订单管控", renderOrders],
    channel: ["渠道分销", renderChannel],
    trace: ["售后追溯", renderTrace]
  };
  const [screenTitle, renderer] = screens[state.page];
  title.textContent = screenTitle;
  app.innerHTML = renderer();
  bindActions();
}

function renderDashboard() {
  const lockNote = state.paid ? "安装流程已解锁" : "未全款，安装流程锁定";
  return `
    <div class="hero-card">
      <div class="hero-top">
        <span class="hero-badge">${roles[state.roleIndex]}视角</span>
        <span class="hero-badge">今日峰值 18 单</span>
      </div>
      <h3>把订单从微信群搬到一条线上</h3>
      <p>销售、财务、库房、安装围绕同一张订单协同，款项、货品、照片、确认记录全部留痕。</p>
    </div>

    <section class="section">
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-label">今日新增订单</div>
          <div class="metric-value">18</div>
          <div class="metric-note">零售 11 / 渠道 7</div>
        </div>
        <div class="metric">
          <div class="metric-label">待处理风险</div>
          <div class="metric-value">3</div>
          <div class="metric-note">${lockNote}</div>
        </div>
        <div class="metric">
          <div class="metric-label">待安装</div>
          <div class="metric-value">${state.paid ? "9" : "8"}</div>
          <div class="metric-note">全款后自动进入派工池</div>
        </div>
        <div class="metric">
          <div class="metric-label">待结算</div>
          <div class="metric-value">${settlementReady() ? "6" : "5"}</div>
          <div class="metric-note">需销售与财务双确认</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h3>关键待办</h3>
        <button class="link-btn" data-page-jump="orders" type="button">查看订单</button>
      </div>
      <div class="todo-list">
        <div class="todo">
          <span class="todo-dot orange"></span>
          <div>
            <div class="todo-title">李女士订单未收全款</div>
            <div class="todo-desc">当前只收定金 ${money(retailOrder.deposit)}，系统禁止发起安装。</div>
          </div>
          <span class="pill orange">风险</span>
        </div>
        <div class="todo">
          <span class="todo-dot"></span>
          <div>
            <div class="todo-title">宝鸡渠道订单待出库</div>
            <div class="todo-desc">纯设备批发无需安装，库房确认后进入送货签收。</div>
          </div>
          <span class="pill blue">库房</span>
        </div>
        <div class="todo">
          <span class="todo-dot green"></span>
          <div>
            <div class="todo-title">安装完工待双确认</div>
            <div class="todo-desc">销售确认现场效果，财务确认收款与结算金额。</div>
          </div>
          <span class="pill green">结算</span>
        </div>
      </div>
    </section>
  `;
}

function renderCrm() {
  return `
    <div class="segmented">
      <button class="active" type="button">跟进中</button>
      <button type="button">已签单</button>
      <button type="button">待回访</button>
    </div>

    <article class="customer-card">
      <div class="card-title-row">
        <div>
          <h4>${customer.name}｜${customer.demand}</h4>
          <div class="subtext">${customer.phone} · ${customer.source}</div>
        </div>
        <span class="status-pill blue">${customer.stage}</span>
      </div>
      <div class="field-list">
        <div class="field-row">
          <span class="field-label">预算报价</span>
          <span class="field-value">${money(customer.budget)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">负责人</span>
          <span class="field-value">${customer.owner}</span>
        </div>
        <div class="field-row">
          <span class="field-label">下一步</span>
          <span class="field-value">客户到店确认合同</span>
        </div>
      </div>
      <div class="progress-track"><div class="progress-bar" style="width: 72%"></div></div>
    </article>

    <section class="section">
      <div class="section-head">
        <h3>跟进记录</h3>
        <button class="link-btn" type="button" data-demo-action="quote">生成报价</button>
      </div>
      <div class="timeline">
        <div class="timeline-item">
          <span class="timeline-dot"></span>
          <div>
            <div class="timeline-title">小区拓客录入线索</div>
            <div class="timeline-desc">客户关注中央空调能耗、安装工期和厨房联购优惠。</div>
          </div>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot"></span>
          <div>
            <div class="timeline-title">销售上传方案报价</div>
            <div class="timeline-desc">方案 A：一拖四；方案 B：一拖五，客户倾向方案 A。</div>
          </div>
        </div>
        <div class="timeline-item">
          <span class="timeline-dot pending"></span>
          <div>
            <div class="timeline-title">待电子合同签署</div>
            <div class="timeline-desc">确认后自动生成订单，并推送财务收款待办。</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderOrders() {
  const lockClass = state.paid ? "green" : "orange";
  const assignDisabled = state.paid ? "" : "disabled";
  const assignedText = state.installAssigned ? "已派直营安装一组" : "待派安装";
  return `
    <div class="segmented">
      <button class="${state.orderFilter === "all" ? "active" : ""}" type="button" data-filter="all">全部</button>
      <button class="${state.orderFilter === "retail" ? "active" : ""}" type="button" data-filter="retail">零售</button>
      <button class="${state.orderFilter === "install" ? "active" : ""}" type="button" data-filter="install">待安装</button>
    </div>

    <article class="order-card">
      <div class="order-title-row">
        <div>
          <h4>${retailOrder.title}</h4>
          <div class="order-meta">${retailOrder.no} · ${retailOrder.address}</div>
        </div>
        <span class="status-pill ${lockClass}">${paymentStatus()}</span>
      </div>

      <div class="field-list">
        <div class="field-row">
          <span class="field-label">订单金额</span>
          <span class="field-value">${money(retailOrder.amount)}</span>
        </div>
        <div class="field-row">
          <span class="field-label">合同签署</span>
          <span class="field-value">客户已电子签</span>
        </div>
        <div class="field-row">
          <span class="field-label">货品状态</span>
          <span class="field-value">${retailOrder.warehouse}，${retailOrder.delivery}</span>
        </div>
        <div class="field-row">
          <span class="field-label">安装状态</span>
          <span class="field-value">${assignedText}</span>
        </div>
      </div>

      <div class="action-row" style="margin-top: 13px;">
        <button class="ghost-btn" type="button" data-demo-action="pay">财务确认全款</button>
        <button class="primary-btn" ${assignDisabled} type="button" data-demo-action="assign">发起安装</button>
      </div>
      ${state.paid ? "" : `<p class="subtext" style="margin: 10px 0 0; color: var(--orange);">锁单规则：未付清全款，不允许进入安装派单。</p>`}
    </article>

    <section class="section">
      <div class="section-head">
        <h3>订单流程</h3>
        <button class="link-btn" data-page-jump="trace" type="button">看追溯</button>
      </div>
      <div class="timeline">
        ${timelineItem("客户签合同", "制式合同已签字，销售和财务可实时查看。", true)}
        ${timelineItem("财务收全款", state.paid ? "已确认全款，安装流程自动解锁。" : "当前仅收定金，系统保持锁单。", state.paid)}
        ${timelineItem("云仓开单/送货", "厂家云仓开单，待客户终端签收。", true)}
        ${timelineItem("安装派工", state.installAssigned ? "直营安装一组已接单。" : "全款确认后才允许派工。", state.installAssigned)}
      </div>
    </section>
  `;
}

function renderChannel() {
  return `
    <div class="hero-card">
      <div class="hero-top">
        <span class="hero-badge">渠道分销</span>
        <span class="hero-badge">宝鸡 / 商洛</span>
      </div>
      <h3>经销商订单统一归集</h3>
      <p>区分公司采购、厂家直下、纯设备批发和带安装订单，业绩、运营费和服务进度统一可看。</p>
    </div>

    <section class="section">
      <div class="metric-grid">
        <div class="metric">
          <div class="metric-label">本月渠道额</div>
          <div class="metric-value">416万</div>
          <div class="metric-note">公司渠道约 40%</div>
        </div>
        <div class="metric">
          <div class="metric-label">待同步厂家单</div>
          <div class="metric-value">12</div>
          <div class="metric-note">用于业绩汇总</div>
        </div>
      </div>
    </section>

    <section class="section stack">
      ${channelOrders.map((item) => `
        <article class="channel-card">
          <div class="card-title-row">
            <div>
              <h4>${item.dealer}</h4>
              <div class="channel-meta">${item.no} · ${item.type}</div>
            </div>
            <span class="status-pill ${item.status === "已汇总" ? "green" : "blue"}">${item.status}</span>
          </div>
          <div class="field-list">
            <div class="field-row">
              <span class="field-label">流程类型</span>
              <span class="field-value">${item.flow}</span>
            </div>
            <div class="field-row">
              <span class="field-label">订单金额</span>
              <span class="field-value">${money(item.amount)}</span>
            </div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderTrace() {
  const settlementText = settlementReady() ? "允许结算安装款" : "等待双确认";
  const settlementClass = settlementReady() ? "green" : "yellow";
  return `
    <article class="order-card">
      <div class="order-title-row">
        <div>
          <h4>${retailOrder.title}</h4>
          <div class="order-meta">售后可按订单查看全流程证据</div>
        </div>
        <span class="status-pill ${settlementClass}">${settlementText}</span>
      </div>

      <div class="photo-grid">
        <div class="photo-tile"><span>安装前现场照片</span></div>
        <div class="photo-tile"><span>安装后完工照片</span></div>
      </div>

      <div class="field-list">
        <div class="field-row">
          <span class="field-label">销售确认</span>
          <span class="field-value">${state.salesConfirmed ? "已确认现场效果" : "待确认"}</span>
        </div>
        <div class="field-row">
          <span class="field-label">财务确认</span>
          <span class="field-value">${state.financeConfirmed ? "已确认结算条件" : "待确认"}</span>
        </div>
      </div>

      <div class="action-row" style="margin-top: 13px;">
        <button class="ghost-btn" type="button" data-demo-action="salesConfirm">销售确认</button>
        <button class="ghost-btn" type="button" data-demo-action="financeConfirm">财务确认</button>
      </div>
    </article>

    <section class="section">
      <div class="section-head">
        <h3>订单留痕</h3>
        <button class="link-btn" type="button" data-demo-action="afterSale">发起售后追溯</button>
      </div>
      <div class="timeline">
        ${timelineItem("CRM 建档", "来源、跟进、报价、负责人完整记录。", true)}
        ${timelineItem("电子合同签署", "客户签字后自动进入财务收款待办。", true)}
        ${timelineItem("收款锁单", state.paid ? "全款已确认，锁单解除。" : "未全款时系统禁止安装。", state.paid)}
        ${timelineItem("安装过程", state.installAssigned ? "师傅上传文字说明和前后照片。" : "待安装派单后上传。", state.installAssigned)}
        ${timelineItem("双确认结算", settlementReady() ? "销售和财务均确认，允许结算。" : "缺少确认时不允许结算。", settlementReady())}
      </div>
    </section>
  `;
}

function timelineItem(title, desc, done) {
  return `
    <div class="timeline-item">
      <span class="timeline-dot ${done ? "" : "pending"}"></span>
      <div>
        <div class="timeline-title">${title}</div>
        <div class="timeline-desc">${desc}</div>
      </div>
    </div>
  `;
}

function bindActions() {
  document.querySelectorAll("[data-page-jump]").forEach((btn) => {
    btn.addEventListener("click", () => setPage(btn.dataset.pageJump));
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.orderFilter = btn.dataset.filter;
      render();
    });
  });

  document.querySelectorAll("[data-demo-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleAction(btn.dataset.demoAction));
  });
}

function handleAction(action) {
  if (action === "pay") {
    state.paid = true;
    showToast("财务已确认全款，安装派单自动解锁。");
    render();
    return;
  }
  if (action === "assign") {
    if (!state.paid) {
      showToast("未付清全款，系统禁止发起安装。");
      return;
    }
    state.installAssigned = true;
    showToast("已派直营安装一组，师傅可上传安装照片。");
    render();
    return;
  }
  if (action === "salesConfirm") {
    state.salesConfirmed = true;
    showToast("销售已确认安装效果。");
    render();
    return;
  }
  if (action === "financeConfirm") {
    state.financeConfirmed = true;
    showToast("财务已确认收款与结算条件。");
    render();
    return;
  }
  if (action === "quote") {
    showToast("已根据客户需求生成中央空调方案报价。");
    return;
  }
  if (action === "afterSale") {
    showToast("售后可查看合同、收款、送货、安装照片和结算记录。");
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setPage(tab.dataset.page));
});

document.querySelector("#role-switch").addEventListener("click", () => {
  state.roleIndex = (state.roleIndex + 1) % roles.length;
  document.querySelector("#role-name").textContent = roles[state.roleIndex];
  showToast(`已切换为${roles[state.roleIndex]}视角。`);
  render();
});

render();
