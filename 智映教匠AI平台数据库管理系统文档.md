# 智映教匠AI平台数据库管理系统文档

## 1. 系统概述

智映教匠AI平台是一个基于Web的智能教育平台，采用React 18前端 + Flask 3.0后端 + MySQL数据库的全栈架构。该系统实现了从传统本地文件存储向MySQL数据库的完整迁移，提供用户管理、视频教学、智能问答、反馈管理等核心功能。

### 1.1 系统特点

- **现代化架构**：前后端分离，RESTful API设计
- **数据库驱动**：完全基于MySQL数据库，支持事务和关系查询
- **智能筛选**：支持年级层次、学科分类的多维度筛选系统
- **用户体验**：响应式设计，支持中英文界面
- **数据安全**：软删除机制，完整的审计日志
- **混合存储**：数据库存储结构化数据，文件系统存储媒体文件

### 1.2 技术栈

- **前端**：React 18, React Router, 原生CSS
- **后端**：Python Flask 3.0, SQLAlchemy ORM
- **数据库**：MySQL 8.0+ (连接信息：localhost:3306, root:123456, ai_platform)
- **文件存储**：本地文件系统 (database/video/, react/public/)
- **日志系统**：Python logging + 文件日志

## 2. 数据存储架构

### 2.1 存储分层

```
智映教匠AI平台数据存储架构
├── MySQL数据库 (ai_platform)           # 结构化数据存储
│   ├── users                           # 用户账户信息
│   ├── questions                       # 问题与筛选信息
│   ├── answers                         # AI/人工回答
│   ├── videos                          # 视频元数据
│   └── feedbacks                       # 用户反馈
├── 文件系统                            # 媒体与资源文件
│   ├── database/video/                 # 视频文件存储
│   ├── react/public/                   # 前端静态资源
│   └── logs/                           # 系统日志文件
└── 遗留本地数据 (database/)            # 待迁移的历史数据
    ├── user/*.txt                      # 用户注册记录(已迁移)
    ├── question/*.txt                  # 问题记录(已迁移)
    └── feedback/*.txt                  # 反馈记录(部分迁移)
```

### 2.2 数据分类

#### MySQL存储的数据：
- **用户管理**：注册、登录、权限、个人信息
- **内容管理**：问题、回答、视频元数据
- **业务逻辑**：筛选标签、状态管理、关系映射
- **审计跟踪**：创建时间、更新时间、软删除标记

#### 文件系统存储的数据：
- **媒体文件**：视频文件(.mp4)、缩略图、用户头像
- **静态资源**：Logo、CSS、JavaScript、图片
- **系统文件**：日志文件、配置文件、临时文件

## 3. MySQL数据库结构详解

### 3.1 数据库连接信息

```json
{
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "123456",
    "database": "ai_platform"
}
```

### 3.2 表结构设计

#### 3.2.1 用户表 (users)

| 字段名        | 类型         | 约束               | 说明                    |
|-------------|--------------|-------------------|------------------------|
| id          | int          | PRIMARY KEY, AUTO  | 主键ID                 |
| username    | varchar(50)  | NOT NULL, UNIQUE   | 用户名                 |
| email       | varchar(100) | NOT NULL, UNIQUE   | 邮箱地址               |
| password_hash| varchar(128) | NOT NULL          | 密码哈希值             |
| avatar_url  | varchar(200) | NULL              | 头像URL路径            |
| is_active   | tinyint(1)   | NOT NULL, DEFAULT 1| 账户激活状态           |
| last_login  | datetime     | NULL              | 最后登录时间           |
| login_count | int          | NOT NULL, DEFAULT 0| 登录次数              |
| nickname    | varchar(50)  | NULL              | 显示昵称               |
| bio         | text         | NULL              | 个人简介               |
| phone       | varchar(20)  | NULL              | 手机号码               |
| created_at  | datetime     | NOT NULL          | 创建时间               |
| updated_at  | datetime     | NOT NULL          | 更新时间               |
| is_deleted  | tinyint(1)   | NOT NULL, DEFAULT 0| 软删除标记             |
| deleted_at  | datetime     | NULL              | 删除时间               |

