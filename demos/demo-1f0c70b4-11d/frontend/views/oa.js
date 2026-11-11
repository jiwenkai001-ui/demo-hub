/* OA 协同办公：与医院业务共用本地数据，支持直接打开的离线演示。 */
(function () {
  'use strict';
  const e = App.esc;
  const tabs = [
    ['overview', '办公工作台', 'dashboard'], ['approvals', '审批中心', 'file'],
    ['schedule', '排班管理', 'calendar'], ['attendance', '考勤管理', 'clock'],
    ['tasks', '任务协作', 'check'], ['announcements', '通知公告', 'inbox'],
    ['documents', '制度资料', 'box'], ['staff', '员工通讯录', 'users']
  ];
  const today = () => Demo.date();
  const dateOffset = (date, days) => {
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + days); return Demo.date(d);
  };
  const monday = () => {
    const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return Demo.date(d);
  };
  const status = value => App.badge(value, ({ '待审批': 'warn', '待审核': 'warn', '审批中': 'warn', '已通过': 'ok', '已批准': 'ok', '已驳回': 'danger', '已撤回': 'gray', '待办': 'info', '待开始': 'info', '待处理': 'info', '进行中': 'primary', '已完成': 'ok', '高': 'danger', '中': 'warn', '低': 'info', '紧急': 'danger', '正常': 'ok', '在岗': 'primary', '早退': 'warn', '迟到/早退': 'danger', '请假/待核对': 'warn', '迟到': 'warn', '缺卡': 'danger', '未打卡': 'gray', '休息': 'gray', '请假': 'violet' })[value] || 'gray');
  const empty = text => '<div class="empty">' + App.icon('inbox') + e(text || '暂无记录') + '</div>';
  const safe = action => async function (ev) { try { await action.call(this, ev); } catch (error) { App.toast(error.message || '操作失败，请重试', 'err'); } };
  const opt = (values, selected, all) => (all ? '<option value="">' + e(all) + '</option>' : '') + values.map(x => '<option value="' + e(x) + '"' + (x === selected ? ' selected' : '') + '>' + e(x) + '</option>').join('');
  const recordTitle = r => '<strong>' + e(r.title) + '</strong><div class="muted small">' + e(r.approval_no || r.request_no || '') + '</div>';
  const pending = r => ['待审批', '待审核', '审批中'].includes(r.status);
  const personName = r => r.applicant_name || r.staff_name || r.name || '—';
  function download(name, content) {
    const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name.replace(/[\\/:*?"<>|]/g, '_') + '.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const OA = {
    title: 'OA 协同办公', group: '行政协同', icon: 'inbox', subtitle: '审批、排班与团队协作',
    argLabels: Object.fromEntries(tabs.map(t => [t[0], t[1]])),
    state: { tab: 'overview', kw: '', filter: '', type: '', week: monday(), attendanceDate: today() },
    people: [],
    async render(root, arg) {
      const tab = tabs.some(x => x[0] === arg) ? arg : 'overview';
      if (tab !== this.state.tab) { this.state.kw = ''; this.state.filter = ''; this.state.type = ''; }
      this.state.tab = tab;
      this.people = (await App.api.get('/api/oa/staff')).items || [];
      root.innerHTML = '<div class="oa-page"><div class="oa-heading"><div><div class="oa-eyebrow">TEAM WORKSPACE · 团队办公空间</div><h2>让每一次协作，照顾好每一份信任</h2><p>日常事务有序流转，让团队专注于生命的照护。</p></div><div class="oa-heading-actions"><span class="oa-today">' + App.icon('calendar') + e(today()) + ' · 周' + '日一二三四五六'[new Date().getDay()] + '</span><button class="btn btn-primary" id="oa-apply">' + App.icon('plus') + ' 发起申请</button></div></div>' +
        '<nav class="oa-tabs" aria-label="办公功能">' + tabs.map(x => '<button type="button" class="oa-tab tab ' + (tab === x[0] ? 'active' : '') + '" data-tab="' + x[0] + '">' + App.icon(x[2]) + '<span>' + x[1] + '</span></button>').join('') + '</nav><div id="oa-content"><div class="skeleton">正在整理办公事务…</div></div></div>';
      root.querySelectorAll('.oa-tab').forEach(b => b.addEventListener('click', () => App.go('oa', b.dataset.tab)));
      root.querySelector('#oa-apply').addEventListener('click', safe(() => this.newApproval()));
      const expenseEntry = document.createElement('button'); expenseEntry.type = 'button'; expenseEntry.className = 'btn'; expenseEntry.id = 'oa-expense-center'; expenseEntry.innerHTML = App.icon('receipt') + ' 院内费用报销';
      root.querySelector('.oa-heading-actions').prepend(expenseEntry); expenseEntry.addEventListener('click', () => App.go('expenses'));
      const content = root.querySelector('#oa-content');
      await this[tab](content);
    },
    staffOptions() { return this.people.filter(r=>App.access?.role_id===1||r.id===App.access?.staff_id).map(r => ({ value: r.id, label: r.name + ' · ' + (r.dept || r.role || '') })); },
    table(root, rows, columns, onRow, noData) {
      root.innerHTML = App.table({ rows, columns, onRow, empty: noData || '暂无记录，试试调整筛选条件' });
      if (onRow) App.bindTable(root, { rows, onRow: r => safe(() => onRow(r))() });
    },
    bindFilters(root) {
      const search = root.querySelector('#oa-search');
      if (!search) return;
      search.addEventListener('click', () => {
        const kw = root.querySelector('#oa-keyword'), filter = root.querySelector('#oa-filter'), type = root.querySelector('#oa-type');
        if (kw) this.state.kw = kw.value.trim(); if (filter) this.state.filter = filter.value; if (type) this.state.type = type.value;
        App.refresh();
      });
      root.querySelectorAll('select').forEach(el => el.addEventListener('change', () => search.click()));
      const input = root.querySelector('#oa-keyword'); if (input) input.addEventListener('keydown', ev => { if (ev.key === 'Enter') search.click(); });
    },
    async overview(root) {
      const d = await App.api.get('/api/oa/overview'), k = d.kpi || {};
      const approvals = d.approvals || [], tasks = d.tasks || [], notices = d.announcements || [];
      const cards = [
        ['待办审批', k.pending_approvals || 0, '办公申请等待处理', 'file', 'approvals', 'amber'],
        ['今日在岗', k.today_on_duty || 0, '门诊与住院协同值守', 'users', 'schedule', 'teal'],
        ['协作任务', k.open_tasks || 0, '跟进负责人及截止日', 'check', 'tasks', 'blue'],
        ['未读公告', k.unread_announcements || 0, '重要院内消息待查阅', 'inbox', 'announcements', 'violet']
      ];
      root.innerHTML = '<div class="oa-kpis">' + cards.map(c => '<button class="oa-kpi ' + c[5] + '" data-jump="' + c[4] + '"><div><span class="oa-kpi-label">' + c[0] + '</span><strong>' + c[1] + '<small>' + (c[4] === 'schedule' ? '人' : '项') + '</small></strong><span class="muted small">' + c[2] + '</span></div><span class="oa-kpi-icon">' + App.icon(c[3]) + '</span></button>').join('') + '</div>' +
        '<div class="oa-overview-grid"><section class="card"><div class="card-head"><h3>待办审批</h3><span class="badge warn">优先处理</span><button class="btn btn-sm btn-ghost oa-more" data-jump="approvals">查看全部 →</button></div><div class="oa-approval-list">' + (approvals.length ? approvals.slice(0, 5).map(r => '<button class="oa-list-row" data-approval="' + r.id + '"><span class="oa-type-icon">' + App.icon(({ '请假': 'calendar', '报销': 'wallet', '采购': 'truck', '加班': 'clock', '调班': 'refresh' })[r.type] || 'file') + '</span><span class="oa-list-main"><strong>' + e(r.title) + '</strong><small>' + e(personName(r)) + ' · ' + e(r.type) + ' · ' + App.fmt.dt(r.created_at) + '</small></span>' + (Number(r.amount) > 0 ? '<span class="oa-amount">¥' + App.fmt.money(r.amount) + '</span>' : '') + status(r.status) + '</button>').join('') : empty('所有申请已处理，辛苦了')) + '</div></section>' +
        '<section class="card"><div class="card-head"><h3>通知公告</h3><button class="btn btn-sm btn-ghost oa-more" data-jump="announcements">更多 →</button></div><div>' + (notices.length ? notices.slice(0, 4).map(r => '<button class="oa-notice-row" data-notice="' + r.id + '"><span class="oa-notice-dot ' + (r.is_read ? 'read' : '') + '"></span><span><strong>' + (r.pinned ? '<span class="oa-pin">置顶</span>' : '') + e(r.title) + '</strong><small>' + e(r.category || '院内通知') + ' · ' + App.fmt.date(r.created_at) + '</small></span></button>').join('') : empty('暂无公告')) + '</div></section>' +
        '<section class="card"><div class="card-head"><h3>团队协作</h3><span class="sub">把事情落实到人</span><button class="btn btn-sm btn-ghost oa-more" data-jump="tasks">全部任务 →</button></div><div>' + (tasks.length ? tasks.slice(0, 5).map(r => '<button class="oa-list-row" data-task="' + r.id + '"><span class="oa-task-check">' + App.icon('check') + '</span><span class="oa-list-main"><strong>' + e(r.title) + '</strong><small>' + e(r.assignee_name || '待分配') + ' · 截止 ' + App.fmt.date(r.due_date) + '</small></span>' + status(r.priority) + '</button>').join('') : empty('当前暂无待办任务')) + '</div></section>' +
        '<section class="card"><div class="card-head"><h3>常用办公</h3></div><div class="oa-shortcuts">' + [['请假申请', 'calendar', 'leave'], ['费用报销', 'wallet', 'expense'], ['采购申请', 'truck', 'purchase'], ['发布任务', 'check', 'new-task'], ['值班安排', 'clock', 'schedule'], ['制度手册', 'file', 'documents']].map(x => '<button class="oa-shortcut" data-shortcut="' + x[2] + '"><span>' + App.icon(x[1]) + '</span>' + x[0] + '</button>').join('') + '</div><div class="oa-reminder">' + App.icon('paw') + '<div><strong>交接有记录，照护有温度</strong><p>离岗前请核对住院护理、待出报告及冷链记录，完成班次交接。</p></div></div></section></div>';
      root.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => App.go('oa', b.dataset.jump)));
      root.querySelectorAll('[data-approval]').forEach(b => b.addEventListener('click', safe(() => this.approvalDetail(b.dataset.approval))));
      root.querySelectorAll('[data-notice]').forEach(b => b.addEventListener('click', safe(() => this.noticeDetail(b.dataset.notice))));
      root.querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', safe(() => this.taskForm(tasks.find(r => String(r.id) === b.dataset.task)))));
      root.querySelectorAll('[data-shortcut]').forEach(b => b.addEventListener('click', safe(() => {
        const key = b.dataset.shortcut, type = { leave: '请假', expense: '报销', purchase: '采购' }[key];
        if (key === 'expense') return App.go('expenses');
        if (type) return this.newApproval(type); if (key === 'new-task') return this.taskForm(); App.go('oa', key);
      })));
    },
    async approvals(root) {
      const s = this.state;
      const d = await App.api.get('/api/oa/approvals?status=' + encodeURIComponent(s.filter) + '&type=' + encodeURIComponent(s.type) + '&keyword=' + encodeURIComponent(s.kw));
      root.innerHTML = '<section class="card"><div class="card-head"><h3>审批记录</h3><span class="sub">申请、处理与流转记录</span><span class="right muted small">共 ' + d.items.length + ' 条</span></div><div class="toolbar"><input id="oa-keyword" placeholder="搜索申请标题 / 申请人 / 单号" value="' + e(s.kw) + '"><select id="oa-filter">' + opt(['待审批', '已通过', '已驳回', '已撤回'], s.filter, '全部状态') + '</select><select id="oa-type">' + opt(['请假', '报销', '采购', '加班', '调班'], s.type, '全部类型') + '</select><button class="btn btn-sm" id="oa-search">' + App.icon('search') + ' 查询</button></div><div id="oa-list"></div></section>';
      this.table(root.querySelector('#oa-list'), d.items, [
        { label: '申请事项', render: recordTitle }, { label: '类型', render: r => App.badge(r.type, 'info') },
        { label: '申请人', render: r => '<strong>' + e(personName(r)) + '</strong><div class="muted small">' + e(r.dept || r.applicant_dept || '') + '</div>' },
        { label: '申请金额 / 时间', render: r => Number(r.amount) > 0 ? '¥' + App.fmt.money(r.amount) : '<span class="small">' + App.fmt.dtime(r.start_at) + '<br>' + App.fmt.dtime(r.end_at) + '</span>' },
        { label: '提交时间', render: r => App.fmt.dtime(r.created_at) }, { label: '审批状态', render: r => status(r.status) },
        { label: '操作', render: () => '<span class="oa-text-link">查看详情 →</span>' }
      ], r => this.approvalDetail(r.id)); this.bindFilters(root);
    },
    async newApproval(type) {
      if (type === '报销') return App.go('expenses');
      const start = today() + 'T09:00', end = today() + 'T18:00';
      await App.form({ title: '发起办公申请', columns: 2, width: 'wide', submitText: '提交审批',
        tip: '请假、加班和调班请填写起止时间；采购请填写金额及用途。员工费用报销统一在费用中心办理。审批结果和处理意见会保留在流转记录中。采购通过后请前往进销存创建采购单并收货；调班通过后由负责人落实班次。',
        fields: [
          { name: 'type', label: '申请类型', type: 'select', options: ['请假', '采购', '加班', '调班'], value: type || '请假', hint: '员工费用报销请使用页面上方“院内费用报销”，统一提交明细、票据与审批。' },
          { name: 'applicant_id', label: '申请人', type: 'select', options: this.staffOptions(), required: true },
          { name: 'title', label: '申请标题', placeholder: '例如：护理耗材采购申请', required: true, span: 2 },
          { name: 'start_at', label: '开始时间', type: 'datetime-local', value: start },
          { name: 'end_at', label: '结束时间', type: 'datetime-local', value: end },
          { name: 'amount', label: '金额（元）', type: 'number', min: 0.01, step: '0.01', value: '', hint: '填写本次申请总额，须大于 0。' },
          { name: 'reason', label: '事由 / 费用明细', type: 'textarea', required: true, span: 2, placeholder: '说明申请原因、交接安排或采购明细，便于审批。' }
        ], onOpen: m => {
          const kind = m.body.querySelector('[name="type"]'), amount = m.body.querySelector('[name="amount"]'), start = m.body.querySelector('[name="start_at"]'), end = m.body.querySelector('[name="end_at"]');
          const update = () => {
            const financial = ['采购', '报销'].includes(kind.value);
            [start, end].forEach(el => { el.closest('.field').style.display = financial ? 'none' : ''; el.disabled = financial; el.required = !financial; });
            amount.closest('.field').style.display = financial ? '' : 'none'; amount.disabled = !financial; amount.required = financial;
            amount.closest('.field').style.gridColumn = financial ? 'span 2' : '';
            m.body.querySelector('[name="reason"]').placeholder = financial ? '请说明费用用途、数量、单价及票据或采购明细。' : '请说明起止时间、工作交接人与预约调整安排。';
            end.min = start.value;
          };
          kind.addEventListener('change', update); start.addEventListener('change', update); update();
        }, onSubmit: async values => {
          if (['采购', '报销'].includes(values.type) && !(Number(values.amount) > 0)) throw new Error('请填写大于 0 的申请金额');
          if (!['采购', '报销'].includes(values.type) && (!values.start_at || !values.end_at || values.end_at <= values.start_at)) throw new Error('请填写正确的起止时间，结束时间须晚于开始时间');
          values.start_at = values.start_at.replace('T', ' '); values.end_at = values.end_at.replace('T', ' ');
          await App.api.post('/api/oa/approvals', values); App.toast('申请已提交，等待审批', 'ok'); App.refresh();
        }
      });
    },
    async approvalDetail(id) {
      const r = await App.api.get('/api/oa/approvals/' + id), history = r.history || [];
      const linkedExpense = r.expense;
      const m = App.modal({ title: r.title, width: 'wide', body:
        '<div class="oa-detail-top">' + App.badge(r.type, 'info') + status(r.status) + '<span class="muted small">' + e(r.approval_no || r.request_no || '') + '</span></div>' +
        '<dl class="oa-detail-grid"><div><dt>申请人</dt><dd>' + e(personName(r)) + ' · ' + e(r.dept || r.applicant_dept || '') + '</dd></div><div><dt>提交时间</dt><dd>' + App.fmt.dtime(r.created_at) + '</dd></div>' +
        (Number(r.amount) > 0 ? '<div><dt>申请金额</dt><dd class="oa-detail-amount">¥' + App.fmt.money(r.amount) + '</dd></div>' : '<div><dt>开始时间</dt><dd>' + App.fmt.dtime(r.start_at) + '</dd></div><div><dt>结束时间</dt><dd>' + App.fmt.dtime(r.end_at) + '</dd></div>') + '</dl><h4 class="oa-section-label">申请事由</h4><div class="oa-prose">' + e(r.reason) + '</div><h4 class="oa-section-label">审批流转</h4><ol class="oa-timeline">' + (history.length ? history.map(h => '<li><span class="oa-timeline-dot"></span><div><strong>' + e(h.action || h.status || '提交申请') + '</strong><span class="muted small">' + e(h.operator || h.operator_name || h.actor || '') + ' · ' + App.fmt.dtime(h.created_at) + '</span><p>' + e(h.comment || '—') + '</p></div></li>').join('') : '<li><span class="oa-timeline-dot"></span><div><strong>提交申请</strong><p>' + e(personName(r)) + ' · ' + App.fmt.dtime(r.created_at) + '</p></div></li>') + '</ol>' +
        (r.conflicts && r.conflicts.length ? '<div class="oa-conflict-warning"><strong>请假日期内仍有 ' + r.conflicts.length + ' 个预约，需先处理</strong><p>' + r.conflicts.slice(0, 5).map(a => e(a.appt_no) + ' · ' + App.fmt.dtime(a.scheduled_at) + ' · ' + e(a.status)).join('<br>') + '</p><button class="btn btn-sm" data-conflict>前往预约管理调整</button></div>' : '') +
        (pending(r) ? '<div class="field"><label>审批意见（驳回时必填）</label><textarea id="oa-approval-comment" placeholder="请填写处理意见或补充说明"></textarea></div>' : ''),
        footer: '<button class="btn" data-close>关闭</button>' + (pending(r) ? '<button class="btn" data-action="withdraw">撤回申请</button><button class="btn btn-danger" data-action="reject">驳回</button><button class="btn btn-primary" data-action="approve" ' + (r.conflicts && r.conflicts.length ? 'disabled title="请先处理预约冲突"' : '') + '>' + App.icon('check') + ' 同意申请</button>' : '')
      });
      const conflict = m.root.querySelector('[data-conflict]'); if (conflict) conflict.addEventListener('click', () => { m.close(); App.go('appointments'); });
      if (r.type === '报销' && (linkedExpense || ['待审批', '已通过'].includes(r.status))) {
        const box = document.createElement('div'); box.className = 'billing-claim-link';
        box.innerHTML = '<div><strong>院内费用报销</strong><div class="muted small">' + (linkedExpense ? e(linkedExpense.request_no) + ' · ' + e(linkedExpense.status) : '补齐费用明细、票据和收款信息后，按科室、财务及大额加签流程办理。') + '</div></div><button class="btn btn-sm" id="oa-to-expense">' + (linkedExpense ? '查看费用报销' : '转入费用报销') + '</button>';
        m.body.prepend(box);
        box.querySelector('button').addEventListener('click', () => { m.close(); App.go('expenses', linkedExpense ? linkedExpense.id : 'oa-' + id); });
        if (linkedExpense) { m.root.querySelectorAll('[data-action]').forEach(b => b.remove()); m.root.querySelector('#oa-approval-comment')?.closest('.field')?.remove(); }
      }
      m.root.querySelectorAll('[data-action]').forEach(b=>{if(!App.canAction('POST','/api/oa/approvals/'+r.id+'/action',{action:b.dataset.action}))b.remove();});
      m.root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', safe(async () => {
        const action = b.dataset.action, comment = m.root.querySelector('#oa-approval-comment').value.trim();
        if (action === 'reject' && !comment) { App.toast('请先填写驳回原因', 'err'); return; }
        b.disabled = true;
        try { await App.api.post('/api/oa/approvals/' + id + '/action', { action, comment }); m.close(); App.toast('审批记录已更新', 'ok'); App.refresh(); }
        finally { b.disabled = false; }
      })));
    },
    async schedule(root) {
      const week = this.state.week, dates = Array.from({ length: 7 }, (_, i) => dateOffset(week, i));
      const d = await App.api.get('/api/oa/schedule?week=' + week), rows = d.items || [];
      root.innerHTML = '<section class="card"><div class="card-head"><h3>员工周排班</h3><span class="sub">门诊与住院护理有序衔接</span><div class="right"><button class="btn btn-sm" id="oa-prev">← 上一周</button><button class="btn btn-sm" id="oa-current">本周</button><button class="btn btn-sm" id="oa-next">下一周 →</button></div></div><div class="oa-schedule-toolbar"><strong>' + week + ' — ' + dates[6] + '</strong><div class="oa-shift-legend"><span class="oa-shift morning">早班</span><span class="oa-shift middle">晚班</span><span class="oa-shift night">夜班</span><span class="oa-shift off">休息</span><span class="oa-shift leave">请假</span></div><button class="btn btn-primary btn-sm" id="oa-edit-schedule">' + App.icon('edit') + ' 安排班次</button></div><div class="oa-schedule-scroll"><table class="oa-schedule"><thead><tr><th>团队成员</th>' + dates.map((x, i) => '<th class="' + (x === today() ? 'is-today' : '') + '"><span>周' + '一二三四五六日'[i] + '</span><small>' + x.slice(5) + (x === today() ? ' · 今天' : '') + '</small></th>').join('') + '</tr></thead><tbody>' + this.people.map(p => '<tr><th><strong>' + e(p.name) + '</strong><small>' + e(p.dept || p.role || '') + '</small></th>' + dates.map(date => {
        const s = rows.find(x => Number(x.staff_id) === Number(p.id) && (x.date || x.work_date) === date), shift = s ? s.shift : '未排班';
        const cls = ({ '早班': 'morning', '晚班': 'middle', '夜班': 'night', '休息': 'off', '请假': 'leave', '全天': 'morning' })[shift] || 'empty-shift';
        return '<td class="' + (date === today() ? 'is-today' : '') + '"><button class="oa-shift ' + cls + '" data-shift-staff="' + p.id + '" data-date="' + date + '" data-shift="' + e(shift) + '" aria-label="' + e(p.name) + ' ' + date + ' ' + e(shift) + '">' + e(shift) + '</button></td>';
      }).join('') + '</tr>').join('') + '</tbody></table></div><div class="oa-footnote">点击班次即可调整。早班 08:30–17:30 · 晚班 13:00–22:00 · 夜班 20:00–次日08:00。请假审批通过后同步标记排班。</div></section>';
      root.querySelector('#oa-prev').addEventListener('click', () => { this.state.week = dateOffset(week, -7); App.refresh(); });
      root.querySelector('#oa-next').addEventListener('click', () => { this.state.week = dateOffset(week, 7); App.refresh(); });
      root.querySelector('#oa-current').addEventListener('click', () => { this.state.week = monday(); App.refresh(); });
      root.querySelector('#oa-edit-schedule').addEventListener('click', safe(() => this.scheduleForm()));
      root.querySelectorAll('[data-shift-staff]').forEach(b => b.addEventListener('click', safe(() => this.scheduleForm({ staff_id: b.dataset.shiftStaff, date: b.dataset.date, shift: b.dataset.shift }))));
    },
    async scheduleForm(r) {
      r = r || {};
      await App.form({ title: '安排员工班次', columns: 2, tip: '早班08:30–17:30，晚班13:00–22:00，夜班20:00–次日08:00；同人同日仅一个班次，有预约冲突时须先调整预约。', fields: [
        { name: 'staff_id', label: '员工', type: 'select', options: this.staffOptions(), required: true, value: r.staff_id },
        { name: 'date', label: '排班日期', type: 'date', required: true, value: r.date || today() },
        { name: 'shift', label: '班次', type: 'select', options: ['早班', '晚班', '夜班', '休息'], value: r.shift || '早班', span: 2 }
      ], onSubmit: async values => { await App.api.post('/api/oa/schedule', values); App.toast('班次已保存', 'ok'); App.refresh(); } });
    },
    async attendance(root) {
      const date = this.state.attendanceDate;
      const d = await App.api.get('/api/oa/attendance?date=' + date), rows = (d.items || []).filter(r=>App.access?.role_id===1||r.staff_id===App.access?.staff_id);
      root.innerHTML = '<section class="card"><div class="card-head"><h3>日考勤台账</h3><span class="sub">查看出勤与补录记录</span><div class="right"><button class="btn btn-primary btn-sm" id="oa-attendance-new">' + App.icon('plus') + ' 考勤补录</button></div></div><div class="toolbar"><label for="oa-attendance-date">考勤日期</label><input type="date" id="oa-attendance-date" value="' + date + '"><span class="grow"></span><span class="muted small">共 ' + rows.length + ' 条记录</span></div><div id="oa-list"></div><div class="oa-footnote">补录用于演示出勤登记，变更保留在本地；当天尚未下班时，下班时间可留空。</div></section>';
      this.table(root.querySelector('#oa-list'), rows, [
        { label: '员工', render: r => '<strong>' + e(personName(r)) + '</strong><div class="muted small">' + e(r.dept || '') + '</div>' },
        { label: '日期', render: r => e(r.date || r.work_date || date) },
        { label: '上班时间', render: r => e(r.check_in || '—') }, { label: '下班时间', render: r => e(r.check_out || '—') },
        { label: '考勤状态', render: r => status(r.status || '正常') }, { label: '备注', render: r => e(r.note || '—') },
        { label: '操作', render: () => '<span class="oa-text-link">补录 / 调整 →</span>' }
      ], r => this.attendanceForm(r));
      root.querySelector('#oa-attendance-date').addEventListener('change', ev => { if (ev.target.value) { this.state.attendanceDate = ev.target.value; App.refresh(); } });
      root.querySelector('#oa-attendance-new').addEventListener('click', safe(() => this.attendanceForm()));
    },
    async attendanceForm(r) {
      r = r || {};
      await App.form({ title: '员工考勤补录', columns: 2, fields: [
        { name: 'staff_id', label: '员工', type: 'select', options: this.staffOptions(), required: true, value: r.staff_id },
        { name: 'date', label: '考勤日期', type: 'date', max: today(), value: r.date || r.work_date || this.state.attendanceDate, required: true },
        { name: 'check_in', label: '上班时间', type: 'time', value: (r.check_in || '').slice(-5) || '08:00', required: true },
        { name: 'check_out', label: '下班时间', type: 'time', value: (r.check_out || '').slice(-5), hint: '尚未下班可留空' },
        { name: 'note', label: '补录说明', type: 'textarea', value: r.note || '', placeholder: '如：设备维护期间人工登记', required: true, span: 2 }
      ], onSubmit: async values => { await App.api.post('/api/oa/attendance', values); App.toast('考勤记录已保存', 'ok'); App.refresh(); } });
    },
    async tasks(root) {
      const s = this.state, d = await App.api.get('/api/oa/tasks?status=' + encodeURIComponent(s.filter) + '&keyword=' + encodeURIComponent(s.kw));
      let rows = d.items || []; if (s.kw) rows = rows.filter(r => [r.title, r.assignee_name, r.description].join(' ').includes(s.kw)); if (s.filter) rows = rows.filter(r => r.status === s.filter);
      const completed = rows.filter(r => r.status === '已完成').length;
      root.innerHTML = '<section class="card"><div class="card-head"><h3>团队任务</h3><span class="sub">共 ' + rows.length + ' 项 · 已完成 ' + completed + ' 项</span><div class="right"><button class="btn btn-primary btn-sm" id="oa-new-task">' + App.icon('plus') + ' 新建任务</button></div></div><div class="toolbar"><input id="oa-keyword" value="' + e(s.kw) + '" placeholder="搜索任务 / 负责人 / 内容"><select id="oa-filter">' + opt(['待开始', '进行中', '已完成'], s.filter, '全部状态') + '</select><button class="btn btn-sm" id="oa-search">' + App.icon('search') + ' 查询</button></div><div class="oa-task-board">' + (rows.length ? rows.map(r => '<article class="oa-task-card ' + (r.status === '已完成' ? 'completed' : '') + '"><div class="oa-task-card-top">' + status(r.priority) + status(r.status) + '</div><h3>' + e(r.title) + '</h3><p>' + e(r.description || '—') + '</p><div class="oa-task-meta"><span class="oa-mini-avatar">' + e((r.assignee_name || '待').slice(-1)) + '</span><span>' + e(r.assignee_name || '待分配') + '</span><span class="oa-task-due ' + (r.due_date < today() && r.status !== '已完成' ? 'overdue' : '') + '">' + (r.due_date < today() && r.status !== '已完成' ? '已逾期 · ' : '') + App.fmt.date(r.due_date) + '</span></div><div class="oa-task-actions"><button class="btn btn-sm" data-task-edit="' + r.id + '">' + App.icon('edit') + ' 查看 / 编辑</button>' + (r.status !== '已完成' ? '<button class="btn btn-sm btn-primary" data-task-done="' + r.id + '">' + App.icon('check') + ' 完成任务</button>' : '<span class="oa-task-finished">' + App.icon('check') + ' 已完成</span>') + '</div></article>').join('') : empty('当前筛选条件下暂无任务')) + '</div></section>';
      root.querySelector('#oa-new-task').addEventListener('click', safe(() => this.taskForm()));
      root.querySelectorAll('[data-task-edit]').forEach(b => b.addEventListener('click', safe(() => this.taskForm(rows.find(r => String(r.id) === b.dataset.taskEdit)))));
      root.querySelectorAll('[data-task-done]').forEach(b => b.addEventListener('click', safe(async () => { b.disabled = true; try { await App.api.put('/api/oa/tasks/' + b.dataset.taskDone, { status: '已完成' }); App.toast('任务已完成', 'ok'); App.refresh(); } finally { b.disabled = false; } })));
      this.bindFilters(root);
    },
    async taskForm(r) {
      r = r || {};
      await App.form({ title: r.id ? '任务详情 / 编辑' : '新建协作任务', width: 'wide', columns: 2, fields: [
        { name: 'title', label: '任务名称', required: true, value: r.title || '', span: 2 },
        { name: 'assignee_id', label: '负责人', type: 'select', required: true, options: this.staffOptions(), value: r.assignee_id },
        { name: 'due_date', label: '截止日期', type: 'date', required: true, value: r.due_date || dateOffset(today(), 1) },
        { name: 'priority', label: '优先级', type: 'select', options: ['高', '中', '低'], value: r.priority || '中' },
        { name: 'status', label: '任务状态', type: 'select', options: ['待开始', '进行中', '已完成'], value: r.status || '待开始' },
        { name: 'description', label: '任务要求 / 完成标准', type: 'textarea', value: r.description || '', required: true, span: 2, placeholder: '说明工作内容、交付结果与注意事项。' }
      ], onSubmit: async values => { if (r.id) await App.api.put('/api/oa/tasks/' + r.id, values); else await App.api.post('/api/oa/tasks', values); App.toast('任务已保存', 'ok'); App.refresh(); } });
    },
    async announcements(root) {
      const d = await App.api.get('/api/oa/announcements'); let rows = d.items || [];
      if (this.state.kw) rows = rows.filter(r => [r.title, r.category, r.content].join(' ').includes(this.state.kw));
      root.innerHTML = '<section class="card"><div class="card-head"><h3>院内通知公告</h3><span class="sub">把重要消息传递给每一位伙伴</span><div class="right"><button class="btn btn-primary btn-sm" id="oa-new-notice">' + App.icon('plus') + ' 发布公告</button></div></div><div class="toolbar"><input id="oa-keyword" placeholder="搜索公告标题 / 内容" value="' + e(this.state.kw) + '"><button class="btn btn-sm" id="oa-search">' + App.icon('search') + ' 查询</button><span class="grow"></span><span class="muted small">共 ' + rows.length + ' 条公告</span></div><div class="oa-notice-list">' + (rows.length ? rows.map(r => '<button class="oa-notice-card" data-notice="' + r.id + '"><div class="oa-notice-card-icon">' + App.icon(r.pinned ? 'alert' : 'inbox') + '</div><div class="oa-list-main"><div class="oa-notice-title">' + (r.pinned ? '<span class="badge warn">置顶</span>' : '') + '<h3>' + e(r.title) + '</h3>' + (!r.is_read ? '<span class="oa-unread">未读</span>' : '<span class="muted small">已读</span>') + '</div><p>' + e(String(r.content || r.summary || '').slice(0, 100)) + '</p><div class="muted small">' + e(r.category || '院内通知') + ' · ' + e(r.author || r.publisher || '院办') + ' · ' + App.fmt.dtime(r.created_at) + '</div></div><span class="oa-text-link">查看 →</span></button>').join('') : empty('暂无匹配公告')) + '</div></section>';
      root.querySelector('#oa-new-notice').addEventListener('click', safe(() => this.noticeForm()));
      root.querySelectorAll('[data-notice]').forEach(b => b.addEventListener('click', safe(() => this.noticeDetail(b.dataset.notice)))); this.bindFilters(root);
    },
    async noticeForm() {
      await App.form({ title: '发布院内公告', width: 'wide', columns: 2, fields: [
        { name: 'title', label: '公告标题', required: true, span: 2 },
        { name: 'category', label: '公告分类', type: 'select', options: ['院内通知', '培训通知', '制度发布', '活动通知', '重要提醒'] },
        { name: 'pinned', label: '展示方式', type: 'select', options: [{ value: '0', label: '普通公告' }, { value: '1', label: '置顶公告' }] },
        { name: 'content', label: '公告正文', type: 'textarea', required: true, span: 2, placeholder: '填写通知内容、时间地点、参与人员及执行要求。' }
      ], onSubmit: async values => { await App.api.post('/api/oa/announcements', values); App.toast('公告已发布', 'ok'); App.refresh(); } });
    },
    async noticeDetail(id) {
      const r = await App.api.get('/api/oa/announcements/' + id);
      await App.api.post('/api/oa/announcements/' + id + '/read');
      App.modal({ title: r.title, width: 'wide', body: '<div class="oa-detail-top">' + App.badge(r.category || '院内通知', 'info') + (r.pinned ? App.badge('置顶', 'warn') : '') + '<span class="muted small">' + e(r.author || r.publisher || '院办') + ' · ' + App.fmt.dtime(r.created_at) + '</span></div><article class="oa-document-body">' + e(r.content || '') + '</article><div class="oa-read-confirm">' + App.icon('check') + ' 已记录本次阅读</div>' }); App.refresh();
    },
    async documents(root) {
      const s = this.state, d = await App.api.get('/api/oa/documents?keyword=' + encodeURIComponent(s.kw) + '&category=' + encodeURIComponent(s.filter));
      let rows = d.items || []; if (s.kw) rows = rows.filter(r => [r.title, r.content, r.category].join(' ').includes(s.kw)); if (s.filter) rows = rows.filter(r => r.category === s.filter);
      root.innerHTML = '<section class="card"><div class="card-head"><h3>制度与知识资料库</h3><span class="sub">标准流程，随时可查</span><div class="right"><button class="btn btn-primary btn-sm" id="oa-new-document">' + App.icon('plus') + ' 新增资料</button></div></div><div class="toolbar"><input id="oa-keyword" placeholder="搜索制度名称 / 关键词" value="' + e(s.kw) + '"><select id="oa-filter">' + opt(['行政制度', '财务制度', '采购管理', '护理规范', '院感规范', '医疗质量', '信息管理', '药事管理', '培训学习'], s.filter, '全部分类') + '</select><button class="btn btn-sm" id="oa-search">' + App.icon('search') + ' 查询</button><span class="grow"></span><span class="muted small">' + rows.length + ' 份资料</span></div><div class="oa-document-grid">' + (rows.length ? rows.map(r => '<button class="oa-document-card" data-document="' + r.id + '"><div class="oa-document-top"><span class="oa-document-icon">' + App.icon('file') + '</span>' + App.badge(r.category || '制度资料', 'gray') + '</div><h3>' + e(r.title) + '</h3><p>' + e(r.summary || String(r.content || '').slice(0, 72)) + '</p><div><span class="muted small">' + e(r.version || 'V1.0') + ' · ' + App.fmt.date(r.updated_at || r.created_at) + '</span><span class="oa-text-link">阅读全文 →</span></div></button>').join('') : empty('暂无匹配资料')) + '</div></section>';
      root.querySelector('#oa-new-document').addEventListener('click', safe(() => this.documentForm()));
      root.querySelectorAll('[data-document]').forEach(b => b.addEventListener('click', safe(() => this.documentDetail(b.dataset.document)))); this.bindFilters(root);
    },
    async documentForm() {
      await App.form({ title: '新增制度资料', columns: 2, width: 'wide', fields: [
        { name: 'title', label: '资料名称', required: true, span: 2 },
        { name: 'category', label: '分类', type: 'select', options: ['行政制度', '财务制度', '采购管理', '护理规范', '院感规范', '医疗质量', '信息管理', '药事管理', '培训学习'] },
        { name: 'version', label: '版本号', value: 'V1.0', required: true },
        { name: 'content', label: '资料正文', type: 'textarea', required: true, span: 2, placeholder: '请填写适用范围、执行步骤、责任人及留档要求。' }
      ], onSubmit: async values => { await App.api.post('/api/oa/documents', values); App.toast('资料已加入知识库', 'ok'); App.refresh(); } });
    },
    async documentDetail(id) {
      const r = await App.api.get('/api/oa/documents/' + id);
      const m = App.modal({ title: r.title, width: 'wide', body: '<div class="oa-detail-top">' + App.badge(r.category || '制度资料', 'info') + '<span class="muted small">' + e(r.version || 'V1.0') + ' · 更新于 ' + App.fmt.date(r.updated_at || r.created_at) + '</span></div><article class="oa-document-body">' + e(r.content || '') + '</article>', footer: '<button class="btn" data-close>关闭</button><button class="btn btn-primary" id="oa-download">' + App.icon('file') + ' 下载资料 TXT</button>' });
      m.root.querySelector('#oa-download').addEventListener('click', () => download(r.title, r.title + '\n版本：' + (r.version || 'V1.0') + '\n分类：' + (r.category || '制度资料') + '\n\n' + (r.content || '')));
    },
    async staff(root) {
      const s = this.state, depts = [...new Set(this.people.map(r => r.dept).filter(Boolean))];
      const rows = this.people.filter(r => (!s.kw || [r.name, r.role, r.title, r.dept, r.phone].join(' ').includes(s.kw)) && (!s.filter || r.dept === s.filter));
      root.innerHTML = '<section class="card"><div class="card-head"><h3>团队通讯录</h3><span class="sub">' + this.people.length + ' 位伙伴 · ' + depts.length + ' 个科室 / 部门</span></div><div class="toolbar"><input id="oa-keyword" placeholder="搜索姓名 / 科室 / 岗位" value="' + e(s.kw) + '"><select id="oa-filter">' + opt(depts, s.filter, '全部科室') + '</select><button class="btn btn-sm" id="oa-search">' + App.icon('search') + ' 查询</button></div><div class="oa-staff-grid">' + (rows.length ? rows.map((r, i) => '<article class="oa-staff-card"><div class="oa-staff-avatar color-' + (i % 4) + '">' + e(r.name.slice(-2)) + '</div><div><h3>' + e(r.name) + '</h3><p>' + e(r.title || r.role || '团队成员') + '</p></div>' + App.badge(r.status || '在职', 'ok') + '<dl><div><dt>所属科室</dt><dd>' + e(r.dept || '综合管理') + '</dd></div><div><dt>工作岗位</dt><dd>' + e(r.role || '—') + '</dd></div><div><dt>院内分机</dt><dd>' + e(r.extension || r.ext || '8' + String(r.id).padStart(3, '0')) + '</dd></div><div><dt>工作年限</dt><dd>' + e(r.work_years ?? 0) + ' 年</dd></div></dl><div class="oa-staff-specialty">' + App.icon('stethoscope') + e(r.specialty || '院内协作与日常运营') + '</div></article>').join('') : empty('未找到匹配的团队成员')) + '</div></section>'; this.bindFilters(root);
    }
  };
  App.register('oa', OA);
})();



