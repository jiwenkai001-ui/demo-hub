/* 化验室 LIS：申请单、设备联机、结果直读与报告 */
App.register('lis', {
  title: '化验室 LIS',
  group: '医技中心',
  icon: 'lab',
  subtitle: '设备直读 · 检验数据管理',

  state: { tab: 'order', status: 'all', page: 1 },

  async render(root, arg) {
    const s = this.state;
    const st = await App.api.get('/api/lis/stats');
    root.innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="kpi"><div class="k-label">在线设备</div>
          <div class="k-value">${st.device_online}<span class="k-unit">/${st.device_total} 台</span></div>
          <div class="k-foot">支持 ASTM / HL7 / 串口 / 文件导入</div></div>
        <div class="kpi blue"><div class="k-label">今日检验</div>
          <div class="k-value">${st.order_today}<span class="k-unit">单</span></div>
          <div class="k-foot">累计结果 ${App.fmt.int(st.result_total)} 项</div></div>
        <div class="kpi warn"><div class="k-label">待处理</div>
          <div class="k-value">${st.order_pending}<span class="k-unit">单</span></div>
          <div class="k-foot">已开单 / 采样 / 检测中</div></div>
        <div class="kpi danger"><div class="k-label">危急值</div>
          <div class="k-value">${st.critical}<span class="k-unit">项</span></div>
          <div class="k-foot">需医生及时处置</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="tabs" style="border:none;margin:0">
            <div class="tab ${s.tab === 'order' ? 'active' : ''}" data-tab="order">检验申请单</div>
            <div class="tab ${s.tab === 'device' ? 'active' : ''}" data-tab="device">化验设备</div>
            <div class="tab ${s.tab === 'item' ? 'active' : ''}" data-tab="item">检验项目库</div>
            <div class="tab ${s.tab === 'log' ? 'active' : ''}" data-tab="log">设备通讯日志</div>
          </div>
          <div class="right">
            ${s.tab === 'order' ? `<button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 开化验单</button>` : ''}
            ${s.tab === 'device' ? `<button class="btn btn-blue btn-sm" id="btn-push">${App.icon('refresh')} 接收设备数据</button>` : ''}
          </div>
        </div>
        <div id="tabbar"></div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { s.tab = t.dataset.tab; s.page = 1; App.refresh(); });
    });
    const bn = root.querySelector('#btn-new');
    if (bn) bn.addEventListener('click', () => this.newOrder());
    const bp = root.querySelector('#btn-push');
    if (bp) bp.addEventListener('click', () => this.pushData());

    if (arg) { this.openOrder(Number(arg)); }
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const listEl = root.querySelector('#list');
    const tabbar = root.querySelector('#tabbar');
    const pagerEl = root.querySelector('#pager');

    if (s.tab === 'order') {
      tabbar.innerHTML = `<div class="toolbar">
        <select id="status"><option value="all">全部状态</option>
          ${['已开单', '已采样', '检测中', '已完成', '已审核', '已作废'].map(x =>
            `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}
        </select>
        <input id="kw" placeholder="宠物 / 主人 / 单号">
        <button class="btn btn-sm" id="search">${App.icon('search')} 查询</button></div>`;
      const kw = tabbar.querySelector('#kw');
      tabbar.querySelector('#search').addEventListener('click', () => { s.page = 1; this.doSearch(root, kw.value); });
      kw.addEventListener('keydown', e => { if (e.key === 'Enter') tabbar.querySelector('#search').click(); });
      tabbar.querySelector('#status').addEventListener('change', e => { s.status = e.target.value; s.page = 1; App.refresh(); });

      const data = await App.api.get(`/api/lis/orders?status=${s.status}&page=${s.page}&page_size=20`);
      const cols = [
        { label: '单号', key: 'order_no', render: r => `<div class="strong">${App.esc(r.order_no)}</div>
           <div class="muted small">${App.fmt.dtime(r.ordered_at)}</div>` },
        { label: '宠物', key: 'pet_name', render: r => `<div class="strong">${App.esc(r.pet_name)}</div>
           <div class="muted small">${App.esc(r.owner_name || '')}</div>` },
        { label: '项目组', key: 'panel', render: r => App.badge(r.panel, 'info') },
        { label: '设备', key: 'device_name', render: r => App.esc(r.device_name || '-') },
        { label: '样本', key: 'sample_type', render: r => App.esc(r.sample_type || '-') },
        { label: '优先', key: 'priority', render: r => App.badge(r.priority, r.priority === '急诊' ? 'danger' : 'gray') },
        { label: '结果', key: 'result_count', render: r => `${r.result_count} 项` },
        { label: '状态', key: 'status', render: r => App.badge(r.status) },
        { label: '操作', key: 'id', render: r => `<button class="btn btn-sm" data-act="sim" data-id="${r.id}">设备回传</button>` }
      ];
      listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无检验申请单' });
      listEl.querySelectorAll('[data-act="sim"]').forEach(b => {
        b.addEventListener('click', async e => {
          e.stopPropagation();
          const r = await App.api.post(`/api/lis/orders/${b.dataset.id}/simulate`);
          App.toast(r.message || '设备数据已接收', r.ok ? 'ok' : 'err');
          App.refresh();
        });
      });
      App.bindTable(listEl, { rows: data.items, onRow: r => this.openOrder(r.id) });
      pagerEl.innerHTML = App.pager(data.meta, p => { s.page = p; App.refresh(); });
      App.bindPager(pagerEl, p => { s.page = p; App.refresh(); });
    }

    else if (s.tab === 'device') {
      tabbar.innerHTML = '';
      const d = await App.api.get('/api/lis/devices');
      listEl.innerHTML = `<div class="card-body"><div class="grid g3">${d.items.map(x => `
        <div class="card" style="box-shadow:none">
          <div class="card-head">
            <span class="dot ${x.status === '在线' ? 'ok' : (x.status === '维护中' ? 'warn' : 'off')}"></span>
            <h3>${App.esc(x.name)}</h3>
            <div class="right">${App.badge(x.status)}</div>
          </div>
          <div class="card-body">
            <dl class="desc">
              <dt>型号</dt><dd>${App.esc(x.model || '-')}</dd>
              <dt>厂商</dt><dd>${App.esc(x.manufacturer || '-')}</dd>
              <dt>类型</dt><dd>${App.esc(x.category)}</dd>
              <dt>协议</dt><dd>${App.badge(x.protocol, 'blue')}</dd>
              <dt>地址</dt><dd class="small">${App.esc(x.host || '-')}${x.port ? ':' + x.port : ''}</dd>
              <dt>最近同步</dt><dd class="small">${App.fmt.dtime(x.last_sync_at)}</dd>
            </dl>
            <div style="display:flex;gap:8px;margin-top:12px">
              <button class="btn btn-sm" data-test="${x.id}">${App.icon('refresh')} 联机测试</button>
            </div>
          </div>
        </div>`).join('')}</div></div>`;
      listEl.querySelectorAll('[data-test]').forEach(b => {
        b.addEventListener('click', async () => {
          const r = await App.api.post(`/api/lis/devices/${b.dataset.test}/test`);
          App.toast(r.message, r.ok ? 'ok' : 'warn');
        });
      });
      pagerEl.innerHTML = '';
    }

    else if (s.tab === 'item') {
      tabbar.innerHTML = '';
      const d = await App.api.get('/api/lis/items');
      const cols = [
        { label: '代码', key: 'code', render: r => `<span class="badge gray">${App.esc(r.code)}</span>` },
        { label: '项目名称', key: 'name', render: r => App.esc(r.name) },
        { label: '项目组', key: 'panel', render: r => App.badge(r.panel, 'info') },
        { label: '单位', key: 'unit', render: r => App.esc(r.unit || '-') },
        { label: '参考区间', key: 'ref_low', render: r => App.esc(r.ref_text || '-') },
        { label: '价格', key: 'price', align: 'right', render: r => `¥${App.fmt.money(r.price)}` },
        { label: '默认设备', key: 'device_name', render: r => App.esc(r.device_name || '-') }
      ];
      listEl.innerHTML = App.table({ columns: cols, rows: d.items, empty: '暂无项目' });
      pagerEl.innerHTML = '';
    }

    else {
      tabbar.innerHTML = '';
      const d = await App.api.get('/api/lis/logs?limit=40');
      const cols = [
        { label: '时间', key: 'created_at', render: r => App.fmt.dtime(r.created_at) },
        { label: '设备', key: 'device_name', render: r => App.esc(r.device_name || '-') },
        { label: '方向', key: 'direction', render: r => App.badge(r.direction === 'IN' ? '接收' : '下发', r.direction === 'IN' ? 'ok' : 'blue') },
        { label: '协议', key: 'protocol', render: r => App.badge(r.protocol, 'gray') },
        { label: '解析项数', key: 'parsed', render: r => `${r.parsed} 项` },
        { label: '说明', key: 'message', render: r => `<span class="small">${App.esc(r.message || '-')}</span>` }
      ];
      listEl.innerHTML = App.table({ columns: cols, rows: d.items, empty: '暂无通讯日志' });
      pagerEl.innerHTML = '';
    }
  },

  async doSearch(root, kw) {
    const data = await App.api.get(`/api/lis/orders?keyword=${encodeURIComponent(kw)}&page=1&page_size=20`);
    const listEl = root.querySelector('#list');
    const cols = [
      { label: '单号', key: 'order_no', render: r => App.esc(r.order_no) },
      { label: '宠物', key: 'pet_name', render: r => App.esc(r.pet_name) },
      { label: '项目组', key: 'panel', render: r => App.badge(r.panel, 'info') },
      { label: '状态', key: 'status', render: r => App.badge(r.status) }
    ];
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '未找到匹配记录' });
    App.bindTable(listEl, { rows: data.items, onRow: r => this.openOrder(r.id) });
  },

  async newOrder() {
    const [pets, doctors] = await Promise.all([
      App.api.get('/api/emr/pets?page=1&page_size=200'),
      App.api.get('/api/emr/staff?role=医生')
    ]);
    const panels = await App.api.get('/api/lis/panels');
    await App.form({
      title: '开具化验申请单',
      columns: 2,
      fields: [
        { name: 'pet_id', label: '宠物', type: 'select', required: true,
          options: pets.items.map(p => ({ value: p.id, label: `${p.name} · ${p.species} · ${p.owner_name}` })) },
        { name: 'panel', label: '检验项目组', type: 'select',
          options: panels.items.map(p => ({ value: p.panel, label: `${p.panel}（${p.count} 项）` })) },
        { name: 'doctor_id', label: '开单医生', type: 'select',
          options: doctors.items.map(d => ({ value: d.id, label: d.name })) },
        { name: 'sample_type', label: '样本类型', type: 'select', value: '全血',
          options: ['全血', '血清', '血浆', '尿液', '粪便', '分泌物'] },
        { name: 'priority', label: '优先级', type: 'select', value: '常规', options: ['常规', '急诊'] },
        { name: 'note', label: '备注', span: 2, type: 'textarea' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/lis/orders', v);
        App.toast('化验单已开具', 'ok');
        App.refresh();
      }
    });
  },

  async openOrder(id) {
    const o = await App.api.get(`/api/lis/orders/${id}`);
    const modal = App.modal({
      title: `检验报告 · ${o.order_no}`,
      width: 'wide',
      body: `
      <div class="grid g2" style="margin-bottom:14px">
        <div class="card"><div class="card-body">
          <dl class="desc">
            <dt>宠物</dt><dd class="strong">${App.esc(o.pet ? o.pet.name : '')}（${App.esc(o.pet ? o.pet.species : '')}）</dd>
            <dt>主人</dt><dd>${App.esc(o.owner ? o.owner.name : '-')}</dd>
            <dt>项目组</dt><dd>${App.badge(o.panel, 'info')}</dd>
            <dt>样本</dt><dd>${App.esc(o.sample_type || '-')}</dd>
            <dt>设备</dt><dd>${App.esc(o.device ? o.device.name : '-')} ${o.device ? App.badge(o.device.protocol, 'blue') : ''}</dd>
            <dt>开单</dt><dd>${App.fmt.dtime(o.ordered_at)}</dd>
            <dt>报告</dt><dd>${App.fmt.dtime(o.reported_at)}</dd>
          </dl>
        </div></div>
        <div class="card"><div class="card-body" style="text-align:center">
          <div class="muted small">状态</div>
          <div style="margin:8px 0">${App.badge(o.status)}</div>
          <div class="muted small">异常项 ${(o.abnormal || []).length} / 共 ${(o.results || []).length} 项</div>
        </div></div>
      </div>

      ${(o.abnormal || []).length ? `<div class="card" style="margin-bottom:14px">
        <div class="card-head"><h3 style="color:var(--danger)">${App.icon('alert')} 异常项提示</h3></div>
        <div class="card-body flush">
          ${(o.abnormal || []).map(r => `<div class="list-item">
            <span class="badge ${r.flag === '危急' ? 'danger' : 'warn'}">${App.esc(r.flag)}</span>
            <div class="grow"><div class="lt">${App.esc(r.item_name)}</div>
              <div class="ls">参考 ${App.esc(r.ref_text || '-')}</div></div>
            <strong>${App.esc(r.value)} ${App.esc(r.unit || '')}</strong></div>`).join('')}
        </div></div>` : ''}

      <div class="card">
        <div class="card-head"><h3>检验结果明细</h3>
          <span class="sub">${App.esc(o.results.length ? '来源：' + o.results[0].source : '')}</span></div>
        <div class="card-body">
          ${(o.results || []).length ? `<div class="res-grid">${o.results.map(r => `
            <div class="res-item ${r.flag === '危急' ? 'crit' : (r.flag !== '正常' ? 'abn' : '')}">
              <div><div class="rn">${App.esc(r.item_name)}</div>
                <div class="ru">参考 ${App.esc(r.ref_text || '-')}</div></div>
              <div style="text-align:right">
                <div class="rv">${App.esc(r.value)} <span class="ru">${App.esc(r.unit || '')}</span></div>
                ${App.flagBadge(r.flag)}
              </div>
            </div>`).join('')}</div>` : '<div class="empty">暂无结果，可执行设备回传或手动录入</div>'}
        </div>
      </div>`,
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn" id="manual">${App.icon('edit')} 手动录入</button>
        <button class="btn btn-blue" id="sim">${App.icon('refresh')} 模拟设备回传</button>
        <button class="btn btn-primary" id="audit">审核通过</button>`
    });
    const foot = modal.body.parentElement.querySelector('.modal-foot');
    foot.querySelector('#sim').addEventListener('click', async () => {
      const r = await App.api.post(`/api/lis/orders/${id}/simulate`);
      App.toast(r.message, r.ok ? 'ok' : 'err');
      modal.close(); this.openOrder(id); App.refresh();
    });
    foot.querySelector('#manual').addEventListener('click', async () => {
      const items = await App.api.get(`/api/lis/items?panel=${encodeURIComponent(o.panel)}`);
      await App.form({
        title: '手动录入 / 修正结果',
        tip: '危急值将自动标记，便于医生及时处置',
        fields: [
          { name: 'item_id', label: '检验项目', type: 'select',
            options: items.items.map(i => ({ value: i.id, label: `${i.name}（${i.code}）参考 ${i.ref_text}` })) },
          { name: 'value', label: '结果值', required: true, placeholder: '数值或定性结果，如 12.3 / 阴性' }
        ],
        onSubmit: async v => {
          await App.api.post(`/api/lis/orders/${id}/results`, v);
          App.toast('结果已录入', 'ok');
          modal.close(); this.openOrder(id);
        }
      });
    });
    foot.querySelector('#audit').addEventListener('click', async () => {
      await App.api.patch(`/api/lis/orders/${id}/status`, { status: '已审核' });
      App.toast('报告已审核', 'ok');
      modal.close(); App.refresh();
    });
  },

  async pushData() {
    const dev = await App.api.get('/api/lis/devices');
    const orders = await App.api.get('/api/lis/orders?status=检测中&page=1&page_size=50');
    const all = await App.api.get('/api/lis/orders?status=all&page=1&page_size=50');
    const pool = (orders.items.length ? orders.items : all.items).slice(0, 40);
    await App.form({
      title: '接收化验设备数据',
      width: 'wide',
      tip: '粘贴仪器回传的原始数据（ASTM E1381 / HL7 OBX / JSON），系统自动解析并入库到对应申请单',
      fields: [
        { name: 'device_id', label: '来源设备', type: 'select',
          options: dev.items.map(d => ({ value: d.id, label: `${d.name}（${d.protocol}）` })) },
        { name: 'order_id', label: '目标申请单', type: 'select',
          options: pool.map(o => ({ value: o.id, label: `${o.order_no} · ${o.pet_name} · ${o.panel}` })) },
        { name: 'payload', label: '原始数据', type: 'textarea', required: true,
          value: 'R|1|^^^WBC^1|18.6|10^9/L|5.5^19.5|H||F\nR|2|^^^HGB^1|96|g/L|120^180|L||F\nR|3|^^^PLT^1|420|10^9/L|200^500|N||F' }
      ],
      onSubmit: async v => {
        const r = await App.api.post('/api/lis/device/push', v);
        App.toast(r.message || '已接收', r.ok ? 'ok' : 'err');
        App.refresh();
      }
    });
  }
});
