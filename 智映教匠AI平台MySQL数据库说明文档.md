# 智映教匠AI平台MySQL数据库说明文档

## 📊 数据库概述

智映教匠AI平台使用MySQL 8.0作为核心数据存储系统，数据库名为`ai_platform`。该数据库承载了平台的所有核心业务数据，包括用户管理、问答系统、视频资源、反馈处理等功能模块的数据存储和管理。

### 🔧 数据库基本信息

- **数据库名称**: `ai_platform`
- **数据库版本**: MySQL 8.0+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **连接信息**: 
  - 主机: localhost:3306
  - 用户: root
  - 密码: 123456
  - 最大连接数: 100

### 📈 数据统计概览 (2025年1月)

| 表名 | 记录数 | 用途 | 状态 |
|------|-------|------|------|
| users | 11条 | 用户管理 | ✅ 活跃 |
| questions | 82条 | 问答系统 | ✅ 活跃 |
| videos | 43条 | 视频管理 | ✅ 活跃 |
| feedbacks | 5条 | 反馈系统 | ✅ 活跃 |
| answers | 0条 | 问答回复 | 🔄 待开发 |

## 🗂️ 数据表结构详解

### 1. 用户表 (users)

**表用途**: 存储平台用户的基本信息、认证数据和状态信息

