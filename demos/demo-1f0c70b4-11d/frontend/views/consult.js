/* 医生问诊：会话筛选、输入保护及与客户端同步。 */
App.register('consult', {
  title: '在线问诊', group: '客户服务端', icon: 'chat', subtitle: '小程序图文问诊',
  state: { current: null, keyword: '', status: 'all' },
  chatVersion: 0,
  drafts: {},
  sending: {},
  mediaDrafts: {},
  requests: {},
  async render(root, arg) {
    const data = await App.api.get('/api/portal/consultations');
    if (!root.isConnected) return;
    const state = this.state;
    const rows = data.items.filter(c => (state.status === 'all' || c.status === state.status) &&
      (!state.keyword || [c.title, c.owner_name, c.pet_name, c.consult_no, c.last_message].join(' ').includes(state.keyword)));
    const requested = /^\d+$/.test(arg || '') ? Number(arg) : state.current;
    const selected = rows.find(c => c.id === requested) || rows[0];
    state.current = selected ? selected.id : null;
    root.innerHTML = `<div class="card"><div class="card-head"><h3>问诊会话</h3><span class="sub">回车发送 · Shift + 回车换行</span><span class="right muted small">共 ${rows.length} 个会话</span></div>
      <div class="toolbar"><input id="consult-search" placeholder="搜索客户 / 宠物 / 主题 / 单号" aria-label="搜索问诊会话" value="${App.esc(state.keyword)}">
      <select id="consult-status" aria-label="会话状态">${['all', '待回复', '进行中', '已关闭'].map(s => `<option value="${s}" ${s === state.status ? 'selected' : ''}>${s === 'all' ? '全部状态' : s}</option>`).join('')}</select>
      <button class="btn btn-sm" id="consult-filter">${App.icon('search')} 查询</button><button class="btn btn-sm" id="consult-reset">清除筛选</button></div>
      <div class="card-body flush"><div class="consult-layout"><div class="consult-list" id="list">
      ${rows.map(c => `<button type="button" class="list-item consult-session ${c.id === state.current ? 'selected' : ''}" data-id="${c.id}"><span class="grow"><span class="lt">${App.esc(c.title || '在线问诊')}</span>
        <span class="ls">${App.esc(c.owner_name || '')} · ${App.esc(c.pet_name || '')} · ${App.esc(c.doctor_name || '')}</span><span class="ls">${App.esc((c.last_message || '').slice(0, 40))}</span></span>
        <span>${App.badge(c.status)}<span class="ls">${c.msg_count} 条</span></span></button>`).join('') || '<div class="empty">暂无匹配会话，请调整筛选条件</div>'}
      </div><div class="consult-chat" id="chat">${selected ? '<div class="skeleton">加载中…</div>' : '<div class="empty">选择会话后可查看消息</div>'}</div></div></div></div>`;
    const filter = () => { state.keyword = root.querySelector('#consult-search').value.trim(); state.status = root.querySelector('#consult-status').value; App.refresh(); };
    root.querySelector('#consult-filter').addEventListener('click', filter);
    root.querySelector('#consult-status').addEventListener('change', filter);
    root.querySelector('#consult-search').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) filter(); });
    root.querySelector('#consult-reset').addEventListener('click', () => { state.keyword = ''; state.status = 'all'; App.refresh(); });
    root.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => App.go('consult', button.dataset.id)));
    if (selected) await this.openChat(root, selected.id);
  },
  async openChat(root, id) {
    const el = root.querySelector('#chat'), version = ++this.chatVersion;
    if (!el) return;
    try {
      const data = await App.api.get(`/api/portal/consultations/${id}/messages`);
      if (!el.isConnected || version !== this.chatVersion) return;
      const c = data.consultation, closed = c.status === '已关闭';
      el.dataset.consultId = String(id);
      el.innerHTML = `<div class="consult-heading"><div class="grow" style="flex:1"><div class="strong">${App.esc(c.title || '在线问诊')}</div>
        <div class="muted small">${App.esc(c.doctor_name || '未分配')} ${App.esc(c.doctor_title || '')} · 单号 ${App.esc(c.consult_no)}</div></div>${App.badge(c.status)}
        ${closed ? '' : '<button class="btn btn-sm btn-danger" id="close">关闭会话</button>'}</div>
        <div class="chat-wrap"><div class="chat-msgs" id="msgs">${data.items.map(m => `<div class="msg ${m.sender_role === 'doctor' ? '' : 'me'}"><div><div class="who">${App.esc(m.sender_name || '')} ${App.fmt.dtime(m.created_at)}</div><div class="bubble">${App.esc(m.content)}${ConsultMedia.html(m.attachments)}</div></div></div>`).join('')}</div>
        ${closed ? '<div class="consult-closed">该会话已关闭，消息记录已保存，可继续查阅。</div>' : '<div class="consult-composer"><div class="consult-media-drafts"></div><div class="chat-input"><button class="btn" id="consult-media-pick" aria-label="添加图片或短视频">附件</button><input type="file" id="consult-media-files" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" multiple hidden><textarea id="txt" aria-label="回复内容" placeholder="输入回复内容，回车发送…"></textarea><button class="btn btn-primary" id="send" style="align-self:flex-end">发送</button></div><p class="muted small consult-media-hint">最多3个附件 · 图片≤3MB / 短视频≤8MB · 总计≤12MB</p></div>'}</div>`;
      el.querySelector('#msgs').scrollTop = el.querySelector('#msgs').scrollHeight;
      ConsultMedia.bind(el,data.items.flatMap(m=>m.attachments||[]));
      if (closed) return;
      const input = el.querySelector('#txt'), send = el.querySelector('#send'), close = el.querySelector('#close');
      input.value = this.drafts[id] || '';
      send.disabled = !!this.sending[id];
      const media=ConsultMedia.composer(el,this,id);
      input.addEventListener('input', () => { this.drafts[id] = input.value; delete this.requests[id]; });
      send.addEventListener('click', async () => {
        if (send.disabled || this.sending[id]) return;
        const submittedDraft = input.value, content = submittedDraft.trim();
        if (!content && !(this.mediaDrafts[id]||[]).length) return App.toast('请输入回复内容或添加附件', 'err');
        this.requests[id]=this.requests[id]||ConsultMedia.key();
        input.disabled=true; media.disabled(true);
        send.disabled = true;
        this.sending[id] = true;
        try {
          await App.api.post(`/api/portal/consultations/${id}/messages`, { sender_role: 'doctor', content, attachments:this.mediaDrafts[id]||[], request_key:this.requests[id] });
          delete this.mediaDrafts[id]; delete this.requests[id];
          if (this.drafts[id] === submittedDraft) delete this.drafts[id];
          const liveRoot = root.isConnected ? root : document.querySelector('#view[data-view="consult"] .view-content');
          if (liveRoot && this.state.current === id) { await this.render(liveRoot, String(id)); const next = liveRoot.querySelector('#txt'); if (next) next.focus(); }
        }
        catch (error) { App.toast(error.message || '发送失败，回复内容已保留', 'err'); }
        finally {
          delete this.sending[id]; send.disabled = false; input.disabled=false; media.disabled(false);
          const currentChat = document.querySelector('#view #chat');
          if (currentChat && currentChat.dataset.consultId === String(id)) { const nextSend = currentChat.querySelector('#send'); if (nextSend) nextSend.disabled = false; }
        }
      });
      input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send.click(); } });
      close.addEventListener('click', async () => {
        if (close.disabled) return;
        close.disabled = true;
        try { if (!await App.confirm('关闭后将保留消息记录，双方不能继续发送。确认关闭？', '关闭问诊')) return; await App.api.patch(`/api/portal/consultations/${id}/close`); delete this.drafts[id]; delete this.mediaDrafts[id]; delete this.requests[id]; App.toast('会话已关闭', 'ok'); await this.render(root, String(id)); }
        catch (error) { App.toast(error.message || '关闭失败，请重试', 'err'); }
        finally { close.disabled = false; }
      });
    } catch (error) { if (el.isConnected && version === this.chatVersion) el.innerHTML = `<div class="empty">${App.esc(error.message || '消息读取失败，请刷新重试')}</div>`; }
  }
});
