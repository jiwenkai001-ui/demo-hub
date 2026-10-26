(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,date,now,next,ref,items,asset}=D;
  add('GET','/portal/demo-accounts',()=>items(`SELECT o.id,o.name,o.phone,o.member_level,o.life_stage,
    (SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count FROM owners o ORDER BY o.total_spend DESC LIMIT 8`));
  add('POST','/portal/login',(p,d)=>{const phone=(d.phone||'').trim();if(!phone)fail('请输入手机号');const owner=q1('SELECT * FROM owners WHERE phone=?',[phone]);if(!owner)fail('未找到该手机号对应的客户，请先到院建档');return {token:'mp-'+owner.id+'-'+Math.floor(1000+Math.random()*9000),owner};});
  add('GET','/portal/doctors',()=>items("SELECT id,name,title,dept,specialty,work_years FROM staff WHERE role='医生' AND status='在职' ORDER BY id"));
  add('GET','/portal/slots',p=>{
    const current=new Date(),base=p.date?new Date(p.date+'T00:00:00'):current,out=[];if(Number.isNaN(base.getTime()))base.setTime(current.getTime());
    for(let i=0;i<7;i++){const day=new Date(base);day.setDate(base.getDate()+i);const slots=[];
      for(let h=9;h<19;h++){if(i===0&&!p.date&&h<=current.getHours())continue;for(const m of [0,30]){const time=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');slots.push({time,datetime:date(day)+' '+time+':00',available:Math.random()>.25});}}
      out.push({date:date(day),weekday:'周'+'日一二三四五六'[day.getDay()],slots});
    }return {items:out};
  });
  add('GET','/portal/{oid}/overview',p=>{
    const owner=get('owners',p.oid,'客户'),pets=q('SELECT * FROM pets WHERE owner_id=? ORDER BY id DESC',[p.oid]);return {owner,pet_count:pets.length,pets,card:q1('SELECT * FROM membership_cards WHERE owner_id=?',[p.oid]),
      coupon_count:n(val("SELECT COUNT(*) FROM coupons WHERE owner_id=? AND status='未使用'",[p.oid])),reminder_count:n(val("SELECT COUNT(*) FROM reminders WHERE owner_id=? AND status='待处理'",[p.oid])),
      upcoming:q("SELECT a.*,p.name AS pet_name,s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.owner_id=? AND a.status IN ('待到店','已到店') ORDER BY a.scheduled_at LIMIT 5",[p.oid]),
      unpaid:q("SELECT * FROM invoices WHERE owner_id=? AND status IN ('待缴费','部分缴费') ORDER BY id DESC LIMIT 5",[p.oid]),
      reminders:q("SELECT r.*,p.name AS pet_name FROM reminders r LEFT JOIN pets p ON p.id=r.pet_id WHERE r.owner_id=? AND r.status='待处理' ORDER BY r.due_at LIMIT 5",[p.oid]),
      consult_open:n(val("SELECT COUNT(*) FROM consultations WHERE owner_id=? AND status IN ('待回复','进行中')",[p.oid]))};
  });
  add('GET','/portal/{oid}/pets',p=>items('SELECT p.*,(SELECT MAX(v.visited_at) FROM visits v WHERE v.pet_id=p.id) AS last_visit FROM pets p WHERE p.owner_id=? ORDER BY id DESC',[p.oid]));
  add('GET','/portal/{oid}/appointments',p=>items('SELECT a.*,p.name AS pet_name,p.species,s.name AS doctor_name,s.title AS doctor_title FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.owner_id=? ORDER BY a.scheduled_at DESC',[p.oid]));
  add('POST','/portal/{oid}/appointments',(p,d)=>{
    get('owners',p.oid,'客户');if(!int(d.pet_id)||!d.scheduled_at)fail('请选择宠物与预约时间');if(!q1('SELECT * FROM pets WHERE id=? AND owner_id=?',[int(d.pet_id),p.oid]))fail('宠物不存在');
    const a=D.appointment(Object.assign({},d,{owner_id:p.oid,source:'小程序',status:'待到店'}));return q1('SELECT a.*,p.name AS pet_name,s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE a.id=?',[a.id]);
  });
  add('PATCH','/portal/appointments/{id}/cancel',p=>{update('appointments',p.id,{status:'已取消'});return {ok:true};});
  add('GET','/portal/{oid}/records',p=>items('SELECT v.*,p.name AS pet_name,s.name AS doctor_name FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.owner_id=? ORDER BY v.visited_at DESC',[p.oid]));
  add('GET','/portal/{oid}/records/{id}',p=>{
    const found=q1('SELECT * FROM visits WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!found)fail('记录不存在');const v=D.visitDetail(p.id);delete v.owner;delete v.appointment;
    v.imaging.forEach(st=>{const ins=q1('SELECT * FROM imaging_instances WHERE study_id=? ORDER BY instance_no LIMIT 1',[st.id]);st.cover=ins?asset(ins.file_path.startsWith('data:')?ins.file_path:'uploads/'+ins.file_path):null;});return v;
  });
  add('GET','/portal/{oid}/labs',p=>items('SELECT lo.*,p.name AS pet_name FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id WHERE p.owner_id=? ORDER BY lo.id DESC',[p.oid]));
  add('GET','/portal/{oid}/labs/{id}',p=>{
    const o=q1('SELECT lo.* FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id WHERE lo.id=? AND p.owner_id=?',[p.id,p.oid]);if(!o)fail('报告不存在');o.pet=q1('SELECT * FROM pets WHERE id=?',[o.pet_id]);o.results=q('SELECT * FROM lab_results WHERE order_id=? ORDER BY id',[p.id]);o.results.forEach(r=>r.ref_text=ref(r.ref_low,r.ref_high));o.abnormal=o.results.filter(r=>r.flag!=='正常');return o;
  });
  add('GET','/portal/{oid}/imaging',p=>{
    const rows=q('SELECT ist.*,p.name AS pet_name,(SELECT ii.file_path FROM imaging_instances ii WHERE ii.study_id=ist.id ORDER BY ii.instance_no LIMIT 1) AS cover FROM imaging_studies ist LEFT JOIN pets p ON p.id=ist.pet_id WHERE p.owner_id=? ORDER BY ist.performed_at DESC',[p.oid]);rows.forEach(r=>r.cover_url=r.cover?asset(r.cover.startsWith('data:')?r.cover:'uploads/'+r.cover):null);return {items:rows};
  });
  add('GET','/portal/{oid}/imaging/{id}',p=>{
    const st=q1('SELECT ist.* FROM imaging_studies ist LEFT JOIN pets p ON p.id=ist.pet_id WHERE ist.id=? AND p.owner_id=?',[p.id,p.oid]);if(!st)fail('影像不存在');st.instances=D.instances(p.id);st.pet=q1('SELECT * FROM pets WHERE id=?',[st.pet_id]);return st;
  });
  add('GET','/portal/{oid}/invoices',p=>items('SELECT i.*,p.name AS pet_name FROM invoices i LEFT JOIN pets p ON p.id=i.pet_id WHERE i.owner_id=? ORDER BY i.id DESC',[p.oid]));
  add('GET','/portal/{oid}/invoices/{id}',p=>{
    const inv=q1('SELECT * FROM invoices WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!inv)fail('账单不存在');inv.items=q('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[p.id]);inv.pet=inv.pet_id?q1('SELECT * FROM pets WHERE id=?',[inv.pet_id]):null;return inv;
  });
  add('POST','/portal/{oid}/invoices/{id}/pay',(p,d)=>{
    const inv=q1('SELECT * FROM invoices WHERE id=? AND owner_id=?',[p.id,p.oid]);if(!inv)fail('账单不存在');const amount=n(d.amount)||(money(inv.payable)-money(inv.paid_amount)),paid=money(money(inv.paid_amount)+amount),status=paid>=money(inv.payable)-.01?'已结清':'部分缴费';
    update('invoices',p.id,{paid_amount:paid,status,pay_method:d.pay_method??'微信',paid_at:now()});if(status==='已结清'&&inv.visit_id)run("UPDATE visits SET status='已完成',finished_at=? WHERE id=? AND status='待缴费'",[now(),inv.visit_id]);return get('invoices',p.id);
  });
  add('GET','/portal/{oid}/coupons',p=>items('SELECT c.*,cp.name AS campaign_name FROM coupons c LEFT JOIN campaigns cp ON cp.id=c.campaign_id WHERE c.owner_id=? ORDER BY c.id DESC',[p.oid]));
  add('GET','/portal/{oid}/reminders',p=>items('SELECT r.*,p.name AS pet_name FROM reminders r LEFT JOIN pets p ON p.id=r.pet_id WHERE r.owner_id=? ORDER BY r.due_at',[p.oid]));
  add('PATCH','/portal/reminders/{id}/done',p=>{run("UPDATE reminders SET status='已完成' WHERE id=?",[p.id]);return {ok:true};});
  add('GET','/portal/{oid}/vaccinations',p=>items('SELECT vac.*,p.name AS pet_name FROM vaccinations vac LEFT JOIN pets p ON p.id=vac.pet_id WHERE p.owner_id=? ORDER BY vac.injected_at DESC',[p.oid]));
  add('GET','/portal/{oid}/consultations',p=>items(`SELECT c.*,p.name AS pet_name,s.name AS doctor_name,s.title AS doctor_title,
    (SELECT COUNT(*) FROM consultation_messages m WHERE m.consult_id=c.id) AS msg_count,
    (SELECT m.content FROM consultation_messages m WHERE m.consult_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_message FROM consultations c
    LEFT JOIN pets p ON p.id=c.pet_id LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.owner_id=? ORDER BY c.id DESC`,[p.oid]));
  add('POST','/portal/{oid}/consultations',(p,d)=>{
    get('owners',p.oid,'客户');const doctors=q("SELECT id FROM staff WHERE role='医生' AND status='在职'");if(!doctors.length)fail('暂无在线医生');const did=int(d.doctor_id)||doctors[Math.floor(Math.random()*doctors.length)].id;
    const id=insert('consultations',{consult_no:next('CS','consultations','consult_no'),owner_id:p.oid,pet_id:int(d.pet_id)||null,doctor_id:did,title:d.title??'在线问诊咨询',status:'进行中',created_at:now(),closed_at:null});
    if((d.content||'').trim())post(id,{sender_role:'client',content:d.content,auto_reply:true});return q1('SELECT c.*,s.name AS doctor_name,s.title AS doctor_title FROM consultations c LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.id=?',[id]);
  });
  add('GET','/portal/consultations/{id}/messages',p=>{get('consultations',p.id,'问诊会话');return {consultation:q1('SELECT c.*,s.name AS doctor_name,s.title AS doctor_title,s.specialty FROM consultations c LEFT JOIN staff s ON s.id=c.doctor_id WHERE c.id=?',[p.id]),items:q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[p.id])};});
  function reply(content){const rule=globalThis.PET_HOSPITAL_REPLIES.rules.find(r=>r[0].some(k=>content.includes(k)));return rule?rule[1]:globalThis.PET_HOSPITAL_REPLIES.fallback;}
  function post(id,d){
    const c=get('consultations',id,'问诊会话'),content=(d.content||'').trim();if(!content)fail('消息内容不能为空');const role=d.sender_role??'client',sender=role==='client'?val('SELECT name FROM owners WHERE id=?',[c.owner_id])||'客户':role==='system'?'系统':val('SELECT name FROM staff WHERE id=?',[c.doctor_id])||'在线医生';
    const mid=insert('consultation_messages',{consult_id:id,sender_role:role,sender_name:sender,content_type:d.content_type??'text',content,created_at:now()});run("UPDATE consultations SET status='进行中' WHERE id=? AND status='待回复'",[id]);
    if(role==='client'&&(d.auto_reply??true))insert('consultation_messages',{consult_id:id,sender_role:'doctor',sender_name:val('SELECT name FROM staff WHERE id=?',[c.doctor_id])||'在线医生',content_type:'text',content:reply(content),created_at:now()});return {id:mid,messages:q('SELECT * FROM consultation_messages WHERE consult_id=? ORDER BY id',[id])};
  }
  add('POST','/portal/consultations/{id}/messages',(p,d)=>post(p.id,d));
  add('PATCH','/portal/consultations/{id}/close',p=>{update('consultations',p.id,{status:'已关闭',closed_at:now()});return {ok:true};});
})(window.Demo);
