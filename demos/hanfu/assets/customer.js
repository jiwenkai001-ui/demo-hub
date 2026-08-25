(function initCustomerPage() {
  "use strict";

  const api = window.HanfuQueueDemo;
  if (!api) {
    return;
  }

  const takeTicketBtn = document.getElementById("takeTicketBtn");
  const queueOverview = document.getElementById("queueOverview");
  const ticketCard = document.getElementById("ticketCard");
  const DEVICE_KEY = "hanfu_queue_device_id";

  let latestState = { tickets: [] };
  let myTicketId = localStorage.getItem("hanfu_queue_my_ticket_id") || "";
  const deviceId = ensureDeviceId();

  function t(key, vars) {
    return api.t(key, vars);
  }

  function ensureDeviceId() {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) {
      return existing;
    }
    const nextId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_KEY, nextId);
    return nextId;
  }

  function applyPageTexts() {
    document.title = t("customer.title");
    renderQueueOverview(latestState);
    renderTicket(latestState);
  }

  function renderQueueOverview(state) {
    const stats = api.queueStats(state);
    const cardList = [
      [t("customer.overviewWaiting"), stats.waiting],
      [t("customer.overviewPassed"), stats.passed],
    ];
    queueOverview.innerHTML = cardList
      .map(([label, value]) => `<div class="queue-item"><p>${label}</p><strong>${value}</strong></div>`)
      .join("");
  }

  function findQueuePosition(tickets, target) {
    const waiting = tickets
      .filter((item) => item.status === "waiting")
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    const idx = waiting.findIndex((item) => item.id === target.id);
    return idx >= 0 ? idx + 1 : 0;
  }

  function renderTicket(state) {
    const myTicket = (state.tickets || []).find((item) => item.id === myTicketId);
    if (!myTicket) {
      ticketCard.innerHTML = `<p class="muted">${t("customer.noTicketLong")}</p>`;
      return;
    }

    const position = findQueuePosition(state.tickets || [], myTicket);
    const statusMap = {
      waiting: t("status.waiting"),
      called: t("status.called"),
      passed: t("status.passed"),
      completed: t("status.completed"),
    };

    ticketCard.innerHTML = `
      <p>${t("customer.ticketNumber")} <strong>${myTicket.number}</strong></p>
      <p>${t("customer.ticketType")} ${api.getServiceLabel()}</p>
      <p>${t("customer.ticketStatus")} ${statusMap[myTicket.status] || myTicket.status}</p>
      <p>${t("customer.ticketAhead")} ${position > 0 ? position - 1 : "-"}</p>
      <p>${t("customer.ticketTime")} ${api.formatDate(myTicket.createdAt)}</p>
    `;
  }

  async function refresh() {
    try {
      latestState = await api.getState();
      renderQueueOverview(latestState);
      renderTicket(latestState);
    } catch (error) {
      queueOverview.innerHTML = `<div class="empty">${t("customer.errorState", { message: error.message })}</div>`;
    }
  }

  async function restoreActiveTicketByDevice() {
    try {
      const response = await fetch(`/api/tickets/by-device?deviceId=${encodeURIComponent(deviceId)}`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const activeTicket = data?.ticket;
      if (activeTicket?.id) {
        myTicketId = activeTicket.id;
        localStorage.setItem("hanfu_queue_my_ticket_id", myTicketId);
      } else {
        myTicketId = "";
        localStorage.removeItem("hanfu_queue_my_ticket_id");
      }
    } catch (_error) {
      // 忽略恢复失败，继续走常规刷新。
    }
  }

  async function takeTicket() {
    takeTicketBtn.disabled = true;
    try {
      const data = await api.postJson("/api/tickets/create", {
        serviceType: api.SERVICE_TYPE,
        deviceId,
      });
      myTicketId = data?.lastCreatedTicketId || "";
      if (myTicketId) {
        localStorage.setItem("hanfu_queue_my_ticket_id", myTicketId);
      }
      latestState = data;
      renderQueueOverview(latestState);
      renderTicket(latestState);
      if (data?.reusedExistingTicket) {
        alert(t("customer.reusedTicketNotice"));
      }
    } catch (error) {
      alert(t("customer.errorTake", { message: error.message }));
    } finally {
      takeTicketBtn.disabled = false;
    }
  }

  takeTicketBtn.addEventListener("click", takeTicket);

  if (api.channel) {
    api.channel.addEventListener("message", () => refresh());
  }

  document.addEventListener("hanfu:langchange", () => applyPageTexts());
  (async () => {
    applyPageTexts();
    await restoreActiveTicketByDevice();
    await refresh();
    setInterval(async () => {
      await restoreActiveTicketByDevice();
      await refresh();
    }, api.POLL_INTERVAL_MS);
  })();
})();