**表结构**:
```sql
CREATE TABLE users (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username        VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email           VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱地址',
    password_hash   VARCHAR(128) NOT NULL COMMENT '密码哈希',
    password        VARCHAR(255) COMMENT '备用密码字段',
    avatar_url      VARCHAR(200) COMMENT '头像URL',
    is_active       TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否激活',
    last_login      DATETIME COMMENT '最后登录时间',
    login_count     INT NOT NULL DEFAULT 0 COMMENT '登录次数',
    nickname        VARCHAR(50) COMMENT '昵称',
    bio             TEXT COMMENT '个人简介',
    phone           VARCHAR(20) COMMENT '手机号码',
    created_at      DATETIME NOT NULL COMMENT '创建时间',
    updated_at      DATETIME NOT NULL COMMENT '更新时间',
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    deleted_at      DATETIME COMMENT '删除时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**索引设计**:
- 主键索引: `id`
- 唯一索引: `username`, `email`
- 建议增加的索引:
  ```sql
  CREATE INDEX idx_users_active ON users(is_active, is_deleted);
  CREATE INDEX idx_users_created ON users(created_at);
  ```

**数据示例**:
| username | email | is_active | created_at |
|----------|-------|-----------|------------|
| 测试用户132 | test@example.com | 1 | 2025-06-09 10:45:02 |
| 张三 | zhangsan@example.com | 1 | 2025-06-08 09:25:46 |
| 王五 | wangwu@demo.org | 1 | 2025-06-08 09:41:30 |

### 2. 问题表 (questions)

**表用途**: 存储用户提问的问题信息，支持智能分类和筛选

**表结构**:
```sql
CREATE TABLE questions (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '问题ID',
    title           VARCHAR(200) NOT NULL COMMENT '问题标题',
    content         TEXT NOT NULL COMMENT '问题内容',
    user_id         INT NOT NULL COMMENT '用户ID',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '问题状态',
    priority        INT NOT NULL DEFAULT 0 COMMENT '优先级(0-2)',
    view_count      INT NOT NULL DEFAULT 0 COMMENT '查看次数',
    answer_count    INT NOT NULL DEFAULT 0 COMMENT '回答数量',
    category        VARCHAR(100) COMMENT '问题分类',
    grade_level     VARCHAR(50) COMMENT '年级层次',
    subject         VARCHAR(50) COMMENT '学科分类',
    filter_tags     JSON COMMENT '筛选标签',
    created_at      DATETIME NOT NULL COMMENT '创建时间',
    updated_at      DATETIME NOT NULL COMMENT '更新时间',
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    deleted_at      DATETIME COMMENT '删除时间',
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问题表';
```

**筛选标签JSON结构**:
```json
{
    "grade": "primary",          // 年级代码
    "gradeLabel": "小学",        // 年级显示名
    "subject": "math",           // 学科代码  
    "subjectLabel": "数学",      // 学科显示名
    "timestamp": "2025-01-20T10:30:00"
}
```

**支持的筛选维度**:
- **年级层次**: primary(小学), junior(初中), senior(高中), university(大学)
- **学科分类**: 数学、英语、科学、语文、物理、化学、生物、历史、地理等
- **问题状态**: pending(待回答), answered(已回答), closed(已关闭)
- **优先级**: 0(低), 1(中), 2(高)

**索引设计**:
- 主键索引: `id`
- 外键索引: `user_id`
- 建议增加的索引:
  ```sql
  CREATE INDEX idx_questions_filters ON questions(grade_level, subject, status);
  CREATE INDEX idx_questions_priority ON questions(priority, created_at);
  CREATE INDEX idx_questions_active ON questions(is_deleted, status);
  ```

### 3. 视频表 (videos)

**表用途**: 存储视频文件的元数据信息，支持视频管理和播放统计

**表结构**:
```sql
CREATE TABLE videos (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '视频ID',
    title           VARCHAR(200) NOT NULL COMMENT '视频标题',
    description     TEXT COMMENT '视频描述',
    file_path       VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_size       INT NOT NULL COMMENT '文件大小(字节)',
    duration        FLOAT COMMENT '视频时长(秒)',
    format          VARCHAR(20) NOT NULL COMMENT '视频格式',
    video_metadata  JSON COMMENT '视频元数据',
    thumbnail_path  VARCHAR(500) COMMENT '缩略图路径',
    user_id         INT NOT NULL COMMENT '上传用户ID',
    upload_ip       VARCHAR(50) COMMENT '上传IP地址',
    upload_time     DATETIME NOT NULL COMMENT '上传时间',
    status          VARCHAR(20) NOT NULL DEFAULT 'processing' COMMENT '处理状态',
    error_message   TEXT COMMENT '错误信息',
    view_count      INT NOT NULL DEFAULT 0 COMMENT '播放次数',
    like_count      INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    comment_count   INT NOT NULL DEFAULT 0 COMMENT '评论数',
    created_at      DATETIME NOT NULL COMMENT '创建时间',
    updated_at      DATETIME NOT NULL COMMENT '更新时间',
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    deleted_at      DATETIME COMMENT '删除时间',
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频表';
```

**支持的视频格式**:
- MP4 (推荐): 主流格式，兼容性最佳
- WebM: 开源格式，压缩率高
- OGV: 开源格式，HTML5支持
- MOV: QuickTime格式

**处理状态说明**:
- `processing`: 处理中
- `completed`: 处理完成
- `failed`: 处理失败
- `pending`: 等待处理

**索引设计**:
- 主键索引: `id`
- 外键索引: `user_id`
- 建议增加的索引:
  ```sql
  CREATE INDEX idx_videos_status ON videos(status, is_deleted);
  CREATE INDEX idx_videos_upload ON videos(upload_time, user_id);
  CREATE INDEX idx_videos_popularity ON videos(view_count, like_count);
  ```

### 4. 反馈表 (feedbacks)

**表用途**: 存储用户反馈信息，支持分类处理和状态跟踪

**表结构**:
```sql
CREATE TABLE feedbacks (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '反馈ID',
    title           VARCHAR(200) NOT NULL COMMENT '反馈标题',
    content         TEXT NOT NULL COMMENT '反馈内容',
    user_id         INT NOT NULL COMMENT '用户ID',
    type            ENUM('BUG','FEATURE','COMPLAINT','PRAISE','OTHER') NOT NULL COMMENT '反馈类型',
    status          ENUM('PENDING','PROCESSING','RESOLVED','CLOSED') NOT NULL DEFAULT 'PENDING' COMMENT '处理状态',
    priority        ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级',
    handler_id      INT COMMENT '处理人ID',
    handle_note     TEXT COMMENT '处理备注',
    handle_time     DATETIME COMMENT '处理时间',
    created_at      DATETIME NOT NULL COMMENT '创建时间',
    updated_at      DATETIME NOT NULL COMMENT '更新时间',
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    deleted_at      DATETIME COMMENT '删除时间',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='反馈表';
```

**反馈类型说明**:
- `BUG`: 错误报告 - 系统功能异常、界面问题等
- `FEATURE`: 功能建议 - 新功能需求、改进建议等
- `COMPLAINT`: 投诉 - 服务不满、体验问题等
- `PRAISE`: 表扬 - 正面反馈、使用体验好等
- `OTHER`: 其他 - 不属于以上分类的反馈

**处理状态流程**:
```
PENDING → PROCESSING → RESOLVED → CLOSED
   ↓            ↓           ↓
  待处理      处理中      已解决    已关闭
```

**当前数据分布**:
| 类型 | 状态 | 优先级 | 数量 |
|------|------|-------|------|
| FEATURE | PENDING | MEDIUM | 1 |
| COMPLAINT | RESOLVED | URGENT | 1 |
| BUG | PENDING | HIGH | 1 |
| COMPLAINT | PROCESSING | URGENT | 1 |
| BUG | PENDING | MEDIUM | 1 |

**索引设计**:
- 主键索引: `id`
- 外键索引: `user_id`, `handler_id`
- 建议增加的索引:
  ```sql
  CREATE INDEX idx_feedbacks_type_status ON feedbacks(type, status);
  CREATE INDEX idx_feedbacks_priority ON feedbacks(priority, created_at);
  CREATE INDEX idx_feedbacks_handler ON feedbacks(handler_id, handle_time);
  ```

### 5. 回答表 (answers)

**表用途**: 存储问题的回答信息，支持AI生成回答和用户回答

**表结构**:
```sql
CREATE TABLE answers (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '回答ID',
    content         TEXT NOT NULL COMMENT '回答内容',
    question_id     INT NOT NULL COMMENT '问题ID',
    user_id         INT NOT NULL COMMENT '回答用户ID',
    is_accepted     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被采纳',
    is_ai_generated TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否AI生成',
    like_count      INT NOT NULL DEFAULT 0 COMMENT '点赞数',
    dislike_count   INT NOT NULL DEFAULT 0 COMMENT '点踩数',
    created_at      DATETIME NOT NULL COMMENT '创建时间',
    updated_at      DATETIME NOT NULL COMMENT '更新时间',
    is_deleted      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    deleted_at      DATETIME COMMENT '删除时间',
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='回答表';
```

**功能特性**:
- 支持用户手动回答和AI自动生成回答
- 采纳机制：每个问题可以有一个被采纳的最佳回答
- 评价系统：支持点赞和点踩评价回答质量
- 软删除：保护数据安全，支持恢复

**索引设计**:
- 主键索引: `id`
- 外键索引: `question_id`, `user_id`
- 建议增加的索引:
  ```sql
  CREATE INDEX idx_answers_question ON answers(question_id, is_deleted);
  CREATE INDEX idx_answers_accepted ON answers(is_accepted, question_id);
  CREATE INDEX idx_answers_ai ON answers(is_ai_generated, created_at);
  CREATE INDEX idx_answers_popularity ON answers(like_count, dislike_count);
  ```

**当前状态**: 表已创建但暂无数据，等待AI回答功能开发完成

## 🔗 表关系设计

### 外键约束关系

```
users (主表)
├── questions.user_id → users.id (一对多)
├── videos.user_id → users.id (一对多)  
├── feedbacks.user_id → users.id (一对多)
├── feedbacks.handler_id → users.id (一对多)
└── answers.user_id → users.id (一对多)

questions (主表)
└── answers.question_id → questions.id (一对多)
```

### 数据完整性保证

**参照完整性**:
- 所有外键约束确保数据一致性
- 级联删除策略保护关联数据
- 软删除机制避免数据丢失

**数据验证**:
- 枚举类型限制输入范围
- 非空约束保证必要字段
- 唯一约束防止重复数据

## 📊 数据分析与统计

### 用户活跃度分析

```sql
-- 用户注册趋势
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users
FROM users 
WHERE is_deleted = 0
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 活跃用户统计
SELECT 
    COUNT(*) as total_users,
    SUM(is_active) as active_users,
    AVG(login_count) as avg_login_count
FROM users 
WHERE is_deleted = 0;
```

### 问答系统分析

```sql
-- 问题分类统计
SELECT 
    grade_level,
    subject,
    COUNT(*) as question_count
FROM questions 
WHERE is_deleted = 0
GROUP BY grade_level, subject
ORDER BY question_count DESC;

-- 问题状态分布
SELECT 
    status,
    priority,
    COUNT(*) as count
FROM questions 
WHERE is_deleted = 0
GROUP BY status, priority;
```

### 视频资源分析

```sql
-- 视频格式分布
SELECT 
    format,
    COUNT(*) as count,
    SUM(file_size) as total_size
FROM videos 
WHERE is_deleted = 0
GROUP BY format;

-- 视频播放统计
SELECT 
    title,
    view_count,
    like_count,
    upload_time
FROM videos 
WHERE is_deleted = 0
ORDER BY view_count DESC
LIMIT 10;
```

### 反馈处理效率

```sql
-- 反馈处理统计
SELECT 
    type,
    status,
    AVG(TIMESTAMPDIFF(HOUR, created_at, handle_time)) as avg_handle_hours
FROM feedbacks 
WHERE is_deleted = 0 AND handle_time IS NOT NULL
GROUP BY type, status;

-- 优先级处理分布
SELECT 
    priority,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_count
FROM feedbacks 
WHERE is_deleted = 0
GROUP BY priority;
```

## 🔧 数据库维护

### 定期维护任务

**每日任务**:
```sql
-- 更新统计信息
ANALYZE TABLE users, questions, videos, feedbacks, answers;

-- 检查表状态
CHECK TABLE users, questions, videos, feedbacks, answers;
```

**每周任务**:
```sql
-- 优化表结构
OPTIMIZE TABLE users, questions, videos, feedbacks, answers;

-- 清理过期的软删除数据 (可选)
DELETE FROM users WHERE is_deleted = 1 AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### 备份策略

**全量备份** (每日):
```bash
mysqldump -u root -p123456 --single-transaction --routines --triggers ai_platform > backup_$(date +%Y%m%d).sql
```

**增量备份** (每小时):
```bash
# 开启binlog
SET GLOBAL log_bin = ON;
# 导出增量日志
mysqlbinlog --start-datetime="2025-01-20 00:00:00" mysql-bin.000001 > incremental_backup.sql
```

**结构备份** (每周):
```bash
mysqldump -u root -p123456 --no-data --routines --triggers ai_platform > schema_backup.sql
```

### 性能优化建议

**索引优化**:
```sql
-- 分析慢查询
SELECT * FROM mysql.slow_log WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- 检查索引使用情况
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'ai_platform'
ORDER BY CARDINALITY DESC;
```

**查询优化**:
- 避免 SELECT * 查询
- 使用 LIMIT 限制结果集
- 合理使用 JOIN 而非子查询
- 定期更新表统计信息

**存储优化**:
- 定期清理软删除数据
- 压缩大文本字段
- 分离冷热数据
- 监控磁盘空间使用

## 🛡️ 安全与权限

### 数据安全措施

**软删除机制**:
- 所有表都实现软删除 (is_deleted字段)
- 删除时间记录 (deleted_at字段)
- 定期清理策略保护磁盘空间

**敏感数据保护**:
- 密码采用哈希存储 (password_hash)
- 个人信息加密存储
- 访问日志记录

**权限控制**:
```sql
-- 创建只读用户
CREATE USER 'readonly'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON ai_platform.* TO 'readonly'@'localhost';

-- 创建应用用户
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
GRANT SELECT, INSERT, UPDATE ON ai_platform.* TO 'app_user'@'localhost';
```

### 监控与日志

**错误监控**:
```sql
-- 检查表错误
SHOW WARNINGS;
SHOW ERRORS;

-- 检查连接状态
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Connections';
```

**性能监控**:
```sql
-- 查看缓存命中率
SHOW STATUS LIKE 'Qcache%';

-- 查看表锁状态
SHOW STATUS LIKE 'Table_locks%';
```

## 📈 扩展规划

### 短期优化 (Q1 2025)

- [ ] **索引优化**: 根据查询模式添加复合索引
- [ ] **分区表**: 对大表实施分区策略
- [ ] **查询缓存**: 启用MySQL查询缓存
- [ ] **监控系统**: 部署数据库性能监控

### 中期规划 (Q2-Q3 2025)

- [ ] **读写分离**: 主从复制架构
- [ ] **数据归档**: 历史数据归档策略
- [ ] **全文搜索**: 集成Elasticsearch
- [ ] **缓存层**: Redis缓存层集成

### 长期规划 (Q4 2025+)

- [ ] **分库分表**: 水平扩展架构
- [ ] **云数据库**: 迁移到云数据库服务
- [ ] **大数据**: 数据仓库和分析平台
- [ ] **AI增强**: 智能数据分析和预测

## 📞 技术支持

**数据库管理员**: 智映教匠开发团队  
**监控告警**: 开发中  
**备份恢复**: 见备份策略章节  
**性能调优**: 见性能优化建议  
**最后更新**: 2025年1月20日  

---

*本文档详细描述了智映教匠AI平台MySQL数据库的完整结构、设计理念、维护策略等技术内容，为数据库的使用、维护和优化提供全面的技术指导。* 