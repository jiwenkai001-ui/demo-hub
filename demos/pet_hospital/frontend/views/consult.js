/* 在线问诊（医生端）：客户在小程序发起，医生在此回复 */
App.register('consult', {
  title: '在线问诊',
  group: '客户服务端',
  icon: 'chat',
  subtitle: '小程序图文问诊',

  state: { current: null },

  async render(root) {
    const d = await App.api.get('/api/crm/customers?page=1&page_size=200');
    if (root.dataset.view !== 'consult') return;
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h3>问诊会话</h3>
          <span class="sub">客户在小程序发起，医生在此接诊回复</span></div>
        <div class="card-body flush">
          <div style="display:flex;min-height:520px">
            <div style="width:330px;flex:0 0 330px;border-right:1px solid var(--border);overflow-y:auto;max-height:560px" id="list">
              <div class="skeleton">加载中…</div>
            </div>
            <div style="flex:1;min-width:0" id="chat">
              <div class="empty">${App.icon('chat')} 请从左侧选择一个问诊会话</div>
            </div>
          </div>
        </div>
      </div>`;
    const owners = d.items;
    const listEl = root.querySelector('#list');
    let list = [];
    for (const o of owners.slice(0, 40)) {
      const c = await App.api.get(`/api/portal/${o.id}/consultations`);
      if (!listEl.isConnected) return;
      c.items.forEach(x => list.push(Object.assign(x, { _owner: o.name })));
    }
    list = list.sort((a, b) => b.id - a.id);
    listEl.innerHTML = list.length ? list.map(c => `
      <div class="list-item" data-id="${c.id}" style="cursor:pointer">
        <div class="grow">
          <div class="lt">${App.esc(c.title || '在线问诊')}</div>
          <div class="ls">${App.esc(c._owner)} · ${App.esc(c.pet_name || '')} · ${App.esc(c.doctor_name || '')}</div>
          <div class="ls">${App.esc((c.last_message || '').slice(0, 28))}…</div>
        </div>
        <div style="text-align:right">
          ${App.badge(c.status)}
          <div class="ls">${c.msg_count} 条</div>
        </div>
      </div>`).join('') : '<div class="empty">暂无问诊会话</div>';

    listEl.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        listEl.querySelectorAll('.list-item').forEach(x => x.style.background = '');
        el.style.background = 'var(--primary-soft)';
        this.openChat(root, Number(el.dataset.id));
      });
    });
    if (list.length) {
      listEl.querySelector('[data-id]').click();
    }
  },

  async openChat(root, id) {
    const el = root.querySelector('#chat');
    if (!el) return;
    el.innerHTML = '<div class="skeleton">加载中…</div>';
    const load = async () => {
      const d = await App.api.get(`/api/portal/consultations/${id}/messages`);
      if (!el.isConnected) return;
      const c = d.consultation;
      el.innerHTML = `
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
          <div class="grow" style="flex:1">
            <div class="strong">${App.esc(c.title || '在线问诊')}</div>
            <div class="muted small">接诊医生：${App.esc(c.doctor_name || '未分配')} ${App.esc(c.doctor_title || '')}
              · ${App.esc(c.specialty || '')} · 单号 ${App.esc(c.consult_no)}</div>
          </div>
          ${App.badge(c.status)}
          <button class="btn btn-sm btn-danger" id="close">关闭会话</button>
        </div>
        <div class="chat-wrap">
          <div class="chat-msgs" id="msgs">
            ${d.items.map(m => `
              <div class="msg ${m.sender_role === 'doctor' ? '' : 'me'}">
                <div>
                  <div class="who">${App.esc(m.sender_name || '')} ${App.fmt.dtime(m.created_at)}</div>
                  <div class="bubble">${App.esc(m.content)}</div>
                </div>
              </div>`).join('')}
          </div>
          <div class="chat-input">
            <textarea id="txt" placeholder="输入回复内容…"></textarea>
            <button class="btn btn-primary" id="send" style="align-self:flex-end">发送</button>
          </div>
        </div>`;
      const box = el.querySelector('#msgs');
      box.scrollTop = box.scrollHeight;
      el.querySelector('#send').addEventListener('click', async () => {
        const txt = el.querySelector('#txt').value.trim();
        if (!txt) return App.toast('请输入内容', 'err');
        await App.api.post(`/api/portal/consultations/${id}/messages`,
          { sender_role: 'doctor', content: txt });
        el.querySelector('#txt').value = '';
        load();
      });
      el.querySelector('#txt').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.querySelector('#send').click(); }
      });
      el.querySelector('#close').addEventListener('click', async () => {
        if (!await App.confirm('确认关闭该问诊会话？')) return;
        await App.api.patch(`/api/portal/consultations/${id}/close`);
        App.toast('会话已关闭', 'ok');
        App.refresh();
      });
    };
    await load();
  }
});
