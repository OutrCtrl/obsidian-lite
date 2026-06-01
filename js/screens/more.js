const MoreScreen = {
  render(profile) {
    const initials = (profile.email || 'U').slice(0, 2).toUpperCase();
    const exchangeCount = (profile.selected_exchanges || []).length;

    return `
<div class="page-header" style="padding-top:24px">
  <div class="page-title">More</div>
</div>

<div class="profile-row">
  <div class="profile-avatar">${initials}</div>
  <div>
    <div class="profile-name">${profile.username || profile.email.split('@')[0]}</div>
    <div class="profile-email">${profile.email}</div>
  </div>
</div>

<div class="section-title">Account</div>
<div class="card" style="padding:0 16px">
  <div class="trade-row">
    <div>
      <div style="font-size:14px;font-weight:500">Paper Balance</div>
    </div>
    <div style="font-family:var(--mono);font-size:14px;font-weight:600;color:var(--accent)">${ENGINE.fmt(profile.paper_balance)}</div>
  </div>
  <div class="trade-row">
    <div>
      <div style="font-size:14px;font-weight:500">Exchanges Connected</div>
    </div>
    <div style="font-family:var(--mono);font-size:14px;color:var(--silver)">${exchangeCount}</div>
  </div>
  <div class="trade-row">
    <div>
      <div style="font-size:14px;font-weight:500">Strategy Preset</div>
    </div>
    <div style="font-family:var(--mono);font-size:12px;color:var(--silver)">${profile.selected_preset || 'BALANCED'}</div>
  </div>
  <div class="trade-row" style="border:none">
    <div>
      <div style="font-size:14px;font-weight:500">Plan</div>
    </div>
    <div style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;background:rgba(168,108,224,.15);color:var(--accent)">${(profile.plan || 'FREE').toUpperCase()}</div>
  </div>
</div>

<div class="section-title">Settings</div>
<div class="card" style="padding:0 16px">
  <div class="trade-row" style="cursor:pointer" id="reset-balance">
    <div style="font-size:14px;font-weight:500">Reset Paper Balance</div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </div>
</div>

<div style="margin:24px 16px 0">
  <button class="btn btn-danger" id="signout-btn">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    Sign Out
  </button>
</div>

<div style="text-align:center;padding:32px 0 8px;font-size:11px;color:var(--dim);font-family:var(--mono)">
  Obsidian LITE · Precision trading intelligence.
</div>`;
  },

  bind(profile, onSignOut) {
    document.getElementById('signout-btn').onclick = async () => {
      await DB.signOut();
      onSignOut();
    };

    document.getElementById('reset-balance').onclick = async () => {
      if (!confirm('Reset paper balance to $10,000?')) return;
      await DB.updateProfile(profile.id, { paper_balance: 10000 });
      profile.paper_balance = 10000;
      document.getElementById('screen').innerHTML = this.render(profile);
      this.bind(profile, onSignOut);
    };
  }
};
