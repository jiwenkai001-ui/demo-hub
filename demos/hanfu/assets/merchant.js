(function initMerchantPage() {
  "use strict";

  const api = window.HanfuQueueDemo;
  if (!api) {
    return;
  }

  const currentCall = document.getElementById("currentCall");
  const waitingList = document.getElementById("waitingList");
  const passedList = document.getElementById("passedList");
  const completedList = document.getElementById("completedList");
  const callNextBtn = document.getElementById("callNextBtn");
  const recallBtn = document.getElementById("recallBtn");
  const passBtn = document.getElementById("passBtn");
  const completeBtn = document.getElementById("completeBtn");
  const resetBtn = document.getElementById("resetBtn");

  let latestState = { tickets: [], currentCall: null };

  function t(key, vars) {
    return api.t(key, vars);
  }

  function applyPageTexts() {
    document.title = t("merchant.title");
    renderCurrentCall(latestState);
    renderLists(latestState);
  }

  function toTicketCard(ticket, withAction) {
    const actionButton = withAction
      ? `<button class="btn btn-accent" data-action="recall-specific" data-id="${ticket.id}">${t("merchant.recallTicket")}</button>`
      : "";
    return `<div class="queue-item">
      <p><strong>${ticket.number}</strong> · ${api.getServiceLabel()}</p>
      <p>${t("merchant.ticketTime", { time: api.formatDate(ticket.createdAt) })}</p>
      <p>${t("merchant.ticketPassCount", { count: ticket.passCount || 0 })}</p>
      ${actionButton}
    </div>`;
  }

  function renderCurrentCall(state) {
    const item = state.currentCall;
    if (!item) {
      currentCall.innerHTML = `<p class="muted">${t("merchant.noCurrent")}</p>`;
      return;
    }
    currentCall.innerHTML = `
      <p>${t("merchant.currentNumberLabel")} <strong>${item.number}</strong></p>
      <p>${t("merchant.currentType", { type: api.getServiceLabel() })}</p>
      <p>${t("merchant.currentTime", { time: api.formatDate(item.calledAt) })}</p>
    `;
  }

  function renderLists(state) {
    const waiting = api.filterByStatus(state, "waiting");
    const passed = api.filterByStatus(state, "passed");
    const completed = api.filterByStatus(state, "completed").slice(0, 30);

    waitingList.innerHTML = waiting.length
      ? waiting.map((item) => toTicketCard(item, false)).join("")
      : `<p class="empty">${t("merchant.noWaiting")}</p>`;

    passedList.innerHTML = passed.length
      ? passed.map((item) => toTicketCard(item, true)).join("")
      : `<p class="empty">${t("merchant.noPassed")}</p>`;

    completedList.innerHTML = completed.length
      ? completed.map((item) => toTicketCard(item, false)).join("")
      : `<p class="empty">${t("merchant.noCompleted")}</p>`;
  }

  async function refresh() {
    try {
      latestState = await api.getState();
      renderCurrentCall(latestState);
      renderLists(latestState);
    } catch (error) {
      waitingList.innerHTML = `<p class="empty">${t("merchant.errorRead", { message: error.message })}</p>`;
    }
  }

  async function callNext() {
    await api.postJson("/api/tickets/call-next", { serviceType: api.SERVICE_TYPE });
    await refresh();
  }

  async function recallCurrent() {
    await api.postJson("/api/tickets/recall-current", {});
    await refresh();
  }

  async function passCurrent() {
    await api.postJson("/api/tickets/pass-current", {});
    await refresh();
  }

  async function completeCurrent() {
    await api.postJson("/api/tickets/complete-current", {});
    await refresh();
  }

  async function recallSpecific(ticketId) {
    await api.postJson("/api/tickets/recall-specific", { ticketId });
    await refresh();
  }

  callNextBtn.addEventListener("click", async () => {
    callNextBtn.disabled = true;
    try {
      await callNext();
    } catch (error) {
      alert(t("merchant.errorCall", { message: error.message }));
    } finally {
      callNextBtn.disabled = false;
    }
  });

  recallBtn.addEventListener("click", async () => {
    recallBtn.disabled = true;
    try {
      await recallCurrent();
    } catch (error) {
      alert(t("merchant.errorRecall", { message: error.message }));
    } finally {
      recallBtn.disabled = false;
    }
  });

  passBtn.addEventListener("click", async () => {
    passBtn.disabled = true;
    try {
      await passCurrent();
    } catch (error) {
      alert(t("merchant.errorPass", { message: error.message }));
    } finally {
      passBtn.disabled = false;
    }
  });

  completeBtn.addEventListener("click", async () => {
    completeBtn.disabled = true;
    try {
      await completeCurrent();
    } catch (error) {
      alert(t("merchant.errorComplete", { message: error.message }));
    } finally {
      completeBtn.disabled = false;
    }
  });

  resetBtn.addEventListener("click", async () => {
    const confirmed = confirm(t("merchant.confirmReset"));
    if (!confirmed) {
      return;
    }
    resetBtn.disabled = true;
    try {
      await api.postJson("/api/demo/reset", {});
      await refresh();
    } catch (error) {
      alert(t("merchant.errorReset", { message: error.message }));
    } finally {
      resetBtn.disabled = false;
    }
  });

  passedList.addEventListener("click", async (event) => {
    const target = event.target.closest('[data-action="recall-specific"]');
    if (!target) {
      return;
    }
    target.disabled = true;
    try {
      await recallSpecific(target.dataset.id || "");
    } catch (error) {
      alert(t("merchant.errorRecall", { message: error.message }));
    } finally {
      target.disabled = false;
    }
  });

  if (api.channel) {
    api.channel.addEventListener("message", () => refresh());
  }

  document.addEventListener("hanfu:langchange", () => applyPageTexts());
  applyPageTexts();
  refresh();
  setInterval(refresh, api.POLL_INTERVAL_MS);
})();
