<template>
  <div class="import-page">
    <!-- 操作指引 -->
    <div class="step-card">
      <div class="step-title">批量导入商品</div>
      <div class="step-list">
        <div class="step-item">
          <div class="step-num">1</div>
          <div class="step-body">
            <div class="step-name">下载导入模板</div>
            <div class="step-desc">获取标准 Excel 模板</div>
          </div>
          <van-button size="mini" type="primary" plain @click="onDownload">下载模板</van-button>
        </div>
        <div class="step-item">
          <div class="step-num">2</div>
          <div class="step-body">
            <div class="step-name">填写商品数据</div>
            <div class="step-desc">按模板格式录入</div>
          </div>
        </div>
        <div class="step-item">
          <div class="step-num">3</div>
          <div class="step-body">
            <div class="step-name">上传文件</div>
            <div class="step-desc">系统自动解析预览</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传区 -->
    <div class="upload-card">
      <div class="upload-title">上传文件</div>
      <van-uploader
        v-model="fileList"
        :max-count="1"
        accept=".xlsx,.xls,.csv"
        :after-read="onAfterRead"
        @delete="onClear"
      >
        <div class="upload-trigger">
          <van-icon name="down" size="28" color="#1989fa" />
          <div class="upload-text">点击上传 Excel 文件</div>
          <div class="upload-hint">支持 .xlsx / .xls / .csv</div>
        </div>
      </van-uploader>
    </div>

    <!-- 字段说明 -->
    <div class="field-note">
      <div class="note-title"><van-icon name="info-o" /> 支持导入字段</div>
      <div class="note-tags">
        <van-tag v-for="f in fields" :key="f" plain type="primary" size="medium" class="note-tag">{{ f }}</van-tag>
      </div>
    </div>

    <!-- 预览解析结果 -->
    <div class="preview-card" v-if="previewList.length">
      <div class="preview-title">
        <span>解析预览（共 {{ previewList.length }} 条）</span>
        <van-tag type="primary" size="mini">待导入</van-tag>
      </div>
      <div class="preview-list">
        <div class="preview-item" v-for="(p, i) in previewList" :key="i">
          <div class="pi-head">
            <span class="pi-name">{{ p.name }}</span>
            <van-tag plain type="primary" size="mini">{{ p.categoryName }}</van-tag>
          </div>
          <div class="pi-row">
            <span>编码：{{ p.code }}</span>
            <span>规格：{{ p.spec }}</span>
          </div>
          <div class="pi-row">
            <span>进价：{{ formatMoney(p.costPrice) }}</span>
            <span>售价：{{ formatMoney(p.retailPrice) }}</span>
          </div>
          <div class="pi-row">
            <span>保质期：{{ p.shelfLifeDays }} 天</span>
            <span>单位：{{ p.mainUnit }}</span>
          </div>
        </div>
      </div>
      <div class="confirm-wrap">
        <van-button block type="primary" round @click="onConfirmImport">确认导入</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney } from '@/utils/index'

const router = useRouter()
const dataStore = useDataStore()

const fileList = ref([])
const previewList = ref([])

const fields = [
  '商品名称', '商品编码', '条码', '规格', '分类', '主单位',
  '保质期(天)', '进货价', '零售价', '最低库存', '最高库存'
]

function onDownload() {
  showToast('模板已下载')
}

function onClear() {
  previewList.value = []
}

// 解析（mock）：模拟读取到若干商品
function onAfterRead(file) {
  showToast('文件解析中...')
  // 模拟解析延时
  setTimeout(() => {
    previewList.value = [
      { name: '康师傅香辣牛肉面', code: 'SP-101', barcode: '6901234570001', spec: '108g/袋', categoryId: 1, categoryName: '方便面', mainUnit: '袋', unitGroupId: 2, shelfLifeDays: 180, costPrice: 1.9, retailPrice: 2.6, minStock: 50, maxStock: 500, status: 1 },
      { name: '雪碧汽水', code: 'SP-102', barcode: '6901234570002', spec: '330ml/罐', categoryId: 2, categoryName: '碳酸饮料', mainUnit: '罐', unitGroupId: 3, shelfLifeDays: 270, costPrice: 1.7, retailPrice: 2.3, minStock: 100, maxStock: 1000, status: 1 },
      { name: '康师傅冰红茶', code: 'SP-103', barcode: '6901234570003', spec: '500ml/瓶', categoryId: 7, categoryName: '功能饮料', mainUnit: '瓶', unitGroupId: 1, shelfLifeDays: 365, costPrice: 2.1, retailPrice: 3.0, minStock: 80, maxStock: 800, status: 1 },
    ]
    showSuccessToast(`解析成功，共 ${previewList.value.length} 条`)
  }, 600)
}

function onConfirmImport() {
  previewList.value.forEach(p => {
    dataStore.addProduct({ ...p, image: '', supplierIds: [], purchasePrices: [] })
  })
  const n = previewList.value.length
  previewList.value = []
  fileList.value = []
  showSuccessToast(`成功导入 ${n} 个商品`)
  setTimeout(() => router.replace('/product'), 600)
}
</script>

<style scoped>
.import-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px 12px 24px;
}

/* 步骤卡 */
.step-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.step-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #323233;
}
.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1989fa;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-body {
  flex: 1;
}
.step-name {
  font-size: 13px;
  font-weight: 600;
  color: #323233;
}
.step-desc {
  font-size: 12px;
  color: #969799;
}

/* 上传卡 */
.upload-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}
.upload-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}
.upload-trigger {
  width: 100%;
  padding: 24px 0;
  background: #f7f8fa;
  border-radius: 10px;
  border: 1px dashed #dcdee0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.upload-text {
  font-size: 14px;
  color: #323233;
  margin-top: 6px;
}
.upload-hint {
  font-size: 12px;
  color: #969799;
}

/* 字段说明 */
.field-note {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}
.note-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 预览 */
.preview-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}
.preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 10px;
}
.preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.preview-item {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 10px 12px;
}
.pi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.pi-name {
  font-size: 14px;
  font-weight: 600;
}
.pi-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: 2px;
}
.confirm-wrap {
  padding: 16px 0 0;
}
</style>
