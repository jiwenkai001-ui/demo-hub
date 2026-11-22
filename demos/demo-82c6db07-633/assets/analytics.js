/* 仅在正式域名且配置完整时注入统计，默认关闭。此处只能填写公开 website id，不能放管理 Token。 */
(function () {
  "use strict";
  const config = { scriptUrl: "", websiteId: "", productionDomain: "" };
  const host = location.hostname;
  if (
    !config.scriptUrl ||
    !config.websiteId ||
    !config.productionDomain ||
    host !== config.productionDomain ||
    ["localhost", "127.0.0.1", "::1"].includes(host) ||
    location.protocol === "file:"
  )
    return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = config.scriptUrl;
  script.dataset.websiteId = config.websiteId;
  document.head.append(script);
})();
