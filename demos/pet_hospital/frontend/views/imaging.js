/* 影像管理：X光 / DR / B超 检查登记、归档、阅片与报告 */
App.register('imaging', {
  title: '影像管理',
  group: '医技中心',
  icon: 'image',
  subtitle: '影像归档与阅片 (PACS)',

  state: { modality: 'all', kw: '', page: 1 },

  async render(root, arg) {
    const s = this.state;
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>影像检查档案</h3>
          <span class="sub">点击行打开阅片器与报告</span>
          <div class="right">
            <button class="btn btn-primary btn-sm" id="btn-new">${App.icon('plus')} 登记检查</button>
          </div>
        </div>
        <div class="toolbar">
          <select id="modality">
            <option value="all">全部类型</option>
            ${['DR', 'X光', 'CR', 'B超', '彩超', 'CT', 'MRI', '内窥镜'].map(x =>
              `<option value="${x}" ${s.modality === x ? 'selected' : ''}>${x}</option>`).join('')}
          </select>
          <input id="kw" placeholder="宠物 / 主人 / 部位" value="${App.esc(s.kw)}">
          <button class="btn btn-sm" id="search">${App.icon('search')} 查询</button>
          <span class="grow"></span>
          <span class="muted small" id="hint"></span>
        </div>
        <div class="card-body flush" id="list"><div class="skeleton">加载中…</div></div>
        <div id="pager"></div>
      </div>`;

    root.querySelector('#btn-new').addEventListener('click', () => this.newStudy());
    root.querySelector('#search').addEventListener('click', () => {
      s.modality = root.querySelector('#modality').value;
      s.kw = root.querySelector('#kw').value.trim();
      s.page = 1; App.refresh();
    });
    root.querySelector('#modality').addEventListener('change', e => { s.modality = e.target.value; s.page = 1; App.refresh(); });

    if (arg) this.openStudy(Number(arg));
    await this.load(root);
  },

  async load(root) {
    const s = this.state;
    const data = await App.api.get(
      `/api/imaging/studies?modality=${s.modality}&keyword=${encodeURIComponent(s.kw)}&page=${s.page}&page_size=20`);
    const cols = [
      { label: '影像', key: 'cover', render: r => r.cover
        ? `<img src="${App.esc(Demo.asset(r.cover.startsWith('data:') ? r.cover : 'uploads/' + r.cover))}" style="width:64px;height:46px;object-fit:cover;border-radius:5px;background:#000">`
        : '<div style="width:64px;height:46px;background:#0f172a;border-radius:5px"></div>' },
      { label: '检查', key: 'modality', render: r => `<div class="strong">${App.esc(r.modality)} · ${App.esc(r.body_part)}</div>
         <div class="muted small">${App.esc(r.study_uid ? r.study_uid.slice(0, 26) + '…' : '')}</div>` },
      { label: '宠物', key: 'pet_name', render: r => `<div class="strong">${App.esc(r.pet_name)}</div>
         <div class="muted small">${App.esc(r.owner_name || '')}</div>` },
      { label: '医生 / 技师', key: 'doctor_name', render: r => `${App.esc(r.doctor_name || '-')}<div class="muted small">${App.esc(r.performed_by || '')}</div>` },
      { label: '幅数', key: 'image_count', align: 'right', render: r => `${r.image_count} 幅` },
      { label: '检查时间', key: 'performed_at', render: r => App.fmt.dtime(r.performed_at) },
      { label: '影像诊断', key: 'impression', render: r => `<span class="small">${App.esc(r.impression || '待出报告')}</span>` },
      { label: '状态', key: 'status', render: r => App.badge(r.status) }
    ];
    const listEl = root.querySelector('#list');
    listEl.innerHTML = App.table({ columns: cols, rows: data.items, empty: '暂无影像检查' });
    App.bindTable(listEl, { rows: data.items, onRow: r => this.openStudy(r.id) });
    root.querySelector('#hint').textContent = `共 ${data.meta.total} 条`;
    root.querySelector('#pager').innerHTML = App.pager(data.meta, p => { this.state.page = p; App.refresh(); });
    App.bindPager(root.querySelector('#pager'), p => { this.state.page = p; App.refresh(); });
  },

  async newStudy() {
    const [pets, doctors] = await Promise.all([
      App.api.get('/api/emr/pets?page=1&page_size=200'),
      App.api.get('/api/emr/staff?role=医生')
    ]);
    await App.form({
      title: '登记影像检查',
      columns: 2,
      fields: [
        { name: 'pet_id', label: '宠物', type: 'select', required: true,
          options: pets.items.map(p => ({ value: p.id, label: `${p.name} · ${p.species} · ${p.owner_name}` })) },
        { name: 'doctor_id', label: '申请医生', type: 'select',
          options: doctors.items.map(d => ({ value: d.id, label: d.name })) },
        { name: 'modality', label: '检查类型', type: 'select', value: 'DR',
          options: ['DR', 'X光', 'CR', 'B超', '彩超', 'CT', 'MRI', '内窥镜'] },
        { name: 'body_part', label: '检查部位', type: 'select', value: '腹部',
          options: ['腹部', '胸部', '四肢', '头颅', '脊柱', '骨盆', '心脏', '消化道'] },
        { name: 'performed_by', label: '操作技师', value: '周雨薇' },
        { name: 'status', label: '状态', type: 'select', value: '已登记', options: ['已登记', '检查中', '已完成', '已报告'] }
      ],
      onSubmit: async v => {
        const st = await App.api.post('/api/imaging/studies', v);
        App.toast('检查已登记', 'ok');
        App.refresh();
        this.openStudy(st.id);
      }
    });
  },

  async openStudy(id) {
    const st = await App.api.get(`/api/imaging/studies/${id}`);
    const ins = st.instances || [];
    const modal = App.modal({
      title: `影像阅片 · ${st.modality} ${st.body_part}`,
      width: 'xwide',
      body: `
      <div class="grid study-layout">
        <div class="card">
          <div class="card-head"><h3>阅片器</h3>
            <span class="sub">${App.esc(st.pet ? st.pet.name : '')} · ${ins.length} 幅</span></div>
          <div class="card-body">
            <div class="viewer" id="viewer">
              ${ins.length ? `<img src="${ins[0].url}" id="big">` : '<div class="empty">尚无影像文件</div>'}
            </div>
            <div class="img-grid" style="margin-top:12px">
              ${ins.map((i, idx) => `
                <div class="img-card" data-idx="${idx}">
                  <img src="${i.url}">
                  <div class="img-meta">#${i.instance_no} · ${i.width}×${i.height} · ${i.size_kb}KB
                    <span class="link" data-del="${i.id}" style="float:right;color:#fca5a5">删除</span></div>
                </div>`).join('') || '<div class="muted">暂无影像</div>'}
            </div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-head"><h3>检查信息</h3></div>
            <div class="card-body">
              <dl class="desc">
                <dt>宠物</dt><dd class="strong">${App.esc(st.pet ? st.pet.name : '')}</dd>
                <dt>主人</dt><dd>${App.esc(st.owner ? st.owner.name : '-')}</dd>
                <dt>类型</dt><dd>${App.badge(st.modality, 'info')} ${App.esc(st.body_part)}</dd>
                <dt>技师</dt><dd>${App.esc(st.performed_by || '-')}</dd>
                <dt>时间</dt><dd>${App.fmt.dtime(st.performed_at)}</dd>
                <dt>StudyUID</dt><dd class="small" style="word-break:break-all">${App.esc(st.study_uid || '')}</dd>
                <dt>状态</dt><dd>${App.badge(st.status)}</dd>
              </dl>
            </div>
          </div>
          <div class="card" style="margin-top:14px">
            <div class="card-head"><h3>影像报告</h3>
              <div class="right"><button class="btn btn-sm" id="edit-report">${App.icon('edit')} 编辑</button></div>
            </div>
            <div class="card-body">
              <div class="kv-list">
                <div class="kv"><span class="k">影像所见</span><span class="v">${App.esc(st.findings || '待填写')}</span></div>
                <div class="kv"><span class="k">影像诊断</span><span class="v strong">${App.esc(st.impression || '待填写')}</span></div>
              </div>
            </div>
          </div>
          <div class="card" style="margin-top:14px">
            <div class="card-head"><h3>上传影像文件</h3></div>
            <div class="card-body">
              <input type="file" id="file" accept="image/*" multiple>
              <div class="hint small" style="margin-top:6px">支持 JPG / PNG，上传后自动归档到影像库并更新幅数</div>
            </div>
          </div>
        </div>
      </div>`,
      footer: `<button class="btn" data-close>关闭</button>
        <button class="btn btn-danger" id="del-study">删除检查</button>`
    });
    const body = modal.body;
    body.querySelectorAll('.img-card').forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.dataset.del) return;
        const img = body.querySelector('#big');
        if (img) img.src = ins[Number(c.dataset.idx)].url;
      });
    });
    body.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', async e => {
        e.stopPropagation();
        if (!await App.confirm('删除该影像文件？')) return;
        await App.api.delete(`/api/imaging/instances/${b.dataset.del}`);
        App.toast('已删除', 'ok');
        modal.close(); this.openStudy(id); App.refresh();
      });
    });
    body.querySelector('#file').addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        const b64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(',')[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        await App.api.post(`/api/imaging/studies/${id}/instances`, {
          content: b64, ext: (f.name.split('.').pop() || 'jpg').toLowerCase(), note: f.name
        });
      }
      App.toast(`已上传 ${files.length} 幅影像`, 'ok');
      modal.close(); this.openStudy(id); App.refresh();
    });
    body.querySelector('#edit-report').addEventListener('click', async () => {
      await App.form({
        title: '编辑影像报告',
        fields: [
          { name: 'findings', label: '影像所见', type: 'textarea', value: st.findings },
          { name: 'impression', label: '影像诊断', type: 'textarea', value: st.impression },
          { name: 'status', label: '状态', type: 'select', value: st.status, options: ['已登记', '检查中', '已完成', '已报告'] }
        ],
        onSubmit: async v => {
          await App.api.put(`/api/imaging/studies/${id}`, v);
          App.toast('报告已保存', 'ok');
          modal.close(); this.openStudy(id);
        }
      });
    });
    modal.body.parentElement.querySelector('#del-study').addEventListener('click', async () => {
      if (!await App.confirm('删除该检查及其全部影像文件？')) return;
      await App.api.delete(`/api/imaging/studies/${id}`);
      App.toast('已删除', 'ok');
      document.querySelector('#modal-root .mask').remove();
      App.refresh();
    });
  }
});
