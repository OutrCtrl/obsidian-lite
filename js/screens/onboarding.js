const OnboardingScreen = {
  EXCHANGES: ['Binance','Bybit','OKX','KuCoin','Coinbase Adv','Kraken','Gate.io','Bitget','HTX','Binance US'],
  selected: new Set(),
  preset: 'BALANCED',
  render(step = 1) {
    if (step === 1) return this._step1();
    if (step === 2) return this._step2();
    return this._step3();
  },
  _step1() {
    return `<div class="ob-wrap">
  <div class="ob-step">Step 1 of 3</div>
  <div class="ob-title">Welcome to<br><span style="color:var(--accent)">Obsidian LITE</span></div>
  <div class="ob-sub">Precision paper trading intelligence. Test strategies risk-free with $10,000 virtual balance and live market data.</div>
  <div class="ob-actions"><button class="btn btn-primary" id="ob-next">Get Started</button></div>
</div>`;
  },
  _step2() {
    return `<div class="ob-wrap">
  <div class="ob-step">Step 2 of 3</div>
  <div class="ob-title">Choose Your<br>Exchanges</div>
  <div class="ob-sub">Select exchanges you trade on.</div>
  <div class="exchange-grid" id="ex-grid">
    ${this.EXCHANGES.map(e => `<div class="exchange-chip ${this.selected.has(e) ? 'selected' : ''}" data-ex="${e}"><div class="exchange-chip-name">${e}</div><div class="exchange-chip-tier">Tier 1</div></div>`).join('')}
  </div>
  <div class="ob-actions">
    <button class="btn btn-primary" id="ob-next">Continue</button>
    <button class="btn btn-ghost" id="ob-back">Back</button>
  </div>
</div>`;
  },
  _step3() {
    return `<div class="ob-wrap">
  <div class="ob-step">Step 3 of 3</div>
  <div class="ob-title">Choose Your<br>Strategy Preset</div>
  <div class="ob-sub">Set your risk profile. You can change this anytime.</div>
  ${Object.entries(ENGINE.PRESETS).map(([key, p]) => `
    <div class="card ${this.preset === key ? 'card-v' : ''}" style="cursor:pointer;margin-top:12px" data-preset="${key}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><div style="font-weight:700;font-size:15px">${p.label}</div><div style="font-size:12px;color:var(--dim)">${p.sub}</div></div>
        <div style="width:24px;height:24px;border-radius:50%;border:2px solid ${this.preset === key ? 'var(--accent)' : 'var(--line)'};display:flex;align-items:center;justify-content:center">
          ${this.preset === key ? '<div style="width:12px;height:12px;border-radius:50%;background:var(--accent)"></div>' : ''}
        </div>
      </div>
    </div>`).join('')}
  <div class="ob-actions" style="margin-top:32px">
    <button class="btn btn-primary" id="ob-finish">Start Trading</button>
    <button class="btn btn-ghost" id="ob-back">Back</button>
  </div>
</div>`;
  },
  bind(step, profile, onComplete) {
    if (step === 2) {
      document.querySelectorAll('.exchange-chip').forEach(chip => {
        chip.onclick = () => {
          const ex = chip.dataset.ex;
          if (this.selected.has(ex)) { this.selected.delete(ex); chip.classList.remove('selected'); }
          else { this.selected.add(ex); chip.classList.add('selected'); }
        };
      });
      document.getElementById('ob-back').onclick = () => {
        document.getElementById('screen').innerHTML = this.render(1);
        this.bind(1, profile, onComplete);
      };
    }
    if (step === 3) {
      document.querySelectorAll('[data-preset]').forEach(card => {
        card.onclick = () => {
          this.preset = card.dataset.preset;
          document.getElementById('screen').innerHTML = this.render(3);
          this.bind(3, profile, onComplete);
        };
      });
      document.getElementById('ob-back').onclick = () => {
        document.getElementById('screen').innerHTML = this.render(2);
        this.bind(2, profile, onComplete);
      };
      document.getElementById('ob-finish').onclick = async () => {
        const btn = document.getElementById('ob-finish');
        btn.textContent = '...'; btn.disabled = true;
        await DB.updateProfile(profile.id, { exchanges: [...this.selected], preset: this.preset });
        onComplete();
      };
      return;
    }
    const next = document.getElementById('ob-next');
    if (next) next.onclick = () => {
      const nextStep = step + 1;
      document.getElementById('screen').innerHTML = this.render(nextStep);
      this.bind(nextStep, profile, onComplete);
    };
  }
};
