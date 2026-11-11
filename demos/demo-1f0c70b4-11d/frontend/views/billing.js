/* 收费管理：账单、收费结算、营收统计 */
const billingPaymentRequests = new Set();
App.collectInvoice = async function(id, title = '收费结算', sourceRoot) {
  if(billingPaymentRequests.has(id))return null;
  const route=location.hash;billingPaymentRequests.add(id);
  try {
  const inv = await App.api.get('/api/bill/invoices/' + id);
  if(location.hash!==route||(sourceRoot&&!sourceRoot.isConnected))return null;
  const cards = (inv.cards || []).filter(c => c.status === '正常' && (!c.valid_until || c.valid_until >= Demo.date()));
  const methods = ['微信', '支付宝', '现金', '银行卡'].concat(cards.length ? ['会员卡'] : []).concat(inv.deposit_admission_id&&inv.deposit_balance>0?['住院预交金']:[]);
  const requestKey='collect-'+id+'-'+Date.now()+'-'+Math.random().toString(16).slice(2);
  return await App.form({
    title, submitText: '确认收款',
    tip: '应付 ¥' + App.fmt.money(inv.payable) + '，已付 ¥' + App.fmt.money(inv.paid_amount)+(inv.deposit_admission_id?'；预交金可用 ¥'+App.fmt.money(inv.deposit_balance):''),
    fields: [
      {name: 'pay_method', label: '支付方式', type: 'select', value: '微信', options: methods},
      ...(cards.length ? [{name: 'card_id', label: '付款会员卡', type: 'select', value: '', options: [{value: '', label: '自动选择余额足够的可用卡'}, ...cards.map(c => ({value: c.id, label: c.card_no + ' · ' + c.level + ' · 余额 ¥' + App.fmt.money(c.balance)}))], hint: '可分次选择不同会员卡收款，退费将分别退回原支付卡。'}] : []),
      {name: 'amount', label: '本次收款', type: 'number', min: .01, max: Number(inv.payable) - Number(inv.paid_amount), step: '.01', value: Number(inv.payable) - Number(inv.paid_amount), required: true},
      {name: 'cashier', label: '收银员', value: App.access?.name||'admin'}
    ],
    onOpen(m) {
      const method = m.body.querySelector('[name=pay_method]'), card = m.body.querySelector('[name=card_id]');
      if (card) { const sync = () => { const visible = method.value === '会员卡'; card.closest('.field').style.display = visible ? '' : 'none'; card.disabled = !visible; }; method.addEventListener('change', sync); sync(); }
    },
    onSubmit: async v => v.pay_method==='住院预交金'?(await App.api.post('/api/bill/deposits/'+inv.deposit_admission_id+'/apply',{invoice_id:id,amount:v.amount,request_key:requestKey})).invoice:App.api.post('/api/bill/invoices/' + id + '/pay', v)
  });
  } finally { billingPaymentRequests.delete(id); }
};
App.register('billing', {
  title: '收费管理',
  group: '经营中心',
  icon: 'receipt',
  subtitle: '账单 · 收款 · 营收',

  state: { status: 'all', kw: '', start: '', end: '', page: 1 },

  async render(root,arg) {
    const s = this.state;
    if(arg==='pending'){s.status='unpaid';s.page=1;s.start='';s.end='';s.kw='';history.replaceState(null,'','#/billing');}
    const st = await App.api.get('/api/bill/stats');
    root.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi"><div class="k-label">今日营收</div>
          <div class="k-value">¥${App.fmt.money(st.today_income).split('.')[0]}</div>
          <div class="k-foot">实收 ¥${App.fmt.money(st.today_collected)} · 退款 ¥${App.fmt.money(st.today_refunded)}</div></div>
        <div class="kpi blue"><div class="k-label">本月营收</div>
          <div class="k-value">¥${App.fmt.money(st.month_income).split('.')[0]}</div>
          <div class="k-foot">按实际收退款日期统计净额</div></div>
        <div class="kpi warn"><div class="k-label">待收金额</div>
          <div class="k-value">¥${App.fmt.money(st.pending_amount).split('.')[0]}</div>
          <div class="k-foot">${st.pending_count} 张待缴费</div></div>
        <div class="kpi violet"><div class="k-label">客单价</div>
          <div class="k-value">¥${st.today_paid_count ? App.fmt.money(st.today_collected / st.today_paid_count).split('.')[0] : '0'}</div>
          <div class="k-foot">今日收款 ${st.today_paid_count} 单 · 开单 ${st.today_count} 张</div></div>
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
          <div class="right"><button class="btn btn-sm" id="btn-day-close">日结 / 收银交接</button><button class="btn btn-sm" id="btn-today">只看今日</button></div>
        </div>
        <div class="toolbar">
          <select id="status"><option value="all">全部状态</option>
            <option value="unpaid" ${s.status==='unpaid'?'selected':''}>全部待收款</option>
            ${['待缴费', '部分缴费', '已结清', '已退费'].map(x =>
              `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
          <input id="kw" placeholder="客户 / 手机 / 单号" value="${App.esc(s.kw)}">
          <input type="date" id="start" value="${s.start}">
          <span class="muted small">~</span>
          <input type="date" id="end" value="${s.end}">
          <button class="btn btn-sm" id="search">${App.icon('search')} 查询</button>
          <button class="btn btn-sm" id="clear">清除筛选</button>
          <span class="grow"></span><span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelector('#btn-today').addEventListener('click', () => {
      const t = Demo.date();
      s.start = t; s.end = t; s.page = 1; App.refresh();
    });
    root.querySelector('#btn-day-close').addEventListener('click',()=>App.openDayClose().catch(e=>App.toast(e.message,'err')));
    root.querySelector('#search').addEventListener('click', () => {
      s.status = root.querySelector('#status').value;
      s.kw = root.querySelector('#kw').value.trim();
      s.start = root.querySelector('#start').value;
      s.end = root.querySelector('#end').value;
      if(s.start&&s.end&&s.start>s.end)return App.toast('开始日期不能晚于结束日期','err');
      s.page = 1; App.refresh();
    });
    root.querySelector('#clear').addEventListener('click',()=>{Object.assign(s,{status:'all',kw:'',start:'',end:'',page:1});App.refresh();});
    root.querySelector('#kw').addEventListener('keydown',e=>{if(e.key==='Enter')root.querySelector('#search').click();});
    await this.load(root);
    if(/^\d+$/.test(arg||'')){history.replaceState(null,'','#/billing');await this.openInvoice(Number(arg));}
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
    const claim = inv.claim;
    const claimLocked = claim && !['草稿', '已撤回', '已驳回'].includes(claim.status);
    const refundLockedReason = claimLocked ? '退费前请先处理关联报销案件' : inv.refund_locked_reason || '';
    const canStartClaim = inv.status === '已结清' && inv.paid_amount > 0 && inv.pet && inv.visit;
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
      ${claim || canStartClaim ? `<div class="billing-claim-link">
        <div><strong>${App.icon('wallet')} 宠物医疗报销</strong><div class="muted small">${claim ? `${App.esc(claim.claim_no)} · ${App.esc(claim.status)}${claimLocked ? ' · 退费前请先处理报销案件' : ''}` : '已结清账单可带入医疗报销，自动关联宠物与本次病历。'}</div></div>
        <button type="button" class="btn btn-sm" id="invoice-claim">${claim ? '查看报销案件' : '发起医疗报销'}</button></div>` : ''}
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
        </tr></tfoot></table></div>
      <div class="section-title" style="margin-top:16px">收退款流水</div>
      ${(inv.payments||[]).length?inv.payments.map(p=>`<div class="list-item"><div class="grow"><div>${App.esc(p.method)} · ${p.amount<0?'退款':'收款'}</div><div class="muted small">${App.fmt.dtime(p.created_at)}</div></div><strong style="color:${p.amount<0?'var(--danger)':'var(--ok)'}">${p.amount<0?'-':'+'}¥${App.fmt.money(Math.abs(p.amount))}</strong></div>`).join(''):'<div class="muted small">尚无实际收退款</div>'}
      ${inv.coupon?`<div class="hint small" style="margin-top:12px">已关联：${App.esc(inv.coupon.name)} · 优惠 ¥${App.fmt.money(inv.discount)}</div>`:''}
      ${inv.source_hint?`<div class="hint small" style="margin-top:12px">${App.esc(inv.source_hint)}${inv.refund_locked_reason?'<br>'+App.esc(inv.refund_locked_reason):''}</div>`:''}
      ${inv.refund_locked_reason&&!inv.source_hint?`<div class="hint small" style="margin-top:12px">${App.esc(inv.refund_locked_reason)}</div>`:''}`,
      footer: `<button class="btn" data-close>关闭</button>
        ${inv.deposit_admission_id?'<button class="btn" id="invoice-deposit">预交金 · ¥'+App.fmt.money(inv.deposit_balance)+'</button>':''}
        <button class="btn" id="disc" ${inv.paid_amount>0||inv.status==='已退费'||inv.coupon||inv.adjustment_locked?'disabled':''} ${inv.adjustment_locked?'title="套餐价格与会员优惠已固定"':''}>${App.icon('edit')} 调整优惠</button>
        ${inv.paid_amount===0&&inv.status!=='已退费'?`<button class="btn" id="coupon" ${inv.coupon&&inv.refund_locked_reason?'disabled title="'+App.esc(inv.refund_locked_reason)+'"':!inv.coupon&&inv.discount>0?'disabled title="已有优惠不能叠加优惠券"':''}>${inv.coupon?'解除优惠券':'使用优惠券'}</button>`:''}
        <button class="btn btn-danger" id="refund" ${inv.paid_amount<=0 || refundLockedReason ? 'disabled' : ''} ${refundLockedReason ? 'title="'+App.esc(refundLockedReason)+'"' : ''}>退费</button>
        <button class="btn btn-primary" id="pay" ${inv.status==='已退费'||inv.payable<=inv.paid_amount?'disabled':''}>${App.icon('wallet')} 收费结算</button>`
    });
    m.body.querySelector('#invoice-claim')?.addEventListener('click', () => { m.close(); App.go('claims', claim ? claim.id : `invoice-${id}`); });
    const foot = m.body.parentElement.querySelector('.modal-foot');
    foot.querySelector('#invoice-deposit')?.addEventListener('click',async()=>{await App.openAdmissionDeposit(inv.deposit_admission_id);if(m.root.isConnected){m.close();this.openInvoice(id);}});
    const coupon=foot.querySelector('#coupon');
    if(coupon)coupon.addEventListener('click',async()=>{
      if(inv.coupon){await App.api.del(`/api/bill/invoices/${id}/coupon`);m.close();this.openInvoice(id);App.refresh();return;}
      const list=await App.api.get('/api/crm/coupons?owner_id='+inv.owner_id);
      const available=list.items.filter(c=>c.status==='未使用'&&(!c.expire_at||c.expire_at.slice(0,10)>=Demo.date())&&c.min_spend<=inv.total_amount);
      if(!available.length)return App.toast('该客户暂无满足门槛的可用优惠券','warn');
      await App.form({title:'使用优惠券',fields:[{name:'coupon_id',label:'优惠券',type:'select',options:available.map(c=>({value:c.id,label:c.name+' · '+(c.coupon_type==='折扣'?(c.value*10)+'折':'¥'+c.value)}))}],onSubmit:async v=>{await App.api.post(`/api/bill/invoices/${id}/coupon`,v);m.close();this.openInvoice(id);App.refresh();}});
    });
    foot.querySelector('#disc').addEventListener('click', async () => {
      await App.form({
        title: '调整优惠金额',
        fields: [{ name: 'discount', label: '优惠金额 (元)', type: 'number', min:0,max:inv.total_amount,step: '0.01', value: inv.discount }],
        onSubmit: async v => {
          await App.api.post(`/api/bill/invoices/${id}/discount`, v);
          App.toast('优惠已调整', 'ok');
          m.close(); this.openInvoice(id); App.refresh();
        }
      });
    });
    foot.querySelector('#pay').addEventListener('click', async () => {
      const button = foot.querySelector('#pay');if(button.disabled)return;button.disabled=true;
      try { const r = await App.collectInvoice(id,'收费结算',m.root);if(r){App.toast(`收费成功，状态：${r.status}`, 'ok');m.close();App.refresh();} }
      catch(error){App.toast(error.message || '收款失败，请重试','err');}
      finally{button.disabled=false;}
    });
    foot.querySelector('#refund').addEventListener('click', async () => {
      const button = foot.querySelector('#refund');
      if (button.disabled) return;
      button.disabled = true;
      try {
        if (!await App.confirm('确认整单退费？已付金额将原路退回（会员卡自动回充）。')) return;
        await App.api.post(`/api/bill/invoices/${id}/refund`, {});
        App.toast('已退费', 'ok');
        m.close(); App.refresh();
      } catch (error) { App.toast(error.message || '退费失败，请重试', 'err'); }
      finally { button.disabled = false; }
    });
  }
});
