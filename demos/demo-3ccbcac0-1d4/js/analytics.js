/* 生产统计预留：三个配置缺失、文件直开、本地、测试及预览环境均不加载脚本。 */
(function(){'use strict';const config=window.JMY_ANALYTICS||{scriptUrl:'',websiteId:'',productionDomain:''};const host=location.hostname;
  if(!config.scriptUrl||!config.websiteId||!config.productionDomain||host!==config.productionDomain||location.protocol!=='https:'||host==='localhost'||host==='127.0.0.1'||host.endsWith('.test')||host.endsWith('.localhost'))return;
  const script=document.createElement('script');script.defer=true;script.src=config.scriptUrl;script.dataset.websiteId=config.websiteId;document.head.append(script);
})();
