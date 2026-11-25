/* Business-level assertions. Each scenario starts from a clean seed. */
(() => {
const F=Farm, cases=[];
const assert=(v,m)=>{if(!v)throw Error(m||'断言失败')};
const rejects=(fn,m)=>{let rejected=false;try{fn()}catch{rejected=true}assert(rejected,m||'应拒绝此操作')};
const s=()=>F.get(),o=id=>s().orders.find(o=>o.id===id),p=id=>s().products.find(p=>p.id===id);
const booking=(extra={})=>({activityId:'rabbit',date:F.day(4),slot:'09:00',adults:1,kids:0,petId:'pet-doudou',name:'测试访客',phone:'13800138000',...extra});
const shopping=(extra={})=>({buyNow:true,productId:'11',spec:'标准装',qty:1,delivery:'pickup',name:'测试买家',phone:'13800138000',...extra});
const service=(extra={})=>({type:'grooming',serviceId:'wash',petId:'pet-doudou',date:F.day(4),slot:'09:00',tech:'小林',name:'测试访客',phone:'13800138000',...extra});
const test=(name,fn)=>cases.push({name,fn});
test('不同活动的成人儿童价、会员折扣、券与积分正确叠加',()=>{
 const id=F.createActivity(booking({activityId:'dog',adults:2,kids:1,couponId:'c2',usePoints:true})),x=o(id);
 assert(x.subtotal===14700&&x.memberDiscount===1470&&x.couponDiscount===1000&&x.pointsUsed===1256&&x.total===10974,'金额计算错误');
 assert(x.activityId==='dog'&&x.date===F.day(4)&&x.people===3&&x.contact.name==='测试访客','预约信息未绑定');
});
test('初始订单支付不早于创建，原有商品活动和宠物数据保留',()=>{
 assert(s().orders.every(o=>!o.paidAt||o.paidAt>=o.created),'支付早于创建时间');
 assert(s().products.length===14&&s().activities.length===3&&s().pets.length===2);
 assert(s().health.filter(h=>h.petId==='pet-doudou'&&h.kind==='vaccine').length===3);
});
test('活动余位按重叠区间占用，取消释放容量',()=>{
 const id=F.createActivity(booking({adults:15}));
 assert(F.available('rabbit',F.day(4),'10:00')===0,'重叠场次没有扣位');
 rejects(()=>F.createActivity(booking({slot:'10:00'})),'满员可提交');
 assert(F.available('rabbit',F.day(4),'13:00')===15,'非重叠场次错误占位');
 F.cancel(id);assert(F.available('rabbit',F.day(4),'10:00')===15,'取消未释位');
});
test('拒绝过期日期、错误时段、无成人与无效联系方式',()=>{
 for(const x of [{date:F.day(-1)},{date:F.day(7)},{date:'2026-02-31'},{slot:'08:00'},{adults:0},{adults:1.5},{phone:'123'},{name:''}])rejects(()=>F.createActivity(booking(x)));
});
test('取消订单返还预占券和积分，重复取消不重复返还',()=>{
 const before=s().user.points,id=F.createActivity(booking({adults:2,couponId:'c2',usePoints:true}));
 assert(s().user.points<before&&F.couponState(s().coupons.find(c=>c.id==='c2'))==='reserved');
 F.cancel(id);assert(s().user.points===before&&F.couponState(s().coupons.find(c=>c.id==='c2'))==='available');
 const rev=s().revision;rejects(()=>F.cancel(id));assert(s().revision===rev);
});
test('15分钟超时释放双件装库存、券与积分',()=>{
 const before=s().user.points,stock=p('11').stock,id=F.createShop(shopping({spec:'双件装',qty:2,couponId:'c1',usePoints:true}));
 assert(p('11').stock===stock-4);const data=s();data.orders.find(x=>x.id===id).expires=Date.now()-1;F.import(JSON.stringify(data));F.expire();
 assert(o(id).status==='cancelled'&&p('11').stock===stock&&s().user.points===before);assert(s().coupons.find(c=>c.id==='c1').usedBy===null);
});
test('支付失败与用户取消保留待付单，成功只奖励一次',()=>{
 F.cartAdd('11');const id=F.createShop(shopping({buyNow:false}));
 F.pay(id,'failed');F.pay(id,'cancelled');assert(o(id).status==='pending'&&s().cart.length===1);
 F.pay(id);assert(o(id).status==='paid'&&s().cart.length===0);const points=s().user.points;
 rejects(()=>F.pay(id));assert(s().user.points===points&&s().payments.length===3);
});
test('独立立即购买保留原购物车，购物车下单只清选中项',()=>{
 F.cartAdd('1');F.cartAdd('11');const c=s().cart.find(x=>x.productId==='1');F.cartToggle(c.id);
 const now=F.createShop(shopping({productId:'4'}));F.pay(now);assert(s().cart.length===2);
 const id=F.createShop(shopping({buyNow:false}));F.pay(id);assert(s().cart.length===1&&s().cart[0].productId==='1'&&!s().cart[0].checked);
});
test('标准装与双件装共享库存，数量与重复购买不超售',()=>{
 for(let i=0;i<20;i++)F.cartAdd('11','双件装');
 rejects(()=>F.cartAdd('11'));rejects(()=>F.cartChange(s().cart[0].id,21));
 const id=F.createShop(shopping({productId:'11',qty:1}));F.pay(id);rejects(()=>F.again(id));
 rejects(()=>F.createShop(shopping({qty:40})));assert(p('11').stock===39);
});
test('快递费、优惠门槛、积分上限及适用范围正确',()=>{
 assert(F.quote({type:'shop',subtotal:2500,delivery:'express',usePoints:true}).total===2800);
 assert(F.quote({type:'shop',subtotal:9900,delivery:'express',couponId:'c1'}).total===7900);
 rejects(()=>F.quote({type:'shop',subtotal:2500,couponId:'c3'}));
 rejects(()=>F.quote({type:'shop',subtotal:10000,couponId:'c2'}));
 const data=s();data.coupons[0].expires=F.day(-1);F.import(JSON.stringify(data));rejects(()=>F.createShop(shopping({qty:4,couponId:'c1'})));
});
test('商城发货前退款返库存并扣回消费奖励',()=>{
 const before=s().user.points,stock=p('11').stock,id=F.createShop(shopping({spec:'双件装',qty:2,couponId:'c1',usePoints:true}));
 F.pay(id);F.refund(id);assert(o(id).status==='refunded'&&s().user.points===before&&p('11').stock===stock);
 rejects(()=>F.refund(id));assert(s().user.points===before);
});
test('发货后申请退货，确认退回才恢复库存',()=>{
 const stock=p('11').stock,id=F.createShop(shopping());F.pay(id);F.ship(id);F.refund(id);
 assert(o(id).status==='return_requested'&&p('11').stock===stock-1);F.refund(id);assert(o(id).status==='refunded'&&p('11').stock===stock);
});
test('发货、确认收货与商品评价联动，状态防重复',()=>{
 const id=F.createShop(shopping());F.pay(id);rejects(()=>F.receive(id));F.ship(id);rejects(()=>F.ship(id));F.receive(id);F.review(id,5,'这份好物很实用');
 assert(p('11').reviews[0].content==='这份好物很实用');rejects(()=>F.review(id,5,'重复评价'));rejects(()=>F.refund(id));
});
test('真实QR载荷与订单绑定，一次核销，取消和伪造码拒绝',()=>{
 const id=F.createActivity(booking()),token=o(id).token;rejects(()=>F.verify(token));F.pay(id);
 rejects(()=>F.verify('fake'));F.verify('PAWFARM:'+id+':'+token);assert(o(id).status==='done');rejects(()=>F.verify(token));
 const id2=F.createActivity(booking({slot:'13:00'}));F.cancel(id2);rejects(()=>F.verify(o(id2).token));
});
test('活动改期转移容量，24小时内不能退款或改期',()=>{
 const id=F.createActivity(booking({adults:5}));F.pay(id);F.reschedule(id,{date:F.day(5),slot:'13:00'});
 assert(F.available('rabbit',F.day(4),'09:00')===15&&F.available('rabbit',F.day(5),'14:00')===10);
 const data=s(),x=data.orders.find(x=>x.id===id);x.date=F.day();x.slot='23:59';F.import(JSON.stringify(data));rejects(()=>F.refund(id));rejects(()=>F.reschedule(id,{date:F.day(5),slot:'09:00'}));
});
test('点赞在列表详情共享同一数据，收藏对象类型独立',()=>{
 const before=s().posts[0];F.likePost(before.id);assert(s().posts[0].liked===!before.liked&&s().posts[0].likes===before.likes+(before.liked?-1:1));F.likePost(before.id);assert(s().posts[0].likes===before.likes);
 F.favorite('product','11');F.favorite('article','puppy');assert(s().favorites.some(f=>f.type==='product'&&f.id==='11'));F.favorite('product','11');assert(!s().favorites.some(f=>f.type==='product'&&f.id==='11'));
});
test('发帖评论图片与奖励落库，阅读不重复累计',()=>{
 const before=s().user.points,id=F.publish({content:'今天的农场记录，真的好可爱',tag:'晒宠',topic:'农场的一天',images:[]});F.comment(id,'下次我们也去！');
 assert(s().posts[0].comments[0].text==='下次我们也去！'&&s().user.points===before+10);rejects(()=>F.publish({content:'过短',tag:'晒宠'}));
 const read=s().articles[0].reads;F.readArticle('puppy');F.readArticle('puppy');assert(s().articles[0].reads===read+1);assert(s().articles[1].id==='vaccine'&&s().articles[1].body[0][0]!==s().articles[0].body[0][0]);
});
test('多宠物档案分离，新增一次奖励，编辑不重复奖励',()=>{
 const before=s().user.points,data={name:'小白',species:'兔',breed:'垂耳兔',gender:'母',birthday:F.day(-200),weight:2.3,neutered:false,chip:'TESTCHIP'};
 const id=F.savePet(data);assert(s().user.points===before+20);F.savePet({...data,id,weight:2.4});assert(s().user.points===before+20&&s().pets.find(p=>p.id===id).weights.at(-1).value===2.4);
 assert(s().health.filter(h=>h.petId==='pet-maomao').every(h=>h.type==='猫三联'));rejects(()=>F.savePet({...data,name:'重号'}));rejects(()=>F.savePet({...data,chip:'',birthday:F.day(1)}));
});
test('疫苗保存、下一次提醒、编辑奖励幂等和体重日期校验',()=>{
 const before=s().user.points,data={petId:'pet-maomao',kind:'vaccine',type:'猫三联',name:'猫三联',date:F.day(),next:F.day(6),provider:'测试医院',batch:'TEST',note:'状态良好'};
 const id=F.saveHealth(data);F.saveHealth({...data,id});assert(s().user.points===before+10);
 assert(F.notifications().filter(m=>m.category==='health'&&m.title.includes('毛毛')).length===1,'旧接种计划未被新计划替代');
 rejects(()=>F.saveHealth({...data,date:F.day(1)}));rejects(()=>F.saveHealth({...data,next:F.day(-1)}));
 F.weight('pet-maomao',F.day(),4.5);F.weight('pet-maomao',F.day(-1),4.3);assert(s().pets.find(p=>p.id==='pet-maomao').weight===4.5);
});
test('会员月券、生日礼与签到次数校验，积分兑换入账',()=>{
 F.sign();rejects(()=>F.sign());const points=s().user.points;F.claim('monthly');rejects(()=>F.claim('monthly'));
 F.updateProfile({name:'测试',phone:'13800138000',birthday:F.day(-365*20),notify:true});F.claim('birthday');rejects(()=>F.claim('birthday'));
 F.redeem();assert(s().user.points===points+100-500&&s().coupons.at(-1).amount===1000);
});
test('免费体检按季度预占且不重复，取消返权益',()=>{
 F.demoLevel(3);const id=F.createService(service({type:'checkup',freeCheck:true}));assert(o(id).total===0);
 rejects(()=>F.createService(service({type:'checkup',freeCheck:true,slot:'11:00'})));F.cancel(id);
 const next=F.createService(service({type:'checkup',freeCheck:true,slot:'11:00'}));assert(o(next).total===0);
});
test('服务排班跨美容体检共用，寄养按夜占房不重复寄养',()=>{
 const id=F.createService(service());rejects(()=>F.createService(service({type:'checkup'})));F.cancel(id);F.createService(service({type:'checkup'}));
 const b=F.createService(service({type:'boarding',roomId:'vip',date:F.day(1),endDate:F.day(3)}));assert(o(b).subtotal===39600&&o(b).nights===2);
 rejects(()=>F.createService(service({type:'boarding',roomId:'standard',date:F.day(2),endDate:F.day(4)})));
 rejects(()=>F.createService(service({type:'boarding',petId:'pet-maomao',roomId:'vip',date:F.day(2),endDate:F.day(4)})));
 F.createService(service({type:'boarding',petId:'pet-maomao',roomId:'vip',date:F.day(3),endDate:F.day(4)}));
});
test('免费体检按服务日期所属季度扣次数，跨季度不串用',()=>{
 F.demoLevel(3);const first=new Date(F.day()+'T12:00:00');first.setMonth(Math.floor(first.getMonth()/3)*3+3,5);const second=new Date(first);second.setMonth(second.getMonth()+3);
 const d1=F.dateOf(first),d2=F.dateOf(second),id1=F.createService(service({type:'checkup',freeCheck:true,date:d1})),id2=F.createService(service({type:'checkup',freeCheck:true,date:d2}));
 assert(o(id1).quarter===F.quarter(d1)&&o(id2).quarter===F.quarter(d2)&&o(id1).quarter!==o(id2).quarter);
 rejects(()=>F.createService(service({type:'checkup',freeCheck:true,date:d1,slot:'11:00'})));
});
test('寄养入住、每日照护与退房独立流转，完成后可评价',()=>{
 const id=F.createService(service({type:'boarding',roomId:'standard',date:F.day(2),endDate:F.day(4)}));
 rejects(()=>F.checkoutBoarding(id));F.pay(id);F.verify(o(id).token);assert(o(id).status==='in_service');rejects(()=>F.verify(o(id).token));
 rejects(()=>F.care(id,{date:F.day(4),kind:'喂食',note:'已吃完晚餐'}));F.care(id,{date:F.day(2),kind:'遛弯',note:'草地散步20分钟，状态良好。'});assert(o(id).care.length===1);F.checkoutBoarding(id);F.review(id,5,'寄养期间照护记录详细');rejects(()=>F.checkoutBoarding(id));
});
test('会员日积分使用当天有效倍数，退款按订单快照扣回',()=>{
 const id=F.createShop(shopping()),mult=F.effectiveMultiplier();F.pay(id);assert(o(id).rewardPoints===Math.floor(o(id).total/100*mult));
 F.demoLevel(4);const before=s().user.points;F.refund(id);assert(s().user.points===before-o(id).rewardPoints);
});
test('地址默认唯一，订单地址快照不会随编辑改变',()=>{
 const id=F.createShop(shopping({delivery:'express',addressId:'addr1'}));const old=o(id).address.detail;
 F.saveAddress({id:'addr1',name:'新用户',phone:'13800138001',area:'上海市浦东新区',detail:'测试路1号',isDefault:false});assert(o(id).address.detail===old);
 F.defaultAddress('addr2');F.deleteAddress('addr2');assert(s().addresses.length===1&&s().addresses[0].isDefault);
});
test('领养申请、审核、确认和回访状态校验',()=>{
 const data={petId:'adopt1',name:'测试领养人',phone:'13800138000',home:'自有住房且全家同意',experience:'有三年养犬经验',reason:'我会认真照顾它，定期免疫体检并陪伴散步'};
 const id=F.applyAdopt(data);rejects(()=>F.applyAdopt(data));rejects(()=>F.adoptionAction(id,'complete'));F.adoptionAction(id,'approve');F.adoptionAction(id,'complete');F.adoptionAction(id,'followup','适应良好，每天规律散步。');assert(s().adoptions[0].followups.length===1);
});
test('邀请、首单、拼团、助力与提现奖励均不可重复领取',()=>{
 const points=s().user.points;F.invite({name:'好友一',phone:'13800138001'});F.invite({name:'好友二',phone:'13800138002'});rejects(()=>F.invite({name:'重复好友',phone:'13800138001'}));
 const friends=s().friends;assert(friends[0].inviterId==='me'&&friends[0].inviteCode==='PAW-DEMO-ME');F.friendOrder(friends[0].id);rejects(()=>F.friendOrder(friends[0].id));
 for(const kind of ['group','bargain']){F.campaign(kind,friends[0].id);rejects(()=>F.campaign(kind,friends[0].id));F.campaign(kind,friends[1].id);F.campaignClaim(kind);rejects(()=>F.campaignClaim(kind));}
 F.withdraw();rejects(()=>F.withdraw());assert(s().user.points===points+200&&s().campaigns.withdrawals[0].amount===500);
});
test('消息已读同步，客服回答与设置持久化',()=>{
 const m=F.notifications()[0];F.readMessage(m.id);assert(F.notifications().find(x=>x.id===m.id).read);F.readAll();assert(F.notifications().every(x=>x.read));
 F.support('预约应该怎么办？');assert(s().support.length===2&&!s().support[1].user);F.updateProfile({name:'新名字',phone:'13800138000',birthday:'2000-01-01',notify:false});assert(!s().settings.notify&&s().user.name==='新名字');
});
test('导出导入可恢复，畸形备份被拒绝且不覆盖已有数据',()=>{
 F.cartAdd('11');const backup=F.export(),rev=s().revision;F.import(backup);assert(s().cart.length===1);
 for(const mutate of [x=>{x.version=9},x=>{x.pets[0].weights=null},x=>{x.posts[0].images=['javascript:alert(1)']},x=>{x.orders[0].contact=null},x=>{x.products[0].stock=-1},x=>{x.articles[0].body=[['bad']]},x=>{x.user.name=null}]){const data=JSON.parse(backup);mutate(data);rejects(()=>F.import(JSON.stringify(data)));assert(F.export()===backup,'无效备份覆盖了原数据');}
 assert(s().revision===rev);
});
test('本地存储写入失败不提交库存与订单变化',()=>{
 const backup=F.export(),native=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('模拟空间不足')};
 try{rejects(()=>F.createShop(shopping()));assert(F.export()===backup,'写入失败后内存仍发生变化');}finally{Storage.prototype.setItem=native;}
});
const results=[];for(const t of cases){try{F.reset();t.fn();results.push({name:t.name,pass:true});}catch(e){results.push({name:t.name,pass:false,error:e.message,stack:e.stack});}}
F.reset();return results;
})();
