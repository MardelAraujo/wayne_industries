/**
 * Wayne Industries — recursos.js
 * CRUD completo de recursos via API
 */

'use strict';

let allRecursos = [];
let editingId   = null;
let deletingId  = null;

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', loadRecursos);

/* ─── LOAD ───────────────────────────────────────────────── */
async function loadRecursos() {
  try {
    allRecursos = await apiCall('GET', '/recursos');
    renderTable();
  } catch (err) {
    showToast('Erro ao carregar recursos: ' + err.message, 'error');
  }
}

/* ─── RENDER TABLE ───────────────────────────────────────── */
function renderTable() {
  const search  = document.getElementById('search').value.toLowerCase();
  const filCat  = document.getElementById('fil-cat').value;
  const filStat = document.getElementById('fil-status').value;
  const tbody   = document.getElementById('recursos-tbody');

  let rows = allRecursos.filter(r => {
    const matchSearch = !search ||
      r.nome.toLowerCase().includes(search) ||
      (r.localizacao || '').toLowerCase().includes(search);
    const matchCat    = !filCat  || r.categoria === filCat;
    const matchStatus = !filStat || r.status    === filStat;
    return matchSearch && matchCat && matchStatus;
  });

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="padding:36px">
          <div class="empty">
            <i class="fas fa-box-open"></i>
            <p>Nenhum recurso encontrado.</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="text-muted">${r.id}</td>
      <td><strong>${escHtml(r.nome)}</strong></td>
      <td>${escHtml(r.categoria)}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="text-muted">${escHtml(r.localizacao || '—')}</td>
      <td class="text-muted nowrap">${fmtDate(r.created_at)}</td>
      <td>
        <div class="actions-wrap">
          <button class="btn btn-secondary btn-sm" onclick="openEdit(${r.id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="openDelete(${r.id}, '${escHtml(r.nome)}')" title="Remover">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ─── MODAL: ADD ─────────────────────────────────────────── */
function openAdd() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'NOVO RECURSO';
  document.getElementById('rec-id').value      = '';
  document.getElementById('rec-nome').value    = '';
  document.getElementById('rec-cat').value     = '';
  document.getElementById('rec-status').value  = 'ativo';
  document.getElementById('rec-loc').value     = '';
  document.getElementById('modal-err').classList.remove('show');
  openModal('modal');
  document.getElementById('rec-nome').focus();
}

/* ─── MODAL: EDIT ────────────────────────────────────────── */
function openEdit(id) {
  const r = allRecursos.find(x => x.id === id);
  if (!r) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'EDITAR RECURSO';
  document.getElementById('rec-id').value      = r.id;
  document.getElementById('rec-nome').value    = r.nome;
  document.getElementById('rec-cat').value     = r.categoria;
  document.getElementById('rec-status').value  = r.status;
  document.getElementById('rec-loc').value     = r.localizacao || '';
  document.getElementById('modal-err').classList.remove('show');
  openModal('modal');
  document.getElementById('rec-nome').focus();
}

/* ─── SAVE ───────────────────────────────────────────────── */
async function saveRecurso() {
  const nome  = document.getElementById('rec-nome').value.trim();
  const cat   = document.getElementById('rec-cat').value;
  const errEl = document.getElementById('modal-err');
  const errMsg= document.getElementById('modal-err-msg');

  errEl.classList.remove('show');

  if (!nome || !cat) {
    errMsg.textContent = 'Nome e categoria são obrigatórios.';
    errEl.classList.add('show');
    return;
  }

  const payload = {
    nome,
    categoria:  cat,
    status:     document.getElementById('rec-status').value,
    localizacao:document.getElementById('rec-loc').value.trim(),
  };

  const saveBtn = document.getElementById('modal-save-btn');
  saveBtn.disabled = true;

  try {
    if (editingId) {
      await apiCall('PUT', `/recursos/${editingId}`, payload);
      showToast('Recurso atualizado com sucesso.', 'success');
    } else {
      await apiCall('POST', '/recursos', payload);
      showToast('Recurso criado com sucesso.', 'success');
    }
    closeModal('modal');
    await loadRecursos();
  } catch (err) {
    errMsg.textContent = err.message;
    errEl.classList.add('show');
  } finally {
    saveBtn.disabled = false;
  }
}

/* ─── DELETE ─────────────────────────────────────────────── */
function openDelete(id, nome) {
  deletingId = id;
  document.getElementById('del-nome').textContent = nome;
  openModal('modal-del');
}

async function confirmDelete() {
  if (!deletingId) return;
  const btn = document.getElementById('del-confirm-btn');
  btn.disabled = true;
  try {
    await apiCall('DELETE', `/recursos/${deletingId}`);
    showToast('Recurso removido com sucesso.', 'success');
    closeModal('modal-del');
    await loadRecursos();
  } catch (err) {
    showToast('Erro ao remover: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    deletingId = null;
  }
}

/* ─── UTIL ───────────────────────────────────────────────── */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
