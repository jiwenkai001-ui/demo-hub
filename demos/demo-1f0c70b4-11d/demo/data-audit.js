/* Read-only consistency checks. A pending workflow is valid; contradictory records are not. */
(function(D){
 'use strict';
 const {q,q1,val,money}=D;
 const rules=[
 ['foreign_keys','全库','所有外键均可定位','PRAGMA foreign_key_check'],
 ['vaccine_species','免疫','疫苗品种适配犬猫',`SELECT v.id FROM vaccinations v JOIN pets p ON p.id=v.pet_id WHERE (v.name='猫三联疫苗' AND p.species='犬') OR (v.name='犬瘟细小二联疫苗' AND p.species='猫')`],
 ['rx_species','诊疗','处方犬猫疫苗品种适配',`SELECT r.id FROM prescriptions r JOIN visits v ON v.id=r.visit_id JOIN pets p ON p.id=v.pet_id WHERE (r.product_id=14 AND p.species='犬') OR (r.product_id=12 AND p.species='猫')`],
 ['lab_charge','检验','院内检验有对应收费或包含项目',`SELECT l.id FROM lab_orders l WHERE l.visit_id IS NOT NULL AND l.status<>'已作废' AND NOT EXISTS(SELECT 1 FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id WHERE i.visit_id=l.visit_id AND x.item_type='检验' AND x.ref_id=l.id)`],
 ['plan_stock','健康计划','院内免疫驱虫关联真实批次出库',`SELECT s.plan_id AS id FROM service_plan_stock s JOIN service_plans p ON p.id=s.plan_id JOIN vaccinations v ON v.id=s.vaccination_id JOIN batches b ON b.id=s.batch_id WHERE p.status<>'已完成' OR p.vaccination_id<>v.id OR v.batch_no<>b.batch_no OR s.product_id<>b.product_id OR ABS(s.qty-(SELECT COALESCE(SUM(qty),0) FROM demo_batch_allocations a WHERE a.batch_id=s.batch_id AND a.reference=s.reference AND a.restored=0))>.011`],
 ['oa_expense_status','OA','OA审批状态随费用中心流转',`SELECT r.id FROM expense_requests r JOIN oa_approvals a ON a.id=r.source_oa_id WHERE a.status<>CASE WHEN r.status IN ('待付款','已付款') THEN '已通过' WHEN r.status='已驳回' THEN '已驳回' WHEN r.status IN ('已撤回','已冲正') THEN '已撤回' ELSE '待审批' END`],
 ['invoice_math','收银','账单项目数量与单价乘积',`SELECT id,invoice_id FROM invoice_items WHERE qty<=0 OR unit_price<0 OR ABS(ROUND(qty*unit_price,2)-amount)>.011`],
 ['invoice_total','收银','账单汇总与优惠应付',`SELECT i.id FROM invoices i LEFT JOIN invoice_items x ON x.invoice_id=i.id GROUP BY i.id HAVING ABS(i.total_amount-COALESCE(SUM(x.amount),0))>.011 OR ABS(i.payable-(i.total_amount-i.discount))>.011 OR i.discount<0 OR i.discount>i.total_amount`],
 ['cash_total','收银','账单净实收与收退款流水',`SELECT i.id FROM invoices i LEFT JOIN demo_cash_events e ON e.invoice_id=i.id GROUP BY i.id HAVING ABS(i.paid_amount-COALESCE(SUM(e.amount),0))>.011`],
 ['invoice_status','收银','收款状态与余额',`SELECT id,status FROM invoices WHERE paid_amount<0 OR paid_amount>payable+.011 OR (status='已结清' AND ABS(paid_amount-payable)>.011) OR (status IN ('已退费','已取消') AND paid_amount<>0) OR (status='待缴费' AND paid_amount<>0) OR (status='部分缴费' AND (paid_amount<=0 OR paid_amount>=payable))`],
 ['invoice_visit','诊疗','医疗账单与就诊归属',`SELECT i.id FROM invoices i JOIN visits v ON v.id=i.visit_id WHERE i.pet_id<>v.pet_id OR i.owner_id<>v.owner_id`],
 ['appointment_visit','接待','预约与就诊患者一致',`SELECT v.id FROM visits v JOIN appointments a ON a.id=v.appointment_id WHERE v.pet_id<>a.pet_id OR v.owner_id<>a.owner_id`],
 ['appointment_status','接待','就诊结束同步预约',`SELECT v.id,a.id AS appointment_id FROM visits v JOIN appointments a ON a.id=v.appointment_id WHERE (v.status='已完成' AND a.status<>'已完成') OR (v.status='已取消' AND a.status<>'已取消')`],
 ['visit_unique','接待','预约不重复生成就诊',`SELECT appointment_id,COUNT(*) AS count FROM visits WHERE appointment_id IS NOT NULL GROUP BY appointment_id HAVING COUNT(*)>1`],
 ['queue_link','接待','候诊终态与就诊一致',`SELECT t.id FROM sys_queue t JOIN visits v ON v.id=t.visit_id WHERE v.status IN ('已完成','已取消') AND t.status NOT IN ('已结束','已取消')`],
 ['owner_spend','客户','客户消费累计来源为账单',`SELECT o.id FROM owners o WHERE ABS(o.total_spend-(SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE owner_id=o.id))>.011`],
 ['owner_visits','客户','就诊次数与最近来院时间',`SELECT o.id FROM owners o WHERE o.visit_count<>(SELECT COUNT(*) FROM visits WHERE owner_id=o.id AND status<>'已取消') OR COALESCE(o.last_visit_at,'')<>COALESCE((SELECT MAX(visited_at) FROM visits WHERE owner_id=o.id AND status<>'已取消'),'')`],
 ['owner_balance','会员','客户余额与会员卡汇总',`SELECT o.id FROM owners o WHERE ABS(o.balance-(SELECT COALESCE(SUM(balance),0) FROM membership_cards WHERE owner_id=o.id))>.011`],
 ['owner_points','会员','客户积分与完整积分流水',`SELECT o.id FROM owners o WHERE o.points<>(SELECT COALESCE(SUM(delta),0) FROM service_points WHERE owner_id=o.id)`],
 ['card_points','会员','会员卡与客户共享积分',`SELECT c.id FROM membership_cards c JOIN owners o ON o.id=c.owner_id WHERE c.points<>o.points`],
 ['card_payment_owner','会员','会员支付关联原客户卡',`SELECT e.id FROM demo_cash_events e JOIN invoices i ON i.id=e.invoice_id LEFT JOIN membership_cards c ON c.id=e.card_id WHERE e.method='会员卡' AND (c.id IS NULL OR c.owner_id<>i.owner_id)`],
 ['rx_charge','诊疗','处方与收费项目关联',`SELECT r.id FROM prescriptions r JOIN invoices i ON i.visit_id=r.visit_id WHERE NOT EXISTS(SELECT 1 FROM invoice_items x WHERE x.invoice_id=i.id AND x.item_type='药品' AND x.ref_id=r.id AND x.qty=r.qty)`],
 ['charge_rx','诊疗','药品收费可追溯到同次处方',`SELECT x.id FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id LEFT JOIN prescriptions r ON r.id=x.ref_id WHERE x.item_type='药品' AND (r.id IS NULL OR r.visit_id<>i.visit_id OR r.qty<>x.qty)`],
 ['charge_lab','检验','检验收费可追溯到同次申请',`SELECT x.id FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id LEFT JOIN lab_orders l ON l.id=x.ref_id WHERE x.item_type='检验' AND (l.id IS NULL OR l.visit_id<>i.visit_id)`],
 ['charge_imaging','影像','影像收费可追溯到同次检查',`SELECT x.id FROM invoice_items x JOIN invoices i ON i.id=x.invoice_id LEFT JOIN imaging_studies s ON s.id=x.ref_id WHERE x.item_type='影像' AND (s.id IS NULL OR s.visit_id<>i.visit_id)`],
 ['lab_patient','检验','检验申请患者一致',`SELECT l.id FROM lab_orders l JOIN visits v ON v.id=l.visit_id WHERE l.pet_id<>v.pet_id`],
 ['lab_result_panel','检验','检验结果属于申请项目组',`SELECT r.id FROM lab_results r JOIN lab_items i ON i.id=r.item_id JOIN lab_orders l ON l.id=r.order_id WHERE i.panel<>l.panel`],
 ['lab_result_unique','检验','同一申请项目无重复结果',`SELECT order_id,item_id FROM lab_results WHERE item_id IS NOT NULL GROUP BY order_id,item_id HAVING COUNT(*)>1`],
 ['lab_complete','检验','已审核报告各配置项目齐全',`SELECT l.id FROM lab_orders l WHERE l.status='已审核' AND EXISTS(SELECT 1 FROM lab_items i WHERE i.panel=l.panel AND NOT EXISTS(SELECT 1 FROM lab_results r WHERE r.order_id=l.id AND r.item_id=i.id))`],
 ['imaging_patient','影像','影像与就诊患者一致',`SELECT s.id FROM imaging_studies s JOIN visits v ON v.id=s.visit_id WHERE s.pet_id<>v.pet_id`],
 ['imaging_count','影像','影像张数与文件记录一致',`SELECT s.id FROM imaging_studies s WHERE s.image_count<>(SELECT COUNT(*) FROM imaging_instances i WHERE i.study_id=s.id)`],
 ['stock_batches','库存','主院总库存与批次/未分批库存一致',`SELECT p.id,p.stock_qty,ROUND(COALESCE(SUM(b.qty),0),2) AS batch_qty FROM products p LEFT JOIN batches b ON b.product_id=p.id GROUP BY p.id HAVING ABS(p.stock_qty-COALESCE(SUM(b.qty),0))>.011`],
 ['stock_nonnegative','库存','总库存和批次数量不为负',`SELECT 'product' AS kind,id FROM products WHERE stock_qty<0 UNION ALL SELECT 'batch',id FROM batches WHERE qty<0 UNION ALL SELECT 'warehouse',id FROM ops_warehouse_stock WHERE qty<0 UNION ALL SELECT 'lot',id FROM ops_warehouse_lots WHERE qty<0`],
 ['stock_log_math','库存','每笔库存变化前后可核对',`SELECT id FROM inventory_logs WHERE ABS(before_qty+change_qty-after_qty)>.011`],
 ['stock_log_chain','库存','库存流水连续',`SELECT id,product_id FROM (SELECT *,LAG(after_qty) OVER(PARTITION BY product_id ORDER BY id) AS previous FROM inventory_logs) WHERE ABS(before_qty-previous)>.011`],
 ['stock_latest','库存','最新库存流水与商品一致',`SELECT p.id FROM products p JOIN inventory_logs l ON l.id=(SELECT MAX(id) FROM inventory_logs WHERE product_id=p.id) WHERE ABS(p.stock_qty-l.after_qty)>.011`],
 ['remote_stock','分院','分院库存与批次一致',`SELECT s.id FROM ops_warehouse_stock s WHERE ABS(s.qty-(SELECT COALESCE(SUM(qty),0) FROM ops_warehouse_lots l WHERE l.warehouse_id=s.warehouse_id AND l.product_id=s.product_id))>.011`],
 ['allocation_product','库存','批次扣减对应商品',`SELECT a.id FROM demo_batch_allocations a JOIN batches b ON b.id=a.batch_id WHERE a.product_id<>b.product_id OR a.qty<=0`],
 ['po_total','采购','采购明细与整单金额',`SELECT p.id FROM purchase_orders p LEFT JOIN purchase_order_items i ON i.po_id=p.id GROUP BY p.id HAVING ABS(p.total_amount-COALESCE(SUM(i.amount),0))>.011`],
 ['po_receive','采购','采购收货数量与状态',`SELECT i.id FROM purchase_order_items i JOIN purchase_orders p ON p.id=i.po_id WHERE i.received_qty<0 OR i.received_qty>i.qty OR ABS(i.amount-i.qty*i.price)>.011 OR (p.status='已完成' AND i.received_qty<>i.qty)`],
 ['transfer_lots','调拨','发出调拨数量与携带批次一致',`SELECT i.id FROM ops_transfer_items i JOIN ops_transfers t ON t.id=i.transfer_id WHERE t.status IN ('运输中','已收货') AND ABS(i.qty-(SELECT COALESCE(SUM(qty),0) FROM ops_transfer_lots l WHERE l.transfer_id=t.id AND l.product_id=i.product_id))>.011`],
 ['retail_charge','零售','零售项目与账单金额/数量一致',`SELECT r.id FROM ops_retail_items r JOIN ops_retail_sales s ON s.id=r.sale_id WHERE NOT EXISTS(SELECT 1 FROM invoice_items x WHERE x.invoice_id=s.invoice_id AND x.item_type='商品零售' AND x.ref_id=r.id AND x.qty=r.qty AND x.unit_price=r.unit_price)`],
 ['retail_return','零售','撤销退款同步商品退回',`SELECT s.id FROM ops_retail_sales s JOIN invoices i ON i.id=s.invoice_id WHERE (s.status IN ('已取消','已退货') AND EXISTS(SELECT 1 FROM ops_retail_items r WHERE r.sale_id=s.id AND r.returned<>1)) OR (i.status='已退费' AND s.status<>'已退货')`],
 ['service_owner','服务','套餐与账单归属一致',`SELECT o.id FROM service_orders o JOIN invoices i ON i.id=o.invoice_id WHERE o.owner_id<>i.owner_id OR o.pet_id<>i.pet_id`],
 ['service_units','服务','套餐可用次数边界正确',`SELECT o.id FROM service_orders o LEFT JOIN service_uses u ON u.order_id=o.id GROUP BY o.id HAVING COALESCE(SUM(u.qty),0)<0 OR COALESCE(SUM(u.qty),0)>o.units`],
 ['service_activation','服务','付款激活与核销条件',`SELECT o.id FROM service_orders o JOIN invoices i ON i.id=o.invoice_id WHERE (i.status='已结清' AND (o.activated_at IS NULL OR o.expires_at IS NULL)) OR ((i.status<>'已结清' OR o.cancelled=1) AND (SELECT COALESCE(SUM(qty),0) FROM service_uses WHERE order_id=o.id)>0)`],
 ['plan_reminder','健康计划','计划与提醒状态和归属',`SELECT p.id FROM service_plans p JOIN reminders r ON r.id=p.reminder_id WHERE p.owner_id<>r.owner_id OR p.pet_id<>r.pet_id OR (p.status='已完成' AND r.status<>'已完成') OR (p.status='已取消' AND r.status<>'已忽略')`],
 ['plan_vaccine','健康计划','已执行计划有免疫驱虫档案',`SELECT p.id FROM service_plans p LEFT JOIN vaccinations v ON v.id=p.vaccination_id WHERE p.status='已完成' AND (v.id IS NULL OR v.pet_id<>p.pet_id OR v.category<>p.category OR v.injected_at<>p.executed_at)`],
 ['plan_use','健康计划','套餐核销与已执行计划一致',`SELECT u.id FROM service_uses u JOIN service_orders o ON o.id=u.order_id JOIN service_plans p ON p.id=u.plan_id WHERE p.status<>'已完成' OR p.pet_id<>o.pet_id OR p.owner_id<>o.owner_id OR p.category<>o.category`],
 ['admission_owner','住院','住院患者与病历一致',`SELECT a.id FROM care_admissions a JOIN visits v ON v.id=a.visit_id WHERE a.pet_id<>v.pet_id OR a.owner_id<>v.owner_id`],
 ['admission_cage','住院','笼位和宠物不能重复在院',`SELECT cage_id AS id FROM care_admissions WHERE status='在院' GROUP BY cage_id HAVING COUNT(*)>1 UNION ALL SELECT pet_id FROM care_admissions WHERE status='在院' GROUP BY pet_id HAVING COUNT(*)>1`],
 ['care_fee','住院','住院按日计费与账单关联',`SELECT f.id FROM care_fees f JOIN care_admissions a ON a.id=f.admission_id JOIN invoices i ON i.visit_id=a.visit_id WHERE NOT EXISTS(SELECT 1 FROM invoice_items x WHERE x.invoice_id=i.id AND x.item_type='住院寄养' AND x.ref_id=f.id AND x.amount=f.amount)`],
 ['care_discharge','住院','出院记录护理监护结算齐全',`SELECT a.id FROM care_admissions a JOIN visits v ON v.id=a.visit_id JOIN invoices i ON i.visit_id=a.visit_id WHERE a.status='已出院' AND (a.discharged_at IS NULL OR v.status<>'已完成' OR i.status NOT IN ('已结清','已退费') OR NOT EXISTS(SELECT 1 FROM care_monitoring m WHERE m.admission_id=a.id) OR EXISTS(SELECT 1 FROM care_orders o WHERE o.admission_id=a.id AND o.status='待执行'))`],
 ['care_order','住院','护理执行终态有记录',`SELECT id FROM care_orders WHERE status IN ('已执行','已取消') AND (executed_at IS NULL OR COALESCE(executor,'')='' OR COALESCE(execution_note,'')='')`],
 ['document_owner','文书','医疗文书与原就诊归属',`SELECT d.id FROM care_documents d JOIN visits v ON v.id=d.visit_id WHERE d.owner_id<>v.owner_id OR d.pet_id<>v.pet_id`],
 ['document_signature','文书','签署文书有正文及签署留痕',`SELECT id FROM care_documents WHERE status='已签署' AND (COALESCE(content,'')='' OR signed_at IS NULL OR COALESCE(signer_name,'')='' OR requested_at IS NULL)`],
 ['deposit_owner','预交金','预交金关联原住院客户',`SELECT e.id FROM biz_deposit_events e JOIN care_admissions a ON a.id=e.admission_id WHERE e.owner_id<>a.owner_id OR e.pet_id<>a.pet_id`],
 ['deposit_balance','预交金','住院预交余额不能透支',`SELECT admission_id AS id FROM biz_deposit_events GROUP BY admission_id HAVING SUM(amount)<-.011`],
 ['deposit_cash','预交金','预交抵扣与账单收款一致',`SELECT i.id FROM invoices i WHERE ABS((SELECT COALESCE(SUM(amount),0) FROM demo_cash_events e WHERE e.invoice_id=i.id AND e.method='住院预交金')+(SELECT COALESCE(SUM(amount),0) FROM biz_deposit_events d WHERE d.invoice_id=i.id))>.011`],
 ['coupon_owner','营销','优惠券与核销账单客户一致',`SELECT x.invoice_id AS id FROM demo_invoice_coupons x JOIN coupons c ON c.id=x.coupon_id JOIN invoices i ON i.id=x.invoice_id WHERE c.owner_id<>i.owner_id OR ABS(x.discount-i.discount)>.011 OR (x.consumed=1 AND (c.status<>'已使用' OR c.used_at IS NULL))`],
 ['coupon_used','营销','已使用优惠券有核销凭据',`SELECT c.id FROM coupons c WHERE c.status='已使用' AND NOT EXISTS(SELECT 1 FROM demo_invoice_coupons x WHERE x.coupon_id=c.id AND x.consumed=1)`],
 ['campaign_receipt','营销','活动转化对应实际净收款',`SELECT r.invoice_id AS id FROM demo_campaign_receipts r JOIN invoices i ON i.id=r.invoice_id WHERE ABS(r.amount-i.paid_amount)>.011 OR NOT EXISTS(SELECT 1 FROM demo_invoice_coupons x JOIN coupons c ON c.id=x.coupon_id WHERE x.invoice_id=r.invoice_id AND c.campaign_id=r.campaign_id)`],
 ['claim_owner','医疗报销','保单、医疗账单、案件归属一致',`SELECT c.id FROM medical_claims c JOIN invoices i ON i.id=c.invoice_id JOIN claim_policies p ON p.id=c.policy_id WHERE c.owner_id<>i.owner_id OR c.pet_id<>i.pet_id OR c.owner_id<>p.owner_id OR c.pet_id<>p.pet_id`],
 ['claim_payment','医疗报销','赔付与核准金额及状态一致',`SELECT c.id FROM medical_claims c LEFT JOIN claim_payouts p ON p.claim_id=c.id GROUP BY c.id HAVING (c.status='已赔付' AND ABS(c.approved_amount-COALESCE(SUM(p.amount),0))>.011) OR (c.status<>'已赔付' AND ABS(COALESCE(SUM(p.amount),0))>.011)`],
 ['claim_invoice','医疗报销','有效报销案件关联已付医疗账单',`SELECT c.id FROM medical_claims c JOIN invoices i ON i.id=c.invoice_id WHERE c.status NOT IN ('已撤回','已驳回') AND (i.status<>'已结清' OR i.paid_amount<=0 OR i.visit_id IS NULL)`],
 ['claim_materials','医疗报销','已审核案件具备基本材料',`SELECT c.id FROM medical_claims c WHERE c.status IN ('保险审核','待赔付','已赔付') AND (SELECT COUNT(DISTINCT category) FROM claim_materials m WHERE m.claim_id=c.id AND category IN ('宠物身份','保单凭证','病历与诊断','费用清单','结算凭证'))<5`],
 ['expense_total','员工报销','报销总额与费用明细一致',`SELECT r.id FROM expense_requests r LEFT JOIN expense_items i ON i.request_id=r.id GROUP BY r.id HAVING ABS(r.total_amount-COALESCE(SUM(i.amount),0))>.011`],
 ['expense_payment','员工报销','付款冲正与审批状态一致',`SELECT r.id FROM expense_requests r LEFT JOIN expense_payments p ON p.request_id=r.id GROUP BY r.id HAVING (r.status='已付款' AND ABS(r.total_amount-COALESCE(SUM(p.amount),0))>.011) OR (r.status<>'已付款' AND ABS(COALESCE(SUM(p.amount),0))>.011)`],
 ['expense_oa','OA','OA转入报销申请一致',`SELECT e.id FROM expense_requests e JOIN oa_approvals a ON a.id=e.source_oa_id WHERE a.type<>'报销' OR e.applicant_id<>a.applicant_id`],
 ['expense_evidence','员工报销','审批中的报销存在票据附件',`SELECT r.id FROM expense_requests r WHERE r.status IN ('科室审核','财务复核','院长审批','待付款','已付款') AND NOT EXISTS(SELECT 1 FROM expense_attachments a WHERE a.request_id=r.id AND a.data_url<>'')`],
 ['consult_owner','问诊','问诊患者与历史归属匹配',`SELECT c.id FROM consultations c JOIN pets p ON p.id=c.pet_id WHERE c.owner_id<>p.owner_id AND NOT EXISTS(SELECT 1 FROM service_pet_history h WHERE h.pet_id=p.id AND h.old_owner_id=c.owner_id)`],
 ['consult_media','问诊','附件归属正确的消息和客户',`SELECT a.id FROM mobile_consult_attachments a JOIN consultation_messages m ON m.id=a.message_id JOIN consultations c ON c.id=m.consult_id WHERE a.consult_id<>c.id OR a.owner_id<>c.owner_id OR a.size<=0 OR a.data_url=''`],
 ['consult_close','问诊','已关闭问诊有结束时间',`SELECT id FROM consultations WHERE status='已关闭' AND closed_at IS NULL`],
 ['oa_tasks','OA','已完成任务有完成时间',`SELECT id FROM oa_tasks WHERE status='已完成' AND completed_at IS NULL`],
 ['oa_history','OA','审批申请具有历史留痕',`SELECT a.id FROM oa_approvals a WHERE NOT EXISTS(SELECT 1 FROM oa_approval_history h WHERE h.approval_id=a.id)`],
 ['specialty_signature','专科','完成版本有医生和完成时间',`SELECT id FROM clinical_specialties WHERE status='已完成' AND (signed_by IS NULL OR signed_at IS NULL)`],
 ['followup_result','回访','完成回访有结果与时间',`SELECT id FROM followups WHERE status='已完成' AND (finished_at IS NULL OR COALESCE(result,'')='')`]
 ];
 D.dataCycleAudit=function(){
   const checks=rules.map(([key,module,label,sql])=>{const rows=q(sql);return {key,module,label,passed:rows.length===0,count:rows.length,examples:rows.slice(0,8)};});
   const custom=(key,module,label,rows)=>checks.push({key,module,label,passed:rows.length===0,count:rows.length,examples:rows.slice(0,8)});
   custom('card_ledger','会员','卡余额与期初/充值/消费/退款流水',q('SELECT id FROM membership_cards').map(c=>D.memberCardTransactions(c.id)).filter(c=>Math.abs(c.balance-c.items.reduce((s,x)=>s+x.amount,0))>.011).map(c=>({id:c.card.id})));
   custom('dayclose_snapshot','日结','日结现金实点与快照算式',q('SELECT * FROM biz_day_closes').filter(r=>{const s=JSON.parse(r.snapshot);return Math.abs(r.expected_cash-r.opening_cash-s.cash_drawer)>.011||Math.abs(r.difference-r.counted_cash+r.expected_cash)>.011||s.store.id!==r.store_id;}).map(r=>({id:r.id})));
   custom('specialty_required','专科','完成版本必填内容完整',q("SELECT * FROM clinical_specialties WHERE status='已完成'").filter(r=>{const t=D.routes.find(x=>x.path==='/api/care/specialties/templates').handler().items.find(x=>x.key===r.specialty),v=JSON.parse(r.values_json);return !t||t.fields.some(f=>f.required&&!String(v[f.key]??'').trim());}).map(r=>({id:r.id})));
   custom('lab_flags','检验','异常标记与该条报告参考范围一致',q('SELECT * FROM lab_results').filter(r=>r.flag!==D.flag(r.value,r.ref_low,r.ref_high)).map(r=>({id:r.id,value:r.value,flag:r.flag,expected:D.flag(r.value,r.ref_low,r.ref_high)})));
   const tables=q("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>({name:t.name,count:Number(val('SELECT COUNT(*) FROM '+t.name))}));
   return {checked_at:D.now(),checks,passed:checks.filter(c=>c.passed).length,total:checks.length,issue_count:checks.reduce((s,c)=>s+c.count,0),tables,scope:'关联完整性、金额/数量守恒与流程状态核对；正常待办不算异常。历史真实编辑不会被演示修复覆盖。'};
 };
 D.add('GET','/system/data-audit',()=>D.dataCycleAudit());
})(window.Demo);
