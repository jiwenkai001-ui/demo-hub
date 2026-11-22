const inspectProject = function inspectProject(files) {
    const normalized = files.map(file => ({ path: file.path.replace(/\\/g, '/').replace(/^\.\//, ''), content: file.content }));
    const packageFile = normalized.find(file => file.path === 'package.json');
    const html = normalized.filter(file => /\.html?$/i.test(file.path));
    let pkg = {};
    if (packageFile) {
        try {
            pkg = JSON.parse(packageFile.content);
        }
        catch {
            return { type: 'unknown', issue: 'package.json格式不正确，请修正JSON后重新上传' };
        }
        if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg))
            return { type: 'unknown', issue: 'package.json必须为有效的项目配置对象' };
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const framework = deps.vite ? 'vite' : deps.next ? 'next' : deps['@angular/core'] ? 'angular' : deps.vue ? 'vue' : deps.react ? 'react' : deps.svelte ? 'svelte' : undefined;
    const build = typeof pkg.scripts?.build === 'string' && pkg.scripts.build.trim();
    const source = html.some(file => /(?:src|href)\s*=\s*["'][^"']*\.(?:tsx?|jsx|vue|svelte)(?:[?#][^"']*)?["']/i.test(file.content)) || normalized.some(file => !/^(?:dist|build|out)\//.test(file.path) && /\.(?:tsx|jsx|vue|svelte)$/i.test(file.path));
    if (!build && !framework && !source && html.length)
        return { type: 'static' };
    if (build || framework || source || packageFile) {
        if (!build)
            return { type: 'framework', framework: framework || 'node', issue: '该项目需要编译，但package.json缺少build构建命令；请补齐构建配置，或上传可直接访问的静态成品' };
        if (!normalized.some(file => ['package-lock.json', 'npm-shrinkwrap.json'].includes(file.path)))
            return { type: 'framework', framework: framework || 'node', issue: '该项目需要安装依赖，但缺少package-lock.json或npm-shrinkwrap.json；请在项目中生成锁文件后重新打包' };
        return { type: 'framework', framework: framework || 'node' };
    }
    return { type: html.length ? 'static' : 'unknown' };
};
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync, execFileSync } = require('node:child_process');
const cwd = process.cwd();
const demosDir = path.join(cwd, 'demos');
const siteDir = path.join(cwd, '_site');
const tempRoot = path.join(cwd, '.codex-tmp');
fs.mkdirSync(siteDir, { recursive: true });
fs.mkdirSync(tempRoot, { recursive: true });
const temp = fs.mkdtempSync(path.join(tempRoot, 'pages-'));
const digest = text => crypto.createHash('sha256').update(text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim()).digest('hex');

// 所有替换均移动保留旧文件，不执行递归删除；限定在当前发布工作区内。
function moveAside(target) {
  if (!fs.existsSync(target)) return;
  const relative = path.relative(cwd, path.resolve(target));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('归档路径越出发布目录');
  const archive = path.join(cwd, 'delete', crypto.randomUUID());
  fs.mkdirSync(archive, { recursive: true });
  fs.renameSync(target, path.join(archive, path.basename(target)));
}

function projectFiles(root, dir = root) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.codex-tmp', 'delete'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) files.push(...projectFiles(root, full));
    else if (entry.isFile()) files.push({path:path.relative(root,full).replace(/\\/g,'/'),content:entry.name === 'package.json' || /\.html?$/i.test(entry.name) ? fs.readFileSync(full,'utf8') : ''});
  }
  return files;
}

function copyProject(source, target) {
  fs.mkdirSync(target,{recursive:true});
  for (const entry of fs.readdirSync(source,{withFileTypes:true})) {
    if (['node_modules','.git','.codex-tmp','delete'].includes(entry.name) || entry.isSymbolicLink()) continue;
    const from=path.join(source,entry.name),to=path.join(target,entry.name);
    if (entry.isDirectory()) copyProject(from,to);
    else if (entry.isFile()) fs.copyFileSync(from,to);
  }
}

// 从最近成功的正式发布恢复产物，确保某个更新构建失败时不会删掉它的旧页面。
async function restorePublished() {
  if (process.env.PAGES_PREVIOUS_SITE_DIR && process.env.GITHUB_ACTIONS !== 'true') {
    copyProject(process.env.PAGES_PREVIOUS_SITE_DIR,siteDir);
    return;
  }
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.PAGES_READ_TOKEN;
  if (!repository || !token) throw new Error('缺少读取上次成功发布产物的权限，已停止发布以保护现有页面');
  const api = 'https://api.github.com/repos/' + repository;
  const get = async (route, optional = false, accept = 'application/vnd.github+json') => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(api + route,{headers:{Authorization:'Bearer '+token,Accept:accept},signal:AbortSignal.timeout(30000)});
        if (optional && [404,410].includes(response.status)) return null;
        if (!response.ok) {
          if ((response.status === 429 || response.status >= 500) && attempt < 2) {await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));continue;}
          throw new Error('读取历史发布备份失败（HTTP '+response.status+'），已停止发布以保护现有页面');
        }
        return response;
      } catch (error) {
        if (attempt === 2 || /HTTP 4\d\d/.test(error.message)) throw error;
        await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
      }
    }
  };
  let liveReport;
  const parts = repository.split('/');
  try {
    const response = await fetch('https://'+parts[0]+'.github.io/'+parts[1]+'/deploy-results.json?backup-check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if (response.ok) {const data=await response.json();if(data.version===1 && /^[a-f0-9]{40}$/.test(data.revision) && data.demos)liveReport=data;}
  } catch {}

  // Release中的完整站点备份不会随Pages短期artifact过期；摘要和版本均通过才使用。
  const releases = await (await get('/releases?per_page=20')).json();
  for (const release of releases.filter(item=>!item.draft && item.tag_name.startsWith('pages-backup-'))) {
    let meta;
    try {meta=JSON.parse(release.body);} catch {continue;}
    if (meta.type!=='demo-hub-pages-backup' || meta.version!==1 || !/^[a-f0-9]{40}$/.test(meta.revision) || !/^[a-f0-9]{64}$/.test(meta.sha256)) continue;
    if (liveReport && meta.revision!==liveReport.revision) {
      const comparison=await (await get('/compare/'+liveReport.revision+'...'+meta.revision)).json();
      if (!['ahead','identical'].includes(comparison.status)) continue;
    }
    const asset=release.assets.find(item=>item.name==='site-'+meta.sha256+'.tar.gz');
    if (!asset) continue;
    const response=await get('/releases/assets/'+asset.id,true,'application/octet-stream');
    if (!response) continue;
    const bytes=Buffer.from(await response.arrayBuffer());
    if (crypto.createHash('sha256').update(bytes).digest('hex')!==meta.sha256) throw new Error('长期发布备份摘要不一致，已停止发布以保护现有页面');
    const archive=path.join(temp,'published-site.tar.gz');fs.writeFileSync(archive,bytes);
    execFileSync('tar',['-xzf',archive,'-C',siteDir]);
    const restored=JSON.parse(fs.readFileSync(path.join(siteDir,'deploy-results.json'),'utf8'));
    if (restored.revision!==meta.revision || !fs.existsSync(path.join(siteDir,'index.html'))) throw new Error('长期发布备份版本或首页异常，已停止发布以保护现有页面');
    console.log('Restored durable published backup:',meta.revision);
    return;
  }
  const runs = await (await get('/actions/workflows/deploy.yml/runs?status=success&branch=main&per_page=1')).json();
  const previous = runs.workflow_runs.find(run=>run.name === process.env.GITHUB_WORKFLOW && String(run.id) !== process.env.GITHUB_RUN_ID);
  if (previous && (!liveReport || liveReport.revision===previous.head_sha)) {
    const artifacts = await (await get('/actions/runs/'+previous.id+'/artifacts')).json();
    const artifact = artifacts.artifacts.find(item=>item.name === 'github-pages' && !item.expired);
    if (artifact) {
      const response=await get('/actions/artifacts/'+artifact.id+'/zip',true);
      if (response) {
        const zipPath=path.join(temp,'previous.zip');fs.writeFileSync(zipPath,Buffer.from(await response.arrayBuffer()));
        const extracted=path.join(temp,'previous-artifact');fs.mkdirSync(extracted,{recursive:true});
        execFileSync('unzip',['-q',zipPath,'-d',extracted]);
        const archive=path.join(extracted,'artifact.tar');
        if (!fs.existsSync(archive)) throw new Error('历史发布产物格式异常，已停止发布以保护现有页面');
        execFileSync('tar',['-xf',archive,'-C',siteDir]);
        if (!fs.existsSync(path.join(siteDir,'index.html'))) throw new Error('历史发布产物缺少首页，已停止发布以保护现有页面');
        console.log('Restored unexpired Pages artifact:',previous.head_sha);
        return;
      }
    }
  }
  if (!liveReport) {
    if (!previous) return;
    throw new Error('历史发布备份不可用，且无法确认线上版本，已停止发布以保护现有页面');
  }

  // 迁移空档只重建已发布版本的纯静态文件，逐项验证原报告摘要；不能用当前源码替代旧页面。
  const response=await get('/zipball/'+liveReport.revision);
  const zipPath=path.join(temp,'previous-source.zip');fs.writeFileSync(zipPath,Buffer.from(await response.arrayBuffer()));
  const source=path.join(temp,'previous-source');fs.mkdirSync(source,{recursive:true});execFileSync('unzip',['-q',zipPath,'-d',source]);
  const roots=fs.readdirSync(source,{withFileTypes:true}).filter(item=>item.isDirectory());
  if (roots.length!==1) throw new Error('历史源码归档结构异常，已停止发布以保护现有页面');
  const visible=[];
  for (const [name,item] of Object.entries(liveReport.demos)) {
    if (item.state==='failed') continue;
    if (!/^[a-zA-Z0-9_-]+$/.test(name) || item.state!=='published') throw new Error('历史版本含无法重建的保留页面，请恢复完整站点备份');
    const root=path.join(source,roots[0].name,'demos',name),files=projectFiles(root),plan=inspectProject(files);
    const index=files.find(file=>file.path==='index.html');
    if (plan.type!=='static' || plan.issue || !index || digest(index.content)!==item.indexHash || digest(index.content)!==item.sourceIndexHash) throw new Error('历史页面无法按原摘要安全恢复：'+name+'；已停止发布以保护现有页面');
    copyProject(root,path.join(siteDir,'demos',name));visible.push(name);
  }
  fs.writeFileSync(path.join(siteDir,'index.html'),generateIndex(visible));fs.writeFileSync(path.join(siteDir,'deploy-results.json'),JSON.stringify(liveReport));
  console.log('Recovered expired-artifact gap from verified static revision:',liveReport.revision,visible.length,'demos');
}

