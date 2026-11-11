(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,date,now,next,ref,items,asset}=D;
  add('GET','/portal/demo-accounts',()=>D.dataCycleAccounts?{items:D.dataCycleAccounts()}:items(`SELECT o.id,o.name,o.phone,o.member_level,o.life_stage,
    (SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count FROM owners o ORDER BY o.total_spend DESC LIMIT 8`));
  add('POST','/portal/login',(p,d)=>{const phone=(d.phone||'').trim();if(!phone)fail('请输入手机号');const owner=q1('SELECT * FROM owners WHERE phone=?',[phone]);if(!owner)fail('未找到该手机号对应的客户，请先到院建档');return {token:'mp-'+owner.id+'-'+Math.floor(1000+Math.random()*9000),owner};});
  add('POST','/portal/register',(p,d)=>{const name=String(d.name||'').trim(),phone=String(d.phone||'').trim();if(!name||name.length>50)fail('请填写50字以内的姓名');if(!/^1\d{10}$/.test(phone))fail('请输入11位有效手机号');if(q1('SELECT id FROM owners WHERE phone=?',[phone]))fail('该手机号已建档，请返回登录');const id=insert('owners',{name,phone,gender:'未知',wechat:'',address:'',member_level:'普通客户',life_stage:'新客',source_channel:'小程序',points:0,balance:0,total_spend:0,visit_count:0,last_visit_at:null,tags:'自助登记',remark:'客户服务端本地演示自助登记，首次到院需前台核验。',created_at:now()});return {owner:get('owners',id)};});
  add('GET','/portal/doctors',()=>items("SELECT id,name,title,dept,specialty,work_years FROM staff WHERE role='医生' AND status='在职' ORDER BY id"));
  add('GET','/portal/slots',p=>{
    const current=new Date(),base=p.date?new Date(p.date+'T00:00:00'):current,out=[];if(Number.isNaN(base.getTime()))base.setTime(current.getTime());
    const doctors=q("SELECT id FROM staff WHERE role='医生' AND status='在职'"),did=int(p.doctor_id)||null,petId=int(p.pet_id)||null;
    if(did)D.validateDoctor(did);
    for(let i=0;i<7;i++){const day=new Date(base);day.setDate(base.getDate()+i);const slots=[];
      for(let h=8;h<22;h++){for(const m of [0,30]){if(h===8&&m===0)continue;const time=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'),datetime=date(day)+' '+time+':00';
        if(datetime<=now())continue;
        const busy=q("SELECT DISTINCT doctor_id FROM appointments WHERE status NOT IN ('已取消','爽约') AND ABS((julianday(scheduled_at)-julianday(?))*1440)<29.99",[datetime]).map(a=>a.doctor_id);
        const petBusy=petId&&q1("SELECT id FROM appointments WHERE pet_id=? AND status NOT IN ('已取消','爽约') AND ABS((julianday(scheduled_at)-julianday(?))*1440)<29.99",[petId,datetime]);
        const workforce=id=>!D.doctorAvailability||D.doctorAvailability(id,datetime).available;
        const available=!petBusy&&(did?!busy.includes(did)&&workforce(did):doctors.some(d=>!busy.includes(d.id)&&workforce(d.id)));
        const reason=petBusy?'宠物已有预约':did&&!workforce(did)?D.doctorAvailability(did,datetime).reason:available?'':'该时段已约满';
        slots.push({time,datetime,available,reason});}}
      out.push({date:date(day),weekday:'周'+'日一二三四五六'[day.getDay()],slots});
    }return {items:out};
  });
  add('GET','/portal/{oid}/overview',p=>{
    const owner=get('owners',p.oid,'客户'),pets=q("SELECT * FROM pets WHERE owner_id=? AND id NOT IN (SELECT pet_id FROM service_pet_states WHERE status<>'正常') ORDER BY id DESC",[p.oid]),cards=q('SELECT * FROM membership_cards WHERE owner_id=? ORDER BY id',[p.oid]);return {owner,pet_count:pets.length,pets,cards,card:cards.find(c=>c.status==='正常'&&(!c.valid_until||c.valid_until>=date()))||cards[0]||null,card_balance:money(cards.filter(c=>c.status==='正常'&&(!c.valid_until||c.valid_until>=date())).reduce((s,c)=>s+c.balance,0)),
      coupon_count:n(val("SELECT COUNT(*) FROM coupons WHERE owner_id=? AND status='未使用' AND substr(expire_at,1,10)>=?",[p.oid,date()])),reminder_count:n(val("SELECT COUNT(*) FROM reminders WHERE owner_id=? AND status='待处理'",[p.oid])),
      upcoming:q("SELECT a.*,p.name AS pet_name,s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.owner_id=? AND a.status='待到店' AND substr(a.scheduled_at,1,10)>=? ORDER BY a.scheduled_at LIMIT 5",[p.oid,date()]),
      unpaid_count:n(val("SELECT COUNT(*) FROM invoices WHERE owner_id=? AND status IN ('待缴费','部分缴费')",[p.oid])),
      unpaid:q("SELECT * FROM invoices WHERE owner_id=? AND status IN ('待缴费','部分缴费') ORDER BY id DESC LIMIT 5",[p.oid]),
      reminders:q("SELECT r.*,p.name AS pet_name FROM reminders r LEFT JOIN pets p ON p.id=r.pet_id WHERE r.owner_id=? AND r.status='待处理' ORDER BY r.due_at LIMIT 5",[p.oid]),
      consult_open:n(val("SELECT COUNT(*) FROM consultations WHERE owner_id=? AND status IN ('待回复','进行中')",[p.oid]))};
  });
  add('GET','/portal/{oid}/pets',p=>items("SELECT p.*,(SELECT MAX(v.visited_at) FROM visits v WHERE v.pet_id=p.id AND v.owner_id=?) AS last_visit FROM pets p WHERE p.owner_id=? AND p.id NOT IN (SELECT pet_id FROM service_pet_states WHERE status<>'正常') ORDER BY id DESC",[p.oid,p.oid]));
  add('GET','/portal/{oid}/appointments',p=>items('SELECT a.*,p.name AS pet_name,p.species,s.name AS doctor_name,s.title AS doctor_title FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.owner_id=? ORDER BY a.scheduled_at DESC',[p.oid]));
  add('POST','/portal/{oid}/appointments',(p,d)=>{
    get('owners',p.oid,'客户');if(!int(d.pet_id)||!d.scheduled_at)fail('请选择宠物与预约时间');if(!q1('SELECT * FROM pets WHERE id=? AND owner_id=?',[int(d.pet_id),p.oid]))fail('宠物不存在');
    if(!int(d.doctor_id)){
      const at=String(d.scheduled_at).replace('T',' '),available=q("SELECT id FROM staff WHERE role='医生' AND status='在职' AND id NOT IN (SELECT doctor_id FROM appointments WHERE doctor_id IS NOT NULL AND status NOT IN ('已取消','爽约') AND ABS((julianday(scheduled_at)-julianday(?))*1440)<29.99) ORDER BY id",[at]).filter(s=>!D.doctorAvailability||D.doctorAvailability(s.id,at).available);
      if(!available.length)fail('该时段医生已约满，请重新选择');d=Object.assign({},d,{doctor_id:available[0].id});
    }
    if(String(d.scheduled_at).replace('T',' ')<=now())fail('不能预约已经过去的时间，请重新选择');
    const a=D.appointment(Object.assign({},d,{owner_id:p.oid,source:'小程序',status:'待到店'}));return q1('SELECT a.*,p.name AS pet_name,s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.id=?',[a.id]);
  });
  add('PATCH','/portal/appointments/{id}/cancel',p=>{const a=get('appointments',p.id,'预约');if(a.status!=='待到店')fail('仅待到店预约可取消，请联系前台处理');D.appointmentStatus(p.id,'已取消');return {ok:true};});
  add('PATCH','/portal/{oid}/appointments/{id}/cancel',p=>{const a=q1('SELECT * FROM appointments WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!a)fail('预约不存在');if(a.status!=='待到店')fail('仅待到店预约可取消，请联系前台处理');D.appointmentStatus(p.id,'已取消');return {ok:true};});
  add('GET','/portal/{oid}/records',p=>items('SELECT v.*,p.name AS pet_name,s.name AS doctor_name FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.owner_id=? ORDER BY v.visited_at DESC',[p.oid]));
  add('GET','/portal/{oid}/records/{id}',p=>{
    const found=q1('SELECT * FROM visits WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!found)fail('记录不存在');const v=D.visitDetail(p.id);delete v.owner;delete v.appointment;
    if(D.clinicalPortalRecords)v.specialties=D.clinicalPortalRecords(p.id);
    v.imaging.forEach(st=>{const ins=q1('SELECT * FROM imaging_instances WHERE study_id=? ORDER BY instance_no LIMIT 1',[st.id]);st.cover=ins?asset(ins.file_path.startsWith('data:')?ins.file_path:'uploads/'+ins.file_path):null;});return v;
  });
  add('GET','/portal/{oid}/labs',p=>items("SELECT lo.*,p.name AS pet_name FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id LEFT JOIN visits v ON v.id=lo.visit_id LEFT JOIN service_record_owners so ON so.record_type='lab_orders' AND so.record_id=lo.id WHERE COALESCE(so.owner_id,v.owner_id,p.owner_id)=? ORDER BY lo.id DESC",[p.oid]));
  add('GET','/portal/{oid}/labs/{id}',p=>{
    const o=q1("SELECT lo.* FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id LEFT JOIN visits v ON v.id=lo.visit_id LEFT JOIN service_record_owners so ON so.record_type='lab_orders' AND so.record_id=lo.id WHERE lo.id=? AND COALESCE(so.owner_id,v.owner_id,p.owner_id)=?",[p.id,p.oid]);if(!o)fail('报告不存在');o.pet=q1('SELECT * FROM pets WHERE id=?',[o.pet_id]);o.results=q('SELECT * FROM lab_results WHERE order_id=? ORDER BY id',[p.id]);o.results.forEach(r=>r.ref_text=ref(r.ref_low,r.ref_high));o.abnormal=o.results.filter(r=>r.flag!=='正常');return o;
  });
  add('GET','/portal/{oid}/imaging',p=>{
    const rows=q("SELECT ist.*,p.name AS pet_name,(SELECT ii.file_path FROM imaging_instances ii WHERE ii.study_id=ist.id ORDER BY ii.instance_no LIMIT 1) AS cover FROM imaging_studies ist LEFT JOIN pets p ON p.id=ist.pet_id LEFT JOIN visits v ON v.id=ist.visit_id LEFT JOIN service_record_owners so ON so.record_type='imaging_studies' AND so.record_id=ist.id WHERE COALESCE(so.owner_id,v.owner_id,p.owner_id)=? ORDER BY ist.performed_at DESC",[p.oid]);rows.forEach(r=>r.cover_url=r.cover?asset(r.cover.startsWith('data:')?r.cover:'uploads/'+r.cover):null);return {items:rows};
  });
  add('GET','/portal/{oid}/imaging/{id}',p=>{
    const st=q1("SELECT ist.* FROM imaging_studies ist LEFT JOIN pets p ON p.id=ist.pet_id LEFT JOIN visits v ON v.id=ist.visit_id LEFT JOIN service_record_owners so ON so.record_type='imaging_studies' AND so.record_id=ist.id WHERE ist.id=? AND COALESCE(so.owner_id,v.owner_id,p.owner_id)=?",[p.id,p.oid]);if(!st)fail('影像不存在');st.instances=D.instances(p.id);st.pet=q1('SELECT * FROM pets WHERE id=?',[st.pet_id]);return st;
  });
  add('GET','/portal/{oid}/invoices',p=>items('SELECT i.*,p.name AS pet_name FROM invoices i LEFT JOIN pets p ON p.id=i.pet_id WHERE i.owner_id=? ORDER BY i.id DESC',[p.oid]));
  add('GET','/portal/{oid}/invoices/{id}',p=>{
    const inv=q1('SELECT * FROM invoices WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!inv)fail('账单不存在');inv.items=q('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[p.id]);inv.pet=inv.pet_id?q1('SELECT * FROM pets WHERE id=?',[inv.pet_id]):null;return inv;
  });
  add('POST','/portal/{oid}/invoices/{id}/pay',(p,d)=>{
    const inv=q1('SELECT * FROM invoices WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!inv)fail('账单不存在');return D.payInvoice(p.id,Object.assign({},d,{cashier:'客户端自助'}));
  });
  add('GET','/portal/{oid}/coupons',p=>items("SELECT c.*,cp.name AS campaign_name,CASE WHEN c.status='未使用' AND substr(c.expire_at,1,10)<? THEN '已过期' ELSE c.status END AS status FROM coupons c LEFT JOIN campaigns cp ON cp.id=c.campaign_id WHERE c.owner_id=? ORDER BY c.id DESC",[date(),p.oid]));
  add('GET','/portal/{oid}/reminders',p=>items('SELECT r.*,p.name AS pet_name,(SELECT id FROM service_plans sp WHERE sp.reminder_id=r.id LIMIT 1) AS service_plan_id FROM reminders r LEFT JOIN pets p ON p.id=r.pet_id WHERE r.owner_id=? ORDER BY r.due_at',[p.oid]));
  add('PATCH','/portal/reminders/{id}/done',p=>{if(q1('SELECT id FROM service_plans WHERE reminder_id=?',[p.id]))fail('健康计划须由医护登记执行，客户可从服务权益查看进度');run("UPDATE reminders SET status='已完成' WHERE id=?",[p.id]);return {ok:true};});
  add('PATCH','/portal/{oid}/reminders/{id}/done',p=>{if(!q1('SELECT id FROM reminders WHERE id=? AND owner_id=?',[p.id,p.oid]))fail('提醒不存在');if(q1('SELECT id FROM service_plans WHERE reminder_id=?',[p.id]))fail('健康计划须由医护登记执行，客户可从服务权益查看进度');run("UPDATE reminders SET status='已完成' WHERE id=?",[p.id]);return {ok:true};});
  add('GET','/portal/{oid}/vaccinations',p=>items("SELECT vac.*,p.name AS pet_name FROM vaccinations vac LEFT JOIN pets p ON p.id=vac.pet_id LEFT JOIN visits v ON v.id=vac.visit_id LEFT JOIN service_record_owners so ON so.record_type='vaccinations' AND so.record_id=vac.id WHERE COALESCE(so.owner_id,v.owner_id,p.owner_id)=? ORDER BY vac.injected_at DESC",[p.oid]));
  add('GET','/portal/consultations',()=>items(`SELECT c.*,o.name AS _owner,o.name AS owner_name,p.name AS pet_name,s.name AS doctor_name,s.title AS doctor_title,
    (SELECT COUNT(*) FROM consultation_messages m WHERE m.consult_id=c.id) AS msg_count,
    (SELECT m.content FROM consultation_messages m WHERE m.consult_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_message FROM consultations c
    LEFT JOIN owners o ON o.id=c.owner_id LEFT JOIN pets p ON p.id=c.pet_id LEFT JOIN staff s ON s.id=c.doctor_id ORDER BY c.id DESC`));
  add('GET','/portal/{oid}/consultations',p=>items(`SELECT c.*,p.name AS pet_name,s.name AS doctor_name,s.title AS doctor_title,
    (SELECT COUNT(*) FROM consultation_messages m WHERE m.consult_id=c.id) AS msg_count,
    (SELECT m.content FROM consultation_messages m WHERE m.consult_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_message FROM consultations c
    LEFT JOIN pets p ON p.id=c.pet_id LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.owner_id=? ORDER BY c.id DESC`,[p.oid]));
  add('POST','/portal/{oid}/consultations',(p,d)=>{
    get('owners',p.oid,'客户');const doctors=q("SELECT id FROM staff WHERE role='医生' AND status='在职'");if(!doctors.length)fail('暂无在线医生');const did=int(d.doctor_id)||doctors[Math.floor(Math.random()*doctors.length)].id;
    if(int(d.pet_id))D.validatePatient(p.oid,d.pet_id);D.validateDoctor(did);
    const title=String(d.title||'在线问诊咨询').trim()||'在线问诊咨询',content=String(d.content||'').trim();if(title.length>100)fail('问诊主题不能超过100字');if(!content||content.length>5000)fail('请填写症状描述，长度不超过5000字');
    const id=insert('consultations',{consult_no:next('CS','consultations','consult_no'),owner_id:p.oid,pet_id:int(d.pet_id)||null,doctor_id:did,title,status:'进行中',created_at:now(),closed_at:null});
    if((d.content||'').trim())post(id,{sender_role:'client',content:d.content,auto_reply:true});return q1('SELECT c.*,s.name AS doctor_name,s.title AS doctor_title FROM consultations c LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.id=?',[id]);
  });
  add('GET','/portal/consultations/{id}/messages',p=>{get('consultations',p.id,'问诊会话');return {consultation:q1('SELECT c.*,s.name AS doctor_name,s.title AS doctor_title,s.specialty FROM consultations c LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.id=?',[p.id]),items:D.mobileDecorateMessages?D.mobileDecorateMessages(q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[p.id])):q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[p.id])};});
  function ownConsult(p) {if(!q1('SELECT id FROM consultations WHERE id=? AND owner_id=?',[p.id,p.oid]))fail('问诊会话不存在');}
  add('GET','/portal/{oid}/consultations/{id}/messages',p=>{ownConsult(p);return {consultation:q1('SELECT c.*,s.name AS doctor_name,s.title AS doctor_title,s.specialty FROM consultations c LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.id=?',[p.id]),items:D.mobileDecorateMessages?D.mobileDecorateMessages(q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[p.id])):q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[p.id])};});
  function reply(content){const rule=globalThis.PET_HOSPITAL_REPLIES.rules.find(r=>r[0].some(k=>content.includes(k)));return rule?rule[1]:globalThis.PET_HOSPITAL_REPLIES.fallback;}
  function post(id,d){
    const c=get('consultations',id,'问诊会话'),content=String(d.content||'').trim(),attachments=D.mobileValidateAttachments?D.mobileValidateAttachments(d.attachments):[];if((!content&&!attachments.length)||content.length>5000)fail('请填写消息或添加附件，文字不能超过5000字');const role=d.sender_role??'client',sender=role==='client'?val('SELECT name FROM owners WHERE id=?',[c.owner_id])||'客户':role==='system'?'系统':val('SELECT name FROM staff WHERE id=?',[c.doctor_id])||'在线医生';
    if(c.status==='已关闭')fail('问诊已关闭，请重新发起问诊');if(!['client','doctor','system'].includes(role))fail('消息发送身份无效');
    const previous=D.mobileMessageRequest&&D.mobileMessageRequest(d.request_key,id,role,content,attachments);if(previous)return {id:previous.message_id,messages:D.mobileDecorateMessages(q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[id]))};const mid=insert('consultation_messages',{consult_id:id,sender_role:role,sender_name:sender,content_type:attachments.length?'media':'text',content:content||(attachments.some(x=>x.mime.startsWith('video/'))?'[短视频]':'[图片]'),created_at:now()});if(D.mobileAttachMessage)D.mobileAttachMessage(mid,c,attachments);if(D.mobileRememberMessage)D.mobileRememberMessage(d.request_key,id,mid,role);run("UPDATE consultations SET status='进行中' WHERE id=? AND status='待回复'",[id]);
    if(role==='client'&&(d.auto_reply??true))insert('consultation_messages',{consult_id:id,sender_role:'doctor',sender_name:val('SELECT name FROM staff WHERE id=?',[c.doctor_id])||'在线医生',content_type:'text',content:reply(content),created_at:now()});return {id:mid,messages:D.mobileDecorateMessages?D.mobileDecorateMessages(q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[id])):q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[id])};
  }
  add('POST','/portal/consultations/{id}/messages',(p,d)=>post(p.id,d));
  add('POST','/portal/{oid}/consultations/{id}/messages',(p,d)=>{ownConsult(p);return post(p.id,Object.assign({},d,{sender_role:'client'}));});
  add('PATCH','/portal/consultations/{id}/close',p=>{update('consultations',p.id,{status:'已关闭',closed_at:now()});return {ok:true};});
})(window.Demo);
