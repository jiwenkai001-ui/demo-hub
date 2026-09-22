<template>
  <div class="field-sales-page">
    <!-- GPS 签到 -->
    <div class="checkin-card">
      <div class="loc-row">
        <van-icon name="location-o" size="22" color="#fff" />
        <div>
          <div class="loc-title">当前位置</div>
          <div class="loc-addr">{{ currentLocation }}</div>
        </div>
      </div>
      <div class="checkin-actions">
        <van-button v-if="!activeVisit" type="primary" icon="passed" block @click="onStartVisit">巡店签到</van-button>
        <van-button v-else type="danger" icon="checked" block @click="onEndVisit">结束拜访</van-button>
      </div>
    </div>

    <!-- 当前拜访 -->
    <van-cell-group inset title="当前拜访" v-if="activeVisit">
      <van-cell title="拜访客户" :value="activeVisit.customerName" />
      <van-cell title="签到时间" :value="activeVisit.checkInTime" />
      <van-cell title="已拍照" :value="`${activeVisit.photos || 0} 张`" />
      <van-cell title="订单金额" :value="formatMoney(activeVisit.orderAmount || 0)" />
      <van-grid :column-num="3" :border="false" class="visit-actions">
        <van-grid-item icon="photo-o" text="陈列拍照" @click="onUploadPhoto" />
        <van-grid-item icon="edit" text="现场开单" @click="goSalesOrder" />
        <van-grid-item icon="manager-o" text="客户信息" @click="onShowCustomer" />
      </van-grid>
    </van-cell-group>

    <!-- 今日汇总 -->
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-val">{{ todayVisitedCount }}</div>
        <div class="summary-label">今日拜访</div>
      </div>
      <div class="summary-item">
        <div class="summary-val">{{ formatMoney(todayOrderAmount) }}</div>
        <div class="summary-label">今日开单</div>
      </div>
      <div class="summary-item">
        <div class="summary-val">{{ todayPhotos }}</div>
        <div class="summary-label">今日拍照</div>
      </div>
    </div>

    <!-- 拜访记录 -->
    <van-cell-group inset title="拜访记录">
      <van-empty v-if="!visits.length" description="暂无拜访记录" :image-size="80" />
      <div v-else class="visit-list">
        <van-cell v-for="v in visits" :key="v.id">
          <template #title>
            <div class="visit-row">
              <span class="visit-cust">{{ v.customerName }}</span>
              <van-tag :type="v.status === 'visiting' ? 'warning' : 'success'" plain size="mini">
                {{ v.status === 'visiting' ? '拜访中' : '已完成' }}
              </van-tag>
            </div>
            <div class="visit-meta">签到: {{ v.checkInTime }}</div>
            <div class="visit-meta" v-if="v.checkOutTime">签退: {{ v.checkOutTime }}</div>
            <div class="visit-meta">地址: {{ v.address }}</div>
          </template>
          <template #value>
            <div class="visit-side">
              <div class="visit-photo">拍照 {{ v.photos || 0 }}</div>
              <div class="visit-amt">{{ formatMoney(v.orderAmount || 0) }}</div>
            </div>
          </template>
        </van-cell>
      </div>
    </van-cell-group>

    <div class="field-note">
      <van-icon name="info-o" />
      <span>业务员手机在外直接开单，巡店签到，陈列拍照上传</span>
    </div>

    <!-- 客户选择 -->
    <van-popup v-model:show="showCustomerPicker" position="bottom" round teleport="body">
      <van-picker
        :columns="customerColumns"
        title="选择拜访客户"
        @confirm="onCustomerConfirm"
        @cancel="showCustomerPicker = false"
      />
    </van-popup>

    <!-- 拍照上传 -->
    <van-popup v-model:show="showPhotoUploader" position="bottom" round teleport="body" :style="{ height: '50%' }">
      <div class="uploader-wrap">
        <div class="uploader-title">陈列拍照</div>
        <div class="uploader-sub">客户：{{ activeVisit?.customerName || '-' }}</div>
        <van-uploader v-model="photoFiles" multiple :max-count="9" />
        <van-button type="primary" block @click="onSavePhotos" style="margin-top: 16px;">
          保存（已选 {{ photoFiles.length }} 张）
        </van-button>
      </div>
    </van-popup>

    <!-- 客户详情 -->
    <van-popup v-model:show="showCustomerDetail" position="bottom" round teleport="body" :style="{ height: '60%' }">
      <div class="cust-detail" v-if="detailCustomer">
        <div class="cust-name">{{ detailCustomer.name }}</div>
        <van-cell-group inset>
          <van-cell title="客户编码" :value="detailCustomer.code" />
          <van-cell title="客户分级">
            <template #value>
              <van-tag :type="gradeTagType(detailCustomer.grade)" plain>{{ detailCustomer.gradeName }}</van-tag>
            </template>
          </van-cell>
          <van-cell title="联系电话" :value="detailCustomer.phone" />
          <van-cell title="客户地址" :value="detailCustomer.address" />
          <van-cell title="信用额度" :value="formatMoney(detailCustomer.creditLimit)" />
          <van-cell title="已用额度" :value="formatMoney(detailCustomer.usedCredit)" />
          <van-cell title="账期" :value="`${detailCustomer.accountPeriod} 天`" />
        </van-cell-group>
      </div>
      <van-empty v-else description="无客户信息" :image-size="80" />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import dayjs from 'dayjs'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { formatMoney } from '@/utils/index.js'

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()
authStore.restore()

