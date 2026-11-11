/* 工作台：经营概览 KPI、今日预约、待办与趋势 */
App.register('dashboard', {
  title: '工作台',
  group: '概览',
  icon: 'dashboard',
  subtitle: '实时监控诊疗与经营',

  async render(root) {
    const [d, oa, claims, expenses] = await Promise.all([App.api.get('/api/dashboard/overview'), App.api.get('/api/oa/overview'), App.api.get('/api/claims/overview'), App.api.get('/api/expenses/overview')]);
    const k = d.kpi;
    const now = new Date();
    const week = '周' + '日一二三四五六'[now.getDay()];

    const kpis = [
      { label: '今日预约', value: k.today_appointment, unit: '单', foot: `待到店 ${k.pending_appointment} 单`, target: 'appointments', arg: 'today' },
      { label: '诊疗中', value: k.in_progress, unit: '例', foot: '待接诊 + 诊疗中', cls: 'blue' },
      { label: '今日营收', value: App.fmt.money(k.today_income).replace('.00', ''), unit: '元', foot: `本月累计 ¥${App.fmt.money(k.month_income).replace('.00', '')}`, cls: '' },
      { label: '待缴费', value: k.pending_payment, unit: '单', foot: '含部分缴费', cls: 'warn' },
      { label: '待处理化验', value: k.pending_lab, unit: '单', foot: `设备在线 ${k.device_online}/${k.device_total}`, cls: 'violet' },
      { label: '库存预警', value: k.low_stock, unit: '项', foot: '低于安全库存', cls: 'danger' },
      { label: '待回访', value: k.pending_followup, unit: '项', foot: '客户关怀任务', cls: 'blue' },
      { label: '在线问诊', value: k.pending_consult, unit: '条', foot: '待回复会话', cls: 'warn' }
    ];

    const trend = (d.income_trend || []).map(r => ({
      label: String(r.date).slice(5), value: Math.round(r.amount)
    }));

    root.innerHTML = `
      <div class="workbench-welcome">
        <div><div class="welcome-eyebrow">PET CARE · 每一份关爱，都有回应</div>
          <h2>把诊疗与协作，安排得井井有条</h2>
          <p>${Demo.date()} ${week} · 欢迎回来，${App.esc(App.access ? App.access.name : '胡院长')}。今天的诊疗、经营与团队待办已为您整理。</p></div>
        <div class="welcome-actions"><button class="btn btn-primary" data-work="appointments">${App.icon('plus')} 预约接诊</button>
          <a class="btn" href="#/system/data">演示场景与数据</a>
          <button class="btn" data-work="oa">${App.icon('inbox')} OA 办公</button></div>
      </div>
      <div class="grid g4" style="margin-bottom:16px">
        ${kpis.map((x, i) => `
          <button type="button" class="kpi workbench-kpi ${x.cls || ''}" data-kpi="${x.target || ['appointments', 'visits', 'billing', 'billing', 'lis', 'inventory', 'crm', 'consult'][i]}" data-arg="${x.arg || ['', 'active', '', 'pending', 'pending', 'low', 'follow', ''][i]}" title="查看${App.esc(x.label)}详情">
            <div class="k-label">${App.esc(x.label)}</div>
            <div class="k-value">${x.value}<span class="k-unit">${x.unit}</span></div>
            <div class="k-foot">${App.esc(x.foot)}</div>
          </button>`).join('')}
      </div>

      <div class="grid dashboard-trend" style="margin-bottom:16px">
        <div class="card">
          <div class="card-head"><h3>近 14 日净收款趋势</h3><span class="sub">收款减退款 · 单位：元</span></div>
          <div class="card-body">
            ${App.bars(trend, { color: '' })}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>科室业绩</h3></div>
          <div class="card-body">
            ${App.hbars((d.dept_perf || []).map(x => ({ name: x.name, value: Math.round(x.income) })),
              { fmt: v => '¥' + v })}
          </div>
        </div>
      </div>

      <div class="grid dashboard-todo" style="margin-bottom:16px">
        <div class="card">
          <div class="card-head"><h3>今日预约</h3>
            <span class="sub">${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${week}</span>
            <div class="right"><button class="btn btn-sm" id="go-appt">全部预约</button></div>
          </div>
          <div class="card-body flush">
            ${(d.today_appointments || []).length ? (d.today_appointments || []).map(a => `
              <button type="button" class="list-item workbench-row" data-record="appointments" data-id="${a.id}" aria-label="查看${App.esc(a.pet_name)}的预约详情">
                <span class="badge ${a.source === '小程序' ? 'primary' : 'gray'}">${App.esc(a.source)}</span>
                <div class="grow">
                  <div class="lt">${App.esc(a.pet_name)} <span class="muted small">· ${App.esc(a.appt_type)}</span></div>
                  <div class="ls">${App.fmt.time(a.scheduled_at)} · ${App.esc(a.owner_name || '')} · ${App.esc(a.doctor_name || '待分配')}</div>
                </div>
                ${App.badge(a.status)}
              </button>`).join('') : '<div class="empty">今日暂无预约</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>待收费账单</h3><div class="right"><button class="btn btn-sm" id="go-bill">去收费</button></div></div>
          <div class="card-body flush">
            ${(d.todo.unpaid || []).length ? (d.todo.unpaid || []).map(i => `
              <button type="button" class="list-item workbench-row" data-record="billing" data-id="${i.id}">
                <div class="grow">
                  <div class="lt">${App.esc(i.owner_name || '客户')}</div>
                  <div class="ls">${App.esc(i.invoice_no)}</div>
                </div>
                <strong style="color:var(--warn)">待收 ¥${App.fmt.money(Math.max(0, i.payable - (i.paid_amount || 0)))}</strong>
              </button>`).join('') : '<div class="empty">无待收费账单</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>待处理化验</h3><div class="right"><button class="btn btn-sm" id="go-lis">进入 LIS</button></div></div>
          <div class="card-body flush">
            ${(d.todo.lab_pending || []).length ? (d.todo.lab_pending || []).map(l => `
              <button type="button" class="list-item workbench-row" data-record="lis" data-id="${l.id}">
                <div class="grow">
                  <div class="lt">${App.esc(l.pet_name || '')} · ${App.esc(l.panel)}</div>
                  <div class="ls">${App.esc(l.order_no)}</div>
                </div>
                ${App.badge(l.status)}
              </button>`).join('') : '<div class="empty">无待处理化验</div>'}
          </div>
        </div>
      </div>

      <div class="grid g2">
        <div class="card">
          <div class="card-head"><h3>库存预警</h3><div class="right"><button class="btn btn-sm" id="go-inv">去采购</button></div></div>
          <div class="card-body flush">
            ${(d.todo.low_stock || []).length ? (d.todo.low_stock || []).map(p => `
              <button type="button" class="list-item workbench-row" data-record="inventory" data-id="low">
                <div class="grow"><div class="lt">${App.esc(p.name)}</div><div class="ls">安全库存 ${p.safety_stock}${App.esc(p.unit)}</div></div>
                <span class="badge ${p.stock_qty <= 0 ? 'danger' : 'warn'}">${p.stock_qty}${App.esc(p.unit)}</span>
              </button>`).join('') : '<div class="empty">库存充足</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>最近就诊</h3><div class="right"><button class="btn btn-sm" id="go-visits">病历中心</button></div></div>
          <div class="card-body flush">
            ${(d.recent_visits || []).map(v => `
              <button type="button" class="list-item workbench-row" data-record="visits" data-id="${v.id}">
                <div class="grow">
                  <div class="lt">${App.esc(v.pet_name || '')} <span class="muted small">· ${App.esc(v.owner_name || '')}</span></div>
                  <div class="ls">${App.esc(v.diagnosis || v.chief_complaint || '待完善')} · ${App.esc(v.doctor_name || '')}</div>
                </div>
                <span class="muted small">${App.fmt.dt(v.visited_at)}</span>
                ${App.badge(v.status)}
              </button>`).join('') || '<div class="empty">暂无就诊</div>'}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>快捷入口</h3></div>
        <div class="card-body">
          <div class="quick-grid">
            <button type="button" class="quick" data-go="patients"><span>${App.icon('users')}</span><div class="qt">客户建档</div><div class="qs">主人 + 宠物档案</div></button>
            <button type="button" class="quick" data-go="appointments"><span>${App.icon('calendar')}</span><div class="qt">预约登记</div><div class="qs">到店接诊</div></button>
            <button type="button" class="quick" data-go="visits"><span>${App.icon('file')}</span><div class="qt">电子病历</div><div class="qs">诊疗全流程</div></button>
            <button type="button" class="quick" data-go="lis"><span>${App.icon('lab')}</span><div class="qt">化验室 LIS</div><div class="qs">模拟结果回传</div></button>
            <button type="button" class="quick" data-go="imaging"><span>${App.icon('image')}</span><div class="qt">影像归档</div><div class="qs">X光 / B超</div></button>
            <button type="button" class="quick" data-go="crm"><span>${App.icon('chart')}</span><div class="qt">经营 CRM</div><div class="qs">精准营销</div></button>
            <button type="button" class="quick" data-go="inventory"><span>${App.icon('box')}</span><div class="qt">进销存</div><div class="qs">采购与库存</div></button>
            <button type="button" class="quick" data-go="billing"><span>${App.icon('receipt')}</span><div class="qt">收费台</div><div class="qs">账单与收款</div></button>
          </div>
        </div>
      </div>`;

    const oaPanel = document.createElement('div');
    oaPanel.className = 'workbench-oa card';
    oaPanel.innerHTML = `<div class="card-head"><h3>${App.icon('inbox')} 团队协作</h3><span class="sub">门诊之外，让医院高效运转</span>
      <div class="right"><button class="btn btn-sm" data-oa="overview">进入 OA ${App.icon('inbox')}</button></div></div>
      <div class="workbench-oa-grid">${[
        ['approvals', '待审批', oa.kpi.pending_approvals, '请假 · 报销 · 采购', 'file'],
        ['schedule', '今日在岗', oa.kpi.today_on_duty, '排班 · 交接 · 考勤', 'calendar'],
        ['tasks', '协作任务', oa.kpi.open_tasks, '责任到人 · 进度可见', 'check'],
        ['announcements', '未读公告', oa.kpi.unread_announcements, '院内通知 · 培训安排', 'chat']
      ].map(x => `<button class="workbench-metric" data-oa="${x[0]}"><span class="workbench-metric-icon">${App.icon(x[4])}</span>
        <span><span class="muted small">${x[1]}</span><strong>${App.fmt.int(x[2])}</strong><span class="muted small">${x[3]}</span></span></button>`).join('')}</div>`;
    root.querySelector('.grid').insertAdjacentElement('afterend', oaPanel);
    const expensePanel = document.createElement('div');
    expensePanel.className = 'workbench-oa card';
    expensePanel.innerHTML = `<div class="card-head"><h3>${App.icon('receipt')} 报销办理</h3><span class="sub">宠物医疗与院内费用，各有完整流程</span></div>
      <div class="workbench-oa-grid">${[
        ['claims', '医疗报销待审核', claims.kpi.pending, '保单 · 病历 · 已结清账单', 'file'],
        ['claims', '医疗报销待补件', claims.kpi.need_material, '按要求补齐后继续审核', 'box'],
        ['expenses', '院内费用待审核', expenses.kpi.pending, '科室 → 财务 → 院长', 'inbox'],
        ['expenses', '院内费用待付款', expenses.kpi.payable, '出纳登记 · 凭证可追溯', 'receipt']
      ].map(x => `<button class="workbench-metric" data-reimbursement="${x[0]}"><span class="workbench-metric-icon">${App.icon(x[4])}</span>
        <span><span class="muted small">${x[1]}</span><strong>${App.fmt.int(x[2])}</strong><span class="muted small">${x[3]}</span></span></button>`).join('')}</div>`;
    oaPanel.insertAdjacentElement('afterend', expensePanel);
    const integratedPanel = document.createElement('div');
    integratedPanel.className = 'workbench-oa card';
    integratedPanel.innerHTML = `<div class="card-head"><h3>${App.icon('paw')} 诊疗与服务全流程</h3><span class="sub">接待 → 诊疗 → 住院 → 收费 → 客户关怀</span></div>
      <div class="workbench-oa-grid">${[
        ['system', '接待与叫号', '来电识别 · 候诊队列 · 医生工作台', 'phone'],
        ['care', '住院与医疗文书', '笼位护理 · 药房发药 · 客户签署', 'stethoscope'],
        ['services', '客户服务与权益', '套餐计次 · 等级积分 · 免疫关怀', 'users'],
        ['operations', '运营与连锁', '商品零售 · 门店调拨 · 经营绩效', 'chart']
      ].map(x => `<button class="workbench-metric" data-go="${x[0]}"><span class="workbench-metric-icon">${App.icon(x[3])}</span><span><strong style="font-size:17px">${x[1]}</strong><span class="muted small">${x[2]}</span></span></button>`).join('')}</div>`;
    expensePanel.insertAdjacentElement('afterend', integratedPanel);
    integratedPanel.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => App.go(b.dataset.go)));
    root.querySelectorAll('[data-reimbursement]').forEach(b => b.addEventListener('click', () => App.go(b.dataset.reimbursement)));
    root.querySelectorAll('[data-oa]').forEach(b => b.addEventListener('click', () => App.go('oa', b.dataset.oa)));
    root.querySelectorAll('[data-work]').forEach(b => b.addEventListener('click', () => App.go(b.dataset.work)));
    root.querySelectorAll('[data-kpi]').forEach(b => b.addEventListener('click', () => App.go(b.dataset.kpi, b.dataset.arg)));
    root.querySelectorAll('[data-record]').forEach(b => b.addEventListener('click', () => App.go(b.dataset.record, b.dataset.id)));
    const bind = (id, key) => {
      const el = root.querySelector('#' + id);
      if (el) el.addEventListener('click', () => App.go(key));
    };
    bind('go-appt', 'appointments');
    bind('go-bill', 'billing');
    bind('go-lis', 'lis');
    bind('go-inv', 'inventory');
    bind('go-visits', 'visits');
    root.querySelectorAll('.quick').forEach(q => {
      q.addEventListener('click', () => App.go(q.dataset.go));
    });
  }
});