**索引设计**：
- 主键索引：id
- 唯一索引：username, email
- 复合索引：(is_deleted, is_active) - 查询活跃用户

**当前数据量**：8条记录

#### 3.2.2 问题表 (questions)

| 字段名       | 类型         | 约束               | 说明                    |
|------------|--------------|-------------------|------------------------|
| id         | int          | PRIMARY KEY, AUTO  | 主键ID                 |
| title      | varchar(200) | NOT NULL          | 问题标题               |
| content    | text         | NOT NULL          | 问题详细内容           |
| user_id    | int          | NOT NULL, FOREIGN  | 提问用户ID             |
| status     | varchar(20)  | NOT NULL, DEFAULT 'pending'| 问题状态        |
| priority   | int          | NOT NULL, DEFAULT 0| 优先级(0-2)           |
| view_count | int          | NOT NULL, DEFAULT 0| 浏览次数              |
| answer_count| int         | NOT NULL, DEFAULT 0| 回答数量              |
| category   | varchar(100) | NULL              | 问题分类               |
| grade_level| varchar(50)  | NULL              | 年级层次               |
| subject    | varchar(50)  | NULL              | 学科分类               |
| filter_tags| json         | NULL              | 完整筛选信息JSON       |
| created_at | datetime     | NOT NULL          | 创建时间               |
| updated_at | datetime     | NOT NULL          | 更新时间               |
| is_deleted | tinyint(1)   | NOT NULL, DEFAULT 0| 软删除标记             |
| deleted_at | datetime     | NULL              | 删除时间               |

**状态枚举**：
- `pending`: 待回答
- `answered`: 已回答
- `closed`: 已关闭
- `requestion`: 重新提问

**年级层次枚举**：
- `primary`: 小学
- `junior`: 初中
- `senior`: 高中
- `university`: 大学

**筛选系统JSON格式**：
```json
{
    "grade": "primary",
    "grade_label": "小学",
    "subject": "math",
    "subject_label": "数学",
    "timestamp": "2025-01-20T10:30:00"
}
```

**索引设计**：
- 主键索引：id
- 外键索引：user_id
- 复合索引：(is_deleted, status, grade_level, subject)
- 时间索引：created_at

**当前数据量**：77条记录

#### 3.2.3 回答表 (answers)

| 字段名          | 类型         | 约束               | 说明                    |
|---------------|--------------|-------------------|------------------------|
| id            | int          | PRIMARY KEY, AUTO  | 主键ID                 |
| content       | text         | NOT NULL          | 回答内容               |
| question_id   | int          | NOT NULL, FOREIGN  | 关联问题ID             |
| user_id       | int          | NOT NULL, FOREIGN  | 回答用户ID             |
| is_accepted   | tinyint(1)   | NOT NULL, DEFAULT 0| 是否被采纳             |
| is_ai_generated| tinyint(1)  | NOT NULL, DEFAULT 1| 是否AI生成             |
| like_count    | int          | NOT NULL, DEFAULT 0| 点赞数                |
| dislike_count | int          | NOT NULL, DEFAULT 0| 点踩数                |
| created_at    | datetime     | NOT NULL          | 创建时间               |
| updated_at    | datetime     | NOT NULL          | 更新时间               |
| is_deleted    | tinyint(1)   | NOT NULL, DEFAULT 0| 软删除标记             |
| deleted_at    | datetime     | NULL              | 删除时间               |

**索引设计**：
- 主键索引：id
- 外键索引：question_id, user_id
- 复合索引：(question_id, is_deleted, is_accepted)

**当前数据量**：0条记录

#### 3.2.4 视频表 (videos)

