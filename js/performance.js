// ===========================
// Performance Data — 나무늘보 투자조합
// 설정일: 2026년 1월
// ===========================
const data = {
  quarterly: {
    labels: ['26Q1', '26Q2'],
    fund:   [-1.8, 41.5],
    sp500:  [-7.14, 14.9],
    msci:   [-5.63, 13.8],
  },
  annual: {
    labels: ['2026 YTD'],
    fund:   [43.4],
    sp500:  [9.6],
    msci:   [9.7],
  },
  // Modified Dietz 기준 공식 누적 수익률 (단순 연결과 다를 수 있음)
  cumulative: {
    labels: ['설정 기준점', '26Q1', '26Q2'],
    fund:   [0, -1.8, 43.4],
    sp500:  [0, -7.14, 9.6],
    msci:   [0, -5.63, 9.7],
  }
};

const cumulativeLabels = data.cumulative.labels;
const cumulativeFund   = data.cumulative.fund;
const cumulativeSP     = data.cumulative.sp500;
const cumulativeMSCI   = data.cumulative.msci;

// ===========================
// Chart Config
// ===========================
let mainChart = null;
let currentView = 'cumulative';

const tooltipConfig = {
  backgroundColor: '#1a1a22',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  titleColor: '#8888a0',
  bodyColor: '#e8e8f0',
  padding: 12,
};

const scaleConfig = {
  x: {
    grid: { display: false },
    border: { display: false },
    ticks: { color: '#55556a', font: { size: 11 } }
  },
  y: {
    grid: { color: 'rgba(255,255,255,0.04)' },
    border: { display: false },
    ticks: {
      color: '#55556a',
      font: { size: 11 },
      callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
    }
  }
};

const legendConfig = {
  display: true,
  position: 'top',
  align: 'end',
  labels: {
    color: '#8888a0',
    font: { size: 12 },
    boxWidth: 12,
    boxHeight: 12,
    usePointStyle: true,
    pointStyle: 'rectRounded',
    padding: 16,
  }
};

function formatReturn(v) {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

// ===========================
// View Toggle
// ===========================
function setView(view) {
  currentView = view;

  document.querySelectorAll('.chart-toggle button').forEach(btn => btn.classList.remove('active'));
  const btnId = { cumulative: 'btnCumulative', quarterly: 'btnQuarterly', ytd: 'btnYTD' }[view];
  document.getElementById(btnId).classList.add('active');

  const ctx = document.getElementById('mainChart').getContext('2d');
  if (mainChart) { mainChart.destroy(); mainChart = null; }

  if (view === 'cumulative') {
    document.getElementById('chartSubtitle').textContent = '설정일 이후 누적 수익률';
    mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: cumulativeLabels,
        datasets: [
          lineDataset('나무늘보 투자조합', cumulativeFund, '#3d9970', 'rgba(61,153,112,0.08)', true),
          lineDataset('S&P 500', cumulativeSP, '#f87171', 'transparent', false, [5, 3]),
          lineDataset('MSCI 선진국', cumulativeMSCI, '#fbbf24', 'transparent', false, [3, 2]),
        ]
      },
      options: buildLineOptions('누적 수익률')
    });

  } else if (view === 'quarterly') {
    document.getElementById('chartSubtitle').textContent = '분기별 수익률';
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.quarterly.labels,
        datasets: [
          barDataset('나무늘보 투자조합', data.quarterly.fund, '#3d9970'),
          barDataset('S&P 500', data.quarterly.sp500, '#f87171'),
          barDataset('MSCI 선진국', data.quarterly.msci, '#fbbf24'),
        ]
      },
      options: buildBarOptions()
    });

  } else if (view === 'ytd') {
    document.getElementById('chartSubtitle').textContent = '연도별 수익률';
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.annual.labels,
        datasets: [
          barDataset('나무늘보 투자조합', data.annual.fund, '#3d9970'),
          barDataset('S&P 500', data.annual.sp500, '#f87171'),
          barDataset('MSCI 선진국', data.annual.msci, '#fbbf24'),
        ]
      },
      options: buildBarOptions()
    });
  }
}

function lineDataset(label, data, color, fill, filled, dash) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill,
    borderWidth: filled ? 2.5 : 1.5,
    borderDash: dash || [],
    pointRadius: 5,
    pointBackgroundColor: color,
    pointBorderColor: '#131318',
    pointBorderWidth: 2,
    pointHoverRadius: 7,
    fill: filled,
    tension: 0.3,
  };
}

function barDataset(label, data, color) {
  return {
    label,
    data,
    backgroundColor: data.map(v => v >= 0 ? color + 'bb' : color + '66'),
    borderColor: color,
    borderWidth: 1.5,
    borderRadius: 5,
  };
}

function buildLineOptions(unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendConfig,
      tooltip: {
        ...tooltipConfig,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${formatReturn(ctx.parsed.y)}`
        }
      }
    },
    scales: scaleConfig
  };
}

function buildBarOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: legendConfig,
      tooltip: {
        ...tooltipConfig,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${formatReturn(ctx.parsed.y)}`
        }
      }
    },
    scales: scaleConfig
  };
}

// ===========================
// Tables
// ===========================
function renderQuarterlyTable() {
  const tbody = document.getElementById('quarterlyTableBody');
  if (!tbody) return;

  let cumFund = 100, cumSP = 100, cumMSCI = 100;

  const rows = data.quarterly.labels.map((label, i) => {
    const f = data.quarterly.fund[i];
    const s = data.quarterly.sp500[i];
    const m = data.quarterly.msci[i];
    cumFund = cumFund * (1 + f / 100);
    cumSP = cumSP * (1 + s / 100);
    cumMSCI = cumMSCI * (1 + m / 100);
    const cumF = cumFund - 100;
    const excessSP = f - s;
    const excessMSCI = f - m;

    return `<tr>
      <td><span class="badge-quarter">${label}</span></td>
      <td class="${f >= 0 ? 'positive' : 'negative'}">${formatReturn(f)}</td>
      <td class="${s >= 0 ? 'positive' : 'negative'} neutral">${formatReturn(s)}</td>
      <td class="${m >= 0 ? 'positive' : 'negative'} neutral">${formatReturn(m)}</td>
      <td class="${excessSP >= 0 ? 'positive' : 'negative'}">${excessSP >= 0 ? '+' : ''}${excessSP.toFixed(2)}%p</td>
    </tr>`;
  });

  tbody.innerHTML = rows.reverse().join('');
}

function renderAnnualTable() {
  const tbody = document.getElementById('annualTableBody');
  if (!tbody) return;

  const rows = data.annual.labels.map((label, i) => {
    const f = data.annual.fund[i];
    const s = data.annual.sp500[i];
    const m = data.annual.msci[i];
    const excessSP = f - s;

    return `<tr>
      <td class="font-medium">${label}</td>
      <td class="${f >= 0 ? 'positive' : 'negative'}">${formatReturn(f)}</td>
      <td class="${s >= 0 ? 'positive' : 'negative'} neutral">${formatReturn(s)}</td>
      <td class="${m >= 0 ? 'positive' : 'negative'} neutral">${formatReturn(m)}</td>
      <td class="${excessSP >= 0 ? 'positive' : 'negative'}">${excessSP >= 0 ? '+' : ''}${excessSP.toFixed(2)}%p</td>
    </tr>`;
  });

  tbody.innerHTML = rows.reverse().join('');
}

window.addEventListener('DOMContentLoaded', () => {
  setView('cumulative');
  renderQuarterlyTable();
  renderAnnualTable();
});
