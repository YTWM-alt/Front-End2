# 🎯 未决定AI平台

## 项目概述
未决定AI平台是一个基于 Flask 和 React 的全栈应用，提供智能问答、视频管理、用户反馈等功能。

## 技术栈
### 后端
- Python 3.8+
- Flask 3.0
- SQLite（文件系统存储）
- Flask-CORS
- Python-magic（文件类型检测）

### 前端
- React 18
- Material-UI (MUI)
- React Router
- React Query
- Zustand
- Axios

## 📖 完整文档

请查看 **[项目完整说明文档.md](./项目完整说明文档.md)** 获取详细的项目信息，包括：

- 🏗️ 项目架构和文件结构
- 🔧 核心功能详解
- 🚀 部署和使用指南
- 📊 API接口文档
- 🔄 版本历史
- 🐛 故障排除
- 📈 性能优化建议

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- pip（Python包管理器）
- npm（Node.js包管理器）
- MySQL 5.7+（数据库）

### 系统依赖
#### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libmagic1 ffmpeg mysql-server mysql-client libmysqlclient-dev

# CentOS/RHEL
sudo yum install -y file-libs ffmpeg mysql-server mysql-devel

# macOS
brew install libmagic ffmpeg mysql
```

#### Windows
- 安装 [FFmpeg](https://ffmpeg.org/download.html)
- 安装 [Python-magic-bin](https://pypi.org/project/python-magic-bin/)
- 安装 [MySQL](https://dev.mysql.com/downloads/installer/)

### 克隆项目
```bash
git clone <项目地址>
cd front-end2
```

### 数据库配置
1. 启动MySQL服务：
```bash
# Linux
sudo systemctl start mysql

# macOS
brew services start mysql

# Windows
# 通过服务管理启动MySQL
```

2. 初始化数据库：
```bash
python init_db.py
```
按照提示输入数据库名称、用户名和密码，以及MySQL root密码。

### 启动后端服务
1. 创建并激活虚拟环境：
```bash
# Linux/Mac
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
.\venv\Scripts\activate
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 初始化数据库迁移：
```bash
flask db init
flask db migrate -m "初始迁移"
flask db upgrade
```

4. 启动服务：
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

服务将在 http://localhost:3002 启动

### 启动前端服务
1. 进入前端目录：
```bash
cd react
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

前端服务将在 http://localhost:3000 启动

## 📁 项目结构

```
front-end2/
├── app/                    # Flask后端应用
│   ├── routes/            # API路由
│   ├── utils/             # 工具函数
│   └── __init__.py        # 应用初始化
├── react/                  # React前端应用
│   ├── src/               # 源代码
│   │   ├── components/    # React组件
│   │   ├── utils/         # 工具函数
│   │   └── App.js         # 主应用组件
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── database/              # 数据存储目录
│   ├── video/            # 视频文件
│   ├── question/         # 问题记录
│   ├── answer/           # AI回答
│   ├── feedback/         # 用户反馈
│   ├── user/             # 用户数据
│   └── touxiang/         # 用户头像
├── venv/                  # Python虚拟环境
├── requirements.txt       # Python依赖
├── run.py                # 后端启动脚本
├── start.sh              # Linux/Mac启动脚本
└── start.bat             # Windows启动脚本
```

## ✨ 主要功能

- ✅ 用户认证系统（真实文件存储）
- ✅ 头像上传和管理
- ✅ 视频管理和播放
- ✅ 问题自动保存
- ✅ AI聊天功能
- ✅ 反馈系统
- ✅ 个人中心管理

---

**📝 详细信息请查看**: [项目完整说明文档.md](./项目完整说明文档.md) 

# 未决定AI平台后端服务

## 📝 项目简介
这是一个基于 Flask 的后端服务项目，提供用户认证、视频管理、问题管理、反馈管理和AI服务等功能。项目采用文件系统存储数据，支持用户注册、登录、头像上传、视频处理等功能。

## 🚀 快速开始

### 1. 环境要求
- Python 3.8 或更高版本
- pip（Python包管理器）
- 操作系统要求：
  - Linux: 需要安装 `libmagic1` 和 `ffmpeg`
  - Windows: 需要安装 `ffmpeg` 并添加到系统PATH

### 2. 克隆项目
```bash
git clone <项目地址>
cd <项目目录>
```

### 3. 创建并激活虚拟环境

#### Linux/Mac系统：
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate
```

#### Windows系统：
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate
```

### 4. 安装系统依赖

#### Linux系统：
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libmagic1 ffmpeg

# CentOS/RHEL
sudo yum install -y file-libs ffmpeg
```