| 字段名         | 类型         | 约束               | 说明                    |
|-------------|--------------|-------------------|------------------------|
| id          | int          | PRIMARY KEY, AUTO  | 主键ID                 |
| title       | varchar(200) | NOT NULL          | 视频标题               |
| description | text         | NULL              | 视频描述               |
| file_path   | varchar(500) | NOT NULL          | 视频文件路径           |
| file_size   | int          | NOT NULL          | 文件大小(字节)         |
| duration    | float        | NULL              | 视频时长(秒)           |
| format      | varchar(20)  | NOT NULL          | 视频格式               |
| video_metadata| json       | NULL              | 视频元数据JSON         |
| thumbnail_path| varchar(500)| NULL             | 缩略图路径             |
| user_id     | int          | NOT NULL, FOREIGN  | 上传用户ID             |
| upload_ip   | varchar(50)  | NULL              | 上传IP地址             |
| upload_time | datetime     | NOT NULL          | 上传时间               |
| status      | varchar(20)  | NOT NULL, DEFAULT 'processing'| 处理状态    |
| error_message| text        | NULL              | 错误信息               |
| view_count  | int          | NOT NULL, DEFAULT 0| 播放次数              |
| like_count  | int          | NOT NULL, DEFAULT 0| 点赞数                |
| comment_count| int         | NOT NULL, DEFAULT 0| 评论数                |
| created_at  | datetime     | NOT NULL          | 创建时间               |
| updated_at  | datetime     | NOT NULL          | 更新时间               |
| is_deleted  | tinyint(1)   | NOT NULL, DEFAULT 0| 软删除标记             |
| deleted_at  | datetime     | NULL              | 删除时间               |

**状态枚举**：
- `processing`: 处理中
- `ready`: 就绪可播放
- `error`: 处理错误

**索引设计**：
- 主键索引：id
- 外键索引：user_id
- 复合索引：(status, is_deleted), (upload_time, status)

**当前数据量**：30条记录

#### 3.2.5 反馈表 (feedbacks)

| 字段名      | 类型         | 约束               | 说明                    |
|-----------|--------------|-------------------|------------------------|
| id        | int          | PRIMARY KEY, AUTO  | 主键ID                 |
| title     | varchar(200) | NOT NULL          | 反馈标题               |
| content   | text         | NOT NULL          | 反馈内容               |
| user_id   | int          | NOT NULL, FOREIGN  | 反馈用户ID             |
| type      | enum         | NOT NULL          | 反馈类型               |
| status    | enum         | NOT NULL          | 处理状态               |
| priority  | enum         | NOT NULL          | 优先级别               |
| handler_id| int          | NULL, FOREIGN      | 处理人ID               |
| handle_note| text        | NULL              | 处理备注               |
| handle_time| datetime    | NULL              | 处理时间               |
| created_at| datetime     | NOT NULL          | 创建时间               |
| updated_at| datetime     | NOT NULL          | 更新时间               |
| is_deleted| tinyint(1)   | NOT NULL, DEFAULT 0| 软删除标记             |
| deleted_at| datetime     | NULL              | 删除时间               |

**类型枚举(type)**：
- `BUG`: 错误报告
- `FEATURE`: 功能建议
- `COMPLAINT`: 投诉
- `PRAISE`: 表扬
- `OTHER`: 其他

**状态枚举(status)**：
- `PENDING`: 待处理
- `PROCESSING`: 处理中
- `RESOLVED`: 已解决
- `CLOSED`: 已关闭

**优先级枚举(priority)**：
- `LOW`: 低优先级
- `MEDIUM`: 中等优先级
- `HIGH`: 高优先级
- `URGENT`: 紧急

**索引设计**：
- 主键索引：id
- 外键索引：user_id, handler_id
- 复合索引：(status, priority, is_deleted)

**当前数据量**：2条记录

## 4. 数据迁移与历史文件管理

### 4.1 已迁移数据

#### 用户数据迁移
- **源文件**：`database/user/*.txt` (6个文件)
- **目标表**：`users`
- **迁移状态**：✅ 已完成
- **数据量**：8条用户记录
- **处理方式**：保留文件作为备份，已不再使用

