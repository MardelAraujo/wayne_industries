/**
 * Wayne Industries Security Platform
 * main.js — Funções globais: autenticação, API, navegação e UI
 */

'use strict';

const API = '/api';

/* ─── TOKEN / AUTH ───────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('wi_token');
}

function setToken(tok) {
  localStorage.setItem('wi_token', tok);
}

function clearToken() {
  localStorage.removeItem('wi_token');
  localStorage.removeItem('wi_user');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('wi_user')); } catch { return null; }
}

function setUser(u) {
  localStorage.setItem('wi_user', JSON.stringify(u));
}

/** Decodifica payload do JWT (sem verificar assinatura no client). */
function parseJWT(tok) {
  try {
    return JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenValid(tok) {
  const p = parseJWT(tok);
  return p && p.exp * 1000 > Date.now();
}

/** Redireciona para login se não autenticado. */
function requireAuth() {
  const tok = getToken();
  if (!tok || !isTokenValid(tok)) {
    clearToken();
    window.location.href = '/';
    return false;
  }
  return true;
}

/** Redireciona para dashboard se role insuficiente. */
function requireRole(...roles) {
  const user = getUser();
  if (!user || !roles.includes(user.role)) {
    showToast('Acesso negado — permissão insuficiente.', 'error');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
    return false;
  }
  return true;
}

/* ─── API HELPER ─────────────────────────────────────────── */

/**
 * Realiza uma chamada autenticada à API.
 * @returns {Promise<any>} JSON de resposta
 * @throws {Error} com a mensagem de erro da API
 */
async function apiCall(method, endpoint, data = null) {
  const tok = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
  };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);

  const url = endpoint.startsWith('http') ? endpoint : `${API}${endpoint}`;
  const res  = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));

  if (res.status === 401) { clearToken(); window.location.href = '/'; return null; }
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
  return json;
}

/* ─── SIDEBAR & HEADER ───────────────────────────────────── */

function initLayout() {
  const user = getUser();
  if (!user) return;

  const roleMap = { admin: 'Administrador', gerente: 'Gerente', funcionario: 'Funcionário' };

  // Preenche nome/role no header e sidebar
  ['user-name', 'sidebar-user-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = user.nome;
  });
  ['user-role', 'sidebar-user-role'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = roleMap[user.role] || user.role;
  });

  // Esconde itens de nav restritos por role
  document.querySelectorAll('[data-min-role]').forEach(el => {
    const minRole = el.dataset.minRole;
    const hierarchy = { admin: 3, gerente: 2, funcionario: 1 };
    if ((hierarchy[user.role] || 0) < (hierarchy[minRole] || 99)) {
      el.style.display = 'none';
    }
  });

  // Marca link ativo
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (path.endsWith(href) || path === href)) a.classList.add('active');
  });
}

function logout() {
  apiCall('POST', '/logout').finally(() => { clearToken(); window.location.href = '/'; });
}

/* ─── TOAST ──────────────────────────────────────────────── */

function showToast(msg, type = 'info') {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 320);
  }, 3200);
}

/* ─── DATE FORMAT ────────────────────────────────────────── */

/**
 * Formata timestamp UTC do SQLite ("YYYY-MM-DD HH:MM:SS") exibindo
 * no fuso horário de Brasília (America/Sao_Paulo, BRT = UTC-3).
 */
function fmtDate(str) {
  if (!str) return '—';
  // Substitui espaço por 'T' e adiciona 'Z' para indicar UTC ao Date parser
  const date = new Date(str.replace(' ', 'T') + 'Z');
  if (isNaN(date.getTime())) return str; // fallback se formato inválido
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── MODAL HELPERS ──────────────────────────────────────── */

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

/* ─── STATUS BADGES ──────────────────────────────────────── */

function statusBadge(s) {
  const map = {
    ativo:      ['success', 'Ativo'],
    manutencao: ['warning', 'Manutenção'],
    inativo:    ['danger',  'Inativo'],
  };
  const [cls, label] = map[s] || ['muted', s];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function roleBadge(r) {
  const map = {
    admin:       ['accent',  'Administrador'],
    gerente:     ['info',    'Gerente'],
    funcionario: ['muted',   'Funcionário'],
  };
  const [cls, label] = map[r] || ['muted', r];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

function logStatusBadge(s) {
  return s === 'sucesso'
    ? `<span class="badge badge-success">✓ Sucesso</span>`
    : `<span class="badge badge-danger">✗ Negado</span>`;
}

function areaBadge(s) {
  const map = { normal: ['success','Normal'], alerta: ['warning','Alerta'], bloqueado: ['danger','Bloqueado'] };
  const [cls, label] = map[s] || ['muted', s];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

/* ─── INIT ───────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const isLogin = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  if (!isLogin) {
    if (requireAuth()) initLayout();
  }
});
