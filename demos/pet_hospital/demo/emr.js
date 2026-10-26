/* Browser-side clinical demo operations, preserving the original records and workflow. */
(function (D) {
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,now,next,filters,paged,items}=D;
  function recalc(id) {
    const inv=get('invoices',id), total=money(val('SELECT COALESCE(SUM(amount),0) FROM invoice_items WHERE invoice_id=?',[id]));
    const payable=money(total-money(inv.discount)), paid=money(inv.paid_amount);
    return update('invoices',id,{total_amount:total,payable,status:paid<=0?'待缴费':paid>=payable-0.01?'已结清':'部分缴费'});
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
    const inv=ensureInvoice(vid); if(!inv) return null;
    qty=n(qty,1); price=money(price);
    insert('invoice_items',{invoice_id:inv.id,item_type:type,name,ref_id:refID,qty,unit_price:price,amount:money(qty*price)});
    return recalc(inv.id);
  }
  function uncharge(type,refID) {
    q('SELECT id,invoice_id FROM invoice_items WHERE item_type=? AND ref_id=?',[type,refID]).forEach(r=>{
      run('DELETE FROM invoice_items WHERE id=?',[r.id]); recalc(r.invoice_id);
    });
  }
  function stock(pid,delta,type,refNo,operator='') {
    const p=get('products',pid,'商品'), before=money(p.stock_qty), after=Math.max(money(before+delta),0);
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
    const id=insert('pets',{owner_id:oid,name,species:d.species??'犬',breed:d.breed??'',gender:d.gender??'未知',birth_date:d.birth_date??null,weight:n(d.weight),color:d.color??'',chip_no:d.chip_no??'',blood_type:d.blood_type??'',allergies:d.allergies??'',sterilized:int(d.sterilized),avatar:d.avatar??'',remark:d.remark??'',created_at:now()});
    return q1('SELECT p.*,o.name AS owner_name FROM pets p LEFT JOIN owners o ON o.id=p.owner_id WHERE p.id=?',[id]);
  });
  add('GET','/emr/pets/{id}',p=>{
    const pet=get('pets',p.id,'宠物');pet.owner=q1('SELECT * FROM owners WHERE id=?',[pet.owner_id]);
    pet.visits=q('SELECT v.*,s.name AS doctor_name FROM visits v LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.pet_id=? ORDER BY v.id DESC',[p.id]);
    pet.vaccinations=q('SELECT * FROM vaccinations WHERE pet_id=? ORDER BY injected_at DESC',[p.id]);
    pet.appointments=q('SELECT a.*,s.name AS doctor_name FROM appointments a LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.pet_id=? ORDER BY a.scheduled_at DESC LIMIT 20',[p.id]);
    pet.imaging=q('SELECT * FROM imaging_studies WHERE pet_id=? ORDER BY performed_at DESC',[p.id]);return pet;
  });
  add('GET','/emr/appointments',p=>paged(`SELECT a.*,p.name AS pet_name,p.species,o.name AS owner_name,o.phone AS owner_phone,s.name AS doctor_name FROM appointments a
    LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN owners o ON o.id=a.owner_id LEFT JOIN staff s ON s.id=a.doctor_id`,
    filters({'a.status':p.status,'a.doctor_id':int(p.doctor_id)||null,'a.source':p.source},null,null,p.date?[['date(a.scheduled_at)=?',p.date]]:[]),'a.scheduled_at ASC',p,50));
  function appointment(d) {
    if(!int(d.owner_id)||!int(d.pet_id)||!d.scheduled_at) fail('客户、宠物、预约时间必填');
    return get('appointments',insert('appointments',{appt_no:next('A','appointments','appt_no'),owner_id:int(d.owner_id),pet_id:int(d.pet_id),doctor_id:int(d.doctor_id)||null,appt_type:d.appt_type??'普通门诊',scheduled_at:d.scheduled_at,source:d.source??'门店',status:d.status??'待到店',note:d.note??'',created_at:now()}));
  }
  add('POST','/emr/appointments',(p,d)=>appointment(d));
  add('PATCH','/emr/appointments/{id}/status',(p,d)=>{if(!d.status)fail('缺少状态');return update('appointments',p.id,{status:d.status});});
  function visit(d) {
    if(!int(d.owner_id)||!int(d.pet_id)) fail('客户与宠物必填');
    const v=get('visits',insert('visits',{visit_no:next('V','visits','visit_no'),appointment_id:int(d.appointment_id)||null,owner_id:int(d.owner_id),pet_id:int(d.pet_id),doctor_id:int(d.doctor_id)||null,dept:d.dept??'全科',chief_complaint:d.chief_complaint??'',present_illness:d.present_illness??'',diagnosis:d.diagnosis??'',treatment:d.treatment??'',advice:d.advice??'',status:d.status??'待接诊',visit_type:d.visit_type??'门诊',visited_at:now(),finished_at:null,created_at:now()}));
    if(int(d.appointment_id)) update('appointments',int(d.appointment_id),{status:'诊疗中'});return v;
  }
  Object.assign(D,{appointment,visit});
  add('POST','/emr/appointments/{id}/checkin',p=>{
    const a=get('appointments',p.id,'预约'),exists=q1('SELECT * FROM visits WHERE appointment_id=?',[p.id]);
    if(exists)return {visit:exists,created:false};
    const v=visit({owner_id:a.owner_id,pet_id:a.pet_id,doctor_id:a.doctor_id,appointment_id:p.id});
    update('appointments',p.id,{status:'已到店'});return {visit:v,created:true};
  });
  add('GET','/emr/visits',p=>paged(`SELECT v.*,p.name AS pet_name,p.species,o.name AS owner_name,s.name AS doctor_name,
    (SELECT COUNT(*) FROM lab_orders lo WHERE lo.visit_id=v.id) AS lab_count,(SELECT COUNT(*) FROM imaging_studies ist WHERE ist.visit_id=v.id) AS img_count
    FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN owners o ON o.id=v.owner_id LEFT JOIN staff s ON s.id=v.doctor_id`,
    filters({'v.status':p.status,'v.dept':p.dept,'v.doctor_id':int(p.doctor_id)||null},p.keyword,['p.name','o.name','v.visit_no']),'v.id DESC',p));
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
  add('GET','/emr/visits/{id}',p=>visitDetail(p.id));
  add('PUT','/emr/visits/{id}',(p,d)=>{
    const v=get('visits',p.id,'就诊记录'),fields=['dept','doctor_id','chief_complaint','present_illness','diagnosis','treatment','advice','status','visit_type'];
    if('doctor_id' in d)d.doctor_id=int(d.doctor_id);
    if(d.status==='已完成'&&!v.finished_at){d.finished_at=now();fields.push('finished_at');}return update('visits',p.id,d,fields);
  });
  add('POST','/emr/visits/{id}/vitals',(p,d)=>{
    get('visits',p.id,'就诊记录');const existing=q1('SELECT id FROM vitals WHERE visit_id=?',[p.id]);
    const data={temperature:n(d.temperature),heart_rate:int(d.heart_rate),resp_rate:int(d.resp_rate),weight:n(d.weight),crt:n(d.crt),mm:d.mm??'',pain_score:int(d.pain_score),bcs:int(d.bcs,5),recorded_at:now()};
    return existing?update('vitals',existing.id,data):get('vitals',insert('vitals',Object.assign({visit_id:p.id},data)));
  });
  add('POST','/emr/visits/{id}/soap',(p,d)=>{
    get('visits',p.id,'就诊记录');return get('soap_notes',insert('soap_notes',{visit_id:p.id,subjective:d.subjective??'',objective:d.objective??'',assessment:d.assessment??'',plan:d.plan??'',author:d.author??'',created_at:now()}));
  });
  add('DELETE','/emr/soap/{id}',p=>{run('DELETE FROM soap_notes WHERE id=?',[p.id]);return {ok:true};});
  add('POST','/emr/visits/{id}/prescriptions',(p,d)=>{
    const v=get('visits',p.id,'就诊记录'),pid=int(d.product_id)||null,qty=n(d.qty,1);
    let name=(d.drug_name||'').trim(),price=n(d.unit_price),spec=d.spec??'',unit=d.unit??'次';
    if(pid){const prod=get('products',pid,'药品');name=prod.name;spec=prod.spec;unit=prod.unit;price=price||prod.sale_price;
      if(prod.stock_qty<qty)fail(`库存不足：${prod.name} 仅剩 ${prod.stock_qty}${prod.unit}`);stock(pid,-qty,'处方出库',v.visit_no,d.operator??'');
    }else if(!name)fail('药品名称必填');
    const id=insert('prescriptions',{visit_id:p.id,product_id:pid,drug_name:name,spec,dosage:d.dosage??'',frequency:d.frequency??'',route:d.route??'口服',days:int(d.days,1),qty,unit,usage_note:d.usage_note??'',created_at:now()});
    charge(p.id,'药品',name,qty,price,id);return get('prescriptions',id);
  });
  add('DELETE','/emr/prescriptions/{id}',p=>{const r=get('prescriptions',p.id,'处方');if(r.product_id)stock(r.product_id,r.qty,'退库','处方撤销');uncharge('药品',p.id);run('DELETE FROM prescriptions WHERE id=?',[p.id]);return {ok:true};});
  add('GET','/emr/vaccinations',p=>{const f=filters({'v.pet_id':int(p.pet_id)||null,'v.category':p.category});return items('SELECT v.*,p.name AS pet_name,o.name AS owner_name FROM vaccinations v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN owners o ON o.id=p.owner_id'+f.sql+' ORDER BY v.injected_at DESC',f.args);});
  add('POST','/emr/vaccinations',(p,d)=>{
    if(!int(d.pet_id)||!(d.name||'').trim())fail('宠物与名称必填');
    return get('vaccinations',insert('vaccinations',{pet_id:int(d.pet_id),visit_id:int(d.visit_id)||null,category:d.category??'疫苗',name:d.name.trim(),batch_no:d.batch_no??'',manufacturer:d.manufacturer??'',doctor:d.doctor??'',injected_at:d.injected_at||now(),next_due_at:d.next_due_at??null,created_at:now()}));
  });
  add('GET','/emr/templates',p=>{const f=filters({category:p.category});return items('SELECT * FROM emr_templates'+f.sql+' ORDER BY category,id',f.args);});
  add('POST','/emr/templates',(p,d)=>{if(!(d.title||'').trim()||!(d.content||'').trim())fail('标题与内容必填');return get('emr_templates',insert('emr_templates',{category:d.category??'主诉',title:d.title,content:d.content,species:d.species??'通用',usage_count:0,created_at:now()}));});
  add('POST','/emr/templates/{id}/use',p=>{const t=get('emr_templates',p.id,'模板');return update('emr_templates',p.id,{usage_count:t.usage_count+1});});
})(window.Demo);
