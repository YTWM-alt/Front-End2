import re

def validate_email(email):
    """
    验证邮箱格式是否正确
    
    Args:
        email: 待验证的邮箱地址
        
    Returns:
        bool: 邮箱格式是否合法
    """
    # 邮箱格式的正则表达式
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password):
    """
    验证密码强度
    
    密码必须满足以下条件：
    1. 至少8个字符
    2. 至少包含一个大写字母
    3. 至少包含一个小写字母
    4. 至少包含一个数字
    5. 至少包含一个特殊字符
    
    Args:
        password: 待验证的密码
        
    Returns:
        bool: 密码强度是否合格
    """
    if len(password) < 8:
        return False
        
    # 检查是否包含至少一个大写字母
    if not re.search(r'[A-Z]', password):
        return False
        
    # 检查是否包含至少一个小写字母
    if not re.search(r'[a-z]', password):
        return False
        
    # 检查是否包含至少一个数字
    if not re.search(r'\d', password):
        return False
        
    # 检查是否包含至少一个特殊字符
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
        
    return True

def validate_username(username):
    """
    验证用户名格式
    
    用户名必须满足以下条件：
    1. 长度在3-20个字符之间
    2. 只能包含字母、数字、下划线
    3. 必须以字母开头
    
    Args:
        username: 待验证的用户名
        
    Returns:
        bool: 用户名格式是否合法
    """
    # 用户名格式的正则表达式
    pattern = r'^[a-zA-Z][a-zA-Z0-9_]{2,19}$'
    return bool(re.match(pattern, username))

def validate_file_type(filename, allowed_extensions):
    """
    验证文件类型是否允许
    
    Args:
        filename: 文件名
        allowed_extensions: 允许的文件扩展名集合
        
    Returns:
        bool: 文件类型是否允许
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions 