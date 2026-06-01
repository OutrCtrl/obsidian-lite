const DashboardScreen = {
  async render(profile) {
    const { data: trades } = await DB.getTrades(profile.id);
    const open = (trades || []).filter(t => t.status === 'open');
    const closed = (trades || []).filter(t => t.status === 'closed');
    const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = closed.filter(t => t.pnl > 0).length;
    const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;
    const css = 62;
    const preset = ENGINE.PRESETS[profile.preset] || ENGINE.PRESETS.BALANCED;
    return `
<div class="page-header" style="padding-top:24px">
  <div><div class="page-title">Dashboard</div><div class="page-sub" style="margin-top:4px">Precision trading intelligence.</div></div>
  <div style="font-family:var(--mono);font-size:13px;color:var(--accent);font-weight:600">${ENGINE.fmt(profile.paper_balance)}</div>
</div>
<div class="bot-hero">
  <div class="bot-status ${profile.bot_active ? 'running' : ''}" id="bot-status-badge">
    <div class="bot-status-dot"></div>${profile.bot_active ? 'Bot Running' : 'Bot Stopped'}
  </div>
  <div class="ring-wrap">
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="68" fill="none" stroke="var(--track)" stroke-width="8"/>
      <circle cx="80" cy="80" r="68" fill="none" stroke="url(#ringGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 68}" stroke-dashoffset="${2 * Math.PI * 68 * (1 - css / 100)}" style="transition:stroke-dashoffset .5s ease"/>
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="160" y2="0"><stop offset="0%" stop-color="#5B2A8C"/><stop offset="100%" stop-color="#A86CE0"/></linearGradient></defs>
    </svg>
    <div class="ring-center"><div class="ring-score" id="ring-score">${css}</div><div class="ring-label">CSS Score</div></div>
  </div>
  <div class="toggle-row" style="width:200px;margin:0 auto">
    <span style="font-size:14px;color:var(--silver)">Auto Trade</span>
    <label class="toggle-wrap"><input type="checkbox" id="bot-toggle" ${profile.bot_active ? 'checked' : ''}><span class="toggle-slider"></span></label>
  </div>
</div>
<div class="stats-row">
  <div class="stat-box"><div class="stat-val" style="color:${totalPnl >= 0 ? 'var(--up)' : 'var(--down)'}">${totalPnl >= 0 ? '+' : ''}${ENGINE.fmt(totalPnl)}</div><div class="stat-lbl">Total P&L</div></div>
  <div class="stat-box"><div class="stat-val">${open.length}</div><div class="stat-lbl">Open</div></div>
  <div class="stat-box"><div class="stat-val" style="color:var(--accent)">${winRate}%</div><div class="stat-lbl">Win Rate</div></div>
</div>
<div class="section-title">Strategy Preset</div>
<div class="preset-row">
  ${Object.entries(ENGINE.PRESETS).map(([key, p]) => `<div class="preset-chip ${profile.preset === key ? 'active' : ''}" data-preset="${key}"><div class="preset-chip-name">${p.label}</div><div class="preset-chip-sub">${p.sub}</div></div>`).join('')}
</div>
${open.length > 0 ? `<div class="section-title">Open Positions</div><div class="card" style="padding:16px">${open.slice(0,3).map(t => `<div class="trade-row"><div><div class="trade-pair">${t.pair}</div><div class="trade-strategy">${t.strategy||'—'}</div></div><div class="trade-dir ${t.side==='long'?'long':'short'}">${t.side?.toUpperCase()||'—'}</div><div style="font-size:11px;color:var(--dim)">${ENGINE.fmt(t.entry_price)}</div></div>`).join('')}</div>` : ''}`;
  },
  bind(profile, refresh) {
    const toggle = document.getElementById('bot-toggle');
    if (toggle) toggle.onchange = async (e) => {
      const active = e.target.checked;
      const badge = document.getElementById('bot-status-badge');
      if (badge) { badge.className = `bot-status ${active ? 'running' : ''}`; badge.innerHTML = `<div class="bot-status-dot"></div>${active ? 'Bot Running' : 'Bot Stopped'}`; }
      await DB.updateProfile(profile.id, { bot_active: active });
      profile.bot_active = active;
      if (active) { ENGINE.startBot(profile, async () => { const { data } = await DB.getTrades(profile.id, 'open'); return data || []; }); }
      else { ENGINE.stopBot(); }
    };
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.onclick = async () => {
        const p = chip.dataset.preset;
        await DB.updateProfile(profile.id, { preset: p });
        profile.preset = p;
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
    });
    ENGINE.onPrice((prices) => {
      const scores = Object.keys(prices).map(p => ENGINE.getCSS(p));
      const avg = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
      const el = document.getElementById('ring-score');
      if (el) el.textContent = avg;
    });
  }
};
