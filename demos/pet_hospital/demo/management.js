(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,money,now,later,next,filters,paged,items,recalc,stock}=D;
  function invoiceDetail(id){const inv=get('invoices',id,'账单');inv.items=q('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[id]);inv.owner=q1('SELECT * FROM owners WHERE id=?',[inv.owner_id]);inv.pet=inv.pet_id?q1('SELECT * FROM pets WHERE id=?',[inv.pet_id]):null;inv.visit=inv.visit_id?q1('SELECT * FROM visits WHERE id=?',[inv.visit_id]):null;return inv;}
  D.invoiceDetail=invoiceDetail;
  add('GET','/bill/invoices',p=>paged(`SELECT i.*,o.name AS owner_name,o.phone,p.name AS pet_name,v.visit_no FROM invoices i
    LEFT JOIN owners o ON o.id=i.owner_id LEFT JOIN pets p ON p.id=i.pet_id LEFT JOIN visits v ON v.id=i.visit_id`,
    filters({'i.status':p.status},p.keyword,['o.name','o.phone','i.invoice_no'],[].concat(p.start?[['date(i.created_at)>=?',p.start]]:[],p.end?[['date(i.created_at)<=?',p.end]]:[])),'i.id DESC',p));
  add('GET','/bill/invoices/{id}',p=>invoiceDetail(p.id));
  add('POST','/bill/invoices/{id}/items',(p,d)=>{
    get('invoices',p.id,'账单');const name=(d.name||'').trim();if(!name)fail('项目名称必填');const qty=n(d.qty,1),price=n(d.unit_price);
    insert('invoice_items',{invoice_id:p.id,item_type:d.item_type??'其他',name,ref_id:int(d.ref_id),qty,unit_price:price,amount:money(qty*price)});return recalc(p.id);
  });
  add('DELETE','/bill/items/{id}',p=>{const item=get('invoice_items',p.id,'账单明细');run('DELETE FROM invoice_items WHERE id=?',[p.id]);return recalc(item.invoice_id);});
  add('POST','/bill/invoices/{id}/discount',(p,d)=>{update('invoices',p.id,{discount:money(d.discount)});return recalc(p.id);});
  add('POST','/bill/invoices/{id}/pay',(p,d)=>{
    const inv=get('invoices',p.id,'账单'),method=d.pay_method||d.method||'微信',payable=money(inv.payable);
    const amount=n(d.amount)>0?n(d.amount):payable-money(inv.paid_amount);
    if(method==='会员卡'){
      const card=q1('SELECT * FROM membership_cards WHERE owner_id=?',[inv.owner_id]);if(!card)fail('该客户暂无会员卡');
      if(money(card.balance)<amount)fail(`会员卡余额不足（余额 ${card.balance} 元）`);
      run('UPDATE membership_cards SET balance=balance-? WHERE id=?',[amount,card.id]);
    }
    const paid=money(money(inv.paid_amount)+amount),status=paid>=payable-0.01?'已结清':'部分缴费';
    update('invoices',p.id,{paid_amount:paid,status,pay_method:method,cashier:d.cashier??'admin',paid_at:now()});
    if(status==='已结清'){run('UPDATE owners SET total_spend=total_spend+? WHERE id=?',[amount,inv.owner_id]);if(inv.visit_id)run("UPDATE visits SET status='已完成',finished_at=? WHERE id=? AND status='待缴费'",[now(),inv.visit_id]);}
    return get('invoices',p.id);
  });
  add('POST','/bill/invoices/{id}/refund',p=>{
    const inv=get('invoices',p.id,'账单'),paid=money(inv.paid_amount);if(paid<=0)fail('该账单未产生收款，无法退费');
    if(inv.pay_method==='会员卡')run('UPDATE membership_cards SET balance=balance+? WHERE owner_id=?',[paid,inv.owner_id]);
    return update('invoices',p.id,{paid_amount:0,status:'已退费',pay_method:inv.pay_method+'退费'});
  });
  add('GET','/crm/customers',p=>paged(`SELECT o.*,(SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count,
    (SELECT COUNT(*) FROM visits v WHERE v.owner_id=o.id) AS real_visit_count,
    (SELECT mc.level FROM membership_cards mc WHERE mc.owner_id=o.id LIMIT 1) AS card_level,
    (SELECT mc.balance FROM membership_cards mc WHERE mc.owner_id=o.id LIMIT 1) AS card_balance,
    (SELECT COUNT(*) FROM coupons c WHERE c.owner_id=o.id AND c.status='未使用') AS coupon_count,
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
    const oid=int(d.owner_id);if(!oid)fail('客户必填');get('owners',oid,'客户');if(q1('SELECT id FROM membership_cards WHERE owner_id=?',[oid]))fail('该客户已持有会员卡');
    const level=d.level??'银卡',balance=n(d.balance),id=insert('membership_cards',{card_no:d.card_no||('MC'+Math.floor(100000+Math.random()*900000)),owner_id:oid,level,balance,points:0,discount:n(d.discount,({'银卡':.95,'金卡':.9,'钻石':.85})[level]||.95),total_recharge:balance,valid_until:d.valid_until||later(365),status:'正常',opened_at:now()});
    update('owners',oid,{member_level:level});return get('membership_cards',id);
  });
  add('POST','/crm/cards/{id}/recharge',(p,d)=>{get('membership_cards',p.id,'会员卡');const amount=n(d.amount);if(amount<=0)fail('充值金额必须大于 0');run('UPDATE membership_cards SET balance=balance+?,total_recharge=total_recharge+? WHERE id=?',[amount,amount,p.id]);return get('membership_cards',p.id);});
  add('GET','/crm/campaigns',p=>{const f=filters({status:p.status});return items('SELECT * FROM campaigns'+f.sql+' ORDER BY id DESC',f.args);});
  add('POST','/crm/campaigns',(p,d)=>{const name=(d.name||'').trim();if(!name)fail('活动名称必填');return get('campaigns',insert('campaigns',{name,type:d.type??'优惠券',target_stage:d.target_stage??'全部',channel:d.channel??'微信',budget:n(d.budget),reach_count:0,convert_count:0,revenue:0,status:d.status??'进行中',start_at:d.start_at??null,end_at:d.end_at??null,content:d.content??'',created_at:now()}));});
  add('GET','/crm/coupons',p=>{const f=filters({'c.status':p.status,'c.owner_id':int(p.owner_id)||null});return items('SELECT c.*,o.name AS owner_name FROM coupons c LEFT JOIN owners o ON o.id=c.owner_id'+f.sql+' ORDER BY c.id DESC LIMIT 200',f.args);});
  function coupon(d){
    const oid=int(d.owner_id);if(!oid)fail('客户必填');get('owners',oid,'客户');return get('coupons',insert('coupons',{code:d.code||('C'+next('','coupons','code',true)),owner_id:oid,campaign_id:int(d.campaign_id)||null,name:d.name??'优惠券',coupon_type:d.coupon_type??'满减',value:n(d.value),min_spend:n(d.min_spend),expire_at:d.expire_at||later(30),status:'未使用',used_at:null,created_at:now()}));
  }
  add('POST','/crm/coupons',(p,d)=>coupon(d));
  add('POST','/crm/segments',(p,d)=>{
    const extra=[];if(n(d.min_spend)>0)extra.push(['o.total_spend>=?',n(d.min_spend)]);if(int(d.days_no_visit)>0)extra.push(["(o.last_visit_at IS NULL OR o.last_visit_at<=datetime('now',?))",'-'+int(d.days_no_visit)+' day']);
    const f=filters({'o.life_stage':d.life_stage},d.keyword,['o.name','o.phone'],extra),rows=q('SELECT o.*,(SELECT COUNT(*) FROM pets p WHERE p.owner_id=o.id) AS pet_count,(SELECT MAX(v.visited_at) FROM visits v WHERE v.owner_id=o.id) AS last_visit FROM owners o'+f.sql+' ORDER BY o.total_spend DESC LIMIT 500',f.args);
    return {items:rows,meta:{total:rows.length,page:1,page_size:rows.length,pages:1}};
  });
  function followup(d){
    const oid=int(d.owner_id);if(!oid)fail('客户必填');return get('followups',insert('followups',{owner_id:oid,pet_id:int(d.pet_id)||null,type:d.type??'术后回访',scheduled_at:d.scheduled_at||now(),channel:d.channel??'微信',content:d.content??'',status:'待执行',result:'',operator:d.operator??'',finished_at:null,created_at:now()}));
  }
  add('POST','/crm/dispatch',(p,d)=>{
    const ids=d.owner_ids||[];if(!ids.length)fail('请先圈选目标客户');let coupons=0,followups=0;const action=d.action??'coupon',cid=int(d.campaign_id)||null;
    ids.forEach(id=>{if(!q1('SELECT id FROM owners WHERE id=?',[id]))return;
      if(['coupon','both'].includes(action)){coupon({owner_id:id,code:'C'+next('','coupons','code',true)+id,campaign_id:cid,name:d.coupon_name??'营销活动优惠券',coupon_type:d.coupon_type??'满减',value:n(d.coupon_value,30),min_spend:n(d.min_spend),expire_at:d.expire_at||later(30)});coupons++;}
      if(['followup','both'].includes(action)){followup({owner_id:id,type:d.followup_type??'流失召回',channel:d.channel??'微信',content:d.content??'营销活动触达，邀约到店。',operator:d.operator??'admin'});followups++;}
    });if(cid)run('UPDATE campaigns SET reach_count=reach_count+? WHERE id=?',[ids.length,cid]);return {ok:true,reached:ids.length,coupons,followups};
  });
  add('GET','/crm/followups',p=>paged('SELECT f.*,o.name AS owner_name,o.phone,p.name AS pet_name FROM followups f LEFT JOIN owners o ON o.id=f.owner_id LEFT JOIN pets p ON p.id=f.pet_id',filters({'f.status':p.status,'f.type':p.ftype}),'f.scheduled_at ASC',p));
  add('POST','/crm/followups',(p,d)=>followup(d));
  add('PATCH','/crm/followups/{id}',(p,d)=>{const fields=['status','result','operator','content','scheduled_at','channel','type'];if(d.status==='已完成'){d.finished_at=now();fields.push('finished_at');}return update('followups',p.id,d,fields);});

  add('GET','/inv/products',p=>paged(`SELECT p.*,ROUND(p.stock_qty*p.purchase_price,2) AS stock_amount,
    CASE WHEN p.stock_qty<=0 THEN '缺货' WHEN p.stock_qty<=p.safety_stock THEN '预警' ELSE '正常' END AS stock_status,
    (SELECT COUNT(*) FROM batches b WHERE b.product_id=p.id AND b.expire_date<=date('now','+90 day')) AS near_expire_batches FROM products p`,
    filters({category:p.category,status:p.status??'在售'},p.keyword,['name','sku','generic_name'],['true','1','yes'].includes(String(p.only_low).toLowerCase())?[['stock_qty<=safety_stock']]:[]),'p.stock_qty ASC',p));
  add('GET','/inv/products/{id}',p=>{const prod=get('products',p.id,'商品');prod.batches=q('SELECT b.*,s.name AS supplier_name FROM batches b LEFT JOIN suppliers s ON s.id=b.supplier_id WHERE b.product_id=? ORDER BY b.expire_date',[p.id]);prod.logs=q('SELECT * FROM inventory_logs WHERE product_id=? ORDER BY id DESC LIMIT 30',[p.id]);return prod;});
  add('POST','/inv/products',(p,d)=>{
    const name=(d.name||'').trim();if(!name)fail('商品名称必填');return get('products',insert('products',{sku:d.sku||('YP'+next('','products','sku',true)),name,generic_name:d.generic_name??'',category:d.category??'药品',spec:d.spec??'',unit:d.unit??'盒',manufacturer:d.manufacturer??'',approval_no:d.approval_no??'',purchase_price:n(d.purchase_price),sale_price:n(d.sale_price),stock_qty:n(d.stock_qty),safety_stock:n(d.safety_stock,10),shelf_life:int(d.shelf_life,24),storage_cond:d.storage_cond??'常温',is_prescription:int(d.is_prescription,1),status:d.status??'在售',created_at:now()}));
  });
  add('PUT','/inv/products/{id}',(p,d)=>update('products',p.id,d,['name','generic_name','category','spec','unit','manufacturer','approval_no','purchase_price','sale_price','safety_stock','shelf_life','storage_cond','is_prescription','status']));
  add('GET','/inv/suppliers',()=>items('SELECT s.*,(SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id=s.id) AS po_count FROM suppliers s ORDER BY id'));
  add('POST','/inv/suppliers',(p,d)=>{const name=(d.name||'').trim();if(!name)fail('供应商名称必填');return get('suppliers',insert('suppliers',{name,contact:d.contact??'',phone:d.phone??'',address:d.address??'',license_no:d.license_no??'',category:d.category??'药品',cooperation:d.cooperation??'良好',status:d.status??'合作中',created_at:now()}));});
  add('GET','/inv/purchase-orders',p=>paged(`SELECT po.*,s.name AS supplier_name,s.contact,
    (SELECT COUNT(*) FROM purchase_order_items pi WHERE pi.po_id=po.id) AS item_count,
    (SELECT COALESCE(SUM(pi.received_qty),0) FROM purchase_order_items pi WHERE pi.po_id=po.id) AS received FROM purchase_orders po LEFT JOIN suppliers s ON s.id=po.supplier_id`,filters({'po.status':p.status,'po.supplier_id':int(p.supplier_id)||null}),'po.id DESC',p));
  function poDetail(id){const po=get('purchase_orders',id,'采购单');po.supplier=q1('SELECT * FROM suppliers WHERE id=?',[po.supplier_id]);po.items=q('SELECT pi.*,p.name AS product_name,p.spec,p.unit,p.sale_price FROM purchase_order_items pi LEFT JOIN products p ON p.id=pi.product_id WHERE pi.po_id=?',[id]);return po;}
  add('GET','/inv/purchase-orders/{id}',p=>poDetail(p.id));
  add('POST','/inv/purchase-orders',(p,d)=>{
    const sid=int(d.supplier_id),rows=d.items||[];if(!sid||!rows.length)fail('供应商与明细必填');get('suppliers',sid,'供应商');
    const id=insert('purchase_orders',{po_no:next('PO','purchase_orders','po_no'),supplier_id:sid,operator:d.operator??'admin',total_amount:0,status:'待收货',ordered_at:now(),received_at:null,remark:d.remark??'',created_at:now()});let total=0;
    rows.forEach(it=>{const prod=q1('SELECT * FROM products WHERE id=?',[int(it.product_id)]);if(!prod)return;const qty=n(it.qty,1),price=n(it.price,prod.purchase_price),amount=money(qty*price);total+=amount;insert('purchase_order_items',{po_id:id,product_id:prod.id,qty,price,received_qty:0,batch_no:it.batch_no??'',expire_date:it.expire_date??null,amount});});
    update('purchase_orders',id,{total_amount:money(total)});return poDetail(id);
  });
  add('POST','/inv/purchase-orders/{id}/receive',(p,d)=>{
    const po=get('purchase_orders',p.id,'采购单'),received=d.items||{};let total=0;
    q('SELECT * FROM purchase_order_items WHERE po_id=?',[p.id]).forEach(it=>{
      const qty=Math.min(n(received[it.id]),it.qty-it.received_qty);if(qty<=0)return;
      run('UPDATE purchase_order_items SET received_qty=received_qty+? WHERE id=?',[qty,it.id]);stock(it.product_id,qty,'采购入库',po.po_no,d.operator??'admin');
      if(it.batch_no){const batch=q1('SELECT id FROM batches WHERE product_id=? AND batch_no=?',[it.product_id,it.batch_no]);if(batch)run('UPDATE batches SET qty=qty+? WHERE id=?',[qty,batch.id]);else insert('batches',{product_id:it.product_id,batch_no:it.batch_no,produce_date:d.produce_date??null,expire_date:it.expire_date,qty,purchase_price:it.price,supplier_id:po.supplier_id,created_at:now()});}total+=qty;
    });
    const rows=q('SELECT * FROM purchase_order_items WHERE po_id=?',[p.id]),done=rows.length&&rows.every(r=>r.received_qty>=r.qty),partial=rows.some(r=>r.received_qty>0),status=done?'已完成':partial?'部分收货':'待收货';
    update('purchase_orders',p.id,{status,received_at:status==='已完成'?now():null});return {ok:true,received:total,status,po:poDetail(p.id)};
  });
  add('POST','/inv/stock-adjust',(p,d)=>{
    const pid=int(d.product_id),delta=n(d.delta);if(!pid||!delta)fail('商品与变动数量必填');const prod=get('products',pid,'商品');if(delta<0&&prod.stock_qty<Math.abs(delta))fail(`库存不足：${prod.name} 仅剩 ${prod.stock_qty}${prod.unit}`);
    stock(pid,delta,d.log_type??'盘点调整',d.ref_no??'',d.operator??'admin');return {ok:true,product:get('products',pid)};
  });
  add('GET','/inv/logs',p=>paged('SELECT l.*,p.name AS product_name,p.unit FROM inventory_logs l LEFT JOIN products p ON p.id=l.product_id',filters({'l.product_id':int(p.product_id)||null,'l.log_type':p.log_type}),'l.id DESC',p));
})(window.Demo);
