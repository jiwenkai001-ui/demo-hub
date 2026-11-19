/* Paw Farm: integer-cent prices, transactional local state, explicit demo transitions. */
'use strict';
window.Farm = (() => {
  const KEY='paw-farm-rebuilt-2026-v1', VERSION=1;
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=p=>p+'-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const day=(offset=0)=>{const d=new Date();d.setDate(d.getDate()+offset);return dateOf(d)};
  const dateOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const days=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000);
  const money=n=>(n/100).toFixed(2).replace(/\.00$/,'');
  const fail=m=>{throw new Error(m)};
  const int=(n,min=0,max=9999)=>{n=Number(n);if(!Number.isInteger(n)||n<min||n>max)fail(`请输入${min}—${max}之间的整数`);return n};
  const text=(s,min=1,max=100)=>{s=String(s||'').trim();if(s.length<min||s.length>max)fail(`内容长度需为${min}—${max}字`);return s};
  const phone=s=>{s=String(s||'').trim();if(!/^1[3-9]\d{9}$/.test(s))fail('请输入有效的11位手机号');return s};
  const validDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s||'')||dateOf(new Date(s+'T12:00:00'))!==s)fail('请选择有效日期');return s};
  const contact=f=>({name:text(f.name,1,30),phone:phone(f.phone)});
  const levels=[{n:1,name:'萌新宠友',min:0,max:500,mult:1,discount:95,coupons:0,checks:0},{n:2,name:'活跃宠友',min:500,max:2000,mult:1.2,discount:90,coupons:1,checks:0},{n:3,name:'资深宠友',min:2000,max:5000,mult:1.5,discount:85,coupons:2,checks:1},{n:4,name:'VIP宠友',min:5000,max:Infinity,mult:2,discount:80,coupons:3,checks:2}];
  const level=s=>[...levels].reverse().find(x=>s.user.growth>=x.min)||levels[0];
  const services={boarding:{name:'寄养预约',price:8000},grooming:{name:'洗护美容',price:6800},checkup:{name:'健康体检',price:12800}};
  const grooming=[{id:'wash',name:'基础洗护',price:6800,duration:60},{id:'groom',name:'精致美容',price:12800,duration:90},{id:'spa',name:'舒缓SPA',price:15800,duration:90},{id:'bath',name:'护理药浴',price:19800,duration:90}];
  const rooms=[{id:'standard',name:'标准间',price:8000,capacity:4},{id:'deluxe',name:'豪华间',price:12800,capacity:2},{id:'vip',name:'VIP套间',price:19800,capacity:1}];
  const effectiveMultiplier=s=>level(s).mult*(new Date().getDay()===3?2:1);
  const holding=o=>!['cancelled','refunded'].includes(o.status);

  function seed(){
    const products=[
      [1,'皇家金毛幼犬粮 15kg',29900,35900,'主粮','food','2.3万'],[2,'渴望无谷六种鱼成犬粮 11.4kg',56800,62800,'主粮','fish','1.8万'],[3,'GO! 九种肉无谷猫粮 16lb',38800,44800,'主粮','food','3.1万'],
      [4,'巅峰风干牛肉粒训练零食 200g',8900,10900,'零食','snack','5600'],[5,'冻干鹌鹑蛋黄零食 50g',3900,5900,'零食','snack','8900'],[6,'SmartBones磨牙棒洁齿骨 大号',6900,8900,'零食','snack','1.2万'],
      [7,'雪貂洗毛液深层洁净 500ml',12800,16800,'洗护','wash','4300'],[8,'伊珊娜宠物护毛素 300ml',7900,9900,'洗护','wash','6700'],[9,'8in1专业耳道清洁液 118ml',4900,6900,'洗护','wash','7800'],
      [10,'Kong经典飞盘狗狗玩具',5900,7900,'玩具','toy','1.5万'],[11,'逗猫棒羽毛互动玩具套装',2500,3900,'玩具','toy','2.4万'],[12,'益智漏食球耐咬犬用',3500,4900,'玩具','toy','9800'],
      [13,'棉麻外出随行包',15900,19900,'用品','supply','3200'],[14,'陶瓷防滑双碗',6900,8900,'用品','supply','1800']
    ].map(([id,name,price,oldPrice,category,art,sales])=>({id:String(id),name,price,oldPrice,category,art,sales,stock:40,specs:['标准装','双件装'],reviews:[{user:'爱宠达人',rating:5,content:'包装完好，毛孩子很喜欢，会再来。'},{user:'小小铲屎官',rating:5,content:'到店自提很方便，品质不错。'}]}));
    const activities=[{id:'rabbit',name:'萌兔撸宠体验',desc:'把柔软的小可爱，抱进周末的怀里。',price:3900,child:1900,minutes:120,capacity:15,location:'A区 · 萌宠森林馆',art:'rabbit',tag:'亲子时光',detail:'认识荷兰兔与垂耳兔，学习正确抱姿、喂食与温柔互动，亲手为小兔准备一份蔬菜小餐。'},{id:'dog',name:'狗狗互动派对',desc:'和热情的毛孩子，交一整个下午的朋友。',price:5900,child:2900,minutes:150,capacity:8,location:'B区 · 草地运动场',art:'dog',tag:'快乐社交',detail:'与农场狗狗一起玩飞盘、学习握手，在专业训犬师陪同下体验正向互动。'},{id:'cat',name:'猫咪主题下午茶',desc:'一杯茶、一声呼噜，慢慢消磨好时光。',price:8800,child:4400,minutes:120,capacity:10,location:'C区 · 猫咪日光房',art:'cat',tag:'含精致茶点',detail:'在日光房与布偶、英短安静相处，认识猫咪的肢体语言，享用一份轻盈下午茶。'}];
    const authors=[{id:'author1',name:'豆豆麻麻',art:'dog',tag:'晒宠'},{id:'author2',name:'猫咪爸爸',art:'cat',tag:'经验分享'},{id:'author3',name:'训犬师小王',art:'dog',tag:'知识'},{id:'author4',name:'金毛控',art:'dog',tag:'晒宠'}];
    const contents=['今天带豆豆去农场撸宠了，小兔子太可爱了！豆豆一直舍不得走，下次还要来～','分享一下毛毛的疫苗接种时间表，新手铲屎官建议收藏！疫苗一定要按时打，不要拖延。','【训犬小技巧】狗狗乱咬东西怎么办？三步教你纠正：1.提供磨牙玩具 2.及时制止 3.正向激励。坚持练习，就会慢慢看到变化！','我家大金毛今天终于学会握手了！太激动了，感谢农场训犬师的指导，记录一下这个小进步。'];
    const posts=authors.map((a,i)=>({id:'post'+(i+1),author:a.id,content:contents[i],tag:a.tag,topic:i===0?'农场的一天':'养宠日常',images:i===2?[]:['assets/images/'+(i===0?'rabbit':a.art)+'.svg'],likes:[56,89,134,67][i],liked:i===1,baseComments:[12,23,45,18][i],comments:[{id:'comment'+i,user:'小白',text:i===1?'谢谢整理，已记在宠物档案里！':'好可爱啊！也想带毛孩子去玩。',time:Date.now()-3600000}],time:Date.now()-(i+1)*7200000}));
    const articles=[{id:'puppy',title:'幼犬喂养指南：0—12个月，每月该吃什么？',category:'科学喂养',art:'food',reads:23000,likes:856,liked:false,body:[['0—2个月，温柔地开始','幼犬以母乳或宠物专用羊奶粉为主，喂养频率和剂量可咨询专业人员，观察体重、精神和排便情况。'],['2—4个月，慢慢过渡','逐渐引入泡软的幼犬粮，按食品说明和个体需要分次少量喂食。换粮循序渐进，保持清洁饮水。'],['4—12个月，建立规律','选择适合年龄和体型的主粮，零食适量。记录体重，规律运动；免疫前后尽量保持饮食稳定。']]},{id:'vaccine',title:'猫咪疫苗接种全攻略：时间表与注意事项',category:'健康养护',art:'cat',reads:18000,likes:642,liked:false,body:[['先建立一份专属档案','接种时间应结合猫咪年龄、健康状况和既往记录，由接种机构确认。将日期、机构、批次和凭证登记在健康档案。'],['记录下一次接种时间','按接种机构给出的计划设置下一次日期，农场会在本地消息中心展示即将到期与已逾期提醒。'],['接种当天与之后','按机构要求做好准备，接种后观察猫咪状态。有异常时联系接种机构；本文用于日常养护科普，不代替个体诊疗。']]},{id:'food-guide',title:'看懂配料表，为毛孩子选对口粮',category:'科学喂养',art:'fish',reads:31000,likes:903,liked:false,body:[['先看生命阶段与营养标识','幼年、成年与老年宠物的需求不同，选择完整均衡、适配年龄与物种的食品。'],['留意换粮反应','更换食品时分阶段过渡，记录食欲、便便和皮肤变化，避免频繁大幅更换。'],['让喂养成为习惯','根据包装建议和体况调整，定时定量，提供清洁饮水。健康记录帮助你看到长期变化。']]}];
    const pets=[{id:'pet-doudou',name:'豆豆',species:'犬',breed:'金毛寻回犬',gender:'公',birthday:day(-1160),weight:28.5,neutered:true,chip:'MC000001',art:'dog',avatar:'',weights:[{date:day(-120),value:27},{date:day(-90),value:27.5},{date:day(-60),value:28},{date:day(-30),value:28.3},{date:day(),value:28.5}]},{id:'pet-maomao',name:'毛毛',species:'猫',breed:'英国短毛猫',gender:'母',birthday:day(-730),weight:4.2,neutered:true,chip:'',art:'cat',avatar:'',weights:[{date:day(-60),value:3.9},{date:day(-30),value:4.1},{date:day(),value:4.2}]}];
    const health=[{id:'v1',petId:pets[0].id,kind:'vaccine',type:'狂犬疫苗',name:'狂犬疫苗',date:day(-173),next:day(7),provider:'农场合作宠物医院',batch:'BN2026001',note:'已登记接种信息',photo:''},{id:'v2',petId:pets[0].id,kind:'vaccine',type:'四联疫苗',name:'犬瘟热疫苗',date:day(-120),next:day(245),provider:'农场合作宠物医院',batch:'',note:'',photo:''},{id:'v3',petId:pets[1].id,kind:'vaccine',type:'猫三联',name:'猫三联疫苗',date:day(-358),next:day(7),provider:'农场合作宠物医院',batch:'',note:'',photo:''},{id:'w1',petId:pets[0].id,kind:'worm',type:'体内驱虫',name:'体内驱虫',date:day(-20),next:day(10),provider:'居家记录',batch:'',note:'按产品及专业指导使用',photo:''},{id:'w2',petId:pets[0].id,kind:'worm',type:'体外驱虫',name:'体外驱虫',date:day(-20),next:day(10),provider:'居家记录',batch:'',note:'',photo:''},{id:'h1',petId:pets[0].id,kind:'checkup',type:'年度体检',name:'年度体检',date:day(-90),next:day(275),provider:'农场合作宠物医院',batch:'',note:'一般状态良好，继续规律运动。',photo:''}];
    health.push({id:'v4',petId:pets[0].id,kind:'vaccine',type:'犬副流感疫苗',name:'犬副流感疫苗',date:day(-130),next:day(235),provider:'农场合作宠物医院',batch:'',note:'',photo:''});
    const coupons=[['c1','新人专享券',2000,9900,'all',30],['c2','活动专享券',1000,4900,'activity',20],['c3','商城满减券',1500,7900,'shop',30],['c4','会员日专享',500,0,'all',90],['c5','大额满减券',3000,19900,'all',30]].map(([id,name,amount,min,scope,expires])=>({id,name,amount,min,scope,expires:day(expires),weekday:id==='c4'?3:null,usedBy:null}));
    const s={version:VERSION,revision:0,user:{id:'me',name:'宠物爱好者',phone:'13800138888',birthday:'1995-10-22',points:1256,growth:1280},products,activities,authors,posts,articles,pets,health,coupons,cart:[],orders:[],favorites:[{type:'product',id:'1'},{type:'product',id:'4'},{type:'activity',id:'rabbit'},{type:'article',id:'vaccine'}],follows:[],ledger:[{id:'opening',ref:'opening',amount:1256,label:'初始演示积分',time:Date.now()}],rewards:[],reads:[],messages:[{id:'welcome',category:'system',title:'欢迎来到萌宠农场',body:'这一次，把周末留给可爱。所有演示操作保存在当前浏览器。',time:Date.now(),route:'home'}],readMessages:[],addresses:[{id:'addr1',name:'张三',phone:'13800138888',area:'广东省深圳市南山区',detail:'科技园路萌宠农场101室',isDefault:true},{id:'addr2',name:'张三',phone:'13800138888',area:'广东省深圳市福田区',detail:'XX花园5栋302',isDefault:false}],claims:[],adoptions:[],adoptable:[{id:'adopt1',name:'小栗',breed:'田园犬',age:'1岁',art:'dog',desc:'温柔的小太阳，喜欢散步。已完成基础免疫与绝育。'},{id:'adopt2',name:'团子',breed:'中华田园猫',age:'8个月',art:'cat',desc:'慢热但亲人，喜欢安静的家。已完成基础免疫。'},{id:'adopt3',name:'奶糖',breed:'垂耳兔',age:'1岁半',art:'rabbit',desc:'爱吃青菜，期待有耐心、了解兔子养护的家。'}],friends:[],campaigns:{group:{members:[],claimed:false},bargain:{helpers:[],claimed:false},commissions:[],withdrawals:[]},support:[],settings:{notify:true},payments:[]};
    const sample=(type,status,id,name,price,qty,date,extra={})=>({id,type,status,name,items:type==='shop'?[{productId:id==='MC20260820003'?'1':'5',name,price,qty,spec:'标准装'}]:[],date,slot:'14:00',adults:qty,kids:0,people:qty,petId:'pet-doudou',activityId:type==='activity'?(name.includes('狗')?'dog':name.includes('猫')?'cat':'rabbit'):null,contact:{name:s.user.name,phone:s.user.phone},subtotal:price*qty,memberDiscount:type==='activity'?Math.round(price*qty*.1):0,couponId:null,couponDiscount:0,pointsUsed:0,shipping:0,total:type==='activity'?Math.round(price*qty*.9):price*qty,created:status==='done'?new Date(date+'T09:00:00').getTime():Date.now()-60000,expires:Date.now()+900000,paidAt:status==='pending'?null:status==='done'?new Date(date+'T09:01:00').getTime():Date.now()-30000,rewardPoints:0,growthEarned:0,token:uid('ticket'),delivery:'pickup',address:clone(s.addresses[0]),tracking:[],review:null,...extra});
    s.orders=[sample('activity','pending','MC20260825001','萌兔撸宠体验',3900,1,day(2)),sample('activity','paid','MC20260824002','狗狗互动派对',5900,2,day(3)),sample('shop','done','MC20260820003','皇家金毛幼犬粮 15kg',29900,1,day(-2)),sample('shop','done','MC20260818004','冻干鹌鹑蛋黄零食 50g',3900,2,day(-4)),sample('activity','done','MC20260815005','猫咪主题下午茶',8800,1,day(-7))];
    return s;
  }

  function validate(s){
    if(!s||s.version!==VERSION||!s.user||!Number.isInteger(s.user.points)||!Number.isFinite(s.user.growth)||s.user.growth<0)fail('备份格式或版本不匹配');
    for(const k of ['products','activities','posts','articles','pets','health','coupons','cart','orders','favorites','follows','ledger','rewards','reads','messages','readMessages','addresses','claims','adoptions','adoptable','friends','support','payments','authors'])if(!Array.isArray(s[k]))fail('备份缺少数据：'+k);
    if(!s.campaigns?.group||!s.campaigns?.bargain||!Array.isArray(s.campaigns.commissions)||!Array.isArray(s.campaigns.withdrawals)||!s.settings)fail('备份扩展数据不完整');
    for(const k of ['products','activities','posts','articles','pets','health','coupons','orders','addresses','adoptions','adoptable','cart','authors','messages','ledger','friends']){
      if(new Set(s[k].map(x=>x?.id)).size!==s[k].length||s[k].some(x=>!x||typeof x.id!=='string'))fail('备份编号重复或无效：'+k);
    }
    if(s.products.some(p=>!Number.isInteger(p.price)||p.price<0||!Number.isInteger(p.stock)||p.stock<0||!Array.isArray(p.specs)||!Array.isArray(p.reviews)))fail('商品数据异常');
    if(s.orders.some(o=>!['pending','paid','shipped','done','cancelled','refunded','return_requested','in_service'].includes(o.status)||!Number.isInteger(o.total)||o.total<0||!Array.isArray(o.items)||typeof o.token!=='string'))fail('订单数据异常');
    if(s.cart.some(c=>!s.products.some(p=>p.id===c.productId)||!Number.isInteger(c.qty)||c.qty<1))fail('购物车数据异常');
    const shape=(o,spec)=>{if(!o||typeof o!=='object'||Array.isArray(o))fail('备份记录格式错误');for(const [k,t] of Object.entries(spec)){if(t==='array'?!Array.isArray(o[k]):typeof o[k]!==t)fail('备份字段格式错误：'+k);if(t==='number'&&!Number.isFinite(o[k]))fail('备份数值无效：'+k);}};
    const image=x=>{if(x&&!/^assets\/images\/[a-z-]+\.svg$/.test(x)&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(x))fail('备份图片格式无效');};
    const strings=a=>{if(!Array.isArray(a)||a.some(x=>typeof x!=='string'))fail('备份列表格式无效');};
    shape(s.user,{id:'string',name:'string',phone:'string',birthday:'string',points:'number',growth:'number'});
    shape(s.settings,{notify:'boolean'});
    for(const k of ['follows','rewards','reads','readMessages','claims'])strings(s[k]);
    strings(s.campaigns.group.members);strings(s.campaigns.bargain.helpers);
    for(const c of [s.campaigns.group,s.campaigns.bargain])shape(c,{claimed:'boolean'});
    const specs={products:{name:'string',category:'string',art:'string',sales:'string',oldPrice:'number'},activities:{name:'string',desc:'string',price:'number',child:'number',minutes:'number',capacity:'number',location:'string',art:'string',tag:'string',detail:'string'},authors:{id:'string',name:'string',art:'string'},posts:{author:'string',content:'string',tag:'string',topic:'string',images:'array',likes:'number',liked:'boolean',baseComments:'number',comments:'array',time:'number'},articles:{title:'string',category:'string',art:'string',reads:'number',likes:'number',liked:'boolean',body:'array'},pets:{name:'string',species:'string',breed:'string',gender:'string',birthday:'string',weight:'number',neutered:'boolean',chip:'string',art:'string',avatar:'string',weights:'array'},health:{petId:'string',kind:'string',type:'string',name:'string',date:'string',next:'string',provider:'string',batch:'string',note:'string',photo:'string'},coupons:{name:'string',amount:'number',min:'number',scope:'string',expires:'string'},cart:{id:'string',productId:'string',spec:'string',qty:'number',checked:'boolean'},orders:{name:'string',type:'string',date:'string',contact:'object',subtotal:'number',memberDiscount:'number',couponDiscount:'number',pointsUsed:'number',shipping:'number',created:'number',expires:'number',tracking:'array'},addresses:{name:'string',phone:'string',area:'string',detail:'string',isDefault:'boolean'},favorites:{type:'string',id:'string'},ledger:{id:'string',ref:'string',amount:'number',label:'string',time:'number'},messages:{id:'string',category:'string',title:'string',body:'string',time:'number',route:'string'},adoptable:{name:'string',breed:'string',age:'string',art:'string',desc:'string'},adoptions:{petId:'string',contact:'object',home:'string',experience:'string',reason:'string',status:'string',time:'number',followups:'array'},friends:{id:'string',name:'string',phone:'string',firstOrder:'boolean',time:'number'},support:{id:'string',user:'boolean',text:'string',time:'number'},payments:{id:'string',orderId:'string',outcome:'string',amount:'number',time:'number'}};
    for(const [k,spec] of Object.entries(specs))for(const o of s[k])shape(o,spec);
    for(const p of s.products){strings(p.specs);for(const r of p.reviews){shape(r,{user:'string',rating:'number',content:'string'});int(r.rating,1,5);}}
    for(const a of s.activities){int(a.price,0,99999999);int(a.child,0,99999999);int(a.minutes,1,600);int(a.capacity,1,999);}
    for(const p of s.posts){p.images.forEach(image);for(const c of p.comments)shape(c,{id:'string',user:'string',text:'string',time:'number'});if(p.images.length>3)fail('帖子图片过多');}
    for(const a of s.articles)if(a.body.some(b=>!Array.isArray(b)||b.length!==2||b.some(x=>typeof x!=='string')))fail('文章数据无效');
    for(const p of s.pets){image(p.avatar);validDate(p.birthday);for(const w of p.weights){shape(w,{date:'string',value:'number'});validDate(w.date);if(w.value<=0||w.value>150)fail('体重记录无效');}}
    for(const h of s.health){if(!s.pets.some(p=>p.id===h.petId)||!['vaccine','worm','checkup'].includes(h.kind))fail('健康记录关联无效');validDate(h.date);if(h.next)validDate(h.next);image(h.photo);}
    for(const c of s.coupons){validDate(c.expires);int(c.amount,0,99999999);int(c.min,0,99999999);if(!['all','shop','activity'].includes(c.scope)||c.usedBy&&!s.orders.some(o=>o.id===c.usedBy))fail('优惠券关联无效');}
    for(const o of s.orders){if(!['shop','activity','boarding','grooming','checkup'].includes(o.type))fail('订单类型无效');shape(o.contact,{name:'string',phone:'string'});validDate(o.date);for(const k of ['subtotal','memberDiscount','couponDiscount','pointsUsed','shipping','total'])int(o[k],0,99999999);for(const i of o.items){shape(i,{productId:'string',name:'string',price:'number',qty:'number',spec:'string'});int(i.qty,1,99);int(i.price,0,99999999);if(!s.products.some(p=>p.id===i.productId))fail('商品关联无效');}for(const t of o.tracking)shape(t,{time:'number',text:'string'});if(o.review){shape(o.review,{rating:'number',content:'string'});int(o.review.rating,1,5);}if(o.type==='activity'&&(!s.activities.some(a=>a.id===o.activityId)||!/^\d\d:\d\d$/.test(o.slot)||!Number.isInteger(o.people)))fail('活动订单关联无效');if(o.type==='shop'&&o.delivery==='express')shape(o.address,{name:'string',phone:'string',area:'string',detail:'string'});}
    for(const o of s.orders)if(o.care!==undefined){if(!Array.isArray(o.care))fail('照护记录格式错误');for(const c of o.care)shape(c,{id:'string',date:'string',kind:'string',note:'string',time:'number'});}
    for(const a of s.adoptions){shape(a.contact,{name:'string',phone:'string'});if(!s.adoptable.some(p=>p.id===a.petId)||!['pending','approved','rejected','adopted'].includes(a.status))fail('领养关联无效');for(const f of a.followups)shape(f,{time:'number',text:'string'});}
    for(const c of s.campaigns.commissions)shape(c,{id:'string',friendId:'string',amount:'number',time:'number',withdrawn:'boolean'});
    for(const w of s.campaigns.withdrawals)shape(w,{id:'string',amount:'number',time:'number'});
    return s;
  }
  let state,loadError='';
  try{const raw=localStorage.getItem(KEY);state=raw?validate(JSON.parse(raw)):seed();if(!raw)localStorage.setItem(KEY,JSON.stringify(state));}catch(e){loadError='本地数据读取失败：'+e.message+'。未覆盖原数据，请在设置中导入有效备份或重置。';state=seed();}
  function tx(fn){
    if(loadError)fail(loadError);
    const raw=localStorage.getItem(KEY);const latest=raw?validate(JSON.parse(raw)):state;
    const draft=clone(latest);const result=fn(draft);draft.revision=(latest.revision||0)+1;validate(draft);
    try{localStorage.setItem(KEY,JSON.stringify(draft));}catch(e){fail('保存失败，未提交本次操作。请减少上传图片或导出备份后清理空间。');}
    state=draft;window.dispatchEvent(new CustomEvent('farm:change'));return result;
  }
  const find=(a,id,label='记录')=>a.find(x=>x.id===id)||fail(label+'不存在');
  function message(s,title,body,route='orders',category='order'){s.messages.unshift({id:uid('msg'),title,body,route,category,time:Date.now()});}
  function points(s,amount,label,ref){if(!amount||s.ledger.some(l=>l.ref===ref))return;s.user.points+=amount;s.ledger.unshift({id:uid('ledger'),amount,label,ref,time:Date.now()});}
  function reward(s,amount,label,ref){if(s.rewards.includes(ref))return;s.rewards.push(ref);points(s,amount,label,ref);}
  function slots(a){return ['09:00','10:00','13:00','14:00','15:00','16:00'].map(start=>({start,end:minutesTime(timeMinutes(start)+a.minutes)}));}
  const timeMinutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
  const minutesTime=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  function available(s,activityId,date,slot,exclude){
    const a=find(s.activities,activityId,'活动');const start=timeMinutes(slot),end=start+a.minutes;
    const occupied=s.orders.filter(o=>o.id!==exclude&&o.type==='activity'&&o.activityId===activityId&&o.date===date&&holding(o)&&!(o.status==='pending'&&o.expires<=Date.now()));
    const intervals=occupied.map(o=>({start:timeMinutes(o.slot),end:timeMinutes(o.slot)+a.minutes,people:o.people})).filter(o=>o.start<end&&o.end>start);
    const times=[start,...intervals.flatMap(o=>[Math.max(start,o.start),Math.min(end,o.end)])].filter(t=>t<end);
    const peak=Math.max(0,...times.map(t=>intervals.filter(o=>o.start<=t&&o.end>t).reduce((v,o)=>v+o.people,0)));
    return Math.max(0,a.capacity-peak);
  }
  function bookingCheck(s,f,exclude){
    const a=find(s.activities,f.activityId,'活动');validDate(f.date);
    if(f.date<day()||f.date>day(6))fail('请选择未来7天内的活动日期');
    if(!slots(a).some(t=>t.start===f.slot))fail('请选择有效时段');
    if(new Date(f.date+'T'+f.slot+':00').getTime()<=Date.now())fail('该时段已开始，请选择其他时段');
    const adults=int(f.adults,1,30),kids=int(f.kids,0,30),people=adults+kids;
    if(available(s,a.id,f.date,f.slot,exclude)<people)fail('该时段余位不足，请减少人数或换个时段');
    if(f.petId)find(s.pets,f.petId,'宠物');
    return {a,adults,kids,people,contact:contact(f)};
  }
  function couponState(s,c){if(c.usedBy){const o=s.orders.find(o=>o.id===c.usedBy);return o?.status==='pending'?'reserved':'used';}return c.expires<day()?'expired':'available';}
  function couponValid(s,c,type,subtotal){return couponState(s,c)==='available'&&(c.scope==='all'||c.scope===type)&&subtotal>=c.min&&(!c.weekday||new Date().getDay()===c.weekday);}
  function quote(s,{type,subtotal,couponId='',usePoints=false,delivery='pickup',freeCheck=false,date}){
    int(subtotal,0,99999999);
    const memberDiscount=type==='activity'?Math.round(subtotal*(100-level(s).discount)/100):0;
    const afterMember=subtotal-memberDiscount;
    let couponDiscount=0;
    if(couponId){const c=find(s.coupons,couponId,'优惠券');if(!couponValid(s,c,type,afterMember))fail('该优惠券不满足范围、日期或门槛条件');couponDiscount=Math.min(c.amount,afterMember);}
    const quarterly=quarter(type==='checkup'&&date?date:day());const used=s.orders.filter(o=>o.freeCheck&&o.quarter===quarterly&&holding(o)).length;
    if(freeCheck){if(type!=='checkup'||used>=level(s).checks)fail('本季度免费体检次数不足');couponDiscount=afterMember;couponId='';}
    const beforePoints=afterMember-couponDiscount;
    const pointsUsed=usePoints?Math.min(Math.max(0,s.user.points),Math.floor(beforePoints*.2)):0;
    const shipping=type==='shop'&&delivery==='express'&&subtotal<9900?800:0;
    return {subtotal,memberDiscount,couponId:couponId||null,couponDiscount,pointsUsed,shipping,total:beforePoints-pointsUsed+shipping,freeCheck:!!freeCheck,quarter:quarterly};
  }
  const quarter=(date=day())=>{validDate(date);return date.slice(0,4)+'-Q'+Math.ceil(Number(date.slice(5,7))/3);};
  function makeOrder(s,data,pricing){
    const o={id:uid('MC'),status:'pending',created:Date.now(),expires:Date.now()+15*60000,paidAt:null,token:uid('ticket'),items:[],tracking:[],review:null,rewardPoints:0,growthEarned:0,...data,...pricing};
    if(o.couponId)find(s.coupons,o.couponId).usedBy=o.id;
    points(s,-o.pointsUsed,'下单积分抵扣（待支付预占）','spend:'+o.id);
    s.orders.unshift(o);message(s,'订单已创建',o.name+'，请在15分钟内完成演示支付。','order/'+o.id);return o.id;
  }
  function release(s,o,status){
    if(!holding(o))fail('订单已处理，请勿重复操作');
    if(o.type==='shop')for(const item of o.items)find(s.products,item.productId).stock+=item.units||item.qty;
    if(o.couponId){const c=s.coupons.find(c=>c.id===o.couponId);if(c?.usedBy===o.id)c.usedBy=null;}
    points(s,o.pointsUsed,'返还订单抵扣积分','return-spend:'+o.id);
    if(o.rewardPoints)points(s,-o.rewardPoints,'退款扣回消费奖励','revoke:'+o.id);
    s.user.growth=Math.max(0,s.user.growth-(o.growthEarned||0));o.status=status;o.closedAt=Date.now();
  }
  function expired(){const needs=state.orders.some(o=>o.status==='pending'&&o.expires<=Date.now());if(needs)tx(s=>{s.orders.filter(o=>o.status==='pending'&&o.expires<=Date.now()).forEach(o=>{release(s,o,'cancelled');message(s,'待支付订单已超时',o.name+'的名额/库存与优惠已释放。','order/'+o.id);});});}
  function cancelAllowed(o){return o.type==='shop'?o.status==='paid':['activity','grooming','boarding','checkup'].includes(o.type)&&o.status==='paid'&&new Date(o.date+'T'+(o.slot||'09:00')+':00')-Date.now()>=86400000;}
  function serviceCheck(s,f,exclude){
    const type=f.type;if(!services[type])fail('服务不存在');const pet=find(s.pets,f.petId,'宠物');contact(f);validDate(f.date);
    if(f.date<day())fail('预约日期不能早于今天');
    if(type==='boarding'){
      validDate(f.endDate);const nights=days(f.date,f.endDate);if(nights<1||nights>30)fail('寄养日期需为1—30晚');
      if(s.orders.some(o=>o.id!==exclude&&o.type==='boarding'&&o.petId===f.petId&&holding(o)&&o.date<f.endDate&&o.endDate>f.date&&!(o.status==='pending'&&o.expires<=Date.now())))fail('该宠物在所选日期已有寄养预约');
      const room=find(rooms,f.roomId,'房型');
      for(let i=0;i<nights;i++){const d=new Date(f.date+'T12:00:00');d.setDate(d.getDate()+i);const date=dateOf(d);const count=s.orders.filter(o=>o.id!==exclude&&o.type==='boarding'&&o.roomId===room.id&&holding(o)&&o.date<=date&&o.endDate>date&&!(o.status==='pending'&&o.expires<=Date.now())).length;if(count>=room.capacity)fail(date+'该房型已满，请更换日期或房型');}
      return {name:pet.name+' · '+room.name+'寄养',subtotal:room.price*nights,nights,roomId:room.id,endDate:f.endDate,slot:'09:00'};
    }
    if(!['09:00','11:00','14:00','16:00'].includes(f.slot)||new Date(f.date+'T'+f.slot+':00')<=new Date())fail('请选择尚未开始的服务时段');
    const tech=f.tech||'小林';if(!['小林','小陈','阿乐'].includes(tech))fail('请选择技师');
    const taken=s.orders.some(o=>o.id!==exclude&&['grooming','checkup'].includes(o.type)&&o.tech===tech&&o.date===f.date&&o.slot===f.slot&&holding(o)&&!(o.status==='pending'&&o.expires<=Date.now()));if(taken)fail('该服务人员此时段已被预约');
    const item=type==='grooming'?find(grooming,f.serviceId,'项目'):{id:'checkup',name:'健康体检',price:12800};
    return {name:pet.name+' · '+item.name,subtotal:item.price,serviceId:item.id,tech,slot:f.slot};
  }
  const api={
    care(id,f){tx(s=>{const o=find(s.orders,id);if(o.type!=='boarding'||o.status!=='in_service')fail('只有已入住的寄养订单可记录照护');validDate(f.date);if(f.date<o.date||f.date>=o.endDate)fail('照护日期须在入住至退房前一日之间');if(!['喂食','遛弯','健康观察'].includes(f.kind))fail('请选择照护类型');(o.care||(o.care=[])).push({id:uid('care'),date:f.date,kind:f.kind,note:text(f.note,3,300),time:Date.now()});message(s,'寄养照护记录更新',o.name+' · '+f.date+' '+f.kind,'order/'+id,'service');});},
    checkoutBoarding(id){tx(s=>{const o=find(s.orders,id);if(o.type!=='boarding'||o.status!=='in_service')fail('当前寄养订单不能退房');o.status='done';o.completed=Date.now();message(s,'寄养已完成 · 演示',o.name+'已模拟退房，期待下次见面。','order/'+id,'service');});},
    KEY,VERSION,day,dateOf,days,money,level,levels,slots,rooms,grooming,services,available:(a,d,t,x)=>available(state,a,d,t,x),couponState:c=>couponState(state,c),couponValid:(c,t,n)=>couponValid(state,c,t,n),quote:f=>quote(state,f),cancelAllowed,quarter,effectiveMultiplier:()=>effectiveMultiplier(state),
    get:()=>clone(state),error:()=>loadError,expire:expired,
    cartAdd(productId,spec='标准装'){tx(s=>{const p=find(s.products,productId,'商品');if(!p.specs.includes(spec))fail('请选择商品规格');const factor=spec==='双件装'?2:1;const item=s.cart.find(c=>c.productId===productId&&c.spec===spec);const totalUnits=s.cart.filter(c=>c.productId===productId).reduce((v,c)=>v+c.qty*(c.spec==='双件装'?2:1),0);if(totalUnits+factor>p.stock)fail('可售库存不足');if(item){item.qty++;item.checked=true;}else s.cart.push({id:uid('cart'),productId,spec,qty:1,checked:true});});},
    cartChange(id,qty){tx(s=>{const c=find(s.cart,id);qty=int(qty,0,99);if(!qty){s.cart=s.cart.filter(c=>c.id!==id);return;}const p=find(s.products,c.productId);const other=s.cart.filter(x=>x.id!==id&&x.productId===c.productId).reduce((v,x)=>v+x.qty*(x.spec==='双件装'?2:1),0);if(other+qty*(c.spec==='双件装'?2:1)>p.stock)fail('可售库存不足');c.qty=qty;});},
    cartToggle(id){tx(s=>{const c=find(s.cart,id);c.checked=!c.checked;});},
    cartAll(){tx(s=>{const next=!s.cart.length?false:!s.cart.every(c=>c.checked);s.cart.forEach(c=>c.checked=next);});},
    cartDeleteSelected(){tx(s=>{s.cart=s.cart.filter(c=>!c.checked);});},
    createActivity(f){return tx(s=>{const c=bookingCheck(s,f);const pricing=quote(s,{couponId:f.couponId,usePoints:f.usePoints,type:'activity',subtotal:c.a.price*c.adults+c.a.child*c.kids});return makeOrder(s,{type:'activity',activityId:c.a.id,name:c.a.name,date:f.date,slot:f.slot,adults:c.adults,kids:c.kids,people:c.people,petId:f.petId||'',contact:c.contact},pricing);});},
    createShop(f){return tx(s=>{
      const lines=f.buyNow?[{id:null,productId:f.productId,spec:f.spec||'标准装',qty:int(f.qty||1,1,99)}]:s.cart.filter(c=>c.checked);
      if(!lines.length)fail('请先选择要结算的商品');
      const items=lines.map(c=>{const p=find(s.products,c.productId,'商品');if(!p.specs.includes(c.spec))fail('商品规格不存在');const factor=c.spec==='双件装'?2:1;return {productId:p.id,name:p.name,qty:int(c.qty,1,99),spec:c.spec,price:p.price*factor,units:c.qty*factor,cartId:c.id};});
      for(const p of s.products){const count=items.filter(i=>i.productId===p.id).reduce((v,i)=>v+i.units,0);if(count>p.stock)fail(p.name+'库存不足');p.stock-=count;}
      if(!['express','pickup'].includes(f.delivery))fail('请选择配送方式');const address=f.delivery==='express'?clone(find(s.addresses,f.addressId,'收货地址')):null;
      const person=address?{name:address.name,phone:address.phone}:contact(f);
      const pricing=quote(s,{...f,type:'shop',subtotal:items.reduce((v,i)=>v+i.price*i.qty,0)});
      return makeOrder(s,{type:'shop',name:items[0].name+(items.length>1?' 等'+items.length+'种商品':''),items,date:day(),delivery:f.delivery,store:'萌宠农场 · 南山店',address,contact:person,note:String(f.note||'').slice(0,300)},pricing);
    });},
    createService(f){return tx(s=>{const info=serviceCheck(s,f);const pricing=quote(s,{...f,type:f.type,subtotal:info.subtotal});return makeOrder(s,{...info,type:f.type,date:f.date,petId:f.petId,contact:contact(f)},pricing);});},
    pay(id,outcome='success'){return tx(s=>{const o=find(s.orders,id,'订单');if(o.status!=='pending')fail('该订单已处理，无需重复支付');if(o.expires<=Date.now())fail('订单已超时，请返回订单列表刷新');if(!['success','failed','cancelled'].includes(outcome))fail('支付结果无效');s.payments.unshift({id:uid('pay'),orderId:id,outcome,amount:o.total,time:Date.now(),demo:true});if(outcome!=='success')return id;
      o.status='paid';o.paidAt=Date.now();const goods=Math.max(0,o.total-o.shipping);o.rewardMultiplier=effectiveMultiplier(s);o.rewardPoints=Math.floor(goods/100*o.rewardMultiplier);o.growthEarned=Math.floor(goods/100);points(s,o.rewardPoints,'消费奖励'+(new Date().getDay()===3?'（会员日翻倍）':''),'paid:'+o.id);s.user.growth+=o.growthEarned;
      if(o.type==='shop')for(const i of o.items){const c=s.cart.find(c=>c.id===i.cartId);if(c)c.qty-=i.qty;s.cart=s.cart.filter(c=>c.qty>0);}
      message(s,'支付成功 · 演示',o.name+'已支付¥'+money(o.total)+'。'+(o.type==='activity'?'到店出示预约券码。':'请在订单中查看服务进度。'),'order/'+id);return id;
    });},
    cancel(id){tx(s=>{const o=find(s.orders,id,'订单');if(o.status!=='pending')fail('只有待支付订单可直接取消');release(s,o,'cancelled');message(s,'订单已取消',o.name+'，预占资源已释放。','order/'+id);});},
    refund(id){tx(s=>{const o=find(s.orders,id,'订单');if(o.status==='shipped'){o.status='return_requested';message(s,'退货申请已登记','请使用订单演示工具确认退货后完成退款。','order/'+id);return;}if(!cancelAllowed(o)&&o.status!=='return_requested')fail('活动/服务须提前24小时退款；已完成订单不支持此演示退款');release(s,o,'refunded');message(s,'退款完成 · 演示','已返还¥'+money(o.total)+'，释放库存/名额、返还券及抵扣积分，扣回消费奖励。','order/'+id);});},
    verify(code){return tx(s=>{const o=s.orders.find(o=>code===`PAWFARM:${o.id}:${o.token}`||code===o.token);if(!o)fail('券码无效或不属于当前演示数据');if(o.type==='shop')fail('商城订单请走配送或自提流程');if(o.status!=='paid')fail('该券码未付款、已核销或已失效');o.status=o.type==='boarding'?'in_service':'done';o.verifiedAt=Date.now();if(o.type==='boarding')o.care=[];message(s,'到店核销完成 · 演示',o.name+(o.type==='boarding'?'已模拟入住，可记录每日照护并办理退房。':'已完成，期待下次相见。'),'order/'+o.id);return o.id;});},
    ship(id){tx(s=>{const o=find(s.orders,id);if(o.type!=='shop'||o.status!=='paid')fail('当前订单不能发货');o.status='shipped';o.tracking=[{time:Date.now(),text:o.delivery==='pickup'?'商品已备好，等待到店自提':'农场仓库已出库，演示配送员运输中'}];o.trackingId='DEMO'+Date.now();message(s,o.delivery==='pickup'?'自提商品已备好':'商品已发货 · 演示',o.name,'order/'+id);});},
    receive(id){tx(s=>{const o=find(s.orders,id);if(o.type!=='shop'||o.status!=='shipped')fail('请先完成演示发货/备货');o.status='done';o.completed=Date.now();o.tracking.push({time:Date.now(),text:o.delivery==='pickup'?'用户已确认提货':'用户已确认收货'});message(s,'订单已完成',o.name+'，欢迎分享使用体验。','order/'+id);});},
    review(id,rating,content){tx(s=>{const o=find(s.orders,id);if(o.status!=='done'||o.review)fail('订单未完成或已经评价');o.review={rating:int(rating,1,5),content:text(content,3,500),user:s.user.name,time:Date.now()};if(o.type==='shop')for(const item of o.items)find(s.products,item.productId).reviews.unshift(clone(o.review));message(s,'评价已发布','感谢分享这次体验。','order/'+id);});},
    again(id){const o=find(state.orders,id);if(o.type==='shop'){tx(s=>{for(const i of o.items){const p=find(s.products,i.productId);const factor=i.spec==='双件装'?2:1;const inCart=s.cart.filter(x=>x.productId===p.id).reduce((n,x)=>n+x.qty*(x.spec==='双件装'?2:1),0);if(inCart+i.qty*factor>p.stock)fail(p.name+'库存不足');const c=s.cart.find(c=>c.productId===p.id&&c.spec===i.spec);if(c){if((c.qty+i.qty)*factor>p.stock)fail('购物车数量超过库存');c.qty+=i.qty;c.checked=true;}else s.cart.push({id:uid('cart'),productId:p.id,spec:i.spec,qty:i.qty,checked:true});}});return 'cart';}return o.type==='activity'?'activity/'+o.activityId:'service/'+o.type;},
    reschedule(id,f){tx(s=>{const o=find(s.orders,id);if(o.type!=='activity'||!cancelAllowed(o))fail('仅提前24小时的待使用活动可改期');bookingCheck(s,{...o,...f,name:o.contact.name,phone:o.contact.phone},id);o.date=f.date;o.slot=f.slot;message(s,'活动已改期',o.name+'，新时段 '+f.date+' '+f.slot,'order/'+id);});},
    favorite(type,id){tx(s=>{const list={product:s.products,activity:s.activities,article:s.articles}[type];if(!list)fail('收藏类型无效');find(list,id);const exists=s.favorites.find(f=>f.type===type&&f.id===id);s.favorites=exists?s.favorites.filter(f=>f!==exists):[...s.favorites,{type,id}];});},
    likePost(id){tx(s=>{const p=find(s.posts,id,'帖子');p.liked=!p.liked;p.likes+=p.liked?1:-1;if(p.author==='me'&&p.liked)reward(s,1,'帖子获得点赞','post-like:'+id+':me');});},
    follow(id){tx(s=>{find(s.authors,id,'作者');s.follows=s.follows.includes(id)?s.follows.filter(a=>a!==id):[...s.follows,id];});},
    publish(f){return tx(s=>{const content=text(f.content,5,2000);const images=(f.images||[]).slice(0,3);if(images.some(x=>!/^data:image\/(png|jpeg|webp);base64,/.test(x)))fail('图片格式无效');const id=uid('post');s.posts.unshift({id,author:'me',content,tag:text(f.tag,1,20),topic:String(f.topic||'养宠日常').slice(0,30),images,likes:0,liked:false,baseComments:0,comments:[],time:Date.now()});reward(s,10,'发布帖子','publish:'+id);message(s,'帖子已发布','获得10积分，看看大家的新鲜事吧。','post/'+id,'community');return id;});},
    comment(id,value){tx(s=>{const p=find(s.posts,id);p.comments.push({id:uid('comment'),user:s.user.name,text:text(value,1,500),time:Date.now()});});},
    readArticle(id){if(state.reads.includes(id))return;tx(s=>{find(s.articles,id).reads++;s.reads.push(id);});},
    likeArticle(id){tx(s=>{const a=find(s.articles,id);a.liked=!a.liked;a.likes+=a.liked?1:-1;});},
    savePet(f){return tx(s=>{const existing=f.id?s.pets.find(p=>p.id===f.id):null;if(f.id&&!existing)fail('宠物不存在');const birthday=validDate(f.birthday);if(birthday>day())fail('出生日期不能在未来');const weight=Number(f.weight);if(!Number.isFinite(weight)||weight<=0||weight>150)fail('体重需在0—150kg之间');if(!['犬','猫','兔','其他'].includes(f.species)||!['公','母'].includes(f.gender))fail('请选择物种和性别');const chip=String(f.chip||'').trim();if(chip&&s.pets.some(p=>p.id!==f.id&&p.chip===chip))fail('该芯片号已登记');const p={id:existing?.id||uid('pet'),name:text(f.name,1,20),species:f.species,breed:text(f.breed,1,30),gender:f.gender,birthday,weight,neutered:!!f.neutered,chip,avatar:f.avatar||existing?.avatar||'',art:f.species==='猫'?'cat':f.species==='兔'?'rabbit':'dog',weights:existing?.weights||[{date:day(),value:weight}]};if(existing){Object.assign(existing,p);const last=existing.weights.at(-1);if(last?.value!==weight){existing.weights=existing.weights.filter(w=>w.date!==day());existing.weights.push({date:day(),value:weight});existing.weights.sort((a,b)=>a.date.localeCompare(b.date));}}else{s.pets.push(p);reward(s,20,'建立宠物档案','pet:'+p.id);}return p.id;});},
    weight(petId,date,value){tx(s=>{const p=find(s.pets,petId);validDate(date);value=Number(value);if(date>day()||date<p.birthday||!Number.isFinite(value)||value<=0||value>150)fail('请检查记录日期与体重');p.weights=p.weights.filter(w=>w.date!==date);p.weights.push({date,value});p.weights.sort((a,b)=>a.date.localeCompare(b.date));p.weight=p.weights.at(-1).value;});},
    saveHealth(f){return tx(s=>{find(s.pets,f.petId,'宠物');if(!['vaccine','worm','checkup'].includes(f.kind))fail('记录类型无效');validDate(f.date);if(f.date>day())fail('实际记录日期不能在未来');if(f.next){validDate(f.next);if(f.next<=f.date)fail('下次日期须晚于本次日期');}const existing=f.id?find(s.health,f.id):null;const record={id:existing?.id||uid('health'),petId:f.petId,kind:f.kind,type:text(f.type,1,40),name:text(f.name,1,60),date:f.date,next:f.next||'',provider:text(f.provider,1,60),batch:String(f.batch||'').slice(0,50),note:String(f.note||'').slice(0,500),photo:f.photo||existing?.photo||''};if(existing)Object.assign(existing,record);else{s.health.push(record);if(f.kind==='vaccine')reward(s,10,'登记疫苗','vaccine:'+record.id);}return record.id;});},
    saveAddress(f){return tx(s=>{const addr={id:f.id||uid('addr'),...contact(f),area:text(f.area,2,80),detail:text(f.detail,3,150),isDefault:!!f.isDefault||s.addresses.length===0};if(addr.isDefault)s.addresses.forEach(a=>a.isDefault=false);const existing=f.id?find(s.addresses,f.id):null;if(existing)Object.assign(existing,addr);else s.addresses.push(addr);if(!s.addresses.some(a=>a.isDefault))s.addresses[0].isDefault=true;return addr.id;});},
    deleteAddress(id){tx(s=>{find(s.addresses,id);s.addresses=s.addresses.filter(a=>a.id!==id);if(s.addresses.length&&!s.addresses.some(a=>a.isDefault))s.addresses[0].isDefault=true;});},
    defaultAddress(id){tx(s=>{find(s.addresses,id);s.addresses.forEach(a=>a.isDefault=a.id===id);});},
    sign(){tx(s=>{const ref='sign:'+day();if(s.rewards.includes(ref))fail('今天已经签到啦');reward(s,5,'每日签到',ref);});},
    redeem(){tx(s=>{if(s.user.points<500)fail('积分不足500');const id=uid('coupon');points(s,-500,'兑换满49减10券','redeem:'+id);s.coupons.push({id,name:'积分兑换券',amount:1000,min:4900,scope:'all',expires:day(30),weekday:null,usedBy:null});});},
    claim(kind){tx(s=>{const l=level(s);const month=day().slice(0,7);if(kind==='monthly'){const key='monthly:'+month;const count=s.claims.filter(c=>c.startsWith(key)).length;if(count>=l.coupons)fail('本月可领取次数已用完，或当前等级暂无此权益');const ref=key+':'+count;s.claims.push(ref);s.coupons.push({id:uid('coupon'),name:'会员月度满减券',amount:1000,min:4900,scope:'all',expires:day(30),usedBy:null,weekday:null});}else if(kind==='birthday'){if(l.n<2||s.user.birthday.slice(5,7)!==month.slice(5))fail('生日当月且L2以上可领取');const key='birthday:'+month.slice(0,4);if(s.claims.includes(key))fail('今年已领取生日礼');s.claims.push(key);reward(s,l.n===4?200:100,'生日积分礼包',key);}else fail('权益不存在');});},
    updateProfile(f){tx(s=>{s.user.name=text(f.name,1,30);s.user.phone=phone(f.phone);if(f.birthday){validDate(f.birthday);if(f.birthday>day())fail('生日不能在未来');s.user.birthday=f.birthday;}s.settings.notify=!!f.notify;});},
    demoLevel(n){tx(s=>{const l=find(levels.map(l=>({...l,id:String(l.n)})),String(n));s.user.growth=l.min;message(s,'会员等级演练','已切换到L'+n+'，用于测试权益和折扣。','member','system');});},
    readMessage(id){if(state.readMessages.includes(id))return;tx(s=>s.readMessages.push(id));},
    readAll(){tx(s=>{s.readMessages=[...new Set([...s.readMessages,...notifications(s).map(m=>m.id)])];});},
    applyAdopt(f){return tx(s=>{const p=find(s.adoptable,f.petId,'待领养宠物');if(s.adoptions.some(a=>a.petId===p.id&&a.status!=='rejected'))fail('该宠物已有领养申请');const id=uid('adopt');s.adoptions.unshift({id,petId:p.id,contact:contact(f),home:text(f.home,3,100),experience:text(f.experience,3,300),reason:text(f.reason,10,500),status:'pending',time:Date.now(),followups:[]});message(s,'领养申请已提交',p.name+'的申请已登记，请等待演示审核。','adoption','service');return id;});},
    adoptionAction(id,action,note=''){tx(s=>{const a=find(s.adoptions,id);if(action==='approve'&&a.status==='pending')a.status='approved';else if(action==='reject'&&a.status==='pending')a.status='rejected';else if(action==='complete'&&a.status==='approved')a.status='adopted';else if(action==='followup'&&a.status==='adopted')a.followups.push({time:Date.now(),text:text(note,5,500)});else fail('申请状态不支持该操作');message(s,'领养申请进度更新',find(s.adoptable,a.petId).name+'：'+({approved:'已通过演示审核',rejected:'审核未通过',adopted:'已完成演示领养'}[a.status]||'已记录回访'),'adoption','service');});},
    invite(f){tx(s=>{const p=phone(f.phone);if(p===s.user.phone||s.friends.some(x=>x.phone===p))fail('该手机号已参与或属于当前用户');const id=uid('friend');s.friends.push({id,name:text(f.name,1,30),phone:p,inviterId:s.user.id,inviteCode:'PAW-DEMO-ME',firstOrder:false,time:Date.now()});reward(s,50,'邀请好友注册（演示）','invite:'+p);message(s,'邀请奖励到账','模拟好友注册已完成，获得50积分。','promo','system');});},
    friendOrder(id){tx(s=>{const f=find(s.friends,id);if(f.firstOrder)fail('首单奖励已发放');f.firstOrder=true;reward(s,100,'好友首单奖励（演示）','friend-first:'+id);s.campaigns.commissions.push({id:uid('commission'),friendId:id,amount:500,time:Date.now(),withdrawn:false});});},
    campaign(kind,friendId){tx(s=>{const f=find(s.friends,friendId,'模拟好友');const c=s.campaigns[kind];if(!['group','bargain'].includes(kind)||!c)fail('活动不存在');const list=kind==='group'?c.members:c.helpers;if(list.includes(f.id))fail('该好友已经参与');if(list.length>=2)fail('活动已达成');list.push(f.id);});},
    campaignClaim(kind){tx(s=>{if(!['group','bargain'].includes(kind))fail('活动不存在');const c=s.campaigns[kind];const count=(kind==='group'?c.members:c.helpers).length;if(count<2||c.claimed)fail('需2位不同好友参与，且只能领取一次');c.claimed=true;s.coupons.push({id:uid('coupon'),name:kind==='group'?'三人团达成券':'助力砍价达成券',amount:kind==='group'?2000:1500,min:kind==='group'?9900:7900,scope:'shop',expires:day(7),usedBy:null,weekday:null});});},
    withdraw(){tx(s=>{const lines=s.campaigns.commissions.filter(c=>!c.withdrawn);const amount=lines.reduce((v,c)=>v+c.amount,0);if(!amount)fail('暂无可演示提现的佣金');lines.forEach(c=>c.withdrawn=true);s.campaigns.withdrawals.push({id:uid('withdraw'),amount,time:Date.now(),demo:true});message(s,'佣金模拟结算完成','演示结算¥'+money(amount)+'，未发生真实转账。','promo','system');});},
    support(value){tx(s=>{const content=text(value,3,500);s.support.push({id:uid('support'),user:true,text:content,time:Date.now()});const reply=content.includes('退款')?'可在我的订单申请退款。活动和服务需提前24小时，商城发货前可直接退款，发货后先申请退货。':content.includes('疫苗')?'可在我的宠物中登记疫苗与下次接种日期，消息中心会同步本地提醒。':content.includes('预约')?'在活动详情选择日期、时段与人数，创建订单后通过演示支付即可获得预约券码。':'已记录您的问题。这里是本地演示客服，可继续询问预约、退款、疫苗与订单。';s.support.push({id:uid('support'),user:false,text:reply,time:Date.now()});});},
    notifications:()=>notifications(state),
    export:()=>JSON.stringify(state,null,2),
    import(raw){if(typeof raw!=='string'||raw.length>12*1024*1024)fail('备份文件过大或无效');const s=validate(JSON.parse(raw));try{localStorage.setItem(KEY,JSON.stringify(s));}catch{fail('导入保存失败，请检查空间');}state=clone(s);loadError='';window.dispatchEvent(new CustomEvent('farm:change'));},
    reset(){const s=seed();try{localStorage.setItem(KEY,JSON.stringify(s));}catch{fail('无法保存，请检查浏览器存储设置');}state=s;loadError='';window.dispatchEvent(new CustomEvent('farm:change'));},
  };
  function notifications(s){
    const derived=[];
    const latest=new Map();for(const h of s.health){const key=h.petId+'|'+h.kind+'|'+h.type,old=latest.get(key);if(!old||h.date>=old.date)latest.set(key,h);}
    for(const h of latest.values()){if(!h.next||days(day(),h.next)>7)continue;const pet=s.pets.find(p=>p.id===h.petId);if(!pet)continue;const n=days(day(),h.next);derived.push({id:'health:'+h.id+':'+h.next,category:'health',title:pet.name+'的'+h.name+(n<0?'已逾期':n===0?'今日到期':'即将到期'),body:`下次日期 ${h.next} · ${n<0?'逾期'+(-n)+'天':n===0?'今天记得安排':'还有'+n+'天'}`,route:'health/'+pet.id,time:new Date(h.next+'T00:00:00').getTime()});}
    for(const o of s.orders.filter(o=>o.type!=='shop'&&o.status==='paid'&&o.date>=day()&&days(day(),o.date)<=2))derived.push({id:'remind:'+o.id+':'+o.date,category:'activity',title:'别忘了这场约会',body:o.name+' · '+o.date+' '+o.slot,route:'order/'+o.id,time:o.created});
    return [...derived,...s.messages].map(m=>({...m,read:s.readMessages.includes(m.id)}));
  }
  window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{state=validate(JSON.parse(e.newValue));window.dispatchEvent(new CustomEvent('farm:external'));}catch{}});
  return api;
})();