// 当前位置（mock）
const currentLocation = ref('城区10家连锁店附近')

// 拜访记录
const visits = computed(() => dataStore.fieldVisits)
const activeVisit = computed(() => dataStore.fieldVisits.find(v => v.status === 'visiting'))

// 今日汇总
const todayStr = dayjs().format('YYYY-MM-DD')
const todayVisits = computed(() =>
  dataStore.fieldVisits.filter(v => v.checkInTime && String(v.checkInTime).startsWith(todayStr))
)
const todayVisitedCount = computed(() => todayVisits.value.length)
const todayOrderAmount = computed(() =>
  todayVisits.value.reduce((s, v) => s + (v.orderAmount || 0), 0)
)
const todayPhotos = computed(() =>
  todayVisits.value.reduce((s, v) => s + (v.photos || 0), 0)
)

// 巡店签到 -> 选客户
const showCustomerPicker = ref(false)
const customerColumns = computed(() =>
  dataStore.customers.map(c => ({ text: `${c.name} (${c.code})`, value: c.id }))
)
function onStartVisit() {
  if (activeVisit.value) {
    showToast('当前已有进行中的拜访')
    return
  }
  showCustomerPicker.value = true
}
function onCustomerConfirm({ selectedValues }) {
  const id = selectedValues[0]
  const c = dataStore.customers.find(c => c.id === id)
  if (!c) return
  showCustomerPicker.value = false
  dataStore.addFieldVisit({
    salesman: authStore.user?.name || authStore.user?.username || '外勤',
    customerId: c.id,
    customerName: c.name,
    checkInTime: dayjs().format('YYYY-MM-DD HH:mm'),
    checkOutTime: '',
    status: 'visiting',
    address: c.address,
    photos: 0,
    orderAmount: 0
  })
  currentLocation.value = c.address
  showSuccessToast('签到成功')
}
function onEndVisit() {
  if (!activeVisit.value) return
  activeVisit.value.checkOutTime = dayjs().format('YYYY-MM-DD HH:mm')
  activeVisit.value.status = 'completed'
  showSuccessToast('已结束拜访')
}

// 拍照
const showPhotoUploader = ref(false)
const photoFiles = ref([])
function onUploadPhoto() {
  if (!activeVisit.value) {
    showToast('请先巡店签到')
    return
  }
  photoFiles.value = []
  showPhotoUploader.value = true
}
function onSavePhotos() {
  if (activeVisit.value) {
    activeVisit.value.photos = (activeVisit.value.photos || 0) + photoFiles.value.length
  }
  showPhotoUploader.value = false
  showSuccessToast(`已上传 ${photoFiles.value.length} 张照片`)
}

// 现场开单
function goSalesOrder() {
  if (!activeVisit.value) {
    showToast('请先巡店签到')
    return
  }
  router.push('/sales')
}

// 客户信息
const showCustomerDetail = ref(false)
const detailCustomer = ref(null)
function onShowCustomer() {
  if (!activeVisit.value) return
  detailCustomer.value = dataStore.customers.find(c => c.id === activeVisit.value.customerId) || null
  showCustomerDetail.value = true
}

// 工具
function gradeTagType(g) {
  return g === 1 ? 'danger' : g === 2 ? 'warning' : 'primary'
}
</script>

<style scoped>
.field-sales-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 12px 0 24px;
}

/* 签到卡片 */
.checkin-card {
  margin: 0 12px 12px;
  padding: 16px;
  background: linear-gradient(135deg, #1989fa, #4ba9ff);
  border-radius: 12px;
  color: #fff;
}
.loc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.loc-title { font-size: 12px; opacity: 0.9; }
.loc-addr { font-size: 15px; font-weight: 600; }
.checkin-actions { /* 按钮占满 */ }

/* 当前拜访 */
.visit-actions {
  margin-top: 8px;
}

/* 今日汇总 */
.summary-card {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin: 0 12px 12px;
}
.summary-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.summary-val {
  font-size: 16px;
  font-weight: 700;
  color: #1989fa;
  line-height: 1.2;
}
.summary-label {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

/* 拜访记录 */
.visit-list { padding: 4px 0; }
.visit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.visit-cust { font-size: 14px; font-weight: 600; color: #323233; }
.visit-meta { font-size: 12px; color: #969799; line-height: 1.6; }
.visit-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.visit-photo { font-size: 12px; color: #969799; }
.visit-amt { font-size: 14px; font-weight: 600; color: #ee0a24; }

/* 提示 */
.field-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
  font-size: 12px;
  color: #969799;
}

/* 拍照上传 */
.uploader-wrap {
  padding: 16px;
}
.uploader-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}
.uploader-sub {
  font-size: 12px;
  color: #969799;
  text-align: center;
  margin: 4px 0 16px;
}

/* 客户详情 */
.cust-detail {
  padding: 16px 0;
}
.cust-name {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 12px;
}
</style>
