// ===========================
// 보유종목 KPI 모니터링 — 렌더링
// 데이터는 js/kpi-data.js 의 KPI_DATA 에 있습니다.
// ===========================

const EMPTY = '—';

function kpiEscape(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function formatUpdated(dateStr) {
  if (!dateStr) return EMPTY;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}. ${parts[1]}. ${parts[2]}`;
}

function cadenceBadges(cadence) {
  if (!Array.isArray(cadence) || cadence.length === 0) return '';
  return cadence
    .map(c => `<span class="kpi-badge kpi-badge--cadence">${kpiEscape(c)}</span>`)
    .join('');
}

function natureBadge(nature) {
  if (!nature) return '';
  const mod = nature === '정성' ? 'kpi-badge--qual' : 'kpi-badge--quant';
  return `<span class="kpi-badge ${mod}">${kpiEscape(nature)}</span>`;
}

function kpiRow(kpi) {
  const hasValue = kpi.value !== null && kpi.value !== undefined && kpi.value !== '';
  const valueCell = hasValue
    ? `<div class="kpi-value">${kpiEscape(kpi.value)}</div>` +
      (kpi.asOf ? `<div class="kpi-asof">${kpiEscape(kpi.asOf)} 기준</div>` : '')
    : `<div class="kpi-value kpi-value--empty">${EMPTY}</div>`;

  const note = kpi.cadenceNote
    ? `<div class="kpi-asof">${kpiEscape(kpi.cadenceNote)}</div>`
    : '';

  return `
    <tr>
      <td class="kpi-cell-rank"><span class="kpi-rank">${kpiEscape(kpi.rank)}</span></td>
      <td class="kpi-cell-name">
        <div class="kpi-name">${kpiEscape(kpi.name)}</div>
        <div class="kpi-why">${kpiEscape(kpi.why)}</div>
      </td>
      <td class="kpi-cell-value">${valueCell}</td>
      <td class="kpi-cell-source">${kpiEscape(kpi.source)}</td>
      <td class="kpi-cell-badges">
        <div class="kpi-badge-row">${cadenceBadges(kpi.cadence)}${natureBadge(kpi.nature)}</div>
        ${note}
      </td>
    </tr>`;
}

function renderPanel(holding) {
  const rows = holding.kpis
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map(kpiRow)
    .join('');

  const cautions = (holding.cautions || [])
    .map(c => `<li>${kpiEscape(c)}</li>`)
    .join('');

  const cautionBox = cautions
    ? `<div class="kpi-caution">
         <div class="kpi-caution-title">⚠️ 주의사항</div>
         <ul class="kpi-caution-list">${cautions}</ul>
       </div>`
    : '';

  return `
    <div class="kpi-panel" id="panel-${kpiEscape(holding.ticker)}">
      <div class="kpi-moat">
        <div class="kpi-moat-head">
          <div>
            <span class="kpi-moat-ticker">${kpiEscape(holding.ticker)}</span>
            <span class="kpi-moat-name">${kpiEscape(holding.name)}</span>
          </div>
          <div class="kpi-updated">최종 업데이트 ${formatUpdated(holding.updated)}</div>
        </div>
        <div class="kpi-moat-text">${kpiEscape(holding.moat)}</div>
      </div>

      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <div>
            <div class="card-title">핵심 KPI</div>
            <div class="card-subtitle">우선순위 순 · 총 ${holding.kpis.length}개</div>
          </div>
        </div>
        <div class="perf-table-wrapper">
          <table class="perf-table kpi-table">
            <thead>
              <tr>
                <th class="kpi-cell-rank">순위</th>
                <th>지표 / 보는 이유</th>
                <th>최신값</th>
                <th>출처</th>
                <th>주기 · 성격</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="kpi-scroll-hint">← 표를 좌우로 밀어 전체 항목을 확인하세요</div>
      </div>

      ${cautionBox}
    </div>`;
}

function setTicker(ticker) {
  document.querySelectorAll('#kpiTabs button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ticker === ticker);
  });
  document.querySelectorAll('.kpi-panel').forEach(panel => {
    panel.classList.toggle('kpi-panel--active', panel.id === `panel-${ticker}`);
  });
}

function initKpiPage() {
  const tabsEl = document.getElementById('kpiTabs');
  const panelsEl = document.getElementById('kpiPanels');
  if (!tabsEl || !panelsEl || typeof KPI_DATA === 'undefined') return;

  const holdings = KPI_DATA.holdings || [];
  if (holdings.length === 0) return;

  tabsEl.innerHTML = holdings
    .map(h => `<button type="button" data-ticker="${kpiEscape(h.ticker)}">${kpiEscape(h.ticker)}</button>`)
    .join('');

  panelsEl.innerHTML = holdings.map(renderPanel).join('');

  tabsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => setTicker(btn.dataset.ticker));
  });

  setTicker(holdings[0].ticker);
}

window.addEventListener('DOMContentLoaded', initKpiPage);
