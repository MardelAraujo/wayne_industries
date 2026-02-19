# Wayne Industries Security Platform — CLAUDE.md

Guia de configuração, execução e referência técnica do projeto.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Python     | 3.10+         |
| pip        | 23+           |

---

## Instalação e Execução

### 1. Clonar / abrir o projeto

```bash
cd wayne_industries
```

### 2. Criar ambiente virtual (recomendado)

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r backend/requirements.txt
```

### 4. Iniciar o servidor

```bash
python backend/app.py
```

O banco de dados (`backend/database.db`) é criado e populado automaticamente na primeira execução.

### 5. Acessar no navegador

```
http://localhost:5000
```

---

## Usuários de Teste

| Username | Senha       | Role          | Acesso                              |
|----------|-------------|---------------|-------------------------------------|
| `admin`  | `wayne123`  | Administrador | Total — todas as páginas e ações    |
| `bruce`  | `batman456` | Gerente       | Dashboard, Recursos, Usuários (R/O), Segurança |
| `alfred` | `butler789` | Funcionário   | Dashboard, Recursos, Segurança      |

---

## Rotas da API

Base URL: `http://localhost:5000/api`

Todas as rotas (exceto `/login`) exigem o header:
```
Authorization: Bearer <token_jwt>
```

### Autenticação

| Método | Rota     | Descrição                        | Auth |
|--------|----------|----------------------------------|------|
| POST   | /login   | Autentica e retorna token JWT    | Não  |
| POST   | /logout  | Encerra sessão (client-side)     | Não  |
| GET    | /me      | Retorna dados do usuário atual   | Sim  |

**POST /login — Body:**
```json
{ "username": "admin", "password": "wayne123" }
```

**POST /login — Resposta:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "nome": "Bruce Wayne", "username": "admin", "role": "admin", "cargo": "Diretor Executivo" }
}
```

---

### Dashboard

| Método | Rota              | Descrição                         | Role mínimo |
|--------|-------------------|-----------------------------------|-------------|
| GET    | /dashboard/stats  | Estatísticas, gráficos e logs     | funcionario |

---

### Recursos

| Método | Rota            | Descrição                   | Role mínimo  |
|--------|-----------------|-----------------------------| -------------|
| GET    | /recursos       | Lista recursos (com filtros)| funcionario  |
| POST   | /recursos       | Cria novo recurso           | funcionario  |
| PUT    | /recursos/:id   | Atualiza recurso            | funcionario  |
| DELETE | /recursos/:id   | Remove recurso              | funcionario  |

**Query Params GET /recursos:**
- `?categoria=Veículo` — filtra por categoria
- `?status=ativo` — filtra por status (ativo / manutencao / inativo)

---

### Usuários

| Método | Rota           | Descrição                   | Role mínimo |
|--------|----------------|-----------------------------|-------------|
| GET    | /usuarios      | Lista usuários              | gerente     |
| POST   | /usuarios      | Cria novo usuário           | admin       |
| PUT    | /usuarios/:id  | Atualiza usuário            | admin       |
| DELETE | /usuarios/:id  | Remove usuário              | admin       |

---

### Segurança

| Método | Rota         | Descrição                      | Role mínimo |
|--------|--------------|--------------------------------|-------------|
| GET    | /logs        | Log de acessos (até 100)       | funcionario |
| GET    | /areas       | Lista áreas de segurança       | funcionario |
| PUT    | /areas/:id   | Atualiza status de uma área    | gerente     |

**Query Params GET /logs:**
- `?limit=50` — número de registros (máx 500)

**PUT /areas/:id — Body:**
```json
{ "status": "bloqueado" }
```
Status válidos: `normal`, `alerta`, `bloqueado`

---

## Estrutura de Pastas

```
wayne_industries/
├── backend/
│   ├── app.py              # Aplicação Flask principal
│   ├── models.py           # Banco SQLite + seed data
│   ├── middleware.py       # Decoradores JWT (token/manager/admin)
│   ├── database.db         # Criado automaticamente
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py         # POST /login, POST /logout, GET /me
│       ├── recursos.py     # CRUD /recursos
│       ├── usuarios.py     # CRUD /usuarios
│       ├── dashboard.py    # GET /dashboard/stats
│       └── seguranca.py    # GET /logs, GET+PUT /areas
│
├── frontend/
│   ├── index.html          # Tela de login
│   ├── dashboard.html      # Dashboard principal
│   ├── recursos.html       # Gestão de recursos
│   ├── usuarios.html       # Gestão de usuários
│   ├── seguranca.html      # Controle de segurança
│   ├── css/
│   │   └── style.css       # Estilos globais (dark/yellow theme)
│   └── js/
│       ├── main.js         # Auth, API helper, toasts, sidebar
│       ├── dashboard.js    # Estatísticas + Chart.js
│       ├── recursos.js     # CRUD recursos
│       ├── usuarios.js     # CRUD usuários
│       └── seguranca.js    # Áreas + logs
│
└── CLAUDE.md               # Este arquivo
```

---

## Logos

| Arquivo | Uso |
|---------|-----|
| `Logo/wayne_logo.png` | Logo completa (tela de login) |
| `Logo/Wayne_logo_mini.png` | Mini ícone W (sidebar + boot screen) |

Servidos pelo Flask em `/Logo/<arquivo>` — **não mova** a pasta `Logo/` de lugar.

---

## Fuso Horário

- Timestamps **gravados em UTC** no SQLite (`datetime('now')` padrão)
- Exibidos no frontend como **Brasília (BRT = UTC-3)** via `Intl` / `toLocaleString` com `timeZone: 'America/Sao_Paulo'`
- Dashboard: agrupa por dia BRT usando `date(timestamp, '-3 hours')` nas queries SQLite

---

## Stack Técnica

| Camada     | Tecnologia                              |
|------------|-----------------------------------------|
| Frontend   | HTML5, CSS3, JavaScript (ES2020, puro)  |
| Gráficos   | Chart.js 4.x (CDN)                      |
| Ícones     | Font Awesome 6.5 (CDN)                  |
| Fontes     | Orbitron + IBM Plex Mono (Google Fonts) |
| Backend    | Python 3.10+ / Flask 3.x               |
| Auth       | JWT (PyJWT) — tokens com expiração 8h  |
| Banco      | SQLite 3 (nativo Python)               |
| CORS       | Flask-CORS                             |

---

## Variáveis de Ambiente (opcionais)

```bash
export SECRET_KEY="sua-chave-secreta-aqui"  # padrão: wayne-industries-secret-key-2024
```

---

## Notas de Segurança

- Tokens JWT expiram em **8 horas**
- Senhas armazenadas com **SHA-256** (para produção, use bcrypt)
- Proteção contra auto-exclusão de conta
- Todos os endpoints (exceto login) exigem token válido
- Roles hierárquicos: `funcionario` < `gerente` < `admin`
