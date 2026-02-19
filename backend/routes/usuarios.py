"""
Wayne Industries Security Platform
Rotas CRUD de usuários — protegidas por role
"""

from flask import Blueprint, request, jsonify
from models import get_db, hash_password
from middleware import token_required, manager_required, admin_required

usuarios_bp = Blueprint('usuarios', __name__)


@usuarios_bp.route('/usuarios', methods=['GET'])
@manager_required
def list_usuarios():
    """Lista todos os usuários (admin e gerente apenas)."""
    conn = get_db()
    rows = conn.execute(
        'SELECT id, nome, username, cargo, role, status, created_at FROM usuarios ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@usuarios_bp.route('/usuarios', methods=['POST'])
@admin_required
def create_usuario():
    """Cria novo usuário (admin apenas)."""
    body = request.get_json(silent=True) or {}
    nome     = body.get('nome', '').strip()
    username = body.get('username', '').strip()
    password = body.get('password', 'wayne123')
    if not nome or not username:
        return jsonify({'error': 'Nome e username são obrigatórios.'}), 400

    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute(
            'INSERT INTO usuarios (nome, username, password_hash, cargo, role) VALUES (?,?,?,?,?)',
            (nome, username, hash_password(password), body.get('cargo', 'Funcionário'), body.get('role', 'funcionario'))
        )
        uid = cur.lastrowid
        _log(cur, request, f"Usuário '{username}' criado", 'Criar Usuário')
        conn.commit()
        row = conn.execute(
            'SELECT id, nome, username, cargo, role, status, created_at FROM usuarios WHERE id = ?', (uid,)
        ).fetchone()
        conn.close()
        return jsonify(dict(row)), 201
    except Exception as exc:
        conn.close()
        if 'UNIQUE' in str(exc):
            return jsonify({'error': 'Username já cadastrado.'}), 400
        return jsonify({'error': str(exc)}), 400


@usuarios_bp.route('/usuarios/<int:uid>', methods=['PUT'])
@admin_required
def update_usuario(uid):
    """Atualiza dados de um usuário (admin apenas)."""
    body = request.get_json(silent=True) or {}
    conn = get_db()
    cur  = conn.cursor()

    existing = cur.execute('SELECT * FROM usuarios WHERE id = ?', (uid,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Usuário não encontrado.'}), 404

    # Atualiza senha apenas se fornecida
    if body.get('password'):
        cur.execute(
            'UPDATE usuarios SET nome=?, cargo=?, role=?, status=?, password_hash=? WHERE id=?',
            (body.get('nome'), body.get('cargo'), body.get('role'), body.get('status'), hash_password(body['password']), uid)
        )
    else:
        cur.execute(
            'UPDATE usuarios SET nome=?, cargo=?, role=?, status=? WHERE id=?',
            (body.get('nome'), body.get('cargo'), body.get('role'), body.get('status'), uid)
        )

    _log(cur, request, f"Usuário ID {uid} atualizado", 'Editar Usuário')
    conn.commit()
    row = conn.execute(
        'SELECT id, nome, username, cargo, role, status, created_at FROM usuarios WHERE id = ?', (uid,)
    ).fetchone()
    conn.close()
    return jsonify(dict(row))


@usuarios_bp.route('/usuarios/<int:uid>', methods=['DELETE'])
@admin_required
def delete_usuario(uid):
    """Remove usuário (admin apenas)."""
    conn = get_db()
    cur  = conn.cursor()

    existing = cur.execute('SELECT * FROM usuarios WHERE id = ?', (uid,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Usuário não encontrado.'}), 404

    uname = dict(existing)['username']
    # Impede auto-exclusão
    if uname == request.user.get('username'):
        conn.close()
        return jsonify({'error': 'Você não pode remover sua própria conta.'}), 400

    cur.execute('DELETE FROM usuarios WHERE id = ?', (uid,))
    _log(cur, request, f"Usuário '{uname}' removido", 'Remover Usuário')
    conn.commit()
    conn.close()
    return jsonify({'message': f"Usuário '{uname}' removido com sucesso."})


def _log(cur, req, detalhes: str, acao: str):
    cur.execute(
        'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
        (req.user.get('username'), acao, 'sucesso', req.remote_addr, detalhes)
    )