#### 问题数据迁移
- **源文件**：`database/question/*.txt` (11个文件)
- **目标表**：`questions`
- **迁移状态**：✅ 已完成，包含筛选功能
- **数据量**：77条问题记录
- **处理方式**：新问题直接存储到数据库，旧文件保留备份

#### 反馈数据迁移
- **源文件**：`database/feedback/*.txt` (2个文件)
- **目标表**：`feedbacks`
- **迁移状态**：✅ 已完成
- **数据量**：2条反馈记录

### 4.2 媒体文件管理

#### 视频文件存储
- **存储位置**：`database/video/`
- **文件格式**：MP4
- **文件数量**：36个视频文件
- **总大小**：约1.2GB
- **命名规则**：`YYYY-MM-DD_HH-MM-SS_[original_name].mp4`
- **管理方式**：通过数据库记录元信息，文件系统存储实际内容

#### 静态资源文件
- **存储位置**：`react/public/`
- **文件类型**：Logo、图标、CSS、JavaScript
- **访问方式**：HTTP直接访问
- **CDN支持**：可扩展

### 4.3 遗留文件处理建议

#### 可以删除的文件
```bash
# 用户注册记录 - 已完全迁移到数据库
database/user/*.txt (除.gitkeep外)

# 问题记录 - 已完全迁移并包含筛选功能
database/question/*.txt (除.gitkeep外)

# 反馈记录 - 已迁移到数据库
database/feedback/*.txt (除.gitkeep外)
```

#### 需要保留的文件
```bash
# 数据库配置
database/db_config.json

# 视频文件 - 实际媒体内容
database/video/*.mp4

# 目录结构标记
database/*/.gitkeep

# 其他未使用的目录
database/AI_product/     # 可能的AI模型相关文件
database/answer/         # 空目录，可删除
database/requestion/     # 空目录，可删除
database/touxiang/       # 头像目录，可能有用
```

## 5. API接口设计

### 5.1 问题管理API

```bash
# 保存问题（支持筛选）
POST /api/questions/save-question
Content-Type: application/json
{
    "question": "这是一个数学问题",
    "filters": {
        "grade": "primary",
        "gradeLabel": "小学",
        "subject": "math",
        "subjectLabel": "数学"
    }
}

# 获取问题列表（支持筛选查询）
GET /api/questions/?status=pending&grade_level=primary&subject=数学&page=1&per_page=20

# 获取问题详情
GET /api/questions/{question_id}

# 删除问题
DELETE /api/questions/{question_id}
```

### 5.2 用户管理API

```bash
# 用户注册
POST /api/auth/register

# 用户登录
POST /api/auth/login

# 获取用户信息
GET /api/auth/user
```

### 5.3 视频管理API

```bash
# 上传视频
POST /api/videos/upload

# 获取视频列表
GET /api/videos/

# 获取视频详情
GET /api/videos/{video_id}
```

## 6. 数据库性能优化

### 6.1 索引优化

- **用户表**：username, email唯一索引，登录查询优化
- **问题表**：筛选字段复合索引，支持多维度查询
- **视频表**：状态和时间复合索引，支持分页查询
- **反馈表**：状态和优先级复合索引，管理界面优化

### 6.2 查询优化

- **分页查询**：所有列表API支持分页，默认20条/页
- **软删除**：避免硬删除，保持数据完整性
- **关联查询**：使用SQLAlchemy ORM的relationship减少N+1查询
- **缓存策略**：可扩展Redis缓存层

### 6.3 数据清理策略

- **软删除回收**：定期清理超过90天的软删除记录
- **日志轮转**：应用日志文件定期归档和压缩
- **媒体文件清理**：清理无数据库记录对应的孤立文件

## 7. 数据备份与恢复

### 7.1 数据库备份

```bash
# 每日全量备份
mysqldump -u root -p123456 ai_platform > backup_$(date +%Y%m%d).sql

# 表结构备份
mysqldump -u root -p123456 --no-data ai_platform > schema_backup.sql
```