#### Windows系统：
1. 下载 [ffmpeg](https://ffmpeg.org/download.html)
2. 解压到合适的目录（如 `C:\ffmpeg`）
3. 将 ffmpeg 的 bin 目录添加到系统环境变量 PATH 中
4. 重启终端使环境变量生效

### 5. 安装项目依赖
```bash
# 确保在虚拟环境中
pip install -r requirements.txt
```

### 6. 配置环境变量
创建 `.env` 文件（可选，用于自定义配置）：
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
# Linux/Mac:
nano .env
# Windows:
notepad .env
```

可配置的环境变量：
```ini
# 服务器配置
FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_HOST=0.0.0.0
FLASK_PORT=3002

# 数据库目录配置（可选）
DATABASE_DIR=./database
```

### 7. 启动服务

#### 开发模式：
```bash
# 确保在虚拟环境中
python run.py
```

#### 生产模式：
```bash
# 确保在虚拟环境中
export FLASK_ENV=production
python run.py
```

服务启动后，可以通过以下地址访问：
- 本地访问：http://localhost:3002
- 局域网访问：http://<本机IP>:3002

## 📚 项目结构
```
project/
├── app/                    # 应用主目录
│   ├── __init__.py        # 应用初始化
│   ├── config.py          # 配置文件
│   ├── routes/            # 路由模块
│   │   ├── auth.py       # 认证相关
│   │   ├── video.py      # 视频管理
│   │   ├── question.py   # 问题管理
│   │   ├── feedback.py   # 反馈管理
│   │   └── ai.py         # AI服务
│   └── utils/            # 工具模块
│       ├── error_handlers.py  # 错误处理
│       └── file_handler.py    # 文件处理
├── database/              # 数据存储目录
│   ├── user/             # 用户数据
│   ├── video/            # 视频文件
│   ├── question/         # 问题文件
│   ├── feedback/         # 反馈文件
│   ├── answer/           # AI回答
│   └── touxiang/         # 用户头像
├── venv/                 # 虚拟环境
├── .env                  # 环境变量
├── .env.example          # 环境变量示例
├── requirements.txt      # 项目依赖
├── run.py               # 启动脚本
└── README.md            # 项目说明
```

## 🔍 可用API端点

### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/user/<email>` - 获取用户信息
- `GET /api/users` - 获取用户列表

### 视频相关
- `GET /api/videos` - 获取视频列表
- `GET /videos/<filename>` - 访问视频文件
- `DELETE /api/videos/<filename>` - 删除视频
- `POST /api/process-ai-video` - 处理AI视频

### 问题相关
- `POST /api/save-question` - 保存问题
- `GET /api/questions` - 获取问题列表
- `DELETE /api/questions/<filename>` - 删除问题

### 反馈相关
- `POST /api/feedback` - 提交反馈
- `GET /api/feedback` - 获取反馈列表
- `PUT /api/feedback/<id>` - 更新反馈状态

### AI服务相关
- `GET /api/pending-answers` - 获取待处理回答
- `GET /api/ai-status` - 获取AI服务状态

### 系统相关
- `GET /api/health` - 健康检查

## 🛠️ 开发工具

### 代码格式化
```bash
# 使用black格式化代码
black .

# 使用flake8检查代码
flake8 .
```

### 运行测试
```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_auth.py
```

## 📦 部署说明

### 生产环境部署
1. 确保所有系统依赖已安装
2. 设置 `FLASK_ENV=production`
3. 配置适当的安全设置
4. 使用生产级WSGI服务器（如Gunicorn）

### 使用Gunicorn部署
```bash
# 安装gunicorn
pip install gunicorn

# 启动服务
gunicorn -w 4 -b 0.0.0.0:3002 run:app
```

## 🔧 常见问题

### 1. 虚拟环境问题
- 问题：`python: command not found`
- 解决：确保Python已正确安装并添加到PATH

### 2. 依赖安装问题
- 问题：`pip install` 失败
- 解决：尝试更新pip：`python -m pip install --upgrade pip`

### 3. 系统依赖问题
- 问题：`libmagic` 相关错误
- 解决：确保已安装系统依赖（见"安装系统依赖"部分）

### 4. 端口占用问题
- 问题：端口3002被占用
- 解决：修改 `.env` 文件中的 `FLASK_PORT` 或关闭占用端口的程序

## 📞 支持与帮助
如有问题，请：
1. 查看常见问题部分
2. 检查日志文件
3. 提交Issue

## 📄 许可证
[添加许可证信息] 

## 📈 性能优化建议

# 修复日志

## 2023-11-06 代码修复记录

今天对后端代码进行了以下修复:

1. **认证路由修复**：
   - 修复了 `app/routes/auth.py` 中的字段名不匹配问题，将 `password` 改为 `password_hash` 以匹配User模型

2. **数据库初始化改进**：
   - 更新 `app/__init__.py` 添加了正确的数据库初始化流程
   - 修复了数据库连接和会话管理逻辑

3. **应用配置优化**：
   - 修改 `run.py` 使用配置文件中定义的HOST和PORT配置
   - 确保应用在正确的地址和端口上启动

4. **数据库会话管理**：
   - 改进了 `app/database.py` 中的数据库引擎和会话初始化
   - 添加了全局变量和懒加载逻辑，避免重复初始化

这些修复确保了后端API的正常工作，修复了同学修改代码后产生的不一致性问题。

---

**📝 详细信息请查看**: [项目完整说明文档.md](./项目完整说明文档.md) 