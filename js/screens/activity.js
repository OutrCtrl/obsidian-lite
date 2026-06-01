const ActivityScreen = {
  tab: 'open',

  async render(profile) {
    const { data: trades } = await DB.getTrades(profile.id);
    const open = trades.filter(t => t.status === 'open');
    const closed = trades.filter(t => t.status === 'closed');

    return `
<div class="page-header" style="padding-top:24px">
  <div class="page-title">Activity</div>
</div>

<div style="display:flex;gap:0;border-bottom:1px solid var(--line);margin:16px 16px 0">
  <div class="admin-tab ${this.tab === 'open' ? 'active' : ''}" id="tab-open" style="flex:1">Open (${open.length})</div>
  <div class="admin-tab ${this.tab === 'closed' ? 'active' : ''}" id="tab-closed" style="flex:1">History (${closed.length})</div>
</div>

<div id="activity-content">
  ${this._renderList(this.tab === 'open' ? open : closed, this.tab)}
</div>`;
  },

  _renderList(trades, type) {
    if (!trades.length) return `
      <div class="empty">
        <div class="empty-icon">📊</div>
        <div class="empty-text">${type === 'open' ? 'No open positions. Start the bot to begin trading.' : 'No trade history yet.'}</div>
      </div>`;

    return `<div class="card" style="padding:16px">
      ${trades.map(t => {
        const pnl = t.pnl || 0;
        const pnlClass = pnl >= 0 ? 'pos' : 'neg';
        const pnlStr = type === 'closed'
          ? `<div class="trade-pnl ${pnlClass}">${pnl >= 0 ? '+' : ''}${ENGINE.fmt(pnl)}</div>`
          : `<div style="font-size:11px;color:var(--dim);font-family:var(--mono)">${ENGINE.fmt(t.entry_price)}</div>`;
        return `
          <div class="trade-row">
            <div>
              <div class="trade-pair">${t.pair}</div>
              <div class="trade-strategy">${t.strategy || '—'} ${t.signal_score ? '· CSS ' + t.signal_score : ''}</div>
            </div>
            <div class="trade-dir ${t.direction === 'LONG' ? 'long' : 'short'}">${t.direction}</div>
            ${pnlStr}
          </div>`;
      }).join('')}
    </div>`;
  },

  bind(profile) {
    document.getElementById('tab-open').onclick = async () => {
      this.tab = 'open';
      const { data: trades } = await DB.getTrades(profile.id);
      const open = trades.filter(t => t.status === 'open');
      document.getElementById('tab-open').className = 'admin-tab active';
      document.getElementById('tab-closed').className = 'admin-tab';
      document.getElementById('activity-content').innerHTML = this._renderList(open, 'open');
    };
    document.getElementById('tab-closed').onclick = async () => {
      this.tab = 'closed';
      const { data: trades } = await DB.getTrades(profile.id);
      const closed = trades.filter(t => t.status === 'closed');
      document.getElementById('tab-open').className = 'admin-tab';
      document.getElementById('tab-closed').className = 'admin-tab active';
      document.getElementById('activity-content').innerHTML = this._renderList(closed, 'closed');
    };
  }
};
