"""
Wayne Industries Security Platform
Rotas de autenticação — login, logout, perfil
"""

import os
import jwt
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from models import get_db, hash_password

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.environ.get('SECRET_KEY', 'wayne-industries-secret-key-2024')


@auth_bp.route('/login', methods=['POST'])
def login():
    """Autentica o usuário e retorna um token JWT."""
    body = request.get_json(silent=True) or {}
    username = body.get('username', '').strip()
    password = body.get('password', '')
    ip = request.remote_addr

    conn = get_db()
    cur = conn.cursor()

    user = cur.execute(
        "SELECT * FROM usuarios WHERE username = ? AND status = 'ativo'",
        (username,)
    ).fetchone()

    if user and user['password_hash'] == hash_password(password):
        # Gera token JWT com expiração de 8 horas
        payload = {
            'user_id': user['id'],
            'username': user['username'],
            'nome': user['nome'],
            'role': user['role'],
            'cargo': user['cargo'],
            'exp': datetime.now(timezone.utc) + timedelta(hours=8),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        cur.execute(
            'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
            (username, 'Login', 'sucesso', ip, 'Login bem-sucedido')
        )
        conn.commit()
        conn.close()

        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'nome': user['nome'],
                'username': user['username'],
                'role': user['role'],
                'cargo': user['cargo'],
            }
        })

    # Falha na autenticação
    cur.execute(
        'INSERT INTO logs_acesso (usuario, acao, status, ip, detalhes) VALUES (?,?,?,?,?)',
        (username or 'desconhecido', 'Login', 'negado', ip, 'Credenciais inválidas')
    )
    conn.commit()
    conn.close()
    return jsonify({'error': 'Credenciais inválidas. Acesso negado.'}), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Encerra a sessão (client-side — apenas confirma no servidor)."""
    return jsonify({'message': 'Logout realizado com sucesso.'})


@auth_bp.route('/me', methods=['GET'])
def me():
    """Retorna dados do usuário autenticado."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.removeprefix('Bearer ').strip()
    if not token:
        return jsonify({'error': 'Não autenticado'}), 401
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify(data)
    except jwt.PyJWTError:
        return jsonify({'error': 'Token inválido'}), 401
