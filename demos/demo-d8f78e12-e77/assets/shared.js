(function attachShared(global) {
  const STORAGE_KEYS = {
    orders: "restaurant_ordering_orders_v1",
    sequence: "restaurant_ordering_sequence_v1",
    miniAuth: "restaurant_ordering_mini_auth_v1",
    cashierAuth: "restaurant_ordering_cashier_auth_v1",
    printJobs: "restaurant_ordering_print_jobs_v1"
  };

  const DEFAULT_MENU = [
    {
      id: "dish-101",
      name: "招牌黑椒牛肉饭",
      price: 29,
      categoryId: "main",
      category: "主食",
      monthlySales: 328,
      desc: "牛肉粒搭配黑椒汁，配时蔬与温泉蛋。",
      cover: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-102",
      name: "藤椒鸡腿饭",
      price: 27,
      categoryId: "main",
      category: "主食",
      monthlySales: 301,
      desc: "鸡腿肉鲜嫩微麻，口味偏川香。",
      cover: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-103",
      name: "老坛酸菜肥牛面",
      price: 25,
      categoryId: "noodle",
      category: "面食",
      monthlySales: 256,
      desc: "酸香开胃，肥牛与汤底浓郁。",
      cover: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-104",
      name: "黄金薯条",
      price: 12,
      categoryId: "snack",
      category: "小吃",
      monthlySales: 188,
      desc: "现炸薯条，外脆内软。",
      cover: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-105",
      name: "香脆鸡米花",
      price: 16,
      categoryId: "snack",
      category: "小吃",
      monthlySales: 211,
      desc: "香辣酥脆，搭配番茄酱。",
      cover: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-106",
      name: "金桔柠檬茶",
      price: 10,
      categoryId: "drink",
      category: "饮品",
      monthlySales: 379,
      desc: "清新解腻，冷热可选。",
      cover: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-107",
      name: "杨枝甘露",
      price: 14,
      categoryId: "dessert",
      category: "甜品",
      monthlySales: 167,
      desc: "芒果西柚椰奶，口感顺滑。",
      cover: "https://images.unsplash.com/photo-1562440499-64c9a111f713?auto=format&fit=crop&w=720&q=80"
    },
    {
      id: "dish-108",
      name: "小菜拼盘",
      price: 18,
      categoryId: "cold",
      category: "凉菜",
      monthlySales: 139,
      desc: "四款当季凉菜组合。",
      cover: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=720&q=80"
    }
  ];

  const channel = "BroadcastChannel" in global ? new BroadcastChannel("restaurant_ordering_sync") : null;
  const syncState = {
    serverAvailable: false,
    pollingStarted: false,
    lastDigest: ""
  };

  function readJson(key, fallback) {
    try {
      const raw = global.localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    global.localStorage.setItem(key, JSON.stringify(value));
  }

  function now() {
    return new Date().toISOString();
  }

  function toPrice(value) {
    return Number(value || 0).toFixed(2);
  }

  function getOrders() {
    return readJson(STORAGE_KEYS.orders, []);
  }

  function setOrders(nextOrders) {
    writeJson(STORAGE_KEYS.orders, nextOrders);
  }

  function getPrintJobs() {
    return readJson(STORAGE_KEYS.printJobs, { cashier: [], kitchen: [] });
  }

  function setPrintJobs(nextJobs) {
    writeJson(STORAGE_KEYS.printJobs, nextJobs);
  }

  function getSequenceState() {
    return readJson(STORAGE_KEYS.sequence, { dateKey: "", counter: 0 });
  }

  function setSequenceState(nextState) {
    writeJson(STORAGE_KEYS.sequence, nextState);
  }

  function nextSerialNo() {
    const today = new Date();
    const dateKey =
      String(today.getFullYear()) +
      String(today.getMonth() + 1).padStart(2, "0") +
      String(today.getDate()).padStart(2, "0");
    const sequenceState = getSequenceState();
    const nextCounter = sequenceState.dateKey === dateKey ? sequenceState.counter + 1 : 1;
    setSequenceState({ dateKey: dateKey, counter: nextCounter });
    return dateKey + String(nextCounter).padStart(4, "0");
  }

  function broadcast(type, payload) {
    if (channel) {
      channel.postMessage({ type: type, payload: payload, at: now() });
    }
    global.dispatchEvent(new CustomEvent("restaurant-order-sync", { detail: { type: type, payload: payload } }));
  }

  function applyServerState(state, eventType) {
    if (!state || typeof state !== "object") {
      return;
    }
    if (Array.isArray(state.orders)) {
      setOrders(state.orders);
    }
    if (state.printJobs && Array.isArray(state.printJobs.cashier) && Array.isArray(state.printJobs.kitchen)) {
      setPrintJobs(state.printJobs);
    }
    if (state.sequence && typeof state.sequence === "object") {
      setSequenceState(state.sequence);
    }
    const digest = JSON.stringify({
      orders: state.orders || [],
      printJobs: state.printJobs || { cashier: [], kitchen: [] },
      sequence: state.sequence || { dateKey: "", counter: 0 }
    });
    syncState.lastDigest = digest;
    broadcast(eventType || "server-synced", state);
  }

  function syncPost(path, payload, eventType) {
    if (!global.fetch) {
      return;
    }
    global
      .fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload || {})
      })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("sync post failed");
        }
        return response.json();
      })
      .then(function (state) {
        syncState.serverAvailable = true;
        applyServerState(state, eventType || "server-synced");
      })
      .catch(function () {
        // Keep silent: static-only mode has no API server.
      });
  }

  function pollServerState() {
    if (!global.fetch) {
      return;
    }
    global
      .fetch("/api/state", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("state poll failed");
        }
        return response.json();
      })
      .then(function (state) {
        syncState.serverAvailable = true;
        const nextDigest = JSON.stringify({
          orders: state.orders || [],
          printJobs: state.printJobs || { cashier: [], kitchen: [] },
          sequence: state.sequence || { dateKey: "", counter: 0 }
        });
        if (nextDigest !== syncState.lastDigest) {
          applyServerState(state, "server-synced");
        }
      })
      .catch(function () {
        // Ignore in static-only mode.
      });
  }

  function startServerPolling() {
    if (syncState.pollingStarted) {
      return;
    }
    syncState.pollingStarted = true;
    pollServerState();
    global.setInterval(pollServerState, 1200);
  }

  function probeServer() {
    if (!global.fetch) {
      return;
    }
    global
      .fetch("/api/health", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("health failed");
        }
        return response.json();
      })
      .then(function () {
        syncState.serverAvailable = true;
        startServerPolling();
      })
      .catch(function () {
        // Ignore: static host without API server.
      });
  }

  function addOrder(orderInput) {
    const serialNo = nextSerialNo();
    const order = {
      id: "odr-" + Math.random().toString(36).slice(2, 11),
      serialNo: serialNo,
      queueNo: "Q" + serialNo.slice(-5),
      tableNo: orderInput.tableNo,
      phone: orderInput.phone,
      notes: orderInput.notes || "",
      items: orderInput.items,
      totalAmount: orderInput.totalAmount,
      status: orderInput.status || "pending_payment",
      paymentMethod: orderInput.paymentMethod || null,
      createdAt: now(),
      paidAt: null
    };
    const nextOrders = [order].concat(getOrders());
    setOrders(nextOrders);
    broadcast("order-created", order);
    syncPost("/api/orders/add", { order: order }, "order-created");
    return order;
  }

  function updateOrderStatus(orderId, status, extras) {
    const patch = extras || {};
    let changedOrder = null;
    const nextOrders = getOrders().map(function (item) {
      if (item.id !== orderId) {
        return item;
      }
      changedOrder = {
        ...item,
        ...patch,
        status: status,
        paidAt: status === "paid" ? patch.paidAt || now() : item.paidAt
      };
      return changedOrder;
    });
    setOrders(nextOrders);
    if (changedOrder) {
      broadcast("order-updated", changedOrder);
      syncPost(
        "/api/orders/update-status",
        {
          orderId: orderId,
          status: status,
          patch: patch
        },
        "order-updated"
      );
    }
    return changedOrder;
  }

  function addPrintJobs(order) {
    const jobs = getPrintJobs();
    const template = {
      orderId: order.id,
      serialNo: order.serialNo,
      tableNo: order.tableNo,
      queueNo: order.queueNo,
      paymentMethod: order.paymentMethod || "未记录",
      paidAt: order.paidAt || now(),
      createdAt: now()
    };
    jobs.cashier.unshift({ ...template, id: "pc-" + Math.random().toString(36).slice(2, 10), printer: "cashier" });
    jobs.kitchen.unshift({ ...template, id: "pk-" + Math.random().toString(36).slice(2, 10), printer: "kitchen" });
    setPrintJobs(jobs);
    broadcast("print-updated", jobs);
    syncPost("/api/print/set", { printJobs: jobs }, "print-updated");
    return jobs;
  }

  function clearDemoData() {
    global.localStorage.removeItem(STORAGE_KEYS.orders);
    global.localStorage.removeItem(STORAGE_KEYS.sequence);
    global.localStorage.removeItem(STORAGE_KEYS.printJobs);
    broadcast("demo-cleared", {});
    syncPost("/api/demo/clear", {}, "demo-cleared");
  }

  function subscribe(handler) {
    function onStorage(event) {
      if (event.key === STORAGE_KEYS.orders || event.key === STORAGE_KEYS.printJobs) {
        handler({ type: "storage-changed", payload: { key: event.key } });
      }
    }
    function onCustom(event) {
      handler(event.detail);
    }
    global.addEventListener("storage", onStorage);
    global.addEventListener("restaurant-order-sync", onCustom);
    if (channel) {
      channel.onmessage = function onChannel(event) {
        handler(event.data);
      };
    }
    return function unsubscribe() {
      global.removeEventListener("storage", onStorage);
      global.removeEventListener("restaurant-order-sync", onCustom);
      if (channel) {
        channel.onmessage = null;
      }
    };
  }

  probeServer();

  global.OrderDemoShared = {
    KEYS: STORAGE_KEYS,
    MENU: DEFAULT_MENU,
    toPrice: toPrice,
    getOrders: getOrders,
    addOrder: addOrder,
    updateOrderStatus: updateOrderStatus,
    getPrintJobs: getPrintJobs,
    addPrintJobs: addPrintJobs,
    setPrintJobs: setPrintJobs,
    clearDemoData: clearDemoData,
    subscribe: subscribe,
    readJson: readJson,
    writeJson: writeJson,
    now: now
  };
})(window);
