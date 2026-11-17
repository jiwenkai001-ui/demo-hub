'use strict';
const button=document.querySelector('#download-client');
const message=document.querySelector('#download-message');
const progress=document.querySelector('#download-progress');
const statusText=document.querySelector('#download-status');
const progressBar=document.querySelector('[role=progressbar]');
let release=null,controller=null,objectUrls=new Set();
const mib=bytes=>(bytes/1024/1024).toFixed(1);
const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
function showMessage(text,error=false){message.textContent=text;message.classList.toggle('error',error);}
async function loadRelease(){
 const response=await fetch('downloads/release.json',{cache:'no-cache'});
 if(!response.ok)throw Error('下载信息暂时不可用，请稍后重试。');
 const data=await response.json();
 if(data.version!=='1.0.5'||!Array.isArray(data.parts)||!data.parts.length||!Number.isSafeInteger(data.bytes)||data.bytes<=0)throw Error('下载信息有误，请联系维护人员。');
 for(const part of data.parts)if(!/^client\.part\d+\.json$/.test(part.file)||!['downloads/'+part.file,'../xiaoqi-client-downloads/downloads/'+part.file,'../xiaoqi-client-downloads-2/downloads/'+part.file].includes(part.path)||!Number.isSafeInteger(part.bytes)||part.bytes<=0||!Number.isSafeInteger(part.downloadBytes)||part.downloadBytes<=0||!/^[a-f0-9]{64}$/.test(part.sha256))throw Error('下载文件信息有误，请联系维护人员。');
 if(data.parts.reduce((total,part)=>total+part.bytes,0)!==data.bytes)throw Error('下载文件大小信息不一致。');
 release=data;
 document.querySelector('#release-version').textContent='v'+data.version;
 document.querySelector('#release-meta').textContent=`Windows 64 位 · ${mib(data.bytes)} MB · 在线安装包`;
 return data;
}
function updateProgress(bytes,total){const percent=Math.min(100,Math.floor(bytes/total*100));document.querySelector('#progress-fill').style.width=percent+'%';progressBar.setAttribute('aria-valuenow',String(percent));statusText.textContent=`正在下载 ${percent}% · ${mib(bytes)} / ${mib(total)} MB`;}
document.querySelector('#cancel-download').addEventListener('click',()=>controller?.abort());
button.addEventListener('click',async()=>{
 if(controller)return;
 controller=new AbortController();const signal=controller.signal;
 button.disabled=true;button.textContent='正在准备下载…';progress.hidden=false;showMessage('请保持页面打开，完成后会保存为一个完整 ZIP。');statusText.textContent='正在获取下载信息…';updateProgress(0,1);
 try{
  const data=release||await loadRelease();if(signal.aborted)throw new DOMException('已取消','AbortError');
  const blobs=[];let completed=0;
  for(const part of data.parts){
   const response=await fetch(part.path,{signal});if(!response.ok)throw Error('客户端下载暂时失败，请重试。');
   const reader=response.body.getReader(),chunks=[];let received=0;
   while(true){const {done,value}=await reader.read();if(done)break;received+=value.byteLength;if(received>part.downloadBytes)throw Error('下载文件大小异常，请重试。');chunks.push(value);updateProgress(completed+Math.floor(received/part.downloadBytes*part.bytes),data.bytes);}
   if(received!==part.downloadBytes)throw Error('网络传输未完成，请重试。');
   const payload=JSON.parse(await new Blob(chunks).text());if(typeof payload.base64!=='string')throw Error('下载文件格式异常，请重试。');
   const binary=atob(payload.base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   if(bytes.length!==part.bytes)throw Error('下载文件不完整，请重试。');
   const blob=new Blob([bytes]);statusText.textContent=`正在校验文件 · ${Math.floor((completed+part.bytes)/data.bytes*100)}%`;
   if(await sha256(await blob.arrayBuffer())!==part.sha256)throw Error('下载文件校验未通过，请重新下载。');
   if(signal.aborted)throw new DOMException('已取消','AbortError');blobs.push(blob);completed+=part.bytes;
  }
  const blob=new Blob(blobs,{type:'application/zip'});if(blob.size!==data.bytes)throw Error('下载文件不完整，请重试。');
  const url=URL.createObjectURL(blob);objectUrls.add(url);const a=document.createElement('a');a.href=url;a.download=data.filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>{URL.revokeObjectURL(url);objectUrls.delete(url);},300000);
  statusText.textContent='文件校验完成';showMessage('已提交浏览器下载。请在下载列表中查看 ZIP，完整解压后运行「安装小栖.cmd」，首次需联网安装运行组件。');
 }catch(error){showMessage(error.name==='AbortError'?'下载已取消，随时可以重新开始。':error.message||'下载失败，请检查网络后重试。',error.name!=='AbortError');}
 finally{controller=null;button.disabled=false;button.textContent='下载 Windows 在线安装包 ↓';progress.hidden=true;}
});
window.addEventListener('pagehide',()=>{controller?.abort();for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls.clear();});
loadRelease().catch(()=>showMessage('暂时无法获取版本信息，点击下载可重试。',true));
