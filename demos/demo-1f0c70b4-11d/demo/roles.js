/* Local role journeys: separate clinical decisions, execution and financial review. */
(function(D){
 'use strict';
 const {q,q1,val,run,insert,update,get,fail,now}=D;
 const version='role-journeys-20261111-v1',init=D.systemInit,authorize=D.systemAuthorize;
 const extra={2:['crm','claims','oa','expenses'],3:['services','oa','expenses'],4:['crm','claims','oa'],5:['inventory','operations','oa','expenses']};
 const originalWrites={2:['patients','appointments','services','system'],3:['visits','lis','imaging','consult','care'],4:['billing','expenses','operations'],5:['care']};
 const originalReads={2:['dashboard','patients','appointments','billing','crm','services','system'],3:['dashboard','patients','appointments','visits','lis','imaging','consult','care','system'],4:['dashboard','billing','expenses','operations','system'],5:['dashboard','patients','care','inventory','system']};
 D.systemInit=function(){
  const changed=init();if(val('SELECT value FROM sys_meta WHERE key=?',[version]))return changed;
  // Only extend shipped defaults. Custom role definitions and account bindings survive upgrades.
  Object.keys(extra).forEach(id=>{const r=get('sys_roles',Number(id)),writes=JSON.parse(r.write_modules);if(JSON.stringify(writes)!==JSON.stringify(originalWrites[id])||r.modules!==JSON.stringify(originalReads[id]))return;update('sys_roles',r.id,{modules:JSON.stringify([...new Set([...JSON.parse(r.modules),...extra[id]])]),write_modules:JSON.stringify([...new Set([...writes,...extra[id]])])});});
  const find=(role,name,dept)=>q1("SELECT id FROM staff WHERE role=? AND status='在职' ORDER BY id",[role])?.id||insert('staff',{name,role,title:role,dept,phone:'',specialty:'虚构岗位演示员工',work_years:3,status:'在职',created_at:now()});
  const front=find('前台','林晓雨（演示）','客户服务'),finance=find('财务','郑嘉宁（演示）','财务部');
  const bindings=[[1,'院长演示账号',1,1,q1("SELECT id FROM staff WHERE role='店长' AND status='在职' ORDER BY id")?.id],[2,'前台演示账号',2,2,front],[4,'财务演示账号',4,4,finance],[5,'护理演示账号',5,5,q1("SELECT id FROM staff WHERE role IN('护士','助理') AND status='在职' ORDER BY id")?.id]];
  bindings.forEach(([id,name,rid,old,sid])=>{const a=q1('SELECT * FROM sys_accounts WHERE id=?',[id]);if(sid&&a?.display_name===name&&a.role_id===rid&&a.staff_id===old)update('sys_accounts',id,{staff_id:sid});});
  q('SELECT announcement_id FROM oa_announcement_reads WHERE is_read=1').forEach(r=>run('INSERT OR IGNORE INTO sys_meta(key,value) VALUES(?,?)',['oa-read-1-'+r.announcement_id,now()]));
  insert('sys_meta',{key:version,value:now()});return true;
 };
 D.roleActor=()=>q1("SELECT name FROM sqlite_master WHERE type='table' AND name='sys_accounts'")?D.systemIdentity()?.display_name||'系统':'系统初始化';
 function rule(method,path,d){
  if(method==='GET'||path==='/api/system/session'||/^\/api\/portal\/(?!consultations\/)/.test(path))return;
  const who=D.systemIdentity();if(who.role_id===1)return;
  const rid=who.role_id,self=(id)=>Number(id)===who.staff_id,manager=()=>fail('此操作由院长/管理员处理');
  let m;
  if(/^\/api\/services\/plans\/\d+\/execute$/.test(path)&&rid!==3)fail('免疫及健康计划执行须由医生确认');
  if(path.startsWith('/api/services/')&&rid===3&&!/^\/api\/services\/plans(?:\/\d+(?:\/(execute|cancel))?)?$/.test(path))fail('医生负责健康计划，权益购买与客户运营由前台处理');
  if(path.startsWith('/api/claims/')&&rid===2&&/\/actions?$/.test(path)&&!['submit','resubmit','withdraw','reopen'].includes(d.action))fail('院内审核、保险核定及赔付由院长或财务处理');
  if(path.startsWith('/api/oa/')){
   if(path==='/api/oa/approvals'&&!self(d.applicant_id))fail('只能以本人身份发起办公申请');
   if((m=path.match(/^\/api\/oa\/approvals\/(\d+)\/action$/))){const r=get('oa_approvals',+m[1]);if(d.action!=='withdraw')manager();if(!self(r.applicant_id))fail('只能撤回本人的申请');}
   if(path==='/api/oa/schedule'||path==='/api/oa/announcements'||path==='/api/oa/documents')manager();
   if(path==='/api/oa/attendance'&&!self(d.staff_id))fail('只能登记本人的考勤');
   if(path==='/api/oa/tasks'&&!self(d.assignee_id))fail('跨员工分配任务由院长处理');
   if((m=path.match(/^\/api\/oa\/tasks\/(\d+)$/))){const r=get('oa_tasks',+m[1]);if(!self(r.assignee_id)||d.assignee_id&&!self(d.assignee_id))fail('只能更新本人负责的任务');}
  }
  if(path.startsWith('/api/expenses/')){
   let r;if((m=path.match(/^\/api\/expenses\/requests\/(\d+)/)))r=get('expense_requests',+m[1]);
   if((m=path.match(/^\/api\/expenses\/attachments\/(\d+)$/)))r=get('expense_requests',get('expense_attachments',+m[1]).request_id);
   if(path==='/api/expenses/import-oa'){r=get('oa_approvals',Number(d.approval_id));if(!self(r.applicant_id))fail('只能转入本人的办公报销');}
   const action=path.endsWith('/action')?d.action:'';
   if(['approve','return','reject'].includes(action)){if(rid!==4||r.status!=='财务复核')fail('当前环节由科室负责人/院长或财务复核人处理');if(self(r.applicant_id))fail('不能审核本人的报销，请由院长复核');}
   else if(['pay','reverse'].includes(action)){if(rid!==4)fail('付款与冲正由财务处理');if(self(r.applicant_id))fail('本人报销由院长核对付款');}
   else if(r&&!self(r.applicant_id)||d.applicant_id&&!self(d.applicant_id))fail('只能编辑、提交或撤回本人的费用报销');
  }
  if(path.startsWith('/api/care/')){
   const clinical=/\/admissions\/\d+\/(orders|discharge)$|\/visits\/\d+\/(assistants|followup|specialties)$|\/specialties\/|\/rx-templates$|\/templates$/.test(path)||/^\/api\/care\/documents(?:\/\d+(?:\/(request|withdraw|sign))?)?$/.test(path);
   if(clinical&&rid!==3)fail('医嘱、出院决策及医疗文书由医生处理');
   if(/\/orders\/\d+\/action$/.test(path)&&d.action==='cancel'&&rid!==3)fail('取消医嘱由医生处理');
   if(d.staff_id&&Number(d.staff_id)!==who.staff_id)fail('操作人员须为当前账号本人');
  }
  if(path.startsWith('/api/operations/')&&rid===5&&!/^\/api\/operations\/transfers(?:\/\d+\/action)?$/.test(path))fail('护理药房仅可办理库存调拨');
 }
 D.systemAuthorize=function(method,path,d){authorize(method,path);rule(method,path,d||{});};
 D.systemCan=function(method,path,d){try{D.systemAuthorize(method,path,d||{});return true;}catch(_){return false;}};
 D.roleResponse=function(method,path,result){
  if(!path.startsWith('/api/oa/'))return result;
  const who=D.systemIdentity(),readKey=id=>'oa-read-'+who.id+'-'+id,mark=r=>Object.assign(r,{is_read:val('SELECT value FROM sys_meta WHERE key=?',[readKey(r.id)])?1:0});
  const m=path.match(/^\/api\/oa\/announcements\/(\d+)\/read$/);
  if(method==='POST'&&m&&!val('SELECT value FROM sys_meta WHERE key=?',[readKey(+m[1])]))insert('sys_meta',{key:readKey(+m[1]),value:now()});
  if(method==='GET'&&path==='/api/oa/announcements')result.items=result.items.map(mark);
  else if(/^\/api\/oa\/announcements\/\d+(?:\/read)?$/.test(path)){mark(result);result.read_count=result.is_read;}
  else if(path==='/api/oa/overview'){result.announcements=result.announcements.map(mark);result.kpi.unread_announcements=q('SELECT id FROM oa_announcements').filter(r=>!mark(r).is_read).length;}
  return result;
 };
})(window.Demo);
