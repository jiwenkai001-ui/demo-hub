(function cashierApp() {
  const { KEYS, readJson, writeJson, getOrders, getPrintJobs, addPrintJobs, clearDemoData, subscribe, toPrice } =
    window.OrderDemoShared;

  const DEMO_USER = { username: "cashier_demo", password: "Cashier@2026" };
  const state = {
    auth: readJson(KEYS.cashierAuth, null),
    orders: getOrders(),
    printJobs: getPrintJobs()
  };

  const loginView = document.getElementById("cashierLoginView");
  const appView = document.getElementById("cashierAppView");
  const orderList = document.getElementById("orderList");
  const cashierPrintList = document.getElementById("cashierPrintList");
  const kitchenPrintList = document.getElementById("kitchenPrintList");

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function hide() {
      toast.classList.remove("show");
    }, 2400);
  }

  function getStatusText(status) {
    if (status === "paid") {
      return "已支付";
    }
    return "待顾客支付";
  }

  function getStatusClass(status) {
    return status === "paid" ? "tag-success" : "tag-warning";
  }

  function renderOrders() {
    state.orders = getOrders();
    if (!state.orders.length) {
      orderList.innerHTML = '<div class="empty-card">暂无订单，请先在小程序端提交点餐单</div>';
      return;
    }
    orderList.innerHTML = "";
    state.orders.forEach(function (order) {
      const card = document.createElement("article");
      card.className = "order-card";
      const itemsHtml = order.items
        .map(function (item) {
          return "<p>" + item.name + " x " + item.qty + " / ¥" + toPrice(item.subtotal) + "</p>";
        })
        .join("");
      card.innerHTML =
        '<div class="order-head">' +
        "<h4>订单 " +
        order.queueNo +
        "</h4>" +
        '<span class="pill ' +
        getStatusClass(order.status) +
        '">' +
        getStatusText(order.status) +
        "</span>" +
        "</div>" +
        '<div class="order-meta">' +
        "<span>桌号 " +
        order.tableNo +
        "</span>" +
        "<span>流水号 " +
        order.serialNo +
        "</span>" +
        "<span>下单手机号 " +
        order.phone +
        "</span>" +
        "<span>支付方式 " +
        (order.paymentMethod || "未支付") +
        "</span>" +
        "</div>" +
        '<div class="order-items">' +
        itemsHtml +
        "</div>" +
        '<div class="order-foot">' +
        '<span class="order-total">合计 ¥' +
        toPrice(order.totalAmount) +
        "</span>" +
        '<div class="action-row">' +
        '<button type="button" class="btn btn-ghost" data-act="reprint" data-id="' +
        order.id +
        '" ' +
        (order.status === "paid" ? "" : "disabled") +
        ">补打一份</button>" +
        "</div>" +
        "</div>";
      orderList.appendChild(card);
    });
  }

  function createReceiptHtml(job, typeName, order) {
    const lines = order.items
      .map(function (item) {
        return (
          '<div class="line"><span>' +
          item.name +
          " x " +
          item.qty +
          "</span><span>¥" +
          toPrice(item.subtotal) +
          "</span></div>"
        );
      })
      .join("");
    return (
      '<article class="receipt">' +
      "<h4>店内点餐小票（" +
      typeName +
      "）</h4>" +
      '<div class="line"><span>流水号</span><strong>' +
      job.serialNo +
      "</strong></div>" +
      '<div class="line"><span>桌位号</span><strong>' +
      job.tableNo +
      "</strong></div>" +
      '<div class="line"><span>取餐号</span><span>' +
      order.queueNo +
      "</span></div>" +
      '<div class="line"><span>支付方式</span><span>' +
      (job.paymentMethod || "未记录") +
      "</span></div>" +
      '<div class="line"><span>支付时间</span><span>' +
      new Date(job.paidAt || job.createdAt).toLocaleString("zh-CN") +
      "</span></div>" +
      '<div class="split"></div>' +
      lines +
      '<div class="split"></div>' +
      '<div class="line"><strong>合计</strong><strong>¥' +
      toPrice(order.totalAmount) +
      "</strong></div>" +
      '<div class="line"><span>备注</span><span>' +
      (order.notes || "无") +
      "</span></div>" +
      '<p class="stamp">出票状态：已发送到' +
      typeName +
      "（演示模拟）</p>" +
      "</article>"
    );
  }

  function renderPrintJobs() {
    state.printJobs = getPrintJobs();
    renderPrintBlock(cashierPrintList, state.printJobs.cashier, "收银打印机");
    renderPrintBlock(kitchenPrintList, state.printJobs.kitchen, "后厨打印机");
  }

  function renderPrintBlock(container, jobs, typeName) {
    if (!jobs.length) {
      container.innerHTML = '<div class="empty-card">暂无出票记录</div>';
      return;
    }
    container.innerHTML = "";
    jobs.forEach(function (job) {
      const order = state.orders.find(function (item) {
        return item.id === job.orderId;
      });
      if (!order) {
        return;
      }
      const node = document.createElement("div");
      node.innerHTML = createReceiptHtml(job, typeName, order);
      container.appendChild(node.firstChild);
    });
  }

  function ensurePaidOrderPrinted(order) {
    if (order.status !== "paid") {
      return;
    }
    const jobs = getPrintJobs();
    const exists = jobs.cashier.some(function (item) {
      return item.orderId === order.id;
    });
    if (exists) {
      return;
    }
    addPrintJobs(order);
    showToast("订单 " + order.serialNo + " 已付款，收银与后厨已自动出票");
  }

  function login() {
    const user = document.getElementById("cashierUser").value.trim();
    const pass = document.getElementById("cashierPass").value.trim();
    if (user !== DEMO_USER.username || pass !== DEMO_USER.password) {
      showToast("账号或密码错误，请使用登录页演示账号");
      return;
    }
    const auth = { username: user, loginAt: new Date().toISOString() };
    state.auth = auth;
    writeJson(KEYS.cashierAuth, auth);
    render();
  }

  function logout() {
    localStorage.removeItem(KEYS.cashierAuth);
    state.auth = null;
    render();
  }

  function render() {
    if (!state.auth) {
      loginView.classList.remove("hidden");
      appView.classList.add("hidden");
      document.getElementById("cashierUser").value = DEMO_USER.username;
      document.getElementById("cashierPass").value = DEMO_USER.password;
      return;
    }

    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
    renderOrders();
    state.orders.forEach(ensurePaidOrderPrinted);
    renderPrintJobs();
  }

  document.getElementById("cashierLoginBtn").addEventListener("click", login);
  document.getElementById("cashierLogoutBtn").addEventListener("click", logout);

  document.getElementById("clearDataBtn").addEventListener("click", function onClear() {
    if (!window.confirm("确认清空当前演示订单和出票记录？")) {
      return;
    }
    clearDemoData();
    showToast("演示数据已清空");
    render();
  });

  orderList.addEventListener("click", function handleActions(event) {
    const act = event.target.getAttribute("data-act");
    const orderId = event.target.getAttribute("data-id");
    if (!act || !orderId) {
      return;
    }
    if (act === "reprint") {
      const order = state.orders.find(function (item) {
        return item.id === orderId;
      });
      if (!order || order.status !== "paid") {
        showToast("仅已支付订单可补打");
        return;
      }
      addPrintJobs(order);
      showToast("已补打收银联与后厨联");
      render();
    }
  });

  subscribe(function onSync(message) {
    if (!state.auth) {
      return;
    }
    if (
      message.type === "order-created" ||
      message.type === "order-updated" ||
      message.type === "print-updated" ||
      message.type === "server-synced" ||
      message.type === "storage-changed" ||
      message.type === "demo-cleared"
    ) {
      render();
    }
  });

  render();
})();
