/* 院内费用报销：明细、票据、多级审批和出纳登记，均为本地演示。 */
(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,int,money,date,now,filters,paged}=D;
  const CATEGORIES=['药品耗材','设备维修','差旅培训','行政办公','其他'];
  const STAGES=['科室审核','财务复核','院长审批'];
  const STATUS=['草稿','科室审核','财务复核','院长审批','待补正','待付款','已付款','已驳回','已撤回','已冲正'];
  const THRESHOLD=3000;
  const SELECT='SELECT r.*,s.name AS applicant_name,s.dept,s.role FROM expense_requests r JOIN staff s ON s.id=r.applicant_id';
  function text(v,label,max=2000){if(typeof v!=='string'||!v.trim())fail(label+'不能为空');if(v.trim().length>max)fail(label+'不能超过'+max+'字');return v.trim();}
  function day(v,label){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||date(new Date(v+'T12:00:00'))!==v)fail(label+'无效');return v;}
  function amount(v,label){if(v===''||v==null||!Number.isFinite(Number(v))||Number(v)<=0||Number(v)>1000000||Math.abs(Number(v)*100-Math.round(Number(v)*100))>.00001)fail(label+'须为大于0、最多两位小数的金额');return money(v);}
  function account(v){v=text(v,'收款账号',80).replace(/ /g,'');if(/^\*{4}[A-Za-z0-9]{4}$/.test(v))return v;if(v.length<6||!/^[A-Za-z0-9@._+\-]+$/.test(v)||!/[A-Za-z0-9]{4}$/.test(v))fail('收款账号至少6位且末4位须为字母数字，系统仅保存末4位');return '****'+v.slice(-4);}
  function mask(v){return /^\*{4}[A-Za-z0-9]{4}$/.test(v)?v:'';}
  function staff(id){const s=get('staff',int(id),'员工');if(s.status!=='在职')fail('请选择在职员工');return s;}
  function history(id,action,from,to,comment,operator){insert('expense_history',{request_id:id,action,from_status:from,to_status:to,comment:comment||'',operator:D.roleActor?D.roleActor():(operator||'admin · 经办人（演示）'),created_at:now()});}
  function ref(){return 'EX'+date().replace(/-/g,'')+String(Number(val('SELECT COALESCE(MAX(id),0) FROM expense_requests'))+1).padStart(5,'0');}
  function summary(id){return q1(SELECT+' WHERE r.id=?',[int(id)])||fail('费用报销单不存在');}
  function editable(r){if(!['草稿','待补正'].includes(r.status))fail('当前状态不可编辑，请先退回或撤回');}
  function validate(d,id){
    const person=staff(d.applicant_id), title=text(d.title,'报销标题',100),purpose=text(d.purpose,'报销事由');
    if(!Array.isArray(d.items)||!d.items.length||d.items.length>30)fail('请填写1至30条费用明细');
    const seen=new Set();
    const items=d.items.map((i,index)=>{
      if(!CATEGORIES.includes(i.category))fail('费用类别无效');
      const when=day(i.date,'费用日期');if(when>date())fail('费用日期不能晚于今天');
      const no=text(i.invoice_no,'第'+(index+1)+'条票据号',100).toUpperCase();
      if(seen.has(no))fail('同一报销单不能重复使用票据号');seen.add(no);
      const duplicate=q1("SELECT x.id FROM expense_items x JOIN expense_requests r ON r.id=x.request_id WHERE x.invoice_no=? AND x.request_id<>? AND r.status NOT IN('已驳回','已撤回','已冲正')",[no,int(id)]);
      if(duplicate)fail('票据号已用于其他有效报销单：'+no);
      return {category:i.category,expense_date:when,description:text(i.description,'费用说明',300),amount:amount(i.amount,'明细金额'),invoice_no:no};
    });
    const total=money(items.reduce((s,i)=>s+i.amount,0));if(total>1000000)fail('单次报销总额不能超过100万元');
    return {person,title,purpose,payee_name:text(d.payee_name,'收款人',50),payee_account:account(d.payee_account),items,total};
  }
  function replaceItems(id,items){run('DELETE FROM expense_items WHERE request_id=?',[id]);items.forEach(i=>insert('expense_items',Object.assign({request_id:id},i)));}
  function create(d){const v=validate(d);const id=insert('expense_requests',{request_no:ref(),applicant_id:v.person.id,title:v.title,purpose:v.purpose,payee_name:v.payee_name,payee_account:v.payee_account,total_amount:v.total,status:'草稿',resume_stage:'',source_oa_id:null,created_at:now(),updated_at:now(),submitted_at:null,paid_at:null});replaceItems(id,v.items);history(id,'创建草稿','','草稿','录入费用和收款信息');return detail(id);}
  function checks(r){
    const lines=q('SELECT * FROM expense_items WHERE request_id=?',[r.id]);
    const duplicates=lines.filter(i=>q1("SELECT x.id FROM expense_items x JOIN expense_requests r ON r.id=x.request_id WHERE x.invoice_no=? AND x.request_id<>? AND r.status NOT IN('已驳回','已撤回','已冲正')",[i.invoice_no,r.id]));
    return [
      {label:'费用明细与金额',passed:lines.length>0&&money(lines.reduce((s,i)=>s+i.amount,0))===r.total_amount,message:'每项费用须有日期、用途、票据号和金额'},
      {label:'票据未重复报销',passed:duplicates.length===0,message:duplicates.length?'发现其他有效申请使用了同一票据号':'票据号核对通过'},
      {label:'票据或凭证附件',passed:Number(val('SELECT COUNT(*) FROM expense_attachments WHERE request_id=?',[r.id]))>0,message:'至少上传一份票据/付款凭证；演示样例文件明确标记'},
      {label:'收款人及账号',passed:!!r.payee_name&&/^\*{4}[A-Za-z0-9]{4}$/.test(r.payee_account),message:'请补充收款信息，系统仅保存账号末4位'},
      {label:'申请人在职',passed:get('staff',r.applicant_id).status==='在职',message:'申请人须为在职员工'}
    ];
  }
  function detail(id){const r=summary(id);r.items=q('SELECT *,expense_date AS date FROM expense_items WHERE request_id=? ORDER BY id',[r.id]);r.attachments=q('SELECT * FROM expense_attachments WHERE request_id=? ORDER BY id',[r.id]);r.history=q('SELECT * FROM expense_history WHERE request_id=? ORDER BY id',[r.id]);r.payments=q('SELECT * FROM expense_payments WHERE request_id=? ORDER BY id',[r.id]);r.payee_account_masked=mask(r.payee_account);r.checks=checks(r);r.threshold=THRESHOLD;
    const route=['草稿','科室审核','财务复核'].concat(r.total_amount>=THRESHOLD?['院长审批']:[]).concat(['待付款','已付款']);const at=route.indexOf(r.status==='待补正'?r.resume_stage:r.status);
    r.route=route.map((label,index)=>({key:label,label,status:at<0?'inactive':index<at?'done':index===at?'current':'pending'}));return r;}
  function syncOA(r,action,comment){if(!r.source_oa_id)return;const status=['待付款','已付款'].includes(r.status)?'已通过':r.status==='已驳回'?'已驳回':['已撤回','已冲正'].includes(r.status)?'已撤回':'待审批';update('oa_approvals',r.source_oa_id,{status,amount:r.total_amount,updated_at:now()});insert('oa_approval_history',{approval_id:r.source_oa_id,action:'费用中心 · '+action,operator:'费用流程同步',comment:r.request_no+' · '+r.status+'；'+(comment||''),created_at:now()});}
  function change(r,status,action,comment,operator){update('expense_requests',r.id,{status,updated_at:now()});history(r.id,action,r.status,status,comment,operator);syncOA(get('expense_requests',r.id),action,comment);return detail(r.id);}
  function safeAttachment(d){
    const name=text(d.name,'附件名称',120).replace(/[\\/:*?"<>|]/g,'_'), mime=d.mime;
    if(!['image/png','image/jpeg','application/pdf'].includes(mime))fail('附件仅支持PNG、JPG和PDF');
    const prefix='data:'+mime+';base64,';if(typeof d.data_url!=='string'||!d.data_url.startsWith(prefix))fail('附件格式与文件类型不匹配');
    const b64=d.data_url.slice(prefix.length);if(b64.length>4*1024*1024)fail('每份附件须大于0且不超过3MB');if(!/^[A-Za-z0-9+/]*={0,2}$/.test(b64))fail('附件数据无效');
    let bytes;try{bytes=atob(b64);}catch(_){fail('附件数据无法读取');}if(!bytes.length||bytes.length>3*1024*1024)fail('每份附件须大于0且不超过3MB');
    if(mime==='application/pdf'&&!bytes.startsWith('%PDF-')||mime==='image/png'&&!bytes.startsWith('\x89PNG\r\n\x1a\n')||mime==='image/jpeg'&&bytes.slice(0,3)!=='\xff\xd8\xff')fail('附件内容不是有效的'+mime+'文件');
    return {name,mime,data_url:d.data_url,size:bytes.length,is_demo:0,created_at:now()};
  }
  function act(id,d){
    const r=summary(id),a=d.action,comment=typeof d.comment==='string'?d.comment.trim():'';
    if(a==='submit'){
      editable(r);const bad=checks(r).filter(c=>!c.passed);if(bad.length)fail('提交前请完善：'+bad.map(c=>c.label).join('、'));
      update('expense_requests',r.id,{submitted_at:now()});return change(r,r.status==='待补正'&&STAGES.includes(r.resume_stage)?r.resume_stage:'科室审核','提交申请',comment||'资料核对完成，提交审批');
    }
    if(a==='approve'){
      if(!STAGES.includes(r.status))fail('当前单据不在可审批状态，不能重复审批');text(comment,'审批意见');
      const bad=checks(r).filter(c=>!c.passed);if(bad.length)fail('资料检查未通过：'+bad.map(c=>c.label).join('、'));
      const next=r.status==='科室审核'?'财务复核':r.status==='财务复核'&&r.total_amount>=THRESHOLD?'院长审批':'待付款';
      return change(r,next,'审批通过',comment,({科室审核:'科室负责人',财务复核:'财务复核人',院长审批:'院长'})[r.status]+'（演示）');
    }
    if(a==='return'){
      if(!STAGES.includes(r.status))fail('仅审批中的单据可退回补正');text(comment,'补正说明');update('expense_requests',r.id,{resume_stage:r.status});return change(r,'待补正','退回补正',comment,'审核人（演示）');
    }
    if(a==='reject'){
      if(!STAGES.includes(r.status))fail('仅审批中的单据可驳回');text(comment,'驳回原因');return change(r,'已驳回','驳回',comment,'审核人（演示）');
    }
    if(a==='withdraw'){
      if(!['草稿','待补正','待付款'].concat(STAGES).includes(r.status))fail('当前状态不能撤回');text(comment,'撤回原因');return change(r,'已撤回','撤回',comment);
    }
    if(a==='reopen'){
      if(!['已驳回','已撤回','已冲正'].includes(r.status))fail('当前状态不能重新发起');if(!checks(r).find(c=>c.label==='票据未重复报销').passed)fail('票据已被其他有效报销单占用，不能重新发起');update('expense_requests',r.id,{resume_stage:'',submitted_at:null,paid_at:null});return change(r,'草稿','重新发起',comment||'重新核对明细及票据');
    }
    if(a==='pay'){
      if(r.status!=='待付款')fail('仅已完成审批的待付款单据可登记，不能重复付款');
      const bad=checks(r).filter(c=>!c.passed);if(bad.length)fail('付款前校验失败：'+bad.map(c=>c.label).join('、'));
      const paymentNo=text(d.payment_no,'付款凭证号',100),when=day(d.paid_at,'付款日期');if(when>date()||when<r.submitted_at.slice(0,10))fail('付款日期须在提交日和今天之间');
      if(!['银行转账','微信','支付宝','现金'].includes(d.pay_method))fail('付款方式无效');if(d.amount!==undefined&&amount(d.amount,'付款金额')!==r.total_amount)fail('付款金额须等于已审核报销总额');if(q1('SELECT id FROM expense_payments WHERE payment_no=?',[paymentNo]))fail('付款凭证号已登记');
      insert('expense_payments',{request_id:r.id,amount:r.total_amount,payment_no:paymentNo,pay_method:d.pay_method,paid_at:when,comment:comment||'模拟付款登记',created_at:now()});update('expense_requests',r.id,{paid_at:when});return change(r,'已付款','登记付款',comment||'登记出纳付款凭证，不触发真实转账','出纳（演示）');
    }
    if(a==='reverse'){
      if(r.status!=='已付款')fail('仅已付款单据可冲正且不可重复冲正');text(comment,'冲正原因');
      const net=money(val('SELECT COALESCE(SUM(amount),0) FROM expense_payments WHERE request_id=?',[r.id]));if(net<=0)fail('该单据没有可冲正金额');
      insert('expense_payments',{request_id:r.id,amount:-net,payment_no:'REV-'+r.request_no+'-'+String(Number(val('SELECT COALESCE(MAX(id),0) FROM expense_payments'))+1),pay_method:'冲正',paid_at:date(),comment,created_at:now()});return change(r,'已冲正','冲正登记',comment,'出纳（演示）');
    }
    fail('不支持的费用报销操作');
  }
  D.expenseOAGuard=function(id){if(q1('SELECT id FROM expense_requests WHERE source_oa_id=?',[id]))fail('该申请已转入院内费用报销，请在费用中心处理审批与付款');};
  D.expenseOASummary=function(id){return q1('SELECT id,request_no,status FROM expense_requests WHERE source_oa_id=?',[id]);};
  D.expensesInit=function(){
    if(q1("SELECT name FROM sqlite_master WHERE type='table' AND name='expense_meta'")&&val("SELECT value FROM expense_meta WHERE key='v1'")){if(!val("SELECT value FROM expense_meta WHERE key='privacy-v2'")){q('SELECT id,payee_account FROM expense_requests').forEach(r=>{let a='';try{if(r.payee_account)a=account(r.payee_account);}catch(_){}update('expense_requests',r.id,{payee_account:a});});run("INSERT INTO expense_meta(key,value) VALUES('privacy-v2',?)",[now()]);return true;}return false;}
    const schema="CREATE TABLE IF NOT EXISTS expense_meta(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE IF NOT EXISTS expense_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,request_no TEXT UNIQUE NOT NULL,applicant_id INTEGER NOT NULL REFERENCES staff(id),title TEXT NOT NULL,purpose TEXT NOT NULL,payee_name TEXT NOT NULL,payee_account TEXT NOT NULL,total_amount REAL NOT NULL,status TEXT NOT NULL,resume_stage TEXT DEFAULT '',source_oa_id INTEGER UNIQUE REFERENCES oa_approvals(id),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,submitted_at TEXT,paid_at TEXT); CREATE TABLE IF NOT EXISTS expense_items(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id INTEGER NOT NULL REFERENCES expense_requests(id),category TEXT NOT NULL,expense_date TEXT NOT NULL,description TEXT NOT NULL,amount REAL NOT NULL,invoice_no TEXT NOT NULL); CREATE TABLE IF NOT EXISTS expense_attachments(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id INTEGER NOT NULL REFERENCES expense_requests(id),name TEXT NOT NULL,mime TEXT NOT NULL,data_url TEXT DEFAULT '',size INTEGER DEFAULT 0,is_demo INTEGER DEFAULT 0,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS expense_history(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id INTEGER NOT NULL REFERENCES expense_requests(id),action TEXT NOT NULL,from_status TEXT,to_status TEXT,comment TEXT,operator TEXT,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS expense_payments(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id INTEGER NOT NULL REFERENCES expense_requests(id),amount REAL NOT NULL,payment_no TEXT NOT NULL,pay_method TEXT NOT NULL,paid_at TEXT NOT NULL,comment TEXT,created_at TEXT NOT NULL);";
    schema.split(';').map(s=>s.trim()).filter(Boolean).forEach(s=>run(s));
    const people=q("SELECT * FROM staff WHERE status='在职' ORDER BY id");
    const examples=[['草稿','护理耗材补购',286,'药品耗材'],['科室审核','输液泵维修费用',860,'设备维修'],['财务复核','兽医影像培训报名',1680,'差旅培训'],['院长审批','诊疗设备年度维护',4200,'设备维修'],['待补正','前台打印及办公用品',238,'行政办公'],['待付款','住院部消毒耗材',685,'药品耗材'],['已付款','护理培训交通费用',126,'差旅培训'],['已驳回','非院务个人采购',99,'其他']];
    examples.forEach((x,i)=>{
      const person=people[i%people.length],r=create({applicant_id:person.id,title:x[1]+'（演示）',purpose:'用于医院日常经营及团队协作的虚构费用样例，未发生真实支出。',payee_name:person.name,payee_account:'DEMO-ACCOUNT-'+String(i+1).padStart(4,'0'),items:[{category:x[3],date:date(),description:x[1],amount:x[2],invoice_no:'DEMO-EX-20261111-'+i}]});
      insert('expense_attachments',{request_id:r.id,name:'虚构票据说明-'+r.request_no+'.txt',mime:'text/plain',data_url:'',size:0,is_demo:1,created_at:now()});
      if(x[0]==='草稿')return;
      act(r.id,{action:'submit'});
      if(x[0]==='科室审核')return;
      if(x[0]==='待补正'){act(r.id,{action:'return',comment:'请补充采购付款凭证及用途说明（演示）'});return;}
      if(x[0]==='已驳回'){act(r.id,{action:'reject',comment:'费用与院务无关，不予报销（演示）'});return;}
      act(r.id,{action:'approve',comment:'用途与费用已核对（演示）'});if(x[0]==='财务复核')return;
      act(r.id,{action:'approve',comment:'票据金额和账号核对通过（演示）'});if(x[0]==='院长审批')return;
      if(x[0]==='已付款')act(r.id,{action:'pay',payment_no:'DEMO-PAY-0001',paid_at:date(),pay_method:'银行转账',comment:'虚构付款样例，未真实转账'});
    });
    run("INSERT INTO expense_meta(key,value) VALUES('v1',?)",[now()]);run("INSERT INTO expense_meta(key,value) VALUES('privacy-v2',?)",[now()]);return true;
  };
  add('GET','/expenses/options',()=>({staff:q("SELECT id,name,dept,role FROM staff WHERE status='在职' ORDER BY id"),categories:CATEGORIES,threshold:THRESHOLD,statuses:STATUS}));
  add('GET','/expenses/overview',()=>({kpi:{draft:Number(val("SELECT COUNT(*) FROM expense_requests WHERE status='草稿'")),pending:Number(val("SELECT COUNT(*) FROM expense_requests WHERE status IN('科室审核','财务复核','院长审批')")),need_material:Number(val("SELECT COUNT(*) FROM expense_requests WHERE status='待补正'")),payable:Number(val("SELECT COUNT(*) FROM expense_requests WHERE status='待付款'")),paid_amount:money(val('SELECT COALESCE(SUM(amount),0) FROM expense_payments'))},recent:q(SELECT+' ORDER BY r.id DESC LIMIT 6'),by_category:q('SELECT i.category,SUM(i.amount) AS amount FROM expense_items i JOIN expense_requests r ON r.id=i.request_id WHERE r.status NOT IN(\'已驳回\',\'已撤回\',\'已冲正\') GROUP BY i.category'),stages:q('SELECT status,COUNT(*) AS count FROM expense_requests GROUP BY status'),threshold:THRESHOLD}));
  add('GET','/expenses/requests',p=>{const f=filters({'r.status':p.status==='pending'?'':p.status},p.keyword,['r.title','r.request_no','s.name']);if(p.status==='pending')f.sql+=(f.sql?' AND ':' WHERE ')+"r.status IN('科室审核','财务复核','院长审批')";return paged(SELECT,f,'r.id DESC',p);});
  add('POST','/expenses/requests',(p,d)=>create(d));
  add('GET','/expenses/requests/{id}',p=>detail(p.id));
  add('PUT','/expenses/requests/{id}',(p,d)=>{const r=summary(p.id);editable(r);if(r.source_oa_id&&int(d.applicant_id)!==get('oa_approvals',r.source_oa_id).applicant_id)fail('OA转入申请不能更换申请人，请撤回后重新发起');d=Object.assign({},d,{payee_account:d.payee_account&&String(d.payee_account).trim()?d.payee_account:r.payee_account});const v=validate(d,r.id);update('expense_requests',r.id,{applicant_id:v.person.id,title:v.title,purpose:v.purpose,payee_name:v.payee_name,payee_account:v.payee_account,total_amount:v.total,resume_stage:r.status==='待补正'?'科室审核':r.resume_stage,updated_at:now()});replaceItems(r.id,v.items);history(r.id,'修改申请',r.status,r.status,r.status==='待补正'?'明细或收款资料变更，重新提交后从科室审核开始':'更新明细及收款信息');syncOA(get('expense_requests',r.id),'修改申请','明细金额已同步，需按当前流程审核');return detail(r.id);});
  add('POST','/expenses/requests/{id}/attachments',(p,d)=>{const r=summary(p.id);editable(r);const a=safeAttachment(d);if(Number(val('SELECT COUNT(*) FROM expense_attachments WHERE request_id=?',[r.id]))>=15||Number(val('SELECT COALESCE(SUM(size),0) FROM expense_attachments WHERE request_id=?',[r.id]))+a.size>12*1024*1024)fail('每单最多15份附件，总大小不超过12MB');const id=insert('expense_attachments',Object.assign({request_id:r.id},a));history(r.id,'上传凭证',r.status,r.status,a.name);return get('expense_attachments',id);});
  add('DELETE','/expenses/attachments/{id}',p=>{const a=get('expense_attachments',p.id,'附件'),r=summary(a.request_id);editable(r);run('DELETE FROM expense_attachments WHERE id=?',[a.id]);history(r.id,'删除凭证',r.status,r.status,a.name);return {ok:true};});
  add('POST','/expenses/requests/{id}/action',(p,d)=>act(p.id,d));
  add('POST','/expenses/import-oa',(p,d)=>{
    const a=get('oa_approvals',int(d.approval_id),'OA申请');if(a.type!=='报销')fail('仅OA报销申请可以转入费用中心');const existing=q1('SELECT id FROM expense_requests WHERE source_oa_id=?',[a.id]);if(existing)return detail(existing.id);
    if(!['待审批','已通过'].includes(a.status))fail('仅待审批或已通过的OA报销可转入');
    const person=staff(a.applicant_id),r=create({applicant_id:person.id,title:a.title,purpose:a.reason,payee_name:person.name,payee_account:'DEMO-UNSET-0000',items:[{category:'其他',date:a.created_at.slice(0,10)>date()?date():a.created_at.slice(0,10),description:a.reason.slice(0,300),amount:a.amount,invoice_no:'OA-'+a.approval_no}]});
    update('expense_requests',r.id,{source_oa_id:a.id,payee_account:''});history(r.id,'由OA转入','',r.status,'来源：'+a.approval_no+'；原审批历史保留，当前状态同步费用审核；需补齐票据与账号。');syncOA(get('expense_requests',r.id),'由OA转入','原审批历史保留，当前转费用中心处理');return detail(r.id);
  });
})(window.Demo);
