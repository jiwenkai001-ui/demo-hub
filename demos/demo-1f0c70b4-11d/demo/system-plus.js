/* Reception customer display and editable owner-service content. */
(function(D){
 'use strict';
 const {add,q,q1,val,run,get,insert,update,fail,int,now,date}=D;
 const defaults={hero_title:'每一次陪伴，都值得悉心守护',hero_subtitle:'预约、报告、会员权益，一站照顾爱宠健康',hospital_intro:'提供门诊诊疗、免疫驱虫、健康体检、住院护理与持续回访服务。',opening_hours:'每日 08:30–21:00',emergency_phone:'',notice:'首次到院请携带既往病历及免疫记录；急症请先电话联系医院。',service_tags:['专业诊疗','全程照护','透明收费']};
 const clean=(v,label,max,optional)=>{const s=String(v??'').trim();if((!optional&&!s)||s.length>max)fail(label+'请填写'+(optional?'不超过':'1至')+max+'字');return s;};
 const admin=()=>{const a=D.systemIdentity();if(!a.enabled||a.role_id!==1)fail('仅管理员可以配置微信服务内容');};
 const portal=()=>{const row=get('sys_portal_content',1);return {...row,service_tags:JSON.parse(row.service_tags)};};
 D.systemPlusInit=function(){
  if(val("SELECT value FROM sys_meta WHERE key='service-v1'"))return false;
  run('CREATE TABLE IF NOT EXISTS sys_portal_content(id INTEGER PRIMARY KEY,hero_title TEXT,hero_subtitle TEXT,hospital_intro TEXT,opening_hours TEXT,emergency_phone TEXT,notice TEXT,service_tags TEXT,updated_at TEXT)');
  run('CREATE TABLE IF NOT EXISTS sys_front_display(id INTEGER PRIMARY KEY,mode TEXT,invoice_id INTEGER REFERENCES invoices(id),updated_at TEXT,expires_at TEXT)');
  insert('sys_portal_content',{id:1,...defaults,service_tags:JSON.stringify(defaults.service_tags),updated_at:now()});
  insert('sys_front_display',{id:1,mode:'welcome',invoice_id:null,updated_at:now(),expires_at:null});
  insert('sys_meta',{key:'service-v1',value:now()});return true;
 };
 add('GET','/system/portal-settings',portal);
 add('PUT','/system/portal-settings',(p,d)=>{admin();const tags=Array.isArray(d.service_tags)?d.service_tags:String(d.service_tags||'').split(/[，,\n]/);if(tags.length>5)fail('服务标签最多5项');const fields={hero_title:clean(d.hero_title,'首页标题',36),hero_subtitle:clean(d.hero_subtitle,'首页副标题',80),hospital_intro:clean(d.hospital_intro,'医院介绍',600),opening_hours:clean(d.opening_hours,'营业时间',80),emergency_phone:clean(d.emergency_phone,'急诊联系电话',30,true),notice:clean(d.notice,'到院提示',200,true),service_tags:JSON.stringify([...new Set(tags.map(t=>clean(t,'服务标签',10)).filter(Boolean))]),updated_at:now()};update('sys_portal_content',1,fields);return portal();});
 add('GET','/system/display-options',()=>({items:q("SELECT i.id,i.invoice_no,i.payable,i.paid_amount,i.status,p.name AS pet_name,o.name AS owner_name FROM invoices i LEFT JOIN pets p ON p.id=i.pet_id LEFT JOIN owners o ON o.id=i.owner_id WHERE i.status<>'已退费' ORDER BY i.id DESC LIMIT 100"),state:get('sys_front_display',1)}));
 add('PUT','/system/customer-display',(p,d)=>{if(!['welcome','queue','invoice'].includes(d.mode))fail('展示模式无效');const inv=d.mode==='invoice'?get('invoices',int(d.invoice_id),'账单'):null;if(inv?.status==='已退费')fail('退费账单不再向客户展示，请选择有效账单');const until=new Date(Date.now()+5*60000);return update('sys_front_display',1,{mode:d.mode,invoice_id:inv?.id||null,updated_at:now(),expires_at:inv?until.toISOString():null});});
 add('GET','/system/customer-display',()=>{
  const state=get('sys_front_display',1),expired=state.expires_at&&new Date(state.expires_at).getTime()<=Date.now(),mode=expired?'welcome':state.mode;
  const result={mode,updated_at:state.updated_at,expires_at:state.expires_at,settings:D.systemSettings(),portal:portal(),invoice:null,queue:[]};
  if(mode==='invoice'){
   const inv=get('invoices',state.invoice_id),owner=inv.owner_id?get('owners',inv.owner_id):null,pet=inv.pet_id?get('pets',inv.pet_id):null;
   result.invoice={id:inv.id,invoice_no:inv.invoice_no,owner_name:owner?owner.name.slice(0,1)+'**':'到店客户',pet_name:pet?.name||'商品零售',total_amount:inv.total_amount,discount:inv.discount,payable:inv.payable,paid_amount:inv.paid_amount,status:inv.status,remaining:Math.max(0,D.money(inv.payable-inv.paid_amount)),items:q('SELECT name,item_type,qty,unit_price,amount FROM invoice_items WHERE invoice_id=? ORDER BY id',[inv.id])};
  }
  if(mode==='queue')result.queue=q("SELECT t.ticket_no,t.status,p.name AS pet_name,s.name AS doctor_name FROM sys_queue t JOIN visits v ON v.id=t.visit_id JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE t.queue_date=? AND t.status IN('等待叫号','叫号中') AND v.status NOT IN('已完成','已取消') ORDER BY CASE t.status WHEN '叫号中' THEN 0 ELSE 1 END,t.id",[date()]).map(x=>({...x,pet_name:x.pet_name.slice(0,1)+'**'}));
  return result;
 });
 add('GET','/system/doctor-board',p=>{
  const id=int(p.staff_id);if(id)get('staff',id,'医生');const args=id?[id]:[],where=id?' AND v.doctor_id=?':'';
  return {admissions:q("SELECT a.id,a.admission_no,a.kind,a.admitted_at,p.name AS pet_name,v.doctor_id,(SELECT COUNT(*) FROM care_orders co WHERE co.admission_id=a.id AND co.status='待执行') AS pending_orders FROM care_admissions a JOIN visits v ON v.id=a.visit_id JOIN pets p ON p.id=a.pet_id WHERE a.status='在院'"+where+' ORDER BY a.id DESC LIMIT 30',args),appointments:q("SELECT a.id,a.appt_no,a.scheduled_at,a.status,p.name AS pet_name FROM appointments a JOIN pets p ON p.id=a.pet_id WHERE a.status='待到店' AND substr(a.scheduled_at,1,10)=?"+(id?' AND a.doctor_id=?':'')+' ORDER BY a.scheduled_at',[date(),...args]),consultations:q("SELECT c.id,c.title,c.status,c.created_at,p.name AS pet_name FROM consultations c LEFT JOIN pets p ON p.id=c.pet_id WHERE c.status IN ('进行中','待回复')"+(id?' AND c.doctor_id=?':'')+' ORDER BY c.id DESC LIMIT 20',args),low_stock:q("SELECT id,name,stock_qty,safety_stock,unit FROM products WHERE status='在售' AND stock_qty<=safety_stock ORDER BY stock_qty LIMIT 10")};
 });
})(window.Demo);
