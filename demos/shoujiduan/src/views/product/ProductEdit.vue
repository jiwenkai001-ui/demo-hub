<template>
  <div class="product-edit-page">
    <van-form @submit="onSave">
      <!-- 基础信息 -->
      <van-cell-group inset title="基础信息">
        <van-field
          v-model="form.name"
          label="商品名称"
          placeholder="请输入商品名称"
          required
          clearable
          :rules="[{ required: true, message: '请输入商品名称' }]"
        />
        <van-field
          v-model="form.code"
          label="商品编码"
          placeholder="留空则自动生成 SP-xxx"
          clearable
        />
        <van-field
          v-model="form.barcode"
          label="商品条码"
          placeholder="扫码或手动输入"
          clearable
        >
          <template #button>
            <van-button size="small" type="primary" icon="scan" @click="showScan = true">扫码</van-button>
          </template>
        </van-field>
        <van-field
          v-model="form.spec"
          label="规格"
          placeholder="如 105g/袋"
          clearable
        />
        <van-field
          v-model="categoryText"
          label="商品分类"
          placeholder="请选择分类"
          readonly
          is-link
          input-align="right"
          @click="showCategoryPicker = true"
          required
          :rules="[{ required: true, message: '请选择分类' }]"
        />
      </van-cell-group>

      <!-- 计量与价格 -->
      <van-cell-group inset title="计量与价格">
        <van-field
          v-model="unitGroupText"
          label="计量单位组"
          placeholder="请选择单位组"
          readonly
          is-link
          input-align="right"
          @click="showUnitGroupPicker = true"
        />
        <van-field
          v-model="form.mainUnit"
          label="主计量单位"
          placeholder="如 袋 / 箱 / 瓶"
          clearable
        />
        <van-field label="保质期(天)" :model-value="String(form.shelfLifeDays)" readonly input-align="right">
          <template #right-icon>
            <van-stepper v-model="form.shelfLifeDays" :min="1" :step="1" integer />
          </template>
        </van-field>
        <van-field label="进货价" :model-value="form.costPrice.toFixed(2)" readonly input-align="right">
          <template #right-icon>
            <van-stepper v-model="form.costPrice" :min="0" :step="0.01" :decimal-length="2" />
          </template>
        </van-field>
        <van-field label="零售价" :model-value="form.retailPrice.toFixed(2)" readonly input-align="right">
          <template #right-icon>
            <van-stepper v-model="form.retailPrice" :min="0" :step="0.01" :decimal-length="2" />
          </template>
        </van-field>
        <van-field label="最低库存" :model-value="String(form.minStock)" readonly input-align="right">
          <template #right-icon>
            <van-stepper v-model="form.minStock" :min="0" :step="1" integer />
          </template>
        </van-field>
        <van-field label="最高库存" :model-value="String(form.maxStock)" readonly input-align="right">
          <template #right-icon>
            <van-stepper v-model="form.maxStock" :min="0" :step="1" integer />
          </template>
        </van-field>
      </van-cell-group>

      <!-- 状态 -->
      <van-cell-group inset title="销售状态">
        <van-field label="商品状态">
          <template #input>
            <van-radio-group v-model="form.status" direction="horizontal">
              <van-radio :name="1">正常</van-radio>
              <van-radio :name="2">停采</van-radio>
              <van-radio :name="3">停售</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <!-- 多计量单位换算 -->
      <van-cell-group inset title="多计量单位" v-if="currentUnitGroup">
        <van-cell title="单位组" :value="currentUnitGroup.name" />
        <van-cell title="换算关系">
          <template #label>
            <div v-for="u in currentUnitGroup.units" :key="u.unit" class="unit-line">
              1 {{ u.unit }} =
              <span class="unit-ratio">{{ u.ratio }}</span> {{ currentUnitGroup.baseUnit }}
              <van-tag v-if="u.isBase" type="success" size="mini" plain>基础单位</van-tag>
            </div>
          </template>
        </van-cell>

        <!-- 实时换算演示 -->
        <van-cell title="换算演示">
          <template #label>
            <div class="convert-demo">
              <div class="convert-row">
                <span class="convert-label">输入大单位数量</span>
                <van-stepper v-model="demoBigQty" :min="0" :step="1" integer />
              </div>
              <div class="convert-result">
                <van-icon name="exchange" />
                <span>{{ demoBigQty }} {{ bigUnit?.unit }} = 
                  <b class="convert-num">{{ demoSmallQty }}</b> {{ smallUnit?.unit }}
                </span>
              </div>
              <div class="convert-hint" v-if="bigUnit">
                说明：1 {{ bigUnit.unit }} = {{ bigUnit.ratio }} {{ smallUnit?.unit }}
              </div>
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 进价跟踪（仅编辑模式） -->
      <van-cell-group inset title="进价跟踪" v-if="isEdit && form.purchasePrices?.length">
        <van-cell v-for="(pp, i) in form.purchasePrices" :key="i" :title="pp.date">
          <template #value>
            <span class="price-track">{{ formatMoney(pp.price) }}</span>
          </template>
          <template #label>
            供应商：{{ getSupplierName(pp.supplierId) }}
          </template>
        </van-cell>
      </van-cell-group>
      <van-cell-group inset title="进价跟踪" v-else-if="isEdit">
        <van-empty description="暂无进价记录" :image-size="60" />
      </van-cell-group>

      <!-- 保存按钮 -->
      <div class="save-wrap">
        <van-button block type="primary" native-type="submit" round>
          {{ isEdit ? '保存修改' : '保存建档' }}
        </van-button>
      </div>
    </van-form>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>

    <!-- 单位组选择器 -->
    <van-popup v-model:show="showUnitGroupPicker" position="bottom" round>
      <van-picker
        :columns="unitGroupColumns"
        @confirm="onUnitGroupConfirm"
        @cancel="showUnitGroupPicker = false"
      />
    </van-popup>

    <!-- 扫码弹窗 -->
    <ScanDialog v-model="showScan" @scanned="onScanned" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useDataStore } from '@/stores/data'
