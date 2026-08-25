(function initEntryPage() {
  "use strict";

  const customerQr = document.getElementById("customerQr");
  const customerLink = document.getElementById("customerLink");

  if (!customerQr || !customerLink) {
    return;
  }

  function t(key) {
    return window.HanfuI18n?.t?.(key) || key;
  }

  function getBaseUrl() {
    return `${window.location.protocol}//${window.location.host}`;
  }

  function getQrSrc(targetUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=6&data=${encodeURIComponent(targetUrl)}`;
  }

  function apply() {
    const baseUrl = getBaseUrl();
    const customerUrl = `${baseUrl}/customer.html`;

    customerQr.src = getQrSrc(customerUrl);

    customerQr.alt = t("index.scanCustomer");

    customerLink.href = customerUrl;
    customerLink.textContent = customerUrl;
  }

  document.addEventListener("hanfu:langchange", apply);
  apply();
})();
