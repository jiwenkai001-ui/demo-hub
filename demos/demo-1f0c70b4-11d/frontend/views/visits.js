/* 电子病历 EMR：就诊列表与全流程病历（体征 / SOAP / 处方 / 检验 / 影像 / 费用） */
App.register('visits', {
  title: '电子病历 EMR',
  group: '诊疗中心',
  icon: 'file',
  subtitle: '诊疗流程标准化',

  state: { status: 'all', dept: 'all', kw: '', page: 1 },

  async render(root, arg) {
    const s = this.state;
    if (arg === 'active') { s.status = 'active'; s.page = 1; history.replaceState(null, '', '#/visits'); arg = null; }
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>就诊记录</h3>
          <span class="sub">点击任意一行打开完整电子病历</span>
          <div class="right">
            <button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 直接接诊</button>
          </div>
        </div>
        <div class="toolbar">
          <input id="kw" placeholder="宠物名 / 主人 / 就诊号" value="${App.esc(s.kw)}">
          <select id="status">
            <option value="all">全部状态</option>
            <option value="active" ${s.status === 'active' ? 'selected' : ''}>待办诊疗（待接诊 / 诊疗中）</option>
            ${['待接诊', '诊疗中', '待缴费', '已完成', '已取消'].map(x =>
              `<option value="${x}" ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
          <select id="dept">
            <option value="all">全部科室</option>
            ${['内科', '外科', '皮肤科', '全科', '急诊', '影像科'].map(x =>
              `<option value="${x}" ${s.dept === x ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
          <button class="btn btn-sm" id="btn-search">${App.icon('search')} 查询</button>
          <span class="grow"></span>
          <span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelector('#btn-new').addEventListener('click', () => this.newVisit());
    root.querySelector('#btn-search').addEventListener('click', () => {
      s.kw = root.querySelector('#kw').value.trim();
      s.status = root.querySelector('#status').value;
      s.dept = root.querySelector('#dept').value;
      s.page = 1; App.refresh();
    });
    root.querySelector('#kw').addEventListener('keydown', e => {
      if (e.key === 'Enter') root.querySelector('#btn-search').click();
    });

    if (arg && String(arg).startsWith('new-')) { history.replaceState(null, '', '#/visits'); this.newVisit({ pet_id: Number(String(arg).slice(4)) }).catch(error => App.toast(error.message, 'err')); }
    else if (arg && /^\d+$/.test(arg) && (!this._visitModal || !this._visitModal.root.isConnected || this._visitId !== Number(arg))) await this.openVisit(Number(arg));
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const data = await App.api.get(
      `/api/emr/visits?keyword=${encodeURIComponent(s.kw)}&status=${s.status}&dept=${s.dept}&page=${s.page}&page_size=20`);
    const cols = [
      { label: '就诊号', key: 'visit_no', render: r => `<div class="strong">${App.esc(r.visit_no)}</div>
         <div class="muted small">${App.fmt.dtime(r.visited_at)}</div>` },
      { label: '宠物', key: 'pet_name', render: r => `<div class="strong">${App.esc(r.pet_name)}</div>
         <div class="muted small">${App.esc(r.owner_name || '')}</div>` },
      { label: '科室 / 医生', key: 'dept', render: r => `${App.esc(r.dept)}<div class="muted small">${App.esc(r.doctor_name || '待分配')}</div>` },
      { label: '主诉', key: 'chief_complaint', render: r => `<span class="small">${App.esc(r.chief_complaint || '-')}</span>` },
      { label: '诊断', key: 'diagnosis', render: r => `<span class="small">${App.esc(r.diagnosis || '待完善')}</span>` },
      { label: '医技', key: 'lab_count', render: r => `<span class="badge gray">检验 ${r.lab_count}</span> <span class="badge gray">影像 ${r.img_count}</span>` },
      { label: '类型', key: 'visit_type', render: r => App.badge(r.visit_type, r.visit_type === '急诊' ? 'danger' : 'gray') },
      { label: '状态', key: 'status', render: r => App.badge(r.status) }
    ];
    const listEl = root.querySelector('#list');
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无就诊记录' });
    App.bindTable(listEl, { rows: data.items, onRow: r => this.openVisit(r.id) });
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async newVisit(defaults) {
    defaults = defaults || {};
    const [owners, pets, doctors] = await Promise.all([
      App.api.get('/api/crm/customers?page=1&page_size=200'),
      App.api.get('/api/emr/pets?page=1&page_size=200'),
      App.api.get('/api/emr/staff?role=医生')
    ]);
    const chosenPet = pets.items.find(p => p.id === defaults.pet_id);
    await App.form({
      title: '直接接诊（无需预约）',
      columns: 2,
      fields: [
        { name: 'owner_id', label: '客户', type: 'select', required: true, value: chosenPet ? chosenPet.owner_id : defaults.owner_id,
          options: owners.items.map(o => ({ value: o.id, label: `${o.name}（${o.phone}）` })) },
        { name: 'pet_id', label: '宠物', type: 'select', required: true,
          options: pets.items.map(p => ({ value: p.id, label: `${p.name} · ${p.species} · ${p.owner_name}` })) },
        { name: 'doctor_id', label: '医生', type: 'select',
          options: [{ value: '', label: '待分配' }].concat(doctors.items.map(d => ({ value: d.id, label: `${d.name}（${d.title}）` }))) },
        { name: 'dept', label: '科室', type: 'select', value: '全科', options: ['全科', '内科', '外科', '皮肤科', '急诊', '影像科'] },
        { name: 'visit_type', label: '就诊类型', type: 'select', value: '门诊', options: ['门诊', '急诊', '住院', '复诊', '体检'] },
        { name: 'status', label: '状态', type: 'select', value: '待接诊', options: ['待接诊', '诊疗中', '待缴费', '已完成'] },
        { name: 'chief_complaint', label: '主诉', span: 2, type: 'textarea' }
      ],
      onOpen: m => {
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
        const r = await App.api.post('/api/emr/visits', v);
        App.toast('就诊已创建', 'ok');
        this.openVisit(r.id);
        App.refresh();
      }
    });
  },

  /* ------------------------------------------------ 病历详情 */
  visitHtml(v) {
    const vit = v.vitals || {};
    return `
    <div class="card">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div>
            <div style="font-size:16px;font-weight:700">${App.esc(v.pet ? v.pet.name : '')}
              <span class="muted" style="font-weight:400;font-size:13px">· ${App.esc(v.pet ? v.pet.species + ' ' + (v.pet.breed || '') : '')}</span></div>
            <div class="muted small">就诊号 ${App.esc(v.visit_no)} · ${App.esc(v.owner ? v.owner.name : '')} ${App.esc(v.owner ? v.owner.phone : '')}</div>
          </div>
          <span class="grow" style="flex:1"></span>
          ${App.badge(v.visit_type)} ${App.badge(v.dept)} ${App.badge(v.status)}
          <div class="muted small">${App.esc(v.doctor ? v.doctor.name + ' · ' + (v.doctor.title || '') : '未分配医生')}</div>
        </div>
      </div>
    </div>

    <div class="grid g2" style="margin-top:14px">
      <div class="card">
        <div class="card-head"><h3>诊疗记录（SOAP）</h3>
          <div class="right"><button class="btn btn-sm" data-act="edit-visit">${App.icon('edit')} 编辑</button></div>
        </div>
        <div class="card-body">
          <div class="kv-list">
            <div class="kv"><span class="k">主诉 S</span><span class="v">${App.esc(v.chief_complaint || '未填写')}</span></div>
            <div class="kv"><span class="k">现病史</span><span class="v">${App.esc(v.present_illness || '未填写')}</span></div>
            <div class="kv"><span class="k">诊断 A</span><span class="v strong">${App.esc(v.diagnosis || '未填写')}</span></div>
            <div class="kv"><span class="k">处置 P</span><span class="v">${App.esc(v.treatment || '未填写')}</span></div>
            <div class="kv"><span class="k">医嘱</span><span class="v">${App.esc(v.advice || '未填写')}</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>生命体征</h3>
          <div class="right"><button class="btn btn-sm" data-act="vitals">${App.icon('stethoscope')} 记录体征</button></div>
        </div>
        <div class="card-body">
          ${v.vitals ? `<div class="grid vitals-grid" style="gap:10px;text-align:center">
            ${[['体温', vit.temperature + ' ℃'], ['心率', vit.heart_rate + ' 次/分'],
               ['呼吸', vit.resp_rate + ' 次/分'], ['体重', vit.weight + ' kg'],
               ['CRT', vit.crt + ' s'], ['黏膜', vit.mm || '-'],
               ['疼痛', vit.pain_score + ' 分'], ['BCS', vit.bcs + '/9']].map(x =>
              `<div style="background:var(--panel-2);border-radius:8px;padding:9px 4px">
                 <div class="muted" style="font-size:11px">${x[0]}</div>
                 <div style="font-weight:650;font-size:14px;margin-top:2px">${App.esc(x[1])}</div>
               </div>`).join('')}
          </div><div class="muted small" style="margin-top:8px">记录于 ${App.fmt.dtime(vit.recorded_at)}</div>`
            : '<div class="empty">尚未记录生命体征</div>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3>病程记录</h3>
        <div class="right"><button class="btn btn-sm" data-act="soap">${App.icon('plus')} 添加病程</button></div>
      </div>
      <div class="card-body">
        ${(v.soap || []).length ? `<div class="timeline">${(v.soap || []).map(n => `
          <div class="tl-item">
            <div class="tl-time">${App.fmt.dtime(n.created_at)} · ${App.esc(n.author || '医生')}</div>
            <div class="tl-body">
              ${n.subjective ? `<div><span class="muted">S：</span>${App.esc(n.subjective)}</div>` : ''}
              ${n.objective ? `<div><span class="muted">O：</span>${App.esc(n.objective)}</div>` : ''}
              ${n.assessment ? `<div><span class="muted">A：</span>${App.esc(n.assessment)}</div>` : ''}
              ${n.plan ? `<div><span class="muted">P：</span>${App.esc(n.plan)}</div>` : ''}
            </div>
          </div>`).join('')}</div>` : '<div class="empty">暂无病程记录</div>'}
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3>处方用药</h3>
        <div class="right"><button class="btn btn-sm btn-primary" data-act="rx">${App.icon('pill')} 开处方</button></div>
      </div>
      <div class="card-body flush">
        ${(v.prescriptions || []).length ? `<div class="table-wrap"><table class="tbl">
          <thead><tr><th>药品</th><th>规格</th><th>剂量</th><th>频次</th><th>途径</th><th>天数</th><th>数量</th><th>用法</th><th></th></tr></thead>
          <tbody>${(v.prescriptions || []).map(p => `
            <tr>
              <td class="strong">${App.esc(p.drug_name)}</td>
              <td class="small muted">${App.esc(p.spec || '-')}</td>
              <td>${App.esc(p.dosage || '-')}</td>
              <td>${App.esc(p.frequency || '-')}</td>
              <td>${App.esc(p.route || '-')}</td>
              <td>${p.days} 天</td>
              <td>${p.qty} ${App.esc(p.unit)}</td>
              <td class="small muted">${App.esc(p.usage_note || '-')}</td>
              <td><button class="btn btn-sm btn-danger" data-act="del-rx" data-id="${p.id}">删除</button></td>
            </tr>`).join('')}</tbody></table></div>`
          : '<div class="empty">暂无处方（开药将自动扣减库存并计入账单）</div>'}
      </div>
    </div>

    <div class="grid g2" style="margin-top:14px">
      <div class="card">
        <div class="card-head"><h3>化验检查 (LIS)</h3>
          <div class="right"><button class="btn btn-sm" data-act="lab">${App.icon('lab')} 开化验单</button></div>
        </div>
        <div class="card-body flush">
          ${(v.lab_orders || []).length ? (v.lab_orders || []).map(l => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(l.panel)} <span class="muted small">${App.esc(l.order_no)}</span></div>
                <div class="ls">${App.esc(l.device_name || '未指定设备')} · ${App.esc(l.sample_type || '')}</div></div>
              ${App.badge(l.status)}
              <button class="btn btn-sm" data-act="view-lab" data-id="${l.id}">报告</button>
            </div>`).join('') : '<div class="empty">暂无化验申请</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>影像检查 (PACS)</h3>
          <div class="right"><button class="btn btn-sm" data-act="img">${App.icon('image')} 登记检查</button></div>
        </div>
        <div class="card-body flush">
          ${(v.imaging || []).length ? (v.imaging || []).map(s => `
            <div class="list-item">
              <div class="grow"><div class="lt">${App.esc(s.modality)} · ${App.esc(s.body_part)}</div>
                <div class="ls">${s.image_count} 幅 · ${App.fmt.dtime(s.performed_at)}</div></div>
              ${App.badge(s.status)}
              <button class="btn btn-sm" data-act="view-img" data-id="${s.id}">阅片</button>
            </div>`).join('') : '<div class="empty">暂无影像检查</div>'}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3>费用清单</h3>
        <div class="right">
          ${v.invoice ? `${App.badge(v.invoice.status)} <button class="btn btn-sm btn-primary" data-act="pay" ${['已结清','已退费'].includes(v.invoice.status) ? 'disabled' : ''}>收费</button>` : ''}
        </div>
      </div>
      <div class="card-body flush">
        ${v.invoice ? `
          <div class="table-wrap"><table class="tbl">
            <thead><tr><th>类别</th><th>项目</th><th>数量</th><th class="num">单价</th><th class="num">金额</th></tr></thead>
            <tbody>
              ${(this._items || []).map(i => `<tr><td>${App.badge(i.item_type, 'gray')}</td>
                <td>${App.esc(i.name)}</td><td>${i.qty}</td>
                <td class="num">¥${App.fmt.money(i.unit_price)}</td>
                <td class="num strong">¥${App.fmt.money(i.amount)}</td></tr>`).join('')}
            </tbody></table></div>
          <div style="padding:12px 18px;text-align:right;border-top:1px solid var(--border-2)">
            <span class="muted">合计 ¥${App.fmt.money(v.invoice.total_amount)}</span>
            <span class="muted"> · 优惠 ¥${App.fmt.money(v.invoice.discount)}</span>
            <span style="font-size:18px;font-weight:700;margin-left:12px">应付 ¥${App.fmt.money(v.invoice.payable)}</span>
            <span class="muted small">（已付 ¥${App.fmt.money(v.invoice.paid_amount)}）</span>
          </div>` : '<div class="empty">暂无费用</div>'}
      </div>
    </div>`;
  },

  async openVisit(id) {
    const token = this._visitToken = (this._visitToken || 0) + 1;
    if (this._visitModal && this._visitModal.root.isConnected) this._visitModal.close();
    const modal = App.modal({
      title: '电子病历',
      width: 'xwide',
      onClose: () => { if (this._visitModal === modal) this._visitModal = null; },
      body: '<div class="skeleton">加载中…</div>',
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn" data-act="followup">新建复诊</button>
        <button class="btn" data-act="care">住院与文书</button>
        <button class="btn" data-act="specialties">专科病历</button><button class="btn" data-act="print-center">打印设置与预览</button>
        <button class="btn" data-act="print">${App.icon('file')} 打印病历</button>
        <button class="btn btn-primary" data-act="finish">完成就诊</button>`
    });
    modal.root.classList.add('care-visit-modal');
    this._visitModal = modal; this._visitId = id;
    const reload = async () => {
      const v = await App.api.get(`/api/emr/visits/${id}`);
      if (token !== this._visitToken || !modal.root.isConnected) return;
      if (v.invoice) {
        const inv = await App.api.get(`/api/bill/invoices/${v.invoice.id}`);
        this._items = inv.items || [];
      } else {
        this._items = [];
      }
      modal.body.innerHTML = this.visitHtml(v);
      this._v = v;
      this.bindVisitModal(modal, v, reload);
    };
    try { await reload(); } catch (error) { modal.close(); App.toast(error.message, 'err'); }
  },

  bindVisitModal(modal, v, reload) {
    const body = modal.body;
    const foot = modal.body.parentElement.querySelector('.modal-foot');
    for(const [key,fn] of [['specialties',()=>ClinicalPlus.specialties(v.id)],['print-center',()=>ClinicalPlus.printCenter(v.id)]]){const button=foot.querySelector('[data-act="'+key+'"]');if(button)button.onclick=async()=>{try{await fn();}catch(error){App.toast(error.message,'err');}};}
    foot.querySelector('[data-act="care"]').onclick = () => { modal.close(); App.go('care', 'ward'); };
    foot.querySelector('[data-act="followup"]').onclick = async () => {
      await App.form({ title: '从旧病历建立复诊', width: 'wide', tip: '沿用主人、宠物和接诊医生。请修改本次病情；旧处方、检查和收费不会复制。', fields: [
        { name: 'chief_complaint', label: '本次复诊主诉', type: 'textarea', value: v.chief_complaint, required: true },
        { name: 'present_illness', label: '本次病情变化', type: 'textarea', value: '' },
        { name: 'diagnosis', label: '复诊诊断（待本次确认）', type: 'textarea', value: '' },
        { name: 'advice', label: '本次建议', type: 'textarea', value: '' }
      ], onSubmit: async values => { const next = await App.api.post('/api/care/visits/' + v.id + '/followup', values); modal.close(); App.toast('复诊已建立，请完善本次诊疗', 'ok'); App.go('visits', next.id); } });
    };

    const btn = sel => body.querySelector(sel);

    if(v.status==='已取消')body.querySelectorAll('[data-act="vitals"],[data-act="soap"],[data-act="rx"],[data-act="lab"],[data-act="img"]').forEach(b=>{b.disabled=true;b.title='已取消就诊不可继续诊疗，请新建就诊';});
    const editVisit = btn('[data-act="edit-visit"]');
    if (editVisit) editVisit.addEventListener('click', async () => {
      const tpl = await App.api.get('/api/emr/templates');
      const group = c => tpl.items.filter(t => t.category === c);
      await App.form({
        title: '编辑诊疗记录',
        tip: '可从病历模板快速带出标准化描述',
        fields: [
          { name: 'chief_complaint', label: '主诉 S', type: 'textarea', value: v.chief_complaint },
          { name: 'present_illness', label: '现病史', type: 'textarea', value: v.present_illness },
          { name: 'diagnosis', label: '诊断 A', type: 'textarea', value: v.diagnosis },
          { name: 'treatment', label: '处置方案 P', type: 'textarea', value: v.treatment },
          { name: 'advice', label: '医嘱', type: 'textarea', value: v.advice },
          { name: 'dept', label: '科室', type: 'select', value: v.dept, options: ['全科', '内科', '外科', '皮肤科', '急诊', '影像科'] },
          { name: 'status', label: '就诊状态', type: 'select', value: v.status, options: v.status==='已取消'?['已取消']:['待接诊', '诊疗中', '待缴费', '已完成', '已取消'] },
          { name: '_tpl', label: '插入模板（可选）', type: 'select',
            options: [{ value: '', label: '不使用模板' }].concat(
              tpl.items.map(t => ({ value: t.id, label: `[${t.category}] ${t.title}` }))) }
        ],
        onOpen: m => {
          const select = m.body.querySelector('[name="_tpl"]');
          select.addEventListener('change', () => {
            const template = tpl.items.find(x => String(x.id) === select.value);
            const field = template && ({ '主诉': 'chief_complaint', '现病史': 'present_illness', '诊断': 'diagnosis', '处置': 'treatment', '医嘱': 'advice' })[template.category];
            if (field) { const input = m.body.querySelector('[name="' + field + '"]'); input.value = template.content; input.focus(); }
          });
        },
        onSubmit: async vals => {
          const tId = vals._tpl; delete vals._tpl;
          if (tId) {
            const t = tpl.items.find(x => String(x.id) === String(tId));
            if (t) {
              await App.api.post(`/api/emr/templates/${tId}/use`);
            }
          }
          await App.api.put(`/api/emr/visits/${v.id}`, vals);
          App.toast('病历已保存', 'ok');
          reload(); App.refresh();
        }
      });
    });

    const vit = btn('[data-act="vitals"]');
    if (vit) vit.addEventListener('click', async () => {
      const cur = v.vitals || {};
      await App.form({
        title: '记录生命体征',
        columns: 3,
        fields: [
          { name: 'temperature', label: '体温 (℃)', type: 'number', step: '0.1', min: 25, max: 45, value: cur.temperature },
          { name: 'heart_rate', label: '心率 (次/分)', type: 'number', min: 1, max: 400, value: cur.heart_rate },
          { name: 'resp_rate', label: '呼吸 (次/分)', type: 'number', min: 1, max: 250, value: cur.resp_rate },
          { name: 'weight', label: '体重 (kg)', type: 'number', min: 0.01, max: 250, step: '0.01', value: cur.weight },
          { name: 'crt', label: 'CRT (s)', type: 'number', min: 0, max: 10, step: '0.1', value: cur.crt },
          { name: 'mm', label: '黏膜颜色', type: 'select', value: cur.mm || '粉红', options: ['粉红', '淡粉', '潮红', '苍白', '紫绀'] },
          { name: 'pain_score', label: '疼痛评分 0-10', type: 'number', value: cur.pain_score, min: 0, max: 10 },
          { name: 'bcs', label: '体况评分 1-9', type: 'number', value: cur.bcs || 5, min: 1, max: 9 }
        ],
        onSubmit: async vals => {
          await App.api.post(`/api/emr/visits/${v.id}/vitals`, vals);
          App.toast('体征已记录', 'ok');
          reload();
        }
      });
    });

    const soap = btn('[data-act="soap"]');
    if (soap) soap.addEventListener('click', async () => {
      await App.form({
        title: '添加病程记录 (SOAP)',
        fields: [
          { name: 'subjective', label: 'S 主观（主人描述）', type: 'textarea' },
          { name: 'objective', label: 'O 客观（检查结果）', type: 'textarea' },
          { name: 'assessment', label: 'A 评估（诊断分析）', type: 'textarea' },
          { name: 'plan', label: 'P 计划（治疗计划）', type: 'textarea' },
          { name: 'author', label: '记录人', value: v.doctor ? v.doctor.name : '' }
        ],
        onSubmit: async vals => {
          await App.api.post(`/api/emr/visits/${v.id}/soap`, vals);
          App.toast('病程已添加', 'ok');
          reload();
        }
      });
    });

    const rx = btn('[data-act="rx"]');
    if (rx) rx.addEventListener('click', async () => {
      const prods = await App.api.get('/api/inv/products?status=在售&page=1&page_size=200');
      await App.form({
        title: '开具处方',
        tip: '选择药品后将自动扣减库存并计入账单',
        columns: 2,
        fields: [
          { name: 'product_id', label: '药品 / 耗材', type: 'select', span: 2,
            options: prods.items.map(p => ({ value: p.id, label: `${p.name}（${p.spec}）库存${p.stock_qty}${p.unit} ¥${p.sale_price}` })) },
          { name: 'dosage', label: '单次剂量', placeholder: '如：1片 / 0.5ml' },
          { name: 'frequency', label: '频次', type: 'select', value: 'bid',
            options: ['sid', 'bid', 'tid', 'qid', 'qd', 'q8h'] },
          { name: 'route', label: '给药途径', type: 'select', value: '口服',
            options: ['口服', '皮下注射', '静脉注射', '肌肉注射', '外用', '滴眼'] },
          { name: 'days', label: '用药天数', type: 'number', min: 1, value: 5 },
          { name: 'qty', label: '发药数量', type: 'number', min: 0.5, step: '0.5', value: 1 },
          { name: 'usage_note', label: '用法用量说明', span: 2, type: 'textarea', value: '按医嘱服用，完成整个疗程' }
        ],
        onSubmit: async vals => {
          await App.api.post(`/api/emr/visits/${v.id}/prescriptions`, vals);
          App.toast('处方已开具，库存与账单已同步', 'ok');
          reload();
        }
      });
    });

    body.querySelectorAll('[data-act="del-rx"]').forEach(b => {
      b.addEventListener('click', async () => {
        if (!await App.confirm('删除该处方？库存将自动回补。')) return;
        b.disabled = true;
        try { await App.api.delete(`/api/emr/prescriptions/${b.dataset.id}`); App.toast('处方已删除，库存已恢复', 'ok'); await reload(); }
        catch (error) { App.toast(error.message, 'err'); b.disabled = false; }
      });
    });

    const lab = btn('[data-act="lab"]');
    if (lab) lab.addEventListener('click', async () => {
      const panels = await App.api.get('/api/lis/panels');
      await App.form({
        title: '开具化验申请单',
        tip: '开单后自动计入账单，可到化验室 LIS 执行设备直读',
        fields: [
          { name: 'panel', label: '检验项目组', type: 'select',
            options: panels.items.map(p => ({ value: p.panel, label: `${p.panel}（${p.count} 项）` })) },
          { name: 'priority', label: '优先级', type: 'select', value: '常规', options: ['常规', '急诊'] },
          { name: 'sample_type', label: '样本类型', type: 'select', value: '全血', options: ['全血', '血清', '血浆', '尿液', '粪便', '分泌物'] },
          { name: 'note', label: '备注', type: 'textarea' }
        ],
        onSubmit: async vals => {
          await App.api.post('/api/lis/orders', Object.assign({ pet_id: v.pet_id, visit_id: v.id, doctor_id: v.doctor_id }, vals));
          App.toast('化验单已开具', 'ok');
          reload();
        }
      });
    });

    body.querySelectorAll('[data-act="view-lab"]').forEach(b => {
      b.addEventListener('click', () => { modal.close(); App.go('lis', b.dataset.id); });
    });

    const img = btn('[data-act="img"]');
    if (img) img.addEventListener('click', async () => {
      await App.form({
        title: '登记影像检查',
        columns: 2,
        fields: [
          { name: 'modality', label: '检查类型', type: 'select', value: 'DR', options: ['DR', 'X光', 'CR', 'B超', '彩超', 'CT', 'MRI', '内窥镜'] },
          { name: 'body_part', label: '检查部位', type: 'select', value: '腹部', options: ['腹部', '胸部', '四肢', '头颅', '脊柱', '骨盆', '心脏', '消化道'] },
          { name: 'performed_by', label: '操作技师', value: '周雨薇' },
          { name: 'status', label: '状态', type: 'select', value: '已登记', options: ['已登记', '检查中', '已完成', '已报告'] }
        ],
        onSubmit: async vals => {
          await App.api.post('/api/imaging/studies', Object.assign({ pet_id: v.pet_id, visit_id: v.id, doctor_id: v.doctor_id }, vals));
          App.toast('影像检查已登记，费用已计入账单', 'ok');
          reload();
        }
      });
    });

    body.querySelectorAll('[data-act="view-img"]').forEach(b => {
      b.addEventListener('click', () => { modal.close(); App.go('imaging', b.dataset.id); });
    });

    const pay = btn('[data-act="pay"]');
    if (pay) pay.addEventListener('click', async () => {
      const inv = v.invoice;
      await App.form({
        title: '收费结算',
        tip: '应付金额 ¥' + App.fmt.money(inv.payable) + '，已付 ¥' + App.fmt.money(inv.paid_amount),
        fields: [
          { name: 'pay_method', label: '支付方式', type: 'select', value: '微信',
            options: ['微信', '支付宝', '现金', '银行卡', '会员卡'] },
          { name: 'amount', label: '本次收款金额', type: 'number', step: '0.01',
            value: Number(inv.payable) - Number(inv.paid_amount) },
          { name: 'cashier', label: '收银员', value: 'admin' }
        ],
        onSubmit: async vals => {
          await App.api.post(`/api/bill/invoices/${inv.id}/pay`, vals);
          App.toast('收费成功', 'ok');
          reload(); App.refresh();
        }
      });
    });

    const finish = foot.querySelector('[data-act="finish"]');
    if (finish) { finish.disabled = ['已完成','已取消'].includes(v.status); finish.textContent = v.status === '已取消' ? '就诊已取消' : v.status === '已完成' ? '已完成就诊' : '完成就诊'; finish.onclick = async () => {
      finish.disabled = true;
      try { await App.api.put(`/api/emr/visits/${v.id}`, { status: '已完成' }); App.toast('就诊已完成', 'ok'); await reload(); App.refresh(); }
      catch (error) { App.toast(error.message, 'err'); finish.disabled = false; }
    }; }
    const pr = foot.querySelector('[data-act="print"]');
    if (pr) pr.onclick = () => window.print();
  }
});
