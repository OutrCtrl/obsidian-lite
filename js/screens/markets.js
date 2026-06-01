const MarketsScreen = {
  render() {
    return `
<div class="page-header" style="padding-top:24px">
  <div class="page-title">Markets</div>
  <div class="page-sub">Live · Binance</div>
</div>
<div class="card" style="padding:16px" id="markets-list">
  ${ENGINE.PAIRS.map(pair => {
    const d = ENGINE.prices[pair] || {};
    const price = d.price ? ENGINE.fmt(d.price) : '—';
    const change = d.change !== undefined ? ENGINE.fmtPct(d.change) : '—';
    const isPos = (d.change || 0) >= 0;
    const barH = [4, 8, 12, 16, 20].map(h => `<div class="bar" style="height:${h}px;opacity:${Math.random() > 0.3 ? 1 : 0.3}"></div>`).join('');
    return `
    <div class="market-row">
      <div>
        <div class="market-pair">${ENGINE.DISPLAY[pair]}</div>
        <div class="signal-bars" style="margin-top:6px">${barH}</div>
      </div>
      <div style="text-align:right">
        <div class="market-price" id="price-${pair}">${price}</div>
        <div class="market-change ${isPos ? 'pos' : 'neg'}" id="change-${pair}">${change}</div>
      </div>
    </div>`;
  }).join('')}
</div>`;
  },

  bind() {
    ENGINE.onPrice((prices) => {
      ENGINE.PAIRS.forEach(pair => {
        const d = prices[pair];
        if (!d) return;
        const priceEl = document.getElementById(`price-${pair}`);
        const changeEl = document.getElementById(`change-${pair}`);
        if (priceEl) priceEl.textContent = ENGINE.fmt(d.price);
        if (changeEl) {
          changeEl.textContent = ENGINE.fmtPct(d.change);
          changeEl.className = `market-change ${d.change >= 0 ? 'pos' : 'neg'}`;
        }
      });
    });
  }
};
