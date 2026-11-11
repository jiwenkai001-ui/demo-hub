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

    root.querySelector('#kw').addEventListener('keydown', e => { if (e.key === 'Enter') root.querySelector('#search').click(); });
    if (arg && (!this._studyModal || !this._studyModal.root.isConnected || this._studyId !== Number(arg))) await this.openStudy(Number(arg));
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
    App.bindTable(listEl, { rows: data.items, onRow: r => this.openStudy(r.id).catch(e => App.toast(e.message, 'err')) });
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
        { name: 'visit_id', label: '关联就诊（计入该次账单）', type: 'select', options: [{ value: '', label: '不关联就诊' }] },
        { name: 'doctor_id', label: '申请医生', type: 'select',
          options: doctors.items.map(d => ({ value: d.id, label: d.name })) },
        { name: 'modality', label: '检查类型', type: 'select', value: 'DR',
          options: ['DR', 'X光', 'CR', 'B超', '彩超', 'CT', 'MRI', '内窥镜'] },
        { name: 'body_part', label: '检查部位', type: 'select', value: '腹部',
          options: ['腹部', '胸部', '四肢', '头颅', '脊柱', '骨盆', '心脏', '消化道'] },
        { name: 'performed_by', label: '操作技师', value: '周雨薇' },
        { name: 'status', label: '状态', type: 'select', value: '已登记', options: ['已登记', '检查中'] }
      ],
      onOpen: m => {
        const pet = m.body.querySelector('[name="pet_id"]'), visit = m.body.querySelector('[name="visit_id"]'), save = m.root.querySelector('[data-save]'); let version = 0;
        const sync = async () => { const turn = ++version; save.disabled = true; visit.disabled = true; try { const rows = await App.api.get('/api/emr/visits?pet_id=' + pet.value + '&page_size=200'); if (turn !== version) return; visit.innerHTML = '<option value="">不关联就诊</option>' + rows.items.filter(r => r.status !== '已取消').map(r => `<option value="${r.id}">${App.esc(r.visit_no)} · ${App.fmt.date(r.visited_at)} · ${App.esc(r.status)}</option>`).join(''); } catch (error) { App.toast(error.message, 'err'); } finally { if (turn === version) { visit.disabled = false; save.disabled = false; } } };
        pet.addEventListener('change', sync); sync();
      },
      onSubmit: async v => {
        const st = await App.api.post('/api/imaging/studies', v);
        App.toast('检查已登记', 'ok');
        App.refresh();
        this.openStudy(st.id);
      }
    });
  },

  async openStudy(id, selectedIndex) {
    const token = this._studyToken = (this._studyToken || 0) + 1;
    let st;
    try { st = await App.api.get(`/api/imaging/studies/${id}`); }
    catch (error) { App.toast(error.message, 'err'); return; }
    if (token !== this._studyToken) return;
    if (this._studyModal && this._studyModal.root.isConnected) this._studyModal.close();
    const ins = st.instances || [];
    const modal = App.modal({
      title: `影像阅片 · ${st.modality} ${st.body_part}`,
      width: 'xwide',
      onClose: () => { if (this._studyModal === modal) this._studyModal = null; },
      body: `
      <div class="grid study-layout">
        <div class="card">
          <div class="card-head"><h3>阅片器</h3>
            <span class="sub">${App.esc(st.pet ? st.pet.name : '')} · ${ins.length} 幅</span></div>
          <div class="card-body">
            <div class="viewer" id="viewer" style="position:relative;overflow:hidden;touch-action:none;min-height:260px">
              ${ins.length ? `<img src="${App.esc(ins[0].url)}" id="big" alt="${App.esc(st.pet ? st.pet.name : '')}检查影像" style="transition:transform .12s;user-select:none" draggable="false">` : '<div class="empty">尚无影像文件，请在右侧上传</div>'}
            </div>
            ${ins.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px" aria-label="阅片工具">
              <button class="btn btn-sm" data-viewer="prev" aria-label="上一幅">←</button><span id="image-position" class="muted small"></span><button class="btn btn-sm" data-viewer="next" aria-label="下一幅">→</button>
              <button class="btn btn-sm" data-viewer="zoom-out" aria-label="缩小">−</button><span class="muted small" id="zoom-level">100%</span><button class="btn btn-sm" data-viewer="zoom-in" aria-label="放大">＋</button>
              <button class="btn btn-sm" data-viewer="rotate">旋转</button><button class="btn btn-sm" data-viewer="reset">复位</button><button class="btn btn-sm" data-viewer="fullscreen">全屏</button><button class="btn btn-sm" data-viewer="download">原图下载</button>
              <button class="btn btn-sm" id="cp-open-analysis">标注 / 角度 / 保存测量</button><button class="btn btn-sm" data-viewer="measure">像素测距</button><button class="btn btn-sm" data-viewer="calibrate" disabled>标尺校准</button>
            </div><div class="hint small" style="margin-top:7px">放大后可拖动；此处为临时像素测距。需要保存标注、角度或使用DICOM像素间距时，请打开“标注 / 角度 / 保存测量”。</div><div class="hint small" id="measurement-result" aria-live="polite"></div>` : ''}
            <div class="img-grid" style="margin-top:12px">
              ${ins.map((i, idx) => `
                <div class="img-card" data-idx="${idx}" tabindex="0" role="button" aria-label="查看第${idx + 1}幅影像">
                  <img src="${App.esc(i.url)}" alt="影像缩略图${idx + 1}">
                  <div class="img-meta">#${i.instance_no} · ${i.width}×${i.height} · ${i.size_kb}KB
                    <button class="btn btn-sm" data-del="${i.id}" style="float:right;color:#fecaca;background:#7f1d1d;border-color:#991b1b;padding:0 5px">删除</button></div>
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
                ${st.visit ? `<dt>关联病历</dt><dd>${App.esc(st.visit.visit_no)}</dd>` : ''}
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
              <button class="btn btn-sm" id="cp-dicom-import-open" style="margin-bottom:10px">导入原始 DICOM（有限格式）</button><input type="file" id="file" accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" multiple>
              <div class="hint small" style="margin-top:6px">支持 JPG / PNG，上传后自动归档到影像库并更新幅数</div>
              <div class="hint small" id="upload-progress" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>`,
      footer: `<button class="btn" data-close>关闭</button>
        ${st.visit_id ? `<button class="btn" id="study-visit">查看病历</button>` : ''}<button class="btn btn-danger" id="del-study">删除检查</button>`
    });
    this._studyModal = modal; this._studyId = id;
    const body = modal.body;
    let index = Math.min(Math.max(Number(selectedIndex) || 0, 0), Math.max(ins.length - 1, 0)), zoom = 1, rotation = 0, dx = 0, dy = 0;
    let measuring = false, points = [], pixelDistance = 0, mmPerPixel = null;
    const clearMeasurement = () => { measuring = false; points = []; pixelDistance = 0; mmPerPixel = null; body.querySelector('#measure-overlay')?.remove(); const result = body.querySelector('#measurement-result'); if (result) result.textContent = ''; const measure = body.querySelector('[data-viewer="measure"]'); if (measure) measure.textContent = '像素测距'; const calibrate = body.querySelector('[data-viewer="calibrate"]'); if (calibrate) calibrate.disabled = true; };
    const transform = () => { const image = body.querySelector('#big'); if (image) image.style.transform = `translate(${dx}px,${dy}px) rotate(${rotation}deg) scale(${zoom})`; const label = body.querySelector('#zoom-level'); if (label) label.textContent = Math.round(zoom * 100) + '%'; };
    const choose = n => {
      if (!ins.length) return; clearMeasurement(); index = (n + ins.length) % ins.length; zoom = 1; rotation = dx = dy = 0;
      body.querySelector('#big').src = ins[index].url; body.querySelector('#image-position').textContent = `${index + 1} / ${ins.length}`;
      body.querySelectorAll('.img-card').forEach((c, i) => { c.style.outline = i === index ? '2px solid var(--primary)' : ''; c.setAttribute('aria-pressed', String(i === index)); });
      body.querySelectorAll('[data-viewer="prev"],[data-viewer="next"]').forEach(b => { b.disabled = ins.length < 2; }); transform();
    };
    const reload = async () => {
      modal.close(); await this.openStudy(id, index);
      const root = document.querySelector('#view[data-view="imaging"]'); if (root) await this.load(root);
    };
    const guarded = action => async event => { try { await action(event); } catch (error) { App.toast(error.message || '操作失败，请重试', 'err'); } };
    body.querySelector('#cp-dicom-import-open').onclick=guarded(()=>ClinicalPlus.importDicom(id,reload));
    if(ins.length)body.querySelector('#cp-open-analysis').onclick=guarded(()=>ClinicalPlus.imageAnalysis(ins[index].id));
    if (ins.length) choose(index);
    body.querySelectorAll('[data-viewer]').forEach(button => button.addEventListener('click', guarded(async () => {
      const action = button.dataset.viewer;
      if (['zoom-in','zoom-out','rotate','reset'].includes(action)) clearMeasurement();
      if (action === 'prev') choose(index - 1); else if (action === 'next') choose(index + 1);
      else if (action === 'zoom-in') { zoom = Math.min(4, zoom + .25); transform(); }
      else if (action === 'zoom-out') { zoom = Math.max(.25, zoom - .25); transform(); }
      else if (action === 'rotate') { rotation = (rotation + 90) % 360; transform(); }
      else if (action === 'reset') { zoom = 1; rotation = dx = dy = 0; transform(); }
      else if (action === 'fullscreen') { if (document.fullscreenElement) await document.exitFullscreen(); else await body.querySelector('#viewer').closest('.card').requestFullscreen(); }
      else if (action === 'download') { const a = document.createElement('a'); a.href = ins[index].url; a.download = ins[index].file_name || '影像-' + (index + 1) + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); }
      else if (action === 'measure') { clearMeasurement(); measuring = true; zoom = 1; rotation = dx = dy = 0; transform(); button.textContent = '重新测距'; body.querySelector('#measurement-result').textContent = '在图片上依次选择两个点，按原图像素计算距离。'; }
      else if (action === 'calibrate') { const measured = pixelDistance; await App.form({ title: '按已知标尺校准', tip: '刚测线段必须是图片中已知长度的标尺。校准仅适用于当前图片，并不代表已验证的医学测量。', fields: [{ name: 'known_mm', label: '刚测线段的实际长度（mm）', type: 'number', min: .001, max: 10000, step: '.001', required: true }], onSubmit: values => { if (!Number.isFinite(Number(values.known_mm)) || Number(values.known_mm) <= 0 || measured <= 0) throw new Error('请输入有效标尺长度'); mmPerPixel = Number(values.known_mm) / measured; points = []; pixelDistance = 0; body.querySelector('#measure-overlay')?.remove(); measuring = true; body.querySelector('[data-viewer="calibrate"]').disabled = true; body.querySelector('#measurement-result').textContent = '已按用户标尺校准。请再选择两个测量点；切换图片或缩放会清除校准。'; } }); }
    })));
    const viewer = body.querySelector('#viewer'); let drag = null;
    viewer.addEventListener('pointerdown', event => { if (measuring || !ins.length || zoom <= 1) return; drag = { x: event.clientX - dx, y: event.clientY - dy }; viewer.setPointerCapture(event.pointerId); viewer.style.cursor = 'grabbing'; });
    viewer.addEventListener('click', event => {
      if (!measuring || !ins.length) return;
      const img = body.querySelector('#big'), bounds = img.getBoundingClientRect(), frame = viewer.getBoundingClientRect();
      if (!img.naturalWidth || event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      if (points.length === 2) { points = []; body.querySelector('#measure-overlay')?.remove(); }
      points.push({ x: (event.clientX - bounds.left) * img.naturalWidth / bounds.width, y: (event.clientY - bounds.top) * img.naturalHeight / bounds.height, sx: event.clientX - frame.left, sy: event.clientY - frame.top });
      body.querySelector('#measure-overlay')?.remove();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'measure-overlay'; svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      if (points.length === 2) { const line = document.createElementNS(svg.namespaceURI, 'line'); ['x1','y1','x2','y2'].forEach((key,i) => line.setAttribute(key,[points[0].sx,points[0].sy,points[1].sx,points[1].sy][i])); line.setAttribute('stroke','#5eead4'); line.setAttribute('stroke-width','2'); svg.append(line); }
      points.forEach(point => { const dot = document.createElementNS(svg.namespaceURI,'circle'); dot.setAttribute('cx',point.sx); dot.setAttribute('cy',point.sy); dot.setAttribute('r','4'); dot.setAttribute('fill','#5eead4'); svg.append(dot); }); viewer.append(svg);
      if (points.length === 2) { pixelDistance = Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y); body.querySelector('#measurement-result').textContent = pixelDistance.toFixed(2)+' px'+(mmPerPixel ? ' · '+(pixelDistance*mmPerPixel).toFixed(2)+' mm（用户标尺校准）' : '（未校准，无物理长度）'); body.querySelector('[data-viewer="calibrate"]').disabled = pixelDistance <= 0; }
      else body.querySelector('#measurement-result').textContent = '已选择第一个点，请选择第二个点。';
    });
    viewer.addEventListener('pointermove', event => { if (drag) { dx = event.clientX - drag.x; dy = event.clientY - drag.y; transform(); } });
    const stopDrag = () => { drag = null; viewer.style.cursor = zoom > 1 ? 'grab' : ''; }; viewer.addEventListener('pointerup', stopDrag); viewer.addEventListener('pointercancel', stopDrag);
    body.querySelectorAll('.img-card').forEach(c => {
      c.addEventListener('click', e => {
        if (e.target.closest('[data-del]')) return;
        choose(Number(c.dataset.idx));
      });
      c.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === c) { event.preventDefault(); choose(Number(c.dataset.idx)); } });
    });
    body.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', guarded(async e => {
        e.stopPropagation();
        if (!await App.confirm('删除该影像文件？')) return;
        await App.api.delete(`/api/imaging/instances/${b.dataset.del}`);
        App.toast('已删除', 'ok');
        await reload();
      }));
    });
    body.querySelector('#file').addEventListener('change', guarded(async e => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const input = e.target, progress = body.querySelector('#upload-progress'); let saved = 0; input.disabled = true;
      try { for (const f of files) {
        if (!/\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name) || (f.type && !f.type.startsWith('image/'))) throw new Error('请选择 JPG、PNG 等有效影像图片');
        if (f.size > 12 * 1024 * 1024) throw new Error('单幅影像不能超过 12MB');
        progress.textContent = `正在上传 ${saved + 1} / ${files.length}：${f.name}`;
        const b64 = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(',')[1]);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        await App.api.post(`/api/imaging/studies/${id}/instances`, {
          content: b64, ext: (f.name.split('.').pop() || 'jpg').toLowerCase(), note: f.name
        });
        saved++;
      } App.toast(`已上传 ${saved} 幅影像`, 'ok'); }
      catch (error) { progress.textContent = (saved ? `已上传 ${saved} 幅；` : '') + error.message; App.toast(progress.textContent, 'err'); }
      finally { input.disabled = false; input.value = ''; if (saved) await reload(); }
    }));
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
          await reload();
        }
      });
    });
    const visitButton = modal.root.querySelector('#study-visit'); if (visitButton) visitButton.addEventListener('click', () => { modal.close(); App.go('visits', st.visit_id); });
    modal.body.parentElement.querySelector('#del-study').addEventListener('click', guarded(async () => {
      if (!await App.confirm('删除该检查及其全部影像文件？未收款账单中的对应影像费用将同步撤销；已收款项目需先退费处理。')) return;
      await App.api.delete(`/api/imaging/studies/${id}`);
      App.toast('已删除', 'ok');
      modal.close(); if (location.hash === '#/imaging/' + id) history.replaceState(null, '', '#/imaging');
      App.refresh();
    }));
  }
});
