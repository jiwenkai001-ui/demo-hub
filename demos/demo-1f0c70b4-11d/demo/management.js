(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,now,later,next,filters,paged,items,recalc,stock}=D;
  function nonnegative(value,label){if(value!==undefined&&value!==null&&value!==''&&(!Number.isFinite(Number(value))||Number(value)<0))fail(label+'不能为负数或无效数字');}
  function validDay(value,label){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||D.date(new Date(value+'T12:00:00'))!==value)fail(label+'无效');return value;}
  function precise(value,label){if(!Number.isFinite(Number(value))||Math.abs(Number(value)*100-Math.round(Number(value)*100))>.00001)fail(label+'须为最多两位小数的有效数字');return money(value);}
  function purchaseBatch(it){if(it.expire_date){validDay(it.expire_date,'采购商品有效期');if(it.expire_date<D.date())fail('采购商品有效期不能早于今天');if(!String(it.batch_no||'').trim())fail('填写有效期时请同时填写批号，以便追踪效期');}if(it.batch_no&&q1("SELECT id FROM batches WHERE product_id=? AND batch_no=? AND COALESCE(expire_date,'')<>?",[int(it.product_id),String(it.batch_no).trim(),it.expire_date||'']))fail('同一商品批号的有效期与库存记录不一致，请核对批号和有效期');}
  function syncOwnerFinance(id){
    run("UPDATE owners SET total_spend=(SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE owner_id=owners.id),visit_count=(SELECT COUNT(*) FROM visits WHERE owner_id=owners.id AND status<>'已取消'),last_visit_at=(SELECT MAX(visited_at) FROM visits WHERE owner_id=owners.id AND status<>'已取消') WHERE id=?",[id]);
  }
  function activeAdmission(visitId){return !!visitId&&!!q1("SELECT name FROM sqlite_master WHERE type='table' AND name='care_admissions'")&&!!q1("SELECT id FROM care_admissions WHERE visit_id=? AND status='在院'",[visitId]);}
  function syncVisitFinance(inv){if(inv.status!=='已结清'||!inv.visit_id||activeAdmission(inv.visit_id))return;const visit=get('visits',inv.visit_id);if(visit.status==='待缴费')D.setVisitStatus(visit.id,'已完成');}
  D.syncOwnerFinance=syncOwnerFinance;
  D.financeInit=function(){
    run('CREATE TABLE IF NOT EXISTS demo_finance_versions (version TEXT PRIMARY KEY)');
    run('CREATE TABLE IF NOT EXISTS demo_cash_events (id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER NOT NULL REFERENCES invoices(id),amount REAL NOT NULL,method TEXT NOT NULL,created_at TEXT NOT NULL,source_key TEXT UNIQUE,card_id INTEGER REFERENCES membership_cards(id))');
    run('CREATE TABLE IF NOT EXISTS demo_invoice_coupons (invoice_id INTEGER PRIMARY KEY REFERENCES invoices(id),coupon_id INTEGER UNIQUE NOT NULL REFERENCES coupons(id),discount REAL NOT NULL,consumed INTEGER DEFAULT 0)');
    run('CREATE TABLE IF NOT EXISTS demo_batch_allocations (id INTEGER PRIMARY KEY AUTOINCREMENT,batch_id INTEGER NOT NULL REFERENCES batches(id),product_id INTEGER NOT NULL REFERENCES products(id),reference TEXT NOT NULL,qty REAL NOT NULL,restored INTEGER DEFAULT 0)');
    run('CREATE TABLE IF NOT EXISTS demo_campaign_receipts (invoice_id INTEGER PRIMARY KEY REFERENCES invoices(id),campaign_id INTEGER NOT NULL REFERENCES campaigns(id),amount REAL NOT NULL)');
    let upgraded=false;if(!q('PRAGMA table_info(demo_cash_events)').some(c=>c.name==='card_id')){run('ALTER TABLE demo_cash_events ADD COLUMN card_id INTEGER REFERENCES membership_cards(id)');upgraded=true;}
    const cardMigration=()=>{if(q1("SELECT version FROM demo_finance_versions WHERE version='card-v2'"))return false;run("UPDATE demo_cash_events SET card_id=(SELECT MIN(mc.id) FROM membership_cards mc JOIN invoices i ON i.owner_id=mc.owner_id WHERE i.id=demo_cash_events.invoice_id) WHERE method='会员卡' AND card_id IS NULL");insert('demo_finance_versions',{version:'card-v2'});return true;};
    if(q1("SELECT version FROM demo_finance_versions WHERE version='ledger-v1'"))return cardMigration()||upgraded;
    q('SELECT * FROM invoices WHERE paid_amount>0').forEach(inv=>{
      const logs=q('SELECT * FROM demo_payment_logs WHERE invoice_id=? ORDER BY id',[inv.id]),total=money(logs.reduce((s,l)=>s+l.amount,0));
      if(logs.length&&total===money(inv.paid_amount))logs.forEach(l=>insert('demo_cash_events',{invoice_id:inv.id,amount:l.amount,method:l.method,created_at:l.created_at,source_key:'legacy-log-'+l.id}));
      else insert('demo_cash_events',{invoice_id:inv.id,amount:inv.paid_amount,method:inv.pay_method||'历史收款',created_at:inv.paid_at||inv.created_at,source_key:'legacy-invoice-'+inv.id});
    });
    q('SELECT id FROM owners').forEach(o=>syncOwnerFinance(o.id));
    insert('demo_finance_versions',{version:'ledger-v1'});cardMigration();return true;
  };
  D.changeBatches=function(pid,delta,reference,type,batchId){
    let remaining=precise(-Number(delta),'库存变动数量');if(remaining<=0)return;
    const adjust=['盘点调整','报损'].includes(type),all=q("SELECT * FROM batches WHERE product_id=? AND qty>0 ORDER BY CASE WHEN expire_date IS NULL OR expire_date='' THEN 1 ELSE 0 END,expire_date,id",[pid]),usable=all.filter(b=>!b.expire_date||b.expire_date>=D.date());
    if(batchId){const selected=all.find(b=>b.id===Number(batchId));if(!selected||selected.product_id!==pid||selected.expire_date&&selected.expire_date<D.date()||selected.qty<remaining)fail('所选批次不存在、已过期或可用数量不足');run('UPDATE batches SET qty=qty-? WHERE id=?',[remaining,selected.id]);insert('demo_batch_allocations',{batch_id:selected.id,product_id:pid,reference:String(reference),qty:remaining,restored:0});return;}
    const prod=get('products',pid,'商品'),unbatched=Math.max(0,money(prod.stock_qty-all.reduce((sum,b)=>sum+b.qty,0))),available=money(Math.min(prod.stock_qty,unbatched+usable.reduce((sum,b)=>sum+b.qty,0)));
    if(!adjust&&remaining>available)fail('可用库存不足：'+prod.name+'，过期批次不能发药、零售或调拨；请先报损处理');
    (adjust?all:usable).forEach(b=>{
      if(remaining<=0)return;const take=Math.min(remaining,b.qty);run('UPDATE batches SET qty=qty-? WHERE id=?',[take,b.id]);insert('demo_batch_allocations',{batch_id:b.id,product_id:pid,reference:String(reference),qty:take,restored:0});remaining=money(remaining-take);
    });
  };
  D.restoreBatches=function(pid,reference){q('SELECT * FROM demo_batch_allocations WHERE product_id=? AND reference=? AND restored=0',[pid,String(reference)]).forEach(a=>{run('UPDATE batches SET qty=qty+? WHERE id=?',[a.qty,a.batch_id]);run('UPDATE demo_batch_allocations SET restored=1 WHERE id=?',[a.id]);});};
  function campaignReceipt(id,amount){const c=q1('SELECT c.* FROM coupons c JOIN demo_invoice_coupons x ON x.coupon_id=c.id WHERE x.invoice_id=?',[id]);if(!c||!c.campaign_id)return;const old=q1('SELECT * FROM demo_campaign_receipts WHERE invoice_id=?',[id]);if(!old){insert('demo_campaign_receipts',{invoice_id:id,campaign_id:c.campaign_id,amount});run('UPDATE campaigns SET convert_count=convert_count+1,revenue=revenue+? WHERE id=?',[amount,c.campaign_id]);}else{run('UPDATE demo_campaign_receipts SET amount=amount+? WHERE invoice_id=?',[amount,id]);run('UPDATE campaigns SET revenue=revenue+? WHERE id=?',[amount,c.campaign_id]);}}
  function reverseCampaign(id){const r=q1('SELECT * FROM demo_campaign_receipts WHERE invoice_id=?',[id]);if(r){run('UPDATE campaigns SET convert_count=MAX(0,convert_count-1),revenue=MAX(0,revenue-?) WHERE id=?',[r.amount,r.campaign_id]);run('DELETE FROM demo_campaign_receipts WHERE invoice_id=?',[id]);}}
  function applyInvoiceCoupon(id,cid){
    if(D.retailPaymentGuard)D.retailPaymentGuard(id);
    const inv=get('invoices',id,'账单'),c=get('coupons',int(cid),'优惠券'),linked=q1('SELECT * FROM demo_invoice_coupons WHERE invoice_id=?',[id]);
    if(linked){if(linked.coupon_id===int(cid))return inv;fail('该账单已关联优惠券，不可重复叠加');}
    D.editableInvoice(inv);
    if(inv.discount>0)fail('已有优惠金额不可叠加优惠券');
    if(c.owner_id!==inv.owner_id)fail('优惠券不属于该客户');if(c.status!=='未使用'||(c.expire_at&&c.expire_at.slice(0,10)<D.date()))fail('优惠券已使用或已过期');
    if(q1('SELECT invoice_id FROM demo_invoice_coupons WHERE coupon_id=?',[c.id]))fail('优惠券已被另一账单占用');
    if(inv.total_amount<c.min_spend)fail('账单未达到优惠券使用门槛');
    const discount=c.coupon_type==='折扣'?money(inv.total_amount*(1-c.value)):Math.min(money(c.value),inv.total_amount);
    if(discount<=0||discount>inv.total_amount)fail('优惠券面值无效');
    insert('demo_invoice_coupons',{invoice_id:id,coupon_id:c.id,discount,consumed:0});update('invoices',id,{discount});const result=recalc(id);
    if(result.payable===0){update('coupons',c.id,{status:'已使用',used_at:now()});run('UPDATE demo_invoice_coupons SET consumed=1 WHERE invoice_id=?',[id]);campaignReceipt(id,0);if(D.servicesOnPaid)D.servicesOnPaid(id,0,{method:'优惠券',status:'已结清'});syncVisitFinance(result);}
    return result;
  }
  D.applyInvoiceCoupon=applyInvoiceCoupon;
  add('POST','/bill/invoices/{id}/coupon',(p,d)=>applyInvoiceCoupon(p.id,d.coupon_id));
  function releaseInvoiceCoupon(id){const inv=get('invoices',id,'账单'),linked=q1('SELECT * FROM demo_invoice_coupons WHERE invoice_id=?',[id]);if(inv.paid_amount>0||inv.status==='已退费')fail('已收款或已退费账单不可解除优惠券');if(linked){if(D.servicesRefundGuard)D.servicesRefundGuard(id);const c=get('coupons',linked.coupon_id);reverseCampaign(id);update('coupons',c.id,{status:c.expire_at&&c.expire_at.slice(0,10)<D.date()?'已过期':'未使用',used_at:null});run('DELETE FROM demo_invoice_coupons WHERE invoice_id=?',[id]);update('invoices',id,{discount:0});if(D.servicesOnPaymentReset)D.servicesOnPaymentReset(id);}return recalc(id);}
  D.releaseInvoiceCoupon=releaseInvoiceCoupon;add('DELETE','/bill/invoices/{id}/coupon',p=>{if(D.retailPaymentGuard)D.retailPaymentGuard(p.id);return releaseInvoiceCoupon(p.id);});
  function payInvoice(id,d){
    if(D.retailPaymentGuard)D.retailPaymentGuard(id);
    if(int(d.coupon_id)){const applied=applyInvoiceCoupon(id,int(d.coupon_id));if(applied.payable===0)return applied;}
    const inv=get('invoices',id,'账单'),method=d.pay_method||d.method||'微信',remaining=money(inv.payable-inv.paid_amount);
    if(inv.status==='已退费')fail('已退费账单不可再次收款');
    if(remaining<=0||inv.status==='已结清')fail('该账单已结清，请勿重复收款');
    if(method==='挂账')fail('挂账不属于实际收款，请保留待缴费账单');
    if(!['微信','支付宝','现金','银行卡','会员卡','挂账'].concat(D.businessReady&&D.businessReady()?['住院预交金']:[]).includes(method))fail('支付方式无效');
    const amount=d.amount===undefined||d.amount===null||d.amount===''?remaining:money(d.amount);
    if(!Number.isFinite(Number(d.amount??remaining))||amount<=0)fail('收款金额必须大于 0');
    if(amount>remaining)fail('收款金额不能超过剩余应付金额 '+remaining+' 元');
    if(method==='住院预交金')D.businessDepositDebit(inv,d,amount);
    let cardId=null;if(method==='会员卡'){
      const card=int(d.card_id)?q1('SELECT * FROM membership_cards WHERE id=? AND owner_id=?',[int(d.card_id),inv.owner_id]):q1("SELECT * FROM membership_cards WHERE owner_id=? ORDER BY CASE WHEN status='正常' AND (valid_until IS NULL OR valid_until='' OR valid_until>=?) AND balance>=? THEN 0 ELSE 1 END,id LIMIT 1",[inv.owner_id,D.date(),amount]);if(!card)fail('所选会员卡不存在或不属于该客户');
      if(card.status!=='正常'||(card.valid_until&&card.valid_until<D.date()))fail('会员卡已挂失或过期，无法支付');
      if(money(card.balance)<amount)fail('会员卡余额不足（余额 '+card.balance+' 元）');
      run('UPDATE membership_cards SET balance=balance-? WHERE id=?',[amount,card.id]);
      cardId=card.id;
    }
    if(!q1('SELECT id FROM demo_payment_logs WHERE invoice_id=?',[id])&&n(inv.paid_amount)>0)insert('demo_payment_logs',{invoice_id:id,amount:inv.paid_amount,method:inv.pay_method||'历史收款',created_at:inv.paid_at||now()});
    insert('demo_payment_logs',{invoice_id:id,amount,method,created_at:now()});
    insert('demo_cash_events',{invoice_id:id,amount,method,card_id:cardId,created_at:now(),source_key:null});
    const paid=money(inv.paid_amount+amount),status=paid>=money(inv.payable)?'已结清':'部分缴费';
    update('invoices',id,{paid_amount:paid,status,pay_method:method,cashier:d.cashier??'admin',paid_at:now()});
    const linked=q1('SELECT * FROM demo_invoice_coupons WHERE invoice_id=?',[id]);
    if(linked&&!linked.consumed){update('coupons',linked.coupon_id,{status:'已使用',used_at:now()});run('UPDATE demo_invoice_coupons SET consumed=1 WHERE invoice_id=?',[id]);}
    if(linked)campaignReceipt(id,amount);
    syncOwnerFinance(inv.owner_id);
    if(D.servicesOnPaid)D.servicesOnPaid(id,amount,{method,status});
    syncVisitFinance(get('invoices',id));
    return get('invoices',id);
  }
  D.payInvoice=payInvoice;
  function invoiceDetail(id){const inv=get('invoices',id,'账单');inv.items=q('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[id]);inv.payments=q('SELECT * FROM demo_cash_events WHERE invoice_id=? ORDER BY id',[id]);inv.coupon=q1('SELECT c.* FROM coupons c JOIN demo_invoice_coupons x ON x.coupon_id=c.id WHERE x.invoice_id=?',[id]);inv.owner=q1('SELECT * FROM owners WHERE id=?',[inv.owner_id]);inv.cards=q('SELECT id,card_no,level,balance,status,valid_until FROM membership_cards WHERE owner_id=? ORDER BY id',[inv.owner_id]);inv.pet=inv.pet_id?q1('SELECT * FROM pets WHERE id=?',[inv.pet_id]):null;inv.visit=inv.visit_id?q1('SELECT * FROM visits WHERE id=?',[inv.visit_id]):null;if(D.claimInvoiceSummary)inv.claim=D.claimInvoiceSummary(id);if(D.servicesInvoiceGuard){const order=q1('SELECT id FROM service_orders WHERE invoice_id=?',[id]);if(order){inv.adjustment_locked=true;inv.source_hint='套餐项目与会员优惠已固定，需调整时请在服务权益中心取消后重新选购。';if(n(val('SELECT COALESCE(SUM(qty),0) FROM service_uses WHERE order_id=?',[order.id]))>0)inv.refund_locked_reason='套餐已有核销，请先在服务权益中心撤销核销后再退费或解除优惠券';}}if(D.businessReady&&D.businessReady()&&inv.visit_id){const admission=q1('SELECT id FROM care_admissions WHERE visit_id=? ORDER BY id DESC LIMIT 1',[inv.visit_id]);if(admission){inv.deposit_admission_id=admission.id;inv.deposit_balance=money(val('SELECT COALESCE(SUM(amount),0) FROM biz_deposit_events WHERE admission_id=?',[admission.id]));}}if(activeAdmission(inv.visit_id))inv.refund_locked_reason='该账单关联在院住院或寄养，请先完成护理、账单核对及出院，再办理整单退费；剩余预交金可通过住院预交金入口单独退回';return inv;}
  D.invoiceDetail=invoiceDetail;
  add('GET','/bill/invoices',p=>paged(`SELECT i.*,o.name AS owner_name,o.phone,p.name AS pet_name,v.visit_no FROM invoices i
    LEFT JOIN owners o ON o.id=i.owner_id LEFT JOIN pets p ON p.id=i.pet_id LEFT JOIN visits v ON v.id=i.visit_id`,
    filters({'i.status':p.status==='unpaid'?null:p.status},p.keyword,['o.name','o.phone','i.invoice_no'],[].concat(p.status==='unpaid'?[["i.status IN ('待缴费','部分缴费')"]]:[],p.start?[['date(i.created_at)>=?',p.start]]:[],p.end?[['date(i.created_at)<=?',p.end]]:[])),'i.id DESC',p));
  add('GET','/bill/invoices/{id}',p=>invoiceDetail(p.id));
  add('POST','/bill/invoices/{id}/items',(p,d)=>{
    if(D.retailInvoiceGuard)D.retailInvoiceGuard(p.id);if(D.servicesInvoiceGuard)D.servicesInvoiceGuard(p.id);
    D.editableInvoice(get('invoices',p.id,'账单'));const name=(d.name||'').trim();if(!name)fail('项目名称必填');const qty=n(d.qty,1),price=n(d.unit_price);
    if(qty<=0||!Number.isFinite(Number(d.qty??1)))fail('数量必须大于 0');nonnegative(d.unit_price,'单价');
    insert('invoice_items',{invoice_id:p.id,item_type:d.item_type??'其他',name,ref_id:int(d.ref_id),qty,unit_price:price,amount:money(qty*price)});return recalc(p.id);
  });
  add('DELETE','/bill/items/{id}',p=>{const item=get('invoice_items',p.id,'账单明细');if(D.careInvoiceItemGuard)D.careInvoiceItemGuard(item);if(D.retailInvoiceGuard)D.retailInvoiceGuard(item.invoice_id);if(D.servicesInvoiceGuard)D.servicesInvoiceGuard(item.invoice_id);D.editableInvoice(get('invoices',item.invoice_id));if(int(item.ref_id)&&['药品','检验','影像'].includes(item.item_type))fail('该费用关联'+item.item_type+'源单，请在原诊疗模块撤销，避免费用与医疗记录、库存不一致');run('DELETE FROM invoice_items WHERE id=?',[p.id]);return recalc(item.invoice_id);});
  add('POST','/bill/invoices/{id}/discount',(p,d)=>{const inv=get('invoices',p.id,'账单');if(D.servicesInvoiceGuard)D.servicesInvoiceGuard(p.id);if(D.retailPaymentGuard)D.retailPaymentGuard(p.id);D.editableInvoice(inv);if(q1('SELECT invoice_id FROM demo_invoice_coupons WHERE invoice_id=?',[p.id]))fail('已关联优惠券，不可再调整优惠');nonnegative(d.discount,'优惠金额');if(money(d.discount)>inv.total_amount)fail('优惠金额不能超过账单总额');update('invoices',p.id,{discount:money(d.discount)});return recalc(p.id);});
  add('POST','/bill/invoices/{id}/pay',(p,d)=>payInvoice(p.id,d));
  add('POST','/bill/invoices/{id}/refund',p=>{
    const inv=get('invoices',p.id,'账单'),paid=money(inv.paid_amount);if(paid<=0)fail('该账单未产生收款，无法退费');
    if(activeAdmission(inv.visit_id))fail('该账单关联在院住院或寄养，请先完成护理、账单核对及出院，再办理整单退费；剩余预交金可通过住院预交金入口单独退回');
    if(D.claimRefundGuard)D.claimRefundGuard(p.id);
    if(D.servicesRefundGuard)D.servicesRefundGuard(p.id);
    const totals=q('SELECT method,card_id,ROUND(SUM(amount),2) AS amount FROM demo_cash_events WHERE invoice_id=? GROUP BY method,card_id',[p.id]);
    totals.filter(r=>r.method==='会员卡'&&r.amount>0).forEach(r=>{if(!r.card_id)fail('原会员卡付款缺少卡号关联，请核对原支付记录');const card=get('membership_cards',r.card_id,'原支付会员卡');if(card.owner_id!==inv.owner_id)fail('原会员卡归属不一致');run('UPDATE membership_cards SET balance=balance+? WHERE id=?',[r.amount,r.card_id]);});
    totals.forEach(r=>{if(r.amount>0)insert('demo_cash_events',{invoice_id:p.id,amount:-r.amount,method:r.method,card_id:r.card_id,created_at:now(),source_key:null});});
    run('DELETE FROM demo_payment_logs WHERE invoice_id=?',[p.id]);
    const linked=q1('SELECT * FROM demo_invoice_coupons WHERE invoice_id=?',[p.id]);if(linked){const c=get('coupons',linked.coupon_id);reverseCampaign(p.id);update('coupons',c.id,{status:c.expire_at&&c.expire_at.slice(0,10)<D.date()?'已过期':'未使用',used_at:null});run('DELETE FROM demo_invoice_coupons WHERE invoice_id=?',[p.id]);}
    const refunded=update('invoices',p.id,{paid_amount:0,status:'已退费',pay_method:inv.pay_method+'退费'});syncOwnerFinance(inv.owner_id);if(D.businessReady&&D.businessReady())D.businessDepositRefund(inv);if(D.servicesOnRefund)D.servicesOnRefund(p.id,paid);if(D.retailOnRefund)D.retailOnRefund(p.id);return refunded;
  });
  add('GET','/crm/customers',p=>paged(`SELECT o.*,(SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count,
    (SELECT COUNT(*) FROM visits v WHERE v.owner_id=o.id) AS real_visit_count,
    (SELECT mc.level FROM membership_cards mc WHERE mc.owner_id=o.id ORDER BY CASE mc.level WHEN '钻石' THEN 3 WHEN '金卡' THEN 2 ELSE 1 END DESC,mc.id LIMIT 1) AS card_level,
    (SELECT COUNT(*) FROM membership_cards mc WHERE mc.owner_id=o.id) AS card_count,
    (SELECT COALESCE(SUM(mc.balance),0) FROM membership_cards mc WHERE mc.owner_id=o.id AND mc.status='正常' AND (mc.valid_until IS NULL OR mc.valid_until='' OR mc.valid_until>=date('now','localtime'))) AS card_balance,
    (SELECT COUNT(*) FROM coupons c WHERE c.owner_id=o.id AND c.status='未使用' AND (c.expire_at IS NULL OR c.expire_at='' OR date(c.expire_at)>=date('now'))) AS coupon_count,
    (SELECT COUNT(*) FROM followups f WHERE f.owner_id=o.id AND f.status='待执行') AS pending_followup FROM owners o`,
    filters({life_stage:p.stage,member_level:p.level,source_channel:p.source},p.keyword,['name','phone']),'o.total_spend DESC',p));
  add('GET','/crm/customers/{id}',p=>{
    const o=get('owners',p.id,'客户');o.pets=q('SELECT * FROM pets WHERE owner_id=? ORDER BY id DESC',[p.id]);o.cards=q('SELECT * FROM membership_cards WHERE owner_id=?',[p.id]);o.coupons=q('SELECT * FROM coupons WHERE owner_id=? ORDER BY id DESC',[p.id]);
    o.followups=q('SELECT f.*,p.name AS pet_name FROM followups f LEFT JOIN pets p ON p.id=f.pet_id WHERE f.owner_id=? ORDER BY f.scheduled_at DESC',[p.id]);
    o.invoices=q('SELECT * FROM invoices WHERE owner_id=? ORDER BY id DESC LIMIT 30',[p.id]);
    o.visits=q('SELECT v.*,p.name AS pet_name,s.name AS doctor_name FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN staff s ON s.id=v.doctor_id WHERE v.owner_id=? ORDER BY v.visited_at DESC LIMIT 30',[p.id]);
    o.consultations=q('SELECT c.*,(SELECT COUNT(*) FROM consultation_messages m WHERE m.consult_id=c.id) AS msg_count FROM consultations c WHERE c.owner_id=? ORDER BY c.id DESC',[p.id]);return o;
  });
  add('PUT','/crm/customers/{id}/stage',(p,d)=>update('owners',p.id,{life_stage:d.life_stage??'成长'}));
  add('GET','/crm/cards',p=>{const f=filters({},p.keyword,['mc.card_no','o.name','o.phone']);return items('SELECT mc.*,o.name AS owner_name,o.phone FROM membership_cards mc LEFT JOIN owners o ON o.id=mc.owner_id'+f.sql+' ORDER BY mc.id DESC',f.args);});
  add('POST','/crm/cards',(p,d)=>{
    const oid=int(d.owner_id);if(!oid)fail('客户必填');get('owners',oid,'客户');
    nonnegative(d.balance,'初始余额');const balance=precise(d.balance??0,'初始余额');if(d.valid_until){validDay(d.valid_until,'会员卡有效期');if(d.valid_until<D.date())fail('会员卡有效期不能早于今天');}const discount=n(d.discount,({'银卡':.95,'金卡':.9,'钻石':.85})[d.level]||.95);if(discount<=0||discount>1)fail('会员折扣应在 0 到 1 之间');
    const level=d.level??'银卡';if(!['银卡','金卡','钻石'].includes(level))fail('会员卡等级无效');let cardNo=String(d.card_no||'').trim();if(cardNo&&q1('SELECT id FROM membership_cards WHERE card_no=?',[cardNo]))fail('会员卡号已存在，请使用其他卡号');if(!cardNo){let seq=int(val('SELECT COALESCE(MAX(id),0) FROM membership_cards'))+1;do{cardNo='MC'+D.date().replace(/-/g,'')+String(seq++).padStart(5,'0');}while(q1('SELECT id FROM membership_cards WHERE card_no=?',[cardNo]));}
    const id=insert('membership_cards',{card_no:cardNo,owner_id:oid,level,balance,points:0,discount,total_recharge:balance,valid_until:d.valid_until||later(365),status:'正常',opened_at:now()});
    const highest=q1("SELECT level FROM membership_cards WHERE owner_id=? ORDER BY CASE level WHEN '钻石' THEN 3 WHEN '金卡' THEN 2 ELSE 1 END DESC,id LIMIT 1",[oid]);update('owners',oid,{member_level:highest.level});const opened=get('membership_cards',id);if(D.businessOnCardOpened)D.businessOnCardOpened(opened,d);return opened;
  });
  add('POST','/crm/cards/{id}/recharge',(p,d)=>{if(D.businessReady&&D.businessReady())return D.rechargeMemberCard(p.id,d);const card=get('membership_cards',p.id,'会员卡');if(card.status!=='正常'||(card.valid_until&&card.valid_until<D.date()))fail('会员卡已挂失或过期，不可充值');const amount=money(d.amount);if(amount<=0)fail('充值金额必须大于 0');run('UPDATE membership_cards SET balance=balance+?,total_recharge=total_recharge+? WHERE id=?',[amount,amount,p.id]);return get('membership_cards',p.id);});
  add('GET','/crm/campaigns',p=>{const f=filters({status:p.status});return items('SELECT * FROM campaigns'+f.sql+' ORDER BY id DESC',f.args);});
  add('POST','/crm/campaigns',(p,d)=>{const name=(d.name||'').trim();if(!name)fail('活动名称必填');nonnegative(d.budget,'活动预算');if(d.start_at&&d.end_at&&d.end_at<d.start_at)fail('活动结束日期不能早于开始日期');return get('campaigns',insert('campaigns',{name,type:d.type??'优惠券',target_stage:d.target_stage??'全部',channel:d.channel??'微信',budget:money(d.budget),reach_count:0,convert_count:0,revenue:0,status:d.status??'进行中',start_at:d.start_at??null,end_at:d.end_at??null,content:d.content??'',created_at:now()}));});
  add('GET','/crm/coupons',p=>{const f=filters({'c.status':p.status,'c.owner_id':int(p.owner_id)||null});return items(`SELECT c.*,CASE WHEN c.status='未使用' AND c.expire_at<>'' AND date(c.expire_at)<date('now') THEN '已过期' ELSE c.status END AS status,o.name AS owner_name FROM coupons c LEFT JOIN owners o ON o.id=c.owner_id`+f.sql+' ORDER BY c.id DESC LIMIT 200',f.args);});
  function coupon(d){
    const value=n(d.value),kind=d.coupon_type??'满减';if(!['满减','折扣','代金'].includes(kind))fail('券类型无效');if(value<=0||!Number.isFinite(Number(d.value)))fail('优惠券面值必须大于 0');if(kind==='折扣'&&value>=1)fail('折扣券请填写 0 到 1 之间的折扣率');nonnegative(d.min_spend,'优惠券门槛');if(d.expire_at&&d.expire_at.slice(0,10)<D.date())fail('优惠券有效期不能早于今天');
    const oid=int(d.owner_id);if(!oid)fail('客户必填');get('owners',oid,'客户');return get('coupons',insert('coupons',{code:d.code||next('C','coupons','code',true),owner_id:oid,campaign_id:int(d.campaign_id)||null,name:d.name??'优惠券',coupon_type:d.coupon_type??'满减',value:n(d.value),min_spend:n(d.min_spend),expire_at:d.expire_at||later(30),status:'未使用',used_at:null,created_at:now()}));
  }
  add('POST','/crm/coupons',(p,d)=>coupon(d));
  add('POST','/crm/segments',(p,d)=>{
    const extra=[];if(n(d.min_spend)>0)extra.push(['o.total_spend>=?',n(d.min_spend)]);if(int(d.days_no_visit)>0)extra.push(["(o.last_visit_at IS NULL OR o.last_visit_at<=datetime('now',?))",'-'+int(d.days_no_visit)+' day']);
    const f=filters({'o.life_stage':d.life_stage},d.keyword,['o.name','o.phone'],extra),rows=q('SELECT o.*,(SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count,(SELECT MAX(v.visited_at) FROM visits v WHERE v.owner_id=o.id) AS last_visit FROM owners o'+f.sql+' ORDER BY o.total_spend DESC LIMIT 500',f.args);
    return {items:rows,meta:{total:rows.length,page:1,page_size:rows.length,pages:1}};
  });
  function followup(d){
    const oid=int(d.owner_id);if(!oid)fail('客户必填');get('owners',oid,'客户');if(int(d.pet_id))D.validatePatient(oid,d.pet_id);return get('followups',insert('followups',{owner_id:oid,pet_id:int(d.pet_id)||null,type:d.type??'术后回访',scheduled_at:d.scheduled_at||now(),channel:d.channel??'微信',content:d.content??'',status:'待执行',result:'',operator:d.operator??'',finished_at:null,created_at:now()}));
  }
  add('POST','/crm/dispatch',(p,d)=>{
    const ids=[...new Set((d.owner_ids||[]).map(id=>int(id)))];if(!ids.length)fail('请先圈选目标客户');let coupons=0,followups=0;const action=d.action??'coupon',cid=int(d.campaign_id)||null;
    if(!['coupon','followup','both'].includes(action))fail('触达方式无效');ids.forEach(id=>get('owners',id,'客户'));if(cid){const c=get('campaigns',cid,'营销活动');if(c.status!=='进行中'||(c.end_at&&c.end_at.slice(0,10)<D.date()))fail('该活动已结束，无法继续触达');}
    ids.forEach(id=>{if(!q1('SELECT id FROM owners WHERE id=?',[id]))return;
      if(['coupon','both'].includes(action)){coupon({owner_id:id,code:next('C','coupons','code',true),campaign_id:cid,name:d.coupon_name??'营销活动优惠券',coupon_type:d.coupon_type??'满减',value:n(d.coupon_value,30),min_spend:n(d.min_spend),expire_at:d.expire_at||later(30)});coupons++;}
      if(['followup','both'].includes(action)){followup({owner_id:id,type:d.followup_type??'流失召回',channel:d.channel??'微信',content:d.content??'营销活动触达，邀约到店。',operator:d.operator??'admin'});followups++;}
    });if(cid)run('UPDATE campaigns SET reach_count=reach_count+? WHERE id=?',[ids.length,cid]);return {ok:true,reached:ids.length,coupons,followups};
  });
  add('GET','/crm/followups',p=>paged('SELECT f.*,o.name AS owner_name,o.phone,p.name AS pet_name FROM followups f LEFT JOIN owners o ON o.id=f.owner_id LEFT JOIN pets p ON p.id=f.pet_id',filters({'f.status':p.status,'f.type':p.ftype}),'f.scheduled_at ASC',p));
  add('POST','/crm/followups',(p,d)=>followup(d));
  add('PATCH','/crm/followups/{id}',(p,d)=>{const f=get('followups',p.id,'回访任务');if(d.status&&!['待执行','已完成','已取消'].includes(d.status))fail('回访状态无效');if(f.status!=='待执行'&&d.status&&d.status!==f.status)fail('该任务已结束，不能重复处理');const fields=['status','result','operator','content','scheduled_at','channel','type'];if(d.status==='已完成'){if(!(d.result||'').trim())fail('请填写回访结果');d.finished_at=now();fields.push('finished_at');}return update('followups',p.id,d,fields);});

  add('GET','/inv/products',p=>paged(`SELECT p.*,ROUND(p.stock_qty*p.purchase_price,2) AS stock_amount,
    CASE WHEN p.stock_qty<=0 THEN '缺货' WHEN p.stock_qty<=p.safety_stock THEN '预警' ELSE '正常' END AS stock_status,
    (SELECT COUNT(*) FROM batches b WHERE b.product_id=p.id AND b.qty>0 AND b.expire_date>=date('now') AND b.expire_date<=date('now','+90 day')) AS near_expire_batches FROM products p`,
    filters({category:p.category,status:p.status??'在售'},p.keyword,['name','sku','generic_name'],['true','1','yes'].includes(String(p.only_low).toLowerCase())?[['stock_qty<=safety_stock']]:[]),'p.stock_qty ASC',p));
  add('GET','/inv/products/{id}',p=>{const prod=get('products',p.id,'商品');prod.batches=q('SELECT b.*,s.name AS supplier_name FROM batches b LEFT JOIN suppliers s ON s.id=b.supplier_id WHERE b.product_id=? ORDER BY b.expire_date',[p.id]);prod.logs=q('SELECT * FROM inventory_logs WHERE product_id=? ORDER BY id DESC LIMIT 30',[p.id]);return prod;});
  add('POST','/inv/products',(p,d)=>{
    ['purchase_price','sale_price','stock_qty','safety_stock','shelf_life'].forEach(k=>nonnegative(d[k],'商品'+k));
    if(d.sku&&q1('SELECT id FROM products WHERE sku=?',[d.sku.trim()]))fail('商品编码已存在，请使用其他编码');
    const name=(d.name||'').trim();if(!name)fail('商品名称必填');return get('products',insert('products',{sku:d.sku||next('YP','products','sku',true),name,generic_name:d.generic_name??'',category:d.category??'药品',spec:d.spec??'',unit:d.unit??'盒',manufacturer:d.manufacturer??'',approval_no:d.approval_no??'',purchase_price:n(d.purchase_price),sale_price:n(d.sale_price),stock_qty:n(d.stock_qty),safety_stock:n(d.safety_stock,10),shelf_life:int(d.shelf_life,24),storage_cond:d.storage_cond??'常温',is_prescription:int(d.is_prescription,1),status:d.status??'在售',created_at:now()}));
  });
  add('PUT','/inv/products/{id}',(p,d)=>{['purchase_price','sale_price','safety_stock','shelf_life'].forEach(k=>nonnegative(d[k],'商品'+k));return update('products',p.id,d,['name','generic_name','category','spec','unit','manufacturer','approval_no','purchase_price','sale_price','safety_stock','shelf_life','storage_cond','is_prescription','status']);});
  add('GET','/inv/suppliers',()=>items('SELECT s.*,(SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id=s.id) AS po_count FROM suppliers s ORDER BY id'));
  add('POST','/inv/suppliers',(p,d)=>{const name=(d.name||'').trim();if(!name)fail('供应商名称必填');return get('suppliers',insert('suppliers',{name,contact:d.contact??'',phone:d.phone??'',address:d.address??'',license_no:d.license_no??'',category:d.category??'药品',cooperation:d.cooperation??'良好',status:d.status??'合作中',created_at:now()}));});
  add('GET','/inv/purchase-orders',p=>paged(`SELECT po.*,s.name AS supplier_name,s.contact,
    (SELECT COUNT(*) FROM purchase_order_items pi WHERE pi.po_id=po.id) AS item_count,
    (SELECT COALESCE(SUM(pi.received_qty),0) FROM purchase_order_items pi WHERE pi.po_id=po.id) AS received FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id`,filters({'po.status':p.status,'po.supplier_id':int(p.supplier_id)||null}),'po.id DESC',p));
  function poDetail(id){const po=get('purchase_orders',id,'采购单');po.supplier=q1('SELECT * FROM suppliers WHERE id=?',[po.supplier_id]);po.items=q('SELECT pi.*,p.name AS product_name,p.spec,p.unit,p.sale_price FROM purchase_order_items pi LEFT JOIN products p ON p.id=pi.product_id WHERE pi.po_id=?',[id]);return po;}
  add('GET','/inv/purchase-orders/{id}',p=>poDetail(p.id));
  add('POST','/inv/purchase-orders',(p,d)=>{
    const sid=int(d.supplier_id),rows=d.items||[];if(!sid||!rows.length)fail('供应商与明细必填');get('suppliers',sid,'供应商');
    const batches=new Map();rows.forEach(it=>{get('products',int(it.product_id),'商品');if(!Number.isFinite(Number(it.qty))||Number(it.qty)<=0)fail('采购数量必须大于 0');precise(it.qty,'采购数量');nonnegative(it.price,'采购单价');it.batch_no=String(it.batch_no||'').trim();purchaseBatch(it);if(it.batch_no){const key=int(it.product_id)+'|'+it.batch_no,expires=it.expire_date||'';if(batches.has(key)&&batches.get(key)!==expires)fail('同一商品批号不能填写不同有效期');batches.set(key,expires);}});
    const id=insert('purchase_orders',{po_no:next('PO','purchase_orders','po_no'),supplier_id:sid,operator:d.operator??'admin',total_amount:0,status:'待收货',ordered_at:now(),received_at:null,remark:d.remark??'',created_at:now()});let total=0;
    rows.forEach(it=>{const prod=q1('SELECT * FROM products WHERE id=?',[int(it.product_id)]);if(!prod)return;const qty=n(it.qty,1),price=n(it.price,prod.purchase_price),amount=money(qty*price);total+=amount;insert('purchase_order_items',{po_id:id,product_id:prod.id,qty,price,received_qty:0,batch_no:it.batch_no??'',expire_date:it.expire_date??null,amount});});
    update('purchase_orders',id,{total_amount:money(total)});return poDetail(id);
  });
  add('POST','/inv/purchase-orders/{id}/receive',(p,d)=>{
    const po=get('purchase_orders',p.id,'采购单'),received=d.items||{};let total=0;
    if(!['待收货','部分收货'].includes(po.status))fail('该采购单已完成或不可收货');
    Object.keys(received).forEach(key=>{const item=q1('SELECT * FROM purchase_order_items WHERE id=? AND po_id=?',[int(key),p.id]);if(!item)fail('收货明细不属于该采购单');if(!Number.isFinite(Number(received[key]))||Number(received[key])<0||Number(received[key])>money(item.qty-item.received_qty))fail('收货数量不能为负数或超过待收货数量');precise(received[key],'收货数量');if(Number(received[key])>0)purchaseBatch(item);});
    if(d.produce_date){validDay(d.produce_date,'生产日期');if(d.produce_date>D.date())fail('生产日期不能晚于今天');}
    if(!Object.values(received).some(x=>Number(x)>0))fail('请填写至少一项正数收货数量');
    q('SELECT * FROM purchase_order_items WHERE po_id=?',[p.id]).forEach(it=>{
      const qty=Math.min(n(received[it.id]),it.qty-it.received_qty);if(qty<=0)return;
      run('UPDATE purchase_order_items SET received_qty=received_qty+? WHERE id=?',[qty,it.id]);stock(it.product_id,qty,'采购入库',po.po_no,d.operator??'admin');
      if(it.batch_no){const batch=q1('SELECT id FROM batches WHERE product_id=? AND batch_no=? AND COALESCE(expire_date,\'\')=? AND purchase_price=? AND supplier_id=?',[it.product_id,it.batch_no,it.expire_date||'',it.price,po.supplier_id]);if(batch)run('UPDATE batches SET qty=qty+? WHERE id=?',[qty,batch.id]);else insert('batches',{product_id:it.product_id,batch_no:it.batch_no,produce_date:d.produce_date??null,expire_date:it.expire_date,qty,purchase_price:it.price,supplier_id:po.supplier_id,created_at:now()});}total+=qty;
    });
    const rows=q('SELECT * FROM purchase_order_items WHERE po_id=?',[p.id]),done=rows.length&&rows.every(r=>r.received_qty>=r.qty),partial=rows.some(r=>r.received_qty>0),status=done?'已完成':partial?'部分收货':'待收货';
    update('purchase_orders',p.id,{status,received_at:status==='已完成'?now():null});return {ok:true,received:total,status,po:poDetail(p.id)};
  });
  add('POST','/inv/stock-adjust',(p,d)=>{
    const pid=int(d.product_id),delta=precise(d.delta,'库存变动数量');if(!pid||!delta)fail('商品与变动数量必填');const prod=get('products',pid,'商品');if(delta<0&&prod.stock_qty<Math.abs(delta))fail(`库存不足：${prod.name} 仅剩 ${prod.stock_qty}${prod.unit}`);
    if(d.log_type==='报损'&&delta>0)fail('报损数量必须为负数');
    stock(pid,delta,d.log_type??'盘点调整',d.ref_no||('ADJ:'+Date.now()+':'+Math.random().toString(16).slice(2)),d.operator??'admin');return {ok:true,product:get('products',pid)};
  });
  add('GET','/inv/logs',p=>paged('SELECT l.*,p.name AS product_name,p.unit FROM inventory_logs l LEFT JOIN products p ON p.id=l.product_id',filters({'l.product_id':int(p.product_id)||null,'l.log_type':p.log_type}),'l.id DESC',p));
})(window.Demo);
