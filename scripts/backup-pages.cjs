const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');

async function main() {
  const repository=process.env.GITHUB_REPOSITORY,token=process.env.PAGES_BACKUP_TOKEN,revision=process.env.GITHUB_SHA;
  if (!repository || !token || !/^[a-f0-9]{40}$/.test(revision || '') || !/^\d+$/.test(process.env.GITHUB_RUN_ID || '')) throw new Error('长期备份缺少正式发布身份或版本');
  const archive=path.resolve('.codex-tmp/pages-artifact/artifact.tar');
  if (!fs.existsSync(archive)) throw new Error('长期备份缺少本次正式发布的artifact.tar');
  const verify=fs.mkdtempSync(path.resolve('.codex-tmp/backup-verify-'));
  execFileSync('tar',['-xf',archive,'-C',verify,'./deploy-results.json']);
  const report=JSON.parse(fs.readFileSync(path.join(verify,'deploy-results.json'),'utf8'));
  if (report.version!==1 || report.revision!==revision) throw new Error('长期备份与刚完成的正式发布版本不一致');
  const bytes=zlib.gzipSync(fs.readFileSync(archive)),digest=crypto.createHash('sha256').update(bytes).digest('hex');
  const api='https://api.github.com/repos/'+repository,tag='pages-backup-'+process.env.GITHUB_RUN_ID+'-'+(process.env.GITHUB_RUN_ATTEMPT || '1'),filename='site-'+digest+'.tar.gz';
  const meta={type:'demo-hub-pages-backup',version:1,revision,sha256:digest};
  const request=async(url,init={},optional=false)=>{
    const response=await fetch(url,{...init,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',...init.headers},signal:AbortSignal.timeout(60000)});
    if (!response.ok && !(optional && response.status===404)) {const error=new Error('长期备份请求失败（HTTP '+response.status+'）');error.status=response.status;throw error;}
    return response;
  };
  for (let attempt=0;attempt<3;attempt++) {
    try {
      let response=await request(api+'/releases/tags/'+tag,{},true),release=response.status===404 ? null : await response.json();
      // GitHub按tag读取只返回已发布Release；重试时还要找到上次未完成的草稿。
      if (!release) release=(await (await request(api+'/releases?per_page=20')).json()).find(item=>item.tag_name===tag);
      if (!release) {
        response=await request(api+'/releases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,target_commitish:revision,name:'Pages backup '+revision.slice(0,7),body:JSON.stringify(meta),draft:true,prerelease:true})});
        release=await response.json();
      }
      if (!release.id) throw new Error('长期备份未取得有效发布ID');
      const assets=await (await request(api+'/releases/'+release.id+'/assets')).json();
      if (!assets.some(item=>item.name===filename)) {
        await request('https://uploads.github.com/repos/'+repository+'/releases/'+release.id+'/assets?name='+filename,{method:'POST',headers:{'Content-Type':'application/gzip'},body:bytes});
      }
      // 只有完整归档可读取后才发布草稿，下一次构建不会读到半份备份。
      await request(api+'/releases/'+release.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:JSON.stringify(meta),draft:false,prerelease:true})});
      console.log('Saved durable published backup:',revision,digest);
      return;
    } catch (error) {
      if (attempt===2 || (error.status && error.status<500 && ![408,409,422,429].includes(error.status))) throw error;
      await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
    }
  }
}
main().catch(error=>{console.error(String(error.message || '长期发布备份失败'));process.exitCode=1;});
