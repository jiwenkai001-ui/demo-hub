/* 预约登记：预约管理、到店接诊 */
App.register('appointments', {
  title: '预约登记',
  group: '诊疗中心',
  icon: 'calendar',
  subtitle: '预约 → 到店 → 接诊',

  state: { date: null, status: 'all', source: 'all', page: 1 },

  dispose() {
    this._detailToken = (this._detailToken || 0) + 1;
    this._appointmentModal?.close(); this._newModal?.close();
  },

  async checkin(id, modal) {
    const r = await App.api.post(`/api/emr/appointments/${id}/checkin`);
    if (modal) modal.close();
    App.toast(r.created ? '已到店，病历与候诊队列已生成' : '该预约已有病历', 'ok');
    if (App.canRead('visits')) App.go('visits', r.visit.id);
    else App.refresh();
  },

  async render(root, arg) {
    this._root = root;
    const s = this.state;
    if (arg === 'today') { s.date = Demo.date(); s.status = 'all'; s.page = 1; history.replaceState(null, '', '#/appointments'); arg = null; }
    if (s.date === null) s.date = Demo.date();
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

    root.querySelector('#btn-new').disabled = !App.canWrite('appointments');
    root.querySelector('#btn-new').addEventListener('click', () => this.newAppt().catch(err => App.toast(err.message, 'err')));
    root.querySelector('#btn-today').addEventListener('click', () => {
      s.date = Demo.date(); s.page = 1; App.refresh();
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
    if (!root.isConnected) return;
    if (arg && String(arg).startsWith('new-')) { history.replaceState(null, '', '#/appointments'); this.newAppt({ pet_id: Number(String(arg).slice(4)) }).catch(error => App.toast(error.message, 'err')); }
    else if (arg && /^\d+$/.test(arg)) { history.replaceState(null, '', '#/appointments'); if (!this._appointmentModal?.root.isConnected || this._appointmentId !== Number(arg)) await this.detail(Number(arg)); }
  },

  async load(root) {
    const s = this.state;
    const qs = `date=${s.date}&status=${s.status}&source=${s.source}&page=${s.page}&page_size=30`;
    const data = await App.api.get('/api/emr/appointments?' + qs);
    if (!root.isConnected) return;
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
      { label: '操作', key: 'id', render: r => r.status === '待到店'
        ? `<button class="btn btn-sm btn-primary" data-act="checkin" data-id="${r.id}" ${App.canWrite('appointments') ? '' : 'disabled title="当前角色仅可查看预约"'}>到店接诊</button>`
        : r.visit_id && App.canRead('visits') ? `<button class="btn btn-sm" data-visit="${r.visit_id}">查看病历</button>` : '<span class="muted small">点击查看详情</span>' }
    ];
    const listEl = root.querySelector('#list');
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '该条件下暂无预约' });
    listEl.querySelectorAll('[data-act="checkin"]').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        b.disabled = true;
        try {
          await this.checkin(b.dataset.id);
        } catch (err) { App.toast(err.message, 'err'); b.disabled = false; }
      });
    });
    listEl.querySelectorAll('[data-visit]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); App.go('visits', b.dataset.visit); }));
    App.bindTable(listEl, { rows: data.items, onRow: r => this.detail(r.id) });
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async newAppt(defaults) {
    if (this._newPending || this._newModal?.root.isConnected || !App.canWrite('appointments')) return;
    const sourceRoot = this._root; this._newPending = true;
    try {
    defaults = defaults || {};
    const [owners, pets, doctors] = await Promise.all([
      App.api.get('/api/crm/customers?page=1&page_size=200'),
      App.api.get('/api/emr/pets?page=1&page_size=200'),
      App.api.get('/api/emr/staff?role=医生')
    ]);
    if (!sourceRoot?.isConnected) return;
    const chosenPet = pets.items.find(p => p.id === defaults.pet_id);
    const next = new Date(); next.setSeconds(0, 0); next.setMinutes(Math.ceil((next.getMinutes() + 1) / 30) * 30);
    await App.form({
      title: '新建预约',
      columns: 2,
      fields: [
        { name: 'owner_id', label: '客户', type: 'select', required: true, value: chosenPet ? chosenPet.owner_id : defaults.owner_id,
          options: owners.items.map(o => ({ value: o.id, label: `${o.name}（${o.phone}）` })) },
        { name: 'pet_id', label: '宠物', type: 'select', required: true,
          options: pets.items.map(p => ({ value: p.id, label: `${p.name} · ${p.species} · ${p.owner_name}` })) },
        { name: 'doctor_id', label: '医生', type: 'select',
          options: [{ value: '', label: '待分配' }].concat(doctors.items.map(d => ({ value: d.id, label: `${d.name}（${d.title}）` }))) },
        { name: 'appt_type', label: '预约类型', type: 'select', value: '普通门诊',
          options: ['普通门诊', '疫苗', '驱虫', '体检', '绝育', '复诊', '急诊', '洗牙'] },
        { name: 'scheduled_at', label: '预约时间', type: 'datetime', required: true,
          value: Demo.date(next) + ' ' + String(next.getHours()).padStart(2, '0') + ':' + String(next.getMinutes()).padStart(2, '0') },
        { name: 'source', label: '来源', type: 'select', value: '门店', options: ['门店', '电话', '小程序', '微信'] },
        { name: 'note', label: '备注', span: 2, type: 'textarea' }
      ],
      onOpen: m => {
        this._newModal = m;
        const owner = m.body.querySelector('[name="owner_id"]');
        const pet = m.body.querySelector('[name="pet_id"]');
        const syncPets = () => {
          const own = pets.items.filter(p => p.owner_id === Number(owner.value));
          pet.innerHTML = own.length ? own.map(p => `<option value="${p.id}">${App.esc(p.name)} · ${App.esc(p.species)}</option>`).join('') : '<option value="">该客户尚未建宠物档案</option>';
        };
        owner.addEventListener('change', syncPets);
        syncPets(); if (chosenPet) pet.value = String(chosenPet.id);
      },
      onSubmit: async v => {
        await App.api.post('/api/emr/appointments', v);
        this.state.date = v.scheduled_at.slice(0, 10); this.state.status = 'all'; this.state.page = 1;
        App.toast('预约已创建', 'ok');
        App.refresh();
      }
    });
    } finally { this._newPending = false; this._newModal = null; }
  },

  async detail(id) {
    const sourceRoot = this._root, token = this._detailToken = (this._detailToken || 0) + 1;
    let appt; try { appt = await App.api.get(`/api/emr/appointments/${id}`); } catch (error) { App.toast(error.message, 'err'); return; }
    if (!sourceRoot?.isConnected || token !== this._detailToken) return;
    if (!appt) return App.toast('预约不存在', 'err');
    if (this._appointmentModal && this._appointmentModal.root.isConnected) this._appointmentModal.close();
    const modal = App.modal({
      title: `预约详情 · ${appt.appt_no}`,
      onClose: () => { if (this._appointmentModal === modal) this._appointmentModal = null; },
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
        ${appt.visit_id && App.canRead('visits') ? `<button class="btn btn-primary" id="view-visit">查看病历</button>` : ''}
        ${appt.status !== '待到店' || !App.canWrite('appointments') ? '' :
        `<button class="btn btn-danger" id="cancel">取消预约</button>
         <button class="btn btn-primary" id="checkin">到店接诊</button>`}`
    });
    this._appointmentModal = modal; this._appointmentId = id;
    const foot = modal.root.querySelector('.modal-foot');
    foot.querySelector('#view-visit')?.addEventListener('click', () => { modal.close(); App.go('visits', appt.visit_id); });
    const ci = foot.querySelector('#checkin');
    if (ci) ci.addEventListener('click', async () => {
      ci.disabled = true;
      try {
        await this.checkin(id, modal);
      } catch (e) { App.toast(e.message, 'err'); ci.disabled = false; }
    });
    const cc = foot.querySelector('#cancel');
    if (cc) cc.addEventListener('click', async () => {
      if (!await App.confirm('确认取消这次预约？', '取消预约')) return;
      cc.disabled = true;
      try {
        await App.api.patch(`/api/emr/appointments/${id}/status`, { status: '已取消' });
        App.toast('预约已取消', 'ok');
        modal.close();
        App.refresh();
      } catch (e) { App.toast(e.message, 'err'); cc.disabled = false; }
    });
  }
});
