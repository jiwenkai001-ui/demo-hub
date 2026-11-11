/* Keep action availability in step with local role rules, including asynchronous dialogs. */
(function(){
 'use strict';
 App.canAction=(method,path,data)=>Demo.systemCan?Demo.systemCan(method,path,data):true;
 function apply(){
  if(!App.access)return;
  const a=App.access,rid=a.role_id,key=document.querySelector('#view')?.dataset.view;
  // Restore only controls this adapter disabled; retain business-state validation.
  document.querySelectorAll('[data-role-disabled]').forEach(b=>{b.disabled=false;b.removeAttribute('data-role-disabled');b.removeAttribute('title');});
  const deny=(selector,reason)=>document.querySelectorAll(selector).forEach(b=>{if(!b.disabled){b.disabled=true;b.dataset.roleDisabled='1';b.title=reason||'当前岗位仅可查看，此操作请交由负责岗位处理';}});
  if(rid!==1){
   if(rid!==3)deny('#care-rx-template-new,#care-assistants,#care-new-template,#care-new-document,[data-template],[data-rx-template],[data-care-order],[data-care-discharge],[data-document-edit],[data-document-request],[data-document-withdraw],[data-document-sign],[data-order][data-action="cancel"],#new-specialty,[data-new-specialty],[data-specialty-edit],[data-specialty-complete],[data-specialty-revise]','医嘱、处方、出院决策和医疗文书由医生处理');
   if(!App.canRead('visits'))deny('[data-care-visit],[data-rx-visit]');
   if(!App.canRead('billing'))deny('[data-care-invoice]');
   if(!App.canWrite('billing'))deny('[data-care-deposit]');
   deny('#oa-edit-schedule,[data-shift-staff],#oa-new-notice,#oa-new-document','排班、公告与制度由院长/管理员维护');
   document.querySelectorAll('[data-task-done],[data-task-edit]').forEach(b=>{const id=Number(b.dataset.taskDone||b.dataset.taskEdit);if(!App.canAction('PUT','/api/oa/tasks/'+id,{}))deny('[data-task-done="'+id+'"],[data-task-edit="'+id+'"]','仅可更新本人负责的任务');});
   // Actor selectors default to the current employee; assignee selectors remain available to doctors.
   document.querySelectorAll('.mask select[name="staff_id"],.mask select[name="applicant_id"]').forEach(s=>{const id=String(a.staff_id);if([...s.options].some(o=>o.value===id)){[...s.options].forEach(o=>{if(o.value!==id)o.remove();});s.value=id;}});
   if(key==='billing'&&!App.canWrite('billing'))deny('#pay,#refund,#disc,#coupon,#invoice-deposit,#btn-day-close');
   if(key==='patients'&&!App.canWrite('patients'))deny('#btn-new,#add-pet,#edit-pet,[data-edit],[data-act="edit"],[data-act="pet"],[data-act="newpet"]');
   if(key==='patients'&&!App.canWrite('crm'))deny('#add-follow');
   if(key==='patients'&&!App.canWrite('appointments'))deny('#pet-appointment');
   if(key==='patients'&&!App.canRead('visits'))deny('#pet-visit');
   if(key==='operations'&&rid===5)deny('#op-sale-new,#op-warehouse-new,#op-ledger-new,#op-rules,[data-ledger-void],#op-sale-cancel,#op-sale-refund,#op-sale-pay');
   if(key==='claims'&&rid===2)deny('[data-claim-action="hospital_pass"],[data-claim-action="request_material"],[data-claim-action="approve"],[data-claim-action="reject"],[data-claim-action="pay"],[data-claim-action="reverse"]','审核及赔付由院长或财务处理');
   if(key==='services'&&rid!==3)deny('#sv-execute','免疫及健康计划执行须由医生确认');
   if(key==='services'&&rid===3)deny('#sv-new-catalog,#sv-purchase,[data-buy],#sv-order-cancel,#sv-use,#sv-reverse-use,#sv-send,#sv-points,[data-pet-action]','权益及客户运营由前台处理');
   if(key==='services'&&!App.canRead('crm'))deny('#sv-follow,#sv-crm,[data-jump="crm"]');
   if(key==='services'&&!App.canRead('billing'))deny('#sv-order-bill');
   if(key==='inventory'&&rid===5)deny('#inventory-retail','护理药房负责库存，零售结算请交由前台或财务');
  }
 }
 App.applyRoleAccess=apply;
 let pending=false;
 const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;apply();});});
 for(const id of ['view','modal-root']){const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true});}
})();
