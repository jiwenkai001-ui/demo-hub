import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Bell, Box, BriefcaseBusiness, CalendarDays, Check, ArrowLeft, ChevronDown, CircleHelp, CreditCard, Download, ExternalLink, FileCheck2, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, RefreshCcw, Search, Settings2, ShoppingBag, SlidersHorizontal, Smartphone, Store, Tag, Ticket, TrendingUp, UserRound, Users, WalletCards, Wrench, X, } from "lucide-vue-next";
import { defaultState, members as seedMembers, merchants as seedMerchants, products as seedProducts, salesTrend, } from "./mock";
const activeSection = ref("dashboard");
const mobileOpen = ref(false);
const mobileRole = ref("member");
const mobileTab = ref("home");
const mobileBillConfirmed = ref(false);
const operationModule = ref("overview");
const propertyFilter = ref("全部");
const showNewTicket = ref(false);
const newTicket = ref({ title: "", location: "", requester: "商户报修" });
const showProductDetail = ref(null);
const showNewMerchant = ref(false);
const newMerchant = ref({ name: "", brand: "", floor: "", area: 80 });
const showActivityDialog = ref(false);
const newActivity = ref({ name: "", date: "", audience: "全部会员" });
const showHelpDialog = ref(false);
const showSettingsDialog = ref(false);
const mobileInfoKind = ref(null);
const memberSegment = ref("all");
const trendMetric = ref("销售额");
const merchantPeriod = ref("本月账期");
const mobileMessageFilter = ref("全部");
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
const showMerchantDetail = ref(null);
const showMemberDetail = ref(null);
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
const mobileMessages = ref({
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
const leasingLeads = ref([
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
const cashierTransactions = ref([
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
const propertyTickets = ref([
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
const parkingSessions = ref([
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
const products = ref(seedProducts.map((item) => ({ ...item })));
const merchants = ref(seedMerchants.map((item) => ({ ...item })));
const memberList = ref(seedMembers.map((item) => ({ ...item })));
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
];
const pageTitle = computed(() => navItems.find((item) => item.id === activeSection.value)?.label ??
    "经营总览");
const filteredProducts = computed(() => products.value.filter((item) => {
    const keyword = inventorySearch.value.trim().toLowerCase();
    const matchKeyword = !keyword ||
        `${item.name}${item.brand}${item.sku}`.toLowerCase().includes(keyword);
    const matchFilter = inventoryFilter.value === "全部" || item.status === inventoryFilter.value;
    return matchKeyword && matchFilter;
}));
const filteredMerchants = computed(() => merchants.value.filter((item) => {
    const keyword = merchantSearch.value.trim().toLowerCase();
    return (!keyword ||
        `${item.name}${item.brand}${item.floor}`.toLowerCase().includes(keyword));
}));
const filteredMembers = computed(() => memberList.value.filter((item) => {
    const keyword = memberSearch.value.trim().toLowerCase();
    const matchKeyword = !keyword ||
        `${item.name}${item.phone}${item.tag}`.toLowerCase().includes(keyword);
    const matchSegment = memberSegment.value === "all" ||
        (memberSegment.value === "dormant" && item.tag.includes("沉睡")) ||
        (memberSegment.value === "highValue" && item.spend >= 8000);
    return matchKeyword && matchSegment;
}));
const merchantDialogVisible = computed({
    get: () => Boolean(showMerchantDetail.value),
    set: (visible) => {
        if (!visible)
            showMerchantDetail.value = null;
    },
});
const memberDialogVisible = computed({
    get: () => Boolean(showMemberDetail.value),
    set: (visible) => {
        if (!visible)
            showMemberDetail.value = null;
    },
});
const productDialogVisible = computed({
    get: () => Boolean(showProductDetail.value),
    set: (visible) => {
        if (!visible)
            showProductDetail.value = null;
    },
});
const mobileInfoDialogVisible = computed({
    get: () => Boolean(mobileInfoKind.value),
    set: (visible) => {
        if (!visible)
            mobileInfoKind.value = null;
    },
});
const inventoryValue = computed(() => products.value.reduce((sum, item) => sum + item.stock * item.cost, 0));
const lowStockCount = computed(() => products.value.filter((item) => item.status !== "正常").length);
const mobilePageTitle = computed(() => {
    const titles = {
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
const mobileUnreadCount = computed(() => mobileMessages.value[mobileRole.value].filter((message) => !message.read)
    .length);
const filteredPropertyTickets = computed(() => propertyTickets.value.filter((ticket) => propertyFilter.value === "全部" || ticket.status === propertyFilter.value));
const operationModuleMeta = {
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
const operationModuleTitle = computed(() => operationModule.value === "overview"
    ? "运营协同"
    : operationModuleMeta[operationModule.value].title);
const mobileInfoTitle = computed(() => {
    const titles = {
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
const activeOperationMeta = computed(() => operationModule.value === "overview"
    ? null
    : operationModuleMeta[operationModule.value]);
const pendingRefundCount = computed(() => cashierTransactions.value.filter((item) => item.status === "退款待审")
    .length);
const activePropertyTicketCount = computed(() => propertyTickets.value.filter((item) => item.status !== "已完成").length);
const parkingIssueCount = computed(() => parkingSessions.value.filter((item) => item.status === "待处理").length);
const filteredMobileMessages = computed(() => {
    const messages = mobileMessages.value[mobileRole.value];
    if (mobileMessageFilter.value === "全部")
        return messages;
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
function notify(message) {
    toastMessage.value = message;
    ElMessage({ message, type: "success", duration: 2200 });
}
function openMobileInfo(kind) {
    mobileInfoKind.value = kind;
}
function downloadCsv(filename, headers, rows) {
    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
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
    downloadCsv("渭南奥莱-经营日报.csv", ["指标", "数值", "环比"], [
        ["今日总销售额", "186420", "+12.8%"],
        ["自营专区毛利", "42860", "+8.4%"],
        ["商户收缴率", "92.6%", "+2.1%"],
        ["会员活跃人数", "8624", "+18.2%"],
    ]);
}
function downloadMerchantReport() {
    downloadCsv("渭南奥莱-租赁报表.csv", ["商户", "铺位", "本月销售", "应收账单", "状态"], merchants.value.map((item) => [
        item.name,
        item.floor,
        String(item.sales),
        String(item.bill),
        item.status,
    ]));
}
function downloadMemberReport() {
    downloadCsv("渭南奥莱-会员月报.csv", ["会员", "等级", "积分", "累计消费", "最近到访", "标签"], memberList.value.map((item) => [
        item.name,
        item.level,
        String(item.points),
        String(item.spend),
        item.lastVisit,
        item.tag,
    ]));
}
function downloadParkingReport() {
    downloadCsv("渭南奥莱-停车日报.csv", ["车牌号", "类型", "进场时间", "停车时长", "应收金额", "状态"], parkingSessions.value.map((item) => [
        item.plate,
        item.type,
        item.entry,
        item.duration,
        item.fee ? String(item.fee) : "免费",
        item.status,
    ]));
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
        stage: item.id === "LEAD-2408"
            ? "方案沟通"
            : item.id === "LEAD-2407"
                ? "初步接洽"
                : "合同审批",
        updated: item.id === "LEAD-2408"
            ? "今天 10:32"
            : item.id === "LEAD-2407"
                ? "昨天 16:20"
                : "08-24 14:08",
    }));
    cashierTransactions.value = cashierTransactions.value.map((item) => ({
        ...item,
        status: item.id === "REF-0826-0031"
            ? "退款待审"
            : item.id === "REF-0826-0029"
                ? "已退款"
                : "已完成",
    }));
    propertyTickets.value = propertyTickets.value
        .filter((item) => /^WO-0826-01[1-4]$/.test(item.id))
        .map((item) => ({
        ...item,
        status: item.id === "WO-0826-014"
            ? "处理中"
            : item.id === "WO-0826-013"
                ? "待派单"
                : item.id === "WO-0826-012"
                    ? "待验收"
                    : "已完成",
        owner: item.id === "WO-0826-013"
            ? "未分配"
            : item.id === "WO-0826-014"
                ? "张师傅"
                : item.id === "WO-0826-012"
                    ? "王师傅"
                    : "赵师傅",
    }));
    parkingSessions.value = parkingSessions.value.map((item) => ({
        ...item,
        status: item.id === "P-0826-2468"
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
    const billMessage = mobileMessages.value.merchant.find((message) => message.id === "merchant-1");
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
function openSection(section) {
    activeSection.value = section;
    if (section !== "operations")
        operationModule.value = "overview";
}
function openOperation(module) {
    openSection("operations");
    operationModule.value = module;
}
function closeOperationModule() {
    operationModule.value = "overview";
}
function handleAdjustment(product) {
    ElMessageBox.confirm(`确认将「${product.name}」标记为已处理并重新设置补货提醒吗？`, "处理库存预警", {
        confirmButtonText: "确认处理",
        cancelButtonText: "稍后处理",
        type: "warning",
    })
        .then(() => {
        product.status = "正常";
        notify(`${product.name} 的库存预警已处理`);
    })
        .catch(() => undefined);
}
function adjustProductStock(product) {
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
    if (!newMerchant.value.name.trim() ||
        !newMerchant.value.brand.trim() ||
        !newMerchant.value.floor.trim()) {
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
    notify(`${newActivity.value.name} 已创建，活动将于 ${newActivity.value.date} 开始`);
    newActivity.value = { name: "", date: "", audience: "全部会员" };
}
function confirmBill(merchant) {
    merchant.status = "正常经营";
    notify(`${merchant.name} 的月度对账单已确认`);
}
function advanceLead(lead) {
    const nextStage = {
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
function reviewRefund(transaction) {
    if (transaction.status !== "退款待审") {
        notify(`${transaction.id} 当前无需审核`);
        return;
    }
    transaction.status = "已退款";
    notify(`${transaction.id} 退款审核通过`);
}
function updatePropertyTicket(ticket) {
    if (ticket.status === "待派单") {
        ticket.status = "处理中";
        ticket.owner = "张师傅";
        notify(`${ticket.title} 已派给张师傅`);
    }
    else if (ticket.status === "处理中") {
        ticket.status = "待验收";
        notify(`${ticket.title} 已处理完成，等待验收`);
    }
    else if (ticket.status === "待验收") {
        ticket.status = "已完成";
        notify(`${ticket.title} 已验收关闭`);
    }
    else {
        notify(`${ticket.title} 已归档`);
    }
}
function resolveParking(session) {
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
    const billMessage = mobileMessages.value.merchant.find((message) => message.id === "merchant-1");
    if (billMessage) {
        billMessage.title = "8 月对账单已确认";
        billMessage.description =
            "本期账单已完成核对，后续可在账单服务中申请开票。";
        billMessage.read = true;
    }
    notify("8 月对账单确认成功");
}
function sendCoupon(member) {
    notify(`已向 ${member.name} 定向发放换季清仓券`);
}
function claimCoupon(coupon) {
    if (coupon.claimed) {
        notify(`${coupon.title}已在券包中`);
        return;
    }
    coupon.claimed = true;
    notify(`${coupon.title}领取成功`);
}
function readMobileMessage(message) {
    message.read = true;
    notify(`已查看：${message.title}`);
}
function readAllMobileMessages() {
    mobileMessages.value[mobileRole.value].forEach((message) => {
        message.read = true;
    });
    notify("消息已全部标记为已读");
}
function openMobile(role = "member") {
    mobileRole.value = role;
    mobileTab.value = "home";
    mobileMessageFilter.value = "全部";
    mobileOpen.value = true;
}
function switchMobileRole(role) {
    mobileRole.value = role;
    mobileMessageFilter.value = "全部";
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-shell" },
});
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "side-nav" },
});
/** @type {__VLS_StyleScopedClasses['side-nav']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand-block" },
});
/** @type {__VLS_StyleScopedClasses['brand-block']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand-mark" },
});
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "workspace-select" },
});
/** @type {__VLS_StyleScopedClasses['workspace-select']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "workspace-icon" },
});
/** @type {__VLS_StyleScopedClasses['workspace-icon']} */ ;
let __VLS_0;
/** @ts-ignore @type { | typeof __VLS_components.Store} */
Store;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    size: (16),
}));
const __VLS_2 = __VLS_1({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
let __VLS_5;
/** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
ChevronDown;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    size: (14),
}));
const __VLS_7 = __VLS_6({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
    ...{ class: "nav-list" },
    'aria-label': "主导航",
});
/** @type {__VLS_StyleScopedClasses['nav-list']} */ ;
for (const [item] of __VLS_vFor((__VLS_ctx.navItems))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.openSection(item.id));
                // @ts-ignore
                [navItems, openSection,];
            } },
        key: (item.id),
        ...{ class: "nav-item" },
        ...{ class: ({ active: __VLS_ctx.activeSection === item.id }) },
    });
    /** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    const __VLS_10 = (item.icon);
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        size: (17),
    }));
    const __VLS_12 = __VLS_11({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (item.label);
    if (item.id === 'inventory' && __VLS_ctx.lowStockCount) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "nav-badge" },
        });
        /** @type {__VLS_StyleScopedClasses['nav-badge']} */ ;
        (__VLS_ctx.lowStockCount);
    }
    // @ts-ignore
    [activeSection, lowStockCount, lowStockCount,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "nav-section-label" },
});
/** @type {__VLS_StyleScopedClasses['nav-section-label']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.openMobile('member'));
            // @ts-ignore
            [openMobile,];
        } },
    ...{ class: "nav-item" },
});
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
let __VLS_15;
/** @ts-ignore @type { | typeof __VLS_components.Smartphone} */
Smartphone;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    size: (17),
}));
const __VLS_17 = __VLS_16({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showHelpDialog = true);
            // @ts-ignore
            [showHelpDialog,];
        } },
    ...{ class: "nav-item" },
});
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
let __VLS_20;
/** @ts-ignore @type { | typeof __VLS_components.CircleHelp} */
CircleHelp;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    size: (17),
}));
const __VLS_22 = __VLS_21({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "side-bottom" },
});
/** @type {__VLS_StyleScopedClasses['side-bottom']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "side-tip" },
});
/** @type {__VLS_StyleScopedClasses['side-tip']} */ ;
let __VLS_25;
/** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
TrendingUp;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    size: (16),
}));
const __VLS_27 = __VLS_26({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showSettingsDialog = true);
            // @ts-ignore
            [showSettingsDialog,];
        } },
    ...{ class: "nav-item" },
});
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
let __VLS_30;
/** @ts-ignore @type { | typeof __VLS_components.Settings2} */
Settings2;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
    size: (17),
}));
const __VLS_32 = __VLS_31({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "profile-row" },
});
/** @type {__VLS_StyleScopedClasses['profile-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "avatar" },
});
/** @type {__VLS_StyleScopedClasses['avatar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_35;
/** @ts-ignore @type { | typeof __VLS_components.MoreHorizontal} */
MoreHorizontal;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    size: (17),
}));
const __VLS_37 = __VLS_36({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "main-area" },
});
/** @type {__VLS_StyleScopedClasses['main-area']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "topbar" },
});
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mobile-menu-button" },
});
/** @type {__VLS_StyleScopedClasses['mobile-menu-button']} */ ;
let __VLS_40;
/** @ts-ignore @type { | typeof __VLS_components.Menu} */
Menu;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    size: (19),
}));
const __VLS_42 = __VLS_41({
    size: (19),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "breadcrumb" },
});
/** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.pageTitle);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-actions" },
});
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.resetDemo) },
    ...{ class: "icon-button" },
    title: "刷新演示数据",
});
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
let __VLS_45;
/** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
RefreshCcw;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    size: (17),
}));
const __VLS_47 = __VLS_46({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.showAlertDrawer = true);
            // @ts-ignore
            [pageTitle, resetDemo, showAlertDrawer,];
        } },
    ...{ class: "icon-button notification-button" },
    title: "通知",
});
/** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-button']} */ ;
let __VLS_50;
/** @ts-ignore @type { | typeof __VLS_components.Bell} */
Bell;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    size: (17),
}));
const __VLS_52 = __VLS_51({
    size: (17),
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
if (!__VLS_ctx.alertsRead) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
}
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.openMobile('member'));
            // @ts-ignore
            [openMobile, alertsRead,];
        } },
    ...{ class: "mobile-entry" },
});
/** @type {__VLS_StyleScopedClasses['mobile-entry']} */ ;
let __VLS_55;
/** @ts-ignore @type { | typeof __VLS_components.Smartphone} */
Smartphone;
// @ts-ignore
const __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
    size: (16),
}));
const __VLS_57 = __VLS_56({
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_56));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "top-avatar" },
});
/** @type {__VLS_StyleScopedClasses['top-avatar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "content-area" },
});
/** @type {__VLS_StyleScopedClasses['content-area']} */ ;
if (__VLS_ctx.activeSection === 'dashboard') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "page-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-heading-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "page-description" },
    });
    /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadDailyReport) },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_60;
    /** @ts-ignore @type { | typeof __VLS_components.Download} */
    Download;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        size: (16),
    }));
    const __VLS_62 = __VLS_61({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('inventory'));
                // @ts-ignore
                [openSection, activeSection, downloadDailyReport,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_65;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
        size: (16),
    }));
    const __VLS_67 = __VLS_66({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "metric-card accent-card" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['accent-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-label" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_70;
    /** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
    TrendingUp;
    // @ts-ignore
    const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        size: (16),
    }));
    const __VLS_72 = __VLS_71({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_71));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-foot" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mini-bars" },
    });
    /** @type {__VLS_StyleScopedClasses['mini-bars']} */ ;
    for (const [height, index] of __VLS_vFor(([32, 46, 39, 57, 48, 62, 76]))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            key: (index),
            ...{ style: ({ height: `${height}%` }) },
        });
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "metric-card" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-label" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_75;
    /** @ts-ignore @type { | typeof __VLS_components.ShoppingBag} */
    ShoppingBag;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        size: (16),
    }));
    const __VLS_77 = __VLS_76({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-foot" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-progress" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-progress']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "metric-card" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-label" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_80;
    /** @ts-ignore @type { | typeof __VLS_components.WalletCards} */
    WalletCards;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        size: (16),
    }));
    const __VLS_82 = __VLS_81({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-foot" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-progress green" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-progress']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "metric-card" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-label" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_85;
    /** @ts-ignore @type { | typeof __VLS_components.Users} */
    Users;
    // @ts-ignore
    const __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        size: (16),
    }));
    const __VLS_87 = __VLS_86({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_86));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-foot" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-foot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "metric-progress blue" },
    });
    /** @type {__VLS_StyleScopedClasses['metric-progress']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dashboard-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card trend-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['trend-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.trendMetric = __VLS_ctx.trendMetric === '销售额' ? '客流' : '销售额');
                // @ts-ignore
                [trendMetric, trendMetric,];
            } },
        ...{ class: "select-button" },
    });
    /** @type {__VLS_StyleScopedClasses['select-button']} */ ;
    (__VLS_ctx.trendMetric);
    let __VLS_90;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        size: (14),
    }));
    const __VLS_92 = __VLS_91({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_91));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "trend-total" },
    });
    /** @type {__VLS_StyleScopedClasses['trend-total']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.trendMetric === "销售额" ? "¥ 1,128,640" : "86,420 人次");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-area" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-area']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-y" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-y']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-body" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-body']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "chart-grid-lines" },
    });
    /** @type {__VLS_StyleScopedClasses['chart-grid-lines']} */ ;
    for (const [line] of __VLS_vFor((5))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            key: (line),
        });
        // @ts-ignore
        [trendMetric, trendMetric,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "bar-row" },
    });
    /** @type {__VLS_StyleScopedClasses['bar-row']} */ ;
    for (const [value, index] of __VLS_vFor((__VLS_ctx.salesTrend))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (index),
            ...{ class: "bar-wrap" },
        });
        /** @type {__VLS_StyleScopedClasses['bar-wrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bar-value" },
        });
        /** @type {__VLS_StyleScopedClasses['bar-value']} */ ;
        (value * 2);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "bar" },
            ...{ style: ({ height: `${value}%` }) },
        });
        /** @type {__VLS_StyleScopedClasses['bar']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        ([
            "周四",
            "周五",
            "周六",
            "周日",
            "周一",
            "周二",
            "今日",
        ][index]);
        // @ts-ignore
        [salesTrend,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card alert-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.showAlertDrawer = true);
                // @ts-ignore
                [showAlertDrawer,];
            } },
        ...{ class: "link-button" },
    });
    /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
    let __VLS_95;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
        size: (14),
    }));
    const __VLS_97 = __VLS_96({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_96));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-list" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('inventory'));
                // @ts-ignore
                [openSection,];
            } },
        ...{ class: "alert-row" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon danger" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    let __VLS_100;
    /** @ts-ignore @type { | typeof __VLS_components.Box} */
    Box;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
        size: (16),
    }));
    const __VLS_102 = __VLS_101({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_105;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({
        size: (15),
    }));
    const __VLS_107 = __VLS_106({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('merchants'));
                // @ts-ignore
                [openSection,];
            } },
        ...{ class: "alert-row" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon warning" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    let __VLS_110;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
        size: (16),
    }));
    const __VLS_112 = __VLS_111({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_111));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_115;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
        size: (15),
    }));
    const __VLS_117 = __VLS_116({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_116));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('members'));
                // @ts-ignore
                [openSection,];
            } },
        ...{ class: "alert-row" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon info" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    let __VLS_120;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({
        size: (16),
    }));
    const __VLS_122 = __VLS_121({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_125;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        size: (15),
    }));
    const __VLS_127 = __VLS_126({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_126));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('operations'));
                // @ts-ignore
                [openSection,];
            } },
        ...{ class: "alert-row" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon neutral" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['neutral']} */ ;
    let __VLS_130;
    /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
    Wrench;
    // @ts-ignore
    const __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
        size: (16),
    }));
    const __VLS_132 = __VLS_131({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_131));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.activePropertyTicketCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_135;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135({
        size: (15),
    }));
    const __VLS_137 = __VLS_136({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_136));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dashboard-grid lower-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['lower-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('merchants'));
                // @ts-ignore
                [openSection, activePropertyTicketCount,];
            } },
        ...{ class: "link-button" },
    });
    /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
    let __VLS_140;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
        size: (14),
    }));
    const __VLS_142 = __VLS_141({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "rank-list" },
    });
    /** @type {__VLS_StyleScopedClasses['rank-list']} */ ;
    for (const [merchant, index] of __VLS_vFor((__VLS_ctx.merchants.slice(0, 4)))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (merchant.id),
            ...{ class: "rank-row" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "rank-number" },
            ...{ class: (`rank-${index + 1}`) },
        });
        /** @type {__VLS_StyleScopedClasses['rank-number']} */ ;
        (String(index + 1).padStart(2, "0"));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rank-brand" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-brand']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "brand-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['brand-avatar']} */ ;
        (merchant.brand.slice(0, 1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (merchant.floor);
        (merchant.model);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "rank-sales" },
        });
        /** @type {__VLS_StyleScopedClasses['rank-sales']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.sales.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (Math.round(merchant.sales / merchant.area).toLocaleString());
        // @ts-ignore
        [merchants,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "card-heading" },
    });
    /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.openSection('members'));
                // @ts-ignore
                [openSection,];
            } },
        ...{ class: "link-button" },
    });
    /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
    let __VLS_145;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145({
        size: (14),
    }));
    const __VLS_147 = __VLS_146({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_146));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-highlight" },
    });
    /** @type {__VLS_StyleScopedClasses['member-highlight']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "donut" },
    });
    /** @type {__VLS_StyleScopedClasses['donut']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "legend" },
    });
    /** @type {__VLS_StyleScopedClasses['legend']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "dot orange" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "dot pale" },
    });
    /** @type {__VLS_StyleScopedClasses['dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['pale']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-stats" },
    });
    /** @type {__VLS_StyleScopedClasses['member-stats']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
else if (__VLS_ctx.activeSection === 'inventory') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "page-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-heading-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "page-description" },
    });
    /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                return (__VLS_ctx.showAlertDrawer = true);
                // @ts-ignore
                [activeSection, showAlertDrawer,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_150;
    /** @ts-ignore @type { | typeof __VLS_components.Bell} */
    Bell;
    // @ts-ignore
    const __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
        size: (16),
    }));
    const __VLS_152 = __VLS_151({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_151));
    (__VLS_ctx.lowStockCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                return (__VLS_ctx.showAddProduct = true);
                // @ts-ignore
                [lowStockCount, showAddProduct,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_155;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
        size: (16),
    }));
    const __VLS_157 = __VLS_156({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_156));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-strip" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.products.length + 126);
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.inventoryValue.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "danger-text" },
    });
    /** @type {__VLS_StyleScopedClasses['danger-text']} */ ;
    (__VLS_ctx.products.filter((item) => item.status === "滞销").length + 12);
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card table-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    let __VLS_160;
    /** @ts-ignore @type { | typeof __VLS_components.Search} */
    Search;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
        size: (16),
    }));
    const __VLS_162 = __VLS_161({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "搜索商品、品牌或 SKU",
    });
    (__VLS_ctx.inventorySearch);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-tabs']} */ ;
    for (const [filter] of __VLS_vFor((['全部', '库存预警', '滞销']))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    return (__VLS_ctx.inventoryFilter = filter);
                    // @ts-ignore
                    [products, products, inventoryValue, inventorySearch, inventoryFilter,];
                } },
            key: (filter),
            ...{ class: ({ active: __VLS_ctx.inventoryFilter === filter }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        (filter);
        if (filter !== '全部') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.products.filter((item) => item.status === filter).length);
        }
        // @ts-ignore
        [products, inventoryFilter,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                return (__VLS_ctx.inventoryFilter =
                    __VLS_ctx.inventoryFilter === '全部' ? '库存预警' : '全部');
                // @ts-ignore
                [inventoryFilter, inventoryFilter,];
            } },
        ...{ class: "icon-button" },
        title: "切换库存预警筛选",
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_165;
    /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
    SlidersHorizontal;
    // @ts-ignore
    const __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
        size: (17),
    }));
    const __VLS_167 = __VLS_166({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_166));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "data-table-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [product] of __VLS_vFor((__VLS_ctx.filteredProducts))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            key: (product.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['product-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-thumb" },
        });
        /** @type {__VLS_StyleScopedClasses['product-thumb']} */ ;
        (product.category.slice(0, 1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (product.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (product.brand);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (product.category);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (product.sku);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (product.stock);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "table-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['table-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (product.cost);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (product.price);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: ({
                    'danger-text': product.age > 60,
                    'warning-text': product.age > 30 && product.age <= 60,
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['danger-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
        (product.age);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-tag" },
            ...{ class: (product.status === '正常'
                    ? 'success'
                    : product.status === '滞销'
                        ? 'danger'
                        : 'warning') },
        });
        /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
        (product.status);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        if (product.status !== '正常') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeSection === 'dashboard'))
                            throw 0;
                        if (!(__VLS_ctx.activeSection === 'inventory'))
                            throw 0;
                        if (!(product.status !== '正常'))
                            throw 0;
                        return (__VLS_ctx.handleAdjustment(product));
                        // @ts-ignore
                        [filteredProducts, handleAdjustment,];
                    } },
                ...{ class: "table-action" },
            });
            /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
            let __VLS_170;
            /** @ts-ignore @type { | typeof __VLS_components.Check} */
            Check;
            // @ts-ignore
            const __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
                size: (14),
            }));
            const __VLS_172 = __VLS_171({
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_171));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeSection === 'dashboard'))
                            throw 0;
                        if (!(__VLS_ctx.activeSection === 'inventory'))
                            throw 0;
                        if (!!(product.status !== '正常'))
                            throw 0;
                        return (__VLS_ctx.showProductDetail = product);
                        // @ts-ignore
                        [showProductDetail,];
                    } },
                ...{ class: "more-action" },
                title: "更多操作",
                'aria-label': "更多操作",
            });
            /** @type {__VLS_StyleScopedClasses['more-action']} */ ;
            let __VLS_175;
            /** @ts-ignore @type { | typeof __VLS_components.MoreHorizontal} */
            MoreHorizontal;
            // @ts-ignore
            const __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
                size: (17),
            }));
            const __VLS_177 = __VLS_176({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_176));
        }
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.filteredProducts.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "empty-state" },
        });
        /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['table-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.filteredProducts.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        disabled: true,
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "active" },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        disabled: true,
    });
}
else if (__VLS_ctx.activeSection === 'merchants') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "page-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-heading-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "page-description" },
    });
    /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadMerchantReport) },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_180;
    /** @ts-ignore @type { | typeof __VLS_components.Download} */
    Download;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
        size: (16),
    }));
    const __VLS_182 = __VLS_181({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                return (__VLS_ctx.showNewMerchant = true);
                // @ts-ignore
                [activeSection, filteredProducts, filteredProducts, downloadMerchantReport, showNewMerchant,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_185;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185({
        size: (16),
    }));
    const __VLS_187 = __VLS_186({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_186));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "summary-strip merchant-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
    /** @type {__VLS_StyleScopedClasses['merchant-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.merchants.length + 82);
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "warning-text" },
    });
    /** @type {__VLS_StyleScopedClasses['warning-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({
        ...{ class: "danger-text" },
    });
    /** @type {__VLS_StyleScopedClasses['danger-text']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card table-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    let __VLS_190;
    /** @ts-ignore @type { | typeof __VLS_components.Search} */
    Search;
    // @ts-ignore
    const __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190({
        size: (16),
    }));
    const __VLS_192 = __VLS_191({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_191));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "搜索商户、品牌或铺位",
    });
    (__VLS_ctx.merchantSearch);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "toolbar-spacer" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-spacer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
        value: (__VLS_ctx.merchantPeriod),
        ...{ class: "toolbar-select" },
    });
    /** @type {__VLS_StyleScopedClasses['toolbar-select']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                return (__VLS_ctx.merchantPeriod =
                    __VLS_ctx.merchantPeriod === '本月账期' ? '上月账期' : '本月账期');
                // @ts-ignore
                [merchants, merchantSearch, merchantPeriod, merchantPeriod, merchantPeriod,];
            } },
        ...{ class: "icon-button" },
        title: "切换账期",
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_195;
    /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
    SlidersHorizontal;
    // @ts-ignore
    const __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195({
        size: (17),
    }));
    const __VLS_197 = __VLS_196({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_196));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "data-table-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table merchant-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['merchant-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [merchant] of __VLS_vFor((__VLS_ctx.filteredMerchants))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    return (__VLS_ctx.showMerchantDetail = merchant);
                    // @ts-ignore
                    [filteredMerchants, showMerchantDetail,];
                } },
            key: (merchant.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['product-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-thumb brand-thumb" },
        });
        /** @type {__VLS_StyleScopedClasses['product-thumb']} */ ;
        /** @type {__VLS_StyleScopedClasses['brand-thumb']} */ ;
        (merchant.brand.slice(0, 1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (merchant.brand);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.floor);
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (merchant.area);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "model-tag" },
        });
        /** @type {__VLS_StyleScopedClasses['model-tag']} */ ;
        (merchant.model);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.sales.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (Math.round(merchant.sales / merchant.area).toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (merchant.bill.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        (__VLS_ctx.merchantPeriod === "本月账期"
            ? "账期 08/01-08/31"
            : "账期 07/01-07/31");
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "status-tag" },
            ...{ class: (merchant.status === '正常经营'
                    ? 'success'
                    : merchant.status === '待续约'
                        ? 'warning'
                        : 'danger') },
        });
        /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
        (merchant.status);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    return (__VLS_ctx.showMerchantDetail = merchant);
                    // @ts-ignore
                    [merchantPeriod, showMerchantDetail,];
                } },
            ...{ class: "table-action subtle" },
        });
        /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
        /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
        let __VLS_200;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200({
            size: (14),
        }));
        const __VLS_202 = __VLS_201({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_201));
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['table-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.filteredMerchants.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "active" },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        disabled: true,
    });
}
else if (__VLS_ctx.activeSection === 'members') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "page-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "page-heading-row" },
    });
    /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "eyebrow" },
    });
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "page-description" },
    });
    /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "heading-actions" },
    });
    /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.downloadMemberReport) },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_205;
    /** @ts-ignore @type { | typeof __VLS_components.Download} */
    Download;
    // @ts-ignore
    const __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205({
        size: (16),
    }));
    const __VLS_207 = __VLS_206({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_206));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.showActivityDialog = true);
                // @ts-ignore
                [activeSection, filteredMerchants, downloadMemberReport, showActivityDialog,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_210;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210({
        size: (16),
    }));
    const __VLS_212 = __VLS_211({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_211));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-kpi-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['member-kpi-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card member-kpi" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['member-kpi']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kpi-icon orange" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    let __VLS_215;
    /** @ts-ignore @type { | typeof __VLS_components.Users} */
    Users;
    // @ts-ignore
    const __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
        size: (17),
    }));
    const __VLS_217 = __VLS_216({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_216));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card member-kpi" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['member-kpi']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kpi-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    let __VLS_220;
    /** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
    TrendingUp;
    // @ts-ignore
    const __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({
        size: (17),
    }));
    const __VLS_222 = __VLS_221({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_221));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card member-kpi" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['member-kpi']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kpi-icon green" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    let __VLS_225;
    /** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
    RefreshCcw;
    // @ts-ignore
    const __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225({
        size: (17),
    }));
    const __VLS_227 = __VLS_226({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_226));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({
        ...{ class: "positive" },
    });
    /** @type {__VLS_StyleScopedClasses['positive']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card member-kpi" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['member-kpi']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "kpi-icon violet" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['violet']} */ ;
    let __VLS_230;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_231 = __VLS_asFunctionalComponent1(__VLS_230, new __VLS_230({
        size: (17),
    }));
    const __VLS_232 = __VLS_231({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_231));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
        ...{ class: "surface-card table-card" },
    });
    /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['table-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-toolbar" },
    });
    /** @type {__VLS_StyleScopedClasses['table-toolbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-input" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
    let __VLS_235;
    /** @ts-ignore @type { | typeof __VLS_components.Search} */
    Search;
    // @ts-ignore
    const __VLS_236 = __VLS_asFunctionalComponent1(__VLS_235, new __VLS_235({
        size: (16),
    }));
    const __VLS_237 = __VLS_236({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_236));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "搜索姓名、手机号或会员标签",
    });
    (__VLS_ctx.memberSearch);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-tabs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.memberSegment = 'all');
                // @ts-ignore
                [memberSearch, memberSegment,];
            } },
        ...{ class: ({ active: __VLS_ctx.memberSegment === 'all' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.memberSegment = 'dormant');
                // @ts-ignore
                [memberSegment, memberSegment,];
            } },
        ...{ class: ({ active: __VLS_ctx.memberSegment === 'dormant' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.memberSegment = 'highValue');
                // @ts-ignore
                [memberSegment, memberSegment,];
            } },
        ...{ class: ({ active: __VLS_ctx.memberSegment === 'highValue' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.memberSegment = __VLS_ctx.memberSegment === 'all' ? 'dormant' : 'all');
                // @ts-ignore
                [memberSegment, memberSegment, memberSegment,];
            } },
        ...{ class: "icon-button" },
        title: "切换会员分群筛选",
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_240;
    /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
    SlidersHorizontal;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
        size: (17),
    }));
    const __VLS_242 = __VLS_241({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "data-table-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
        ...{ class: "data-table member-table" },
    });
    /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
    /** @type {__VLS_StyleScopedClasses['member-table']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    for (const [member] of __VLS_vFor((__VLS_ctx.filteredMembers))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    return (__VLS_ctx.showMemberDetail = member);
                    // @ts-ignore
                    [filteredMembers, showMemberDetail,];
                } },
            key: (member.id),
        });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "product-cell" },
        });
        /** @type {__VLS_StyleScopedClasses['product-cell']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "member-avatar" },
        });
        /** @type {__VLS_StyleScopedClasses['member-avatar']} */ ;
        (member.name.slice(0, 1));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (member.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (member.phone);
        (member.id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "level-tag" },
            ...{ class: (member.level.replace('卡', '')) },
        });
        /** @type {__VLS_StyleScopedClasses['level-tag']} */ ;
        (member.level);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (member.points.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "table-muted" },
        });
        /** @type {__VLS_StyleScopedClasses['table-muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (member.spend.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (member.lastVisit);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "soft-tag" },
        });
        /** @type {__VLS_StyleScopedClasses['soft-tag']} */ ;
        (member.tag);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    return (__VLS_ctx.sendCoupon(member));
                    // @ts-ignore
                    [sendCoupon,];
                } },
            ...{ class: "table-action subtle" },
        });
        /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
        /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
        let __VLS_245;
        /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
        Ticket;
        // @ts-ignore
        const __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245({
            size: (14),
        }));
        const __VLS_247 = __VLS_246({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_246));
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "table-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['table-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.filteredMembers.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "pagination" },
    });
    /** @type {__VLS_StyleScopedClasses['pagination']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "active" },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        disabled: true,
    });
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "page-section" },
    });
    /** @type {__VLS_StyleScopedClasses['page-section']} */ ;
    if (__VLS_ctx.operationModule === 'overview') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-heading-row" },
        });
        /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "page-description" },
        });
        /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "heading-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.refreshOperations) },
            ...{ class: "ghost-button" },
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
        let __VLS_250;
        /** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
        RefreshCcw;
        // @ts-ignore
        const __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250({
            size: (16),
        }));
        const __VLS_252 = __VLS_251({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_251));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.showNewTicket = true);
                    // @ts-ignore
                    [filteredMembers, operationModule, refreshOperations, showNewTicket,];
                } },
            ...{ class: "primary-button" },
        });
        /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        let __VLS_255;
        /** @ts-ignore @type { | typeof __VLS_components.Plus} */
        Plus;
        // @ts-ignore
        const __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255({
            size: (16),
        }));
        const __VLS_257 = __VLS_256({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_256));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-grid']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('leasing'));
                    // @ts-ignore
                    [openOperation,];
                } },
            ...{ class: "operation-card" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-icon orange" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['orange']} */ ;
        let __VLS_260;
        /** @ts-ignore @type { | typeof __VLS_components.BriefcaseBusiness} */
        BriefcaseBusiness;
        // @ts-ignore
        const __VLS_261 = __VLS_asFunctionalComponent1(__VLS_260, new __VLS_260({
            size: (18),
        }));
        const __VLS_262 = __VLS_261({
            size: (18),
        }, ...__VLS_functionalComponentArgsRest(__VLS_261));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_265;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_266 = __VLS_asFunctionalComponent1(__VLS_265, new __VLS_265({
            size: (16),
        }));
        const __VLS_267 = __VLS_266({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_266));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('cashier'));
                    // @ts-ignore
                    [openOperation,];
                } },
            ...{ class: "operation-card" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-icon blue" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['blue']} */ ;
        let __VLS_270;
        /** @ts-ignore @type { | typeof __VLS_components.CreditCard} */
        CreditCard;
        // @ts-ignore
        const __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270({
            size: (18),
        }));
        const __VLS_272 = __VLS_271({
            size: (18),
        }, ...__VLS_functionalComponentArgsRest(__VLS_271));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.pendingRefundCount);
        let __VLS_275;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_276 = __VLS_asFunctionalComponent1(__VLS_275, new __VLS_275({
            size: (16),
        }));
        const __VLS_277 = __VLS_276({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_276));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('property'));
                    // @ts-ignore
                    [openOperation, pendingRefundCount,];
                } },
            ...{ class: "operation-card" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-icon green" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['green']} */ ;
        let __VLS_280;
        /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
        Wrench;
        // @ts-ignore
        const __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
            size: (18),
        }));
        const __VLS_282 = __VLS_281({
            size: (18),
        }, ...__VLS_functionalComponentArgsRest(__VLS_281));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.activePropertyTicketCount);
        let __VLS_285;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
            size: (16),
        }));
        const __VLS_287 = __VLS_286({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_286));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('parking'));
                    // @ts-ignore
                    [activePropertyTicketCount, openOperation,];
                } },
            ...{ class: "operation-card" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-icon purple" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
        /** @type {__VLS_StyleScopedClasses['purple']} */ ;
        let __VLS_290;
        /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
        CalendarDays;
        // @ts-ignore
        const __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290({
            size: (18),
        }));
        const __VLS_292 = __VLS_291({
            size: (18),
        }, ...__VLS_functionalComponentArgsRest(__VLS_291));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.parkingIssueCount);
        let __VLS_295;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_296 = __VLS_asFunctionalComponent1(__VLS_295, new __VLS_295({
            size: (16),
        }));
        const __VLS_297 = __VLS_296({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_296));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "operation-columns" },
        });
        /** @type {__VLS_StyleScopedClasses['operation-columns']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ class: "surface-card" },
        });
        /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-heading" },
        });
        /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('property'));
                    // @ts-ignore
                    [openOperation, parkingIssueCount,];
                } },
            ...{ class: "link-button" },
        });
        /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
        let __VLS_300;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_301 = __VLS_asFunctionalComponent1(__VLS_300, new __VLS_300({
            size: (14),
        }));
        const __VLS_302 = __VLS_301({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_301));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "ticket-list" },
        });
        /** @type {__VLS_StyleScopedClasses['ticket-list']} */ ;
        for (const [ticket] of __VLS_vFor((__VLS_ctx.propertyTickets.slice(0, 3)))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (ticket.id),
                ...{ class: "ticket-row" },
            });
            /** @type {__VLS_StyleScopedClasses['ticket-row']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "ticket-status" },
                ...{ class: (ticket.status === '已完成'
                        ? 'done'
                        : ticket.status === '待派单'
                            ? 'waiting'
                            : 'ongoing') },
            });
            /** @type {__VLS_StyleScopedClasses['ticket-status']} */ ;
            (ticket.status);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (ticket.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (ticket.requester);
            (ticket.created);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "ticket-owner" },
            });
            /** @type {__VLS_StyleScopedClasses['ticket-owner']} */ ;
            (ticket.owner);
            // @ts-ignore
            [propertyTickets,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
            ...{ class: "surface-card" },
        });
        /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "card-heading" },
        });
        /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activeSection === 'dashboard'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'inventory'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'merchants'))
                        throw 0;
                    if (!!(__VLS_ctx.activeSection === 'members'))
                        throw 0;
                    if (!(__VLS_ctx.operationModule === 'overview'))
                        throw 0;
                    return (__VLS_ctx.openOperation('leasing'));
                    // @ts-ignore
                    [openOperation,];
                } },
            ...{ class: "link-button" },
        });
        /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
        let __VLS_305;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_306 = __VLS_asFunctionalComponent1(__VLS_305, new __VLS_305({
            size: (14),
        }));
        const __VLS_307 = __VLS_306({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_306));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "occupancy" },
        });
        /** @type {__VLS_StyleScopedClasses['occupancy']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "occupancy-ring" },
        });
        /** @type {__VLS_StyleScopedClasses['occupancy-ring']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.em, __VLS_intrinsics.em)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "occupancy-info" },
        });
        /** @type {__VLS_StyleScopedClasses['occupancy-info']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "dot orange" },
        });
        /** @type {__VLS_StyleScopedClasses['dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['orange']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "dot pale" },
        });
        /** @type {__VLS_StyleScopedClasses['dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['pale']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "dot blue" },
        });
        /** @type {__VLS_StyleScopedClasses['dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['blue']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.leasingLeads.length);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "page-heading-row operation-detail-heading" },
        });
        /** @type {__VLS_StyleScopedClasses['page-heading-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['operation-detail-heading']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.closeOperationModule) },
            ...{ class: "back-link" },
        });
        /** @type {__VLS_StyleScopedClasses['back-link']} */ ;
        let __VLS_310;
        /** @ts-ignore @type { | typeof __VLS_components.ArrowLeft} */
        ArrowLeft;
        // @ts-ignore
        const __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310({
            size: (15),
        }));
        const __VLS_312 = __VLS_311({
            size: (15),
        }, ...__VLS_functionalComponentArgsRest(__VLS_311));
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "eyebrow" },
        });
        /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
        (__VLS_ctx.activeOperationMeta?.eyebrow);
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
        (__VLS_ctx.activeOperationMeta?.title);
        __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
            ...{ class: "page-description" },
        });
        /** @type {__VLS_StyleScopedClasses['page-description']} */ ;
        (__VLS_ctx.activeOperationMeta?.description);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "heading-actions" },
        });
        /** @type {__VLS_StyleScopedClasses['heading-actions']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (__VLS_ctx.refreshOperations) },
            ...{ class: "ghost-button" },
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
        let __VLS_315;
        /** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
        RefreshCcw;
        // @ts-ignore
        const __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315({
            size: (16),
        }));
        const __VLS_317 = __VLS_316({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_316));
        if (__VLS_ctx.operationModule === 'property') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activeSection === 'dashboard'))
                            throw 0;
                        if (!!(__VLS_ctx.activeSection === 'inventory'))
                            throw 0;
                        if (!!(__VLS_ctx.activeSection === 'merchants'))
                            throw 0;
                        if (!!(__VLS_ctx.activeSection === 'members'))
                            throw 0;
                        if (!!(__VLS_ctx.operationModule === 'overview'))
                            throw 0;
                        if (!(__VLS_ctx.operationModule === 'property'))
                            throw 0;
                        return (__VLS_ctx.showNewTicket = true);
                        // @ts-ignore
                        [operationModule, refreshOperations, showNewTicket, leasingLeads, closeOperationModule, activeOperationMeta, activeOperationMeta, activeOperationMeta,];
                    } },
                ...{ class: "primary-button" },
            });
            /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
            let __VLS_320;
            /** @ts-ignore @type { | typeof __VLS_components.Plus} */
            Plus;
            // @ts-ignore
            const __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
                size: (16),
            }));
            const __VLS_322 = __VLS_321({
                size: (16),
            }, ...__VLS_functionalComponentArgsRest(__VLS_321));
        }
        if (__VLS_ctx.operationModule === 'leasing') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "operation-detail-body" },
            });
            /** @type {__VLS_StyleScopedClasses['operation-detail-body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "summary-strip operation-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                ...{ class: "surface-card operation-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "panel-caption" },
            });
            /** @type {__VLS_StyleScopedClasses['panel-caption']} */ ;
            (__VLS_ctx.leasingLeads.length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "data-table-wrap operation-table-wrap" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table-wrap']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "data-table operation-table" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [lead] of __VLS_vFor((__VLS_ctx.leasingLeads))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (lead.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (lead.brand);
                __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
                (lead.category);
                (lead.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (lead.floor);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (lead.area);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-tag" },
                    ...{ class: (lead.stage === '合同审批'
                            ? 'success'
                            : lead.stage === '方案沟通'
                                ? 'info'
                                : 'warning') },
                });
                /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
                (lead.stage);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (lead.owner);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (lead.updated);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activeSection === 'dashboard'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'inventory'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'merchants'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'members'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'overview'))
                                throw 0;
                            if (!(__VLS_ctx.operationModule === 'leasing'))
                                throw 0;
                            return (__VLS_ctx.advanceLead(lead));
                            // @ts-ignore
                            [operationModule, leasingLeads, leasingLeads, advanceLead,];
                        } },
                    ...{ class: "table-action subtle" },
                });
                /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
                /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
                (lead.stage === "合同审批" ? "查看" : "推进");
                let __VLS_325;
                /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
                ExternalLink;
                // @ts-ignore
                const __VLS_326 = __VLS_asFunctionalComponent1(__VLS_325, new __VLS_325({
                    size: (14),
                }));
                const __VLS_327 = __VLS_326({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_326));
                // @ts-ignore
                [];
            }
        }
        else if (__VLS_ctx.operationModule === 'cashier') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "operation-detail-body" },
            });
            /** @type {__VLS_StyleScopedClasses['operation-detail-body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "summary-strip operation-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.pendingRefundCount);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                ...{ class: "surface-card operation-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "panel-caption" },
            });
            /** @type {__VLS_StyleScopedClasses['panel-caption']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "data-table-wrap operation-table-wrap" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table-wrap']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "data-table operation-table" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [transaction] of __VLS_vFor((__VLS_ctx.cashierTransactions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (transaction.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (transaction.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (transaction.time);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (transaction.merchant);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (transaction.channel);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (transaction.amount.toLocaleString());
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-tag" },
                    ...{ class: (transaction.status === '已完成'
                            ? 'success'
                            : transaction.status === '退款待审'
                                ? 'warning'
                                : 'info') },
                });
                /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
                (transaction.status);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activeSection === 'dashboard'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'inventory'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'merchants'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'members'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'overview'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'leasing'))
                                throw 0;
                            if (!(__VLS_ctx.operationModule === 'cashier'))
                                throw 0;
                            return (__VLS_ctx.reviewRefund(transaction));
                            // @ts-ignore
                            [operationModule, pendingRefundCount, cashierTransactions, reviewRefund,];
                        } },
                    ...{ class: "table-action subtle" },
                });
                /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
                /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
                (transaction.status === "退款待审"
                    ? "审核退款"
                    : "查看");
                let __VLS_330;
                /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
                ExternalLink;
                // @ts-ignore
                const __VLS_331 = __VLS_asFunctionalComponent1(__VLS_330, new __VLS_330({
                    size: (14),
                }));
                const __VLS_332 = __VLS_331({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_331));
                // @ts-ignore
                [];
            }
        }
        else if (__VLS_ctx.operationModule === 'property') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "operation-detail-body" },
            });
            /** @type {__VLS_StyleScopedClasses['operation-detail-body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "summary-strip operation-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.activePropertyTicketCount);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.propertyTickets.filter((item) => item.status === "待派单")
                .length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.propertyTickets.filter((item) => item.status === "已完成")
                .length);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                ...{ class: "surface-card operation-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
                value: (__VLS_ctx.propertyFilter),
                ...{ class: "toolbar-select" },
            });
            /** @type {__VLS_StyleScopedClasses['toolbar-select']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "data-table-wrap operation-table-wrap" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table-wrap']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "data-table operation-table" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [ticket] of __VLS_vFor((__VLS_ctx.filteredPropertyTickets))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (ticket.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (ticket.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
                (ticket.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (ticket.location);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (ticket.requester);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-tag" },
                    ...{ class: (ticket.status === '已完成'
                            ? 'success'
                            : ticket.status === '待派单'
                                ? 'warning'
                                : ticket.status === '待验收'
                                    ? 'info'
                                    : 'primary') },
                });
                /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
                (ticket.status);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (ticket.owner);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (ticket.created);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activeSection === 'dashboard'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'inventory'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'merchants'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'members'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'overview'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'leasing'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'cashier'))
                                throw 0;
                            if (!(__VLS_ctx.operationModule === 'property'))
                                throw 0;
                            return (__VLS_ctx.updatePropertyTicket(ticket));
                            // @ts-ignore
                            [activePropertyTicketCount, operationModule, propertyTickets, propertyTickets, propertyFilter, filteredPropertyTickets, updatePropertyTicket,];
                        } },
                    ...{ class: "table-action subtle" },
                });
                /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
                /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
                (ticket.status === "已完成"
                    ? "查看"
                    : ticket.status === "待派单"
                        ? "派单"
                        : ticket.status === "处理中"
                            ? "完成"
                            : "验收");
                let __VLS_335;
                /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
                ExternalLink;
                // @ts-ignore
                const __VLS_336 = __VLS_asFunctionalComponent1(__VLS_335, new __VLS_335({
                    size: (14),
                }));
                const __VLS_337 = __VLS_336({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_336));
                // @ts-ignore
                [];
            }
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "operation-detail-body" },
            });
            /** @type {__VLS_StyleScopedClasses['operation-detail-body']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "summary-strip operation-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['summary-strip']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.parkingIssueCount);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                ...{ class: "surface-card operation-panel" },
            });
            /** @type {__VLS_StyleScopedClasses['surface-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-panel']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "card-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['card-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.downloadParkingReport) },
                ...{ class: "link-button" },
            });
            /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
            let __VLS_340;
            /** @ts-ignore @type { | typeof __VLS_components.Download} */
            Download;
            // @ts-ignore
            const __VLS_341 = __VLS_asFunctionalComponent1(__VLS_340, new __VLS_340({
                size: (14),
            }));
            const __VLS_342 = __VLS_341({
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_341));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "data-table-wrap operation-table-wrap" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table-wrap']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.table, __VLS_intrinsics.table)({
                ...{ class: "data-table operation-table" },
            });
            /** @type {__VLS_StyleScopedClasses['data-table']} */ ;
            /** @type {__VLS_StyleScopedClasses['operation-table']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
            for (const [session] of __VLS_vFor((__VLS_ctx.parkingSessions))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({
                    key: (session.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (session.plate);
                __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
                (session.id);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "model-tag" },
                });
                /** @type {__VLS_StyleScopedClasses['model-tag']} */ ;
                (session.type);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (session.entry);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                (session.duration);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (session.fee ? `¥ ${session.fee}` : "免费");
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "status-tag" },
                    ...{ class: (session.status === '正常'
                            ? 'success'
                            : session.status === '待处理'
                                ? 'warning'
                                : 'info') },
                });
                /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
                (session.status);
                __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activeSection === 'dashboard'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'inventory'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'merchants'))
                                throw 0;
                            if (!!(__VLS_ctx.activeSection === 'members'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'overview'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'leasing'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'cashier'))
                                throw 0;
                            if (!!(__VLS_ctx.operationModule === 'property'))
                                throw 0;
                            return (__VLS_ctx.resolveParking(session));
                            // @ts-ignore
                            [parkingIssueCount, downloadParkingReport, parkingSessions, resolveParking,];
                        } },
                    ...{ class: "table-action subtle" },
                });
                /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
                /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
                (session.status === "待处理" ? "处理" : "查看");
                let __VLS_345;
                /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
                ExternalLink;
                // @ts-ignore
                const __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345({
                    size: (14),
                }));
                const __VLS_347 = __VLS_346({
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_346));
                // @ts-ignore
                [];
            }
        }
    }
}
let __VLS_350;
/** @ts-ignore @type { | typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
const __VLS_351 = __VLS_asFunctionalComponent1(__VLS_350, new __VLS_350({
    name: "fade",
}));
const __VLS_352 = __VLS_351({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_351));
const { default: __VLS_355 } = __VLS_353.slots;
if (__VLS_ctx.mobileOpen) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileOpen = false);
                // @ts-ignore
                [mobileOpen, mobileOpen,];
            } },
        ...{ class: "mobile-overlay" },
    });
    /** @type {__VLS_StyleScopedClasses['mobile-overlay']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "phone-frame" },
    });
    /** @type {__VLS_StyleScopedClasses['phone-frame']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "phone-notch" },
    });
    /** @type {__VLS_StyleScopedClasses['phone-notch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "phone-screen" },
    });
    /** @type {__VLS_StyleScopedClasses['phone-screen']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "mobile-header" },
    });
    /** @type {__VLS_StyleScopedClasses['mobile-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.mobilePageTitle);
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileOpen = false);
                // @ts-ignore
                [mobileOpen, mobilePageTitle,];
            } },
        ...{ class: "mobile-close" },
    });
    /** @type {__VLS_StyleScopedClasses['mobile-close']} */ ;
    let __VLS_356;
    /** @ts-ignore @type { | typeof __VLS_components.X} */
    X;
    // @ts-ignore
    const __VLS_357 = __VLS_asFunctionalComponent1(__VLS_356, new __VLS_356({
        size: (17),
    }));
    const __VLS_358 = __VLS_357({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_357));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "role-switch" },
    });
    /** @type {__VLS_StyleScopedClasses['role-switch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.switchMobileRole('member'));
                // @ts-ignore
                [switchMobileRole,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileRole === 'member' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_361;
    /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
    UserRound;
    // @ts-ignore
    const __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({
        size: (14),
    }));
    const __VLS_363 = __VLS_362({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_362));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.switchMobileRole('merchant'));
                // @ts-ignore
                [switchMobileRole, mobileRole,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileRole === 'merchant' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_366;
    /** @ts-ignore @type { | typeof __VLS_components.Store} */
    Store;
    // @ts-ignore
    const __VLS_367 = __VLS_asFunctionalComponent1(__VLS_366, new __VLS_366({
        size: (14),
    }));
    const __VLS_368 = __VLS_367({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_367));
    __VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
        ...{ class: "mobile-content" },
    });
    /** @type {__VLS_StyleScopedClasses['mobile-content']} */ ;
    if (__VLS_ctx.mobileTab === 'home') {
        if (__VLS_ctx.mobileRole === 'member') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "member-welcome" },
            });
            /** @type {__VLS_StyleScopedClasses['member-welcome']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "member-mini-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['member-mini-avatar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-level-card" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-level-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "level-progress" },
            });
            /** @type {__VLS_StyleScopedClasses['level-progress']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-points" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-points']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('points'));
                        // @ts-ignore
                        [mobileRole, mobileRole, mobileTab, openMobileInfo,];
                    } },
            });
            let __VLS_371;
            /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
            ExternalLink;
            // @ts-ignore
            const __VLS_372 = __VLS_asFunctionalComponent1(__VLS_371, new __VLS_371({
                size: (12),
            }));
            const __VLS_373 = __VLS_372({
                size: (12),
            }, ...__VLS_functionalComponentArgsRest(__VLS_372));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-section-title" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('benefits'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.mobileTab = 'benefit');
                        // @ts-ignore
                        [mobileTab,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon coupon" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['coupon']} */ ;
            let __VLS_376;
            /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
            Ticket;
            // @ts-ignore
            const __VLS_377 = __VLS_asFunctionalComponent1(__VLS_376, new __VLS_376({
                size: (17),
            }));
            const __VLS_378 = __VLS_377({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_377));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('parking'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon parking" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['parking']} */ ;
            let __VLS_381;
            /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
            CalendarDays;
            // @ts-ignore
            const __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381({
                size: (17),
            }));
            const __VLS_383 = __VLS_382({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_382));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('receipts'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon receipt" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['receipt']} */ ;
            let __VLS_386;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_387 = __VLS_asFunctionalComponent1(__VLS_386, new __VLS_386({
                size: (17),
            }));
            const __VLS_388 = __VLS_387({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_387));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('activity'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon event" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['event']} */ ;
            let __VLS_391;
            /** @ts-ignore @type { | typeof __VLS_components.Tag} */
            Tag;
            // @ts-ignore
            const __VLS_392 = __VLS_asFunctionalComponent1(__VLS_391, new __VLS_391({
                size: (17),
            }));
            const __VLS_393 = __VLS_392({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_392));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-section-title" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('recommendation'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-product-list" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-product-list']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-product-thumb" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-product-thumb']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('activity'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-product-thumb bag" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-product-thumb']} */ ;
            /** @type {__VLS_StyleScopedClasses['bag']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.claimCoupon(__VLS_ctx.memberCoupons[1]));
                        // @ts-ignore
                        [claimCoupon, memberCoupons,];
                    } },
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-welcome" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-welcome']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-mini-avatar" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-mini-avatar']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-sales-card" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-sales-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-sparkline" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-sparkline']} */ ;
            for (const [height, index] of __VLS_vFor(([28, 38, 31, 52, 44, 60, 76]))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
                    key: (index),
                    ...{ style: ({ height: `${height}%` }) },
                });
                // @ts-ignore
                [];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-section-title" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-action-grid" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-action-grid']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.mobileTab = 'benefit');
                        // @ts-ignore
                        [mobileTab,];
                    } },
            });
            let __VLS_396;
            /** @ts-ignore @type { | typeof __VLS_components.WalletCards} */
            WalletCards;
            // @ts-ignore
            const __VLS_397 = __VLS_asFunctionalComponent1(__VLS_396, new __VLS_396({
                size: (18),
            }));
            const __VLS_398 = __VLS_397({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_397));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('merchantSales'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            let __VLS_401;
            /** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
            TrendingUp;
            // @ts-ignore
            const __VLS_402 = __VLS_asFunctionalComponent1(__VLS_401, new __VLS_401({
                size: (18),
            }));
            const __VLS_403 = __VLS_402({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_402));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('merchantActivity'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            let __VLS_406;
            /** @ts-ignore @type { | typeof __VLS_components.Tag} */
            Tag;
            // @ts-ignore
            const __VLS_407 = __VLS_asFunctionalComponent1(__VLS_406, new __VLS_406({
                size: (18),
            }));
            const __VLS_408 = __VLS_407({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_407));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('merchantRepair'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            let __VLS_411;
            /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
            Wrench;
            // @ts-ignore
            const __VLS_412 = __VLS_asFunctionalComponent1(__VLS_411, new __VLS_411({
                size: (18),
            }));
            const __VLS_413 = __VLS_412({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_412));
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "bill-notice" },
            });
            /** @type {__VLS_StyleScopedClasses['bill-notice']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon invoice" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['invoice']} */ ;
            let __VLS_416;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_417 = __VLS_asFunctionalComponent1(__VLS_416, new __VLS_416({
                size: (17),
            }));
            const __VLS_418 = __VLS_417({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_417));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (__VLS_ctx.mobileBillConfirmed
                ? "8 月对账单已确认"
                : "8 月对账单待确认");
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.confirmMobileBill) },
                disabled: (__VLS_ctx.mobileBillConfirmed),
            });
            (__VLS_ctx.mobileBillConfirmed ? "已确认" : "立即确认");
        }
    }
    else if (__VLS_ctx.mobileTab === 'benefit') {
        if (__VLS_ctx.mobileRole === 'member') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-page-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-page-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-page-count" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-page-count']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "coupon-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['coupon-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-section-title" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "coupon-list" },
            });
            /** @type {__VLS_StyleScopedClasses['coupon-list']} */ ;
            for (const [coupon] of __VLS_vFor((__VLS_ctx.memberCoupons))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({
                    key: (coupon.id),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "coupon-amount" },
                });
                /** @type {__VLS_StyleScopedClasses['coupon-amount']} */ ;
                (coupon.amount);
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "coupon-info" },
                });
                /** @type {__VLS_StyleScopedClasses['coupon-info']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
                (coupon.title);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (coupon.condition);
                __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
                (coupon.expire);
                __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.mobileOpen))
                                throw 0;
                            if (!!(__VLS_ctx.mobileTab === 'home'))
                                throw 0;
                            if (!(__VLS_ctx.mobileTab === 'benefit'))
                                throw 0;
                            if (!(__VLS_ctx.mobileRole === 'member'))
                                throw 0;
                            return (__VLS_ctx.claimCoupon(coupon));
                            // @ts-ignore
                            [mobileRole, mobileTab, claimCoupon, memberCoupons, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, confirmMobileBill,];
                        } },
                    ...{ class: ({ claimed: coupon.claimed }) },
                });
                /** @type {__VLS_StyleScopedClasses['claimed']} */ ;
                (coupon.claimed ? "已领取" : "领取");
                // @ts-ignore
                [];
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-service-card" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-service-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon parking" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['parking']} */ ;
            let __VLS_421;
            /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
            CalendarDays;
            // @ts-ignore
            const __VLS_422 = __VLS_asFunctionalComponent1(__VLS_421, new __VLS_421({
                size: (17),
            }));
            const __VLS_423 = __VLS_422({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_422));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'benefit'))
                            throw 0;
                        if (!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('parking'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-page-heading" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-page-heading']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-page-count" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-page-count']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-bill-summary" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-bill-summary']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-section-title" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "merchant-bill-list" },
            });
            /** @type {__VLS_StyleScopedClasses['merchant-bill-list']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "bill-month" },
                ...{ class: ({ settled: __VLS_ctx.mobileBillConfirmed }) },
            });
            /** @type {__VLS_StyleScopedClasses['bill-month']} */ ;
            /** @type {__VLS_StyleScopedClasses['settled']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (__VLS_ctx.mobileBillConfirmed ? "已确认" : "待确认");
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.confirmMobileBill) },
                disabled: (__VLS_ctx.mobileBillConfirmed),
            });
            (__VLS_ctx.mobileBillConfirmed ? "已确认" : "确认");
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "bill-month settled" },
            });
            /** @type {__VLS_StyleScopedClasses['bill-month']} */ ;
            /** @type {__VLS_StyleScopedClasses['settled']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'benefit'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('bill'));
                        // @ts-ignore
                        [openMobileInfo, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, confirmMobileBill,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.article, __VLS_intrinsics.article)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "bill-month settled" },
            });
            /** @type {__VLS_StyleScopedClasses['bill-month']} */ ;
            /** @type {__VLS_StyleScopedClasses['settled']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'benefit'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('bill'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-service-card" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-service-card']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon receipt" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['receipt']} */ ;
            let __VLS_426;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_427 = __VLS_asFunctionalComponent1(__VLS_426, new __VLS_426({
                size: (17),
            }));
            const __VLS_428 = __VLS_427({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_427));
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'benefit'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileRole === 'member'))
                            throw 0;
                        return (__VLS_ctx.openMobileInfo('invoice'));
                        // @ts-ignore
                        [openMobileInfo,];
                    } },
            });
        }
    }
    else if (__VLS_ctx.mobileTab === 'message') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-page-heading compact" },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-page-heading']} */ ;
        /** @type {__VLS_StyleScopedClasses['compact']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.mobileUnreadCount);
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        if (__VLS_ctx.mobileUnreadCount) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (__VLS_ctx.readAllMobileMessages) },
                ...{ class: "mobile-text-button" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-text-button']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "message-filter-row" },
        });
        /** @type {__VLS_StyleScopedClasses['message-filter-row']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.mobileMessageFilter = '全部');
                    // @ts-ignore
                    [mobileTab, mobileUnreadCount, mobileUnreadCount, readAllMobileMessages, mobileMessageFilter,];
                } },
            ...{ class: ({ active: __VLS_ctx.mobileMessageFilter === '全部' }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.mobileMessageFilter = '通知');
                    // @ts-ignore
                    [mobileMessageFilter, mobileMessageFilter,];
                } },
            ...{ class: ({ active: __VLS_ctx.mobileMessageFilter === '通知' }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.mobileMessageFilter =
                        __VLS_ctx.mobileRole === 'member' ? '权益' : '账单');
                    // @ts-ignore
                    [mobileRole, mobileMessageFilter, mobileMessageFilter,];
                } },
            ...{ class: ({
                    active: __VLS_ctx.mobileMessageFilter ===
                        (__VLS_ctx.mobileRole === 'member' ? '权益' : '账单'),
                }) },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        (__VLS_ctx.mobileRole === "member" ? "权益" : "账单");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-message-list" },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-message-list']} */ ;
        for (const [message] of __VLS_vFor((__VLS_ctx.filteredMobileMessages))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.mobileOpen))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'home'))
                            throw 0;
                        if (!!(__VLS_ctx.mobileTab === 'benefit'))
                            throw 0;
                        if (!(__VLS_ctx.mobileTab === 'message'))
                            throw 0;
                        return (__VLS_ctx.readMobileMessage(message));
                        // @ts-ignore
                        [mobileRole, mobileRole, mobileMessageFilter, filteredMobileMessages, readMobileMessage,];
                    } },
                key: (message.id),
                ...{ class: ({ unread: !message.read }) },
            });
            /** @type {__VLS_StyleScopedClasses['unread']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "message-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['message-icon']} */ ;
            let __VLS_431;
            /** @ts-ignore @type { | typeof __VLS_components.Bell} */
            Bell;
            // @ts-ignore
            const __VLS_432 = __VLS_asFunctionalComponent1(__VLS_431, new __VLS_431({
                size: (16),
            }));
            const __VLS_433 = __VLS_432({
                size: (16),
            }, ...__VLS_functionalComponentArgsRest(__VLS_432));
            if (!message.read) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
            }
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (message.title);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (message.description);
            __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
            (message.time);
            let __VLS_436;
            /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
            ChevronDown;
            // @ts-ignore
            const __VLS_437 = __VLS_asFunctionalComponent1(__VLS_436, new __VLS_436({
                size: (14),
            }));
            const __VLS_438 = __VLS_437({
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_437));
            // @ts-ignore
            [];
        }
        if (!__VLS_ctx.filteredMobileMessages.length) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-read-tip" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-read-tip']} */ ;
        }
        if (!__VLS_ctx.mobileUnreadCount) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-read-tip" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-read-tip']} */ ;
            let __VLS_441;
            /** @ts-ignore @type { | typeof __VLS_components.Check} */
            Check;
            // @ts-ignore
            const __VLS_442 = __VLS_asFunctionalComponent1(__VLS_441, new __VLS_441({
                size: (15),
            }));
            const __VLS_443 = __VLS_442({
                size: (15),
            }, ...__VLS_functionalComponentArgsRest(__VLS_442));
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-profile-card" },
            ...{ class: ({ merchant: __VLS_ctx.mobileRole === 'merchant' }) },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-profile-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['merchant']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (__VLS_ctx.mobileRole === 'member'
                    ? 'member-mini-avatar'
                    : 'merchant-mini-avatar') },
        });
        (__VLS_ctx.mobileRole === "member" ? "王" : "运");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.mobileRole === "member" ? "王女士" : "运动集合店");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.mobileRole === "member"
            ? "金卡会员 · 2,860 积分"
            : "1F-A12 · 正常经营");
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.openMobileInfo('profile'));
                    // @ts-ignore
                    [mobileRole, mobileRole, mobileRole, mobileRole, mobileRole, openMobileInfo, mobileUnreadCount, filteredMobileMessages,];
                } },
        });
        let __VLS_446;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_447 = __VLS_asFunctionalComponent1(__VLS_446, new __VLS_446({
            size: (12),
        }));
        const __VLS_448 = __VLS_447({
            size: (12),
        }, ...__VLS_functionalComponentArgsRest(__VLS_447));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mine-stat-grid" },
        });
        /** @type {__VLS_StyleScopedClasses['mine-stat-grid']} */ ;
        if (__VLS_ctx.mobileRole === 'member') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        if (__VLS_ctx.mobileRole === 'member') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        if (__VLS_ctx.mobileRole === 'member') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-section-title" },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-section-title']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mine-menu-list" },
        });
        /** @type {__VLS_StyleScopedClasses['mine-menu-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.openMobileInfo('profile'));
                    // @ts-ignore
                    [mobileRole, mobileRole, mobileRole, openMobileInfo,];
                } },
        });
        let __VLS_451;
        /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
        UserRound;
        // @ts-ignore
        const __VLS_452 = __VLS_asFunctionalComponent1(__VLS_451, new __VLS_451({
            size: (17),
        }));
        const __VLS_453 = __VLS_452({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_452));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.mobileRole === "member" ? "会员资料" : "商户资料");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_456;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_457 = __VLS_asFunctionalComponent1(__VLS_456, new __VLS_456({
            size: (14),
        }));
        const __VLS_458 = __VLS_457({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_457));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.openMobileInfo('security'));
                    // @ts-ignore
                    [mobileRole, openMobileInfo,];
                } },
        });
        let __VLS_461;
        /** @ts-ignore @type { | typeof __VLS_components.Settings2} */
        Settings2;
        // @ts-ignore
        const __VLS_462 = __VLS_asFunctionalComponent1(__VLS_461, new __VLS_461({
            size: (17),
        }));
        const __VLS_463 = __VLS_462({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_462));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_466;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_467 = __VLS_asFunctionalComponent1(__VLS_466, new __VLS_466({
            size: (14),
        }));
        const __VLS_468 = __VLS_467({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_467));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.openMobileInfo(__VLS_ctx.mobileRole === 'member' ? 'parking' : 'contact'));
                    // @ts-ignore
                    [mobileRole, openMobileInfo,];
                } },
        });
        let __VLS_471;
        /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
        CalendarDays;
        // @ts-ignore
        const __VLS_472 = __VLS_asFunctionalComponent1(__VLS_471, new __VLS_471({
            size: (17),
        }));
        const __VLS_473 = __VLS_472({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_472));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.mobileRole === "member" ? "我的车辆" : "联系人管理");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.mobileRole === "member"
            ? "停车权益与车牌管理"
            : "财务及运营联系人");
        let __VLS_476;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_477 = __VLS_asFunctionalComponent1(__VLS_476, new __VLS_476({
            size: (14),
        }));
        const __VLS_478 = __VLS_477({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_477));
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.mobileOpen))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'home'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'benefit'))
                        throw 0;
                    if (!!(__VLS_ctx.mobileTab === 'message'))
                        throw 0;
                    return (__VLS_ctx.openMobileInfo('support'));
                    // @ts-ignore
                    [mobileRole, mobileRole, openMobileInfo,];
                } },
        });
        let __VLS_481;
        /** @ts-ignore @type { | typeof __VLS_components.CircleHelp} */
        CircleHelp;
        // @ts-ignore
        const __VLS_482 = __VLS_asFunctionalComponent1(__VLS_481, new __VLS_481({
            size: (17),
        }));
        const __VLS_483 = __VLS_482({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_482));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_486;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_487 = __VLS_asFunctionalComponent1(__VLS_486, new __VLS_486({
            size: (14),
        }));
        const __VLS_488 = __VLS_487({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_487));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-version" },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-version']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.nav, __VLS_intrinsics.nav)({
        ...{ class: "mobile-tabbar" },
    });
    /** @type {__VLS_StyleScopedClasses['mobile-tabbar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileTab = 'home');
                // @ts-ignore
                [mobileTab,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileTab === 'home' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_491;
    /** @ts-ignore @type { | typeof __VLS_components.LayoutDashboard} */
    LayoutDashboard;
    // @ts-ignore
    const __VLS_492 = __VLS_asFunctionalComponent1(__VLS_491, new __VLS_491({
        size: (18),
    }));
    const __VLS_493 = __VLS_492({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_492));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileTab = 'benefit');
                // @ts-ignore
                [mobileTab, mobileTab,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileTab === 'benefit' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_496;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_497 = __VLS_asFunctionalComponent1(__VLS_496, new __VLS_496({
        size: (18),
    }));
    const __VLS_498 = __VLS_497({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_497));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.mobileRole === "member" ? "优惠权益" : "账单服务");
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileTab = 'message');
                // @ts-ignore
                [mobileRole, mobileTab, mobileTab,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileTab === 'message' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tab-icon-wrap" },
    });
    /** @type {__VLS_StyleScopedClasses['tab-icon-wrap']} */ ;
    let __VLS_501;
    /** @ts-ignore @type { | typeof __VLS_components.MessageSquare} */
    MessageSquare;
    // @ts-ignore
    const __VLS_502 = __VLS_asFunctionalComponent1(__VLS_501, new __VLS_501({
        size: (18),
    }));
    const __VLS_503 = __VLS_502({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_502));
    if (__VLS_ctx.mobileUnreadCount) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
        (__VLS_ctx.mobileUnreadCount);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileTab = 'mine');
                // @ts-ignore
                [mobileTab, mobileTab, mobileUnreadCount, mobileUnreadCount,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileTab === 'mine' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_506;
    /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
    UserRound;
    // @ts-ignore
    const __VLS_507 = __VLS_asFunctionalComponent1(__VLS_506, new __VLS_506({
        size: (18),
    }));
    const __VLS_508 = __VLS_507({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_507));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
// @ts-ignore
[mobileTab,];
var __VLS_353;
let __VLS_511;
/** @ts-ignore @type { | typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
const __VLS_512 = __VLS_asFunctionalComponent1(__VLS_511, new __VLS_511({
    name: "drawer",
}));
const __VLS_513 = __VLS_512({
    name: "drawer",
}, ...__VLS_functionalComponentArgsRest(__VLS_512));
const { default: __VLS_516 } = __VLS_514.slots;
if (__VLS_ctx.showAlertDrawer) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
        ...{ class: "alert-drawer" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-drawer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drawer-header" },
    });
    /** @type {__VLS_StyleScopedClasses['drawer-header']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                return (__VLS_ctx.showAlertDrawer = false);
                // @ts-ignore
                [showAlertDrawer, showAlertDrawer,];
            } },
        ...{ class: "icon-button" },
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_517;
    /** @ts-ignore @type { | typeof __VLS_components.X} */
    X;
    // @ts-ignore
    const __VLS_518 = __VLS_asFunctionalComponent1(__VLS_517, new __VLS_517({
        size: (18),
    }));
    const __VLS_519 = __VLS_518({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_518));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drawer-count" },
    });
    /** @type {__VLS_StyleScopedClasses['drawer-count']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.alertsRead ? 0 : __VLS_ctx.lowStockCount + 5);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drawer-list" },
    });
    /** @type {__VLS_StyleScopedClasses['drawer-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                __VLS_ctx.openSection('inventory');
                __VLS_ctx.showAlertDrawer = false;
                ;
                // @ts-ignore
                [openSection, lowStockCount, showAlertDrawer, alertsRead,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon danger" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    let __VLS_522;
    /** @ts-ignore @type { | typeof __VLS_components.Box} */
    Box;
    // @ts-ignore
    const __VLS_523 = __VLS_asFunctionalComponent1(__VLS_522, new __VLS_522({
        size: (16),
    }));
    const __VLS_524 = __VLS_523({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_523));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.lowStockCount);
    let __VLS_527;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_528 = __VLS_asFunctionalComponent1(__VLS_527, new __VLS_527({
        size: (15),
    }));
    const __VLS_529 = __VLS_528({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_528));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                __VLS_ctx.openSection('merchants');
                __VLS_ctx.showAlertDrawer = false;
                ;
                // @ts-ignore
                [openSection, lowStockCount, showAlertDrawer,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon warning" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    let __VLS_532;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_533 = __VLS_asFunctionalComponent1(__VLS_532, new __VLS_532({
        size: (16),
    }));
    const __VLS_534 = __VLS_533({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_533));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_537;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_538 = __VLS_asFunctionalComponent1(__VLS_537, new __VLS_537({
        size: (15),
    }));
    const __VLS_539 = __VLS_538({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_538));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                __VLS_ctx.openSection('operations');
                __VLS_ctx.showAlertDrawer = false;
                ;
                // @ts-ignore
                [openSection, showAlertDrawer,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon info" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['info']} */ ;
    let __VLS_542;
    /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
    Wrench;
    // @ts-ignore
    const __VLS_543 = __VLS_asFunctionalComponent1(__VLS_542, new __VLS_542({
        size: (16),
    }));
    const __VLS_544 = __VLS_543({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_543));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.activePropertyTicketCount);
    let __VLS_547;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_548 = __VLS_asFunctionalComponent1(__VLS_547, new __VLS_547({
        size: (15),
    }));
    const __VLS_549 = __VLS_548({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_548));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drawer-footer" },
    });
    /** @type {__VLS_StyleScopedClasses['drawer-footer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                return (__VLS_ctx.showAlertDrawer = false);
                // @ts-ignore
                [showAlertDrawer, activePropertyTicketCount,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                __VLS_ctx.alertsRead = true;
                __VLS_ctx.showAlertDrawer = false;
                __VLS_ctx.notify('业务提醒已全部标记为已读');
                ;
                // @ts-ignore
                [showAlertDrawer, alertsRead, notify,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
}
// @ts-ignore
[];
var __VLS_514;
let __VLS_552;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_553 = __VLS_asFunctionalComponent1(__VLS_552, new __VLS_552({
    modelValue: (__VLS_ctx.showAddProduct),
    title: "新建商品档案",
    width: "480px",
}));
const __VLS_554 = __VLS_553({
    modelValue: (__VLS_ctx.showAddProduct),
    title: "新建商品档案",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_553));
const { default: __VLS_557 } = __VLS_555.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-form" },
});
/** @type {__VLS_StyleScopedClasses['dialog-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：轻量跑鞋",
});
(__VLS_ctx.newProduct.name);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：Nike",
});
(__VLS_ctx.newProduct.brand);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.newProduct.category),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-two" },
});
/** @type {__VLS_StyleScopedClasses['form-two']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    min: "0",
});
(__VLS_ctx.newProduct.stock);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    min: "0",
});
(__VLS_ctx.newProduct.price);
{
    const { footer: __VLS_558 } = __VLS_555.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.showAddProduct = false);
                // @ts-ignore
                [showAddProduct, showAddProduct, newProduct, newProduct, newProduct, newProduct, newProduct,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addProduct) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    // @ts-ignore
    [addProduct,];
}
// @ts-ignore
[];
var __VLS_555;
if (__VLS_ctx.showProductDetail) {
    let __VLS_559;
    /** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
    elDialog;
    // @ts-ignore
    const __VLS_560 = __VLS_asFunctionalComponent1(__VLS_559, new __VLS_559({
        modelValue: (__VLS_ctx.productDialogVisible),
        title: "商品详情",
        width: "480px",
    }));
    const __VLS_561 = __VLS_560({
        modelValue: (__VLS_ctx.productDialogVisible),
        title: "商品详情",
        width: "480px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_560));
    const { default: __VLS_564 } = __VLS_562.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-hero" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-hero']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "product-thumb large" },
    });
    /** @type {__VLS_StyleScopedClasses['product-thumb']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    (__VLS_ctx.showProductDetail.category.slice(0, 1));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showProductDetail.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.showProductDetail.brand);
    (__VLS_ctx.showProductDetail.sku);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-tag" },
        ...{ class: (__VLS_ctx.showProductDetail.status === '正常' ? 'success' : 'warning') },
    });
    /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
    (__VLS_ctx.showProductDetail.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showProductDetail.stock);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showProductDetail.age);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showProductDetail.cost);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showProductDetail.price);
    {
        const { footer: __VLS_565 } = __VLS_562.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showProductDetail))
                        throw 0;
                    return (__VLS_ctx.showProductDetail = null);
                    // @ts-ignore
                    [showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, showProductDetail, productDialogVisible,];
                } },
            ...{ class: "ghost-button" },
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showProductDetail))
                        throw 0;
                    return (__VLS_ctx.adjustProductStock(__VLS_ctx.showProductDetail));
                    // @ts-ignore
                    [showProductDetail, adjustProductStock,];
                } },
            ...{ class: "primary-button" },
        });
        /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        let __VLS_566;
        /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
        SlidersHorizontal;
        // @ts-ignore
        const __VLS_567 = __VLS_asFunctionalComponent1(__VLS_566, new __VLS_566({
            size: (16),
        }));
        const __VLS_568 = __VLS_567({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_567));
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_562;
}
let __VLS_571;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_572 = __VLS_asFunctionalComponent1(__VLS_571, new __VLS_571({
    modelValue: (__VLS_ctx.showNewMerchant),
    title: "新增商户",
    width: "480px",
}));
const __VLS_573 = __VLS_572({
    modelValue: (__VLS_ctx.showNewMerchant),
    title: "新增商户",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_572));
const { default: __VLS_576 } = __VLS_574.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-form" },
});
/** @type {__VLS_StyleScopedClasses['dialog-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：北境户外陕西店",
});
(__VLS_ctx.newMerchant.name);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：北境户外",
});
(__VLS_ctx.newMerchant.brand);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "form-two" },
});
/** @type {__VLS_StyleScopedClasses['form-two']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：2F-B15",
});
(__VLS_ctx.newMerchant.floor);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "number",
    min: "1",
});
(__VLS_ctx.newMerchant.area);
{
    const { footer: __VLS_577 } = __VLS_574.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.showNewMerchant = false);
                // @ts-ignore
                [showNewMerchant, showNewMerchant, newMerchant, newMerchant, newMerchant, newMerchant,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.addMerchant) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_578;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_579 = __VLS_asFunctionalComponent1(__VLS_578, new __VLS_578({
        size: (16),
    }));
    const __VLS_580 = __VLS_579({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_579));
    // @ts-ignore
    [addMerchant,];
}
// @ts-ignore
[];
var __VLS_574;
let __VLS_583;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_584 = __VLS_asFunctionalComponent1(__VLS_583, new __VLS_583({
    modelValue: (__VLS_ctx.showActivityDialog),
    title: "创建会员活动",
    width: "480px",
}));
const __VLS_585 = __VLS_584({
    modelValue: (__VLS_ctx.showActivityDialog),
    title: "创建会员活动",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_584));
const { default: __VLS_588 } = __VLS_586.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-form" },
});
/** @type {__VLS_StyleScopedClasses['dialog-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：周末会员专享日",
});
(__VLS_ctx.newActivity.name);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    type: "date",
});
(__VLS_ctx.newActivity.date);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.newActivity.audience),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
{
    const { footer: __VLS_589 } = __VLS_586.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.showActivityDialog = false);
                // @ts-ignore
                [showActivityDialog, showActivityDialog, newActivity, newActivity, newActivity,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.createActivity) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_590;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_591 = __VLS_asFunctionalComponent1(__VLS_590, new __VLS_590({
        size: (16),
    }));
    const __VLS_592 = __VLS_591({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_591));
    // @ts-ignore
    [createActivity,];
}
// @ts-ignore
[];
var __VLS_586;
let __VLS_595;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_596 = __VLS_asFunctionalComponent1(__VLS_595, new __VLS_595({
    modelValue: (__VLS_ctx.showHelpDialog),
    title: "帮助中心",
    width: "560px",
}));
const __VLS_597 = __VLS_596({
    modelValue: (__VLS_ctx.showHelpDialog),
    title: "帮助中心",
    width: "560px",
}, ...__VLS_functionalComponentArgsRest(__VLS_596));
const { default: __VLS_600 } = __VLS_598.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "help-panel" },
});
/** @type {__VLS_StyleScopedClasses['help-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "help-hero" },
});
/** @type {__VLS_StyleScopedClasses['help-hero']} */ ;
let __VLS_601;
/** @ts-ignore @type { | typeof __VLS_components.CircleHelp} */
CircleHelp;
// @ts-ignore
const __VLS_602 = __VLS_asFunctionalComponent1(__VLS_601, new __VLS_601({
    size: (20),
}));
const __VLS_603 = __VLS_602({
    size: (20),
}, ...__VLS_functionalComponentArgsRest(__VLS_602));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "help-list" },
});
/** @type {__VLS_StyleScopedClasses['help-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openSection('inventory');
            __VLS_ctx.showHelpDialog = false;
            ;
            // @ts-ignore
            [openSection, showHelpDialog, showHelpDialog,];
        } },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_606;
/** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
ExternalLink;
// @ts-ignore
const __VLS_607 = __VLS_asFunctionalComponent1(__VLS_606, new __VLS_606({
    size: (14),
}));
const __VLS_608 = __VLS_607({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_607));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openSection('operations');
            __VLS_ctx.showHelpDialog = false;
            ;
            // @ts-ignore
            [openSection, showHelpDialog,];
        } },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_611;
/** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
ExternalLink;
// @ts-ignore
const __VLS_612 = __VLS_asFunctionalComponent1(__VLS_611, new __VLS_611({
    size: (14),
}));
const __VLS_613 = __VLS_612({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_612));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.openMobile('member');
            __VLS_ctx.showHelpDialog = false;
            ;
            // @ts-ignore
            [openMobile, showHelpDialog,];
        } },
});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
let __VLS_616;
/** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
ExternalLink;
// @ts-ignore
const __VLS_617 = __VLS_asFunctionalComponent1(__VLS_616, new __VLS_616({
    size: (14),
}));
const __VLS_618 = __VLS_617({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_617));
// @ts-ignore
[];
var __VLS_598;
let __VLS_621;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_622 = __VLS_asFunctionalComponent1(__VLS_621, new __VLS_621({
    modelValue: (__VLS_ctx.showSettingsDialog),
    title: "系统设置",
    width: "480px",
}));
const __VLS_623 = __VLS_622({
    modelValue: (__VLS_ctx.showSettingsDialog),
    title: "系统设置",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_622));
const { default: __VLS_626 } = __VLS_624.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "settings-panel" },
});
/** @type {__VLS_StyleScopedClasses['settings-panel']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.settingsState.reminders = !__VLS_ctx.settingsState.reminders);
            // @ts-ignore
            [showSettingsDialog, settingsState, settingsState,];
        } },
    ...{ class: "toggle-button" },
    ...{ class: ({ active: __VLS_ctx.settingsState.reminders }) },
});
/** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
(__VLS_ctx.settingsState.reminders ? "已开启" : "已关闭");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.settingsState.dailyPush = !__VLS_ctx.settingsState.dailyPush);
            // @ts-ignore
            [settingsState, settingsState, settingsState, settingsState,];
        } },
    ...{ class: "toggle-button" },
    ...{ class: ({ active: __VLS_ctx.settingsState.dailyPush }) },
});
/** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
(__VLS_ctx.settingsState.dailyPush ? "已开启" : "设置");
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.settingsState.refreshMinutes);
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.settingsState.refreshMinutes =
                __VLS_ctx.settingsState.refreshMinutes === 1 ? 5 : 1);
            // @ts-ignore
            [settingsState, settingsState, settingsState, settingsState, settingsState,];
        } },
    ...{ class: "toggle-button" },
});
/** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
(__VLS_ctx.settingsState.refreshMinutes);
// @ts-ignore
[settingsState,];
var __VLS_624;
let __VLS_627;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_628 = __VLS_asFunctionalComponent1(__VLS_627, new __VLS_627({
    modelValue: (__VLS_ctx.mobileInfoDialogVisible),
    title: (__VLS_ctx.mobileInfoTitle),
    width: "480px",
}));
const __VLS_629 = __VLS_628({
    modelValue: (__VLS_ctx.mobileInfoDialogVisible),
    title: (__VLS_ctx.mobileInfoTitle),
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_628));
const { default: __VLS_632 } = __VLS_630.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "mobile-info-panel" },
});
/** @type {__VLS_StyleScopedClasses['mobile-info-panel']} */ ;
if (__VLS_ctx.mobileInfoKind === 'points') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['info-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'receipts') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
    let __VLS_633;
    /** @ts-ignore @type { | typeof __VLS_components.Tag} */
    Tag;
    // @ts-ignore
    const __VLS_634 = __VLS_asFunctionalComponent1(__VLS_633, new __VLS_633({
        size: (18),
    }));
    const __VLS_635 = __VLS_634({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_634));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.mobileInfoKind === "activity"
        ? "换季清仓活动"
        : "运动专区限时 5 折");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.mobileInfoKind === "activity"
        ? "运动、服饰专区低至 5 折，金卡会员再享双倍积分。"
        : "会员专享 · 还剩 2 天");
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'merchantSales') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['info-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'merchantActivity') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'merchantRepair') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
    let __VLS_638;
    /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
    Wrench;
    // @ts-ignore
    const __VLS_639 = __VLS_asFunctionalComponent1(__VLS_638, new __VLS_638({
        size: (18),
    }));
    const __VLS_640 = __VLS_639({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_639));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                __VLS_ctx.mobileInfoDialogVisible = false;
                __VLS_ctx.showNewTicket = true;
                __VLS_ctx.operationModule = 'property';
                ;
                // @ts-ignore
                [operationModule, showNewTicket, mobileInfoDialogVisible, mobileInfoDialogVisible, mobileInfoTitle, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind, mobileInfoKind,];
            } },
        ...{ class: "primary-button info-action" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['info-action']} */ ;
}
else if (__VLS_ctx.mobileInfoKind === 'bill') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.mobileBillConfirmed ? "已确认" : "待确认");
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'invoice') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-banner" },
    });
    /** @type {__VLS_StyleScopedClasses['info-banner']} */ ;
    let __VLS_643;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_644 = __VLS_asFunctionalComponent1(__VLS_643, new __VLS_643({
        size: (18),
    }));
    const __VLS_645 = __VLS_644({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_644));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({
        ...{ class: "info-field" },
    });
    /** @type {__VLS_StyleScopedClasses['info-field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: "运动集合店",
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'bill'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'invoice'))
                    throw 0;
                __VLS_ctx.mobileInfoDialogVisible = false;
                __VLS_ctx.notify('电子发票申请已提交');
                ;
                // @ts-ignore
                [mobileBillConfirmed, notify, mobileInfoDialogVisible, mobileInfoKind, mobileInfoKind,];
            } },
        ...{ class: "primary-button info-action" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['info-action']} */ ;
}
else if (__VLS_ctx.mobileInfoKind === 'profile') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "dialog-form" },
    });
    /** @type {__VLS_StyleScopedClasses['dialog-form']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.mobileRole === 'member' ? '王女士' : '运动集合店'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.mobileRole === 'member' ? '138****8260' : '0913-2858166'),
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        value: (__VLS_ctx.mobileRole === 'member' ? '渭南市临渭区' : '1F-A12'),
    });
}
else if (__VLS_ctx.mobileInfoKind === 'security') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "settings-panel" },
    });
    /** @type {__VLS_StyleScopedClasses['settings-panel']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'bill'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'invoice'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'profile'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'security'))
                    throw 0;
                return (__VLS_ctx.notify('手机号修改入口已打开'));
                // @ts-ignore
                [mobileRole, mobileRole, mobileRole, notify, mobileInfoKind, mobileInfoKind,];
            } },
        ...{ class: "toggle-button" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'bill'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'invoice'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'profile'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'security'))
                    throw 0;
                return (__VLS_ctx.notify('消息提醒已开启'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "toggle-button active" },
    });
    /** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
}
else if (__VLS_ctx.mobileInfoKind === 'contact') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
else if (__VLS_ctx.mobileInfoKind === 'support') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "help-list" },
    });
    /** @type {__VLS_StyleScopedClasses['help-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'bill'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'invoice'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'profile'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'security'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'contact'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'support'))
                    throw 0;
                return (__VLS_ctx.notify('常见问题已打开'));
                // @ts-ignore
                [notify, mobileInfoKind, mobileInfoKind,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_648;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_649 = __VLS_asFunctionalComponent1(__VLS_648, new __VLS_648({
        size: (14),
    }));
    const __VLS_650 = __VLS_649({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_649));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.mobileInfoKind === 'points'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'receipts'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'activity' || __VLS_ctx.mobileInfoKind === 'recommendation'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantSales'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantActivity'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'merchantRepair'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'bill'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'invoice'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'profile'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'security'))
                    throw 0;
                if (!!(__VLS_ctx.mobileInfoKind === 'contact'))
                    throw 0;
                if (!(__VLS_ctx.mobileInfoKind === 'support'))
                    throw 0;
                return (__VLS_ctx.notify('在线客服将在 5 分钟内响应'));
                // @ts-ignore
                [notify,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_653;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_654 = __VLS_asFunctionalComponent1(__VLS_653, new __VLS_653({
        size: (14),
    }));
    const __VLS_655 = __VLS_654({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_654));
}
else if (__VLS_ctx.mobileInfoKind === 'parking') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-summary" },
    });
    /** @type {__VLS_StyleScopedClasses['info-summary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "info-list" },
    });
    /** @type {__VLS_StyleScopedClasses['info-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.small, __VLS_intrinsics.small)({});
}
// @ts-ignore
[mobileInfoKind,];
var __VLS_630;
if (__VLS_ctx.showMerchantDetail) {
    let __VLS_658;
    /** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
    elDialog;
    // @ts-ignore
    const __VLS_659 = __VLS_asFunctionalComponent1(__VLS_658, new __VLS_658({
        modelValue: (__VLS_ctx.merchantDialogVisible),
        title: "商户经营详情",
        width: "560px",
    }));
    const __VLS_660 = __VLS_659({
        modelValue: (__VLS_ctx.merchantDialogVisible),
        title: "商户经营详情",
        width: "560px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_659));
    const { default: __VLS_663 } = __VLS_661.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-hero" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-hero']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "brand-avatar large" },
    });
    /** @type {__VLS_StyleScopedClasses['brand-avatar']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    (__VLS_ctx.showMerchantDetail.brand.slice(0, 1));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.showMerchantDetail.brand);
    (__VLS_ctx.showMerchantDetail.floor);
    (__VLS_ctx.showMerchantDetail.area);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "status-tag success" },
    });
    /** @type {__VLS_StyleScopedClasses['status-tag']} */ ;
    /** @type {__VLS_StyleScopedClasses['success']} */ ;
    (__VLS_ctx.showMerchantDetail.status);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.model);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.sales.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.bill.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (Math.round(__VLS_ctx.showMerchantDetail.sales / __VLS_ctx.showMerchantDetail.area).toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-notice" },
        ...{ class: (__VLS_ctx.showMerchantDetail.status === '欠费预警' ? 'danger-notice' : '') },
    });
    /** @type {__VLS_StyleScopedClasses['detail-notice']} */ ;
    let __VLS_664;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_665 = __VLS_asFunctionalComponent1(__VLS_664, new __VLS_664({
        size: (17),
    }));
    const __VLS_666 = __VLS_665({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_665));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.status === "欠费预警"
        ? "该商户存在待缴账单"
        : "8 月对账单已生成");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    {
        const { footer: __VLS_669 } = __VLS_661.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMerchantDetail))
                        throw 0;
                    return (__VLS_ctx.showMerchantDetail = null);
                    // @ts-ignore
                    [showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, showMerchantDetail, merchantDialogVisible,];
                } },
            ...{ class: "ghost-button" },
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMerchantDetail))
                        throw 0;
                    __VLS_ctx.confirmBill(__VLS_ctx.showMerchantDetail);
                    __VLS_ctx.showMerchantDetail = null;
                    ;
                    // @ts-ignore
                    [showMerchantDetail, showMerchantDetail, confirmBill,];
                } },
            ...{ class: "primary-button" },
        });
        /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        let __VLS_670;
        /** @ts-ignore @type { | typeof __VLS_components.Check} */
        Check;
        // @ts-ignore
        const __VLS_671 = __VLS_asFunctionalComponent1(__VLS_670, new __VLS_670({
            size: (16),
        }));
        const __VLS_672 = __VLS_671({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_671));
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_661;
}
let __VLS_675;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_676 = __VLS_asFunctionalComponent1(__VLS_675, new __VLS_675({
    modelValue: (__VLS_ctx.showNewTicket),
    title: "新建物业工单",
    width: "480px",
}));
const __VLS_677 = __VLS_676({
    modelValue: (__VLS_ctx.showNewTicket),
    title: "新建物业工单",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_676));
