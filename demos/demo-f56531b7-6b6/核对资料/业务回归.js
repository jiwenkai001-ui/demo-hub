/* Executed in an isolated browser by 验收检查.py. */
()=>{
 const O=window.Ops,C=O.commands,results=[];
 const assert=(v,m)=>{if(!v)throw Error(m);};
 const reject=(fn,m)=>{let caught=false;try{fn();}catch{caught=true;}assert(caught,m);};
 const eq=(a,b,m)=>assert(JSON.stringify(a)===JSON.stringify(b),m+': '+JSON.stringify([a,b]));
 const db=()=>O.db;
 const check=(name,fn)=>{O.login('admin','123456');O.reset();try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
 const product={name:'验收跑鞋',sku:'TEST-001',brand:'Test',category:'运动鞋',price:300,cost:100,safe:8,arrived:O.day(),supplier:'测试供应商',front:4,back:20};
 check('01 数字与日期边界：空值、负值、小数库存、Infinity、非法日期原子回滚',()=>{
   for(const [key,value] of [['front',-1],['front',.5],['front',''],['front',Infinity],['price',''],['price',-2],['price',Infinity],['arrived','2026-02-30']]){const before=O.backup();reject(()=>C.product({...product,[key]:value}),'不合法输入未拒绝 '+key);eq(O.backup(),before,'异常后数据应不变');}
   C.product(product);reject(()=>C.product(product),'重复SKU');
 });
 check('02 双仓调拨守恒、负库存拦截、盘点不丢滞销状态',()=>{
   const before=db().products.find(p=>p.id==='p2');assert(O.productStatus(before).includes('滞销'),'期初滞销');
   const sum=before.stocks.front+before.stocks.back;C.transfer({productId:'p2',from:'back',to:'front',qty:4});
   const after=db().products.find(p=>p.id==='p2');eq(after.stocks.front+after.stocks.back,sum,'调拨守恒');assert(O.productStatus(after).includes('滞销'),'调拨保留滞销');
   C.adjust({productId:'p2',warehouse:'front',qty:2,reason:'盘点测试'});assert(O.productStatus(db().products.find(p=>p.id==='p2')).includes('库存预警'),'盘点后动态预警');
   reject(()=>C.transfer({productId:'p2',from:'front',to:'back',qty:99}),'不足库存');reject(()=>C.adjust({productId:'p2',warehouse:'fake',qty:3,reason:'测试'}),'不存在的仓库');
 });
 check('03 采购审批入库、加权成本与重复审批保护',()=>{
   const p=db().products[0],stock=p.stocks.back,total=p.stocks.front+p.stocks.back,cost=p.cost;C.purchase({productId:p.id,warehouse:'back',qty:10,cost:200,supplier:'验收供应商'});const id=db().purchases[0].id;
   eq(db().products[0].stocks.back,stock,'审批前不入库');C.auditPurchase(id);eq(db().products[0].stocks.back,stock+10,'审批后入库');eq(db().products[0].cost,O.money((total*cost+2000)/(total+10)),'加权成本');reject(()=>C.auditPurchase(id),'重复审批');
 });
 check('04 发券→核销收银→整单退款：库存、积分、券、资金与消费冲销',()=>{
   const p=db().products.find(p=>p.id==='p1'),u=db().members.find(u=>u.id==='u1'),stock=p.stocks.front,points=u.points,spend=O.memberSpend(u);
   const coupon=C.issue({memberId:'u1',templateId:'ct1'}),sale=C.sale({merchantId:'m1',memberId:'u1',productId:'p1',qty:2,couponId:coupon,channel:'微信支付'});
   const s=db().sales.find(s=>s.id===sale);eq(s.paid,399,'五折实收');eq(db().products.find(p=>p.id==='p1').stocks.front,stock-2,'出库');eq(db().members[0].points,points+399,'积分');eq(O.memberSpend(db().members[0]),spend+399,'累计消费');eq(db().coupons.find(c=>c.id===coupon).status,'已使用','核销');
   C.requestRefund(sale);C.refund(sale);eq(db().products.find(p=>p.id==='p1').stocks.front,stock,'回库');eq(db().members[0].points,points,'积分冲销');eq(O.memberSpend(db().members[0]),spend,'消费冲销');eq(db().coupons.find(c=>c.id===coupon).status,'可用','券恢复');eq(O.sum(db().payments.filter(p=>p.saleId===sale),p=>p.amount),0,'收款退款净额零');reject(()=>C.refund(sale),'重复退款');
 });
 check('05 券门槛、所有权、有效期、限领与失败收银回滚',()=>{
   C.issue({memberId:'u2',templateId:'ct2'});reject(()=>C.issue({memberId:'u2',templateId:'ct2'}),'限领');const coupon=db().coupons.find(c=>c.memberId==='u2').id,before=O.backup();
   reject(()=>C.sale({merchantId:'m1',memberId:'u1',productId:'p3',qty:1,couponId:coupon,channel:'现金'}),'不能用别人券');eq(O.backup(),before,'失败收银无副作用');
   reject(()=>C.sale({merchantId:'m1',memberId:'u2',productId:'p1',qty:1,couponId:coupon,channel:'现金'}),'分类不满足');
 });
 check('06 账期切换按交易日期、账单快照与重复生成保护',()=>{
   const current=O.turnover('m1',O.month()),previous=O.turnover('m1',O.prevMonth());assert(current!==previous,'两账期销售不同');const n=db().bills.length;C.generateBills(O.month());eq(db().bills.length,n,'不重复生成');reject(()=>C.generateBills('2026-99'),'非法月份');
   for(const b of db().bills){const m=db().merchants.find(m=>m.id===b.merchantId);eq(b.amount,m.model==='固定租金'?m.rent:Math.max(m.rent,b.commission),'合同计费规则');}
 });
 check('07 对账、部分缴费、超额保护与开票全链路',()=>{
   const b=db().bills.find(b=>b.merchantId==='m2'&&b.period===O.month()),id=b.id,m1=db().bills.find(b=>b.merchantId==='m1'&&b.period===O.month());C.confirmBill(id);eq(db().bills.find(b=>b.id===m1.id).status,'待确认','不误写其他商户');
   C.payBill({billId:id,amount:500,channel:'现金'});eq(O.billStatus(db().bills.find(b=>b.id===id)),b.due<O.day()?'逾期未缴':'待缴费','部分缴费状态');
   reject(()=>C.payBill({billId:id,amount:999999,channel:'现金'}),'超额');reject(()=>C.invoice({billId:id,title:'测试',taxId:'91320594DEMO000001',email:'test@example.com'}),'未结清不能开票');
   C.payBill({billId:id,amount:b.amount-500,channel:'银行转账'});C.invoice({billId:id,title:'验收公司',taxId:'91320594DEMO000001',email:'test@example.com'});C.issueInvoice(db().invoices[0].id);assert(db().invoices[0].number.startsWith('DEMO-'),'演示编号');eq(O.billStatus(db().bills.find(b=>b.id===id)),'已结清','结清');reject(()=>C.invoice({billId:id,title:'测试',taxId:'91320594DEMO000001',email:'t@e.com'}),'不能重复开票');
 });
 check('08 重排商户后仍按ID确认，独立商户不能越权',()=>{
   const base=db().merchants[0];C.merchant({...base,id:'',name:'新商户',slotId:'s7',rate:5,start:O.day(),end:O.day(300)});O.login('merchant','123456');const own=db().bills.find(b=>b.merchantId==='m1'&&b.period===O.month()),other=db().bills.find(b=>b.merchantId==='m2'&&b.period===O.month());C.confirmBill(own.id);eq(db().bills.find(b=>b.id===own.id).status,'已确认','确认绑定本人');reject(()=>C.confirmBill(other.id),'跨商户确认');reject(()=>C.payBill({billId:own.id,amount:1,channel:'现金'}),'商户不能自行记财务到账');
 });
 check('09 铺位唯一、无效模式与欠费退场拦截',()=>{
   const base=db().merchants[0];reject(()=>C.merchant({...base,id:'',rate:5}),'占用铺位');reject(()=>C.merchant({...base,rate:5,contractStatus:'已退场'}),'欠费退场');reject(()=>C.merchant({...base,rate:5,model:'非法模式'}),'合同模式');
 });
 check('10 招商推进、审批后签约、自动商户建档与铺位冲突',()=>{
   C.advanceLead('l3');eq(db().leads.find(l=>l.id==='l3').stage,'待签约','审批完成');C.signLead({leadId:'l3',name:'拾光咖啡',model:'固定租金',rent:12000,rate:0,end:O.day(300),contact:'店长',phone:'13912345678'});const l=db().leads.find(l=>l.id==='l3');assert(db().merchants.some(m=>m.id===l.merchantId&&m.slotId==='s7'),'关联建档');reject(()=>C.signLead({leadId:'l3'}),'重复签约');C.generateBills(O.month());assert(db().bills.some(b=>b.merchantId===l.merchantId),'新商户账单');
 });
 check('11 工单派单、完成、退回、验收、重开及日志',()=>{
   const id=C.ticket({title:'测试灯故障',location:'1F',description:'不亮',priority:'紧急'});C.ticketStep({ticketId:id,step:'派单',owner:'王师傅',note:'安排电工'});eq(db().tickets[0].owner,'王师傅','不是固定派给张师傅');
   C.ticketStep({ticketId:id,step:'完成',note:'更换灯管'});C.ticketStep({ticketId:id,step:'退回',note:'仍有闪烁'});C.ticketStep({ticketId:id,step:'完成',note:'更换镇流器'});C.ticketStep({ticketId:id,step:'验收',note:'现场正常'});assert(db().tickets[0].closedAt,'验收完成时间');C.ticketStep({ticketId:id,step:'重开',note:'复发'});eq(db().tickets[0].closedAt,null,'重开清理完成时间');eq(db().tickets[0].logs.length,7,'全流程日志');reject(()=>C.ticketStep({ticketId:id,step:'验收',note:'跳步'}),'状态机不能跳步');
 });
 check('12 商户报修强制本店，物业拥有创建和处理权限',()=>{
   O.login('merchant','123456');C.ticket({title:'门店报修',location:'其他位置',merchantId:'m2',description:'测试'});eq(db().tickets[0].merchantId,'m1','固定本人商户');eq(db().tickets[0].location,'1F-A12','固定本人铺位');reject(()=>C.ticketStep({ticketId:db().tickets[0].id,step:'派单',owner:'测试',note:'测试'}),'商户无派单权');O.login('property','123456');C.ticket({title:'物业巡检',location:'公共区',description:'测试'});C.ticketStep({ticketId:db().tickets[0].id,step:'派单',owner:'李主管',note:'巡检处理'});
 });
 check('13 停车异常阻止离场、处理与缴费，结算后费用固定',()=>{
   reject(()=>C.parkingExit('park3'),'异常不可放行');C.parkingResolve({parkingId:'park3',note:'人工确认车牌与记录一致'});C.parkingExit('park3');const fee=O.fee(db().parking.find(p=>p.id==='park3'));C.settings({...db().settings,reminders:'true',dailyPush:'false',parkingRate:99,freeMinutes:0});eq(O.fee(db().parking.find(p=>p.id==='park3')),fee,'结算快照');reject(()=>C.parkingExit('park3'),'重复离场');
 });
 check('14 会员停车减免记录、车牌唯一、重复入场拦截',()=>{
   const f=O.fee(db().parking.find(p=>p.id==='park1'));assert(f.benefit>0,'金卡减免');C.parkingExit('park1');eq(db().parkingUsage[0].minutes,f.benefit,'实际消耗权益');C.parkingEntry({plate:'陕A6Q82K'});reject(()=>C.parkingEntry({plate:'陕A6Q82K'}),'重复在场');reject(()=>C.profile({type:'member',id:'u2',name:'李',phone:'13900000912',plate:'陕A6Q82K'}),'重复绑定车牌');
 });
 check('15 资料保存、解绑旧车关联、角色越权与会员发券权限',()=>{
   O.login('member','123456');C.profile({type:'member',id:'u1',name:'王女士更新',phone:'13800002180',plate:'陕A12345',address:'测试地址'});eq(db().members[0].name,'王女士更新','保存资料');eq(db().parking.find(p=>p.id==='park1').memberId,null,'旧车解绑');reject(()=>C.profile({type:'member',id:'u2',name:'测试',phone:'13900000912'}),'不能编辑他人');reject(()=>C.issue({memberId:'u1',templateId:'ct1'}),'会员无后台发券权');C.claim({memberId:'u1',templateId:'ct1'});reject(()=>C.claim({memberId:'u2',templateId:'ct3'}),'不可替他人领券');O.login('finance','123456');reject(()=>C.product(product),'财务无库存权限');reject(()=>C.profile({type:'member',id:'u1',name:'测试',phone:'13800002180'}),'财务不能编辑会员');
 });
 check('16 活动创建、目标触达、领券资格与报名持久化',()=>{
   C.activity({name:'沉睡会员回归',start:O.day(),end:O.day(10),audience:'沉睡会员',templateId:'ct2'});assert(db().messages.some(m=>m.targetId==='u4'&&m.title.includes('沉睡会员回归')),'目标消息');reject(()=>C.issue({memberId:'u1',templateId:'ct2'}),'非目标人群');C.issue({memberId:'u4',templateId:'ct2'});O.login('merchant','123456');C.register({merchantId:'m1',activityId:db().activities[0].id});assert(db().activities[0].registrations.includes('m1'),'报名保存');reject(()=>C.register({merchantId:'m1',activityId:db().activities[0].id}),'重复报名');
 });
 check('17 通知已读独立于业务待办、消息批量已读及设置生效',()=>{
   const count=O.notices().length;C.readNotices();eq(O.notices().length,count,'不消灭业务待办');assert(O.notices().every(n=>db().noticeReads.includes(n.id)),'已读保存');C.readMessages({role:'member',id:'u1'});assert(db().messages.filter(m=>m.role==='member'&&m.targetId==='u1').every(m=>m.read),'消息已读');C.settings({...db().settings,reminders:'false',dailyPush:'false'});eq(O.notices().length,0,'提醒关闭');
 });
 check('18 到访登记与简报按本地日期计算、备份数据可解析',()=>{
   const before=O.sum(db().visits.filter(v=>v.date===O.day()),v=>v.count);C.visit({memberId:'u4',count:5});eq(db().members.find(u=>u.id==='u4').lastVisit,O.day(),'唤醒会员');eq(O.sum(db().visits.filter(v=>v.date===O.day()),v=>v.count),before+1,'会员人次');const r=C.dailyReport();eq(r.sales,O.sum(db().sales.filter(s=>s.date===O.day()&&s.status!=='已退款'),s=>s.paid),'当日报表');eq(JSON.parse(O.backup()).version,2,'完整JSON备份');
 });
 O.login('admin','123456');O.reset();return results;
}
