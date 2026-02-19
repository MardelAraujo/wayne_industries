"""
Wayne Industries Security Platform
Middleware de autenticação e autorização via JWT
"""

import os
import jwt
from functools import wraps
from flask import request, jsonify

SECRET_KEY = os.environ.get('SECRET_KEY', 'wayne-industries-secret-key-2024')


def _decode_token():
    """Decodifica e valida o token JWT do header Authorization."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.removeprefix('Bearer ').strip()
    if not token:
        return None, ('Token não fornecido', 401)
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256']), None
    except jwt.ExpiredSignatureError:
        return None, ('Token expirado. Faça login novamente.', 401)
    except jwt.InvalidTokenError:
        return None, ('Token inválido.', 401)


def token_required(f):
    """Exige que o usuário esteja autenticado."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data, err = _decode_token()
        if err:
            return jsonify({'error': err[0]}), err[1]
        request.user = data
        return f(*args, **kwargs)
    return decorated


def manager_required(f):
    """Exige role admin ou gerente."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data, err = _decode_token()
        if err:
            return jsonify({'error': err[0]}), err[1]
        if data.get('role') not in ('admin', 'gerente'):
            return jsonify({'error': 'Acesso negado — permissão insuficiente.'}), 403
        request.user = data
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Exige role admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        data, err = _decode_token()
        if err:
            return jsonify({'error': err[0]}), err[1]
        if data.get('role') != 'admin':
            return jsonify({'error': 'Acesso negado — apenas administradores.'}), 403
        request.user = data
        return f(*args, **kwargs)
    return decorated
