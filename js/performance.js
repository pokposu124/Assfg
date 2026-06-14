// ===========================
// Performance Data
// ===========================
const data = {
  quarterly: {
    labels: ['22Q4', '23Q1', '23Q2', '23Q3', '23Q4', '24Q1', '24Q2', '24Q3', '24Q4', '25Q1', '25Q2'],
    returns: [3.2, 7.1, -2.3, 4.8, 11.2, 9.5, 3.7, -1.8, 14.3, 8.2, 5.6],
    benchmark: [1.8, 5.2, -3.1, 2.4, 7.8, 6.3, 1.2, -3.5, 10.1, 5.1, 3.2],
  },
  annual: {
    labels: ['2022 (Q4)', '2023', '2024', '2025 (YTD)'],
    returns: [3.2, 22.5, 27.8, 14.1],
    benchmark: [1.8, 13.0, 15.5, 8.5],
  }
};

// Compute cumulative returns
function computeCumulative(returns) {
  let cum = 100;
  return returns.map(r => {
    cum = cum * (1 + r / 100);
    return parseFloat((cum - 100).toFixed(2));
  });
}

const cumulativeReturns = computeCumulative(data.quarterly.returns);
const cumulativeBenchmark = computeCumulative(data.quarterly.benchmark);

// ===========================
// Chart Setup
// ===========================
let mainChart = null;
let currentView = 'cumulative';

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        color: '#8888a0',
        font: { size: 12 },
        boxWidth: 12,
        boxHeight: 12,
        borderRadius: 2,
        usePointStyle: true,
        pointStyle: 'rectRounded',
        padding: 16,
      }
    },
    tooltip: {
      backgroundColor: '#1a1a22',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#8888a0',
      bodyColor: '#e8e8f0',
      padding: 12,
      callbacks: {
        label: ctx => {
          const val = ctx.parsed.y;
          return ` ${ctx.dataset.label}: ${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
        }
      }
    }
  },
  scales: {
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
        callback: v => (v >= 0 ? '+' : '') + v.toFixed(0) + '%'
      }
    }
  }
};

function buildLineDatasets(portfolioData, benchmarkData, portfolioLabel, benchmarkLabel) {
  return [
    {
      label: portfolioLabel,
      data: portfolioData,
      borderColor: '#4f7ef7',
      backgroundColor: 'rgba(79, 126, 247, 0.06)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: '#4f7ef7',
      pointBorderColor: '#131318',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3,
    },
    {
      label: benchmarkLabel,
      data: benchmarkData,
      borderColor: '#55556a',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [5, 3],
      pointRadius: 3,
      pointBackgroundColor: '#55556a',
      pointBorderColor: '#131318',
      pointBorderWidth: 2,
      pointHoverRadius: 5,
      fill: false,
      tension: 0.3,
    }
  ];
}

function buildBarDatasets(portfolioData, benchmarkData) {
  return [
    {
      label: '운용 수익률',
      data: portfolioData,
      backgroundColor: portfolioData.map(v => v >= 0 ? 'rgba(79, 126, 247, 0.75)' : 'rgba(248, 113, 113, 0.75)'),
      borderColor: portfolioData.map(v => v >= 0 ? '#4f7ef7' : '#f87171'),
      borderWidth: 1,
      borderRadius: 5,
      borderSkipped: false,
    },
    {
      label: '벤치마크 (KOSPI)',
      data: benchmarkData,
      backgroundColor: 'rgba(85, 85, 106, 0.3)',
      borderColor: '#55556a',
      borderWidth: 1,
      borderRadius: 5,
      borderSkipped: false,
    }
  ];
}

function setView(view) {
  currentView = view;

  // Update button states
  document.querySelectorAll('.chart-toggle button').forEach(btn => btn.classList.remove('active'));
  document.getElementById('btn' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');

  const ctx = document.getElementById('mainChart').getContext('2d');
  if (mainChart) {
    mainChart.destroy();
    mainChart = null;
  }

  if (view === 'cumulative') {
    document.getElementById('chartSubtitle').textContent = '설정 이후 분기별 누적 수익률';
    mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.quarterly.labels,
        datasets: buildLineDatasets(cumulativeReturns, cumulativeBenchmark, '운용 누적 수익률', '벤치마크 누적 수익률')
      },
      options: {
        ...chartDefaults,
        plugins: {
          ...chartDefaults.plugins,
          tooltip: {
            ...chartDefaults.plugins.tooltip,
            callbacks: {
              label: ctx => {
                const val = ctx.parsed.y;
                return ` ${ctx.dataset.label}: ${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
              },
              afterBody: (items) => {
                if (items.length >= 2) {
                  const excess = items[0].parsed.y - items[1].parsed.y;
                  return [``, ` 초과 수익: ${excess >= 0 ? '+' : ''}${excess.toFixed(1)}%p`];
                }
                return [];
              }
            }
          }
        }
      }
    });

  } else if (view === 'quarterly') {
    document.getElementById('chartSubtitle').textContent = '분기별 운용 수익률';
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.quarterly.labels,
        datasets: buildBarDatasets(data.quarterly.returns, data.quarterly.benchmark)
      },
      options: { ...chartDefaults }
    });

  } else if (view === 'ytd') {
    document.getElementById('chartSubtitle').textContent = '연도별 운용 수익률';
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.annual.labels,
        datasets: buildBarDatasets(data.annual.returns, data.annual.benchmark)
      },
      options: { ...chartDefaults }
    });
  }
}

