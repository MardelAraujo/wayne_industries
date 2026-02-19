/**
 * Wayne Industries — seguranca.js
 * Controle de áreas de segurança e log de acessos
 */

'use strict';

let allLogs  = [];
let allAreas = [];

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadAreas();
  loadLogs();
});

/* ─── ÁREAS ──────────────────────────────────────────────── */
async function loadAreas() {
  try {
    allAreas = await apiCall('GET', '/areas');
    renderAreas();
  } catch (err) {
    showToast('Erro ao carregar áreas: ' + err.message, 'error');
  }
}

function renderAreas() {
  const grid = document.getElementById('areas-grid');
  const user = getUser();
  const canEdit = user && ['admin', 'gerente'].includes(user.role);

  if (!allAreas.length) {
    grid.innerHTML = `<div class="empty"><i class="fas fa-map-marked-alt"></i><p>Nenhuma área cadastrada.</p></div>`;
    return;
  }

  grid.innerHTML = allAreas.map(a => {
    const sCls = { normal: 's-normal', alerta: 's-alerta', bloqueado: 's-bloqueado' }[a.status] || 's-normal';
    return `
      <div class="area-card ${sCls}" id="area-card-${a.id}">
        <div class="area-card-top">
          <span class="area-card-name">${escHtml(a.nome)}</span>
          <span class="area-indicator"></span>
        </div>
        <div class="area-card-setor">
          <i class="fas fa-map-marker-alt"></i> ${escHtml(a.setor || '—')}
        </div>
        <div style="margin-bottom:12px">${areaBadge(a.status)}</div>
        ${canEdit ? `
          <div class="area-card-btns">
            <button class="btn btn-success btn-sm" onclick="setAreaStatus(${a.id},'normal')"
              ${a.status === 'normal' ? 'disabled' : ''}>
              <i class="fas fa-check"></i> Normal
            </button>
            <button class="btn btn-warning btn-sm" onclick="setAreaStatus(${a.id},'alerta')"
              ${a.status === 'alerta' ? 'disabled' : ''}>
              <i class="fas fa-exclamation"></i> Alerta
            </button>
            <button class="btn btn-danger btn-sm" onclick="setAreaStatus(${a.id},'bloqueado')"
              ${a.status === 'bloqueado' ? 'disabled' : ''}>
              <i class="fas fa-lock"></i> Bloquear
            </button>
          </div>
        ` : `<div class="text-muted" style="font-size:.65rem">Somente leitura</div>`}
      </div>
    `;
  }).join('');
}

async function setAreaStatus(id, status) {
  try {
    await apiCall('PUT', `/areas/${id}`, { status });
    showToast(`Área atualizada para "${status}".`, 'success');
    await loadAreas();
    await loadLogs();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

/* ─── LOGS ───────────────────────────────────────────────── */
async function loadLogs() {
  try {
    allLogs = await apiCall('GET', '/logs?limit=100');
    renderLogs();
  } catch (err) {
    showToast('Erro ao carregar logs: ' + err.message, 'error');
  }
}

function renderLogs() {
  const filter = document.getElementById('log-filter').value;
  const tbody  = document.getElementById('logs-tbody');

  const rows = filter ? allLogs.filter(l => l.status === filter) : allLogs;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:28px">Nenhum log encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((l, i) => `
    <tr>
      <td class="text-muted">${i + 1}</td>
      <td><strong>${escHtml(l.usuario || '—')}</strong></td>
      <td>${escHtml(l.acao)}</td>
      <td>${logStatusBadge(l.status)}</td>
      <td class="text-muted nowrap">${escHtml(l.ip || '—')}</td>
      <td class="text-muted">${escHtml(l.detalhes || '—')}</td>
      <td class="text-muted nowrap">${fmtDate(l.timestamp)}</td>
    </tr>
  `).join('');
}

/* ─── UTIL ───────────────────────────────────────────────── */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