### 7.2 文件备份

```bash
# 视频文件备份
rsync -av database/video/ /backup/videos/

# 配置文件备份
cp database/db_config.json /backup/config/
```

### 7.3 恢复策略

- **数据库恢复**：使用mysqldump备份文件
- **文件恢复**：从备份目录恢复
- **增量恢复**：结合binlog进行时间点恢复

## 8. 监控与维护

### 8.1 数据库监控

- **连接数监控**：监控活跃连接和连接池状态
- **查询性能**：slow query log分析
- **存储空间**：数据和索引大小监控
- **复制状态**：主从复制延迟监控（如有）

### 8.2 应用监控

- **API响应时间**：各接口性能监控
- **错误率监控**：异常和错误日志分析
- **文件系统监控**：磁盘空间和IO性能
- **内存使用**：Python应用内存泄漏监控

### 8.3 日志管理

- **应用日志**：`logs/db_admin.log`, `app.log`
- **数据库日志**：MySQL error log, slow query log
- **访问日志**：Web服务器访问日志
- **日志分析**：可集成ELK stack

## 9. 安全考虑

### 9.1 数据库安全

- **用户权限**：最小权限原则，区分读写权限
- **连接加密**：SSL/TLS连接加密
- **密码策略**：强密码要求，定期更换
- **备份加密**：敏感数据备份加密存储

### 9.2 应用安全

- **SQL注入防护**：使用参数化查询
- **XSS防护**：输入验证和输出编码
- **文件上传安全**：文件类型和大小限制
- **API安全**：JWT认证，Rate limiting

## 10. 扩展计划

### 10.1 数据库扩展

- **读写分离**：主从复制，读操作分流
- **分库分表**：用户数据水平分片
- **缓存层**：Redis缓存热点数据
- **全文搜索**：Elasticsearch集成

### 10.2 功能扩展

- **实时通知**：WebSocket消息推送
- **AI增强**：问答推荐系统
- **数据分析**：用户行为分析
- **多租户**：企业级权限管理

---

## 附录

### A. 数据库连接池配置

```python
# app/config/database.py
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:123456@localhost:3306/ai_platform'
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_timeout': 30,
    'max_overflow': 20
}
```

### B. 文件清理脚本

```bash
#!/bin/bash
# cleanup_legacy_files.sh
# 清理已迁移的遗留文件

# 备份现有文件
mkdir -p backup/legacy_files
cp -r database/user backup/legacy_files/
cp -r database/question backup/legacy_files/
cp -r database/feedback backup/legacy_files/

# 删除已迁移的文件（保留.gitkeep）
find database/user -name "*.txt" -not -name ".gitkeep" -delete
find database/question -name "*.txt" -not -name ".gitkeep" -delete
find database/feedback -name "*.txt" -not -name ".gitkeep" -delete

echo "遗留文件清理完成，备份保存在 backup/legacy_files/"
```

### C. 数据统计查询

```sql
-- 平台数据统计
SELECT 
    '用户总数' as metric, COUNT(*) as value FROM users WHERE is_deleted = 0
UNION ALL
SELECT 
    '问题总数' as metric, COUNT(*) as value FROM questions WHERE is_deleted = 0
UNION ALL
SELECT 
    '视频总数' as metric, COUNT(*) as value FROM videos WHERE is_deleted = 0
UNION ALL
SELECT 
    '反馈总数' as metric, COUNT(*) as value FROM feedbacks WHERE is_deleted = 0;

-- 筛选系统使用统计
SELECT 
    grade_level, 
    subject, 
    COUNT(*) as question_count
FROM questions 
WHERE is_deleted = 0 AND grade_level IS NOT NULL
GROUP BY grade_level, subject
ORDER BY question_count DESC;
```

---

**文档版本**：v2.0  
**更新时间**：2025-01-20  
**维护人员**：智映教匠开发团队  
**联系方式**：广州大学网络空间安全学院 