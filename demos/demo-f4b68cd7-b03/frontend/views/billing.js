/* 收费管理：账单、收费结算、营收统计 */
App.register('billing', {
  title: '收费管理',
  group: '经营中心',
  icon: 'receipt',
  subtitle: '账单 · 收款 · 营收',

  state: { status: 'all', kw: '', start: '', end: '', page: 1 },

  async render(root) {
    const s = this.state;
    const st = await App.api.get('/api/bill/stats');
    root.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi"><div class="k-label">今日营收</div>
          <div class="k-value">¥${App.fmt.money(st.today_income).split('.')[0]}</div>
          <div class="k-foot">今日开单 ${st.today_count} 张</div></div>
        <div class="kpi blue"><div class="k-label">本月营收</div>
          <div class="k-value">¥${App.fmt.money(st.month_income).split('.')[0]}</div>
          <div class="k-foot">自然月累计</div></div>
        <div class="kpi warn"><div class="k-label">待收金额</div>
          <div class="k-value">¥${App.fmt.money(st.pending_amount).split('.')[0]}</div>
          <div class="k-foot">${st.pending_count} 张待缴费</div></div>
        <div class="kpi violet"><div class="k-label">客单价</div>
          <div class="k-value">¥${st.today_count ? App.fmt.money(st.today_income / st.today_count).split('.')[0] : '0'}</div>
          <div class="k-foot">今日平均</div></div>
      </div>

      <div class="grid g2" style="margin-bottom:16px">
        <div class="card"><div class="card-head"><h3>近 14 日营收</h3></div>
          <div class="card-body">${App.bars(st.by_day.map(d => ({ label: String(d.date).slice(5), value: Math.round(d.amount) })))}</div></div>
        <div class="card"><div class="card-head"><h3>收入构成 / 支付方式</h3></div>
          <div class="card-body">
            <div class="section-title">项目构成</div>
            ${App.hbars(st.by_type.map(x => ({ name: x.name, value: Math.round(x.value) })), { fmt: v => '¥' + v })}
            <div class="section-title" style="margin-top:16px">支付方式</div>
            ${App.donut(st.by_method.map(x => ({ name: x.name, value: Math.round(x.value) })), { center: '', centerLabel: '' })}
          </div></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>账单列表</h3>
          <div class="right"><button class="btn btn-sm" id="btn-today">只看今日</button></div>
        </div>
        <div class="toolbar">
          <select id="status"><option value="all">全部状态</option>
            ${['待缴费', '部分缴费', '已结清', '已退费'].map(x =>
              `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
          <input id="kw" placeholder="客户 / 手机 / 单号" value="${App.esc(s.kw)}">
          <input type="date" id="start" value="${s.start}">
          <span class="muted small">~</span>
          <input type="date" id="end" value="${s.end}">
          <button class="btn btn-sm" id="search">${App.icon('search')} 查询</button>
          <span class="grow"></span><span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelector('#btn-today').addEventListener('click', () => {
      const t = new Date().toISOString().slice(0, 10);
      s.start = t; s.end = t; s.page = 1; App.refresh();
    });
    root.querySelector('#search').addEventListener('click', () => {
      s.status = root.querySelector('#status').value;
      s.kw = root.querySelector('#kw').value.trim();
      s.start = root.querySelector('#start').value;
      s.end = root.querySelector('#end').value;
      s.page = 1; App.refresh();
    });
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const data = await App.api.get(
      `/api/bill/invoices?status=${s.status}&keyword=${encodeURIComponent(s.kw)}&start=${s.start}&end=${s.end}&page=${s.page}&page_size=20`);
    const cols = [
      { label: '单号', key: 'invoice_no', render: r => `<div class="strong">${App.esc(r.invoice_no)}</div>
         <div class="muted small">${App.fmt.dtime(r.created_at)}</div>` },
      { label: '客户 / 宠物', key: 'owner_name', render: r => `<div>${App.esc(r.owner_name || '')}</div>
         <div class="muted small">${App.esc(r.pet_name || '')} ${App.esc(r.phone || '')}</div>` },
      { label: '关联就诊', key: 'visit_no', render: r => App.esc(r.visit_no || '-') },
      { label: '总额', key: 'total_amount', align: 'right', render: r => `¥${App.fmt.money(r.total_amount)}` },
      { label: '优惠', key: 'discount', align: 'right', render: r => r.discount ? `-¥${App.fmt.money(r.discount)}` : '-' },
      { label: '应付', key: 'payable', align: 'right', render: r => `<strong>¥${App.fmt.money(r.payable)}</strong>` },
      { label: '已付', key: 'paid_amount', align: 'right', render: r => `¥${App.fmt.money(r.paid_amount)}` },
      { label: '方式', key: 'pay_method', render: r => r.pay_method ? App.badge(r.pay_method, 'gray') : '-' },
      { label: '状态', key: 'status', render: r => App.badge(r.status) }
    ];
    const listEl = root.querySelector('#list');
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无账单' });
    App.bindTable(listEl, { rows: data.items, onRow: r => this.openInvoice(r.id) });
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async openInvoice(id) {
    const inv = await App.api.get(`/api/bill/invoices/${id}`);
    const m = App.modal({
      title: `账单明细 · ${inv.invoice_no}`,
      width: 'wide',
      body: `
      <div class="grid g2" style="margin-bottom:14px">
        <div class="card"><div class="card-body">
          <dl class="desc">
            <dt>客户</dt><dd class="strong">${App.esc(inv.owner ? inv.owner.name : '')}</dd>
            <dt>宠物</dt><dd>${App.esc(inv.pet ? inv.pet.name : '-')}</dd>
            <dt>就诊</dt><dd>${App.esc(inv.visit ? inv.visit.visit_no : '-')}</dd>
            <dt>开单时间</dt><dd>${App.fmt.dtime(inv.created_at)}</dd>
            <dt>支付时间</dt><dd>${App.fmt.dtime(inv.paid_at)}</dd>
            <dt>收银员</dt><dd>${App.esc(inv.cashier || '-')}</dd>
          </dl></div></div>
        <div class="card"><div class="card-body" style="text-align:center">
          <div class="muted small">应付金额</div>
          <div style="font-size:28px;font-weight:700;margin:6px 0">¥${App.fmt.money(inv.payable)}</div>
          <div>${App.badge(inv.status)}</div>
          <div class="muted small" style="margin-top:6px">已付 ¥${App.fmt.money(inv.paid_amount)} · ${App.esc(inv.pay_method || '未支付')}</div>
        </div></div>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>类别</th><th>项目名称</th><th>数量</th><th class="num">单价</th><th class="num">金额</th></tr></thead>
        <tbody>${(inv.items || []).map(i => `<tr>
          <td>${App.badge(i.item_type, i.item_type === '药品' ? 'teal' : (i.item_type === '检验' ? 'blue' : 'gray'))}</td>
          <td>${App.esc(i.name)}</td>
          <td>${i.qty}</td>
          <td class="num">¥${App.fmt.money(i.unit_price)}</td>
          <td class="num strong">¥${App.fmt.money(i.amount)}</td></tr>`).join('')}</tbody>
        <tfoot><tr>
          <td colspan="4" style="text-align:right;color:var(--muted)">合计 / 优惠 / 应付</td>
          <td class="num strong">¥${App.fmt.money(inv.total_amount)}<br>
            <span class="muted">-¥${App.fmt.money(inv.discount)}</span><br>¥${App.fmt.money(inv.payable)}</td>
        </tr></tfoot></table></div>`,
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn" id="disc">${App.icon('edit')} 调整优惠</button>
        <button class="btn btn-danger" id="refund">退费</button>
        <button class="btn btn-primary" id="pay">${App.icon('wallet')} 收费结算</button>`
    });
    const foot = m.body.parentElement.querySelector('.modal-foot');
    foot.querySelector('#disc').addEventListener('click', async () => {
      await App.form({
        title: '调整优惠金额',
        fields: [{ name: 'discount', label: '优惠金额 (元)', type: 'number', step: '0.01', value: inv.discount }],
        onSubmit: async v => {
          await App.api.post(`/api/bill/invoices/${id}/discount`, v);
          App.toast('优惠已调整', 'ok');
          m.close(); this.openInvoice(id); App.refresh();
        }
      });
    });
    foot.querySelector('#pay').addEventListener('click', async () => {
      await App.form({
        title: '收费结算',
        tip: '应付 ¥' + App.fmt.money(inv.payable) + '，已付 ¥' + App.fmt.money(inv.paid_amount),
        fields: [
          { name: 'pay_method', label: '支付方式', type: 'select', value: '微信',
            options: ['微信', '支付宝', '现金', '银行卡', '会员卡', '挂账'] },
          { name: 'amount', label: '本次收款', type: 'number', step: '0.01',
            value: Number(inv.payable) - Number(inv.paid_amount) },
          { name: 'cashier', label: '收银员', value: 'admin' }
        ],
        onSubmit: async v => {
          const r = await App.api.post(`/api/bill/invoices/${id}/pay`, v);
          App.toast(`收费成功，状态：${r.status}`, 'ok');
          m.close(); App.refresh();
        }
      });
    });
    foot.querySelector('#refund').addEventListener('click', async () => {
      if (!await App.confirm('确认整单退费？已付金额将原路退回（会员卡自动回充）。')) return;
      await App.api.post(`/api/bill/invoices/${id}/refund`, {});
      App.toast('已退费', 'ok');
      m.close(); App.refresh();
    });
  }
});
