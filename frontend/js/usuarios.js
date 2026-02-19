/**
 * Wayne Industries — usuarios.js
 * Gestão de usuários — visível para gerentes e admins; edição restrita a admins
 */

'use strict';

let allUsuarios = [];
let editingId   = null;
let deletingId  = null;

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Redireciona funcionário comum
  const user = getUser();
  if (!user || !['admin', 'gerente'].includes(user.role)) {
    showToast('Acesso restrito.', 'error');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
    return;
  }
  // Botão de adicionar: só admin cria usuários
  if (user.role !== 'admin') {
    const btn = document.getElementById('btn-add-user');
    if (btn) btn.style.display = 'none';
  }
  loadUsuarios();
});

/* ─── LOAD ───────────────────────────────────────────────── */
async function loadUsuarios() {
  try {
    allUsuarios = await apiCall('GET', '/usuarios');
    renderTable();
  } catch (err) {
    showToast('Erro ao carregar usuários: ' + err.message, 'error');
  }
}

/* ─── RENDER TABLE ───────────────────────────────────────── */
function renderTable() {
  const search  = document.getElementById('search').value.toLowerCase();
  const filRole = document.getElementById('fil-role').value;
  const filStat = document.getElementById('fil-status').value;
  const tbody   = document.getElementById('usuarios-tbody');
  const me      = getUser();

  let rows = allUsuarios.filter(u => {
    const matchS = !search  || u.nome.toLowerCase().includes(search) || u.username.toLowerCase().includes(search);
    const matchR = !filRole || u.role   === filRole;
    const matchT = !filStat || u.status === filStat;
    return matchS && matchR && matchT;
  });

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:36px">
      <div class="empty"><i class="fas fa-users-slash"></i><p>Nenhum usuário encontrado.</p></div>
    </td></tr>`;
    return;
  }

  const isAdmin = me && me.role === 'admin';

  tbody.innerHTML = rows.map(u => `
    <tr>
      <td class="text-muted">${u.id}</td>
      <td><strong>${escHtml(u.nome)}</strong></td>
      <td class="text-muted">${escHtml(u.username)}</td>
      <td>${escHtml(u.cargo || '—')}</td>
      <td>${roleBadge(u.role)}</td>
      <td>${u.status === 'ativo'
          ? '<span class="badge badge-success">Ativo</span>'
          : '<span class="badge badge-danger">Inativo</span>'}</td>
      <td class="text-muted nowrap">${fmtDate(u.created_at)}</td>
      <td>
        <div class="actions-wrap">
          ${isAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="openEdit(${u.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="openDelete(${u.id}, '${escHtml(u.nome)}')"
              title="Remover" ${u.username === me.username ? 'disabled' : ''}>
              <i class="fas fa-user-slash"></i>
            </button>
          ` : '<span class="text-muted" style="font-size:.65rem">Somente leitura</span>'}
        </div>
      </td>
    </tr>
  `).join('');
}

/* ─── MODAL: ADD ─────────────────────────────────────────── */
function openAdd() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'NOVO USUÁRIO';
  document.getElementById('usr-id').value        = '';
  document.getElementById('usr-nome').value      = '';
  document.getElementById('usr-username').value  = '';
  document.getElementById('usr-cargo').value     = '';
  document.getElementById('usr-role').value      = 'funcionario';
  document.getElementById('usr-status').value    = 'ativo';
  document.getElementById('usr-password').value  = '';
  document.getElementById('pw-label').textContent = 'Senha *';
  document.getElementById('pw-hint').textContent  = '';
  document.getElementById('username-group').style.display = '';
  document.getElementById('modal-err').classList.remove('show');
  openModal('modal');
}

/* ─── MODAL: EDIT ────────────────────────────────────────── */
function openEdit(id) {
  const u = allUsuarios.find(x => x.id === id);
  if (!u) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'EDITAR USUÁRIO';
  document.getElementById('usr-id').value        = u.id;
  document.getElementById('usr-nome').value      = u.nome;
  document.getElementById('usr-username').value  = u.username;
  document.getElementById('usr-cargo').value     = u.cargo || '';
  document.getElementById('usr-role').value      = u.role;
  document.getElementById('usr-status').value    = u.status;
  document.getElementById('usr-password').value  = '';
  document.getElementById('pw-label').textContent = 'Nova Senha';
  document.getElementById('pw-hint').textContent  = 'Deixe em branco para manter a senha atual.';
  document.getElementById('username-group').style.display = 'none';
  document.getElementById('modal-err').classList.remove('show');
  openModal('modal');
}

/* ─── SAVE ───────────────────────────────────────────────── */
async function saveUsuario() {
  const nome     = document.getElementById('usr-nome').value.trim();
  const username = document.getElementById('usr-username').value.trim();
  const password = document.getElementById('usr-password').value;
  const errEl    = document.getElementById('modal-err');
  const errMsg   = document.getElementById('modal-err-msg');
  errEl.classList.remove('show');

  if (!nome) {
    errMsg.textContent = 'Nome é obrigatório.';
    errEl.classList.add('show');
    return;
  }
  if (!editingId && !username) {
    errMsg.textContent = 'Username é obrigatório.';
    errEl.classList.add('show');
    return;
  }
  if (!editingId && !password) {
    errMsg.textContent = 'Senha é obrigatória para novo usuário.';
    errEl.classList.add('show');
    return;
  }

  const payload = {
    nome,
    cargo:    document.getElementById('usr-cargo').value.trim(),
    role:     document.getElementById('usr-role').value,
    status:   document.getElementById('usr-status').value,
    ...(password ? { password } : {}),
    ...(editingId ? {} : { username }),
  };

  try {
    if (editingId) {
      await apiCall('PUT', `/usuarios/${editingId}`, payload);
      showToast('Usuário atualizado com sucesso.', 'success');
    } else {
      await apiCall('POST', '/usuarios', payload);
      showToast('Usuário criado com sucesso.', 'success');
    }
    closeModal('modal');
    await loadUsuarios();
  } catch (err) {
    errMsg.textContent = err.message;
    errEl.classList.add('show');
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
  try {
    await apiCall('DELETE', `/usuarios/${deletingId}`);
    showToast('Usuário removido com sucesso.', 'success');
    closeModal('modal-del');
    await loadUsuarios();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  } finally {
    deletingId = null;
  }
}

/* ─── UTIL ───────────────────────────────────────────────── */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
