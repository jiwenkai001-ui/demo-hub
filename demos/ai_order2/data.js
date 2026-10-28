window.ORDER_SEEDS = {
  fresh: {
    label: "🥬 生鲜配送",
    catalog: [
      { code: "SC001", name: "番茄",   unit: "斤", price: 3.8,  spec: "普罗旺斯" },
      { code: "SC002", name: "土豆",   unit: "斤", price: 1.9,  spec: "黄心" },
      { code: "SC003", name: "黄瓜",   unit: "斤", price: 2.6,  spec: "旱黄瓜" },
      { code: "SC004", name: "西兰花", unit: "斤", price: 5.2,  spec: "" },
      { code: "SC005", name: "生菜",   unit: "斤", price: 2.2,  spec: "" },
      { code: "SC006", name: "五花肉", unit: "斤", price: 13.8, spec: "黑猪" },
      { code: "SC007", name: "鸡蛋",   unit: "箱", price: 168,  spec: "30枚/箱" },
      { code: "SC008", name: "鲈鱼",   unit: "条", price: 22,   spec: "1-1.2斤/条" },
      { code: "SC009", name: "胡萝卜", unit: "斤", price: 1.4,  spec: "" },
      { code: "SC010", name: "尖椒",   unit: "斤", price: 3.2,  spec: "" }
    ],
    aliases: { "西红柿": "番茄", "洋芋": "土豆", "青瓜": "黄瓜", "绿花菜": "西兰花" },
    inbox: [
      {
        id: "f1", type: "text", source: "微信群 · 锦华生鲜采购群", sender: "张老板", customer: "锦华火锅", time: "08:42",
        content: "明天早上要：西红柿10斤，洋芋20斤，青瓜15斤，鸡蛋2箱，冰鲜带鱼10斤",
        result: [
          { raw: "西红柿10斤",  name: "番茄",     code: "SC001", unit: "斤", qty: 10, price: 3.8,  conf: 0.98, note: "别名映射 西红柿→番茄" },
          { raw: "洋芋20斤",    name: "土豆",     code: "SC002", unit: "斤", qty: 20, price: 1.9,  conf: 0.97, note: "别名映射 洋芋→土豆" },
          { raw: "青瓜15斤",    name: "黄瓜",     code: "SC003", unit: "斤", qty: 15, price: 2.6,  conf: 0.96, note: "别名映射 青瓜→黄瓜" },
          { raw: "鸡蛋2箱",     name: "鸡蛋",     code: "SC007", unit: "箱", qty: 2,  price: 168,  conf: 0.99, note: "规格 30枚/箱" },
          { raw: "冰鲜带鱼10斤", name: "冰鲜带鱼", code: null,   unit: "斤", qty: 10, price: null, conf: 0.91,
            note: "商品库无此品，需人工处理", candidates: [{ name: "鲈鱼", code: "SC008", conf: 0.38 }] }
        ]
      },
      {
        id: "f2", type: "image", source: "微信图片 · 手写申购单", sender: "王姐", customer: "鲜丰超市·高新店", time: "09:15",
        paperTitle: "晨采单 3.14",
        paper: [["西兰花", "8 斤"], ["生菜", "12 斤"], ["五花肉", "5 斤"], ["胡萝卜", "30 斤"]],
        result: [
          { raw: "西兰花 8斤",  name: "西兰花", code: "SC004", unit: "斤", qty: 8,  price: 5.2,  conf: 0.97 },
          { raw: "生菜 12斤",   name: "生菜",   code: "SC005", unit: "斤", qty: 12, price: 2.2,  conf: 0.66, note: "字迹模糊，数量请人工复核" },
          { raw: "五花肉 5斤",  name: "五花肉", code: "SC006", unit: "斤", qty: 5,  price: 13.8, conf: 0.95 },
          { raw: "胡萝卜 30斤", name: "胡萝卜", code: "SC009", unit: "斤", qty: 30, price: 1.4,  conf: 0.96 }
        ]
      },
      {
        id: "f3", type: "voice", source: "语音转写 · 60s", sender: "李姐", customer: "李记快餐", time: "10:03",
        content: "给我来二十斤土豆，尖椒来个十来斤吧，再要六条鲈鱼，下午三点前送到",
        result: [
          { raw: "二十斤土豆",     name: "土豆", code: "SC002", unit: "斤", qty: 20, price: 1.9, conf: 0.93, note: "中文数字已转换" },
          { raw: "尖椒来个十来斤", name: "尖椒", code: "SC010", unit: "斤", qty: 10, price: 3.2, conf: 0.72, note: "口语数量，请人工复核" },
          { raw: "六条鲈鱼",       name: "鲈鱼", code: "SC008", unit: "条", qty: 6,  price: 22,  conf: 0.95 }
        ]
      }
    ]
  },
  food: {
    label: "🍲 餐饮食材",
    catalog: [
      { code: "FD001", name: "牛腩",   unit: "kg", price: 58,  spec: "冷冻" },
      { code: "FD002", name: "鸡翅中", unit: "kg", price: 36,  spec: "" },
      { code: "FD003", name: "基围虾", unit: "kg", price: 88,  spec: "30/40" },
      { code: "FD004", name: "嫩豆腐", unit: "盒", price: 3.5, spec: "400g" },
      { code: "FD005", name: "干香菇", unit: "包", price: 45,  spec: "500g" },
      { code: "FD006", name: "花生油", unit: "桶", price: 129, spec: "5L" },
      { code: "FD007", name: "面粉",   unit: "袋", price: 96,  spec: "25kg" },
      { code: "FD008", name: "生抽",   unit: "箱", price: 120, spec: "12×500ml" }
    ],
    aliases: { "鸡翅": "鸡翅中", "虾": "基围虾", "酱油": "生抽", "豆油": "花生油" },
    inbox: [
      {
        id: "d1", type: "text", source: "微信群 · 满堂红后厨群", sender: "刘师傅", customer: "满堂红酒楼", time: "07:58",
        content: "周一到货：牛腩15公斤，鸡翅10公斤，基围虾8斤，嫩豆腐3箱，干香菇2包",
        result: [
          { raw: "牛腩15公斤",   name: "牛腩",   code: "FD001", unit: "kg", qty: 15, price: 58,  conf: 0.98, note: "单位换算 公斤→kg" },
          { raw: "鸡翅10公斤",   name: "鸡翅中", code: "FD002", unit: "kg", qty: 10, price: 36,  conf: 0.95, note: "别名映射 鸡翅→鸡翅中" },
          { raw: "基围虾8斤",    name: "基围虾", code: "FD003", unit: "kg", qty: 4,  price: 88,  conf: 0.9,  note: "单位换算 斤→kg ÷2" },
          { raw: "嫩豆腐3箱",    name: "嫩豆腐", code: "FD004", unit: "盒", qty: 36, price: 3.5, conf: 0.86, note: "整箱拆盒 1箱=12盒，3箱=36盒，请复核" },
          { raw: "干香菇2包",    name: "干香菇", code: "FD005", unit: "包", qty: 2,  price: 45,  conf: 0.97 }
        ]
      },
      {
        id: "d2", type: "image", source: "微信图片 · 采购清单拍照", sender: "周经理", customer: "膳合团餐", time: "11:26",
        paperTitle: "膳合·周采",
        paper: [["花生油", "5 桶"], ["面粉", "10 袋"], ["生抽", "3 箱"]],
        result: [
          { raw: "花生油 5桶", name: "花生油", code: "FD006", unit: "桶", qty: 5,  price: 129, conf: 0.97 },
          { raw: "面粉 10袋",  name: "面粉",   code: "FD007", unit: "袋", qty: 10, price: 96,  conf: 0.98 },
          { raw: "生抽 3箱",   name: "生抽",   code: "FD008", unit: "箱", qty: 3,  price: 120, conf: 0.96 }
        ]
      }
    ]
  },
  hardware: {
    label: "🔧 五金建材",
    catalog: [
      { code: "HJ001", name: "镀锌钢管", unit: "支", price: 86,  spec: "DN25×6m" },
      { code: "HJ002", name: "水泥",     unit: "吨", price: 420, spec: "P.O42.5" },
      { code: "HJ003", name: "螺纹钢",   unit: "吨", price: 3860, spec: "HRB400E Φ12" },
      { code: "HJ004", name: "电线",     unit: "卷", price: 238, spec: "BV2.5 100m" },
      { code: "HJ005", name: "防水涂料", unit: "桶", price: 268, spec: "20kg" },
      { code: "HJ006", name: "角钢",     unit: "支", price: 64,  spec: "40×40×4" }
    ],
    aliases: { "钢筋": "螺纹钢", "电缆": "电线", "涂料": "防水涂料" },
    inbox: [
      {
        id: "h1", type: "text", source: "微信群 · 城建B栋项目群", sender: "赵工", customer: "城建三公司·B栋", time: "09:31",
        content: "工地B栋这周要用：螺纹钢3吨，水泥15吨，镀锌钢管200支，电线10卷，角钢50支",
        result: [
          { raw: "螺纹钢3吨",     name: "螺纹钢",   code: "HJ003", unit: "吨", qty: 3,   price: 3860, conf: 0.99 },
          { raw: "水泥15吨",      name: "水泥",     code: "HJ002", unit: "吨", qty: 15,  price: 420,  conf: 0.98 },
          { raw: "镀锌钢管200支", name: "镀锌钢管", code: "HJ001", unit: "支", qty: 200, price: 86,   conf: 0.97 },
          { raw: "电线10卷",      name: "电线",     code: "HJ004", unit: "卷", qty: 10,  price: 238,  conf: 0.98 },
          { raw: "角钢50支",      name: "角钢",     code: "HJ006", unit: "支", qty: 50,  price: 64,   conf: 0.96 }
        ]
      },
      {
        id: "h2", type: "voice", source: "语音转写 · 45s", sender: "孙队长", customer: "恒基劳务", time: "14:10",
        content: "给我送二十桶防水涂料，再要三吨水泥，下午要",
        result: [
          { raw: "二十桶防水涂料", name: "防水涂料", code: "HJ005", unit: "桶", qty: 20, price: 268, conf: 0.94, note: "中文数字已转换" },
          { raw: "三吨水泥",       name: "水泥",     code: "HJ002", unit: "吨", qty: 3,  price: 420, conf: 0.96 }
        ]
      }
    ]
  },
  general: {
    label: "🧺 日用百货",
    catalog: [
      { code: "RB001", name: "抽纸",   unit: "箱", price: 145, spec: "60包/箱" },
      { code: "RB002", name: "洗衣液", unit: "箱", price: 168, spec: "12瓶/箱" },
      { code: "RB003", name: "垃圾袋", unit: "件", price: 78,  spec: "100只×30卷" },
      { code: "RB004", name: "保温杯", unit: "个", price: 39,  spec: "500ml" },
      { code: "RB005", name: "数据线", unit: "条", price: 9.9, spec: "Type-C 1m" }
    ],
    aliases: { "纸巾": "抽纸", "充电线": "数据线" },
    inbox: [
      {
        id: "g1", type: "text", source: "微信群 · 优品连锁补货群", sender: "陈店长", customer: "优品连锁·8家门店", time: "16:20",
        content: "补货：抽纸5箱，洗衣液8箱，垃圾袋20件，保温杯50个，充电线200条",
        result: [
          { raw: "抽纸5箱",     name: "抽纸",   code: "RB001", unit: "箱", qty: 5,   price: 145, conf: 0.99 },
          { raw: "洗衣液8箱",   name: "洗衣液", code: "RB002", unit: "箱", qty: 8,   price: 168, conf: 0.99 },
          { raw: "垃圾袋20件",  name: "垃圾袋", code: "RB003", unit: "件", qty: 20,  price: 78,  conf: 0.97 },
          { raw: "保温杯50个",  name: "保温杯", code: "RB004", unit: "个", qty: 50,  price: 39,  conf: 0.98 },
          { raw: "充电线200条", name: "数据线", code: "RB005", unit: "条", qty: 200, price: 9.9, conf: 0.95, note: "别名映射 充电线→数据线" }
        ]
      }
    ]
  }
};
