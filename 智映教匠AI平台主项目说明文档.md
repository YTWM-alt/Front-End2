# 智映教匠AI平台主项目说明文档

## 📖 项目概述

智映教匠AI平台是一个现代化的教育技术平台，采用React 18 + Flask 3.0 + MySQL的全栈架构。平台提供智能问答、视频学习、用户管理、反馈系统等核心功能，致力于为用户提供优质的AI驱动学习体验。

### ✨ 核心特性

- 🤖 **AI智能问答** - 基于先进算法的智能问答系统，支持多学科多年级筛选
- 🎬 **视频学习中心** - 完整的视频上传、播放、管理解决方案
- 👥 **用户系统** - 完善的注册登录、个人资料、权限管理
- 💬 **反馈系统** - 用户反馈收集、处理和跟踪
- 📱 **响应式设计** - 支持桌面和移动端的现代化UI
- 🔒 **数据安全** - 软删除机制、输入验证、错误处理

### 🏗️ 技术架构

```
智映教匠AI平台架构
├── 前端层 (React 18)
│   ├── 用户界面组件
│   ├── 状态管理 (Zustand)
│   ├── 路由管理 (React Router)
│   └── API请求 (Axios)
├── 后端层 (Flask 3.0)
│   ├── RESTful API
│   ├── 业务逻辑处理
│   ├── 数据库模型 (SQLAlchemy)
│   └── 文件处理系统
├── 数据层 (MySQL 8.0)
│   ├── 用户数据
│   ├── 内容数据
│   ├── 业务数据
│   └── 审计日志
└── 存储层
    ├── 视频文件 (1.8GB, 41个文件)
    ├── 用户头像
    └── 系统日志
```

## 🚀 快速开始

### 环境要求

- **Python**: 3.8+
- **Node.js**: 16+
- **MySQL**: 8.0+
- **系统依赖**: FFmpeg, libmagic

### 项目部署

```bash
# 1. 克隆项目
git clone <项目地址>
cd front-end2

# 2. 后端环境配置
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

pip install -r requirements.txt

# 3. 数据库初始化
mysql -u root -p -e "CREATE DATABASE ai_platform;"
python init_db.py

# 4. 启动后端服务 (端口: 3003)
./start.sh  # Linux/Mac
# 或 start.bat  # Windows

# 5. 前端环境配置
cd react
npm install

# 6. 启动前端服务 (端口: 3000)
npm start
```

### 数据库配置

- **主机**: localhost:3306
- **用户**: root
- **密码**: 123456
- **数据库**: ai_platform

## 📁 项目结构

