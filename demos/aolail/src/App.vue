<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Bell,
  Box,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Store,
  Tag,
  Ticket,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-vue-next";
import {
  defaultState,
  members as seedMembers,
  merchants as seedMerchants,
  products as seedProducts,
  salesTrend,
  type Member,
  type Merchant,
  type Product,
} from "./mock";

type Section =
  "dashboard" | "inventory" | "merchants" | "members" | "operations";
type OperationModule =
  "overview" | "leasing" | "cashier" | "property" | "parking";
type MemberSegment = "all" | "dormant" | "highValue";
type MobileInfoKind =
  | "points"
  | "benefits"
  | "receipts"
  | "activity"
  | "recommendation"
  | "merchantSales"
  | "merchantActivity"
  | "merchantRepair"
  | "bill"
  | "invoice"
  | "profile"
  | "security"
  | "contact"
  | "support"
  | "parking";
type MobileRole = "merchant" | "member";
type MobileTab = "home" | "benefit" | "message" | "mine";

interface MobileMessage {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface LeasingLead {
  id: string;
  brand: string;
  category: string;
  floor: string;
  area: number;
  stage: "初步接洽" | "方案沟通" | "合同审批";
  owner: string;
  updated: string;
}

interface CashierTransaction {
  id: string;
  time: string;
  merchant: string;
  channel: "微信支付" | "支付宝" | "银联";
  amount: number;
  status: "已完成" | "退款待审" | "已退款";
}

interface PropertyTicket {
  id: string;
  title: string;
  location: string;
  requester: string;
  status: "待派单" | "处理中" | "待验收" | "已完成";
  owner: string;
  created: string;
}

interface ParkingSession {
  id: string;
  plate: string;
  type: "会员" | "访客";
  entry: string;
  duration: string;
  fee: number;
  status: "正常" | "待处理" | "已处理";
}

const activeSection = ref<Section>("dashboard");
const mobileOpen = ref(false);
const mobileRole = ref<MobileRole>("member");
const mobileTab = ref<MobileTab>("home");
const mobileBillConfirmed = ref(false);
const operationModule = ref<OperationModule>("overview");
const propertyFilter = ref<"全部" | PropertyTicket["status"]>("全部");
const showNewTicket = ref(false);
const newTicket = ref({ title: "", location: "", requester: "商户报修" });
const showProductDetail = ref<Product | null>(null);
const showNewMerchant = ref(false);
const newMerchant = ref({ name: "", brand: "", floor: "", area: 80 });
const showActivityDialog = ref(false);
const newActivity = ref({ name: "", date: "", audience: "全部会员" });
const showHelpDialog = ref(false);
const showSettingsDialog = ref(false);
const mobileInfoKind = ref<MobileInfoKind | null>(null);
const memberSegment = ref<MemberSegment>("all");
const trendMetric = ref<"销售额" | "客流">("销售额");
const merchantPeriod = ref("本月账期");
const mobileMessageFilter = ref<"全部" | "通知" | "权益" | "账单">("全部");
const operationsSyncedAt = ref("刚刚");
const alertsRead = ref(false);
const settingsState = ref({
  reminders: true,
  dailyPush: false,
  refreshMinutes: 1,
});
const inventorySearch = ref("");
const inventoryFilter = ref("全部");
const merchantSearch = ref("");
const memberSearch = ref("");
const showAddProduct = ref(false);
const showMerchantDetail = ref<Merchant | null>(null);
const showMemberDetail = ref<Member | null>(null);
const showAlertDrawer = ref(false);
const toastMessage = ref("");
const memberCoupons = ref([
  {
    id: "sport",
    amount: "5折",
    title: "运动专区限时折扣券",
    condition: "指定运动品牌可用",
    expire: "08.31 到期",
    claimed: false,
  },
  {
    id: "bag",
    amount: "¥50",
    title: "箱包满减券",
    condition: "满 300 元可用",
    expire: "09.05 到期",
    claimed: false,
  },
  {
    id: "welcome",
    amount: "¥20",
    title: "会员回馈券",
    condition: "满 199 元可用",
    expire: "09.10 到期",
    claimed: true,
  },
]);
const mobileMessages = ref<Record<MobileRole, MobileMessage[]>>({
  member: [
    {
      id: "member-1",
      title: "换季清仓活动开始啦",
      description: "运动、服饰专区低至 5 折，金卡会员再享双倍积分。",
      time: "10:26",
      read: false,
    },
    {
      id: "member-2",
      title: "积分到账提醒",
      description: "您昨日消费获得的 286 积分已到账。",
      time: "昨天",
      read: false,
    },
    {
      id: "member-3",
      title: "停车权益即将更新",
      description: "9 月起金卡会员每日可享 2 小时免费停车。",
      time: "08-24",
      read: true,
    },
  ],
  merchant: [
    {
      id: "merchant-1",
      title: "8 月对账单待确认",
      description: "请于 8 月 30 日前完成本期账单核对与确认。",
      time: "09:18",
      read: false,
    },
    {
      id: "merchant-2",
      title: "周末特卖活动报名成功",
      description: "活动物料将于周五统一送达，请提前完成陈列。",
      time: "昨天",
      read: false,
    },
    {
      id: "merchant-3",
      title: "报修工单已完成",
      description: "A12 铺位空调温度异常工单已处理，请确认验收。",
      time: "08-23",
      read: true,
    },
  ],
});

const leasingLeads = ref<LeasingLead[]>([
  {
    id: "LEAD-2408",
    brand: "北境户外",
    category: "户外运动",
    floor: "2F-B15",
    area: 168,
    stage: "方案沟通",
    owner: "李楠",
    updated: "今天 10:32",
  },
  {
    id: "LEAD-2407",
    brand: "小象童装",
    category: "儿童服饰",
    floor: "2F-B07",
    area: 126,
    stage: "初步接洽",
    owner: "王璐",
    updated: "昨天 16:20",
  },
  {
    id: "LEAD-2406",
    brand: "拾光咖啡",
    category: "餐饮配套",
    floor: "1F-C03",
    area: 82,
    stage: "合同审批",
    owner: "李楠",
    updated: "08-24 14:08",
  },
]);
const cashierTransactions = ref<CashierTransaction[]>([
  {
    id: "PAY-0826-0186",
    time: "11:24:08",
    merchant: "运动集合店",
    channel: "微信支付",
    amount: 1280,
    status: "已完成",
  },
  {
    id: "PAY-0826-0178",
    time: "11:18:42",
    merchant: "FILA 生活方式",
    channel: "支付宝",
    amount: 860,
    status: "已完成",
  },
  {
    id: "REF-0826-0031",
    time: "10:56:17",
    merchant: "户外生活馆",
    channel: "银联",
    amount: 420,
    status: "退款待审",
  },
  {
    id: "REF-0826-0029",
    time: "10:42:03",
    merchant: "童装优选馆",
    channel: "微信支付",
    amount: 268,
    status: "已退款",
  },
]);
const propertyTickets = ref<PropertyTicket[]>([
  {
    id: "WO-0826-014",
    title: "1F-A18 空调温度异常",
    location: "1F-A18",
    requester: "FILA 生活方式",
    status: "处理中",
    owner: "张师傅",
    created: "10 分钟前",
  },
  {
    id: "WO-0826-013",
    title: "2F 公共区域灯箱更换",
    location: "2F 公区",
    requester: "物业巡检",
    status: "待派单",
    owner: "未分配",
    created: "32 分钟前",
  },
  {
    id: "WO-0826-012",
    title: "1F-A06 门头灯不亮",
    location: "1F-A06",
    requester: "鞋履折扣店",
    status: "待验收",
    owner: "王师傅",
    created: "1 小时前",
  },
  {
    id: "WO-0826-011",
    title: "员工通道门禁读卡异常",
    location: "B1 员工通道",
    requester: "运营值班",
    status: "已完成",
    owner: "赵师傅",
    created: "昨天 18:06",
  },
]);
const parkingSessions = ref<ParkingSession[]>([
  {
    id: "P-0826-2486",
    plate: "陕A·6Q82K",
    type: "会员",
    entry: "11:32",
    duration: "42 分钟",
    fee: 0,
    status: "正常",
  },
  {
    id: "P-0826-2479",
    plate: "陕A·2M19P",
    type: "访客",
    entry: "11:25",
    duration: "49 分钟",
    fee: 8,
    status: "正常",
  },
  {
    id: "P-0826-2468",
    plate: "陕A·8K31T",
    type: "会员",
    entry: "10:58",
    duration: "1 小时 16 分",
    fee: 0,
    status: "待处理",
  },
  {
    id: "P-0826-2459",
    plate: "陕A·0F77L",
    type: "访客",
    entry: "10:42",
    duration: "1 小时 32 分",
    fee: 15,
    status: "已处理",
  },
]);

const products = ref<Product[]>(seedProducts.map((item) => ({ ...item })));
const merchants = ref<Merchant[]>(seedMerchants.map((item) => ({ ...item })));
const memberList = ref<Member[]>(seedMembers.map((item) => ({ ...item })));
const newProduct = ref({
  name: "",
  brand: "",
  category: "运动鞋",
  stock: 10,
  price: 299,
});

const navItems = [
  { id: "dashboard", label: "经营总览", icon: LayoutDashboard },
  { id: "inventory", label: "自营货品", icon: Box },
  { id: "merchants", label: "商户与合同", icon: Store },
  { id: "members", label: "会员运营", icon: Users },
  { id: "operations", label: "运营协同", icon: BriefcaseBusiness },
] as const;

const pageTitle = computed(
  () =>
    navItems.find((item) => item.id === activeSection.value)?.label ??
    "经营总览",
);
const filteredProducts = computed(() =>
  products.value.filter((item) => {
    const keyword = inventorySearch.value.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      `${item.name}${item.brand}${item.sku}`.toLowerCase().includes(keyword);
    const matchFilter =
      inventoryFilter.value === "全部" || item.status === inventoryFilter.value;
    return matchKeyword && matchFilter;
  }),
);
const filteredMerchants = computed(() =>
  merchants.value.filter((item) => {
    const keyword = merchantSearch.value.trim().toLowerCase();
    return (
      !keyword ||
      `${item.name}${item.brand}${item.floor}`.toLowerCase().includes(keyword)
    );
  }),
);
const filteredMembers = computed(() =>
  memberList.value.filter((item) => {
    const keyword = memberSearch.value.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      `${item.name}${item.phone}${item.tag}`.toLowerCase().includes(keyword);
    const matchSegment =
      memberSegment.value === "all" ||
      (memberSegment.value === "dormant" && item.tag.includes("沉睡")) ||
      (memberSegment.value === "highValue" && item.spend >= 8000);
    return matchKeyword && matchSegment;
  }),
);
const merchantDialogVisible = computed({
  get: () => Boolean(showMerchantDetail.value),
  set: (visible: boolean) => {
    if (!visible) showMerchantDetail.value = null;
  },
});
const memberDialogVisible = computed({
  get: () => Boolean(showMemberDetail.value),
  set: (visible: boolean) => {
    if (!visible) showMemberDetail.value = null;
  },
});
const productDialogVisible = computed({
  get: () => Boolean(showProductDetail.value),
  set: (visible: boolean) => {
    if (!visible) showProductDetail.value = null;
  },
});
const mobileInfoDialogVisible = computed({
  get: () => Boolean(mobileInfoKind.value),
  set: (visible: boolean) => {
    if (!visible) mobileInfoKind.value = null;
  },
});
const inventoryValue = computed(() =>
  products.value.reduce((sum, item) => sum + item.stock * item.cost, 0),
);
const lowStockCount = computed(
  () => products.value.filter((item) => item.status !== "正常").length,
);
const mobilePageTitle = computed(() => {
  const titles: Record<MobileRole, Record<MobileTab, string>> = {
    member: {
      home: "会员中心",
      benefit: "优惠权益",
      message: "消息中心",
      mine: "个人中心",
    },
    merchant: {
      home: "商户服务",
      benefit: "账单服务",
      message: "消息中心",
      mine: "商户中心",
    },
  };
  return titles[mobileRole.value][mobileTab.value];
});
const mobileUnreadCount = computed(
  () =>
    mobileMessages.value[mobileRole.value].filter((message) => !message.read)
      .length,
);
const filteredPropertyTickets = computed(() =>
  propertyTickets.value.filter(
    (ticket) =>
      propertyFilter.value === "全部" || ticket.status === propertyFilter.value,
  ),
);
const operationModuleMeta: Record<
  Exclude<OperationModule, "overview">,
  { eyebrow: string; title: string; description: string }
> = {
  leasing: {
    eyebrow: "招商管理 · 品牌与铺位",
    title: "招商管理",
    description: "跟进意向品牌、匹配空置铺位，并记录每次招商推进结果。",
  },
  cashier: {
    eyebrow: "收银与结算 · 交易与退款",
    title: "收银与结算",
    description: "查看今日收银流水、渠道构成和需要审核的退款申请。",
  },
  property: {
    eyebrow: "物业运维 · 工单闭环",
    title: "物业运维",
    description: "从报修受理到派单、处理和验收，统一管理现场工单。",
  },
  parking: {
    eyebrow: "智慧停车 · 进出与权益",
    title: "智慧停车",
    description: "掌握实时进场车辆、会员抵扣和异常停车处理情况。",
  },
};
const operationModuleTitle = computed(() =>
  operationModule.value === "overview"
    ? "运营协同"
    : operationModuleMeta[operationModule.value].title,
);
const mobileInfoTitle = computed(() => {
  const titles: Record<MobileInfoKind, string> = {
    points: "积分明细",
    benefits: "我的权益",
    receipts: "电子小票",
    activity: "活动中心",
    recommendation: "为你推荐",
    merchantSales: "销售明细",
    merchantActivity: "活动报名",
    merchantRepair: "报修报备",
    bill: "历史账单",
    invoice: "开票申请",
    profile: "资料编辑",
    security: "账号与安全",
    contact: "联系人管理",
    support: "帮助与客服",
    parking: "停车权益",
  };
  return mobileInfoKind.value ? titles[mobileInfoKind.value] : "服务详情";
});
const activeOperationMeta = computed(() =>
  operationModule.value === "overview"
    ? null
    : operationModuleMeta[operationModule.value],
);
const pendingRefundCount = computed(
  () =>
    cashierTransactions.value.filter((item) => item.status === "退款待审")
      .length,
);
const activePropertyTicketCount = computed(
  () => propertyTickets.value.filter((item) => item.status !== "已完成").length,
);
const parkingIssueCount = computed(
  () => parkingSessions.value.filter((item) => item.status === "待处理").length,
);
const filteredMobileMessages = computed(() => {
  const messages = mobileMessages.value[mobileRole.value];
  if (mobileMessageFilter.value === "全部") return messages;
  return messages.filter((message) => {
    if (mobileMessageFilter.value === "账单") {
      return mobileRole.value === "merchant" && message.id === "merchant-1";
    }
    if (mobileMessageFilter.value === "权益") {
      return mobileRole.value === "member" && message.id !== "member-2";
    }
    return message.id.endsWith("-2");
  });
});

function notify(message: string) {
  toastMessage.value = message;
  ElMessage({ message, type: "success", duration: 2200 });
}

function openMobileInfo(kind: MobileInfoKind) {
  mobileInfoKind.value = kind;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  notify(`${filename} 已下载`);
}

function downloadDailyReport() {
  downloadCsv(
    "渭南奥莱-经营日报.csv",
    ["指标", "数值", "环比"],
    [
      ["今日总销售额", "186420", "+12.8%"],
      ["自营专区毛利", "42860", "+8.4%"],
      ["商户收缴率", "92.6%", "+2.1%"],
      ["会员活跃人数", "8624", "+18.2%"],
    ],
  );
}

function downloadMerchantReport() {
  downloadCsv(
    "渭南奥莱-租赁报表.csv",
    ["商户", "铺位", "本月销售", "应收账单", "状态"],
    merchants.value.map((item) => [
      item.name,
      item.floor,
      String(item.sales),
      String(item.bill),
      item.status,
    ]),
  );
}

function downloadMemberReport() {
  downloadCsv(
    "渭南奥莱-会员月报.csv",
    ["会员", "等级", "积分", "累计消费", "最近到访", "标签"],
    memberList.value.map((item) => [
      item.name,
      item.level,
      String(item.points),
      String(item.spend),
      item.lastVisit,
      item.tag,
    ]),
  );
}

function downloadParkingReport() {
  downloadCsv(
    "渭南奥莱-停车日报.csv",
    ["车牌号", "类型", "进场时间", "停车时长", "应收金额", "状态"],
    parkingSessions.value.map((item) => [
      item.plate,
      item.type,
      item.entry,
      item.duration,
      item.fee ? String(item.fee) : "免费",
      item.status,
    ]),
  );
}

function resetDemo() {
  products.value = defaultState.products.map((item) => ({ ...item }));
  merchants.value = defaultState.merchants.map((item) => ({ ...item }));
  memberList.value = defaultState.members.map((item) => ({ ...item }));
  operationModule.value = "overview";
  propertyFilter.value = "全部";
  memberSegment.value = "all";
  trendMetric.value = "销售额";
  merchantPeriod.value = "本月账期";
  mobileMessageFilter.value = "全部";
  operationsSyncedAt.value = "刚刚";
  alertsRead.value = false;
  settingsState.value = {
    reminders: true,
    dailyPush: false,
    refreshMinutes: 1,
  };
  leasingLeads.value = leasingLeads.value.map((item) => ({
    ...item,
    stage:
      item.id === "LEAD-2408"
        ? "方案沟通"
        : item.id === "LEAD-2407"
          ? "初步接洽"
          : "合同审批",
    updated:
      item.id === "LEAD-2408"
        ? "今天 10:32"
        : item.id === "LEAD-2407"
          ? "昨天 16:20"
          : "08-24 14:08",
  }));
  cashierTransactions.value = cashierTransactions.value.map((item) => ({
    ...item,
    status:
      item.id === "REF-0826-0031"
        ? "退款待审"
        : item.id === "REF-0826-0029"
          ? "已退款"
          : "已完成",
  }));
  propertyTickets.value = propertyTickets.value
    .filter((item) => /^WO-0826-01[1-4]$/.test(item.id))
    .map((item) => ({
      ...item,
      status:
        item.id === "WO-0826-014"
          ? "处理中"
          : item.id === "WO-0826-013"
            ? "待派单"
            : item.id === "WO-0826-012"
              ? "待验收"
              : "已完成",
      owner:
        item.id === "WO-0826-013"
          ? "未分配"
          : item.id === "WO-0826-014"
            ? "张师傅"
            : item.id === "WO-0826-012"
              ? "王师傅"
              : "赵师傅",
    }));
  parkingSessions.value = parkingSessions.value.map((item) => ({
    ...item,
    status:
      item.id === "P-0826-2468"
        ? "待处理"
        : item.id === "P-0826-2459"
          ? "已处理"
          : "正常",
  }));
  showNewTicket.value = false;
  newTicket.value = { title: "", location: "", requester: "商户报修" };
  mobileBillConfirmed.value = false;
  memberCoupons.value.forEach((coupon) => {
    coupon.claimed = coupon.id === "welcome";
  });
  mobileMessages.value.member.forEach((message) => {
    message.read = message.id === "member-3";
  });
  mobileMessages.value.merchant.forEach((message) => {
    message.read = message.id === "merchant-3";
  });
  const billMessage = mobileMessages.value.merchant.find(
    (message) => message.id === "merchant-1",
  );
  if (billMessage) {
    billMessage.title = "8 月对账单待确认";
    billMessage.description = "请于 8 月 30 日前完成本期账单核对与确认。";
  }
  inventoryFilter.value = "全部";
  inventorySearch.value = "";
  notify("演示数据已恢复到标准起点");
}

function refreshOperations() {
  operationsSyncedAt.value = "刚刚";
  notify("运营协同数据已刷新");
}

function openSection(section: Section) {
  activeSection.value = section;
  if (section !== "operations") operationModule.value = "overview";
}

function openOperation(module: Exclude<OperationModule, "overview">) {
  openSection("operations");
  operationModule.value = module;
}

function closeOperationModule() {
  operationModule.value = "overview";
}

function handleAdjustment(product: Product) {
  ElMessageBox.confirm(
    `确认将「${product.name}」标记为已处理并重新设置补货提醒吗？`,
    "处理库存预警",
    {
      confirmButtonText: "确认处理",
      cancelButtonText: "稍后处理",
      type: "warning",
    },
  )
    .then(() => {
      product.status = "正常";
      notify(`${product.name} 的库存预警已处理`);
    })
    .catch(() => undefined);
}

function adjustProductStock(product: Product) {
  ElMessageBox.prompt(`请输入「${product.name}」的新库存数量`, "调整库存", {
    inputValue: String(product.stock),
    inputPattern: /^\d+$/,
    inputErrorMessage: "库存必须是大于等于 0 的整数",
    confirmButtonText: "保存调整",
    cancelButtonText: "取消",
  })
    .then(({ value }) => {
      product.stock = Number(value);
      product.status = product.stock < 8 ? "库存预警" : "正常";
      notify(`${product.name} 库存已调整为 ${product.stock} 件`);
      showProductDetail.value = null;
    })
    .catch(() => undefined);
}

function addProduct() {
  if (!newProduct.value.name.trim() || !newProduct.value.brand.trim()) {
    ElMessage({ message: "请先填写商品名称和品牌", type: "warning" });
    return;
  }
  products.value.unshift({
    id: `SKU-${Math.floor(1200 + Math.random() * 700)}`,
    name: newProduct.value.name,
    brand: newProduct.value.brand,
    category: newProduct.value.category,
    sku: `${newProduct.value.brand.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    stock: newProduct.value.stock,
    cost: Math.round(newProduct.value.price * 0.56),
    price: newProduct.value.price,
    age: 0,
    status: newProduct.value.stock < 8 ? "库存预警" : "正常",
  });
  showAddProduct.value = false;
  newProduct.value = {
    name: "",
    brand: "",
    category: "运动鞋",
    stock: 10,
    price: 299,
  };
  notify("商品档案已创建，库存同步完成");
}

function addMerchant() {
  if (
    !newMerchant.value.name.trim() ||
    !newMerchant.value.brand.trim() ||
    !newMerchant.value.floor.trim()
  ) {
    ElMessage({ message: "请填写商户名称、品牌和铺位", type: "warning" });
    return;
  }
  merchants.value.unshift({
    id: `M-${Date.now().toString().slice(-6)}`,
    name: newMerchant.value.name.trim(),
    brand: newMerchant.value.brand.trim(),
    floor: newMerchant.value.floor.trim(),
    area: newMerchant.value.area,
    model: "保底+扣点",
    sales: 0,
    bill: 0,
    status: "正常经营",
  });
  showNewMerchant.value = false;
  newMerchant.value = { name: "", brand: "", floor: "", area: 80 };
  notify("商户档案已创建");
}

function createActivity() {
  if (!newActivity.value.name.trim() || !newActivity.value.date) {
    ElMessage({ message: "请填写活动名称和活动日期", type: "warning" });
    return;
  }
  showActivityDialog.value = false;
  notify(
    `${newActivity.value.name} 已创建，活动将于 ${newActivity.value.date} 开始`,
  );
  newActivity.value = { name: "", date: "", audience: "全部会员" };
}

function confirmBill(merchant: Merchant) {
  merchant.status = "正常经营";
  notify(`${merchant.name} 的月度对账单已确认`);
}

function advanceLead(lead: LeasingLead) {
  const nextStage: Record<LeasingLead["stage"], LeasingLead["stage"]> = {
    初步接洽: "方案沟通",
    方案沟通: "合同审批",
    合同审批: "合同审批",
  };
  if (lead.stage === "合同审批") {
    notify(`${lead.brand} 已进入合同审批，等待法务确认`);
    return;
  }
  lead.stage = nextStage[lead.stage];
  lead.updated = "刚刚更新";
  notify(`${lead.brand} 已推进至${lead.stage}`);
}

function reviewRefund(transaction: CashierTransaction) {
  if (transaction.status !== "退款待审") {
    notify(`${transaction.id} 当前无需审核`);
    return;
  }
  transaction.status = "已退款";
  notify(`${transaction.id} 退款审核通过`);
}

function updatePropertyTicket(ticket: PropertyTicket) {
  if (ticket.status === "待派单") {
    ticket.status = "处理中";
    ticket.owner = "张师傅";
    notify(`${ticket.title} 已派给张师傅`);
  } else if (ticket.status === "处理中") {
    ticket.status = "待验收";
    notify(`${ticket.title} 已处理完成，等待验收`);
  } else if (ticket.status === "待验收") {
    ticket.status = "已完成";
    notify(`${ticket.title} 已验收关闭`);
  } else {
    notify(`${ticket.title} 已归档`);
  }
}

function resolveParking(session: ParkingSession) {
  if (session.status !== "待处理") {
    notify(`${session.plate} 当前无异常`);
    return;
  }
  session.status = "已处理";
  notify(`${session.plate} 的停车异常已处理`);
}

function createPropertyTicket() {
  if (!newTicket.value.title.trim() || !newTicket.value.location.trim()) {
    ElMessage({ message: "请填写工单标题和位置", type: "warning" });
    return;
  }
  propertyTickets.value.unshift({
    id: `WO-0826-${String(propertyTickets.value.length + 15).padStart(3, "0")}`,
    title: newTicket.value.title.trim(),
    location: newTicket.value.location.trim(),
    requester: newTicket.value.requester,
    status: "待派单",
    owner: "未分配",
    created: "刚刚提交",
  });
  showNewTicket.value = false;
  newTicket.value = { title: "", location: "", requester: "商户报修" };
  openOperation("property");
  notify("物业工单已创建");
}

function confirmMobileBill() {
  if (mobileBillConfirmed.value) {
    notify("8 月对账单已经确认");
    return;
  }

  mobileBillConfirmed.value = true;
  merchants.value[0].status = "正常经营";
  const billMessage = mobileMessages.value.merchant.find(
    (message) => message.id === "merchant-1",
  );
  if (billMessage) {
    billMessage.title = "8 月对账单已确认";
    billMessage.description =
      "本期账单已完成核对，后续可在账单服务中申请开票。";
    billMessage.read = true;
  }
  notify("8 月对账单确认成功");
}

function sendCoupon(member: Member) {
  notify(`已向 ${member.name} 定向发放换季清仓券`);
}

function claimCoupon(coupon: (typeof memberCoupons.value)[number]) {
  if (coupon.claimed) {
    notify(`${coupon.title}已在券包中`);
    return;
  }
  coupon.claimed = true;
  notify(`${coupon.title}领取成功`);
}

function readMobileMessage(message: MobileMessage) {
  message.read = true;
  notify(`已查看：${message.title}`);
}

function readAllMobileMessages() {
  mobileMessages.value[mobileRole.value].forEach((message) => {
    message.read = true;
  });
  notify("消息已全部标记为已读");
}

function openMobile(role: MobileRole = "member") {
  mobileRole.value = role;
  mobileTab.value = "home";
  mobileMessageFilter.value = "全部";
  mobileOpen.value = true;
}

function switchMobileRole(role: MobileRole) {
  mobileRole.value = role;
  mobileMessageFilter.value = "全部";
}
</script>

<template>
  <div class="app-shell">
    <aside class="side-nav">
      <div class="brand-block">
        <div class="brand-mark">W</div>
        <div>
          <strong>渭南奥莱</strong>
          <span>运营管理系统</span>
        </div>
      </div>
      <div class="workspace-select">
        <div class="workspace-icon"><Store :size="16" /></div>
        <div><span>当前商场</span><strong>渭南奥莱主题商场</strong></div>
        <ChevronDown :size="14" />
      </div>
      <nav class="nav-list" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: activeSection === item.id }"
          @click="openSection(item.id)"
        >
          <component :is="item.icon" :size="17" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.id === 'inventory' && lowStockCount"
            class="nav-badge"
            >{{ lowStockCount }}</span
          >
        </button>
      </nav>
      <div class="nav-section-label">辅助工具</div>
      <button class="nav-item" @click="openMobile('member')">
        <Smartphone :size="17" /><span>移动端演示</span>
      </button>
      <button class="nav-item" @click="showHelpDialog = true">
        <CircleHelp :size="17" /><span>帮助中心</span>
      </button>
      <div class="side-bottom">
        <div class="side-tip">
          <TrendingUp :size="16" /><span>本月经营健康度</span
          ><strong>良好</strong>
        </div>
        <button class="nav-item" @click="showSettingsDialog = true">
          <Settings2 :size="17" /><span>系统设置</span>
        </button>
        <div class="profile-row">
          <div class="avatar">管</div>
          <div><strong>运营管理员</strong><span>管理员账号</span></div>
          <MoreHorizontal :size="17" />
        </div>
      </div>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="mobile-menu-button"><Menu :size="19" /></div>
        <div class="breadcrumb">
          <span>渭南奥莱</span><span>/</span><strong>{{ pageTitle }}</strong>
        </div>
        <div class="top-actions">
          <button class="icon-button" title="刷新演示数据" @click="resetDemo">
            <RefreshCcw :size="17" />
          </button>
          <button
            class="icon-button notification-button"
            title="通知"
            @click="showAlertDrawer = true"
          >
            <Bell :size="17" /><i v-if="!alertsRead"></i>
          </button>
          <button class="mobile-entry" @click="openMobile('member')">
            <Smartphone :size="16" />移动端
          </button>
          <div class="top-avatar">管</div>
        </div>
      </header>

      <div class="content-area">
        <section v-if="activeSection === 'dashboard'" class="page-section">
          <div class="page-heading-row">
            <div>
              <p class="eyebrow">周三，2026年8月26日</p>
              <h1>经营总览</h1>
              <p class="page-description">
                实时掌握渭南奥莱的经营状态，今天也保持稳步增长。
              </p>
            </div>
            <div class="heading-actions">
              <button class="ghost-button" @click="downloadDailyReport">
                <Download :size="16" />下载日报</button
              ><button class="primary-button" @click="openSection('inventory')">
                <Plus :size="16" />新建业务
              </button>
            </div>
          </div>
          <div class="metric-grid">
            <article class="metric-card accent-card">
              <div class="metric-label">
                <span>今日总销售额</span><TrendingUp :size="16" />
              </div>
              <strong>¥ 186,420</strong>
              <div class="metric-foot">
                <span class="positive">+12.8%</span><span>较昨日</span>
                <div class="mini-bars">
                  <i
                    v-for="(height, index) in [32, 46, 39, 57, 48, 62, 76]"
                    :key="index"
                    :style="{ height: `${height}%` }"
                  ></i>
                </div>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-label">
                <span>自营专区毛利</span><ShoppingBag :size="16" />
              </div>
              <strong>¥ 42,860</strong>
              <div class="metric-foot">
                <span class="positive">+8.4%</span><span>毛利率 23.0%</span>
              </div>
              <div class="metric-progress"><i style="width: 68%"></i></div>
            </article>
            <article class="metric-card">
              <div class="metric-label">
                <span>商户收缴率</span><WalletCards :size="16" />
              </div>
              <strong>92.6%</strong>
              <div class="metric-foot">
                <span class="positive">+2.1%</span><span>本月目标 90%</span>
              </div>
              <div class="metric-progress green">
                <i style="width: 92.6%"></i>
              </div>
            </article>
            <article class="metric-card">
              <div class="metric-label">
                <span>会员活跃人数</span><Users :size="16" />
              </div>
              <strong>8,624</strong>
              <div class="metric-foot">
                <span class="positive">+18.2%</span><span>近30天</span>
              </div>
              <div class="metric-progress blue"><i style="width: 76%"></i></div>
            </article>
          </div>
          <div class="dashboard-grid">
            <article class="surface-card trend-card">
              <div class="card-heading">
                <div>
                  <h2>经营趋势</h2>
                  <p>销售额与客流 · 近 7 天</p>
                </div>
                <button
                  class="select-button"
                  @click="
                    trendMetric = trendMetric === '销售额' ? '客流' : '销售额'
                  "
                >
                  {{ trendMetric }} <ChevronDown :size="14" />
                </button>
              </div>
              <div class="trend-total">
                <strong>{{
                  trendMetric === "销售额" ? "¥ 1,128,640" : "86,420 人次"
                }}</strong
                ><span class="positive">+14.6% vs 上周</span>
              </div>
              <div class="chart-area">
                <div class="chart-y">
                  <span>20万</span><span>15万</span><span>10万</span
                  ><span>5万</span><span>0</span>
                </div>
                <div class="chart-body">
                  <div class="chart-grid-lines">
                    <i v-for="line in 5" :key="line"></i>
                  </div>
                  <div class="bar-row">
                    <div
                      v-for="(value, index) in salesTrend"
                      :key="index"
                      class="bar-wrap"
                    >
                      <div class="bar-value">{{ value * 2 }}k</div>
                      <div class="bar" :style="{ height: `${value}%` }"></div>
                      <span>{{
                        [
                          "周四",
                          "周五",
                          "周六",
                          "周日",
                          "周一",
                          "周二",
                          "今日",
                        ][index]
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
            <article class="surface-card alert-card">
              <div class="card-heading">
                <div>
                  <h2>待处理事项</h2>
                  <p>需要运营关注的业务提醒</p>
                </div>
                <button class="link-button" @click="showAlertDrawer = true">
                  查看全部 <ExternalLink :size="14" />
                </button>
              </div>
              <div class="alert-list">
                <button class="alert-row" @click="openSection('inventory')">
                  <div class="alert-icon danger"><Box :size="16" /></div>
                  <div>
                    <strong>3 个商品库存预警</strong
                    ><span>其中 2 个商品已超过安全库存</span>
                  </div>
                  <ChevronDown :size="15" /></button
                ><button class="alert-row" @click="openSection('merchants')">
                  <div class="alert-icon warning">
                    <FileCheck2 :size="16" />
                  </div>
                  <div>
                    <strong>2 份商户合同即将到期</strong
                    ><span>请在 30 天内完成续约跟进</span>
                  </div>
                  <ChevronDown :size="15" /></button
                ><button class="alert-row" @click="openSection('members')">
                  <div class="alert-icon info"><Ticket :size="16" /></div>
                  <div>
                    <strong>186 张优惠券待核销</strong
                    ><span>本周换季活动核销率 64%</span>
                  </div>
                  <ChevronDown :size="15" /></button
                ><button class="alert-row" @click="openSection('operations')">
                  <div class="alert-icon neutral"><Wrench :size="16" /></div>
                  <div>
                    <strong
                      >{{ activePropertyTicketCount }} 个物业工单未闭环</strong
                    ><span>平均处理时长 1.8 小时</span>
                  </div>
                  <ChevronDown :size="15" />
                </button>
              </div>
            </article>
          </div>
          <div class="dashboard-grid lower-grid">
            <article class="surface-card">
              <div class="card-heading">
                <div>
                  <h2>商户经营排行</h2>
                  <p>按本月销售额排序</p>
                </div>
                <button class="link-button" @click="openSection('merchants')">
                  查看商户 <ExternalLink :size="14" />
                </button>
              </div>
              <div class="rank-list">
                <div
                  v-for="(merchant, index) in merchants.slice(0, 4)"
                  :key="merchant.id"
                  class="rank-row"
                >
                  <span class="rank-number" :class="`rank-${index + 1}`">{{
                    String(index + 1).padStart(2, "0")
                  }}</span>
                  <div class="rank-brand">
                    <div class="brand-avatar">
                      {{ merchant.brand.slice(0, 1) }}
                    </div>
                    <div>
                      <strong>{{ merchant.name }}</strong
                      ><span>{{ merchant.floor }} · {{ merchant.model }}</span>
                    </div>
                  </div>
                  <div class="rank-sales">
                    <strong>¥ {{ merchant.sales.toLocaleString() }}</strong
                    ><span
                      >{{
                        Math.round(
                          merchant.sales / merchant.area,
                        ).toLocaleString()
                      }}
                      /㎡</span
                    >
                  </div>
                </div>
              </div>
            </article>
            <article class="surface-card">
              <div class="card-heading">
                <div>
                  <h2>会员运营</h2>
                  <p>近 30 天核心指标</p>
                </div>
                <button class="link-button" @click="openSection('members')">
                  查看分析 <ExternalLink :size="14" />
                </button>
              </div>
              <div class="member-highlight">
                <div class="donut">
                  <span>68<small>%</small></span>
                </div>
                <div>
                  <strong>会员销售占比</strong>
                  <p>会员贡献销售额 ¥ 768,420</p>
                  <div class="legend">
                    <i class="dot orange"></i>会员销售
                    <i class="dot pale"></i>非会员销售
                  </div>
                </div>
              </div>
              <div class="member-stats">
                <div><strong>426</strong><span>新增会员</span></div>
                <div><strong>32.8%</strong><span>复购率</span></div>
                <div><strong>¥ 286</strong><span>会员客单价</span></div>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeSection === 'inventory'" class="page-section">
          <div class="page-heading-row">
            <div>
              <p class="eyebrow">自营专区 · 商品与库存</p>
              <h1>自营货品</h1>
              <p class="page-description">
                管理 SKU、库存状态和奥莱专属滞销预警。
              </p>
            </div>
            <div class="heading-actions">
              <button class="ghost-button" @click="showAlertDrawer = true">
                <Bell :size="16" />{{ lowStockCount }} 条预警</button
              ><button class="primary-button" @click="showAddProduct = true">
                <Plus :size="16" />新建商品
              </button>
            </div>
          </div>
          <div class="summary-strip">
            <div>
              <span>在售 SKU</span><strong>{{ products.length + 126 }}</strong
              ><small>+8 本月新增</small>
            </div>
            <div>
              <span>库存总值</span
              ><strong>¥ {{ inventoryValue.toLocaleString() }}</strong
              ><small>较上月 +6.2%</small>
            </div>
            <div>
              <span>滞销商品</span
              ><strong class="danger-text">{{
                products.filter((item) => item.status === "滞销").length + 12
              }}</strong
              ><small>需关注清仓</small>
            </div>
            <div>
              <span>今日盘点任务</span><strong>2</strong><small>待完成</small>
            </div>
          </div>
          <article class="surface-card table-card">
            <div class="table-toolbar">
              <div class="filter-input">
                <Search :size="16" /><input
                  v-model="inventorySearch"
                  placeholder="搜索商品、品牌或 SKU"
                />
              </div>
              <div class="filter-tabs">
                <button
                  v-for="filter in ['全部', '库存预警', '滞销']"
                  :key="filter"
                  :class="{ active: inventoryFilter === filter }"
                  @click="inventoryFilter = filter"
                >
                  {{ filter
                  }}<span v-if="filter !== '全部'">{{
                    products.filter((item) => item.status === filter).length
                  }}</span>
                </button>
              </div>
              <button
                class="icon-button"
                title="切换库存预警筛选"
                @click="
                  inventoryFilter =
                    inventoryFilter === '全部' ? '库存预警' : '全部'
                "
              >
                <SlidersHorizontal :size="17" />
              </button>
            </div>
            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>商品信息</th>
                    <th>分类 / SKU</th>
                    <th>库存</th>
                    <th>成本 / 售价</th>
                    <th>库龄</th>
                    <th>状态</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="product in filteredProducts" :key="product.id">
                    <td>
                      <div class="product-cell">
                        <div class="product-thumb">
                          {{ product.category.slice(0, 1) }}
                        </div>
                        <div>
                          <strong>{{ product.name }}</strong
                          ><span>{{ product.brand }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span>{{ product.category }}</span
                      ><small>{{ product.sku }}</small>
                    </td>
                    <td>
                      <strong>{{ product.stock }}</strong
                      ><span class="table-muted"> 件</span>
                    </td>
                    <td>
                      <span>¥ {{ product.cost }}</span
                      ><small>售价 ¥ {{ product.price }}</small>
                    </td>
                    <td>
                      <span
                        :class="{
                          'danger-text': product.age > 60,
                          'warning-text': product.age > 30 && product.age <= 60,
                        }"
                        >{{ product.age }} 天</span
                      >
                    </td>
                    <td>
                      <span
                        class="status-tag"
                        :class="
                          product.status === '正常'
                            ? 'success'
                            : product.status === '滞销'
                              ? 'danger'
                              : 'warning'
                        "
                        >{{ product.status }}</span
                      >
                    </td>
                    <td>
                      <button
                        v-if="product.status !== '正常'"
                        class="table-action"
                        @click="handleAdjustment(product)"
                      >
                        <Check :size="14" />处理</button
                      ><button
                        v-else
                        class="more-action"
                        title="更多操作"
                        aria-label="更多操作"
                        @click="showProductDetail = product"
                      >
                        <MoreHorizontal :size="17" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="filteredProducts.length === 0" class="empty-state">
              没有匹配的商品
            </div>
            <div class="table-footer">
              <span>显示 {{ filteredProducts.length }} 条商品</span>
              <div class="pagination">
                <button disabled>上一页</button><button class="active">1</button
                ><button disabled>下一页</button>
              </div>
            </div>
          </article>
        </section>

        <section v-else-if="activeSection === 'merchants'" class="page-section">
          <div class="page-heading-row">
            <div>
              <p class="eyebrow">租赁联营 · 合同与结算</p>
              <h1>商户与合同</h1>
              <p class="page-description">
                从铺位入驻到退场，统一管理商户合同、账单和经营表现。
              </p>
            </div>
            <div class="heading-actions">
              <button class="ghost-button" @click="downloadMerchantReport">
                <Download :size="16" />导出报表</button
              ><button class="primary-button" @click="showNewMerchant = true">
                <Plus :size="16" />新增商户
              </button>
            </div>
          </div>
          <div class="summary-strip merchant-summary">
            <div>
              <span>在营商户</span><strong>{{ merchants.length + 82 }}</strong
              ><small>出租率 92.4%</small>
            </div>
            <div>
              <span>本月应收</span><strong>¥ 286,420</strong
              ><small>已收 92.6%</small>
            </div>
            <div>
              <span>待续约</span><strong class="warning-text">6</strong
              ><small>30 天内到期</small>
            </div>
            <div>
              <span>欠费预警</span><strong class="danger-text">3</strong
              ><small>待跟进</small>
            </div>
          </div>
          <article class="surface-card table-card">
            <div class="table-toolbar">
              <div class="filter-input">
                <Search :size="16" /><input
                  v-model="merchantSearch"
                  placeholder="搜索商户、品牌或铺位"
                />
              </div>
              <div class="toolbar-spacer"></div>
              <select v-model="merchantPeriod" class="toolbar-select">
                <option>本月账期</option>
                <option>上月账期</option></select
              ><button
                class="icon-button"
                title="切换账期"
                @click="
                  merchantPeriod =
                    merchantPeriod === '本月账期' ? '上月账期' : '本月账期'
                "
              >
                <SlidersHorizontal :size="17" />
              </button>
            </div>
            <div class="data-table-wrap">
              <table class="data-table merchant-table">
                <thead>
                  <tr>
                    <th>商户</th>
                    <th>铺位</th>
                    <th>结算模式</th>
                    <th>本月销售</th>
                    <th>应收账单</th>
                    <th>状态</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="merchant in filteredMerchants"
                    :key="merchant.id"
                    @click="showMerchantDetail = merchant"
                  >
                    <td>
                      <div class="product-cell">
                        <div class="product-thumb brand-thumb">
                          {{ merchant.brand.slice(0, 1) }}
                        </div>
                        <div>
                          <strong>{{ merchant.name }}</strong
                          ><span>{{ merchant.brand }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{{ merchant.floor }}</strong
                      ><small>{{ merchant.area }}㎡</small>
                    </td>
                    <td>
                      <span class="model-tag">{{ merchant.model }}</span>
                    </td>
                    <td>
                      <strong>¥ {{ merchant.sales.toLocaleString() }}</strong
                      ><small
                        >坪效 ¥
                        {{
                          Math.round(
                            merchant.sales / merchant.area,
                          ).toLocaleString()
                        }}</small
                      >
                    </td>
                    <td>
                      <strong>¥ {{ merchant.bill.toLocaleString() }}</strong
                      ><small>{{
                        merchantPeriod === "本月账期"
                          ? "账期 08/01-08/31"
                          : "账期 07/01-07/31"
                      }}</small>
                    </td>
                    <td>
                      <span
                        class="status-tag"
                        :class="
                          merchant.status === '正常经营'
                            ? 'success'
                            : merchant.status === '待续约'
                              ? 'warning'
                              : 'danger'
                        "
                        >{{ merchant.status }}</span
                      >
                    </td>
                    <td>
                      <button
                        class="table-action subtle"
                        @click.stop="showMerchantDetail = merchant"
                      >
                        查看 <ExternalLink :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table-footer">
              <span>共 {{ filteredMerchants.length }} 家商户</span>
              <div class="pagination">
                <button class="active">1</button
                ><button disabled>下一页</button>
              </div>
            </div>
          </article>
        </section>

        <section v-else-if="activeSection === 'members'" class="page-section">
          <div class="page-heading-row">
            <div>
              <p class="eyebrow">全域会员 · 精准运营</p>
              <h1>会员运营</h1>
              <p class="page-description">
                用会员等级、消费标签和优惠券，持续经营本地复购客群。
              </p>
            </div>
            <div class="heading-actions">
              <button class="ghost-button" @click="downloadMemberReport">
                <Download :size="16" />会员月报</button
              ><button
                class="primary-button"
                @click="showActivityDialog = true"
              >
                <Plus :size="16" />创建活动
              </button>
            </div>
          </div>
          <div class="member-kpi-grid">
            <article class="surface-card member-kpi">
              <div class="kpi-icon orange"><Users :size="17" /></div>
              <div>
                <span>会员总数</span><strong>12,860</strong
                ><small class="positive">+426 本月新增</small>
              </div>
            </article>
            <article class="surface-card member-kpi">
              <div class="kpi-icon blue"><TrendingUp :size="17" /></div>
              <div>
                <span>30天活跃率</span><strong>68.4%</strong
                ><small class="positive">+5.2% 较上月</small>
              </div>
            </article>
            <article class="surface-card member-kpi">
              <div class="kpi-icon green"><RefreshCcw :size="17" /></div>
              <div>
                <span>复购率</span><strong>32.8%</strong
                ><small class="positive">+3.4% 较上月</small>
              </div>
            </article>
            <article class="surface-card member-kpi">
              <div class="kpi-icon violet"><Ticket :size="17" /></div>
              <div>
                <span>优惠券核销</span><strong>64.2%</strong
                ><small>186 张待核销</small>
              </div>
            </article>
          </div>
          <article class="surface-card table-card">
            <div class="table-toolbar">
              <div class="filter-input">
                <Search :size="16" /><input
                  v-model="memberSearch"
                  placeholder="搜索姓名、手机号或会员标签"
                />
              </div>
              <div class="filter-tabs">
                <button
                  :class="{ active: memberSegment === 'all' }"
                  @click="memberSegment = 'all'"
                >
                  全部会员</button
                ><button
                  :class="{ active: memberSegment === 'dormant' }"
                  @click="memberSegment = 'dormant'"
                >
                  沉睡会员 <span>32</span></button
                ><button
                  :class="{ active: memberSegment === 'highValue' }"
                  @click="memberSegment = 'highValue'"
                >
                  高价值会员 <span>86</span>
                </button>
              </div>
              <button
                class="icon-button"
                title="切换会员分群筛选"
                @click="
                  memberSegment = memberSegment === 'all' ? 'dormant' : 'all'
                "
              >
                <SlidersHorizontal :size="17" />
              </button>
            </div>
            <div class="data-table-wrap">
              <table class="data-table member-table">
                <thead>
                  <tr>
                    <th>会员</th>
                    <th>等级</th>
                    <th>积分</th>
                    <th>累计消费</th>
                    <th>最近到访</th>
                    <th>标签</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="member in filteredMembers"
                    :key="member.id"
                    @click="showMemberDetail = member"
                  >
                    <td>
                      <div class="product-cell">
                        <div class="member-avatar">
                          {{ member.name.slice(0, 1) }}
                        </div>
                        <div>
                          <strong>{{ member.name }}</strong
                          ><span>{{ member.phone }} · {{ member.id }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        class="level-tag"
                        :class="member.level.replace('卡', '')"
                        >{{ member.level }}</span
                      >
                    </td>
                    <td>
                      <strong>{{ member.points.toLocaleString() }}</strong
                      ><span class="table-muted"> 分</span>
                    </td>
                    <td>
                      <strong>¥ {{ member.spend.toLocaleString() }}</strong>
                    </td>
                    <td>{{ member.lastVisit }}</td>
                    <td>
                      <span class="soft-tag">{{ member.tag }}</span>
                    </td>
                    <td>
                      <button
                        class="table-action subtle"
                        @click.stop="sendCoupon(member)"
                      >
                        <Ticket :size="14" />发券
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table-footer">
              <span>共 {{ filteredMembers.length }} 位会员</span>
              <div class="pagination">
                <button class="active">1</button
                ><button disabled>下一页</button>
              </div>
            </div>
          </article>
        </section>

        <section v-else class="page-section">
          <template v-if="operationModule === 'overview'">
            <div class="page-heading-row">
              <div>
                <p class="eyebrow">招商 · 收银 · 物业 · 停车</p>
                <h1>运营协同</h1>
                <p class="page-description">
                  把商场日常运营的关键事项，放到同一张轻量工作台里。
                </p>
              </div>
              <div class="heading-actions">
                <button class="ghost-button" @click="refreshOperations">
                  <RefreshCcw :size="16" />刷新状态</button
                ><button class="primary-button" @click="showNewTicket = true">
                  <Plus :size="16" />新建工单
                </button>
              </div>
            </div>
            <div class="operation-grid">
              <button class="operation-card" @click="openOperation('leasing')">
                <div class="operation-icon orange">
                  <BriefcaseBusiness :size="18" />
                </div>
                <div>
                  <strong>招商管理</strong
                  ><span>12 个意向品牌 · 3 个空置铺位</span>
                </div>
                <ExternalLink :size="16" />
              </button>
              <button class="operation-card" @click="openOperation('cashier')">
                <div class="operation-icon blue"><CreditCard :size="18" /></div>
                <div>
                  <strong>收银与结算</strong
                  ><span
                    >今日收银 ¥186,420 ·
                    {{ pendingRefundCount }} 笔待审退款</span
                  >
                </div>
                <ExternalLink :size="16" />
              </button>
              <button class="operation-card" @click="openOperation('property')">
                <div class="operation-icon green"><Wrench :size="18" /></div>
                <div>
                  <strong>物业运维</strong
                  ><span
                    >{{ activePropertyTicketCount }} 个未闭环 · 平均耗时 1.8
                    小时</span
                  >
                </div>
                <ExternalLink :size="16" />
              </button>
              <button class="operation-card" @click="openOperation('parking')">
                <div class="operation-icon purple">
                  <CalendarDays :size="18" />
                </div>
                <div>
                  <strong>智慧停车</strong
                  ><span
                    >今日进场 2,486 车次 ·
                    {{ parkingIssueCount }} 条异常待处理</span
                  >
                </div>
                <ExternalLink :size="16" />
              </button>
            </div>
            <div class="operation-columns">
              <article class="surface-card">
                <div class="card-heading">
                  <div>
                    <h2>物业工单</h2>
                    <p>报修、派单、处理、验收闭环</p>
                  </div>
                  <button
                    class="link-button"
                    @click="openOperation('property')"
                  >
                    查看全部 <ExternalLink :size="14" />
                  </button>
                </div>
                <div class="ticket-list">
                  <div
                    v-for="ticket in propertyTickets.slice(0, 3)"
                    :key="ticket.id"
                    class="ticket-row"
                  >
                    <div
                      class="ticket-status"
                      :class="
                        ticket.status === '已完成'
                          ? 'done'
                          : ticket.status === '待派单'
                            ? 'waiting'
                            : 'ongoing'
                      "
                    >
                      {{ ticket.status }}
                    </div>
                    <div>
                      <strong>{{ ticket.title }}</strong
                      ><span
                        >{{ ticket.requester }} · {{ ticket.created }}</span
                      >
                    </div>
                    <span class="ticket-owner">{{ ticket.owner }}</span>
                  </div>
                </div>
              </article>
              <article class="surface-card">
                <div class="card-heading">
                  <div>
                    <h2>出租率概况</h2>
                    <p>实时掌握空置铺位和招商进度</p>
                  </div>
                  <button class="link-button" @click="openOperation('leasing')">
                    查看招商 <ExternalLink :size="14" />
                  </button>
                </div>
                <div class="occupancy">
                  <div class="occupancy-ring">
                    <span>92<small>.4%</small></span
                    ><em>当前出租率</em>
                  </div>
                  <div class="occupancy-info">
                    <div>
                      <span><i class="dot orange"></i>已出租</span
                      ><strong>86 铺</strong>
                    </div>
                    <div>
                      <span><i class="dot pale"></i>空置</span
                      ><strong>7 铺</strong>
                    </div>
                    <div>
                      <span><i class="dot blue"></i>洽谈中</span
                      ><strong>{{ leasingLeads.length }} 铺</strong>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div class="page-heading-row operation-detail-heading">
              <div>
                <button class="back-link" @click="closeOperationModule">
                  <ArrowLeft :size="15" />返回运营协同
                </button>
                <p class="eyebrow">{{ activeOperationMeta?.eyebrow }}</p>
                <h1>{{ activeOperationMeta?.title }}</h1>
                <p class="page-description">
                  {{ activeOperationMeta?.description }}
                </p>
              </div>
              <div class="heading-actions">
                <button class="ghost-button" @click="refreshOperations">
                  <RefreshCcw :size="16" />刷新数据
                </button>
                <button
                  v-if="operationModule === 'property'"
                  class="primary-button"
                  @click="showNewTicket = true"
                >
                  <Plus :size="16" />新建工单
                </button>
              </div>
            </div>

            <div
              v-if="operationModule === 'leasing'"
              class="operation-detail-body"
            >
              <div class="summary-strip operation-summary">
                <div>
                  <span>意向品牌</span><strong>12</strong
                  ><small>本月新增 4 个</small>
                </div>
                <div>
                  <span>空置铺位</span><strong>3</strong
                  ><small>其中 2 个可立即签约</small>
                </div>
                <div>
                  <span>本月签约</span><strong>2</strong
                  ><small>预计贡献 ¥ 86,000 / 月</small>
                </div>
              </div>
              <article class="surface-card operation-panel">
                <div class="card-heading">
                  <div>
                    <h2>意向品牌跟进</h2>
                    <p>按招商阶段推进品牌入驻</p>
                  </div>
                  <span class="panel-caption"
                    >{{ leasingLeads.length }} 条记录</span
                  >
                </div>
                <div class="data-table-wrap operation-table-wrap">
                  <table class="data-table operation-table">
                    <thead>
                      <tr>
                        <th>品牌</th>
                        <th>意向铺位</th>
                        <th>面积</th>
                        <th>跟进阶段</th>
                        <th>负责人</th>
                        <th>最近更新</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="lead in leasingLeads" :key="lead.id">
                        <td>
                          <strong>{{ lead.brand }}</strong
                          ><small>{{ lead.category }} · {{ lead.id }}</small>
                        </td>
                        <td>{{ lead.floor }}</td>
                        <td>{{ lead.area }}㎡</td>
                        <td>
                          <span
                            class="status-tag"
                            :class="
                              lead.stage === '合同审批'
                                ? 'success'
                                : lead.stage === '方案沟通'
                                  ? 'info'
                                  : 'warning'
                            "
                            >{{ lead.stage }}</span
                          >
                        </td>
                        <td>{{ lead.owner }}</td>
                        <td>{{ lead.updated }}</td>
                        <td>
                          <button
                            class="table-action subtle"
                            @click="advanceLead(lead)"
                          >
                            {{ lead.stage === "合同审批" ? "查看" : "推进" }}
                            <ExternalLink :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <div
              v-else-if="operationModule === 'cashier'"
              class="operation-detail-body"
            >
              <div class="summary-strip operation-summary">
                <div>
                  <span>今日收银</span><strong>¥ 186,420</strong
                  ><small>较昨日 +12.8%</small>
                </div>
                <div>
                  <span>交易笔数</span><strong>1,286</strong
                  ><small>微信支付占 54%</small>
                </div>
                <div>
                  <span>待审退款</span><strong>{{ pendingRefundCount }}</strong
                  ><small>合计 ¥ 420</small>
                </div>
              </div>
              <article class="surface-card operation-panel">
                <div class="card-heading">
                  <div>
                    <h2>实时收银流水</h2>
                    <p>统一查看交易与退款状态</p>
                  </div>
                  <span class="panel-caption">自动刷新 · 1 分钟前</span>
                </div>
                <div class="data-table-wrap operation-table-wrap">
                  <table class="data-table operation-table">
                    <thead>
                      <tr>
                        <th>流水号</th>
                        <th>时间</th>
                        <th>商户</th>
                        <th>支付渠道</th>
                        <th>金额</th>
                        <th>状态</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="transaction in cashierTransactions"
                        :key="transaction.id"
                      >
                        <td>
                          <strong>{{ transaction.id }}</strong>
                        </td>
                        <td>{{ transaction.time }}</td>
                        <td>{{ transaction.merchant }}</td>
                        <td>{{ transaction.channel }}</td>
                        <td>
                          <strong
                            >¥ {{ transaction.amount.toLocaleString() }}</strong
                          >
                        </td>
                        <td>
                          <span
                            class="status-tag"
                            :class="
                              transaction.status === '已完成'
                                ? 'success'
                                : transaction.status === '退款待审'
                                  ? 'warning'
                                  : 'info'
                            "
                            >{{ transaction.status }}</span
                          >
                        </td>
                        <td>
                          <button
                            class="table-action subtle"
                            @click="reviewRefund(transaction)"
                          >
                            {{
                              transaction.status === "退款待审"
                                ? "审核退款"
                                : "查看"
                            }}
                            <ExternalLink :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <div
              v-else-if="operationModule === 'property'"
              class="operation-detail-body"
            >
              <div class="summary-strip operation-summary">
                <div>
                  <span>未闭环工单</span
                  ><strong>{{ activePropertyTicketCount }}</strong
                  ><small>平均处理时长 1.8 小时</small>
                </div>
                <div>
                  <span>待派单</span
                  ><strong>{{
                    propertyTickets.filter((item) => item.status === "待派单")
                      .length
                  }}</strong
                  ><small>需要及时分派</small>
                </div>
                <div>
                  <span>今日已完成</span
                  ><strong>{{
                    propertyTickets.filter((item) => item.status === "已完成")
                      .length
                  }}</strong
                  ><small>验收通过率 100%</small>
                </div>
              </div>
              <article class="surface-card operation-panel">
                <div class="card-heading">
                  <div>
                    <h2>物业工单列表</h2>
                    <p>点击操作按钮推进工单状态</p>
                  </div>
                  <select v-model="propertyFilter" class="toolbar-select">
                    <option>全部</option>
                    <option>待派单</option>
                    <option>处理中</option>
                    <option>待验收</option>
                    <option>已完成</option>
                  </select>
                </div>
                <div class="data-table-wrap operation-table-wrap">
                  <table class="data-table operation-table">
                    <thead>
                      <tr>
                        <th>工单</th>
                        <th>位置</th>
                        <th>发起方</th>
                        <th>状态</th>
                        <th>负责人</th>
                        <th>提交时间</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="ticket in filteredPropertyTickets"
                        :key="ticket.id"
                      >
                        <td>
                          <strong>{{ ticket.title }}</strong
                          ><small>{{ ticket.id }}</small>
                        </td>
                        <td>{{ ticket.location }}</td>
                        <td>{{ ticket.requester }}</td>
                        <td>
                          <span
                            class="status-tag"
                            :class="
                              ticket.status === '已完成'
                                ? 'success'
                                : ticket.status === '待派单'
                                  ? 'warning'
                                  : ticket.status === '待验收'
                                    ? 'info'
                                    : 'primary'
                            "
                            >{{ ticket.status }}</span
                          >
                        </td>
                        <td>{{ ticket.owner }}</td>
                        <td>{{ ticket.created }}</td>
                        <td>
                          <button
                            class="table-action subtle"
                            @click="updatePropertyTicket(ticket)"
                          >
                            {{
                              ticket.status === "已完成"
                                ? "查看"
                                : ticket.status === "待派单"
                                  ? "派单"
                                  : ticket.status === "处理中"
                                    ? "完成"
                                    : "验收"
                            }}
                            <ExternalLink :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <div v-else class="operation-detail-body">
              <div class="summary-strip operation-summary">
                <div>
                  <span>今日进场</span><strong>2,486</strong
                  ><small>较昨日 +8.6%</small>
                </div>
                <div>
                  <span>会员抵扣</span><strong>186</strong
                  ><small>节省停车费 ¥ 3,720</small>
                </div>
                <div>
                  <span>异常待处理</span><strong>{{ parkingIssueCount }}</strong
                  ><small>需要人工确认</small>
                </div>
              </div>
              <article class="surface-card operation-panel">
                <div class="card-heading">
                  <div>
                    <h2>实时车辆记录</h2>
                    <p>查看进出场车辆及会员权益抵扣</p>
                  </div>
                  <button class="link-button" @click="downloadParkingReport">
                    <Download :size="14" />下载日报
                  </button>
                </div>
                <div class="data-table-wrap operation-table-wrap">
                  <table class="data-table operation-table">
                    <thead>
                      <tr>
                        <th>车牌号</th>
                        <th>类型</th>
                        <th>进场时间</th>
                        <th>停车时长</th>
                        <th>应收金额</th>
                        <th>状态</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="session in parkingSessions" :key="session.id">
                        <td>
                          <strong>{{ session.plate }}</strong
                          ><small>{{ session.id }}</small>
                        </td>
                        <td>
                          <span class="model-tag">{{ session.type }}</span>
                        </td>
                        <td>{{ session.entry }}</td>
                        <td>{{ session.duration }}</td>
                        <td>
                          <strong>{{
                            session.fee ? `¥ ${session.fee}` : "免费"
                          }}</strong>
                        </td>
                        <td>
                          <span
                            class="status-tag"
                            :class="
                              session.status === '正常'
                                ? 'success'
                                : session.status === '待处理'
                                  ? 'warning'
                                  : 'info'
                            "
                            >{{ session.status }}</span
                          >
                        </td>
                        <td>
                          <button
                            class="table-action subtle"
                            @click="resolveParking(session)"
                          >
                            {{ session.status === "待处理" ? "处理" : "查看" }}
                            <ExternalLink :size="14" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </template>
        </section>
      </div>
    </main>

    <transition name="fade"
      ><div
        v-if="mobileOpen"
        class="mobile-overlay"
        @click.self="mobileOpen = false"
      >
        <div class="phone-frame">
          <div class="phone-notch"></div>
          <div class="phone-screen">
            <header class="mobile-header">
              <div>
                <span>渭南奥莱</span><strong>{{ mobilePageTitle }}</strong>
              </div>
              <button class="mobile-close" @click="mobileOpen = false">
                <X :size="17" />
              </button>
            </header>
            <div class="role-switch">
              <button
                :class="{ active: mobileRole === 'member' }"
                @click="switchMobileRole('member')"
              >
                <UserRound :size="14" />会员端</button
              ><button
                :class="{ active: mobileRole === 'merchant' }"
                @click="switchMobileRole('merchant')"
              >
                <Store :size="14" />商户端
              </button>
            </div>
            <main class="mobile-content">
              <template v-if="mobileTab === 'home'">
                <template v-if="mobileRole === 'member'"
                  ><div class="member-welcome">
                    <div>
                      <span>早上好，王女士</span
                      ><strong>今天也有好物等你发现</strong>
                    </div>
                    <div class="member-mini-avatar">王</div>
                  </div>
                  <div class="mobile-level-card">
                    <div>
                      <span>当前等级</span><strong>金卡会员</strong
                      ><small>距白金卡还差 ¥ 1,380</small>
                    </div>
                    <div class="level-progress"><i></i></div>
                    <div class="mobile-points">
                      <span>可用积分 <strong>2,860</strong></span
                      ><button @click="openMobileInfo('points')">
                        积分明细 <ExternalLink :size="12" />
                      </button>
                    </div>
                  </div>
                  <div class="mobile-section-title">
                    <strong>我的权益</strong
                    ><button @click="openMobileInfo('benefits')">全部</button>
                  </div>
                  <div class="benefit-grid">
                    <button @click="mobileTab = 'benefit'">
                      <div class="benefit-icon coupon">
                        <Ticket :size="17" />
                      </div>
                      <strong>优惠券</strong><span>12 张可用</span></button
                    ><button @click="openMobileInfo('parking')">
                      <div class="benefit-icon parking">
                        <CalendarDays :size="17" />
                      </div>
                      <strong>停车权益</strong
                      ><span>今日免费 2 小时</span></button
                    ><button @click="openMobileInfo('receipts')">
                      <div class="benefit-icon receipt">
                        <FileCheck2 :size="17" />
                      </div>
                      <strong>电子小票</strong><span>最近 3 笔</span></button
                    ><button @click="openMobileInfo('activity')">
                      <div class="benefit-icon event"><Tag :size="17" /></div>
                      <strong>活动中心</strong><span>换季清仓</span>
                    </button>
                  </div>
                  <div class="mobile-section-title">
                    <strong>为你推荐</strong
                    ><button @click="openMobileInfo('recommendation')">
                      更多
                    </button>
                  </div>
                  <div class="mobile-product-list">
                    <div>
                      <div class="mobile-product-thumb">鞋</div>
                      <div>
                        <strong>运动专区限时 5 折</strong
                        ><span>会员专享 · 还剩 2 天</span>
                      </div>
                      <button @click="openMobileInfo('activity')">
                        去看看
                      </button>
                    </div>
                    <div>
                      <div class="mobile-product-thumb bag">包</div>
                      <div>
                        <strong>箱包满 300 减 50</strong
                        ><span>全场可用 · 会员加倍积分</span>
                      </div>
                      <button @click="claimCoupon(memberCoupons[1])">
                        领券
                      </button>
                    </div>
                  </div></template
                ><template v-else
                  ><div class="merchant-welcome">
                    <div>
                      <span>上午好，运动集合店</span
                      ><strong>本月经营表现稳步提升</strong>
                    </div>
                    <div class="merchant-mini-avatar">运</div>
                  </div>
                  <div class="merchant-sales-card">
                    <div>
                      <span>本月销售额</span><strong>¥ 426,800</strong
                      ><small><i>+12.8%</i> 较上月同期</small>
                    </div>
                    <div class="mobile-sparkline">
                      <i
                        v-for="(height, index) in [28, 38, 31, 52, 44, 60, 76]"
                        :key="index"
                        :style="{ height: `${height}%` }"
                      ></i>
                    </div>
                  </div>
                  <div class="mobile-section-title">
                    <strong>快捷服务</strong>
                  </div>
                  <div class="merchant-action-grid">
                    <button @click="mobileTab = 'benefit'">
                      <WalletCards :size="18" /><strong>月度账单</strong
                      ><span>待确认 1 份</span></button
                    ><button @click="openMobileInfo('merchantSales')">
                      <TrendingUp :size="18" /><strong>销售明细</strong
                      ><span>查看趋势</span></button
                    ><button @click="openMobileInfo('merchantActivity')">
                      <Tag :size="18" /><strong>活动报名</strong
                      ><span>2 个进行中</span></button
                    ><button @click="openMobileInfo('merchantRepair')">
                      <Wrench :size="18" /><strong>报修报备</strong
                      ><span>提交工单</span>
                    </button>
                  </div>
                  <div class="bill-notice">
                    <div class="benefit-icon invoice">
                      <FileCheck2 :size="17" />
                    </div>
                    <div>
                      <strong>{{
                        mobileBillConfirmed
                          ? "8 月对账单已确认"
                          : "8 月对账单待确认"
                      }}</strong
                      ><span>应付 ¥ 38,412 · 账期 08/01-08/31</span>
                    </div>
                    <button
                      :disabled="mobileBillConfirmed"
                      @click="confirmMobileBill"
                    >
                      {{ mobileBillConfirmed ? "已确认" : "立即确认" }}
                    </button>
                  </div></template
                >
              </template>

              <template v-else-if="mobileTab === 'benefit'">
                <template v-if="mobileRole === 'member'">
                  <div class="mobile-page-heading">
                    <div>
                      <span>专属福利</span>
                      <strong>可用优惠券</strong>
                    </div>
                    <div class="mobile-page-count">12 <small>张</small></div>
                  </div>
                  <div class="coupon-summary">
                    <div><strong>8</strong><span>满减券</span></div>
                    <div><strong>3</strong><span>折扣券</span></div>
                    <div><strong>1</strong><span>停车券</span></div>
                  </div>
                  <div class="mobile-section-title">
                    <strong>推荐领取</strong><span>2 张即将到期</span>
                  </div>
                  <div class="coupon-list">
                    <article v-for="coupon in memberCoupons" :key="coupon.id">
                      <div class="coupon-amount">{{ coupon.amount }}</div>
                      <div class="coupon-info">
                        <strong>{{ coupon.title }}</strong>
                        <span>{{ coupon.condition }}</span>
                        <small>{{ coupon.expire }}</small>
                      </div>
                      <button
                        :class="{ claimed: coupon.claimed }"
                        @click="claimCoupon(coupon)"
                      >
                        {{ coupon.claimed ? "已领取" : "领取" }}
                      </button>
                    </article>
                  </div>
                  <div class="mobile-service-card">
                    <div class="benefit-icon parking">
                      <CalendarDays :size="17" />
                    </div>
                    <div>
                      <strong>金卡停车权益</strong>
                      <span>今日剩余免费停车 2 小时</span>
                    </div>
                    <button @click="openMobileInfo('parking')">查看</button>
                  </div>
                </template>
                <template v-else>
                  <div class="mobile-page-heading">
                    <div>
                      <span>2026 年 8 月</span>
                      <strong>账单服务</strong>
                    </div>
                    <div class="mobile-page-count">92.6<small>%</small></div>
                  </div>
                  <div class="merchant-bill-summary">
                    <span>本月应付</span><strong>¥ 38,412</strong>
                    <div>
                      <small>固定费用 ¥ 22,500</small>
                      <small>扣点费用 ¥ 15,912</small>
                    </div>
                  </div>
                  <div class="mobile-section-title">
                    <strong>账单记录</strong><span>最近 3 个月</span>
                  </div>
                  <div class="merchant-bill-list">
                    <article>
                      <div
                        class="bill-month"
                        :class="{ settled: mobileBillConfirmed }"
                      >
                        <strong>08</strong><span>月</span>
                      </div>
                      <div>
                        <strong>8 月经营对账单</strong
                        ><span
                          >¥ 38,412 ·
                          {{ mobileBillConfirmed ? "已确认" : "待确认" }}</span
                        >
                      </div>
                      <button
                        :disabled="mobileBillConfirmed"
                        @click="confirmMobileBill"
                      >
                        {{ mobileBillConfirmed ? "已确认" : "确认" }}
                      </button>
                    </article>
                    <article>
                      <div class="bill-month settled">
                        <strong>07</strong><span>月</span>
                      </div>
                      <div>
                        <strong>7 月经营对账单</strong
                        ><span>¥ 36,860 · 已结清</span>
                      </div>
                      <button @click="openMobileInfo('bill')">查看</button>
                    </article>
                    <article>
                      <div class="bill-month settled">
                        <strong>06</strong><span>月</span>
                      </div>
                      <div>
                        <strong>6 月经营对账单</strong
                        ><span>¥ 35,240 · 已结清</span>
                      </div>
                      <button @click="openMobileInfo('bill')">查看</button>
                    </article>
                  </div>
                  <div class="mobile-service-card">
                    <div class="benefit-icon receipt">
                      <FileCheck2 :size="17" />
                    </div>
                    <div>
                      <strong>开票申请</strong>
                      <span>可按已结清账单申请电子发票</span>
                    </div>
                    <button @click="openMobileInfo('invoice')">申请</button>
                  </div>
                </template>
              </template>

              <template v-else-if="mobileTab === 'message'">
                <div class="mobile-page-heading compact">
                  <div>
                    <span>{{ mobileUnreadCount }} 条未读</span>
                    <strong>业务消息</strong>
                  </div>
                  <button
                    v-if="mobileUnreadCount"
                    class="mobile-text-button"
                    @click="readAllMobileMessages"
                  >
                    全部已读
                  </button>
                </div>
                <div class="message-filter-row">
                  <button
                    :class="{ active: mobileMessageFilter === '全部' }"
                    @click="mobileMessageFilter = '全部'"
                  >
                    全部</button
                  ><button
                    :class="{ active: mobileMessageFilter === '通知' }"
                    @click="mobileMessageFilter = '通知'"
                  >
                    通知</button
                  ><button
                    :class="{
                      active:
                        mobileMessageFilter ===
                        (mobileRole === 'member' ? '权益' : '账单'),
                    }"
                    @click="
                      mobileMessageFilter =
                        mobileRole === 'member' ? '权益' : '账单'
                    "
                  >
                    {{ mobileRole === "member" ? "权益" : "账单" }}
                  </button>
                </div>
                <div class="mobile-message-list">
                  <button
                    v-for="message in filteredMobileMessages"
                    :key="message.id"
                    :class="{ unread: !message.read }"
                    @click="readMobileMessage(message)"
                  >
                    <div class="message-icon">
                      <Bell :size="16" />
                      <i v-if="!message.read"></i>
                    </div>
                    <div>
                      <strong>{{ message.title }}</strong>
                      <span>{{ message.description }}</span>
                      <small>{{ message.time }}</small>
                    </div>
                    <ChevronDown :size="14" />
                  </button>
                </div>
                <div
                  v-if="!filteredMobileMessages.length"
                  class="mobile-read-tip"
                >
                  暂无此分类消息
                </div>
                <div v-if="!mobileUnreadCount" class="mobile-read-tip">
                  <Check :size="15" />消息已全部读完
                </div>
              </template>

              <template v-else>
                <div
                  class="mobile-profile-card"
                  :class="{ merchant: mobileRole === 'merchant' }"
                >
                  <div
                    :class="
                      mobileRole === 'member'
                        ? 'member-mini-avatar'
                        : 'merchant-mini-avatar'
                    "
                  >
                    {{ mobileRole === "member" ? "王" : "运" }}
                  </div>
                  <div>
                    <strong>{{
                      mobileRole === "member" ? "王女士" : "运动集合店"
                    }}</strong>
                    <span>{{
                      mobileRole === "member"
                        ? "金卡会员 · 2,860 积分"
                        : "1F-A12 · 正常经营"
                    }}</span>
                  </div>
                  <button @click="openMobileInfo('profile')">
                    编辑 <ExternalLink :size="12" />
                  </button>
                </div>
                <div class="mine-stat-grid">
                  <div v-if="mobileRole === 'member'">
                    <strong>12</strong><span>优惠券</span>
                  </div>
                  <div v-else><strong>92.6%</strong><span>收缴率</span></div>
                  <div v-if="mobileRole === 'member'">
                    <strong>¥ 8,620</strong><span>累计消费</span>
                  </div>
                  <div v-else><strong>8</strong><span>经营月份</span></div>
                  <div v-if="mobileRole === 'member'">
                    <strong>6</strong><span>电子小票</span>
                  </div>
                  <div v-else><strong>1</strong><span>处理中工单</span></div>
                </div>
                <div class="mobile-section-title">
                  <strong>常用服务</strong>
                </div>
                <div class="mine-menu-list">
                  <button @click="openMobileInfo('profile')">
                    <UserRound :size="17" />
                    <div>
                      <strong>{{
                        mobileRole === "member" ? "会员资料" : "商户资料"
                      }}</strong
                      ><span>查看与维护基础信息</span>
                    </div>
                    <ChevronDown :size="14" />
                  </button>
                  <button @click="openMobileInfo('security')">
                    <Settings2 :size="17" />
                    <div>
                      <strong>账号与安全</strong
                      ><span>登录手机号、消息提醒</span>
                    </div>
                    <ChevronDown :size="14" />
                  </button>
                  <button
                    @click="
                      openMobileInfo(
                        mobileRole === 'member' ? 'parking' : 'contact',
                      )
                    "
                  >
                    <CalendarDays :size="17" />
                    <div>
                      <strong>{{
                        mobileRole === "member" ? "我的车辆" : "联系人管理"
                      }}</strong
                      ><span>{{
                        mobileRole === "member"
                          ? "停车权益与车牌管理"
                          : "财务及运营联系人"
                      }}</span>
                    </div>
                    <ChevronDown :size="14" />
                  </button>
                  <button @click="openMobileInfo('support')">
                    <CircleHelp :size="17" />
                    <div>
                      <strong>帮助与客服</strong><span>常见问题与在线反馈</span>
                    </div>
                    <ChevronDown :size="14" />
                  </button>
                </div>
                <div class="mobile-version">渭南奥莱运营服务 · V1.0</div>
              </template>
            </main>
            <nav class="mobile-tabbar">
              <button
                :class="{ active: mobileTab === 'home' }"
                @click="mobileTab = 'home'"
              >
                <LayoutDashboard :size="18" /><span>首页</span></button
              ><button
                :class="{ active: mobileTab === 'benefit' }"
                @click="mobileTab = 'benefit'"
              >
                <Ticket :size="18" /><span>{{
                  mobileRole === "member" ? "优惠权益" : "账单服务"
                }}</span></button
              ><button
                :class="{ active: mobileTab === 'message' }"
                @click="mobileTab = 'message'"
              >
                <div class="tab-icon-wrap">
                  <MessageSquare :size="18" />
                  <i v-if="mobileUnreadCount">{{ mobileUnreadCount }}</i>
                </div>
                <span>消息</span></button
              ><button
                :class="{ active: mobileTab === 'mine' }"
                @click="mobileTab = 'mine'"
              >
                <UserRound :size="18" /><span>我的</span>
              </button>
            </nav>
          </div>
        </div>
      </div></transition
    >

    <transition name="drawer"
      ><aside v-if="showAlertDrawer" class="alert-drawer">
        <div class="drawer-header">
          <div><span>业务提醒</span><strong>待处理事项</strong></div>
          <button class="icon-button" @click="showAlertDrawer = false">
            <X :size="18" />
          </button>
        </div>
        <div class="drawer-count">
          <strong>{{ alertsRead ? 0 : lowStockCount + 5 }}</strong
          ><span>项待处理</span>
        </div>
        <div class="drawer-list">
          <button
            @click="
              openSection('inventory');
              showAlertDrawer = false;
            "
          >
            <div class="alert-icon danger"><Box :size="16" /></div>
            <div>
              <strong>库存预警</strong
              ><span>{{ lowStockCount }} 个商品需要关注</span>
            </div>
            <ChevronDown :size="15" /></button
          ><button
            @click="
              openSection('merchants');
              showAlertDrawer = false;
            "
          >
            <div class="alert-icon warning"><FileCheck2 :size="16" /></div>
            <div>
              <strong>合同到期</strong><span>2 份合同 30 天内到期</span>
            </div>
            <ChevronDown :size="15" /></button
          ><button
            @click="
              openSection('operations');
              showAlertDrawer = false;
            "
          >
            <div class="alert-icon info"><Wrench :size="16" /></div>
            <div>
              <strong>物业工单</strong
              ><span>{{ activePropertyTicketCount }} 个工单未闭环</span>
            </div>
            <ChevronDown :size="15" />
          </button>
        </div>
        <div class="drawer-footer">
          <button class="ghost-button" @click="showAlertDrawer = false">
            稍后处理</button
          ><button
            class="primary-button"
            @click="
              alertsRead = true;
              showAlertDrawer = false;
              notify('业务提醒已全部标记为已读');
            "
          >
            全部标记已读
          </button>
        </div>
      </aside></transition
    >

    <el-dialog v-model="showAddProduct" title="新建商品档案" width="480px"
      ><div class="dialog-form">
        <label
          >商品名称<input
            v-model="newProduct.name"
            placeholder="例如：轻量跑鞋" /></label
        ><label
          >品牌<input
            v-model="newProduct.brand"
            placeholder="例如：Nike" /></label
        ><label
          >品类<select v-model="newProduct.category">
            <option>运动鞋</option>
            <option>服饰</option>
            <option>箱包</option>
            <option>户外</option>
          </select></label
        >
        <div class="form-two">
          <label
            >初始库存<input
              v-model.number="newProduct.stock"
              type="number"
              min="0" /></label
          ><label
            >销售价<input
              v-model.number="newProduct.price"
              type="number"
              min="0"
          /></label>
        </div>
      </div>
      <template #footer
        ><button class="ghost-button" @click="showAddProduct = false">
          取消</button
        ><button class="primary-button" @click="addProduct">
          创建商品
        </button></template
      ></el-dialog
    >
    <el-dialog
      v-if="showProductDetail"
      v-model="productDialogVisible"
      title="商品详情"
      width="480px"
    >
      <div class="detail-hero">
        <div class="product-thumb large">
          {{ showProductDetail.category.slice(0, 1) }}
        </div>
        <div>
          <strong>{{ showProductDetail.name }}</strong>
          <span
            >{{ showProductDetail.brand }} · {{ showProductDetail.sku }}</span
          >
        </div>
        <span
          class="status-tag"
          :class="showProductDetail.status === '正常' ? 'success' : 'warning'"
          >{{ showProductDetail.status }}</span
        >
      </div>
      <div class="detail-grid">
        <div>
          <span>当前库存</span><strong>{{ showProductDetail.stock }} 件</strong>
        </div>
        <div>
          <span>库存库龄</span><strong>{{ showProductDetail.age }} 天</strong>
        </div>
        <div>
          <span>成本价</span><strong>¥ {{ showProductDetail.cost }}</strong>
        </div>
        <div>
          <span>销售价</span><strong>¥ {{ showProductDetail.price }}</strong>
        </div>
      </div>
      <template #footer>
        <button class="ghost-button" @click="showProductDetail = null">
          关闭
        </button>
        <button
          class="primary-button"
          @click="adjustProductStock(showProductDetail)"
        >
          <SlidersHorizontal :size="16" />调整库存
        </button>
      </template>
    </el-dialog>
    <el-dialog v-model="showNewMerchant" title="新增商户" width="480px">
      <div class="dialog-form">
        <label
          >商户名称<input
            v-model="newMerchant.name"
            placeholder="例如：北境户外陕西店"
        /></label>
        <label
          >品牌<input v-model="newMerchant.brand" placeholder="例如：北境户外"
        /></label>
        <div class="form-two">
          <label
            >铺位<input v-model="newMerchant.floor" placeholder="例如：2F-B15"
          /></label>
          <label
            >面积<input v-model.number="newMerchant.area" type="number" min="1"
          /></label>
        </div>
      </div>
      <template #footer>
        <button class="ghost-button" @click="showNewMerchant = false">
          取消
        </button>
        <button class="primary-button" @click="addMerchant">
          <Plus :size="16" />创建商户
        </button>
      </template>
    </el-dialog>
    <el-dialog v-model="showActivityDialog" title="创建会员活动" width="480px">
      <div class="dialog-form">
        <label
          >活动名称<input
            v-model="newActivity.name"
            placeholder="例如：周末会员专享日"
        /></label>
        <label>活动日期<input v-model="newActivity.date" type="date" /></label>
        <label
          >目标人群<select v-model="newActivity.audience">
            <option>全部会员</option>
            <option>金卡及以上</option>
            <option>沉睡会员</option>
          </select></label
        >
      </div>
      <template #footer>
        <button class="ghost-button" @click="showActivityDialog = false">
          取消
        </button>
        <button class="primary-button" @click="createActivity">
          <Plus :size="16" />创建活动
        </button>
      </template>
    </el-dialog>
    <el-dialog v-model="showHelpDialog" title="帮助中心" width="560px">
      <div class="help-panel">
        <div class="help-hero">
          <CircleHelp :size="20" />
          <div>
            <strong>渭南奥莱运营手册</strong
            ><span>快速了解常用业务操作和演示路径</span>
          </div>
        </div>
        <div class="help-list">
          <button
            @click="
              openSection('inventory');
              showHelpDialog = false;
            "
          >
            <strong>如何处理库存预警？</strong
            ><span>进入自营货品，点击“处理”即可更新库存状态。</span
            ><ExternalLink :size="14" />
          </button>
          <button
            @click="
              openSection('operations');
              showHelpDialog = false;
            "
          >
            <strong>如何推进物业工单？</strong
            ><span>进入运营协同 · 物业运维，按派单、完成、验收推进。</span
            ><ExternalLink :size="14" />
          </button>
          <button
            @click="
              openMobile('member');
              showHelpDialog = false;
            "
          >
            <strong>如何查看移动端？</strong
            ><span>打开移动端演示，可切换会员端和商户端。</span
            ><ExternalLink :size="14" />
          </button>
        </div>
      </div>
    </el-dialog>
    <el-dialog v-model="showSettingsDialog" title="系统设置" width="480px">
      <div class="settings-panel">
        <div>
          <div>
            <strong>经营提醒</strong><span>库存、合同和物业工单提醒</span>
          </div>
          <button
            class="toggle-button"
            :class="{ active: settingsState.reminders }"
            @click="settingsState.reminders = !settingsState.reminders"
          >
            {{ settingsState.reminders ? "已开启" : "已关闭" }}
          </button>
        </div>
        <div>
          <div>
            <strong>日报推送</strong><span>每天 18:00 发送经营日报</span>
          </div>
          <button
            class="toggle-button"
            :class="{ active: settingsState.dailyPush }"
            @click="settingsState.dailyPush = !settingsState.dailyPush"
          >
            {{ settingsState.dailyPush ? "已开启" : "设置" }}
          </button>
        </div>
        <div>
          <div>
            <strong>数据刷新频率</strong
            ><span
              >列表数据每 {{ settingsState.refreshMinutes }} 分钟自动刷新</span
            >
          </div>
          <button
            class="toggle-button"
            @click="
              settingsState.refreshMinutes =
                settingsState.refreshMinutes === 1 ? 5 : 1
            "
          >
            {{ settingsState.refreshMinutes }} 分钟
          </button>
        </div>
      </div>
    </el-dialog>
    <el-dialog
      v-model="mobileInfoDialogVisible"
      :title="mobileInfoTitle"
      width="480px"
    >
      <div class="mobile-info-panel">
        <template v-if="mobileInfoKind === 'points'"
          ><div class="info-summary">
            <strong>2,860</strong><span>当前可用积分</span>
          </div>
          <div class="info-list">
            <div>
              <strong>+286</strong><span>昨日消费 · 运动集合店</span
              ><small>今天 09:18</small>
            </div>
            <div>
              <strong>+120</strong><span>签到奖励</span
              ><small>昨天 08:06</small>
            </div>
            <div>
              <strong>-500</strong><span>兑换停车权益</span><small>08-24</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'receipts'"
          ><div class="info-list">
            <div>
              <strong>¥ 1,280</strong><span>运动集合店 · 轻量跑鞋</span
              ><small>今天 11:24 · 微信支付</small>
            </div>
            <div>
              <strong>¥ 860</strong><span>FILA 生活方式 · 休闲鞋</span
              ><small>昨天 16:32 · 支付宝</small>
            </div>
            <div>
              <strong>¥ 420</strong><span>户外生活馆 · 冲锋衣</span
              ><small>08-24 · 银联</small>
            </div>
          </div></template
        >
        <template
          v-else-if="
            mobileInfoKind === 'activity' || mobileInfoKind === 'recommendation'
          "
          ><div class="info-banner">
            <Tag :size="18" />
            <div>
              <strong>{{
                mobileInfoKind === "activity"
                  ? "换季清仓活动"
                  : "运动专区限时 5 折"
              }}</strong
              ><span>{{
                mobileInfoKind === "activity"
                  ? "运动、服饰专区低至 5 折，金卡会员再享双倍积分。"
                  : "会员专享 · 还剩 2 天"
              }}</span>
            </div>
          </div>
          <div class="info-list">
            <div>
              <strong>08.31</strong><span>活动截止日期</span
              ><small>渭南奥莱 1F-2F</small>
            </div>
            <div>
              <strong>2 倍</strong><span>金卡会员积分</span
              ><small>到店扫码即可参与</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'merchantSales'"
          ><div class="info-summary">
            <strong>¥ 426,800</strong><span>本月销售额</span>
          </div>
          <div class="info-list">
            <div>
              <strong>+12.8%</strong><span>较上月同期</span
              ><small>本月累计 1,286 笔交易</small>
            </div>
            <div>
              <strong>¥ 332</strong><span>平均客单价</span
              ><small>运动鞋贡献 48%</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'merchantActivity'"
          ><div class="info-list">
            <div>
              <strong>周末特卖</strong><span>已报名 · 物料周五送达</span
              ><small>08-30 至 08-31</small>
            </div>
            <div>
              <strong>会员日</strong><span>进行中 · 已报名</span
              ><small>09-01</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'merchantRepair'"
          ><div class="info-banner">
            <Wrench :size="18" />
            <div>
              <strong>提交报修报备</strong
              ><span>填写铺位和问题描述，物业将于 10 分钟内响应。</span>
            </div>
          </div>
          <button
            class="primary-button info-action"
            @click="
              mobileInfoDialogVisible = false;
              showNewTicket = true;
              operationModule = 'property';
            "
          >
            提交物业工单
          </button></template
        >
        <template v-else-if="mobileInfoKind === 'bill'"
          ><div class="info-list">
            <div>
              <strong>8 月经营对账单</strong
              ><span
                >¥ 38,412 ·
                {{ mobileBillConfirmed ? "已确认" : "待确认" }}</span
              ><small>账期 08/01-08/31</small>
            </div>
            <div>
              <strong>7 月经营对账单</strong><span>¥ 36,860 · 已结清</span
              ><small>已完成开票</small>
            </div>
            <div>
              <strong>6 月经营对账单</strong><span>¥ 35,240 · 已结清</span
              ><small>已完成开票</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'invoice'"
          ><div class="info-banner">
            <FileCheck2 :size="18" />
            <div>
              <strong>电子发票申请</strong
              ><span>选择已结清账单后提交开票信息。</span>
            </div>
          </div>
          <label class="info-field">抬头名称<input value="运动集合店" /></label
          ><button
            class="primary-button info-action"
            @click="
              mobileInfoDialogVisible = false;
              notify('电子发票申请已提交');
            "
          >
            提交申请
          </button></template
        >
        <template v-else-if="mobileInfoKind === 'profile'"
          ><div class="dialog-form">
            <label
              >名称<input
                :value="
                  mobileRole === 'member' ? '王女士' : '运动集合店'
                " /></label
            ><label
              >联系方式<input
                :value="
                  mobileRole === 'member' ? '138****8260' : '0913-2858166'
                " /></label
            ><label
              >常用地址<input
                :value="mobileRole === 'member' ? '渭南市临渭区' : '1F-A12'"
            /></label></div
        ></template>
        <template v-else-if="mobileInfoKind === 'security'"
          ><div class="settings-panel">
            <div>
              <div><strong>登录手机号</strong><span>138****8260</span></div>
              <button
                class="toggle-button"
                @click="notify('手机号修改入口已打开')"
              >
                修改
              </button>
            </div>
            <div>
              <div>
                <strong>消息提醒</strong><span>权益、账单和活动通知</span>
              </div>
              <button
                class="toggle-button active"
                @click="notify('消息提醒已开启')"
              >
                已开启
              </button>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'contact'"
          ><div class="info-list">
            <div>
              <strong>李楠</strong><span>财务联系人 · 0913-2858166</span
              ><small>负责账单与开票</small>
            </div>
            <div>
              <strong>王璐</strong><span>运营联系人 · 0913-2858120</span
              ><small>负责活动与物业</small>
            </div>
          </div></template
        >
        <template v-else-if="mobileInfoKind === 'support'"
          ><div class="help-list">
            <button @click="notify('常见问题已打开')">
              <strong>常见问题</strong><span>账单、停车、优惠券使用说明</span
              ><ExternalLink :size="14" /></button
            ><button @click="notify('在线客服将在 5 分钟内响应')">
              <strong>在线客服</strong><span>工作日 09:00-18:00</span
              ><ExternalLink :size="14" />
            </button></div
        ></template>
        <template v-else-if="mobileInfoKind === 'parking'"
          ><div class="info-summary">
            <strong>2 小时</strong><span>今日剩余免费停车</span>
          </div>
          <div class="info-list">
            <div>
              <strong>陕A·6Q82K</strong><span>会员车辆 · 默认车牌</span
              ><small>今日已抵扣 42 分钟</small>
            </div>
            <div>
              <strong>权益说明</strong><span>金卡会员每日 2 小时免费停车</span
              ><small>超出后按停车场标准计费</small>
            </div>
          </div></template
        >
      </div>
    </el-dialog>
    <el-dialog
      v-if="showMerchantDetail"
      v-model="merchantDialogVisible"
      title="商户经营详情"
      width="560px"
      ><div class="detail-hero">
        <div class="brand-avatar large">
          {{ showMerchantDetail.brand.slice(0, 1) }}
        </div>
        <div>
          <strong>{{ showMerchantDetail.name }}</strong
          ><span
            >{{ showMerchantDetail.brand }} · {{ showMerchantDetail.floor }} ·
            {{ showMerchantDetail.area }}㎡</span
          >
        </div>
        <span class="status-tag success">{{ showMerchantDetail.status }}</span>
      </div>
      <div class="detail-grid">
        <div>
          <span>结算模式</span><strong>{{ showMerchantDetail.model }}</strong>
        </div>
        <div>
          <span>本月销售额</span
          ><strong>¥ {{ showMerchantDetail.sales.toLocaleString() }}</strong>
        </div>
        <div>
          <span>本月应收账单</span
          ><strong>¥ {{ showMerchantDetail.bill.toLocaleString() }}</strong>
        </div>
        <div>
          <span>坪效</span
          ><strong
            >¥
            {{
              Math.round(
                showMerchantDetail.sales / showMerchantDetail.area,
              ).toLocaleString()
            }}
            /㎡</strong
          >
        </div>
      </div>
      <div
        class="detail-notice"
        :class="showMerchantDetail.status === '欠费预警' ? 'danger-notice' : ''"
      >
        <FileCheck2 :size="17" />
        <div>
          <strong>{{
            showMerchantDetail.status === "欠费预警"
              ? "该商户存在待缴账单"
              : "8 月对账单已生成"
          }}</strong
          ><span>账期 08/01-08/31 · 支持线上确认与下载</span>
        </div>
      </div>
      <template #footer
        ><button class="ghost-button" @click="showMerchantDetail = null">
          关闭</button
        ><button
          class="primary-button"
          @click="
            confirmBill(showMerchantDetail);
            showMerchantDetail = null;
          "
        >
          <Check :size="16" />确认对账单
        </button></template
      ></el-dialog
    >
    <el-dialog v-model="showNewTicket" title="新建物业工单" width="480px">
      <div class="dialog-form">
        <label
          >工单标题<input
            v-model="newTicket.title"
            placeholder="例如：1F-A12 门头灯不亮"
        /></label>
        <label
          >位置<input v-model="newTicket.location" placeholder="例如：1F-A12"
        /></label>
        <label
          >发起方<select v-model="newTicket.requester">
            <option>商户报修</option>
            <option>物业巡检</option>
            <option>运营值班</option>
          </select></label
        >
      </div>
      <template #footer
        ><button class="ghost-button" @click="showNewTicket = false">
          取消</button
        ><button class="primary-button" @click="createPropertyTicket">
          创建工单
        </button></template
      >
    </el-dialog>
    <el-dialog
      v-if="showMemberDetail"
      v-model="memberDialogVisible"
      title="会员档案"
      width="520px"
      ><div class="member-detail-head">
        <div class="member-avatar large">
          {{ showMemberDetail.name.slice(0, 1) }}
        </div>
        <div>
          <strong>{{ showMemberDetail.name }}</strong
          ><span>{{ showMemberDetail.phone }} · {{ showMemberDetail.id }}</span>
        </div>
        <span class="level-tag 金">{{ showMemberDetail.level }}</span>
      </div>
      <div class="detail-grid">
        <div>
          <span>累计消费</span
          ><strong>¥ {{ showMemberDetail.spend.toLocaleString() }}</strong>
        </div>
        <div>
          <span>可用积分</span
          ><strong>{{ showMemberDetail.points.toLocaleString() }}</strong>
        </div>
        <div>
          <span>最近到访</span><strong>{{ showMemberDetail.lastVisit }}</strong>
        </div>
        <div>
          <span>核心标签</span><strong>{{ showMemberDetail.tag }}</strong>
        </div>
      </div>
      <div class="detail-notice">
        <Ticket :size="17" />
        <div>
          <strong>换季清仓券可发放</strong
          ><span>适用于运动、服饰、鞋帽等指定品类</span>
        </div>
      </div>
      <template #footer
        ><button class="ghost-button" @click="showMemberDetail = null">
          关闭</button
        ><button
          class="primary-button"
          @click="
            sendCoupon(showMemberDetail);
            showMemberDetail = null;
          "
        >
          <Ticket :size="16" />定向发券
        </button></template
      ></el-dialog
    >
  </div>
</template>
