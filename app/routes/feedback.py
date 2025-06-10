from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
from app.config.database import get_db_session, close_db_session
from app.models.feedback import Feedback, FeedbackType, FeedbackStatus, FeedbackPriority
from app.models.user import User

bp = Blueprint('feedback', __name__)
logger = logging.getLogger(__name__)

# 反馈类型显示名称映射
TYPE_DISPLAY_NAMES = {
    'bug': '错误报告',
    'suggestion': '功能建议',
    'question': '使用问题',
    'other': '其他反馈'
}

# 优先级显示名称映射
PRIORITY_DISPLAY_NAMES = {
    'low': '低',
    'medium': '中',
    'high': '高'
}

# 问题分类显示名称映射
CATEGORY_DISPLAY_NAMES = {
    'general': '一般',
    'ui': '界面',
    'performance': '性能',
    'feature': '功能',
    'account': '账户'
}

def get_type_display_name(type_code):
    """获取反馈类型的显示名称"""
    return TYPE_DISPLAY_NAMES.get(type_code, type_code)

def get_priority_display_name(priority_code):
    """获取优先级的显示名称"""
    return PRIORITY_DISPLAY_NAMES.get(priority_code, priority_code)

def get_category_display_name(category_code):
    """获取问题分类的显示名称"""
    return CATEGORY_DISPLAY_NAMES.get(category_code, category_code)