const { default: __VLS_680 } = __VLS_678.slots;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "dialog-form" },
});
/** @type {__VLS_StyleScopedClasses['dialog-form']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：1F-A12 门头灯不亮",
});
(__VLS_ctx.newTicket.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.input)({
    placeholder: "例如：1F-A12",
});
(__VLS_ctx.newTicket.location);
__VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.select, __VLS_intrinsics.select)({
    value: (__VLS_ctx.newTicket.requester),
});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.option, __VLS_intrinsics.option)({});
{
    const { footer: __VLS_681 } = __VLS_678.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                return (__VLS_ctx.showNewTicket = false);
                // @ts-ignore
                [showNewTicket, showNewTicket, newTicket, newTicket, newTicket,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.createPropertyTicket) },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    // @ts-ignore
    [createPropertyTicket,];
}
// @ts-ignore
[];
var __VLS_678;
if (__VLS_ctx.showMemberDetail) {
    let __VLS_682;
    /** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
    elDialog;
    // @ts-ignore
    const __VLS_683 = __VLS_asFunctionalComponent1(__VLS_682, new __VLS_682({
        modelValue: (__VLS_ctx.memberDialogVisible),
        title: "会员档案",
        width: "520px",
    }));
    const __VLS_684 = __VLS_683({
        modelValue: (__VLS_ctx.memberDialogVisible),
        title: "会员档案",
        width: "520px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_683));
    const { default: __VLS_687 } = __VLS_685.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-detail-head" },
    });
    /** @type {__VLS_StyleScopedClasses['member-detail-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "member-avatar large" },
    });
    /** @type {__VLS_StyleScopedClasses['member-avatar']} */ ;
    /** @type {__VLS_StyleScopedClasses['large']} */ ;
    (__VLS_ctx.showMemberDetail.name.slice(0, 1));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMemberDetail.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.showMemberDetail.phone);
    (__VLS_ctx.showMemberDetail.id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "level-tag 金" },
    });
    /** @type {__VLS_StyleScopedClasses['level-tag']} */ ;
    /** @type {__VLS_StyleScopedClasses['金']} */ ;
    (__VLS_ctx.showMemberDetail.level);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-grid']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMemberDetail.spend.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMemberDetail.points.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMemberDetail.lastVisit);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMemberDetail.tag);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "detail-notice" },
    });
    /** @type {__VLS_StyleScopedClasses['detail-notice']} */ ;
    let __VLS_688;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_689 = __VLS_asFunctionalComponent1(__VLS_688, new __VLS_688({
        size: (17),
    }));
    const __VLS_690 = __VLS_689({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_689));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    {
        const { footer: __VLS_693 } = __VLS_685.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMemberDetail))
                        throw 0;
                    return (__VLS_ctx.showMemberDetail = null);
                    // @ts-ignore
                    [showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, showMemberDetail, memberDialogVisible,];
                } },
            ...{ class: "ghost-button" },
        });
        /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showMemberDetail))
                        throw 0;
                    __VLS_ctx.sendCoupon(__VLS_ctx.showMemberDetail);
                    __VLS_ctx.showMemberDetail = null;
                    ;
                    // @ts-ignore
                    [showMemberDetail, showMemberDetail, sendCoupon,];
                } },
            ...{ class: "primary-button" },
        });
        /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
        let __VLS_694;
        /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
        Ticket;
        // @ts-ignore
        const __VLS_695 = __VLS_asFunctionalComponent1(__VLS_694, new __VLS_694({
            size: (16),
        }));
        const __VLS_696 = __VLS_695({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_695));
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_685;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
