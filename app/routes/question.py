from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
from app.config.database import get_db_session, close_db_session
from app.models.question import Question
from app.models.user import User

bp = Blueprint('question', __name__)
logger = logging.getLogger(__name__)

@bp.route('/save-question', methods=['POST'])
def save_question():
    """保存问题 - 使用数据库，支持筛选信息"""
    db_session = None
    try:
        data = request.get_json()
        question_text = data.get('question', '').strip()
        
        # 获取筛选信息
        filters = data.get('filters', {})
        grade = filters.get('grade', '')
        grade_label = filters.get('gradeLabel', '')
        subject = filters.get('subject', '')
        subject_label = filters.get('subjectLabel', '')
        
        if not question_text:
            return jsonify({
                'success': False,
                'message': '问题内容不能为空'
            }), 400
        
        db_session = get_db_session()
        
        # 获取默认用户（简化处理）
        user = db_session.query(User).first()
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 400
        
        # 生成问题标题（取前50个字符）
        base_title = question_text[:50] + ('...' if len(question_text) > 50 else '')
        
        # 如果有筛选信息，添加到标题中
        if grade_label or subject_label:
            filter_prefix = []
            if grade_label:
                filter_prefix.append(grade_label)
            if subject_label:
                filter_prefix.append(subject_label)
            title = f"[{'-'.join(filter_prefix)}] {base_title}"
        else:
            title = base_title
        
        # 构建完整的筛选标签JSON
        filter_tags = {
            'grade': grade,
            'grade_label': grade_label,
            'subject': subject,
            'subject_label': subject_label,
            'timestamp': datetime.now().isoformat()
        }
        
        # 创建问题记录
        question = Question(
            title=title,
            content=question_text,
            user_id=user.id,
            status='pending',
            grade_level=grade,
            subject=subject_label,
            filter_tags=filter_tags
        )
        
        db_session.add(question)
        db_session.commit()
        
        # 为了与前端兼容，保留原格式的响应
        timestamp = question.created_at.strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"{timestamp}.txt"
        
        logger.info(f"问题已保存到数据库: ID {question.id}, 筛选信息: {filter_tags}")
        
        return jsonify({
            'success': True,
            'message': '问题保存成功',
            'question_id': question.id,
            'filename': filename,  # 为了兼容性保留
            'timestamp': question.created_at.isoformat(),
            'filters': filter_tags  # 返回筛选信息
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"保存问题失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'保存问题失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/save-to-requestion', methods=['POST'])
def save_to_requestion():
    """保存到重新提问 - 使用数据库"""
    db_session = None
    try:
        data = request.get_json()
        question_text = data.get('question', '').strip()
        
        if not question_text:
            return jsonify({
                'success': False,
                'message': '问题内容不能为空'
            }), 400
        
        db_session = get_db_session()
        
        # 获取默认用户
        user = db_session.query(User).first()
        if not user:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 400
        
        # 生成问题标题（取前50个字符）
        title = f"重新提问: {question_text[:40]}" + ('...' if len(question_text) > 40 else '')
        
        # 创建重新提问记录
        question = Question(
            title=title,
            content=question_text,
            user_id=user.id,
            status='requestion'
        )
        
        db_session.add(question)
        db_session.commit()
        
        timestamp = question.created_at.strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"requestion_{timestamp}.txt"
        
        logger.info(f"重新提问已保存到数据库: ID {question.id}")
        
        return jsonify({
            'success': True,
            'message': '重新提问保存成功',
            'question_id': question.id,
            'filename': filename,
            'timestamp': question.created_at.isoformat()
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"保存重新提问失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'保存重新提问失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/', methods=['GET'])
def get_questions():
    """获取所有问题 - 使用数据库，支持筛选查询"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 获取查询参数
        status = request.args.get('status')  # pending, answered, requestion
        grade_level = request.args.get('grade_level')  # primary, junior, senior, university
        subject = request.args.get('subject')  # 学科名称
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # 构建查询
        query = db_session.query(Question).filter_by(is_deleted=False)
        
        if status:
            query = query.filter_by(status=status)
        
        if grade_level:
            query = query.filter_by(grade_level=grade_level)
            
        if subject:
            query = query.filter_by(subject=subject)
        
        # 分页和排序
        query = query.order_by(Question.created_at.desc())
        total = query.count()
        
        offset = (page - 1) * per_page
        questions = query.offset(offset).limit(per_page).all()
        
        # 构建响应数据
        question_list = []
        for q in questions:
            question_data = {
                'id': q.id,
                'title': q.title,
                'content': q.content,
                'status': q.status,
                'priority': q.priority,
                'view_count': q.view_count,
                'answer_count': q.answer_count,
                'created_at': q.created_at.strftime('%Y-%m-%d %H:%M:%S') if q.created_at else None,
                'updated_at': q.updated_at.strftime('%Y-%m-%d %H:%M:%S') if q.updated_at else None,
                'user_id': q.user_id,
                # 筛选信息
                'category': q.category,
                'grade_level': q.grade_level,
                'subject': q.subject,
                'filter_tags': q.filter_tags,
                # 为了兼容性，生成类似文件名的标识
                'filename': f"{q.created_at.strftime('%Y-%m-%d_%H-%M-%S')}.txt" if q.created_at else f"question_{q.id}.txt"
            }
            question_list.append(question_data)
        
        # 获取筛选统计信息
        filter_stats = {
            'grade_levels': {},
            'subjects': {}
        }
        
        # 统计年级分布
        grade_stats = db_session.query(Question.grade_level, db_session.query(Question).filter_by(is_deleted=False, grade_level=Question.grade_level).count().label('count')).filter(Question.is_deleted==False, Question.grade_level.isnot(None)).group_by(Question.grade_level).all()
        
        for grade, count in grade_stats:
            if grade:
                filter_stats['grade_levels'][grade] = count
        
        # 统计学科分布
        subject_stats = db_session.query(Question.subject, db_session.query(Question).filter_by(is_deleted=False, subject=Question.subject).count().label('count')).filter(Question.is_deleted==False, Question.subject.isnot(None)).group_by(Question.subject).all()
        
        for subject_name, count in subject_stats:
            if subject_name:
                filter_stats['subjects'][subject_name] = count
        
        logger.info(f"成功获取 {len(question_list)} 个问题（数据库版本，支持筛选）")
        
        return jsonify({
            'success': True,
            'questions': question_list,
            'filter_stats': filter_stats,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        logger.error(f"获取问题列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'获取问题列表失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

@bp.route('/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """删除问题 - 使用数据库软删除"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 查找问题
        question = db_session.query(Question).filter_by(
            id=question_id,
            is_deleted=False
        ).first()
        
        if not question:
            return jsonify({
                'success': False,
                'message': '问题不存在'
            }), 404
        
        # 软删除
        question.is_deleted = True
        question.deleted_at = datetime.utcnow()
        
        db_session.commit()
        
        logger.info(f"问题删除成功: ID {question_id}")
        
        return jsonify({
            'success': True,
            'message': '问题删除成功'
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"删除问题失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'删除问题失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session)

# 为了兼容旧的基于文件名的删除API
@bp.route('/<filename>', methods=['DELETE'])
def delete_question_by_filename(filename):
    """通过文件名删除问题（兼容性API）"""
    db_session = None
    try:
        db_session = get_db_session()
        
        # 从文件名中提取时间戳
        if filename.endswith('.txt'):
            filename = filename[:-4]
        
        # 尝试从文件名解析日期时间
        try:
            # 格式: YYYY-MM-DD_HH-MM-SS
            timestamp_str = filename.replace('requestion_', '')
            dt = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M-%S')
            
            # 查找相近时间创建的问题
            question = db_session.query(Question).filter(
                Question.created_at >= dt,
                Question.created_at < dt.replace(second=dt.second + 1),
                Question.is_deleted == False
            ).first()
            
        except ValueError:
            # 如果解析失败，尝试按ID查找
            try:
                question_id = int(filename.split('_')[-1])
                question = db_session.query(Question).filter_by(
                    id=question_id,
                    is_deleted=False
                ).first()
            except ValueError:
                question = None
        
        if not question:
            return jsonify({
                'success': False,
                'message': '问题不存在'
            }), 404
        
        # 软删除
        question.is_deleted = True
        question.deleted_at = datetime.utcnow()
        
        db_session.commit()
        
        logger.info(f"问题删除成功（通过文件名）: {filename}")
        
        return jsonify({
            'success': True,
            'message': '问题删除成功'
        })
        
    except Exception as e:
        if db_session:
            db_session.rollback()
        logger.error(f"删除问题失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'删除问题失败: {str(e)}'
        }), 500
    finally:
        close_db_session(db_session) 