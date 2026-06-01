const AdminScreen = {
  tab: 'overview',
  ANTHROPIC_KEY: '', // Set via UI

  async render(profile) {
    const { data: users } = await DB.getAllProfiles();
    const { data: trades } = await DB.getAllTrades();
    const totalPnl = (trades || []).filter(t => t.status === 'closed').reduce((s, t) => s + (t.pnl || 0), 0);

    return `
<div class="page-header" style="padding-top:24px">
  <div>
    <div class="page-title">Admin</div>
    <div class="page-sub" style="margin-top:4px;color:var(--gold)">Super Admin</div>
  </div>
</div>

<div class="admin-tabs" style="margin-top:16px">
  <div class="admin-tab ${this.tab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</div>
  <div class="admin-tab ${this.tab === 'users' ? 'active' : ''}" data-tab="users">Users</div>
  <div class="admin-tab ${this.tab === 'trades' ? 'active' : ''}" data-tab="trades">Trades</div>
  <div class="admin-tab ${this.tab === 'ai' ? 'active' : ''}" data-tab="ai">AI</div>
</div>

<div id="admin-panel">
  ${this._renderPanel(this.tab, users || [], trades || [], totalPnl)}
</div>`;
  },

  _renderPanel(tab, users, trades, totalPnl) {
    if (tab === 'overview') return `
      <div class="stats-row" style="grid-template-columns:repeat(2,1fr)">
        <div class="stat-box"><div class="stat-val">${users.length}</div><div class="stat-lbl">Users</div></div>
        <div class="stat-box"><div class="stat-val">${trades.length}</div><div class="stat-lbl">Trades</div></div>
        <div class="stat-box"><div class="stat-val" style="color:${totalPnl >= 0 ? 'var(--up)' : 'var(--down)'}">${ENGINE.fmt(totalPnl)}</div><div class="stat-lbl">Total P&L</div></div>
        <div class="stat-box"><div class="stat-val" style="color:var(--up)">$0</div><div class="stat-lbl">Infra Cost</div></div>
      </div>
      <div class="card">
        <div style="font-size:13px;color:var(--silver);line-height:1.6">
          Platform running on free tier.<br>
          Supabase · Vercel · Binance WS
        </div>
      </div>`;

    if (tab === 'users') return `
      <div class="card" style="padding:16px">
        ${users.length === 0 ? '<div class="empty"><div class="empty-text">No users yet.</div></div>' :
          users.map(u => `
          <div class="trade-row">
            <div>
              <div style="font-size:14px;font-weight:600">${u.email}</div>
              <div style="font-size:11px;color:var(--dim);font-family:var(--mono);margin-top:2px">${u.role} · ${u.plan}</div>
            </div>
            <div style="font-family:var(--mono);font-size:12px;color:${u.bot_active ? 'var(--up)' : 'var(--dim)'}">
              ${u.bot_active ? '● Active' : '○ Idle'}
            </div>
          </div>`).join('')}
      </div>`;

    if (tab === 'trades') return `
      <div class="card" style="padding:16px">
        ${trades.length === 0 ? '<div class="empty"><div class="empty-text">No trades yet.</div></div>' :
          trades.slice(0, 20).map(t => `
          <div class="trade-row">
            <div>
              <div class="trade-pair">${t.pair}</div>
              <div class="trade-strategy">${t.strategy || '—'}</div>
            </div>
            <div class="trade-dir ${t.direction === 'LONG' ? 'long' : 'short'}">${t.direction}</div>
            <div class="trade-pnl ${(t.pnl || 0) >= 0 ? 'pos' : 'neg'}">
              ${t.status === 'closed' ? ((t.pnl || 0) >= 0 ? '+' : '') + ENGINE.fmt(t.pnl) : 'Open'}
            </div>
          </div>`).join('')}
      </div>`;

    if (tab === 'ai') return `
      <div style="padding:16px 16px 0">
        <div class="input-group">
          <label class="input-label">Anthropic API Key</label>
          <input class="input" id="api-key-input" type="password" placeholder="sk-ant-..." value="${this.ANTHROPIC_KEY}">
        </div>
        <button class="btn btn-ghost" id="save-key-btn" style="margin-bottom:16px">Save Key</button>
      </div>
      <div class="chat-wrap" style="height:calc(100dvh - 340px)">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg ai">Hi! I'm Claude. Ask me about bugs, features, or anything about Obsidian LITE.</div>
        </div>
        <div class="chat-input-row">
          <input class="chat-input" id="chat-input" placeholder="Ask Claude..." type="text">
          <button class="chat-send" id="chat-send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>`;

    return '';
  },

  bind(profile) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.onclick = async () => {
        this.tab = tab.dataset.tab;
        const { data: users } = await DB.getAllProfiles();
        const { data: trades } = await DB.getAllTrades();
        const totalPnl = (trades || []).filter(t => t.status === 'closed').reduce((s, t) => s + (t.pnl || 0), 0);
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('admin-panel').innerHTML = this._renderPanel(this.tab, users || [], trades || [], totalPnl);
        this._bindPanel();
      };
    });
    this._bindPanel();
  },

  _bindPanel() {
    // Save API key
    const saveBtn = document.getElementById('save-key-btn');
    if (saveBtn) saveBtn.onclick = () => {
      this.ANTHROPIC_KEY = document.getElementById('api-key-input').value.trim();
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => { saveBtn.textContent = 'Save Key'; }, 2000);
    };

    // Chat
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) {
      const send = async () => {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg || !this.ANTHROPIC_KEY) {
          if (!this.ANTHROPIC_KEY) alert('Please add your Anthropic API key first.');
          return;
        }
        input.value = '';
        const messages = document.getElementById('chat-messages');
        messages.innerHTML += `<div class="chat-msg user">${msg}</div>`;
        messages.innerHTML += `<div class="chat-msg ai" id="ai-typing"><span class="spinner" style="width:16px;height:16px;border-width:2px"></span></div>`;
        messages.scrollTop = messages.scrollHeight;

        try {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': this.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514', max_tokens: 1000,
              system: 'You are an AI assistant for Obsidian LITE, a paper trading Chrome extension PWA. Help with bugs, features, and code questions. Be concise.',
              messages: [{ role: 'user', content: msg }]
            })
          });
          const data = await res.json();
          const reply = data.content?.[0]?.text || 'No response.';
          document.getElementById('ai-typing').textContent = reply;
        } catch(e) {
          document.getElementById('ai-typing').textContent = 'Error: ' + e.message;
        }
        messages.scrollTop = messages.scrollHeight;
      };

      sendBtn.onclick = send;
      document.getElementById('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    }
  }
};
