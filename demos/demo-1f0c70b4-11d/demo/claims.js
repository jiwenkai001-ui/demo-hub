/* Pet medical insurance claims. All plans and estimates are fictional demo settings. */
(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,int,money,now,date,filters,paged}=D;
  const STATES=['草稿','院内审核','待补件','保险审核','待赔付','已赔付','已驳回','已撤回'];
  const MATERIALS=['宠物身份','保单凭证','病历与诊断','费用清单','结算凭证','检验影像','收款账户'];
  const INACTIVE=['已驳回','已撤回'],EDITABLE=['草稿','待补件'];
  const PLAN={insurer:'安宠保障（虚构演示）',plan_name:'宠物医疗基础方案（演示配置）',waiting_days:30,deductible:200,reimbursement_rate:70,per_claim_limit:2000,annual_limit:10000,hospital_type:'定点'};
  function text(v,max=4000){return String(v??'').trim().slice(0,max);}
  function masked(v){v=text(v,80).replace(/ /g,'');if(/^\*{4}[A-Za-z0-9]{4}$/.test(v))return v;if(v.length<6||!/^[A-Za-z0-9@._+\-]+$/.test(v)||!/[A-Za-z0-9]{4}$/.test(v))fail('收款账号请填写至少6位且末4位为字母数字的账号，系统仅保存末4位');return '****'+v.slice(-4);}
  function numeric(v,label,min=0,max=10000000){if(v===''||v===null||!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)fail(label+'无效');return Number(v);}
  function day(v,label){v=text(v,10);const d=new Date(v+'T12:00:00');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(d.getTime())||date(d)!==v)fail((label||'日期')+'无效');return v;}
  function shiftDay(v,n){const d=new Date(v+'T12:00:00');d.setDate(d.getDate()+n);return date(d);}
  function object(v,fallback){try{return JSON.parse(v||'');}catch(_){return fallback;}}
  function record(id){return get('medical_claims',int(id),'医疗报销申请');}
  function policy(id){const p=get('claim_policies',int(id),'宠物保单');p.pet=q1('SELECT p.*,o.name AS owner_name FROM pets p JOIN owners o ON o.id=p.owner_id WHERE p.id=?',[p.pet_id]);p.status=date()<p.start_date?'未生效':date()>p.end_date?'已到期':'保障中';return p;}
  function annualYear(p,incident){let y=Number(incident.slice(0,4))-Number(p.start_date.slice(0,4));if(incident.slice(5)<p.start_date.slice(5))y--;return Math.max(0,y);}
  function listSql(){return `SELECT c.*,p.name AS pet_name,o.name AS owner_name,i.invoice_no,pol.insurer,pol.plan_name FROM medical_claims c JOIN pets p ON p.id=c.pet_id JOIN owners o ON o.id=c.owner_id JOIN invoices i ON i.id=c.invoice_id JOIN claim_policies pol ON pol.id=c.policy_id`;}
  function history(id,action,from,to,comment,amount=null){insert('claim_history',{claim_id:id,action,from_status:from,to_status:to,comment:text(comment),amount,operator:'演示理赔专员',created_at:now()});}
  function invoice(id){const i=get('invoices',int(id),'医疗账单');i.visit=i.visit_id?q1('SELECT * FROM visits WHERE id=?',[i.visit_id]):null;i.diagnosis=i.visit?i.visit.diagnosis:'';i.items=q('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[id]);return i;}
  function calculation(c,i,p){
    const excluded=object(c.excluded_items,[]),factor=i.total_amount>0?Math.min(1,i.payable/i.total_amount):0;
    const items=i.items.map(it=>Object.assign({},it,{excluded:excluded.includes(it.id),eligible_amount:excluded.includes(it.id)?0:money(it.amount*factor),excluded_amount:excluded.includes(it.id)?money(it.amount*factor):0}));
    const eligible=money(Math.min(i.paid_amount,items.reduce((sum,it)=>sum+it.eligible_amount,0)));
    const reserved=money(val("SELECT COALESCE(SUM(approved_amount),0) FROM medical_claims WHERE policy_id=? AND benefit_year=? AND id<>? AND status IN ('待赔付','已赔付')",[c.policy_id,c.benefit_year,c.id])||0);
    const remaining=money(Math.max(0,p.annual_limit-reserved)),estimate=money(Math.max(0,Math.min((eligible-p.deductible)*p.reimbursement_rate/100,p.per_claim_limit,remaining)));
    return {items,medical_amount:money(i.paid_amount),eligible_amount:eligible,excluded_amount:money(i.paid_amount-eligible),deductible:p.deductible,rate:p.reimbursement_rate,per_claim_limit:p.per_claim_limit,annual_remaining:remaining,annual_limit:p.annual_limit,reserved_amount:reserved,estimate,formula:'min(max(合规费用－单次免赔额,0) × 报销比例, 单次限额, 年度剩余额度)',disclaimer:'仅按虚构演示参数估算，实际责任、免赔及赔付以承保公司审核和保险合同为准。'};
  }
  function detail(id){
    const c=record(id),p=Object.assign(policy(c.policy_id),object(c.policy_snapshot,{})),i=invoice(c.invoice_id);
    const calc=calculation(c,i,p);c.items=calc.items;delete calc.items;c.calculation=calc;c.policy=p;c.invoice=i;
    c.pet=q1('SELECT * FROM pets WHERE id=?',[c.pet_id]);c.owner=q1('SELECT id,name,phone FROM owners WHERE id=?',[c.owner_id]);
    c.materials=q('SELECT * FROM claim_materials WHERE claim_id=? ORDER BY id',[id]);c.history=q('SELECT * FROM claim_history WHERE claim_id=? ORDER BY id',[id]);c.payouts=q('SELECT * FROM claim_payouts WHERE claim_id=? ORDER BY id',[id]);
    c.excluded_items=object(c.excluded_items,[]);c.estimated_amount=calc.estimate;
    const checks=[],check=(label,passed,message,required=true)=>checks.push({label,passed:!!passed,required,message:passed?'已核对':message});
    check('保单与宠物归属',p.pet_id===c.pet_id&&i.pet_id===c.pet_id&&i.owner_id===c.owner_id,'保单、账单和宠物主人必须一致');
    check('医疗账单已结清',i.status==='已结清'&&i.paid_amount>0&&i.paid_amount>=i.payable,'账单须已结清且存在实际支付，退款后不可申请');
    check('诊断资料完整',i.visit&&text(i.diagnosis).length>0,'请先完善关联病历的诊断');
    check('事故日期在保障期',c.incident_date>=p.start_date&&c.incident_date<=p.end_date&&c.incident_date<=date(),'事故日期须在保期内且不能晚于今天');
    const waitingEnd=shiftDay(p.start_date,c.incident_type==='意外'?0:p.waiting_days);
    check('等待期核对',c.incident_date>=waitingEnd,'该次疾病仍在演示等待期内，最早可报日期 '+waitingEnd);
    check('事故与就诊日期',i.visit&&c.incident_date<=String(i.visit.visited_at).slice(0,10),'事故日期不能晚于关联就诊日期');
    check('无重复有效申请',!q1("SELECT id FROM medical_claims WHERE invoice_id=? AND id<>? AND status NOT IN ('已驳回','已撤回')",[c.invoice_id,c.id]),'同一账单已有有效报销申请');
    ['宠物身份','保单凭证','病历与诊断','费用清单','结算凭证'].forEach(cat=>check(cat,c.materials.some(m=>m.category===cat),'缺少'+cat+'，请上传或生成相应资料'));
    const diagnostics=i.visit_id&&(Number(val('SELECT COUNT(*) FROM lab_orders WHERE visit_id=?',[i.visit_id]))+Number(val('SELECT COUNT(*) FROM imaging_studies WHERE visit_id=?',[i.visit_id])))>0;
    check('检验影像资料',!diagnostics||c.materials.some(m=>m.category==='检验影像'),'该次就诊有关联检验影像，请补充报告资料',!!diagnostics);
    check('收款账户',text(c.payee_name).length>=2&&/^\*{4}[A-Za-z0-9]{4}$/.test(c.payee_account),'请填写收款人及演示结算账号；系统仅保存末4位');
    check('事故描述',text(c.description).length>0,'请填写本次疾病或意外的情况描述');
    check('赔付估算金额',calc.estimate>0,'扣除免赔额、除外项目及限额后暂无可赔金额');
    c.checks=checks;return c;
  }
  function requireChecks(c){const bad=c.checks.filter(x=>x.required&&!x.passed);if(bad.length)fail('未通过资料核验：'+bad.map(x=>x.label).join('、'));}
  function material(id,d,initial=false){
    const c=record(id);if(!initial&&!EDITABLE.includes(c.status))fail('仅草稿或待补件可修改报销材料');
    const category=text(d.category||d.type,30),kind=d.type==='generated'?'generated':d.data_url?'upload':'demo';if(!MATERIALS.includes(category))fail('材料类别无效');
    if(Number(val('SELECT COUNT(*) FROM claim_materials WHERE claim_id=?',[id]))>=15)fail('每份申请最多15份材料');
    let content='',dataURL='',mime=text(d.mime,80),size=0,name=text(d.name||category,120),note=text(d.note,2000);
    if(kind==='generated'){
      const i=invoice(c.invoice_id);if(!['病历与诊断','费用清单','结算凭证','检验影像'].includes(category))fail('该类别不能自动生成');
      const header='宠物医院演示系统资料快照\n仅供演示与理赔资料整理，不是正式发票、保单或保险审核结论。\n生成时间：'+now()+'\n账单：'+i.invoice_no+'\n';
      if(category==='病历与诊断'){if(!i.visit)fail('账单没有关联病历');content=header+'就诊：'+i.visit.visit_no+'\n诊断：'+(i.diagnosis||'未完善')+'\n主诉：'+(i.visit.chief_complaint||'')+'\n治疗：'+(i.visit.treatment||'')+'\n医嘱：'+(i.visit.advice||'');}
      if(category==='费用清单')content=header+i.items.map(x=>x.name+' × '+x.qty+'，¥'+money(x.amount)).join('\n')+'\n总额：¥'+i.total_amount+'；优惠：¥'+i.discount+'；应付：¥'+i.payable;
      if(category==='结算凭证')content=header+'账单状态：'+i.status+'\n实付：¥'+i.paid_amount+'\n最近结算时间：'+(i.paid_at||'未收款')+'\n支付方式：'+i.pay_method+'\n此文本不替代医院正式结算凭证。';
      if(category==='检验影像'){if(!i.visit_id)fail('账单没有关联就诊');const labs=q('SELECT order_no,panel,status,reported_at FROM lab_orders WHERE visit_id=?',[i.visit_id]),imgs=q('SELECT modality,body_part,findings,impression,status FROM imaging_studies WHERE visit_id=?',[i.visit_id]);if(!labs.length&&!imgs.length)fail('该就诊没有检验影像');content=header+'检验：\n'+JSON.stringify(labs,null,2)+'\n影像：\n'+JSON.stringify(imgs,null,2)+'\n原始报告及影像需在诊疗模块核对。';}
      mime='text/plain';name=category+'演示快照.txt';size=content.length*3;
      const old=q1("SELECT id FROM claim_materials WHERE claim_id=? AND category=? AND type='generated'",[id,category]);if(old)return get('claim_materials',old.id);
    }else if(kind==='upload'){
      dataURL=String(d.data_url||'');if(dataURL.length>4250000)fail('单份附件不能超过3MB');
      const match=dataURL.match(/^data:(image\/png|image\/jpeg|application\/pdf);base64,([A-Za-z0-9+/]*={0,2})$/);if(!match||!match[2])fail('仅支持PNG、JPG和PDF附件');
      if(mime&&mime!==match[1])fail('附件MIME与数据不一致');mime=match[1];let raw;try{raw=atob(match[2]);}catch(_){fail('附件编码无效');}size=raw.length;if(size>3*1024*1024)fail('单份附件不能超过3MB');
      if((mime==='image/png'&&!raw.startsWith('\x89PNG\r\n\x1a\n'))||(mime==='image/jpeg'&&!(raw.charCodeAt(0)===255&&raw.charCodeAt(1)===216&&raw.charCodeAt(2)===255))||(mime==='application/pdf'&&!raw.startsWith('%PDF-')))fail('附件内容与文件类型不一致');
    }else{if(!note)fail('请上传真实附件或填写明确的演示资料说明');content='【虚构演示材料，不可作为正式凭证】\n'+note;mime='text/plain';size=content.length*3;name=name+'（演示说明）';}
    if(Number(val('SELECT COALESCE(SUM(size_bytes),0) FROM claim_materials WHERE claim_id=?',[id]))+size>12*1024*1024)fail('每份申请材料总量不能超过12MB');
    const mid=insert('claim_materials',{claim_id:id,category,type:kind,name,mime,data_url:dataURL,content,note,size_bytes:size,is_demo:kind==='upload'?0:1,created_at:now()});
    if(!initial)history(id,'补充材料',c.status,c.status,category+'：'+name);return get('claim_materials',mid);
  }
  function savePolicy(id,d){
    const old=id?get('claim_policies',id,'保单'):null;if(old&&q1("SELECT id FROM medical_claims WHERE policy_id=? AND status NOT IN ('草稿','已驳回','已撤回')",[id]))fail('该保单存在处理中或已赔付申请，不能修改保障参数');
    d=Object.assign({},old||PLAN,d);const pet=get('pets',int(d.pet_id),'宠物');
    if(old&&pet.id!==old.pet_id&&q1('SELECT id FROM medical_claims WHERE policy_id=?',[id]))fail('保单已有报销案件，不能变更关联宠物；已有案件按创建时条款快照核验');
    const data={pet_id:pet.id,owner_id:pet.owner_id,insurer:text(d.insurer,100),plan_name:text(d.plan_name,100),policy_no:text(d.policy_no,100),start_date:day(d.start_date,'保障开始日期'),end_date:day(d.end_date,'保障结束日期'),waiting_days:Math.trunc(numeric(d.waiting_days,'等待期',0,365)),deductible:money(numeric(d.deductible,'免赔额')),reimbursement_rate:numeric(d.reimbursement_rate,'报销比例',0,100),per_claim_limit:money(numeric(d.per_claim_limit,'单次限额',.01)),annual_limit:money(numeric(d.annual_limit,'年度限额',.01)),hospital_type:text(d.hospital_type,10),note:text(d.note),created_at:old?old.created_at:now()};
    if(!data.insurer||!data.plan_name||!data.policy_no)fail('保险机构、方案名称和保单号必填');if(data.start_date>data.end_date)fail('保单结束日期不能早于开始日期');if(!['定点','非定点'].includes(data.hospital_type))fail('医院类型无效');if(data.per_claim_limit>data.annual_limit)fail('单次限额不能超过年度限额');
    if(q1('SELECT id FROM claim_policies WHERE policy_no=? AND id<>?',[data.policy_no,id||0]))fail('保单号已存在');
    return policy(id?(update('claim_policies',id,data),id):insert('claim_policies',data));
  }
  function create(d){
    const i=invoice(d.invoice_id),p=policy(d.policy_id);if(!i.pet_id||i.pet_id!==p.pet_id||i.owner_id!==p.owner_id)fail('保单、宠物与医疗账单归属不一致');if(i.status!=='已结清'||i.paid_amount<=0)fail('请先选择已结清且有实付金额的医疗账单');
    if(q1("SELECT id FROM medical_claims WHERE invoice_id=? AND status NOT IN ('已驳回','已撤回')",[i.id]))fail('该账单已有有效报销申请');
    const incident=day(d.incident_date||String(i.visit&&i.visit.visited_at||i.created_at).slice(0,10),'事故日期');if(!['疾病','意外'].includes(d.incident_type||'疾病'))fail('事故类型无效');
    const snapshot=Object.assign({},p);delete snapshot.pet;delete snapshot.status;
    const id=insert('medical_claims',{claim_no:D.next('CL','medical_claims','claim_no'),invoice_id:i.id,policy_id:p.id,owner_id:i.owner_id,pet_id:i.pet_id,incident_type:d.incident_type||'疾病',incident_date:incident,description:text(d.description),payee_name:text(d.payee_name,80),payee_account:d.payee_account?masked(d.payee_account):'',excluded_items:'[]',policy_snapshot:JSON.stringify(snapshot),benefit_year:annualYear(p,incident),status:'草稿',resume_status:'院内审核',approved_amount:0,created_at:now(),updated_at:now(),submitted_at:null,paid_at:null});
    history(id,'创建申请','', '草稿','根据已结清医疗账单创建，赔付不计医院收入。');
    if(i.visit)material(id,{type:'generated',category:'病历与诊断'},true);material(id,{type:'generated',category:'费用清单'},true);material(id,{type:'generated',category:'结算凭证'},true);
    if(i.visit_id&&(Number(val('SELECT COUNT(*) FROM lab_orders WHERE visit_id=?',[i.visit_id]))+Number(val('SELECT COUNT(*) FROM imaging_studies WHERE visit_id=?',[i.visit_id])))>0)material(id,{type:'generated',category:'检验影像'},true);return detail(id);
  }
  function edit(id,d){
    const c=record(id);if(!EDITABLE.includes(c.status))fail('仅草稿或待补件申请可编辑');const changes={};
    ['description','payee_name','payee_account'].forEach(k=>{if(k in d){if(k==='payee_account'){if(text(d[k]))changes[k]=masked(d[k]);}else changes[k]=text(d[k],k==='description'?4000:80);}});
    if(d.incident_type){if(!['疾病','意外'].includes(d.incident_type))fail('事故类型无效');changes.incident_type=d.incident_type;}
    if(d.incident_date){changes.incident_date=day(d.incident_date,'事故日期');changes.benefit_year=annualYear(object(c.policy_snapshot,policy(c.policy_id)),changes.incident_date);}
    if(d.excluded_item_ids!==undefined&&d.excluded_items===undefined)d.excluded_items=d.excluded_item_ids;
    if(d.excluded_items!==undefined){if(!Array.isArray(d.excluded_items))fail('除外项目格式无效');const available=q('SELECT id FROM invoice_items WHERE invoice_id=?',[c.invoice_id]).map(x=>x.id),ids=[...new Set(d.excluded_items.map(x=>int(x)))].sort((a,b)=>a-b);if(ids.some(x=>!available.includes(x)))fail('除外项目不属于该账单');changes.excluded_items=JSON.stringify(ids);}
    const sensitive=['description','payee_name','payee_account','incident_type','incident_date'].some(k=>k in changes&&changes[k]!==c[k])||('excluded_items' in changes&&changes.excluded_items!==JSON.stringify(object(c.excluded_items,[]).slice().sort((a,b)=>a-b)));
    if(c.status==='待补件'&&sensitive){changes.resume_status='院内审核';changes.approved_amount=0;}
    changes.updated_at=now();update('medical_claims',id,changes);history(id,'编辑申请',c.status,c.status,sensitive&&c.status==='待补件'?'关键资料变更，补件重提后须重新院内审核':'更新事故、账户或除外项目');return detail(id);
  }
  function action(id,d){
    let c=detail(id),to=c.status,change={},label='',comment=text(d.comment);const allowed=states=>{if(!states.includes(c.status))fail('当前状态不支持此操作，请刷新申请');};const reason=()=>{if(!comment)fail('请填写处理意见或原因');};
    switch(d.action){
      case 'submit':allowed(['草稿']);requireChecks(c);to='院内审核';change.submitted_at=now();label='提交申请';break;
      case 'hospital_pass':allowed(['院内审核']);requireChecks(c);reason();to='保险审核';label='院内审核通过';break;
      case 'request_material':allowed(['院内审核','保险审核']);reason();change.resume_status=c.status;to='待补件';label='要求补件';break;
      case 'resubmit':allowed(['待补件']);requireChecks(c);to=c.resume_status==='保险审核'?'保险审核':'院内审核';label='补件重提';break;
      case 'approve':allowed(['保险审核']);requireChecks(c);reason();change.approved_amount=money(numeric(d.approved_amount,'核准金额',.01));if(change.approved_amount>c.calculation.estimate)fail('核准金额超过当前估算或剩余额度');to='待赔付';label='保险审核通过';break;
      case 'reject':allowed(['院内审核','保险审核','待补件']);reason();to='已驳回';label='驳回申请';break;
      case 'withdraw':allowed(['草稿','院内审核','保险审核','待补件','待赔付']);reason();to='已撤回';label='撤回申请';break;
      case 'reopen':allowed(['已驳回','已撤回']);if(q1("SELECT id FROM medical_claims WHERE invoice_id=? AND id<>? AND status NOT IN ('已驳回','已撤回')",[c.invoice_id,c.id]))fail('该账单已有其他有效申请');to='草稿';change.approved_amount=0;change.paid_at=null;label='重新编辑';break;
      case 'pay':{allowed(['待赔付']);requireChecks(c);const payout=text(d.payout_no,100);if(!payout)fail('赔付凭证号必填');const paid=day(String(d.paid_at||'').slice(0,10),'赔付日期');if(paid>date())fail('赔付日期不能晚于今天');if(paid<String(c.submitted_at||c.created_at).slice(0,10))fail('赔付日期不能早于提交申请日期');if(d.amount!==undefined&&money(d.amount)!==c.approved_amount)fail('实付金额须等于核准金额');if(q1('SELECT id FROM claim_payouts WHERE payout_no=?',[payout]))fail('赔付凭证号已存在');insert('claim_payouts',{claim_id:id,payout_no:payout,amount:c.approved_amount,kind:'赔付',paid_at:paid,comment:comment||'演示保险赔款，独立于医院营收。',created_at:now()});to='已赔付';change.paid_at=paid;label='登记赔付';break;}
      case 'reverse':{allowed(['已赔付']);reason();const net=money(val('SELECT COALESCE(SUM(amount),0) FROM claim_payouts WHERE claim_id=?',[id])||0);if(net<=0)fail('该申请已冲正');insert('claim_payouts',{claim_id:id,payout_no:D.next('REV','claim_payouts','payout_no'),amount:-net,kind:'冲正',paid_at:date(),comment,created_at:now()});to='已撤回';label='赔付冲正';break;}
      default:fail('报销处理动作无效');
    }
    change.status=to;change.updated_at=now();update('medical_claims',id,change);history(id,label,c.status,to,comment||label,change.approved_amount??null);return detail(id);
  }
  D.claimRefundGuard=function(invoiceId){if(q1("SELECT id FROM medical_claims WHERE invoice_id=? AND status NOT IN ('草稿','已撤回','已驳回')",[invoiceId]))fail('该账单有关联处理中或已赔付的医疗报销，请先撤回或冲正申请后退费');};
  D.claimInvoiceSummary=function(invoiceId){return q1("SELECT id,claim_no,status FROM medical_claims WHERE invoice_id=? ORDER BY CASE WHEN status IN ('已驳回','已撤回') THEN 1 ELSE 0 END,id DESC LIMIT 1",[invoiceId]);};
  function options(){return {pets:q('SELECT p.id,p.name,p.owner_id,p.species,o.name AS owner_name FROM pets p JOIN owners o ON o.id=p.owner_id ORDER BY p.id DESC'),invoices:q(`SELECT i.id,i.invoice_no,i.pet_id,p.name AS pet_name,o.name AS owner_name,i.visit_id,v.diagnosis,i.payable,i.paid_amount,i.status,v.visited_at FROM invoices i LEFT JOIN pets p ON p.id=i.pet_id LEFT JOIN owners o ON o.id=i.owner_id LEFT JOIN visits v ON v.id=i.visit_id WHERE i.status='已结清' AND i.paid_amount>0 ORDER BY i.id DESC`),plans:[Object.assign({id:'demo-basic',name:PLAN.plan_name,description:'虚构配置示例，非在售保险产品'},PLAN)],material_types:MATERIALS,statuses:STATES};}
  function claimSummary(c){const p=Object.assign({},policy(c.policy_id),object(c.policy_snapshot,{}));c.estimated_amount=calculation(c,invoice(c.invoice_id),p).estimate;c.paid_amount=money(val('SELECT COALESCE(SUM(amount),0) FROM claim_payouts WHERE claim_id=?',[c.id]));return c;}
  function overview(){return {kpi:{draft:Number(val("SELECT COUNT(*) FROM medical_claims WHERE status='草稿'")),pending:Number(val("SELECT COUNT(*) FROM medical_claims WHERE status IN ('院内审核','保险审核')")),need_material:Number(val("SELECT COUNT(*) FROM medical_claims WHERE status='待补件'")),approved:Number(val("SELECT COUNT(*) FROM medical_claims WHERE status='待赔付'")),paid_amount:money(val('SELECT COALESCE(SUM(amount),0) FROM claim_payouts'))},recent:q(listSql()+' ORDER BY c.updated_at DESC,c.id DESC LIMIT 8').map(claimSummary),stages:STATES.map(status=>({status,name:status,count:Number(val('SELECT COUNT(*) FROM medical_claims WHERE status=?',[status]))}))};}
  function list(p){const result=paged(listSql(),filters({'c.status':p.status},p.keyword,['c.claim_no','p.name','o.name','i.invoice_no','pol.policy_no']),'c.id DESC',p);result.items=result.items.map(claimSummary);return result;}
  function policies(p){let rows=q('SELECT pol.*,p.name AS pet_name,o.name AS owner_name FROM claim_policies pol JOIN pets p ON p.id=pol.pet_id JOIN owners o ON o.id=pol.owner_id ORDER BY pol.id DESC');rows=rows.map(x=>Object.assign(x,{status:date()<x.start_date?'未生效':date()>x.end_date?'已到期':'保障中'}));if(p.status&&p.status!=='all')rows=rows.filter(x=>x.status===p.status);if(p.keyword)rows=rows.filter(x=>[x.pet_name,x.owner_name,x.insurer,x.plan_name,x.policy_no].some(s=>String(s).includes(p.keyword)));return {items:rows};}
  function guide(){return {sections:[{title:'这是宠物医疗保险报销',content:'报销关联宠物、保单、实际就诊和已结清医疗账单。OA 中员工差旅、采购等费用审批保持独立。本模块不是保险销售、承保或真实理赔通道。'},{title:'估算口径与除外项目',content:'示例配置：疾病等待30天、每次免赔200元、报销70%、每次最多2000元、保单年度最多10000元。按实际已付医疗费用扣除除外项目后估算；优惠按项目金额比例分摊。所有参数均可按展示需要配置，不代表真实保险产品条款。'},{title:'资料与实际申请',content:'通常需核验宠物身份、保险合同、病历诊断、费用清单、实际结算凭证、相关检验影像和收款账户；具体责任、除外、等待期、医院资质及材料要求以保险合同与承保公司通知为准。自动生成文本只是演示资料快照，不是正式发票。'},{title:'赔款与医院营收分开',content:'保险赔款单独登记，既不重复增加医院收入，也不改写医疗账单已付金额。待赔付与已赔付占用保单年度额度；撤回或冲正释放额度。保险审核与赔付登记均为本地流程模拟。'},{title:'附件与数据保存',content:'支持PNG、JPG、PDF，单份不超过3MB，每单最多15份、合计不超过12MB。数据和附件仅保存在当前浏览器；真实资料请按实际机构要求整理并通过官方渠道提交。'}],sources:[{title:'平安（中国）· 爱宠医保：材料及官方申请渠道',url:'https://www.pingan.com/official/productSeo/1838a90996184237978335db4173aca9'},{title:'平安（中国）· 宠物医疗保险：先付后赔及有条件直赔',url:'https://www.pingan.com/official/productSeo/35913d8c46634089a28860efa8a23ae8'},{title:'ezyVet · 诊疗记录、账单与客户门户',url:'https://www.ezyvet.com/features'},{title:'Shepherd · 医疗记录与流程跟踪',url:'https://www.shepherd.vet/features/'},{title:'PetSure（澳大利亚）· 理赔与资料流程',url:'https://petsure.com.au/claims/'},{title:'ManyPets（美国）· 先付后赔与补充病史',url:'https://manypets.com/us/claims/'},{title:'Pumpkin（美国）· 逐项发票与有条件提前付款',url:'https://www.pumpkin.care/claims'}],steps:['关联宠物保单','选择已结清医疗账单','补充身份保单等材料','院内核对与补件','保险审核并核准金额','登记赔付与查询进度']};}
  add('GET','/claims/overview',overview);add('GET','/claims/stats',overview);add('GET','/claims/options',options);add('GET','/claims/guide',guide);
  add('GET','/claims/policies',policies);add('POST','/claims/policies',(p,d)=>savePolicy(null,d));add('GET','/claims/policies/{id}',p=>policy(p.id));add('PUT','/claims/policies/{id}',(p,d)=>savePolicy(p.id,d));
  ['/claims/claims','/claims'].forEach(base=>{add('GET',base,list);add('POST',base,(p,d)=>create(d));add('GET',base+'/{id}',p=>detail(p.id));add('PUT',base+'/{id}',(p,d)=>edit(p.id,d));add('POST',base+'/{id}/action',(p,d)=>action(p.id,d));add('POST',base+'/{id}/actions',(p,d)=>action(p.id,d));add('POST',base+'/{id}/materials',(p,d)=>material(p.id,d));});
  add('DELETE','/claims/materials/{id}',p=>{const m=get('claim_materials',p.id,'材料'),c=record(m.claim_id);if(!EDITABLE.includes(c.status))fail('仅草稿或待补件可删除材料');run('DELETE FROM claim_materials WHERE id=?',[p.id]);history(c.id,'删除材料',c.status,c.status,m.category+'：'+m.name);return {ok:true};});
  function publicClaim(id,full=false){const c=detail(id),result={id:c.id,claim_no:c.claim_no,invoice_id:c.invoice_id,invoice_no:c.invoice.invoice_no,pet_id:c.pet_id,pet_name:c.pet.name,insurer:c.policy.insurer,plan_name:c.policy.plan_name,start_date:c.policy.start_date,end_date:c.policy.end_date,policy:{insurer:c.policy.insurer,plan_name:c.policy.plan_name,start_date:c.policy.start_date,end_date:c.policy.end_date},pet:{name:c.pet.name},invoice:{invoice_no:c.invoice.invoice_no},status:c.status,incident_type:c.incident_type,incident_date:c.incident_date,created_at:c.created_at,updated_at:c.updated_at,submitted_at:c.submitted_at,paid_at:c.paid_at,estimated_amount:c.calculation.estimate,approved_amount:c.approved_amount,paid_amount:money(c.payouts.reduce((sum,x)=>sum+x.amount,0)),account_masked:c.payee_account,calculation:c.calculation};if(full){result.materials=c.materials.map(m=>({id:m.id,name:m.name,category:m.category,type:m.type,is_demo:m.is_demo,created_at:m.created_at}));result.history=c.history.map(h=>({id:h.id,action:h.action,from_status:h.from_status,to_status:h.to_status,comment:h.comment,amount:h.amount,created_at:h.created_at}));result.payouts=c.payouts.map(p=>({id:p.id,amount:p.amount,kind:p.kind,paid_at:p.paid_at,comment:p.comment}));result.checks=c.checks;result.description=c.description;}return result;}
  add('GET','/portal/{oid}/claims',p=>({items:q('SELECT id FROM medical_claims WHERE owner_id=?'+(int(p.invoice_id)?' AND invoice_id=?':'')+' ORDER BY id DESC',int(p.invoice_id)?[p.oid,int(p.invoice_id)]:[p.oid]).map(c=>publicClaim(c.id))}));
  add('GET','/portal/{oid}/claims/{id}',p=>{const c=record(p.id);if(c.owner_id!==p.oid)fail('报销申请不存在');return publicClaim(p.id,true);});
  D.claimsInit=function(){
    run('CREATE TABLE IF NOT EXISTS claim_versions (version TEXT PRIMARY KEY)');
    run(`CREATE TABLE IF NOT EXISTS claim_policies (id INTEGER PRIMARY KEY AUTOINCREMENT,pet_id INTEGER NOT NULL REFERENCES pets(id),owner_id INTEGER NOT NULL REFERENCES owners(id),insurer TEXT NOT NULL,plan_name TEXT NOT NULL,policy_no TEXT UNIQUE NOT NULL,start_date TEXT NOT NULL,end_date TEXT NOT NULL,waiting_days INTEGER NOT NULL,deductible REAL NOT NULL,reimbursement_rate REAL NOT NULL,per_claim_limit REAL NOT NULL,annual_limit REAL NOT NULL,hospital_type TEXT NOT NULL,note TEXT DEFAULT '',created_at TEXT NOT NULL)`);
    run(`CREATE TABLE IF NOT EXISTS medical_claims (id INTEGER PRIMARY KEY AUTOINCREMENT,claim_no TEXT UNIQUE NOT NULL,invoice_id INTEGER NOT NULL REFERENCES invoices(id),policy_id INTEGER NOT NULL REFERENCES claim_policies(id),owner_id INTEGER NOT NULL REFERENCES owners(id),pet_id INTEGER NOT NULL REFERENCES pets(id),incident_type TEXT NOT NULL,incident_date TEXT NOT NULL,description TEXT DEFAULT '',payee_name TEXT DEFAULT '',payee_account TEXT DEFAULT '',excluded_items TEXT DEFAULT '[]',policy_snapshot TEXT NOT NULL,benefit_year INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL,resume_status TEXT DEFAULT '院内审核',approved_amount REAL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,submitted_at TEXT,paid_at TEXT)`);
    run(`CREATE TABLE IF NOT EXISTS claim_materials (id INTEGER PRIMARY KEY AUTOINCREMENT,claim_id INTEGER NOT NULL REFERENCES medical_claims(id),category TEXT NOT NULL,type TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,data_url TEXT DEFAULT '',content TEXT DEFAULT '',note TEXT DEFAULT '',size_bytes INTEGER DEFAULT 0,is_demo INTEGER DEFAULT 0,created_at TEXT NOT NULL)`);
    run(`CREATE TABLE IF NOT EXISTS claim_history (id INTEGER PRIMARY KEY AUTOINCREMENT,claim_id INTEGER NOT NULL REFERENCES medical_claims(id),action TEXT NOT NULL,from_status TEXT,to_status TEXT,comment TEXT DEFAULT '',amount REAL,operator TEXT,created_at TEXT NOT NULL)`);
    run(`CREATE TABLE IF NOT EXISTS claim_payouts (id INTEGER PRIMARY KEY AUTOINCREMENT,claim_id INTEGER NOT NULL REFERENCES medical_claims(id),payout_no TEXT UNIQUE NOT NULL,amount REAL NOT NULL,kind TEXT NOT NULL,paid_at TEXT NOT NULL,comment TEXT DEFAULT '',created_at TEXT NOT NULL)`);
    run('CREATE INDEX IF NOT EXISTS idx_claim_invoice ON medical_claims(invoice_id)');run('CREATE INDEX IF NOT EXISTS idx_claim_policy_year ON medical_claims(policy_id,benefit_year,status)');
    if(q1("SELECT version FROM claim_versions WHERE version='medical-v1'")){
      if(q1("SELECT version FROM claim_versions WHERE version='privacy-v2'"))return false;
      q('SELECT id,payee_account FROM medical_claims').forEach(c=>{let a='';try{if(c.payee_account)a=masked(c.payee_account);}catch(_){}update('medical_claims',c.id,{payee_account:a});});
      insert('claim_versions',{version:'privacy-v2'});return true;
    }
    const examples=q(`SELECT i.*,v.diagnosis,v.visited_at,o.name AS owner_name FROM invoices i JOIN visits v ON v.id=i.visit_id JOIN owners o ON o.id=i.owner_id WHERE i.status='已结清' AND i.paid_amount>250 AND v.diagnosis<>'' ORDER BY i.id DESC LIMIT 9`);
    const policyIds={};examples.forEach((inv,index)=>{
      let pid=policyIds[inv.pet_id];const incident=String(inv.visited_at).slice(0,10);
      if(!pid){const p=savePolicy(null,Object.assign({},PLAN,{pet_id:inv.pet_id,policy_no:'DEMO-PET-'+date().replace(/-/g,'')+'-'+inv.pet_id,start_date:shiftDay(incident,-120),end_date:shiftDay(incident,245),note:'完全虚构的展示保单，保障参数并非任何真实产品；关联宠物与医疗数据仅用于本地演示。'}));pid=p.id;policyIds[inv.pet_id]=pid;}
      let c=create({invoice_id:inv.id,policy_id:pid,incident_type:index%3===0?'意外':'疾病',incident_date:incident,description:'虚构报销案例：'+inv.diagnosis+'，基于已结清账单整理医疗费用材料。',payee_name:inv.owner_name,payee_account:'DEMO-PAYEE-'+String(inv.owner_id).padStart(4,'0')});
      material(c.id,{category:'宠物身份',name:'宠物身份演示说明',note:'演示身份资料：应核验宠物姓名、种类、照片或芯片信息，不是真实身份凭证。'},true);
      material(c.id,{category:'保单凭证',name:'保单演示说明',note:'虚构保单凭证：'+policy(pid).policy_no+'。实际申请须提供真实保险合同。'},true);
      if(index===0)return;
      try{c=action(c.id,{action:'submit'});if(index===1)return;if(index===2){action(c.id,{action:'request_material',comment:'请补充正式费用结算凭证，当前文本仅为演示快照。'});return;}c=action(c.id,{action:'hospital_pass',comment:'演示院内核验：宠物、病历与医疗结算信息一致。'});if(index===3)return;if(index===6){action(c.id,{action:'reject',comment:'演示驳回案例：需进一步核实病史与保障责任。'});return;}if(index===7){action(c.id,{action:'withdraw',comment:'演示撤回案例：宠主需核对报销材料后重新整理。'});return;}c=action(c.id,{action:'approve',comment:'仅演示保险审核结果，按虚构参数核准。',approved_amount:c.calculation.estimate});if(index===4)return;action(c.id,{action:'pay',payout_no:'DEMO-PAYOUT-'+date().replace(/-/g,'')+'-'+index,paid_at:date(),comment:'演示赔款登记，不计医院营业收入。'});}catch(e){history(c.id,'演示核验提示',record(c.id).status,record(c.id).status,e.message);}
    });
    insert('claim_versions',{version:'medical-v1'});insert('claim_versions',{version:'privacy-v2'});return true;
  };
})(window.Demo);
