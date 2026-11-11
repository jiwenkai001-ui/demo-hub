/* Additive, versioned fictional business records. Never replaces existing records. */
(function(D){
  'use strict';
  const {q,q1,val,run,insert,date,now,money}=D;
  D.enhanceInit=function(){
    run('CREATE TABLE IF NOT EXISTS demo_business_versions (version TEXT PRIMARY KEY, installed_at TEXT NOT NULL)');
    run('CREATE TABLE IF NOT EXISTS demo_payment_logs (id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id),amount REAL NOT NULL,method TEXT NOT NULL,created_at TEXT NOT NULL)');
    if(q1("SELECT version FROM demo_business_versions WHERE version='20261110-v1'"))return false;
    const doctors=q("SELECT * FROM staff WHERE role='医生' AND status='在职' ORDER BY id"),pets=q('SELECT * FROM pets ORDER BY id LIMIT 50');
    if(!doctors.length||!pets.length)return false;
    function day(offset){const d=new Date();d.setDate(d.getDate()+offset);return date(d);}
    const scenarios=[
      {type:'普通门诊',chief:'反复搔抓双耳，耳道有褐色分泌物约 3 天',diagnosis:'外耳炎，待耳道细胞学检查',objective:'精神尚可，耳廓轻度红肿，耳道分泌物增多。',plan:'耳道检查及细胞学评估，按检查结果制定清洁和用药方案；7 天后复查。',price:128},
      {type:'复诊',chief:'胃肠不适治疗后复查，食欲较前改善',diagnosis:'胃肠炎恢复期',objective:'精神良好，腹部触诊无明显不适，脱水征阴性。',plan:'少量多餐，记录食欲、排便及呕吐情况；若症状反复及时复诊。',price:96},
      {type:'体检',chief:'成年宠物年度健康筛查',diagnosis:'年度健康评估',objective:'体况评分 5/9，心肺听诊未见明显异常，牙结石轻度。',plan:'完善血常规和生化筛查，根据结果评估健康风险；定期口腔护理。',price:398},
      {type:'疫苗',chief:'预约年度免疫前健康评估',diagnosis:'免疫前健康评估',objective:'精神食欲正常，无近期呕吐腹泻，体温正常。',plan:'核对既往免疫和过敏史，评估符合免疫条件后接种并留观；出现异常及时联系医院。',price:158},
      {type:'复诊',chief:'术后第 7 天切口复查',diagnosis:'术后恢复随访',objective:'切口干燥，周围无明显红肿和渗出，精神状态稳定。',plan:'继续佩戴防护圈，保持切口干燥，按医嘱复查与拆线，避免剧烈活动。',price:88},
      {type:'普通门诊',chief:'近两周饮水量增加，进行老年健康筛查',diagnosis:'老年健康筛查，待进一步检查',objective:'意识清楚，体重较上次下降 0.3 kg，需结合实验室指标评估。',plan:'完善血常规、血液生化及尿检；居家记录饮水量、食量和体重，复查后制定管理计划。',price:528}
    ];
    // Every seeded day has complete, internally linked clinical and financial records.
    for(let offset=-13;offset<=0;offset++){
      const count=offset===0?5:2+(Math.abs(offset)%3);
      for(let j=0;j<count;j++){
        const pet=pets[(Math.abs(offset)*3+j)%pets.length],doc=doctors[(Math.abs(offset)+j)%doctors.length],s=scenarios[(Math.abs(offset)+j)%scenarios.length];
        const when=day(offset)+' '+String(9+j).padStart(2,'0')+':00:00',active=offset===0&&j>1,status=active?(j===2?'诊疗中':'待缴费'):'已完成';
        const aid=insert('appointments',{appt_no:'ENH-A-'+day(offset).replace(/-/g,'')+'-'+j,owner_id:pet.owner_id,pet_id:pet.id,doctor_id:doc.id,appt_type:s.type,scheduled_at:when,source:j%2?'小程序':'电话',status:active?'诊疗中':'已完成',note:'演示资料 · '+s.chief,created_at:when});
        const vid=insert('visits',{visit_no:'ENH-V-'+day(offset).replace(/-/g,'')+'-'+j,appointment_id:aid,owner_id:pet.owner_id,pet_id:pet.id,doctor_id:doc.id,dept:doc.dept,chief_complaint:s.chief,present_illness:'主人描述：'+s.chief+'。已核对既往病史及过敏史。',diagnosis:s.diagnosis,treatment:'体格检查、健康评估及个体化诊疗建议。',advice:s.plan,status,visit_type:s.type==='复诊'?'复诊':s.type==='体检'?'体检':'门诊',visited_at:when,finished_at:active?null:when,created_at:when});
        insert('vitals',{visit_id:vid,temperature:38.3+(j%3)*.1,heart_rate:pet.species==='猫'?156:108,resp_rate:24,weight:pet.weight,crt:1.5,mm:'粉红',pain_score:0,bcs:5,recorded_at:when});
        insert('soap_notes',{visit_id:vid,subjective:s.chief,objective:s.objective,assessment:s.diagnosis,plan:s.plan,author:doc.name,created_at:when});
        const paid=active?0:s.price,iid=insert('invoices',{invoice_no:'ENH-I-'+day(offset).replace(/-/g,'')+'-'+j,owner_id:pet.owner_id,pet_id:pet.id,visit_id:vid,total_amount:s.price,discount:0,payable:s.price,paid_amount:paid,status:paid?'已结清':'待缴费',pay_method:paid?(j%2?'支付宝':'微信'):'',cashier:paid?'演示前台':'',paid_at:paid?when:null,created_at:when});
        insert('invoice_items',{invoice_id:iid,item_type:s.type==='体检'?'检验':'诊疗',name:s.type==='体检'?'年度健康筛查套餐':'门诊评估与'+s.type+'服务',ref_id:null,qty:1,unit_price:s.price,amount:s.price});
        // New records link to existing clients without rewriting their historical totals.
        if(offset===0&&j>=2)insert('followups',{owner_id:pet.owner_id,pet_id:pet.id,type:j===4?'术后回访':j===3?'疫苗提醒':'体检提醒',scheduled_at:day(1)+' 10:00:00',channel:'微信',content:'演示资料：核对'+pet.name+'的精神、食欲和恢复情况，提醒按医嘱复查；沟通结果需填写在回访记录。',status:'待执行',result:'',operator:doc.name,finished_at:null,created_at:when});
        if(offset===0&&j===2){
          const panel=q1('SELECT panel,device_id FROM lab_items ORDER BY id LIMIT 1');
          if(panel){const lid=insert('lab_orders',{order_no:'ENH-L-'+day(0).replace(/-/g,''),visit_id:vid,pet_id:pet.id,doctor_id:doc.id,panel:panel.panel,device_id:panel.device_id,priority:'常规',status:'已采样',sample_type:'全血',note:'演示检查：门诊健康筛查，核对样本身份后检测。',ordered_at:when,reported_at:null,created_at:when});
            insert('invoice_items',{invoice_id:iid,item_type:'检验',name:panel.panel,ref_id:lid,qty:1,unit_price:120,amount:120});run('UPDATE invoices SET total_amount=total_amount+120,payable=payable+120 WHERE id=?',[iid]);}
        }
        if(offset===-1&&j===0){
          const original=q1('SELECT * FROM imaging_studies WHERE pet_id=? AND image_count>0 ORDER BY id DESC LIMIT 1',[pet.id]);
          if(original){const images=q('SELECT * FROM imaging_instances WHERE study_id=?',[original.id]);const sid=insert('imaging_studies',{study_uid:'ENH-ST-'+day(-1).replace(/-/g,'')+'-'+pet.id,visit_id:vid,pet_id:pet.id,doctor_id:doc.id,modality:original.modality,body_part:original.body_part,findings:'演示归档：'+original.findings,impression:'历史影像对照资料，结合临床复查。',image_count:images.length,status:'已报告',performed_by:doc.name,performed_at:when,created_at:when});images.forEach(img=>{const row=Object.assign({},img,{study_id:sid,uploaded_at:when,note:'演示复查资料 · '+img.note});delete row.id;insert('imaging_instances',row);});}
        }
      }
    }
    for(let j=0;j<6;j++){
      const pet=pets[(j+15)%pets.length],doc=doctors[j%doctors.length],when=day(j<4?0:1)+' '+String(14+(j%4)).padStart(2,'0')+':30:00';
      insert('appointments',{appt_no:'ENH-UP-'+day(0).replace(/-/g,'')+'-'+j,owner_id:pet.owner_id,pet_id:pet.id,doctor_id:doc.id,appt_type:scenarios[j].type,scheduled_at:when,source:j%2?'微信':'小程序',status:'待到店',note:'演示预约 · '+scenarios[j].chief,created_at:now()});
    }
    const templates=[
      ['主诉','犬猫皮肤瘙痒问诊','瘙痒持续时间：___；部位：___；是否有脱毛、皮屑、红斑：___；体外驱虫时间与产品：___；同住动物是否有类似表现：___。','通用'],
      ['现病史','胃肠道症状评估','起病时间：___；呕吐次数与内容物：___；排便性状：___；饮食变化及异物接触：___；精神食欲与饮水：___；既往疾病、用药及过敏史：___。','通用'],
      ['处置','术前评估与知情沟通','核对患者身份、手术部位与拟行手术；完成体格及麻醉前风险评估；确认禁食禁水、既往病史与过敏信息；说明替代方案、风险、预计费用与术后护理；取得知情同意后执行。','通用'],
      ['医嘱','术后居家护理','佩戴防护圈并保持切口清洁干燥，限制跳跃与剧烈活动；遵医嘱用药，不自行增减剂量；每日记录精神、食欲、排便及切口变化；若出现持续出血、呼吸异常或明显精神沉郁及时就诊；按约定时间复查。','通用'],
      ['医嘱','疫苗接种后观察','接种后按院内流程留观；近期避免应激及剧烈活动；记录精神、食欲及局部反应；若出现面部肿胀、呼吸困难、持续呕吐等异常请立即联系医院；妥善保存免疫记录并按时完成后续程序。','通用'],
      ['处置','老年猫健康筛查','记录体重变化、饮水排尿、食欲及活动度；评估血压、口腔、体况与肌肉量；根据病史选择血常规、生化、尿检及影像项目；与主人沟通分期检查计划和复查时间。','猫'],
      ['医嘱','口腔护理指导','根据口腔评估制定护理方案；使用宠物专用护理产品，循序适应刷牙；不使用人用牙膏或自行刮除牙结石；关注口臭、流涎、偏侧咀嚼等表现；按医嘱复查。','通用'],
      ['主诉','幼年宠物首诊建档','来源与到家时间：___；年龄与体重：___；既往免疫驱虫记录：___；饮食与排便：___；同住宠物：___；近期咳嗽、呕吐、腹泻或精神异常：___。','通用']
    ];
    templates.forEach(t=>{if(!q1('SELECT id FROM emr_templates WHERE title=?',[t[1]]))insert('emr_templates',{category:t[0],title:t[1],content:t[2],species:t[3],usage_count:0,created_at:now()});});
    insert('demo_business_versions',{version:'20261110-v1',installed_at:now()});return true;
  };
})(window.Demo);
