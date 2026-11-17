/* 育苗苗演示种子。全部机构、联系人和业务单据均为模拟数据。 */
(function (g) {
  "use strict";
  const Y = (g.YMM = g.YMM || {});
  /** 创建独立种子。无参数；返回完整可序列化数据，不访问网络或持久化。 */
  Y.makeSeed = function () {
    const date = "2026-11-17";
    const day = (n) =>
      new Date(Date.UTC(2026, 10, 17 + n)).toISOString().slice(0, 10);
    const routes = [
      {
        id: "R1",
        name: "高新一线",
        driver: "王师傅",
        phone: "13900001001",
        vehicle: "陕A·D2861",
        carrier: "西安鲜达冷链",
      },
      {
        id: "R2",
        name: "曲江二线",
        driver: "李师傅",
        phone: "13900001002",
        vehicle: "陕A·C5726",
        carrier: "秦鲜城市配送",
      },
      {
        id: "R3",
        name: "未央三线",
        driver: "赵师傅",
        phone: "13900001003",
        vehicle: "陕A·F3918",
        carrier: "西安鲜达冷链",
      },
      {
        id: "R4",
        name: "长安四线",
        driver: "陈师傅",
        phone: "13900001004",
        vehicle: "陕A·B6609",
        carrier: "秦鲜城市配送",
      },
    ];
    const schoolNames = [
      "育才小学",
      "曲江第一幼儿园",
      "高新实验中学",
      "雁塔第二小学",
      "未央启智幼儿园",
      "长安实验小学",
      "莲湖第一中学",
      "新城育英幼儿园",
      "浐灞第一小学",
      "航天实验中学",
      "高新第三小学",
      "曲江春芽幼儿园",
      "未央实验小学",
      "长安第一中学",
      "雁塔阳光幼儿园",
      "莲湖育才小学",
      "新城第二小学",
      "浐灞启航幼儿园",
      "航天第一小学",
      "高新第二中学",
      "曲江实验小学",
      "未央春晖幼儿园",
      "长安第三小学",
      "雁塔实验中学",
      "莲湖晨光幼儿园",
      "新城第一小学",
      "浐灞实验中学",
      "航天星辰幼儿园",
      "高新第五小学",
      "曲江第一中学",
      "未央育新小学",
      "长安小太阳幼儿园",
      "雁塔第六小学",
      "莲湖实验中学",
      "新城启明幼儿园",
      "浐灞第三小学",
      "航天第二中学",
      "高新萌芽幼儿园",
      "曲江第四小学",
      "未央第一中学",
    ];
    const areas = [
      "高新区",
      "雁塔区",
      "未央区",
      "长安区",
      "莲湖区",
      "新城区",
      "浐灞生态区",
      "航天基地",
    ];
    const schools = schoolNames.map((name, i) => ({
      id: "S" + (i + 1),
      name,
      type: name.includes("幼儿园") ? "幼儿园" : "中小学",
      area: areas[i % 8],
      contact: ["张老师", "刘老师", "王老师", "陈老师", "李老师"][i % 5],
      phone: "1380000" + String(1000 + i),
      address: "西安市" + areas[i % 8] + "育新路" + (18 + i * 3) + "号",
      routeId: routes[i % 4].id,
      term: 30,
      active: true,
    }));
    const supNames = [
      "秦丰蔬菜合作社",
      "绿源果蔬供应链",
      "秦岭优鲜肉业",
      "金禾粮油商贸",
      "海悦水产批发",
      "宏达冻品配送",
      "鲜牧蛋品供应",
      "田园净菜加工",
      "长安时令蔬菜",
      "渭北鲜果基地",
      "鑫盛调味品商行",
      "晨光乳品配送",
      "三秦鲜肉批发",
      "蓝田生态农业",
      "西北海鲜供应链",
      "丰盛食品配送",
      "新农优选供应链",
      "汇鲜冷链食品",
    ];
    const cats = ["蔬菜", "水果", "肉蛋", "调料粮油", "海鲜", "冻品"];
    const suppliers = supNames.map((name, i) => ({
      id: "V" + (i + 1),
      name,
      category: cats[i % 6],
      contact: ["周经理", "吴经理", "孙经理", "郑经理"][i % 4],
      phone: "1370000" + String(2000 + i),
      term: 30,
      address: "西安市欣桥农产品市场" + (i + 1) + "区",
      active: true,
    }));
    const bases = [
      ["黄心土豆", "蔬菜", "根茎类", "kg", 240, 360, "potato"],
      ["西红柿", "蔬菜", "茄果类", "kg", 420, 580, "tomato"],
      ["油麦菜", "蔬菜", "叶菜类", "kg", 300, 420, "greens"],
      ["鲜鸡蛋", "肉蛋", "蛋类", "kg", 760, 920, "eggs"],
      ["大白菜", "蔬菜", "叶菜类", "kg", 150, 240, "greens"],
      ["白萝卜", "蔬菜", "根茎类", "kg", 180, 280, "potato"],
      ["芹菜", "蔬菜", "茎菜类", "kg", 260, 390, "greens"],
      ["胡萝卜", "蔬菜", "根茎类", "kg", 230, 350, "potato"],
      ["精品黄瓜", "蔬菜", "茄果类", "kg", 380, 520, "greens"],
      ["青椒", "蔬菜", "茄果类", "kg", 400, 560, "greens"],
      ["紫茄子", "蔬菜", "茄果类", "kg", 350, 490, "tomato"],
      ["西兰花", "蔬菜", "花菜类", "kg", 620, 850, "greens"],
      ["菠菜", "蔬菜", "叶菜类", "kg", 420, 610, "greens"],
      ["香菇", "蔬菜", "菌菇类", "kg", 1000, 1380, "greens"],
      ["南瓜", "蔬菜", "瓜类", "kg", 260, 390, "potato"],
      ["冬瓜", "蔬菜", "瓜类", "kg", 200, 310, "greens"],
      ["红富士苹果", "水果", "仁果类", "kg", 650, 880, "apple"],
      ["香梨", "水果", "仁果类", "kg", 600, 820, "apple"],
      ["香蕉", "水果", "热带水果", "kg", 420, 590, "apple"],
      ["蜜橘", "水果", "柑橘类", "kg", 480, 680, "apple"],
      ["鲜猪前腿肉", "肉蛋", "猪肉", "kg", 2200, 2850, "meat"],
      ["鲜猪里脊", "肉蛋", "猪肉", "kg", 2800, 3580, "meat"],
      ["鲜牛腩", "肉蛋", "牛肉", "kg", 5200, 6800, "meat"],
      ["鲜鸡胸肉", "肉蛋", "禽肉", "kg", 1400, 1980, "meat"],
      ["一级大豆油", "调料粮油", "食用油", "桶", 5600, 7200, "pantry"],
      ["东北珍珠米", "调料粮油", "米面", "袋", 7200, 8900, "pantry"],
      ["小麦粉", "调料粮油", "米面", "袋", 4800, 6200, "pantry"],
      ["生抽酱油", "调料粮油", "调味品", "瓶", 900, 1250, "pantry"],
      ["加碘食盐", "调料粮油", "调味品", "袋", 180, 260, "pantry"],
      ["白砂糖", "调料粮油", "调味品", "kg", 680, 890, "pantry"],
      ["冷冻鸡腿", "冻品", "禽类冻品", "kg", 1350, 1850, "meat"],
      ["速冻水饺", "冻品", "面点", "袋", 1800, 2600, "pantry"],
      ["青虾仁", "海鲜", "虾类", "kg", 4200, 5600, "shrimp"],
      ["鲜鲈鱼", "海鲜", "鱼类", "kg", 2800, 3800, "shrimp"],
      ["海带丝", "海鲜", "藻类", "kg", 500, 720, "greens"],
      ["龙利鱼柳", "冻品", "鱼类冻品", "kg", 2100, 2800, "shrimp"],
      ["生菜", "蔬菜", "叶菜类", "kg", 300, 450, "greens"],
      ["莲藕", "蔬菜", "根茎类", "kg", 580, 780, "potato"],
      ["菜花", "蔬菜", "花菜类", "kg", 460, 650, "greens"],
      ["小葱", "蔬菜", "香辛菜", "kg", 520, 750, "greens"],
    ];
    const products = [];
    for (let i = 0; i < 2040; i++) {
      const b = bases[i % bases.length],
        v = Math.floor(i / bases.length),
        mul = 1 + (v % 5) * 0.025;
      const matches = suppliers.filter((s) => s.category === b[1]);
      const baseCost = Math.round(b[4] * mul),
        basePrice = Math.round(b[5] * mul);
      products.push({
        id: "P" + String(i + 1).padStart(4, "0"),
        code: "SP" + String(i + 1).padStart(5, "0"),
        name:
          b[0] +
          (v
            ? " · " +
              ["优选", "一级", "净选", "基地直供", "鲜选"][v % 5] +
              (Math.floor(v / 5) + 1)
            : ""),
        category: b[1],
        sub: b[2],
        spec:
          b[3] === "kg"
            ? v
              ? "分级" + (v + 1) + " / 散装"
              : "一级 / 散装"
            : b[3] === "桶"
              ? "5L/桶"
              : b[3] === "袋"
                ? b[2] === "米面"
                  ? "25kg/袋"
                  : "500g/袋"
                : "500ml/瓶",
        unit: b[3],
        cost: baseCost,
        prices: { 中小学: basePrice, 幼儿园: Math.round(basePrice * 1.06) },
        supplierId: matches[v % matches.length].id,
        active: true,
        minStock: b[3] === "kg" ? 50 : 10,
        image: b[6],
        shelfDays:
          b[1] === "蔬菜"
            ? 7
            : b[1] === "水果"
              ? 15
              : b[1] === "肉蛋"
                ? 10
                : 180,
      });
    }
    products[1].prices["中小学"] = 380;
    products[20].prices["幼儿园"] = 2100;
    products[10].prices["中小学"] = 370;
    const batches = products.map((p, i) => ({
      id: "B" + (i + 1),
      productId: p.id,
      supplierId: p.supplierId,
      qty: i < 40 ? (i === 12 ? 18 : 220 + (i % 7) * 60) : 20 + (i % 9) * 10,
      cost: p.cost,
      productionDate: day(-1),
      expires: day(p.shelfDays - 1),
      zone: i % 4 === 0 ? "冷藏区" : "常温区",
      source: "期初库存",
    }));
    const orders = [];
    for (let d = -29; d <= 0; d++)
      for (let j = 0; j < (d === 0 ? 24 : 9); j++) {
        const school = schools[((d + 30) * 9 + j) % 40],
          lines = [];
        for (let k = 0; k < 6; k++) {
          const p = products[(j * 3 + k * 3 + (d + 30)) % 40],
            qty = p.unit === "kg" ? 20 + ((j + k) % 8) * 5 : 2 + ((j + k) % 4);
          lines.push({
            productId: p.id,
            name: p.name,
            spec: p.spec,
            unit: p.unit,
            qty,
            price: p.prices[school.type],
            cost: p.cost,
            actualQty: d < 0 ? qty : null,
          });
        }
        const status =
          d < 0
            ? "已签收"
            : ["待确认", "待采购", "待分拣", "待装车", "配送中", "已签收"][
                Math.floor(j / 4)
              ];
        orders.push({
          id:
            "DD" + day(d).replaceAll("-", "") + String(j + 1).padStart(3, "0"),
          schoolId: school.id,
          date: day(d),
          deliveryDate: day(d),
          status,
          lines,
          note: j % 3 === 0 ? "食堂早班使用，请按时送达" : "",
          source: j % 10 === 0 ? "内部代下单" : "学校自主下单",
          routeId: school.routeId,
          createdAt: day(d) + " 09:" + String((j * 2) % 60).padStart(2, "0"),
          signedAt: status === "已签收" ? day(d) + " 07:30" : "",
          schoolName: school.name,
        });
      }
    const purchases = [];
    suppliers.forEach((sup, i) => {
      for (let j = 0; j < 3; j++) {
        const ps = products
          .filter((p) => p.supplierId === sup.id)
          .slice(j * 2, j * 2 + 3);
        purchases.push({
          id: "CG202611" + String(i * 3 + j + 1).padStart(4, "0"),
          supplierId: sup.id,
          date: day(-3 - j * 7),
          status: "已入库",
          orderIds: [],
          lines: ps.map((p) => ({
            productId: p.id,
            name: p.name,
            unit: p.unit,
            qty: p.unit === "kg" ? 150 : 20,
            cost: p.cost,
          })),
          source: "历史采购",
          receivedAt: day(-3 - j * 7),
          productionDate: day(-4 - j * 7),
          shelfDays: 7,
        });
      }
    });
    for (let i = 0; i < 3; i++) {
      const p = products[i];
      purchases.push({
        id: "CG202611" + String(100 + i),
        supplierId: p.supplierId,
        date,
        status: "待收货",
        orderIds: [],
        lines: [
          {
            productId: p.id,
            name: p.name,
            unit: p.unit,
            qty: 120,
            cost: p.cost,
          },
        ],
        source: "计划采购",
      });
    }
    const certs = suppliers.flatMap((s, i) =>
      ["产品合格证", "第三方检测报告"].map((type, j) => ({
        id: "ZA" + (i * 2 + j + 1),
        supplierId: s.id,
        type,
        name: s.name + " · " + type,
        date,
        expires: day((i + j) % 7 === 0 ? 1 : 30),
        status:
          i % 5 === 0
            ? "待收集"
            : i % 4 === 0
              ? "待审核"
              : i % 3 === 0
                ? "已分配"
                : "已通过",
        schools: i % 3 === 0 ? ["S1", "S2"] : [],
        collectedAt: date + " 18:" + String(10 + i * 2).padStart(2, "0"),
        note: "模拟群文件，仅供演示",
      })),
    );
    const bills = [];
    for (const kind of ["客户应收", "供应商应付"]) {
      (kind === "客户应收"
        ? schools.slice(0, 8)
        : suppliers.slice(0, 6)
      ).forEach((entity, k) => {
        const docs =
          kind === "客户应收"
            ? orders.filter(
                (o) =>
                  o.schoolId === entity.id &&
                  o.status === "已签收" &&
                  o.deliveryDate.startsWith("2026-11"),
              )
            : purchases.filter(
                (p) =>
                  p.supplierId === entity.id &&
                  p.status === "已入库" &&
                  p.receivedAt.startsWith("2026-11"),
              );
        const amount = docs.reduce(
          (sum, o) =>
            sum +
            o.lines.reduce(
              (s, l) =>
                s +
                Math.round(
                  (l.actualQty ?? l.qty) *
                    (kind === "客户应收" ? l.price : l.cost),
                ),
              0,
            ),
          0,
        );
        if (!docs.length) return;
        const paid =
          k % 4 === 3 ? amount : k % 4 === 2 ? Math.floor(amount / 2) : 0;
        bills.push({
          id: "DZ202611" + String(bills.length + 1).padStart(4, "0"),
          kind,
          targetId: entity.id,
          name: entity.name,
          month: "2026-11",
          docIds: docs.map((o) => o.id),
          creditIds: [],
          amount,
          paid,
          status: ["待核对", "已确认", "部分结算", "已结清"][k % 4],
          date,
        });
      });
    }
    const payments = bills
      .filter((b) => b.paid > 0)
      .map((b, k) => ({
        id: "FK202611" + k,
        billId: b.id,
        amount: b.paid,
        date,
      }));
    return {
      version: 1,
      revision: 0,
      sequence: 2000,
      settings: {
        name: "育苗苗",
        date,
        lowMargin: 12,
        deliveryRate: 3,
        otherRate: 2,
        collectStart: "18:00",
        collectEnd: "01:00",
      },
      schools,
      suppliers,
      products,
      routes,
      batches,
      orders,
      purchases,
      certs,
      bills,
      payments,
      returns: [],
      movements: [
        {
          id: "LS001",
          date,
          type: "期初库存",
          productId: "P0001",
          qty: batches[0].qty,
          note: "以当前库存快照初始化，历史已完成单据包含在期初余额中",
        },
      ],
      logs: [{ date: date + " 09:00", text: "演示业务数据已准备就绪" }],
      carts: {},
      selectedSchool: "S1",
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
