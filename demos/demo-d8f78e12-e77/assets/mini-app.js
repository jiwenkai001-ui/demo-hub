(function miniApp() {
  const TABLES = ["A01", "A02", "A03", "B01", "B02", "VIP1"];
  const PAYMENT_METHODS = [
    { id: "wechat_pay", name: "微信支付", desc: "推荐微信扫码支付", icon: "🟢" },
    { id: "alipay", name: "支付宝", desc: "支持花呗与余额支付", icon: "🔵" },
    { id: "unionpay", name: "云闪付", desc: "银行卡快捷支付", icon: "🟣" },
    { id: "wechat_balance", name: "微信零钱", desc: "微信余额直接付款", icon: "🟨" },
    { id: "bank_card", name: "银行卡", desc: "储蓄卡/信用卡", icon: "⚪" }
  ];

  const {
    MENU,
    KEYS,
    readJson,
    writeJson,
    addOrder,
    getOrders,
    updateOrderStatus,
    addPrintJobs,
    toPrice,
    now
  } = window.OrderDemoShared;

  const state = {
    user: readJson(KEYS.miniAuth, null),
    cart: {},
    tableNo: "A01",
    activeCategoryId: "all",
    pendingOrder: null,
    lastPaidOrder: null,
    selectedPaymentMethod: PAYMENT_METHODS[0].id,
    scanChannel: "",
    autoLoginTriggered: false
  };

  const loginView = document.getElementById("loginView");
  const appView = document.getElementById("appView");
  const paymentView = document.getElementById("paymentView");
  const phoneInput = document.getElementById("phoneInput");
  const tableSelect = document.getElementById("tableSelect");
  const orderRemark = document.getElementById("orderRemark");
  const paidNotice = document.getElementById("paidNotice");
  const paidSerialNo = document.getElementById("paidSerialNo");
  const paidTableNo = document.getElementById("paidTableNo");
  const paidQueueNo = document.getElementById("paidQueueNo");
  const menuList = document.getElementById("menuList");
  const menuTitle = document.getElementById("menuTitle");
  const cartList = document.getElementById("cartList");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const stickyCartCount = document.getElementById("stickyCartCount");
  const stickyCartTotal = document.getElementById("stickyCartTotal");
  const submitOrderBtn = document.getElementById("submitOrderBtn");
  const tableTag = document.getElementById("tableTag");
  const greetingText = document.getElementById("greetingText");
  const orderResult = document.getElementById("orderResult");
  const categoryTabs = document.getElementById("categoryTabs");
  const paymentOrderInfo = document.getElementById("paymentOrderInfo");
  const paymentMethods = document.getElementById("paymentMethods");
  const overviewTable = document.getElementById("overviewTable");
  const overviewCategoryCount = document.getElementById("overviewCategoryCount");
  const overviewCartCount = document.getElementById("overviewCartCount");
  const overviewCartTotal = document.getElementById("overviewCartTotal");

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function hide() {
      toast.classList.remove("show");
    }, 2200);
  }

  function parseInitialTable() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("table");
    if (fromQuery && TABLES.indexOf(fromQuery) >= 0) {
      return fromQuery;
    }
    return "A01";
  }

  function parseScanChannel() {
    const params = new URLSearchParams(window.location.search);
    const channel = (params.get("channel") || "").toLowerCase();
    if (channel === "wechat") {
      return "微信扫码";
    }
    if (channel === "alipay") {
      return "支付宝扫码";
    }
    return "";
  }

  function shouldAutoLoginFromScan() {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("table"));
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 7) {
      return phone || "";
    }
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  }

  function validatePhone(phone) {
    return /^1\d{10}$/.test(phone);
  }

  function ensureTableOptions() {
    tableSelect.innerHTML = "";
    TABLES.forEach(function (tableNo) {
      const option = document.createElement("option");
      option.value = tableNo;
      option.textContent = tableNo;
      tableSelect.appendChild(option);
    });
  }

  function login(phone) {
    const user = {
      loginType: "wechat_phone",
      phone: phone,
      displayPhone: maskPhone(phone),
      loginAt: new Date().toISOString()
    };
    state.user = user;
    writeJson(KEYS.miniAuth, user);
    render();
    showToast("登录成功，已进入点餐页");
  }

  function logout() {
    localStorage.removeItem(KEYS.miniAuth);
    state.user = null;
    state.cart = {};
    state.pendingOrder = null;
    state.lastPaidOrder = null;
    orderRemark.value = "";
    render();
  }

  function calcCart() {
    const items = [];
    let totalQty = 0;
    let totalAmount = 0;
    Object.keys(state.cart).forEach(function (dishId) {
      const qty = state.cart[dishId];
      if (!qty) {
        return;
      }
      const dish = MENU.find(function (item) {
        return item.id === dishId;
      });
      if (!dish) {
        return;
      }
      totalQty += qty;
      totalAmount += dish.price * qty;
      items.push({
        dishId: dish.id,
        name: dish.name,
        qty: qty,
        price: dish.price,
        subtotal: dish.price * qty
      });
    });
    return { items: items, totalQty: totalQty, totalAmount: totalAmount };
  }

  function getCategories() {
    const categoryMap = {};
    MENU.forEach(function (dish) {
      if (!categoryMap[dish.categoryId]) {
        categoryMap[dish.categoryId] = {
          id: dish.categoryId,
          name: dish.category,
          count: 0
        };
      }
      categoryMap[dish.categoryId].count += 1;
    });
    const categories = Object.keys(categoryMap).map(function (key) {
      return categoryMap[key];
    });
    categories.unshift({ id: "all", name: "全部", count: MENU.length });
    return categories;
  }

  function getCategoryName(categoryId) {
    if (categoryId === "all") {
      return "全部菜单";
    }
    const found = getCategories().find(function (item) {
      return item.id === categoryId;
    });
    return found ? found.name : "菜单";
  }

  function adjustDish(dishId, delta) {
    const current = state.cart[dishId] || 0;
    const next = Math.max(0, current + delta);
    state.cart[dishId] = next;
    renderMenu();
    renderCart();
    renderOverview();
  }

  function renderCategoryTabs() {
    const categories = getCategories();
    categoryTabs.innerHTML = "";
    categories.forEach(function (category) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "category-tab" + (state.activeCategoryId === category.id ? " active" : "");
      tab.setAttribute("data-category", category.id);
      tab.textContent = category.name + " " + category.count;
      categoryTabs.appendChild(tab);
    });
  }

  function renderMenu() {
    const filtered = MENU.filter(function (dish) {
      return state.activeCategoryId === "all" || dish.categoryId === state.activeCategoryId;
    });
    menuTitle.textContent = "菜单 · " + getCategoryName(state.activeCategoryId);
    if (!filtered.length) {
      menuList.innerHTML = '<div class="empty-card">该分类暂无菜品</div>';
      return;
    }
    menuList.innerHTML = "";
    filtered.forEach(function (dish) {
      const qty = state.cart[dish.id] || 0;
      const item = document.createElement("article");
      item.className = "menu-item";
      item.innerHTML =
        '<img class="menu-cover" src="' +
        dish.cover +
        '" alt="' +
        dish.name +
        '">' +
        '<div class="menu-main">' +
        "<h4>" +
        dish.name +
        "</h4>" +
        '<p class="meta">' +
        dish.category +
        " · 月售 " +
        dish.monthlySales +
        "</p>" +
        '<p class="desc">' +
        dish.desc +
        "</p>" +
        '<div class="menu-row">' +
        '<span class="menu-price">¥' +
        toPrice(dish.price) +
        "</span>" +
        '<div class="qty-control">' +
        '<button type="button" data-action="minus" data-dish="' +
        dish.id +
        '">-</button>' +
        "<span>" +
        qty +
        "</span>" +
        '<button type="button" data-action="plus" data-dish="' +
        dish.id +
        '">+</button>' +
        "</div>" +
        "</div>" +
        "</div>";
      menuList.appendChild(item);
    });
  }

  function renderCart() {
    const cart = calcCart();
    cartCount.textContent = String(cart.totalQty);
    cartTotal.textContent = "¥" + toPrice(cart.totalAmount);
    stickyCartCount.textContent = String(cart.totalQty);
    stickyCartTotal.textContent = "¥" + toPrice(cart.totalAmount);
    submitOrderBtn.disabled = cart.totalQty === 0;
    if (!cart.items.length) {
      cartList.innerHTML = '<div class="empty-card">还没有选择菜品，点击菜品卡片中的 + 添加</div>';
      return;
    }
    cartList.innerHTML = "";
    cart.items.forEach(function (item) {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML =
        "<div>" +
        "<strong>" +
        item.name +
        "</strong>" +
        "<p>" +
        item.qty +
        " 份 x ¥" +
        toPrice(item.price) +
        "</p>" +
        "</div>" +
        "<div>¥" +
        toPrice(item.subtotal) +
        "</div>";
      cartList.appendChild(row);
    });
  }

  function renderOverview() {
    const cart = calcCart();
    overviewTable.textContent = state.tableNo;
    overviewCategoryCount.textContent = String(getCategories().length - 1);
    overviewCartCount.textContent = String(cart.totalQty);
    overviewCartTotal.textContent = "¥" + toPrice(cart.totalAmount);
  }

  function renderPaidNotice() {
    if (!state.lastPaidOrder) {
      paidNotice.classList.add("hidden");
      return;
    }
    paidNotice.classList.remove("hidden");
    paidSerialNo.textContent = state.lastPaidOrder.serialNo || "-";
    paidTableNo.textContent = state.lastPaidOrder.tableNo || "-";
    paidQueueNo.textContent = state.lastPaidOrder.queueNo || "-";
  }

  function showAppView() {
    loginView.classList.add("hidden");
    paymentView.classList.add("hidden");
    appView.classList.remove("hidden");
  }

  function showPaymentView() {
    appView.classList.add("hidden");
    paymentView.classList.remove("hidden");
  }

  function renderPaymentInfo() {
    const order = state.pendingOrder;
    if (!order) {
      paymentOrderInfo.innerHTML = '<div class="empty-card">暂无待支付订单</div>';
      return;
    }
    paymentOrderInfo.innerHTML =
      "<p>订单号：<strong>" +
      order.queueNo +
      "</strong></p>" +
      "<p>流水号：<strong>" +
      order.serialNo +
      "</strong></p>" +
      "<p>桌位号：<strong>" +
      order.tableNo +
      "</strong></p>" +
      "<p>应付金额：<strong>¥" +
      toPrice(order.totalAmount) +
      "</strong></p>" +
      "<p>下单时间：" +
      new Date(order.createdAt).toLocaleString("zh-CN") +
      "</p>";
  }

  function renderPaymentMethods() {
    paymentMethods.innerHTML = "";
    PAYMENT_METHODS.forEach(function (method) {
      const label = document.createElement("label");
      label.className = "payment-method";
      label.innerHTML =
        '<input type="radio" name="paymentMethod" value="' +
        method.id +
        '" ' +
        (state.selectedPaymentMethod === method.id ? "checked" : "") +
        ">" +
        "<span>" +
        method.icon +
        "</span>" +
        "<div>" +
        "<strong>" +
        method.name +
        "</strong>" +
        "<span>" +
        method.desc +
        "</span>" +
        "</div>";
      paymentMethods.appendChild(label);
    });
  }

  function submitOrder() {
    const cart = calcCart();
    if (!cart.items.length) {
      showToast("请先添加菜品再提交订单");
      return;
    }
    const tableNo = tableSelect.value;
    const order = addOrder({
      tableNo: tableNo,
      phone: state.user.displayPhone,
      notes: orderRemark.value.trim(),
      items: cart.items,
      totalAmount: Number(cart.totalAmount.toFixed(2)),
      status: "pending_payment",
      paymentMethod: null
    });
    state.pendingOrder = order;
    state.lastPaidOrder = null;
    state.cart = {};
    orderRemark.value = "";
    renderPaidNotice();
    renderCart();
    renderOverview();
    renderMenu();
    renderPaymentInfo();
    renderPaymentMethods();
    showPaymentView();
    showToast("已生成订单，请完成支付");
  }

  function payOrder() {
    if (!state.pendingOrder) {
      showToast("未找到待支付订单");
      return;
    }
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selected) {
      showToast("请选择一种支付方式");
      return;
    }
    const methodId = selected.value;
    state.selectedPaymentMethod = methodId;
    const methodName = PAYMENT_METHODS.find(function (item) {
      return item.id === methodId;
    }).name;

    const payButton = document.getElementById("confirmPayBtn");
    payButton.disabled = true;
    payButton.textContent = "支付处理中...";

    setTimeout(function finishPayment() {
      const updated = updateOrderStatus(state.pendingOrder.id, "paid", {
        paymentMethod: methodName,
        paidAt: now()
      });
      if (!updated) {
        payButton.disabled = false;
        payButton.textContent = "确认支付并完成下单";
        showToast("支付失败，请重试");
        return;
      }
      addPrintJobs(updated);
      state.pendingOrder = null;
      state.lastPaidOrder = updated;
      orderResult.classList.remove("hidden");
      orderResult.innerHTML =
        "<p><strong>支付成功</strong></p>" +
        "<p>支付方式：<strong>" +
        methodName +
        "</strong></p>" +
        "<p>桌号：<strong>" +
        updated.tableNo +
        "</strong></p>" +
        "<p>流水号：<strong>" +
        updated.serialNo +
        "</strong></p>" +
        "<p>已通知收银机与后厨，系统自动出票</p>";
      payButton.disabled = false;
      payButton.textContent = "确认支付并完成下单";
      showAppView();
      renderPaidNotice();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("支付完成，收银端与后厨已收到已付款订单");
    }, 1200);
  }

  function renderTop() {
    const displayPhone = state.user ? state.user.displayPhone : "";
    const channelPrefix = state.scanChannel ? "（" + state.scanChannel + "）" : "";
    greetingText.textContent = "欢迎 " + displayPhone + channelPrefix + "，请选择分类并点餐";
    tableTag.textContent = "当前桌位 " + state.tableNo;
  }

  function render() {
    state.tableNo = parseInitialTable();
    state.scanChannel = parseScanChannel();
    ensureTableOptions();
    tableSelect.value = state.tableNo;
    renderCategoryTabs();
    renderMenu();
    renderCart();
    renderOverview();
    renderPaidNotice();
    renderTop();
    orderResult.classList.add("hidden");

    if (!state.user && shouldAutoLoginFromScan() && !state.autoLoginTriggered) {
      state.autoLoginTriggered = true;
      login("13800138000");
      showToast("已模拟微信授权，直接进入扫码点餐");
      return;
    }

    if (state.user) {
      showAppView();
      phoneInput.value = state.user.phone;
    } else {
      phoneInput.value = "13800138000";
      loginView.classList.remove("hidden");
      appView.classList.add("hidden");
      paymentView.classList.add("hidden");
    }
  }

  document.getElementById("wechatLoginBtn").addEventListener("click", function handleLogin() {
    const phone = phoneInput.value.trim();
    if (!validatePhone(phone)) {
      showToast("请输入 11 位手机号，例如 13800138000");
      return;
    }
    login(phone);
  });

  document.getElementById("miniLogoutBtn").addEventListener("click", function handleLogout() {
    logout();
  });

  submitOrderBtn.addEventListener("click", submitOrder);
  document.getElementById("confirmPayBtn").addEventListener("click", payOrder);

  document.getElementById("switchTableBtn").addEventListener("click", function handleSwitch() {
    tableSelect.focus();
  });

  document.getElementById("backToOrderBtn").addEventListener("click", function onBack() {
    showAppView();
  });

  tableSelect.addEventListener("change", function onTableChange() {
    state.tableNo = tableSelect.value;
    tableTag.textContent = "当前桌位 " + state.tableNo;
    overviewTable.textContent = state.tableNo;
  });

  categoryTabs.addEventListener("click", function onCategoryClick(event) {
    const category = event.target.getAttribute("data-category");
    if (!category) {
      return;
    }
    state.activeCategoryId = category;
    renderCategoryTabs();
    renderMenu();
  });

  menuList.addEventListener("click", function handleMenuClick(event) {
    const action = event.target.getAttribute("data-action");
    const dishId = event.target.getAttribute("data-dish");
    if (!action || !dishId) {
      return;
    }
    adjustDish(dishId, action === "plus" ? 1 : -1);
  });

  render();

  if (window.location.search.indexOf("payOrder=") >= 0) {
    const orderId = new URLSearchParams(window.location.search).get("payOrder");
    const exists = getOrders().find(function (item) {
      return item.id === orderId;
    });
    if (exists && exists.status === "pending_payment") {
      state.pendingOrder = exists;
      renderPaymentInfo();
      renderPaymentMethods();
      showPaymentView();
    }
  }
})();
