"""
Wayne Industries Security Platform
Módulo de banco de dados — inicialização e acesso SQLite
"""

import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')


def get_db():
    """Retorna conexão com o banco de dados."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    """Gera hash SHA-256 da senha."""
    return hashlib.sha256(password.encode()).hexdigest()


def init_db():
    """Inicializa o banco de dados com tabelas e dados padrão."""
    conn = get_db()
    cursor = conn.cursor()

    # Criar tabelas
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT NOT NULL,
            username    TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            cargo       TEXT DEFAULT 'Funcionário',
            role        TEXT NOT NULL DEFAULT 'funcionario',
            status      TEXT NOT NULL DEFAULT 'ativo',
            created_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS recursos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT NOT NULL,
            categoria   TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'ativo',
            localizacao TEXT,
            created_at  TEXT DEFAULT (datetime('now')),
            updated_at  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS logs_acesso (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario   TEXT,
            acao      TEXT NOT NULL,
            status    TEXT NOT NULL,
            ip        TEXT,
            timestamp TEXT DEFAULT (datetime('now')),
            detalhes  TEXT
        );

        CREATE TABLE IF NOT EXISTS areas (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            nome       TEXT NOT NULL,
            setor      TEXT,
            status     TEXT NOT NULL DEFAULT 'normal',
            updated_at TEXT DEFAULT (datetime('now'))
        );
    ''')

    # Usuários padrão (inserir apenas se não existirem)
    usuarios_padrao = [
        ('Bruce Wayne',       'admin',  hash_password('wayne123'),   'Diretor Executivo',       'admin'),
        ('Bruce Wayne',       'bruce',  hash_password('batman456'),  'Gerente de Segurança',    'gerente'),
        ('Alfred Pennyworth', 'alfred', hash_password('butler789'), 'Mordomo / Assistente',    'funcionario'),
    ]
    for nome, username, pw_hash, cargo, role in usuarios_padrao:
        cursor.execute(
            'INSERT OR IGNORE INTO usuarios (nome, username, password_hash, cargo, role) VALUES (?,?,?,?,?)',
            (nome, username, pw_hash, cargo, role)
        )

    # Recursos iniciais — só insere se a tabela estiver vazia
    if cursor.execute('SELECT COUNT(*) FROM recursos').fetchone()[0] == 0:
        recursos_padrao = [
            ('Batmóvel MK-7',        'Veiculo',         'ativo',       'Garagem B-1'),
            ('Batwing Prototype',    'Aeronave',        'manutencao',  'Hangar Alpha'),
            ('Servidor Mainframe',   'TI',              'ativo',       'Data Center - Subsolo'),
            ('Traje de Combate v3',  'Equipamento',     'ativo',       'Armaria Principal'),
            ('Gerador de Backup',    'Infraestrutura',  'ativo',       'Sala de Energia'),
            ('Sistema de Cameras',   'Seguranca',       'ativo',       'Sala de Controle'),
            ('Helicoptero WI-1',     'Aeronave',        'inativo',     'Hangar Beta'),
            ('Kit Medico Avancado',  'Equipamento',     'ativo',       'Enfermaria'),
        ]
        for nome, cat, status, loc in recursos_padrao:
            cursor.execute(
                'INSERT INTO recursos (nome, categoria, status, localizacao) VALUES (?,?,?,?)',
                (nome, cat, status, loc)
            )

    # Areas de seguranca — so insere se vazio
    if cursor.execute('SELECT COUNT(*) FROM areas').fetchone()[0] == 0:
        areas_padrao = [
            ('Batcaverna',        'Subsolo'),
            ('Laboratorio P&D',   'Andar 12'),
            ('Data Center',       'Subsolo'),
            ('Armaria Principal', 'Andar B2'),
            ('Sala de Controle',  'Andar 1'),
            ('Hangar Alpha',      'Cobertura'),
        ]
        for nome, setor in areas_padrao:
            cursor.execute(
                'INSERT INTO areas (nome, setor) VALUES (?,?)',
                (nome, setor)
            )

    # Logs de exemplo — so insere se vazio
    if cursor.execute('SELECT COUNT(*) FROM logs_acesso').fetchone()[0] == 0:
        logs_exemplo = [
            ('admin',        'Login',          'sucesso', '192.168.1.1',  'Login bem-sucedido'),
            ('bruce',        'Login',          'sucesso', '192.168.1.2',  'Login bem-sucedido'),
            ('desconhecido', 'Login',          'negado',  '10.0.0.99',   'Credenciais invalidas'),
            ('alfred',       'Acesso Recurso', 'sucesso', '192.168.1.3', 'Acesso ao Kit Medico'),
            ('admin',        'Editar Recurso', 'sucesso', '192.168.1.1', 'Batmovel MK-7 atualizado'),
            ('hacker',       'Login',          'negado',  '185.220.101.5','Tentativa de forca bruta'),
        ]
        for usuario, acao, status, ip, det in logs_exemplo:
            cursor.execute(
                'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
                (usuario, acao, status, ip, det)
            )

    conn.commit()
    conn.close()
    print("[OK] Banco de dados inicializado com sucesso.")
