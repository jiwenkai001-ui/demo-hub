(function(D){
  'use strict';
  const {add,q,q1,val,run,get,insert,update,fail,n,int,now,next,ref,flag,filters,paged,items,charge,asset}=D;
  add('GET','/lis/devices',p=>{const f=filters({status:p.status});return items('SELECT * FROM lab_devices'+f.sql+' ORDER BY id',f.args);});
  add('POST','/lis/devices',(p,d)=>{const name=(d.name||'').trim();if(!name)fail('设备名称必填');return get('lab_devices',insert('lab_devices',{name,model:d.model??'',manufacturer:d.manufacturer??'',serial_no:d.serial_no??'',category:d.category??'血球',protocol:d.protocol??'ASTM',host:d.host??'',port:int(d.port),status:d.status??'在线',last_sync_at:null,created_at:now()}));});
  add('PATCH','/lis/devices/{id}/status',(p,d)=>update('lab_devices',p.id,{status:d.status??'在线',last_sync_at:now()}));
  add('POST','/lis/devices/{id}/test',p=>{
    const dev=get('lab_devices',p.id,'设备'),ok=dev.status==='在线',message=ok?`已连接 ${dev.name}（${dev.protocol}${dev.host&&dev.port?' '+dev.host+':'+dev.port:''}），通讯正常`:`${dev.name} 当前${dev.status}，无法建立通讯`;
    insert('lis_device_logs',{device_id:p.id,device_name:dev.name,direction:'OUT',protocol:dev.protocol,payload:'ENQ / 握手请求',parsed:ok?1:0,message,created_at:now()});return {ok,message};
  });
  add('GET','/lis/items',p=>{
    const f=filters({'li.panel':p.panel},p.keyword,['li.name','li.code']),rows=q('SELECT li.*,ld.name AS device_name FROM lab_items li LEFT JOIN lab_devices ld ON ld.id=li.device_id'+f.sql+' ORDER BY li.panel,li.id',f.args);rows.forEach(r=>r.ref_text=ref(r.ref_low,r.ref_high));return {items:rows};
  });
  add('GET','/lis/panels',()=>items('SELECT panel,COUNT(*) AS count FROM lab_items GROUP BY panel ORDER BY panel'));
  add('GET','/lis/orders',p=>paged(`SELECT lo.*,p.name AS pet_name,p.species,o.name AS owner_name,s.name AS doctor_name,ld.name AS device_name,
    (SELECT COUNT(*) FROM lab_results lr WHERE lr.order_id=lo.id) AS result_count FROM lab_orders lo LEFT JOIN pets p ON p.id=lo.pet_id
    LEFT JOIN owners o ON o.id=p.owner_id LEFT JOIN staff s ON s.id=lo.doctor_id LEFT JOIN lab_devices ld ON ld.id=lo.device_id`,
    filters({'lo.status':p.status,'lo.panel':p.panel},p.keyword,['p.name','o.name','lo.order_no']),'lo.id DESC',p));
  add('POST','/lis/orders',(p,d)=>{
    const pid=int(d.pet_id),panel=d.panel;if(!pid||!panel)fail('宠物与检验项目组必填');const rows=q('SELECT * FROM lab_items WHERE panel=?',[panel]);if(!rows.length)fail('该项目组暂无检验项目');
    const id=insert('lab_orders',{order_no:next('L','lab_orders','order_no'),visit_id:int(d.visit_id)||null,pet_id:pid,doctor_id:int(d.doctor_id)||null,panel,device_id:int(d.device_id)||rows[0].device_id,priority:d.priority??'常规',status:'已开单',sample_type:d.sample_type??'全血',note:d.note??'',ordered_at:now(),reported_at:null,created_at:now()});
    if(int(d.visit_id))charge(int(d.visit_id),'检验',panel+'检查',1,rows.reduce((sum,r)=>sum+D.money(r.price),0)||120,id);return get('lab_orders',id);
  });
  function orderDetail(id){
    const o=get('lab_orders',id,'检验申请单');o.pet=q1('SELECT * FROM pets WHERE id=?',[o.pet_id]);o.owner=q1('SELECT o.* FROM owners o JOIN pets p ON p.owner_id=o.id WHERE p.id=?',[o.pet_id]);o.device=o.device_id?q1('SELECT * FROM lab_devices WHERE id=?',[o.device_id]):null;o.visit=o.visit_id?q1('SELECT * FROM visits WHERE id=?',[o.visit_id]):null;
    o.results=q('SELECT lr.*,li.panel FROM lab_results lr LEFT JOIN lab_items li ON li.id=lr.item_id WHERE lr.order_id=? ORDER BY lr.id',[id]);o.results.forEach(r=>r.ref_text=ref(r.ref_low,r.ref_high));o.abnormal=o.results.filter(r=>r.flag!=='正常');return o;
  }
  D.orderDetail=orderDetail;
  add('GET','/lis/orders/{id}',p=>orderDetail(p.id));
  add('PATCH','/lis/orders/{id}/status',(p,d)=>{const o=get('lab_orders',p.id,'检验申请单');if(!d.status)fail('缺少状态');const change={status:d.status};if(['已完成','已审核'].includes(d.status)&&!o.reported_at)change.reported_at=now();return update('lab_orders',p.id,change);});
  add('POST','/lis/orders/{id}/results',(p,d)=>{
    const o=get('lab_orders',p.id,'检验申请单'),iid=int(d.item_id)||null,value=String(d.value??'').trim();if(!value)fail('结果值必填');const it=iid?get('lab_items',iid,'检验项目'):null;
    const code=it?it.code:d.item_code||'',name=it?it.name:d.item_name||code,unit=it?it.unit:d.unit??'',low=it?it.ref_low:n(d.ref_low),high=it?it.ref_high:n(d.ref_high);
    insert('lab_results',{order_id:p.id,item_id:iid,item_code:code,item_name:name,value,unit,ref_low:low,ref_high:high,flag:flag(value,low,high),source:'手动录入',device_id:o.device_id,raw_payload:'',result_at:now(),created_at:now()});
    if(['已开单','已采样','检测中'].includes(o.status))update('lab_orders',p.id,{status:'已完成',reported_at:now()});return get('lab_orders',p.id);
  });
  add('PUT','/lis/results/{id}',(p,d)=>{const r=get('lab_results',p.id,'检验结果'),value=String(d.value??r.value);return update('lab_results',p.id,{value,flag:flag(value,r.ref_low,r.ref_high),result_at:now()});});
  function parse(payload){
    const text=(payload||'').trim();if(!text)return {rows:[],order:null};
    if(text.startsWith('{')){try{const obj=JSON.parse(text);return {rows:(obj.results||[]).map(r=>({code:String(r.code??'').trim(),value:String(r.value??'').trim(),unit:String(r.unit||''),ref:String(r.ref||'')})),order:obj.order_no};}catch(_){return {rows:[],order:null};}}
    const rows=[];text.split(/\r\n|\n|\r/).forEach(line=>{
      line=line.trim();if(!line)return;const f=line.split('|'),g=i=>(f[i]||'').trim();let code,value,unit,reference;
      if(line.toUpperCase().startsWith('OBX')){code=g(3).split('^')[0];value=g(5);unit=g(6);reference=g(7);}
      else if(line.includes('^^^')||line.startsWith('R|')){const seg=f.find(s=>s.includes('^^^'));if(!seg)return;code=seg.split('^^^')[1].split('^')[0];value=g(3);unit=g(4);reference=g(5);}else return;
      if(code&&value)rows.push({code,value,unit,ref:reference});
    });return {rows,order:null};
  }
  function push(d){
    const did=int(d.device_id)||null,dev=did?q1('SELECT * FROM lab_devices WHERE id=?',[did]):null,payload=d.payload??'',protocol=d.protocol||(dev?dev.protocol:'ASTM'),parsed=parse(payload);
    let order=int(d.order_id)?q1('SELECT * FROM lab_orders WHERE id=?',[int(d.order_id)]):null;
    if(!order&&d.order_no)order=q1('SELECT * FROM lab_orders WHERE order_no=?',[d.order_no]);if(!order&&parsed.order)order=q1('SELECT * FROM lab_orders WHERE order_no=?',[parsed.order]);
    const log=insert('lis_device_logs',{device_id:did,device_name:dev?dev.name:'',direction:'IN',protocol,payload:payload.slice(0,4000),parsed:parsed.rows.length,message:'',created_at:now()});
    if(!order){update('lis_device_logs',log,{message:'未匹配到检验申请单，需指定 order_id/order_no'});return {ok:false,parsed:parsed.rows.length,message:'未匹配到检验申请单（请在请求中携带 order_id 或 order_no）'};}
    let saved=0;const skipped=[];parsed.rows.forEach(r=>{
      const it=q1('SELECT * FROM lab_items WHERE UPPER(code)=UPPER(?)',[r.code]);if(!it){skipped.push(r.code);return;}
      insert('lab_results',{order_id:order.id,item_id:it.id,item_code:it.code,item_name:it.name,value:r.value,unit:r.unit||it.unit,ref_low:it.ref_low,ref_high:it.ref_high,flag:flag(r.value,it.ref_low,it.ref_high),source:'设备直读',device_id:did,raw_payload:r.ref,result_at:now(),created_at:now()});saved++;
    });if(saved)update('lab_orders',order.id,{status:'已完成',reported_at:now()});if(dev)update('lab_devices',dev.id,{last_sync_at:now()});
    const message=`接收 ${parsed.rows.length} 项，成功入库 ${saved} 项`+(skipped.length?'，未识别项目：'+skipped.join(','):'');update('lis_device_logs',log,{message});return {ok:true,order_id:order.id,order_no:order.order_no,saved,skipped,message};
  }
  add('POST','/lis/device/push',(p,d)=>push(d));
  add('POST','/lis/orders/{id}/simulate',p=>{
    const o=get('lab_orders',p.id,'检验申请单'),rows=q('SELECT * FROM lab_items WHERE panel=?',[o.panel]);if(!rows.length)fail('该项目组无检验项目');const dev=o.device_id?q1('SELECT * FROM lab_devices WHERE id=?',[o.device_id]):null;
    const random=(lo,hi)=>lo+Math.random()*(hi-lo),lines=[`H|\\^&|||${dev?dev.model:'SIM'}|||||host||P|1`];
    rows.forEach((it,i)=>{let value;if(it.ref_low==null&&it.ref_high==null)value=['阴性','阴性','阴性','阳性','未见'][Math.floor(Math.random()*5)];else if(it.code==='PH')value=random(7.28,7.48).toFixed(2);else if(it.code==='USG')value=random(1.012,1.046).toFixed(3);else{const lo=it.ref_low||0,hi=it.ref_high||lo*2||100;value=(Math.random()<.75?random(lo+(hi-lo)*.1,lo+(hi-lo)*.9):Math.random()<.5?random(hi*1.05,hi*1.5):random(Math.max(lo*.4,.01),lo*.95)).toFixed(2);}lines.push(`R|${i+1}|^^^${it.code}^1|${value}|${it.unit}|${it.ref_low||''}^${it.ref_high||''}||F`);});
    return push({device_id:o.device_id,order_id:p.id,payload:lines.join('\n'),protocol:dev?dev.protocol:'ASTM'});
  });
  add('GET','/lis/logs',p=>items('SELECT * FROM lis_device_logs ORDER BY id DESC LIMIT ?',[int(p.limit,30)]));
  add('GET','/imaging/studies',p=>paged(`SELECT st.*,p.name AS pet_name,p.species,o.name AS owner_name,s.name AS doctor_name,
    (SELECT file_path FROM imaging_instances ii WHERE ii.study_id=st.id ORDER BY ii.instance_no LIMIT 1) AS cover FROM imaging_studies st
    LEFT JOIN pets p ON p.id=st.pet_id LEFT JOIN owners o ON o.id=p.owner_id LEFT JOIN staff s ON s.id=st.doctor_id`,
    filters({'st.modality':p.modality,'st.status':p.status,'st.pet_id':int(p.pet_id)||null},p.keyword,['p.name','o.name','st.body_part']),'st.performed_at DESC',p));
  add('POST','/imaging/studies',(p,d)=>{
    const pid=int(d.pet_id);if(!pid)fail('宠物必填');const id=insert('imaging_studies',{study_uid:'1.2.840.113619.2.55.'+Math.floor(Math.random()*100000)+'.'+now().replace(/[-: ]/g,''),visit_id:int(d.visit_id)||null,pet_id:pid,doctor_id:int(d.doctor_id)||null,modality:d.modality??'DR',body_part:d.body_part??'腹部',findings:d.findings??'',impression:d.impression??'',image_count:0,status:d.status??'已登记',performed_by:d.performed_by??'',performed_at:now(),created_at:now()});
    if(int(d.visit_id))charge(int(d.visit_id),'影像',(d.modality??'DR')+'-'+(d.body_part??'腹部')+'检查',1,n(d.price,180),id);return get('imaging_studies',id);
  });
  function instances(id){return q('SELECT * FROM imaging_instances WHERE study_id=? ORDER BY instance_no',[id]).map(r=>Object.assign(r,{url:asset(r.file_path.startsWith('data:')?r.file_path:'uploads/'+r.file_path)}));}
  D.instances=instances;
  add('GET','/imaging/studies/{id}',p=>{
    const st=get('imaging_studies',p.id,'影像检查');st.pet=q1('SELECT * FROM pets WHERE id=?',[st.pet_id]);st.owner=q1('SELECT o.* FROM owners o JOIN pets p ON p.owner_id=o.id WHERE p.id=?',[st.pet_id]);st.doctor=st.doctor_id?q1('SELECT * FROM staff WHERE id=?',[st.doctor_id]):null;st.visit=st.visit_id?q1('SELECT * FROM visits WHERE id=?',[st.visit_id]):null;st.instances=instances(p.id);return st;
  });
  add('PUT','/imaging/studies/{id}',(p,d)=>update('imaging_studies',p.id,d,['modality','body_part','findings','impression','status','performed_by']));
  add('DELETE','/imaging/studies/{id}',p=>{get('imaging_studies',p.id,'影像检查');run('DELETE FROM imaging_instances WHERE study_id=?',[p.id]);run('DELETE FROM imaging_studies WHERE id=?',[p.id]);return {ok:true};});
  add('POST','/imaging/studies/{id}/instances',(p,d)=>{
    get('imaging_studies',p.id,'影像检查');const ext=d.ext||'jpg',name='UP'+now().replace(/[-: ]/g,'')+Math.random().toString(16).slice(2,8)+'.'+ext;
    const id=insert('imaging_instances',{study_id:p.id,instance_no:n(val('SELECT COALESCE(MAX(instance_no),0) FROM imaging_instances WHERE study_id=?',[p.id]))+1,file_name:name,file_path:d.dataURL,mime:'image/'+(ext==='jpg'?'jpeg':ext),width:d.width,height:d.height,size_kb:Math.max(Math.floor(atob(d.dataURL.split(',')[1]).length/1024),1),note:d.note??'',uploaded_at:now()});
    run("UPDATE imaging_studies SET image_count=(SELECT COUNT(*) FROM imaging_instances WHERE study_id=?),status='已完成' WHERE id=?",[p.id,p.id]);return get('imaging_instances',id);
  });
  add('DELETE','/imaging/instances/{id}',p=>{const r=get('imaging_instances',p.id,'影像文件');run('DELETE FROM imaging_instances WHERE id=?',[p.id]);run('UPDATE imaging_studies SET image_count=(SELECT COUNT(*) FROM imaging_instances WHERE study_id=?) WHERE id=?',[r.study_id,r.study_id]);return {ok:true};});
})(window.Demo);
