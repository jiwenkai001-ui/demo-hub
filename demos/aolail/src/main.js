import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import './styles/index.css';
const productionDomain = import.meta.env.VITE_PRODUCTION_DOMAIN;
const umamiScriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL;
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (import.meta.env.PROD && productionDomain && umamiScriptUrl && websiteId && window.location.hostname === productionDomain) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = umamiScriptUrl;
    script.dataset.websiteId = websiteId;
    document.head.appendChild(script);
}
createApp(App).use(createPinia()).use(ElementPlus).mount('#app');
