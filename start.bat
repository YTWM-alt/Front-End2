@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 设置颜色代码
set "BLUE=[94m"
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "NC=[0m"

:: 打印带颜色的消息
call :print_message "开始启动未决定AI平台后端服务..."

:: 检查Python是否安装
python --version > nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "未找到Python，请先安装Python"
    pause
    exit /b 1
)
call :print_success "Python已安装: "
python --version

:: 检查虚拟环境
if not exist venv (
    call :print_message "创建虚拟环境..."
    python -m venv venv
    if %errorlevel% neq 0 (
        call :print_error "创建虚拟环境失败"
        pause
        exit /b 1
    )
    call :print_success "虚拟环境创建成功"
)

:: 检查ffmpeg
where ffmpeg > nul 2>&1
if %errorlevel% neq 0 (
    call :print_warning "未找到ffmpeg，请手动安装并添加到系统PATH"
    call :print_message "下载地址: https://ffmpeg.org/download.html"
    pause
)

:: 安装项目依赖
call :print_message "安装项目依赖..."

:: 激活虚拟环境
call venv\Scripts\activate.bat

:: 升级pip
python -m pip install --upgrade pip

:: 安装依赖
pip install -r requirements.txt
if %errorlevel% neq 0 (
    call :print_error "安装依赖失败"
    pause
    exit /b 1
)
call :print_success "依赖安装完成"

:: 检查环境变量文件
if not exist .env (
    call :print_message "创建环境变量文件..."
    if exist .env.example (
        copy .env.example .env
        call :print_success "已创建.env文件，请根据需要修改配置"
    ) else (
        call :print_warning "未找到.env.example文件，将创建默认.env文件"
        (
            echo # 服务器配置
            echo FLASK_APP=run.py
            echo FLASK_ENV=development
            echo FLASK_DEBUG=1
            echo FLASK_HOST=0.0.0.0
            echo FLASK_PORT=3002
            echo.
            echo # 数据库目录配置
            echo DATABASE_DIR=./database
        ) > .env
        call :print_success "已创建默认.env文件"
    )
)

:: 启动服务
call :print_message "启动服务..."

:: 读取端口配置
set "PORT=3002"
for /f "tokens=2 delims==" %%a in ('type .env ^| findstr FLASK_PORT') do set "PORT=%%a"

:: 启动服务
call :print_message "服务将在 http://localhost:%PORT% 启动"
python run.py

:: 如果服务异常退出
if %errorlevel% neq 0 (
    call :print_error "服务异常退出，错误代码: %errorlevel%"
    pause
)

exit /b 0

:: 函数定义
:print_message
echo %BLUE%[未决定AI平台]%NC% %~1
exit /b 0

:print_success
echo %GREEN%[成功]%NC% %~1
exit /b 0

:print_error
echo %RED%[错误]%NC% %~1
exit /b 0

:print_warning
echo %YELLOW%[警告]%NC% %~1
exit /b 0 