/* Browser-side clinical demo operations, preserving the original records and workflow. */
(function (D) {
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,now,next,filters,paged,items}=D;
  function patient(oid,pid) {
    if(D.servicesPetGuard)D.servicesPetGuard(int(pid));
    get('owners',int(oid),'客户'); const pet=get('pets',int(pid),'宠物');
    if(pet.owner_id!==int(oid))fail('所选宠物不属于该客户，请重新选择');return pet;
  }
  function doctor(id) { if(!int(id))return null;const s=get('staff',int(id),'医生');if(s.role!=='医生'||s.status!=='在职')fail('请选择在职医生');return s; }
  function clinicalVisitGuard(id) {const v=get('visits',int(id),'就诊记录');if(v.status==='已取消')fail('该就诊已取消，请新建就诊后继续诊疗');patient(v.owner_id,v.pet_id);return v;}
  D.clinicalVisitGuard=clinicalVisitGuard;
  function editableInvoice(inv) { if(inv&&(n(inv.paid_amount)>0||inv.status==='已退费'))fail('已收款或已退费账单不可修改项目，请先完成退费处理');if(inv&&q1("SELECT name FROM sqlite_master WHERE type='table' AND name='demo_invoice_coupons'")&&q1('SELECT invoice_id FROM demo_invoice_coupons WHERE invoice_id=?',[inv.id]))fail('已关联优惠券账单不可修改项目，请先解除优惠券'); }
  Object.assign(D,{validatePatient:patient,validateDoctor:doctor,editableInvoice});
  function recalc(id) {
    const inv=get('invoices',id), total=money(val('SELECT COALESCE(SUM(amount),0) FROM invoice_items WHERE invoice_id=?',[id]));
    const discount=Math.min(Math.max(money(inv.discount),0),total),payable=money(total-discount), paid=money(inv.paid_amount);
    return update('invoices',id,{total_amount:total,discount,payable,status:payable===0||paid>=payable?'已结清':paid<=0?'待缴费':'部分缴费'});
  }
  function ensureInvoice(vid) {
    if(!vid) return null;
    const v=q1('SELECT * FROM visits WHERE id=?',[vid]); if(!v) return null;
    return q1('SELECT * FROM invoices WHERE visit_id=?',[vid]) || get('invoices',insert('invoices',{
      invoice_no:next('INV','invoices','invoice_no'),owner_id:v.owner_id,pet_id:v.pet_id,visit_id:vid,
      total_amount:0,discount:0,payable:0,paid_amount:0,status:'待缴费',pay_method:'',cashier:'',paid_at:null,created_at:now()
    }));
  }
  function charge(vid,type,name,qty,price,refID) {
    if(vid)clinicalVisitGuard(vid);
    const inv=ensureInvoice(vid); if(!inv) return null;
    editableInvoice(inv);
    qty=n(qty,1); price=money(price);
    if(qty<=0||price<0)fail('数量必须大于 0，价格不能为负数');
    insert('invoice_items',{invoice_id:inv.id,item_type:type,name,ref_id:refID,qty,unit_price:price,amount:money(qty*price)});
    return recalc(inv.id);
  }
  function uncharge(type,refID) {
    q('SELECT id,invoice_id FROM invoice_items WHERE item_type=? AND ref_id=?',[type,refID]).forEach(r=>{
      editableInvoice(get('invoices',r.invoice_id));
      run('DELETE FROM invoice_items WHERE id=?',[r.id]); recalc(r.invoice_id);
    });
  }
  function stock(pid,delta,type,refNo,operator='',batchId=null) {
    if(!Number.isFinite(Number(delta)))fail('库存变动数量无效');
    const p=get('products',pid,'商品'), before=money(p.stock_qty), after=money(before+Number(delta));
    if(after<0)fail(`库存不足：${p.name} 仅剩 ${before}${p.unit}`);
    if(Number(delta)<0&&D.changeBatches)D.changeBatches(pid,Number(delta),refNo,type,batchId);
    update('products',pid,{stock_qty:after});
    insert('inventory_logs',{product_id:pid,change_qty:delta,before_qty:before,after_qty:after,log_type:type,ref_no:refNo,operator,created_at:now()});
    return [before,after];
  }
  Object.assign(D,{recalc,ensureInvoice,charge,uncharge,stock});
  add('GET','/health',()=>({status:'ok',service:'宠物医院管理系统'}));
  add('GET','/emr/staff',p=>{const f=filters({role:p.role});return items('SELECT * FROM staff'+f.sql+' ORDER BY id',f.args);});
  add('GET','/emr/owners',p=>paged(`SELECT o.*, (SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count,
    (SELECT card_no FROM membership_cards mc WHERE mc.owner_id=o.id LIMIT 1) AS card_no,
    (SELECT level FROM membership_cards mc WHERE mc.owner_id=o.id LIMIT 1) AS card_level FROM owners o`,
    filters({member_level:p.level,life_stage:p.stage},p.keyword,['name','phone']),'o.id DESC',p));
  add('POST','/emr/owners',(p,d)=>{
    const name=(d.name||'').trim(),phone=(d.phone||'').trim();
    if(!name||!phone) fail('姓名与手机号必填');
    if(!/^1\d{10}$/.test(phone))fail('请输入11位有效手机号');
    if(q1('SELECT id FROM owners WHERE phone=?',[phone])) fail('该手机号已存在');
    return get('owners',insert('owners',{name,phone,gender:d.gender??'未知',wechat:d.wechat??'',address:d.address??'',member_level:d.member_level??'普通客户',life_stage:d.life_stage??'新客',source_channel:d.source_channel??'自然到店',points:0,balance:0,total_spend:0,visit_count:0,last_visit_at:null,tags:d.tags??'',remark:d.remark??'',created_at:now()}));
  });
  add('GET','/emr/owners/{id}',p=>{
    const o=get('owners',p.id,'客户');
    o.pets=q('SELECT * FROM pets WHERE owner_id=? ORDER BY id DESC',[p.id]);
    o.cards=q('SELECT * FROM membership_cards WHERE owner_id=?',[p.id]);
    o.coupons=q('SELECT * FROM coupons WHERE owner_id=? ORDER BY id DESC',[p.id]);
    o.visits=q(`SELECT v.id,v.visit_no,v.visited_at,v.diagnosis,v.status,p.name AS pet_name,s.name AS doctor_name
      FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.owner_id=? ORDER BY v.id DESC LIMIT 20`,[p.id]);
    o.invoices=q('SELECT * FROM invoices WHERE owner_id=? ORDER BY id DESC LIMIT 20',[p.id]);
    o.followups=q('SELECT f.*,p.name AS pet_name FROM followups f LEFT JOIN pets p ON p.id=f.pet_id WHERE f.owner_id=? ORDER BY f.scheduled_at DESC LIMIT 20',[p.id]);
    return o;
  });
  add('PUT','/emr/owners/{id}',(p,d)=>update('owners',p.id,d,['name','gender','wechat','address','member_level','life_stage','source_channel','tags','remark']));
  add('GET','/emr/pets',p=>paged(`SELECT p.*,o.name AS owner_name,o.phone AS owner_phone,
    (SELECT COUNT(*) FROM visits v WHERE v.pet_id=p.id) AS visit_count,(SELECT MAX(v.visited_at) FROM visits v WHERE v.pet_id=p.id) AS last_visit_at
    FROM pets p LEFT JOIN owners o ON o.id=p.owner_id`,filters({'p.species':p.species,'p.owner_id':int(p.owner_id)||null},p.keyword,['p.name','o.name','o.phone']),'p.id DESC',p));
  add('POST','/emr/pets',(p,d)=>{
    const oid=int(d.owner_id),name=(d.name||'').trim(); if(!oid||!name) fail('主人与宠物名必填');get('owners',oid,'客户');
    validatePet(d);
    const id=insert('pets',{owner_id:oid,name,species:d.species??'犬',breed:d.breed??'',gender:d.gender??'未知',birth_date:d.birth_date??null,weight:n(d.weight),color:d.color??'',chip_no:d.chip_no??'',blood_type:d.blood_type??'',allergies:d.allergies??'',sterilized:int(d.sterilized),avatar:d.avatar??'',remark:d.remark??'',created_at:now()});
    return q1('SELECT p.*,o.name AS owner_name FROM pets p LEFT JOIN owners o ON o.id=p.owner_id WHERE p.id=?',[id]);
  });
  function validatePet(d) {
    if(d.weight!==undefined&&d.weight!==''&&d.weight!==null&&(!Number.isFinite(Number(d.weight))||Number(d.weight)<0||Number(d.weight)>250))fail('宠物体重须为0–250kg之间的数值');
    if(d.birth_date){const birth=String(d.birth_date),dt=new Date(birth+'T12:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(birth)||!Number.isFinite(dt.getTime())||D.date(dt)!==birth||birth>D.date())fail('宠物生日须为有效日期，不能晚于今天');}
    if(d.species&&!['犬','猫','异宠'].includes(d.species))fail('宠物种类无效');
  }
  add('PUT','/emr/pets/{id}',(p,d)=>{get('pets',p.id,'宠物');validatePet(d);if('name' in d){d.name=String(d.name||'').trim();if(!d.name)fail('宠物名必填');}if('weight' in d)d.weight=d.weight===''?0:Number(d.weight);if('sterilized' in d)d.sterilized=int(d.sterilized)?1:0;return update('pets',p.id,d,['name','species','breed','gender','birth_date','weight','color','chip_no','blood_type','allergies','sterilized','remark']);});
  add('GET','/emr/pets/{id}',p=>{
    const pet=get('pets',p.id,'宠物');pet.owner=q1('SELECT * FROM owners WHERE id=?',[pet.owner_id]);
    pet.visits=q('SELECT v.*,s.name AS doctor_name FROM visits v LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.pet_id=? ORDER BY v.id DESC',[p.id]);
    pet.vaccinations=q('SELECT * FROM vaccinations WHERE pet_id=? ORDER BY injected_at DESC',[p.id]);
    pet.appointments=q('SELECT a.*,s.name AS doctor_name FROM appointments a LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.pet_id=? ORDER BY a.scheduled_at DESC LIMIT 20',[p.id]);
    pet.imaging=q('SELECT * FROM imaging_studies WHERE pet_id=? ORDER BY performed_at DESC',[p.id]);return pet;
  });
  add('GET','/emr/appointments',p=>paged(`SELECT a.*,(SELECT v.id FROM visits v WHERE v.appointment_id=a.id ORDER BY v.id DESC LIMIT 1) AS visit_id,p.name AS pet_name,p.species,o.name AS owner_name,o.phone AS owner_phone,s.name AS doctor_name FROM appointments a
    LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN owners o ON o.id=a.owner_id LEFT JOIN staff s ON s.id=a.doctor_id`,
    filters({'a.status':p.status,'a.doctor_id':int(p.doctor_id)||null,'a.source':p.source},null,null,p.date?[['date(a.scheduled_at)=?',p.date]]:[]),'a.scheduled_at ASC',p,50));
  add('GET','/emr/appointments/{id}',p=>q1(`SELECT a.*,(SELECT v.id FROM visits v WHERE v.appointment_id=a.id ORDER BY v.id DESC LIMIT 1) AS visit_id,p.name AS pet_name,p.species,o.name AS owner_name,o.phone AS owner_phone,s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN owners o ON o.id=a.owner_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.id=?`,[p.id])||fail('预约不存在'));
  function appointment(d) {
    if(!int(d.owner_id)||!int(d.pet_id)||!d.scheduled_at) fail('客户、宠物、预约时间必填');
    patient(d.owner_id,d.pet_id);doctor(d.doctor_id);
    const at=String(d.scheduled_at).replace('T',' '),dt=new Date(at.replace(' ','T'));
    if(!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(at)||Number.isNaN(dt.getTime())||D.date(dt)!==at.slice(0,10))fail('预约日期时间无效');
    const scheduled=at.length===16?at+':00':at;
    if(scheduled<now())fail('预约时间已过去，请选择未来时段');
    if(D.doctorAvailability){const availability=D.doctorAvailability(int(d.doctor_id)||null,scheduled);if(!availability.available)fail(availability.reason);}
    if(!['待到店','已到店'].includes(d.status??'待到店'))fail('新建预约状态无效');
    if(q1("SELECT id FROM appointments WHERE status NOT IN ('已取消','爽约') AND ABS((julianday(scheduled_at)-julianday(?))*1440)<29.99 AND (pet_id=? OR (doctor_id=? AND ? IS NOT NULL))",[scheduled,int(d.pet_id),int(d.doctor_id)||null,int(d.doctor_id)||null]))fail('该宠物或医生在此时段已有预约，请另选时间');
    return get('appointments',insert('appointments',{appt_no:next('A','appointments','appt_no'),owner_id:int(d.owner_id),pet_id:int(d.pet_id),doctor_id:int(d.doctor_id)||null,appt_type:d.appt_type??'普通门诊',scheduled_at:scheduled,source:d.source??'门店',status:d.status??'待到店',note:d.note??'',created_at:now()}));
  }
  add('POST','/emr/appointments',(p,d)=>appointment(d));
  function appointmentStatus(id,status) {
    const a=get('appointments',id,'预约'),allowed={'待到店':['已到店','已取消','爽约'],'已到店':['诊疗中','已取消'],'诊疗中':['已完成']};
    if(status===a.status)return a;if(!(allowed[a.status]||[]).includes(status))fail('当前预约状态不支持此操作');
    const linked=q1('SELECT * FROM visits WHERE appointment_id=?',[id]);
    if(linked){setVisitStatus(linked.id,status==='已完成'?'已完成':status==='已取消'?'已取消':status==='诊疗中'?'诊疗中':'待接诊');return get('appointments',id);}
    if(['诊疗中','已完成'].includes(status))fail('请先到店接诊生成病历，再更新诊疗状态');
    return update('appointments',id,{status});
  }
  D.appointmentStatus=appointmentStatus;
  add('PATCH','/emr/appointments/{id}/status',(p,d)=>appointmentStatus(p.id,d.status));
  function visit(d) {
    if(!int(d.owner_id)||!int(d.pet_id)) fail('客户与宠物必填');
    patient(d.owner_id,d.pet_id);doctor(d.doctor_id);
    if(d.status&&!['待接诊','诊疗中','待缴费','已完成','已取消'].includes(d.status))fail('就诊状态无效');
    if(int(d.appointment_id)){const a=get('appointments',int(d.appointment_id),'预约');if(a.owner_id!==int(d.owner_id)||a.pet_id!==int(d.pet_id))fail('预约与客户宠物不一致');if(['已取消','爽约','已完成'].includes(a.status))fail('该预约不可接诊');if(q1('SELECT id FROM visits WHERE appointment_id=?',[a.id]))fail('该预约已生成病历');}
    const v=get('visits',insert('visits',{visit_no:next('V','visits','visit_no'),appointment_id:int(d.appointment_id)||null,owner_id:int(d.owner_id),pet_id:int(d.pet_id),doctor_id:int(d.doctor_id)||null,dept:d.dept??'全科',chief_complaint:d.chief_complaint??'',present_illness:d.present_illness??'',diagnosis:d.diagnosis??'',treatment:d.treatment??'',advice:d.advice??'',status:d.status??'待接诊',visit_type:d.visit_type??'门诊',visited_at:now(),finished_at:d.status==='已完成'?now():null,created_at:now()}));
    if(int(d.appointment_id)) update('appointments',int(d.appointment_id),{status:v.status==='待接诊'?'已到店':v.status==='已完成'?'已完成':v.status==='已取消'?'已取消':'诊疗中'});if(D.syncOwnerFinance)D.syncOwnerFinance(v.owner_id);return v;
  }
  Object.assign(D,{appointment,visit});
  add('POST','/emr/appointments/{id}/checkin',p=>{
    const a=get('appointments',p.id,'预约'),exists=q1('SELECT * FROM visits WHERE appointment_id=?',[p.id]);
    if(['已取消','爽约'].includes(a.status))fail('已取消或爽约的预约不可接诊');
    if(exists){if(D.systemEnqueue&&['待接诊','诊疗中'].includes(exists.status))D.systemEnqueue(exists.id);return {visit:exists,created:false};}
    const v=visit({owner_id:a.owner_id,pet_id:a.pet_id,doctor_id:a.doctor_id,appointment_id:p.id});
    update('appointments',p.id,{status:'已到店'});if(D.systemEnqueue)D.systemEnqueue(v.id);return {visit:v,created:true};
  });
  add('GET','/emr/visits',p=>paged(`SELECT v.*,p.name AS pet_name,p.species,o.name AS owner_name,s.name AS doctor_name,
    (SELECT COUNT(*) FROM lab_orders lo WHERE lo.visit_id=v.id) AS lab_count,(SELECT COUNT(*) FROM imaging_studies ist WHERE ist.visit_id=v.id) AS img_count
    FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN owners o ON o.id=v.owner_id LEFT JOIN staff s ON s.id=v.doctor_id`,
    filters({'v.status':p.status==='active'?null:p.status,'v.dept':p.dept,'v.doctor_id':int(p.doctor_id)||null,'v.pet_id':int(p.pet_id)||null},p.keyword,['p.name','o.name','v.visit_no'],p.status==='active'?[["v.status IN ('待接诊','诊疗中')"]]:[]),'v.id DESC',p));
  add('POST','/emr/visits',(p,d)=>visit(d));
  function visitDetail(id) {
    const v=get('visits',id,'就诊记录');v.pet=q1('SELECT * FROM pets WHERE id=?',[v.pet_id]);v.owner=q1('SELECT * FROM owners WHERE id=?',[v.owner_id]);
    v.doctor=v.doctor_id?q1('SELECT * FROM staff WHERE id=?',[v.doctor_id]):null;
    v.vitals=q1('SELECT * FROM vitals WHERE visit_id=? ORDER BY id DESC',[id]);
    v.soap=q('SELECT * FROM soap_notes WHERE visit_id=? ORDER BY id',[id]);
    v.prescriptions=q('SELECT * FROM prescriptions WHERE visit_id=? ORDER BY id',[id]);
    v.lab_orders=q('SELECT lo.*,ld.name AS device_name FROM lab_orders lo LEFT JOIN lab_devices ld ON ld.id=lo.device_id WHERE lo.visit_id=? ORDER BY lo.id DESC',[id]);
    v.imaging=q('SELECT * FROM imaging_studies WHERE visit_id=? ORDER BY id DESC',[id]);v.invoice=q1('SELECT * FROM invoices WHERE visit_id=?',[id]);
    v.appointment=v.appointment_id?q1('SELECT * FROM appointments WHERE id=?',[v.appointment_id]):null;return v;
  }
  D.visitDetail=visitDetail;
  function setVisitStatus(id,status) {
    const v=get('visits',int(id),'就诊记录');
    if(!['待接诊','诊疗中','待缴费','已完成','已取消'].includes(status))fail('就诊状态无效');
    if(v.status==='已取消'&&status!=='已取消')fail('已取消就诊不可恢复，请新建就诊');if(!['已完成','已取消'].includes(status))patient(v.owner_id,v.pet_id);
    if(['已完成','已取消'].includes(status)&&q1("SELECT name FROM sqlite_master WHERE type='table' AND name='care_admissions'")&&q1("SELECT id FROM care_admissions WHERE visit_id=? AND status='在院'",[v.id]))fail('该就诊仍有关联住院，请先办理出院');
    if(status==='已取消'&&v.status!=='已取消'&&(q1('SELECT id FROM prescriptions WHERE visit_id=?',[v.id])||q1("SELECT id FROM lab_orders WHERE visit_id=? AND status<>'已作废'",[v.id])||q1('SELECT id FROM imaging_studies WHERE visit_id=?',[v.id])||q1('SELECT ii.id FROM invoice_items ii JOIN invoices i ON i.id=ii.invoice_id WHERE i.visit_id=?',[v.id])))fail('该就诊有关联处方、检查或费用，请先在原业务模块撤销，再取消就诊');
    const result=update('visits',v.id,{status,finished_at:status==='已完成'?(v.finished_at||now()):null});
    if(v.appointment_id)update('appointments',v.appointment_id,{status:status==='已完成'?'已完成':status==='已取消'?'已取消':status==='待接诊'?'已到店':'诊疗中'});
    if(D.syncOwnerFinance)D.syncOwnerFinance(v.owner_id);return result;
  }
  D.setVisitStatus=setVisitStatus;
  add('GET','/emr/visits/{id}',p=>visitDetail(p.id));
  add('PUT','/emr/visits/{id}',(p,d)=>{
    const v=get('visits',p.id,'就诊记录'),fields=['dept','doctor_id','chief_complaint','present_illness','diagnosis','treatment','advice','status','visit_type'];
    if('doctor_id' in d){doctor(d.doctor_id);d.doctor_id=int(d.doctor_id)||null;}
    if('status' in d)setVisitStatus(v.id,d.status);
    const result=update('visits',p.id,d,fields);if(D.syncOwnerFinance)D.syncOwnerFinance(v.owner_id);return result;
  });
  add('POST','/emr/visits/{id}/vitals',(p,d)=>{
    clinicalVisitGuard(p.id);const existing=q1('SELECT * FROM vitals WHERE visit_id=? ORDER BY id DESC LIMIT 1',[p.id]);
    const data=Object.assign({temperature:null,heart_rate:null,resp_rate:null,weight:null,crt:null,mm:'',pain_score:0,bcs:5},existing||{}, {recorded_at:now()});delete data.id;delete data.visit_id;
    const ranges={temperature:[25,45,'体温'],heart_rate:[1,400,'心率'],resp_rate:[1,250,'呼吸频率'],weight:[0.01,250,'体重'],crt:[0,10,'CRT'],pain_score:[0,10,'疼痛评分'],bcs:[1,9,'体况评分']};
    let filled=false;
    Object.keys(ranges).forEach(k=>{if(!Object.prototype.hasOwnProperty.call(d,k))return;const v=d[k],r=ranges[k];if(v===null||v===''){data[k]=null;return;}if(!Number.isFinite(Number(v))||Number(v)<r[0]||Number(v)>r[1])fail(r[2]+'须在'+r[0]+'–'+r[1]+'之间');if(['heart_rate','resp_rate','pain_score','bcs'].includes(k)&&!Number.isInteger(Number(v)))fail(r[2]+'须为整数');data[k]=Number(v);filled=true;});
    if(Object.prototype.hasOwnProperty.call(d,'mm'))data.mm=String(d.mm||'');if(!filled&&!existing)fail('请至少填写一项有效生命体征');
    if(data.weight>0){const visit=get('visits',p.id);update('pets',visit.pet_id,{weight:data.weight});}
    return existing?update('vitals',existing.id,data):get('vitals',insert('vitals',Object.assign({visit_id:p.id},data)));
  });
  add('POST','/emr/visits/{id}/soap',(p,d)=>{
    clinicalVisitGuard(p.id);if(!['subjective','objective','assessment','plan'].some(k=>String(d[k]||'').trim()))fail('请至少填写一项病程内容');return get('soap_notes',insert('soap_notes',{visit_id:p.id,subjective:d.subjective??'',objective:d.objective??'',assessment:d.assessment??'',plan:d.plan??'',author:d.author??'',created_at:now()}));
  });
  add('DELETE','/emr/soap/{id}',p=>{run('DELETE FROM soap_notes WHERE id=?',[p.id]);return {ok:true};});
  add('POST','/emr/visits/{id}/prescriptions',(p,d)=>{
    const v=clinicalVisitGuard(p.id),pid=int(d.product_id)||null,qty=n(d.qty,1);
    if(qty<=0||!Number.isFinite(Number(d.qty??1)))fail('处方数量必须大于 0');
    if(!Number.isInteger(Number(d.days??1))||Number(d.days??1)<=0)fail('用药天数须为正整数');
    if(d.unit_price!==undefined&&d.unit_price!==''&&(!Number.isFinite(Number(d.unit_price))||Number(d.unit_price)<0))fail('药品单价不能为负数');
    editableInvoice(q1('SELECT * FROM invoices WHERE visit_id=?',[p.id]));
    let name=(d.drug_name||'').trim(),price=n(d.unit_price),spec=d.spec??'',unit=d.unit??'次';
    if(pid){const prod=get('products',pid,'药品');if(prod.status==='停售')fail('该商品已停售，请选择其他药品');name=prod.name;spec=prod.spec;unit=prod.unit;price=d.unit_price===undefined||d.unit_price===''?prod.sale_price:price;
      if(prod.stock_qty<qty)fail(`库存不足：${prod.name} 仅剩 ${prod.stock_qty}${prod.unit}`);
    }else if(!name)fail('药品名称必填');
    const id=insert('prescriptions',{visit_id:p.id,product_id:pid,drug_name:name,spec,dosage:d.dosage??'',frequency:d.frequency??'',route:d.route??'口服',days:int(d.days,1),qty,unit,usage_note:d.usage_note??'',created_at:now()});
    if(pid)stock(pid,-qty,'处方出库','RX:'+id,d.operator??'');
    charge(p.id,'药品',name,qty,price,id);return get('prescriptions',id);
  });
  add('DELETE','/emr/prescriptions/{id}',p=>{const r=get('prescriptions',p.id,'处方');if(D.carePrescriptionGuard)D.carePrescriptionGuard(p.id);editableInvoice(q1('SELECT * FROM invoices WHERE visit_id=?',[r.visit_id]));if(r.product_id){if(D.restoreBatches)D.restoreBatches(r.product_id,'RX:'+r.id);stock(r.product_id,r.qty,'退库','RX:'+r.id);}uncharge('药品',p.id);run('DELETE FROM prescriptions WHERE id=?',[p.id]);return {ok:true};});
  add('GET','/emr/vaccinations',p=>{const f=filters({'v.pet_id':int(p.pet_id)||null,'v.category':p.category});return items('SELECT v.*,p.name AS pet_name,o.name AS owner_name FROM vaccinations v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN visits visit ON visit.id=v.visit_id LEFT JOIN service_record_owners ro ON ro.record_type="vaccinations" AND ro.record_id=v.id LEFT JOIN owners o ON o.id=COALESCE(visit.owner_id,ro.owner_id,p.owner_id)'+f.sql+' ORDER BY v.injected_at DESC',f.args);});
  add('POST','/emr/vaccinations',(p,d)=>{
    if(!int(d.pet_id)||!(d.name||'').trim())fail('宠物与名称必填');
    const pet=get('pets',int(d.pet_id),'宠物');patient(pet.owner_id,pet.id);
    if(int(d.visit_id)){const v=clinicalVisitGuard(d.visit_id);if(v.pet_id!==pet.id||v.owner_id!==pet.owner_id)fail('免疫宠物与就诊记录不一致');}
    if(!['疫苗','驱虫'].includes(d.category??'疫苗'))fail('免疫驱虫类别无效');
    const injected=String(d.injected_at||now()).replace('T',' '),due=d.next_due_at?String(d.next_due_at):null;
    const valid=s=>{const dt=new Date(s.length===10?s+'T12:00:00':s.replace(' ','T'));return /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(s)&&Number.isFinite(dt.getTime())&&D.date(dt)===s.slice(0,10);};
    if(!valid(injected)||injected.slice(0,10)>D.date())fail('实际执行日期无效或晚于今天；预约执行请建立免疫驱虫计划');
    if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!valid(due)||due<=injected.slice(0,10)))fail('下次执行日期须晚于本次实际执行日期');
    const id=insert('vaccinations',{pet_id:pet.id,visit_id:int(d.visit_id)||null,category:d.category??'疫苗',name:d.name.trim(),batch_no:d.batch_no??'',manufacturer:d.manufacturer??'',doctor:d.doctor??'',injected_at:injected,next_due_at:due,created_at:now()});
    if(D.servicesRememberRecord)D.servicesRememberRecord('vaccinations',id,pet.owner_id);return get('vaccinations',id);
  });
  add('GET','/emr/templates',p=>{const f=filters({category:p.category});return items('SELECT * FROM emr_templates'+f.sql+' ORDER BY category,id',f.args);});
  add('POST','/emr/templates',(p,d)=>{if(!(d.title||'').trim()||!(d.content||'').trim())fail('标题与内容必填');return get('emr_templates',insert('emr_templates',{category:d.category??'主诉',title:d.title,content:d.content,species:d.species??'通用',usage_count:0,created_at:now()}));});
  add('POST','/emr/templates/{id}/use',p=>{const t=get('emr_templates',p.id,'模板');return update('emr_templates',p.id,{usage_count:t.usage_count+1});});
})(window.Demo);
