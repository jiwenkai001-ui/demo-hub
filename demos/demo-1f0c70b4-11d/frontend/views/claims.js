/* Pet medical claims: offline workflow, estimates and local attachments. */
(function () {
  'use strict';
  const api = App.api, esc = App.esc, icon = App.icon, base = '/api/claims', cases = base + '/claims', policies = base + '/policies';
  const tabs = [['overview', '报销工作台', 'dashboard'], ['claims', '报销案件', 'file'], ['policies', '宠物保单', 'paw'], ['guide', '材料与流程', 'box']];
  const colors = { 草稿: 'gray', 院内审核: 'blue', 待补件: 'warn', 保险审核: 'violet', 待赔付: 'teal', 已赔付: 'ok', 已驳回: 'danger', 已撤回: 'gray', 保障中: 'ok', 有效: 'ok', 已到期: 'gray', 未生效: 'warn' };
  const statuses = ['草稿', '院内审核', '待补件', '保险审核', '待赔付', '已赔付', '已驳回', '已撤回'];
  const steps = [['建档备件', '选定已结清账单与对应保单，核对费用与材料'], ['院内审核', '核实病历、费用明细与结算凭证'], ['保险审核', '按演示条款复核保障与赔付上限'], ['赔付登记', '记录模拟凭证与日期，留存完整流转']];
  const materialNames = ['宠物身份', '保单凭证', '病历与诊断', '费用清单', '结算凭证', '检验影像', '收款账户'];
  const generated = ['病历与诊断', '费用清单', '结算凭证', '检验影像'];
  const actions = {
    submit: ['提交院内审核', '请确认资料、费用与保单归属。提交后由院内核对。', '提交说明'],
    hospital_pass: ['模拟院内审核通过', '核对宠物病历、费用和凭证后，移交保险审核。', '院内审核意见'],
    request_material: ['通知补件', '写清缺少的材料或需要核实的问题。补件后返回原审核阶段。', '补件说明'],
    resubmit: ['补件后重新提交', '确认要求的材料已补齐，案件将返回原处理阶段。', '补件说明'],
    approve: ['模拟保险审核通过', '请填写核定金额，金额不得超过当前演示预估。', '保险审核意见'],
    reject: ['驳回案件', '写清驳回原因，便于后续复核。', '驳回原因'],
    withdraw: ['撤回案件', '撤回后停止当前流转，并保留原记录。', '撤回原因'],
    pay: ['登记模拟赔付', '登记演示凭证和日期，系统不会发起资金划转。', '登记说明'],
    reverse: ['冲销模拟赔付', '冲销后案件变为已撤回，原登记及冲销原因都会保留；需要重新申请时可重开草稿。', '冲销原因'],
    reopen: ['重新打开草稿', '案件恢复为草稿，原材料与处理记录可继续查看。', '重开原因']
  };
  const flow = {
    草稿: ['submit', 'withdraw'], 院内审核: ['hospital_pass', 'request_material', 'reject', 'withdraw'],
    待补件: ['resubmit', 'withdraw'], 保险审核: ['approve', 'request_material', 'reject', 'withdraw'],
    待赔付: ['pay', 'withdraw'], 已赔付: ['reverse'], 已驳回: ['reopen'], 已撤回: ['reopen']
  };
  const money = value => '¥' + App.fmt.money(value);
  const date = value => App.fmt.date(value);
  const datetime = value => App.fmt.dtime(value);
  const rate = value => `${Number(value || 0)}%`;
  const badge = value => App.badge(value, colors[value] || 'gray');
  const list = value => Array.isArray(value) ? value : [];
  const show = (value, fallback = '—') => esc(value == null || value === '' ? fallback : value);
  const title = (a, b) => `<div><strong>${show(a)}</strong>${b ? `<div class="muted small">${esc(b)}</div>` : ''}</div>`;
  const empty = message => `<div class="empty">${icon('inbox')}${esc(message)}</div>`;
  const block = (heading, description, content, extra = '') => `<section class="card claims-section"><div class="card-head"><div><h3>${esc(heading)}</h3>${description ? `<p>${esc(description)}</p>` : ''}</div>${extra ? `<div class="right">${extra}</div>` : ''}</div>${content}</section>`;
  const btn = (label, attr, klass = '', glyph = '') => `<button type="button" class="btn ${klass}" ${attr}>${glyph ? icon(glyph) : ''}${esc(label)}</button>`;
  const options = (rows, current, placeholder) => (placeholder ? [{ value: '', label: placeholder }, ...rows] : rows).map(row => {
    const { value, label } = typeof row === 'string' ? { value: row, label: row } : row;
    return `<option value="${esc(value)}"${String(current) === String(value) ? ' selected' : ''}>${esc(label)}</option>`;
  }).join('');
  const params = obj => new URLSearchParams(Object.entries(obj).filter(([, value]) => value !== '' && value != null)).toString();
  const buttonGroup = (container, selector, action) => container.querySelectorAll(selector).forEach(button => button.addEventListener('click', async ev => {
    if (button.dataset.claimsBusy) return;
    button.dataset.claimsBusy = '1';
    try { await action(button, ev); } catch (error) { App.toast(error.message || '操作失败，请重试', 'err'); }
    finally { delete button.dataset.claimsBusy; }
  }));
  const link = href => /^https:\/\//i.test(href || '') ? esc(href) : '';
  const claimNo = r => r.claim_no || r.case_no || r.no;
  const paid = r => r.payouts ? list(r.payouts).reduce((sum, p) => sum + Number(p.amount || 0), 0) : r.paid_amount ?? r.payout_amount ?? (r.status === '已赔付' ? r.approved_amount : 0);
  const estimate = r => r.calculation?.estimate ?? r.estimated_amount ?? r.estimate ?? 0;
  const displayAmount = r => r.status === '已赔付' ? (r.net_payout_amount ?? paid(r)) : r.status === '待赔付' ? r.approved_amount : estimate(r);
  const policyLabel = p => p.plan_name || p.name || p.title || '演示保单';
  const petLabel = p => [p.pet_name || p.name || p.pet?.name, p.owner_name || p.pet?.owner_name].filter(Boolean).join(' · ');
  const statusForPolicy = p => p.status || (p.end_date < Demo.date() ? '已到期' : p.start_date > Demo.date() ? '未生效' : '保障中');
  const textFile = content => new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
  const dataPattern = /^data:(application\/pdf|image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i;
  const fileTypes = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
  function fileBlob(data) {
    const match = dataPattern.exec(data || '');
    if (!match) throw new Error('此附件格式不支持预览或下载');
    return new Blob([Uint8Array.from(atob(match[2]), ch => ch.charCodeAt(0))], { type: match[1].toLowerCase() });
  }
  function download(blob, name) {
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = String(name || '材料').replace(/[\\/:*?"<>|]/g, '_'); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const readFile = file => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = () => reject(new Error('无法读取附件')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file);
  });
  function pathUnderModule() { return location.hash === '#/claims' || location.hash.startsWith('#/claims/'); }
  function stageIndex(record) {
    const at = record.status === '待补件' ? record.resume_status || record.return_status || record.previous_status || '院内审核' : record.status;
    return ({ 草稿: 0, 院内审核: 1, 保险审核: 2, 待赔付: 3, 已赔付: 4 })[at] ?? -1;
  }
  function stepList(record) {
    const index = record ? stageIndex(record) : -1;
    return `<ol class="claims-steps">${steps.map(([label, help], i) => `<li class="${index > i ? 'done' : index === i ? 'current' : ''}"${index === i ? ' aria-current="step"' : ''}><span>${index > i ? icon('check') : '0' + (i + 1)}</span><div><strong>${label}</strong><small>${help}</small></div></li>`).join('')}</ol>`;
  }
  function stat(label, value) { return `<div><dt>${esc(label)}</dt><dd>${show(value)}</dd></div>`; }
  function selectField(name, label, rows, value, extra = {}) { return { name, label, type: 'select', options: rows, value, ...extra }; }
  function compactTable(root, rows, columns, onRow, noData) {
    root.innerHTML = App.table({ rows, columns, onRow, empty: noData });
    if (onRow) App.bindTable(root, { rows, onRow });
  }
  function formBody(titleText, tip, fields, opts = {}) { return { title: titleText, tip, fields, width: 'wide', columns: 2, ...opts }; }
  function noteBox(text, tone = '') { return `<div class="claims-note ${tone}">${icon(tone === 'warning' ? 'alert' : 'file')}<span>${esc(text)}</span></div>`; }

  const view = {
    title: '宠物医疗报销', group: '经营中心', icon: 'wallet', subtitle: '保险理赔案件 · 保单 · 材料',
    argLabels: Object.fromEntries(tabs.map(t => [t[0], t[1]])),
    state: { keyword: '', status: '', page: 1, policyKeyword: '', policyStatus: '', policyPage: 1 },
    owned: new Set(),
    track(modal) { this.owned.forEach(old => { if (!old.root.isConnected) this.owned.delete(old); }); this.owned.add(modal); return modal; },
    async render(root, arg) {
      const detail = /^\d+$/.test(arg || '') ? Number(arg) : 0, invoice = /^invoice-\d+$/.test(arg || '') ? Number(arg.slice(8)) : 0;
      const tab = detail || invoice ? 'claims' : tabs.some(t => t[0] === arg) ? arg : 'overview';
      if (detail || invoice) history.replaceState(null, '', '#/claims/claims');
      root.innerHTML = `<div class="claims-page"><header class="claims-hero"><div><div class="claims-kicker">${icon('paw')} 医疗保障 · CLAIMS DESK</div><h2>宠物医疗报销</h2><p>从已结清账单整理材料，跟进审核、补件与赔付登记。</p></div><div class="claims-hero-tools"><span class="claims-demo">演示流程 · 不产生真实赔付</span>${btn('新建报销案件', 'id="claims-new"', 'btn-primary', 'plus')}</div></header><nav class="claims-tabs" aria-label="报销模块">${tabs.map(([key, label, glyph]) => btn(label, `data-claims-tab="${key}"${key === tab ? ' aria-current="page"' : ''}`, 'claims-tab ' + (key === tab ? 'selected' : ''), glyph)).join('')}</nav><div id="claims-content"><div class="skeleton">加载报销业务…</div></div></div>`;
      buttonGroup(root, '[data-claims-tab]', b => App.go('claims', b.dataset.claimsTab));
      buttonGroup(root, '#claims-new', () => this.claimForm());
      await this[tab](root.querySelector('#claims-content'));
      if (!root.isConnected || !pathUnderModule()) return;
      if (detail) await this.open(detail);
      if (invoice) this.claimForm(invoice).catch(error => App.toast(error.message, 'err'));
    },
    async overview(root) {
      const data = await api.get(base + '/overview'), k = data.kpi || data;
      const s = data.stages || {}, stageCount = status => Array.isArray(s) ? Number(s.find(x => (x.status || x.name || x.label) === status)?.count || 0) : Number(s[status] || 0);
      const metrics = [['待院审', k.hospital_review ?? k.pending_hospital ?? stageCount('院内审核') ?? k.pending, '等待核对病历及费用', 'file', '院内审核', 'blue'], ['待补件', k.need_material ?? stageCount('待补件'), '跟进材料补充', 'box', '待补件', 'amber'], ['待赔付', k.approved ?? k.pending_payout ?? stageCount('待赔付'), '登记模拟赔付凭证', 'clock', '待赔付', 'violet'], ['已赔付金额', k.paid_amount || 0, '模拟赔付净额', 'wallet', '已赔付', 'green']];
      const queue = ['草稿', '院内审核', '待补件', '保险审核', '待赔付', '已赔付'];
      const recent = list(data.recent || data.items);
      const max = Math.max(1, ...queue.map(stageCount));
      root.innerHTML = `<div class="claims-kpis">${metrics.map(([label, value, help, glyph, status, theme], i) => `<button type="button" class="claims-kpi ${theme}" data-claims-status="${status}"><span class="claims-kpi-icon">${icon(glyph)}</span><span><span>${label}</span><strong>${i === 3 ? money(value) : App.fmt.int(value)}${i === 3 ? '' : '<small>件</small>'}</strong><small>${help}</small></span></button>`).join('')}</div><div class="claims-overview-grid">${block('阶段队列', '按当前状态查看案件', `<div class="claims-queue">${queue.map(status => `<button type="button" data-claims-status="${status}" class="claims-queue-row"><span>${status}</span><span class="claims-meter"><i style="width:${Math.round(100 * stageCount(status) / max)}%"></i></span><strong>${stageCount(status)}</strong><span aria-hidden="true">›</span></button>`).join('')}</div>`)}${block('最近案件', '快速查看办理记录', `<div class="claims-recent">${recent.length ? recent.slice(0, 6).map(r => `<button type="button" class="claims-case-row" data-claims-id="${Number(r.id)}"><span class="claims-kpi-icon">${icon('file')}</span><span>${title(r.pet_name || r.pet?.name || '宠物医疗案件', [claimNo(r), r.owner_name].filter(Boolean).join(' · '))}</span>${badge(r.status)}<span class="claims-case-money">${money(displayAmount(r))}</span></button>`).join('') : empty('还没有报销案件，可从已结清账单发起。')}</div>`, btn('全部案件 →', 'data-claims-status=""', 'btn-sm'))}</div>${block('报销办理流程', '院内核实、保险审核和赔付登记均为本地演示', stepList(), btn('查看材料指引', 'id="claims-view-guide"', 'btn-sm'))}`;
      buttonGroup(root, '[data-claims-status]', b => { Object.assign(this.state, { status: b.dataset.claimsStatus, keyword: '', page: 1 }); App.go('claims', 'claims'); });
      buttonGroup(root, '[data-claims-id]', b => this.open(b.dataset.claimsId));
      buttonGroup(root, '#claims-view-guide', () => App.go('claims', 'guide'));
    },
    filter(root, values, choices, onSearch, onClear) {
      const form = root.querySelector('.claims-filter'), field = form.querySelector('input'), select = form.querySelector('select');
      select.innerHTML = options(choices, values.status, '全部状态'); field.value = values.keyword;
      form.addEventListener('submit', event => { event.preventDefault(); onSearch(field.value.trim(), select.value); });
      select.addEventListener('change', () => onSearch(field.value.trim(), select.value));
      buttonGroup(form, '[data-clear]', () => onClear());
    },
    async claims(root) {
      const s = this.state, data = await api.get(cases + '?' + params({ keyword: s.keyword, status: s.status, page: s.page, page_size: 12 })), rows = list(data.items);
      root.innerHTML = block('报销案件', '查找申请、核对材料及处理流转', `<form class="toolbar claims-filter"><input id="claims-keyword" aria-label="搜索案件" placeholder="案件编号、宠物、主人或账单"><select id="claims-status" aria-label="案件状态"></select><button type="submit" class="btn btn-sm">${icon('search')}查询</button>${btn('清除', 'data-clear', 'btn-sm')}</form><div id="claims-list"></div><div class="claims-pager"></div>`);
      this.filter(root, s, statuses, (keyword, status) => { Object.assign(s, { keyword, status, page: 1 }); App.refresh(); }, () => { Object.assign(s, { keyword: '', status: '', page: 1 }); App.refresh(); });
      compactTable(root.querySelector('#claims-list'), rows, [
        { label: '案件编号', render: r => title(claimNo(r), r.invoice_no) }, { label: '宠物 / 主人', render: r => title(r.pet_name, r.owner_name) },
        { label: '事故日期', render: r => title(date(r.incident_date), r.incident_type) }, { label: '预估 / 核定', align: 'right', render: r => title(money(estimate(r)), r.approved_amount != null ? '核定 ' + money(r.approved_amount) : '') },
        { label: '案件状态', render: r => badge(r.status) }, { label: '更新', render: r => datetime(r.updated_at || r.created_at) },
        { label: '操作', render: r => btn('查看', `data-open-claim="${Number(r.id)}"`, 'btn-sm') }
      ], r => this.open(r.id), '未找到符合条件的报销案件');
      buttonGroup(root, '[data-open-claim]', b => this.open(b.dataset.openClaim));
      const pager = root.querySelector('.claims-pager'); pager.innerHTML = App.pager(data.meta); App.bindPager(pager, page => { s.page = page; App.refresh(); });
    },
    async policies(root) {
      const s = this.state, data = await api.get(policies + '?' + params({ keyword: s.policyKeyword, status: s.policyStatus, page: s.policyPage, page_size: 12 })), rows = list(data.items);
      root.innerHTML = block('宠物保单', '管理演示条款、有效期和赔付额度', `<form class="toolbar claims-filter"><input id="claims-policy-keyword" aria-label="搜索保单" placeholder="保单号、宠物或方案"><select id="claims-policy-status" aria-label="保单状态"></select><button type="submit" class="btn btn-sm">${icon('search')}查询</button>${btn('清除', 'data-clear', 'btn-sm')}</form><div id="claims-policy-list"></div><div class="claims-pager"></div>`, btn('登记演示保单', 'id="claims-policy-new"', 'btn-primary btn-sm', 'plus'));
      this.filter(root, { keyword: s.policyKeyword, status: s.policyStatus }, ['保障中', '未生效', '已到期'], (keyword, status) => { Object.assign(s, { policyKeyword: keyword, policyStatus: status, policyPage: 1 }); App.refresh(); }, () => { Object.assign(s, { policyKeyword: '', policyStatus: '', policyPage: 1 }); App.refresh(); });
      compactTable(root.querySelector('#claims-policy-list'), rows, [
        { label: '保单 / 方案', render: p => title(policyLabel(p), p.policy_no) }, { label: '宠物 / 主人', render: p => title(p.pet_name, p.owner_name) }, { label: '有效期', render: p => `${date(p.start_date)} 至 ${date(p.end_date)}` },
        { label: '赔付参数', render: p => title(rate(p.reimbursement_rate) + ' · 免赔 ' + money(p.deductible), '单次 ' + money(p.per_claim_limit)) }, { label: '状态', render: p => badge(statusForPolicy(p)) },
        { label: '操作', render: p => btn('查看', `data-open-policy="${Number(p.id)}"`, 'btn-sm') }
      ], p => this.openPolicy(p.id), '未找到符合条件的保单');
      buttonGroup(root, '#claims-policy-new', () => this.policyForm());
      buttonGroup(root, '[data-open-policy]', b => this.openPolicy(b.dataset.openPolicy));
      const pager = root.querySelector('.claims-pager'); pager.innerHTML = App.pager(data.meta); App.bindPager(pager, page => { s.policyPage = page; App.refresh(); });
    },
    async guide(root) {
      const d = await api.get(base + '/guide');
      const source = list(d.sources || d.references), sections = list(d.sections);
      const cards = sections.map(r => {
        const lines = list(r.items || r.points || r.content), content = !lines.length && typeof (r.description || r.content || r.text) === 'string' ? `<p>${esc(r.description || r.content || r.text)}</p>` : '';
        return block(r.title || r.name || r.label || '报销资料', r.subtitle || '', `<div class="claims-guide-body">${content}${lines.length ? `<ul>${lines.map(line => `<li>${esc(typeof line === 'object' ? [line.title || line.label || line.name, line.description || line.content || line.text].filter(Boolean).join('：') : line)}</li>`).join('')}</ul>` : ''}</div>`);
      });
      root.innerHTML = `${noteBox('演示参数用于说明核对与计算过程。实际保障范围、材料、报案时限、赔付结果以签发保单和保险公司通知为准。', 'warning')}${block('办理步骤', '建议在开始前核对账单与保单是否属于同一只宠物', stepList())}<div class="claims-guide-grid">${cards.join('') || block('常用材料', '按保单及案情准备', `<div class="claims-guide-body"><ul>${materialNames.map(m => `<li>${m}</li>`).join('')}</ul></div>`)}</div>${block('规则参考与来源', '原始资料可点击查看，具体条款可能随产品与保单变化', `<div class="claims-source-list">${source.filter(r => link(r.url || r.href)).map(r => `<a href="${link(r.url || r.href)}" target="_blank" rel="noopener noreferrer"><span class="claims-kpi-icon">${icon('file')}</span><span><strong>${show(r.title || r.name || r.label)}</strong><small>${show(r.publisher || r.source || r.summary || r.description || r.note, '')}</small></span><span aria-hidden="true">↗</span></a>`).join('') || empty('暂无可用的外部资料链接')}</div>`)}`;
    },
    async policyForm(record, prior) {
      const token = this._policyFormToken = (this._policyFormToken || 0) + 1;
      const o = await api.get(base + '/options'), p = record || {}, petRows = list(o.pets).map(pet => ({ value: pet.id, label: petLabel(pet) }));
      if (token !== this._policyFormToken || !pathUnderModule()) return;
      if (!petRows.length) throw new Error('请先在宠物档案中建档');
      const day = Demo.date(), end = Demo.later(365);
      const numberField = (name, label, value, min, max, step) => ({ name, label, type: 'number', value, min, max, step, required: true });
      const fields = [selectField('pet_id', '关联宠物', petRows, p.pet_id, { required: true }), { name: 'policy_no', label: '演示保单号', value: p.policy_no, required: true, placeholder: '例如 DEMO-PET-001' },
        { name: 'insurer', label: '保险机构（演示）', value: p.insurer || '演示承保机构', required: true }, { name: 'plan_name', label: '演示方案名称', value: p.plan_name || '宠物医疗保障示例', required: true },
        { name: 'start_date', label: '生效日期', type: 'date', value: p.start_date || day, required: true }, { name: 'end_date', label: '截止日期', type: 'date', value: p.end_date || end, required: true },
        numberField('waiting_days', '疾病等待期（天）', p.waiting_days ?? 30, 0, 365, '1'), selectField('hospital_type', '就医机构类型', ['定点', '非定点'], p.hospital_type || '定点', { required: true }),
        numberField('deductible', '每次免赔额（元）', p.deductible ?? 100, 0, 1000000, '0.01'), numberField('reimbursement_rate', '赔付比例（%）', p.reimbursement_rate ?? 70, 0, 100, '0.01'),
        numberField('per_claim_limit', '单次赔付上限（元）', p.per_claim_limit ?? 1000, 0.01, 1000000, '0.01'), numberField('annual_limit', '年度赔付限额（元）', p.annual_limit ?? 5000, 0.01, 1000000, '0.01'),
        { name: 'note', label: '条款备注', type: 'textarea', span: 2, value: p.note, placeholder: '例如：仅作演示，不对应任何在售保险产品。' }];
      return App.form(formBody(p.id ? '编辑演示保单' : '登记演示保单', '这里登记的是示例参数。已有案件按创建时保单快照核验，修改本保单不会改写旧案件；保单已关联案件时不能更换宠物。实际理赔须核对签发保单。', fields, { submitText: '保存演示保单', onOpen: modal => {
        this.track(modal);
        const start = modal.body.querySelector('[name="start_date"]'), finish = modal.body.querySelector('[name="end_date"]');
        const sync = () => { finish.min = start.value; }; start.addEventListener('change', sync); sync();
      }, onSubmit: async values => {
        if (values.end_date < values.start_date) throw new Error('保单截止日期不得早于生效日期');
        if (Number(values.per_claim_limit) > Number(values.annual_limit)) throw new Error('单次赔付上限不得超过年度限额');
        const saved = await (p.id ? api.put(policies + '/' + p.id, values) : api.post(policies, values));
        if (prior) prior.close(); App.toast('演示保单已保存', 'ok'); if (pathUnderModule()) App.refresh();
        this.openPolicy(saved.id || p.id).catch(error => App.toast(error.message, 'err'));
      } }));
    },
    async openPolicy(id) {
      const token = this._policyToken = (this._policyToken || 0) + 1;
      const p = await api.get(policies + '/' + Number(id));
      if (token !== this._policyToken || !pathUnderModule()) return;
      if (this._policyModal?.root.isConnected) this._policyModal.close();
      const m = App.modal({ title: '演示保单 · ' + (p.policy_no || ''), width: 'wide', body: `<div class="claims-modal-content"><div class="claims-detail-head"><div><span class="claims-kicker">POLICY PARAMETERS</span><h3>${show(policyLabel(p))}</h3><p>${show(p.insurer)} · ${show(petLabel(p))}</p></div>${badge(statusForPolicy(p))}</div><dl class="claims-facts">${stat('有效期', date(p.start_date) + ' 至 ' + date(p.end_date))}${stat('疾病等待期', (p.waiting_days || 0) + ' 天')}${stat('机构类型', p.hospital_type)}${stat('免赔额', money(p.deductible))}${stat('赔付比例', rate(p.reimbursement_rate))}${stat('单次限额', money(p.per_claim_limit))}${stat('年度限额', money(p.annual_limit))}${stat('年度剩余额度', p.annual_remaining != null ? money(p.annual_remaining) : '按实际赔付计算')}</dl>${p.note ? `<div class="claims-prose">${show(p.note)}</div>` : ''}${noteBox('此为演示保单参数，不对应任何在售保险产品。')}</div>`, footer: `<button class="btn" data-close>关闭</button>${btn('编辑演示保单', 'data-policy-edit', 'btn-primary', 'edit')}` });
      this._policyModal = this.track(m); buttonGroup(m.root, '[data-policy-edit]', () => this.policyForm(p, m));
    },
    async claimForm(invoiceId, record, prior) {
      const token = this._claimFormToken = (this._claimFormToken || 0) + 1;
      const d = await api.get(base + '/options'), r = record || {}, invoices = list(d.invoices).slice(), id = Number(invoiceId || r.invoice_id || 0);
      if (id && !invoices.some(row => Number(row.id) === id)) {
        const invoice = await api.get('/api/bill/invoices/' + id);
        if (!record && invoice.status !== '已结清') throw new Error('仅已结清账单可发起宠物医疗报销');
        invoices.unshift(invoice);
      }
      if (token !== this._claimFormToken || !pathUnderModule()) return;
      if (!invoices.length) throw new Error('暂无可发起报销的已结清账单，请先完成收费结算');
      const invoiceLabel = x => [x.invoice_no, x.pet_name || x.pet?.name, x.owner_name || x.owner?.name, money(x.paid_amount ?? x.payable)].filter(Boolean).join(' · ');
      const choices = invoices.map(x => ({ value: x.id, label: invoiceLabel(x) })), selectId = id || choices[0]?.value;
      const fields = [selectField('invoice_id', '① 选择已结清账单', choices, selectId, { required: true, span: 2 }), { name: '_summary', label: '账单关联信息', type: 'static', value: '正在读取账单…', span: 2 },
        selectField('policy_id', '② 选择同一宠物保单', [], r.policy_id, { required: true, span: 2 }), selectField('incident_type', '事故类型', ['疾病', '意外'], r.incident_type || '疾病', { required: true }),
        { name: 'incident_date', label: '事故日期', type: 'date', value: r.incident_date || '', max: Demo.date(), required: true },
        { name: 'description', label: '③ 病情与申请说明', type: 'textarea', required: true, span: 2, value: r.description, placeholder: '填写发病或意外经过、就诊情况、申请事由' },
        { name: 'payee_name', label: '收款人姓名', value: r.payee_name || '', required: true }, { name: 'payee_account', label: '演示收款账号', value: '', required: !record, placeholder: r.payee_account_masked || r.account_masked || '请使用虚构账号' }];
      return App.form(formBody(r.id ? '编辑报销资料' : '新建宠物医疗报销', (r.status === '待补件' ? '修改事故、描述、收款信息或除外费用后，重新提交将回到院内审核；仅补充附件则返回原审核阶段。' : '关联账单后会带入诊疗与收费信息。') + ' 此处只登记模拟收款信息，请勿录入真实银行卡号。', fields, { submitText: r.id ? '保存报销资料' : '创建草稿', onOpen: m => {
        this.track(m); m.root.classList.add('claims-compact-form');
        const inv = m.body.querySelector('[name="invoice_id"]'), pol = m.body.querySelector('[name="policy_id"]'), summary = m.body.querySelector('[name="policy_id"]').closest('.field').previousElementSibling, dateInput = m.body.querySelector('[name="incident_date"]'), payee = m.body.querySelector('[name="payee_name"]'), save = m.root.querySelector('[data-save]');
        let version = 0, lastAuto = '', dateAuto = '';
        if (id) inv.disabled = true;
        const sync = async () => {
          const token = ++version; save.disabled = true; pol.disabled = true;
          const staticText = summary.lastElementChild; staticText.textContent = '正在读取账单与保单…';
          try {
            const invoice = await api.get('/api/bill/invoices/' + inv.value);
            const preloaded = list(d.policies), selected = preloaded.filter(x => Number(x.pet_id) === Number(invoice.pet_id));
            const related = selected.length ? selected : list((await api.get(policies + '?' + params({ pet_id: invoice.pet_id, page_size: 200 }))).items).filter(x => Number(x.pet_id) === Number(invoice.pet_id));
            if (token !== version || !m.root.isConnected) return;
            pol.innerHTML = options(related.map(x => ({ value: x.id, label: `${policyLabel(x)} · ${x.policy_no} · ${date(x.start_date)} 至 ${date(x.end_date)}` })), r.policy_id, related.length ? '请选择同一宠物的保单' : '该宠物尚未登记保单');
            const visit = invoice.visit || {}, owner = invoice.owner?.name || invoice.owner_name || '', pet = invoice.pet?.name || invoice.pet_name || '';
            staticText.innerHTML = `<div class="claims-invoice-preview"><div><strong>${show(pet)} · ${show(owner)}</strong><small>${show(visit.diagnosis || visit.chief_complaint || '暂无诊断摘要')}</small></div><div><strong>${money(invoice.paid_amount ?? invoice.payable)}</strong><small>${list(invoice.items).length} 项 · ${date(invoice.paid_at || invoice.created_at)}</small></div></div>`;
            if (!payee.value || payee.value === lastAuto) payee.value = owner; lastAuto = owner;
            const when = date(visit.visited_at || invoice.paid_at || invoice.created_at);
            if (!dateInput.value || dateInput.value === dateAuto) dateInput.value = when === '-' ? Demo.date() : when; dateAuto = dateInput.value;
            if (related.length === 1 && !pol.value) pol.value = String(related[0].id);
            save.disabled = !related.length; pol.disabled = !related.length || !!record;
            if (!related.length) {
              const add = document.createElement('button'); add.type = 'button'; add.className = 'btn btn-sm'; add.textContent = '先登记保单'; add.addEventListener('click', () => { m.close(); App.go('claims', 'policies'); }); staticText.append(add);
            }
          } catch (error) { if (token === version) staticText.textContent = error.message || '读取失败，请重新选择账单'; }
        };
        inv.addEventListener('change', sync); sync();
      }, onSubmit: async values => {
        if (!values.payee_account && r.id) delete values.payee_account;
        const result = await (r.id ? api.put(cases + '/' + r.id, values) : api.post(cases, values));
        if (prior) prior.close(); App.toast(r.id ? '报销资料已保存' : '报销草稿已创建', 'ok'); if (pathUnderModule()) App.refresh();
        this.open(result.id || r.id).catch(error => App.toast(error.message, 'err'));
      } }));
    },
    async open(id) {
      id = Number(id); const token = this._detailToken = (this._detailToken || 0) + 1;
      const r = await api.get(cases + '/' + id);
      if (token !== this._detailToken || !pathUnderModule()) return;
      if (this._detail?.root.isConnected) this._detail.close();
      const editable = ['草稿', '待补件'].includes(r.status), calc = r.calculation || {}, checks = list(r.checks), missing = checks.filter(c => c.required && !c.passed), can = flow[r.status] || [];
      const p = r.policy || {}, invoice = r.invoice || {}, owner = r.owner || {}, pet = r.pet || {};
      const warning = (missing.length ? `${missing.length} 项核验待完善：${missing.map(c => c.label).join('、')}` : '当前资料核验已通过，可继续本阶段办理。') + (r.status === '待补件' ? ` 重新提交将返回${r.resume_status === '保险审核' ? '保险审核' : '院内审核'}。修改事故、描述、收款信息或除外费用将重新进行院内审核；仅补充附件返回原阶段。` : '');
      const next = can.find(x => ['submit', 'hospital_pass', 'resubmit', 'approve', 'pay', 'reopen'].includes(x));
      const footer = `<button class="btn" data-close>关闭</button>${btn('导出材料清单', 'data-export-claim', '', 'file')}${editable ? btn('编辑资料', 'data-edit-claim', '', 'edit') : ''}${can.map(action => btn(actions[action][0], `data-claim-action="${action}"${['submit', 'hospital_pass', 'resubmit', 'approve', 'pay'].includes(action) && missing.length ? ' disabled title="请先完成资料核验"' : ''}`, action === next ? 'btn-primary' : ['reject', 'reverse'].includes(action) ? 'btn-danger' : '')).join('')}`;
      const m = App.modal({ title: '宠物医疗报销 · ' + (claimNo(r) || ''), width: 'xwide', body: `<div class="claims-modal-content"><div class="claims-detail-head"><div><span class="claims-kicker">MEDICAL CLAIM · ${show(claimNo(r))}</span><h3>${show(pet.name || r.pet_name)}的医疗报销</h3><p>${show(owner.name || r.owner_name)} · ${show(r.incident_type)} · 事故日期 ${date(r.incident_date)}</p></div><div>${badge(r.status)}<strong class="claims-detail-amount">${money(r.status === '已赔付' ? paid(r) : r.status === '待赔付' ? r.approved_amount : calc.estimate)}</strong><small>${r.status === '已赔付' ? '已登记模拟赔付' : r.status === '待赔付' ? '模拟核定金额' : '按演示参数预估'}</small></div></div>${stepList(r)}${noteBox(warning, missing.length ? 'warning' : 'success')}<div class="claims-detail-grid"><div class="claims-main-column">${block('费用核对与预估', '优惠按项目原金额分摊；勾选除外项目后保存核对。', `<div class="claims-charge-table">${App.table({ rows: list(r.items), columns: [{ label: '费用项目', render: it => title(it.name, it.item_type) }, { label: '原金额', align: 'right', render: it => money(it.amount) }, { label: '合规金额', align: 'right', render: it => money(it.eligible_amount) }, { label: '除外', render: it => `<label class="claims-check-label"><input type="checkbox" data-excluded="${Number(it.id)}" ${it.excluded ? 'checked' : ''} ${editable ? '' : 'disabled'} aria-label="排除${esc(it.name)}"><span>除外</span></label>` }] })}</div><div class="claims-calculation"><dl>${stat('医疗实付', money(calc.medical_amount))}${stat('合规费用', money(calc.eligible_amount))}${stat('除外费用', money(calc.excluded_amount))}${stat('单次免赔', money(calc.deductible))}${stat('赔付比例', rate(calc.rate))}${stat('单次限额', money(calc.per_claim_limit))}${stat('年度剩余', money(calc.annual_remaining))}</dl><div class="claims-formula"><span>预估 = min［max（合规费用 − 免赔额，0）× 比例，单次限额，年度剩余］</span><strong id="claims-live-estimate">${money(calc.estimate)}</strong></div><div class="hint" id="claims-estimate-help">仅为演示估算，最终结果以承保公司审核及保险合同为准。</div></div>`, editable ? btn('保存费用核对', 'data-save-exclusions disabled', 'btn-sm') : '')}${block('报销材料', '真实附件保存在当前浏览器；自动快照不替代正式发票、保单或结算凭证。', this.materialList(r, editable), editable ? btn('添加材料', 'data-add-material', 'btn-primary btn-sm', 'plus') : '')}${block('完整流转记录', '所有审批、补件和赔付操作均保留记录', this.historyList(r))}</div><aside class="claims-aside">${block('资料核验', `${checks.filter(c => c.passed).length} / ${checks.length} 项已核对`, `<ul class="claims-checks">${checks.map(c => `<li class="${c.passed ? 'passed' : c.required ? 'missing' : 'optional'}"><span>${icon(c.passed ? 'check' : c.required ? 'alert' : 'file')}</span><div><strong>${show(c.label)}${c.required ? '' : '<small>按需</small>'}</strong><p>${show(c.message, c.passed ? '已核对' : '待完善')}</p></div></li>`).join('')}</ul>`)}${block('关联资料', '可跳转查看原始业务记录', `<div class="claims-related">${btn('账单 ' + (invoice.invoice_no || ''), 'data-claims-go="billing" data-claims-arg="' + Number(r.invoice_id) + '"', 'claims-related-button', 'receipt')}${invoice.visit_id ? btn('病历 ' + (invoice.visit?.visit_no || ''), 'data-claims-go="visits" data-claims-arg="' + Number(invoice.visit_id) + '"', 'claims-related-button', 'stethoscope') : ''}${btn('宠物与主人档案', 'data-claims-go="patients"', 'claims-related-button', 'paw')}${btn('保单 ' + (p.policy_no || ''), 'data-view-policy', 'claims-related-button', 'file')}</div><dl class="claims-facts compact">${stat('就诊诊断', invoice.diagnosis || invoice.visit?.diagnosis)}${stat('事故说明', r.description)}${stat('保单有效期', date(p.start_date) + ' 至 ' + date(p.end_date))}${stat('演示等待期', (p.waiting_days || 0) + ' 天')}${stat('收款人', r.payee_name)}${stat('收款账号', r.payee_account_masked || r.account_masked || r.payee_account)}</dl>`)}${block('模拟赔付流水', '赔付不计入医院营收，不改写医疗账单实付', this.payoutList(r))}</aside></div></div>`, footer, onClose: () => { if (this._detail === m) { this._detail = null; this._detailId = null; } } });
      this.track(m); m.root.classList.add('claims-detail-modal'); this._detail = m; this._detailId = id;
      buttonGroup(m.root, '[data-claim-action]', b => this.actionForm(r, b.dataset.claimAction, m));
      buttonGroup(m.root, '[data-edit-claim]', () => this.claimForm(null, r, m));
      buttonGroup(m.root, '[data-add-material]', () => this.materialForm(r, m));
      buttonGroup(m.root, '[data-export-claim]', () => this.export(r));
      buttonGroup(m.root, '[data-view-policy]', () => this.openPolicy(p.id));
      buttonGroup(m.root, '[data-claims-go]', b => { if (b.dataset.claimsGo === 'patients') return this.patientSummary(r); m.close(); App.go(b.dataset.claimsGo, b.dataset.claimsArg); });
      buttonGroup(m.root, '[data-preview-material]', b => this.previewMaterial(list(r.materials).find(x => Number(x.id) === Number(b.dataset.previewMaterial))));
      buttonGroup(m.root, '[data-download-material]', b => this.downloadMaterial(list(r.materials).find(x => Number(x.id) === Number(b.dataset.downloadMaterial))));
      buttonGroup(m.root, '[data-delete-material]', async b => { if (!await App.confirm('删除此材料？删除记录将保留在案件流转中。')) return; b.disabled = true; try { await api.del(base + '/materials/' + b.dataset.deleteMaterial); App.toast('材料已删除', 'ok'); await this.open(id); } finally { b.disabled = false; } });
      buttonGroup(m.root, '[data-generate-material]', async b => { b.disabled = true; try { await api.post(cases + '/' + id + '/materials', { type: 'generated', category: b.dataset.generateMaterial }); App.toast('关联资料快照已生成', 'ok'); await this.open(id); } finally { b.disabled = false; } });
      const save = m.root.querySelector('[data-save-exclusions]');
      if (save) {
        const boxes = Array.from(m.root.querySelectorAll('[data-excluded]')), initial = boxes.filter(b => b.checked).map(b => Number(b.dataset.excluded)).sort().join(',');
        const sync = () => {
          const excluded = boxes.filter(b => b.checked).map(b => Number(b.dataset.excluded)), changed = excluded.slice().sort().join(',') !== initial, chargeFactor = Number(invoice.total_amount) > 0 ? Math.min(1, Number(invoice.payable) / Number(invoice.total_amount)) : 0;
          const eligible = Math.min(Number(invoice.paid_amount), list(r.items).reduce((sum, it) => sum + (excluded.includes(Number(it.id)) ? 0 : Number(it.amount) * chargeFactor), 0));
          const est = Math.max(0, Math.min(Math.max(eligible - Number(calc.deductible), 0) * Number(calc.rate) / 100, Number(calc.per_claim_limit), Number(calc.annual_remaining)));
          save.disabled = !changed;
          m.root.querySelectorAll('[data-claim-action]').forEach(button => { if (['submit', 'hospital_pass', 'resubmit', 'approve', 'pay'].includes(button.dataset.claimAction)) button.disabled = changed || !!missing.length; });
          m.root.querySelector('#claims-live-estimate').textContent = money(est); m.root.querySelector('#claims-estimate-help').textContent = changed ? '费用选择尚未保存，请先保存费用核对再提交。' : '仅为演示估算，最终结果以承保公司审核及保险合同为准。';
        };
        boxes.forEach(box => box.addEventListener('change', sync));
        buttonGroup(m.root, '[data-save-exclusions]', async b => { b.disabled = true; try { await api.put(cases + '/' + id, { excluded_items: boxes.filter(box => box.checked).map(box => Number(box.dataset.excluded)) }); App.toast(r.status === '待补件' ? '费用已更新，重提后将回到院内审核' : '费用核对已保存', 'ok'); await this.open(id); if (pathUnderModule()) App.refresh(); } finally { b.disabled = false; } });
      }
    },
    async patientSummary(record) {
      const [pet, owner] = await Promise.all([api.get('/api/emr/pets/' + Number(record.pet_id)), api.get('/api/emr/owners/' + Number(record.owner_id))]);
      if (!pathUnderModule()) return;
      this.track(App.modal({ title: '关联宠物与主人档案', width: 'wide', body: `<div class="claims-modal-content"><div class="claims-detail-head"><div><span class="claims-kicker">PATIENT RECORD</span><h3>${show(pet.name)}</h3><p>${show(pet.species)} · ${show(pet.breed)} · ${show(pet.gender)}</p></div>${icon('paw')}</div><dl class="claims-facts">${stat('主人', owner.name)}${stat('联系电话', owner.phone)}${stat('宠物生日', date(pet.birth_date))}${stat('体重', pet.weight ? pet.weight + ' kg' : '未记录')}${stat('芯片号', pet.chip_no)}${stat('过敏史', pet.allergies || '未记录')}${stat('绝育', pet.sterilized ? '已绝育' : '未绝育')}${stat('病历数量', list(pet.visits).length + ' 条')}</dl>${noteBox('以上为关联档案的当前摘要，案件材料和已保存的保单快照可在原案件中查看。')}</div>` }));
    },
    materialList(record, editable) {
      const rows = list(record.materials), present = rows.map(m => m.category), missing = generated.filter(cat => !present.includes(cat) && (cat !== '检验影像' || list(record.checks).some(c => c.label === '检验影像资料' && c.required)));
      return `<div class="claims-materials">${rows.length ? rows.map(m => `<article class="claims-material"><span class="claims-material-icon">${icon(m.mime?.startsWith('image/') ? 'image' : 'file')}</span><div class="claims-material-main"><strong>${show(m.name)}</strong><small>${show(m.category)} · ${m.type === 'generated' ? '自动关联快照 · 非正式凭证' : m.is_demo || m.type === 'demo' ? '虚构演示说明' : '已上传附件'} · ${Number(m.size_bytes || 0) < 1024 ? Number(m.size_bytes || 0) + ' B' : Math.ceil(Number(m.size_bytes) / 1024) + ' KB'}</small>${m.note ? `<small>${show(m.note)}</small>` : ''}</div><div class="claims-material-tools">${btn('预览', `data-preview-material="${Number(m.id)}"`, 'btn-sm')}${btn('下载', `data-download-material="${Number(m.id)}"`, 'btn-sm')}${editable ? btn('删除', `data-delete-material="${Number(m.id)}"`, 'btn-sm claims-danger') : ''}</div></article>`).join('') : empty('暂无材料，请添加所需资料')}${editable && missing.length ? `<div class="claims-generate"><span>补充关联快照</span>${missing.map(cat => btn('生成' + cat, `data-generate-material="${cat}"`, 'btn-sm')).join('')}</div>` : ''}</div>`;
    },
    historyList(record) {
      return `<ol class="claims-history">${list(record.history).map(h => `<li><span class="claims-history-dot"></span><div><div><strong>${show(h.action)}</strong><time>${datetime(h.created_at)}</time></div><small>${show(h.operator, '演示理赔专员')}${h.from_status ? ' · ' + esc(h.from_status) + ' → ' + esc(h.to_status || h.from_status) : ''}${h.amount != null ? ' · ' + money(h.amount) : ''}</small><p>${show(h.comment, '')}</p></div></li>`).join('') || '<li>暂无流转记录</li>'}</ol>`;
    },
    payoutList(record) {
      const rows = list(record.payouts);
      return `<div class="claims-payouts">${rows.length ? rows.map(p => `<div><span><strong>${show(p.payout_no)}</strong><small>${show(p.kind)} · ${date(p.paid_at)}${p.comment ? ' · ' + esc(p.comment) : ''}</small></span><b class="${Number(p.amount) < 0 ? 'negative-value' : ''}">${money(p.amount)}</b></div>`).join('') : '<p class="muted small">暂无赔付流水。核定后可登记模拟赔付。</p>'}</div>`;
    },
    async actionForm(record, action, prior) {
      const [label, tip, opinion] = actions[action];
      const fields = [];
      if (action === 'approve') fields.push({ name: 'approved_amount', label: '模拟核定金额（元）', type: 'number', min: 0.01, max: Number(record.calculation?.estimate || 0), step: '0.01', value: record.calculation?.estimate, required: true, span: 2, hint: '不得超过本次演示预估 ' + money(record.calculation?.estimate) });
      if (action === 'pay') fields.push({ name: 'payout_no', label: '模拟赔付凭证号', required: true, placeholder: '例如 DEMO-PAYOUT-001' }, { name: 'paid_at', label: '模拟赔付日期', type: 'date', required: true, value: Demo.date(), min: date(record.submitted_at || record.created_at), max: Demo.date() }, { name: '_amount', label: '本次登记金额', type: 'static', value: money(record.approved_amount), span: 2 });
      fields.push({ name: 'comment', label: opinion, type: 'textarea', required: true, span: 2, placeholder: '填写本次处理的意见、依据或原因' });
      return App.form(formBody(label, tip, fields, { submitText: label, onOpen: m => this.track(m), onSubmit: async values => {
        if (action === 'approve' && Number(values.approved_amount) > Number(record.calculation?.estimate)) throw new Error('核定金额不得超过本次演示预估');
        await api.post(cases + '/' + record.id + '/action', { ...values, action });
        if (prior) prior.close(); App.toast('案件流转已更新', 'ok'); if (pathUnderModule()) { App.refresh(); this.open(record.id).catch(error => App.toast(error.message, 'err')); }
      } }));
    },
    async materialForm(record) {
      let uploaded = null;
      return App.form(formBody('添加报销材料', '支持PNG、JPG和PDF，单份不超过3MB，每案最多15份、合计12MB。演示说明会明确标记为虚构材料。', [
        selectField('category', '材料类别', materialNames, materialNames.find(cat => !list(record.materials).some(m => m.category === cat)) || materialNames[0], { required: true }),
        selectField('type', '提供方式', [{ value: 'upload', label: '上传真实文件' }, { value: 'demo', label: '添加虚构演示说明' }], 'upload'),
        { name: 'name', label: '材料名称', placeholder: '不填则使用文件名或类别名称', span: 2 },
        { name: 'note', label: '材料说明', type: 'textarea', span: 2, placeholder: '说明材料用途；演示说明请写明内容' }
      ], { submitText: '保存材料', onOpen: m => {
        this.track(m);
        const mode = m.body.querySelector('[name="type"]'), note = m.body.querySelector('[name="note"]'), wrapper = document.createElement('div');
        wrapper.className = 'field claims-file-field'; wrapper.style.gridColumn = 'span 2'; wrapper.innerHTML = '<label for="claims-attachment-file">选择PNG、JPG或PDF附件 *</label><input type="file" id="claims-attachment-file" accept="image/png,image/jpeg,application/pdf"><div class="hint" id="claims-upload-hint">仅保存在当前浏览器。</div>';
        note.closest('.field').before(wrapper); const input = wrapper.querySelector('input');
        const sync = () => { wrapper.hidden = mode.value !== 'upload'; input.disabled = mode.value !== 'upload'; note.required = mode.value === 'demo'; }; mode.addEventListener('change', sync); sync();
        input.addEventListener('change', () => { uploaded = input.files[0] || null; wrapper.querySelector('.hint').textContent = uploaded ? uploaded.name + ' · ' + Math.ceil(uploaded.size / 1024) + ' KB' : '仅保存在当前浏览器。'; });
      }, onSubmit: async values => {
        const body = { type: values.type, category: values.category, name: values.name, note: values.note };
        if (values.type === 'upload') {
          if (!uploaded) throw new Error('请选择需要上传的附件');
          const ext = uploaded.name.split('.').pop().toLowerCase(), mime = fileTypes[ext];
          if (!['application/pdf', 'image/png', 'image/jpeg'].includes(mime) || uploaded.type && uploaded.type !== mime) throw new Error('请选择有效的PNG、JPG或PDF文件');
          if (uploaded.size > 3 * 1024 * 1024) throw new Error('单份附件不能超过3MB');
          body.name = values.name || uploaded.name; body.mime = mime; body.data_url = await readFile(uploaded);
          if (!dataPattern.test(body.data_url)) throw new Error('附件格式无效');
        } else if (!String(values.note || '').trim()) throw new Error('请填写虚构演示材料的具体说明');
        await api.post(cases + '/' + record.id + '/materials', body); App.toast('材料已保存', 'ok'); if (pathUnderModule()) await this.open(record.id);
      } }));
    },
    previewMaterial(material) {
      if (!material) throw new Error('材料已变更，请刷新案件');
      let url = '', content;
      if (material.data_url) {
        const blob = fileBlob(material.data_url); url = URL.createObjectURL(blob);
        content = blob.type.startsWith('image/') ? `<img class="claims-preview-image" src="${esc(url)}" alt="${esc(material.name)}">` : `<iframe class="claims-preview-pdf" src="${esc(url)}" title="${esc(material.name)}"></iframe>`;
      } else content = `<pre class="claims-preview-text">${show(material.content || material.note, '暂无文本内容')}</pre>`;
      const m = App.modal({ title: material.name, width: 'wide', body: `<div class="claims-modal-content">${material.is_demo || material.type !== 'upload' ? noteBox('这是虚构演示材料或自动资料快照，不是正式凭证。', 'warning') : ''}${content}</div>`, footer: `<button class="btn" data-close>关闭</button>${btn('下载材料', 'data-preview-download', 'btn-primary')}`, onClose: () => { if (url) URL.revokeObjectURL(url); } });
      this.track(m); buttonGroup(m.root, '[data-preview-download]', () => this.downloadMaterial(material));
    },
    downloadMaterial(material) {
      if (!material) throw new Error('材料不存在');
      const attachment = material.data_url, name = material.name || material.category || '报销材料';
      download(attachment ? fileBlob(attachment) : textFile(material.content || material.note || ''), attachment ? name : /\.txt$/i.test(name) ? name : name + '.txt');
    },
    export(record) {
      const p = record.policy || {}, c = record.calculation || {}, i = record.invoice || {};
      const lines = ['宠物医疗报销 · 演示材料包清单', '此清单仅用于演示和资料整理，不是正式票据、保单或理赔结论。', '', '案件编号：' + (claimNo(record) || ''), '当前状态：' + record.status, '宠物：' + (record.pet?.name || record.pet_name || ''), '主人：' + (record.owner?.name || record.owner_name || ''), '账单：' + (i.invoice_no || ''), '诊断：' + (i.diagnosis || i.visit?.diagnosis || ''), '事故：' + record.incident_type + ' / ' + record.incident_date, '申请说明：' + (record.description || ''), '收款人：' + (record.payee_name || ''), '收款账号（仅末4位）：' + (record.payee_account_masked || record.payee_account || ''), '', '保单及演示参数', '方案：' + policyLabel(p) + ' / ' + (p.policy_no || ''), '有效期：' + date(p.start_date) + ' 至 ' + date(p.end_date), '等待期：' + (p.waiting_days || 0) + ' 天', '免赔额：' + money(c.deductible), '赔付比例：' + rate(c.rate), '单次限额：' + money(c.per_claim_limit), '年度剩余：' + money(c.annual_remaining), '', '费用明细（已按优惠分摊）', ...list(record.items).map(it => (it.excluded ? '[除外] ' : '[纳入] ') + it.name + ' × ' + it.qty + '，原金额 ' + money(it.amount) + '，合规金额 ' + money(it.eligible_amount)), '实际支付：' + money(c.medical_amount), '合规费用：' + money(c.eligible_amount), '除外金额：' + money(c.excluded_amount), '公式：min(max(合规费用－免赔额,0) × 报销比例, 单次限额, 年度剩余)', '演示预估：' + money(c.estimate), '模拟核定：' + money(record.approved_amount), '', '资料核验', ...list(record.checks).map(check => (check.passed ? '[已核对] ' : '[待完善] ') + check.label + '：' + (check.message || '')), '', '材料目录（真实附件请在案件详情逐份下载）', ...list(record.materials).map((m, index) => `${index + 1}. ${m.category} / ${m.name} / ${m.type === 'upload' ? '上传附件' : '演示快照或虚构说明'} / ${m.size_bytes || 0} B`), '', '材料文本快照', ...list(record.materials).filter(m => !m.data_url).flatMap(m => ['--- ' + m.name + ' ---', m.content || m.note || '', '']), '', '赔付流水（不计入医院收入）', ...list(record.payouts).map(p => [p.kind, p.payout_no, date(p.paid_at), money(p.amount), p.comment || ''].join(' / ')), '', '完整流转记录', ...list(record.history).map(h => [datetime(h.created_at), h.operator, h.action, [h.from_status, h.to_status].filter(Boolean).join('→'), h.comment].filter(Boolean).join(' / ')), '', '导出时间：' + Demo.now()];
      download(textFile(lines.join('\n')), (claimNo(record) || '宠物医疗报销') + '-材料包清单.txt'); App.toast('材料包清单已导出，真实附件可逐份下载', 'ok');
    }
  };
  window.addEventListener('hashchange', () => { if (!pathUnderModule()) { view._detailToken = (view._detailToken || 0) + 1; view._policyToken = (view._policyToken || 0) + 1; view._claimFormToken = (view._claimFormToken || 0) + 1; view._policyFormToken = (view._policyFormToken || 0) + 1; view.owned.forEach(modal => { if (modal.root.isConnected) modal.close(); }); } });
  App.register('claims', view);
})();
