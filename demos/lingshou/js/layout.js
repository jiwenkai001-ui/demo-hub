// 主布局:渲染侧栏 + 顶部栏 + 移动端 Tabbar
// 调用 renderLayout({ active: 'dashboard' }) 注入到 <body>

const MENU_ITEMS = [
  { key: 'dashboard', title: '老板看板', icon: '📊', href: 'dashboard.html' },
  { key: 'products',  title: '商品档案', icon: '📦', href: 'products.html' },
  { key: 'sales',     title: '销售开单', icon: '🛒', href: 'sales.html' },
  { key: 'stock',     title: '库存查询', icon: '🏬', href: 'stock.html' },
  { key: 'receivable',title: '往来对账', icon: '💰', href: 'receivable.html' },
]

function renderLayout({ active, title }) {
  const user = window.Auth.getCurrentUser()
  if (!user) return
  const pageTitle = title || MENU_ITEMS.find(m => m.key === active)?.title || ''
  const msgDot = (window.DB?.messages || []).filter(m => !m.read).length

  // 侧栏菜单
  const menuHTML = MENU_ITEMS.map(m => `
    <li class="${m.key === active ? 'active' : ''}" onclick="location.href='${m.href}'">
      <span class="icon">${m.icon}</span><span>${m.title}</span>
    </li>`).join('')

  // 移动端 Tabbar
  const tabbarHTML = MENU_ITEMS.map(m => `
    <a href="${m.href}" class="${m.key === active ? 'active' : ''}">
      <span class="icon">${m.icon}</span><span>${m.title}</span>
    </a>`).join('')

  // 顶部消息下拉(简单实现)
  const msgListHTML = (window.DB?.messages || []).slice(0, 5).map(m => `
    <li style="padding:8px 12px;border-bottom:1px solid var(--border);cursor:pointer;${m.read ? '' : 'font-weight:600;'}">
      ${window.UI.escapeHtml(m.title)}
    </li>`).join('')

  // 注入到 body 最前面
  const layoutWrap = document.createElement('div')
  layoutWrap.className = 'app'
  layoutWrap.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">预包装食品批发<br>管理系统 DEMO</div>
      <ul class="sidebar-menu">${menuHTML}</ul>
    </aside>
    <div class="main-area">
      <header class="header-bar">
        <div class="page-title">${pageTitle}</div>
        <div class="right">
          <div class="bell" id="bellBtn">🔔
            ${msgDot > 0 ? `<span class="dot">${msgDot}</span>` : ''}
            <div id="msgPanel" style="display:none;position:absolute;top:30px;right:0;width:320px;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:200">
              <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
                <b>站内消息</b>
                <a href="#" id="markAllRead" style="font-size:12px">全部已读</a>
              </div>
              <ul style="max-height:300px;overflow:auto">${msgListHTML}</ul>
            </div>
          </div>
          <div class="user-chip">
            <span>👤</span><span>${user.name}</span>
            <a href="#" onclick="window.Auth.logout();return false" style="font-size:12px;margin-left:6px">退出</a>
          </div>
        </div>
      </header>
      <main class="page-content" id="pageContent"></main>
    </div>
    <nav class="tabbar">${tabbarHTML}</nav>`
  document.body.insertBefore(layoutWrap, document.body.firstChild)

  // 消息铃铛切换
  const bell = document.getElementById('bellBtn')
  const panel = document.getElementById('msgPanel')
  bell.addEventListener('click', e => {
    if (e.target.id === 'markAllRead' || e.target.textContent === '全部已读') return
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
    e.stopPropagation()
  })
  document.addEventListener('click', () => panel.style.display = 'none')
  document.getElementById('markAllRead').addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    ;(window.DB?.messages || []).forEach(m => m.read = true)
    document.querySelector('.bell .dot')?.remove()
    toast('已全部标记为已读', 'success')
    panel.style.display = 'none'
  })
}

window.renderLayout = renderLayout