function generateIndex(demos) {
  const cards = demos.map(name => '<a href="demos/' + name + '/" class="card"><div class="card-icon">📦</div><div class="card-name">' + name + '</div><div class="card-link">点击访问 →</div></a>').join('\n');
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Demo Hub</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}.header{text-align:center;padding:60px 20px 40px}.header h1{font-size:2.5rem;margin-bottom:10px;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:1.1rem}.grid{max-width:1200px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}.card{display:block;text-decoration:none;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 24px;transition:all 0.3s}.card:hover{transform:translateY(-4px);border-color:#818cf8;box-shadow:0 12px 32px rgba(129,140,248,0.15)}.card-icon{font-size:2.5rem;margin-bottom:12px}.card-name{font-size:1.3rem;font-weight:600;color:#f1f5f9;margin-bottom:8px}.card-link{font-size:0.9rem;color:#818cf8}</style></head><body><div class="header"><h1>Demo Hub</h1><p>所有项目 Demo 展示</p></div>'+(demos.length?'<div class="grid">'+cards+'</div>':'<div style="text-align:center;padding:80px 20px;color:#64748b">暂无 Demo</div>')+'</body></html>';
}

async function main() {
  await restorePublished();
  const entries = fs.existsSync(demosDir) ? fs.readdirSync(demosDir,{withFileTypes:true}).filter(entry=>entry.isDirectory()) : [];
  const names = new Set(entries.map(entry=>entry.name));
  const previousDemos = path.join(siteDir,'demos');
  if (fs.existsSync(previousDemos)) for (const entry of fs.readdirSync(previousDemos,{withFileTypes:true})) if (entry.isDirectory() && !names.has(entry.name)) moveAside(path.join(previousDemos,entry.name));
  const report = {version:1,revision:process.env.GITHUB_SHA || '',generatedAt:new Date().toISOString(),demos:{}};
  const visible = [];
  for (const entry of entries) {
    const root = path.join(demosDir,entry.name);
    const output = path.join(siteDir,'demos',entry.name);
    const result = {state:'failed',sourceIndexHash:'',error:''};
    report.demos[entry.name] = result;
    console.log('Processing demo:',entry.name);
    try {
      const files = projectFiles(root);
      const sourceIndex = files.find(file=>file.path === 'index.html');
      result.sourceIndexHash = sourceIndex ? digest(sourceIndex.content) : '';
      const plan = inspectProject(files);
      if (plan.issue) throw new Error(plan.issue);
      const candidate = path.join(temp,'output-'+entry.name);
      if (plan.type === 'framework') {
        const work = path.join(temp,'work-'+entry.name);
        copyProject(root,work);
        for (const dir of ['dist','build','out']) moveAside(path.join(work,dir));
        const childEnv = {...process.env};
        for (const key of Object.keys(childEnv)) if (/TOKEN|PASSWORD|SECRET|PRIVATE_KEY/i.test(key)) delete childEnv[key];
        try { execSync('npm ci --no-audit --no-fund',{cwd:work,env:childEnv,stdio:'inherit',timeout:180000}); }
        catch { throw new Error('依赖安装失败，请检查锁文件和依赖版本（npm ci）'); }
        try { execSync('npm run build',{cwd:work,env:childEnv,stdio:'inherit',timeout:180000}); }
        catch { throw new Error('项目编译失败，请检查build命令及项目源码'); }
        const built = ['dist','build','out'].map(dir=>path.join(work,dir)).find(dir=>fs.existsSync(path.join(dir,'index.html')));
        if (!built) throw new Error('构建完成但dist/build/out中没有可发布的index.html');
        copyProject(built,candidate);
      } else copyProject(root,candidate);
      const indexPath = path.join(candidate,'index.html');
      if (!fs.existsSync(indexPath) || !fs.readFileSync(indexPath,'utf8').trim()) throw new Error('静态发布目录缺少有效的index.html首页');
      result.indexHash = digest(fs.readFileSync(indexPath,'utf8'));
      fs.mkdirSync(path.dirname(output),{recursive:true});
      moveAside(output);
      fs.renameSync(candidate,output);
      result.state = 'published';
      delete result.error;
      visible.push(entry.name);
    } catch (error) {
      result.error = String(error.message || '项目发布失败').slice(0,300);
      if (fs.existsSync(path.join(output,'index.html'))) {result.state='retained';visible.push(entry.name);}
      console.error('Demo failed:',entry.name,result.error);
    }
  }
  fs.writeFileSync(path.join(siteDir,'index.html'),generateIndex(visible));
  fs.writeFileSync(path.join(siteDir,'deploy-results.json'),JSON.stringify(report));
  console.log('Prepared',visible.length,'demos; individual failures are reported separately.');
}
main().catch(error=>{console.error(String(error.message || '发布准备失败'));process.exitCode=1;});
