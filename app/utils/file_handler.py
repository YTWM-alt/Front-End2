import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
import logging

# 配置日志
logger = logging.getLogger(__name__)

# 允许的文件类型
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'}

def allowed_file(filename):
    """
    检查文件类型是否允许
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_unique_filename(filename):
    """
    生成唯一的文件名
    """
    # 获取文件扩展名
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    # 生成唯一文件名
    unique_filename = f"{str(uuid.uuid4())}.{ext}"
    return unique_filename

def save_file(file, directory):
    """
    保存上传的文件
    
    Args:
        file: FileStorage对象
        directory: 保存目录
        
    Returns:
        tuple: (是否成功, 文件路径或错误信息)
    """
    try:
        if file and allowed_file(file.filename):
            # 安全化文件名
            filename = secure_filename(file.filename)
            # 生成唯一文件名
            unique_filename = get_unique_filename(filename)
            
            # 确保目录存在
            os.makedirs(directory, exist_ok=True)
            
            # 构建完整的文件路径
            filepath = os.path.join(directory, unique_filename)
            
            # 保存文件
            file.save(filepath)
            
            logger.info(f"File saved successfully: {filepath}")
            return True, filepath
        else:
            return False, "不支持的文件类型"
            
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        return False, str(e)

def delete_file(filepath):
    """
    删除文件
    
    Args:
        filepath: 文件路径
        
    Returns:
        tuple: (是否成功, 成功/错误信息)
    """
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.info(f"File deleted successfully: {filepath}")
            return True, "文件删除成功"
        else:
            return False, "文件不存在"
            
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        return False, str(e)

def get_file_size(filepath):
    """
    获取文件大小（以字节为单位）
    """
    try:
        return os.path.getsize(filepath)
    except OSError as e:
        logger.error(f"Error getting file size: {str(e)}")
        return 0

def validate_file_size(file, max_size_mb=500):
    """
    验证文件大小是否在允许范围内
    
    Args:
        file: FileStorage对象
        max_size_mb: 最大允许的文件大小（MB）
        
    Returns:
        bool: 文件大小是否合法
    """
    # 将MB转换为字节
    max_size_bytes = max_size_mb * 1024 * 1024
    
    # 获取文件大小
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # 重置文件指针
    
    return file_size <= max_size_bytes

def create_temp_directory():
    """
    创建临时目录
    
    Returns:
        str: 临时目录路径
    """
    temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir 