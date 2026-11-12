/* 预约登记：预约管理、到店接诊 */
App.register('appointments', {
  title: '预约登记',
  group: '诊疗中心',
  icon: 'calendar',
  subtitle: '预约 → 到店 → 接诊',

  state: { date: '', status: 'all', source: 'all', page: 1 },

  async render(root) {
    const s = this.state;
    if (s.date === '') s.date = new Date().toISOString().slice(0, 10);
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>预约列表</h3>
          <span class="sub">预约到店后可直接生成就诊病历</span>
          <div class="right">
            <button class="btn btn-sm" id="btn-today">今天</button>
            <button class="btn btn-sm" id="btn-all">全部</button>
            <button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 新建预约</button>
          </div>
        </div>
        <div class="toolbar">
          <input type="date" id="date" value="${s.date}">
          <select id="status">
            <option value="all">全部状态</option>
            ${['待到店', '已到店', '诊疗中', '已完成', '已取消', '爽约'].map(x =>
              `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
          <select id="source">
            <option value="all">全部来源</option>
            ${['小程序', '电话', '门店', '微信'].map(x =>
              `<option value="${x}" ${s.source === x ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
          <button class="btn btn-sm" id="btn-search">${App.icon('search')} 查询</button>
          <span class="grow"></span>
          <span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelector('#btn-new').addEventListener('click', () => this.newAppt());
    root.querySelector('#btn-today').addEventListener('click', () => {
      s.date = new Date().toISOString().slice(0, 10); s.page = 1; App.refresh();
    });
    root.querySelector('#btn-all').addEventListener('click', () => {
      s.date = ''; s.page = 1; App.refresh();
    });
    root.querySelector('#btn-search').addEventListener('click', () => {
      s.date = root.querySelector('#date').value;
      s.status = root.querySelector('#status').value;
      s.source = root.querySelector('#source').value;
      s.page = 1; App.refresh();
    });

    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const qs = `date=${s.date}&status=${s.status}&source=${s.source}&page=${s.page}&page_size=30`;
    const data = await App.api.get('/api/emr/appointments?' + qs);
    const cols = [
      { label: '预约时间', key: 'scheduled_at', render: r => `<div class="strong">${App.fmt.time(r.scheduled_at)}</div>
         <div class="muted small">${App.fmt.date(r.scheduled_at)}</div>` },
      { label: '宠物', key: 'pet_name', render: r => `<div class="strong">${App.esc(r.pet_name)}</div>
         <div class="muted small">${App.esc(r.species || '')}</div>` },
      { label: '主人', key: 'owner_name', render: r => `<div>${App.esc(r.owner_name || '')}</div>
         <div class="muted small">${App.esc(r.owner_phone || '')}</div>` },
      { label: '类型', key: 'appt_type', render: r => App.badge(r.appt_type, 'info') },
      { label: '医生', key: 'doctor_name', render: r => App.esc(r.doctor_name || '待分配') },
      { label: '来源', key: 'source', render: r => App.badge(r.source, r.source === '小程序' ? 'primary' : 'gray') },
      { label: '状态', key: 'status', render: r => App.badge(r.status) },
      { label: '备注', key: 'note', render: r => `<span class="small muted">${App.esc(r.note || '-')}</span>` },
      { label: '操作', key: 'id', render: r => `
         <button class="btn btn-sm ${r.status === '待到店' ? 'btn-primary' : ''}" data-act="checkin" data-id="${r.id}"
           ${['已完成', '已取消', '爽约'].includes(r.status) ? 'disabled' : ''}>接诊</button>` }
    ];
    const listEl = root.querySelector('#list');
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '该条件下暂无预约' });
    listEl.querySelectorAll('[data-act="checkin"]').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        const r = await App.api.post(`/api/emr/appointments/${b.dataset.id}/checkin`);
        App.toast(r.created ? '已接诊，病历已生成' : '该预约已有病历', 'ok');
        App.go('visits', r.visit.id);
      });
    });
    App.bindTable(listEl, { rows: data.items, onRow: r => this.detail(r.id) });
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async newAppt() {
    const [owners, pets, doctors] = await Promise.all([
      App.api.get('/api/crm/customers?page=1&page_size=200'),
      App.api.get('/api/emr/pets?page=1&page_size=200'),
      App.api.get('/api/emr/staff?role=医生')
    ]);
    await App.form({
      title: '新建预约',
      columns: 2,
      fields: [
        { name: 'owner_id', label: '客户', type: 'select', required: true,
          options: owners.items.map(o => ({ value: o.id, label: `${o.name}（${o.phone}）` })) },
        { name: 'pet_id', label: '宠物', type: 'select', required: true,
          options: pets.items.map(p => ({ value: p.id, label: `${p.name} · ${p.species} · ${p.owner_name}` })) },
        { name: 'doctor_id', label: '医生', type: 'select',
          options: [{ value: '', label: '待分配' }].concat(doctors.items.map(d => ({ value: d.id, label: `${d.name}（${d.title}）` }))) },
        { name: 'appt_type', label: '预约类型', type: 'select', value: '普通门诊',
          options: ['普通门诊', '疫苗', '驱虫', '体检', '绝育', '复诊', '急诊', '洗牙'] },
        { name: 'scheduled_at', label: '预约时间', type: 'datetime', required: true,
          value: new Date().toISOString().slice(0, 16).replace('T', ' ') },
        { name: 'source', label: '来源', type: 'select', value: '门店', options: ['门店', '电话', '小程序', '微信'] },
        { name: 'note', label: '备注', span: 2, type: 'textarea' }
      ],
      onSubmit: async v => {
        await App.api.post('/api/emr/appointments', v);
        App.toast('预约已创建', 'ok');
        App.refresh();
      }
    });
  },

  async detail(id) {
    const a = await App.api.get('/api/emr/appointments?date=&status=all&page=1&page_size=200');
    const appt = a.items.find(x => x.id === id);
    if (!appt) return App.toast('预约不存在', 'err');
    App.modal({
      title: `预约详情 · ${appt.appt_no}`,
      body: `<dl class="desc">
        <dt>预约号</dt><dd>${App.esc(appt.appt_no)}</dd>
        <dt>时间</dt><dd>${App.fmt.dtime(appt.scheduled_at)}</dd>
        <dt>宠物</dt><dd>${App.esc(appt.pet_name)}（${App.esc(appt.species || '')}）</dd>
        <dt>主人</dt><dd>${App.esc(appt.owner_name || '')} ${App.esc(appt.owner_phone || '')}</dd>
        <dt>类型</dt><dd>${App.badge(appt.appt_type, 'info')}</dd>
        <dt>医生</dt><dd>${App.esc(appt.doctor_name || '待分配')}</dd>
        <dt>来源</dt><dd>${App.badge(appt.source)}</dd>
        <dt>状态</dt><dd>${App.badge(appt.status)}</dd>
        <dt>备注</dt><dd>${App.esc(appt.note || '-')}</dd>
      </dl>`,
      footer: `<button class="btn" data-close>关闭</button>
        ${['已完成', '已取消'].includes(appt.status) ? '' :
        `<button class="btn btn-danger" id="cancel">取消预约</button>
         <button class="btn btn-primary" id="checkin">到店接诊</button>`}`
    });
    const foot = document.querySelector('#modal-root .modal-foot');
    const ci = foot.querySelector('#checkin');
    if (ci) ci.addEventListener('click', async () => {
      const r = await App.api.post(`/api/emr/appointments/${id}/checkin`);
      document.querySelector('#modal-root .mask').remove();
      App.go('visits', r.visit.id);
    });
    const cc = foot.querySelector('#cancel');
    if (cc) cc.addEventListener('click', async () => {
      await App.api.patch(`/api/emr/appointments/${id}/status`, { status: '已取消' });
      App.toast('预约已取消', 'ok');
      document.querySelector('#modal-root .mask').remove();
      App.refresh();
    });
  }
});
