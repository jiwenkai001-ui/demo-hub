/* 京麦源演示数据：全部为虚构资料，以本地日期生成可重复的业务场景。 */
(function (root) {
  'use strict';
  const J = root.JMY = root.JMY || {};
  const day = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const money = (n) => Math.round(n);
  J.date = day;
  /** 获取月份最后一天。month 为 YYYY-MM；返回本地日期 YYYY-MM-DD，不修改业务状态。 */
  J.monthEnd = month => {const [year,m]=month.split('-').map(Number);const d=new Date(year,m,0);return `${year}-${String(m).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  /** 生成独立演示状态。无参数；返回可序列化对象，不访问网络或修改已有数据。 */
  J.seed = function () {
    const names = [
      ['鲜面系列', ['劲道细面','手工宽面','兰州拉面','刀削面','鸡蛋面','菠菜面','荞麦面']],
      ['面皮系列', ['饺子皮','馄饨皮','烧麦皮','春卷皮','大馄饨皮','水晶蒸饺皮','荞麦饺子皮']],
      ['米制品', ['鲜米线','细米粉','宽米粉','河粉','桂林米粉','米皮','凉皮']],
      ['熟食面点', ['原味馒头','杂粮馒头','花卷','红糖馒头','豆沙包','玉米窝头','南瓜馒头']],
      ['特色面食', ['岐山挂面','油泼面坯','陕西裤带面','手擀面','乌冬面','碱水面','炒面坯']],
      ['定制产品', ['商超鲜切面','餐饮专用宽面','单位食堂细面','全麦营养面','儿童蔬菜面','火锅鲜面','低盐荞麦面']]
    ];
    const products = names.flatMap(([category, list], g) => list.map((name, i) => ({
      id: `P${String(g * 7 + i + 1).padStart(3, '0')}`, name, category, code: `JMY-${String(g * 7 + i + 1).padStart(3, '0')}`,
      basePrice: 620 + g * 145 + i * 65, unit: 'kg', warning: 80, active: true,
      specs: [{label:'2.5kg/袋',kg:2.5},{label:'5kg/袋',kg:5},{label:'散装/公斤',kg:1}],
      shelfLife: g === 3 ? 3 : 2, aliases: [name.replace('劲道','').replace('手工',''), `${name}制品`]
    })));
    const materials = [
      ['高筋小麦粉',460],['中筋小麦粉',380],['优质大米粉',520],['食用玉米淀粉',650],
      ['鲜鸡蛋液',980],['食用盐',220],['食用碱',850],['食品包装袋',120]
    ].map(([name, price], i) => ({id:`R${String(i + 1).padStart(3,'0')}`,name,basePrice:price,unit:'kg',warning:100,category:i>3?'辅料':'原料'}));
    const regions = ['雁塔区','未央区','莲湖区','碑林区','灞桥区','长安区'];
    const routes = [
      {id:'L1',name:'城南一线',driver:'王师傅',phone:'演示司机 01',vehicle:'陕A·演示01'},
      {id:'L2',name:'城北二线',driver:'刘师傅',phone:'演示司机 02',vehicle:'陕A·演示02'},
      {id:'L3',name:'城西三线',driver:'张师傅',phone:'演示司机 03',vehicle:'陕A·演示03'},
      {id:'L4',name:'城东四线',driver:'陈师傅',phone:'演示司机 04',vehicle:'陕A·演示04'},
      {id:'L5',name:'长安专线',driver:'赵师傅',phone:'演示司机 05',vehicle:'陕A·演示05'}
    ];
    const customerNames = ['永辉超市·雁塔店','福满家鲜面店','老陕人家餐饮','高新科技园食堂','邻里生鲜·未央店','麦香鲜面坊','西安味道餐饮','悦购商超·城西店','幸福里农贸铺','长安书院食堂','四季鲜面店','好邻居生鲜'];
    const types = ['商超','鲜面店','餐饮店','企事业单位','农贸市场'];
    const stems = ['嘉禾','悦邻','惠民','丰源','兴盛','秦味','晨光','家和','瑞丰','麦田','锦华','万福','鲜悦','秦丰'];
    const customers = Array.from({length:420}, (_, i) => ({
      id:`C${String(i+1).padStart(4,'0')}`,name:customerNames[i] || `${stems[i%14]}${types[i%5]}·${regions[i%6]}${Math.floor(i/14)+1}店`,
      type:types[i%5], region:regions[i%6],routeId:routes[i%5].id,salesperson:['李晓晨','陈思远','王雨晴','赵嘉宁','刘明轩','周佳怡'][i%6],
      contact:['王经理','刘店长','张老板','陈主管','李经理'][i%5],phone:`1390000${String(i+1).padStart(4,'0')}`,
      address:`西安市${regions[i%6]}演示路${i+1}号（虚构地址）`,limit:i===1?2000:150000+(i%6)*50000,
      prices:Object.fromEntries(products.slice(0,14).map((p,k)=>[p.id,money(p.basePrice*(0.90+(i%5)*0.02))])),
      tempLimit:i===2?{amount:50000,expiresAt:new Date(Date.now()+86400000).toISOString(),reason:'节前备货临时额度'}:i===3?{amount:30000,expiresAt:new Date(Date.now()-86400000).toISOString(),reason:'已到期额度示例'}:null,
      active:true,note:i<12?'重点演示客户':'',createdAt:day(-80)
    }));
    const state = {version:1,serial:1000,createdAt:new Date().toISOString(),products,materials,regions,routes,customers,
      batches:[],movements:[],orders:[],payments:[],productions:[],reconciliations:[],logs:[],
      promotions:[
        {id:'PR001',name:'鲜面店晨间采购优惠',scope:'group',target:'鲜面店',productId:'P001',discount:95,start:day(-7),end:day(15),active:true},
        {id:'PR002',name:'永辉专享采购礼遇',scope:'customer',target:'C0001',productId:'P002',discount:92,start:day(-3),end:day(10),active:true}
      ]};
    [...products,...materials].forEach((p,i)=>{
      const raw=p.id[0]==='R';
      for(let b=0;b<2;b++) {
        const qty=p.id==='P042'?0:(raw?1800+i*12:420+(i%7)*35)+b*140;
        const batch={id:`${raw?'YL':'CP'}${day().replaceAll('-','')}-${String(i+1).padStart(3,'0')}${b+1}`,itemId:p.id,kind:raw?'raw':'finished',
          qty,received:qty,unitCost:raw?p.basePrice:money(p.basePrice*0.52),receivedAt:day(raw?-6+b:-1+b),supplier:raw?'秦丰粮油供应链':'京麦源生产车间',sourceProductionId:''};
        state.batches.push(batch);
        state.movements.push({id:`MV${state.serial++}`,type:'期初入库',itemId:p.id,batchId:batch.id,qty,cost:money(qty*batch.unitCost),date:batch.receivedAt,ref:'期初演示库存',note:'演示初始化'});
      }
    });
    // 历史订单从真实批次数量扣减，使当前库存与台账口径一致。
    for(let i=0;i<240;i++) {
      const c=customers[i%80];const offset=i<200?-(Math.floor(i/8)+1):0;
      const status=i<200||i>=237?'delivered':i<225?'confirmed':i<234?'draft':'shipping';
      const items=Array.from({length:2+i%3},(_,k)=>{
        const p=products[(i*3+k*5)%41];const qty=1+(i+k)%5;const spec=p.specs[0];
        return {productId:p.id,spec:spec.label,kgPerUnit:spec.kg,qty,loss:0,price:money((c.prices[p.id]||p.basePrice)*spec.kg)};
      });
      const order={id:`DD${day(offset).replaceAll('-','')}${String(i+1).padStart(4,'0')}`,customerId:c.id,date:day(offset),deliveryDate:day(offset),region:c.region,routeId:c.routeId,
        status,source:i%3?'客户订货':'内勤代单',items,note:i%9===0?'早班送达，收货前联系门店':'',total:items.reduce((s,x)=>s+money(x.qty*x.price),0)};
      state.orders.push(order);
      if(status==='delivered'){
        items.forEach(line=>{let left=line.qty*line.kgPerUnit;for(const b of state.batches.filter(x=>x.itemId===line.productId)){const take=Math.min(left,b.qty);b.qty=Math.round((b.qty-take)*100)/100;left-=take;if(take)state.movements.push({id:`MV${state.serial++}`,type:'销售出库',itemId:b.itemId,batchId:b.id,qty:-take,cost:money(take*b.unitCost),date:order.date,ref:order.id,note:'历史配送签收'});if(left<=0)break;}});
        if(i%4!==0)state.payments.push({id:`SK${1000+i}`,orderId:order.id,customerId:c.id,amount:i%4===1?Math.floor(order.total/2):order.total,date:day(offset),method:i%2?'银行转账':'微信收款',note:'历史回款记录'});
      }
    }
    // 预置待补货订单用于演示打印隐藏无货产品；草稿不占用库存。
    state.orders.push({id:`DD${day().replaceAll('-','')}0901`,customerId:'C0001',date:day(),deliveryDate:day(),region:customers[0].region,routeId:'L1',status:'draft',source:'内勤代单',
      items:[{productId:'P042',spec:'2.5kg/袋',kgPerUnit:2.5,qty:6,loss:0,price:money(products[41].basePrice*2.5)},{productId:'P001',spec:'2.5kg/袋',kgPerUnit:2.5,qty:3,loss:0,price:1395}],note:'低盐荞麦面待生产补货',total:money(products[41].basePrice*2.5)*6+4185});
    // 一张历史生产单将原料领用与成品批次关联，支持开箱即查溯源。
    const raw=state.batches.find(b=>b.itemId==='R001');raw.qty-=300;
    const output=state.batches.find(b=>b.itemId==='P001');output.sourceProductionId='SC1001';
    state.productions.push({id:'SC1001',date:day(-1),name:'鲜面早班生产',inputs:[{batchId:raw.id,itemId:raw.itemId,qty:300,cost:raw.unitCost*300}],outputs:[{productId:'P001',qty:output.received,batchId:output.id,cost:raw.unitCost*300}],cost:raw.unitCost*300,inputKg:300,outputKg:output.received,note:'期初生产溯源演示'});
    output.unitCost=Math.round(raw.unitCost*300/output.received);
    state.movements.push({id:`MV${state.serial++}`,type:'生产领料',itemId:raw.itemId,batchId:raw.id,qty:-300,cost:138000,date:day(-1),ref:'SC1001',note:'历史生产批次关联'});
    for(const [itemId,qty,type,note]of [['P005',2,'库存报损','交接包装破损'],['R002',8.5,'库存报损','原料开袋撒漏'],['P006',1.5,'盘点调整','早班复盘账实差异']]){const b=state.batches.find(x=>x.itemId===itemId);b.qty=Math.round((b.qty-qty)*100)/100;state.movements.unshift({id:`TZ${state.serial++}`,type,itemId,batchId:b.id,qty:-qty,cost:money(qty*b.unitCost),date:day(-1),ref:'历史损耗盘点',note});}
    customers.slice(0,8).forEach(c=>{const bills=state.orders.filter(o=>o.customerId===c.id&&o.status==='delivered'&&o.date<=day(-1));if(!bills.length)return;const total=bills.reduce((a,o)=>a+o.total,0),paid=state.payments.filter(p=>bills.some(o=>o.id===p.orderId)).reduce((a,p)=>a+p.amount,0);state.reconciliations.push({id:`DZ${state.serial++}`,customerId:c.id,date:day(-1),start:day(-60),end:day(-1),total,due:total-paid,source:'企业后台',note:'历史账期核对一致'});});
    state.logs.unshift({id:'LOG1000',date:new Date().toISOString(),actor:'系统',action:'初始化',detail:'已生成产品、客户、订单、批次、生产、损耗、历史对账与回款记录'});
    return state;
  };
})(typeof window !== 'undefined' ? window : globalThis);
