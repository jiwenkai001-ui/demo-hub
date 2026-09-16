/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展 window 类型,声明原生 Barcode Detection API
interface Window {
  BarcodeDetector?: any
}
