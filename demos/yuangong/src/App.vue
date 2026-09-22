<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: #1989fa;
  --primary-light: #4ba9ff;
  --success: #07c160;
  --warning: #ff976a;
  --danger: #ee0a24;
  --gray-1: #f7f8fa;
  --gray-2: #f2f3f5;
  --gray-3: #ebedf0;
  --gray-4: #dcdee0;
  --gray-5: #c8c9cc;
  --gray-6: #969799;
  --gray-7: #646566;
  --gray-8: #323233;
  --text: #323233;
  --text-secondary: #969799;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f7f8fa;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  font-size: 14px;
}
#app-root { min-height: 100vh; }
.page {
  min-height: 100vh;
  background: var(--gray-1);
  padding-bottom: 60px;
}
.page-no-tabbar { padding-bottom: 0; }
.card {
  background: #fff;
  border-radius: 12px;
  margin: 12px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 16px 0 8px;
  padding-left: 4px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  color: #fff;
}
.stat-card .stat-icon {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; margin-right: 12px;
}
.stat-card .stat-value { font-size: 24px; font-weight: 700; }
.stat-card .stat-label { font-size: 12px; opacity: .85; }
.text-danger { color: var(--danger); }
.text-warning { color: var(--warning); }
.text-success { color: var(--success); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--text-secondary); }
.text-bold { font-weight: 600; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.flex { display: flex; }
.flex-center { display: flex; align-items: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-col { display: flex; flex-direction: column; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.w-full { width: 100%; }
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 48px 0; color: var(--text-secondary);
}
.empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: .3; }
.badge-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: var(--danger); margin-right: 6px;
}
.list-item {
  display: flex; align-items: center; padding: 12px 16px;
  border-bottom: 1px solid var(--gray-3);
}
.list-item:last-child { border-bottom: none; }
.list-item .item-label { flex: 1; }
.list-item .item-value { font-weight: 500; }
</style>
