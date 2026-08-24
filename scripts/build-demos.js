const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const demosDir = path.join(process.cwd(), 'demos');
const siteDir = path.join(process.cwd(), '_site');

if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

// 生成导航首页
function generateIndex(demos) {
  const cards = demos.map(name => 
    '<a href="demos/' + name + '/" class="card"><div class="card-icon">📦</div><div class="card-name">' + name + '</div><div class="card-link">点击访问 →</div></a>'
  ).join('\n');
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Demo Hub</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}.header{text-align:center;padding:60px 20px 40px}.header h1{font-size:2.5rem;margin-bottom:10px;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:1.1rem}.grid{max-width:1200px;margin:0 auto;padding:0 20px 60px;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}.card{display:block;text-decoration:none;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 24px;transition:all 0.3s}.card:hover{transform:translateY(-4px);border-color:#818cf8;box-shadow:0 12px 32px rgba(129,140,248,0.15)}.card-icon{font-size:2.5rem;margin-bottom:12px}.card-name{font-size:1.3rem;font-weight:600;color:#f1f5f9;margin-bottom:8px}.card-link{font-size:0.9rem;color:#818cf8}</style></head><body><div class="header"><h1>Demo Hub</h1><p>所有项目 Demo 展示</p></div>' + (demos.length > 0 ? '<div class="grid">' + cards + '</div>' : '<div style="text-align:center;padding:80px 20px;color:#64748b">暂无 Demo</div>') + '</body></html>';
}

const demos = [];

if (fs.existsSync(demosDir)) {
  const entries = fs.readdirSync(demosDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const demoPath = path.join(demosDir, entry.name);
    const outputPath = path.join(siteDir, entry.name);
    
    console.log('Processing demo:', entry.name);
    
    const hasPackageJson = fs.existsSync(path.join(demoPath, 'package.json'));
    
    if (hasPackageJson) {
      // 框架项目: 安装依赖并构建
      console.log('  Building framework project...');
      execSync('npm ci', { cwd: demoPath, stdio: 'inherit' });
      execSync('npm run build', { cwd: demoPath, stdio: 'inherit' });
      
      // 查找构建输出目录
      const distDir = path.join(demoPath, 'dist');
      const buildDir = path.join(demoPath, 'build');
      const outDir = path.join(demoPath, 'out');
      
      let sourceDir = null;
      if (fs.existsSync(distDir)) sourceDir = distDir;
      else if (fs.existsSync(buildDir)) sourceDir = buildDir;
      else if (fs.existsSync(outDir)) sourceDir = outDir;
      
      if (sourceDir) {
        fs.cpSync(sourceDir, outputPath, { recursive: true });
        demos.push(entry.name);
        console.log('  Built and copied to _site/' + entry.name);
      } else {
        console.warn('  No build output found for ' + entry.name);
      }
    } else {
      // 静态项目: 直接复制
      console.log('  Copying static files...');
      fs.cpSync(demoPath, outputPath, { recursive: true });
      demos.push(entry.name);
      console.log('  Copied to _site/' + entry.name);
    }
  }
}

// 生成导航首页
fs.writeFileSync(path.join(siteDir, 'index.html'), generateIndex(demos));
console.log('Generated index.html with', demos.length, 'demos');
