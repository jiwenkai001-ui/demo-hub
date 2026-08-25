(function initDisplayPage() {
  "use strict";

  const api = window.HanfuQueueDemo;
  if (!api) {
    return;
  }

  const displayCurrent = document.getElementById("displayCurrent");
  const displayWaiting = document.getElementById("displayWaiting");
  const clockEl = document.getElementById("clock");

  function t(key, vars) {
    return api.t(key, vars);
  }

  function applyPageTexts() {
    document.title = t("display.title");
    renderCurrent({ currentCall: null });
  }

  function renderClock() {
    clockEl.textContent = new Date().toLocaleString(api.getLang() === "en" ? "en-US" : "zh-CN", { hour12: false });
  }

  function renderCurrent(state) {
    const current = state.currentCall;
    if (!current) {
      displayCurrent.innerHTML = `<div class="display-ticket">${t("display.noneCurrent")}</div><p class="display-caption">${t("display.noneHint")}</p>`;
      return;
    }
    displayCurrent.innerHTML = `
      <div class="display-ticket">${current.number}</div>
      <p class="display-caption">${api.getServiceLabel()} · ${t("display.callTime", { time: api.formatClock(current.calledAt) })}</p>
    `;
  }

  function renderQueueList(tickets) {
    displayWaiting.innerHTML = tickets.length
      ? tickets
          .slice(0, 12)
          .map((item) => `<div class="display-list-item"><strong>${item.number}</strong> · ${t("display.waitingTag")}</div>`)
          .join("")
      : `<div class="display-list-item">${t("display.noneWaiting")}</div>`;
  }

  async function refresh() {
    try {
      const state = await api.getState();
      const waiting = api.filterByStatus(state, "waiting");
      renderCurrent(state);
      renderQueueList(waiting);
    } catch (error) {
      displayCurrent.innerHTML = `<div class="display-ticket">${t("display.readFail")}</div><p class="display-caption">${error.message}</p>`;
    }
  }

  if (api.channel) {
    api.channel.addEventListener("message", () => refresh());
  }

  document.addEventListener("hanfu:langchange", () => {
    applyPageTexts();
    renderClock();
    refresh();
  });
  applyPageTexts();
  renderClock();
  setInterval(renderClock, 1000);
  refresh();
  setInterval(refresh, api.POLL_INTERVAL_MS);
})();
