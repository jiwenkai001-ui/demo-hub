(function bootstrapQueueDemo(global) {
  "use strict";

  const POLL_INTERVAL_MS = 1500;
  const CHANNEL = "hanfu_queue_sync_v1";
  const DEFAULT_LANG = "zh";
  const SERVICE_TYPE = "general";
  const SERVICE_PREFIX = "H";

  const channel = "BroadcastChannel" in global ? new BroadcastChannel(CHANNEL) : null;

  function getLang() {
    const value = global.HanfuI18n?.getLang?.();
    return value === "en" ? "en" : DEFAULT_LANG;
  }

  function t(key, vars) {
    if (global.HanfuI18n?.t) {
      return global.HanfuI18n.t(key, vars);
    }
    return key;
  }

  function getServiceLabel() {
    return t("service.general");
  }

  async function getState() {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(t("error.readState"));
    }
    return response.json();
  }

  async function postJson(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || t("error.request"));
    }
    const data = await response.json();
    if (channel) {
      channel.postMessage({ type: "state-updated" });
    }
    return data;
  }

  function formatClock(ts) {
    if (!ts) {
      return "-";
    }
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleTimeString(getLang() === "en" ? "en-US" : "zh-CN", { hour12: false });
  }

  function formatDate(ts) {
    if (!ts) {
      return "-";
    }
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString(getLang() === "en" ? "en-US" : "zh-CN", { hour12: false });
  }

  function queueStats(state) {
    const waiting = (state.tickets || []).filter((item) => item.status === "waiting").length;
    const passed = (state.tickets || []).filter((item) => item.status === "passed").length;
    return { waiting, passed };
  }

  function filterByStatus(state, status) {
    return (state.tickets || []).filter((item) => item.status === status);
  }

  global.HanfuQueueDemo = {
    POLL_INTERVAL_MS,
    channel,
    t,
    getLang,
    getServiceLabel,
    getState,
    postJson,
    formatClock,
    formatDate,
    queueStats,
    filterByStatus,
    SERVICE_TYPE,
    SERVICE_PREFIX,
  };
})(window);
