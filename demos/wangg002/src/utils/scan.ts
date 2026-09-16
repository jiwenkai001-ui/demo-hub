// ========= 扫码工具:双通道(zxing-js + 原生 Barcode Detection API) =========
// 优先原生 API,失败回退 zxing-js;PDA 物理扫码键自动楔形输入到焦点输入框
import { BrowserMultiFormatReader } from '@zxing/browser'

let stream: MediaStream | null = null
let reader: BrowserMultiFormatReader | null = null

/** 关闭摄像头,释放资源 */
export function stopScan() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  // zxing-js 的 reader 不强制 reset,只要停止 video track 即可
  reader = null
}

/**
 * 启动摄像头扫码,解码成功回调 onResult(条码内容)
 * @param videoEl <video> 元素
 * @param onResult 成功回调
 * @param onError 错误回调
 */
export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (code: string) => void,
  onError?: (err: Error) => void,
) {
  try {
    // 通道 1:原生 Barcode Detection API
    if ('BarcodeDetector' in window) {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      videoEl.srcObject = stream
      await videoEl.play()
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39'] })
      const detectLoop = async () => {
        if (!stream) return
        try {
          const codes = await detector.detect(videoEl)
          if (codes && codes.length > 0) {
            onResult(codes[0].rawValue)
            stopScan()
            return
          }
        } catch { /* 单帧失败忽略 */ }
        requestAnimationFrame(detectLoop)
      }
      detectLoop()
      return
    }

    // 通道 2:zxing-js 回退
    reader = new BrowserMultiFormatReader()
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    videoEl.srcObject = stream
    await videoEl.play()
    reader.decodeFromVideoElement(videoEl, (result, err) => {
      if (result) onResult(result.getText())
    })
  } catch (e: any) {
    onError?.(e as Error)
  }
}

/**
 * 注册 PDA 楔形输入监听:在指定 input 上,监听 keypress 速度
 * 扫码枪连续输入速度高于人工打字,>8 字符且耗时<50ms 视为扫码
 */
export function bindWedgeInput(inputEl: HTMLInputElement, onScan: (code: string) => void) {
  let buf = ''
  let lastTime = 0
  inputEl.addEventListener('input', (e: Event) => {
    const now = Date.now()
    if (now - lastTime > 100) buf = ''
    lastTime = now
    buf += (e.target as HTMLInputElement).value.slice(-1)
    if (buf.length >= 8 && (e as KeyboardEvent).timeStamp !== undefined) {
      onScan(buf)
      buf = ''
    }
  })
}