import { formatMoney } from '@/utils/index'
import ScanDialog from '@/components/ScanDialog.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const editId = route.params.id ? Number(route.params.id) : null
const isEdit = computed(() => !!editId)

const showScan = ref(false)
const showCategoryPicker = ref(false)
const showUnitGroupPicker = ref(false)
const demoBigQty = ref(1)

// 表单数据
const form = reactive({
  name: '',
  code: '',
  barcode: '',
  spec: '',
  categoryId: null,
  categoryName: '',
  mainUnit: '',
  unitGroupId: null,
  shelfLifeDays: 180,
  costPrice: 0,
  retailPrice: 0,
  minStock: 0,
  maxStock: 0,
  status: 1,
  image: '',
  supplierIds: [],
  purchasePrices: []
})

// 加载数据
onMounted(() => {
  if (isEdit.value) {
    const p = dataStore.products.find(x => x.id === editId)
    if (p) {
      Object.assign(form, JSON.parse(JSON.stringify(p)))
    } else {
      showToast('商品不存在')
      router.replace('/product')
    }
  } else {
    // 扫码建档带入条码
    if (route.query.barcode) {
      form.barcode = String(route.query.barcode)
    }
  }
})

// 分类显示文本
const categoryText = computed(() => form.categoryName || '')
const unitGroupText = computed(() => {
  const g = dataStore.unitGroups.find(x => x.id === form.unitGroupId)
  return g ? g.name : ''
})

// 分类/单位组选项
const categoryColumns = computed(() =>
  dataStore.categories.map(c => ({ text: c.name, value: c.id }))
)
const unitGroupColumns = computed(() =>
  dataStore.unitGroups.map(g => ({ text: g.name, value: g.id }))
)

function onCategoryConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    form.categoryId = opt.value
    form.categoryName = opt.text
  }
  showCategoryPicker.value = false
}

function onUnitGroupConfirm({ selectedOptions }) {
  const opt = selectedOptions[0]
  if (opt) {
    form.unitGroupId = opt.value
    // 默认设置主单位为基础单位（若为空）
    const g = dataStore.unitGroups.find(x => x.id === opt.value)
    if (g && !form.mainUnit) {
      form.mainUnit = g.baseUnit
    }
  }
  showUnitGroupPicker.value = false
}

// 当前单位组及大小单位
const currentUnitGroup = computed(() =>
  dataStore.unitGroups.find(g => g.id === form.unitGroupId)
)
const bigUnit = computed(() => {
  const g = currentUnitGroup.value
  if (!g) return null
  const nonBase = g.units.filter(u => !u.isBase).sort((a, b) => b.ratio - a.ratio)
  return nonBase[0] || g.units.find(u => u.isBase)
})
const smallUnit = computed(() => {
  const g = currentUnitGroup.value
  if (!g) return null
  return g.units.find(u => u.isBase)
})
const demoSmallQty = computed(() =>
  bigUnit.value && smallUnit.value ? demoBigQty.value * bigUnit.value.ratio : 0
)

function getSupplierName(id) {
  const s = dataStore.suppliers.find(x => x.id === id)
  return s ? s.name : '-'
}

// 扫码回填条码
function onScanned(code) {
  showScan.value = false
  form.barcode = code
}

// 保存
function onSave() {
  if (!form.categoryName) form.categoryName = dataStore.categories.find(c => c.id === form.categoryId)?.name || ''
  if (form.minStock > form.maxStock && form.maxStock > 0) {
    showToast('最低库存不能大于最高库存')
    return
  }
  const payload = JSON.parse(JSON.stringify(form))
  if (isEdit.value) {
    dataStore.updateProduct(editId, payload)
    showSuccessToast('保存成功')
  } else {
    dataStore.addProduct(payload)
    showSuccessToast('建档成功')
  }
  router.replace('/product')
}
</script>

<style scoped>
.product-edit-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}
.product-edit-page :deep(.van-cell-group--inset) {
  margin: 12px;
}
.product-edit-page :deep(.van-cell-group__title) {
  font-size: 13px;
  color: #969799;
  padding-left: 20px;
  margin-top: 16px;
}

/* 多计量单位换算 */
.unit-line {
  font-size: 13px;
  color: #323233;
  line-height: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.unit-ratio {
  color: #1989fa;
  font-weight: 600;
}
.convert-demo {
  padding-top: 4px;
}
.convert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.convert-label {
  font-size: 13px;
  color: #969799;
}
.convert-result {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #323233;
}
.convert-num {
  color: #07c160;
  font-size: 18px;
  margin: 0 2px;
}
.convert-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #969799;
}

/* 进价跟踪 */
.price-track {
  color: #ee0a24;
  font-weight: 600;
}

.save-wrap {
  padding: 20px 16px;
}
</style>
