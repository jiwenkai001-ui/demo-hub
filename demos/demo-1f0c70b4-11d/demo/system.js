/* Reception, role demonstration and verified local backup. No external services. */
(function(D){
 'use strict';
 const {add,q,q1,val,run,get,insert,update,fail,int,now,date}=D;
 const modules=['dashboard','patients','appointments','visits','lis','imaging','crm','billing','claims','inventory','consult','oa','expenses','care','services','operations','system'];
 let selected=1;
 const text=(v,label,max=500)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)fail(label+'须填写1至'+max+'字');return v.trim();};
 const parse=(v)=>{try{return JSON.parse(v);}catch(_){return [];}};
 function identity(){let id=selected;try{id=Number(sessionStorage.getItem('pet-demo-account'))||selected;}catch(_){}return q1('SELECT a.*,r.name AS role_name,r.modules,r.write_modules FROM sys_accounts a JOIN sys_roles r ON r.id=a.role_id WHERE a.id=?',[id])||q1('SELECT a.*,r.name AS role_name,r.modules,r.write_modules FROM sys_accounts a JOIN sys_roles r ON r.id=a.role_id WHERE a.id=1');}
 D.systemIdentity=identity;
 const clientPortal=path=>path.startsWith('/api/portal/')&&!/^\/api\/portal\/consultations\//.test(path);
 function moduleFor(path){if(/^\/api\/portal\/consultations\//.test(path))return 'consult';if(clientPortal(path))return null;if(path.startsWith('/api/system/'))return 'system';if(path.startsWith('/api/emr/owners')||path.startsWith('/api/emr/pets'))return 'patients';if(path.startsWith('/api/emr/appointments'))return 'appointments';if(path.startsWith('/api/emr/'))return 'visits';return ({bill:'billing',inv:'inventory',crm:'crm',dashboard:'dashboard',lis:'lis',imaging:'imaging',oa:'oa',claims:'claims',expenses:'expenses',care:'care',services:'services',operations:'operations'})[path.split('/')[2]];}
 D.systemAuthorize=function(method,path){
   if(method==='GET'||path==='/api/system/session'||clientPortal(path))return;
   const who=identity();if(!who||!who.enabled)fail('当前演示账号已停用，请切换可用账号');const key=moduleFor(path);
   if(key&&!parse(who.write_modules).includes(key))fail('当前角色无此模块的操作权限，请切换演示角色');
 };
 D.systemAudit=function(method,path){if(clientPortal(path)||path==='/api/system/session')return;const who=identity();insert('sys_audit',{actor:who?who.display_name:'演示账号',method,path,created_at:now()});};
 D.systemSettings=()=>q1('SELECT * FROM sys_settings WHERE id=1');
 D.systemEnqueue=function(visitId){const v=get('visits',int(visitId),'就诊'),old=q1('SELECT * FROM sys_queue WHERE visit_id=?',[v.id]);if(old)return old;if(!['待接诊','诊疗中'].includes(v.status))fail('只能将待接诊或诊疗中的就诊加入队列');const count=Number(val('SELECT COUNT(*) FROM sys_queue WHERE queue_date=?',[date()]));const id=insert('sys_queue',{ticket_no:'A'+String(count+1).padStart(3,'0'),queue_date:date(),visit_id:v.id,status:v.status==='诊疗中'?'已入诊':'等待叫号',calls:0,last_called_at:null,created_at:now()});queueHistory(id,'加入队列',v.status==='诊疗中'?'已入诊':'等待叫号');return get('sys_queue',id);};
 function queueHistory(id,action,status,comment){const who=identity();insert('sys_queue_history',{queue_id:id,action,status,comment:comment||'',actor:who?who.display_name:'系统',created_at:now()});}
 function queue(){return q('SELECT t.*,p.name AS pet_name,p.species,s.name AS doctor_name,v.doctor_id,v.visit_no,v.status AS visit_status,o.name AS owner_name FROM sys_queue t JOIN visits v ON v.id=t.visit_id JOIN pets p ON p.id=v.pet_id JOIN owners o ON o.id=v.owner_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE t.queue_date=? ORDER BY t.id',[date()]).map(t=>Object.assign(t,{status:['已完成','已取消'].includes(t.visit_status)?'已结束':t.status}));}
 function accountDetail(){const who=identity();return {id:who.id,staff_id:who.staff_id,role_id:who.role_id,name:who.display_name,role:who.role_name,enabled:!!who.enabled,modules:who.enabled?parse(who.modules):['system'],write_modules:who.enabled?parse(who.write_modules):[],demo:true};}
 D.systemInit=function(){
  run('CREATE TABLE IF NOT EXISTS sys_meta(key TEXT PRIMARY KEY,value TEXT)');
  const changed=!val("SELECT value FROM sys_meta WHERE key='queue-v2'");
  run('CREATE TABLE IF NOT EXISTS sys_queue_history(id INTEGER PRIMARY KEY AUTOINCREMENT,queue_id INTEGER REFERENCES sys_queue(id),action TEXT,status TEXT,comment TEXT,actor TEXT,created_at TEXT)');
  if(changed)insert('sys_meta',{key:'queue-v2',value:now()});
  if(val("SELECT value FROM sys_meta WHERE key='v1'"))return changed;
  const statements=[
   'CREATE TABLE sys_settings(id INTEGER PRIMARY KEY,hospital_name TEXT,phone TEXT,address TEXT,print_footer TEXT,logo_text TEXT)',
   'CREATE TABLE sys_roles(id INTEGER PRIMARY KEY,name TEXT UNIQUE,modules TEXT,write_modules TEXT)',
   'CREATE TABLE sys_accounts(id INTEGER PRIMARY KEY AUTOINCREMENT,staff_id INTEGER REFERENCES staff(id),display_name TEXT,role_id INTEGER REFERENCES sys_roles(id),enabled INTEGER DEFAULT 1)',
   'CREATE TABLE sys_queue(id INTEGER PRIMARY KEY AUTOINCREMENT,ticket_no TEXT,queue_date TEXT,visit_id INTEGER UNIQUE REFERENCES visits(id),status TEXT,calls INTEGER,last_called_at TEXT,created_at TEXT,UNIQUE(queue_date,ticket_no))',
   'CREATE TABLE sys_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor TEXT,method TEXT,path TEXT,created_at TEXT)',
   'CREATE TABLE sys_backup_log(id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT,note TEXT,created_at TEXT)'
  ];statements.forEach(s=>run(s));
  insert('sys_settings',{id:1,hospital_name:'宠爱动物医院',phone:'0519-88880000',address:'示范路88号（虚构地址）',print_footer:'本资料用于本地演示，具体诊疗请遵医嘱。',logo_text:'宠爱'});
  const roles=[['院长/管理员',modules,modules],['接待前台',['dashboard','patients','appointments','billing','crm','services','system'],['patients','appointments','services','system']],['临床医生',['dashboard','patients','appointments','visits','lis','imaging','consult','care','system'],['visits','lis','imaging','consult','care']],['财务出纳',['dashboard','billing','expenses','operations','system'],['billing','expenses','operations']],['护理药房',['dashboard','patients','care','inventory','system'],['care']]];
  roles.forEach((r,i)=>insert('sys_roles',{id:i+1,name:r[0],modules:JSON.stringify(r[1]),write_modules:JSON.stringify(r[2])}));
  const staff=q("SELECT id,name,role FROM staff WHERE status='在职' ORDER BY id");
  [['院长演示账号',1],['前台演示账号',2],['医生演示账号',3],['财务演示账号',4],['护理演示账号',5]].forEach((a,i)=>insert('sys_accounts',{staff_id:staff[i%staff.length].id,display_name:a[0],role_id:a[1],enabled:1}));
  q("SELECT id FROM visits WHERE substr(visited_at,1,10)=? AND status IN('待接诊','诊疗中') ORDER BY id LIMIT 3",[date()]).forEach(v=>D.systemEnqueue(v.id));
  insert('sys_meta',{key:'v1',value:now()});return true;
 };
 add('GET','/system/session',accountDetail);
 add('GET','/system/settings',()=>D.systemSettings());
 add('GET','/system/options',()=>({modules,roles:q('SELECT * FROM sys_roles'),accounts:q('SELECT a.id,a.display_name,a.enabled,r.name AS role_name FROM sys_accounts a JOIN sys_roles r ON r.id=a.role_id'),staff:q("SELECT id,name,role FROM staff WHERE status='在职'"),visits:q("SELECT v.id,v.visit_no,p.name AS pet_name,s.name AS doctor_name FROM visits v JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.status IN('待接诊','诊疗中') AND NOT EXISTS(SELECT 1 FROM sys_queue t WHERE t.visit_id=v.id) ORDER BY v.id DESC LIMIT 100")}));
 add('POST','/system/session',(p,d)=>{const a=get('sys_accounts',int(d.account_id),'账号');if(!a.enabled)fail('账号已停用');selected=a.id;try{sessionStorage.setItem('pet-demo-account',String(a.id));}catch(_){}return accountDetail();});
 add('PUT','/system/settings',(p,d)=>{const who=identity();if(who.role_id!==1)fail('仅管理员可以修改医院配置');const data={hospital_name:text(d.hospital_name,'医院名称',60),phone:text(d.phone,'电话',30),address:text(d.address,'地址',150),print_footer:text(d.print_footer,'打印页脚',200),logo_text:text(d.logo_text,'品牌简称',4)};return update('sys_settings',1,data);});
 add('GET','/system/queue',()=>({items:queue(),settings:D.systemSettings()}));
 add('POST','/system/queue',(p,d)=>D.systemEnqueue(d.visit_id));
 add('GET','/system/queue/{id}/history',p=>{get('sys_queue',p.id,'排队记录');return {items:q('SELECT * FROM sys_queue_history WHERE queue_id=? ORDER BY id',[p.id])};});
 add('POST','/system/queue/{id}/action',(p,d)=>{
  const t=get('sys_queue',p.id,'排队记录'),v=get('visits',t.visit_id),action=d.action;
  if(t.queue_date!==date())fail('只能处理今日队列');
  if(['已完成','已取消'].includes(v.status))fail('关联就诊已结束，队列已自动结束');
  if(action==='call'||action==='recall'){if(!(action==='call'?['等待叫号','过号']:['叫号中']).includes(t.status))fail('当前状态不可叫号');update('sys_queue',t.id,{status:'叫号中',calls:t.calls+1,last_called_at:now()});}
  else if(action==='start'){if(!['叫号中','等待叫号'].includes(t.status))fail('当前状态不能入诊');update('sys_queue',t.id,{status:'已入诊'});if(v.status==='待接诊')D.setVisitStatus(v.id,'诊疗中');}
  else if(action==='skip'){if(t.status!=='叫号中')fail('只有已叫号记录可标记过号');update('sys_queue',t.id,{status:'过号'});}
  else if(action==='restore'){if(!['过号','已取消'].includes(t.status))fail('当前记录不可恢复');update('sys_queue',t.id,{status:'等待叫号'});}
  else if(action==='cancel'){if(!['等待叫号','叫号中','过号'].includes(t.status))fail('当前记录不可取消');text(d.comment,'取消原因');update('sys_queue',t.id,{status:'已取消'});}
  else fail('排队操作无效');const result=queue().find(x=>x.id===t.id);queueHistory(t.id,({call:'叫号',recall:'重呼',start:'入诊',skip:'过号',restore:'恢复',cancel:'取消'})[action],result.status,action==='cancel'?d.comment.trim():'');return result;
 });
 add('GET','/system/caller',p=>{const phone=String(p.phone||'').trim();if(!/^\d{11}$/.test(phone))fail('请输入完整的11位手机号');const owner=q1('SELECT * FROM owners WHERE phone=?',[phone]);return {owner,pets:owner?q('SELECT * FROM pets WHERE owner_id=?',[owner.id]):[]};});
 add('GET','/system/accounts',()=>({items:q('SELECT a.*,s.name AS staff_name,r.name AS role_name FROM sys_accounts a JOIN staff s ON s.id=a.staff_id JOIN sys_roles r ON r.id=a.role_id'),roles:q('SELECT * FROM sys_roles')}));
 add('POST','/system/accounts',(p,d)=>{if(identity().role_id!==1)fail('仅管理员可以管理账号');get('staff',int(d.staff_id),'员工');get('sys_roles',int(d.role_id),'角色');const name=text(d.display_name,'账号名',40);if(q1('SELECT id FROM sys_accounts WHERE display_name=?',[name]))fail('账号名称重复');return get('sys_accounts',insert('sys_accounts',{staff_id:int(d.staff_id),display_name:name,role_id:int(d.role_id),enabled:1}));});
 add('PUT','/system/accounts/{id}',(p,d)=>{if(identity().role_id!==1)fail('仅管理员可以管理账号');const a=get('sys_accounts',p.id),rid=int(d.role_id),enabled=d.enabled?1:0;get('sys_roles',rid,'角色');if(a.id===identity().id&&(rid!==1||!enabled))fail('不能停用当前管理员或移除自己的管理员角色');if(a.role_id===1&&(rid!==1||!enabled)&&val('SELECT COUNT(*) FROM sys_accounts WHERE role_id=1 AND enabled=1')<=1)fail('至少保留一个可用管理员');return update('sys_accounts',a.id,{role_id:rid,enabled});});
 add('GET','/system/audit',()=>({items:q('SELECT * FROM sys_audit ORDER BY id DESC LIMIT 100').map(r=>Object.assign(r,{module:moduleFor(r.path),record_id:(r.path.match(/\/(\d+)(?:\/|$)/)||[])[1]||'—'}))}));
 add('GET','/system/doctor',p=>{const id=int(p.staff_id),suffix=id?' AND v.doctor_id=?':'',args=id?[id]:[];return {visits:q("SELECT v.id,v.visit_no,v.status,v.diagnosis,p.name AS pet_name,o.name AS owner_name FROM visits v JOIN pets p ON p.id=v.pet_id JOIN owners o ON o.id=v.owner_id WHERE v.status IN('待接诊','诊疗中')"+suffix+' ORDER BY v.id DESC LIMIT 30',args),labs:q("SELECT l.id,l.order_no,l.panel,l.status,p.name AS pet_name FROM lab_orders l JOIN visits v ON v.id=l.visit_id JOIN pets p ON p.id=v.pet_id WHERE l.status IN('已开单','已采样','检测中','已完成')"+suffix+' ORDER BY l.id DESC LIMIT 20',args),images:q("SELECT i.id,i.study_uid AS study_no,i.modality,i.body_part,i.status,p.name AS pet_name FROM imaging_studies i JOIN visits v ON v.id=i.visit_id JOIN pets p ON p.id=v.pet_id WHERE i.status!='已报告'"+suffix+' ORDER BY i.id DESC LIMIT 20',args)};});
 add('GET','/system/backup',()=>{if(identity().role_id!==1)fail('仅管理员可以导出完整业务备份');return {_exportSnapshot:true,summary:{customers:val('SELECT COUNT(*) FROM owners'),pets:val('SELECT COUNT(*) FROM pets'),visits:val('SELECT COUNT(*) FROM visits'),claims:val('SELECT COUNT(*) FROM medical_claims'),expenses:val('SELECT COUNT(*) FROM expense_requests')}};});
 add('POST','/system/backup/check',(p,d)=>{if(identity().role_id!==1)fail('仅管理员可以校验备份');return D.inspectSnapshot(d.payload);});
 add('POST','/system/backup/restore',(p,d)=>{if(identity().role_id!==1)fail('仅管理员可以恢复备份');if(d.confirm!=='恢复备份')fail('请明确确认恢复备份');D.inspectSnapshot(d.payload);return {_restoreSnapshot:d.payload.database};});
 add('GET','/system/integrations',()=>({items:[{name:'LIS化验设备',mode:'本地模拟',description:'已有设备状态、结果回传及审核流程；未连接实体设备。',target:'lis'}, {name:'PACS医学影像',mode:'图片演示',description:'已有影像归档与阅片；未接医院PACS服务器，不声明具备原始DICOM解析。',target:'imaging'},{name:'收银支付',mode:'本地模拟',description:'收退款流水与会员余额联动，不向微信、支付宝或银行发起交易。',target:'billing'},{name:'短信与通知',mode:'本地记录',description:'模板与通知可预览、记录，无外部短信发送。',target:'services'},{name:'医疗电子签',mode:'本地签署',description:'记录签署人、时间和文书快照，未接第三方数字证书。',target:'care'},{name:'来电识别',mode:'号码查询',description:'输入号码匹配已有客户，不接电话硬件或自动读取来电。',target:'system',arg:'reception'},{name:'AI辅助诊断',mode:'知识工具',description:'提供诊疗资料与剂量换算；未接AI模型，不生成自动诊断。',target:'care',arg:'tools'}]}));
})(window.Demo);
