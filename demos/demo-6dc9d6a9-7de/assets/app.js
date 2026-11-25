import {BASE,storeId,namespace,read,write,t,getLang,setLang,statusText,eventText} from './i18n.js';
import {icon} from './icons.js';

const page = document.body.dataset.page;
const root = document.querySelector('#app');
const uid = () => globalThis.crypto?.randomUUID?.().replaceAll('-','') || (globalThis.crypto?.getRandomValues ? Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('') : Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join(''));
const deviceId = read('device') || uid();
write('device', deviceId);
const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href = name => {const u=new URL(name,BASE);u.searchParams.set('store',storeId);return u.href;};
const app = {bootstrap:null,state:null,loaded:false,online:false,error:'',auth:false,busy:false,view:'dashboard',tab:'waiting',listPage:1,history:null,historyPage:1,historyDate:'',historyStatus:'',historyLoading:false,settingsDraft:null,loginDraft:{username:'admin',password:''},voice:false,voiceSignature:'',displayPage:0,qrBase:null};
let channel;
try {channel = 'BroadcastChannel' in window ? new BroadcastChannel(namespace+'updates') : null;} catch {}
let polling=null, inFlight=null, bootstrapFlight=null, refreshPending=false, historyRequest=0;
const pendingOperations=new Map();
const terminalId=uid();
let voiceFlight=Promise.resolve();
function leaseVoice(enabled){const task=voiceFlight.catch(()=>{}).then(()=>request('voice',{method:'POST',body:{owner:terminalId,kind:page,enabled},retry:false}));voiceFlight=task;return task;}
app.queueSearch='';app.queueSearchDraft='';app.historyNumber='';app.historySource='';app.operator=read('operator','店员 A');app.qrOpen=innerWidth>740;app.customerAlerts=false;app.alertAudio=null;

