/* 进销存管理：商品库存、采购、供应商、库存流水 */
App.register('inventory', {
  title: '进销存管理',
  group: '供应链',
  icon: 'box',
  subtitle: '采购 · 库存 · 销售出库',

  state: { tab: 'product', kw: '', category: 'all', onlyLow: false, page: 1 },

  async render(root) {
    const s = this.state;
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="tabs" style="border:none;margin:0">
            <div class="tab ${s.tab === 'product' ? 'active' : ''}" data-tab="product">药品/耗材库存</div>
            <div class="tab ${s.tab === 'po' ? 'active' : ''}" data-tab="po">采购管理</div>
            <div class="tab ${s.tab === 'supplier' ? 'active' : ''}" data-tab="supplier">供应商</div>
            <div class="tab ${s.tab === 'log' ? 'active' : ''}" data-tab="log">库存流水</div>
          </div>
          <div class="right">
            ${s.tab === 'product' ? `<button class="btn btn-sm" id="btn-adjust">${App.icon('edit')} 盘点调整</button>
              <button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 新增商品</button>` : ''}
            ${s.tab === 'po' ? `<button class="btn btn-primary btn-sm" id="btn-new">${App.icon('truck')} 新建采购单</button>` : ''}
            ${s.tab === 'supplier' ? `<button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 新增供应商</button>` : ''}
          </div>
        </div>
        <div class="card-body flush" id="body"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;
    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { s.tab = t.dataset.tab; s.page = 1; App.refresh(); });
    });
    const bn = root.querySelector('#btn-new');
    if (bn) bn.addEventListener('click', () => {
      if (s.tab === 'product') this.newProduct();
      else if (s.tab === 'po') this.newPO();
      else this.newSupplier();
    });
    const ba = root.querySelector('#btn-adjust');
    if (ba) ba.addEventListener('click', () => this.adjust());
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const el = root.querySelector('#body');
    const pagerEl = root.querySelector('#pager');

    if (s.tab === 'product') {
      const st = await App.api.get('/api/inv/stats');
      const kpi = `<div class="card-body"><div class="grid g4" style="margin-bottom:14px">
        <div class="kpi"><div class="k-label">在售品种</div><div class="k-value">${st.product_total}<span class="k-unit">种</span></div>
          <div class="k-foot">近效期批次 ${st.near_expire} 个</div></div>
        <div class="kpi blue"><div class="k-label">库存进价金额</div><div class="k-value">¥${App.fmt.int(st.stock_amount)}</div>
          <div class="k-foot">零售市值 ¥${App.fmt.int(st.retail_amount)}</div></div>
        <div class="kpi warn"><div class="k-label">库存预警</div><div class="k-value">${st.low_stock}<span class="k-unit">项</span></div>
          <div class="k-foot">低于安全库存</div></div>
        <div class="kpi danger"><div class="k-label">缺货</div><div class="k-value">${st.out_of_stock}<span class="k-unit">项</span></div>
          <div class="k-foot">近30天入 ${App.fmt.int(st.month_in)} / 出 ${App.fmt.int(st.month_out)}</div></div>
      </div></div>`;

      const data = await App.api.get(
        `/api/inv/products?keyword=${encodeURIComponent(s.kw)}&category=${s.category}&only_low=${s.onlyLow}&page=${s.page}&page_size=20`);
      const toolbar = `<div class="toolbar" style="border-top:1px solid var(--border-2)">
        <input id="kw" placeholder="名称 / 编码 / 通用名" value="${App.esc(s.kw)}">
        <select id="cat"><option value="all">全部类别</option>
          ${['药品', '耗材', '疫苗', '食品', '用品'].map(x =>
            `<option value="${x}" ${s.category === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <label class="small" style="display:flex;align-items:center;gap:5px">
          <input type="checkbox" id="low" ${s.onlyLow ? 'checked' : ''} style="width:auto"> 仅看预警</label>
        <button class="btn btn-sm" id="search">${App.icon('search')} 查询</button>
        <span class="grow"></span><span class="muted small">共 ${data.meta.total} 条</span></div>`;

      el.innerHTML = kpi + toolbar + `<div id="plist"></div>`;
      const cols = [
        { label: '商品', key: 'name', render: r => `<div class="strong">${App.esc(r.name)}</div>
           <div class="muted small">${App.esc(r.sku)} · ${App.esc(r.spec || '')}</div>` },
        { label: '类别', key: 'category', render: r => App.badge(r.category, r.category === '疫苗' ? 'violet' : (r.category === '药品' ? 'teal' : 'gray')) },
        { label: '厂家', key: 'manufacturer', render: r => App.esc(r.manufacturer || '-') },
        { label: '进价', key: 'purchase_price', align: 'right', render: r => `¥${App.fmt.money(r.purchase_price)}` },
        { label: '售价', key: 'sale_price', align: 'right', render: r => `<strong>¥${App.fmt.money(r.sale_price)}</strong>` },
        { label: '库存', key: 'stock_qty', align: 'right', render: r => `${r.stock_qty} ${App.esc(r.unit)}` },
        { label: '安全库存', key: 'safety_stock', align: 'right', render: r => `${r.safety_stock} ${App.esc(r.unit)}` },
        { label: '库存金额', key: 'stock_amount', align: 'right', render: r => `¥${App.fmt.money(r.stock_amount)}` },
        { label: '储存', key: 'storage_cond', render: r => App.badge(r.storage_cond, r.storage_cond === '冷藏' ? 'blue' : 'gray') },
        { label: '状态', key: 'stock_status', render: r => App.badge(r.stock_status) + (r.near_expire_batches ? ` <span class="badge warn">近效期${r.near_expire_batches}</span>` : '') }
      ];
      const plist = el.querySelector('#plist');
      plist.innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无商品' });
      App.bindTable(plist, { rows: data.items, onRow: r => this.productDetail(r.id) });

      const tb = el.querySelector('.toolbar');
      tb.querySelector('#search').addEventListener('click', () => {
        s.kw = tb.querySelector('#kw').value.trim();
        s.category = tb.querySelector('#cat').value;
        s.onlyLow = tb.querySelector('#low').checked;
        s.page = 1; App.refresh();
      });
      tb.querySelector('#cat').addEventListener('change', () => tb.querySelector('#search').click());
      tb.querySelector('#low').addEventListener('change', () => tb.querySelector('#search').click());
      pagerEl.innerHTML = App.pager(data.meta, p => { s.page = p; App.refresh(); });
      App.bindPager(pagerEl, p => { s.page = p; App.refresh(); });
    }

    else if (s.tab === 'po') {
      const data = await App.api.get(`/api/inv/purchase-orders?status=all&page=${s.page}&page_size=20`);
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>单号</th><th>供应商</th><th>品项数</th><th>已收</th><th>金额</th><th>下单时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${data.items.map(p => `<tr>
          <td class="strong">${App.esc(p.po_no)}</td>
          <td>${App.esc(p.supplier_name)}</td>
          <td class="num">${p.item_count}</td>
          <td class="num">${App.fmt.int(p.received)}</td>
          <td class="num strong">¥${App.fmt.money(p.total_amount)}</td>
          <td>${App.fmt.date(p.ordered_at)}</td>
          <td>${App.badge(p.status)}</td>
          <td>${p.status === '已完成' ? `<button class="btn btn-sm" data-view="${p.id}">明细</button>`
            : `<button class="btn btn-sm" data-view="${p.id}">明细</button>
               <button class="btn btn-sm btn-primary" data-rec="${p.id}">收货入库</button>`}</td>
        </tr>`).join('')}</tbody></table></div>`;
      el.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => this.poDetail(Number(b.dataset.view))));
      el.querySelectorAll('[data-rec]').forEach(b => b.addEventListener('click', () => this.receive(Number(b.dataset.rec))));
      pagerEl.innerHTML = App.pager(data.meta, p => { s.page = p; App.refresh(); });
      App.bindPager(pagerEl, p => { s.page = p; App.refresh(); });
    }

    else if (s.tab === 'supplier') {
      const d = await App.api.get('/api/inv/suppliers');
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>供应商</th><th>联系人</th><th>电话</th><th>主营</th><th>地址</th><th>许可证号</th><th>合作评价</th><th>采购单</th><th>状态</th></tr></thead>
        <tbody>${d.items.map(x => `<tr>
          <td class="strong">${App.esc(x.name)}</td>
          <td>${App.esc(x.contact || '-')}</td><td>${App.esc(x.phone || '-')}</td>
          <td>${App.badge(x.category, 'gray')}</td>
          <td class="small">${App.esc(x.address || '-')}</td>
          <td class="small">${App.esc(x.license_no || '-')}</td>
          <td>${App.badge(x.cooperation, 'ok')}</td>
          <td class="num">${x.po_count}</td>
          <td>${App.badge(x.status)}</td></tr>`).join('')}</tbody></table></div>`;
      pagerEl.innerHTML = '';
    }

    else {
      const data = await App.api.get(`/api/inv/logs?page=${s.page}&page_size=30`);
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>时间</th><th>商品</th><th>类型</th><th>变动</th><th>变动前</th><th>变动后</th><th>单据号</th><th>操作人</th></tr></thead>
        <tbody>${data.items.map(l => `<tr>
          <td class="small">${App.fmt.dtime(l.created_at)}</td>
          <td class="strong">${App.esc(l.product_name)}</td>
          <td>${App.badge(l.log_type, l.log_type.includes('入库') ? 'ok' : (l.log_type === '报损' ? 'danger' : 'blue'))}</td>
          <td class="num strong" style="color:${l.change_qty > 0 ? 'var(--ok)' : 'var(--danger)'}">
            ${l.change_qty > 0 ? '+' : ''}${l.change_qty} ${App.esc(l.unit || '')}</td>
          <td class="num">${l.before_qty}</td><td class="num">${l.after_qty}</td>
          <td class="small">${App.esc(l.ref_no || '-')}</td>
          <td class="small">${App.esc(l.operator || '-')}</td></tr>`).join('')}</tbody></table></div>`;
      pagerEl.innerHTML = App.pager(data.meta, p => { s.page = p; App.refresh(); });
      App.bindPager(pagerEl, p => { s.page = p; App.refresh(); });
    }
  },

  async newProduct() {
    await App.form({
      title: '新增商品 / 药品',
      columns: 2,
      fields: [
        { name: 'name', label: '商品名称', required: true },
        { name: 'generic_name', label: '通用名' },
        { name: 'category', label: '类别', type: 'select', value: '药品', options: ['药品', '耗材', '疫苗', '食品', '用品'] },
        { name: 'spec', label: '规格', placeholder: '如 50mg*10片' },
        { name: 'unit', label: '单位', value: '盒' },
        { name: 'manufacturer', label: '生产厂家' },
        { name: 'purchase_price', label: '进货价', type: 'number', step: '0.01' },
        { name: 'sale_price', label: '零售价', type: 'number', step: '0.01' },
        { name: 'stock_qty', label: '初始库存', type: 'number', step: '0.5' },
        { name: 'safety_stock', label: '安全库存', type: 'number', value: 10 },
        { name: 'storage_cond', label: '储存条件', type: 'select', value: '常温', options: ['常温', '冷藏', '冷冻', '避光'] },
        { name: 'is_prescription', label: '是否处方药', type: 'select', value: 1, options: [{ value: 1, label: '是' }, { value: 0, label: '否' }] }
      ],
      onSubmit: async v => {
        await App.api.post('/api/inv/products', v);
        App.toast('商品已新增', 'ok');
        App.refresh();
      }
    });
  },

  async adjust() {
    const prods = await App.api.get('/api/inv/products?status=在售&page=1&page_size=300');
    await App.form({
      title: '库存盘点 / 报损调整',
      tip: '数量为正表示盘盈入库，为负表示盘亏或报损出库，系统自动生成库存流水',
      fields: [
        { name: 'product_id', label: '商品', type: 'select',
          options: prods.items.map(p => ({ value: p.id, label: `${p.name}（现存 ${p.stock_qty}${p.unit}）` })) },
        { name: 'log_type', label: '调整类型', type: 'select', value: '盘点调整',
          options: ['盘点调整', '报损', '退库', '采购入库'] },
        { name: 'delta', label: '变动数量（可为负）', type: 'number', step: '0.5', required: true },
        { name: 'ref_no', label: '单据号' },
        { name: 'operator', label: '操作人', value: 'admin' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/inv/stock-adjust', v);
        App.toast('库存已调整并生成流水', 'ok');
        App.refresh();
      }
    });
  },

  async productDetail(id) {
    const p = await App.api.get(`/api/inv/products/${id}`);
    const m = App.modal({
      title: `商品详情 · ${p.name}`,
      width: 'wide',
      body: `
      <div class="grid g2">
        <div class="card"><div class="card-head"><h3>基本信息</h3></div><div class="card-body">
          <dl class="desc">
            <dt>编码</dt><dd>${App.esc(p.sku)}</dd>
            <dt>通用名</dt><dd>${App.esc(p.generic_name || '-')}</dd>
            <dt>类别</dt><dd>${App.badge(p.category)}</dd>
            <dt>规格</dt><dd>${App.esc(p.spec || '-')}</dd>
            <dt>厂家</dt><dd>${App.esc(p.manufacturer || '-')}</dd>
            <dt>批准文号</dt><dd class="small">${App.esc(p.approval_no || '-')}</dd>
            <dt>进价 / 售价</dt><dd>¥${App.fmt.money(p.purchase_price)} / <strong>¥${App.fmt.money(p.sale_price)}</strong></dd>
            <dt>当前库存</dt><dd><strong>${p.stock_qty} ${App.esc(p.unit)}</strong></dd>
            <dt>安全库存</dt><dd>${p.safety_stock} ${App.esc(p.unit)}</dd>
            <dt>储存</dt><dd>${App.badge(p.storage_cond)}</dd>
          </dl>
        </div></div>
        <div class="card"><div class="card-head"><h3>批次与效期</h3></div><div class="card-body flush">
          ${(p.batches || []).length ? (p.batches || []).map(b => {
            const near = b.expire_date && (new Date(b.expire_date) - new Date()) < 90 * 864e5;
            return `<div class="list-item">
              <div class="grow"><div class="lt">批次 ${App.esc(b.batch_no)}</div>
                <div class="ls">${App.esc(b.supplier_name || '')} · 数量 ${b.qty}</div></div>
              <span class="badge ${near ? 'danger' : 'gray'}">${App.esc(b.expire_date || '-')}</span></div>`;
          }).join('') : '<div class="empty">暂无批次记录</div>'}
        </div></div>
      </div>
      <div class="card" style="margin-top:14px"><div class="card-head"><h3>库存流水</h3></div>
        <div class="card-body flush">
          ${(p.logs || []).length ? (p.logs || []).map(l => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.badge(l.log_type)}</div>
                <div class="ls">${App.fmt.dtime(l.created_at)} · ${App.esc(l.ref_no || '')} · ${App.esc(l.operator || '')}</div></div>
              <span style="color:${l.change_qty > 0 ? 'var(--ok)' : 'var(--danger)'};font-weight:700">
                ${l.change_qty > 0 ? '+' : ''}${l.change_qty}</span>
              <span class="muted small">${l.before_qty} → ${l.after_qty}</span>
            </div>`).join('') : '<div class="empty">暂无流水</div>'}
        </div></div>`,
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn btn-primary" id="edit">${App.icon('edit')} 编辑商品</button>`
    });
    m.body.parentElement.querySelector('#edit').addEventListener('click', async () => {
      await App.form({
        title: '编辑商品',
        columns: 2,
        fields: [
          { name: 'name', label: '名称', value: p.name },
          { name: 'sale_price', label: '零售价', type: 'number', step: '0.01', value: p.sale_price },
          { name: 'purchase_price', label: '进价', type: 'number', step: '0.01', value: p.purchase_price },
          { name: 'safety_stock', label: '安全库存', type: 'number', value: p.safety_stock },
          { name: 'spec', label: '规格', value: p.spec },
          { name: 'manufacturer', label: '厂家', value: p.manufacturer },
          { name: 'status', label: '状态', type: 'select', value: p.status, options: ['在售', '停售'] }
        ],
        onSubmit: async v => {
          await App.api.put(`/api/inv/products/${id}`, v);
          App.toast('已保存', 'ok');
          m.close(); App.refresh();
        }
      });
    });
  },

  async newPO() {
    const [sups, prods] = await Promise.all([
      App.api.get('/api/inv/suppliers'),
      App.api.get('/api/inv/products?status=在售&page=1&page_size=300')
    ]);
    const opt = prods.items.map(p => `<option value="${p.id}">${App.esc(p.name)}（${App.esc(p.spec)}）进价 ¥${p.purchase_price}</option>`).join('');
    const m = App.modal({
      title: '新建采购单',
      width: 'wide',
      body: `
        <div class="field"><label>供应商</label>
          <select id="sup">${sups.items.map(s => `<option value="${s.id}">${App.esc(s.name)}</option>`).join('')}</select></div>
        <div class="section-title">采购明细</div>
        <div class="table-wrap"><table class="tbl" id="rows">
          <thead><tr><th style="width:38%">商品</th><th>数量</th><th>进价</th><th>批号</th><th>有效期</th><th></th></tr></thead>
          <tbody></tbody></table></div>
        <button class="btn btn-sm" id="add" style="margin-top:10px">${App.icon('plus')} 添加一行</button>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="save">提交采购单</button>'
    });
    const tbody = m.body.querySelector('#rows tbody');
    const addRow = () => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><select class="p">${opt}</select></td>
        <td><input type="number" class="q" value="20" step="1" min="1"></td>
        <td><input type="number" class="pr" step="0.01"></td>
        <td><input class="b" placeholder="批号"></td>
        <td><input type="date" class="e"></td>
        <td><button class="btn btn-sm btn-danger del">删除</button></td>`;
      const sel = tr.querySelector('.p');
      const sync = () => {
        const p = prods.items.find(x => String(x.id) === sel.value);
        if (p) tr.querySelector('.pr').value = p.purchase_price;
      };
      sel.addEventListener('change', sync); sync();
      tr.querySelector('.del').addEventListener('click', () => tr.remove());
      tbody.appendChild(tr);
    };
    m.body.querySelector('#add').addEventListener('click', addRow);
    addRow();
    m.body.parentElement.querySelector('#save').addEventListener('click', async () => {
      const items = Array.from(tbody.querySelectorAll('tr')).map(tr => ({
        product_id: Number(tr.querySelector('.p').value),
        qty: Number(tr.querySelector('.q').value),
        price: Number(tr.querySelector('.pr').value),
        batch_no: tr.querySelector('.b').value,
        expire_date: tr.querySelector('.e').value
      })).filter(x => x.product_id && x.qty > 0);
      if (!items.length) return App.toast('请至少添加一条明细', 'err');
      await App.api.post('/api/inv/purchase-orders', {
        supplier_id: Number(m.body.querySelector('#sup').value),
        operator: 'admin',
        items
      });
      App.toast('采购单已创建', 'ok');
      m.close(); App.refresh();
    });
  },

  async poDetail(id) {
    const p = await App.api.get(`/api/inv/purchase-orders/${id}`);
    App.modal({
      title: `采购单 · ${p.po_no}`,
      width: 'wide',
      body: `<dl class="desc" style="margin-bottom:14px">
          <dt>供应商</dt><dd>${App.esc(p.supplier ? p.supplier.name : '')} ${App.esc(p.supplier ? p.supplier.contact : '')} ${App.esc(p.supplier ? p.supplier.phone : '')}</dd>
          <dt>状态</dt><dd>${App.badge(p.status)}</dd>
          <dt>金额</dt><dd><strong>¥${App.fmt.money(p.total_amount)}</strong></dd>
          <dt>下单</dt><dd>${App.fmt.date(p.ordered_at)}</dd>
        </dl>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>商品</th><th>规格</th><th>采购数</th><th>已收</th><th>进价</th><th>金额</th><th>批号</th><th>有效期</th></tr></thead>
          <tbody>${(p.items || []).map(i => `<tr>
            <td class="strong">${App.esc(i.product_name)}</td>
            <td class="small muted">${App.esc(i.spec || '')}</td>
            <td class="num">${i.qty}</td>
            <td class="num ${i.received_qty >= i.qty ? '' : 'strong'}">${i.received_qty}</td>
            <td class="num">¥${App.fmt.money(i.price)}</td>
            <td class="num strong">¥${App.fmt.money(i.amount)}</td>
            <td>${App.esc(i.batch_no || '-')}</td>
            <td>${App.fmt.date(i.expire_date)}</td></tr>`).join('')}</tbody></table></div>`
    });
  },

  async receive(id) {
    const p = await App.api.get(`/api/inv/purchase-orders/${id}`);
    const remain = p.items.filter(i => i.received_qty < i.qty);
    if (!remain.length) return App.toast('该采购单已全部收货', 'warn');
    const m = App.modal({
      title: `收货入库 · ${p.po_no}`,
      width: 'wide',
      body: `<div class="hint small" style="margin-bottom:10px">确认后库存自动增加，并生成批次与库存流水</div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>商品</th><th>采购数</th><th>已收</th><th>本次收货</th><th>批号</th></tr></thead>
          <tbody>${remain.map(i => `<tr>
            <td class="strong">${App.esc(i.product_name)}（${App.esc(i.spec || '')}）</td>
            <td class="num">${i.qty}</td><td class="num">${i.received_qty}</td>
            <td><input type="number" data-id="${i.id}" value="${i.qty - i.received_qty}" min="0" step="1"></td>
            <td class="small">${App.esc(i.batch_no || '-')}</td></tr>`).join('')}</tbody></table></div>`,
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="ok">确认收货</button>'
    });
    m.body.parentElement.querySelector('#ok').addEventListener('click', async () => {
      const items = {};
      m.body.querySelectorAll('input[data-id]').forEach(inp => {
        items[inp.dataset.id] = Number(inp.value || 0);
      });
      const r = await App.api.post(`/api/inv/purchase-orders/${id}/receive`, { items, operator: 'admin' });
      App.toast(`已收货，入库 ${r.received} 件，单据状态：${r.status}`, 'ok');
      m.close(); App.refresh();
    });
  },

  async newSupplier() {
    await App.form({
      title: '新增供应商',
      columns: 2,
      fields: [
        { name: 'name', label: '供应商名称', required: true },
        { name: 'contact', label: '联系人' },
        { name: 'phone', label: '联系电话' },
        { name: 'category', label: '主营类别', type: 'select', value: '药品', options: ['药品', '耗材', '疫苗', '用品', '设备'] },
        { name: 'license_no', label: '经营许可证号' },
        { name: 'address', label: '地址' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/inv/suppliers', v);
        App.toast('供应商已新增', 'ok');
        App.refresh();
      }
    });
  }
});
