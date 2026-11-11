/* Versioned fictional examples and traceable repairs of the shipped demonstration data. */
(function (D) {
  'use strict';
  const {q,q1,val,run,get,insert,update,money,date,now,later}=D;
  const VERSION='data-cycle-20261111-v1';
  const exists=t=>!!q1("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[t]);
  function call(method,path,body={}) {
    const url=new URL('https://demo.local/api'+path);
    const r=D.routes.find(r=>r.method===method&&r.regex.test(url.pathname));
    if(!r)throw new Error('演示数据接口不存在：'+method+' '+path);
    const match=url.pathname.match(r.regex),p=Object.fromEntries(url.searchParams);
    r.keys.forEach((k,i)=>p[k]=Number(match[i+1]));
    try{return r.handler(p,body);}catch(error){throw new Error(path+'：'+error.message);}
  }
  function repair(table,id,changes,reason) {
    const before=get(table,id),patch=Object.fromEntries(Object.entries(changes).filter(([k,v])=>before[k]!==v));
    if(!Object.keys(patch).length)return;
    update(table,id,patch);
    insert('data_cycle_repairs',{version:VERSION,table_name:table,record_id:id,reason,before_json:JSON.stringify(before),after_json:JSON.stringify(get(table,id)),created_at:now()});
  }
  function labResults(order,complete=true) {
    q('SELECT * FROM lab_items WHERE panel=? ORDER BY id',[order.panel]).forEach(it=>{
      if(q1('SELECT id FROM lab_results WHERE order_id=? AND item_id=?',[order.id,it.id]))return;
      const value=it.ref_low==null&&it.ref_high==null?'阴性':String(Number(((it.ref_low+it.ref_high)/2).toFixed(it.code==='USG'?3:2)));
      insert('lab_results',{order_id:order.id,item_id:it.id,item_code:it.code,item_name:it.name,value,unit:it.unit,ref_low:it.ref_low,ref_high:it.ref_high,flag:D.flag(value,it.ref_low,it.ref_high),source:'虚构演示数据',device_id:order.device_id,raw_payload:'演示资料补齐；非真实检测结果',result_at:order.reported_at||order.ordered_at,created_at:now()});
    });
    if(complete)repair('lab_orders',order.id,{status:'已审核',reported_at:order.reported_at||order.ordered_at},'补齐原演示报告的全部项目并归档');
  }
  function repairReference() {
    const reference={};
    ['invoice_items','prescriptions','lab_orders','visits','coupons','batches','appointments','products','campaigns','vaccinations'].forEach(t=>reference[t]=new Map(D.seedRows(t).map(r=>[r.id,r])));
    const original=(t,r)=>{const b=reference[t]?.get(r.id);return b&&Object.keys(b).every(k=>b[k]===r[k]);};
    // Recover exact business references without changing historical charges or cash receipts.
    q("SELECT x.*,i.visit_id FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id WHERE x.item_type IN ('药品','检验','影像') AND COALESCE(x.ref_id,0)=0").forEach(x=>{
      const bare=get('invoice_items',x.id),inv=get('invoices',x.invoice_id);
      if(!original('invoice_items',bare)&&!inv.invoice_no.startsWith('ENH-'))return;
      let rows=[];
      if(x.item_type==='药品')rows=q("SELECT r.id FROM prescriptions r WHERE visit_id=? AND drug_name=? AND qty=? AND NOT EXISTS(SELECT 1 FROM invoice_items i WHERE i.item_type='药品' AND i.ref_id=r.id)",[x.visit_id,x.name,x.qty]);
      if(x.item_type==='检验')rows=q('SELECT id FROM lab_orders WHERE visit_id=? AND (?=panel||? OR ?=panel)',[x.visit_id,x.name,'检查',x.name]);
      if(x.item_type==='影像')rows=q('SELECT id FROM imaging_studies WHERE visit_id=? AND ?=modality||?||body_part||?',[x.visit_id,x.name,'-','检查']);
      if(!rows.length&&x.item_type==='检验'&&inv.invoice_no.startsWith('ENH-')){
        const v=get('visits',x.visit_id),it=q1("SELECT * FROM lab_items WHERE panel='血常规' ORDER BY id LIMIT 1");
        const id=insert('lab_orders',{order_no:'CYCLE-HISTORY-L-'+x.id,visit_id:v.id,pet_id:v.pet_id,doctor_id:v.doctor_id,panel:it.panel,device_id:it.device_id,priority:'常规',status:v.status==='已完成'?'已审核':'已开单',sample_type:'全血',note:'年度健康筛查套餐包含项目（虚构演示），费用已在原账单列示，不重复计费。',ordered_at:v.visited_at,reported_at:v.status==='已完成'?v.finished_at:null,created_at:now()});
        D.servicesRememberRecord('lab_orders',id,v.owner_id);rows=[{id}];
      }
      if(rows.length)repair('invoice_items',x.id,{ref_id:rows[0].id},'按同次就诊、项目名称和数量恢复收费来源');
    });
    // Complete only original, untouched clinical sample records. User-entered reports are preserved.
    q('SELECT * FROM lab_orders').forEach(o=>{
      if(original('lab_orders',o)||o.order_no.startsWith('CYCLE-HISTORY-')){
        const v=o.visit_id?get('visits',o.visit_id):null;
        if(v?.status==='已完成'||['已完成','已审核'].includes(o.status))labResults(o);
        if(v&&v.status==='已完成'&&!q1("SELECT x.id FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id WHERE i.visit_id=? AND x.item_type='检验' AND x.ref_id=?",[v.id,o.id])){
          const inv=q1('SELECT * FROM invoices WHERE visit_id=?',[v.id]);if(inv)insert('invoice_items',{invoice_id:inv.id,item_type:'检验',name:o.panel+'检查（历史演示诊查费已含）',ref_id:o.id,qty:1,unit_price:0,amount:0});
        }
      }
    });
    q("SELECT v.* FROM visits v WHERE v.status='已完成'").forEach(v=>{
      if(!original('visits',v)&&!v.visit_no.startsWith('ENH-'))return;
      if(!q1('SELECT id FROM soap_notes WHERE visit_id=?',[v.id])){
        const vit=q1('SELECT * FROM vitals WHERE visit_id=? ORDER BY id DESC',[v.id]);
        insert('soap_notes',{visit_id:v.id,subjective:v.chief_complaint||v.present_illness,objective:vit?`历史体征归档：体温 ${vit.temperature}℃，心率 ${vit.heart_rate} 次/分，呼吸 ${vit.resp_rate} 次/分，体重 ${vit.weight} kg。`:'历史就诊摘要归档；本条不补记未测量的生命体征。',assessment:v.diagnosis,plan:[v.treatment,v.advice].filter(Boolean).join('；'),author:v.doctor_id?get('staff',v.doctor_id).name:'演示归档',created_at:v.finished_at||v.visited_at});
      }
    });
    q('SELECT * FROM prescriptions').forEach(r=>{
      if(!original('prescriptions',r))return;
      const p=r.product_id?get('products',r.product_id):null;if(!p)return;
      // Random seed instructions previously treated gowns and dressings as oral medicines.
      const consumable=['耗材','用品'].includes(p.category),food=p.category==='食品';
      const route=consumable?'院内使用':food?'饲喂':/滴剂/.test(p.name)?'外用':/注射|粉针|止吐针/.test(p.name)?'院内注射':p.category==='疫苗'?'院内接种':'口服';
      repair('prescriptions',r.id,{route,dosage:consumable?`${r.qty}${r.unit}（本次领用总量）`:food?'按本次营养评估记录饲喂':'历史药房发出数量，非单次给药剂量',frequency:consumable?'本次领用':food?'按营养方案':'按原执业兽医医嘱',usage_note:consumable?'耗材/用品领用记录，不适用药物服用说明。':food?'食品营养支持样例，不作为药物处方。':'历史演示出库记录；原随机剂量说明已移除，不能作为实际用药依据。'},'清除原随机用药说明，区分药品、耗材与食品');
      const v=get('visits',r.visit_id),i=q1('SELECT * FROM invoices WHERE visit_id=?',[v.id]);
      if(v.status==='已完成'&&i?.status==='已结清'&&!q1('SELECT id FROM care_dispensing WHERE prescription_id=?',[r.id])){
        insert('care_dispensing',{prescription_id:r.id,status:'已发药',checked_by:'历史演示归档',checked_at:r.created_at,dispensed_by:'历史演示归档',dispensed_at:i.paid_at||r.created_at});
        insert('care_history',{scope:'pharmacy',record_id:r.id,action:'历史发出归档',operator:'演示数据整理',note:'原已完成就诊及已结清账单的发出状态补齐；不再次扣库存。',created_at:now()});
      }
    });
    // Do not invent redeemed bills. Unlinked random seed redemptions are corrected to available/expired.
    q('SELECT * FROM coupons').forEach(c=>{
      if(!original('coupons',c))return;
      const patch={name:c.coupon_type==='折扣'?`${Math.round(c.value*100)/10}折关爱券`:`满${c.min_spend}减${c.value}元关爱券`};
      if(c.status==='已使用'&&!q1('SELECT invoice_id FROM demo_invoice_coupons WHERE coupon_id=?',[c.id]))Object.assign(patch,{status:c.expire_at&&c.expire_at.slice(0,10)<date()?'已过期':'未使用',used_at:null});
      if(c.status==='未使用'&&c.expire_at&&c.expire_at.slice(0,10)<date())patch.status='已过期';
      repair('coupons',c.id,patch,'纠正随机样例券名称及无核销依据的使用状态');
    });
    q('SELECT * FROM campaigns').forEach(c=>{
      if(original('campaigns',c))repair('campaigns',c.id,{reach_count:Number(val('SELECT COUNT(DISTINCT owner_id) FROM coupons WHERE campaign_id=?',[c.id])),convert_count:Number(val('SELECT COUNT(*) FROM demo_campaign_receipts WHERE campaign_id=?',[c.id])),revenue:money(val('SELECT COALESCE(SUM(amount),0) FROM demo_campaign_receipts WHERE campaign_id=?',[c.id]))},'以可追溯的发券客户和账单核销重建样例营销数据');
    });
    q('SELECT * FROM appointments').forEach(a=>{
      if(!original('appointments',a))return;
      const v=q1('SELECT * FROM visits WHERE appointment_id=?',[a.id]);
      if(!v&&a.status==='待到店'&&a.scheduled_at.slice(0,10)<date())repair('appointments',a.id,{status:'爽约',note:(a.note||'')+'；历史演示预约未到店，已归档为爽约'},'过期且无就诊的原演示预约归档');
      if(v&&a.scheduled_at>v.visited_at)repair('appointments',a.id,{scheduled_at:v.visited_at},'原样例预约时间晚于实际接诊，按关联接诊时间校正');
    });
    q('SELECT * FROM vaccinations').forEach(v=>{
      if(!original('vaccinations',v))return;const pet=get('pets',v.pet_id);
      const wrong=pet.species==='猫'&&v.name==='犬瘟细小二联疫苗'||pet.species==='犬'&&v.name==='猫三联疫苗';
      if(wrong){const product=get('products',pet.species==='猫'?14:12);repair('vaccinations',v.id,{name:product.name,manufacturer:product.manufacturer,batch_no:'HISTORY-DEMO-'+v.id},'纠正原随机免疫档案的犬猫品种；批号明确为历史演示编号');}
    });
    // Main-stock quantity and its continuous inventory ledger are authoritative. Only original
    // sample lot balances may be reduced; user-created lots and receipts are never overwritten.
    q('SELECT * FROM products').forEach(p=>{
      let excess=money(Number(val('SELECT COALESCE(SUM(qty),0) FROM batches WHERE product_id=?',[p.id]))-p.stock_qty);
      if(excess>0)q('SELECT * FROM batches WHERE product_id=? ORDER BY id DESC',[p.id]).forEach(b=>{
        if(excess<=0)return;const old=reference.batches.get(b.id);if(!old)return;
        const allocations=Number(val('SELECT COALESCE(SUM(qty),0) FROM demo_batch_allocations WHERE batch_id=? AND restored=0',[b.id]));
        if(Math.abs(b.qty-(old.qty-allocations))>.011)return;
        const take=Math.min(excess,b.qty);repair('batches',b.id,{qty:money(b.qty-take)},'原随机批次余额超过总库存，按库存连续台账校准，保留改前数量');excess=money(excess-take);
      });
    });
    D.dataCycleSync();
    // Correct the small set of random dog/cat vaccine mismatches, including their stock
    // movements and bill names. Cash amounts remain the original agreed historical price.
    const swaps=q('SELECT * FROM prescriptions').filter(r=>{
      const old=reference.prescriptions.get(r.id);if(!old||old.product_id!==r.product_id||r.usage_note!=='历史演示出库记录；原随机剂量说明已移除，不能作为实际用药依据。')return false;
      const pet=get('pets',get('visits',r.visit_id).pet_id);return r.product_id===12&&pet.species==='猫'||r.product_id===14&&pet.species==='犬';
    });
    // Preflight the whole reclassification before writing either side. An existing
    // user's depleted/expired stock must not prevent opening the upgraded database.
    const canSwap=[12,14].every(pid=>{
      const p=get('products',pid),batches=q('SELECT * FROM batches WHERE product_id=? AND qty>0',[pid]);
      const unbatched=Math.max(0,money(p.stock_qty-batches.reduce((s,b)=>s+b.qty,0)));
      const available=Math.min(p.stock_qty,unbatched+batches.filter(b=>!b.expire_date||b.expire_date>=date()).reduce((s,b)=>s+b.qty,0));
      const returned=swaps.filter(r=>r.product_id===pid).reduce((s,r)=>s+r.qty,0),needed=swaps.filter(r=>r.product_id!==pid).reduce((s,r)=>s+r.qty,0);
      return money(available+returned)>=money(needed);
    });
    if(canSwap){
      swaps.forEach(r=>D.stock(r.product_id,r.qty,'演示品种校正退库','CYCLE-RX-RETURN:'+r.id,'演示资料校准'));
      D.dataCycleSync();
      swaps.forEach(r=>{
        const product=get('products',r.product_id===12?14:12);
        D.stock(product.id,-r.qty,'演示品种校正出库','RX:'+r.id,'演示资料校准');
        repair('prescriptions',r.id,{product_id:product.id,drug_name:product.name,spec:product.spec,unit:product.unit},'纠正原随机处方的犬猫疫苗品种，同步校正出入库');
        q("SELECT id FROM invoice_items WHERE item_type='药品' AND ref_id=?",[r.id]).forEach(x=>repair('invoice_items',x.id,{name:product.name},'同步修正疫苗名称，保留历史约定收费金额'));
      });
    }
    q('SELECT * FROM owners').forEach(o=>{
      const delta=o.points-Number(val('SELECT COALESCE(SUM(delta),0) FROM service_points WHERE owner_id=?',[o.id]));
      if(delta)insert('service_points',{owner_id:o.id,invoice_id:null,delta,reason:'期初积分结转（历史积分保留）',balance:o.points,created_at:now()});
    });
    q("SELECT i.owner_id,MIN(e.created_at) AS opened_at,SUM(e.amount) AS historical_spend FROM demo_cash_events e JOIN invoices i ON i.id=e.invoice_id WHERE e.method='会员卡' AND e.card_id IS NULL GROUP BY i.owner_id").forEach(r=>{
      const id=insert('membership_cards',{card_no:'HISTORY-CARD-'+r.owner_id,owner_id:r.owner_id,level:'银卡',balance:0,points:get('owners',r.owner_id).points,discount:1,total_recharge:0,valid_until:r.opened_at.slice(0,10),status:'过期',opened_at:r.opened_at});
      insert('biz_card_events',{card_id:id,kind:'期初余额',amount:0,pay_method:'期初结转',receipt_no:'HISTORY-BALANCE-'+id,request_key:'history-card-'+id,fingerprint:'history-card-'+id,source:'历史已耗用演示卡归档；不虚构充值收款',cash_cutoff:Number(val('SELECT COALESCE(MAX(id),0) FROM demo_cash_events')),created_at:now()});
      q("SELECT e.id FROM demo_cash_events e JOIN invoices i ON i.id=e.invoice_id WHERE e.method='会员卡' AND e.card_id IS NULL AND i.owner_id=?",[r.owner_id]).forEach(e=>repair('demo_cash_events',e.id,{card_id:id},'历史会员支付缺少原卡，建立零余额历史卡以保留原卡退款归属'));
    });
    q('SELECT * FROM expense_attachments WHERE is_demo=1 AND data_url=\'\'').forEach(a=>{
      const r=get('expense_requests',a.request_id),content=`虚构费用凭证\n报销单：${r.request_no}\n用途：${r.title}\n金额：${r.total_amount}元\n本文件仅用于本地演示，不是真实税务发票或银行回单。`;
      const binary=unescape(encodeURIComponent(content));repair('expense_attachments',a.id,{data_url:'data:text/plain;base64,'+btoa(binary),size:binary.length},'为已有虚构票据补充可打开的说明文件');
    });
  }
  D.dataCycleSync=function(){
    if(!exists('data_cycle_versions'))return;
    // Derived customer totals and shared member points have one source on both clients.
    run("UPDATE owners SET balance=ROUND((SELECT COALESCE(SUM(balance),0) FROM membership_cards WHERE owner_id=owners.id),2),total_spend=ROUND((SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE owner_id=owners.id),2),visit_count=(SELECT COUNT(*) FROM visits WHERE owner_id=owners.id AND status<>'已取消'),last_visit_at=(SELECT MAX(visited_at) FROM visits WHERE owner_id=owners.id AND status<>'已取消')");
    run('UPDATE membership_cards SET points=(SELECT points FROM owners WHERE id=membership_cards.owner_id)');
    q('SELECT r.*,a.status AS oa_status,a.amount AS oa_amount FROM expense_requests r JOIN oa_approvals a ON a.id=r.source_oa_id').forEach(r=>{
      const status=['待付款','已付款'].includes(r.status)?'已通过':r.status==='已驳回'?'已驳回':['已撤回','已冲正'].includes(r.status)?'已撤回':'待审批';
      if(status!==r.oa_status||r.total_amount!==r.oa_amount){update('oa_approvals',r.source_oa_id,{status,amount:r.total_amount,updated_at:now()});insert('oa_approval_history',{approval_id:r.source_oa_id,action:'费用状态校准',operator:'系统',comment:r.request_no+' · '+r.status+'；保留原审批历史，同步费用中心状态。',created_at:now()});}
    });
    // An explicit unbatched bucket preserves stock entered without a supplier batch; never
    // invent expiry dates or silently reduce a user's physical batches.
    q('SELECT * FROM products').forEach(p=>{
      const total=money(val('SELECT COALESCE(SUM(qty),0) FROM batches WHERE product_id=?',[p.id])),gap=money(p.stock_qty-total);
      if(gap>0){const no='UNBATCHED-'+p.id,b=q1('SELECT * FROM batches WHERE product_id=? AND batch_no=?',[p.id,no]);
        if(b)update('batches',b.id,{qty:money(b.qty+gap)});else insert('batches',{product_id:p.id,batch_no:no,produce_date:null,expire_date:null,qty:gap,purchase_price:p.purchase_price,supplier_id:null,created_at:now()});
      }
      if(!q1('SELECT id FROM inventory_logs WHERE product_id=?',[p.id]))insert('inventory_logs',{product_id:p.id,change_qty:p.stock_qty,before_qty:0,after_qty:p.stock_qty,log_type:'期初入库',ref_no:'OPENING-'+p.id,operator:'演示数据结转',created_at:now()});
    });
    q("SELECT t.* FROM sys_queue t JOIN visits v ON v.id=t.visit_id WHERE v.status IN ('已完成','已取消') AND t.status NOT IN ('已结束','已取消')").forEach(t=>{
      update('sys_queue',t.id,{status:'已结束'});insert('sys_queue_history',{queue_id:t.id,action:'就诊结束同步',status:'已结束',comment:'关联病历已完成或取消',actor:'系统',created_at:now()});
    });
  };
  function scenario(key,title,description,ownerId,links){insert('data_cycle_scenarios',{scenario_key:key,title,description,owner_id:ownerId||null,links_json:JSON.stringify(links),created_at:now()});}
  function family(i,name,petName,species,breed){
    let phone=13900009000+i;while(q1('SELECT id FROM owners WHERE phone=?',[String(phone)]))phone+=10;
    const o=call('POST','/emr/owners',{name,phone:String(phone),gender:i%2?'女':'男',address:'演示市宠爱路'+(100+i)+'号（虚构）',source_channel:'小程序',tags:'闭环演示',remark:'本轮新增虚构演示家庭，非真实个人资料。'});
    const p=call('POST','/emr/pets',{owner_id:o.id,name:petName,species,breed,gender:'母(已绝育)',birth_date:'2023-04-18',weight:species==='犬'?12.4:4.2,color:species==='犬'?'奶油色':'蓝白',allergies:'暂无已知过敏（演示）',sterilized:1,remark:'全流程虚构病例'});
    insert('data_cycle_accounts',{owner_id:o.id,priority:i,label:''});return {o,p};
  }
  function medical(f,chief,diagnosis,type='门诊'){
    const v=D.visit({owner_id:f.o.id,pet_id:f.p.id,doctor_id:1,dept:'全科',status:'诊疗中',visit_type:type,chief_complaint:chief,present_illness:chief+'；已核对饮食、既往史及过敏史。',diagnosis,treatment:'体格检查、针对性评估与诊后管理。',advice:'按约定复查，观察精神、食欲和相关症状；出现呼吸困难、意识异常或持续呕吐及时返院。'});
    // These are same-day completed walk-in samples, not simultaneous bookable doctor slots.
    const aid=insert('appointments',{appt_no:'CYCLE-A-'+v.id,owner_id:f.o.id,pet_id:f.p.id,doctor_id:null,appt_type:type==='体检'?'体检':'普通门诊',scheduled_at:v.visited_at,source:'门店',status:'诊疗中',note:'虚构完整流程：到院登记后分诊接诊；无预约医生时段占用',created_at:v.created_at});update('visits',v.id,{appointment_id:aid});
    D.systemEnqueue(v.id);
    call('POST',`/emr/visits/${v.id}/vitals`,{temperature:38.4,heart_rate:f.p.species==='猫'?148:96,resp_rate:24,weight:f.p.weight,crt:1.5,mm:'粉红',pain_score:1,bcs:5});
    call('POST',`/emr/visits/${v.id}/soap`,{subjective:chief,objective:'精神清楚，黏膜粉红，CRT 1.5秒；心肺听诊未见明显异常，体征详见记录。',assessment:diagnosis,plan:v.advice,author:'张明远'});
    D.charge(v.id,'诊疗','初诊评估',1,80,null);return v;
  }
  function paid(v,method='微信',extra={}){D.setVisitStatus(v.id,'待缴费');const inv=q1('SELECT * FROM invoices WHERE visit_id=?',[v.id]);D.payInvoice(inv.id,{pay_method:method,...extra});return get('invoices',inv.id);}
  function specialty(v,key,values){let r=call('POST',`/care/visits/${v.id}/specialties`,{specialty:key,values});return call('POST',`/care/specialties/${r.id}/complete`,{revision:r.revision,staff_id:1,confirm:true});}
  function consent(v,f,title,content,signed=true){const d=call('POST','/care/documents',{visit_id:v.id,title,type:'知情确认',content});call('POST',`/care/documents/${d.id}/request`,{note:'已完成方案与费用沟通，请宠主核对。'});if(signed)call('POST',`/portal/${f.o.id}/care/documents/${d.id}/sign`,{consent:true,signer_name:f.o.name});return d;}
  function examples(){
    // New examples bring their own stock, cages and OA request; never consume a
    // user's pending approval or overwrite an occupied cage or branch price.
    const supplyPO=call('POST','/inv/purchase-orders',{supplier_id:1,operator:'演示采购员',remark:'闭环演示防护用品采购，供门诊领用与退货示例。',items:[{product_id:22,qty:2,price:get('products',22).purchase_price,batch_no:'CYCLE-SUPPLY-'+date().replaceAll('-',''),expire_date:later(730)}]});
    const supplyItem=q1('SELECT id FROM purchase_order_items WHERE po_id=?',[supplyPO.id]);call('POST',`/inv/purchase-orders/${supplyPO.id}/receive`,{items:{[supplyItem.id]:2},operator:'演示库管'});
    const uniqueName=(table,base)=>{let name=base,n=2;while(q1('SELECT id FROM '+table+' WHERE name=?',[name]))name=base+' '+n++;return name;};
    const surgeryCage=call('POST','/care/cages',{name:uniqueName('care_cages','闭环演示 · 术后恢复'),zone:'演示护理区',species:'犬',daily_rate:160});
    const activeCage=call('POST','/care/cages',{name:uniqueName('care_cages','闭环演示 · 在院观察'),zone:'演示护理区',species:'犬',daily_rate:160});
    const skin=family(1,'林悦（门诊演示）','团子','猫','英国短毛猫');
    const surgery=family(2,'陈晨（住院演示）','可乐','犬','柯基');
    const wellness=family(3,'许宁（免疫演示）','年糕','猫','布偶猫');
    const inpatient=family(4,'周航（在院演示）','豆包','犬','比熊');
    const specialtyFamily=family(5,'苏晴（专科演示）','米粒','猫','中华田园猫');
    const member=family(6,'唐果（会员演示）','橙子','犬','金毛');
    const common={assessment:'虚构专科评估，结果用于展示记录与联动。',plan:'结合本次检查记录制定个体化方案，已与主人沟通费用及复诊安排。',followup:'7天复诊，记录食欲、活动与相关症状；症状加重提前返院。'};
    const v=medical(skin,'双耳搔抓及耳道分泌物增多3天','外耳炎，结合耳道细胞学随访');
    specialty(v,'skin',{...common,history:'症状3天，无近期饮食变化；定期驱虫，同住动物无相同症状。',distribution:'双侧外耳道轻度红斑和分泌物，躯干未见明显脱毛。',pruritus:4,tests:'演示耳镜：耳道通畅；耳道细胞学见酵母样结构，需结合临床复核。',differentials:'感染性外耳炎；持续复发时进一步评估过敏或基础疾病。',assessment:'外耳炎，未见全身症状；耳道细胞学作为辅助依据。'});
    const l=call('POST','/lis/orders',{visit_id:v.id,pet_id:skin.p.id,doctor_id:1,panel:'血常规',sample_type:'全血',note:'完整报告示例'});labResults(l);
    const rx=call('POST',`/emr/visits/${v.id}/prescriptions`,{product_id:22,qty:1,dosage:'1个',frequency:'居家佩戴',route:'外用',days:7,usage_note:'防止搔抓；每日检查松紧和进食饮水情况。'});
    const campaign=call('POST','/crm/campaigns',{name:'新客诊后关怀（闭环演示）',type:'优惠券',target_stage:'新客',channel:'微信',budget:300,status:'进行中',start_at:date(),end_at:later(30),content:'关爱券与就诊账单、营销转化联动。'});
    const coupon=call('POST','/crm/coupons',{owner_id:skin.o.id,campaign_id:campaign.id,name:'门诊关爱满200减20元',coupon_type:'满减',value:20,min_spend:200,expire_at:later(30)});
    run('UPDATE campaigns SET reach_count=reach_count+1 WHERE id=?',[campaign.id]);D.applyInvoiceCoupon(q1('SELECT id FROM invoices WHERE visit_id=?',[v.id]).id,coupon.id);
    const inv=paid(v);
    call('POST',`/care/pharmacy/${rx.id}/action`,{action:'check',staff_id:9,checked:true,note:'核对宠物及防护用品规格、数量。'});
    call('POST',`/care/pharmacy/${rx.id}/action`,{action:'dispense',staff_id:9,checked:true,note:'已向主人交代佩戴及观察方法。'});
    const follow=insert('followups',{owner_id:skin.o.id,pet_id:skin.p.id,type:'诊后回访',scheduled_at:now(),channel:'站内演示',content:'确认团子诊后精神、食欲和防护用品使用情况。',status:'已完成',result:'主人确认精神食欲良好，已了解复查安排。',operator:'吴子豪',finished_at:now(),created_at:now()});
    const consult=call('POST',`/portal/${skin.o.id}/consultations`,{pet_id:skin.p.id,doctor_id:1,title:'团子诊后耳道护理咨询',content:'已回家佩戴防护圈，复查前需要记录哪些情况？'});
    call('POST',`/portal/consultations/${consult.id}/messages`,{sender_role:'doctor',content:'请记录搔耳频率、分泌物和精神食欲；按约定复诊，明显疼痛或症状加重请提前到院。',sender_name:'张明远'});
    if(window.PET_CYCLE_MEDIA){call('POST',`/portal/consultations/${consult.id}/messages`,{sender_role:'doctor',content:'附上居家观察记录卡及演示短片，方便按项记录。',attachments:[window.PET_CYCLE_MEDIA.image,window.PET_CYCLE_MEDIA.video],request_key:'cycle-doctor-media'});}
    scenario('outpatient','门诊诊疗与诊后关怀','到院登记 → 接诊 → 专科病历/检验 → 用品发出 → 优惠结算 → 积分 → 回访/线上问诊',skin.o.id,{visit_id:v.id,invoice_id:inv.id,lab_id:l.id,prescription_id:rx.id,consult_id:consult.id,followup_id:follow,purchase_id:supplyPO.id});

    const sv=medical(surgery,'右后肢跛行，术后住院观察','右后肢软组织损伤术后恢复','住院');
    call('PUT',`/care/visits/${sv.id}/assistants`,{staff_ids:[9],duty:'术前核对、住院监测与护理交接；主治负责诊疗决策。'});
    specialty(sv,'ortho',{...common,history:'活动后右后肢不愿负重，已完成体格与神经血管评估。',exam:'右后肢软组织肿胀，轻度疼痛，关节稳定性尚可。',side:'右后肢',neurovascular:'远端灌注及姿势反应可，未见明显神经功能缺损。',imaging:'本次虚构病例未新增影像；如持续跛行，复诊时由主治决定影像检查。',rehab:'短时牵引活动，避免奔跑跳跃；术后7天复查。'});
    specialty(sv,'anesthesia',{...common,procedure:'右后肢清创缝合（虚构手术）；主刀张明远，麻醉与护理人员按记录交接。',exam:'身份、术区、禁食及过敏史已核对；术前体检与知情同意记录齐全。',asa:'II',airway:'气道器材、氧源、回路及保温设备已检查；专人记录监测。',monitoring:'10:00 HR 104 RR 18 SpO₂ 99% ETCO₂ 38 mmHg MAP 78 mmHg T 38.1℃；10:15 HR 100 RR 18 SpO₂ 99% ETCO₂ 39 MAP 80 T 38.0℃。',surgery:'清创及分层缝合；敷料器械清点一致，无植入物。',recovery:'苏醒平稳，吞咽反射恢复后拔管；疼痛评分2/10，保温与气道观察交接完成。'});
    const sl=call('POST','/lis/orders',{visit_id:sv.id,pet_id:surgery.p.id,doctor_id:1,panel:'生化'});labResults(sl);
    const doc=consent(sv,surgery,'住院与手术方案确认（演示）',`宠物：可乐；主人：陈晨（住院演示）。\n拟行右后肢清创缝合与短期住院观察；已解释麻醉、出血、感染与延迟愈合风险。\n可选择进一步检查或暂缓手术；决定接受本次方案。预计费用以明细账单为准，新增项目须再次沟通。\n护理：监测精神、食欲、体温与切口，异常及时通知主治。\n联系电话使用本档案演示手机号；仅为本地虚构签署记录。`);
    const adm=call('POST','/care/admissions',{pet_id:surgery.p.id,visit_id:sv.id,cage_id:surgeryCage.id,kind:'住院',days:1,note:'术后照护，切口与饮食观察。'});
    const order=call('POST',`/care/admissions/${adm.id}/orders`,{assignee_id:9,title:'切口与疼痛观察',instruction:'核对切口渗出、精神及疼痛评分并记录交接。',scheduled_at:now()});
    call('POST',`/care/orders/${order.id}/action`,{action:'execute',staff_id:9,note:'切口干燥，无明显渗出，疼痛评分2/10；已交接主治。'});
    call('POST',`/care/admissions/${adm.id}/monitoring`,{staff_id:9,temperature:38.2,heart_rate:100,resp_rate:24,weight:12.4,appetite:'少量进食，饮水正常',note:'精神稳定，切口干燥，无明显不适。'});
    call('POST',`/bill/deposits/${adm.id}/topup`,{amount:2000,pay_method:'微信',receipt_no:'CYCLE-DEPOSIT-COMPLETE',request_key:'cycle-deposit-complete'});
    const si=q1('SELECT * FROM invoices WHERE visit_id=?',[sv.id]);
    call('POST',`/bill/deposits/${adm.id}/apply`,{invoice_id:si.id,amount:si.payable,request_key:'cycle-deposit-apply'});
    call('POST',`/care/admissions/${adm.id}/discharge`,{staff_id:1,care_checked:true,bill_checked:true,note:'精神和进食稳定，切口干燥；佩戴防护圈，限制活动，7天复查。'});
    const remaining=call('GET',`/bill/deposits/${adm.id}`).balance;
    if(remaining)call('POST',`/bill/deposits/${adm.id}/refund`,{amount:remaining,pay_method:'微信',receipt_no:'CYCLE-DEPOSIT-RETURN',request_key:'cycle-deposit-return',reason:'出院结清，原渠道退回剩余预交金（演示）。'});
    scenario('discharge','住院、预交金与出院','专科评估 → 主人签署 → 入住/护理/监护 → 预交金抵扣 → 出院 → 余额退回',surgery.o.id,{visit_id:sv.id,invoice_id:si.id,admission_id:adm.id,document_id:doc.id});

    const wv=medical(wellness,'年度免疫前健康评估','免疫前体格检查未见明显异常');
    const packageOrder=call('POST','/services/orders',{owner_id:wellness.o.id,pet_id:wellness.p.id,catalog_id:5});D.payInvoice(packageOrder.invoice_id,{pay_method:'微信'});
    const plan=call('POST','/services/plans',{owner_id:wellness.o.id,pet_id:wellness.p.id,category:'疫苗',name:'猫三联年度免疫（演示）',due_at:date(),interval_days:365,note:'健康评估后执行，批号与套餐核销关联。'});
    const vaccinePO=call('POST','/inv/purchase-orders',{supplier_id:1,operator:'演示采购员',remark:'免疫服务专用演示采购，批号与实际出库联动。',items:[{product_id:14,qty:10,price:52,batch_no:'CYCLE-VAC-'+date().replaceAll('-',''),expire_date:later(365)}]});
    const vaccinePOItem=q1('SELECT id FROM purchase_order_items WHERE po_id=?',[vaccinePO.id]);call('POST',`/inv/purchase-orders/${vaccinePO.id}/receive`,{items:{[vaccinePOItem.id]:10},operator:'演示冷链库管'});
    const batch=q1("SELECT * FROM batches WHERE product_id=14 AND batch_no=?",['CYCLE-VAC-'+date().replaceAll('-','')]);
    const done=call('POST',`/services/plans/${plan.id}/execute`,{order_id:packageOrder.id,executed_at:date(),doctor:'张明远',batch_id:batch.id,qty:1,visit_id:wv.id});
    const wi=paid(wv);scenario('vaccination','免疫计划与服务套餐','评估 → 购买套餐/付款 → 执行计划 → 疫苗出库 → 免疫档案/次数核销 → 下次提醒',wellness.o.id,{visit_id:wv.id,invoice_id:wi.id,service_order_id:packageOrder.id,plan_id:plan.id,vaccination_id:done.vaccination.id});

    const iv=medical(inpatient,'胃肠不适后留院观察','胃肠炎恢复期，继续观察','住院');
    const ia=call('POST','/care/admissions',{pet_id:inpatient.p.id,visit_id:iv.id,cage_id:activeCage.id,kind:'住院',days:1,note:'留院监护及饮食恢复评估。'});
    call('POST',`/bill/deposits/${ia.id}/topup`,{amount:1000,pay_method:'支付宝',receipt_no:'CYCLE-DEPOSIT-ACTIVE',request_key:'cycle-active-topup'});
    call('POST',`/care/admissions/${ia.id}/orders`,{assignee_id:9,title:'晚间体征与饮水观察',instruction:'核对精神、体温、饮水、排泄情况；完成后登记执行。',scheduled_at:later(1)+' 09:00:00'});
    call('POST',`/care/admissions/${ia.id}/monitoring`,{staff_id:9,temperature:38.5,heart_rate:108,resp_rate:26,weight:12.4,appetite:'少量进食',note:'意识清楚，继续观察。'});
    const pendingDoc=consent(iv,inpatient,'住院继续照护确认（待签）','豆包继续留院观察精神、饮水和排泄；日笼位费用160元，新增检查另行沟通。已提供当前账单及预交金余额，签署后继续照护。仅为虚构演示。',false);
    scenario('active-care','在院待办与小程序签署','预交金已收；保留待签文书、待执行护理及待结账状态，可继续完成出院流程。',inpatient.o.id,{visit_id:iv.id,admission_id:ia.id,document_id:pendingDoc.id,invoice_id:q1('SELECT id FROM invoices WHERE visit_id=?',[iv.id]).id});

    const dv=medical(specialtyFamily,'年度口腔评估','轻度牙石及牙龈炎，建议后续牙周评估');
    specialty(dv,'dental',{...common,exam:'清醒检查：口腔黏膜粉红，轻度口臭，咬合未见明显异常。',teeth:'104、204牙颈部少量牙石，未见明显牙冠折裂。',periodontal:'本次为清醒初筛，未进行麻醉下牙周探诊；与主人说明后续评估必要性。',radiographs:'本次未拍口内牙片，待后续麻醉下牙周检查决定。',procedure:'完成口腔初筛和居家护理教育，未实施拔牙。'});paid(dv);
    const ev=medical(specialtyFamily,'左眼分泌物增多1天','轻度结膜炎，角膜染色阴性');
    specialty(ev,'eye',{...common,history:'左眼少量透明分泌物，未自行滴药，无明确外伤史。',exam:'OD/OS视反应及瞳孔对光反射可；OS结膜轻度充血，角膜透明。',iop_od:16,iop_os:17,stt_od:18,stt_os:17,fluorescein:'双眼荧光素染色阴性；本次未见角膜上皮缺损。'});paid(ev);
    scenario('specialties','口腔与眼科专科病历','两次独立就诊 → 各自专科记录完成归档 → 分别结算 → 宠主端查询',specialtyFamily.o.id,{visit_id:dv.id,second_visit_id:ev.id});

    const card=call('POST','/crm/cards',{owner_id:member.o.id,level:'金卡',balance:1000,discount:.9,valid_until:later(365),pay_method:'微信'});
    call('POST',`/portal/${member.o.id}/cards/${card.id}/recharge`,{amount:500,pay_method:'微信',request_key:'cycle-member-recharge'});
    const service=call('POST','/services/orders',{owner_id:member.o.id,pet_id:member.p.id,catalog_id:3,member_discount:true});D.payInvoice(service.invoice_id,{pay_method:'会员卡',card_id:card.id});
    call('POST',`/services/orders/${service.id}/use`,{qty:1,note:'基础清洁护理完成',operator:'吴子豪',request_key:'cycle-grooming-use'});
    const retail=call('POST','/operations/retail',{staff_id:6,customer_type:'已有客户',owner_id:member.o.id,items:[{product_id:22,qty:1}],note:'会员购买防护用品后更换规格，展示原卡退费与退库。'});D.payInvoice(retail.invoice_id,{pay_method:'会员卡',card_id:card.id});call('POST',`/bill/invoices/${retail.invoice_id}/refund`);
    call('POST',`/portal/${member.o.id}/services/survey`,{score:5,comment:'套餐余次、收退款和积分变化均可查询。（演示）'});
    scenario('member-refund','会员消费与退款','开卡/充值 → 会员价套餐 → 卡支付/核销 → 商品原卡退款 → 库存与积分回冲',member.o.id,{card_id:card.id,service_order_id:service.id,invoice_id:retail.invoice_id,retail_id:retail.id});

    const image=q1('SELECT i.*,s.owner_id FROM imaging_instances i JOIN (SELECT s.*,v.owner_id FROM imaging_studies s JOIN visits v ON v.id=s.visit_id) s ON s.id=i.study_id ORDER BY i.id LIMIT 1');
    if(image){call('POST',`/imaging/instances/${image.id}/annotations`,{kind:'note',points:[{x:Math.round(image.width*.15),y:Math.round(image.height*.15)}],label:'阅片标注示例：结合原报告与临床评估，不代表新增诊断。',operator:'张明远'});call('POST',`/imaging/instances/${image.id}/annotations`,{kind:'distance',points:[{x:Math.round(image.width*.25),y:Math.round(image.height*.5)},{x:Math.round(image.width*.45),y:Math.round(image.height*.5)}],label:'像素测量演示，未标定毫米',operator:'张明远'});scenario('imaging','影像归档与阅片标注','保留原患者及原始影像 → 对应收费来源 → 保存文字与像素测量 → 双端查看报告',image.owner_id,{imaging_id:image.study_id});}
    const purchase=call('POST','/inv/purchase-orders',{supplier_id:1,operator:'演示采购员',remark:'完整采购收货及后续分院销售链。',items:[{product_id:23,qty:12,price:8.5,batch_no:'CYCLE-FOOD-'+date().replaceAll('-',''),expire_date:later(365)}]});
    const purchaseItem=q1('SELECT id FROM purchase_order_items WHERE po_id=?',[purchase.id]);
    call('POST',`/inv/purchase-orders/${purchase.id}/receive`,{items:{[purchaseItem.id]:5},operator:'演示库管'});
    call('POST',`/inv/purchase-orders/${purchase.id}/receive`,{items:{[purchaseItem.id]:7},operator:'演示库管'});
    scenario('purchase','采购分批收货','供应商 → 采购明细 → 两次收货 → 批次入库/库存流水 → 商品可供调拨和零售',null,{purchase_id:purchase.id});

    // Reuse the existing, fully checked insurance and staff-expense state machines.
    const claim=q1("SELECT * FROM medical_claims WHERE status='已赔付' ORDER BY id LIMIT 1");
    if(claim){insert('data_cycle_accounts',{owner_id:claim.owner_id,priority:7,label:'医疗报销 · 保单/材料/赔付记录'});scenario('insurance','医疗费用报销','医疗账单结清 → 保单匹配 → 材料快照 → 院内/保险审核 → 核准赔付',claim.owner_id,{claim_id:claim.id,invoice_id:claim.invoice_id,policy_id:claim.policy_id});}
    const oldService=q1("SELECT * FROM owners WHERE phone='13900008861'");if(oldService)insert('data_cycle_accounts',{owner_id:oldService.id,priority:8,label:'健康服务 · 套餐待付款/权益余次'});
    [skin,surgery,wellness,inpatient,specialtyFamily,member].forEach((f,i)=>run('UPDATE data_cycle_accounts SET label=? WHERE owner_id=?',[[ '完整门诊 · 报告/发药/优惠/问诊','已出院 · 护理/签署/预交金结清','免疫管理 · 套餐核销/库存/提醒','继续操作 · 在院护理/小程序待签','专科病历 · 口腔/眼科双病例','会员权益 · 充值/消费/退款'][i],f.o.id]));
    [skin,surgery,wellness,inpatient,member].forEach((f,i)=>call('POST','/services/messages/send',{owner_id:f.o.id,pet_id:f.p.id,template_id:i===2?'vaccine':i===4?'member':'follow',request_key:'cycle-notice-'+i}));
    call('POST',`/portal/${skin.o.id}/inbox/read`,{all:true});
    // Future appointments use actual availability, so they do not collide with schedules.
    [skin,surgery,wellness].forEach((f,i)=>{const slots=call('GET',`/portal/slots?date=${later(i+1)}&doctor_id=1&pet_id=${f.p.id}`);const slot=slots.items.flatMap(d=>d.slots).find(s=>s.available);if(slot)D.appointment({owner_id:f.o.id,pet_id:f.p.id,doctor_id:1,scheduled_at:slot.datetime,appt_type:'复诊',source:'小程序',note:'完整流程的下一次复查预约（演示）'});});

    const oa=call('POST','/oa/approvals',{type:'报销',title:'护理区设备维护费用（闭环演示）',applicant_id:6,amount:3600,reason:'虚构护理设备维护费用，展示科室、财务、院长审批与出纳登记的完整联动。'});
    if(oa){let ex=call('POST','/expenses/import-oa',{approval_id:oa.id});const applicant=get('staff',oa.applicant_id);
      ex=call('PUT',`/expenses/requests/${ex.id}`,{applicant_id:applicant.id,title:oa.title,purpose:oa.reason,payee_name:applicant.name,payee_account:'DEMO-CYCLE-0001',items:ex.items.map(i=>({...i,date:i.expense_date,invoice_no:'CYCLE-OA-'+oa.id}))});
      const content='虚构报销票据说明\nOA来源：'+oa.approval_no+'\n金额：'+ex.total_amount+'元\n仅用于演示审批与付款联动。';const bin=unescape(encodeURIComponent(content));
      insert('expense_attachments',{request_id:ex.id,name:'OA关联费用凭证（虚构）.txt',mime:'text/plain',data_url:'data:text/plain;base64,'+btoa(bin),size:bin.length,is_demo:1,created_at:now()});
      ex=call('POST',`/expenses/requests/${ex.id}/action`,{action:'submit'});
      while(['科室审核','财务复核','院长审批'].includes(ex.status))ex=call('POST',`/expenses/requests/${ex.id}/action`,{action:'approve',comment:'演示核对：院务用途、明细、附件、收款账户一致。'});
      call('POST',`/expenses/requests/${ex.id}/action`,{action:'pay',payment_no:'CYCLE-OA-PAID',paid_at:date(),pay_method:'银行转账'});
      scenario('oa-expense','OA转费用报销与付款','OA申请 → 费用中心补票 → 分级审批 → 出纳付款 → 运营支出账',null,{oa_id:oa.id,expense_id:ex.id});
    }
    const branch=call('POST','/operations/warehouses',{name:uniqueName('ops_warehouses','城东演示分院'),kind:'分院'});
    const transfer=call('POST','/operations/transfers',{from_id:1,to_id:branch.id,staff_id:6,items:[{product_id:23,qty:6}],note:'分院食品补货（完整库存与零售示例）'});
    call('POST',`/operations/transfers/${transfer.id}/action`,{action:'send'});call('POST',`/operations/transfers/${transfer.id}/action`,{action:'receive'});
    call('PUT',`/operations/stores/${branch.id}/catalog/23`,{sale_price:24,enabled:true});
    const branchSale=call('POST','/operations/retail',{staff_id:6,customer_type:'已有客户',owner_id:member.o.id,warehouse_id:branch.id,items:[{product_id:23,qty:2}],note:'城东演示分院食品销售，售价与批次成本独立。'});D.payInvoice(branchSale.invoice_id,{pay_method:'现金'});
    scenario('branch-retail','分院补货与零售','主院出库 → 在途 → 分院收货/上架 → 分院零售 → 收款/成本/门店报表',member.o.id,{transfer_id:transfer.id,retail_id:branchSale.id,invoice_id:branchSale.invoice_id});
    [1,branch.id].forEach((storeId,i)=>{const preview=call('GET',`/bill/day-close/preview?date=${date()}&store_id=${storeId}`),opening=Math.max(500,money(-preview.cash_drawer));const close=call('POST','/bill/day-close/records',{date:date(),store_id:storeId,opening_cash:opening,counted_cash:money(opening+preview.cash_drawer),cashier:'赵婷婷',receiver:'演示店长',request_key:'cycle-close-'+storeId,note:'演示交班快照；后续操作会形成新的实时日结预览。'});scenario('day-close-'+(i+1),storeId===1?'主院日结交班':'分院日结交班','实收/退款、充值、预交金分别列示；现金实点与系统应存一致，快照留存。',null,{day_close_id:close.id,store_id:storeId});});
  }
  D.dataCycleInit=function(){
    if(exists('data_cycle_versions')&&q1('SELECT version FROM data_cycle_versions WHERE version=?',[VERSION]))return false;
    const schema=`CREATE TABLE IF NOT EXISTS data_cycle_versions(version TEXT PRIMARY KEY,created_at TEXT);
      CREATE TABLE IF NOT EXISTS data_cycle_repairs(id INTEGER PRIMARY KEY,version TEXT,table_name TEXT,record_id INTEGER,reason TEXT,before_json TEXT,after_json TEXT,created_at TEXT);
      CREATE TABLE IF NOT EXISTS data_cycle_scenarios(id INTEGER PRIMARY KEY,scenario_key TEXT UNIQUE,title TEXT,description TEXT,owner_id INTEGER REFERENCES owners(id),links_json TEXT,created_at TEXT);
      CREATE TABLE IF NOT EXISTS data_cycle_accounts(owner_id INTEGER PRIMARY KEY REFERENCES owners(id),priority INTEGER,label TEXT);
      CREATE TABLE IF NOT EXISTS data_cycle_inventory_links(id INTEGER PRIMARY KEY,record_type TEXT,record_id INTEGER,product_id INTEGER REFERENCES products(id),reference TEXT,qty REAL);`;
    schema.split(';').map(s=>s.trim()).filter(Boolean).forEach(s=>run(s));
    repairReference();D.dataCycleSync();
    // Installation is a synchronous system migration, independent of the selected
    // UI role. Restore the normal identity before dispatching any user's request.
    const identity=D.systemIdentity;
    try{D.systemIdentity=()=>({role_id:1});examples();}finally{D.systemIdentity=identity;}
    D.dataCycleSync();
    insert('data_cycle_versions',{version:VERSION,created_at:now()});return true;
  };
  D.dataCycleAccounts=()=>q('SELECT o.id,o.name,o.phone,o.member_level,o.life_stage,a.label AS scenario_label,(SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count FROM data_cycle_accounts a JOIN owners o ON o.id=a.owner_id ORDER BY a.priority');
  D.add('GET','/system/data-cycle',()=>({version:VERSION,installed_at:val('SELECT created_at FROM data_cycle_versions WHERE version=?',[VERSION]),scenarios:q('SELECT s.*,o.name AS owner_name,o.phone FROM data_cycle_scenarios s LEFT JOIN owners o ON o.id=s.owner_id ORDER BY s.id').map(s=>({...s,links:JSON.parse(s.links_json)})),accounts:D.dataCycleAccounts(),repairs:q('SELECT table_name,reason,COUNT(*) AS count FROM data_cycle_repairs GROUP BY table_name,reason'),audit:D.dataCycleAudit?D.dataCycleAudit():null}));
})(window.Demo);
