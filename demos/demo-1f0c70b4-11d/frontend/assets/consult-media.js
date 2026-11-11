(function(){
 'use strict';const e=App.esc;
 window.ConsultMedia={
  key:()=> 'CONSULT-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),
  html:files=>(files||[]).map(f=>`<div class="consult-attachment">${f.mime.startsWith('image/')?`<button data-consult-media="${f.id}" aria-label="查看图片 ${e(f.name)}"><img src="${e(f.data_url)}" alt="${e(f.name)}"></button>`:`<video controls playsinline preload="metadata" src="${e(f.data_url)}" aria-label="${e(f.name)}"></video>`}<small>${e(f.name)}</small></div>`).join(''),
  bind(root,files){root.querySelectorAll('[data-consult-media]').forEach(b=>b.onclick=()=>{const f=files.find(f=>String(f.id)===b.dataset.consultMedia);if(f)App.modal({title:f.name,width:'xwide',body:`<div class="consult-image-view"><img src="${e(f.data_url)}" alt="${e(f.name)}"></div>`,footer:'<button class="btn" data-close>关闭</button>'});});},
  composer(root,state,id){
   const pick=root.querySelector('#consult-media-pick'),input=root.querySelector('#consult-media-files'),box=root.querySelector('.consult-media-drafts'),send=root.querySelector('#send');state.mediaDrafts[id]=state.mediaDrafts[id]||[];let locked=false;
   const draw=()=>{box.innerHTML=state.mediaDrafts[id].map((f,i)=>`<div class="consult-media-draft">${f.mime.startsWith('image/')?`<img src="${e(f.data_url)}" alt="附件预览">`:'<span>视频</span>'}<span>${e(f.name)}</span><button data-remove="${i}" aria-label="移除 ${e(f.name)}">×</button></div>`).join('');box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(locked)return;state.mediaDrafts[id].splice(Number(b.dataset.remove),1);delete state.requests[id];draw();});};draw();
   pick.onclick=()=>input.click();input.onchange=async()=>{if(locked)return;pick.disabled=send.disabled=true;try{const files=await Promise.all(Array.from(input.files).map(f=>{if(!['image/png','image/jpeg','image/webp','video/mp4','video/webm'].includes(f.type))throw Error('请选择PNG/JPG/WebP图片或MP4/WebM视频');if(f.size>(f.type.startsWith('video/')?8:3)*1024*1024)throw Error('图片不超过3MB，短视频不超过8MB');return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(Error('附件读取失败'));r.onload=()=>resolve({name:f.name,mime:f.type,size:f.size,data_url:r.result});r.readAsDataURL(f);});})),all=state.mediaDrafts[id].concat(files);if(all.length>3||all.reduce((n,f)=>n+f.size,0)>12*1024*1024)throw Error('每条消息最多3个附件，合计不超过12MB');state.mediaDrafts[id]=all;delete state.requests[id];draw();}catch(error){App.toast(error.message,'err');}finally{input.value='';pick.disabled=send.disabled=false;}};
   return {disabled(value){locked=value;pick.disabled=value;box.querySelectorAll('button').forEach(b=>b.disabled=value);}};
  }
 };
})();