// ===========================
// Tables
// ===========================
function renderQuarterlyTable() {
  const tbody = document.getElementById('quarterlyTableBody');
  if (!tbody) return;

  let cumulFund = 100;
  let cumulBench = 100;

  const rows = data.quarterly.labels.map((label, i) => {
    const r = data.quarterly.returns[i];
    const b = data.quarterly.benchmark[i];
    cumulFund = cumulFund * (1 + r / 100);
    cumulBench = cumulBench * (1 + b / 100);
    const cumR = cumulFund - 100;
    const excess = r - b;

    return `<tr>
      <td><span class="badge-quarter">${label}</span></td>
      <td class="${r >= 0 ? 'positive' : 'negative'}">${r >= 0 ? '+' : ''}${r.toFixed(1)}%</td>
      <td class="${cumR >= 0 ? 'positive' : 'negative'}">${cumR >= 0 ? '+' : ''}${cumR.toFixed(1)}%</td>
      <td class="neutral">${b >= 0 ? '+' : ''}${b.toFixed(1)}%</td>
      <td class="${excess >= 0 ? 'positive' : 'negative'}">${excess >= 0 ? '+' : ''}${excess.toFixed(1)}%p</td>
    </tr>`;
  });

  tbody.innerHTML = rows.reverse().join('');
}

function renderAnnualTable() {
  const tbody = document.getElementById('annualTableBody');
  if (!tbody) return;

  let cumulFund = 100;
  let cumulBench = 100;

  const rows = data.annual.labels.map((label, i) => {
    const r = data.annual.returns[i];
    const b = data.annual.benchmark[i];
    cumulFund = cumulFund * (1 + r / 100);
    cumulBench = cumulBench * (1 + b / 100);
    const cumR = cumulFund - 100;
    const excess = r - b;

    return `<tr>
      <td class="font-medium">${label}</td>
      <td class="${r >= 0 ? 'positive' : 'negative'}">${r >= 0 ? '+' : ''}${r.toFixed(1)}%</td>
      <td class="${cumR >= 0 ? 'positive' : 'negative'}">${cumR >= 0 ? '+' : ''}${cumR.toFixed(1)}%</td>
      <td class="neutral">${b >= 0 ? '+' : ''}${b.toFixed(1)}%</td>
      <td class="${excess >= 0 ? 'positive' : 'negative'}">${excess >= 0 ? '+' : ''}${excess.toFixed(1)}%p</td>
    </tr>`;
  });

  tbody.innerHTML = rows.reverse().join('');
}

// Init on load
window.addEventListener('DOMContentLoaded', () => {
  setView('cumulative');
  renderQuarterlyTable();
  renderAnnualTable();
});
