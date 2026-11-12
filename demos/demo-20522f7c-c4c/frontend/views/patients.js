/* 客户与宠物档案管理（CRM 基础档案 + EMR 档案库） */
App.register('patients', {
  title: '客户与宠物档案',
  group: '诊疗中心',
  icon: 'users',
  subtitle: '主人 / 宠物 / 会员 / 健康档案',

  state: { tab: 'owner', page: 1, kw: '', stage: 'all', species: 'all' },

  async render(root) {
    const s = this.state;
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <div class="tabs" style="border:none;margin:0">
            <div class="tab ${s.tab === 'owner' ? 'active' : ''}" data-tab="owner">客户档案</div>
            <div class="tab ${s.tab === 'pet' ? 'active' : ''}" data-tab="pet">宠物档案</div>
          </div>
          <div class="right">
            <button class="btn btn-primary btn-sm" id="btn-new">
              ${App.icon('plus')} ${s.tab === 'owner' ? '新建客户' : '新建宠物'}
            </button>
          </div>
        </div>
        <div class="toolbar">
          <input id="kw" placeholder="${s.tab === 'owner' ? '搜索姓名 / 手机号' : '搜索宠物名 / 主人 / 电话'}" value="${App.esc(s.kw)}">
          ${s.tab === 'owner' ? `
            <select id="stage">
              <option value="all">全部生命周期</option>
              ${['潜客', '新客', '成长', '成熟', '沉默', '流失预警'].map(x =>
                `<option value="${x}" ${s.stage === x ? 'selected' : ''}>${x}</option>`).join('')}
            </select>` : `
            <select id="species">
              <option value="all">全部种类</option>
              ${['犬', '猫', '异宠'].map(x => `<option value="${x}" ${s.species === x ? 'selected' : ''}>${x}</option>`).join('')}
            </select>`}
          <button class="btn btn-sm" id="btn-search">${App.icon('search')} 查询</button>
          <span class="grow"></span>
          <span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        s.tab = t.dataset.tab; s.page = 1;
        App.refresh();
      });
    });
    root.querySelector('#btn-new').addEventListener('click', () => {
      s.tab === 'owner' ? this.newOwner() : this.newPet();
    });
    root.querySelector('#btn-search').addEventListener('click', () => {
      s.kw = root.querySelector('#kw').value.trim();
      const st = root.querySelector('#stage'), sp = root.querySelector('#species');
      if (st) s.stage = st.value;
      if (sp) s.species = sp.value;
      s.page = 1; App.refresh();
    });
    root.querySelector('#kw').addEventListener('keydown', e => {
      if (e.key === 'Enter') root.querySelector('#btn-search').click();
    });

    await this.loadList(root);
  },

  async loadList(root) {
    const s = this.state;
    let data;
    if (s.tab === 'owner') {
      data = await App.api.get(`/api/crm/customers?keyword=${encodeURIComponent(s.kw)}&stage=${s.stage}&page=${s.page}&page_size=15`);
      const cols = [
        { label: '客户', key: 'name', render: r => `<div class="strong">${App.esc(r.name)}</div>
           <div class="muted small">${App.esc(r.phone)}</div>` },
        { label: '会员等级', key: 'member_level', render: r => App.badge(r.member_level, r.member_level === '钻石' ? 'violet' : (r.member_level === '金卡' ? 'warn' : 'gray')) },
        { label: '生命周期', key: 'life_stage', render: r => App.badge(r.life_stage, r.life_stage === '流失预警' ? 'danger' : (r.life_stage === '成熟' ? 'ok' : 'info')) },
        { label: '宠物', key: 'pet_count', render: r => `${r.pet_count} 只` },
        { label: '累计消费', key: 'total_spend', align: 'right', render: r => `<strong>¥${App.fmt.money(r.total_spend)}</strong>` },
        { label: '到店次数', key: 'real_visit_count', align: 'right', render: r => `${r.real_visit_count} 次` },
        { label: '来源', key: 'source_channel', render: r => App.badge(r.source_channel, r.source_channel === '小程序' ? 'primary' : 'gray') },
        { label: '最近到店', key: 'last_visit_at', render: r => `<span class="small">${App.fmt.date(r.last_visit_at)}</span>` },
        { label: '待回访', key: 'pending_followup', render: r => r.pending_followup ? `<span class="badge warn">${r.pending_followup}</span>` : '<span class="muted">-</span>' }
      ];
      root.querySelector('#list').innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无客户' });
      App.bindTable(root.querySelector('#list'), {
        rows: data.items,
        onRow: r => this.ownerDetail(r.id)
      });
    } else {
      data = await App.api.get(`/api/emr/pets?keyword=${encodeURIComponent(s.kw)}&species=${s.species}&page=${s.page}&page_size=15`);
      const cols = [
        { label: '宠物', key: 'name', render: r => `<div class="strong">${App.esc(r.name)}</div>
           <div class="muted small">${App.esc(r.breed || '')}</div>` },
        { label: '种类', key: 'species', render: r => App.badge(r.species, r.species === '犬' ? 'warn' : (r.species === '猫' ? 'info' : 'gray')) },
        { label: '性别 / 生日', key: 'gender', render: r => `${App.esc(r.gender || '-')}<div class="muted small">${App.fmt.date(r.birth_date)}</div>` },
        { label: '体重', key: 'weight', align: 'right', render: r => r.weight ? `${r.weight} kg` : '-' },
        { label: '主人', key: 'owner_name', render: r => `<div>${App.esc(r.owner_name || '')}</div><div class="muted small">${App.esc(r.owner_phone || '')}</div>` },
        { label: '过敏史', key: 'allergies', render: r => r.allergies ? `<span class="badge danger">${App.esc(r.allergies)}</span>` : '<span class="muted">无</span>' },
        { label: '就诊次数', key: 'visit_count', align: 'right', render: r => `${r.visit_count} 次` },
        { label: '最近就诊', key: 'last_visit_at', render: r => `<span class="small">${App.fmt.date(r.last_visit_at)}</span>` }
      ];
      root.querySelector('#list').innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无宠物' });
      App.bindTable(root.querySelector('#list'), {
        rows: data.items,
        onRow: r => this.petDetail(r.id)
      });
    }
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async newOwner() {
    await App.form({
      title: '新建客户档案',
      columns: 2,
      fields: [
        { name: 'name', label: '客户姓名', required: true, placeholder: '如：陈曦' },
        { name: 'phone', label: '手机号', required: true, placeholder: '11 位手机号' },
        { name: 'gender', label: '性别', type: 'select', options: ['未知', '男', '女'] },
        { name: 'member_level', label: '会员等级', type: 'select', value: '普通客户', options: ['普通客户', '银卡', '金卡', '钻石'] },
        { name: 'life_stage', label: '生命周期', type: 'select', value: '新客', options: ['潜客', '新客', '成长', '成熟', '沉默', '流失预警'] },
        { name: 'source_channel', label: '来源渠道', type: 'select', value: '自然到店', options: ['小程序', '美团', '转介绍', '自然到店', '地推'] },
        { name: 'wechat', label: '微信号' },
        { name: 'address', label: '联系地址' },
        { name: 'tags', label: '客户标签', span: 2, placeholder: '逗号分隔，如：多宠家庭,重视疫苗' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/emr/owners', v);
        App.toast('客户档案已创建', 'ok');
        App.refresh();
      }
    });
  },

  async newPet() {
    const owners = await App.api.get('/api/emr/owners?page=1&page_size=100');
    await App.form({
      title: '新建宠物档案',
      columns: 2,
      fields: [
        { name: 'owner_id', label: '主人', type: 'select', required: true, options: owners.items.map(o => ({ value: o.id, label: `${o.name}（${o.phone}）` })) },
        { name: 'name', label: '宠物名', required: true },
        { name: 'species', label: '种类', type: 'select', value: '犬', options: ['犬', '猫', '异宠'] },
        { name: 'breed', label: '品种', placeholder: '如：金毛寻回犬' },
        { name: 'gender', label: '性别', type: 'select', options: ['未知', '公', '母', '公(已去势)', '母(已绝育)'] },
        { name: 'birth_date', label: '生日', type: 'date' },
        { name: 'weight', label: '体重 (kg)', type: 'number', step: '0.1' },
        { name: 'color', label: '毛色' },
        { name: 'chip_no', label: '芯片号' },
        { name: 'blood_type', label: '血型' },
        { name: 'allergies', label: '过敏史', span: 2, placeholder: '如：青霉素过敏' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/emr/pets', v);
        App.toast('宠物档案已创建', 'ok');
        this.state.tab = 'pet';
        App.refresh();
      }
    });
  },

  async ownerDetail(id) {
    const o = await App.api.get(`/api/crm/customers/${id}`);
    const m = App.modal({
      title: `客户档案 · ${o.name}`,
      width: 'wide',
      body: `
      <div class="grid g2">
        <div class="card"><div class="card-head"><h3>基本信息</h3></div><div class="card-body">
          <dl class="desc">
            <dt>姓名</dt><dd>${App.esc(o.name)}</dd>
            <dt>手机号</dt><dd>${App.esc(o.phone)}</dd>
            <dt>会员等级</dt><dd>${App.badge(o.member_level)}</dd>
            <dt>生命周期</dt><dd>${App.badge(o.life_stage)}</dd>
            <dt>来源渠道</dt><dd>${App.badge(o.source_channel)}</dd>
            <dt>积分</dt><dd>${App.fmt.int(o.points)}</dd>
            <dt>累计消费</dt><dd><strong>¥${App.fmt.money(o.total_spend)}</strong></dd>
            <dt>到店次数</dt><dd>${o.visit_count} 次</dd>
            <dt>最近到店</dt><dd>${App.fmt.date(o.last_visit_at)}</dd>
            <dt>地址</dt><dd>${App.esc(o.address || '-')}</dd>
            <dt>标签</dt><dd>${o.tags ? App.esc(o.tags).split(',').map(t => `<span class="badge teal">${App.esc(t)}</span>`).join(' ') : '-'}</dd>
          </dl>
        </div></div>
        <div class="card"><div class="card-head"><h3>会员卡</h3></div><div class="card-body">
          ${(o.cards || []).length ? (o.cards || []).map(c => `
            <div class="res-item" style="margin-bottom:9px">
              <div><div class="strong">${App.badge(c.level, c.level === '钻石' ? 'violet' : 'warn')}</div>
                <div class="muted small">${App.esc(c.card_no)} · ${Math.round(c.discount * 100) / 10} 折</div></div>
              <div style="text-align:right"><div class="rv">¥${App.fmt.money(c.balance)}</div>
                <div class="ru">积分 ${c.points}</div></div>
            </div>`).join('') : '<div class="muted">暂无会员卡</div>'}
          <div class="section-title">优惠券 ${(o.coupons || []).length} 张</div>
          ${(o.coupons || []).slice(0, 5).map(c => `
            <div class="list-item" style="padding:7px 0">
              <div class="grow"><div>${App.esc(c.name)}</div>
                <div class="ls">${c.coupon_type === '折扣' ? (Math.round(c.value * 100) / 10) + ' 折' : '¥' + c.value}
                  ${c.min_spend > 0 ? ' · 满 ' + c.min_spend + ' 可用' : ''} · 至 ${App.fmt.date(c.expire_at)}</div></div>
              ${App.badge(c.status)}
            </div>`).join('') || '<div class="muted small">暂无优惠券</div>'}
        </div></div>
      </div>

      <div class="card" style="margin-top:14px"><div class="card-head"><h3>宠物 (${(o.pets || []).length})</h3></div>
        <div class="card-body flush">
          ${(o.pets || []).length ? (o.pets || []).map(p => `
            <div class="list-item">
              <span class="badge ${p.species === '犬' ? 'warn' : 'info'}">${App.esc(p.species)}</span>
              <div class="grow"><div class="lt">${App.esc(p.name)} · ${App.esc(p.breed || '')}</div>
                <div class="ls">${App.esc(p.gender)} · ${App.esc(p.birth_date || '')} · ${p.weight ? p.weight + 'kg' : ''}</div></div>
              ${p.allergies ? `<span class="badge danger">${App.esc(p.allergies)}</span>` : ''}
              <span class="muted small">${App.fmt.date(p.created_at)} 建档</span>
            </div>`).join('') : '<div class="empty">尚未建档宠物</div>'}
        </div>
      </div>

      <div class="grid g2" style="margin-top:14px">
        <div class="card"><div class="card-head"><h3>就诊记录</h3></div><div class="card-body flush">
          ${(o.visits || []).length ? (o.visits || []).slice(0, 8).map(v => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(v.pet_name || '')} · ${App.esc(v.diagnosis || v.chief_complaint || '待完善')}</div>
                <div class="ls">${App.fmt.dtime(v.visited_at)} · ${App.esc(v.doctor_name || '')}</div></div>
              ${App.badge(v.status)}
            </div>`).join('') : '<div class="empty">暂无就诊</div>'}
        </div></div>
        <div class="card"><div class="card-head"><h3>消费账单</h3></div><div class="card-body flush">
          ${(o.invoices || []).length ? (o.invoices || []).slice(0, 8).map(i => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(i.invoice_no)}</div>
                <div class="ls">${App.fmt.dtime(i.created_at)} · ${App.esc(i.pay_method || '未支付')}</div></div>
              <strong>¥${App.fmt.money(i.payable)}</strong>
              ${App.badge(i.status)}
            </div>`).join('') : '<div class="empty">暂无账单</div>'}
        </div></div>
      </div>`,
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn btn-blue" id="add-follow">${App.icon('phone')} 新建回访</button>
        <button class="btn btn-primary" id="add-pet">为TA建档宠物</button>`
    });
    m.body.parentElement.querySelector('#add-pet').addEventListener('click', () => { m.close(); this.newPet(); });
    m.body.parentElement.querySelector('#add-follow').addEventListener('click', async () => {
      await App.form({
        title: '新建回访任务',
        fields: [
          { name: 'type', label: '回访类型', type: 'select', options: ['术后回访', '疫苗提醒', '驱虫提醒', '生日关怀', '流失召回', '体检提醒'] },
          { name: 'scheduled_at', label: '计划时间', type: 'datetime', value: new Date().toISOString().slice(0, 16).replace('T', ' ') },
          { name: 'channel', label: '触达方式', type: 'select', options: ['微信', '电话', '短信'] },
          { name: 'content', label: '回访内容', type: 'textarea' }
        ],
        onSubmit: async v => {
          await App.api.post('/api/crm/followups', Object.assign({ owner_id: id }, v));
          App.toast('回访任务已创建', 'ok');
        }
      });
    });
  },

  async petDetail(id) {
    const p = await App.api.get(`/api/emr/pets/${id}`);
    App.modal({
      title: `宠物档案 · ${p.name}`,
      width: 'wide',
      body: `
      <div class="grid g2">
        <div class="card"><div class="card-head"><h3>档案信息</h3></div><div class="card-body">
          <dl class="desc">
            <dt>名字</dt><dd class="strong">${App.esc(p.name)}</dd>
            <dt>种类 / 品种</dt><dd>${App.esc(p.species)} · ${App.esc(p.breed || '-')}</dd>
            <dt>性别</dt><dd>${App.esc(p.gender)} ${p.sterilized ? '<span class="badge ok">已绝育</span>' : ''}</dd>
            <dt>生日</dt><dd>${App.fmt.date(p.birth_date)}</dd>
            <dt>体重</dt><dd>${p.weight ? p.weight + ' kg' : '-'}</dd>
            <dt>毛色</dt><dd>${App.esc(p.color || '-')}</dd>
            <dt>芯片号</dt><dd>${App.esc(p.chip_no || '-')}</dd>
            <dt>血型</dt><dd>${App.esc(p.blood_type || '-')}</dd>
            <dt>过敏史</dt><dd>${p.allergies ? `<span class="badge danger">${App.esc(p.allergies)}</span>` : '无'}</dd>
            <dt>主人</dt><dd>${App.esc(p.owner ? p.owner.name : '-')} ${App.esc(p.owner ? p.owner.phone : '')}</dd>
          </dl>
        </div></div>
        <div class="card"><div class="card-head"><h3>免疫 / 驱虫记录</h3></div><div class="card-body flush">
          ${(p.vaccinations || []).length ? (p.vaccinations || []).map(v => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(v.name)}</div>
                <div class="ls">${App.fmt.date(v.injected_at)} · ${App.esc(v.batch_no || '')} · ${App.esc(v.doctor || '')}</div></div>
              ${v.next_due_at ? `<span class="badge info">下次 ${App.fmt.date(v.next_due_at)}</span>` : ''}
            </div>`).join('') : '<div class="empty">暂无免疫记录</div>'}
        </div></div>
      </div>

      <div class="card" style="margin-top:14px"><div class="card-head"><h3>就诊病历 (${(p.visits || []).length})</h3></div>
        <div class="card-body flush">
          ${(p.visits || []).length ? (p.visits || []).map(v => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(v.diagnosis || v.chief_complaint || '待完善')}</div>
                <div class="ls">${App.fmt.dtime(v.visited_at)} · ${App.esc(v.dept)} · ${App.esc(v.doctor_name || '')}</div></div>
              ${App.badge(v.status)}
            </div>`).join('') : '<div class="empty">暂无就诊记录</div>'}
        </div>
      </div>

      <div class="card" style="margin-top:14px"><div class="card-head"><h3>影像资料 (${(p.imaging || []).length})</h3></div>
        <div class="card-body flush">
          ${(p.imaging || []).length ? (p.imaging || []).map(s => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(s.modality)} · ${App.esc(s.body_part)}</div>
                <div class="ls">${App.fmt.dtime(s.performed_at)} · ${s.image_count} 幅</div></div>
              <span class="muted small">${App.esc(s.impression || '待出报告')}</span>
            </div>`).join('') : '<div class="empty">暂无影像</div>'}
        </div>
      </div>`
    });
  }
});
