"""
Wayne Industries Security Platform
Rotas de segurança — logs de acesso e controle de áreas
"""

from flask import Blueprint, request, jsonify
from models import get_db
from middleware import token_required, manager_required

seguranca_bp = Blueprint('seguranca', __name__)


@seguranca_bp.route('/logs', methods=['GET'])
@token_required
def get_logs():
    """Retorna log de tentativas de acesso (padrão: últimas 100 entradas)."""
    limit = min(int(request.args.get('limit', 100)), 500)
    conn  = get_db()
    rows  = conn.execute(
        'SELECT * FROM logs_acesso ORDER BY timestamp DESC LIMIT ?', (limit,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@seguranca_bp.route('/areas', methods=['GET'])
@token_required
def get_areas():
    """Retorna todas as áreas de segurança."""
    conn = get_db()
    rows = conn.execute('SELECT * FROM areas ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@seguranca_bp.route('/areas/<int:aid>', methods=['PUT'])
@manager_required
def update_area(aid):
    """Atualiza o status de uma área (normal / alerta / bloqueado)."""
    body       = request.get_json(silent=True) or {}
    new_status = body.get('status', 'normal')
    if new_status not in ('normal', 'alerta', 'bloqueado'):
        return jsonify({'error': 'Status inválido. Use: normal, alerta ou bloqueado.'}), 400

    conn = get_db()
    cur  = conn.cursor()
    area = cur.execute('SELECT * FROM areas WHERE id = ?', (aid,)).fetchone()
    if not area:
        conn.close()
        return jsonify({'error': 'Área não encontrada.'}), 404

    cur.execute(
        "UPDATE areas SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (new_status, aid)
    )
    cur.execute(
        'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
        (
            request.user.get('username'),
            'Alterar Área',
            'sucesso',
            request.remote_addr,
            f"Área '{dict(area)['nome']}' → {new_status}"
        )
    )
    conn.commit()
    updated = conn.execute('SELECT * FROM areas WHERE id = ?', (aid,)).fetchone()
    conn.close()
    return jsonify(dict(updated))