class ApiError extends Error {constructor(code,message,status=0){super(message);this.code=code;this.status=status;}}
function errorText(err){if(typeof err==='string')return err;const keys={QUEUE_EMPTY:'queueEmpty',CURRENT_BUSY:'currentBusy',STALE_TICKET:'staleTicket',AUTH_REQUIRED:'authRequired',QUEUE_PAUSED:'queuePaused',INVALID_CREDENTIALS:'loginBad',CONTRACT:'contractError',NETWORK:'networkError',OFFLINE:'offline',INVALID_INPUT:'invalidInput',REQUEST_REUSED:'requestReused',RATE_LIMIT:'rateLimit',STORE_NOT_FOUND:'storeMissing',UNDO_EXPIRED:'undoExpired',ARRIVAL_REQUIRED:'arrivalRequired',VOICE_BUSY:'voiceBusy'};return keys[err?.code]?t(keys[err.code]):err?.message||t('networkError');}
async function request(endpoint,{method='GET',body,query={},headers={},retry=true}={}){
  const url=new URL('api/'+endpoint,BASE);url.searchParams.set('store',storeId);
  for(const [k,v] of Object.entries(query)) if(v!==''&&v!==undefined)url.searchParams.set(k,v);
  for(let attempt=0;attempt<(method==='POST'&&retry?2:1);attempt++){
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
    try{
      const res=await fetch(url,{method,credentials:'same-origin',mode:'same-origin',cache:'no-store',signal:controller.signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(page==='customer'?{'X-Device-Id':deviceId}:{}),...headers},body:body?JSON.stringify(body):undefined});
      let data;try{data=await res.json();}catch{throw new ApiError('CONTRACT',t('contractError'),res.status);}
      if(!res.ok||data?.ok!==true)throw new ApiError(data?.error?.code||'CONTRACT',data?.error?.message||t('contractError'),res.status);
      return data;
    }catch(err){
      if(err instanceof ApiError)throw err;
      if(attempt===0&&method==='POST'&&retry){await new Promise(r=>setTimeout(r,250));continue;}
      throw new ApiError('NETWORK',t('networkError'));
    }finally{clearTimeout(timer);}
  }
}
function validateState(s){
  const statuses=['waiting','called','passed','completed','expired','cancelled'];
  const ticket=x=>x&&typeof x.id==='string'&&/^H\d+$/.test(x.number)&&Number.isInteger(x.sequence)&&x.sequence>0&&Number.isInteger(x.version)&&x.version>0&&x.serviceType==='general'&&statuses.includes(x.status)&&x.businessDate===s.businessDate&&Number.isFinite(Date.parse(x.createdAt))&&Number.isInteger(x.callCount)&&x.callCount>=0&&Number.isInteger(x.passCount)&&x.passCount>=0;
  if(!s||!Number.isInteger(s.revision)||s.revision<0||s.store?.id!==storeId||typeof s.store.accepting!=='boolean'||!/^\d{4}-\d{2}-\d{2}$/.test(s.businessDate)||!Number.isFinite(Date.parse(s.serverTime))||!Array.isArray(s.waiting)||!Array.isArray(s.passed)||!s.stats)throw new ApiError('CONTRACT',t('contractError'));
  if(!s.waiting.every(x=>ticket(x)&&x.status==='waiting')||!s.passed.every(x=>ticket(x)&&x.status==='passed')||(s.currentCall!==null&&(!ticket(s.currentCall)||s.currentCall.status!=='called'))||(s.myTicket!==null&&!ticket(s.myTicket)))throw new ApiError('CONTRACT',t('contractError'));
  if(s.stats.waiting!==s.waiting.length||s.stats.passed!==s.passed.length||s.waiting.some((x,i)=>i>0&&s.waiting[i-1].sequence>=x.sequence))throw new ApiError('CONTRACT',t('contractError'));
  if(!['waiting','passed','completed','total'].every(k=>Number.isInteger(s.stats[k])&&s.stats[k]>=0)||!Number.isInteger(s.store.serviceMinutes)||s.store.serviceMinutes<1||typeof s.store.name!=='string'||typeof s.store.notice!=='string'||(s.stats.averageMinutes!==null&&(!Number.isFinite(s.stats.averageMinutes)||s.stats.averageMinutes<0)))throw new ApiError('CONTRACT',t('contractError'));
  if(s.myTicket&&(![null,...s.waiting.map((_,i)=>i)].includes(s.myTicket.ahead)||(s.myTicket.estimatedMinutes!==null&&(!Number.isInteger(s.myTicket.estimatedMinutes)||s.myTicket.estimatedMinutes<0))))throw new ApiError('CONTRACT',t('contractError'));
  if(typeof s.roundId!=='string'||!s.roundId||s.stats.total<s.stats.waiting+s.stats.passed+s.stats.completed+(s.currentCall?1:0))throw new ApiError('CONTRACT',t('contractError'));
  const visible=[...s.waiting,...s.passed,...(s.currentCall?[s.currentCall]:[])];
  if(page==='merchant'){
    if(!Array.isArray(s.completed)||!s.completed.every(x=>ticket(x)&&x.status==='completed')||s.completed.length!==s.stats.completed||!Array.isArray(s.events)||!s.events.every(x=>typeof x.action==='string'&&typeof x.number==='string'&&typeof x.detail==='string'&&Number.isFinite(Date.parse(x.at))))throw new ApiError('CONTRACT',t('contractError'));
    visible.push(...s.completed);
  }
  if(new Set(visible.map(x=>x.id)).size!==visible.length||new Set(visible.map(x=>x.sequence)).size!==visible.length)throw new ApiError('CONTRACT',t('contractError'));
  if(s.myTicket?.status==='waiting'&&(s.myTicket.ahead!==s.waiting.findIndex(x=>x.id===s.myTicket.id)||s.myTicket.estimatedMinutes===null))throw new ApiError('CONTRACT',t('contractError'));
  return s;
}
function applyState(s){
  validateState(s);
  if(app.state&&(s.revision<app.state.revision||(s.revision===app.state.revision&&Date.parse(s.serverTime)<Date.parse(app.state.serverTime))))return false;
  const changed=app.state?.revision!==s.revision;
  const needsRender=changed||!app.online||Boolean(app.error)||app.state?.myTicket?.id!==s.myTicket?.id||app.state?.myTicket?.estimatedMinutes!==s.myTicket?.estimatedMinutes||Math.floor((app.state?.currentCall?.serviceSeconds||0)/60)!==Math.floor((s.currentCall?.serviceSeconds||0)/60)||(page==='merchant'&&app.view==='dashboard'&&Math.floor(Date.parse(app.state?.serverTime||0)/60000)!==Math.floor(Date.parse(s.serverTime)/60000))||Boolean(app.state?.undo)!==Boolean(s.undo)||(page==='customer'&&s.myTicket?.status==='cancelled');
  if(app.state&&(app.state.roundId!==s.roundId||app.state.businessDate!==s.businessDate))pendingOperations.clear();
  if(app.state?.businessDate!==s.businessDate&&!app.historyDatePinned){app.historyDate=s.businessDate;app.historyDateTo=null;app.historyPage=1;app.history=null;}
  if(page==='customer'&&app.customerAlerts&&app.state?.myTicket?.status!=='called'&&s.myTicket?.status==='called'&&!document.hidden){try{navigator.vibrate?.([200,100,200]);const a=app.alertAudio;if(a&&a.state==='running'){const o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);g.gain.value=.08;o.frequency.value=660;o.start();o.stop(a.currentTime+.3);o.onended=()=>{o.disconnect();g.disconnect();};}}catch{}}
  if(s.currentCall&&(app.state?.currentCall?.id!==s.currentCall.id||app.state?.currentCall?.callCount!==s.currentCall.callCount))app.highlightUntil=Date.now()+3000;
  app.state=s;app.online=true;app.loaded=true;app.error='';
  if(!app.historyDate)app.historyDate=s.businessDate;
  announce(s.currentCall);
  if(!needsRender||(page==='merchant'&&app.view==='settings'&&app.settingsDraft))updateStatus();else render();
  if(changed&&page==='merchant'&&app.view==='history')loadHistory();
  return true;
}
async function refresh(){
  if(!app.bootstrap)return bootstrap();
  if(page==='merchant'&&!app.auth)return;
  if(inFlight){refreshPending=true;return inFlight;}
  inFlight=(async()=>{
    try{const data=await request('state',{query:page==='merchant'?{audience:'merchant'}:{}});applyState(data.state);}
    catch(err){
      app.online=false;app.error=err;
      if(err.status===401&&page==='merchant'){app.auth=false;app.loaded=false;app.loginDraft.password='';}
      if(app.loaded&&app.view==='settings')updateStatus();else render();
    }
    finally{inFlight=null;if(refreshPending){refreshPending=false;queueMicrotask(refresh);}}
  })();return inFlight;
}
function schedule(){clearTimeout(polling);polling=setTimeout(async()=>{if(!document.hidden)await refresh();schedule();},app.online?1500:4000);}
async function bootstrap(){
  if(location.protocol==='file:'){renderNoServer();return;}
  if(bootstrapFlight)return bootstrapFlight;
  bootstrapFlight=(async()=>{
  try{
    const data=await request('bootstrap');
    if(!data||!Array.isArray(data.stores)||!data.stores.some(x=>x.id===storeId)||!data.stores.every(x=>typeof x.id==='string'&&typeof x.name==='string')||typeof data.authenticated!=='boolean'||!Array.isArray(data.lanHosts)||!data.lanHosts.every(x=>typeof x==='string'&&/^\d+\.\d+\.\d+\.\d+$/.test(x))||!Number.isInteger(data.port)||data.port<1||data.port>65535||data.basePath!==BASE.pathname)throw new ApiError('CONTRACT',t('contractError'));
    app.bootstrap=data;app.auth=data.authenticated;
    app.qrBase=new URL(BASE);
    if(['localhost','127.0.0.1'].includes(location.hostname)&&app.bootstrap.lanHosts.length){
      const lan=app.bootstrap.lanHosts.find(x=>x.startsWith('192.168.'))||app.bootstrap.lanHosts[0];
      app.qrBase.hostname=lan;app.qrBase.port=String(app.bootstrap.port);
    }
    restorePhoneOrigin();
    render();await refresh();
  }catch(err){app.bootstrap=null;app.online=false;app.error=err;render();}finally{bootstrapFlight=null;schedule();}
  })();return bootstrapFlight;
}
async function mutate(action,payload={}){
  if(app.busy||!app.loaded||!app.online)return;
  app.busy=true;render();
  const fingerprint=JSON.stringify([action,payload]);
  const requestId=pendingOperations.get(fingerprint)||uid();pendingOperations.set(fingerprint,requestId);
  try{
    const endpoint=['create','call-next','recall-current','pass-current','complete-current','recall-specific','complete-next','start-service','walk-in','undo','cancel-ticket','request-return'].includes(action)?'tickets/'+action:action;
    const data=await request(endpoint,{method:'POST',body:{...(action==='create'?{serviceType:'general'}:{}),...payload,...(page==='merchant'?{operatorName:app.operator}:{}),requestId}});
    validateState(data.state);
    const result=data.result;
    if(!result||typeof result!=='object'||(action==='create'&&(typeof result.reusedExistingTicket!=='boolean'||result.ticketId!==data.state.myTicket?.id))||(['call-next','recall-current','pass-current','complete-current','recall-specific','complete-next','start-service','walk-in','undo','cancel-ticket','request-return'].includes(action)&&typeof result.ticketId!=='string')||(action==='settings'&&result.saved!==true)||(action==='reset'&&result.reset!==true)||(action==='seed'&&result.count!==payload.count))throw new ApiError('CONTRACT',t('contractError'));
    if(action==='settings')app.settingsDraft=null;
    applyState(data.state);pendingOperations.delete(fingerprint);
    channel?.postMessage({type:'updated',revision:data.state.revision});
    const labels={'call-next':'actionCalled','pass-current':'actionPassed','complete-current':'actionCompleted','complete-next':'actionCompleted','recall-current':'actionRecalled','recall-specific':'actionRecalled','start-service':'actionStarted','undo':'actionUndone','cancel-ticket':'cancelled','request-return':'returnRequested'};
    const ticket=[data.state.currentCall,...data.state.waiting,...data.state.passed,...(data.state.completed||[]),data.state.myTicket].find(x=>x?.id===result.ticketId);
    toast(action==='create'?t(result.reusedExistingTicket===true?'reused':'createdOk'):action==='settings'?t('saved'):action==='seed'?t('seeded'):`${ticket?.number||''} ${t(labels[action]||'actionOk')}`);
    if(action==='walk-in'&&ticket)confirmModal('showTicket',ticket.number,()=>{},true);

  }catch(err){
    if(err.code!=='NETWORK')pendingOperations.delete(fingerprint);
    if(err.status===401){app.auth=false;app.loaded=false;}
    if(err.code==='NETWORK'){app.online=false;app.error=err;}
    toast(errorText(err),true);await refresh();
  }finally{app.busy=false;render();}
}
function timeText(value,date=false){if(!value)return '—';const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(getLang()==='en'?'en-GB':'zh-CN',{timeZone:'Asia/Shanghai',...(date?{year:'numeric',month:'2-digit',day:'2-digit'}:{}),hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d):'—';}
function dateText(){return app.state?.businessDate||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function brand(link=true){return `<${link?'a':'div'} ${link?`href="${e(href('index.html'))}"`:''} class="brand"><span class="brand-seal">序</span><div><div class="brand-name">${t('brand')}</div><div class="brand-caption">${t('brandSub')}</div></div></${link?'a':'div'}>`;}
function language(){return `<div class="language" aria-label="Language"><button type="button" data-lang="zh" class="${getLang()==='zh'?'active':''}">中</button><button type="button" data-lang="en" class="${getLang()==='en'?'active':''}">EN</button></div>`;}
function storeSelect(){return `<select class="store-select" data-store aria-label="${t('settings')}">${(app.bootstrap?.stores||[]).map(x=>`<option value="${e(x.id)}" ${x.id===storeId?'selected':''}>${e(x.name)}</option>`).join('')}</select>`;}
function sync(){return `<span class="sync ${!app.loaded?'connecting':app.online?'':'offline'}" data-sync>${t(!app.loaded?'connecting':app.online?'live':'offline')}</span>`;}
function banner(){return app.error?`<div class="alert" role="alert"><span>${e(errorText(app.error))}</span><button class="link-button" data-action="refresh">${t('retry')}${icon('refresh')}</button></div>`:'';}
function badge(status){return `<span class="badge ${e(status)}">${statusText(status)}</span>`;}
function button(label,action,options={}){return `<button type="button" class="button ${options.class||''}" data-action="${action}" ${options.id?`data-id="${e(options.id)}"`:''} ${options.disabled||app.busy||(action==='voice'&&app.voiceBusy)?'disabled':''}>${options.icon?icon(options.icon):''}${app.busy&&options.primary?t('processing'):t(label)}</button>`;}
function empty(title='noWaiting',description='noWaitingHint'){return `<div class="empty"><span class="empty-icon">${icon('list')}</span><h3>${t(title)}</h3>${description?`<p>${t(description)}</p>`:''}</div>`;}
function footer(){return `<footer class="content-footer">${t('footer')}</footer>`;}
function qrURL(){const u=new URL('customer.html',app.qrBase||BASE);u.searchParams.set('store',storeId);return u.href;}
function qrMarkup(){return `<div class="qr-wrap"><div class="qr-code" data-qr="${e(qrURL())}" role="img" aria-label="${t('customer')}"></div><a class="qr-target" data-phone-link href="${e(qrURL())}" target="_blank" rel="noopener">${e(qrURL())}</a></div>`;}
function renderQR(){document.querySelectorAll('[data-qr]').forEach(el=>{try{if(typeof window.qrcode!=='function')throw Error();const qr=window.qrcode(0,'M');qr.addData(el.dataset.qr);qr.make();el.innerHTML=qr.createSvgTag({cellSize:4,margin:16,scalable:true});el.querySelector('svg')?.setAttribute('aria-hidden','true');}catch{el.textContent=t('qrUnavailable');}});}
function updateStatus(){document.querySelectorAll('[data-sync]').forEach(el=>{el.textContent=t(app.online?'live':'offline');el.classList.toggle('offline',!app.online);});let alert=document.querySelector('[data-settings-alert]');if(alert)alert.innerHTML=banner();document.querySelectorAll('[data-action="save-settings"],[data-action="reset"],[data-action="reset-all"]').forEach(el=>{el.disabled=!app.online||app.busy;});}
function renderNoServer(){root.innerHTML=`<div class="no-server">${brand()}<h1>${t('brand')}</h1><p>${t('noServer')}</p><code>http://127.0.0.1:8800/</code></div>`;}
function render(){
  const expanded=[...document.querySelectorAll('[data-ticket-details][open]')].map(x=>x.dataset.ticketDetails);
  const focused=document.activeElement?.id,selection=focused?{start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
  document.title=`${t(page==='home'?'home':page)} · ${t('brand')}`;
  if(location.protocol==='file:'){renderNoServer();return;}
  if(!app.bootstrap){root.innerHTML=`<div class="no-server">${brand()}<h1>${t('connecting')}</h1><p>${app.error?e(errorText(app.error)):''}</p>${app.error?button('retry','bootstrap',{class:'primary'}):''}${language()}</div>`;return;}
  if(page==='merchant'&&!app.auth){renderLogin();return;}
  if(!app.loaded){root.innerHTML=`<div class="no-server">${brand()}<h1>${t('connecting')}</h1>${banner()}</div>`;return;}
  if(page==='merchant')renderMerchant();else if(page==='customer')renderCustomer();else if(page==='display')renderDisplay();else renderHome();
  renderQR();
  document.querySelectorAll('[data-ticket-details]').forEach(x=>{x.open=expanded.includes(x.dataset.ticketDetails);});
  if(focused){const field=document.getElementById(focused);if(field&&['INPUT','TEXTAREA'].includes(field.tagName)){field.focus({preventScroll:true});try{field.setSelectionRange(selection.start,selection.end);}catch{}}}
}
function renderHome(){
  const s=app.state;
  root.innerHTML=`<header class="site-header">${brand()}<nav class="site-nav"><a href="${href('customer.html')}">${t('customer')}</a><a href="${href('merchant.html')}">${t('merchant')}</a><a href="${href('display.html')}">${t('display')}</a></nav><div class="top-controls">${language()}</div></header>
    <main class="home-container">${banner()}<div class="home-hero"><section><div class="eyebrow">${t('homeEyebrow')}</div><h1>${t('homeTitle')}</h1><p class="home-intro">${t('homeIntro')}</p><div class="hero-actions"><a class="button primary" href="${href('customer.html')}">${t('homeStart')}${icon('arrow')}</a><a class="button" href="${href('merchant.html')}">${t('homeStaff')}</a></div>${storeSelect()}<div class="hero-foot">${sync()}<span>${dateText()}</span></div></section>
    <section class="hero-art" aria-label="${t('queue')}"><svg class="art-sprig" viewBox="0 0 140 230" fill="none" stroke="currentColor"><path d="M20 230Q80 130 70 10M60 170Q0 145 20 95Q62 123 60 170M70 120Q120 95 125 48Q70 66 70 120M69 63Q27 37 49 5Q70 30 69 63"/></svg><div class="sample-ticket"><div class="eyebrow">YUNSHANGXU · ${t('currentLabel')}</div><div class="sample-number ${s.currentCall?'':'word'}">${s.currentCall?e(s.currentCall.number):t('displayWelcome')}</div>${badge(s.currentCall?'called':'waiting')}<div class="dash"></div><div class="sample-ticket-footer"><div><strong>${s.stats.waiting}</strong>${t('waitingCount')}</div><div><strong>${s.stats.completed}</strong>${t('completedCount')}</div></div></div><div class="floating-note">${icon('check')}<span>${t('nextHint')}</span></div></section></div>
    <section class="entrance-section"><div class="section-caption"><div class="eyebrow">${t('threePorts')}</div><span class="small-note">01 — 03</span></div><div class="entry-cards">${[['customer.html','customer','guestCard','qr'],['merchant.html','merchant','staffCard','grid'],['display.html','display','displayCard','screen']].map(([path,label,desc,ico])=>`<a class="entry-card" href="${href(path)}"><span class="entry-symbol">${icon(ico)}</span>${icon('arrow','entry-arrow')}<h2>${t(label)}</h2><p>${t(desc)}</p></a>`).join('')}</div></section>
    <section class="home-scan">${qrMarkup()}<div><h2>${t('scanTitle')}</h2><p>${t('phoneUrlHint')}</p><button class="link-button" data-action="copy">${t('copy')}${icon('link')}</button></div><form class="phone-form" id="phone-form"><label for="phone-url">${t('phoneUrl')}</label><div class="phone-input-row"><input id="phone-url" type="url" required value="${e(app.phoneDraft??app.qrBase.href)}"><button class="button" type="submit">${t('updateQR')}</button></div></form></section>${footer()}</main>`;
}
function renderLogin(){
  root.innerHTML=`<main class="login-layout"><section class="login-art">${brand()}<div class="login-art-copy"><div class="eyebrow">A LITTLE ORDER, A LOT OF CARE</div><h1>${t('loginTitle')}</h1><p>${t('footer')}</p></div><div class="small-note">YUNSHANGXU / QUEUE STUDIO</div></section><section class="login-form-wrap"><form class="login-form" id="login-form"><div class="top-controls"><a class="link-button" href="${href('index.html')}">← ${t('home')}</a>${language()}</div><div><div class="eyebrow">STAFF WORKSPACE</div><h2 style="margin:12px 0 8px">${t('merchant')}</h2><p class="muted">${t('loginSub')}</p></div>${storeSelect()}<div class="form-field"><label for="username">${t('account')}</label><input id="username" name="username" autocomplete="username" required value="${e(app.loginDraft.username)}"></div><div class="form-field"><label for="password">${t('password')}</label><input id="password" name="password" type="password" autocomplete="current-password" required value="${e(app.loginDraft.password)}"></div><button class="button primary wide" type="submit" ${app.busy?'disabled':''}>${t(app.busy?'processing':'login')}${icon('arrow')}</button><p class="muted">${t('demoCredentials')}</p><div class="login-links"><a href="${href('customer.html')}">${t('customer')}</a><a href="${href('display.html')}">${t('display')}</a></div></form></section></main>`;
}
function navItems(mobile=false){return [['dashboard','grid'],['history','clock'],['settings','settings']].map(([view,ico])=>`<button class="${mobile?'':'nav-item '}${app.view===view?'active':''}" data-view="${view}">${icon(ico)}<span>${t(view)}</span></button>`).join('');}
function renderMerchant(){
  root.innerHTML=`<div class="workspace"><aside class="sidebar">${brand()}<div class="sidebar-section">WORKSPACE</div><nav class="side-nav">${navItems()}</nav><div class="side-bottom"><a class="nav-item" href="${href('customer.html')}" target="_blank">${icon('qr')}${t('customer')}</a><a class="nav-item" href="${href('display.html')}" target="_blank">${icon('screen')}${t('display')}</a><a class="nav-item" href="${href('index.html')}">${icon('link')}${t('home')}</a><button class="nav-item" data-action="logout">${icon('logout')}${t('logout')}</button></div><div class="side-store"><span class="store-avatar">裳</span><div><div style="font-size:12px">${e(app.state.store.name)}</div><small>${dateText()}</small></div></div></aside><main class="workspace-main"><header class="workspace-topbar"><div class="crumb"><span>YUNSHANGXU</span><span>/</span><span>${t(app.view)}</span></div><div class="top-controls">${storeSelect()}${sync()}${button(app.voice?'soundOn':'soundOff','voice',{class:'small ghost voice-button',icon:'volume'})}${language()}</div></header><div class="mobile-utilities"><a href="${href('index.html')}">${t('home')}</a><a href="${href('customer.html')}" target="_blank">${t('customer')}</a><button data-action="logout">${t('logout')}</button></div><div class="workspace-content">${app.view==='dashboard'?dashboard():app.view==='history'?historyView():settingsView()}${footer()}</div></main><nav class="mobile-nav">${navItems(true)}<a href="${href('display.html')}">${icon('screen')}<span>${t('display')}</span></a></nav></div>`;
}
function heading(title,sub,extra=''){return `<div class="page-heading"><div><div class="eyebrow">${t('welcome')}</div><h1>${t(title)}</h1><p>${t(sub)}</p></div>${extra||`<div class="date-chip">${icon('sun')}${dateText()}</div>`}</div>`;}
function metric(label,value,ico,foot){return `<div class="metric"><div class="metric-top"><span>${t(label)}</span>${icon(ico)}</div><div class="metric-value">${value}<small>${t('people')}</small></div><div class="metric-bottom">${e(foot)}</div></div>`;}
function dashboard(){
  const s=app.state,c=s.currentCall,disabled=!app.online,next=s.waiting[0];
  let items=app.tab==='passed'?s.passed:app.tab==='completed'?s.completed:s.waiting;
  items=items.filter(x=>x.number.includes((app.queueSearch||'').toUpperCase()));
  const pages=Math.max(1,Math.ceil(items.length/8));app.listPage=Math.min(app.listPage,pages);
  const shown=items.slice((app.listPage-1)*8,app.listPage*8);
  const awaiting=c?.phase==='arriving';
  return `<div class="work-title"><div><h1>${t('dashboard')}</h1><p>${e(s.store.name)} · ${dateText()}</p></div>${button('walkIn','walk-in',{class:'small',icon:'users',disabled:disabled||!s.store.accepting})}</div>${banner()}
  <div class="metrics compact-metrics">${metric('waitingCount',s.stats.waiting,'users','')}${metric('completedCount',s.stats.completed,'check','')}${metric('passedCount',s.stats.passed,'clock','')}${metric('totalCount',s.stats.total,'qr',s.store.accepting?t('openTickets'):t('pausedTickets'))}</div>
  <div class="dashboard-grid"><div class="main-stack"><section class="panel now-panel"><div class="panel-head"><div class="panel-title"><span class="now-topline"></span><h2>${t('currentLabel')}</h2></div>${c?badge(c.phase):`<span class="small-note">${t('service')}</span>`}</div>
  <div class="current-stage"><div class="current-info"><div class="eyebrow">${t('service')}</div><div class="current-number ${c?'':'none'}" data-current-number>${c?e(c.number):t('noCurrent')}</div><div class="current-meta">${c?`<span>${t('calledAt')} ${timeText(c.calledAt,true)}</span><span>${t('passCount')} ${c.passCount}</span><span>${t('serviceDuration')} ${Math.floor(c.serviceSeconds/60)} ${t('minutes')}</span>`:`<span>${t('currentEmpty')}</span>`}</div></div>
  <div class="current-actions">${awaiting?button('startService','start-service',{class:'green',disabled}):button('complete','complete-current',{class:'green',icon:'check',disabled:disabled||!c})}${button('recall','recall-current',{icon:'volume',disabled:disabled||!c})}${button('pass','pass-current',{class:'soft',icon:'clock',disabled:disabled||!c})}</div></div>
  <div class="next-row"><div><span class="small-note">${t('nextGuest')}</span><strong class="next-number">${next?e(next.number):'—'}</strong>${c?`<span class="small-note">${t('busyHint')}</span>`:''}</div><div class="next-actions">${c&&next?button('completeNext','complete-next',{class:'primary',disabled:disabled||awaiting}):''}${button('callNext','call-next',{class:c?'':'primary',primary:true,icon:'arrow',disabled:disabled||!!c||!next})}</div></div></section>
  ${s.undo?`<div class="undo-bar"><span>${e(s.undo.number)} · ${t(s.undo.kind==='passed'?'actionPassed':'actionCompleted')}<small>${t('undoHint')}</small></span>${button('undo','undo',{class:'small',disabled})}</div>`:''}
  <section class="panel queue-panel"><div class="panel-head"><div class="tabs">${[['waiting','queue',s.stats.waiting],['passed','missedQueue',s.stats.passed],['completed','completedList',s.stats.completed]].map(([tab,key,count])=>`<button class="tab ${app.tab===tab?'active':''}" data-tab="${tab}">${t(key)}<span class="count">${count}</span></button>`).join('')}</div><button class="link-button" data-view="history">${t('viewAll')}${icon('arrow')}</button></div>
  <form id="queue-search" class="queue-search"><input id="queue-number" maxlength="16" pattern="[Hh0-9]*" placeholder="${t('searchNumber')}" aria-label="${t('searchNumber')}" value="${e(app.queueSearchDraft)}"><button class="button small" type="submit">${t('search')}</button>${app.queueSearch?button('clearSearch','clear-search',{class:'small ghost'}):''}</form>
  ${shown.length?`<div class="table-scroll"><table class="queue-table"><thead><tr><th>#</th><th>${t('number')}</th><th>${t('created')}</th><th>${t('passCount')}</th><th>${app.tab==='completed'?t('endedAt'):t('status')}</th><th>${t('action')}</th></tr></thead><tbody>${shown.map((x,i)=>`<tr><td><span class="queue-rank">${(app.listPage-1)*8+i+1}</span></td><td><span class="ticket-num">${e(x.number)}</span><div class="small-note ticket-service-line">${t('service')} · ${t(x.source==='demo'?'demoGuest':x.source==='walkin'?'walkin':'guest')}</div><div class="mobile-wait">${x.status==='waiting'?`${t('waited')} ${Math.max(0,Math.floor((Date.parse(s.serverTime)-Date.parse(x.createdAt))/60000))} ${t('minutes')}`:x.status==='completed'?timeText(x.completedAt,true):t('passed')}</div><details class="ticket-details" data-ticket-details="${e(x.id)}"><summary>${t('details')}</summary><p>${t('service')}</p><p>${t('created')} ${timeText(x.createdAt,true)}</p><p>${t('passCount')} ${x.passCount}</p>${x.completedAt?`<p>${t('endedAt')} ${timeText(x.completedAt,true)}</p>`:''}</details></td><td>${timeText(x.createdAt,true)}</td><td>${x.passCount}</td><td>${x.returnRequested?`<span class="badge called">${t('returnBadge')}</span>`:app.tab==='completed'?timeText(x.completedAt,true):badge(x.status)}</td><td>${app.tab==='passed'?button('recallSpecific','recall-specific',{id:x.id,class:'small soft',disabled:disabled||!!c}):'<span class="small-note">—</span>'}</td></tr>`).join('')}</tbody></table></div>`:empty(app.queueSearch?'noMatch':app.tab==='passed'?'noPassed':app.tab==='completed'?'noCompleted':'noWaiting','')}
  <div class="table-footer"><span>${items.length} ${t('people')}</span><div class="pager">${button('previous','queue-prev',{class:'small',disabled:app.listPage<=1})}<span>${app.listPage} / ${pages}</span>${button('next','queue-next',{class:'small',disabled:app.listPage>=pages})}</div></div></section></div>
  <div class="aside-stack"><section class="panel activity-panel"><div class="panel-head"><h3>${t('recent')}</h3><span class="small-note">${t('today')}</span></div><div class="activity-list">${s.events.length?s.events.slice(0,5).map(x=>`<div class="activity"><div class="activity-head"><span>${e(x.number)} ${eventText(x.action)}</span><time>${timeText(x.at)}</time></div>${x.detail?`<div class="activity-detail">${e(getLang()==='en'?eventText(x.action):x.detail)}</div>`:''}</div>`).join(''):empty('noEvents','')}</div></section>
  <details class="panel qr-panel" data-qr-details ${app.qrOpen?'open':''}><summary>${icon('qr')}${t('queueQR')}</summary><p>${t('scanHint')}</p>${qrMarkup()}${button('copy','copy',{class:'wide',icon:'link'})}<a class="link-button" href="${href('customer.html')}" target="_blank">${t('openCustomer')}${icon('arrow')}</a></details>
  <details class="panel demo-tools"><summary>${t('demoTools')}</summary><p>${t('seedText')}</p>${button('addDemo','seed',{class:'small',disabled})}</details></div></div>`;
}
async function loadHistory(){
  if(!app.auth||app.view!=='history')return;
  const id=++historyRequest;
  app.historyLoading=true;
  render();
  try{const result=await request('history',{query:{date:app.historyDate,status:app.historyStatus,page:app.historyPage,dateTo:app.historyDateTo||app.historyDate,number:app.historyNumber,source:app.historySource}});if(id!==historyRequest)return;const h=result.history;if(!h||!Array.isArray(h.items)||!['total','page','pages'].every(k=>Number.isInteger(h[k]))||h.total<0||h.page<1||h.pages<h.page||!h.items.every(x=>typeof x.id==='string'&&/^H\d+$/.test(x.number)&&['waiting','called','passed','completed','expired','cancelled'].includes(x.status)&&x.businessDate>=app.historyDate&&x.businessDate<=(app.historyDateTo||app.historyDate)&&Number.isFinite(Date.parse(x.createdAt))))throw new ApiError('CONTRACT',t('contractError'));app.history=h;app.historyError=null;app.historyPage=h.page;app.historyLoading=false;if(app.view==='history')render();}
  catch(err){if(id!==historyRequest)return;app.historyLoading=false;app.history=null;app.historyError=err;if(err.status===401){app.auth=false;app.loaded=false;}toast(errorText(err),true);render();}
}
function historyView(){
  const h=app.history,summary=h?.summary;
  const exportUrl=new URL('api/export',BASE);for(const[k,v]of Object.entries({store:storeId,date:app.historyDate,dateTo:app.historyDateTo||app.historyDate,status:app.historyStatus,number:app.historyNumber,source:app.historySource}))exportUrl.searchParams.set(k,v);
  return `${heading('history','historySubtitle',`<a class="button small" href="${e(exportUrl.href)}" download>${icon('download')}${t('export')}</a>`)}${banner()}${app.historyError?`<div class="alert"><span>${e(errorText(app.historyError))}</span><button class="link-button" data-action="retry-history">${t('retry')}</button></div>`:''}<section class="panel"><form id="history-filters" class="filters"><label>${t('date')}<input type="date" data-history-date value="${e(app.historyDate)}"></label><label>${t('dateTo')}<input type="date" data-history-end value="${e(app.historyDateTo||app.historyDate)}" min="${e(app.historyDate)}"></label><label>${t('status')}<select data-history-status>${['','waiting','called','passed','completed','expired','cancelled'].map(x=>`<option value="${x}" ${app.historyStatus===x?'selected':''}>${t(x||'all')}</option>`).join('')}</select></label><label>${t('source')}<select data-history-source>${['','customer','walkin','demo'].map(x=>`<option value="${x}" ${app.historySource===x?'selected':''}>${t(x==='customer'?'guest':x==='demo'?'demoGuest':x||'all')}</option>`).join('')}</select></label><div class="filter-search"><input id="history-number" maxlength="16" pattern="[Hh0-9]*" placeholder="${t('searchNumber')}" aria-label="${t('searchNumber')}" value="${e(app.historyNumber)}"><button class="button small" type="submit">${t('search')}</button></div></form>
  ${summary?`<div class="history-summary"><span>${t('rangeSummary')} ${h.total}</span><span>${t('averageWait')} ${summary.averageWait??'—'} ${t('minutes')}</span><span>${t('averageService')} ${summary.averageService??'—'} ${t('minutes')}</span><span>${t('missedTickets')} ${summary.missed} (${h.total?Math.round(summary.missed/h.total*100):0}%)</span><span>${t('cancelled')} ${summary.cancelled}</span></div>`:''}
  ${h?.items?.length?`<div class="table-scroll"><table><thead><tr><th>${t('number')}</th><th>${t('status')}</th><th>${t('created')}</th><th>${t('calledAt')}</th><th>${t('endedAt')}</th><th>${t('passCount')}</th><th>${t('serviceDuration')}</th><th>${t('source')}</th><th>${t('operator')}</th></tr></thead><tbody>${h.items.map(x=>`<tr><td><span class="ticket-num">${e(x.number)}</span></td><td>${badge(x.status)}</td><td>${timeText(x.createdAt,true)}</td><td>${timeText(x.calledAt,true)}</td><td>${timeText(x.completedAt,true)}</td><td>${x.passCount}</td><td>${Math.round(x.serviceSeconds/6)/10} ${t('minutes')}</td><td>${t(x.source==='walkin'?'walkin':x.source==='demo'?'demoGuest':'guest')}</td><td>${e(x.operator)||'—'}</td></tr>`).join('')}</tbody></table></div>`:empty(app.historyLoading?'connecting':'emptyHistory','')}<div class="table-footer"><span>${h?.total||0} ${t('people')}</span><div class="pager">${button('previous','history-prev',{class:'small',disabled:!h||h.page<=1||app.historyLoading})}<span>${h?.page||1} / ${h?.pages||1}</span>${button('next','history-next',{class:'small',disabled:!h||h.page>=h.pages||app.historyLoading})}</div></div></section>`;
}
function settingsView(){
  const d=app.settingsDraft||{...app.state.store};
  return `<div class="settings-layout">${heading('settings','settingsTitle')}<div data-settings-alert>${banner()}</div><section class="panel"><div class="panel-head"><div class="panel-title">${icon('settings')}<h2>${e(app.state.store.name)}</h2></div><span class="badge ${d.accepting?'serving':'paused'}" data-store-status>${t(d.accepting?'openTickets':'pausedTickets')}</span></div><form id="settings-form" class="panel-body settings-form"><div class="switch-row"><div class="form-field"><label for="accepting">${t('acceptingLabel')}</label><small>${t('acceptingHint')}</small></div><input id="accepting" name="accepting" type="checkbox" ${d.accepting?'checked':''}></div><div class="switch-row"><div class="form-field"><label for="confirm-arrival">${t('confirmArrival')}</label><small>${t('arrivalHint')}</small></div><input id="confirm-arrival" name="confirmArrival" type="checkbox" ${d.confirmArrival?'checked':''}></div><div class="switch-row"><label for="cancel-enabled">${t('cancelEnabled')}</label><input id="cancel-enabled" name="cancelEnabled" type="checkbox" ${d.cancelEnabled?'checked':''}></div><div class="form-field"><label for="staff-label">${t('operator')}</label><input id="staff-label" maxlength="24" value="${e(app.operator)}"><small>${t('operatorHint')}</small></div><div class="form-field"><label for="service-minutes">${t('minutesLabel')} (${t('minutes')})</label><input id="service-minutes" name="serviceMinutes" type="number" min="1" max="120" step="1" required value="${d.serviceMinutes}"></div><div class="form-field"><label for="notice">${t('noticeLabel')}</label><textarea id="notice" name="notice" maxlength="180" rows="3">${e(d.notice)}</textarea></div><div>${button('save','save-settings',{class:'primary',disabled:!app.online})}</div></form></section><section class="panel danger-zone"><div class="panel-head"><h2>${t('resetTitle')}</h2></div><div class="panel-body"><p>${t('resetText')}</p>${button('reset','reset',{class:'soft',disabled:!app.online})}<hr><h3>${t('resetAll')}</h3><p>${t('resetAllText')}</p>${button('resetAll','reset-all',{class:'soft',disabled:!app.online})}</div></section></div>`;
}
function renderCustomer(){
  const s=app.state,x=s.myTicket,active=x&&['waiting','called','passed'].includes(x.status),isCalling=x?.status==='called',isWaiting=x?.status==='waiting',isPassed=x?.status==='passed';
  const cooldown=x?.status==='cancelled'?Math.max(0,30-Math.floor((Date.parse(s.serverTime)-Date.parse(x.completedAt))/1000)):0;
  const phase=x?.status==='called'?x.phase:x?.status;
  const tip=phase==='serving'?'servingTip':isCalling?'calledTip':isPassed?'passedTip':x?.status==='completed'?'completedTip':x?.status==='cancelled'?'cancelledTip':'waitingTip';
  let eta='';if(isWaiting){const n=x.estimatedMinutes;eta=n<=1?t('nearTurn'):`${getLang()==='en'?'About':'约'} ${Math.max(1,n-2)}—${n+3} ${t('minutes')}`;}
  root.innerHTML=`<main class="customer-shell"><header class="customer-header">${brand()}${language()}</header><div class="customer-store"><div><strong>${e(s.store.name)}</strong><span>${e(s.store.address)}</span></div><details><summary>${t('switchStore')}</summary><p>${t('switchStoreText')}</p>${storeSelect()}</details></div><div class="customer-toolbar">${sync()}<a class="link-button" href="${href('index.html')}">← ${t('home')}</a></div><section class="customer-intro"><h1>${x?t('myTicket'):t('customerTitle')}</h1>${!x?`<p>${t('customerIntro')}</p>`:''}</section>${banner()}${!s.store.accepting?`<div class="notice-card">${icon('pause')}<p>${t('pausedNote')}</p></div>`:''}
  <section class="ticket ${isCalling?'calling':''}" aria-live="polite"><div class="ticket-top"><span>${t('myTicket')}</span><span>${dateText()}</span></div><div class="ticket-main">${x?`<div class="ticket-label">${t('yourNumber')}</div><div class="customer-number" data-my-number>${e(x.number)}</div>${badge(phase)}<p class="ticket-service" data-service-type>${t('serviceType')} · ${t('service')}</p><p class="ticket-tip">${t(tip)}</p>`:`<div class="ticket-empty-art">${icon('qr')}</div><h2 class="ticket-empty-title">${t('noTicket')}</h2><p class="ticket-tip">${t('noTicketSub')}</p>`}</div>
  ${isWaiting?`<div class="ticket-stats"><div><strong data-ahead>${x.ahead}<small>${t('people')}</small></strong><p>${t('ahead')}</p></div><div><strong class="eta-range">${eta}</strong><p>${t('estimate')}</p></div></div>${x.currentOverdue?`<p class="overdue-note">${t('currentOverdue')}</p>`:''}`:isCalling?`<div class="customer-next-step">${t(phase==='serving'?'serving':'calledAction')}</div>`:isPassed?`<div class="customer-next-step">${x.returnRequested?t('returnRequested'):t('passedTip')}</div>`:x?`<div class="customer-next-step">${t(x.status==='cancelled'?'cancelledAt':'finishedAt')} ${timeText(x.completedAt,true)}</div>`:''}
  <div class="ticket-bottom">${active?`<div class="auto-state">${t(app.online?'autoUpdate':'offline')}</div>${isPassed?button(x.returnRequested?'returnRequested':'requestReturn','request-return',{class:'primary wide',disabled:!app.online||x.returnRequested}):''}${button('refresh','refresh',{class:'ghost small',icon:'refresh',disabled:!app.online})}${isWaiting||isPassed?button('cancelQueue','cancel-ticket',{class:'ghost small',disabled:!app.online||!s.store.cancelEnabled}):''}`:button(x?'takeAgain':'take','create',{class:'primary wide',primary:true,icon:'arrow',disabled:!app.online||!s.store.accepting||cooldown>0})}${cooldown>0?`<p class="small-note">${t('cancelCooldown')} · ${cooldown}s</p>`:''}<p class="ticket-time">${x?`${t('created')} ${timeText(x.createdAt,true)}`:e(s.store.name)}</p></div></section>
  ${active?`<div class="foreground-reminder">${button(app.customerAlerts?'alertsOn':'foregroundAlert','customer-alerts',{class:'small ghost'})}<p>${t('backgroundNote')}</p></div>`:''}<p class="customer-note">${t('estimateNote')}</p><section class="customer-summary"><div><strong>${s.stats.waiting}</strong><p>${t('waitingCount')}</p></div><div><strong>${s.stats.passed}</strong><p>${t('passedCount')}</p></div><div><strong>${s.stats.completed}</strong><p>${t('completedCount')}</p></div></section><section class="notice-card">${icon('bell')}<div><h3>${t('storeNotice')}</h3><p>${e(s.store.notice)}</p></div></section>${!x?`<section class="customer-steps"><div class="eyebrow">${t('howItWorks')}</div>${[1,2,3].map(i=>`<div class="step"><span class="step-index">0${i}</span><div><h3>${t('step'+i)}</h3><p>${t('step'+i+'Text')}</p></div></div>`).join('')}</section>`:''}${footer()}</main>`;
}
function renderDisplay(){
  const s=app.state,c=s.currentCall,pages=Math.max(1,Math.ceil(Math.max(0,s.waiting.length-3)/9));app.displayPage%=pages;
  const slice=[...s.waiting.slice(0,3),...s.waiting.slice(3+app.displayPage*9,3+app.displayPage*9+9)];
  root.innerHTML=`<main class="display-shell"><header class="display-header">${brand()}<div class="top-controls">${storeSelect()}${sync()}${button(app.voice?'soundOn':'soundOff','voice',{class:'small',icon:'volume'})}${button('fullScreen','fullscreen',{class:'small',icon:'screen'})}${language()}</div></header>${banner()}<div class="display-grid"><section class="display-current" aria-live="polite"><div class="eyebrow">${t('currentLabel')}</div><div class="display-number ${c?(app.highlightUntil>Date.now()?'call-highlight':''):'word'}" data-display-number>${c?e(c.number):t('displayWelcome')}</div><p class="display-invite">${t(c?'displayInvite':'nextHint')}</p><small>${t('service')}${c?` · ${timeText(c.calledAt,true)}`:''}</small></section><section class="display-queue"><div class="display-queue-head"><h2>${t('queue')}</h2><small>${s.stats.waiting} ${t('people')}</small></div>${slice.length?`<div class="display-queue-list">${slice.map((x,i)=>`<div class="display-queue-card"><strong>${e(x.number)}</strong><small>${i===0?t('soon'):t('waiting')}</small></div>`).join('')}</div>`:empty()}<div class="display-pagination"><span>${t('allPages')}</span><span>${app.displayPage+1} / ${pages}</span></div></section></div><footer class="display-footer"><span>${e(s.store.name)} · ${t('footer')}</span><time class="display-clock" data-clock></time></footer></main>`;
  updateClock();
}
function updateClock(){document.querySelectorAll('[data-clock]').forEach(el=>{el.textContent=new Intl.DateTimeFormat(getLang()==='en'?'en-GB':'zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());});}
function announce(current,force=false){
  if(!['merchant','display'].includes(page))return;
  const signature=current?`${current.id}:${current.callCount}`:'';
  const changed=app.voiceInitialized===true&&signature!==app.voiceSignature;
  app.voiceInitialized=true;
  app.voiceSignature=signature;
  if(!app.voice||!current||(!force&&!changed)||!('speechSynthesis' in window))return;
  const sentence=getLang()==='en'?`Ticket ${current.number.split('').join(' ')}. Please come to reception.`:`请 ${current.number.split('').join(' ')} 号顾客，到接待处办理。`;
  try{const utterance=new SpeechSynthesisUtterance(sentence);utterance.lang=getLang()==='en'?'en-US':'zh-CN';utterance.rate=.88;speechSynthesis.cancel();speechSynthesis.speak(utterance);}catch{app.voice=false;leaseVoice(false).catch(()=>{});write('voice','off');toast(t('noVoice'),true);}
}
function toast(message,error=false){document.querySelectorAll(error?'.toast.error':'.toast:not(.error)').forEach(x=>x.remove());const node=document.createElement('div');node.className='toast'+(error?' error':'');node.setAttribute('role',error?'alert':'status');node.innerHTML=`${icon(error?'bell':'check')}<span>${e(message)}</span>${error?'<button class="toast-close" aria-label="Close">×</button>':''}`;node.querySelector('button')?.addEventListener('click',()=>node.remove());document.querySelector('#toasts').append(node);setTimeout(()=>node.remove(),error?7000:2500);}
function confirmModal(title,text,callback,literal=false){
  const host=document.querySelector('#modal-root'),previous=document.activeElement;
  host.innerHTML=`<div class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="eyebrow">${t('brand')}</div><h2 id="modal-title">${t(title)}</h2><p>${literal?e(text):t(text)}</p><div class="modal-buttons"><button class="button" data-modal-cancel>${t('cancel')}</button><button class="button primary" data-modal-confirm>${t('confirm')}</button></div></section></div>`;
  const cancel=host.querySelector('[data-modal-cancel]'),confirm=host.querySelector('[data-modal-confirm]');
  const close=()=>{host.innerHTML='';previous?.focus();};cancel.onclick=close;confirm.onclick=()=>{close();callback();};cancel.focus();
  host.onkeydown=evt=>{if(evt.key==='Escape')close();if(evt.key==='Tab'){evt.preventDefault();(document.activeElement===cancel?confirm:cancel).focus();}};
}
async function copyLink(){try{await navigator.clipboard.writeText(qrURL());toast(t('copied'));}catch{const input=document.createElement('textarea');try{input.value=qrURL();document.body.append(input);input.select();const ok=document.execCommand?.('copy');toast(ok?t('copied'):qrURL(),!ok);}catch{toast(qrURL(),true);}finally{input.remove();}}}
function restorePhoneOrigin(){try{const saved=read('phoneOrigin');if(!saved)return;const u=new URL(saved);if(['http:','https:'].includes(u.protocol))app.qrBase=new URL(BASE.pathname,u.origin);}catch{}}
function setView(view){app.view=view;app.settingsDraft=null;render();if(view==='history')loadHistory();}
root.addEventListener('click',async evt=>{
  const langButton=evt.target.closest('[data-lang]');if(langButton){setLang(langButton.dataset.lang);return;}
  const view=evt.target.closest('[data-view]');if(view){setView(view.dataset.view);return;}
  const tab=evt.target.closest('[data-tab]');if(tab){app.tab=tab.dataset.tab;app.listPage=1;render();return;}
  const target=evt.target.closest('[data-action]');if(!target||target.disabled)return;
  const action=target.dataset.action;
  if(action==='bootstrap')return bootstrap();
  if(action==='refresh')return refresh();
  if(action==='copy')return copyLink();
  if(action==='queue-prev'||action==='queue-next'){app.listPage+=action==='queue-next'?1:-1;render();return;}
  if(action==='history-prev'||action==='history-next'){app.historyPage+=action==='history-next'?1:-1;return loadHistory();}
  if(action==='fullscreen'){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast(t('fullscreenUnavailable'),true);}return;}
  if(action==='voice'){
    if(app.voiceBusy)return;
    if(!('speechSynthesis' in window)){toast(t('noVoice'),true);return;}
    app.voiceBusy=true;const enable=!app.voice;render();
    try{await leaseVoice(enable);app.voice=enable;if(enable){toast(t('voiceReady'));announce(app.state?.currentCall,true);}else{try{speechSynthesis.cancel();}catch{}}}catch(err){toast(errorText(err),true);}finally{app.voiceBusy=false;render();}return;
  }
  if(action==='logout'){try{if(app.voice){app.voice=false;try{await leaseVoice(false);speechSynthesis.cancel();}catch{}}await request('logout',{method:'POST',body:{},retry:false});app.auth=false;app.loaded=false;app.state=null;app.loginDraft.password='';render();}catch(err){toast(errorText(err),true);}return;}
  if(action==='seed')return confirmModal('addDemo','seedText',()=>mutate('seed',{count:6}));
  if(action==='reset')return confirmModal('confirmReset','resetText',()=>mutate('reset',{confirmation:'RESET_TODAY'}));
  if(action==='retry-history')return loadHistory();
  if(action==='reset-all')return confirmModal('resetAll','resetAllText',()=>mutate('reset',{scope:'all',confirmation:'RESET_ALL_DEMO'}));
  if(action==='save-settings')return submitSettings();
  if(action==='create')return mutate('create');
  if(action==='clear-search'){app.queueSearch=app.queueSearchDraft='';app.listPage=1;render();return;}
  if(action==='walk-in')return confirmModal('walkIn','walkInText',()=>mutate('walk-in'));
  if(action==='customer-alerts'){app.customerAlerts=!app.customerAlerts;if(app.customerAlerts){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){app.alertAudio ||= new Audio();await app.alertAudio.resume();}}catch{}}render();return;}
  if(action==='cancel-ticket'){const x=app.state.myTicket;if(x)return confirmModal('cancelQueue','cancelQueueText',()=>mutate(action,{ticketId:x.id,expectedVersion:x.version,confirmation:'CANCEL_TICKET'}));return;}
  if(action==='request-return'){const x=app.state.myTicket;if(x)return mutate(action,{ticketId:x.id,expectedVersion:x.version});return;}
  if(action==='undo'){const x=app.state.undo;if(x)return mutate(action,{ticketId:x.ticketId,expectedVersion:x.version});return;}
  if(action==='start-service'){const c=app.state.currentCall;if(c)return mutate(action,{ticketId:c.id,expectedVersion:c.version});return;}
  if(action==='complete-next'){const c=app.state.currentCall,n=app.state.waiting[0];if(c&&n)return confirmModal('completeNext',`${c.number} → ${n.number} · ${t('completeNextText')}`,()=>mutate(action,{ticketId:c.id,expectedVersion:c.version,nextTicketId:n.id}),true);return;}

  if(action==='recall-specific'){
    const item=app.state.passed.find(x=>x.id===target.dataset.id);if(item)return mutate(action,{ticketId:item.id,expectedVersion:item.version});return;
  }
  if(['recall-current','pass-current','complete-current'].includes(action)){
    const current=app.state.currentCall;if(current)return mutate(action,{ticketId:current.id,expectedVersion:current.version});return;
  }
  if(action==='call-next')return mutate(action);
});
root.addEventListener('change',evt=>{
  if(evt.target.matches('[data-store]')){const chosen=evt.target.value,go=()=>{const u=new URL(location.href);u.searchParams.set('store',chosen);location.href=u.href;};if(page==='customer'&&app.state?.myTicket){evt.target.value=storeId;confirmModal('switchStore','switchStoreText',go);}else go();return;}
  if(evt.target.matches('[data-history-date]')){app.historyDate=evt.target.value;app.historyDateTo=null;app.historyDatePinned=true;app.historyPage=1;app.history=null;loadHistory();}
  if(evt.target.matches('[data-history-end]')){app.historyDateTo=evt.target.value;app.historyPage=1;app.history=null;loadHistory();}
  if(evt.target.matches('[data-history-source]')){app.historySource=evt.target.value;app.historyPage=1;app.history=null;loadHistory();}
  if(evt.target.matches('[data-history-status]')){app.historyStatus=evt.target.value;app.historyPage=1;app.history=null;loadHistory();}
});
root.addEventListener('input',evt=>{
  if(evt.target.id==='queue-number')app.queueSearchDraft=evt.target.value;
  if(evt.target.id==='history-number')app.historyNumber=evt.target.value;
  if(evt.target.id==='staff-label'){app.operator=evt.target.value;write('operator',app.operator);}
  if(evt.target.id==='phone-url')app.phoneDraft=evt.target.value;
  if(evt.target.closest('#login-form')&&['username','password'].includes(evt.target.name))app.loginDraft[evt.target.name]=evt.target.value;
  if(evt.target.closest('#settings-form')){const form=document.querySelector('#settings-form');app.settingsDraft={accepting:form.accepting.checked,serviceMinutes:form.serviceMinutes.value,notice:form.notice.value,confirmArrival:form.confirmArrival.checked,cancelEnabled:form.cancelEnabled.checked};}
});
function submitSettings(){const form=document.querySelector('#settings-form');if(!form?.reportValidity())return;const draft={accepting:form.accepting.checked,serviceMinutes:Number(form.serviceMinutes.value),notice:form.notice.value,confirmArrival:form.confirmArrival.checked,cancelEnabled:form.cancelEnabled.checked};app.settingsDraft=draft;mutate('settings',draft);}
root.addEventListener('submit',async evt=>{
  evt.preventDefault();
  if(evt.target.id==='queue-search'){app.queueSearch=app.queueSearchDraft.trim();app.listPage=1;render();return;}
  if(evt.target.id==='history-filters'){app.historyPage=1;loadHistory();return;}
  if(evt.target.id==='phone-form'){
    try{const input=new URL(evt.target.querySelector('input').value);if(!['http:','https:'].includes(input.protocol))throw Error();app.qrBase=new URL(BASE.pathname,input.origin);app.phoneDraft=null;write('phoneOrigin',input.origin);channel?.postMessage({type:'phone-origin'});render();}catch{toast(t('contractError'),true);}return;
  }
  if(evt.target.id==='settings-form')return submitSettings();
  if(evt.target.id!=='login-form'||app.busy)return;
  const data={username:evt.target.username.value,password:evt.target.password.value};app.busy=true;renderLogin();
  try{await request('login',{method:'POST',body:data,retry:false});app.auth=true;app.loginDraft.password='';app.view='dashboard';await refresh();}
  catch(err){toast(errorText(err),true);}finally{app.busy=false;render();}
});
root.addEventListener('toggle',evt=>{if(evt.target.matches('[data-qr-details]'))app.qrOpen=evt.target.open;},true);
window.addEventListener('queue:language',()=>{render();});
channel?.addEventListener('message',evt=>{if(evt.data?.type==='updated')refresh();if(evt.data?.type==='phone-origin'){restorePhoneOrigin();render();}});
window.addEventListener('storage',evt=>{if(evt.key===namespace+'phoneOrigin'){restorePhoneOrigin();render();}});
window.addEventListener('online',()=>refresh());
window.addEventListener('offline',()=>{app.online=false;app.error=new ApiError('OFFLINE',t('offline'));render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
setInterval(updateClock,1000);
setInterval(async()=>{if(app.voice&&!app.voiceBusy&&!app.voiceRenewing){app.voiceRenewing=true;try{await leaseVoice(true);}catch(err){app.voice=false;try{speechSynthesis.cancel();}catch{}toast(errorText(err),true);render();}finally{app.voiceRenewing=false;}}},4000);
setInterval(()=>{if(page==='display'&&app.loaded){app.displayPage++;render();}},8000);
window.QueueDemo = {getState:()=>app.state,refresh};
bootstrap();
