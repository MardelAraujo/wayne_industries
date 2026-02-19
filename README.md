<img width="1897" height="860" alt="dash_batman" src="https://github.com/user-attachments/assets/98581654-f337-40f2-82d5-f92147edf956" />

# Wayne Industries Security Platform

Plataforma de segurança corporativa com painel de controle, gestão de recursos, controle de acesso e monitoramento em tempo real.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Python | 3.10+ |
| pip | 23+ |

---

## Instalação

### 1. Acesse o diretório do projeto

```bash
cd wayne_industries
```

### 2. Crie e ative o ambiente virtual

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r backend/requirements.txt
```

### 4. Inicie o servidor

```bash
python backend/app.py
```

> O banco de dados (`backend/database.db`) é criado e populado automaticamente na primeira execução.

### 5. Acesse no navegador

```
http://localhost:5000
```

---

## Usuários de Teste

| Username | Senha | Role | Acesso |
|----------|-------|------|--------|
| `admin` | `wayne123` | Administrador | Total — todas as páginas e ações |
| `bruce` | `batman456` | Gerente | Dashboard, Recursos, Usuários (leitura), Segurança |
| `alfred` | `butler789` | Funcionário | Dashboard, Recursos, Segurança |

---

## API

**Base URL:** `http://localhost:5000/api`

Todas as rotas (exceto `/login`) exigem o header:

```
Authorization: Bearer <token_jwt>
```

### Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/login` | Autentica e retorna token JWT | Não |
| POST | `/logout` | Encerra sessão (client-side) | Não |
| GET | `/me` | Retorna dados do usuário atual | Sim |

**Exemplo de login:**

```bash
POST /api/login
Content-Type: application/json

{ "username": "admin", "password": "wayne123" }
```

**Resposta:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "nome": "Bruce Wayne",
    "username": "admin",
    "role": "admin",
    "cargo": "Diretor Executivo"
  }
}
```

---

### Dashboard

| Método | Rota | Descrição | Role mínimo |
|--------|------|-----------|-------------|
| GET | `/dashboard/stats` | Estatísticas, gráficos e logs | `funcionario` |

---

### Recursos

| Método | Rota | Descrição | Role mínimo |
|--------|------|-----------|-------------|
| GET | `/recursos` | Lista recursos (com filtros) | `funcionario` |
| POST | `/recursos` | Cria novo recurso | `funcionario` |
| PUT | `/recursos/:id` | Atualiza recurso | `funcionario` |
| DELETE | `/recursos/:id` | Remove recurso | `funcionario` |

**Filtros disponíveis (query params):**

```
?categoria=Veículo
?status=ativo         # ativo | manutencao | inativo
```

---

### Usuários

| Método | Rota | Descrição | Role mínimo |
|--------|------|-----------|-------------|
| GET | `/usuarios` | Lista usuários | `gerente` |
| POST | `/usuarios` | Cria novo usuário | `admin` |
| PUT | `/usuarios/:id` | Atualiza usuário | `admin` |
| DELETE | `/usuarios/:id` | Remove usuário | `admin` |

---

### Segurança

| Método | Rota | Descrição | Role mínimo |
|--------|------|-----------|-------------|
| GET | `/logs` | Log de acessos (até 100 por padrão) | `funcionario` |
| GET | `/areas` | Lista áreas de segurança | `funcionario` |
| PUT | `/areas/:id` | Atualiza status de uma área | `gerente` |

**Filtros disponíveis:**

```
GET /logs?limit=50    # máximo 500
```

**Atualizar status de área:**

```json
PUT /areas/:id
{ "status": "bloqueado" }
```

Status válidos: `normal` · `alerta` · `bloqueado`

---

## Estrutura do Projeto

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
├── Logo/
│   ├── wayne_logo.png      # Logo completa (tela de login)
│   └── Wayne_logo_mini.png # Mini ícone W (sidebar + boot screen)
│
└── README.md
```

> ⚠️ Não mova a pasta `Logo/` — ela é servida pelo Flask em `/Logo/<arquivo>`.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3, JavaScript ES2020 (puro) |
| Gráficos | Chart.js 4.x (CDN) |
| Ícones | Font Awesome 6.5 (CDN) |
| Fontes | Orbitron + IBM Plex Mono (Google Fonts) |
| Backend | Python 3.10+ / Flask 3.x |
| Autenticação | JWT via PyJWT — tokens com expiração de 8h |
| Banco de dados | SQLite 3 (nativo Python) |
| CORS | Flask-CORS |

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | `wayne-industries-secret-key-2024` | Chave de assinatura JWT |

```bash
export SECRET_KEY="sua-chave-secreta-aqui"
```

---

## Notas de Segurança

- Tokens JWT expiram em **8 horas**
- Senhas armazenadas com **SHA-256** — para produção, recomenda-se substituir por **bcrypt**
- Proteção contra auto-exclusão de conta ativada
- Todos os endpoints (exceto `/login`) exigem token válido
- Hierarquia de roles: `funcionario` < `gerente` < `admin`

---

## Fuso Horário

- Timestamps gravados em **UTC** no banco de dados
- Exibidos no frontend como **Brasília (BRT = UTC-3)**
- Agrupamento por dia no dashboard via `date(timestamp, '-3 hours')` no SQLite
