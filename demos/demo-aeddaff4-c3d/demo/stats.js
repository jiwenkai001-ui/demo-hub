/* Generated from original statistics queries; see tools/export_stats.py. */
(function(D){
const {add,q,val,money}=D;
add('GET','/dashboard/overview',function(){
var today_appt=(val("SELECT COUNT(*) FROM appointments WHERE date(scheduled_at)=date('now')") || 0);
var pending_appt=(val("SELECT COUNT(*) FROM appointments WHERE status='待到店' AND date(scheduled_at)=date('now')") || 0);
return {"kpi":{"today_appointment":today_appt,
"pending_appointment":pending_appt,
"in_progress":(val("SELECT COUNT(*) FROM visits WHERE status IN ('待接诊','诊疗中')") || 0),
"pending_payment":(val("SELECT COUNT(*) FROM invoices WHERE status IN ('待缴费','部分缴费')") || 0),
"today_income":money((val("SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE date(created_at)=date('now')") || 0)),
"month_income":money((val("SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE created_at>=date('now','start of month')") || 0)),
"pending_lab":(val("SELECT COUNT(*) FROM lab_orders WHERE status IN ('已开单','已采样','检测中')") || 0),
"device_online":(val("SELECT COUNT(*) FROM lab_devices WHERE status='在线'") || 0),
"device_total":(val("SELECT COUNT(*) FROM lab_devices") || 0),
"low_stock":(val("SELECT COUNT(*) FROM products WHERE stock_qty<=safety_stock AND status='在售'") || 0),
"pending_followup":(val("SELECT COUNT(*) FROM followups WHERE status='待执行'") || 0),
"pending_consult":(val("SELECT COUNT(*) FROM consultations WHERE status IN ('待回复','进行中')") || 0),
"customer_total":(val("SELECT COUNT(*) FROM owners") || 0),
"today_imaging":(val("SELECT COUNT(*) FROM imaging_studies WHERE date(performed_at)=date('now')") || 0)},
"today_appointments":q("SELECT a.*, p.name AS pet_name, p.species, o.name AS owner_name, o.phone, s.name AS doctor_name FROM appointments a LEFT JOIN pets p ON p.id=a.pet_id LEFT JOIN owners o ON o.id=a.owner_id LEFT JOIN staff s ON s.id=a.doctor_id WHERE date(a.scheduled_at)=date('now') ORDER BY a.scheduled_at LIMIT 20"),
"income_trend":q("SELECT date(created_at) AS date, ROUND(COALESCE(SUM(paid_amount),0),2) AS amount FROM invoices WHERE created_at>=date('now','-13 day') GROUP BY date(created_at) ORDER BY date"),
"dept_perf":q("SELECT v.dept AS name, COUNT(*) AS visits, ROUND(COALESCE(SUM(i.paid_amount),0),2) AS income FROM visits v LEFT JOIN invoices i ON i.visit_id=v.id GROUP BY v.dept ORDER BY income DESC"),
"doctor_perf":q("SELECT s.name, s.title, COUNT(v.id) AS visits FROM staff s LEFT JOIN visits v ON v.doctor_id=s.id WHERE s.role='医生' GROUP BY s.id ORDER BY visits DESC"),
"todo":{"unpaid":q("SELECT i.id, i.invoice_no, i.payable, o.name AS owner_name FROM invoices i LEFT JOIN owners o ON o.id=i.owner_id WHERE i.status IN ('待缴费','部分缴费') ORDER BY i.id DESC LIMIT 8"),
"lab_pending":q("SELECT lo.id, lo.order_no, lo.panel, lo.status, p.name AS pet_name FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id WHERE lo.status IN ('已开单','已采样','检测中') ORDER BY lo.id DESC LIMIT 8"),
"followups":q("SELECT f.id, f.type, f.scheduled_at, o.name AS owner_name FROM followups f LEFT JOIN owners o ON o.id=f.owner_id WHERE f.status='待执行' ORDER BY f.scheduled_at LIMIT 8"),
"low_stock":q("SELECT id, name, stock_qty, safety_stock, unit FROM products WHERE stock_qty<=safety_stock AND status='在售' ORDER BY stock_qty LIMIT 8")},
"recent_visits":q("SELECT v.id, v.visit_no, v.visited_at, v.diagnosis, v.status, p.name AS pet_name, o.name AS owner_name, s.name AS doctor_name FROM visits v LEFT JOIN pets p ON p.id=v.pet_id LEFT JOIN owners o ON o.id=v.owner_id LEFT JOIN staff s ON s.id=v.doctor_id ORDER BY v.id DESC LIMIT 8")};
});
add('GET','/bill/stats',function(){
var today=money((val("SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE date(created_at)=date('now')") || 0));
var month=money((val("SELECT COALESCE(SUM(paid_amount),0) FROM invoices WHERE created_at>=date('now','start of month')") || 0));
return {"today_income":today,
"month_income":month,
"pending_amount":money((val("SELECT COALESCE(SUM(payable-paid_amount),0) FROM invoices WHERE status IN ('待缴费','部分缴费')") || 0)),
"pending_count":(val("SELECT COUNT(*) FROM invoices WHERE status IN ('待缴费','部分缴费')") || 0),
"today_count":(val("SELECT COUNT(*) FROM invoices WHERE date(created_at)=date('now')") || 0),
"by_day":q("SELECT date(created_at) AS date, ROUND(COALESCE(SUM(paid_amount),0),2) AS amount, COUNT(*) AS count FROM invoices WHERE created_at>=date('now','-13 day') GROUP BY date(created_at) ORDER BY date"),
"by_type":q("SELECT ii.item_type AS name, ROUND(COALESCE(SUM(ii.amount),0),2) AS value FROM invoice_items ii GROUP BY ii.item_type ORDER BY value DESC"),
"by_method":q("SELECT pay_method AS name, ROUND(COALESCE(SUM(paid_amount),0),2) AS value FROM invoices WHERE pay_method<>'' GROUP BY pay_method ORDER BY value DESC")};
});
add('GET','/crm/stats',function(){
var total=(val("SELECT COUNT(*) FROM owners") || 0);
var spend=(val("SELECT COALESCE(SUM(total_spend),0) FROM owners") || 0);
return {"customer_total":total,
"new_30d":(val("SELECT COUNT(*) FROM owners WHERE created_at >= date('now','-30 day')") || 0),
"total_spend":money(spend),
"avg_spend":(total?money((spend/total)):0),
"card_total":(val("SELECT COUNT(*) FROM membership_cards") || 0),
"card_balance":money((val("SELECT COALESCE(SUM(balance),0) FROM membership_cards") || 0)),
"pending_followup":(val("SELECT COUNT(*) FROM followups WHERE status='待执行'") || 0),
"unused_coupon":(val("SELECT COUNT(*) FROM coupons WHERE status='未使用'") || 0),
"by_stage":q("SELECT life_stage AS name, COUNT(*) AS value FROM owners GROUP BY life_stage ORDER BY value DESC"),
"by_level":q("SELECT member_level AS name, COUNT(*) AS value FROM owners GROUP BY member_level ORDER BY value DESC"),
"by_source":q("SELECT source_channel AS name, COUNT(*) AS value FROM owners GROUP BY source_channel ORDER BY value DESC"),
"top_customers":q("SELECT id, name, phone, total_spend, visit_count FROM owners ORDER BY total_spend DESC LIMIT 8"),
"campaign_roi":q("SELECT name, type, budget, reach_count, convert_count, revenue, CASE WHEN budget>0 THEN ROUND((revenue-budget)*1.0/budget*100,1) ELSE 0 END AS roi_percent FROM campaigns ORDER BY revenue DESC")};
});
add('GET','/inv/stats',function(){
var low=(val("SELECT COUNT(*) FROM products WHERE stock_qty<=safety_stock AND status='在售'") || 0);
var out=(val("SELECT COUNT(*) FROM products WHERE stock_qty<=0 AND status='在售'") || 0);
return {"product_total":(val("SELECT COUNT(*) FROM products WHERE status='在售'") || 0),
"stock_amount":money((val("SELECT COALESCE(SUM(stock_qty*purchase_price),0) FROM products WHERE status='在售'") || 0)),
"retail_amount":money((val("SELECT COALESCE(SUM(stock_qty*sale_price),0) FROM products WHERE status='在售'") || 0)),
"low_stock":low,
"out_of_stock":out,
"near_expire":(val("SELECT COUNT(*) FROM batches WHERE expire_date<=date('now','+90 day')") || 0),
"supplier_total":(val("SELECT COUNT(*) FROM suppliers") || 0),
"pending_po":(val("SELECT COUNT(*) FROM purchase_orders WHERE status IN ('待收货','部分收货')") || 0),
"by_category":q("SELECT category AS name, COUNT(*) AS value, ROUND(COALESCE(SUM(stock_qty*purchase_price),0),2) AS amount FROM products WHERE status='在售' GROUP BY category ORDER BY amount DESC"),
"low_list":q("SELECT id, name, sku, stock_qty, safety_stock, unit FROM products WHERE stock_qty<=safety_stock AND status='在售' ORDER BY stock_qty LIMIT 10"),
"month_in":money((val("SELECT COALESCE(SUM(change_qty),0) FROM inventory_logs WHERE change_qty>0 AND created_at>=date('now','-30 day')") || 0)),
"month_out":money(Math.abs((val("SELECT COALESCE(SUM(change_qty),0) FROM inventory_logs WHERE change_qty<0 AND created_at>=date('now','-30 day')") || 0)))};
});
add('GET','/lis/stats',function(){
return {"device_total":(val("SELECT COUNT(*) FROM lab_devices") || 0),
"device_online":(val("SELECT COUNT(*) FROM lab_devices WHERE status='在线'") || 0),
"order_today":(val("SELECT COUNT(*) FROM lab_orders WHERE date(ordered_at)=date('now')") || 0),
"order_pending":(val("SELECT COUNT(*) FROM lab_orders WHERE status IN ('已开单','已采样','检测中')") || 0),
"result_total":(val("SELECT COUNT(*) FROM lab_results") || 0),
"critical":(val("SELECT COUNT(*) FROM lab_results WHERE flag='危急'") || 0),
"by_panel":q("SELECT panel, COUNT(*) AS count FROM lab_orders GROUP BY panel ORDER BY count DESC")};
});
add('GET','/imaging/stats',function(){
return {"study_total":(val("SELECT COUNT(*) FROM imaging_studies") || 0),
"instance_total":(val("SELECT COUNT(*) FROM imaging_instances") || 0),
"today":(val("SELECT COUNT(*) FROM imaging_studies WHERE date(performed_at)=date('now')") || 0),
"by_modality":q("SELECT modality, COUNT(*) AS count FROM imaging_studies GROUP BY modality ORDER BY count DESC")};
});
})(window.Demo);
