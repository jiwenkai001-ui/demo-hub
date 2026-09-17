// 扫码组件:基于原生 BarcodeDetector API + getUserMedia 回退
// 不依赖任何第三方库,双击 html 也能用

let scanStream = null

/** 启动扫码,解码成功回调 onResult(code) */
async function startScan(onResult) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('当前浏览器不支持摄像头扫码', 'danger')
    return
  }

  // 创建扫码模态框
  const mask = document.createElement('div')
  mask.className = 'modal-mask show'
  mask.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header">
        <span class="modal-title">📷 扫描商品条码</span>
        <button class="modal-close" id="scanCloseBtn">×</button>
      </div>
      <div class="modal-body" style="text-align:center">
        <video id="scanVideo" autoplay playsinline style="width:100%;max-width:420px;background:#000;border-radius:6px"></video>
        <div id="scanTip" style="margin-top:8px;color:var(--text-3);font-size:12px">
          将条码对准摄像头中央
        </div>
      </div>
    </div>`
  document.body.appendChild(mask)

  const video = document.getElementById('scanVideo')
  const tip = document.getElementById('scanTip')

  function closeScan() {
    if (scanStream) {
      scanStream.getTracks().forEach(t => t.stop())
      scanStream = null
    }
    if (mask.parentNode) mask.remove()
  }

  document.getElementById('scanCloseBtn').addEventListener('click', closeScan)
  mask.addEventListener('click', e => {
    if (e.target === mask) closeScan()
  })

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    })
    video.srcObject = scanStream
    video.setAttribute('playsinline', 'true')
    await video.play()
    tip.textContent = '摄像头已启动,正在识别条码...'
  } catch (err) {
    tip.textContent = '摄像头授权失败,请检查浏览器权限设置'
    tip.style.color = 'var(--danger)'
    return
  }

  // 优先用原生 BarcodeDetector
  if ('BarcodeDetector' in window) {
    let detector
    try {
      detector = new BarcodeDetector({
        formats: ['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code']
      })
    } catch (e) { detector = null }

    if (detector) {
      tip.textContent = '正在识别条码(原生 API)...'
      let stopped = false

      async function detectLoop() {
        if (stopped || !scanStream) return
        try {
          const codes = await detector.detect(video)
          if (codes && codes.length > 0) {
            const code = codes[0].rawValue
            stopped = true
            toast(`扫码成功:${code}`, 'success')
            onResult && onResult(code)
            closeScan()
            return
          }
        } catch (e) { /* 忽略单帧错误 */ }
        requestAnimationFrame(detectLoop)
      }
      detectLoop()
      return
    }
  }

  // 回退方案:提示用户手动输入(纯前端无第三方库)
  tip.innerHTML = `
    <div style="margin-bottom:6px;color:var(--warning)">⚠️ 当前浏览器不支持自动扫码,请手动输入条码</div>
    <input id="manualCodeInput" class="input" placeholder="输入或粘贴条码" style="max-width:300px;margin:0 auto">
    <button class="btn btn-sm" style="margin-top:8px" id="manualCodeSubmit">确认</button>
  `
  const input = document.getElementById('manualCodeInput')
  const submit = document.getElementById('manualCodeSubmit')
  function submitManual() {
    const code = input.value.trim()
    if (!code) return
    toast(`条码已录入:${code}`, 'success')
    onResult && onResult(code)
    closeScan()
  }
  submit.addEventListener('click', submitManual)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submitManual() })
  input.focus()
}

window.startScan = startScan
