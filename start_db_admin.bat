@echo off
REM 未决定AI平台 - 数据库管理工具启动脚本(Windows版)

echo ==========================================
echo    未决定AI平台 - 数据库管理工具启动脚本
echo ==========================================

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 检查是否已激活虚拟环境
if "%VIRTUAL_ENV%"=="" (
    echo 正在激活虚拟环境...
    REM 检查虚拟环境是否存在
    if exist "venv" (
        call venv\Scripts\activate.bat
    ) else (
        echo 错误: 虚拟环境不存在!
        echo 正在为您创建虚拟环境...
        python -m venv venv
        call venv\Scripts\activate.bat
        echo 虚拟环境已创建并激活!
    )
) else (
    echo 已检测到激活的虚拟环境: %VIRTUAL_ENV%
)

REM 检查和安装依赖
echo 检查所需依赖...
pip install -q mysql-connector-python Flask pandas werkzeug Flask-SQLAlchemy

REM 确保目录存在
if not exist "logs" mkdir logs
if not exist "templates\db_admin" mkdir templates\db_admin
if not exist "static\db_admin" mkdir static\db_admin

REM 检查MySQL服务是否运行
echo 检查MySQL服务状态...
sc query mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo MySQL服务正在运行
) else (
    echo MySQL服务未运行!
    echo 请确保MySQL已安装并运行
    echo 您可以通过服务管理器启动MySQL服务
    echo 或者运行以下命令: net start mysql
    timeout /t 5
)

REM 启动数据库管理工具
echo 启动数据库管理工具...
python db_admin_run.py

pause 