/* 工作台：经营概览 KPI、今日预约、待办与趋势 */
App.register('dashboard', {
  title: '工作台',
  group: '概览',
  icon: 'dashboard',
  subtitle: '实时监控诊疗与经营',

  async render(root) {
    const d = await App.api.get('/api/dashboard/overview');
    const k = d.kpi;
    const now = new Date();
    const week = '周' + '日一二三四五六'[now.getDay()];

    const kpis = [
      { label: '今日预约', value: k.today_appointment, unit: '单', foot: `待到店 ${k.pending_appointment} 单` },
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
      <div class="grid g4" style="margin-bottom:16px">
        ${kpis.map(x => `
          <div class="kpi ${x.cls || ''}">
            <div class="k-label">${App.esc(x.label)}</div>
            <div class="k-value">${x.value}<span class="k-unit">${x.unit}</span></div>
            <div class="k-foot">${App.esc(x.foot)}</div>
          </div>`).join('')}
      </div>

      <div class="grid" style="grid-template-columns:1.55fr 1fr;margin-bottom:16px">
        <div class="card">
          <div class="card-head"><h3>近 14 日营收趋势</h3><span class="sub">单位：元</span></div>
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

      <div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:16px">
        <div class="card">
          <div class="card-head"><h3>今日预约</h3>
            <span class="sub">${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${week}</span>
            <div class="right"><button class="btn btn-sm" id="go-appt">全部预约</button></div>
          </div>
          <div class="card-body flush">
            ${(d.today_appointments || []).length ? (d.today_appointments || []).map(a => `
              <div class="list-item">
                <span class="badge ${a.source === '小程序' ? 'primary' : 'gray'}">${App.esc(a.source)}</span>
                <div class="grow">
                  <div class="lt">${App.esc(a.pet_name)} <span class="muted small">· ${App.esc(a.appt_type)}</span></div>
                  <div class="ls">${App.fmt.time(a.scheduled_at)} · ${App.esc(a.owner_name || '')} · ${App.esc(a.doctor_name || '待分配')}</div>
                </div>
                ${App.badge(a.status)}
              </div>`).join('') : '<div class="empty">今日暂无预约</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>待收费账单</h3><div class="right"><button class="btn btn-sm" id="go-bill">去收费</button></div></div>
          <div class="card-body flush">
            ${(d.todo.unpaid || []).length ? (d.todo.unpaid || []).map(i => `
              <div class="list-item">
                <div class="grow">
                  <div class="lt">${App.esc(i.owner_name || '客户')}</div>
                  <div class="ls">${App.esc(i.invoice_no)}</div>
                </div>
                <strong style="color:var(--warn)">¥${App.fmt.money(i.payable)}</strong>
              </div>`).join('') : '<div class="empty">无待收费账单</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>待处理化验</h3><div class="right"><button class="btn btn-sm" id="go-lis">进入 LIS</button></div></div>
          <div class="card-body flush">
            ${(d.todo.lab_pending || []).length ? (d.todo.lab_pending || []).map(l => `
              <div class="list-item">
                <div class="grow">
                  <div class="lt">${App.esc(l.pet_name || '')} · ${App.esc(l.panel)}</div>
                  <div class="ls">${App.esc(l.order_no)}</div>
                </div>
                ${App.badge(l.status)}
              </div>`).join('') : '<div class="empty">无待处理化验</div>'}
          </div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="card">
          <div class="card-head"><h3>库存预警</h3><div class="right"><button class="btn btn-sm" id="go-inv">去采购</button></div></div>
          <div class="card-body flush">
            ${(d.todo.low_stock || []).length ? (d.todo.low_stock || []).map(p => `
              <div class="list-item">
                <div class="grow"><div class="lt">${App.esc(p.name)}</div><div class="ls">安全库存 ${p.safety_stock}${App.esc(p.unit)}</div></div>
                <span class="badge ${p.stock_qty <= 0 ? 'danger' : 'warn'}">${p.stock_qty}${App.esc(p.unit)}</span>
              </div>`).join('') : '<div class="empty">库存充足</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>最近就诊</h3><div class="right"><button class="btn btn-sm" id="go-visits">病历中心</button></div></div>
          <div class="card-body flush">
            ${(d.recent_visits || []).map(v => `
              <div class="list-item">
                <div class="grow">
                  <div class="lt">${App.esc(v.pet_name || '')} <span class="muted small">· ${App.esc(v.owner_name || '')}</span></div>
                  <div class="ls">${App.esc(v.diagnosis || v.chief_complaint || '待完善')} · ${App.esc(v.doctor_name || '')}</div>
                </div>
                <span class="muted small">${App.fmt.dt(v.visited_at)}</span>
                ${App.badge(v.status)}
              </div>`).join('') || '<div class="empty">暂无就诊</div>'}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>快捷入口</h3></div>
        <div class="card-body">
          <div class="quick-grid">
            <div class="quick" data-go="patients"><span>${App.icon('users')}</span><div class="qt">客户建档</div><div class="qs">主人 + 宠物档案</div></div>
            <div class="quick" data-go="appointments"><span>${App.icon('calendar')}</span><div class="qt">预约登记</div><div class="qs">到店接诊</div></div>
            <div class="quick" data-go="visits"><span>${App.icon('file')}</span><div class="qt">电子病历</div><div class="qs">诊疗全流程</div></div>
            <div class="quick" data-go="lis"><span>${App.icon('lab')}</span><div class="qt">化验室 LIS</div><div class="qs">设备直读结果</div></div>
            <div class="quick" data-go="imaging"><span>${App.icon('image')}</span><div class="qt">影像归档</div><div class="qs">X光 / B超</div></div>
            <div class="quick" data-go="crm"><span>${App.icon('chart')}</span><div class="qt">经营 CRM</div><div class="qs">精准营销</div></div>
            <div class="quick" data-go="inventory"><span>${App.icon('box')}</span><div class="qt">进销存</div><div class="qs">采购与库存</div></div>
            <div class="quick" data-go="billing"><span>${App.icon('receipt')}</span><div class="qt">收费台</div><div class="qs">账单与收款</div></div>
          </div>
        </div>
      </div>`;

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
