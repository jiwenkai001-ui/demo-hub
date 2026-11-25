/* ============================================================
 * 宠物生活馆 · 演示数据
 * 全部为静态种子数据，运行时由 app.js 写入 localStorage
 * ============================================================ */

const SEED = {
  /* ---------- 门店信息 ---------- */
  shop: {
    name: '森田宠物生活馆',
    slogan: '让每一只毛孩子都被温柔以待',
    status: '营业中',
    hours: '09:00 - 21:00',
    address: '幸福路 128 号 · 阳光里购物中心 1F-08',
    phone: '0571-8888 6666',
    rating: 4.9,
    reviews: 1286,
    distance: '1.2km'
  },

  /* ---------- 服务分类 ---------- */
  categories: [
    { id: 'grooming', name: '宠物美容', icon: 'scissors', color: '#FF8A5B', desc: '造型修剪 · 毛发护理' },
    { id: 'bath',     name: '宠物洗澡', icon: 'bath',     color: '#5EC4A0', desc: '深层清洁 · 驱虫除螨' },
    { id: 'boarding', name: '宠物寄养', icon: 'home',     color: '#7B9FE0', desc: '独立空间 · 24h 看护' },
    { id: 'goods',    name: '宠物用品', icon: 'bag',      color: '#E0A15E', desc: '主粮零食 · 玩具护理' }
  ],

  /* ---------- 服务项目 ---------- */
  services: [
    {
      id: 'S001', cat: 'grooming', name: '全身造型精剪', price: 268, unit: '次',
      duration: 90, sales: 862, hot: true, tag: '店长推荐',
      desc: '专业造型师一对一设计，含洗护、吹干、造型修剪、指甲修剪、耳道清洁，打造专属萌宠造型。',
      includes: ['深层洗护', '精修造型', '指甲修剪', '耳道清洁', '肛门腺护理'],
      suitable: '3 个月以上、已完成基础疫苗的犬猫'
    },
    {
      id: 'S002', cat: 'grooming', name: '猫咪专属美容', price: 328, unit: '次',
      duration: 100, sales: 431, hot: true, tag: '猫咪友好',
      desc: '低压力操作流程，独立猫咪美容间，全程无笼吹，最大程度减少应激反应。',
      includes: ['猫咪专用洗护', '去浮毛', '造型修剪', '指甲修剪', '耳道清洁'],
      suitable: '6 个月以上猫咪，无严重应激史'
    },
    {
      id: 'S003', cat: 'grooming', name: '局部修剪（脸/脚/臀）', price: 88, unit: '次',
      duration: 30, sales: 1105, hot: false, tag: '快速',
      desc: '针对面部、脚底、臀部等部位的局部修剪，适合日常打理维护。',
      includes: ['局部修剪', '脚底毛清理'],
      suitable: '所有犬猫'
    },
    {
      id: 'S004', cat: 'bath', name: '基础香波洗澡', price: 98, unit: '次',
      duration: 45, sales: 2340, hot: true, tag: '销量冠军',
      desc: '进口低敏香波深层清洁，温水按摩浴缸，吹干梳理一站式完成。',
      includes: ['温水泡浴', '香波清洁', '吹干梳理', '指甲修剪', '耳道清洁'],
      suitable: '所有犬猫'
    },
    {
      id: 'S005', cat: 'bath', name: '药浴护理（皮肤问题）', price: 168, unit: '次',
      duration: 60, sales: 676, hot: false, tag: '专业护理',
      desc: '针对真菌、螨虫、皮屑等皮肤问题，使用专业药浴产品，需连续护理效果更佳。',
      includes: ['皮肤检测', '专业药浴', '舒缓护理', '吹干梳理'],
      suitable: '有皮肤问题的犬猫（建议先咨询）'
    },
    {
      id: 'S006', cat: 'bath', name: '深层精油 SPA', price: 218, unit: '次',
      duration: 75, sales: 389, hot: false, tag: '进阶',
      desc: '在基础洗护之上增加精油按摩、毛发滋养，改善毛躁打结，提升毛发亮泽度。',
      includes: ['基础洗护', '精油按摩', '毛发滋养', '深层护毛'],
      suitable: '毛发干枯、打结的犬猫'
    },
    {
      id: 'S007', cat: 'boarding', name: '标准寄养', price: 128, unit: '天',
      duration: 1440, sales: 1542, hot: true, tag: '独立房间',
      desc: '独立寄养单元，每日定时喂食、遛弯、清洁，全程视频可查看，让主人放心。',
      includes: ['独立空间', '每日 2 次喂食', '每日遛弯', '清洁消毒', '视频查看'],
      suitable: '已接种疫苗、身体健康的犬猫'
    },
    {
      id: 'S008', cat: 'boarding', name: '豪华亲子房寄养', price: 258, unit: '天',
      duration: 1440, sales: 421, hot: false, tag: '高端',
      desc: '大面积豪华房型，配备实时监控与空调恒温，每日额外提供互动陪玩与零食加餐。',
      includes: ['豪华大房', '实时监控', '空调恒温', '互动陪玩', '零食加餐'],
      suitable: '对居住条件有较高要求的犬猫'
    }
  ],

  /* ---------- 商品分类 ---------- */
  goodsCats: [
    { id: 'all',    name: '全部' },
    { id: 'food',   name: '主粮' },
    { id: 'snack',  name: '零食' },
    { id: 'toy',    name: '玩具' },
    { id: 'care',   name: '护理' },
    { id: 'clean',  name: '清洁' }
  ],

  /* ---------- 商品 ---------- */
  goods: [
    { id: 'G001', cat: 'food',  name: '鲜肉冻干全价猫粮 1.8kg', price: 168, origPrice: 219, sales: 3208, stock: 86, spec: '1.8kg/袋', emoji: '🐱', tag: '热销', rate: 4.9, desc: '90% 鲜肉含量，添加冻干鸡肉粒，高蛋白低谷物配方，适合全阶段猫咪。' },
    { id: 'G002', cat: 'food',  name: '无谷低敏成犬粮 5kg', price: 239, origPrice: 299, sales: 1865, stock: 54, spec: '5kg/袋', emoji: '🐶', tag: '进口', rate: 4.8, desc: '单一蛋白源，无谷低敏配方，添加益生菌与卵磷脂，呵护肠胃与毛发。' },
    { id: 'G003', cat: 'food',  name: '幼猫奶糕粮 1kg', price: 98, origPrice: 128, sales: 942, stock: 120, spec: '1kg/袋', emoji: '🍼', tag: '幼宠', rate: 4.7, desc: '专为 2-12 月龄幼猫设计，小颗粒易咀嚼，添加牛初乳增强免疫力。' },
    { id: 'G004', cat: 'snack', name: '冻干鸡胸肉粒 100g', price: 39, origPrice: 59, sales: 5210, stock: 300, spec: '100g/罐', emoji: '🍗', tag: '爆款', rate: 4.9, desc: '整块鸡胸肉低温冻干，零添加零防腐，高蛋白低脂肪，训练奖励首选。' },
    { id: 'G005', cat: 'snack', name: '手工鸡肉干磨牙棒 250g', price: 45, origPrice: 68, sales: 2130, stock: 188, spec: '250g/袋', emoji: '🦴', tag: '磨牙', rate: 4.8, desc: '手工烘焙鸡肉缠绕，韧性适中帮助清洁牙齿，缓解拆家与口臭问题。' },
    { id: 'G006', cat: 'snack', name: '猫咪化毛营养膏 120g', price: 62, origPrice: 88, sales: 1480, stock: 96, spec: '120g/支', emoji: '🧴', tag: '营养', rate: 4.7, desc: '添加天然植物纤维与鱼油，帮助排出毛球，改善肠胃，适口性佳。' },
    { id: 'G007', cat: 'toy',   name: '逗猫棒羽毛替换装', price: 29, origPrice: 45, sales: 3612, stock: 240, spec: '3 支装', emoji: '🪶', tag: '互动', rate: 4.6, desc: '天然羽毛 + 铃铛设计，替换头可拆卸，激发猫咪捕猎天性。' },
    { id: 'G008', cat: 'toy',   name: '耐咬发声橡胶球', price: 35, origPrice: 52, sales: 1876, stock: 175, spec: '直径 7cm', emoji: '🎾', tag: '耐咬', rate: 4.7, desc: '食品级天然橡胶，内置发声装置，适合中大型犬啃咬玩耍。' },
    { id: 'G009', cat: 'toy',   name: '益智漏食慢食碗', price: 58, origPrice: 79, sales: 1054, stock: 88, spec: '中号', emoji: '🥣', tag: '益智', rate: 4.8, desc: '慢食防噎结构，延长进食时间，适合狼吞虎咽的毛孩子。' },
    { id: 'G010', cat: 'care',  name: '宠物专用排梳（去浮毛）', price: 42, origPrice: 62, sales: 2290, stock: 160, spec: '通用型', emoji: '🪮', tag: '护理', rate: 4.8, desc: '圆头钢针设计不伤肤，有效去除浮毛与打结，长毛犬猫日常必备。' },
    { id: 'G011', cat: 'care',  name: '宠物泪痕清洁湿巾 100 抽', price: 26, origPrice: 39, sales: 4128, stock: 420, spec: '100 抽/盒', emoji: '🧻', tag: '清洁', rate: 4.7, desc: '温和无酒精配方，有效清洁眼周泪痕与污渍，比熊、斗牛等易泪痕犬种适用。' },
    { id: 'G012', cat: 'clean', name: '宠物除臭消毒液 500ml', price: 49, origPrice: 72, sales: 2651, stock: 210, spec: '500ml/瓶', emoji: '🧼', tag: '除臭', rate: 4.8, desc: '植物提取成分，可舔舐安全，快速分解尿液异味，地板与笼具通用。' }
  ],

  /* ---------- 会员等级 ---------- */
  levels: [
    { id: 'normal',  name: '普通会员', icon: '🐾', color: '#B9B2AB', minSpend: 0,    discount: 1.00, pointRate: 1, perks: ['消费 1 元得 1 积分', '会员日专属活动'] },
    { id: 'silver',  name: '银卡会员', icon: '🥈', color: '#A8B4C0', minSpend: 1000, discount: 0.95, pointRate: 1.5, perks: ['服务/商品 9.5 折', '消费 1 元得 1.5 积分', '生日当月赠洗澡券'] },
    { id: 'gold',    name: '金卡会员', icon: '🥇', color: '#E5B04F', minSpend: 3000, discount: 0.90, pointRate: 2, perks: ['服务/商品 9 折', '消费 1 元得 2 积分', '免费基础洗澡 每月 1 次'] },
    { id: 'diamond', name: '钻石会员', icon: '💎', color: '#8B7BE0', minSpend: 8000, discount: 0.85, pointRate: 3, perks: ['服务/商品 8.5 折', '消费 1 元得 3 积分', '专属美容师 + 免费寄养 每月 1 天'] }
  ],

  /* ---------- 预约时段 ---------- */
  timeSlots: [
    '09:00', '10:00', '11:00', '12:00',
    '13:30', '14:30', '15:30', '16:30',
    '17:30', '18:30', '19:30', '20:30'
  ],

  /* ---------- 美容师 ---------- */
  staffs: [
    { id: 'T01', name: '小雅', title: '资深美容师', years: 6, rate: 4.9, tag: '造型设计', avatar: '👩‍🎨' },
    { id: 'T02', name: '阿泽', title: '高级美容师', years: 4, rate: 4.8, tag: '猫咪友好', avatar: '🧑‍🎨' },
    { id: 'T03', name: '糖糖', title: '护理师', years: 3, rate: 4.9, tag: '温和耐心', avatar: '👩‍⚕️' },
    { id: 'T04', name: '不指定', title: '随机安排', years: 0, rate: 5.0, tag: '最快可约', avatar: '🎲' }
  ],

  /* ---------- 会员初始数据 ---------- */
  member: {
    logged: false,
    nickname: '森田铲屎官',
    avatar: '🐱',
    phone: '138****6688',
    joinDate: '2024-03-18',
    totalSpend: 3260,
    points: 1860,
    balance: 580,
    coupons: [
      { id: 'C001', name: '服务满 200 减 30', type: 'service', amount: 30, threshold: 200, expire: '2026-12-31', status: 'unused' },
      { id: 'C002', name: '商品满 100 减 15', type: 'goods',   amount: 15, threshold: 100, expire: '2026-12-31', status: 'unused' },
      { id: 'C003', name: '洗澡立减 20 元',   type: 'bath',    amount: 20, threshold: 0,   expire: '2026-11-30', status: 'unused' },
      { id: 'C004', name: '新会员专享 10 元券', type: 'all',   amount: 10, threshold: 50,  expire: '2026-06-30', status: 'used' }
    ]
  },

  /* ---------- 宠物档案 ---------- */
  pets: [
    { id: 'P001', name: '布丁', type: '猫', breed: '英国短毛猫', gender: '公', birthday: '2022-05-12', weight: 5.2, sterilized: true, avatar: '🐱', note: '怕吹风机，需低速吹干' },
    { id: 'P002', name: '年糕', type: '狗', breed: '柯基',     gender: '母', birthday: '2021-09-03', weight: 11.6, sterilized: true, avatar: '🐶', note: '爱拆家，需多准备玩具' }
  ],

  /* ---------- 收货地址 ---------- */
  addresses: [
    { id: 'A001', name: '李女士', phone: '138 8888 6688', region: '浙江省 杭州市 西湖区', detail: '幸福路 128 号阳光里小区 6 幢 1802', isDefault: true },
    { id: 'A002', name: '李先生', phone: '139 9999 2233', region: '浙江省 杭州市 滨江区', detail: '江南大道 500 号星光大厦 A 座 1203', isDefault: false }
  ],

  /* ---------- 历史订单 ---------- */
  orders: [
    {
      id: 'O20261008001', type: 'reservation',
      title: '基础香波洗澡 · 布丁',
      service: 'S004', staff: 'T01', pet: 'P001',
      date: '2026-10-08', time: '14:30', days: 1,
      amount: 98, payAmount: 98, discountName: '金卡会员 9 折',
      status: 'done', createTime: '2026-10-05 10:22', payTime: '2026-10-08 14:35'
    },
    {
      id: 'O20261002001', type: 'goods',
      items: [
        { id: 'G004', name: '冻干鸡胸肉粒 100g', price: 39, qty: 2, emoji: '🍗' },
        { id: 'G011', name: '宠物泪痕清洁湿巾 100 抽', price: 26, qty: 1, emoji: '🧻' }
      ],
      amount: 104, payAmount: 93.6, discountName: '金卡会员 9 折',
      address: '幸福路 128 号阳光里小区 6 幢 1802',
      status: 'done', createTime: '2026-10-02 19:41', payTime: '2026-10-02 19:42'
    }
  ],

  /* ---------- 积分明细 ---------- */
  pointLogs: [
    { time: '2026-10-08 14:35', title: '洗澡消费获得积分', value: 196, type: 'in' },
    { time: '2026-10-02 19:42', title: '商品消费获得积分', value: 187, type: 'in' },
    { time: '2026-09-28 11:10', title: '积分兑换优惠券',   value: -500, type: 'out' },
    { time: '2026-09-15 16:20', title: '寄养消费获得积分', value: 256, type: 'in' },
    { time: '2026-09-01 09:30', title: '生日月双倍积分',   value: 300, type: 'in' }
  ],

  /* ---------- 充值档位 ---------- */
  rechargePlans: [
    { amount: 500,  give: 50,  tag: '' },
    { amount: 1000, give: 150, tag: '最划算' },
    { amount: 2000, give: 400, tag: '超高赠送' },
    { amount: 5000, give: 1250, tag: '尊享' }
  ]
};
