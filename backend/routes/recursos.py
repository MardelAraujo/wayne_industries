"""
Wayne Industries Security Platform
Rotas CRUD de recursos (equipamentos, veículos, dispositivos)
"""

from flask import Blueprint, request, jsonify
from models import get_db
from middleware import token_required

recursos_bp = Blueprint('recursos', __name__)


@recursos_bp.route('/recursos', methods=['GET'])
@token_required
def list_recursos():
    """Lista todos os recursos com filtros opcionais por categoria e status."""
    categoria = request.args.get('categoria', '').strip()
    status    = request.args.get('status', '').strip()

    query  = 'SELECT * FROM recursos'
    params = []
    conds  = []

    if categoria:
        conds.append('categoria = ?')
        params.append(categoria)
    if status:
        conds.append('status = ?')
        params.append(status)
    if conds:
        query += ' WHERE ' + ' AND '.join(conds)
    query += ' ORDER BY created_at DESC'

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@recursos_bp.route('/recursos', methods=['POST'])
@token_required
def create_recurso():
    """Cria um novo recurso."""
    body = request.get_json(silent=True) or {}
    nome      = body.get('nome', '').strip()
    categoria = body.get('categoria', '').strip()
    if not nome or not categoria:
        return jsonify({'error': 'Nome e categoria são obrigatórios.'}), 400

    conn = get_db()
    cur  = conn.cursor()
    cur.execute(
        'INSERT INTO recursos (nome, categoria, status, localizacao) VALUES (?,?,?,?)',
        (nome, categoria, body.get('status', 'ativo'), body.get('localizacao', ''))
    )
    rid = cur.lastrowid
    _log(cur, request, f"Recurso '{nome}' criado", 'Criar Recurso')
    conn.commit()
    row = conn.execute('SELECT * FROM recursos WHERE id = ?', (rid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201


@recursos_bp.route('/recursos/<int:rid>', methods=['PUT'])
@token_required
def update_recurso(rid):
    """Atualiza um recurso existente."""
    body = request.get_json(silent=True) or {}
    conn = get_db()
    cur  = conn.cursor()

    existing = cur.execute('SELECT * FROM recursos WHERE id = ?', (rid,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Recurso não encontrado.'}), 404

    cur.execute(
        "UPDATE recursos SET nome=?, categoria=?, status=?, localizacao=?, updated_at=datetime('now') WHERE id=?",
        (body.get('nome'), body.get('categoria'), body.get('status'), body.get('localizacao'), rid)
    )
    _log(cur, request, f"Recurso ID {rid} atualizado", 'Editar Recurso')
    conn.commit()
    row = conn.execute('SELECT * FROM recursos WHERE id = ?', (rid,)).fetchone()
    conn.close()
    return jsonify(dict(row))


@recursos_bp.route('/recursos/<int:rid>', methods=['DELETE'])
@token_required
def delete_recurso(rid):
    """Remove um recurso."""
    conn = get_db()
    cur  = conn.cursor()

    existing = cur.execute('SELECT * FROM recursos WHERE id = ?', (rid,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Recurso não encontrado.'}), 404

    nome = dict(existing)['nome']
    cur.execute('DELETE FROM recursos WHERE id = ?', (rid,))
    _log(cur, request, f"Recurso '{nome}' removido", 'Remover Recurso')
    conn.commit()
    conn.close()
    return jsonify({'message': f"Recurso '{nome}' removido com sucesso."})


def _log(cur, req, detalhes: str, acao: str):
    """Registra ação no log de acesso."""
    cur.execute(
        'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
        (req.user.get('username'), acao, 'sucesso', req.remote_addr, detalhes)
    )
