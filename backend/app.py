"""
Wayne Industries Security Platform
Aplicação principal Flask — serve API e frontend estático
"""

import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

from models import init_db
from routes.auth      import auth_bp
from routes.recursos  import recursos_bp
from routes.usuarios  import usuarios_bp
from routes.dashboard import dashboard_bp
from routes.seguranca import seguranca_bp

# ──────────────────────────────────────────────────────────────
# Configuração do app
# ──────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(__file__)
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
LOGO_DIR     = os.path.join(BASE_DIR, '..', 'Logo')

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get('SECRET_KEY', 'wayne-industries-secret-key-2024')

# CORS permissivo para dev (restrinja em produção)
CORS(app, supports_credentials=True)

# ──────────────────────────────────────────────────────────────
# Registro dos blueprints de API
# ──────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp,      url_prefix='/api')
app.register_blueprint(recursos_bp,  url_prefix='/api')
app.register_blueprint(usuarios_bp,  url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(seguranca_bp, url_prefix='/api')


# ──────────────────────────────────────────────────────────────
# Servir frontend estático
# ──────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/Logo/<path:filename>')
def serve_logo(filename):
    """Serve os arquivos de logo originais."""
    return send_from_directory(LOGO_DIR, filename)


@app.route('/<path:filename>')
def serve_frontend(filename):
    """Serve qualquer arquivo do diretório frontend."""
    return send_from_directory(FRONTEND_DIR, filename)


# ──────────────────────────────────────────────────────────────
# Tratamento de erros global
# ──────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(_):
    return jsonify({'error': 'Rota não encontrada.'}), 404


@app.errorhandler(500)
def server_error(exc):
    return jsonify({'error': f'Erro interno do servidor: {exc}'}), 500


# ──────────────────────────────────────────────────────────────
# Inicialização
# ──────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 50)
    print("  WAYNE INDUSTRIES SECURITY PLATFORM")
    print("=" * 50)
    init_db()
    print("[OK] Acesse: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