```
front-end2/
├── app/                           # Flask后端应用
│   ├── __init__.py               # 应用工厂和配置
│   ├── app_config.py             # 应用配置管理
│   ├── database.py               # 数据库连接配置
│   ├── models/                   # 数据模型
│   │   ├── user.py              # 用户模型
│   │   ├── video.py             # 视频模型
│   │   ├── question.py          # 问题模型
│   │   ├── answer.py            # 回答模型
│   │   └── feedback.py          # 反馈模型
│   ├── routes/                   # API路由
│   │   ├── auth.py              # 认证相关API
│   │   ├── video.py             # 视频管理API
│   │   ├── question.py          # 问题管理API
│   │   ├── feedback.py          # 反馈管理API
│   │   └── ai.py                # AI服务API
│   ├── utils/                    # 工具模块
│   │   ├── error_handlers.py    # 错误处理
│   │   ├── file_handler.py      # 文件处理
│   │   └── validators.py        # 数据验证
│   └── scripts/                  # 管理脚本
│       ├── init_db.py           # 数据库初始化
│       ├── migrate_data.py      # 数据迁移
│       └── sync_videos.py       # 视频同步
├── react/                        # React前端应用
│   ├── src/                     # 源代码目录
│   │   ├── components/          # React组件
│   │   │   ├── auth/           # 认证组件
│   │   │   ├── chat/           # 聊天/问答组件
│   │   │   ├── common/         # 通用组件
│   │   │   ├── search/         # 搜索组件
│   │   │   └── video/          # 视频组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── MyVideos.jsx    # 我的视频
│   │   │   ├── Profile.jsx     # 个人资料
│   │   │   ├── Feedback.jsx    # 反馈页面
│   │   │   └── Community.jsx   # 社区页面
│   │   ├── hooks/              # 自定义Hooks
│   │   │   ├── useAuth.js      # 认证Hook
│   │   │   └── useChat.js      # 聊天Hook
│   │   ├── utils/              # 工具函数
│   │   │   ├── api.js          # API客户端
│   │   │   ├── apiService.js   # API服务
│   │   │   ├── constants.js    # 常量定义
│   │   │   └── fileUtils.js    # 文件工具
│   │   ├── styles/             # 样式文件
│   │   │   └── global.css      # 全局样式
│   │   ├── App.jsx             # 主应用组件
│   │   └── index.js            # 入口文件
│   ├── public/                  # 静态资源
│   │   ├── index.html          # HTML模板
│   │   ├── logo.png            # 项目Logo
│   │   └── manifest.json       # PWA配置
│   └── package.json            # 前端依赖配置
├── database/                    # 数据存储目录
│   ├── video/                  # 视频文件 (1.8GB, 41个文件)
│   ├── user/                   # 用户数据 (遗留)
│   ├── question/               # 问题数据 (遗留)
│   ├── feedback/               # 反馈数据 (遗留)
│   ├── touxiang/               # 用户头像
│   └── db_config.json          # 数据库配置
├── logs/                       # 日志文件
├── migrations/                 # 数据库迁移
├── static/                     # 静态文件
├── templates/                  # 模板文件
├── requirements.txt            # Python依赖
├── run.py                      # 应用启动脚本
├── start.sh                    # Linux启动脚本
├── start.bat                   # Windows启动脚本
└── README.md                   # 项目说明
```

## 🔧 核心功能详解

### 1. 用户认证系统

**功能特性**
- 用户注册与邮箱验证
- 安全登录与JWT认证
- 个人资料管理
- 头像上传与显示
- 密码安全加密

**技术实现**
- 前端: React Hook Form + 输入验证
- 后端: Flask-JWT-Extended + Werkzeug密码哈希
- 数据库: 用户表软删除设计

**API端点**
```bash
POST /api/auth/register     # 用户注册
POST /api/auth/login        # 用户登录
GET  /api/auth/user         # 获取用户信息
PUT  /api/auth/profile      # 更新个人资料
POST /api/auth/avatar       # 上传头像
```

### 2. 智能问答系统

**功能特性**
- 多学科问题分类 (数学、英语、科学等)
- 年级层次筛选 (小学、初中、高中、大学)
- 问题自动保存机制
- AI回答生成与展示
- 问答历史记录

**筛选系统**
```json
{
    "grade": "primary",      // 年级代码
    "gradeLabel": "小学",    // 年级显示名
    "subject": "math",       // 学科代码
    "subjectLabel": "数学",  // 学科显示名
    "timestamp": "2025-01-20T10:30:00"
}
```

**API端点**
```bash
POST /api/questions/save-question    # 保存问题
GET  /api/questions/                 # 获取问题列表
GET  /api/questions/{id}             # 获取问题详情
DELETE /api/questions/{id}           # 删除问题
```

### 3. 视频学习中心

**功能特性**
- 视频文件上传与验证
- 多格式支持 (MP4, WebM, OGG)
- 在线视频播放器
- 视频元数据管理
- 播放统计与分析

**技术实现**
- 文件验证: Python-magic MIME类型检测
- 视频处理: FFmpeg格式转换
- 存储策略: 文件系统存储 + 数据库元数据
- 播放器: 原生HTML5 Video API

**API端点**
```bash
GET  /api/videos/              # 获取视频列表
POST /api/videos/upload        # 上传视频
GET  /api/videos/{id}          # 获取视频详情
PUT  /api/videos/{id}          # 更新视频信息
DELETE /api/videos/{id}        # 删除视频
GET  /videos/{filename}        # 视频文件流
```

### 4. 反馈管理系统

