from flask import jsonify
from werkzeug.exceptions import HTTPException
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_error(error):
    """
    通用错误处理函数
    """
    logger.error(f"Error occurred: {str(error)}")
    
    if isinstance(error, HTTPException):
        return jsonify({
            'error': error.description,
            'status_code': error.code
        }), error.code
    
    # 对于其他类型的错误，返回500内部服务器错误
    return jsonify({
        'error': '服务器内部错误',
        'status_code': 500
    }), 500

def register_error_handlers(app):
    """
    注册错误处理器到Flask应用
    """
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'error': '请求参数错误',
            'status_code': 400
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            'error': '未授权访问',
            'status_code': 401
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            'error': '禁止访问',
            'status_code': 403
        }), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'error': '请求的资源不存在',
            'status_code': 404
        }), 404

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return jsonify({
            'error': '不支持的请求方法',
            'status_code': 405
        }), 405

    @app.errorhandler(429)
    def too_many_requests_error(error):
        return jsonify({
            'error': '请求过于频繁，请稍后再试',
            'status_code': 429
        }), 429

    @app.errorhandler(500)
    def internal_server_error(error):
        logger.error(f"Internal Server Error: {str(error)}")
        return jsonify({
            'error': '服务器内部错误',
            'status_code': 500
        }), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        logger.error(f"Unexpected Error: {str(error)}")
        return jsonify({
            'error': '服务器内部错误',
            'status_code': 500
        }), 500 