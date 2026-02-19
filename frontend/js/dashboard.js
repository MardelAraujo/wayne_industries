/**
 * Wayne Industries — dashboard.js
 * Carrega estatísticas, gráficos e log de atividade recente
 */

'use strict';

let weeklyChart   = null;
let categoryChart = null;

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
  try {
    const data = await apiCall('GET', '/dashboard/stats');
    if (!data) return;

    // Stats cards
    document.getElementById('st-recursos').textContent  = data.total_recursos;
    document.getElementById('st-ativos').textContent    = data.recursos_ativos;
    document.getElementById('st-usuarios').textContent  = data.total_usuarios;
    document.getElementById('st-alertas').textContent   = data.alertas_24h;

    // Activity table
    renderActivity(data.atividades_recentes || []);

    // Charts
    renderWeeklyChart(data.atividade_semanal || [], data.dias_labels || []);
    renderCategoryChart(data.recursos_por_categoria || []);
  } catch (err) {
    showToast('Erro ao carregar dashboard: ' + err.message, 'error');
  }
}

/* ─── ACTIVITY TABLE ─────────────────────────────────────── */
function renderActivity(rows) {
  const tbody = document.getElementById('activity-tbody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:28px">Nenhuma atividade registrada.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.usuario || '—'}</strong></td>
      <td>${r.acao}</td>
      <td>${logStatusBadge(r.status)}</td>
      <td class="text-muted nowrap">${r.ip || '—'}</td>
      <td class="text-muted nowrap">${fmtDate(r.timestamp)}</td>
    </tr>
  `).join('');
}

/* ─── WEEKLY CHART ───────────────────────────────────────── */
function renderWeeklyChart(data, labels) {
  const ctx = document.getElementById('chartWeekly').getContext('2d');
  if (weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ações',
        data,
        backgroundColor: 'rgba(253,227,17,.25)',
        borderColor: '#FDE311',
        borderWidth: 1.5,
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1A1A1A',
          borderColor: '#2A2A2A',
          borderWidth: 1,
          titleColor: '#FDE311',
          bodyColor: '#F5F5F5',
          titleFont: { family: 'IBM Plex Mono' },
          bodyFont:  { family: 'IBM Plex Mono' },
        },
      },
      scales: {
        x: {
          grid: { color: '#1A1A1A' },
          ticks: { color: '#888', font: { family: 'IBM Plex Mono', size: 11 } },
        },
        y: {
          grid: { color: '#1A1A1A' },
          ticks: { color: '#888', font: { family: 'IBM Plex Mono', size: 11 }, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ─── CATEGORY CHART ─────────────────────────────────────── */
function renderCategoryChart(cats) {
  const ctx = document.getElementById('chartCategory').getContext('2d');
  if (categoryChart) categoryChart.destroy();

  const COLORS = ['#FDE311','#F59E0B','#22C55E','#3B82F6','#EF4444','#8B5CF6','#EC4899','#06B6D4'];

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c.categoria),
      datasets: [{
        data: cats.map(c => c.total),
        backgroundColor: COLORS.slice(0, cats.length),
        borderColor: '#111111',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#888', font: { family: 'IBM Plex Mono', size: 11 }, padding: 12, boxWidth: 12 },
        },
        tooltip: {
          backgroundColor: '#1A1A1A',
          borderColor: '#2A2A2A',
          borderWidth: 1,
          titleColor: '#FDE311',
          bodyColor: '#F5F5F5',
          titleFont: { family: 'IBM Plex Mono' },
          bodyFont:  { family: 'IBM Plex Mono' },
        },
      },
    },
  });
}