@bp.route('/', methods=['POST'])
def submit_feedback():
    """提交反馈 - 使用数据库"""
    db_session = None
    try:
        data = request.get_json()
        
        # 获取必需字段
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        feedback_type = data.get('type', 'suggestion').strip()
        priority = data.get('priority', 'medium').strip()
        category = data.get('category', 'general').strip()
        
        # 验证必填字段
        if not title:
            return jsonify({
                'success': False,
                'message': '反馈标题不能为空'
            }), 400
            
        if not description:
            return jsonify({
                'success': False,
                'message': '反馈描述不能为空'
            }), 400
        
        # 验证枚举值 - 映射用户输入到模型枚举
        type_mapping = {
            'suggestion': FeedbackType.FEATURE,
            'bug': FeedbackType.BUG,
            'feature': FeedbackType.FEATURE,
            'complaint': FeedbackType.COMPLAINT,
            'praise': FeedbackType.PRAISE,
            'other': FeedbackType.OTHER
        }
        feedback_type_enum = type_mapping.get(feedback_type.lower(), FeedbackType.OTHER)
        
        try:
            priority_enum = FeedbackPriority[priority.upper()]
        except KeyError:
            priority_enum = FeedbackPriority.MEDIUM
        
        db_session = get_db_session()
        
        # 获取默认用户
        user = db_session.query(User).first()
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 400
        
        # 创建反馈记录
        feedback = Feedback(
            title=title,
            content=description,  # 字段名是content不是description
            type=feedback_type_enum,  # 字段名是type不是feedback_type
            priority=priority_enum,
            user_id=user.id
        )
        
        db_session.add(feedback)
        db_session.commit()
        
        # 为了兼容性保留原格式响应
        timestamp = feedback.created_at.strftime('%Y%m%d_%H%M%S')
        filename = f"feedback_{timestamp}.txt"
        
        logger.info(f"反馈已保存到数据库: ID {feedback.id}")
        
        return jsonify({
            'success': True,
            'message': '反馈提交成功',
            'feedback_id': feedback.id,
            'filename': filename,  # 为了兼容性保留
            'timestamp': feedback.created_at.isoformat()
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"提交反馈失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'提交反馈失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/', methods=['GET'])
def get_feedback():
    """获取反馈列表 - 使用数据库"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 获取查询参数
        status = request.args.get('status')  # pending, in_progress, resolved, closed
        feedback_type = request.args.get('type')  # bug, feature, suggestion, question
        priority = request.args.get('priority')  # low, medium, high, urgent
        category = request.args.get('category')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # 构建查询
        query = db_session.query(Feedback).filter_by(is_deleted=False)
        
        if status:
            try:
                status_enum = FeedbackStatus[status.upper()]
                query = query.filter_by(status=status_enum)
            except KeyError:
                pass
        
        if feedback_type:
            type_mapping = {
                'suggestion': FeedbackType.FEATURE,
                'bug': FeedbackType.BUG,
                'feature': FeedbackType.FEATURE,
                'complaint': FeedbackType.COMPLAINT,
                'praise': FeedbackType.PRAISE,
                'other': FeedbackType.OTHER
            }
            type_enum = type_mapping.get(feedback_type.lower())
            if type_enum:
                query = query.filter_by(type=type_enum)
        
        if priority:
            try:
                priority_enum = FeedbackPriority[priority.upper()]
                query = query.filter_by(priority=priority_enum)
            except KeyError:
                pass
        
        if category:
            query = query.filter_by(category=category)
        
        # 分页和排序
        query = query.order_by(Feedback.created_at.desc())
        total = query.count()
        
        offset = (page - 1) * per_page
        feedbacks = query.offset(offset).limit(per_page).all()
        
        # 构建响应数据
        feedback_list = []
        for f in feedbacks:
            # 将模型枚举值转换回用户友好的值
            type_reverse_mapping = {
                FeedbackType.FEATURE: 'suggestion',
                FeedbackType.BUG: 'bug',
                FeedbackType.COMPLAINT: 'complaint',
                FeedbackType.PRAISE: 'praise',
                FeedbackType.OTHER: 'other'
            }
            
            feedback_data = {
                'id': f.id,
                'title': f.title,
                'description': f.content,  # 字段名是content
                'type': type_reverse_mapping.get(f.type, 'other'),
                'priority': f.priority.value.lower() if f.priority else 'medium',
                'status': f.status.value.lower() if f.status else 'pending',
                'created_at': f.created_at.strftime('%Y-%m-%d %H:%M:%S') if f.created_at else None,
                'updated_at': f.updated_at.strftime('%Y-%m-%d %H:%M:%S') if f.updated_at else None,
                'handle_time': f.handle_time.strftime('%Y-%m-%d %H:%M:%S') if f.handle_time else None,
                'user_id': f.user_id,
                'handler_id': f.handler_id,
                'handle_note': f.handle_note,
                # 为了兼容性，生成类似文件名的标识
                'filename': f"feedback_{f.created_at.strftime('%Y%m%d_%H%M%S')}.txt" if f.created_at else f"feedback_{f.id}.txt"
            }
            feedback_list.append(feedback_data)
        
        logger.info(f"成功获取 {len(feedback_list)} 个反馈（数据库版本）")
        
        return jsonify({
            'success': True,
            'feedbacks': feedback_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"获取反馈列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'获取反馈列表失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/<int:feedback_id>', methods=['PUT'])
def update_feedback(feedback_id):
    """更新反馈状态 - 使用数据库"""
    db_session = None
    try:
        data = request.get_json()
        
        db_session = get_db_session()
        
        # 查找反馈
        feedback = db_session.query(Feedback).filter_by(
            id=feedback_id,
            is_deleted=False
        ).first()
        
        if not feedback:
            return jsonify({
                'success': False,
                'message': '反馈不存在'
            }), 404
        
        # 更新字段
        if 'status' in data:
            try:
                status_enum = FeedbackStatus[data['status'].upper()]
                feedback.status = status_enum
                
                # 如果状态变为已解决，设置处理时间
                if status_enum == FeedbackStatus.RESOLVED:
                    feedback.handle_time = datetime.utcnow()
            except KeyError:
                pass
        
        if 'priority' in data:
            try:
                priority_enum = FeedbackPriority[data['priority'].upper()]
                feedback.priority = priority_enum
            except KeyError:
                pass
        
        if 'handle_note' in data:
            feedback.handle_note = data['handle_note']
            # 这里可以设置handler_id，但简化处理
        
        if 'type' in data:
            type_mapping = {
                'suggestion': FeedbackType.FEATURE,
                'bug': FeedbackType.BUG,
                'feature': FeedbackType.FEATURE,
                'complaint': FeedbackType.COMPLAINT,
                'praise': FeedbackType.PRAISE,
                'other': FeedbackType.OTHER
            }
            type_enum = type_mapping.get(data['type'].lower())
            if type_enum:
                feedback.type = type_enum
        
        feedback.updated_at = datetime.utcnow()
        
        db_session.commit()
        
        logger.info(f"反馈更新成功: ID {feedback_id}")
        
        return jsonify({
            'success': True,
            'message': '反馈更新成功',
            'feedback_id': feedback.id
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"更新反馈失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'更新反馈失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    """删除反馈 - 使用数据库软删除"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 查找反馈
        feedback = db_session.query(Feedback).filter_by(
            id=feedback_id,
            is_deleted=False
        ).first()
        
        if not feedback:
            return jsonify({
                'success': False,
                'message': '反馈不存在'
            }), 404
        
        # 软删除
        feedback.is_deleted = True
        feedback.deleted_at = datetime.utcnow()
        
        db_session.commit()
        
        logger.info(f"反馈删除成功: ID {feedback_id}")
        
        return jsonify({
            'success': True,
            'message': '反馈删除成功'
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"删除反馈失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'删除反馈失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session) 