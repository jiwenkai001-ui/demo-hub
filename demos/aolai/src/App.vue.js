import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Bell, Box, BriefcaseBusiness, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard, Download, ExternalLink, FileCheck2, LayoutDashboard, Menu, MessageSquare, MoreHorizontal, Plus, RefreshCcw, Search, Settings2, ShoppingBag, SlidersHorizontal, Smartphone, Store, Tag, Ticket, TrendingUp, UserRound, Users, WalletCards, Wrench, X, } from "lucide-vue-next";
import { defaultState, members as seedMembers, merchants as seedMerchants, products as seedProducts, salesTrend, } from "./mock";
const activeSection = ref("dashboard");
const mobileOpen = ref(false);
const mobileRole = ref("member");
const mobileTab = ref("home");
const mobileBillConfirmed = ref(false);
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
    return (!keyword ||
        `${item.name}${item.phone}${item.tag}`.toLowerCase().includes(keyword));
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
function notify(message) {
    toastMessage.value = message;
    ElMessage({ message, type: "success", duration: 2200 });
}
function resetDemo() {
    products.value = defaultState.products.map((item) => ({ ...item }));
    merchants.value = defaultState.merchants.map((item) => ({ ...item }));
    memberList.value = defaultState.members.map((item) => ({ ...item }));
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
function openSection(section) {
    activeSection.value = section;
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
function confirmBill(merchant) {
    merchant.status = "正常经营";
    notify(`${merchant.name} 的月度对账单已确认`);
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
    mobileOpen.value = true;
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
            return (__VLS_ctx.notify('帮助中心正在整理本项目演示手册'));
            // @ts-ignore
            [notify,];
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
            return (__VLS_ctx.notify('系统设置暂为演示入口'));
            // @ts-ignore
            [notify,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (...[$event]) => {
            return (__VLS_ctx.openMobile('member'));
            // @ts-ignore
            [openMobile,];
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
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                return (__VLS_ctx.notify('经营日报已准备下载'));
                // @ts-ignore
                [activeSection, notify,];
            } },
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
                [openSection,];
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
        ...{ class: "select-button" },
    });
    /** @type {__VLS_StyleScopedClasses['select-button']} */ ;
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
        [];
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
                [openSection,];
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
        ...{ class: "icon-button" },
        title: "筛选",
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
                        return (__VLS_ctx.notify(`${product.name} 的更多操作已打开`));
                        // @ts-ignore
                        [notify,];
                    } },
                ...{ class: "more-action" },
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
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
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                return (__VLS_ctx.notify('租赁报表已准备下载'));
                // @ts-ignore
                [activeSection, notify, filteredProducts, filteredProducts,];
            } },
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
                return (__VLS_ctx.notify('招商录入表单已打开'));
                // @ts-ignore
                [notify,];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "select-button" },
    });
    /** @type {__VLS_StyleScopedClasses['select-button']} */ ;
    let __VLS_195;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195({
        size: (14),
    }));
    const __VLS_197 = __VLS_196({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_196));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "icon-button" },
        title: "筛选",
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_200;
    /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
    SlidersHorizontal;
    // @ts-ignore
    const __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200({
        size: (17),
    }));
    const __VLS_202 = __VLS_201({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_201));
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
                    [merchants, merchantSearch, filteredMerchants, showMerchantDetail,];
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
                    [showMerchantDetail,];
                } },
            ...{ class: "table-action subtle" },
        });
        /** @type {__VLS_StyleScopedClasses['table-action']} */ ;
        /** @type {__VLS_StyleScopedClasses['subtle']} */ ;
        let __VLS_205;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205({
            size: (14),
        }));
        const __VLS_207 = __VLS_206({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_206));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
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
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.activeSection === 'dashboard'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.notify('会员运营月报已生成'));
                // @ts-ignore
                [activeSection, notify, filteredMerchants,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_210;
    /** @ts-ignore @type { | typeof __VLS_components.Download} */
    Download;
    // @ts-ignore
    const __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210({
        size: (16),
    }));
    const __VLS_212 = __VLS_211({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_211));
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
                return (__VLS_ctx.notify('营销活动创建入口已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_215;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
        size: (16),
    }));
    const __VLS_217 = __VLS_216({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_216));
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
    let __VLS_220;
    /** @ts-ignore @type { | typeof __VLS_components.Users} */
    Users;
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
        ...{ class: "kpi-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    let __VLS_225;
    /** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
    TrendingUp;
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
        ...{ class: "kpi-icon green" },
    });
    /** @type {__VLS_StyleScopedClasses['kpi-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    let __VLS_230;
    /** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
    RefreshCcw;
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
    let __VLS_235;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_236 = __VLS_asFunctionalComponent1(__VLS_235, new __VLS_235({
        size: (17),
    }));
    const __VLS_237 = __VLS_236({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_236));
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
    let __VLS_240;
    /** @ts-ignore @type { | typeof __VLS_components.Search} */
    Search;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
        size: (16),
    }));
    const __VLS_242 = __VLS_241({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
    __VLS_asFunctionalElement1(__VLS_intrinsics.input)({
        placeholder: "搜索姓名、手机号或会员标签",
    });
    (__VLS_ctx.memberSearch);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "filter-tabs" },
    });
    /** @type {__VLS_StyleScopedClasses['filter-tabs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "active" },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ class: "icon-button" },
        title: "筛选",
    });
    /** @type {__VLS_StyleScopedClasses['icon-button']} */ ;
    let __VLS_245;
    /** @ts-ignore @type { | typeof __VLS_components.SlidersHorizontal} */
    SlidersHorizontal;
    // @ts-ignore
    const __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245({
        size: (17),
    }));
    const __VLS_247 = __VLS_246({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_246));
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
                    [memberSearch, filteredMembers, showMemberDetail,];
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
        let __VLS_250;
        /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
        Ticket;
        // @ts-ignore
        const __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250({
            size: (14),
        }));
        const __VLS_252 = __VLS_251({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_251));
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
}
else {
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
                if (!!(__VLS_ctx.activeSection === 'inventory'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'merchants'))
                    throw 0;
                if (!!(__VLS_ctx.activeSection === 'members'))
                    throw 0;
                return (__VLS_ctx.notify('协同数据已刷新'));
                // @ts-ignore
                [notify, filteredMembers,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    let __VLS_255;
    /** @ts-ignore @type { | typeof __VLS_components.RefreshCcw} */
    RefreshCcw;
    // @ts-ignore
    const __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255({
        size: (16),
    }));
    const __VLS_257 = __VLS_256({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_256));
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
                return (__VLS_ctx.notify('工单创建入口已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
    let __VLS_260;
    /** @ts-ignore @type { | typeof __VLS_components.Plus} */
    Plus;
    // @ts-ignore
    const __VLS_261 = __VLS_asFunctionalComponent1(__VLS_260, new __VLS_260({
        size: (16),
    }));
    const __VLS_262 = __VLS_261({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_261));
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
                return (__VLS_ctx.notify('招商跟进列表已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "operation-card" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "operation-icon orange" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['orange']} */ ;
    let __VLS_265;
    /** @ts-ignore @type { | typeof __VLS_components.BriefcaseBusiness} */
    BriefcaseBusiness;
    // @ts-ignore
    const __VLS_266 = __VLS_asFunctionalComponent1(__VLS_265, new __VLS_265({
        size: (18),
    }));
    const __VLS_267 = __VLS_266({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_266));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_270;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270({
        size: (16),
    }));
    const __VLS_272 = __VLS_271({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_271));
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
                return (__VLS_ctx.notify('统一收银日报已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "operation-card" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "operation-icon blue" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['blue']} */ ;
    let __VLS_275;
    /** @ts-ignore @type { | typeof __VLS_components.CreditCard} */
    CreditCard;
    // @ts-ignore
    const __VLS_276 = __VLS_asFunctionalComponent1(__VLS_275, new __VLS_275({
        size: (18),
    }));
    const __VLS_277 = __VLS_276({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_276));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_280;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
        size: (16),
    }));
    const __VLS_282 = __VLS_281({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_281));
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
                return (__VLS_ctx.notify('物业工单已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "operation-card" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "operation-icon green" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['green']} */ ;
    let __VLS_285;
    /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
    Wrench;
    // @ts-ignore
    const __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
        size: (18),
    }));
    const __VLS_287 = __VLS_286({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_286));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_290;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290({
        size: (16),
    }));
    const __VLS_292 = __VLS_291({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_291));
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
                return (__VLS_ctx.notify('停车权益配置已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "operation-card" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-card']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "operation-icon purple" },
    });
    /** @type {__VLS_StyleScopedClasses['operation-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['purple']} */ ;
    let __VLS_295;
    /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
    CalendarDays;
    // @ts-ignore
    const __VLS_296 = __VLS_asFunctionalComponent1(__VLS_295, new __VLS_295({
        size: (18),
    }));
    const __VLS_297 = __VLS_296({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_296));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_300;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_301 = __VLS_asFunctionalComponent1(__VLS_300, new __VLS_300({
        size: (16),
    }));
    const __VLS_302 = __VLS_301({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_301));
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
                return (__VLS_ctx.notify('工单列表已打开'));
                // @ts-ignore
                [notify,];
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
        ...{ class: "ticket-list" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-list']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-row" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-status ongoing" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-status']} */ ;
    /** @type {__VLS_StyleScopedClasses['ongoing']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ticket-owner" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-owner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-row" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-status waiting" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-status']} */ ;
    /** @type {__VLS_StyleScopedClasses['waiting']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ticket-owner" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-owner']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-row" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "ticket-status ongoing" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-status']} */ ;
    /** @type {__VLS_StyleScopedClasses['ongoing']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "ticket-owner" },
    });
    /** @type {__VLS_StyleScopedClasses['ticket-owner']} */ ;
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
                return (__VLS_ctx.notify('铺位图已打开'));
                // @ts-ignore
                [notify,];
            } },
        ...{ class: "link-button" },
    });
    /** @type {__VLS_StyleScopedClasses['link-button']} */ ;
    let __VLS_310;
    /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
    ExternalLink;
    // @ts-ignore
    const __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310({
        size: (14),
    }));
    const __VLS_312 = __VLS_311({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_311));
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
}
let __VLS_315;
/** @ts-ignore @type { | typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
const __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315({
    name: "fade",
}));
const __VLS_317 = __VLS_316({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_316));
const { default: __VLS_320 } = __VLS_318.slots;
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
    let __VLS_321;
    /** @ts-ignore @type { | typeof __VLS_components.X} */
    X;
    // @ts-ignore
    const __VLS_322 = __VLS_asFunctionalComponent1(__VLS_321, new __VLS_321({
        size: (17),
    }));
    const __VLS_323 = __VLS_322({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_322));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "role-switch" },
    });
    /** @type {__VLS_StyleScopedClasses['role-switch']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileRole = 'member');
                // @ts-ignore
                [mobileRole,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileRole === 'member' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_326;
    /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
    UserRound;
    // @ts-ignore
    const __VLS_327 = __VLS_asFunctionalComponent1(__VLS_326, new __VLS_326({
        size: (14),
    }));
    const __VLS_328 = __VLS_327({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_327));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mobileOpen))
                    throw 0;
                return (__VLS_ctx.mobileRole = 'merchant');
                // @ts-ignore
                [mobileRole, mobileRole,];
            } },
        ...{ class: ({ active: __VLS_ctx.mobileRole === 'merchant' }) },
    });
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    let __VLS_331;
    /** @ts-ignore @type { | typeof __VLS_components.Store} */
    Store;
    // @ts-ignore
    const __VLS_332 = __VLS_asFunctionalComponent1(__VLS_331, new __VLS_331({
        size: (14),
    }));
    const __VLS_333 = __VLS_332({
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_332));
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
                        return (__VLS_ctx.notify('积分明细已打开'));
                        // @ts-ignore
                        [notify, mobileRole, mobileRole, mobileTab,];
                    } },
            });
            let __VLS_336;
            /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
            ExternalLink;
            // @ts-ignore
            const __VLS_337 = __VLS_asFunctionalComponent1(__VLS_336, new __VLS_336({
                size: (12),
            }));
            const __VLS_338 = __VLS_337({
                size: (12),
            }, ...__VLS_functionalComponentArgsRest(__VLS_337));
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
                        return (__VLS_ctx.notify('全部权益已打开'));
                        // @ts-ignore
                        [notify,];
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
                        return (__VLS_ctx.notify('优惠券列表已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon coupon" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['coupon']} */ ;
            let __VLS_341;
            /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
            Ticket;
            // @ts-ignore
            const __VLS_342 = __VLS_asFunctionalComponent1(__VLS_341, new __VLS_341({
                size: (17),
            }));
            const __VLS_343 = __VLS_342({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_342));
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
                        return (__VLS_ctx.notify('停车权益已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon parking" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['parking']} */ ;
            let __VLS_346;
            /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
            CalendarDays;
            // @ts-ignore
            const __VLS_347 = __VLS_asFunctionalComponent1(__VLS_346, new __VLS_346({
                size: (17),
            }));
            const __VLS_348 = __VLS_347({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_347));
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
                        return (__VLS_ctx.notify('电子小票已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon receipt" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['receipt']} */ ;
            let __VLS_351;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_352 = __VLS_asFunctionalComponent1(__VLS_351, new __VLS_351({
                size: (17),
            }));
            const __VLS_353 = __VLS_352({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_352));
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
                        return (__VLS_ctx.notify('活动中心已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "benefit-icon event" },
            });
            /** @type {__VLS_StyleScopedClasses['benefit-icon']} */ ;
            /** @type {__VLS_StyleScopedClasses['event']} */ ;
            let __VLS_356;
            /** @ts-ignore @type { | typeof __VLS_components.Tag} */
            Tag;
            // @ts-ignore
            const __VLS_357 = __VLS_asFunctionalComponent1(__VLS_356, new __VLS_356({
                size: (17),
            }));
            const __VLS_358 = __VLS_357({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_357));
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
                        return (__VLS_ctx.notify('推荐商品已打开'));
                        // @ts-ignore
                        [notify,];
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
                        return (__VLS_ctx.notify('活动详情已打开'));
                        // @ts-ignore
                        [notify,];
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
                        return (__VLS_ctx.notify('优惠券已领取'));
                        // @ts-ignore
                        [notify,];
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
                        return (__VLS_ctx.notify('月度账单已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            let __VLS_361;
            /** @ts-ignore @type { | typeof __VLS_components.WalletCards} */
            WalletCards;
            // @ts-ignore
            const __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({
                size: (18),
            }));
            const __VLS_363 = __VLS_362({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_362));
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
                        return (__VLS_ctx.notify('销售明细已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            let __VLS_366;
            /** @ts-ignore @type { | typeof __VLS_components.TrendingUp} */
            TrendingUp;
            // @ts-ignore
            const __VLS_367 = __VLS_asFunctionalComponent1(__VLS_366, new __VLS_366({
                size: (18),
            }));
            const __VLS_368 = __VLS_367({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_367));
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
                        return (__VLS_ctx.notify('活动报名已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            let __VLS_371;
            /** @ts-ignore @type { | typeof __VLS_components.Tag} */
            Tag;
            // @ts-ignore
            const __VLS_372 = __VLS_asFunctionalComponent1(__VLS_371, new __VLS_371({
                size: (18),
            }));
            const __VLS_373 = __VLS_372({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_372));
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
                        return (__VLS_ctx.notify('报修申请已打开'));
                        // @ts-ignore
                        [notify,];
                    } },
            });
            let __VLS_376;
            /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
            Wrench;
            // @ts-ignore
            const __VLS_377 = __VLS_asFunctionalComponent1(__VLS_376, new __VLS_376({
                size: (18),
            }));
            const __VLS_378 = __VLS_377({
                size: (18),
            }, ...__VLS_functionalComponentArgsRest(__VLS_377));
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
            let __VLS_381;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381({
                size: (17),
            }));
            const __VLS_383 = __VLS_382({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_382));
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
                            [mobileRole, mobileTab, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, confirmMobileBill, memberCoupons, claimCoupon,];
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
            let __VLS_386;
            /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
            CalendarDays;
            // @ts-ignore
            const __VLS_387 = __VLS_asFunctionalComponent1(__VLS_386, new __VLS_386({
                size: (17),
            }));
            const __VLS_388 = __VLS_387({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_387));
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
                        return (__VLS_ctx.notify('停车权益详情已打开'));
                        // @ts-ignore
                        [notify,];
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
                        return (__VLS_ctx.notify('7 月对账单已打开'));
                        // @ts-ignore
                        [notify, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, mobileBillConfirmed, confirmMobileBill,];
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
                        return (__VLS_ctx.notify('6 月对账单已打开'));
                        // @ts-ignore
                        [notify,];
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
            let __VLS_391;
            /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
            FileCheck2;
            // @ts-ignore
            const __VLS_392 = __VLS_asFunctionalComponent1(__VLS_391, new __VLS_391({
                size: (17),
            }));
            const __VLS_393 = __VLS_392({
                size: (17),
            }, ...__VLS_functionalComponentArgsRest(__VLS_392));
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
                        return (__VLS_ctx.notify('开票申请已打开'));
                        // @ts-ignore
                        [notify,];
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
            ...{ class: "active" },
        });
        /** @type {__VLS_StyleScopedClasses['active']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({});
        (__VLS_ctx.mobileRole === "member" ? "权益" : "账单");
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "mobile-message-list" },
        });
        /** @type {__VLS_StyleScopedClasses['mobile-message-list']} */ ;
        for (const [message] of __VLS_vFor((__VLS_ctx.mobileMessages[__VLS_ctx.mobileRole]))) {
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
                        [mobileRole, mobileRole, mobileTab, mobileUnreadCount, mobileUnreadCount, readAllMobileMessages, mobileMessages, readMobileMessage,];
                    } },
                key: (message.id),
                ...{ class: ({ unread: !message.read }) },
            });
            /** @type {__VLS_StyleScopedClasses['unread']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "message-icon" },
            });
            /** @type {__VLS_StyleScopedClasses['message-icon']} */ ;
            let __VLS_396;
            /** @ts-ignore @type { | typeof __VLS_components.Bell} */
            Bell;
            // @ts-ignore
            const __VLS_397 = __VLS_asFunctionalComponent1(__VLS_396, new __VLS_396({
                size: (16),
            }));
            const __VLS_398 = __VLS_397({
                size: (16),
            }, ...__VLS_functionalComponentArgsRest(__VLS_397));
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
            let __VLS_401;
            /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
            ChevronDown;
            // @ts-ignore
            const __VLS_402 = __VLS_asFunctionalComponent1(__VLS_401, new __VLS_401({
                size: (14),
            }));
            const __VLS_403 = __VLS_402({
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_402));
            // @ts-ignore
            [];
        }
        if (!__VLS_ctx.mobileUnreadCount) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mobile-read-tip" },
            });
            /** @type {__VLS_StyleScopedClasses['mobile-read-tip']} */ ;
            let __VLS_406;
            /** @ts-ignore @type { | typeof __VLS_components.Check} */
            Check;
            // @ts-ignore
            const __VLS_407 = __VLS_asFunctionalComponent1(__VLS_406, new __VLS_406({
                size: (15),
            }));
            const __VLS_408 = __VLS_407({
                size: (15),
            }, ...__VLS_functionalComponentArgsRest(__VLS_407));
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
                    return (__VLS_ctx.notify('资料编辑已打开'));
                    // @ts-ignore
                    [notify, mobileRole, mobileRole, mobileRole, mobileRole, mobileRole, mobileUnreadCount,];
                } },
        });
        let __VLS_411;
        /** @ts-ignore @type { | typeof __VLS_components.ExternalLink} */
        ExternalLink;
        // @ts-ignore
        const __VLS_412 = __VLS_asFunctionalComponent1(__VLS_411, new __VLS_411({
            size: (12),
        }));
        const __VLS_413 = __VLS_412({
            size: (12),
        }, ...__VLS_functionalComponentArgsRest(__VLS_412));
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
                    return (__VLS_ctx.notify(__VLS_ctx.mobileRole === 'member'
                        ? '会员资料已打开'
                        : '商户资料已打开'));
                    // @ts-ignore
                    [notify, mobileRole, mobileRole, mobileRole, mobileRole,];
                } },
        });
        let __VLS_416;
        /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
        UserRound;
        // @ts-ignore
        const __VLS_417 = __VLS_asFunctionalComponent1(__VLS_416, new __VLS_416({
            size: (17),
        }));
        const __VLS_418 = __VLS_417({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_417));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.mobileRole === "member" ? "会员资料" : "商户资料");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_421;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_422 = __VLS_asFunctionalComponent1(__VLS_421, new __VLS_421({
            size: (14),
        }));
        const __VLS_423 = __VLS_422({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_422));
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
                    return (__VLS_ctx.notify('安全设置已打开'));
                    // @ts-ignore
                    [notify, mobileRole,];
                } },
        });
        let __VLS_426;
        /** @ts-ignore @type { | typeof __VLS_components.Settings2} */
        Settings2;
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
        let __VLS_431;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_432 = __VLS_asFunctionalComponent1(__VLS_431, new __VLS_431({
            size: (14),
        }));
        const __VLS_433 = __VLS_432({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_432));
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
                    return (__VLS_ctx.notify(__VLS_ctx.mobileRole === 'member'
                        ? '我的停车车辆已打开'
                        : '联系人管理已打开'));
                    // @ts-ignore
                    [notify, mobileRole,];
                } },
        });
        let __VLS_436;
        /** @ts-ignore @type { | typeof __VLS_components.CalendarDays} */
        CalendarDays;
        // @ts-ignore
        const __VLS_437 = __VLS_asFunctionalComponent1(__VLS_436, new __VLS_436({
            size: (17),
        }));
        const __VLS_438 = __VLS_437({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_437));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.mobileRole === "member" ? "我的车辆" : "联系人管理");
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.mobileRole === "member"
            ? "停车权益与车牌管理"
            : "财务及运营联系人");
        let __VLS_441;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_442 = __VLS_asFunctionalComponent1(__VLS_441, new __VLS_441({
            size: (14),
        }));
        const __VLS_443 = __VLS_442({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_442));
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
                    return (__VLS_ctx.notify('帮助与客服已打开'));
                    // @ts-ignore
                    [notify, mobileRole, mobileRole,];
                } },
        });
        let __VLS_446;
        /** @ts-ignore @type { | typeof __VLS_components.CircleHelp} */
        CircleHelp;
        // @ts-ignore
        const __VLS_447 = __VLS_asFunctionalComponent1(__VLS_446, new __VLS_446({
            size: (17),
        }));
        const __VLS_448 = __VLS_447({
            size: (17),
        }, ...__VLS_functionalComponentArgsRest(__VLS_447));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        let __VLS_451;
        /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
        ChevronDown;
        // @ts-ignore
        const __VLS_452 = __VLS_asFunctionalComponent1(__VLS_451, new __VLS_451({
            size: (14),
        }));
        const __VLS_453 = __VLS_452({
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_452));
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
    let __VLS_456;
    /** @ts-ignore @type { | typeof __VLS_components.LayoutDashboard} */
    LayoutDashboard;
    // @ts-ignore
    const __VLS_457 = __VLS_asFunctionalComponent1(__VLS_456, new __VLS_456({
        size: (18),
    }));
    const __VLS_458 = __VLS_457({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_457));
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
    let __VLS_461;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_462 = __VLS_asFunctionalComponent1(__VLS_461, new __VLS_461({
        size: (18),
    }));
    const __VLS_463 = __VLS_462({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_462));
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
    let __VLS_466;
    /** @ts-ignore @type { | typeof __VLS_components.MessageSquare} */
    MessageSquare;
    // @ts-ignore
    const __VLS_467 = __VLS_asFunctionalComponent1(__VLS_466, new __VLS_466({
        size: (18),
    }));
    const __VLS_468 = __VLS_467({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_467));
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
    let __VLS_471;
    /** @ts-ignore @type { | typeof __VLS_components.UserRound} */
    UserRound;
    // @ts-ignore
    const __VLS_472 = __VLS_asFunctionalComponent1(__VLS_471, new __VLS_471({
        size: (18),
    }));
    const __VLS_473 = __VLS_472({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_472));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
}
// @ts-ignore
[mobileTab,];
var __VLS_318;
let __VLS_476;
/** @ts-ignore @type { | typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
const __VLS_477 = __VLS_asFunctionalComponent1(__VLS_476, new __VLS_476({
    name: "drawer",
}));
const __VLS_478 = __VLS_477({
    name: "drawer",
}, ...__VLS_functionalComponentArgsRest(__VLS_477));
const { default: __VLS_481 } = __VLS_479.slots;
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
    let __VLS_482;
    /** @ts-ignore @type { | typeof __VLS_components.X} */
    X;
    // @ts-ignore
    const __VLS_483 = __VLS_asFunctionalComponent1(__VLS_482, new __VLS_482({
        size: (18),
    }));
    const __VLS_484 = __VLS_483({
        size: (18),
    }, ...__VLS_functionalComponentArgsRest(__VLS_483));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "drawer-count" },
    });
    /** @type {__VLS_StyleScopedClasses['drawer-count']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.lowStockCount + 5);
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
                [openSection, lowStockCount, showAlertDrawer,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon danger" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger']} */ ;
    let __VLS_487;
    /** @ts-ignore @type { | typeof __VLS_components.Box} */
    Box;
    // @ts-ignore
    const __VLS_488 = __VLS_asFunctionalComponent1(__VLS_487, new __VLS_487({
        size: (16),
    }));
    const __VLS_489 = __VLS_488({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_488));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_492;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_493 = __VLS_asFunctionalComponent1(__VLS_492, new __VLS_492({
        size: (15),
    }));
    const __VLS_494 = __VLS_493({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_493));
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                __VLS_ctx.openSection('merchants');
                __VLS_ctx.showAlertDrawer = false;
                ;
                // @ts-ignore
                [openSection, showAlertDrawer,];
            } },
    });
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "alert-icon warning" },
    });
    /** @type {__VLS_StyleScopedClasses['alert-icon']} */ ;
    /** @type {__VLS_StyleScopedClasses['warning']} */ ;
    let __VLS_497;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_498 = __VLS_asFunctionalComponent1(__VLS_497, new __VLS_497({
        size: (16),
    }));
    const __VLS_499 = __VLS_498({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_498));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_502;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_503 = __VLS_asFunctionalComponent1(__VLS_502, new __VLS_502({
        size: (15),
    }));
    const __VLS_504 = __VLS_503({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_503));
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
    let __VLS_507;
    /** @ts-ignore @type { | typeof __VLS_components.Wrench} */
    Wrench;
    // @ts-ignore
    const __VLS_508 = __VLS_asFunctionalComponent1(__VLS_507, new __VLS_507({
        size: (16),
    }));
    const __VLS_509 = __VLS_508({
        size: (16),
    }, ...__VLS_functionalComponentArgsRest(__VLS_508));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    let __VLS_512;
    /** @ts-ignore @type { | typeof __VLS_components.ChevronDown} */
    ChevronDown;
    // @ts-ignore
    const __VLS_513 = __VLS_asFunctionalComponent1(__VLS_512, new __VLS_512({
        size: (15),
    }));
    const __VLS_514 = __VLS_513({
        size: (15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_513));
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
                [showAlertDrawer,];
            } },
        ...{ class: "ghost-button" },
    });
    /** @type {__VLS_StyleScopedClasses['ghost-button']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAlertDrawer))
                    throw 0;
                return (__VLS_ctx.showAlertDrawer = false);
                // @ts-ignore
                [showAlertDrawer,];
            } },
        ...{ class: "primary-button" },
    });
    /** @type {__VLS_StyleScopedClasses['primary-button']} */ ;
}
// @ts-ignore
[];
var __VLS_479;
let __VLS_517;
/** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
elDialog;
// @ts-ignore
const __VLS_518 = __VLS_asFunctionalComponent1(__VLS_517, new __VLS_517({
    modelValue: (__VLS_ctx.showAddProduct),
    title: "新建商品档案",
    width: "480px",
}));
const __VLS_519 = __VLS_518({
    modelValue: (__VLS_ctx.showAddProduct),
    title: "新建商品档案",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_518));
const { default: __VLS_522 } = __VLS_520.slots;
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
    const { footer: __VLS_523 } = __VLS_520.slots;
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
var __VLS_520;
if (__VLS_ctx.showMerchantDetail) {
    let __VLS_524;
    /** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
    elDialog;
    // @ts-ignore
    const __VLS_525 = __VLS_asFunctionalComponent1(__VLS_524, new __VLS_524({
        modelValue: (__VLS_ctx.merchantDialogVisible),
        title: "商户经营详情",
        width: "560px",
    }));
    const __VLS_526 = __VLS_525({
        modelValue: (__VLS_ctx.merchantDialogVisible),
        title: "商户经营详情",
        width: "560px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_525));
    const { default: __VLS_529 } = __VLS_527.slots;
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
    let __VLS_530;
    /** @ts-ignore @type { | typeof __VLS_components.FileCheck2} */
    FileCheck2;
    // @ts-ignore
    const __VLS_531 = __VLS_asFunctionalComponent1(__VLS_530, new __VLS_530({
        size: (17),
    }));
    const __VLS_532 = __VLS_531({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_531));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.showMerchantDetail.status === "欠费预警"
        ? "该商户存在待缴账单"
        : "8 月对账单已生成");
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    {
        const { footer: __VLS_535 } = __VLS_527.slots;
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
        let __VLS_536;
        /** @ts-ignore @type { | typeof __VLS_components.Check} */
        Check;
        // @ts-ignore
        const __VLS_537 = __VLS_asFunctionalComponent1(__VLS_536, new __VLS_536({
            size: (16),
        }));
        const __VLS_538 = __VLS_537({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_537));
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_527;
}
if (__VLS_ctx.showMemberDetail) {
    let __VLS_541;
    /** @ts-ignore @type { | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog'] | typeof __VLS_components.elDialog | typeof __VLS_components.ElDialog | typeof __VLS_components['el-dialog']} */
    elDialog;
    // @ts-ignore
    const __VLS_542 = __VLS_asFunctionalComponent1(__VLS_541, new __VLS_541({
        modelValue: (__VLS_ctx.memberDialogVisible),
        title: "会员档案",
        width: "520px",
    }));
    const __VLS_543 = __VLS_542({
        modelValue: (__VLS_ctx.memberDialogVisible),
        title: "会员档案",
        width: "520px",
    }, ...__VLS_functionalComponentArgsRest(__VLS_542));
    const { default: __VLS_546 } = __VLS_544.slots;
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
    let __VLS_547;
    /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
    Ticket;
    // @ts-ignore
    const __VLS_548 = __VLS_asFunctionalComponent1(__VLS_547, new __VLS_547({
        size: (17),
    }));
    const __VLS_549 = __VLS_548({
        size: (17),
    }, ...__VLS_functionalComponentArgsRest(__VLS_548));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    {
        const { footer: __VLS_552 } = __VLS_544.slots;
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
        let __VLS_553;
        /** @ts-ignore @type { | typeof __VLS_components.Ticket} */
        Ticket;
        // @ts-ignore
        const __VLS_554 = __VLS_asFunctionalComponent1(__VLS_553, new __VLS_553({
            size: (16),
        }));
        const __VLS_555 = __VLS_554({
            size: (16),
        }, ...__VLS_functionalComponentArgsRest(__VLS_554));
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_544;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
