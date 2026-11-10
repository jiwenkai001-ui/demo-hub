(() => {
  'use strict';
  const icons = {
    spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/><path d="m20 2 .7 2.3L23 5l-2.3.7L20 8l-.7-2.3L17 5l2.3-.7L20 2Z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    folder:'<path d="M3 7V5a2 2 0 0 1 2-2h4l3 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 9h18"/>',
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 12h8M8 16h6"/>',
    pen:'<path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6 5-2"/>',
    building:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/>',
    template:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
    shield:'<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z"/><path d="m8 12 3 3 5-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings:'<path d="m9 4 1-2h4l1 2 2 1 2-.2 2 3-1 2v3l1 2-2 3-2-.2-2 1-1 3h-4l-1-3-2-1-2 .2-2-3 1-2v-3L3 8l2-3 2 .2Z"/><circle cx="12" cy="12" r="3"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
    download:'<path d="M12 3v13m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h2m3 0h2"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    play:'<path d="m9 5 11 7-11 7V5Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    alert:'<path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2.3 2.3 0 0 0-4 0Z"/><path d="M12 9v4m0 4h.01"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    book:'<path d="M12 5S7 2 2 4v15c5-2 10 1 10 1s5-3 10-1V4c-5-2-10 1-10 1Zm0 0v15"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"/>',
    save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-7h10v7"/>',
  };
  const icon = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.doc}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const STORE = 'bidpilot-demo-v1';
  const labels = {dashboard:'工作台',projects:'投标项目',editor:'AI 智能编标',materials:'企业资料库',templates:'标书模板',risks:'合规检查',settings:'设置中心'};
  const statuses = {drafting:['编写中','blue'],review:['待审核','orange'],ready:['已完成','green'],pending:['待解析','gray']};
  const chapterNames = ['投标函','企业基本情况','项目需求理解','技术实施方案','项目组织与人员配置','质量保障措施','进度计划与交付','售后服务方案'];
  function seed() {
    return {
      selected:'p1', projects:[
        {id:'p1',name:'智慧园区数字化平台建设项目',code:'ZC-2026-1028',buyer:'杭州新城产业发展有限公司',type:'信息技术',budget:'128',due:'2026-11-08',status:'drafting',progress:65,file:'智慧园区数字化平台建设项目_招标文件.pdf',chapters:{}},
        {id:'p2',name:'市政服务中心物业管理服务采购',code:'ZC-2026-1025',buyer:'某市政务服务中心',type:'物业服务',budget:'86',due:'2026-11-05',status:'review',progress:100,file:'物业管理服务采购招标文件.pdf',chapters:{}},
        {id:'p3',name:'实验中学智慧教学设备采购',code:'ZC-2026-1022',buyer:'某市实验中学',type:'设备采购',budget:'215',due:'2026-11-12',status:'drafting',progress:32,file:'教学设备采购招标文件.pdf',chapters:{}},
        {id:'p4',name:'企业官网及品牌展示平台升级',code:'ZC-2026-1019',buyer:'华信实业集团有限公司',type:'信息技术',budget:'42',due:'2026-11-02',status:'ready',progress:100,file:'品牌展示平台升级招标文件.pdf',chapters:{}},
        {id:'p5',name:'总部办公楼空调设备更新采购',code:'ZC-2026-1016',buyer:'某产业投资集团',type:'设备采购',budget:'165',due:'2026-11-15',status:'drafting',progress:18,file:'空调设备采购招标文件.pdf',chapters:{}},
        {id:'p6',name:'公共数据安全运维服务项目',code:'ZC-2026-1012',buyer:'某市公共数据运营中心',type:'信息技术',budget:'96',due:'2026-11-03',status:'ready',progress:100,file:'数据安全运维招标文件.pdf',chapters:{}}
      ],
      materials:[
        {id:'m1',name:'企业营业执照',category:'企业资质',file:'营业执照_副本.pdf',valid:'长期有效',desc:'杭州云启科技有限公司 · 统一社会信用代码已脱敏',color:'blue'},
        {id:'m2',name:'ISO 9001 质量管理体系认证',category:'企业资质',file:'质量管理体系认证证书.pdf',valid:'2027-08-16',desc:'质量管理体系认证 · 适用于信息技术服务',color:'green'},
        {id:'m3',name:'智慧园区平台建设案例',category:'项目业绩',file:'2025年度智慧园区案例.pdf',valid:'长期有效',desc:'2025 年 · 数字化平台建设 · 合同及验收资料',color:'purple'},
        {id:'m4',name:'项目经理资格与履历',category:'人员资料',file:'项目经理_资格及履历.pdf',valid:'2027-06-30',desc:'高级项目管理资格 · 8 年项目交付经验',color:'orange'},
        {id:'m5',name:'企业产品技术白皮书',category:'产品资料',file:'产品技术白皮书_V3.pdf',valid:'长期有效',desc:'平台架构、功能清单及技术参数说明',color:'blue'},
        {id:'m6',name:'2025 年度财务审计报告',category:'财务资料',file:'2025年度审计报告.pdf',valid:'长期有效',desc:'资产负债表、利润表及现金流量表',color:'green'}
      ],
      risks:[
        {id:'r1',projectId:'p1',title:'项目经理社保证明尚未提供',level:'red',levelText:'高风险',desc:'招标文件第 18 页要求提供拟派项目经理近 3 个月社保证明，当前资料中缺少该附件。',source:'资格审查 · 招标文件 §3.2.4',resolved:false},
        {id:'r2',projectId:'p1',title:'服务响应时间需要统一',level:'orange',levelText:'待确认',desc:'售后服务章节填写“4 小时响应”，招标要求为“2 小时内响应”，请确认履约能力并修订。',source:'技术响应 · 招标文件 §5.6',resolved:false},
        {id:'r3',projectId:'p2',title:'投标函签章位置需人工核验',level:'orange',levelText:'待确认',desc:'投标函需要法定代表人签字并加盖公章。请在最终文件中确认签字及盖章完整。',source:'格式检查 · 招标文件 §7.1',resolved:false}
      ],
      activity:[{title:'智慧园区项目 · 招标文件解析完成',time:'今天 09:42'},{title:'企业资料库 · 新增 2 份资质文件',time:'今天 09:30'},{title:'品牌展示平台项目 · 标书已完成',time:'昨天 16:28'}]
    };
  }
  let storageFailed='', storageConflict=false, recoveryRaw='', recoveryMessage='', lastStoredRaw=null, skipUnloadSave=false;
  const $ = (s,root=document) => root.querySelector(s);
  function normalizeState(raw) {
    const defaults=seed(), object=v=>v&&typeof v==='object'&&!Array.isArray(v);
    const text=(v,fallback='',limit=300)=>typeof v==='string'?v.slice(0,limit):fallback;
    let repairs=0;
    if(!object(raw)){recoveryMessage='本地数据格式异常，已载入示例；可先导出原始数据排查。';return normalizeState(defaults);}
    const unique=(items,convert)=>{const seen=new Set();return (Array.isArray(items)?items:[]).flatMap(item=>{if(!object(item)){repairs++;return [];}const value=convert(item);if(!value||seen.has(value.id)){repairs++;return [];}seen.add(value.id);return [value];});};
    const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)?v:uid();
    const projects=unique(raw.projects,p=>{
      if(typeof p.name!=='string'||!p.name.trim()){return null;}
      const status=typeof p.status==='string'&&Object.hasOwn(statuses,p.status)?p.status:'drafting';
      const numeric=(typeof p.progress==='number'||typeof p.progress==='string')?Number(p.progress):NaN;
      const progress=Number.isFinite(numeric)?Math.max(0,Math.min(100,numeric)):0;
      const chapters={};
      if(object(p.chapters))for(let i=0;i<8;i++)if(typeof p.chapters[i]==='string'){chapters[i]=cleanHTML(p.chapters[i]);if(chapters[i]!==p.chapters[i])repairs++;}
      const completed=Array.isArray(p.completed)?[...new Set(p.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<8))]:Array.from({length:status==='ready'||status==='review'?8:Math.floor(progress*8/100)},(_,i)=>i);
      return {id:id(p.id),name:text(p.name,'未命名项目',80),code:text(p.code,'DEMO-'+uid(),80),buyer:text(p.buyer,'待填写',120),type:['信息技术','设备采购','物业服务','通用商务','项目实施'].includes(p.type)?p.type:'信息技术',budget:text(p.budget,'未填写',30),due:typeof p.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.due)?p.due:'2026-11-15',status,progress,chapters,completed,file:text(p.file,'示例招标文件.pdf',255),template:text(p.template,'',80),serviceConfirmed:p.serviceConfirmed===true};
    });
    if(!projects.length){projects.push(...normalizeState(defaults).projects);repairs++;}
    const ids=new Set(projects.map(p=>p.id));
    const materials=unique(raw.materials,m=>typeof m.name!=='string'?null:({id:id(m.id),name:text(m.name,'未命名资料',80),category:['企业资质','项目业绩','人员资料','产品资料','财务资料'].includes(m.category)?m.category:'企业资质',file:text(m.file,'未提供文件',255),valid:text(m.valid,'长期有效',20),desc:text(m.desc,'',300),color:['blue','purple','green','orange'].includes(m.color)?m.color:'blue'}));
    const risks=unique(raw.risks,r=>!ids.has(r.projectId)||typeof r.title!=='string'?null:({id:id(r.id),projectId:r.projectId,title:text(r.title,'检查事项',100),level:['red','orange'].includes(r.level)?r.level:'orange',levelText:text(r.levelText,'待确认',10),desc:text(r.desc,'',1000),source:text(r.source,'示例检查',100),resolved:r.resolved===true,note:text(r.note,'',2000),attachment:text(r.attachment,'',255),handledAt:text(r.handledAt,'',100),kind:['evidence','service','signature'].includes(r.kind)?r.kind:({r1:'evidence',r2:'service',r3:'signature'}[r.id]||'signature')}));
    const activity=(Array.isArray(raw.activity)?raw.activity:[]).filter(object).slice(0,6).map(a=>({title:text(a.title,'操作记录',180),time:text(a.time,'',80)}));
    if(activity.length!==(Array.isArray(raw.activity)?raw.activity.slice(0,6).length:0))repairs++;
    if(repairs)recoveryMessage='已隔离异常的本地记录并恢复可用数据；原始数据可先导出备份。';
    return {selected:ids.has(raw.selected)?raw.selected:projects[0].id,projects,materials,risks,activity};
  }
  let rawState=null;
  try {lastStoredRaw=localStorage.getItem(STORE);if(lastStoredRaw){recoveryRaw=lastStoredRaw;rawState=JSON.parse(lastStoredRaw);}}
  catch(error){if(error.name==='SyntaxError')recoveryMessage='本地数据无法解析，已载入示例；原始内容仍可导出。';else storageFailed='浏览器禁止本地保存，请在离开前导出备份。';}
  let state=normalizeState(rawState||seed());
  if(!recoveryMessage)recoveryRaw='';
  let view='dashboard', chapter=0, analysisTab='requirements', materialFilter='全部资料', filterText='', filterStatus='all', materialSearch='', modalType=null, pendingFile=null, generationTimer=null, modalOpener=null, selectedTemplate='', projectPage=1, materialPage=1, analysisTimer=null;
  const PAGE_SIZE=12;
  function chapterHTML(p,i){return Object.hasOwn(p.chapters,i)?p.chapters[i]:defaultChapter(p,i);}
  function storageBanner(){
    if(storageConflict)return `<div class="notice storage-warning" role="alert">${icon('alert')}<div>其他窗口已更新本地数据。本页已停止写入，避免覆盖；请先导出本页备份，再加载最新数据。<div class="banner-actions">${button('导出本页备份','backup','download','outline')}${button('加载最新数据','reload-latest','refresh','soft')}</div></div></div>`;
    if(storageFailed)return `<div class="notice storage-warning" role="alert">${icon('alert')}<div>${esc(storageFailed)}<div class="banner-actions">${button('导出备份','backup','download','outline')}${button('重试保存','retry-save','save','soft')}</div></div></div>`;
    if(recoveryMessage)return `<div class="notice storage-warning" role="alert">${icon('alert')}<div>${esc(recoveryMessage)}${recoveryRaw?`<div class="banner-actions">${button('导出原始数据','recovery-backup','download','outline')}</div>`:''}</div></div>`;
    return '';
  }
  function updateStorageBanner(){const el=$('#storage-banner');if(el)el.innerHTML=storageBanner();}
  function syncSidebar(open=false){const sidebar=$('.sidebar'),scrim=$('.mobile-scrim');if(!sidebar)return;const mobile=matchMedia('(max-width:700px)').matches;sidebar.classList.toggle('open',mobile&&open);scrim.classList.toggle('show',mobile&&open);sidebar.inert=mobile&&!open;sidebar.setAttribute('aria-hidden',String(mobile&&!open));const toggle=$('[data-action="toggle-nav"]');if(toggle)toggle.setAttribute('aria-expanded',String(mobile&&open));}
  function projectRisk(p,kind){return state.risks.find(r=>r.projectId===p.id&&r.kind===kind);}
  function makeProjectRisks(p){return seed().risks.map(r=>({...r,id:uid(),projectId:p.id,kind:({r1:'evidence',r2:'service',r3:'signature'})[r.id],resolved:false,note:''}));}
  function updateProgress(p){p.progress=Math.round(p.completed.length/8*100);}
  function pager(total,page,kind){const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));return total>PAGE_SIZE?`<div class="pagination"><span>共 ${total} 条 · 第 ${page} / ${pages} 页</span><div>${button('上一页','paginate','','outline',`data-kind="${kind}" data-page="${page-1}" ${page<=1?'disabled':''}`)}${button('下一页','paginate','','outline',`data-kind="${kind}" data-page="${page+1}" ${page>=pages?'disabled':''}`)}</div></div>`:'';}
  function projectList(){const list=filteredProjects();projectPage=Math.min(projectPage,Math.max(1,Math.ceil(list.length/PAGE_SIZE)));return projectTable(list.slice((projectPage-1)*PAGE_SIZE,projectPage*PAGE_SIZE))+pager(list.length,projectPage,'projects');}
  function conflictGuard(){if(!storageConflict)return false;toast('检测到其他窗口更新，请先备份本页并加载最新数据。');updateStorageBanner();return true;}
  function expired(m){return /^\d{4}-\d{2}-\d{2}$/.test(m.valid)&&m.valid<new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());}
  function project() {return state.projects.find(p=>p.id===state.selected) || state.projects[0];}
  function persist() {
    if(storageConflict){updateStorageBanner();return false;}
    try {
      const current=localStorage.getItem(STORE);
      if(current!==lastStoredRaw){storageConflict=true;updateStorageBanner();return false;}
      const raw=JSON.stringify(state);
      if(raw!==lastStoredRaw){localStorage.setItem(STORE,raw);lastStoredRaw=raw;}
      storageFailed='';updateStorageBanner();return true;
    }catch(_){storageFailed='本地保存失败，修改仅保留在当前页面。请导出备份后再离开。';updateStorageBanner();return false;}
  }
  function activity(title) {state.activity.unshift({title,time:'刚刚'});state.activity=state.activity.slice(0,6);persist();}
  function toast(message) {const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3300);}
  function pill(status) {const s=statuses[status] || statuses.pending;return `<span class="pill ${s[1]}"><i></i>${s[0]}</span>`;}
  function heading(title,desc,action='') {return `<div class="page-heading"><div><h1>${title}</h1><p>${desc}</p></div>${action}</div>`;}
  function button(label,action,ico='',style='primary',extra='') {return `<button class="btn btn-${style}" data-action="${action}" ${extra}>${ico?icon(ico):''}${label}</button>`;}
  function navItem(key,ico,count='') {return `<button class="nav-item ${view===key?'active':''}" data-nav="${key}">${icon(ico)}<span>${labels[key]}</span>${count?`<span class="count">${count}</span>`:''}</button>`;}
  function shell() {
    const riskCount=state.risks.filter(r=>!r.resolved).length;
    $('#app').innerHTML=`<div class="shell"><div class="mobile-scrim" data-action="close-nav"></div><aside class="sidebar"><a class="logo" href="#" data-nav="dashboard" aria-label="标智AI工作台"><div class="logo-mark">${icon('spark')}</div><div><div class="logo-title">标智 <span>AI</span></div><div class="logo-sub">BID SMARTER. WIN BETTER.</div></div></a><div class="nav-label">工作空间</div><nav>${navItem('dashboard','grid')}${navItem('projects','folder',state.projects.length)}${navItem('editor','spark')}${navItem('materials','building')}${navItem('templates','template')}<div class="nav-divider"></div><div class="nav-label">投标保障</div>${navItem('risks','shield',riskCount||'')}${navItem('settings','settings')}</nav><div class="sidebar-bottom"><div class="plan"><div class="plan-title">${icon('spark')}让每一份标书，更进一步</div><p>从读懂招标要求，到交付专业标书<br>AI 与你一起，高效完成投标。</p><button data-action="guide">了解使用流程 ${icon('arrow')}</button></div><div class="side-user"><div class="avatar">林</div><div><strong>林经理</strong><small>云启科技 · 企业空间</small></div><button class="icon-btn" data-nav="settings" aria-label="账户设置">${icon('more')}</button></div></div></aside><main class="main"><header class="topbar"><div class="breadcrumb"><button class="icon-btn mobile-menu" data-action="toggle-nav" aria-label="展开菜单">${icon('menu')}</button><span class="home-label">工作空间</span>${icon('chevron')}<span>${labels[view] || '招标文件分析'}</span></div><div class="top-tools"><form class="search" id="global-search">${icon('search')}<input name="query" aria-label="搜索项目" placeholder="搜索项目、招标编号…"><span class="keycap">↵</span></form><span class="demo-tag"><i></i>演示空间</span><button class="icon-btn" data-action="notifications" aria-label="查看动态">${icon('bell')}<i class="notif-dot"></i></button><button class="avatar top-avatar" data-nav="settings" aria-label="账户设置">林</button></div></header><div class="content" id="view-root"></div></main></div>`;
    renderView();
  }
  function routeHash(){return '#'+view+(['editor','analyze'].includes(view)?'?project='+encodeURIComponent(project().id)+'&chapter='+chapter:'');}
  function restoreRoute(){const [name,query='']=location.hash.slice(1).split('?'),params=new URLSearchParams(query);view=Object.hasOwn(labels,name)||name==='analyze'?name:'dashboard';const id=params.get('project');if(state.projects.some(p=>p.id===id))state.selected=id;const value=Number(params.get('chapter'));chapter=Number.isInteger(value)&&value>=0&&value<8?value:0;}
  function updateRoute(replace=false){const hash=routeHash();if(location.hash!==hash)history[replace?'replaceState':'pushState'](null,'',hash);}
  function navigate(next) {saveEditor(false);view=next;filterText='';filterStatus='all';projectPage=1;updateRoute();shell();window.scrollTo({top:0,behavior:'instant'});}
  function stat(label,num,unit,ico,color,foot) {return `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${color}">${icon(ico)}</span></div><div class="stat-num">${num}<small>${unit}</small></div><div class="stat-foot">${foot}</div></div>`;}
  function stats() {const active=state.projects.filter(p=>p.status==='drafting').length;const risks=state.risks.filter(r=>!r.resolved).length;return `<div class="stats">${stat('投标项目',state.projects.length,'个','folder','blue','<span class="up">持续积累</span>每一次投标的经验')}${stat('正在编写',active,'份','pen','purple','<span class="up">AI 协作</span>让专业表达更高效')}${stat('企业资料',state.materials.length,'份','building','green','<span class="up">统一管理</span>企业投标知识资产')}${stat('待处理风险',risks,'项','shield','orange',`<span class="orange">${risks?'建议优先处理':'检查已完成'}</span>守住投标关键要求`)}</div>`;}
  function art() {return `<svg class="hero-art" viewBox="0 0 290 190" fill="none" aria-hidden="true" style="stroke:none"><defs><linearGradient id="paper" x1="70" y1="20" x2="240" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#d4e0ff"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#1639aa" flood-opacity=".18"/></filter></defs><circle cx="158" cy="93" r="76" fill="#fff" opacity=".06"/><path d="m40 129 17-7 7 17-17 7z" fill="#fff" opacity=".09"/><g transform="rotate(13 167 100)" opacity=".35"><rect x="116" y="34" width="100" height="130" rx="8" fill="#dce5ff"/></g><g transform="rotate(-9 148 100)" filter="url(#shadow)"><rect x="95" y="24" width="108" height="139" rx="8" fill="url(#paper)"/><rect x="110" y="40" width="23" height="23" rx="5" fill="#e3ebff"/><path d="m115 53 4 4 9-10" stroke="#6d8df5" stroke-width="2.5"/><rect x="110" y="78" width="69" height="5" rx="2" fill="#93acf7"/><rect x="110" y="91" width="77" height="3" rx="1.5" fill="#c2d1f5"/><rect x="110" y="102" width="61" height="3" rx="1.5" fill="#c2d1f5"/><rect x="110" y="113" width="74" height="3" rx="1.5" fill="#c2d1f5"/><rect x="110" y="133" width="38" height="5" rx="2" fill="#9db5fa"/></g><g filter="url(#shadow)"><rect x="177" y="108" width="49" height="49" rx="14" fill="#fff"/><path d="m201.5 118 3.5 11 11 3.5-11 3.5-3.5 11-3.5-11-11-3.5 11-3.5 3.5-11Z" fill="#6a8df8"/></g><path d="m78 45 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z" fill="#c5d6ff"/><circle cx="242" cy="72" r="4" fill="#c0d2ff"/><circle cx="88" cy="146" r="3" fill="#cfddff"/></svg>`;}
  function projectRows(list) {
    return list.map(p=>`<tr><td><div class="project-name"><div class="file-icon">${icon('doc')}</div><div><strong title="${esc(p.name)}">${esc(p.name)}</strong><small>${esc(p.code)} · ${esc(p.type)}</small><small class="mobile-deadline">截止：${esc(p.due)}</small></div></div></td><td>${pill(p.status)}</td><td class="progress-col"><div class="progress-wrap"><div class="progress-label"><span>完成度</span><span>${Number(p.progress)}%</span></div><div class="progress"><span style="width:${Number(p.progress)}%"></span></div></div></td><td class="deadline-col"><span class="deadline">${esc(p.due)}</span></td><td><button class="table-action" data-action="open-project" data-id="${esc(p.id)}">${p.status==='ready'?'查看标书':p.status==='review'?'审核标书':'继续编写'}</button></td></tr>`).join('');
  }
  function projectTable(list) {return `<div class="table-scroll"><table class="project-table"><thead><tr><th>项目名称</th><th>当前状态</th><th class="progress-col">编写进度</th><th class="deadline-col">投标截止</th><th>操作</th></tr></thead><tbody>${projectRows(list)}</tbody></table>${!list.length?`<div class="empty">${icon('search')}<p>没有找到符合条件的项目</p></div>`:''}</div>`;}
  function dashboard() {
    return `${heading('上午好，林经理 <span style="font-size:21px">☀️</span>','每一份用心的标书，都值得一个更好的开始。',`<div class="date">${icon('calendar')}2026 年 10 月 28 日 · 星期三</div>`)}<section class="hero"><div class="hero-copy"><div class="hero-eyebrow">${icon('spark')}YOUR INTELLIGENT BIDDING PARTNER</div><h2>让投标更从容，让专业被看见</h2><p>读懂招标要求，沉淀企业优势，一起写好下一份标书。</p><div class="hero-actions">${button('新建投标项目','new-project','plus','white')}${button('体验编标流程','guide','play','glass')}</div></div>${art()}</section>${stats()}<div class="workspace-grid"><section class="card"><div class="card-head"><div><h2 class="card-title">最近投标项目</h2><p class="subline">从这里，继续你的投标工作</p></div><button class="link-btn" data-nav="projects">全部项目 ${icon('chevron')}</button></div>${projectTable(state.projects.slice(0,4))}<div class="card-foot">${icon('clock')}及时关注投标截止时间，预留充分的审核与签章时间</div></section><section class="card ai-card"><div class="card-head"><h2 class="card-title">${icon('spark')}AI 招标解读</h2><span class="ai-badge">智能分析</span></div><p>上传招标文件，快速梳理资格要求、<br>评分标准与关键风险。</p><div class="upload-zone" data-action="new-project" data-drop="project" role="button" tabindex="0"><div class="upload-icon">${icon('upload')}</div><strong>点击或拖拽招标文件</strong><small>PDF / Word · 演示解析使用示例内容</small></div>${button('开始智能解读','new-project','spark')}</section></div><div class="bottom-grid"><section class="card"><div class="card-head"><h2 class="card-title">常用工具</h2><span class="subline" style="margin:0">把时间留给更重要的事</span></div><div class="quick-grid">${quick('招标文件解析','提取要求与评分标准','doc','blue','analyze')}${quick('AI 智能编标','专业内容，一键起草','spark','purple','editor')}${quick('企业资料库','让企业优势有据可依','building','green','materials')}${quick('标书合规检查','关键风险，提前发现','shield','orange','risks')}</div></section><section class="card"><div class="card-head"><h2 class="card-title">工作动态</h2><button class="link-btn" aria-label="查看全部工作动态" data-action="notifications">${icon('more')}</button></div><div class="activity">${activityHTML(state.activity.slice(0,3))}</div></section></div>${footer()}`;
  }
  function footer() {return `<footer class="footer"><span>© 2026 标智 AI · 让每一份专业，都有回响</span><span>${icon('lock')}独立演示空间 · 内容为示例数据</span></footer>`;}
  function quick(name,desc,ico,color,nav) {return `<button class="quick-item" data-nav="${nav}"><span class="stat-icon ${color}">${icon(ico)}</span><strong>${name}</strong><small>${desc}</small></button>`;}
  function activityHTML(items) {return items.map(a=>`<div class="activity-row"><i class="activity-dot"></i><div><strong>${esc(a.title)}</strong><small>${esc(a.time)}</small></div></div>`).join('');}
  function projects() {return `${heading('投标项目','从项目建立到标书交付，每一步都井然有序。',button('新建投标项目','new-project','plus'))}<div class="toolbar"><div class="search">${icon('search')}<input id="project-search" aria-label="筛选项目" placeholder="搜索项目名称或编号" value="${esc(filterText)}"></div><select id="status-filter" aria-label="筛选项目状态"><option value="all">全部状态</option>${Object.entries(statuses).map(([k,v])=>`<option value="${k}" ${filterStatus===k?'selected':''}>${v[0]}</option>`).join('')}</select><span class="push"></span><span class="subline">共 ${state.projects.length} 个项目</span></div><section class="card" id="project-list">${projectList()}</section>${footer()}`;}
  function filteredProjects() {const q=filterText.toLowerCase();return state.projects.filter(p=>(`${p.name} ${p.code}`.toLowerCase().includes(q))&&(filterStatus==='all'||p.status===filterStatus));}
  function materials() {const cats=['全部资料','企业资质','项目业绩','人员资料','产品资料','财务资料'];return `${heading('企业资料库','积累企业投标知识，让每一份专业内容都有依据。',button('上传企业资料','new-material','upload'))}<section class="card"><div class="section-tabs" style="overflow:auto">${cats.map(c=>`<button class="tab ${materialFilter===c?'active':''}" data-action="material-filter" data-value="${c}" style="white-space:nowrap">${c}</button>`).join('')}</div></section><div class="toolbar"><div class="search">${icon('search')}<input id="material-search" aria-label="搜索企业资料" placeholder="搜索资料名称" value="${esc(materialSearch)}"></div><span class="subline">${state.materials.length} 份资料 · 上传后保存在当前演示空间</span></div><div class="material-grid" id="material-list">${materialCards()}</div>${footer()}`;}
  function materialCards() {
    const list=state.materials.filter(m=>(materialFilter==='全部资料'||m.category===materialFilter)&&m.name.toLowerCase().includes(materialSearch.toLowerCase()));
    materialPage=Math.min(materialPage,Math.max(1,Math.ceil(list.length/PAGE_SIZE)));
    return list.slice((materialPage-1)*PAGE_SIZE,materialPage*PAGE_SIZE).map(m=>`<article class="card material-card"><div class="material-top"><span class="stat-icon ${m.color||'blue'}">${icon(m.category==='人员资料'?'doc':'building')}</span><span class="pill ${expired(m)?'red':'gray'}">${expired(m)?'已过期':esc(m.category)}</span></div><h3>${esc(m.name)}</h3><p>${esc(m.desc)}</p><div class="meta"><span>有效期</span><span>${esc(m.valid)}</span></div>${button('查看资料','material-detail','doc','outline',`data-id="${esc(m.id)}"`)}</article>`).join('')+pager(list.length,materialPage,'materials') || '<div class="card empty">暂无匹配的资料</div>';
  }
  const templates = [
    {name:'信息技术服务投标模板',type:'信息技术',desc:'适用于软件开发、系统集成、平台建设等服务项目。',count:8,color:'blue'},
    {name:'通用设备采购投标模板',type:'设备采购',desc:'覆盖产品参数、供货计划、安装调试与售后保障。',count:8,color:'green'},
    {name:'物业综合服务投标模板',type:'物业服务',desc:'围绕人员配置、服务标准、应急预案与质量管理。',count:8,color:'purple'},
    {name:'商务资格响应模板',type:'通用商务',desc:'规范投标函、企业资料与资格审查附件的编排。',count:8,color:'orange'},
    {name:'项目实施与交付模板',type:'项目实施',desc:'结构化呈现需求理解、实施方法、进度与交付物。',count:8,color:'blue'},
    {name:'技术运维服务投标模板',type:'信息技术',desc:'适用于运行维护、安全保障与持续服务项目。',count:8,color:'green'}
  ];
  function templateView() {return `${heading('标书模板','从专业结构出发，为不同投标场景找到合适的起点。')}<div class="notice">${icon('book')}模板提供章节结构与示例内容，具体响应内容请以当前项目招标文件为准。</div><div class="template-grid">${templates.map((t,i)=>`<article class="card template-card"><div class="template-preview"><div class="mini-page" style="border-top-color:${['#6186f5','#4ebf9a','#a08ce2','#e3ae61'][i%4]}"><b>${esc(t.name)}<br>投 标 文 件</b>${'<i></i>'.repeat(7)}</div></div><div style="display:flex;justify-content:space-between;margin-bottom:13px"><span class="pill ${t.color}">${t.type}</span><span class="subline" style="margin:0">${t.count} 个章节</span></div><h3>${t.name}</h3><p>${t.desc}</p>${button('预览并使用','template-preview','template','outline',`data-index="${i}"`)}</article>`).join('')}</div>${footer()}`;}
  function defaultChapter(p,i,variant=false) {
    const name=esc(p.name),buyer=esc(p.buyer),type=esc(p.type),budget=esc(p.budget),due=esc(p.due);
    const body=[
      `<p>致：${buyer}</p><p>我方已认真研究“${name}”项目的招标文件，现提交本投标文件，并就招标范围、服务要求与履约责任作出响应。</p><h3>一、投标声明</h3><p>我方承诺所提交的企业资质、人员资料与项目业绩真实、有效。投标报价以经审核的正式报价表为准，具体履约内容以最终合同约定为准。</p><h3>二、投标承诺</h3><p>我方将根据招标文件要求组织项目实施，落实质量、安全及进度管理责任。对于尚需确认的事项，将在正式递交前完成核验。</p><p>投标人：杭州云启科技有限公司（示例）<br>法定代表人或授权代表：【待签字】<br>日期：【待填写】</p>`,
      `<h3>一、企业概况</h3><p>杭州云启科技有限公司为本演示中的示例企业，主要提供信息技术与项目交付服务。本章节应依据企业营业执照、资质证书和真实经营情况填写。</p><h3>二、资质与能力</h3><p>当前演示资料库包含营业执照、质量管理体系认证、项目履历和财务审计报告等示例资料。正式投标时需逐项核验证书主体、有效期及适用范围。</p><h3>三、相关项目经验</h3><p>可引用资料库中的“智慧园区平台建设案例”说明项目实施经验；项目金额、验收结论与合同附件需根据真实材料补充。</p>`,
      `<h3>一、项目背景与目标</h3><p>根据项目名称及所选“${type}”业务场景，本示例围绕${name}梳理项目目标、服务边界与交付要求。具体需求需与实际招标文件逐条核验。</p><h3>二、核心需求理解</h3><p>项目建设应重视业务适用性、交付可验证性与持续服务能力。通过需求调研、方案设计、分阶段实施与验收移交，形成清晰的工作闭环。</p><h3>三、响应重点</h3><ul><li>资格条件：核验企业、人员及业绩证明文件。</li><li>技术要求：建立技术要求与方案内容的逐项对应关系。</li><li>交付要求：明确成果清单、计划安排及验收依据。</li></ul><p>项目参考预算：${budget} 万元；投标截止日期：${due}。以上为项目录入信息。</p>`,
      `<h3>一、总体实施思路</h3><p>围绕${name}的建设目标，采用“统一规划、分步实施、阶段验证”的实施路径，将需求确认、设计、建设、验证与交付纳入全过程管理。</p><h3>二、实施阶段与工作内容</h3><table><thead><tr><th>实施阶段</th><th>主要工作</th><th>阶段成果</th></tr></thead><tbody><tr><td>需求调研</td><td>业务访谈、现状梳理、需求确认</td><td>需求确认记录</td></tr><tr><td>方案设计</td><td>技术路线与实施方案设计</td><td>经确认的设计方案</td></tr><tr><td>实施建设</td><td>按方案执行并组织阶段评审</td><td>阶段交付物</td></tr><tr><td>验收移交</td><td>成果验证、使用培训、资料移交</td><td>验收及移交记录</td></tr></tbody></table><h3>三、关键控制措施</h3><p>针对需求变更、进度偏差与质量问题建立跟踪机制。关键节点提交采购人确认，并保留沟通、审核和验收记录。</p>`,
      `<h3>一、项目组织架构</h3><p>建立由项目负责人统筹、专业实施人员执行、质量人员检查的项目组织，明确职责与协作流程。</p><h3>二、人员配置</h3><table><tr><th>岗位</th><th>主要职责</th><th>证明材料</th></tr><tr><td>项目经理</td><td>进度、质量与沟通统筹</td><td>资格证书、履历、社保证明</td></tr><tr><td>技术负责人</td><td>技术方案与实施把关</td><td>履历及相关资格【待补充】</td></tr><tr><td>质量负责人</td><td>检查、整改跟踪与验收支持</td><td>履历【待补充】</td></tr></table><h3>三、沟通机制</h3><p>根据项目需要建立周例会、专项协调与问题升级机制，确保信息同步、责任明确、问题闭环。</p>`,
      `<h3>一、质量管理目标</h3><p>以满足招标文件、经确认的实施方案及合同约定为质量管理目标，实行过程检查与成果验证。</p><h3>二、质量控制流程</h3><ul><li>实施前：确认需求、计划与验收依据。</li><li>实施中：记录检查结果，跟踪问题整改。</li><li>交付前：组织成果复核并形成移交清单。</li></ul><h3>三、问题整改机制</h3><p>问题记录应包括发现时间、问题描述、责任人、计划完成时间与验证结论。所有重大问题需在相应阶段关闭前完成处理。</p>`,
      `<h3>一、进度计划原则</h3><p>项目工期、开工日期和验收时间应以实际招标要求及合同约定为准，当前演示不自动推定履约期限。</p><h3>二、阶段安排</h3><table><tr><th>阶段</th><th>工作内容</th><th>计划时间</th></tr><tr><td>启动</td><td>项目启动与资料交接</td><td>【待确认】</td></tr><tr><td>实施</td><td>方案执行与阶段检查</td><td>【待确认】</td></tr><tr><td>交付</td><td>验收、培训及移交</td><td>【待确认】</td></tr></table><h3>三、交付物管理</h3><p>交付成果包括实施记录、验证报告、操作说明与验收资料，实际清单需结合采购范围确认。</p>`,
      `<h3>一、服务保障体系</h3><p>为${name}建立统一服务受理窗口，明确受理、派单、处置、反馈与回访流程。</p><h3>二、响应与处理</h3><p>${p.serviceConfirmed?'服务响应时间：经审核已调整为 2 小时内响应，请在正式提交前确认履约能力。':'服务响应时间：4 小时响应【待核验：示例招标要求为 2 小时内响应】。'}故障分级、到场时间与解决时限应依据真实招标要求和服务能力确认。</p><h3>三、持续服务</h3><p>建立定期巡检、问题知识库与运行反馈机制。服务期限、服务范围及费用安排以正式合同为准。</p>`
    ];
    return `<h2>第${['一','二','三','四','五','六','七','八'][i]}章 ${chapterNames[i]}</h2>${body[i]}${variant?'<h3>补充：执行与审核要点</h3><p>建议建立本章节的要求响应清单，逐条核对招标条款、企业依据和交付承诺，并由对应责任人完成复核。</p>':''}`;
  }
  function editor() {const p=project();return `${heading('AI 智能编标',`${esc(p.name)} · ${esc(p.code)}`,`<div style="display:flex;gap:8px">${button('招标解读','analyze','doc','outline')}${button('导出标书','export','download')}</div>`)}<div class="notice">${icon('spark')}AI 演示草稿 · 内容使用示例规则生成，企业事实、报价及履约承诺请在正式递交前逐项核验。</div><div class="editor-layout"><section class="card chapter-card"><div class="chapter-head">标书目录 <span style="float:right;font-size:10px;color:#a0aabd">8 章</span></div><div class="chapter-list">${chapterNames.map((n,i)=>`<button class="chapter-item ${chapter===i?'active':''}" data-action="chapter" data-index="${i}"><small>0${i+1}</small>${n}${icon(p.completed.includes(i)?'checkCircle':'doc')}</button>`).join('')}</div><div class="card-foot">${icon('lock')}内容保存在当前浏览器</div></section><section class="card editor-card"><div class="editor-toolbar"><span>正文</span><span>微软雅黑</span><span style="color:#c6cdd9">│</span><span>按章节编辑</span><span style="margin-left:auto" id="save-status">可直接编辑</span>${button('保存','save','save','soft')}</div><article class="editor-paper" id="editor-paper" contenteditable="true" role="textbox" aria-multiline="true" aria-label="标书章节正文">${chapterHTML(p,chapter)}</article><div class="editor-meta"><span id="word-count">${plainText(chapterHTML(p,chapter)).length} 字</span><span>${pill(p.status)} ${p.status==='ready'?'':button(p.status==='review'?'确认审核完成':'提交审核','advance-status','check','soft')}</span></div></section><aside class="editor-side"><section class="card"><div class="card-head"><h3 class="card-title">${icon('spark')}AI 写作助手</h3></div><p>结合项目资料，为当前章节补充更清晰的实施措施与审核要点。</p>${button('优化当前章节','regenerate','spark')}<p style="padding-top:0;font-size:10px">保留当前文字，在章节末尾补充一段建议内容。</p></section><section class="card"><div class="card-head"><h3 class="card-title">${icon('book')}参考依据</h3></div><div class="source"><strong>招标文件</strong>${esc(p.file||'示例招标文件.pdf')}<br>示例关联：技术及服务要求</div><div class="source"><strong>企业资料</strong>营业执照 · 项目案例 · 技术白皮书</div>${button('查看风险检查','risks','shield','outline')}</section></aside></div>${footer()}`;}
  function plainText(html) {const d=document.createElement('template');d.innerHTML=String(html);return d.content.textContent||'';}
  function wordHTML(html) {
    const d=document.createElement('template');d.innerHTML=cleanHTML(html);
    const walker=document.createTreeWalker(d.content,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())if(/[\r\n]/.test(walker.currentNode.textContent))nodes.push(walker.currentNode);
    for(const node of nodes){const fragment=document.createDocumentFragment();node.textContent.split(/\r\n|\r|\n/).forEach((line,i)=>{if(i)fragment.append(document.createElement('br'));fragment.append(document.createTextNode(line));});node.replaceWith(fragment);}
    return d.innerHTML;
  }
  function cleanHTML(html) {
    const d=document.createElement('template');d.innerHTML=String(html);
    const allowed=new Set(['H2','H3','H4','P','BR','STRONG','B','I','EM','U','UL','OL','LI','TABLE','THEAD','TBODY','TR','TD','TH','DIV','SPAN']);
    d.content.querySelectorAll('script,style,iframe,object,embed,svg,math,img,link,meta,template,form,input,button,textarea,select').forEach(n=>n.remove());
    [...d.content.querySelectorAll('*')].reverse().forEach(el=>{if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return;}for(const a of [...el.attributes])el.removeAttribute(a.name);});
    return d.innerHTML;
  }
  function saveEditor(show=true) {
    clearTimeout(saveEditor.timer);
    const paper=$('#editor-paper');if(!paper)return true;
    const p=state.projects.find(p=>p.id===paper.dataset.project)||project(),i=Number(paper.dataset.chapter||chapter);
    const html=cleanHTML(paper.innerHTML),changed=html!==paper.dataset.savedHtml;
    if(!changed&&!show&&!storageFailed)return !storageConflict;
    p.chapters[i]=html;
    if(plainText(html).trim()){if(!p.completed.includes(i))p.completed.push(i);}else p.completed=p.completed.filter(n=>n!==i);
    updateProgress(p);
    if(changed&&(p.status==='ready'||p.status==='review'))p.status='drafting';
    if(p.status==='pending')p.status='drafting';
    if(i===7&&changed){const risk=projectRisk(p,'service'),text=plainText(html);if(risk?.resolved&&(!/2\s*小时(?:内)?\s*响应/.test(text)||/4\s*小时(?:内)?\s*响应/.test(text))){risk.resolved=false;risk.note='正文修改后需重新核验。上次处理：'+risk.note;p.serviceConfirmed=false;}}
    const ok=persist();
    if(ok)paper.dataset.savedHtml=html;
    if($('#save-status'))$('#save-status').textContent=ok?'已保存':storageConflict?'窗口冲突，未保存':'保存失败，请备份';
    const meta=$('.editor-meta>span:last-child');if(meta)meta.innerHTML=`${pill(p.status)} ${p.status==='ready'?'':button(p.status==='review'?'确认审核完成':'提交审核','advance-status','check','soft')}`;
    const item=$(`[data-action="chapter"][data-index="${i}"] svg`);if(item)item.outerHTML=icon(p.completed.includes(i)?'checkCircle':'doc');
    if(show)toast(ok?'当前章节已保存':storageConflict?'其他窗口已更新数据，本次未覆盖，请先备份。':'保存失败，内容仍在当前页面，请先导出备份。');
    return ok;
  }
  const requirements=[
    ['具备独立承担民事责任的能力','提供有效营业执照，投标主体名称应与证照一致。','资格审查 · 第 12 页','matched'],
    ['提供近年度财务状况证明','提供经审计的财务报告，或符合要求的资信证明。','资格审查 · 第 13 页','matched'],
    ['拟派项目经理资格与社保证明','项目经理履历已匹配，近 3 个月社保证明待补充。','人员要求 · 第 18 页','missing'],
    ['项目方案应覆盖实施与质量保障','方案须包含需求理解、实施计划、质量控制及交付管理。','技术要求 · 第 26 页','matched'],
    ['服务响应时间不超过 2 小时','需明确服务受理渠道及响应承诺，并核验实际履约能力。','服务要求 · 第 32 页','missing']
  ];
  function analyze() {const p=project();let body;if(analysisTab==='requirements')body=requirements.map((r,i)=>{const done=(i===2&&projectRisk(p,'evidence')?.resolved)||(i===4&&projectRisk(p,'service')?.resolved&&p.serviceConfirmed);const ok=r[3]==='matched'||done;return `<div class="requirement"><span class="req-icon ${ok?'':'warn'}">${icon(ok?'checkCircle':'alert')}</span><div><h4>${r[0]}</h4><p>${done&&i===2?'社保证明补充记录已确认；文件原件请在正式投标时核验。':r[1]}<br><span style="color:#9babca">示例出处：${r[2]}</span></p></div><span class="pill ${ok?'green':'orange'}">${ok?'已匹配':'需确认'}</span></div>`;}).join('');else if(analysisTab==='scores')body=[['技术实施方案',35],['项目团队与人员配置',20],['同类项目经验',15],['服务与质量保障',10],['投标报价',20]].map(([n,v])=>`<div class="score-row"><p><span>${n}</span><span>${v} 分</span></p><div class="progress"><span style="width:${v*2}%"></span></div></div>`).join('');else body=`<div class="requirement"><span class="req-icon warn">${icon('alert')}</span><div><h4>资格附件须完整</h4><p>项目经理社保证明、授权委托及资格声明需按要求提供。</p></div></div><div class="requirement"><span class="req-icon warn">${icon('alert')}</span><div><h4>签字盖章须符合指定格式</h4><p>投标函及指定附件应完成签章，最终提交前安排人工复核。</p></div></div><div class="requirement"><span class="req-icon warn">${icon('alert')}</span><div><h4>报价及技术响应不得自相矛盾</h4><p>总价、分项报价、服务承诺及偏离表应保持一致。</p></div></div>`;return `${heading('招标文件解读',esc(p.name),button('开始编写标书','start-writing','spark'))}<div class="notice">${icon('doc')}演示分析结果 · 以下条款、页码和评分为示例，不代表对上传文件的真实解析。</div><div class="analysis-layout"><section class="card"><div class="card-head"><div><h2 class="card-title">${icon('doc')}招标要求概览</h2><p class="subline">建立响应清单，让关键要求一目了然</p></div><span class="pill green">示例解析完成</span></div><div class="section-tabs">${[['requirements','资格与技术要求'],['scores','评分标准'],['key','关键风险']].map(([k,n])=>`<button class="tab ${analysisTab===k?'active':''}" data-action="analysis-tab" data-value="${k}">${n}</button>`).join('')}</div><div class="analysis-body"><div class="analysis-kpis"><div class="analysis-kpi"><strong>05</strong><small>主要响应要求</small></div><div class="analysis-kpi"><strong>100</strong><small>评分总分</small></div><div class="analysis-kpi"><strong>${state.risks.filter(r=>r.projectId===p.id&&!r.resolved).length}</strong><small>待处理检查事项</small></div></div>${body}</div></section><aside class="card"><div class="card-head"><h3 class="card-title">项目基本信息</h3></div><div class="info-list">${[['采购单位',p.buyer],['采购预算',p.budget+' 万元'],['投标截止时间',p.due],['采购类型',p.type],['招标文件',p.file]].map(([n,v])=>`<div class="info-row"><small>${n}</small><strong>${esc(v)}</strong></div>`).join('')}</div></aside></div>${footer()}`;}
  function riskView() {const unresolved=state.risks.filter(r=>!r.resolved);return `${heading('标书合规检查','提前发现关键问题，为最后一次审核留出从容。',button('导出检查清单','export-risks','download','outline'))}<div class="stats" style="grid-template-columns:repeat(3,1fr)">${stat('待处理事项',unresolved.length,'项','alert','orange','请逐项核实并完成处理')}${stat('高风险事项',unresolved.filter(r=>r.level==='red').length,'项','shield','purple','优先检查可能影响资格的要求')}${stat('已处理事项',state.risks.filter(r=>r.resolved).length,'项','checkCircle','green','人工处理结果已保存在当前浏览器')}</div><div class="notice">${icon('shield')}演示检查清单 · 真实投标需要结合完整招标文件和最终标书审核，处理记录代表人工确认。</div><section class="card"><div class="card-head"><h2 class="card-title">检查事项</h2><span class="subline" style="margin:0">共 ${state.risks.length} 项</span></div>${state.risks.map(r=>`<div class="risk-item ${r.resolved?'resolved':''}"><span class="req-icon ${r.resolved?'':'warn'}">${icon(r.resolved?'checkCircle':'alert')}</span><div class="risk-copy"><div style="display:flex;gap:10px;align-items:center;margin-bottom:7px"><h3 style="margin:0">${esc(r.title)}</h3><span class="pill ${r.resolved?'green':esc(r.level)}">${r.resolved?'已处理':r.levelText}</span></div><p>${esc(r.desc)}</p><p class="risk-project">${esc(state.projects.find(p=>p.id===r.projectId)?.name||'关联项目')} · ${esc(r.source)}</p></div>${button(r.resolved?'查看处理记录':'去处理',r.resolved?'risk-history':'resolve-risk',r.resolved?'check':'arrow',r.resolved?'outline':'soft',`data-id="${esc(r.id)}"`)}</div>`).join('')}</section>${footer()}`;}
  function settings() {return `${heading('设置中心','管理你的演示空间与本地数据。')}<section class="card"><div class="card-head"><h2 class="card-title">${icon('building')}云启科技 · 企业空间</h2><span class="pill blue">前端演示版</span></div><div style="padding:0 23px 23px"><div class="settings-row"><div><h3>演示数据备份</h3><p>导出项目、企业资料索引、标书草稿和处理记录。</p></div>${button('导出备份','backup','download','outline')}</div><div class="settings-row"><div><h3>本地保存说明</h3><p>数据保存在当前浏览器；文件上传仅保存名称及填写的信息，不上传服务器，不保存文件原件。</p></div>${icon('lock')}</div><div class="settings-row"><div><h3>恢复初始演示</h3><p>清除当前演示修改，恢复示例项目与资料。</p></div>${button('重置演示','reset-confirm','refresh','danger')}</div><div class="settings-row" style="border:0"><div><h3>版本信息</h3><p>标智 AI · 前端交互演示 v1.0<br>招标解析、AI 生成与风险检测均为示例流程，尚未连接模型服务。</p></div></div></div></section>${footer()}`;}
  function renderView() {
    const views={dashboard,projects,editor,materials,templates:templateView,analyze,risks:riskView,settings};
    $('#view-root').innerHTML=`<div id="storage-banner">${storageBanner()}</div>`+(views[view]||dashboard)();
    const paper=$('#editor-paper');if(paper){paper.dataset.project=project().id;paper.dataset.chapter=chapter;paper.dataset.savedHtml=cleanHTML(paper.innerHTML);paper.contentEditable=storageConflict?'false':'true';}
    syncSidebar();
  }
  function modal(title,desc,body,foot='',wide=false) {
    if(!$('#modal-root').childElementCount)modalOpener=document.activeElement;
    $('#modal-root').innerHTML=`<div class="modal-overlay"><section class="modal ${wide?'modal-wide':''}" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">${title}</h2><p>${esc(desc)}</p></div><button class="icon-btn" data-action="close-modal" aria-label="关闭弹窗" ${modalType==='progress'?'disabled':''}>${icon('close')}</button></div><div class="modal-body">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}</section></div>`;
    $('#app').inert=true;document.body.style.overflow='hidden';
    ($('.modal input:not([type=file]),.modal select,.modal textarea')||$('.modal .btn')||$('.modal .icon-btn:not(:disabled)')||$('.modal'))?.focus();
  }
  function closeModal() {if(modalType==='progress')return;$('#modal-root').innerHTML='';$('#app').inert=false;document.body.style.overflow='';modalType=null;if(modalOpener?.isConnected)modalOpener.focus();modalOpener=null;}
  function filePickerHTML(kind) {return `<input type="file" id="${kind}-file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" hidden><div class="upload-zone" id="file-zone" data-action="pick-file" data-target="${kind}-file" data-drop="${kind}" role="button" tabindex="0"><div class="upload-icon">${icon('upload')}</div><strong>点击选择或拖拽文件到这里</strong><small>支持 PDF / Word / TXT / 图片 · 最大 20 MB</small></div><div id="file-selected"></div>`;}
  function newProject(file=null,templateIndex=null) {pendingFile=null;selectedTemplate=templateIndex===null?'':templates[templateIndex].name;modalType='project';const t=templateIndex===null?null:templates[templateIndex];modal('新建投标项目','添加项目与招标文件，开启你的下一次投标。',`<form id="project-form"><div class="field"><label for="p-name">项目名称 <span style="color:#db776b">*</span></label><input id="p-name" name="name" required maxlength="80" placeholder="例如：智慧园区数字化平台建设项目"></div><div class="form-row"><div class="field"><label for="p-buyer">采购单位 <span style="color:#db776b">*</span></label><input id="p-buyer" name="buyer" required maxlength="80" placeholder="填写采购单位名称"></div><div class="field"><label for="p-type">项目类型</label><select id="p-type" name="type">${['信息技术','设备采购','物业服务','通用商务','项目实施'].map(n=>`<option ${t?.type===n?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="form-row"><div class="field"><label for="p-budget">采购预算（万元）</label><input id="p-budget" name="budget" type="number" min="0" max="999999999" step="0.01" value="100"></div><div class="field"><label for="p-due">投标截止日期 <span style="color:#db776b">*</span></label><input id="p-due" name="due" type="date" min="1900-01-01" max="2100-12-31" required value="2026-11-15"></div></div><div class="field"><label>招标文件</label>${filePickerHTML('project')}<small>未选择文件时使用示例招标文件；解析结果为演示数据。</small></div>${t?`<div class="notice">${icon('template')}已选择：${esc(t.name)}</div>`:''}<div class="form-error" id="project-error"></div></form>`,`${button('取消','close-modal','','outline')}<button class="btn btn-primary" type="submit" form="project-form">${icon('spark')}创建并体验解析</button>`);if(file)showFile(file);}
  function showFile(file) {
    if(!file)return false;
    const valid=/\.(pdf|doc|docx|txt|png|jpe?g)$/i.test(file.name)&&file.size>0&&file.size<=20*1024*1024;
    if(!valid){const message=file.size===0?'不能选择空文件。':file.size>20*1024*1024?'文件不能超过 20 MB。':'不支持此文件类型，请选择 PDF、Word、TXT 或图片。';const error=$('#project-error')||$('#material-error')||$('#risk-error');if(error)error.textContent=message;toast(message);const input=$('.modal input[type=file]');if(input)input.value='';return false;}
    pendingFile=file;const target=$('#file-selected');
    if(target){target.innerHTML=`<div class="selected-file">${icon('doc')}<span>${esc(file.name)}</span><span style="margin-left:auto;font-size:10px;color:#93a0b6">${(file.size/1024/1024).toFixed(2)} MB</span><button class="icon-btn" data-action="clear-file" aria-label="移除文件，重新选择">${icon('close')}</button></div>`;$('#file-zone').style.display='none';}
    const error=$('#project-error')||$('#material-error')||$('#risk-error');if(error)error.textContent='';return true;
  }
  function createProject(form) {
    if(conflictGuard()||!form.reportValidity())return;
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),buyer=String(fd.get('buyer')||'').trim(),budget=String(fd.get('budget')||''),due=String(fd.get('due')||'');
    if(!name||!buyer){$('#project-error').textContent='请填写有效的项目名称与采购单位。';return;}
    if(budget&&(Number(budget)<0||!Number.isFinite(Number(budget)))){$('#project-error').textContent='预算必须为非负数字。';return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||due<'1900-01-01'||due>'2100-12-31'){$('#project-error').textContent='请填写有效的截止日期（1900—2100 年）。';return;}
    const id=uid(),p={id,name,buyer,type:String(fd.get('type')),budget:budget||'未填写',due,code:'DEMO-'+id.toUpperCase(),status:'pending',progress:0,file:pendingFile?.name||'示例招标文件.pdf',chapters:{},completed:[],template:selectedTemplate};
    state.projects.unshift(p);state.risks.push(...makeProjectRisks(p));state.selected=id;persist();runAnalysis(p);
  }
  function runAnalysis(p) {if(analysisTimer)clearInterval(analysisTimer);modalType='progress';modal('正在解读招标文件','演示过程 · 使用示例条款模拟解析结果',`<div class="analysis-progress"><div class="spinner"></div><h3 id="analysis-heading">正在识别文档结构</h3><p>${esc(p.file)}</p><div class="progress"><span id="analysis-bar" style="width:8%"></span></div><div class="analysis-steps">${['识别文档与章节结构','提取资格条件和技术要求','梳理评分标准与风险事项','生成结构化响应清单'].map((s,i)=>`<div class="analysis-step ${i===0?'active':''}" id="analysis-step-${i}">${icon('doc')}<span>${s}</span></div>`).join('')}</div></div>`);let step=0;const names=['正在识别文档结构','正在提取响应要求','正在梳理关键评分项','正在生成分析结果'];analysisTimer=setInterval(()=>{const prev=$('#analysis-step-'+step);if(prev){prev.className='analysis-step done';prev.innerHTML=icon('checkCircle')+`<span>${['识别文档与章节结构','提取资格条件和技术要求','梳理评分标准与风险事项','生成结构化响应清单'][step]}</span>`;}step++;if(step>=4){clearInterval(analysisTimer);analysisTimer=null;p.status='drafting';p.progress=8;activity(p.name+' · 示例解析已完成');modalType=null;closeModal();analysisTab='requirements';navigate('analyze');toast('示例解析完成，可以查看要求或开始编写');return;}$('#analysis-step-'+step).classList.add('active');$('#analysis-heading').textContent=names[step];$('#analysis-bar').style.width=(step*25+10)+'%';},700);}
  function newMaterial() {pendingFile=null;modalType='material';modal('上传企业资料','将企业资质、项目业绩和人员资料整理到同一个空间。',`<form id="material-form"><div class="field"><label for="m-name">资料名称 <span style="color:#db776b">*</span></label><input id="m-name" name="name" required maxlength="80" placeholder="例如：项目经理近三个月社保证明"></div><div class="form-row"><div class="field"><label for="m-category">资料分类</label><select id="m-category" name="category">${['企业资质','项目业绩','人员资料','产品资料','财务资料'].map(n=>`<option>${n}</option>`).join('')}</select></div><div class="field"><label for="m-valid">有效期（选填）</label><input id="m-valid" name="valid" type="date"></div></div><div class="field"><label for="m-desc">资料说明</label><textarea id="m-desc" name="desc" maxlength="300" placeholder="补充适用范围、项目背景或注意事项"></textarea></div><div class="field"><label>资料文件 <span style="color:#db776b">*</span></label>${filePickerHTML('material')}<small>演示仅保存资料信息及文件名，不保存文件原件。</small></div><div class="form-error" id="material-error"></div></form>`,`${button('取消','close-modal','','outline')}<button class="btn btn-primary" type="submit" form="material-form">${icon('upload')}保存资料</button>`);}
  function saveMaterial(form) {if(conflictGuard()||!form.reportValidity())return;const fd=new FormData(form),name=String(fd.get('name')||'').trim();if(conflictGuard())return;if(!name){$('#material-error').textContent='请填写资料名称。';return;}if(!pendingFile){$('#material-error').textContent='请先选择资料文件。';return;}state.materials.unshift({id:uid(),name,category:String(fd.get('category')),valid:String(fd.get('valid')||'长期有效'),desc:String(fd.get('desc')||'新上传的企业资料'),file:pendingFile.name,color:'blue'});activity('企业资料库 · 新增 '+name);closeModal();view='materials';materialFilter='全部资料';materialSearch='';materialPage=1;updateRoute();shell();toast('资料信息已保存，文件原件未上传');}
  function exportDocument() {saveEditor(false);const p=project();const content=chapterNames.map((_,i)=>`<section style="page-break-before:always">${wordHTML(chapterHTML(p,i))}</section>`).join('');const html=`<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><title>${esc(p.name)}</title><style>body{font-family:'Microsoft YaHei',sans-serif;font-size:11pt;line-height:1.8;color:#26334b}h1,h2{text-align:center}h2{font-size:18pt}h3{font-size:13pt}table{width:100%;border-collapse:collapse}td,th{border:1px solid #a9b4c8;padding:8px;text-align:left}.cover{text-align:center;padding-top:120px}</style></head><body><div class="cover"><h1>${esc(p.name)}</h1><h2>投 标 文 件</h2><p>项目编号：${esc(p.code)}</p><p>采购单位：${esc(p.buyer)}</p><p>演示草稿 · 正式提交前请审核企业事实、承诺及附件</p></div>${content}</body></html>`;download(p.name+'_演示标书.doc','application/msword;charset=utf-8','\ufeff'+html);activity(p.name+' · 已导出 Word 兼容文档');toast('已导出 Word 兼容文档（.doc），可使用 Word / WPS 编辑');}
  function download(name,type,content) {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name.replace(/[<>:"/\\|?*]/g,'_');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  function riskModal(id) {const r=state.risks.find(r=>r.id===id);if(!r)return;modalType='risk';modal('处理检查事项',r.title,`<div class="notice">${icon('alert')}${esc(r.desc)}</div><div class="field"><label for="risk-note">处理记录 <span style="color:#db776b">*</span></label><textarea id="risk-note" maxlength="2000" placeholder="记录补充的材料、调整的内容或核验结论…"></textarea><small>此操作记录人工确认结果，不代表系统完成真实合规审查。</small></div>${r.kind==='evidence'?`<div class="field"><label>补充证明材料 <span style="color:#db776b">*</span></label>${filePickerHTML('risk')}<small>请先选择证明文件，演示仅记录文件名；正式投标需附原件并审核。</small></div>`:''}<div class="form-error" id="risk-error"></div>`,`${button('取消','close-modal','','outline')}${button('确认已处理','confirm-risk','check','primary',`data-id="${id}"`)}`);pendingFile=null;}
  function confirmRisk(id) {
    if(conflictGuard())return;
    const r=state.risks.find(r=>r.id===id),note=$('#risk-note')?.value.trim();if(!r)return;
    if(!note){$('#risk-error').textContent='请填写处理记录，便于后续审核。';return;}
    if(r.kind==='evidence'&&!pendingFile){$('#risk-error').textContent='请先选择补充的证明材料。';return;}
    const p=state.projects.find(p=>p.id===r.projectId);
    if(r.kind==='service'&&p){
      const html=chapterHTML(p,7),text=plainText(html);
      const old=/4\s*小时(?:内)?\s*响应/g,newText=/2\s*小时(?:内)?\s*响应/;
      if(!old.test(text)&&!newText.test(text)){$('#risk-error').textContent='未找到可直接修订的响应时间。请先在售后服务章节明确“2 小时内响应”，再回来核验。';return;}
      p.chapters[7]=cleanHTML(html.replace(/4\s*小时(?:内)?\s*响应(?:【待核验：示例招标要求为 2 小时内响应】)?/g,'2 小时内响应（已记录人工确认）'));p.serviceConfirmed=true;
      if(p.status==='ready'||p.status==='review')p.status='drafting';
    }
    r.resolved=true;r.note=note;r.handledAt=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
    if(pendingFile&&r.kind==='evidence'){state.materials.unshift({id:uid(),name:'项目经理社保证明',category:'人员资料',file:pendingFile.name,valid:'长期有效',desc:'合规检查补充材料 · '+note,color:'green'});r.attachment=pendingFile.name;}
    activity('合规检查 · '+r.title+'已记录处理');closeModal();shell();toast(storageFailed?'处理记录仅在本页，请先导出备份':'处理记录已保存');
  }
  async function act(action,el) {
    if(storageConflict&&['new-project','new-material','use-template','resolve-risk','confirm-risk','regenerate','reset','save','start-writing','advance-status'].includes(action)){conflictGuard();return;}
    if(action==='clear-file'){pendingFile=null;const input=$('.modal input[type=file]');if(input)input.value='';$('#file-selected').innerHTML='';$('#file-zone').style.display='';return;}
    if(action==='paginate'){if(el.dataset.kind==='projects'){projectPage=Number(el.dataset.page);$('#project-list').innerHTML=projectList();}else{materialPage=Number(el.dataset.page);$('#material-list').innerHTML=materialCards();}return;}
    if(action==='retry-save'){saveEditor(false);if(persist())toast('本地保存已恢复');return;}
    if(action==='reload-latest'){skipUnloadSave=true;location.reload();return;}
    if(action==='recovery-backup'){download('标智AI_原始数据.txt','text/plain;charset=utf-8',recoveryRaw);return;}
    if(action==='advance-status'){saveEditor(false);const p=project();if(p.completed.length<8){toast('请先逐章核验并保存全部 8 个章节');return;}if(state.risks.some(r=>r.projectId===p.id&&!r.resolved)){toast('当前项目仍有待处理的检查事项，请先完成核验');return;}p.status=p.status==='review'?'ready':'review';activity(p.name+' · '+statuses[p.status][0]);renderView();toast('项目状态已更新：'+statuses[p.status][0]);return;}
    if(action==='new-project')return newProject();
    if(action==='guide'){modalType='guide';modal('一份标书，四步完成','从理解需求到交付草稿，体验完整的编标工作流。',`<div class="walkthrough">${[['导入招标','建立项目，上传招标文件，集中管理投标信息。'],['理解要求','梳理资格条件、评分标准与关键风险。'],['AI 编写','匹配企业资料，按章节起草并编辑内容。'],['检查导出','核验关键事项，导出可编辑的标书草稿。']].map(([n,d],i)=>`<div class="walk-step"><b>0${i+1}</b><h3>${n}</h3><p>${d}</p></div>`).join('')}</div><div class="notice" style="margin:20px 0 0">${icon('spark')}本演示使用示例分析及草稿，不连接真实 AI 服务。</div>`,`${button('查看示例解读','guide-analyze','doc','outline')}${button('新建我的项目','new-project','plus')}`,true);return;}
    if(action==='close-modal')return closeModal();
    if(action==='toggle-nav'){syncSidebar(!$('.sidebar').classList.contains('open'));return;}
    if(action==='close-nav'){syncSidebar();$('[data-action="toggle-nav"]')?.focus();return;}
    if(action==='guide-analyze'){closeModal();navigate('analyze');return;}
    if(action==='pick-file'){$('#'+el.dataset.target)?.click();return;}
    if(action==='open-project'){saveEditor(false);state.selected=el.dataset.id;chapter=0;persist();if(project().status==='pending')runAnalysis(project());else navigate('editor');return;}
    if(action==='chapter'){saveEditor(false);chapter=Number(el.dataset.index);updateRoute(true);renderView();return;}
    if(action==='save')return saveEditor();
    if(action==='analyze')return navigate('analyze');
    if(action==='start-writing'){saveEditor(false);const p=project();if(p.status==='pending')p.status='drafting';persist();chapter=0;navigate('editor');toast('已生成示例章节，可直接编辑');return;}
    if(action==='export')return exportDocument();
    if(action==='regenerate'){if(generationTimer){toast('已有章节正在优化，请稍候。');return;}saveEditor(false);const p=project(),targetChapter=chapter;el.disabled=true;el.innerHTML=icon('spark')+'正在优化…';generationTimer=setTimeout(()=>{generationTimer=null;const addition='<h3>补充：执行与审核要点</h3><p>建议为本章节建立要求响应清单，逐条对应招标条款、企业证明和交付承诺；明确责任人和验证方式，并在正式递交前完成复核。</p>';if(view==='editor'&&project().id===p.id&&chapter===targetChapter)saveEditor(false);p.chapters[targetChapter]=chapterHTML(p,targetChapter)+addition;if(p.status==='ready'||p.status==='review')p.status='drafting';activity(p.name+' · 章节示例优化完成');if(view==='editor'&&project().id===p.id&&chapter===targetChapter)renderView();toast('已补充示例建议，请结合实际项目审核');},1200);return;}
    if(action==='new-material')return newMaterial();
    if(action==='material-filter'){materialFilter=el.dataset.value;materialPage=1;renderView();return;}
    if(action==='material-detail'){const m=state.materials.find(m=>m.id===el.dataset.id);modalType='detail';modal(esc(m.name),'企业资料索引 · 文件原件不存储于演示空间',`<div class="info-list" style="padding:0">${[['资料分类',m.category],['文件名称',m.file],['有效期限',m.valid],['资料说明',m.desc]].map(([n,v])=>`<div class="info-row"><small>${n}</small><strong>${esc(v)}</strong></div>`).join('')}</div>`,button('知道了','close-modal','','primary'));return;}
    if(action==='template-preview'){const i=Number(el.dataset.index),t=templates[i];modalType='template';modal(esc(t.name),t.desc,`<div class="template-detail"><h3>标书章节结构</h3>${chapterNames.map((n,i)=>`<div>0${i+1}　${n}</div>`).join('')}</div><div class="notice" style="margin:18px 0 0">${icon('template')}使用模板后将创建新项目，具体内容根据项目资料填写。</div>`,`${button('取消','close-modal','','outline')}${button('使用此模板','use-template','plus','primary',`data-index="${i}"`)}`);return;}
    if(action==='use-template')return newProject(null,Number(el.dataset.index));
    if(action==='analysis-tab'){analysisTab=el.dataset.value;renderView();return;}
    if(action==='risks')return navigate('risks');
    if(action==='resolve-risk')return riskModal(el.dataset.id);
    if(action==='confirm-risk')return confirmRisk(el.dataset.id);
    if(action==='risk-history'){const r=state.risks.find(r=>r.id===el.dataset.id);modalType='history';modal('处理记录',r.title,`<div class="template-detail"><h3>人工确认结果</h3><p>${esc(r.note)}</p>${r.attachment?`<p>补充材料：${esc(r.attachment)}</p>`:''}<p style="margin-top:12px;font-size:11px">处理时间：${esc(r.handledAt)}</p></div>`,button('关闭','close-modal','','outline'));return;}
    if(action==='export-risks'){const text=state.risks.map((r,i)=>`${i+1}. [${r.resolved?'已处理':r.levelText}] ${r.title}\n关联项目：${state.projects.find(p=>p.id===r.projectId)?.name}\n检查依据：${r.source}\n问题描述：${r.desc}\n处理记录：${r.note||'未处理'}\n`).join('\n');download('标智AI_演示检查清单.txt','text/plain;charset=utf-8','\ufeff演示检查清单（示例数据，正式投标需人工审核）\n\n'+text);toast('检查清单已导出');return;}
    if(action==='notifications'){modalType='activity';modal('工作动态','查看演示空间中的最近操作。',`<div class="activity" style="display:block;padding:0">${activityHTML(state.activity)}</div>`,button('关闭','close-modal','','outline'));return;}
    if(action==='backup'){saveEditor(false);download('标智AI_演示数据备份.json','application/json;charset=utf-8',JSON.stringify(state,null,2));toast('演示数据备份已导出');return;}
    if(action==='reset-confirm'){modalType='reset';modal('恢复初始演示','此操作会清除当前浏览器中本演示的修改。',`<div class="notice" style="margin:0">${icon('alert')}你新建的项目、章节修改、资料索引及处理记录将被清除。建议先在设置中导出备份。</div>`,`${button('取消','close-modal','','outline')}${button('确认重置','reset','','danger')}`);return;}
    if(action==='reset'){if(generationTimer){clearTimeout(generationTimer);generationTimer=null;}state=normalizeState(seed());recoveryMessage='';recoveryRaw='';persist();closeModal();chapter=0;materialFilter='全部资料';materialSearch='';navigate('dashboard');toast('已恢复初始演示数据');return;}
  }
  document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){e.preventDefault();navigate(nav.dataset.nav);return;}const el=e.target.closest('[data-action]');if(el){e.preventDefault();act(el.dataset.action,el);return;}if(e.target.classList.contains('modal-overlay'))closeModal();});
  document.addEventListener('submit',e=>{if(e.target.id==='project-form'){e.preventDefault();createProject(e.target);}if(e.target.id==='material-form'){e.preventDefault();saveMaterial(e.target);}if(e.target.id==='global-search'){e.preventDefault();const q=String(new FormData(e.target).get('query')||'').trim();navigate('projects');filterText=q;renderView();}});
  document.addEventListener('input',e=>{if(e.target.id==='project-search'){filterText=e.target.value;projectPage=1;$('#project-list').innerHTML=projectList();}if(e.target.id==='material-search'){materialSearch=e.target.value;materialPage=1;$('#material-list').innerHTML=materialCards();}if(e.target.closest('#editor-paper')){if($('#save-status'))$('#save-status').textContent='正在保存…';$('#word-count').textContent=($('#editor-paper').textContent||'').length+' 字';clearTimeout(saveEditor.timer);saveEditor.timer=setTimeout(()=>saveEditor(false),450);}});
  document.addEventListener('change',e=>{if(e.target.id==='status-filter'){filterStatus=e.target.value;projectPage=1;$('#project-list').innerHTML=projectList();}if(e.target.type==='file'&&e.target.files[0])showFile(e.target.files[0]);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('.modal'))closeModal();else syncSidebar();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&view==='editor'){e.preventDefault();if(!$('.modal'))saveEditor();}if((e.key==='Enter'||e.key===' ')&&e.target.matches('.upload-zone[role=button]')){e.preventDefault();act(e.target.dataset.action,e.target);}if(e.key==='Tab'&&$('.modal')){const items=[...$('.modal').querySelectorAll('button:not(:disabled),input:not([hidden]),select,textarea,[tabindex="0"]')];if(!items.length){e.preventDefault();$('.modal').focus();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  function insertEditorText(text){const paper=$('#editor-paper'),selection=window.getSelection();if(!paper||!selection.rangeCount)return;const range=selection.getRangeAt(0);if(!paper.contains(range.commonAncestorContainer))return;range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);saveEditor(false);$('#word-count').textContent=(paper.textContent||'').length+' 字';}
  document.addEventListener('paste',e=>{if(e.target.closest('#editor-paper')){e.preventDefault();if(!storageConflict)insertEditorText(e.clipboardData.getData('text/plain'));}});
  document.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault();const zone=e.target.closest('[data-drop]');if(zone){e.preventDefault();zone.classList.add('drag');}});
  document.addEventListener('dragleave',e=>e.target.closest('[data-drop]')?.classList.remove('drag'));
  document.addEventListener('drop',e=>{
    const paper=e.target.closest('#editor-paper'),zone=e.target.closest('[data-drop]');
    if(paper){e.preventDefault();if(e.dataTransfer.files.length){toast('请将附件添加到企业资料库。');return;}if(!storageConflict){const text=e.dataTransfer.getData('text/plain');paper.focus();insertEditorText(text);}return;}
    if(!zone){if(e.dataTransfer.files.length){e.preventDefault();toast('请将文件拖入上传区域。');}return;}
    e.preventDefault();zone.classList.remove('drag');if(e.dataTransfer.files.length>1){toast('每次请选择一个文件。');return;}
    const file=e.dataTransfer.files[0];if(!file)return;if(zone.dataset.drop==='project'&&!$('#project-form'))newProject(file);else showFile(file);
  });
  window.addEventListener('beforeunload',()=>{if(!skipUnloadSave)saveEditor(false);});
  window.addEventListener('resize',()=>syncSidebar($('.sidebar')?.classList.contains('open')));
  window.addEventListener('storage',event=>{if(event.key!==STORE&&event.key!==null)return;const current=event.key===null?null:event.newValue;if(current===lastStoredRaw)return;saveEditor(false);storageConflict=true;if(generationTimer){clearTimeout(generationTimer);generationTimer=null;}updateStorageBanner();const paper=$('#editor-paper');if(paper)paper.contentEditable='false';});
  window.addEventListener('popstate',()=>{if(analysisTimer){clearInterval(analysisTimer);analysisTimer=null;}if($('.modal')){modalType=null;closeModal();}saveEditor(false);restoreRoute();filterText='';filterStatus='all';shell();});
  restoreRoute();updateRoute(true);
  shell();
})();
