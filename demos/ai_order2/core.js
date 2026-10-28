/* 智录业务内核：与界面分离，所有金额以整数分存储。 */
(function (root) {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = prefix => prefix + '-' + (root.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();
  const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const money = cents => cents===null || cents===undefined ? '待定价' : '¥'+(cents/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  function numeric(value, scale=6, positive=false) {
    const s=String(value??'').trim();
    if(!new RegExp('^(?:0|[1-9]\\d{0,7})(?:\\.\\d{1,'+scale+'})?$').test(s)) throw Error(`请输入${scale===2?'最多两位小数的金额':'有效数量（最多六位小数）'}，不要使用千位分隔符、字母或科学计数法`);
    const n=Number(s);if(!Number.isFinite(n)||n>10000000||(positive?n<=0:n<0))throw Error(positive?'数量须大于0且不超过1000万':'金额须介于0和1000万之间');
    return s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');
  }
  const priceCents=value=>{const s=numeric(value,2);const [a,b='']=s.split('.');return Number(a)*100+Number(b.padEnd(2,'0'));};
  const priceText=cents=>cents===null||cents===undefined?'':(cents/100).toFixed(2);
  function validDate(value,optional=false){if(optional&&value==='')return true;if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
  const customerOf=(order,row)=>row.customer?.trim()||order.customer;
  function addCents(a,b){const n=a+b;if(!Number.isSafeInteger(n))throw Error('合计超出安全金额范围，请分批处理');return n;}
  function amount(qty,cents){
    if(cents===null||cents===undefined||!Number.isSafeInteger(cents)||cents<0)return null;
    try{const s=numeric(qty,6,true),[a,b='']=s.split('.');const denominator=10n**BigInt(b.length);const numerator=BigInt(a+b)*BigInt(cents);const result=Number((numerator+denominator/2n)/denominator);return Number.isSafeInteger(result)?result:null;}catch{return null;}
  }
  function cnNumber(raw){
    let text=String(raw).replace(/两/g,'二');
    if(/^[0-9][0-9,]*(?:\.\d+)?$/.test(text)){if(text.includes(',')&&!/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text))throw Error('千位分隔格式不正确');return numeric(text.replace(/,/g,''),6,true);}
    if(!/^[零〇一二三四五六七八九十百千万亿点]+$/.test(text))throw Error('数量表达不明确');
    const digits={零:0,〇:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
    const [whole,decimal]=text.split('点');let total=0,section=0,n=0;
    if(/^[零〇一二三四五六七八九]+$/.test(whole))return numeric([...whole].map(c=>digits[c]).join('').replace(/^0+(?=\d)/,'')+(decimal===undefined?'':'.'+[...decimal].map(c=>digits[c]??'x').join('')),6,true);
    for(const c of whole){if(c in digits)n=digits[c];else{const u={十:10,百:100,千:1000,万:10000,亿:100000000}[c];if(u<10000){section+=(n||1)*u;n=0;}else{section+=n;total=(total+section)*u;section=0;n=0;}}}
    let result=String(total+section+n);if(decimal!==undefined){if(!decimal||[...decimal].some(c=>!(c in digits)))throw Error('中文小数表达不明确');result+='.'+[...decimal].map(c=>digits[c]).join('');}return numeric(result,6,true);
  }
  function unit(u){const s=String(u||'').trim();if(/^(公斤|千克|kg)$/i.test(s))return 'kg';if(/^(g|克)$/i.test(s))return '克';if(/^(t|吨)$/i.test(s))return '吨';return s;}
  function convert(qty,from,to,product){
    const q=Number(numeric(qty,6,true));from=unit(from||to);to=unit(to);if(from===to)return numeric(qty,6,true);
    const mass={克:1,kg:1000,斤:500,吨:1000000};let value;
    if(mass[from]&&mass[to])value=q*mass[from]/mass[to];
    else if(product?.conversions?.[from])value=q*Number(product.conversions[from]);
    else throw Error(`缺少「${from} → ${to}」换算关系，请核实数量后手动填写${to}数`);
    return numeric(value.toFixed(6),6,true);
  }
  function splitSegments(text){
    const out=[];let start=0;
    for(let i=0;i<=text.length;i++){
      const c=text[i];if(i<text.length&&!/[\n;；。，、,]/.test(c))continue;
      if(c===','&&/\d/.test(text[i-1]||'')&&/^\d{3}(?:,\d{3})*(?:\.\d+)?(?:[^\d]|$)/.test(text.slice(i+1)))continue;
      const part=text.slice(start,i),trim=part.trim();if(trim)out.push({raw:trim,start:start+part.indexOf(trim),end:start+part.indexOf(trim)+trim.length});start=i+1;
    }return out;
  }
  const NUMBER='(?:[0-9][0-9,]*(?:\\.\\d+)?|[零〇一二两三四五六七八九十百千万亿点]+)';
  const UNIT='(?:公斤|千克|kg|Kg|KG|斤|克|吨|箱|件|瓶|桶|包|把|袋|个|条|盒|扎|支|卷|枚|米|台|双|只)';
  function cleanName(name){let s=name.trim();for(let i=0;i<6;i++){const old=s;s=s.replace(/^(?:明天|今天|早上|下午|晚上|周[一二三四五六日天](?:到货)?|工地[^：:]*[：:]|这周(?:要用|要)?|麻烦|请|帮我|给我(?:来|送)?|再要|再来|来个|需要|补货|下单|买|订|要|来|再|还|又)[：:\s]*/,'').trim();if(s===old)break;}return s.replace(/(?:来个?|需要|要|下单|买|送)$/,'').trim();}
  function extract(raw){
    const cleaned=cleanName(raw.replace(/\s*ASAP\s*$/i,'').replace(/(?:今天|明天)?(?:上午|下午|晚上)?[零〇一二两三四五六七八九十\d]+点(?:前|后)?(?:送到|送至|送货).*$/,'').replace(/(?:送到|送至|送货).*$/,'').replace(/(?:谢谢|辛苦|吧|哈|呢|了|左右|上下)[！!。\s]*$/,''));
    const issues=[];
    if(new RegExp(NUMBER+'\\s*[-~～至到—]\\s*'+NUMBER).test(cleaned))return {name:cleanName(cleaned.replace(new RegExp(NUMBER+'.*$'),'')),qty:'',unit:'',issues:['数量为范围，请明确本次下单数量']};
    if(/[-−]\s*\d/.test(cleaned))return {name:cleanName(cleaned.replace(/[-−].*$/,'')),qty:'',unit:'',issues:['不接受负数量，请核对原文']};
    let m=cleaned.match(new RegExp('^('+NUMBER+')(来|多)?\\s*('+UNIT+')?\\s*(.+)$','i'));
    let name='',q='',u='';
    if(m){q=m[1];u=m[3]||'';name=m[4];if(m[2])issues.push('口语数量为估计值，请人工确认');}
    else{m=cleaned.match(new RegExp('^(.+?)\\s*('+NUMBER+')(来|多)?\\s*('+UNIT+')?\\s*$','i'));if(m){name=m[1];q=m[2];u=m[4]||'';if(m[3])issues.push('口语数量为估计值，请人工确认');}else{name=cleaned;issues.push('未找到明确数量，请人工补录');}}
    name=cleanName(name);if(!name||new RegExp('^'+UNIT+'$','i').test(name)){name='';issues.push('缺少商品名称');}
    let qty='';try{qty=cnNumber(q);}catch(e){if(q)issues.push(e.message);}
    return {name,qty,unit:unit(u),issues};
  }
  function newDatabase(seeds){
    const industries={};
    for(const [key,s] of Object.entries(seeds)){
      const catalog=s.catalog.map(p=>({...clone(p),unit:unit(p.unit),priceCents:priceCents(p.price),aliases:Object.keys(s.aliases).filter(a=>s.aliases[a]===p.name),conversions:{}}));
      const tofu=catalog.find(p=>p.code==='FD004');if(tofu)tofu.conversions.箱=12;
      for(const p of catalog){if(p.code==='SC007')p.conversions.枚=1/30;}
      industries[key]={label:s.label,catalog,inbox:s.inbox.map(x=>({...clone(x),seed:true,parsed:[],status:'received',orderId:null,createdAt:now(),date:today(),deliveryDate:'',parseCount:0})),orders:[],selected:s.inbox[0]?.id||null};
    }
    return {app:'zhilu-order',schema:3,current:'fresh',industries,audit:[],undo:[],updatedAt:now(),actor:'本地操作员'};
  }
  function validateDetails(db){
    const text=(obj,key,required=false)=>{if((required||obj[key]!==undefined&&obj[key]!==null)&&typeof obj[key]!=='string')throw Error('备份字段 '+key+' 须为文本');};
    const groupCheck=g=>{
      if(!g||!Array.isArray(g.catalog)||!Array.isArray(g.inbox)||!Array.isArray(g.orders))throw Error('备份行业结构无效');
      for(const entity of [...g.inbox,...g.orders])for(const key of ['contact','address','originalSourceId'])if(entity[key]!==undefined&&typeof entity[key]!=='string')throw Error('备份联系人、地址及原进件编号须为文本');
      if(g.customers!==undefined){if(!Array.isArray(g.customers))throw Error('客户档案须为数组');const ids=new Set(),names=new Set();for(const c of g.customers){if(!c||['id','name','contact','address'].some(k=>typeof c[k]!=='string')||!c.name.trim()||ids.has(c.id)||names.has(c.name)||!Number.isInteger(c.deliveryDays)||c.deliveryDays<0||c.deliveryDays>365||!c.prices||Array.isArray(c.prices)||typeof c.prices!=='object'||Object.entries(c.prices).some(([code,v])=>!g.catalog.some(p=>p.code===code)||!Number.isSafeInteger(v)||v<0||v>1000000000))throw Error('备份客户档案或协议价无效');ids.add(c.id);names.add(c.name);}}
      const rowsCheck=(rows,source)=>{if(!Array.isArray(rows))throw Error('备份明细须为数组');const ids=new Set();for(const r of rows){if(!r||typeof r!=='object')throw Error('备份明细无效');for(const k of ['id','name','raw','unit','qty','match'])text(r,k,true);for(const k of ['customer','note','reviewedBy','reviewedAt','sourceQty','sourceUnit'])text(r,k);if(!r.id||ids.has(r.id)||r.sourceId!==source||!Array.isArray(r.issues)||r.issues.some(x=>typeof x!=='string')||!Array.isArray(r.candidates)||typeof r.confirmed!=='boolean'||!Number.isFinite(r.confidence)||r.confidence<0||r.confidence>1)throw Error('备份明细字段无效');ids.add(r.id);if(r.qty!=='')numeric(r.qty,6,true);if(r.priceCents!==null&&(!Number.isSafeInteger(r.priceCents)||r.priceCents<0||r.priceCents>1000000000))throw Error('备份单价无效');if(r.code!==null&&typeof r.code!=='string')throw Error('备份商品关联无效');for(const c of r.candidates){if(!c||typeof c.code!=='string'||typeof c.name!=='string')throw Error('备份候选商品无效');}}};
      for(const p of g.catalog){for(const k of ['code','name','unit'])text(p,k,true);text(p,'spec');if(!Array.isArray(p.aliases)||p.aliases.some(x=>typeof x!=='string')||!p.conversions||Array.isArray(p.conversions)||typeof p.conversions!=='object')throw Error('备份商品字段无效');}
      for(const i of g.inbox){for(const k of ['id','type','customer','date','status'])text(i,k,true);for(const k of ['sender','source','content','time','deliveryDate','createdAt','externalId'])text(i,k);if(!['text','image','voice'].includes(i.type)||!validDate(i.date)||!validDate(i.deliveryDate||'',true))throw Error('备份进件类型或日期无效');if(i.seed&&(!Array.isArray(i.result)||i.result.some(r=>!r||typeof r.raw!=='string')))throw Error('备份内置案例无效');if(i.type==='image'&&i.seed&&(!Array.isArray(i.paper)||i.paper.some(p=>!Array.isArray(p)||p.length!==2)))throw Error('备份图片案例无效');if(i.attachment&&(typeof i.attachment.name!=='string'||typeof i.attachment.data!=='string'))throw Error('备份附件无效');rowsCheck(i.parsed,i.id);}
      const sources=new Set();let total=0;for(const o of g.orders){for(const k of ['id','no','sourceId','customer','date','status'])text(o,k,true);if(sources.has(o.sourceId)||!validDate(o.date)||!validDate(o.deliveryDate||'',true))throw Error('备份订单来源重复或日期无效');sources.add(o.sourceId);rowsCheck(o.rows,o.sourceId);const item=g.inbox.find(i=>i.id===o.sourceId);if(!item||item.orderId!==o.id||item.customer!==o.customer||item.date!==o.date||JSON.stringify(item.parsed)!==JSON.stringify(o.rows))throw Error('备份订单与进件镜像不一致');for(const r of o.rows){const p=g.catalog.find(p=>p.code===r.code),cents=amount(r.qty,r.priceCents);if(p&&unit(r.unit)===p.unit&&cents!==null)total=addCents(total,cents);if(o.status==='confirmed'&&(!customerOf(o,r)?.trim()||customerOf(o,r)==='散单/待指定'))throw Error('备份正式订单明细缺少客户');}}
    };
    for(const g of Object.values(db.industries))groupCheck(g);
    for(const entry of db.audit){for(const k of ['id','at','actor','industry','action','entity'])text(entry,k,true);text(entry,'detail');}
    if(db.undo.length>10)throw Error('备份撤销历史过多');for(const entry of db.undo){if(!entry||!Object.hasOwn(db.industries,entry.industry)||typeof entry.label!=='string')throw Error('备份撤销记录无效');groupCheck(entry.before);}
  }
  class Store{
    constructor(seeds,data){this.seeds=seeds;this.db=data?Store.validateBackup(data):newDatabase(seeds);this.onChange=()=>{};}
    static validateBackup(data){
      if(!data||data.app!=='zhilu-order'||data.schema!==3||!data.industries||!['fresh','food','hardware','general'].every(k=>Object.hasOwn(data.industries,k)))throw Error('不是有效的智录V3工作空间备份');
      const db=clone(data);if(!Object.hasOwn(db.industries,db.current)||!Array.isArray(db.audit)||!Array.isArray(db.undo))throw Error('备份结构不完整');
      const ids=new Set();for(const [key,g] of Object.entries(db.industries)){
        if(!['fresh','food','hardware','general'].includes(key)||!Array.isArray(g.catalog)||!Array.isArray(g.inbox)||!Array.isArray(g.orders))throw Error('行业资料结构不正确');
        const codes=new Set();for(const p of g.catalog){if(!p.code||codes.has(p.code)||!p.name||!p.unit||!Number.isSafeInteger(p.priceCents)||p.priceCents<0||p.priceCents>1000000000||!Array.isArray(p.aliases)||p.aliases.some(a=>typeof a!=='string')||!p.conversions||typeof p.conversions!=='object'||Object.values(p.conversions).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<=0||n>10000000))throw Error('备份含无效商品');codes.add(p.code);}
        const sourceIds=new Set(g.inbox.map(x=>x.id));if(sourceIds.size!==g.inbox.length)throw Error('备份存在重复进件ID');
        for(const item of g.inbox){if(!item.id||typeof item.content!=='string'&&item.type!=='image'||!Array.isArray(item.parsed))throw Error('备份含无效进件');}
        const orderedSources=new Set();for(const o of g.orders){if(!o.id||ids.has(o.id)||!sourceIds.has(o.sourceId)||orderedSources.has(o.sourceId)||!Array.isArray(o.rows)||!['draft','confirmed'].includes(o.status)||typeof o.customer!=='string')throw Error('备份订单关联不完整');ids.add(o.id);orderedSources.add(o.sourceId);const rowIds=new Set();for(const r of o.rows){if(!r.id||rowIds.has(r.id)||typeof r.raw!=='string'||!Array.isArray(r.issues)||(r.priceCents!==null&&(!Number.isSafeInteger(r.priceCents)||r.priceCents<0||r.priceCents>1000000000)))throw Error('备份明细不正确');rowIds.add(r.id);if(r.qty!=='')numeric(r.qty,6,true);if(o.status==='confirmed'){const p=g.catalog.find(p=>p.code===r.code);if(!r.confirmed||!p||p.unit!==unit(r.unit)||amount(r.qty,r.priceCents)===null)throw Error('备份已确认订单含无效明细');}}if(o.status==='confirmed'&&(!o.rows.length||o.rows.some(r=>!customerOf(o,r)?.trim()||customerOf(o,r)==='散单/待指定')))throw Error('备份已确认订单缺少客户或明细');}
        for(const item of g.inbox)if(item.orderId&&!g.orders.some(o=>o.id===item.orderId&&o.sourceId===item.id)||!item.orderId&&orderedSources.has(item.id))throw Error('备份进件与订单关联不一致');
      }validateDetails(db);return db;
    }
    get group(){return this.db.industries[this.db.current];}
    get selected(){return this.group.inbox.find(i=>i.id===this.group.selected)||null;}
    audit(action,entity,before,after,detail=''){this.db.audit.unshift({id:uid('log'),at:now(),actor:this.db.actor||'本地操作员',industry:this.db.current,action,entity,before:before===undefined?null:clone(before),after:after===undefined?null:clone(after),detail});}
    commit(){this.db.updatedAt=now();this.onChange(this.db);}
    select(id){if(!this.group.inbox.some(i=>i.id===id))throw Error('进件不存在');this.group.selected=id;this.commit();}
    switchIndustry(key){if(!Object.hasOwn(this.db.industries,key))throw Error('行业不存在');this.db.current=key;this.commit();}
    findProduct(name){
      const text=name.trim();if(!text)return {product:null,confidence:0,candidates:[]};
      const exact=this.group.catalog.find(p=>p.name===text||p.aliases.includes(text));if(exact)return {product:exact,confidence:exact.name===text ? .99 : .97,note:exact.name===text?'':'别名 '+text+' → '+exact.name};
      const ranked=this.group.catalog.map(p=>{const tokens=[p.name,...p.aliases];const score=Math.max(...tokens.map(n=>{const chars=new Set(n);const overlap=[...new Set(text)].filter(c=>chars.has(c)).length;return overlap/Math.max(new Set(text).size,chars.size,1);}));return {code:p.code,name:p.name,score};}).filter(x=>x.score>=.25).sort((a,b)=>b.score-a.score).slice(0,4);
      const sub=this.group.catalog.find(p=>p.name.includes(text)||text.includes(p.name));return {product:sub||null,confidence:sub ? .76 : .35,candidates:ranked,note:sub?'名称不完全一致，请复核':''};
    }
    rowFrom(raw,source,seed){
      const e=extract(raw.raw);let match=seed?.code?{product:this.group.catalog.find(p=>p.code===seed.code),confidence:seed.conf,note:seed.note||''}:this.findProduct(e.name);
      if(seed&&!seed.code&&!match.product)match={...match,confidence:seed.conf??match.confidence,note:seed.note||match.note};
      let p=match.product||null;const issues=[...e.issues];let qty=e.qty,u=e.unit||(p?.unit||'件');
      if(seed&&!e.qty&&seed.qty&&e.issues.length===0)qty=String(seed.qty);
      if(p&&qty){try{const normalized=convert(qty,u,p.unit,p);if(unit(u)!==p.unit)issues.push(`已换算 ${qty}${u} → ${normalized}${p.unit}，请核对`);qty=normalized;u=p.unit;}catch(err){issues.push(err.message);qty='';u=p.unit;}}
      if(match.note&&/复核|模糊|确认/.test(match.note))issues.push(match.note);
      if(seed&&seed.code==='FD004'&&e.unit==='箱')issues.push('已修正原演示包装数量：1箱=12盒，3箱=36盒');
      if(!p)issues.push('尚未绑定商品，请选品或建立新品档案');
      const row={id:uid('line'),sourceId:source.id,raw:raw.raw,start:raw.start,end:raw.end,sourceQty:e.qty,sourceUnit:e.unit,name:p?.name||e.name||'待补商品名称',code:p?.code||null,unit:u,qty,priceCents:p?.priceCents??null,confidence:match.confidence||.35,match:p?(match.confidence>=.9?'auto':'review'):'unmatched',confirmed:!!p&&match.confidence>=.9&&issues.length===0,issues:[...new Set(issues)],note:match.note||'',reviewedBy:null,reviewedAt:null};
      row.candidates=clone(seed?.candidates||match.candidates||[]);
      if(!row.confirmed&&p)row.match='review';return row;
    }
    parse(id){
      const item=this.group.inbox.find(i=>i.id===id);if(!item)throw Error('进件不存在');if(item.orderId)throw Error('这条进件已有订单，请在订单中修正，避免重复录入');
      const before={status:item.status,rows:item.parsed.length};let segments;
      if(item.seed){const content=item.content||item.paper.map(p=>p.join(' ')).join('\n');item.content=content;let position=0;segments=item.result.map(r=>{let start=content.indexOf(r.raw,position),end;if(start<0){const name=r.raw.split(' ')[0];start=content.indexOf(name,position);if(start<0)start=position;const lineEnd=content.indexOf('\n',start);end=lineEnd<0?content.length:lineEnd;}else end=start+r.raw.length;const row={raw:r.raw,start,end,seed:r};position=row.end;return row;});}
      else segments=splitSegments(item.content||'').filter(r=>!/^\s*(?:客户|交货日期|下单日期)[：:]/.test(r.raw)&&!/^\s*(?:谢谢|辛苦|下午[一二三四五六七八九十\d]+点前送到|下午要|明天送到)\s*[！!]*$/.test(r.raw));
      if(!item.seed&&!item.content?.trim())throw Error('请先填写识别文本，或连接识别服务处理附件');
      item.parsed=segments.map(r=>this.rowFrom(r,item,r.seed));item.status=item.parsed.length?'parsed':'received';item.parseCount=(item.parseCount||0)+1;item.parsedAt=now();
      if(!item.deliveryDate){const text=item.content||'';const d=new Date();if(/明天/.test(text))d.setDate(d.getDate()+1);else{const m=text.match(/周([一二三四五六日天])/);if(m){const target='日一二三四五六'.indexOf(m[1]==='天'?'日':m[1]);d.setDate(d.getDate()+((target-d.getDay()+7)%7||7));}}if(/明天|周[一二三四五六日天]/.test(text))item.deliveryDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
      const customer=(item.content||'').match(/(?:^|\n)客户[：:]\s*([^\n，,;；]+)/);if(customer&&item.customer==='散单/待指定')item.customer=customer[1].trim();
      this.audit('解析进件',id,before,{rows:item.parsed.length,pending:item.parsed.filter(r=>this.pending(r)).length},item.seed?'内置多模态演示案例':'本地文本规则解析');this.commit();return item.parsed;
    }
    errors(row){const out=[];const product=this.group.catalog.find(p=>p.code===row.code);if(!product)out.push(row.match==='new'?'新品尚未建档':'未绑定有效商品');try{numeric(row.qty,6,true);}catch{out.push('数量必须是有效正数');}if(product&&unit(row.unit)!==product.unit)out.push('单位与商品计价单位不一致');if(row.priceCents===null||!Number.isSafeInteger(row.priceCents)||row.priceCents<0)out.push('单价尚未确定');if(amount(row.qty,row.priceCents)===null)out.push('小计无效或超出安全范围');return [...new Set(out)];}
    pending(row){return !row.confirmed||this.errors(row).length>0;}
    context(kind,id){if(kind==='order'){const order=this.group.orders.find(o=>o.id===id);if(!order)throw Error('订单不存在');return {rows:order.rows,order,item:this.group.inbox.find(i=>i.id===order.sourceId)};}const item=this.group.inbox.find(i=>i.id===id);if(!item)throw Error('进件不存在');const order=this.group.orders.find(o=>o.id===item.orderId);return {rows:order?.rows||item.parsed,order,item};}
    lineAmount(row){return this.errors(row).length?null:amount(row.qty,row.priceCents);}
    invalidateOrder(order){order.status='draft';order.confirmedAt=null;order.confirmedBy=null;order.updatedAt=now();}
    changedContext(ctx){if(ctx.order){this.invalidateOrder(ctx.order);ctx.item.parsed=clone(ctx.order.rows);}this.commit();}
    updateRow(kind,id,rowId,patch,confirm=false){
      const ctx=this.context(kind,id),row=ctx.rows.find(r=>r.id===rowId);if(!row)throw Error('明细不存在');const before=clone(row);const next=clone(row);
      if(patch.qty!==undefined)next.qty=numeric(patch.qty,6,true);
      if(patch.price!==undefined)next.priceCents=priceCents(patch.price);
      if(patch.name!==undefined){if(!patch.name.trim())throw Error('品名不能为空');next.name=patch.name.trim();}
      if(patch.unit!==undefined)next.unit=unit(patch.unit);
      if(patch.note!==undefined)next.note=patch.note.trim();
      if(patch.customer!==undefined){if(typeof patch.customer!=='string'||patch.customer.length>200)throw Error('客户须为200字以内文本');next.customer=patch.customer.trim();}
      if(patch.code!==undefined&&patch.code!==row.code){const product=this.group.catalog.find(p=>p.code===patch.code);if(!product)throw Error('请选择有效商品');next.code=product.code;next.name=product.name;next.priceCents=patch.price!==undefined?priceCents(patch.price):product.priceCents;next.unit=patch.unit!==undefined?unit(patch.unit):product.unit;next.match='manual';next.confidence=1;next.confirmed=false;
        if(patch.qty===undefined){try{next.qty=convert(row.qty||row.sourceQty,row.qty?row.unit:row.sourceUnit,product.unit,product);}catch(e){next.qty='';next.issues=[...next.issues,e.message];}}
      }
      const critical=['code','name','unit','qty','priceCents','customer'].some(k=>(next[k]??'')!==(row[k]??''));
      const noteChanged=(next.note||'')!==(row.note||'');
      if(!critical&&!noteChanged&&(!confirm||row.confirmed))return row;
      if(critical){next.confirmed=false;next.reviewedBy=null;next.reviewedAt=null;if(next.code)next.match='manual';}
      if(confirm&&(critical||!row.confirmed)){const errors=this.errors(next);if(errors.length)throw Error(errors.join('；'));next.confirmed=true;next.reviewedBy=this.db.actor;next.reviewedAt=now();if(next.match!=='auto')next.match='manual';}
      if(ctx.order)this.summary(this.rows().map(x=>x.row.id===rowId?{order:x.order,row:next}:x));
      Object.assign(row,next);this.audit(confirm?'确认明细':'修正明细',rowId,before,next,ctx.item.id);
      if(!critical&&noteChanged&&ctx.order){ctx.item.parsed=clone(ctx.order.rows);this.commit();}else this.changedContext(ctx);return row;
    }
    markNew(kind,id,rowId){const ctx=this.context(kind,id),r=ctx.rows.find(x=>x.id===rowId);if(!r)throw Error('明细不存在');const before=clone(r);r.match='new';r.code=null;r.confirmed=false;r.reviewedBy=null;r.reviewedAt=null;r.priceCents=null;this.audit('标记新品待建',r.id,before,r);this.changedContext(ctx);}
    validateInbox(payload){
      if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('进件须为对象');
      for(const key of ['industry','content','customer','sender','source','externalId','date','deliveryDate','type','contact','address'])if(payload[key]!==undefined&&payload[key]!==null&&typeof payload[key]!=='string')throw Error(key+'须为文本');
      if(!Object.hasOwn(this.db.industries,payload.industry||this.db.current))throw Error('行业无效');
      if(payload.type&&!['text','image','voice'].includes(payload.type))throw Error('进件类型无效');
      if(!String(payload.content||'').trim()&&!payload.attachment)throw Error('请填写文本或选择图片/音频');
      if((payload.content||'').length>50000)throw Error('单件文本最多50000字');
      for(const key of ['customer','sender','source','externalId','contact','address'])if((payload[key]||'').length>500)throw Error(key+'最多500字');
      if(!validDate(payload.date||today())||!validDate(payload.deliveryDate||'',true))throw Error('请填写真实有效的下单/交货日期');
      if(payload.attachment&&(typeof payload.attachment!=='object'||typeof payload.attachment.name!=='string'||typeof payload.attachment.data!=='string'||!/^data:(?:image|audio)\/[\w.+-]+;base64,/.test(payload.attachment.data)||payload.attachment.data.length>12*1024*1024))throw Error('附件格式或大小无效');
    }
    addInboxBatch(list){if(!Array.isArray(list)||list.length>1000)throw Error('一次最多导入1000条进件');for(const p of list)this.validateInbox(p);const before=clone(this.db),notify=this.onChange;this.onChange=()=>{};try{let n=0;for(const p of list)if(this.addInbox(p))n++;this.onChange=notify;this.commit();return n;}catch(e){this.db=before;this.onChange=notify;throw e;}}
    addInbox(payload){
      this.validateInbox(payload);
      const industry=payload.industry||this.db.current;if(!Object.hasOwn(this.db.industries,industry))throw Error('行业无效');const g=this.db.industries[industry];
      if(payload.externalId&&g.inbox.some(i=>i.externalId===payload.externalId))return null;
      if(!String(payload.content||'').trim()&&!payload.attachment)throw Error('请填写文本或选择图片/音频');
      if(String(payload.content||'').length>50000)throw Error('单件文本最多50000字');
      const item={id:uid('inbox'),type:['text','image','voice'].includes(payload.type)?payload.type:'text',source:payload.source||'手工粘贴',sender:payload.sender||this.db.actor,customer:String(payload.customer||'散单/待指定').trim(),contact:payload.contact||'',address:payload.address||'',content:String(payload.content||'').trim(),date:payload.date||today(),deliveryDate:payload.deliveryDate||'',createdAt:now(),time:new Date().toTimeString().slice(0,5),status:'received',parsed:[],orderId:null,seed:false,parseCount:0,externalId:payload.externalId||null,attachment:payload.attachment||null};
      g.inbox.unshift(item);g.selected=item.id;this.audit('接收进件',item.id,null,{customer:item.customer,type:item.type,externalId:item.externalId},item.source);this.commit();return item;
    }
    updateInbox(id,patch){const item=this.group.inbox.find(i=>i.id===id);if(!item)throw Error('进件不存在');const before={customer:item.customer,date:item.date,deliveryDate:item.deliveryDate,content:item.content,contact:item.contact||'',address:item.address||''};
      const customer=String(patch.customer??item.customer).trim();if(!customer)throw Error('客户不能为空');
      for(const key of ['contact','address'])if(patch[key]!==undefined&&(typeof patch[key]!=='string'||patch[key].length>500))throw Error('联系人和地址须为500字以内文本');
      const date=patch.date??item.date;if(!validDate(date)||!validDate(patch.deliveryDate??item.deliveryDate,true))throw Error('请填写真实有效的下单/交货日期');
      if(patch.content!==undefined&&(typeof patch.content!=='string'||patch.content.length>50000))throw Error('原文须为50000字以内文本');
      if(patch.content!==undefined&&patch.content!==item.content&&item.orderId)throw Error('进件已写入，请在订单中修正明细；若需重新解析，请先删除原订单');
      const deliveryDate=patch.deliveryDate??item.deliveryDate;
      if(customer===item.customer&&date===item.date&&deliveryDate===item.deliveryDate&&(patch.content===undefined||patch.content===item.content)&&(patch.contact===undefined||patch.contact===(item.contact||''))&&(patch.address===undefined||patch.address===(item.address||'')))return item;
      if(patch.content!==undefined&&patch.content!==item.content){item.content=String(patch.content);item.seed=false;item.parsed=[];item.status='received';}
      if(patch.contact!==undefined&&typeof patch.contact!=='string'||patch.address!==undefined&&typeof patch.address!=='string')throw Error('联系人和地址须为文本');item.contact=patch.contact??item.contact??'';item.address=patch.address??item.address??'';item.customer=customer;item.date=date;item.deliveryDate=patch.deliveryDate??item.deliveryDate;
      const order=this.group.orders.find(o=>o.id===item.orderId);if(order){order.customer=customer;order.date=date;order.deliveryDate=item.deliveryDate;order.contact=item.contact;order.address=item.address;this.invalidateOrder(order);}
      this.audit('编辑进件',id,before,{customer:item.customer,date:item.date,deliveryDate:item.deliveryDate,content:item.content,contact:item.contact||'',address:item.address||''});this.commit();
    }
    write(id){const ctx=this.context('inbox',id);if(ctx.order)return ctx.order;if(!ctx.rows.length)throw Error('请先解析并核对明细');
      const item=ctx.item;const order={id:uid('order'),no:'ZL'+today().replace(/-/g,'')+'-'+String(this.group.orders.length+1).padStart(3,'0')+'-'+Math.random().toString(36).slice(2,5).toUpperCase(),sourceId:item.id,customer:item.customer,contact:item.contact||'',address:item.address||'',date:item.date||today(),deliveryDate:item.deliveryDate,createdAt:now(),status:'draft',rows:clone(ctx.rows)};
      this.summary([...this.rows(),...order.rows.map(row=>({order,row}))]);
      this.group.orders.unshift(order);item.orderId=order.id;item.status='written';this.audit('写入订单',order.id,null,{no:order.no,customer:order.customer,rows:order.rows.length,pending:order.rows.filter(r=>this.pending(r)).length},item.id);this.commit();return order;
    }
    confirmOrder(id){const order=this.group.orders.find(o=>o.id===id);if(!order)throw Error('订单不存在');if(order.rows.some(r=>!customerOf(order,r)?.trim()||customerOf(order,r)==='散单/待指定'))throw Error('请先指定每条明细的正式客户');if(!order.rows.length||order.rows.some(r=>this.pending(r)))throw Error('请先处理并确认所有异常明细');const total=this.summary(order.rows.map(row=>({order,row}))).totalCents;order.status='confirmed';order.confirmedAt=now();order.confirmedBy=this.db.actor;this.audit('确认订单',id,null,{no:order.no,amountCents:total});this.commit();return order;}
    snapshot(label,orderId=null){this.db.undo.unshift({industry:this.db.current,label,orderId,at:now(),before:clone(this.group)});this.db.undo=this.db.undo.slice(0,10);}
    deleteRows(orderId,rowId){const order=this.group.orders.find(o=>o.id===orderId);if(!order)throw Error('订单不存在');this.snapshot(rowId?'删除明细':'删除订单',orderId);const before=clone(order);if(rowId)order.rows=order.rows.filter(r=>r.id!==rowId);else order.rows=[];
      const item=this.group.inbox.find(i=>i.id===order.sourceId);if(!order.rows.length){this.group.orders=this.group.orders.filter(o=>o.id!==orderId);item.orderId=null;item.status=item.parsed.length?'parsed':'received';}else{this.invalidateOrder(order);item.parsed=clone(order.rows);}this.audit(rowId?'删除明细':'删除订单',rowId||orderId,before,null,'可撤销；删除整单后原进件可重新写入');this.commit();}
    clear(){if(!this.group.orders.length)return;this.snapshot('清空工作台');const count=this.group.orders.length;this.group.orders=[];for(const i of this.group.inbox){i.orderId=null;i.status=i.parsed.length?'parsed':'received';}this.audit('清空工作台',this.db.current,{orders:count},null,'保留进件，可重新写入或撤销');this.commit();}
    undo(){const entry=this.db.undo.find(x=>x.industry===this.db.current);if(!entry)throw Error('当前行业没有可撤销操作');
      const previous=entry.before.orders.filter(o=>!entry.orderId||o.id===entry.orderId);
      for(const old of previous){const item=this.group.inbox.find(i=>i.id===old.sourceId);if(!item||item.orderId&&item.orderId!==old.id)continue;let order=this.group.orders.find(o=>o.id===old.id);
        if(!order){order=clone(old);this.group.orders.unshift(order);}else{const current=new Map(order.rows.map(r=>[r.id,r]));order.rows=old.rows.map(r=>current.get(r.id)||clone(r)).concat(order.rows.filter(r=>!old.rows.some(x=>x.id===r.id)));this.invalidateOrder(order);}
        order.customer=item.customer;order.date=item.date;order.deliveryDate=item.deliveryDate;order.contact=item.contact;order.address=item.address;this.invalidateOrder(order);
        item.orderId=order.id;item.status='written';item.parsed=clone(order.rows);
      }
      this.db.undo=this.db.undo.filter(x=>x!==entry);this.audit('撤销操作',entry.industry,null,null,entry.label+'；保留其后的商品维护、进件及明细修正');this.commit();}
    saveProduct(payload,code){
      const existing=this.group.catalog.find(p=>p.code===code);const p={code:String(code||payload.code||uid('SKU')).trim(),name:String(payload.name||'').trim(),unit:unit(payload.unit),spec:String(payload.spec||'').trim(),priceCents:priceCents(payload.price),aliases:String(payload.aliases||'').split(/[，,、\n]/).map(x=>x.trim()).filter(Boolean),conversions:{}};
      if(!/^[A-Za-z0-9_-]{2,80}$/.test(p.code)||!p.name||!p.unit)throw Error('商品编码须为字母、数字或连字符，名称和单位不能为空');
      p.aliases=[...new Set(p.aliases)].filter(a=>a!==p.name);
      if(this.group.catalog.some(x=>x.code!==code&&(x.code===p.code||[p.name,...p.aliases].some(a=>[x.name,...x.aliases].includes(a)))))throw Error('商品编码、名称或别名与已有商品重复');
      if(payload.conversions){for(const pair of String(payload.conversions).split(/[，,\n]/).filter(x=>x.trim())){const [from,factor]=pair.split(/[=:：]/).map(x=>x.trim());if(!from||!factor)throw Error('换算格式示例：箱=12，表示1箱等于12个计价单位');const key=unit(from);if(Object.hasOwn(p.conversions,key))throw Error('包装换算单位不能重复');p.conversions[key]=Number(numeric(factor,18,true));}}
      if(Object.hasOwn(p.conversions,p.unit)&&p.conversions[p.unit]!==1)throw Error('同一计价单位的换算系数必须为1');
      const allRows=[...this.group.orders.flatMap(o=>o.rows),...this.group.inbox.flatMap(i=>i.parsed)];if(existing&&existing.unit!==p.unit&&allRows.some(r=>r.code===code))throw Error('商品已有业务引用，不能直接改变计价单位；请新建规格');
      const before=existing?clone(existing):null;if(existing)Object.assign(existing,p);else this.group.catalog.push(p);
      if(existing){for(const r of allRows)if(r.code===p.code)r.name=p.name;}
      this.audit(existing?'编辑商品':'新建商品',p.code,before,p,'历史单价保留，名称按稳定商品编码关联');this.commit();return p;
    }
    transaction(fn){const before=clone(this.db),notify=this.onChange;this.onChange=()=>{};try{const result=fn();this.summary();this.onChange=notify;this.commit();return result;}catch(e){this.db=before;this.onChange=notify;throw e;}}
    addRow(kind,id,payload={},copyId=null){const ctx=this.context(kind,id),source=copyId&&ctx.rows.find(r=>r.id===copyId);if(copyId&&!source)throw Error('待复制的明细不存在');const p=payload.code&&this.group.catalog.find(p=>p.code===payload.code);if(payload.code&&!p)throw Error('商品不存在');
      const row=source?clone(source):{sourceId:ctx.item.id,raw:String(payload.raw||'人工补录'),start:-1,end:-1,sourceQty:'',sourceUnit:'',name:p?.name||'待补商品名称',code:p?.code||null,unit:p?.unit||'件',qty:payload.qty?numeric(payload.qty,6,true):'',priceCents:payload.price!==undefined?priceCents(payload.price):p?.priceCents??null,confidence:1,match:p?'manual':'unmatched',issues:[],note:'人工补录，请核对',candidates:[]};
      row.id=uid('line');row.confirmed=false;row.reviewedBy=null;row.reviewedAt=null;if(source)row.parentRowId=source.id;
      this.summary([...this.rows(),...(ctx.order?[{order:ctx.order,row}]:[])]);ctx.rows.push(row);if(!ctx.order)ctx.item.status='parsed';this.audit(source?'复制明细':'添加明细',row.id,null,row,ctx.item.id);this.changedContext(ctx);return row;}
    splitRow(kind,id,rowId,firstQty){return this.transaction(()=>{const ctx=this.context(kind,id),row=ctx.rows.find(r=>r.id===rowId);if(!row)throw Error('明细不存在');const q=numeric(firstQty,6,true),scale=x=>{const [a,b='']=String(x).split('.');return BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'));};const remainder=scale(numeric(row.qty,6,true))-scale(q);if(remainder<=0n)throw Error('拆分数量须大于0且小于原数量');const text=numeric((Number(remainder)/1000000).toFixed(6),6,true),copy={...clone(row),id:uid('line'),parentRowId:row.id,qty:text,confirmed:false,reviewedBy:null,reviewedAt:null,note:'由同一原文拆分，逐行计价后请复核',match:row.code?'manual':row.match};this.updateRow(kind,id,rowId,{qty:q});ctx.rows.push(copy);this.audit('拆分明细',rowId,null,{first:q,second:text,unit:row.unit},ctx.item.id);this.changedContext(ctx);return copy;});}
    bulkRows(entries,patch,confirm=false){return this.transaction(()=>{if(!entries.length)throw Error('请先勾选明细');for(const e of entries){const ctx=this.context('order',e.orderId);if(!ctx.rows.some(r=>r.id===e.rowId))throw Error('所选明细已变化，请重新选择');this.updateRow('order',e.orderId,e.rowId,patch,confirm);}return entries.length;});}
    splitCustomers(orderId){return this.transaction(()=>{const ctx=this.context('order',orderId),groups=new Map();for(const r of ctx.rows){const name=customerOf(ctx.order,r);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(r);}if(groups.size<2)throw Error('当前订单仅有一个客户，无需拆单');const original=clone(ctx.item),order=ctx.order;let index=0;const orders=[];for(const [customer,rows] of groups){let item,o;if(index++===0){item=ctx.item;o=order;}else{item={...clone(original),id:uid('inbox'),orderId:null,seed:false,originalSourceId:original.originalSourceId||original.id,externalId:null,parsed:[],status:'parsed',customer};this.group.inbox.unshift(item);o={...clone(order),id:uid('order'),sourceId:item.id,no:order.no+'-'+index};this.group.orders.unshift(o);}o.customer=customer;o.rows=rows.map(r=>({...clone(r),id:index===1?r.id:uid('line'),sourceId:item.id,customer:''}));this.invalidateOrder(o);item.customer=customer;item.parsed=clone(o.rows);item.orderId=o.id;item.status='written';orders.push(o);}this.audit('按客户拆单',orderId,null,{orders:orders.map(o=>({id:o.id,customer:o.customer,rows:o.rows.length}))},'共同原文来源：'+original.id);return orders;});}
    saveCustomer(payload,id){const list=this.group.customers||[];const name=String(payload.name||'').trim();if(!name||name.length>200)throw Error('请输入200字以内客户名称');if(list.some(c=>c.id!==id&&c.name===name))throw Error('客户名称已存在');const days=Number(payload.deliveryDays||0);if(!Number.isInteger(days)||days<0||days>365)throw Error('默认交期须为0至365天');const p={id:id||uid('customer'),name,contact:String(payload.contact||'').trim(),address:String(payload.address||'').trim(),deliveryDays:days,prices:{}};for(const [code,value] of Object.entries(payload.prices||{})){if(!this.group.catalog.some(p=>p.code===code))throw Error('协议价商品不存在');p.prices[code]=priceCents(value);}const previous=list.find(c=>c.id===id);if(id&&!previous)throw Error('客户档案不存在');const before=previous?clone(previous):null;if(previous)Object.assign(previous,p);else list.push(p);this.group.customers=list;this.audit('维护客户档案',p.id,before,p,'档案修改不覆盖历史订单；协议价需在新订单显式应用');this.commit();return p;}
    rows(){return this.group.orders.flatMap(o=>o.rows.map(r=>({order:o,row:r})));}
    summary(entries=this.rows()){const groups=new Map();let totalCents=0,unpriced=0,pending=0;for(const {order,row} of entries){const cents=this.lineAmount(row);if(cents===null)unpriced++;else totalCents=addCents(totalCents,cents);if(this.pending(row))pending++;const customer=customerOf(order,row),group=groups.get(customer)||{count:0,cents:0,unpriced:0};group.count++;if(cents!==null)group.cents=addCents(group.cents,cents);else group.unpriced++;groups.set(customer,group);}return {count:entries.length,totalCents,unpriced,pending,groups};}
    exportCSV(entries=this.rows()){
      const header=['订单号','下单日期','交货日期','客户','商品编号','品名','单位','数量','单价','小计','匹配状态','复核状态','订单状态','原文片段','进件ID','来源','发送人','进件时间','确认人','确认时间'];
      const cell=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
      const lines=entries.map(({order:o,row:r})=>{const source=this.group.inbox.find(i=>i.id===o.sourceId);return [o.no,o.date,o.deliveryDate,customerOf(o,r),r.code||'',r.name,r.unit,r.qty,priceText(r.priceCents),this.lineAmount(r)===null?'':priceText(this.lineAmount(r)),{auto:'自动匹配',manual:'手动匹配',review:'待复核',unmatched:'未匹配',new:'新品待建'}[r.match],this.pending(r)?'待处理':'已确认',o.status==='confirmed'?'已确认':'草稿',r.raw,source.id,source.source,source.sender,source.createdAt,r.reviewedBy||'',r.reviewedAt||''].map(cell).join(',');});return '\uFEFF'+[header.map(cell).join(','),...lines].join('\r\n');
    }
  }
  root.OrderCore={Store,uid,clone,now,today,money,priceCents,priceText,numeric,amount,cnNumber,convert,unit,extract,splitSegments,validDate,customerOf};
})(window);
