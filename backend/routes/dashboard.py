"""
Wayne Industries Security Platform
Rotas do dashboard — estatísticas e atividade recente
"""

from flask import Blueprint, jsonify
from models import get_db
from middleware import token_required

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def get_stats():
    """Retorna métricas consolidadas para o dashboard."""
    conn = get_db()
    cur  = conn.cursor()

    total_recursos  = cur.execute('SELECT COUNT(*) FROM recursos').fetchone()[0]
    recursos_ativos = cur.execute("SELECT COUNT(*) FROM recursos WHERE status = 'ativo'").fetchone()[0]
    total_usuarios  = cur.execute("SELECT COUNT(*) FROM usuarios WHERE status = 'ativo'").fetchone()[0]

    # Alertas últimas 24h — compara UTC com UTC
    alertas_24h = cur.execute(
        "SELECT COUNT(*) FROM logs_acesso WHERE status = 'negado' AND timestamp > datetime('now', '-24 hours')"
    ).fetchone()[0]

    # Últimas 10 ações
    atividades = cur.execute(
        'SELECT * FROM logs_acesso ORDER BY timestamp DESC LIMIT 10'
    ).fetchall()

    # Atividade dos últimos 7 dias agrupada por dia em BRT (UTC-3)
    # date(timestamp, '-3 hours') converte o timestamp UTC para data BRT
    atividade_semanal = []
    dias_labels = []
    for i in range(6, -1, -1):
        contagem = cur.execute(
            "SELECT COUNT(*) FROM logs_acesso WHERE date(timestamp, '-3 hours') = date('now', '-3 hours', ?)",
            (f'-{i} days',)
        ).fetchone()[0]
        atividade_semanal.append(contagem)
        label = cur.execute(
            "SELECT strftime('%d/%m', date('now', '-3 hours', ?))", (f'-{i} days',)
        ).fetchone()[0]
        dias_labels.append(label)

    # Recursos por categoria
    por_categoria = cur.execute(
        'SELECT categoria, COUNT(*) as total FROM recursos GROUP BY categoria ORDER BY total DESC'
    ).fetchall()

    conn.close()
    return jsonify({
        'total_recursos':       total_recursos,
        'recursos_ativos':      recursos_ativos,
        'total_usuarios':       total_usuarios,
        'alertas_24h':          alertas_24h,
        'atividades_recentes':  [dict(a) for a in atividades],
        'atividade_semanal':    atividade_semanal,
        'dias_labels':          dias_labels,
        'recursos_por_categoria': [dict(c) for c in por_categoria],
    })
