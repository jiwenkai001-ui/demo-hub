/* 统一业务事务与本地状态。校验失败时不保存副本，避免出现半张订单或部分扣库。 */
(function(root){
  'use strict';
  const J=root.JMY;const KEY='jingmaiyuan.demo.v1';let cached;
  const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
  const total=o=>o.items.reduce((s,l)=>s+Math.round(l.qty*l.price),0);
  const active=o=>['confirmed','shipping'].includes(o.status);
  const find=(list,id,label)=>{const x=list.find(v=>v.id===id);if(!x)throw Error(`${label}不存在，请刷新重试`);return x;};
  const positive=(v,label,allowZero=false)=>{const n=Number(v);if(!Number.isFinite(n)||(allowZero?n<0:n<=0)||n>10000000||(!allowZero&&round(n)<=0))throw Error(`${label}请输入${allowZero?'非负':'大于零的'}有效数字（最多两位小数）`);return round(n);};
  const role=()=>root.sessionStorage?.getItem('jmy.role')||'管理员';
  const allowed=roles=>{if(!roles.includes(role()))throw Error(`当前角色为${role()}，此操作需要${roles.join('或')}`);};
  const paid=(s,id)=>s.payments.filter(p=>p.orderId===id).reduce((a,p)=>a+p.amount,0);
  const debt=(s,cid)=>s.orders.filter(o=>o.customerId===cid&&o.status==='delivered').reduce((a,o)=>a+Math.max(0,o.total-paid(s,o.id)),0);
  const stock=(s,pid)=>round(s.batches.filter(b=>b.itemId===pid).reduce((a,b)=>a+b.qty,0));
  const reserved=(s,pid,exclude)=>round(s.orders.filter(o=>active(o)&&o.id!==exclude).reduce((a,o)=>a+o.items.filter(l=>l.productId===pid).reduce((b,l)=>b+(l.qty+l.loss)*l.kgPerUnit,0),0));
  const credit=(s,cid,exclude)=>{const c=find(s.customers,cid,'客户');const extra=c.tempLimit&&new Date(c.tempLimit.expiresAt)>new Date()?c.tempLimit.amount:0;const pending=s.orders.filter(o=>o.customerId===cid&&active(o)&&o.id!==exclude).reduce((a,o)=>a+o.total,0);const used=debt(s,cid)+pending;return {limit:c.limit+extra,base:c.limit,extra,used,debt:debt(s,cid),pending,available:c.limit+extra-used,locked:used>=c.limit+extra};};
  const persist=s=>{try{root.localStorage?.setItem(KEY,JSON.stringify(s));}catch(e){throw Error('浏览器无法保存数据，请检查存储空间或退出隐私限制后重试');}cached=s;root.dispatchEvent?.(new Event('jmy:change'));return s;};
  const consume=(s,itemId,quantity,type,ref,date,note='',specific='')=>{let left=round(quantity),cost=0;const rows=s.batches.filter(b=>b.itemId===itemId&&(!specific||b.id===specific)).sort((a,b)=>a.receivedAt.localeCompare(b.receivedAt));if(rows.reduce((a,b)=>a+b.qty,0)+0.001<left)throw Error('指定批次库存不足，操作未保存');for(const b of rows){const take=round(Math.min(left,b.qty));if(take<=0)continue;b.qty=round(b.qty-take);left=round(left-take);const value=Math.round(take*b.unitCost);cost+=value;s.movements.push({id:`MV${s.serial++}`,itemId,batchId:b.id,type,qty:-take,cost:value,date,ref,note});if(left<=0)break;}return cost;};
  const validateOrder=(s,o)=>{const needs={};o.items.forEach(l=>needs[l.productId]=round((needs[l.productId]||0)+(l.qty+l.loss)*l.kgPerUnit));for(const [pid,n]of Object.entries(needs)){const available=round(stock(s,pid)-reserved(s,pid,o.id));if(n>available+0.001)throw Error(`${find(s.products,pid,'商品').name}库存不足：需 ${n}kg，可用 ${Math.max(0,available)}kg。请调整数量或保存草稿。`);}const cr=credit(s,o.customerId,o.id);if(o.total>cr.available)throw Error(`客户信用额度不足：本单 ¥${(o.total/100).toFixed(2)}，可用 ¥${(cr.available/100).toFixed(2)}。请收款或由业务经理临时授权。`);};
  J.store={
    key:KEY,
    /** 读取状态。无参数；首次生成虚构数据，存储无效时抛错并保留原始存储。 */
    read(){if(cached)return cached;const raw=root.localStorage?.getItem(KEY);if(raw){try{cached=JSON.parse(raw);if(cached.version!==1||!Array.isArray(cached.orders))throw Error();}catch(e){throw Error('演示存储格式无效，请从设置页重置或恢复有效备份');}return cached;}cached=J.seed();return persist(cached);},
    /** 获取库存。s 为状态；pid 为存在的商品/原料编号；exclude 可空，用于排除正在编辑订单；返回实存、占用与可用 kg。 */
    inventory(s,pid,exclude){const actual=stock(s,pid),hold=reserved(s,pid,exclude);return {actual,reserved:hold,available:round(actual-hold)};},
    /** 获取信用。s 为状态，cid 为有效客户编号，exclude 可空；返回基础/临时额度、欠款和待配送占用；客户不存在时抛错。 */
    credit(s,cid,exclude){return credit(s,cid,exclude);},
    /** 计算订单未收款。s 为状态，o 为有效订单对象；非签收订单返回零，不修改状态。 */
    due(s,o){return o.status==='delivered'?Math.max(0,o.total-paid(s,o.id)):0;},
    /** 计算成交单价。s 为状态，cid/pid 为有效编号，kg 为正规格重量，date 缺省今天；返回整数分，未知资料抛错。 */
    price(s,cid,pid,kg=1,date=J.date()){const c=find(s.customers,cid,'客户'),p=find(s.products,pid,'商品');let unit=c.prices[pid]??p.basePrice;const promotions=s.promotions.filter(x=>x.active&&x.productId===pid&&x.start<=date&&x.end>=date&&((x.scope==='customer'&&x.target===cid)||(x.scope==='group'&&x.target===c.type)));if(promotions.length)unit=Math.round(unit*Math.min(...promotions.map(x=>x.discount))/100);return Math.round(unit*kg);},
    /** 执行业务。type 为下列命令，data 为对应非空表单；返回业务记录，校验失败抛错且原状态不变。 */
    execute(type,data={}){
      const s=JSON.parse(JSON.stringify(this.read()));let result;const today=J.date();
      if(type==='customer'){
        allowed(['管理员','业务经理','内勤文员']);const c=data.id?find(s.customers,data.id,'客户'): {id:`C${String(s.serial++).padStart(4,'0')}`,prices:{},tempLimit:null,active:true,createdAt:today};
        if(!String(data.name||'').trim())throw Error('请输入客户名称');if(!s.regions.includes(data.region))throw Error('请选择有效区域');find(s.routes,data.routeId,'配送线路');
        const newLimit=Math.round(positive(data.limit,'信用额度',true)*100);if(data.id&&newLimit!==c.limit)allowed(['管理员','业务经理']);
        Object.assign(c,{name:String(data.name).trim(),type:data.type,contact:data.contact||'',phone:data.phone||'',address:data.address||'',region:data.region,routeId:data.routeId,salesperson:data.salesperson||'',limit:newLimit,note:data.note||''});
        if(!data.id)s.customers.unshift(c);result=c;
      }else if(type==='prices'){
        allowed(['管理员','业务经理','内勤文员']);const c=find(s.customers,data.customerId,'客户');for(const [pid,value]of Object.entries(data.prices)){find(s.products,pid,'商品');c.prices[pid]=Math.round(positive(value,'专属单价')*100);}result=c;
      }else if(type==='promotion'){
        allowed(['管理员','业务经理']);if(!data.name?.trim())throw Error('请输入活动名称');if(data.start>data.end)throw Error('结束日期不能早于开始日期');find(s.products,data.productId,'商品');const discount=positive(data.discount,'折扣百分比');if(discount>100)throw Error('折扣百分比不能超过100');if(data.scope==='customer')find(s.customers,data.target,'客户');else if(!['商超','农贸市场','鲜面店','餐饮店','企事业单位'].includes(data.target))throw Error('请选择客户类型');result={...data,discount,id:`PR${s.serial++}`,active:true};s.promotions.unshift(result);
      }else if(type==='promotionToggle'){
        allowed(['管理员','业务经理']);result=find(s.promotions,data.id,'促销');result.active=!result.active;
      }else if(type==='product'){
        allowed(['管理员','仓管员']);const p=data.id?find(s.products,data.id,'商品'):{id:`P${s.serial++}`,specs:[{label:'2.5kg/袋',kg:2.5},{label:'5kg/袋',kg:5},{label:'散装/公斤',kg:1}],active:true,unit:'kg',aliases:[]};if(!data.name?.trim())throw Error('请输入商品名称');Object.assign(p,{name:data.name.trim(),category:data.category,code:data.code||p.id,basePrice:Math.round(positive(data.basePrice,'标准售价')*100),warning:positive(data.warning,'预警量',true),shelfLife:positive(data.shelfLife,'保质期')});if(!data.id)s.products.push(p);result=p;
      }else if(type==='order'){
        const c=find(s.customers,data.customerId,'客户');if(!c.active)throw Error('客户已停用');const old=data.id?find(s.orders,data.id,'订单'):null;if(old&&!['draft','confirmed'].includes(old.status))throw Error('已配送或取消订单不可修改');
        const items=(data.items||[]).map(l=>{const p=find(s.products,l.productId,'商品');if(!p.active)throw Error('商品已停用');return {productId:p.id,spec:String(l.spec||'').trim(),kgPerUnit:positive(l.kgPerUnit,'规格重量'),qty:positive(l.qty,'采购数量'),loss:positive(l.loss||0,'损耗数量',true),price:this.price(s,c.id,p.id,positive(l.kgPerUnit,'规格重量'))};});
        if(!items.length)throw Error('请至少添加一项商品');if(items.some(x=>!x.spec))throw Error('请填写商品规格');
        const o={id:old?.id||`DD${today.replaceAll('-','')}${s.serial++}`,customerId:c.id,date:old?.date||today,deliveryDate:data.deliveryDate||today,region:c.region,routeId:data.routeId||c.routeId,status:data.draft?'draft':'confirmed',source:data.source||'内勤代单',items,note:data.note||''};find(s.routes,o.routeId,'配送线路');if(o.deliveryDate<today)throw Error('配送日期不能早于今天');o.total=total(o);if(o.total<=0)throw Error('订单金额须大于零，请检查规格重量和采购数量');if(o.status==='confirmed')validateOrder(s,o);if(old)s.orders[s.orders.indexOf(old)]=o;else s.orders.unshift(o);result=o;
      }else if(type==='status'){
        const o=find(s.orders,data.id,'订单');const next={draft:['confirmed','cancelled'],confirmed:['shipping','cancelled'],shipping:['delivered'],delivered:[],cancelled:[]};if(!next[o.status]?.includes(data.status))throw Error('此订单已处理，不能重复操作或逆向流转');
        if(data.status==='confirmed')validateOrder(s,o);
        if(data.status==='delivered')o.items.forEach(l=>{consume(s,l.productId,l.qty*l.kgPerUnit,'销售出库',o.id,today);if(l.loss)consume(s,l.productId,l.loss*l.kgPerUnit,'配送损耗',o.id,today,'订单损耗另计，不计入客户应收');});
        o.status=data.status;if(data.status==='delivered')o.deliveredAt=today;result=o;
      }else if(type==='receipt'){
        allowed(['管理员','仓管员']);const list=data.kind==='raw'?s.materials:s.products;const p=find(list,data.itemId,'入库物料');const qty=positive(data.qty,'本次入库数量');const unitCost=Math.round(positive(data.unitCost,'入库单价')*100);
        const id=data.batchId?.trim()||`${data.kind==='raw'?'YL':'CP'}${today.replaceAll('-','')}-${s.serial++}`;let b=s.batches.find(x=>x.id===id);if(b&&(b.itemId!==p.id||b.unitCost!==unitCost))throw Error('同批次的物料和成本单价须一致；请更换批次或按原单价入库');
        if(b){b.qty=round(b.qty+qty);b.received=round(b.received+qty);}else{b={id,itemId:p.id,kind:data.kind,qty,received:qty,unitCost,receivedAt:today,supplier:data.supplier||'京麦源生产车间',sourceProductionId:''};s.batches.unshift(b);}
        s.movements.unshift({id:`RK${s.serial++}`,type:'分次入库',itemId:p.id,batchId:b.id,qty,cost:Math.round(qty*unitCost),date:today,ref:data.ref||b.id,note:data.note||''});result=b;
      }else if(type==='adjust'){
        allowed(['管理员','仓管员']);const b=find(s.batches,data.batchId,'批次');let change;if(data.mode==='count')change=round(positive(data.qty,'实际库存',true)-b.qty);else change=-positive(data.qty,'报损数量');if(!String(data.note||'').trim())throw Error('请填写盘点或报损原因');if(change===0)throw Error('账实一致，无需调整');if(b.qty+change<0)throw Error('调整数量超过本批次库存');const available=this.inventory(s,b.itemId).available;if(change<0&&-change>available+0.001)throw Error('调整会占用已确认订单的库存，请先处理订单');b.qty=round(b.qty+change);s.movements.unshift({id:`TZ${s.serial++}`,type:data.mode==='count'?'盘点调整':'库存报损',itemId:b.itemId,batchId:b.id,qty:change,cost:Math.round(Math.abs(change)*b.unitCost),date:today,ref:data.mode==='count'?'盘点':'报损',note:data.note});result=b;
      }else if(type==='production'){
        allowed(['管理员','仓管员']);if(!data.inputs?.length||!data.outputs?.length)throw Error('请填写原料与成品产出');
        const id=`SC${s.serial++}`,inputs=data.inputs.map(x=>{const b=find(s.batches,x.batchId,'原料批次');if(b.kind!=='raw')throw Error('请选择原料批次');const qty=positive(x.qty,'领用数量');const cost=consume(s,b.itemId,qty,'生产领料',id,today,'',b.id);return {batchId:b.id,itemId:b.itemId,qty,cost};});const cost=inputs.reduce((a,x)=>a+x.cost,0),inputKg=inputs.reduce((a,x)=>a+x.qty,0);
        const outputs=data.outputs.map(x=>({productId:find(s.products,x.productId,'成品').id,qty:positive(x.qty,'成品产出')}));const outputKg=outputs.reduce((a,x)=>a+x.qty,0);let allocated=0;
        outputs.forEach((x,i)=>{x.cost=i===outputs.length-1?cost-allocated:Math.round(cost*x.qty/outputKg);allocated+=x.cost;x.batchId=`CP${today.replaceAll('-','')}-${s.serial++}`;const b={id:x.batchId,itemId:x.productId,kind:'finished',qty:x.qty,received:x.qty,unitCost:Math.round(x.cost/x.qty),receivedAt:today,supplier:'京麦源生产车间',sourceProductionId:id};s.batches.unshift(b);s.movements.unshift({id:`MV${s.serial++}`,type:'生产入库',itemId:x.productId,batchId:b.id,qty:x.qty,cost:x.cost,date:today,ref:id,note:data.note||''});});
        result={id,date:today,name:data.name||'鲜面生产',inputs,outputs,cost,inputKg,outputKg,note:data.note||''};s.productions.unshift(result);
      }else if(type==='payment'){
        allowed(['管理员','财务']);const o=find(s.orders,data.orderId,'订单');if(o.status!=='delivered')throw Error('仅已签收订单可登记收款');const amount=Math.round(positive(data.amount,'收款金额')*100);const due=this.due(s,o);if(amount>due)throw Error(`收款不能超过剩余欠款 ¥${(due/100).toFixed(2)}`);result={id:`SK${s.serial++}`,orderId:o.id,customerId:o.customerId,amount,date:today,method:data.method||'银行转账',note:data.note||''};s.payments.unshift(result);
      }else if(type==='reconcile'){
        const c=find(s.customers,data.customerId,'客户');if(data.start>data.end)throw Error('对账结束日期不能早于开始日期');const orders=s.orders.filter(o=>o.customerId===c.id&&o.status==='delivered'&&o.date>=data.start&&o.date<=data.end);if(!orders.length)throw Error('本期间没有已签收账单');result={id:`DZ${s.serial++}`,customerId:c.id,date:today,start:data.start,end:data.end,total:orders.reduce((a,o)=>a+o.total,0),due:orders.reduce((a,o)=>a+this.due(s,o),0),source:data.source||'企业后台',note:data.note||'账单核对一致'};s.reconciliations.unshift(result);
      }else if(type==='credit'){
        allowed(['管理员','业务经理']);const c=find(s.customers,data.customerId,'客户');c.limit=Math.round(positive(data.limit,'基础信用额度',true)*100);const amount=Math.round(positive(data.amount||0,'临时增额',true)*100);if(amount){const hours=positive(data.hours,'有效时长');if(hours>720)throw Error('临时额度有效期最多720小时');if(!data.reason?.trim())throw Error('请填写授权原因');c.tempLimit={amount,expiresAt:new Date(Date.now()+hours*3600000).toISOString(),reason:data.reason};}else c.tempLimit=null;result=c;
      }else throw Error('未知业务操作');
      s.logs.unshift({id:`LOG${s.serial++}`,date:new Date().toISOString(),actor:role(),action:type,detail:result?.id||''});persist(s);return result;
    },
    /** 恢复备份。data 为本工具导出的非空状态对象；返回已保存状态，结构错误抛错且不覆盖现有数据。 */
    restore(data){if(data?.version!==1||!['products','materials','customers','orders','batches','payments','productions','movements','logs','promotions','regions','routes','reconciliations'].every(k=>Array.isArray(data[k]))||!Number.isFinite(data.serial))throw Error('备份格式不正确，请使用本演示导出的 JSON 文件');for(const b of data.batches)if(!Number.isFinite(b.qty)||b.qty<0||!Number.isInteger(b.unitCost))throw Error('备份中包含无效库存');return persist(JSON.parse(JSON.stringify(data)));},
    /** 重置全部虚构数据。无参数；返回新状态，存储不可用时抛错。 */
    reset(){const s=persist(J.seed());const storage=root.localStorage;if(typeof storage?.key==='function')for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith('jmy.cart.'))storage.removeItem(key);}return s;}
  };
  root.addEventListener?.('storage',e=>{if(e.key===KEY){cached=null;root.dispatchEvent(new Event('jmy:external'));}});
})(typeof window!=='undefined'?window:globalThis);
