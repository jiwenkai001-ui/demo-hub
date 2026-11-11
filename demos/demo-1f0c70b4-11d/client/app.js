/* 宠物医院客户端小程序（H5）：预约就诊 / 在线问诊 / 诊疗信息 / 诊疗费用 */
(function () {
  'use strict';

  var S = {
    owner: null,
    page: 'home',
    param: null,
    appt: { pet_id: null, doctor_id: null, type: '普通门诊', date: null, slot: null, dirty: false, submitting: false },
    cache: {}, selectedPet: null, inboxFilter: 'all', mediaDrafts: {}, chatDrafts: {}
  };
  var sessionVersion = 0, renderVersion = 0, paying = false, externalPending = false;
  var hospitalBrand = { hospital_name: '宠爱动物医院', phone: '', address: '' }, portalSettings = {};
  async function loadHospitalBrand() {
    var config = await Promise.all([api('/system/settings'),api('/system/portal-settings')]);
    hospitalBrand = config[0]; portalSettings = config[1];
    document.title = hospitalBrand.hospital_name + ' · 客户端';
    document.querySelectorAll('[data-hospital-name]').forEach(function(el){el.textContent=hospitalBrand.hospital_name;});
  }
  function resetSession(owner) {
    sessionVersion++; S.owner = owner; S.page = 'home'; S.param = null; S.selectedPet=null; S.mediaDrafts={}; S.chatDrafts={};
    S.appt = { pet_id: null, doctor_id: null, type: '普通门诊', date: null, slot: null, dirty: false, submitting: false }; S.cache = {};
    document.querySelectorAll('.portal-sheet').forEach(function (el) { if (el.dispose) el.dispose(); el.remove(); });
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) { return Number(v || 0).toFixed(2); }
  function date(v) { return v ? String(v).slice(0, 10) : '-'; }
  function dt(v) { return v ? String(v).slice(5, 16) : '-'; }
  function dtime(v) { return v ? String(v).slice(0, 16) : '-'; }
  function petEmoji(sp) { return icon(sp==='猫'?'cat':sp==='犬'?'dog':'paw'); }
  function statusTag(s) {
    var m = {
      '已完成': 'o', '已结清': 'o', '正常': 'o', '已到店': 'p', '诊疗中': 'w', '待缴费': 'w',
      '部分缴费': 'w', '待到店': 'b', '待处理': 'w', '未使用': 'b', '已使用': 'o',
      '已取消': '', '已过期': '', '待接诊': 'b', '进行中': 'p', '待回复': 'w', '已关闭': '',
      '草稿': '', '院内审核': 'b', '待补件': 'w', '保险审核': 'v', '待赔付': 'p',
      '已赔付': 'o', '已驳回': 'd', '已撤回': '', '可使用':'o', '待付款':'w', '待执行':'w', '待签署':'w', '已签署':'o', '已用完':'b', '已到期':'', '已撤销':''
    };
    return '<span class="tag ' + (m[s] || '') + '">' + esc(s || '-') + '</span>';
  }

  async function api(path, method, body) {
    var version = sessionVersion;
    var response = await window.Demo.request(method || 'GET', '/api' + path, body);
    if (version !== sessionVersion) throw new Error('登录状态已变化，请重新操作');
    return response;
  }

  function oid() { return S.owner.id; }

  function icon(name) {
    var paths={home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',calendar:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2-3v6m10-6v6M3 11h18m-13 4h2m4 0h2m-8 3h2',chat:'M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 1 1 17-5ZM8 10h8m-8 4h5',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',paw:'M8 15c2-4 6-4 8 0 1 1 3 5 0 6-2 1-3-1-4-1s-2 2-4 1c-3-1-1-5 0-6ZM7 8a2 3 0 1 1-4 0 2 3 0 0 1 4 0Zm6-3a2 3 0 1 1-4 0 2 3 0 0 1 4 0Zm6 1a2 3 0 1 1-4 0 2 3 0 0 1 4 0Zm4 5a2 3 0 1 1-4 0 2 3 0 0 1 4 0Z',cat:'m4 10 1-8 6 5h2l6-5 1 8c4 10-3 12-8 12S0 20 4 10Zm4 3h.01M16 13h.01m-6 4 2 1 2-1M2 14l5 1m10 0 5-1',dog:'M6 6 3 4 1 14l5 2m12-10 3-2 2 10-5 2M6 6c4-4 8-4 12 0v10c0 8-12 8-12 0Zm3 6h.01M15 12h.01m-6 4 3 2 3-2m-3 2v3',hospital:'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M9 21v-6h6v6m-3-15v5M9.5 8.5h5',record:'M6 3h12a2 2 0 0 1 2 2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2Zm2 5h8m-8 4h8m-8 4h5',lab:'M9 3h6m-5 0v7l-6 9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2l-6-9V3M7 15h10',image:'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm-1 14 6-6 4 4 3-3 5 5M16 7h.01',shield:'M12 2 3 6v6c0 5 5 8 9 10 4-2 9-5 9-10V6ZM8 12l3 3 5-6',gift:'M3 8h18v5H3Zm2 5v8h14v-8M12 8v13M12 8C2 8 4 0 8 3l4 5Zm0 0c10 0 8-8 4-5Z',pen:'m16 3 5 5-13 13H3v-5Zm-2 2 5 5M3 21l5-5',bell:'M5 17V9a7 7 0 0 1 14 0v8l2 2H3Zm5 5h4',wallet:'M3 6h17v15H3V6Zm0 0V3h14v3m-1 6h5v5h-5Zm2 2.5h.01',card:'M3 4h18v16H3Zm0 5h18M6 16h4',ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Zm12 0v2m0 3v2m0 3v4',arrow:'M4 12h16m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',check:'m5 12 4 4L19 6',phone:'M6 3H3c-1 9 9 19 18 18v-3l-5-3-3 2-6-6 2-3Z',clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v6l4 2',pin:'M19 9c0 5-7 13-7 13S5 14 5 9a7 7 0 1 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',doctor:'M5 3v6a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 11v2a5 5 0 0 0 10 0v-3m2-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',plus:'M12 4v16M4 12h16',video:'M3 5h12v14H3Zm12 5 6-4v12l-6-4',close:'m6 6 12 12M6 18 18 6'};
    return '<svg class="mp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths.paw)+'"/></svg>';
  }
  function petArt(){return '<svg class="pet-art" viewBox="0 0 240 230" fill="none" aria-hidden="true"><circle cx="128" cy="116" r="95" fill="#b1e7dc" opacity=".15"/><circle cx="191" cy="49" r="7" fill="#94d7c7"/><path d="m204 160 13-19m-11 14 13 2m-13-2-2-13" stroke="#92d1c2" stroke-width="3" stroke-linecap="round"/><path d="M40 201c-4-40 8-65 39-65s48 24 44 65" fill="#e6c29d"/><path d="M42 89C18 70 9 107 27 141l25-5m51-47c25-19 34 18 16 52l-25-5" fill="#c39970"/><path d="M40 94c0-38 65-39 65 0v32c0 38-65 38-65 0Z" fill="#f2d6b8"/><path d="M55 111h2m31 0h2" stroke="#233f46" stroke-width="6" stroke-linecap="round"/><ellipse cx="73" cy="127" rx="20" ry="14" fill="#fff1df"/><path d="m67 123 6 5 6-5m-6 6v6" stroke="#233f46" stroke-width="3" stroke-linecap="round"/><path d="M45 155c16 9 37 9 56 0" stroke="#3faaa0" stroke-width="10"/><circle cx="73" cy="160" r="6" fill="#e4bd6b"/><path d="M115 204c-1-35 12-55 42-55s44 20 43 55" fill="#edf2e7"/><path d="m123 92-5-39 31 24h18l30-24-4 41c22 48-6 66-36 66s-59-18-34-68Z" fill="#fff9ea"/><path d="m125 83-2-18 15 15m43 0 12-15-2 18" fill="#edbcb1"/><path d="m134 110 4 0m35 0h4" stroke="#233f46" stroke-width="5" stroke-linecap="round"/><path d="m151 123 6 4 6-4m-6 4v6m-35-12 13 3m44 0 13-3" stroke="#9c8270" stroke-width="2.5" stroke-linecap="round"/><path d="M132 158c13 6 33 6 48 0" stroke="#e1b769" stroke-width="8"/><path d="M26 205h180" stroke="#8ec8bd" stroke-width="3" stroke-linecap="round"/><path d="M187 28v10m-5-5h10M29 43v8m-4-4h8" stroke="#b6e9de" stroke-width="2" stroke-linecap="round"/></svg>';}
  function bindDestinations(){document.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){if(b.dataset.go==='appt'&&S.selectedPet)S.appt.pet_id=S.selectedPet;go(b.dataset.go);};});}
  function polishInterface(root){var symbols={'📅':'calendar','💬':'chat','📋':'record','🧪':'lab','🖼️':'image','💰':'wallet','🛡️':'shield','🎁':'gift','✍️':'pen','🐾':'paw','🔔':'bell','🎫':'ticket','📄':'record','👨‍⚕️':'doctor'};root.querySelectorAll('.empty .em,.claim-empty-icon,.claim-material-icon').forEach(function(el){if(symbols[el.textContent.trim()])el.innerHTML=icon(symbols[el.textContent.trim()]);});root.querySelectorAll('[data-back]:not(button),[data-ap],[data-ad],[data-at],[data-aday],[data-cancel],[data-c],[data-rec],[data-lab],[data-img],[data-bill]').forEach(function(el){if(el.tagName==='BUTTON')return;el.setAttribute('role','button');el.tabIndex=0;el.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};});}
  function requestToken(){return 'MP-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
  function mediaHtml(files){return (files||[]).map(function(f){return '<div class="media-attachment">'+(f.mime.startsWith('image/')?'<button type="button" class="media-image-button" data-media-id="'+f.id+'" aria-label="查看图片 '+esc(f.name)+'"><img src="'+esc(f.data_url)+'" alt="'+esc(f.name)+'"></button>':'<video controls playsinline preload="metadata" src="'+esc(f.data_url)+'" aria-label="'+esc(f.name)+'"></video>')+'<small>'+esc(f.name)+'</small></div>';}).join('');}
  function bindMedia(root,files){root.querySelectorAll('[data-media-id]').forEach(function(b){b.onclick=function(){var file=files.find(function(f){return String(f.id)===b.dataset.mediaId;});if(!file)return;var overlay=document.createElement('div');overlay.className='portal-media-view';overlay.innerHTML='<button class="media-close" aria-label="关闭图片">'+icon('close')+'</button><img src="'+esc(file.data_url)+'" alt="'+esc(file.name)+'"><p>'+esc(file.name)+'</p>';var close=function(){overlay.remove();document.removeEventListener('keydown',key);},key=function(e){if(e.key==='Escape')close();};overlay.onclick=function(e){if(e.target===overlay||e.target.closest('button'))close();};document.addEventListener('keydown',key);document.body.appendChild(overlay);overlay.querySelector('button').focus();};});}
  async function readMedia(files){return Promise.all(Array.from(files).map(function(file){if(!['image/png','image/jpeg','image/webp','video/mp4','video/webm'].includes(file.type))throw new Error('请选择PNG/JPG/WebP图片或MP4/WebM短视频');if(file.size>(file.type.startsWith('video/')?8:3)*1024*1024)throw new Error('图片不超过3MB，短视频不超过8MB');return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve({name:file.name,mime:file.type,size:file.size,data_url:reader.result});};reader.onerror=function(){reject(new Error('文件读取失败，请重新选择'));};reader.readAsDataURL(file);});}));}

  /* ------------------------------------------------------------ 登录 */
  function loginHtml() {
    return '<section class="login-hero"><div class="login-brand">'+icon('hospital')+'<span data-hospital-name>'+esc(hospitalBrand.hospital_name)+'</span><small>宠主服务</small></div><div class="login-art">'+petArt()+'</div><span class="eyebrow">FOR EVERY LITTLE LIFE</span><h1>每一份陪伴<br>都值得专业守护</h1><p>把爱宠的健康，安心交给我们。</p></section><section class="card login-panel"><div class="section-heading"><div><span class="eyebrow">WELCOME BACK</span><h2>欢迎来到爱宠健康中心</h2></div>'+icon('paw')+'</div><div class="fl"><label for="login-phone">建档手机号</label><input id="login-phone" type="tel" maxlength="11" autocomplete="tel" placeholder="请输入11位手机号" inputmode="numeric"></div><button class="btn" id="login">进入我的健康中心 '+icon('arrow')+'</button><button class="btn ghost" id="register">首次来院 · 自助登记</button><details class="demo-accounts"><summary>使用演示账号体验 '+icon('chevron')+'</summary><div id="demos"></div></details><p class="login-note">本地演示体验，未接入短信验证。首次来院请前台核验资料。</p></section><div class="login-footer">'+icon('shield')+' 专业诊疗 · 温暖陪伴 · 全程关怀</div>';
  }

  async function bindLogin() {
    var demos = await api('/portal/demo-accounts');
    var box = document.querySelector('#demos');
    box.innerHTML = demos.items.map(function (o) {
      return '<div class="li" data-phone="' + esc(o.phone) + '" style="border:1px solid var(--line);border-radius:9px;padding:9px 12px;cursor:pointer">' +
        '<div class="grow"><div class="t">' + esc(o.name) + '</div>' +
        '<div class="s">' + esc(o.phone) + ' · ' + esc(o.member_level) + ' · ' + o.pet_count + ' 只宠物</div>' + (o.scenario_label?'<div class="s" style="color:var(--primary);margin-top:4px">'+esc(o.scenario_label)+'</div>':'')+'</div>' +
        '<span class="tag p">选用</span></div>';
    }).join('');
    box.querySelectorAll('[data-phone]').forEach(function (el) {
      el.addEventListener('click', function () {
        document.querySelector('#login-phone').value = el.dataset.phone;
      });
    });
    document.querySelector('#login').addEventListener('click', doLogin);
    document.querySelector('#register').addEventListener('click', registerOwner);
    document.querySelector('#login-phone').addEventListener('keydown', function (event) { if (event.key === 'Enter') doLogin(); });
  }

  async function doLogin() {
    var loginButton = document.querySelector('#login');
    if (!loginButton || loginButton.disabled) return;
    var phone = (document.querySelector('#login-phone').value || '').trim();
    if (!phone) return toast('请输入手机号');
    loginButton.disabled = true;
    try {
      var r = await api('/portal/login', 'POST', { phone: phone });
      resetSession(r.owner);
      try { localStorage.setItem('mp_owner', JSON.stringify(r.owner)); } catch (e) { }
      toast('欢迎回来，' + r.owner.name);
      await render();
    } catch (e) { toast(e.message); } finally { loginButton.disabled = false; }
  }

  /* ------------------------------------------------------------ 底部导航 */
  function renderTabbar() {
    var tabs=[['home','home','首页'],['appt','calendar','预约'],['consult','chat','问诊'],['mine','user','我的']];
    var cur=S.page==='home'?'home':S.page==='appt'?'appt':S.page.indexOf('consult')===0?'consult':'mine';
    document.querySelector('#tabbar').innerHTML=tabs.map(function(t){return '<button type="button" class="tb '+(cur===t[0]?'on':'')+'" data-tab="'+t[0]+'"'+(cur===t[0]?' aria-current="page"':'')+'><span class="em">'+icon(t[1])+'</span><span>'+t[2]+'</span></button>';}).join('');
    document.querySelectorAll('#tabbar .tb').forEach(function(el){el.onclick=function(){go(el.dataset.tab);};});
  }

  /* ------------------------------------------------------------ 页面定义 */
  var PAGES = {};

  PAGES.home = {
    async render(){
      var all=await Promise.all([api('/portal/'+oid()+'/overview'),api('/portal/'+oid()+'/inbox')]),d=all[0],inbox=all[1];S.cache.home=d;S.cache.inbox=inbox;
      var o=d.owner,pet=d.pets.find(function(p){return p.id===S.selectedPet;})||d.pets[0];if(pet)S.selectedPet=pet.id;
      var dueDocs=inbox.items.filter(function(r){return r.source==='document'&&r.content.includes('请阅读');}).length;
      var grid=[['records','record','诊疗记录'],['labs','lab','检验报告'],['imgs','image','影像资料'],['services','gift','服务权益'],['careDocs','pen','医疗文书'],['claims','shield','医疗报销'],['pets','paw','我的宠物'],['reminders','bell','健康提醒']];
      return '<header class="mp-top"><div class="mp-brand">'+icon('hospital')+'<div><span class="eyebrow">PET HEALTH CENTER</span><strong data-hospital-name>'+esc(hospitalBrand.hospital_name)+'</strong></div></div><button class="icon-button" data-go="inbox" aria-label="消息中心">'+icon('bell')+(inbox.unread?'<i class="notification-dot">'+Math.min(inbox.unread,99)+'</i>':'')+'</button></header>'+
      '<section class="welcome-line"><div><span class="nm">你好，'+esc(o.name)+'</span><p>和爱宠一起，开启健康的一天</p></div><span class="quiet-pill">'+esc(o.member_level)+'</span></section>'+
      '<section class="care-hero"><div><span class="eyebrow">CARE WITH LOVE</span><h1>'+esc(portalSettings.hero_title||'每一份陪伴，都值得专业守护')+'</h1><p>'+esc(portalSettings.hero_subtitle||'专业诊疗与日常关怀，就在您身边')+'</p><span class="hero-line">'+icon('check')+' '+esc((portalSettings.service_tags||['专业诊疗','全程关怀']).slice(0,2).join(' · '))+'</span></div>'+petArt()+'</section>'+
      (portalSettings.notice?'<div class="notice-strip">'+icon('bell')+'<span>'+esc(portalSettings.notice)+'</span></div>':'')+
      '<section class="card health-card"><div class="section-heading"><h2>我的爱宠</h2><button class="text-button" data-go="pets">健康档案 '+icon('chevron')+'</button></div>'+(pet?'<div class="pet-switch">'+d.pets.map(function(p){return '<button class="pet-chip '+(p.id===pet.id?'selected':'')+'" data-home-pet="'+p.id+'">'+petEmoji(p.species)+' '+esc(p.name)+'</button>';}).join('')+'</div><div class="health-pet"><div class="health-avatar">'+petEmoji(pet.species)+'</div><div><h3>'+esc(pet.name)+'<span>'+esc(pet.species)+'</span></h3><p>'+esc(pet.breed||'品种待完善')+' · '+(pet.weight?pet.weight+' kg':'体重待记录')+'</p><span class="health-label">'+icon('shield')+' 专属健康档案已建立</span></div></div>':'<p class="hint">来院后由前台为爱宠建立健康档案。</p>')+
      '<div class="primary-services"><button class="primary-service" data-go="appt">'+icon('calendar')+'<span><strong>预约就诊</strong><small>选择医生与到院时间</small></span>'+icon('arrow')+'</button><button class="secondary-service" data-go="consult">'+icon('chat')+'<span><strong>在线问诊</strong><small>随时沟通爱宠情况</small></span></button></div></section>'+
      '<section class="todo-grid"><button data-go="bills">'+icon('wallet')+'<b>'+(d.unpaid_count??d.unpaid.length)+'</b><span>待缴账单</span></button><button data-go="careDocs">'+icon('pen')+'<b>'+dueDocs+'</b><span>待签文书</span></button><button data-go="inbox">'+icon('bell')+'<b>'+inbox.unread+'</b><span>未读消息</span></button></section>'+
      '<section class="card services-card"><div class="section-heading"><h2>健康服务</h2><small>每个阶段，都有我们</small></div><div class="service-grid">'+grid.map(function(g){return '<button data-go="'+g[0]+'"><span>'+icon(g[1])+'</span><b>'+g[2]+'</b></button>';}).join('')+'</div></section>'+
      '<button class="member-banner" data-go="membership"><div>'+icon('card')+'<span><strong>我的电子会员卡</strong><small>可用卡总余额 ¥'+money(d.card_balance)+' · '+o.points+'积分</small></span></div>'+icon('chevron')+'</button>'+
      (d.upcoming.length?'<section class="card"><div class="section-heading"><h2>即将到院</h2><button class="text-button" data-go="appt">全部预约 '+icon('chevron')+'</button></div>'+d.upcoming.slice(0,2).map(function(a){return '<div class="appointment-ticket"><span>'+icon('calendar')+'</span><div><strong>'+esc(a.pet_name)+' · '+esc(a.appt_type)+'</strong><p>'+dtime(a.scheduled_at)+' · '+esc(a.doctor_name||'待分配')+'</p></div>'+statusTag(a.status)+'</div>';}).join('')+'</section>':'')+
      '<section class="card hospital-card"><div class="section-heading"><h2>了解我们的医院</h2>'+icon('hospital')+'</div><p>'+esc(portalSettings.hospital_intro||'用专业守护健康，用温暖陪伴每一次到院。')+'</p><div>'+icon('clock')+' '+esc(portalSettings.opening_hours||'营业时间请咨询医院')+'</div><div>'+icon('pin')+' '+esc(hospitalBrand.address||'来院地址请咨询前台')+'</div>'+(hospitalBrand.phone?'<a class="hospital-phone" href="tel:'+esc(hospitalBrand.phone.replace(/[^+0-9-]/g,''))+'">'+icon('phone')+' '+esc(hospitalBrand.phone)+'</a>':'')+(portalSettings.emergency_phone?'<a class="hospital-phone" style="display:flex" href="tel:'+esc(portalSettings.emergency_phone.replace(/[^+0-9-]/g,''))+'">'+icon('phone')+' 急诊联系 '+esc(portalSettings.emergency_phone)+'</a>':'')+'</section>';
    },
    bind(){bindDestinations();document.querySelectorAll('[data-home-pet]').forEach(function(b){b.onclick=function(){S.selectedPet=Number(b.dataset.homePet);S.appt.pet_id=S.selectedPet;render();};});}
  };

  function appointmentSlotsHtml(day, a, available) {
    return day.slots.length ? day.slots.map(function (s) {
      return `<button type="button" class="slot ${a.slot === s.datetime ? 'on' : ''} ${s.available ? '' : 'off'}"
        data-asl="${s.datetime}" data-av="${s.available}" aria-pressed="${a.slot === s.datetime}" ${s.available && available ? '' : 'disabled'} title="${esc(s.reason || '可预约')}">${s.time}</button>`;
    }).join('') : '<div class="hint">该日期没有剩余可预约时间，请选择其他日期</div>';
  }

  PAGES.appt = {
    async render() {
      var [pets, doctors] = await Promise.all([
        api('/portal/' + oid() + '/pets'),
        api('/portal/doctors')
      ]);
      if (!pets.items.some(function (p) { return p.id === S.appt.pet_id; })) S.appt.pet_id = pets.items.length ? pets.items[0].id : null;
      var slots = await api('/portal/slots?doctor_id=' + (S.appt.doctor_id || '') + '&pet_id=' + (S.appt.pet_id || ''));
      var mine = await api('/portal/' + oid() + '/appointments');
      S.cache.pets = pets.items;
      S.cache.doctors = doctors.items;
      S.cache.slots = slots.items;
      S.cache.myAppt = mine.items;
      var a = S.appt;
      if (!a.pet_id && pets.items.length) a.pet_id = pets.items[0].id;
      if (!slots.items.some(function (d) { return d.date === a.date; }) && slots.items.length) a.date = slots.items[0].date;
      var day = slots.items.find(function (x) { return x.date === a.date; }) || slots.items[0] || { slots: [] };
      if (a.slot && !day.slots.some(function (s) { return s.datetime === a.slot && s.available; })) a.slot = null;
      var TYPES = ['普通门诊', '疫苗', '驱虫', '体检', '绝育', '复诊', '急诊', '洗牙'];

      return `
        <div class="navbar"><div class="title">预约就诊</div></div><div class="page-intro"><span class="eyebrow">BOOK A VISIT</span><h1>提前预约，从容到院</h1><p>选好爱宠、医生和时间，我们在院等您。</p></div>
        <div class="card">
          <div class="card-h"><h3>1. 选择宠物</h3></div>
          <div class="pets">
            ${pets.items.map(function (p) {
              return `<button type="button" class="pet ${a.pet_id === p.id ? 'on' : ''}" data-ap="${p.id}" aria-pressed="${a.pet_id === p.id}">
                <div class="em">${petEmoji(p.species)}</div><div class="n">${esc(p.name)}</div>
                <div class="i">${esc(p.breed || p.species)}</div></button>`;
            }).join('') || '<div class="hint">请先建档宠物</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>2. 选择医生</h3></div>
          <div class="pets">
            ${doctors.items.map(function (d) {
              return `<button type="button" class="pet ${a.doctor_id === d.id ? 'on' : ''}" data-ad="${d.id}" aria-pressed="${a.doctor_id === d.id}">
                <div class="em">${icon('doctor')}</div><div class="n">${esc(d.name)}</div>
                <div class="i">${esc(d.title || '')} ${esc(d.dept || '')}</div></button>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>3. 就诊类型</h3></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${TYPES.map(function (t) {
              return `<button type="button" class="tag ${a.type === t ? 'p' : ''}" data-at="${t}" aria-pressed="${a.type === t}" style="padding:6px 12px;font-size:12.5px">${t}</button>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-h"><h3>4. 选择时间</h3></div>
          <div class="days">
            ${slots.items.map(function (d) {
              return `<button type="button" class="day ${a.date === d.date ? 'on' : ''}" data-aday="${d.date}" aria-pressed="${a.date === d.date}">
                <div class="d">${d.date.slice(5)}</div><div class="w">${d.weekday}</div></button>`;
            }).join('')}
          </div>
          <div class="slots" id="appointment-slots" aria-busy="false">
            ${appointmentSlotsHtml(day, a, true)}
          </div>
          <div class="hint" id="appointment-availability" role="status" aria-live="polite"></div>
          <div class="hint" style="margin-top:10px">灰色时段不可预约，已结合医生班次、请假和宠物已有预约过滤。未选择医生时自动分配当班医生。</div>
        </div>

        <div style="padding:0 12px 8px"><button type="button" class="btn" id="submit" ${a.pet_id && a.slot ? '' : 'disabled'}>提交预约</button></div>

        <div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="grow"><div class="t">我的预约</div></div></div>
          ${mine.items.length ? mine.items.slice(0, 10).map(function (x) {
            return `<div class="li"><div class="grow"><div class="t">${esc(x.pet_name)} · ${esc(x.appt_type)}</div>
              <div class="s">${dtime(x.scheduled_at)} · ${esc(x.doctor_name || '待分配')} · ${esc(x.source)}</div></div>
              <div class="r">${statusTag(x.status)}
                ${x.status === '待到店' ? `<div class="hint" data-cancel="${x.id}" style="color:var(--red);margin-top:4px">取消</div>` : ''}
              </div></div>`;
          }).join('') : '<div class="empty"><span class="em">📅</span>暂无预约</div>'}
        </div>`;
    },
    bind() {
      var a = S.appt, slots = document.querySelector('#appointment-slots'), sub = document.querySelector('#submit');
      var version = renderVersion, session = sessionVersion, request = 0, slotsReady = true;
      function current() { return S.page === 'appt' && S.appt === a && sessionVersion === session && renderVersion === version && slots.isConnected; }
      function sync() {
        if (!current()) return;
        [['data-ap',a.pet_id,'on'],['data-ad',a.doctor_id,'on'],['data-at',a.type,'p'],['data-aday',a.date,'on'],['data-asl',a.slot,'on']].forEach(function (group) {
          document.querySelectorAll('['+group[0]+']').forEach(function (el) {
            var selected = el.getAttribute(group[0]) === String(group[1]);
            el.classList.toggle(group[2], selected); el.setAttribute('aria-pressed', String(selected));
            el.disabled = a.submitting || (group[0] === 'data-asl' && (!slotsReady || el.dataset.av !== 'true'));
          });
        });
        sub.disabled = a.submitting || !slotsReady || !a.pet_id || !a.slot;
      }
      function drawSlots() {
        var day = S.cache.slots.find(function (d) { return d.date === a.date; }) || {slots:[]};
        if (a.slot && !day.slots.some(function (s) { return s.datetime === a.slot && s.available; })) a.slot = null;
        slots.innerHTML = appointmentSlotsHtml(day, a, slotsReady); sync();
      }
      async function refreshSlots() {
        if (!current()) return;
        var latest = ++request; slotsReady = false; slots.setAttribute('aria-busy', 'true');
        var notice = document.querySelector('#appointment-availability'); notice.textContent = '正在更新可预约时段…'; sync();
        try {
          var result = await api('/portal/slots?doctor_id='+(a.doctor_id || '')+'&pet_id='+(a.pet_id || ''));
          if (!current() || latest !== request) return;
          S.cache.slots = result.items;
          if (!result.items.some(function (d) { return d.date === a.date; })) a.date = result.items[0] ? result.items[0].date : null;
          slotsReady = true; notice.textContent = ''; drawSlots();
        } catch (error) {
          if (!current() || latest !== request) return;
          notice.textContent = error.message+' ';
          var retry = document.createElement('button'); retry.type = 'button'; retry.className = 'text-button'; retry.textContent = '重新获取时段';
          retry.onclick = refreshSlots; notice.appendChild(retry); sync();
        } finally { if (current() && latest === request) slots.setAttribute('aria-busy', 'false'); }
      }
      document.querySelectorAll('[data-ap]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (!current() || a.submitting || a.pet_id === Number(el.dataset.ap)) return;
          a.pet_id = Number(el.dataset.ap); S.selectedPet=a.pet_id; a.slot = null; a.dirty = true; refreshSlots();
        });
      });
      document.querySelectorAll('[data-ad]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (!current() || a.submitting) return; var v = Number(el.dataset.ad);
          a.doctor_id = a.doctor_id === v ? null : v;
          a.slot = null; a.dirty = true; refreshSlots();
        });
      });
      document.querySelectorAll('[data-at]').forEach(function (el) {
        el.addEventListener('click', function () { if (!current() || a.submitting) return; a.type = el.dataset.at; a.dirty = true; sync(); });
      });
      document.querySelectorAll('[data-aday]').forEach(function (el) {
        el.addEventListener('click', function () { if (!current() || a.submitting || a.date === el.dataset.aday) return; a.date = el.dataset.aday; a.slot = null; a.dirty = true; drawSlots(); });
      });
      slots.addEventListener('click', function (event) {
        var el = event.target.closest('[data-asl]'); if (!current() || !el || el.disabled || !slotsReady || a.submitting) return;
        if (el.dataset.av !== 'true') return toast('该时段当前不可预约');
        a.slot = el.dataset.asl; a.dirty = true; sync();
      });
      document.querySelectorAll('[data-cancel]').forEach(function (el) {
        el.addEventListener('click', async function (e) {
          e.stopPropagation();
          if (!current()) return;
          if (!confirm('确认取消这个预约？')) return;
          if (el.dataset.busy) return; el.dataset.busy = '1';
          try { await api('/portal/' + oid() + '/appointments/' + el.dataset.cancel + '/cancel', 'PATCH'); toast('预约已取消'); await render(); }
          catch (error) { toast(error.message); } finally { delete el.dataset.busy; }
        });
      });
      if (sub) sub.addEventListener('click', async function () {
        if (!current() || sub.disabled) return;
        if (!a.pet_id) return toast('请选择宠物');
        if (!a.slot) return toast('请选择就诊时间');
        a.submitting = true; sync();
        try {
          await api('/portal/' + oid() + '/appointments', 'POST', {
            pet_id: a.pet_id, doctor_id: a.doctor_id, appt_type: a.type, scheduled_at: a.slot
          });
          toast('预约成功，请按时到院');
          a.slot = null; a.dirty = false; a.submitting = false;
          await render();
        } catch (e) { toast(e.message); a.slot = null; a.submitting = false; await render(); } finally { a.submitting = false; sync(); }
      });
      sync();
    }
  };

  /* ---------------------------------------------------------- 在线问诊 */
  PAGES.consult = {
    async render() {
      var d = await api('/portal/' + oid() + '/consultations');
      return `
        <div class="navbar"><div class="title">在线问诊</div></div>
        <div style="padding:12px"><button class="btn" id="new">＋ 发起新的问诊</button></div>
        <div class="card tight">
          ${d.items.length ? d.items.map(function (c) {
            return `<div class="li" data-c="${c.id}">
              <div style="font-size:22px">💬</div>
              <div class="grow"><div class="t">${esc(c.title || '在线问诊')}</div>
                <div class="s">${esc(c.pet_name || '')} · ${esc(c.doctor_name || '')} ${esc(c.doctor_title || '')}</div>
                <div class="s">${esc((c.last_message || '').slice(0, 30))}${c.last_message && c.last_message.length > 30 ? '…' : ''}</div></div>
              <div class="r">${statusTag(c.status)}<div class="hint">${c.msg_count} 条</div></div></div>`;
          }).join('') : '<div class="empty"><span class="em">💬</span>暂无问诊，点击上方发起</div>'}
        </div>`;
    },
    bind() {
      document.querySelectorAll('[data-c]').forEach(function (el) {
        el.addEventListener('click', function () { go('consultChat', el.dataset.c); });
      });
      document.querySelector('#new').addEventListener('click', async function () {
        var newButton = document.querySelector('#new'); if (newButton.disabled) return; newButton.disabled = true;
        var pets;
        try { pets = await api('/portal/' + oid() + '/pets'); } catch (error) { toast(error.message); return; }
        finally { newButton.disabled = false; }
        if (!pets.items.length) return toast('请先建档宠物');
        var opts = pets.items.map(function (p) {
          return '<option value="' + p.id + '">' + esc(p.name) + '</option>';
        }).join('');
        openSheet('发起在线问诊',
          '<div class="fl"><label>选择宠物</label><select id="sp">' + opts + '</select></div>' +
          '<div class="fl"><label>咨询主题</label><input id="st" maxlength="100" placeholder="如：狗狗今天吐了两次"></div>' +
          '<div class="fl"><label>详细描述 *</label><textarea id="sc" required maxlength="5000" placeholder="描述症状出现的时间、频次、精神食欲等…"></textarea></div>',
          async function () {
            var body = {
              pet_id: Number(document.querySelector('#sp').value),
              title: document.querySelector('#st').value || '在线问诊咨询',
              content: document.querySelector('#sc').value
            };
            var c = await api('/portal/' + oid() + '/consultations', 'POST', body);
            toast('已提交，医生将尽快回复');
            go('consultChat', c.id);
          });
      });
    }
  };

  PAGES.consultChat = {
    async render(id) {
      var d=await api('/portal/'+oid()+'/consultations/'+id+'/messages'),c=d.consultation;S.cache.chat=d;
      return '<div class="navbar"><div class="title">'+esc(c.doctor_name||'在线医生')+'</div><button class="back" data-back aria-label="返回问诊列表">‹</button></div><div class="li" style="background:white"><div class="grow"><div class="t">'+esc(c.title)+'</div><div class="s">'+esc(c.doctor_title||'')+' · '+esc(c.specialty||'线上咨询')+'</div></div>'+statusTag(c.status)+'</div><div class="chat">'+d.items.map(function(m){var me=m.sender_role==='client';return '<div class="msg '+(me?'me':'')+'"><div class="av">'+(me?esc(S.owner.name.slice(0,1)):icon('doctor'))+'</div><div><div class="wn">'+esc(m.sender_name)+' '+dt(m.created_at)+'</div><div class="bb">'+esc(m.content)+mediaHtml(m.attachments)+'</div></div></div>';}).join('')+'</div>'+(c.status==='已关闭'?'<div class="card"><div class="hint">本次问诊已关闭，消息记录已保存。</div><button class="btn ghost" data-consult-new style="margin-top:10px">发起新问诊</button></div>':'<div class="chat-composer"><div id="media-drafts" class="media-drafts"></div><div class="chat-compose-row"><button class="media-pick" id="media-pick" aria-label="添加图片或短视频">'+icon('image')+'</button><input id="media-files" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" multiple hidden><textarea id="txt" maxlength="5000" aria-label="问诊内容" placeholder="描述爱宠的情况…"></textarea><button class="btn sm" id="send">发送</button></div><p class="media-hint">可添加3个附件 · 图片≤3MB / 短视频≤8MB · 线上咨询不能替代到院检查</p></div>');
    },
    bind(id) {
      document.querySelector('[data-back]').onclick=function(){go('consult');};
      bindMedia(document.querySelector('.chat'),S.cache.chat.items.flatMap(function(m){return m.attachments||[];}));
      var fresh=document.querySelector('[data-consult-new]');if(fresh)fresh.onclick=function(){go('consult').then(function(){document.querySelector('#new').click();});};
      var send=document.querySelector('#send');if(!send)return;
      var input=document.querySelector('#txt'),picker=document.querySelector('#media-files'),pick=document.querySelector('#media-pick'),drafts=document.querySelector('#media-drafts'),busy=false,key=requestToken();
      input.value=S.chatDrafts[id]||'';S.mediaDrafts[id]=S.mediaDrafts[id]||[];
      input.oninput=function(){S.chatDrafts[id]=input.value;key=requestToken();};
      function draw(){drafts.innerHTML=S.mediaDrafts[id].map(function(f,i){return '<div class="media-draft">'+(f.mime.startsWith('image/')?'<img src="'+esc(f.data_url)+'" alt="附件预览">':icon('video'))+'<span>'+esc(f.name)+'</span><button data-remove-media="'+i+'" aria-label="移除 '+esc(f.name)+'">'+icon('close')+'</button></div>';}).join('');drafts.querySelectorAll('[data-remove-media]').forEach(function(b){b.onclick=function(){if(busy)return;S.mediaDrafts[id].splice(Number(b.dataset.removeMedia),1);key=requestToken();draw();};});}
      draw();pick.onclick=function(){picker.click();};
      picker.onchange=async function(){if(busy)return;pick.disabled=send.disabled=true;try{var files=await readMedia(picker.files),all=S.mediaDrafts[id].concat(files);if(all.length>3)throw new Error('每条消息最多添加3个附件');if(all.reduce(function(n,f){return n+f.size;},0)>12*1024*1024)throw new Error('附件合计不超过12MB');S.mediaDrafts[id]=all;key=requestToken();draw();}catch(e){toast(e.message);}finally{picker.value='';pick.disabled=send.disabled=false;}};
      send.onclick=async function(){if(busy||send.disabled)return;var content=input.value.trim(),files=S.mediaDrafts[id];if(!content&&!files.length)return toast('请输入内容或添加附件');busy=true;send.disabled=pick.disabled=input.disabled=true;try{await api('/portal/'+oid()+'/consultations/'+id+'/messages','POST',{content:content,attachments:files,request_key:key});delete S.chatDrafts[id];delete S.mediaDrafts[id];if(S.page==='consultChat'&&String(S.param)===String(id))await render();}catch(e){toast(e.message);if(e.message.includes('已关闭'))render();}finally{busy=false;send.disabled=pick.disabled=input.disabled=false;}};
      input.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send.click();}};
    }
  };

  /* ---------------------------------------------------------- 我的 */
  PAGES.mine = {
    async render(){var d=await api('/portal/'+oid()+'/overview'),inbox=await api('/portal/'+oid()+'/inbox');S.owner=d.owner;S.cache.home=d;var o=d.owner;
      var menus=[['pets','paw','我的宠物',d.pet_count+'只爱宠的健康档案'],['records','record','诊疗记录','病历、处方与医嘱'],['labs','lab','检验报告','查看院内检验结果'],['imgs','image','影像资料','影像与报告集中查看'],['bills','wallet','费用账单','查看明细与支付状态'],['claims','shield','医疗报销','材料、进度与赔付记录'],['services','gift','服务权益','套餐、免疫驱虫、积分'],['careDocs','pen','医疗文书','知情同意与签署记录'],['coupons','ticket','我的优惠券',d.coupon_count+'张可用优惠券'],['reminders','bell','健康提醒',d.reminder_count+'项待处理提醒']];
      return '<header class="profile-header"><div class="mp-top"><strong>我的健康中心</strong><button class="icon-button" data-go="inbox" aria-label="消息中心">'+icon('bell')+(inbox.unread?'<i class="notification-dot">'+Math.min(inbox.unread,99)+'</i>':'')+'</button></div><div class="profile-person"><div class="profile-avatar">'+icon('user')+'</div><div><h1 class="nm">'+esc(o.name)+'</h1><p>'+esc(o.phone)+'</p><span>'+esc(o.member_level)+' · '+d.pet_count+'只爱宠</span></div></div></header>'+
      '<button class="member-banner profile-member" data-go="membership"><div>'+icon('card')+'<span><strong>电子会员卡 · 我的钱包</strong><small>可用卡总余额 ¥'+money(d.card_balance)+'</small></span></div>'+icon('chevron')+'</button><section class="profile-stats"><button data-go="services"><b>'+o.points+'</b><span>我的积分</span></button><button data-go="coupons"><b>'+d.coupon_count+'</b><span>优惠券</span></button><button data-go="records"><b>'+o.visit_count+'</b><span>到院记录</span></button></section>'+
      '<section class="card tight profile-menu">'+menus.map(function(m){return '<button class="li" data-go="'+m[0]+'"><span class="menu-symbol">'+icon(m[1])+'</span><span class="grow"><span class="t">'+m[2]+'</span><span class="s">'+esc(m[3])+'</span></span>'+icon('chevron')+'</button>';}).join('')+'</section><div class="logout-wrap"><button class="btn gray" id="logout">退出当前账号</button><p>健康档案与院内记录保持一致</p></div>';},
    bind(){bindDestinations();document.querySelector('#logout').onclick=function(){resetSession(null);try{localStorage.removeItem('mp_owner');}catch(e){}render();};}
  };

  /* ---------------------------------------------------------- 宠物 */
  PAGES.pets = {
    async render() {
      var d = await api('/portal/' + oid() + '/pets');
      var vac = await api('/portal/' + oid() + '/vaccinations');
      return `
        <div class="navbar"><div class="title">我的宠物</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (p) {
          var vs = vac.items.filter(function (v) { return v.pet_id === p.id; });
          return `<div class="card">
            <div class="li" style="padding:0 0 10px;border:none">
              <div style="font-size:34px">${petEmoji(p.species)}</div>
              <div class="grow"><div class="t" style="font-size:15px;font-weight:650">${esc(p.name)}</div>
                <div class="s">${esc(p.species)} · ${esc(p.breed || '')} · ${esc(p.gender || '')}</div></div>
              <span class="tag p">${esc(p.species)}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px">
              <div><span class="hint">生日</span> ${date(p.birth_date)}</div>
              <div><span class="hint">体重</span> ${p.weight ? p.weight + ' kg' : '-'}</div>
              <div><span class="hint">毛色</span> ${esc(p.color || '-')}</div>
              <div><span class="hint">血型</span> ${esc(p.blood_type || '-')}</div>
              <div><span class="hint">芯片</span> ${esc(p.chip_no || '未植入')}</div>
              <div><span class="hint">过敏史</span> ${p.allergies ? esc(p.allergies) : '无'}</div>
            </div>
            ${vs.length ? `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:9px">
              <div class="hint" style="margin-bottom:5px">免疫记录</div>
              ${vs.slice(0, 3).map(function (v) {
                return `<div style="font-size:12.5px;display:flex;justify-content:space-between">
                  <span>${esc(v.name)}</span><span class="hint">${date(v.injected_at)}${v.next_due_at ? ' · 下次 ' + date(v.next_due_at) : ''}</span></div>`;
              }).join('')}</div>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🐾</span>还没有宠物档案</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
    }
  };

  /* ---------------------------------------------------------- 诊疗记录 */
  PAGES.records = {
    async render() {
      var d = await api('/portal/' + oid() + '/records');
      return `
        <div class="navbar"><div class="title">诊疗记录</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (v) {
          return `<div class="card" data-rec="${v.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="tag p">${esc(v.visit_type || '门诊')}</span>
              <span class="hint">${dtime(v.visited_at)}</span>
              <span style="margin-left:auto">${statusTag(v.status)}</span>
            </div>
            <div style="font-size:14.5px;font-weight:600;margin-top:7px">${esc(v.pet_name)} · ${esc(v.diagnosis || v.chief_complaint || '待完善病历')}</div>
            <div class="hint" style="margin-top:3px">${esc(v.dept || '')} · ${esc(v.doctor_name || '')}</div>
            <div class="hint" style="margin-top:6px">主诉：${esc(v.chief_complaint || '-')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">📋</span>暂无诊疗记录</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-rec]').forEach(function (el) {
        el.addEventListener('click', function () { go('recordDetail', el.dataset.rec); });
      });
    }
  };

  PAGES.recordDetail = {
    async render(id) {
      var v = await api('/portal/' + oid() + '/records/' + id);
      var vit = v.vitals;
      return `
        <div class="navbar"><div class="title">病历详情</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:24px">${petEmoji(v.pet ? v.pet.species : '')}</span>
            <div class="grow"><div style="font-size:15px;font-weight:650">${esc(v.pet ? v.pet.name : '')}</div>
              <div class="hint">${esc(v.visit_no)} · ${dtime(v.visited_at)}</div></div>
            ${statusTag(v.status)}
          </div>
          <div class="hint" style="margin-top:8px">接诊医生：${esc(v.doctor ? v.doctor.name + ' ' + (v.doctor.title || '') : '-')} · ${esc(v.dept || '')}</div>
        </div>

        ${(v.specialties||[]).map(function(r){return '<section class="card"><div class="card-h"><h3>'+esc(r.name)+'</h3><span class="tag p">v'+r.version+' · 已完成</span></div>'+r.fields.map(function(f){return '<p class="specialty-field"><strong>'+esc(f.label)+'</strong><span>'+esc(f.value||'未记录')+'</span></p>';}).join('')+'<p class="hint">完成医生 '+esc(r.signer_name||'院内医生')+' · '+dtime(r.signed_at)+'</p></section>';}).join('')}
        ${vit ? `<div class="card">
          <div class="card-h"><h3>生命体征</h3></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
            ${[['体温', vit.temperature + '℃'], ['心率', vit.heart_rate], ['呼吸', vit.resp_rate],
               ['体重', vit.weight + 'kg'], ['CRT', vit.crt + 's'], ['黏膜', vit.mm || '-'],
               ['疼痛', vit.pain_score], ['BCS', vit.bcs]].map(function (x) {
              return `<div style="background:var(--bg);border-radius:8px;padding:7px 2px">
                <div class="hint" style="font-size:10.5px">${x[0]}</div>
                <div style="font-weight:650;font-size:13px">${esc(x[1])}</div></div>`;
            }).join('')}
          </div></div>` : ''}

        <div class="card">
          <div class="card-h"><h3>诊疗内容</h3></div>
          <div style="font-size:13.5px;line-height:1.9">
            <div><span class="hint">主诉：</span>${esc(v.chief_complaint || '-')}</div>
            <div><span class="hint">现病史：</span>${esc(v.present_illness || '-')}</div>
            <div><span class="hint">诊断：</span><b>${esc(v.diagnosis || '-')}</b></div>
            <div><span class="hint">处置：</span>${esc(v.treatment || '-')}</div>
            <div><span class="hint">医嘱：</span>${esc(v.advice || '-')}</div>
          </div>
        </div>

        ${(v.soap || []).length ? `<div class="card">
          <div class="card-h"><h3>病程记录</h3></div>
          ${v.soap.map(function (n) {
            return `<div style="border-left:2px solid var(--p);padding-left:10px;margin-bottom:9px;font-size:13px">
              <div class="hint">${dtime(n.created_at)} ${esc(n.author || '')}</div>
              <div>${esc(n.assessment || n.subjective || '')}</div>
              <div class="hint">${esc(n.plan || '')}</div></div>`;
          }).join('')}</div>` : ''}

        ${(v.prescriptions || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">用药处方</div></div>
          ${v.prescriptions.map(function (p) {
            return `<div class="li"><div class="grow"><div class="t">${esc(p.drug_name)}</div>
              <div class="s">${esc(p.dosage || '')} · ${esc(p.frequency || '')} · ${esc(p.route || '')} · ${p.days} 天</div></div>
              <div class="r"><div>${p.qty} ${esc(p.unit)}</div></div></div>`;
          }).join('')}</div>` : ''}

        ${(v.lab_orders || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">化验检查</div></div>
          ${v.lab_orders.map(function (l) {
            return `<div class="li" data-lab="${l.id}"><div class="grow"><div class="t">${esc(l.panel)}</div>
              <div class="s">${esc(l.order_no)} · ${esc(l.device_name || '')}</div></div>
              <div class="r">${statusTag(l.status)}<div class="hint">查看 ›</div></div></div>`;
          }).join('')}</div>` : ''}

        ${(v.imaging || []).length ? `<div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">影像检查</div></div>
          ${v.imaging.map(function (s) {
            return `<div class="li" data-img="${s.id}"><div class="grow"><div class="t">${esc(s.modality)} · ${esc(s.body_part)}</div>
              <div class="s">${s.image_count} 幅 · ${esc(s.impression || '待出报告')}</div></div>
              <div class="r"><div class="hint">查看 ›</div></div></div>`;
          }).join('')}</div>` : ''}

        ${v.invoice ? `<div class="card">
          <div class="card-h"><h3>本次费用</h3><span class="more" data-bill="${v.invoice.id}">明细 ›</span></div>
          <div style="display:flex;align-items:baseline;gap:10px">
            <span class="money" style="font-size:22px">¥${money(v.invoice.payable)}</span>
            ${statusTag(v.invoice.status)}
          </div></div>` : ''}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('records'); });
      document.querySelectorAll('[data-lab]').forEach(function (el) {
        el.addEventListener('click', function () { go('labDetail', el.dataset.lab); });
      });
      document.querySelectorAll('[data-img]').forEach(function (el) {
        el.addEventListener('click', function () { go('imgDetail', el.dataset.img); });
      });
      document.querySelectorAll('[data-bill]').forEach(function (el) {
        el.addEventListener('click', function () { go('billDetail', el.dataset.bill); });
      });
    }
  };

  /* ---------------------------------------------------------- 检验报告 */
  PAGES.labs = {
    async render() {
      var d = await api('/portal/' + oid() + '/labs');
      return `
        <div class="navbar"><div class="title">检验报告</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (l) {
          return `<div class="card" data-lab="${l.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(l.panel)}检查</div>
                <div class="hint">${esc(l.pet_name || '')} · ${dtime(l.ordered_at)}</div></div>
              ${statusTag(l.status)}</div>
            <div class="hint" style="margin-top:6px">${esc(l.order_no)} · ${esc(l.device_name || '')} · ${esc(l.sample_type || '')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🧪</span>暂无检验报告</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-lab]').forEach(function (el) {
        el.addEventListener('click', function () { go('labDetail', el.dataset.lab); });
      });
    }
  };

  PAGES.labDetail = {
    async render(id) {
      var o = await api('/portal/' + oid() + '/labs/' + id);
      return `
        <div class="navbar"><div class="title">${esc(o.panel)}检查报告</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="font-size:14.5px;font-weight:600">${esc(o.pet ? o.pet.name : '')} · ${esc(o.panel)}</div>
          <div class="hint">${esc(o.order_no)} · 报告时间 ${dtime(o.reported_at)}</div>
          <div class="hint">检验设备：${esc(o.device_name || '-')} · 样本：${esc(o.sample_type || '-')}</div>
        </div>
        ${(o.abnormal || []).length ? `<div class="card">
          <div class="card-h"><h3 style="color:var(--red)">⚠️ 异常提示 ${o.abnormal.length} 项</h3></div>
          ${o.abnormal.map(function (r) {
            return `<div class="res ab"><div><div class="n">${esc(r.item_name)}</div>
              <div class="hint">参考 ${esc(r.ref_text || '-')}</div></div>
              <div style="text-align:right"><div class="v" style="color:var(--red)">${esc(r.value)} ${esc(r.unit || '')}</div>
              <span class="tag d">${esc(r.flag)}</span></div></div>`;
          }).join('')}</div>` : ''}
        <div class="card">
          <div class="card-h"><h3>检验结果（${o.results.length} 项）</h3></div>
          ${o.results.map(function (r) {
            return `<div class="res ${r.flag !== '正常' ? 'ab' : ''}">
              <div><div class="n">${esc(r.item_name)}</div><div class="hint">参考 ${esc(r.ref_text || '-')}</div></div>
              <div style="text-align:right"><div class="v">${esc(r.value)} <span class="hint">${esc(r.unit || '')}</span></div>
                ${r.flag === '正常' ? '<span class="tag o">正常</span>' : '<span class="tag d">' + esc(r.flag) + '</span>'}</div></div>`;
          }).join('') || '<div class="empty">暂无结果</div>'}
        </div>
        <div class="hint" style="padding:12px;text-align:center">结果仅供临床参考，具体请咨询接诊医生</div>`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('labs'); });
    }
  };

  /* ---------------------------------------------------------- 影像 */
  PAGES.imgs = {
    async render() {
      var d = await api('/portal/' + oid() + '/imaging');
      return `
        <div class="navbar"><div class="title">影像资料</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (s) {
          return `<div class="card" data-img="${s.id}" style="margin:10px 12px">
            ${s.cover_url ? `<img src="${s.cover_url}" style="width:100%;height:150px;object-fit:cover;border-radius:9px;background:#000">` : ''}
            <div style="display:flex;align-items:center;margin-top:8px">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(s.modality)} · ${esc(s.body_part)}</div>
                <div class="hint">${esc(s.pet_name || '')} · ${s.image_count} 幅 · ${dtime(s.performed_at)}</div></div>
              ${statusTag(s.status)}</div>
            <div class="hint" style="margin-top:5px">${esc(s.impression || '待出报告')}</div>
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🖼️</span>暂无影像资料</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-img]').forEach(function (el) {
        el.addEventListener('click', function () { go('imgDetail', el.dataset.img); });
      });
    }
  };

  PAGES.imgDetail = {
    async render(id) {
      var s = await api('/portal/' + oid() + '/imaging/' + id);
      return `
        <div class="navbar"><div class="title">${esc(s.modality)} · ${esc(s.body_part)}</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="font-size:14.5px;font-weight:600">${esc(s.pet ? s.pet.name : '')} · ${esc(s.modality)}检查</div>
          <div class="hint">检查时间 ${dtime(s.performed_at)} · 技师 ${esc(s.performed_by || '-')}</div>
        </div>
        ${s.instances.map(function (i) {
          return `<div style="margin:0 12px 10px;background:#000;border-radius:10px;overflow:hidden">
            <img src="${i.url}" style="width:100%;display:block">
            <div style="color:#fff;font-size:11.5px;padding:6px 10px;background:rgba(0,0,0,.6)">
              #${i.instance_no} ${esc(i.note || '')} · ${i.width}×${i.height}</div></div>`;
        }).join('')}
        <div class="card">
          <div class="card-h"><h3>影像报告</h3></div>
          <div style="font-size:13.5px;line-height:1.8">
            <div><span class="hint">影像所见：</span>${esc(s.findings || '待填写')}</div>
            <div><span class="hint">影像诊断：</span><b>${esc(s.impression || '待填写')}</b></div>
          </div>
        </div>`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('imgs'); });
    }
  };

  /* ---------------------------------------------------------- 费用 */
  PAGES.bills = {
    async render() {
      var d = await api('/portal/' + oid() + '/invoices');
      return `
        <div class="navbar"><div class="title">费用账单</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (i) {
          return `<div class="card" data-bill="${i.id}" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14.5px;font-weight:600">${esc(i.pet_name || '')} · ${dtime(i.created_at)}</div>
                <div class="hint">${esc(i.invoice_no)} · ${esc(i.pay_method || '未支付')}</div></div>
              <div style="text-align:right"><div class="money" style="font-size:17px">¥${money(i.payable)}</div>
                ${statusTag(i.status)}</div>
            </div>
            ${['待缴费', '部分缴费'].includes(i.status) ? `<button class="btn sm" data-pay-detail="${i.id}" style="margin-top:9px;width:100%">查看并支付 ¥${money(Number(i.payable) - Number(i.paid_amount))}</button>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">💰</span>暂无账单</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-bill]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('[data-pay-detail]')) return;
          go('billDetail', el.dataset.bill);
        });
      });
      document.querySelectorAll('[data-pay-detail]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          go('billDetail', el.dataset.payDetail);
        });
      });
    }
  };

  PAGES.billDetail = {
    async render(id) {
      var i = await api('/portal/' + oid() + '/invoices/' + id);
      var extras = await Promise.all([api('/portal/' + oid() + '/coupons'), api('/portal/' + oid() + '/overview')]);
      var canPay = ['待缴费', '部分缴费'].includes(i.status), cards = extras[1].cards || [], card = cards.find(function(c){return c.status==='正常'&&(!c.valid_until||c.valid_until>=Demo.date())&&c.balance>=Number(i.payable)-Number(i.paid_amount);}) || extras[1].card;
      var coupons = extras[0].items.filter(function (c) { return c.status === '未使用' && date(c.expire_at) >= Demo.date() && Number(c.min_spend) <= Number(i.total_amount); });
      if (Number(i.paid_amount) > 0 || Number(i.discount) > 0) coupons = [];
      S.cache.bill = { invoice: i, coupons: coupons, card: card, cards: cards };
      return `
        <div class="navbar"><div class="title">账单明细</div><div class="back" data-back>‹</div></div>
        <div class="card">
          <div style="text-align:center;padding:6px 0">
            <div class="hint">应付金额</div>
            <div class="money" style="font-size:30px">¥${money(i.payable)}</div>
            <div style="margin-top:5px">${statusTag(i.status)}</div>
          </div>
          <div class="hint" style="text-align:center;margin-top:6px">
            ${esc(i.invoice_no)} · ${esc(i.pet ? i.pet.name : '')} · ${dtime(i.created_at)}</div>
        </div>
        <div class="card tight">
          <div class="li" style="border-bottom:1px solid var(--line)"><div class="t">费用明细</div></div>
          ${i.items.map(function (t) {
            return `<div class="li"><span class="tag ${t.item_type === '药品' ? 'p' : (t.item_type === '检验' ? 'b' : '')}">${esc(t.item_type)}</span>
              <div class="grow"><div class="t">${esc(t.name)}</div><div class="s">${t.qty} × ¥${money(t.unit_price)}</div></div>
              <div>¥${money(t.amount)}</div></div>`;
          }).join('')}
          <div class="li">
            <div class="grow"><div class="s">合计 ¥${money(i.total_amount)}</div>
              <div class="s">优惠 -¥${money(i.discount)}</div></div>
            <div class="money">应付 ¥${money(i.payable)}</div></div>
        </div>
        <div class="card"><div class="li"><span class="grow">已支付</span><strong>¥${money(i.paid_amount)}</strong></div><div class="li"><span class="grow">剩余待付</span><strong class="money" id="bill-remaining">¥${money(Math.max(0, Number(i.payable) - Number(i.paid_amount)))}</strong></div></div>
        ${i.status === '已结清' && Number(i.paid_amount) > 0 ? '<div class="card claim-bill-entry"><strong>🛡️ 医疗报销</strong><p class="hint">已支付医疗账单可由院内协助整理报销材料，查看本账单的案件进度。</p><button class="btn ghost" id="bill-claims">查看报销进度</button></div>' : ''}
        ${canPay ? `<div class="card"><div class="fl"><label for="bill-coupon">可用优惠券</label><select id="bill-coupon"><option value="">不使用优惠券</option>${coupons.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + ' · ' + (c.coupon_type === '折扣' ? money(Number(c.value) * 10) + '折' : '减¥' + money(c.value)) + '</option>'; }).join('')}</select><div class="hint">${coupons.length ? '每单限一张，支付完成后核销；最终金额以账单结算为准。' : Number(i.paid_amount) > 0 || Number(i.discount) > 0 ? '该账单已有收款或优惠，不能叠加使用优惠券。' : '暂无满足门槛且有效的优惠券。'}</div></div>${memberCardSelect(cards,card)}<div class="hint" id="bill-card-hint">会员卡余额 ¥${money(card ? card.balance : 0)}</div></div><div style="padding:0 12px 12px">
          <button class="btn" data-pay="${i.id}">微信支付</button>
          <button class="btn ghost" data-pay2="${i.id}" style="margin-top:9px">会员卡支付</button></div>` : ''}`;
    },
    bind(id) {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('bills'); });
      var claims = document.querySelector('#bill-claims');
      if (claims) claims.addEventListener('click', function () { go('claims', String(id)); });
      document.querySelectorAll('[data-pay]').forEach(function (el) {
        el.addEventListener('click', function () { payBill(el.dataset.pay, '微信'); });
      });
      document.querySelectorAll('[data-pay2]').forEach(function (el) {
        el.addEventListener('click', function () { payBill(el.dataset.pay2, '会员卡'); });
      });
      var select = document.querySelector('#bill-coupon');
      if (select) { select.addEventListener('change', updatePaymentPreview); updatePaymentPreview(); }
      var cardSelect=document.querySelector('#bill-card');if(cardSelect)cardSelect.addEventListener('change',function(){S.cache.bill.card=S.cache.bill.cards.find(function(c){return c.id===Number(cardSelect.value);});updatePaymentPreview();});
    }
  };

  /* ---------------------------------------------------------- 医疗报销：院内协助，客户只读 */
  function claimNotice() {
    return '<div class="claim-demo-note">本地演示 · 院内协助整理材料，保险审核和到账均为模拟；尚未连接保险公司，不产生真实申请或款项。</div>';
  }
  function claimAmount(value, pending) { return pending || value === null || value === undefined ? '待核定' : '¥' + money(value); }
  function claimStage(status) {
    var active = { '草稿': 0, '院内审核': 1, '待补件': 1, '保险审核': 2, '待赔付': 3, '已赔付': 4 }[status];
    var stopped = status === '已驳回' || status === '已撤回';
    return '<ol class="claim-stages" aria-label="报销办理阶段">' + ['材料整理', '院内审核', '模拟保险审核', '模拟赔付'].map(function (name, index) {
      return '<li class="' + (!stopped && index < active ? 'done' : !stopped && index === active ? 'current' : '') + '"><span>' + (index + 1) + '</span>' + name + '</li>';
    }).join('') + '</ol>';
  }
  PAGES.claims = {
    async render(invoiceId) {
      var filter = /^\d+$/.test(String(invoiceId || '')) ? Number(invoiceId) : null;
      S.cache.claimsInvoice = filter;
      var d = await api('/portal/' + oid() + '/claims' + (filter ? '?invoice_id=' + filter : ''));
      var rows = d.items.filter(function (c) { return !filter || Number(c.invoice_id) === filter; }).sort(function (a, b) { return String(b.updated_at || '').localeCompare(String(a.updated_at || '')) || b.id - a.id; });
      return '<div class="navbar"><div class="title">医疗报销</div><button class="back" type="button" data-back aria-label="返回">‹</button></div>' + claimNotice() +
        (filter ? '<div class="claim-filter"><span>仅查看当前账单关联案件</span><button class="btn sm gray" id="claim-all">查看全部</button></div>' : '') +
        (rows.length ? '<div class="claim-list">' + rows.map(function (c) {
          var approved = ['待赔付', '已赔付'].includes(c.status), paid = Number(c.paid_amount || c.payout_amount || 0);
          return '<button type="button" class="card claim-card" data-claim="' + c.id + '"><div class="claim-card-head"><strong>' + esc(c.pet_name || '宠物') + '</strong>' + statusTag(c.status) + '</div><div class="hint claim-number">' + esc(c.claim_no) + '</div><div class="claim-insurer">' + esc(c.insurer || '保险信息待核对') + '</div><div class="hint">' + esc(c.plan_name || '') + '</div><div class="claim-card-foot"><div><span class="hint">' + (c.status === '已赔付' ? '模拟净到账' : approved ? '模拟核定' : '当前预估') + '</span><strong>' + claimAmount(c.status === '已赔付' ? paid : approved ? c.approved_amount : c.estimated_amount, false) + '</strong></div><span class="hint">更新 ' + dtime(c.updated_at || c.created_at) + ' ›</span></div></button>';
        }).join('') + '</div>' : '<div class="card claim-empty"><div class="claim-empty-icon">🛡️</div><h3>' + (filter ? '本账单暂无报销案件' : '暂无医疗报销案件') + '</h3><p>请联系院内前台，协助核对保单与已结清医疗账单后建立案件。</p><strong>办理前可准备</strong><ul><li>宠物身份及有效保单资料</li><li>病历诊断、费用清单与付款凭证</li><li>相关检验、影像报告及收款账户</li></ul><p class="hint">材料要求、保障责任和赔付金额以实际保险合同及承保公司审核为准。</p></div>');
    },
    bind() {
      document.querySelector('[data-back]').addEventListener('click', function () { S.cache.claimsInvoice ? go('billDetail', S.cache.claimsInvoice) : go('mine'); });
      var all = document.querySelector('#claim-all'); if (all) all.addEventListener('click', function () { go('claims'); });
      document.querySelectorAll('[data-claim]').forEach(function (el) { el.addEventListener('click', function () { go('claimDetail', el.dataset.claim); }); });
    }
  };
  PAGES.claimDetail = {
    async render(id) {
      var c = await api('/portal/' + oid() + '/claims/' + id), calc = c.calculation || {}, policy = c.policy || {}, pet = c.pet || {}, invoice = c.invoice || {};
      var materials = c.materials || [], history = c.history || [], payouts = c.payouts || [], checks = (c.checks || []).filter(function (x) { return x.required && !x.passed; });
      var need = history.slice().reverse().find(function (h) { return h.to_status === '待补件'; });
      var account = c.payee_account_masked || c.account_masked || '', net = payouts.reduce(function (sum, p) { return sum + Number(p.amount || 0); }, 0);
      if (account.indexOf('*') < 0) account = '由院内核对，账号已隐藏';
      var approved = ['待赔付', '已赔付'].includes(c.status) || Number(c.approved_amount) > 0;
      return '<div class="navbar"><div class="title">报销详情</div><button class="back" type="button" data-back aria-label="返回报销列表">‹</button></div>' + claimNotice() +
        '<div class="card"><div class="claim-card-head"><h3>' + esc(pet.name || c.pet_name || '宠物医疗报销') + '</h3>' + statusTag(c.status) + '</div><div class="hint claim-number">' + esc(c.claim_no) + '</div>' + claimStage(c.status) +
        (c.status === '待补件' ? '<div class="claim-warning"><strong>需补充材料</strong><p>' + esc(need && need.comment || '请向院内前台确认需要补充的资料。') + '</p><span>请联系院内前台补充，由院内核对后重新提交。</span></div>' : '') +
        (['已驳回', '已撤回'].includes(c.status) ? '<div class="claim-warning">当前案件' + esc(c.status) + '，处理原因请查看下方完整进度。</div>' : '') + '</div>' +
        '<div class="card"><h3>保单与就诊</h3><dl class="claim-info"><dt>保险方案</dt><dd>' + esc(policy.insurer || c.insurer || '') + '<br>' + esc(policy.plan_name || c.plan_name || '') + '</dd><dt>保障日期</dt><dd>' + date(policy.start_date) + ' 至 ' + date(policy.end_date) + '</dd><dt>医疗账单</dt><dd>' + esc(invoice.invoice_no || c.invoice_no || '') + '</dd><dt>事故类型</dt><dd>' + esc(c.incident_type || '') + ' · ' + date(c.incident_date) + '</dd><dt>收款账号</dt><dd>' + esc(account) + '</dd></dl></div>' +
        '<div class="card"><h3>费用与模拟赔付</h3><div class="claim-amounts"><div><span>当前预估</span><strong>' + claimAmount(c.estimated_amount !== undefined ? c.estimated_amount : calc.estimate) + '</strong></div><div><span>模拟核定</span><strong>' + claimAmount(c.approved_amount, !approved) + '</strong></div><div><span>模拟净到账</span><strong>¥' + money(net) + '</strong></div></div>' +
        '<dl class="claim-info"><dt>实付医疗费用</dt><dd>¥' + money(calc.medical_amount) + '</dd><dt>合规费用</dt><dd>¥' + money(calc.eligible_amount) + '</dd><dt>除外费用</dt><dd>¥' + money(calc.excluded_amount) + '</dd><dt>单次免赔</dt><dd>¥' + money(calc.deductible) + '</dd><dt>演示报销比例</dt><dd>' + esc(calc.rate === undefined ? '-' : calc.rate) + '%</dd><dt>单次限额</dt><dd>¥' + money(calc.per_claim_limit) + '</dd><dt>年度剩余额度</dt><dd>¥' + money(calc.annual_remaining) + '</dd></dl><p class="hint claim-formula">' + esc(calc.formula || '') + '</p><p class="hint">' + esc(calc.disclaimer || '仅按虚构演示参数估算，实际赔付以保险合同及审核为准。') + '</p></div>' +
        '<div class="card"><h3>材料整理</h3><p class="hint">仅展示材料名称；系统关联资料为演示快照，不能替代正式发票或保险凭证。</p>' +
        (materials.length ? '<ul class="claim-materials">' + materials.map(function (m) { return '<li><span class="claim-material-icon">' + (m.type === 'generated' ? '📋' : '📄') + '</span><div class="grow"><strong>' + esc(m.category || '材料') + '</strong><div class="hint">' + esc(m.name) + '</div></div><span class="tag ' + (m.type === 'generated' ? 'b' : '') + '">' + (m.type === 'generated' ? '关联资料' : m.is_demo ? '演示说明' : '已上传') + '</span></li>'; }).join('') + '</ul>' : '<div class="hint">院内尚未整理材料。</div>') +
        (checks.length ? '<div class="claim-warning"><strong>待核对事项</strong><ul>' + checks.map(function (x) { return '<li>' + esc(x.label) + '：' + esc(x.message) + '</li>'; }).join('') + '</ul></div>' : '<div class="claim-check-ok">当前院内材料核验已完成，后续仍以模拟保险审核阶段为准。</div>') + '</div>' +
        '<div class="card"><h3>完整办理进度</h3><p class="hint">以下为本地演示操作及处理意见。</p><ol class="claim-timeline">' + history.slice().reverse().map(function (h) { return '<li><div class="claim-card-head"><strong>' + esc(h.action || h.to_status) + '</strong><time>' + dtime(h.created_at) + '</time></div><div class="hint">' + esc(h.to_status || '') + (h.operator ? ' · ' + esc(h.operator) : '') + '</div><p>' + esc(h.comment || '') + '</p>' + (h.amount !== null && h.amount !== undefined ? '<div class="hint">模拟金额 ¥' + money(h.amount) + '</div>' : '') + '</li>'; }).join('') + '</ol>' + (history.length ? '' : '<p class="hint">暂无办理记录</p>') + '</div>';
    },
    bind() { document.querySelector('[data-back]').addEventListener('click', function () { go('claims', S.cache.claimsInvoice || undefined); }); }
  };

  function paymentPreview() {
    var b = S.cache.bill, select = document.querySelector('#bill-coupon');
    if (!b) return { amount: 0, coupon_id: null };
    var coupon = b.coupons.find(function (c) { return String(c.id) === (select ? select.value : ''); });
    var amount = Number(b.invoice.payable) - Number(b.invoice.paid_amount);
    if (coupon) amount = coupon.coupon_type === '折扣' ? Number(b.invoice.total_amount) * Number(coupon.value) : Number(b.invoice.total_amount) - Number(coupon.value);
    return { amount: Math.max(0, Math.round(amount * 100) / 100), coupon_id: coupon ? coupon.id : null };
  }
  function updatePaymentPreview() {
    var preview = paymentPreview(), b = S.cache.bill, card = b.card;
    var balance = card && card.status === '正常' && (!card.valid_until || date(card.valid_until) >= Demo.date()) ? Number(card.balance) : -1;
    var remaining = document.querySelector('#bill-remaining'); if (remaining) remaining.textContent = '¥' + money(preview.amount);
    var wx = document.querySelector('[data-pay]'), member = document.querySelector('[data-pay2]');
    if (wx) wx.textContent = '微信支付 ¥' + money(preview.amount);
    if (member) { member.textContent = '会员卡支付 ¥' + money(preview.amount); member.disabled = balance < preview.amount; }
    var hint = document.querySelector('#bill-card-hint'); if (hint) hint.textContent = !card ? '暂无会员卡，请使用微信支付。' : balance < 0 ? '会员卡已过期或停用，请使用微信支付。' : '会员卡可用余额 ¥' + money(balance) + (balance < preview.amount ? '，余额不足。' : '');
  }
  async function payBill(id, method) {
    if (paying) return;
    method = method || '微信';
    var preview = paymentPreview();
    if (!confirm('确认使用「' + method + '」支付 ¥' + money(preview.amount) + '？')) return;
    paying = true;
    document.querySelectorAll('[data-pay], [data-pay2], #bill-coupon, #bill-card').forEach(function (el) { el.disabled = true; });
    try {
      var r = await api('/portal/' + oid() + '/invoices/' + id + '/pay', 'POST', { pay_method: method, coupon_id: preview.coupon_id, card_id: method==='会员卡'&&S.cache.bill.card?S.cache.bill.card.id:null });
      toast('支付成功：' + r.status);
      S.cache.home = null;
      render();
    } catch (e) { toast(e.message); render(); } finally { paying = false; }
  }

  /* ---------------------------------------------------------- 优惠券 / 提醒 */
  PAGES.coupons = {
    async render() {
      var d = await api('/portal/' + oid() + '/coupons');
      return `
        <div class="navbar"><div class="title">我的优惠券</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (c) {
          return `<div class="card" style="margin:10px 12px;display:flex;align-items:center;gap:12px;${c.status !== '未使用' ? 'opacity:.55' : ''}">
            <div style="width:78px;text-align:center;color:var(--red)">
              <div style="font-size:22px;font-weight:700">${c.coupon_type === '折扣' ? (Math.round(c.value * 100) / 10) + '折' : '¥' + c.value}</div>
              <div class="hint">${c.min_spend > 0 ? '满' + c.min_spend : '无门槛'}</div>
            </div>
            <div class="grow"><div style="font-size:14px;font-weight:600">${esc(c.name)}</div>
              <div class="hint">${esc(c.campaign_name || '')} · 至 ${date(c.expire_at)}</div></div>
            ${statusTag(c.status)}</div>`;
        }).join('') : '<div class="empty"><span class="em">🎫</span>暂无优惠券</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
    }
  };

  PAGES.reminders = {
    async render() {
      var d = await api('/portal/' + oid() + '/reminders');
      return `
        <div class="navbar"><div class="title">健康提醒</div><div class="back" data-back>‹</div></div>
        ${d.items.length ? d.items.map(function (r) {
          return `<div class="card" style="margin:10px 12px">
            <div style="display:flex;align-items:center">
              <div class="grow"><div style="font-size:14px;font-weight:600">${esc(r.title)}</div>
                <div class="hint">${esc(r.pet_name || '')} · ${esc(r.type)} · 到期 ${date(r.due_at)}</div>
                <div style="font-size:13px;margin-top:4px">${esc(r.content || '')}</div></div>
              ${statusTag(r.status)}</div>
            ${r.status === '待处理' && !r.service_plan_id ? `<button class="btn sm" data-done="${r.id}" style="margin-top:9px;width:100%">标记已完成</button>` : ''}
          </div>`;
        }).join('') : '<div class="empty"><span class="em">🔔</span>暂无提醒</div>'}`;
    },
    bind() {
      var b = document.querySelector('[data-back]');
      if (b) b.addEventListener('click', function () { go('mine'); });
      document.querySelectorAll('[data-done]').forEach(function (el) {
        el.addEventListener('click', async function () {
          if (el.disabled) return; el.disabled = true;
          try { await api('/portal/' + oid() + '/reminders/' + el.dataset.done + '/done', 'PATCH'); toast('已标记完成'); S.cache.home = null; render(); }
          catch (error) { toast(error.message); } finally { el.disabled = false; }
        });
      });
    }
  };

  /* ---------------------------------------------------------- 服务权益与医疗文书 */
  PAGES.membership={
    async render(){var d=await api('/portal/'+oid()+'/membership');S.cache.membership=d;var card=d.cards.find(function(c){return c.id===S.cache.selectedCard;})||d.cards.find(function(c){return c.available;})||d.cards[0];S.cache.selectedCard=card?card.id:null;
      return serviceNav('电子会员卡')+'<section class="page-intro"><span class="eyebrow">MEMBERSHIP & WALLET</span><h1>一张卡，安心相伴</h1><p>可用卡总余额 <strong>¥'+money(d.balance)+'</strong> · '+d.owner.points+'积分</p></section>'+(card?'<div class="member-selector"><label for="member-card-select">查看会员卡</label><select id="member-card-select">'+d.cards.map(function(c){return '<option value="'+c.id+'"'+(c.id===card.id?' selected':'')+'>'+esc(c.level)+' · '+esc(c.card_no)+' · ¥'+money(c.balance)+(c.available?'':' · 不可用')+'</option>';}).join('')+'</select></div><section class="electronic-card"><div class="electronic-top">'+icon('hospital')+'<strong data-hospital-name>'+esc(hospitalBrand.hospital_name)+'</strong><span>'+esc(card.level)+'</span></div><p>MEMBERSHIP CARD</p><div class="electronic-owner">'+esc(d.owner.name)+'<small>'+esc(card.status)+(card.valid_until&&card.valid_until<Demo.date()?' · 已过期':'')+'</small></div><div class="electronic-number">'+esc(card.card_no)+'</div><div class="electronic-bottom"><span>可用余额<strong>¥'+money(card.balance)+'</strong></span><span>到期日期<b>'+esc(card.valid_until||'长期有效')+'</b></span></div></section><div class="member-actions"><button class="btn" id="member-recharge" '+(card.available?'':'disabled')+'>'+icon('plus')+' 模拟充值</button><button class="btn ghost" data-go="bills">'+icon('wallet')+' 查看账单</button></div><p class="service-local-note">到院可出示卡号，由前台核对。每次消费可选择一张卡，退款退回原支付卡。</p><section class="card"><div class="section-heading"><h2>余额变动明细</h2><small>'+card.transactions.length+'条记录</small></div>'+(card.transactions.length?card.transactions.map(function(t){return '<div class="wallet-entry"><span class="wallet-entry-icon">'+icon(t.kind==='消费'?'wallet':t.kind==='退款'?'arrow':'card')+'</span><div><strong>'+esc(t.kind)+'</strong><p>'+dtime(t.created_at)+' · '+esc(t.pay_method||'余额结转')+'</p><small>'+esc(t.invoice_no||t.receipt_no||'启用时余额结转')+'</small></div><b class="'+(t.amount<0?'debit':'credit')+'">'+(t.amount>0?'+':'')+money(t.amount)+'</b></div>';}).join(''):'<div class="empty">暂无余额变动</div>')+'</section>':'<section class="card empty">'+icon('card')+'<h3>暂未开通会员卡</h3><p>请联系前台了解适合您与爱宠的会员服务。</p></section>');
    },
    bind(){bindBack();bindDestinations();var select=document.querySelector('#member-card-select');if(select)select.onchange=function(){S.cache.selectedCard=Number(this.value);render();};var b=document.querySelector('#member-recharge');if(b)b.onclick=function(){var card=S.cache.membership.cards.find(function(c){return c.id===S.cache.selectedCard;}),key=requestToken();openSheet('会员卡模拟充值','<div class="recharge-summary"><span>'+esc(card.level)+' · '+esc(card.card_no)+'</span><strong>当前余额 ¥'+money(card.balance)+'</strong></div><div class="fl"><label for="recharge-amount">充值金额（元）</label><input id="recharge-amount" type="number" step="0.01" min="0.01" max="100000" value="200" required></div><div class="recharge-presets">'+[100,200,500,1000].map(function(n){return '<button type="button" data-recharge-amount="'+n+'">¥'+n+'</button>';}).join('')+'</div><div class="fl"><label for="recharge-method">模拟支付方式</label><select id="recharge-method"><option>微信</option><option>支付宝</option></select></div><p class="recharge-notice">本次仅演示充值流程，不会扣取真实资金。确认后增加所选卡余额并保留流水，不计入医疗消费或积分。</p>',async function(){await api('/portal/'+oid()+'/cards/'+card.id+'/recharge','POST',{amount:document.querySelector('#recharge-amount').value,pay_method:document.querySelector('#recharge-method').value,request_key:key});toast('模拟充值已记录，余额已更新');await render();});document.querySelectorAll('[data-recharge-amount]').forEach(function(x){x.onclick=function(){document.querySelector('#recharge-amount').value=x.dataset.rechargeAmount;};});};}
  };
  PAGES.inbox={
    async render(){var d=await api('/portal/'+oid()+'/inbox');S.cache.inbox=d;var rows=d.items.filter(function(r){return S.inboxFilter!=='unread'||!r.read;});return serviceNav('消息中心')+'<section class="page-intro"><span class="eyebrow">YOUR CARE UPDATES</span><h1>每一条关怀，都在这里</h1><p>'+d.unread+'条未读消息，查看医院给您的最新回复。</p></section><div class="inbox-toolbar"><div><button data-inbox-filter="all" class="'+(S.inboxFilter==='all'?'selected':'')+'">全部</button><button data-inbox-filter="unread" class="'+(S.inboxFilter==='unread'?'selected':'')+'">未读 '+d.unread+'</button></div><button id="inbox-read-all" '+(d.unread?'':'disabled')+'>全部已读</button></div><div class="inbox-list">'+(rows.length?rows.map(function(r){return '<article class="inbox-item '+(r.read?'read':'unread')+'"><button class="inbox-open" data-open-message="'+r.source+':'+r.id+'"><span class="inbox-symbol">'+icon(r.icon)+'</span><span><span class="inbox-meta">'+esc(r.label)+' · '+dtime(r.created_at)+'</span><strong>'+esc(r.title)+'</strong><span class="inbox-content">'+esc(r.content)+'</span></span>'+(!r.read?'<i></i>':'')+'</button><button class="inbox-read-toggle" data-read-message="'+r.source+':'+r.id+'">'+(r.read?'标为未读':'标为已读')+'</button></article>';}).join(''):'<section class="card empty">'+icon('bell')+'<h3>'+(S.inboxFilter==='unread'?'消息都已读完':'暂无消息')+'</h3><p>医院回复和服务提醒会在这里集中显示。</p></section>')+'</div>';},
    bind(){bindBack();document.querySelectorAll('[data-inbox-filter]').forEach(function(b){b.onclick=function(){S.inboxFilter=b.dataset.inboxFilter;render();};});document.querySelector('#inbox-read-all').onclick=async function(){if(this.disabled)return;this.disabled=true;try{await api('/portal/'+oid()+'/inbox/read','POST',{all:true});render();}catch(e){toast(e.message);this.disabled=false;}};document.querySelectorAll('[data-open-message],[data-read-message]').forEach(function(b){b.onclick=async function(){if(b.disabled)return;b.disabled=true;var key=b.dataset.openMessage||b.dataset.readMessage,r=S.cache.inbox.items.find(function(r){return r.source+':'+r.id===key;});try{await api('/portal/'+oid()+'/inbox/read','POST',{source:r.source,id:r.id,read:b.dataset.openMessage?true:!r.read});if(b.dataset.openMessage)go(r.page,r.param);else render();}catch(e){toast(e.message);b.disabled=false;}};});}
  };
  function memberCardSelect(cards,current) {
    return '<div class="fl"><label for="bill-card">选择支付会员卡</label><select id="bill-card"><option value="">请选择会员卡</option>'+cards.map(function(c){return '<option value="'+c.id+'"'+(current&&current.id===c.id?' selected':'')+'>'+esc(c.card_no)+' · '+esc(c.level)+' · ¥'+money(c.balance)+(c.status!=='正常'?' · '+esc(c.status):c.valid_until&&c.valid_until<Demo.date()?' · 已过期':'')+'</option>';}).join('')+'</select><div class="hint">每次付款使用一张卡，退款退回原支付卡。</div></div>';
  }
  function registerOwner() {
    openSheet('首次来院 · 自助登记','<div class="fl"><label for="register-name">主人姓名</label><input id="register-name" maxlength="50" required placeholder="请输入登记姓名"></div><div class="fl"><label for="register-phone">手机号</label><input id="register-phone" inputmode="tel" pattern="1[0-9]{10}" maxlength="11" required placeholder="11位手机号"></div><p class="hint">演示仅在本机创建客户档案，宠物档案由前台核验后建立。</p>',async function(){
      var r=await api('/portal/register','POST',{name:document.querySelector('#register-name').value.trim(),phone:document.querySelector('#register-phone').value.trim()});
      resetSession(r.owner);try{localStorage.setItem('mp_owner',JSON.stringify(r.owner));}catch(e){}
      toast('登记成功，首次到院请前台核验');await render();
    });
  }
  function serviceNav(title) {return '<div class="navbar"><div class="title">'+esc(title)+'</div><button class="back" type="button" data-back aria-label="返回">‹</button></div>';}
  function bindBack(page) {var el=document.querySelector('[data-back]');if(el)el.onclick=function(){go(page||'mine');};}
  PAGES.services={
    async render(){
      var d=await api('/portal/'+oid()+'/services'),m=d.member;
      return serviceNav('服务权益')+
      '<section class="service-member"><span>MEMBERSHIP · 我的服务权益</span><h2>'+esc(m.spend_level)+' <small>'+esc(m.owner_name)+'</small></h2><div class="service-numbers"><div><b>'+m.points+'</b><span>当前积分</span></div><div><b>'+d.orders.filter(function(o){return o.status==='可使用';}).length+'</b><span>可用套餐</span></div><div><b>'+(m.discount*10).toFixed(1)+'折</b><span>套餐可选优惠</span></div></div><p>消费等级与档案等级分别展示，套餐优惠由前台办理时确认。</p></section>'+
      '<section class="card"><div class="card-h"><h3>我的套餐与计次卡</h3></div>'+(d.orders.length?d.orders.map(function(o){return '<button class="service-order-row" data-service-order="'+o.id+'"><div><strong>'+esc(o.name)+'</strong><span>'+esc(o.pet_name)+' · '+esc(o.order_no)+'</span><span>'+esc(o.expires_at?'有效至 '+o.expires_at:'结清后生效')+'</span></div><div class="service-order-right"><b>'+o.remaining+'<small> / '+o.units+'次</small></b>'+statusTag(o.status)+'</div></button>';}).join(''):'<p class="hint">暂无服务套餐，可联系前台了解适合爱宠的服务。</p>')+'</section>'+
      '<section class="card"><div class="card-h"><h3>免疫与驱虫计划</h3><button class="text-button" data-service-go="reminders">全部提醒 ›</button></div>'+(d.plans.length?d.plans.map(function(p){return '<div class="li"><div class="grow"><div class="t">'+esc(p.name)+'</div><div class="s">'+esc(p.pet_name)+' · '+esc(p.category)+' · '+date(p.due_at)+'</div><div class="s">'+(p.status==='已完成'?'实际执行 '+date(p.executed_at):'请预约到院，由医护核对后执行')+'</div></div>'+statusTag(p.status)+'</div>';}).join(''):'<p class="hint">暂无计划，可咨询医护建立适合爱宠的免疫驱虫安排。</p>')+'</section>'+
      '<section class="card"><div class="card-h"><h3>我的会员卡</h3></div>'+(m.cards.length?m.cards.map(function(c){return '<div class="li"><div class="grow"><div class="t">'+esc(c.level)+' · '+esc(c.card_no)+'</div><div class="s">有效至 '+esc(c.valid_until||'长期')+' · '+esc(c.status)+'</div></div><b>¥'+money(c.balance)+'</b></div>';}).join(''):'<p class="hint">暂无会员卡。</p>')+'</section>'+
      '<section class="card"><div class="card-h"><h3>积分变动</h3></div><p class="hint">'+esc(m.rule)+'</p>'+(d.points.length?d.points.map(function(p){return '<div class="li"><div class="grow"><div class="t">'+esc(p.reason)+'</div><div class="s">'+esc(p.invoice_no||'')+' · '+dtime(p.created_at)+'</div></div><div class="r"><strong class="'+(p.delta>0?'service-positive':'service-negative')+'">'+(p.delta>0?'+':'')+p.delta+'</strong><div class="s">余额 '+p.balance+'</div></div></div>';}).join(''):'<p class="hint">暂无新增积分流水；原有积分已保留。</p>')+'</section>'+
      '<section class="card"><div class="card-h"><h3>服务消息</h3></div><p class="hint">以下为院内本地模拟触达记录。</p>'+(d.messages.length?d.messages.map(function(x){return '<article class="service-message"><strong>'+esc(x.title)+'</strong><p>'+esc(x.content)+'</p><small>'+dtime(x.created_at)+' · '+esc(x.status)+'</small></article>';}).join(''):'<p class="hint">暂无服务消息。</p>')+'</section>'+
      '<section class="card"><div class="card-h"><h3>本轮服务满意度</h3></div>'+(d.survey?'<div class="service-survey-done"><strong>'+'★'.repeat(d.survey.score)+' '+d.survey.score+'/5</strong><p>'+esc(d.survey.comment||'感谢您的评价')+'</p><small>'+dtime(d.survey.created_at)+' · 本轮已提交</small></div>':'<p class="hint">每位客户本轮可评价一次，请按实际体验填写。</p><form id="service-survey"><div class="fl"><label for="survey-score">满意度</label><select id="survey-score" required><option value="">请选择</option><option value="5">5分 · 非常满意</option><option value="4">4分 · 满意</option><option value="3">3分 · 一般</option><option value="2">2分 · 不太满意</option><option value="1">1分 · 不满意</option></select></div><div class="fl"><label for="survey-comment">意见或建议（选填）</label><textarea id="survey-comment" maxlength="1000" placeholder="告诉我们做得好的地方或需要改进的问题"></textarea></div><button class="btn" type="submit">提交本轮评价</button></form>')+'</section>';
    },
    bind(){
      bindBack();document.querySelectorAll('[data-service-order]').forEach(function(b){b.onclick=function(){go('serviceOrder',b.dataset.serviceOrder);};});
      document.querySelectorAll('[data-service-go]').forEach(function(b){b.onclick=function(){go(b.dataset.serviceGo);};});
      var form=document.querySelector('#service-survey');if(form)form.onsubmit=async function(event){event.preventDefault();var b=form.querySelector('button');if(b.disabled)return;b.disabled=true;try{await api('/portal/'+oid()+'/services/survey','POST',{score:Number(document.querySelector('#survey-score').value),comment:document.querySelector('#survey-comment').value.trim()});toast('感谢您的评价');await render();}catch(e){toast(e.message);}finally{b.disabled=false;}};
    }
  };
  PAGES.serviceOrder={
    async render(id){
      var o=await api('/portal/'+oid()+'/services/orders/'+id);
      return serviceNav('套餐使用明细')+'<section class="service-member"><span>'+esc(o.pet_name)+' · '+esc(o.order_no)+'</span><h2>'+esc(o.name)+'</h2><div class="service-remaining">'+o.remaining+'<small> / '+o.units+'次剩余</small></div>'+statusTag(o.status)+'<p>'+esc(o.expires_at?'有效至 '+o.expires_at:'结清后生效，有效期 '+o.valid_days+'天')+'</p></section>'+
      '<section class="card"><div class="li"><span class="grow">账单应付</span><strong>¥'+money(o.payable)+'</strong></div><div class="li"><span class="grow">'+esc(o.invoice_no)+'</span>'+statusTag(o.invoice_status)+'</div><button class="btn ghost" id="service-bill" data-id="'+o.invoice_id+'">查看账单 / 支付</button><p class="hint">服务由院内核实后核销，已有核销的套餐须先复核再办理退款。</p></section>'+
      '<section class="card"><div class="card-h"><h3>核销记录</h3></div>'+(o.uses.length?o.uses.map(function(u){return '<div class="li"><div class="grow"><div class="t">'+esc(u.note)+'</div><div class="s">'+dtime(u.created_at)+' · '+esc(u.operator)+'</div></div><strong>'+ (u.qty>0?'使用 '+u.qty:'撤销 '+Math.abs(u.qty))+'次</strong></div>';}).join(''):'<p class="hint">尚无核销记录。</p>')+'</section>';
    },bind(){bindBack('services');document.querySelector('#service-bill').onclick=function(){go('billDetail',this.dataset.id);};}
  };
  PAGES.careDocs={
    async render(){
      var d=await api('/portal/'+oid()+'/care/documents');
      return serviceNav('医疗文书')+'<p class="service-local-note">本地演示确认签署，仅用于流程展示；不代表已接入正式电子签名服务。</p>'+(d.items.length?d.items.map(function(x){return '<button class="card service-document-card" data-document="'+x.id+'"><div class="li"><div class="grow"><div class="t">'+esc(x.title)+'</div><div class="s">'+esc(x.pet_name)+' · '+esc(x.visit_no)+'</div><div class="s">'+esc(x.type)+' · '+dtime(x.requested_at||x.created_at)+'</div></div>'+statusTag(x.status)+'</div><span class="service-document-link">'+(x.status==='待签署'?'阅读并确认签署':'查看签署记录')+' ›</span></button>';}).join(''):'<div class="empty">暂无待签署或已签署文书</div>');
    },bind(){bindBack();document.querySelectorAll('[data-document]').forEach(function(b){b.onclick=function(){go('careDoc',b.dataset.document);};});}
  };
  PAGES.careDoc={
    async render(id){
      var d=await api('/portal/'+oid()+'/care/documents/'+id);
      return serviceNav('文书阅读与确认')+'<section class="card"><h2 class="service-doc-title">'+esc(d.title)+'</h2><p class="hint">'+esc(d.pet_name)+' · '+esc(d.visit_no)+' · '+esc(d.type)+'</p>'+statusTag(d.status)+'<article class="service-doc-content">'+esc(d.content)+'</article><p class="hint">正文校验码 '+esc(d.checksum)+'</p></section>'+
      '<p class="service-local-note">请完整阅读文书，如有疑问先向医护咨询。本页为本地演示确认签署，不代表正式电子签名。</p>'+
      (d.status==='待签署'?'<form class="card" id="care-sign"><div class="fl"><label for="care-signer">登记的主人姓名</label><input id="care-signer" maxlength="60" autocomplete="name" required placeholder="请填写本人登记姓名"></div><label class="service-consent"><input type="checkbox" id="care-consent" required><span>我已完整阅读并理解以上文书内容，确认进行本地演示签署。</span></label><button class="btn" type="submit">确认演示签署</button></form>':'<section class="card service-signature"><strong>已确认签署</strong><p>签署人：'+esc(d.signer_name)+'</p><p>签署时间：'+dtime(d.signed_at)+'</p><p>'+esc(d.signature_method)+'</p></section>')+
      '<section class="card"><div class="card-h"><h3>文书记录</h3></div>'+d.history.map(function(h){return '<div class="li"><div class="grow"><div class="t">'+esc(h.action)+'</div><div class="s">'+esc(h.operator)+' · '+dtime(h.created_at)+'</div><div class="s">'+esc(h.note)+'</div></div></div>';}).join('')+'</section>';
    },
    bind(id){bindBack('careDocs');var form=document.querySelector('#care-sign');if(form)form.onsubmit=async function(event){event.preventDefault();var b=form.querySelector('button');if(b.disabled)return;b.disabled=true;try{await api('/portal/'+oid()+'/care/documents/'+id+'/sign','POST',{signer_name:document.querySelector('#care-signer').value.trim(),consent:document.querySelector('#care-consent').checked});toast('演示签署已记录');await render();}catch(e){toast(e.message);}finally{b.disabled=false;}};}
  };

  /* ---------------------------------------------------------- 通用 */
  function openSheet(title, body, onOk) {
    if (document.querySelector('.portal-sheet')) return;
    var wrap = document.createElement('div');
    wrap.className = 'portal-sheet';
    var saving = false;
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:60;display:flex;' +
      'align-items:flex-end;justify-content:center';
    wrap.innerHTML = '<div class="sheet-panel" style="background:#fff;width:100%;max-width:640px;border-radius:14px 14px 0 0;' +
      'padding:16px;max-height:82vh;overflow:auto">' +
      '<div style="font-size:16px;font-weight:650;margin-bottom:12px">' + esc(title) + '</div>' +
      body +
      '<div style="display:flex;gap:9px;margin-top:8px">' +
      '<button class="btn gray" data-c style="flex:1">取消</button>' +
      '<button class="btn" data-k style="flex:1">确定</button></div></div>';
    document.body.appendChild(wrap);
    function close() { if (!saving) { wrap.remove(); document.removeEventListener('keydown', escape); } }
    function escape(e) { if (e.key === 'Escape') close(); }
    wrap.dispose = function () { document.removeEventListener('keydown', escape); };
    document.addEventListener('keydown', escape);
    wrap.querySelector('[data-c]').onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('[data-k]').onclick = async function () {
      if (saving) return;
      var invalid = Array.prototype.find.call(wrap.querySelectorAll('input, select, textarea'), function (el) { return !el.checkValidity(); });
      if (invalid) { invalid.reportValidity(); return; }
      saving = true; wrap.querySelectorAll('button').forEach(function (el) { el.disabled = true; });
      try { await onOk(); saving = false; close(); } catch (e) { toast(e.message); }
      finally { saving = false; wrap.querySelectorAll('button').forEach(function (el) { el.disabled = false; }); }
    };
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);' +
        'color:#fff;padding:10px 18px;border-radius:8px;font-size:13.5px;z-index:200;max-width:78vw;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.display = 'none'; }, 2000);
  }

  async function go(page, param) {
    S.page = page;
    S.param = param;
    await render();
    window.scrollTo(0, 0);
  }

  async function render() {
    var version = ++renderVersion, ownerId = S.owner ? S.owner.id : null, page = S.page, param = S.param;
    var c = document.querySelector('#content');
    var bar = document.querySelector('#tabbar');
    var keepAppointment = page === 'appt' && c.dataset.page === 'appt' && c.querySelector('#appointment-slots');
    var position = keepAppointment ? { y: window.scrollY, strips: Array.from(c.querySelectorAll('.pets,.days')).map(function (el) { return el.scrollLeft; }) } : null;
    c.dataset.page = S.owner ? S.page : 'login';
    c.dataset.loading = 'true';
    if (keepAppointment) c.querySelectorAll('button').forEach(function (el) { el.disabled = true; });
    if (!keepAppointment) c.innerHTML = '<div class="empty">加载中…</div>';
    try { await loadHospitalBrand(); } catch (e) {}
    if (version !== renderVersion) return;
    if (!S.owner) {
      c.innerHTML = loginHtml();
      bar.innerHTML = '';
      bar.style.display = 'none';
      try { await bindLogin(); } catch (e) { if (version === renderVersion) toast(e.message); }
      if (version === renderVersion) c.dataset.loading = 'false';
      return;
    }
    var p = PAGES[S.page] || PAGES.home;
    if (!keepAppointment) c.innerHTML = '<div class="empty">加载中…</div>';
    try {
      var html = await p.render(param);
      if (version !== renderVersion || !S.owner || S.owner.id !== ownerId) return;
      c.innerHTML = html;
      polishInterface(c);
      if (p.bind) p.bind(param);
    } catch (e) {
      if (version !== renderVersion || !S.owner || S.owner.id !== ownerId) return;
      c.innerHTML = '<div class="empty"><span class="em">⚠️</span>' + esc(e.message || '加载失败') + '</div>';
    }
    externalPending = false;
    renderTabbar();
    // 聊天页为全屏页面：隐藏底部导航，避免与固定输入行相互遮挡
    document.querySelector('#tabbar').style.display =
      ['consultChat'].indexOf(S.page) >= 0 ? 'none' : '';
    c.dataset.loading = 'false';
    if (position) {
      c.querySelectorAll('.pets,.days').forEach(function (el, i) { el.scrollLeft = position.strips[i] || 0; });
      window.scrollTo(0, position.y);
    }
  }
  function hasDraft() {
    if (paying || document.querySelector('.portal-sheet') || Object.values(S.mediaDrafts).some(function(files){return files.length;})) return true;
    var coupon = document.querySelector('#bill-coupon'); if (coupon && coupon.value) return true;
    if (S.page === 'appt' && (S.appt.slot || S.appt.dirty || S.appt.submitting)) return true;
    return Array.prototype.some.call(document.querySelectorAll('#content input:not([type="hidden"]), #content textarea'), function (el) { return el.value && el.id !== 'bill-coupon'; });
  }
  function externalUpdate() {
    if (!S.owner) { loadHospitalBrand().catch(function(){}); return; }
    if (!hasDraft()) { render(); return; }
    externalPending = true;
    if (document.querySelector('#portal-update')) return;
    var button = document.createElement('button'); button.id = 'portal-update'; button.className = 'portal-update';
    button.textContent = '院内资料已更新，点此刷新（当前填写内容将重新加载）';
    button.onclick = function () { if (!paying) render(); }; document.querySelector('#content').prepend(button);
  }
  window.addEventListener('demo:data-change', function (event) { if (event.detail && event.detail.external) externalUpdate(); });
  window.addEventListener('focus', function () { if (S.owner && !hasDraft()) render(); });

  /* ---------------------------------------------------------- 启动 */
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var saved = localStorage.getItem('mp_owner');
      if (saved) S.owner = JSON.parse(saved);
    } catch (e) { }
    render();
  });

  window.__MP = { go: go, S: S };
})();
