const ENGINE = {
  prices: {},
  ws: null,
  callbacks: [],
  botInterval: null,
  PAIRS: ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','AVAXUSDT','MATICUSDT','LINKUSDT'],
  DISPLAY: { BTCUSDT:'BTC/USDT', ETHUSDT:'ETH/USDT', SOLUSDT:'SOL/USDT', BNBUSDT:'BNB/USDT', XRPUSDT:'XRP/USDT', AVAXUSDT:'AVAX/USDT', MATICUSDT:'MATIC/USDT', LINKUSDT:'LINK/USDT' },
  STRATEGIES: ['Momentum Break','Mean Rev α','Accumulation','Trend Follow','Grid Scalp','VWAP Bounce','RSI Divergence','Volume Surge','Breakout Pull','Delta Neutral'],
  PRESETS: {
    PRECISION: { tp: 2, sl: 3, label: 'Precision', sub: '2% TP / 3% SL' },
    BALANCED:  { tp: 5, sl: 5, label: 'Balanced',  sub: '5% TP / 5% SL' },
    MAXIMUM:   { tp: 10, sl: 10, label: 'Maximum',  sub: '10% TP / 10% SL' }
  },

  connect() {
    try {
      const streams = this.PAIRS.map(p => `${p.toLowerCase()}@ticker`).join('/');
      this.ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (!msg.data) return;
        const d = msg.data;
        this.prices[d.s] = { price: parseFloat(d.c), change: parseFloat(d.P), volume: parseFloat(d.v) };
        this.callbacks.forEach(cb => cb(this.prices));
      };
      this.ws.onerror = () => this._fallback();
      this.ws.onclose = () => setTimeout(() => this.connect(), 5000);
    } catch(e) { this._fallback(); }
  },

  async _fallback() {
    try {
      const r = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const all = await r.json();
      all.filter(t => this.PAIRS.includes(t.symbol)).forEach(t => {
        this.prices[t.symbol] = { price: parseFloat(t.lastPrice), change: parseFloat(t.priceChangePercent), volume: parseFloat(t.volume) };
      });
      this.callbacks.forEach(cb => cb(this.prices));
    } catch(e) {}
    setTimeout(() => this._fallback(), 10000);
  },

  onPrice(cb) { this.callbacks.push(cb); },

  getCSS(pair) {
    // Simulated composite signal score 0-100
    const seed = pair.charCodeAt(0) + Date.now() % 100;
    return Math.floor(30 + (Math.sin(seed * 0.1) + 1) * 30 + Math.random() * 10);
  },

  cssColor(score) {
    if (score >= 70) return 'var(--up)';
    if (score >= 40) return 'var(--gold)';
    return 'var(--down)';
  },

  async runBot(profile, openTrades) {
    if (!profile.bot_active) return;
    const preset = this.PRESETS[profile.preset] || this.PRESETS.BALANCED;
    // Close profitable trades
    for (const trade of openTrades) {
      const current = this.prices[trade.pair.replace('/','')];
      if (!current) continue;
      const entry = parseFloat(trade.entry_price);
      const pct = trade.side === 'LONG'
        ? ((current.price - entry) / entry) * 100
        : ((entry - current.price) / entry) * 100;
      if (pct >= preset.tp || pct <= -preset.sl) {
        const pnl = (pct / 100) * parseFloat(trade.size);
        await DB.closeTrade(trade.id, current.price, parseFloat(pnl.toFixed(2)));
      }
    }
    // Maybe open new trade
    if (openTrades.length < 3 && Math.random() > 0.7) {
      const pair = this.PAIRS[Math.floor(Math.random() * this.PAIRS.length)];
      const current = this.prices[pair];
      if (current) {
        const side = Math.random() > 0.5 ? 'long' : 'short';
        const size = (profile.paper_balance * 0.05);
        const strategy = this.STRATEGIES[Math.floor(Math.random() * this.STRATEGIES.length)];
        const score = this.getCSS(pair);
        if (score > 45) {
          await DB.insertTrade({
            user_id: profile.id, pair: this.DISPLAY[pair] || pair,
            side, entry_price: current.price, size: parseFloat(size.toFixed(2)),
            strategy, signal_score: score, status: 'open'
          });
        }
      }
    }
  },

  startBot(profile, getOpenTrades) {
    this.stopBot();
    this.botInterval = setInterval(async () => {
      const trades = await getOpenTrades();
      await this.runBot(profile, trades);
    }, 15000);
  },

  stopBot() {
    if (this.botInterval) { clearInterval(this.botInterval); this.botInterval = null; }
  },

  fmt(n, decimals = 2) {
    if (!n && n !== 0) return '—';
    if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '$' + parseFloat(n).toFixed(decimals);
  },

  fmtPct(n) {
    const sign = n >= 0 ? '+' : '';
    return sign + parseFloat(n).toFixed(2) + '%';
  }
};
