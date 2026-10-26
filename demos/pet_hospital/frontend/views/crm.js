/* 经营管理系统：客户全生命周期、会员、营销活动、优惠券与回访 */
App.register('crm', {
  title: '经营 CRM',
  group: '经营中心',
  icon: 'chart',
  subtitle: '全生命周期管理 · 精准营销',

  state: { tab: 'dash', seg: { life_stage: 'all', min_spend: 0, days_no_visit: 0 }, selected: [], segLoaded: false },

  async render(root) {
    const s = this.state;
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="tabs" style="border:none;margin:0">
            <div class="tab ${s.tab === 'dash' ? 'active' : ''}" data-tab="dash">经营概览</div>
            <div class="tab ${s.tab === 'segment' ? 'active' : ''}" data-tab="segment">精准营销</div>
            <div class="tab ${s.tab === 'card' ? 'active' : ''}" data-tab="card">会员卡</div>
            <div class="tab ${s.tab === 'campaign' ? 'active' : ''}" data-tab="campaign">营销活动</div>
            <div class="tab ${s.tab === 'coupon' ? 'active' : ''}" data-tab="coupon">优惠券</div>
            <div class="tab ${s.tab === 'follow' ? 'active' : ''}" data-tab="follow">回访任务</div>
          </div>
          <div class="right">
            ${s.tab === 'campaign' ? `<button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 新建活动</button>` : ''}
            ${s.tab === 'card' ? `<button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 新增会员卡</button>` : ''}
          </div>
        </div>
        <div class="card-body" id="body"><div class="skeleton">加载中…</div></div>
      </div>`;
    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { s.tab = t.dataset.tab; App.refresh(); });
    });
    const bn = root.querySelector('#btn-new');
    if (bn) bn.addEventListener('click', () => {
      s.tab === 'campaign' ? this.newCampaign() : this.newCard();
    });
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const el = root.querySelector('#body');

    if (s.tab === 'dash') {
      const st = await App.api.get('/api/crm/stats');
      el.innerHTML = `
        <div class="grid g4" style="margin-bottom:16px">
          <div class="kpi"><div class="k-label">客户总数</div><div class="k-value">${st.customer_total}<span class="k-unit">人</span></div>
            <div class="k-foot">近 30 天新增 ${st.new_30d} 人</div></div>
          <div class="kpi blue"><div class="k-label">累计消费</div><div class="k-value">¥${App.fmt.money(st.total_spend).split('.')[0]}</div>
            <div class="k-foot">客单价 ¥${App.fmt.money(st.avg_spend)}</div></div>
          <div class="kpi violet"><div class="k-label">会员卡</div><div class="k-value">${st.card_total}<span class="k-unit">张</span></div>
            <div class="k-foot">储值余额 ¥${App.fmt.money(st.card_balance)}</div></div>
          <div class="kpi warn"><div class="k-label">待办</div><div class="k-value">${st.pending_followup}<span class="k-unit">项</span></div>
            <div class="k-foot">回访 ${st.pending_followup} · 未用券 ${st.unused_coupon}</div></div>
        </div>
        <div class="grid g3">
          <div class="card"><div class="card-head"><h3>客户生命周期分布</h3></div>
            <div class="card-body">${App.donut(st.by_stage, { center: st.customer_total, centerLabel: '客户数' })}</div></div>
          <div class="card"><div class="card-head"><h3>会员等级分布</h3></div>
            <div class="card-body">${App.donut(st.by_level, { center: st.card_total, centerLabel: '会员' })}</div></div>
          <div class="card"><div class="card-head"><h3>获客渠道</h3></div>
            <div class="card-body">${App.hbars(st.by_source.map(x => ({ name: x.name, value: x.value })))}</div></div>
        </div>
        <div class="grid g2" style="margin-top:16px">
          <div class="card"><div class="card-head"><h3>高价值客户 TOP8</h3></div>
            <div class="card-body flush">
              ${st.top_customers.map((c, i) => `<div class="list-item">
                <span class="badge ${i < 3 ? 'warn' : 'gray'}">${i + 1}</span>
                <div class="grow"><div class="lt">${App.esc(c.name)}</div><div class="ls">${App.esc(c.phone)} · 到店 ${c.visit_count} 次</div></div>
                <strong>¥${App.fmt.money(c.total_spend)}</strong></div>`).join('')}
            </div></div>
          <div class="card"><div class="card-head"><h3>营销活动 ROI</h3></div>
            <div class="card-body flush">
              ${st.campaign_roi.map(c => `<div class="list-item">
                <div class="grow"><div class="lt">${App.esc(c.name)}</div>
                  <div class="ls">${App.esc(c.type)} · 触达 ${c.reach_count} · 转化 ${c.convert_count}</div></div>
                <div style="text-align:right"><div><strong>¥${App.fmt.int(c.revenue)}</strong></div>
                  <div class="small ${c.roi_percent >= 0 ? 'badge ok' : 'badge danger'}">ROI ${c.roi_percent}%</div></div>
              </div>`).join('')}
            </div></div>
        </div>`;
    }

    else if (s.tab === 'segment') {
      el.innerHTML = `
        <div class="card" style="box-shadow:none;border:1px solid var(--border)">
          <div class="card-head"><h3>人群圈选</h3><span class="sub">按生命周期 / 消费能力 / 沉默天数筛选目标客户</span></div>
          <div class="card-body">
            <div class="toolbar" style="padding:0 0 12px;border:none">
              <select id="stage"><option value="all">全部生命周期</option>
                ${['潜客', '新客', '成长', '成熟', '沉默', '流失预警'].map(x =>
                  `<option value="${x}" ${s.seg.life_stage === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
              <input id="minspend" type="number" placeholder="最低累计消费" value="${s.seg.min_spend || ''}" style="width:150px">
              <input id="days" type="number" placeholder="沉默天数 ≥" value="${s.seg.days_no_visit || ''}" style="width:140px">
              <button class="btn btn-primary btn-sm" id="run">${App.icon('search')} 圈选人群</button>
              <span class="grow"></span>
              <span class="muted small" id="cnt"></span>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <div class="card-head"><h3>目标人群</h3>
            <div class="right">
              <button class="btn btn-sm" id="sel-all">全选</button>
              <button class="btn btn-primary btn-sm" id="dispatch">${App.icon('plus')} 批量触达</button>
            </div>
          </div>
          <div class="card-body flush" id="seg-list"><div class="empty">请先设置条件并圈选人群</div></div>
        </div>`;
      el.querySelector('#run').addEventListener('click', async () => {
        s.seg.life_stage = el.querySelector('#stage').value;
        s.seg.min_spend = Number(el.querySelector('#minspend').value || 0);
        s.seg.days_no_visit = Number(el.querySelector('#days').value || 0);
        const d = await App.api.post('/api/crm/segments', s.seg);
        s.selected = d.items.map(x => x.id);
        el.querySelector('#cnt').textContent = `命中 ${d.items.length} 人`;
        el.querySelector('#seg-list').innerHTML = App.table({
          columns: [
            { label: '', key: 'id', width: '46px', render: r => `<input type="checkbox" checked data-sel="${r.id}">` },
            { label: '客户', key: 'name', render: r => `<div class="strong">${App.esc(r.name)}</div><div class="muted small">${App.esc(r.phone)}</div>` },
            { label: '生命周期', key: 'life_stage', render: r => App.badge(r.life_stage) },
            { label: '等级', key: 'member_level', render: r => App.badge(r.member_level, 'violet') },
            { label: '累计消费', key: 'total_spend', align: 'right', render: r => `¥${App.fmt.money(r.total_spend)}` },
            { label: '宠物', key: 'pet_count', render: r => `${r.pet_count} 只` },
            { label: '最近就诊', key: 'last_visit', render: r => App.fmt.date(r.last_visit) }
          ],
          rows: d.items, empty: '未命中客户'
        });
      });
      el.querySelector('#sel-all').addEventListener('click', () => {
        el.querySelectorAll('[data-sel]').forEach(c => { c.checked = true; });
      });
      el.querySelector('#dispatch').addEventListener('click', async () => {
        const ids = Array.from(el.querySelectorAll('[data-sel]')).filter(c => c.checked).map(c => Number(c.dataset.sel));
        if (!ids.length) return App.toast('请勾选目标客户', 'err');
        const camps = await App.api.get('/api/crm/campaigns?status=进行中');
        await App.form({
          title: `批量触达 ${ids.length} 位客户`,
          tip: '可同时发放优惠券并生成回访任务，实现精准营销闭环',
          fields: [
            { name: 'action', label: '触达方式', type: 'select', value: 'both',
              options: [{ value: 'both', label: '发券 + 生成回访任务' }, { value: 'coupon', label: '仅发放优惠券' }, { value: 'followup', label: '仅生成回访任务' }] },
            { name: 'campaign_id', label: '归属活动', type: 'select',
              options: [{ value: '', label: '不关联' }].concat(camps.items.map(c => ({ value: c.id, label: c.name }))) },
            { name: 'coupon_name', label: '优惠券名称', value: '专属关怀券' },
            { name: 'coupon_type', label: '券类型', type: 'select', value: '满减', options: ['满减', '代金', '折扣'] },
            { name: 'coupon_value', label: '面值 / 折扣', type: 'number', step: '0.01', value: 30,
              hint: '满减填金额（如 30），折扣填 0.8 表示 8 折' },
            { name: 'min_spend', label: '使用门槛', type: 'number', value: 200 },
            { name: 'channel', label: '触达渠道', type: 'select', value: '微信', options: ['微信', '短信', '电话'] },
            { name: 'content', label: '触达话术', type: 'textarea', value: '亲爱的宠主，您的爱宠该做健康体检啦，专属优惠券已到账，欢迎预约到店~' }
          ],
          onSubmit: async v => {
            const r = await App.api.post('/api/crm/dispatch', Object.assign({ owner_ids: ids }, v));
            App.toast(`已触达 ${r.reached} 人，发券 ${r.coupons} 张，回访 ${r.followups} 条`, 'ok');
            App.refresh();
          }
        });
      });
      // 首次进入自动执行一次默认圈选，直接呈现目标人群
      if (!s.segLoaded) {
        s.segLoaded = true;
        el.querySelector('#run').click();
      }
    }

    else if (s.tab === 'card') {
      const d = await App.api.get('/api/crm/cards');
      const data = { items: d.items, meta: { total: d.items.length, page: 1, pages: 1 } };
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>卡号</th><th>客户</th><th>等级</th><th>余额</th><th>积分</th><th>折扣</th><th>累计充值</th><th>有效期</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${d.items.map(c => `<tr>
          <td class="strong">${App.esc(c.card_no)}</td>
          <td>${App.esc(c.owner_name || '')}</td>
          <td>${App.badge(c.level, c.level === '钻石' ? 'violet' : 'warn')}</td>
          <td class="num strong">¥${App.fmt.money(c.balance)}</td>
          <td class="num">${App.fmt.int(c.points)}</td>
          <td>${Math.round(c.discount * 100) / 10} 折</td>
          <td class="num">¥${App.fmt.money(c.total_recharge)}</td>
          <td>${App.fmt.date(c.valid_until)}</td>
          <td>${App.badge(c.status)}</td>
          <td><button class="btn btn-sm btn-primary" data-recharge="${c.id}">充值</button></td>
        </tr>`).join('')}</tbody></table></div>`;
      el.querySelectorAll('[data-recharge]').forEach(b => {
        b.addEventListener('click', async () => {
          await App.form({
            title: '会员卡充值',
            fields: [{ name: 'amount', label: '充值金额 (元)', type: 'number', step: '0.01', required: true, min: 1 }],
            onSubmit: async v => {
              await App.api.post(`/api/crm/cards/${b.dataset.recharge}/recharge`, v);
              App.toast('充值成功', 'ok');
              App.refresh();
            }
          });
        });
      });
    }

    else if (s.tab === 'campaign') {
      const d = await App.api.get('/api/crm/campaigns');
      const data = { items: d.items };
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>活动名称</th><th>类型</th><th>目标人群</th><th>渠道</th><th>预算</th><th>触达</th><th>转化</th><th>产出</th><th>ROI</th><th>周期</th><th>状态</th></tr></thead>
        <tbody>${d.items.map(c => {
          const roi = c.budget > 0 ? Math.round((c.revenue - c.budget) / c.budget * 1000) / 10 : 0;
          const conv = c.reach_count > 0 ? Math.round(c.convert_count / c.reach_count * 1000) / 10 : 0;
          return `<tr>
            <td class="strong">${App.esc(c.name)}</td>
            <td>${App.badge(c.type, 'blue')}</td>
            <td>${App.badge(c.target_stage, 'gray')}</td>
            <td>${App.esc(c.channel)}</td>
            <td class="num">¥${App.fmt.int(c.budget)}</td>
            <td class="num">${App.fmt.int(c.reach_count)}</td>
            <td class="num">${App.fmt.int(c.convert_count)} <span class="muted small">(${conv}%)</span></td>
            <td class="num">¥${App.fmt.int(c.revenue)}</td>
            <td class="num"><span class="badge ${roi >= 0 ? 'ok' : 'danger'}">${roi}%</span></td>
            <td class="small">${App.fmt.date(c.start_at)} ~ ${App.fmt.date(c.end_at)}</td>
            <td>${App.badge(c.status)}</td></tr>`;
        }).join('')}</tbody></table></div>`;
    }

    else if (s.tab === 'coupon') {
      const d = await App.api.get('/api/crm/coupons');
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>券码</th><th>客户</th><th>名称</th><th>类型</th><th>面值</th><th>门槛</th><th>有效期</th><th>状态</th></tr></thead>
        <tbody>${d.items.map(c => `<tr>
          <td class="small">${App.esc(c.code)}</td>
          <td>${App.esc(c.owner_name || '')}</td>
          <td>${App.esc(c.name)}</td>
          <td>${App.badge(c.coupon_type, 'gray')}</td>
          <td class="num strong">${c.coupon_type === '折扣' ? (Math.round(c.value * 100) / 10) + ' 折' : '¥' + c.value}</td>
          <td class="num">${c.min_spend > 0 ? '满 ¥' + c.min_spend : '无门槛'}</td>
          <td>${App.fmt.date(c.expire_at)}</td>
          <td>${App.badge(c.status)}</td></tr>`).join('')}</tbody></table></div>`;
    }

    else {
      const d = await App.api.get('/api/crm/followups?page=1&page_size=50');
      el.innerHTML = `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>计划时间</th><th>类型</th><th>客户</th><th>宠物</th><th>渠道</th><th>内容</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${d.items.map(f => `<tr>
          <td class="strong">${App.fmt.dtime(f.scheduled_at)}</td>
          <td>${App.badge(f.type, 'info')}</td>
          <td>${App.esc(f.owner_name || '')}</td>
          <td>${App.esc(f.pet_name || '-')}</td>
          <td>${App.esc(f.channel)}</td>
          <td class="small">${App.esc(f.content || '-')}</td>
          <td>${App.badge(f.status)}</td>
          <td>${f.status === '已完成' ? `<span class="small muted">${App.esc(f.result || '已完成')}</span>`
            : `<button class="btn btn-sm btn-primary" data-done="${f.id}">标记完成</button>`}</td>
        </tr>`).join('')}</tbody></table></div>`;
      el.querySelectorAll('[data-done]').forEach(b => {
        b.addEventListener('click', async () => {
          await App.form({
            title: '回访结果登记',
            fields: [
              { name: 'result', label: '回访结果', type: 'textarea', value: '恢复良好，已按医嘱用药。' },
              { name: 'operator', label: '执行人', value: 'admin' }
            ],
            onSubmit: async v => {
              await App.api.patch(`/api/crm/followups/${b.dataset.done}`, Object.assign({ status: '已完成' }, v));
              App.toast('回访已完成', 'ok');
              App.refresh();
            }
          });
        });
      });
    }
  },

  async newCampaign() {
    await App.form({
      title: '新建营销活动',
      columns: 2,
      fields: [
        { name: 'name', label: '活动名称', required: true, span: 2 },
        { name: 'type', label: '活动类型', type: 'select', value: '优惠券',
          options: ['优惠券', '短信触达', '微信推送', '套餐活动', '流失召回'] },
        { name: 'target_stage', label: '目标人群', type: 'select', value: '全部',
          options: ['全部', '潜客', '新客', '成长', '成熟', '沉默', '流失预警'] },
        { name: 'channel', label: '触达渠道', type: 'select', value: '微信', options: ['微信', '短信', '电话', '门店'] },
        { name: 'budget', label: '预算 (元)', type: 'number', value: 3000 },
        { name: 'start_at', label: '开始日期', type: 'date', value: new Date().toISOString().slice(0, 10) },
        { name: 'end_at', label: '结束日期', type: 'date' },
        { name: 'content', label: '活动内容', span: 2, type: 'textarea' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/crm/campaigns', v);
        App.toast('活动已创建', 'ok');
        App.refresh();
      }
    });
  },

  async newCard() {
    const owners = await App.api.get('/api/crm/customers?page=1&page_size=200');
    await App.form({
      title: '开通会员卡',
      columns: 2,
      fields: [
        { name: 'owner_id', label: '客户', type: 'select', required: true,
          options: owners.items.map(o => ({ value: o.id, label: `${o.name}（${o.phone}）` })) },
        { name: 'level', label: '卡等级', type: 'select', value: '银卡', options: ['银卡', '金卡', '钻石'] },
        { name: 'balance', label: '开卡充值', type: 'number', value: 500 },
        { name: 'discount', label: '折扣率（0.9=9折）', type: 'number', step: '0.01', value: 0.95 },
        { name: 'valid_until', label: '有效期至', type: 'date' }
      ],
      onSubmit: async v => {
        const card_no = 'MC' + Math.floor(Math.random() * 900000 + 100000);
        await App.api.post('/api/crm/cards', Object.assign({ card_no }, v));
        App.toast('会员卡已开通', 'ok');
        App.refresh();
      }
    });
  }
});