**功能特性**
- 多类型反馈收集 (BUG、功能建议、投诉、表扬)
- 优先级管理 (低、中、高、紧急)
- 处理状态跟踪
- 反馈统计与分析

**反馈类型**
- `BUG`: 错误报告
- `FEATURE`: 功能建议
- `COMPLAINT`: 投诉
- `PRAISE`: 表扬
- `OTHER`: 其他

**API端点**
```bash
GET  /api/feedback/        # 获取反馈列表
POST /api/feedback/submit  # 提交反馈
PUT  /api/feedback/{id}    # 更新反馈状态
DELETE /api/feedback/{id}  # 删除反馈
```

## 📊 数据统计

### 当前数据量 (2025年1月)

| 数据类型 | 数量 | 状态 |
|---------|------|------|
| 用户 | 10个 | ✅ 活跃 |
| 问题 | 82个 | ✅ 包含筛选功能 |
| 视频 | 32个 (数据库) + 41个 (文件系统) | ⚠️ 同步中 |
| 反馈 | 5个 | ✅ 正常 |
| 回答 | 0个 | 🔄 待开发 |

### 存储统计

- **数据库大小**: ~50MB
- **视频文件**: 1.8GB (41个MP4文件)
- **用户头像**: ~10MB
- **日志文件**: ~840KB

## 🔄 数据迁移状态

### 已完成迁移
- ✅ **用户数据**: database/user/*.txt → users表
- ✅ **问题数据**: database/question/*.txt → questions表 (含筛选功能)
- ✅ **反馈数据**: database/feedback/*.txt → feedbacks表

### 混合存储模式
- **视频元数据**: 存储在videos表
- **视频文件**: 保留在database/video/目录
- **用户头像**: 存储在database/touxiang/目录

## 🛡️ 安全与性能

### 安全措施
- **SQL注入防护**: SQLAlchemy参数化查询
- **XSS防护**: 输入验证和输出编码
- **文件上传安全**: 类型检测、大小限制
- **密码安全**: Werkzeug密码哈希
- **软删除**: 数据安全删除机制

### 性能优化
- **数据库索引**: 用户名、邮箱、时间字段
- **文件分页**: 大数据集分页加载
- **静态资源**: CDN准备就绪
- **错误处理**: 全局异常捕获
- **日志系统**: 结构化日志记录

## 🔧 开发与维护

### 开发工作流

```bash
# 1. 开发环境搭建
source venv/bin/activate
pip install -r requirements.txt
cd react && npm install

# 2. 数据库迁移
flask db init
flask db migrate -m "描述"
flask db upgrade

# 3. 运行测试
python -m pytest tests/
cd react && npm test

# 4. 启动开发服务
./start.sh
cd react && npm start
```

### 部署清单

- [ ] 环境变量配置
- [ ] 数据库连接测试
- [ ] 文件权限设置
- [ ] SSL证书配置
- [ ] 域名解析设置
- [ ] 防火墙规则
- [ ] 备份策略制定

### 常见问题

**Q: 视频上传失败**
A: 检查FFmpeg安装、文件大小限制、目录权限

**Q: 数据库连接失败**
A: 验证MySQL服务、连接参数、网络连通性

**Q: 前端页面空白**
A: 检查后端服务状态、CORS配置、控制台错误

## 📈 发展规划

### 短期目标 (Q1 2025)
- [ ] AI回答功能完善
- [ ] 视频数据库同步
- [ ] 移动端适配优化
- [ ] 性能监控系统

### 中期目标 (Q2-Q3 2025)
- [ ] 实时通知系统
- [ ] 多语言国际化
- [ ] 高级搜索功能
- [ ] 数据分析仪表板

### 长期目标 (Q4 2025+)
- [ ] 微服务架构迁移
- [ ] AI模型集成
- [ ] 企业级功能
- [ ] 开放API平台

## 📞 联系信息

**开发团队**: 广州大学网络空间安全学院  
**项目负责人**: 智映教匠开发团队  
**技术支持**: 见项目Issues或联系开发团队  
**文档更新**: 2025年1月20日  

---

*本文档为智映教匠AI平台主项目的完整技术说明，涵盖架构设计、功能实现、部署运维等全方位内容。* 