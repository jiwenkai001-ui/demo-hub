// 通用 UI 工具:Toast / Modal / 工具函数

/** Toast 消息提示(2 秒后自动消失) */
function toast(message, type = 'info', duration = 2000) {
  let wrap = document.querySelector('.toast-wrap')
  if (!wrap) {
    wrap = document.createElement('div')
    wrap.className = 'toast-wrap'
    document.body.appendChild(wrap)
  }
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = message
  wrap.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transition = 'opacity .3s'
    setTimeout(() => el.remove(), 300)
  }, duration)
}

/** 弹出确认模态框,返回 Promise<boolean> */
function confirmDialog(message, title = '提示') {
  return new Promise(resolve => {
    const mask = document.createElement('div')
    mask.className = 'modal-mask show'
    mask.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" data-act="cancel">×</button>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          <button class="btn btn-default btn-sm" data-act="cancel">取消</button>
          <button class="btn btn-primary btn-sm" data-act="ok">确定</button>
        </div>
      </div>`
    document.body.appendChild(mask)
    function close(val) { mask.remove(); resolve(val) }
    mask.addEventListener('click', e => {
      const act = e.target.dataset.act
      if (act === 'ok') close(true)
      else if (act === 'cancel' || e.target === mask) close(false)
    })
  })
}

/** 弹出自定义模态框,返回 mask 元素,供外部填充内容并控制关闭 */
function openModal(title, bodyHTML, footerHTML = '') {
  const mask = document.createElement('div')
  mask.className = 'modal-mask show'
  mask.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" data-act="close">×</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>`
  document.body.appendChild(mask)
  mask.addEventListener('click', e => {
    if (e.target.dataset.act === 'close' || e.target === mask) {
      mask.remove()
    }
  })
  return mask
}

function closeModal(mask) {
  if (mask && mask.remove) mask.remove()
}

// 日期格式化
function formatDate(d, withTime = false) {
  const dt = (d instanceof Date) ? d : new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth()+1).padStart(2,'0')
  const day = String(dt.getDate()).padStart(2,'0')
  if (!withTime) return `${y}-${m}-${day}`
  return `${y}-${m}-${day} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

// 金额格式化
function money(n, withSymbol = true) {
  const v = Number(n || 0).toFixed(2)
  return withSymbol ? `¥${v}` : v
}

// 转义 HTML
function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
}

// 生成分页页码
function pageNumbers(current, total) {
  if (total <= 7) return Array.from({length: total}, (_,i) => i+1)
  if (current <= 4) return [1,2,3,4,5,'...',total]
  if (current >= total - 3) return [1,'...',total-4,total-3,total-2,total-1,total]
  return [1,'...',current-1,current,current+1,'...',total]
}

window.UI = { toast, confirmDialog, openModal, closeModal, formatDate, money, escapeHtml, pageNumbers }
