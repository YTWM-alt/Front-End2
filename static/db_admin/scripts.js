/**
 * AI平台 - 数据库管理系统JavaScript脚本
 */

// 全局变量
let currentTable = '';
let currentPage = 0;
let pageSize = 100;
let isConnected = false;
let tableStats = {};

// 图表实例全局变量
let distributionChart = null;
let growthChart = null;

// DOM元素
const connectionPanel = document.getElementById('connection-panel');
const connectionForm = document.getElementById('connection-form');
const connectionSettings = document.getElementById('connection-settings');
const connectionStatusText = document.getElementById('connection-status-text');
const refreshConnection = document.getElementById('refresh-connection');
const dashboardLink = document.getElementById('dashboard-link');
const dashboardPanel = document.getElementById('dashboard-panel');
const dashboardStatus = document.getElementById('dashboard-status'); // 仪表盘状态指示器
const dashboardStatusMessage = document.getElementById('dashboard-status-message'); // 仪表盘状态消息
const dashboardLoadingSpinner = document.getElementById('dashboard-loading-spinner'); // 仪表盘加载动画
const userCountElem = document.getElementById('user-count');
const videoCountElem = document.getElementById('video-count');
const questionCountElem = document.getElementById('question-count');
const answersCountElem = document.getElementById('answers-count'); // 回答数量
const feedbackCountElem = document.getElementById('feedback-count');
const refreshDashboard = document.getElementById('refresh-dashboard');
const tablesList = document.getElementById('tables-list');
const refreshTables = document.getElementById('refresh-tables');
const tablePanel = document.getElementById('table-panel');
const currentTableName = document.getElementById('current-table-name');
const dataTable = document.getElementById('data-table');
const tableHeader = document.getElementById('table-header');
const tableBody = document.getElementById('table-body');
const rowCount = document.getElementById('row-count');
const prevPage = document.getElementById('prev-page');
const nextPage = document.getElementById('next-page');
const refreshTableData = document.getElementById('refresh-table-data');
const showTableStructure = document.getElementById('show-table-structure');
const structurePanel = document.getElementById('structure-panel');
const structureTableName = document.getElementById('structure-table-name');
const structureBody = document.getElementById('structure-body');
const closeStructure = document.getElementById('close-structure');
const customQueryLink = document.getElementById('custom-query');
const customQueryPanel = document.getElementById('custom-query-panel');
const queryForm = document.getElementById('query-form');
const sqlQuery = document.getElementById('sql-query');
const queryResultsPanel = document.getElementById('query-results-panel');
const queryResultsContainer = document.getElementById('query-results-container');
const queryRowCount = document.getElementById('query-row-count');
const queryResultStatus = document.getElementById('query-result-status');
const closeQueryResults = document.getElementById('close-query-results');
const exportQueryResult = document.getElementById('export-query-result');
const exportData = document.getElementById('export-data');
const importData = document.getElementById('import-data');
const loadingSpinner = document.getElementById('loading-spinner');
const alertContainer = document.getElementById('alert-container');

// 字段名中英文映射
const fieldTranslations = {
    // 基础字段
    'id': '编号',
    'user_id': '用户编号',
    'video_id': '视频编号',
    'question_id': '问题编号',
    'answer_id': '回答编号',
    'feedback_id': '反馈编号',
    'name': '名称',
    'title': '标题',
    'description': '描述',
    'content': '内容',
    'text': '文本',
    'username': '用户名',
    'password': '密码',
    'email': '邮箱',
    'phone': '电话',
    'address': '地址',
    'status': '状态',
    'type': '类型',
    'created_at': '创建时间',
    'updated_at': '更新时间',
    'deleted_at': '删除时间',
    'is_deleted': '是否删除',
    'is_active': '是否激活',
    'role': '角色',
    'avatar': '头像',
    'url': '链接',
    'count': '数量',
    'price': '价格',
    'amount': '金额',
    'quantity': '数量',
    'total': '总计',
    'comment': '评论',
    'note': '备注',
    
    // 问题模块特定字段
    'answer': '回答',
    'priority': '优先级',
    'view': '查看数',
    'likes': '点赞数',
    'dislikes': '不喜欢数',
    'answer_time': '回答时间',
    'question_time': '提问时间',
    'create_time': '创建时间',
    'update_time': '更新时间',
    'delete_time': '删除时间',
    'status_text': '状态文本',
    'is_removed': '是否删除',
    'is_featured': '是否精选',
    'is_answered': '是否已回答',
    'is_deleted': '是否删除',
    'user_number': '用户编号',
    'tags': '标签',
    'category': '分类',
    'origin': '来源',
    'target': '目标',
    'source': '来源',
    'destination': '目的地',
    'file': '文件',
    'image': '图片',
    'video': '视频',
    'audio': '音频',
    'document': '文档',
    'size': '大小',
    'duration': '时长',
    'width': '宽度',
    'height': '高度',
    'format': '格式',
    'extension': '扩展名',
    'date': '日期',
    'time': '时间',
    'datetime': '日期时间',
    'year': '年份',
    'month': '月份',
    'day': '日',
    'hour': '小时',
    'minute': '分钟',
    'second': '秒',
    'author': '作者',
    'publisher': '发布者',
    'editor': '编辑',
    'creator': '创建者',
    'owner': '所有者',
    'admin': '管理员',
    'moderator': '版主',
    'group': '组',
    'department': '部门',
    'team': '团队',
    'organization': '组织',
    'company': '公司',
    'location': '位置',
    'position': '职位',
    'gender': '性别',
    'age': '年龄',
    'birthday': '生日',
    'nationality': '国籍',
    'language': '语言',
    'education': '教育',
    'experience': '经验',
    'skills': '技能',
    'interests': '兴趣',
    'hobbies': '爱好',
    'color': '颜色',
    'style': '样式',
    'theme': '主题',
    'version': '版本',
    'level': '级别',
    'score': '分数',
    'rank': '排名',
    'rating': '评分',
    'votes': '投票',
    'views': '查看数',
    'downloads': '下载数',
    'uploads': '上传数',
    'shares': '分享数',
    'comments': '评论数',
    'reports': '举报数',
    'stars': '星级',
    'favorites': '收藏数',
    'followers': '关注者',
    'following': '关注的',
    'friends': '朋友',
    'contacts': '联系人',
    'ip': 'IP地址',
    'browser': '浏览器',
    'device': '设备',
    'platform': '平台',
    'os': '操作系统',
    'client': '客户端',
    'server': '服务器',
    'host': '主机',
    'domain': '域名',
    'port': '端口',
    'protocol': '协议',
    'api': 'API',
    'endpoint': '端点',
    'route': '路由',
    'path': '路径',
    'query': '查询',
    'param': '参数',
    'value': '值',
    'default': '默认值',
    'min': '最小值',
    'max': '最大值',
    'start': '开始',
    'end': '结束',
    'first': '第一个',
    'last': '最后一个',
    'next': '下一个',
    'prev': '上一个',
    'parent': '父级',
    'child': '子级',
    'root': '根',
    'leaf': '叶子',
    'node': '节点',
    'code': '代码',
    'data': '数据',
    'info': '信息',
    'message': '消息',
    'subject': '主题',
    'body': '正文',
    'header': '头部',
    'footer': '底部',
    'sidebar': '侧边栏',
    'menu': '菜单',
    'button': '按钮',
    'link': '链接',
    'icon': '图标',
    'logo': '标志',
    'banner': '横幅',
    'slogan': '口号',
    'layout': '布局',
    'config': '配置',
    'setting': '设置',
    'option': '选项',
    'mode': '模式',
    'state': '状态',
    'action': '操作',
    'method': '方法',
    'function': '函数',
    'class': '类',
    'module': '模块',
    'package': '包',
    'library': '库',
    'framework': '框架',
    'template': '模板',
    'schema': '架构',
    'model': '模型',
    'pattern': '模式',
    'proxy': '代理',
    'cache': '缓存',
    'buffer': '缓冲区',
    'queue': '队列',
    'stack': '栈',
    'heap': '堆',
    'tree': '树',
    'graph': '图',
    'list': '列表',
    'array': '数组',
    'object': '对象',
    'map': '映射',
    'set': '集合',
    'hash': '哈希',
    'token': '令牌',
    'key': '键',
    'secret': '密钥',
    'salt': '盐值',
    'hash': '哈希值',
    'encryption': '加密',
    'decryption': '解密',
    'signature': '签名',
    'certificate': '证书',
    'license': '许可证',
    'copyright': '版权',
    'trademark': '商标',
    'patent': '专利',
    'term': '术语',
    'glossary': '词汇表',
    'definition': '定义',
    'reference': '参考',
    'citation': '引用',
    'source': '来源',
    'target': '目标',
    'input': '输入',
    'output': '输出',
    'error': '错误',
    'warning': '警告',
    'info': '信息',
    'debug': '调试',
    'trace': '跟踪',
    'log': '日志',
    'monitor': '监控',
    'alert': '警报',
    'notification': '通知',
    'event': '事件',
    'trigger': '触发器',
    'hook': '钩子',
    'callback': '回调',
    'promise': '承诺',
    'async': '异步',
    'sync': '同步',
    'parallel': '并行',
    'serial': '串行',
    'concurrent': '并发',
    'sequential': '顺序',
    'interval': '间隔',
    'timeout': '超时',
    'delay': '延迟',
    'retry': '重试',
    'attempt': '尝试',
    'success': '成功',
    'failure': '失败',
    'complete': '完成',
    'pending': '待处理',
    'progress': '进度',
    'task': '任务',
    'job': '工作',
    'schedule': '计划',
    'calendar': '日历',
    'reminder': '提醒',
    'notification': '通知',
    'alert': '警报',
    'tip': '提示',
    'hint': '提示',
    'help': '帮助',
    'support': '支持',
    'service': '服务',
    'product': '产品',
    'feature': '功能',
    'benefit': '益处',
    'advantage': '优势',
    'profit': '利润',
    'loss': '损失',
    'cost': '成本',
    'price': '价格',
    'fee': '费用',
    'charge': '收费',
    'payment': '支付',
    'transaction': '交易',
    'order': '订单',
    'invoice': '发票',
    'receipt': '收据',
    'currency': '货币',
    'tax': '税',
    'discount': '折扣',
    'coupon': '优惠券',
    'promotion': '促销',
    'campaign': '活动',
    'advertisement': '广告',
    'marketing': '营销',
    'brand': '品牌',
    'media': '媒体',
    'press': '新闻',
    'news': '新闻',
    'article': '文章',
    'blog': '博客',
    'post': '帖子',
    'forum': '论坛',
    'topic': '话题',
    'thread': '主题',
    'reply': '回复',
    'answer_count': '回答数',
    'requestion': '重新提问',
    'is_best': '是否最佳',
    'is_resolve': '是否解决',
    
    // 特殊字段 - 在截图中看到的
    'answer_数量': '回答数量',
    'view_数量': '查看数量',
    'deleted_删除': '已删除',
    'priority': '优先级',
    'comment_count': '评论数量',
    'view_count': '查看数量',
    'like_count': '点赞数量',
    'file_path': '文件路径',
    'file_size': '文件大小',
    'thumbnail_path': '缩略图路径'
};

/**
 * 显示加载动画
 * @param {string} type - 加载类型 ('table' 或 'structure')
 */
function showLoading(type = 'general') {
    if (type === 'table') {
        document.getElementById('table-loading').style.display = 'flex';
    } else if (type === 'structure') {
        document.getElementById('structure-loading').style.display = 'flex';
    } else {
        document.querySelector('.loading-spinner').style.display = 'block';
    }
}

/**
 * 隐藏加载动画
 * @param {string} type - 加载类型 ('table' 或 'structure')
 */
function hideLoading(type = 'general') {
    if (type === 'table') {
        document.getElementById('table-loading').style.display = 'none';
    } else if (type === 'structure') {
        document.getElementById('structure-loading').style.display = 'none';
    } else {
        document.querySelector('.loading-spinner').style.display = 'none';
    }
}

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    // 使用SweetAlert2提供更美观的通知
    Swal.fire({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

/**
 * 发送API请求
 * @param {string} url - API URL
 * @param {string} method - 请求方法 (GET, POST)
 * @param {object} data - 请求数据
 * @returns {Promise} - 响应Promise
 */
async function apiRequest(url, method = 'GET', data = null) {
    showLoading();
    try {
        console.log(`发送请求: ${method} ${url}`, data);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa('admin:admin123')
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        let result;
        
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error('JSON解析错误:', jsonError);
            throw new Error(`无法解析响应: ${jsonError.message}`);
        }

        console.log(`收到响应: ${url}`, result);
        
        if (!response.ok) {
            throw new Error(result.message || '请求失败');
        }

        // 检查结果中是否有错误信息
        if (result.error) {
            throw new Error(result.error);
        }

        return result;
    } catch (error) {
        console.error('API请求错误:', error);
        showAlert(`请求失败: ${error.message}`, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

/**
 * 连接数据库
 * @param {object} config - 数据库连接配置
 */
async function connectDatabase(config) {
    try {
        showLoading();
        const result = await apiRequest('/db_admin/api/connect', 'POST', config);
        
        if (result.success) {
            isConnected = true;
            connectionStatusText.textContent = '已连接';
            showAlert(result.message, 'success');
            loadTables();
            loadDashboard();
        } else {
            isConnected = false;
            connectionStatusText.textContent = '未连接';
            showAlert(result.message, 'error');
        }
    } catch (error) {
        isConnected = false;
        connectionStatusText.textContent = '连接失败';
    } finally {
        hideLoading();
    }
}

/**
 * 断开数据库连接
 */
async function disconnectDatabase() {
    try {
        showLoading();
        const result = await apiRequest('/db_admin/api/disconnect', 'POST');
        
        if (result.success) {
            isConnected = false;
            connectionStatusText.textContent = '未连接';
            showAlert(result.message, 'success');
            
            // 清空表列表
            tablesList.innerHTML = '<li class="nav-item"><a class="nav-link disabled" href="#"><i class="bi bi-table"></i> 未连接数据库</a></li>';
            
            // 隐藏面板
            tablePanel.style.display = 'none';
            structurePanel.style.display = 'none';
            customQueryPanel.style.display = 'none';
            queryResultsPanel.style.display = 'none';
            
            // 显示连接面板
            connectionPanel.style.display = 'block';
        } else {
            showAlert(result.message, 'error');
        }
    } catch (error) {
        console.error('断开连接错误:', error);
    } finally {
        hideLoading();
    }
}

/**
 * 加载数据库配置
 */
async function loadConfig() {
    try {
        const config = await apiRequest('/db_admin/api/config');
        
        document.getElementById('host').value = config.host || 'localhost';
        document.getElementById('port').value = config.port || 3306;
        document.getElementById('username').value = config.user || 'root';
        document.getElementById('password').value = config.password || '123456';
        document.getElementById('database').value = config.database || 'ai_platform';
    } catch (error) {
        console.error('加载配置错误:', error);
    }
}

/**
 * 加载数据库表列表
 */
async function loadTables() {
    if (!isConnected) {
        return;
    }
    
    try {
        showLoading();
        const result = await apiRequest('/db_admin/api/tables');
        
        if (result.tables && result.tables.length > 0) {
            // 清空表列表
            tablesList.innerHTML = '';
            
            // 添加表项
            result.tables.forEach(table => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = `
                    <a class="nav-link" href="#" data-table="${table}">
                        <i class="bi bi-table"></i> ${table}
                    </a>
                `;
                tablesList.appendChild(li);
            });
            
            // 添加表点击事件
            document.querySelectorAll('#tables-list .nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectTable(link.dataset.table);
                });
            });
        } else {
            tablesList.innerHTML = '<li class="nav-item"><a class="nav-link disabled" href="#"><i class="bi bi-exclamation-triangle"></i> 无可用表</a></li>';
        }
    } catch (error) {
        tablesList.innerHTML = '<li class="nav-item"><a class="nav-link disabled" href="#"><i class="bi bi-exclamation-triangle"></i> 加载失败</a></li>';
        console.error('加载表列表错误:', error);
    } finally {
        hideLoading();
    }
}

/**
 * 加载仪表盘数据
 */
async function loadDashboard() {
    if (!isConnected) {
        return;
    }
    
    try {
        console.log('开始加载仪表盘数据...');
        showLoading();
        
        // 显示仪表盘状态
        dashboardStatus.className = 'alert alert-info mb-4';
        dashboardStatusMessage.textContent = '正在加载仪表盘数据，请稍候...';
        dashboardLoadingSpinner.style.display = 'inline-block';
        dashboardStatus.style.display = 'block';
        
        // 先销毁现有图表，避免Canvas重用错误
        if (distributionChart) {
            try {
                distributionChart.destroy();
                distributionChart = null;
            } catch (e) {
                console.warn('销毁分布图表失败:', e);
            }
        }
        
        if (growthChart) {
            try {
                growthChart.destroy();
                growthChart = null;
            } catch (e) {
                console.warn('销毁增长图表失败:', e);
            }
        }
        
        // 使用串行请求而非并行请求，避免连接池耗尽
        let successCount = 0;
        let failedCount = 0;
        
        // 1. 加载用户数量
        try {
            const usersResult = await apiRequest('/db_admin/api/query', 'POST', { 
                query: 'SELECT COUNT(*) as count FROM users' 
            });
            if (usersResult.success) {
                const count = usersResult.result[0].count;
                userCountElem.textContent = count;
                tableStats.users = count;
                successCount++;
            } else {
                console.error('获取用户数失败:', usersResult.error || '未知错误');
                userCountElem.textContent = 'N/A';
                tableStats.users = 0;
                failedCount++;
            }
        } catch (error) {
            console.error('获取用户数失败:', error);
            userCountElem.textContent = 'N/A';
            tableStats.users = 0;
            failedCount++;
        }
        
        // 2. 加载视频数量
        try {
            const videosResult = await apiRequest('/db_admin/api/query', 'POST', { 
                query: 'SELECT COUNT(*) as count FROM videos' 
            });
            if (videosResult.success) {
                const count = videosResult.result[0].count;
                videoCountElem.textContent = count;
                tableStats.videos = count;
                successCount++;
            } else {
                console.error('获取视频数失败:', videosResult.error || '未知错误');
                videoCountElem.textContent = 'N/A';
                tableStats.videos = 0;
                failedCount++;
            }
        } catch (error) {
            console.error('获取视频数失败:', error);
            videoCountElem.textContent = 'N/A';
            tableStats.videos = 0;
            failedCount++;
        }
        
        // 3. 加载问题数量
        try {
            const questionsResult = await apiRequest('/db_admin/api/query', 'POST', { 
                query: 'SELECT COUNT(*) as count FROM questions' 
            });
            if (questionsResult.success) {
                const count = questionsResult.result[0].count;
                questionCountElem.textContent = count;
                tableStats.questions = count;
                successCount++;
            } else {
                console.error('获取问题数失败:', questionsResult.error || '未知错误');
                questionCountElem.textContent = 'N/A';
                tableStats.questions = 0;
                failedCount++;
            }
        } catch (error) {
            console.error('获取问题数失败:', error);
            questionCountElem.textContent = 'N/A';
            tableStats.questions = 0;
            failedCount++;
        }
        
        // 4. 加载回答数量
        try {
            const answersResult = await apiRequest('/db_admin/api/query', 'POST', { 
                query: 'SELECT COUNT(*) as count FROM answers' 
            });
            if (answersResult.success) {
                const count = answersResult.result[0].count;
                answersCountElem.textContent = count;
                tableStats.answers = count;
                successCount++;
            } else {
                console.error('获取回答数失败:', answersResult.error || '未知错误');
                answersCountElem.textContent = 'N/A';
                tableStats.answers = 0;
                failedCount++;
            }
        } catch (error) {
            console.error('获取回答数失败:', error);
            answersCountElem.textContent = 'N/A';
            tableStats.answers = 0;
            failedCount++;
        }
        
        // 5. 加载反馈数量
        try {
            const feedbacksResult = await apiRequest('/db_admin/api/query', 'POST', { 
                query: 'SELECT COUNT(*) as count FROM feedbacks' 
            });
            if (feedbacksResult.success) {
                const count = feedbacksResult.result[0].count;
                feedbackCountElem.textContent = count;
                tableStats.feedbacks = count;
                successCount++;
            } else {
                console.error('获取反馈数失败:', feedbacksResult.error || '未知错误');
                feedbackCountElem.textContent = 'N/A';
                tableStats.feedbacks = 0;
                failedCount++;
            }
        } catch (error) {
            console.error('获取反馈数失败:', error);
            feedbackCountElem.textContent = 'N/A';
            tableStats.feedbacks = 0;
            failedCount++;
        }
        
        // 更新图表
        setTimeout(() => {
            try {
                updateDistributionChart();
                updateGrowthChart();
                console.log('所有图表更新完成');
            } catch (error) {
                console.error('更新图表失败:', error);
            }
        }, 100);
        
        console.log('仪表盘加载完成');
        
        // 更新仪表盘状态
        if (failedCount === 0) {
            dashboardStatus.className = 'alert alert-success mb-4';
            dashboardStatusMessage.textContent = '仪表盘数据加载成功！';
            // 3秒后隐藏状态
            setTimeout(() => {
                dashboardStatus.style.display = 'none';
            }, 3000);
        } else if (successCount > 0) {
            dashboardStatus.className = 'alert alert-warning mb-4';
            dashboardStatusMessage.textContent = `仪表盘部分数据加载失败，${successCount}个成功，${failedCount}个失败。`;
        } else {
            dashboardStatus.className = 'alert alert-danger mb-4';
            dashboardStatusMessage.textContent = '仪表盘数据加载失败，请检查数据库连接。';
        }
    } catch (error) {
        console.error('加载仪表盘错误:', error);
        showAlert('加载仪表盘数据失败: ' + error.message, 'error');
        
        // 显示错误状态
        dashboardStatus.className = 'alert alert-danger mb-4';
        dashboardStatusMessage.textContent = `仪表盘加载出错: ${error.message}`;
    } finally {
        // 隐藏加载动画
        dashboardLoadingSpinner.style.display = 'none';
        hideLoading();
    }
}

/**
 * 更新数据分布饼图
 */
function updateDistributionChart() {
    try {
        const canvas = document.getElementById('distributionChart');
        const ctx = canvas.getContext('2d');
        
        // 确保销毁旧图表
        if (distributionChart) {
            distributionChart.destroy();
            distributionChart = null;
        }
        
        // 清空Canvas
        canvas.width = canvas.width;
        
        // 创建新的图表
        distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['用户', '视频', '问题', '回答', '反馈'],
                datasets: [{
                    data: [
                        tableStats.users || 0,
                        tableStats.videos || 0,
                        tableStats.questions || 0,
                        tableStats.answers || 0,
                        tableStats.feedbacks || 0
                    ],
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc',
                        '#f6c23e',
                        '#e74a3b'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: '数据分布'
                    }
                },
                cutout: '60%'
            }
        });
        console.log('分布图表已更新');
    } catch (error) {
        console.error('更新分布图表失败:', error);
    }
}

/**
 * 更新数据增长趋势图
 */
function updateGrowthChart() {
    try {
        const canvas = document.getElementById('growthChart');
        const ctx = canvas.getContext('2d');
        
        // 确保销毁旧图表
        if (growthChart) {
            growthChart.destroy();
            growthChart = null;
        }
        
        // 清空Canvas
        canvas.width = canvas.width;
        
        // 模拟数据（实际项目中应从API获取）
        const labels = ['一月', '二月', '三月', '四月', '五月', '六月'];
        
        // 创建新的图表
        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '用户',
                        data: [0, 1, 3, 5, 6, 8],
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '视频',
                        data: [0, 4, 6, 8, 12, 17],
                        borderColor: '#1cc88a',
                        backgroundColor: 'rgba(28, 200, 138, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '问题',
                        data: [0, 1, 2, 3, 4, 6],
                        borderColor: '#36b9cc',
                        backgroundColor: 'rgba(54, 185, 204, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: '数据增长趋势'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
        console.log('增长趋势图表已更新');
    } catch (error) {
        console.error('更新增长趋势图表失败:', error);
    }
}

/**
 * 选择表
 * @param {string} tableName - 表名
 */
async function selectTable(tableName) {
    currentTable = tableName;
    currentPage = 0;
    
    // 更新UI
    currentTableName.textContent = tableName;
    structureTableName.textContent = tableName;
    
    // 高亮当前选中的表
    document.querySelectorAll('#tables-list .nav-link').forEach(link => {
        if (link.dataset.table === tableName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // 显示表面板，隐藏其他面板
    tablePanel.style.display = 'block';
    structurePanel.style.display = 'none';
    customQueryPanel.style.display = 'none';
    queryResultsPanel.style.display = 'none';
    dashboardPanel.style.display = 'none';
    connectionPanel.style.display = 'none';
    
    // 加载表数据
    await loadTableData();
}

/**
 * 加载表数据
 */
async function loadTableData() {
    if (!currentTable) {
        return;
    }
    
    try {
        console.log(`加载表数据: ${currentTable}, 页码: ${currentPage}, 每页: ${pageSize}`);
        showLoading('table');
        
        const result = await apiRequest(`/db_admin/api/table/${currentTable}/data?limit=${pageSize}&offset=${currentPage * pageSize}`);
        
        if (!result.success) {
            throw new Error(result.error || '加载表数据失败');
        }
        
        const data = result.data;
        console.log(`表数据加载成功: ${currentTable}, 记录数: ${data.length}`);
        
        // 清空表头和表体
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';
        
        // 首先移除旧的colgroup元素
        const oldColgroups = dataTable.querySelectorAll('colgroup');
        oldColgroups.forEach(cg => cg.remove());
        
        // 重置表格样式
        dataTable.className = 'table table-fixed';
        
        // 设置表格样式以确保表头和内容列宽一致
        dataTable.style.tableLayout = 'fixed';
        dataTable.style.width = '100%';
        
        if (data.length > 0) {
            // 创建表头
            const headerRow = document.createElement('tr');
            const columns = Object.keys(data[0]);
            
                            // 创建colgroup元素以控制列宽
                const colgroup = document.createElement('colgroup');
                dataTable.appendChild(colgroup);
                
                // 创建一个用于存储列类名的映射
                const columnClassMap = {};
                
                // 为每列分配适当的类名
                columns.forEach((col, index) => {
                    const colElement = document.createElement('col');
                    let columnClass = '';
                    
                    // 根据列类型添加CSS类
                    if (col === 'id' || col.endsWith('_id')) {
                        columnClass = 'col-id';
                    } else if (col.includes('date') || col.includes('time') || col.includes('created') || col.includes('updated')) {
                        columnClass = 'col-date';
                    } else if (col.includes('type')) {
                        columnClass = 'col-type';
                    } else if (col.includes('status') || col.includes('state')) {
                        columnClass = 'col-status';
                    } else if (col.includes('is_') || col === 'active' || col === 'enabled') {
                        columnClass = 'col-boolean';
                    } else if (col.includes('description') || col.includes('desc')) {
                        columnClass = 'col-description';
                    } else if (col.includes('content') || col.includes('text')) {
                        columnClass = 'col-text';
                    } else if (col.includes('comment')) {
                        columnClass = 'col-comment';
                    } else if (col.includes('note')) {
                        columnClass = 'col-note';
                    } else if (col.includes('count') || col.includes('num') || col.includes('amount') || col.includes('total')) {
                        columnClass = 'col-count';
                    } else if (col.includes('price') || col.includes('cost')) {
                        columnClass = 'col-price';
                    } else if (col.includes('quantity') || col.includes('qty')) {
                        columnClass = 'col-quantity';
                    } else if (col.includes('name') || col.includes('title')) {
                        columnClass = 'col-name';
                    } else if (col.includes('username') || col.includes('user_name')) {
                        columnClass = 'col-username';
                    } else if (col.includes('icon') || col.includes('symbol')) {
                        columnClass = 'col-icon';
                    } else {
                        // 默认列类型
                        columnClass = 'col-default';
                    }
                    
                    // 保存列索引和类名的映射关系
                    columnClassMap[index] = columnClass;
                    
                    // 设置固定宽度的col元素，根据类型分配固定宽度
                    colElement.className = columnClass;
                    
                    // 明确设置列宽，确保表头和内容一致
                    if (columnClass === 'col-id' || columnClass === 'col-key') {
                        colElement.style.width = '100px';
                        colElement.style.minWidth = '100px';
                        colElement.style.maxWidth = '100px';
                    } else if (columnClass === 'col-date' || columnClass === 'col-time') {
                        colElement.style.width = '180px';
                        colElement.style.minWidth = '180px';
                        colElement.style.maxWidth = '180px';
                    } else if (columnClass === 'col-type' || columnClass === 'col-status') {
                        colElement.style.width = '120px';
                        colElement.style.minWidth = '120px';
                        colElement.style.maxWidth = '120px';
                    } else if (columnClass === 'col-boolean') {
                        colElement.style.width = '100px';
                        colElement.style.minWidth = '100px';
                        colElement.style.maxWidth = '100px';
                    } else if (columnClass === 'col-description' || columnClass === 'col-text' || columnClass === 'col-comment') {
                        colElement.style.width = '250px';
                        colElement.style.minWidth = '250px';
                        colElement.style.maxWidth = '250px';
                    } else if (columnClass === 'col-note') {
                        colElement.style.width = '200px';
                        colElement.style.minWidth = '200px';
                        colElement.style.maxWidth = '200px';
                    } else if (columnClass === 'col-count' || columnClass === 'col-price' || columnClass === 'col-quantity') {
                        colElement.style.width = '100px';
                        colElement.style.minWidth = '100px';
                        colElement.style.maxWidth = '100px';
                    } else if (columnClass === 'col-name' || columnClass === 'col-username') {
                        colElement.style.width = '150px';
                        colElement.style.minWidth = '150px';
                        colElement.style.maxWidth = '150px';
                    } else if (columnClass === 'col-icon') {
                        colElement.style.width = '80px';
                        colElement.style.minWidth = '80px';
                        colElement.style.maxWidth = '80px';
                    } else {
                        colElement.style.width = '150px'; // 默认宽度
                        colElement.style.minWidth = '150px';
                        colElement.style.maxWidth = '150px';
                    }
                    
                    colgroup.appendChild(colElement);
                });
            
            // 添加表头单元格
            columns.forEach((col, index) => {
                const th = document.createElement('th');
                // 翻译字段名
                const displayName = translateField(col);
                th.textContent = displayName;
                th.title = `字段名: ${col}`;
                
                // 使用与colgroup相同的类名保持宽度一致
                if (columnClassMap[index]) {
                    th.className = columnClassMap[index];
                    
                    // 与col元素保持相同的宽度
                    if (columnClassMap[index] === 'col-id' || columnClassMap[index] === 'col-key') {
                        th.style.width = '100px';
                        th.style.minWidth = '100px';
                        th.style.maxWidth = '100px';
                    } else if (columnClassMap[index] === 'col-date' || columnClassMap[index] === 'col-time') {
                        th.style.width = '180px';
                        th.style.minWidth = '180px';
                        th.style.maxWidth = '180px';
                    } else if (columnClassMap[index] === 'col-type' || columnClassMap[index] === 'col-status') {
                        th.style.width = '120px';
                        th.style.minWidth = '120px';
                        th.style.maxWidth = '120px';
                    } else if (columnClassMap[index] === 'col-boolean') {
                        th.style.width = '100px';
                        th.style.minWidth = '100px';
                        th.style.maxWidth = '100px';
                    } else if (columnClassMap[index] === 'col-description' || columnClassMap[index] === 'col-text' || columnClassMap[index] === 'col-comment') {
                        th.style.width = '250px';
                        th.style.minWidth = '250px';
                        th.style.maxWidth = '250px';
                    } else if (columnClassMap[index] === 'col-note') {
                        th.style.width = '200px';
                        th.style.minWidth = '200px';
                        th.style.maxWidth = '200px';
                    } else if (columnClassMap[index] === 'col-count' || columnClassMap[index] === 'col-price' || columnClassMap[index] === 'col-quantity') {
                        th.style.width = '100px';
                        th.style.minWidth = '100px';
                        th.style.maxWidth = '100px';
                    } else if (columnClassMap[index] === 'col-name' || columnClassMap[index] === 'col-username') {
                        th.style.width = '150px';
                        th.style.minWidth = '150px';
                        th.style.maxWidth = '150px';
                    } else if (columnClassMap[index] === 'col-icon') {
                        th.style.width = '80px';
                        th.style.minWidth = '80px';
                        th.style.maxWidth = '80px';
                    } else {
                        th.style.width = '150px'; // 默认宽度
                        th.style.minWidth = '150px';
                        th.style.maxWidth = '150px';
                    }
                }
                
                headerRow.appendChild(th);
            });
            tableHeader.appendChild(headerRow);
            
            // 创建表体行
            data.forEach((row, rowIndex) => {
                const tr = document.createElement('tr');
                const isOdd = rowIndex % 2 === 0;
                
                columns.forEach((col, index) => {
                    const value = row[col];
                    const td = document.createElement('td');
                    
                    // 使用与表头和colgroup相同的类名保持宽度一致
                    if (columnClassMap[index]) {
                        td.className = columnClassMap[index];
                        
                        // 与col元素和表头保持相同的宽度
                        if (columnClassMap[index] === 'col-id' || columnClassMap[index] === 'col-key') {
                            td.style.width = '100px';
                            td.style.minWidth = '100px';
                            td.style.maxWidth = '100px';
                        } else if (columnClassMap[index] === 'col-date' || columnClassMap[index] === 'col-time') {
                            td.style.width = '180px';
                            td.style.minWidth = '180px';
                            td.style.maxWidth = '180px';
                        } else if (columnClassMap[index] === 'col-type' || columnClassMap[index] === 'col-status') {
                            td.style.width = '120px';
                            td.style.minWidth = '120px';
                            td.style.maxWidth = '120px';
                        } else if (columnClassMap[index] === 'col-boolean') {
                            td.style.width = '100px';
                            td.style.minWidth = '100px';
                            td.style.maxWidth = '100px';
                        } else if (columnClassMap[index] === 'col-description' || columnClassMap[index] === 'col-text' || columnClassMap[index] === 'col-comment') {
                            td.style.width = '250px';
                            td.style.minWidth = '250px';
                            td.style.maxWidth = '250px';
                        } else if (columnClassMap[index] === 'col-note') {
                            td.style.width = '200px';
                            td.style.minWidth = '200px';
                            td.style.maxWidth = '200px';
                        } else if (columnClassMap[index] === 'col-count' || columnClassMap[index] === 'col-price' || columnClassMap[index] === 'col-quantity') {
                            td.style.width = '100px';
                            td.style.minWidth = '100px';
                            td.style.maxWidth = '100px';
                        } else if (columnClassMap[index] === 'col-name' || columnClassMap[index] === 'col-username') {
                            td.style.width = '150px';
                            td.style.minWidth = '150px';
                            td.style.maxWidth = '150px';
                        } else if (columnClassMap[index] === 'col-icon') {
                            td.style.width = '80px';
                            td.style.minWidth = '80px';
                            td.style.maxWidth = '80px';
                        } else {
                            td.style.width = '150px'; // 默认宽度
                            td.style.minWidth = '150px';
                            td.style.maxWidth = '150px';
                        }
                    }
                    
                    // 根据数据类型和内容优化显示，确保内容不会撑开单元格
                    if (value === null) {
                        td.innerHTML = '<span class="null-value fixed-width-content">空值</span>';
                    } else if (typeof value === 'object') {
                        try {
                            const jsonStr = JSON.stringify(value, null, 2);
                            td.innerHTML = `<span class="text-secondary truncated-text fixed-width-content" 
                                title="${jsonStr.replace(/"/g, '&quot;')}">${jsonStr.substring(0, 50)}${jsonStr.length > 50 ? '...' : ''}</span>`;
                        } catch (e) {
                            td.innerHTML = '<span class="badge bg-secondary fixed-width-content">复杂对象</span>';
                        }
                    } else if (typeof value === 'boolean') {
                        td.innerHTML = value ? 
                            '<span class="badge bg-success fixed-width-content">是</span>' : 
                            '<span class="badge bg-danger fixed-width-content">否</span>';
                    } else if (col.includes('time') || col.includes('date') || col.includes('created') || col.includes('updated')) {
                        // 日期时间格式化
                        try {
                            const date = new Date(value);
                            if (!isNaN(date)) {
                                td.innerHTML = `<span class="text-muted fixed-width-content" title="${date.toLocaleString()}">${date.toLocaleString()}</span>`;
                            } else {
                                td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                            }
                        } catch (e) {
                            td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                        }
                    } else if (col === 'id' || col.endsWith('_id')) {
                        // ID列格式化
                        td.innerHTML = `<span class="badge fixed-width-content" style="background-color: #6495ED;">${value}</span>`;
                    } else if (col.includes('email')) {
                        // 邮箱格式化
                        td.innerHTML = `<a href="mailto:${value}" class="text-primary fixed-width-content">${value}</a>`;
                    } else if (col.includes('status')) {
                        // 状态格式化
                        let statusClass = 'bg-secondary';
                        let statusText = value;
                        
                        // 状态文本翻译
                        if (String(value).toLowerCase() === 'active') {
                            statusText = '激活';
                            statusClass = 'bg-success';
                        } else if (String(value).toLowerCase() === 'inactive') {
                            statusText = '未激活';
                            statusClass = 'bg-danger';
                        } else if (String(value).toLowerCase() === 'pending') {
                            statusText = '待处理';
                            statusClass = 'bg-warning';
                        } else if (String(value).toLowerCase() === 'requestion') {
                            statusText = '重新提问';
                            statusClass = 'bg-info';
                        } else if (/active|enabled|success|1|true/i.test(String(value))) {
                            statusClass = 'bg-success';
                        } else if (/inactive|disabled|failed|0|false/i.test(String(value))) {
                            statusClass = 'bg-danger';
                        } else if (/pending|waiting/i.test(String(value))) {
                            statusClass = 'bg-warning';
                        }
                        
                        td.innerHTML = `<span class="badge ${statusClass} fixed-width-content">${statusText}</span>`;
                    } else if (col.includes('url') || col.includes('link') || col.includes('website')) {
                        // URL格式化
                        if (String(value).startsWith('http')) {
                            td.innerHTML = `<a href="${value}" target="_blank" class="text-primary fixed-width-content">${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}</a>`;
                        } else {
                            td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                        }
                    } else if (col.includes('count') || col.includes('num') || col.includes('amount') || col.includes('total')) {
                        // 数字格式化
                        if (!isNaN(value)) {
                            td.innerHTML = `<span class="fixed-width-content" style="font-weight: bold;">${Number(value).toLocaleString()}</span>`;
                        } else {
                            td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                        }
                    } else if (col.includes('price') || col.includes('cost')) {
                        // 价格格式化
                        if (!isNaN(value)) {
                            td.innerHTML = `<span class="fixed-width-content" style="font-weight: bold;">¥${Number(value).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
                        } else {
                            td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                        }
                    } else if (String(value).length > 100) {
                        // 长文本截断显示
                        td.innerHTML = `<span class="truncated-text fixed-width-content" title="${String(value).replace(/"/g, '&quot;')}">${String(value).substring(0, 100)}...</span>`;
                    } else {
                        // 默认显示
                        td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
                    }
                    
                    tr.appendChild(td);
                });
                
                tableBody.appendChild(tr);
            });
            
            // 更新行计数和分页显示
            const startRecord = currentPage * pageSize + 1;
            const endRecord = startRecord + data.length - 1;
            rowCount.textContent = `${startRecord}-${endRecord}`;
            
            // 启用/禁用分页按钮
            document.getElementById('prev-page').parentElement.classList.toggle('disabled', currentPage === 0);
            document.getElementById('next-page').parentElement.classList.toggle('disabled', data.length < pageSize);
            
            // 更新分页指示器
            updatePagination(currentPage);
        } else {
            // 没有数据的情况
            tableBody.innerHTML = `
                <tr>
                    <td colspan="100%">
                        <div class="empty-state">
                            <i class="bi bi-inbox"></i>
                            <p>表 "${currentTable}" 中没有数据</p>
                            <span class="subtext">该表当前为空，您可以添加新数据或选择其他表</span>
                        </div>
                    </td>
                </tr>`;
            rowCount.textContent = '0';
            
            // 禁用分页按钮
            document.getElementById('prev-page').parentElement.classList.add('disabled');
            document.getElementById('next-page').parentElement.classList.add('disabled');
        }
    } catch (error) {
        // 显示错误信息
        tableBody.innerHTML = `
            <tr>
                <td colspan="100%">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle" style="color: var(--danger-color);"></i>
                        <p class="text-danger">加载失败: ${error.message}</p>
                        <span class="subtext">请检查数据库连接或刷新页面重试</span>
                    </div>
                </td>
            </tr>`;
        rowCount.textContent = '加载失败';
        console.error('加载表数据错误:', error);
        showAlert('加载表数据失败: ' + error.message, 'error');
    } finally {
        hideLoading('table');
    }
}

/**
 * 更新分页指示器
 * @param {number} currentPage - 当前页码
 */
function updatePagination(currentPage) {
    const paginationList = document.querySelector('.pagination');
    if (!paginationList) return;
    
    // 清除现有页码，只保留前后按钮
    Array.from(paginationList.querySelectorAll('li:not(:first-child):not(:last-child)')).forEach(item => {
        item.remove();
    });
    
    // 最大显示5个页码按钮
    const maxPages = 5;
    const startPage = Math.max(0, currentPage - Math.floor(maxPages / 2));
    
    // 添加页码按钮
    for (let i = startPage; i < startPage + maxPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');
        if (i === currentPage) {
            pageItem.classList.add('active');
        }
        
        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.href = '#';
        pageLink.textContent = i + 1;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            loadTableData();
        });
        
        pageItem.appendChild(pageLink);
        paginationList.insertBefore(pageItem, document.getElementById('next-page').parentElement);
    }
}

/**
 * 加载表结构
 */
async function loadTableStructure() {
    if (!currentTable) {
        return;
    }
    
    try {
        console.log(`加载表结构: ${currentTable}`);
        showLoading('structure');
        
        const result = await apiRequest(`/db_admin/api/table/${currentTable}/info`);
        
        if (!result.success) {
            throw new Error(result.error || '加载表结构失败');
        }
        
        const columns = result.data;
        structureBody.innerHTML = '';
        
        // 获取表格元素
        const structureTable = document.getElementById('structure-table');
        
        // 清除旧的colgroup元素
        const oldColgroups = structureTable.querySelectorAll('colgroup');
        oldColgroups.forEach(cg => cg.remove());
        
        // 重置表格样式
        structureTable.className = 'table table-fixed';
        
        // 创建colgroup元素
        const colgroup = document.createElement('colgroup');
        
        // 添加col元素
        const columnTypes = ['col-key', 'col-type', 'col-boolean', 'col-key', 'col-type', 'col-type'];
        columnTypes.forEach(type => {
            const col = document.createElement('col');
            col.classList.add(type);
            colgroup.appendChild(col);
        });
        
        // 将colgroup添加到表格
        structureTable.appendChild(colgroup);
        
        if (columns.length > 0) {
            columns.forEach((column, rowIndex) => {
                const tr = document.createElement('tr');
                const isOdd = rowIndex % 2 === 0;
                
                // 字段名
                const tdName = document.createElement('td');
                tdName.classList.add('col-key');
                tdName.innerHTML = `<span class="field-key">${column.Field}</span>`;
                tr.appendChild(tdName);
                
                // 数据类型
                const tdType = document.createElement('td');
                tdType.classList.add('col-type');
                tdType.innerHTML = `<span class="field-type">${column.Type}</span>`;
                tr.appendChild(tdType);
                
                // 允许为空
                const tdNull = document.createElement('td');
                tdNull.classList.add('col-boolean');
                if (column.Null === 'YES') {
                    tdNull.innerHTML = `<span class="field-nullable">允许</span>`;
                } else {
                    tdNull.innerHTML = `<span class="badge bg-danger">不允许</span>`;
                }
                tr.appendChild(tdNull);
                
                // 键类型
                const tdKey = document.createElement('td');
                tdKey.classList.add('col-key');
                if (column.Key === 'PRI') {
                    tdKey.innerHTML = `<span class="badge" style="background-color: #6495ED;">主键</span>`;
                } else if (column.Key === 'UNI') {
                    tdKey.innerHTML = `<span class="badge bg-info">唯一</span>`;
                } else if (column.Key === 'MUL') {
                    tdKey.innerHTML = `<span class="badge bg-warning">索引</span>`;
                } else {
                    tdKey.innerHTML = `<span class="text-muted">-</span>`;
                }
                tr.appendChild(tdKey);
                
                // 默认值
                const tdDefault = document.createElement('td');
                tdDefault.classList.add('col-type');
                if (column.Default === null) {
                    tdDefault.innerHTML = `<span class="null-value">空值</span>`;
                } else {
                    tdDefault.textContent = column.Default;
                }
                tr.appendChild(tdDefault);
                
                // 其他属性
                const tdExtra = document.createElement('td');
                tdExtra.classList.add('col-type');
                if (column.Extra) {
                    if (column.Extra.includes('auto_increment')) {
                        tdExtra.innerHTML = `<span class="badge bg-secondary">自动递增</span>`;
                    } else if (column.Extra.includes('on update')) {
                        tdExtra.innerHTML = `<span class="badge bg-info">更新时自动更新</span>`;
                    } else {
                        tdExtra.textContent = column.Extra;
                    }
                } else {
                    tdExtra.innerHTML = `<span class="text-muted">-</span>`;
                }
                tr.appendChild(tdExtra);
                
                structureBody.appendChild(tr);
            });
        } else {
            structureBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="bi bi-layout-text-window"></i>
                            <p>无表结构信息</p>
                            <span class="subtext">未能获取到表结构数据</span>
                        </div>
                    </td>
                </tr>`;
        }
        
        structurePanel.style.display = 'block';
    } catch (error) {
        structureBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle" style="color: var(--danger-color);"></i>
                        <p class="text-danger">加载失败: ${error.message}</p>
                        <span class="subtext">请检查数据库连接或刷新页面重试</span>
                    </div>
                </td>
            </tr>`;
        console.error('加载表结构错误:', error);
        showAlert('加载表结构失败: ' + error.message, 'error');
    } finally {
        hideLoading('structure');
    }
}

/**
 * 执行自定义查询
 * @param {string} query - SQL查询语句
 */
async function executeCustomQuery(query) {
    if (!query.trim()) {
        showAlert('请输入SQL查询语句', 'warning');
        return;
    }
    
    try {
        showLoading();
        const result = await apiRequest('/db_admin/api/query', 'POST', { query });
        
        // 显示查询结果面板
        queryResultsPanel.style.display = 'block';
        
        if (result.success) {
            // 设置结果状态
            queryResultStatus.textContent = '成功';
            queryResultStatus.className = 'badge bg-success me-2';
            
            if (typeof result.result === 'number') {
                // 执行更新操作
                queryResultsContainer.innerHTML = `
                    <div class="alert alert-success m-3">
                        <i class="bi bi-check-circle-fill"></i> 操作成功，影响了 ${result.result} 行数据
                    </div>
                `;
                queryRowCount.textContent = result.result;
            } else if (Array.isArray(result.result) && result.result.length > 0) {
                // 查询操作有结果
                const data = result.result;
                const columns = Object.keys(data[0]);
                
                let tableHtml = `
                    <div class="table-responsive" style="border: 1px solid #6495ED;">
                        <table class="table table-hover mb-0" style="table-layout: fixed; border-collapse: collapse;">
                            <thead>
                                <tr>
                `;
                
                // 创建表头，翻译字段名
                columns.forEach(col => {
                    const displayName = translateField(col);
                    tableHtml += `<th style=\"background-color: #6495ED; color: white; border: 1px solid #4F78C4; text-align: center; padding: 12px 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\" title=\"${col}\">${displayName}</th>`;
                });
                
                tableHtml += `
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                // 创建表格内容行
                data.forEach((row, rowIndex) => {
                    const isOdd = rowIndex % 2 === 0;
                    const rowClass = isOdd ? "odd" : "even";
                    tableHtml += `<tr class="${rowClass}">\n                    `;
                    
                    columns.forEach(col => {
                        const value = row[col];
                        
                        // 根据数据类型优化显示
                        let cellContent = '';
                        if (value === null) {
                            cellContent = '<span class="null-value">空值</span>';
                        } else if (typeof value === 'object') {
                            try {
                                const jsonStr = JSON.stringify(value, null, 2);
                                cellContent = `<span class="text-secondary truncated-text" title="${jsonStr.replace(/"/g, '&quot;')}">${jsonStr.substring(0, 50)}${jsonStr.length > 50 ? '...' : ''}</span>`;
                            } catch (e) {
                                cellContent = '<span class="badge bg-secondary">复杂对象</span>';
                            }
                        } else if (typeof value === 'boolean') {
                            cellContent = value ? 
                                '<span class="badge bg-success">是</span>' : 
                                '<span class="badge bg-danger">否</span>';
                        } else if (col.includes('time') || col.includes('date') || col.includes('created') || col.includes('updated')) {
                            try {
                                const date = new Date(value);
                                if (!isNaN(date)) {
                                    cellContent = `<span class="text-muted" title="${date.toLocaleString()}">${date.toLocaleString()}</span>`;
                                } else {
                                    cellContent = `<span>${value}</span>`;
                                }
                            } catch (e) {
                                cellContent = `<span>${value}</span>`;
                            }
                        } else if (col === 'id' || col.endsWith('_id')) {
                            cellContent = `<span class="badge" style="background-color: #6495ED;">${value}</span>`;
                        } else if (String(value).length > 100) {
                            cellContent = `<span class="truncated-text" title="${String(value).replace(/"/g, '&quot;')}">${String(value).substring(0, 100)}...</span>`;
                        } else {
                            cellContent = `<span>${value}</span>`;
                        }
                        
                        // 添加单元格
                        let cssClass = '';
                        if (col === 'id' || col.endsWith('_id')) {
                            cssClass = 'col-id';
                        } else if (col.includes('date') || col.includes('time')) {
                            cssClass = 'col-date';
                        } else if (col.includes('type')) {
                            cssClass = 'col-type';
                        } else if (col.includes('status')) {
                            cssClass = 'col-status';
                        } else if (col.includes('boolean') || col.includes('is_')) {
                            cssClass = 'col-boolean';
                        } else if (col.includes('description') || col.includes('desc')) {
                            cssClass = 'col-description';
                        } else if (col.includes('name') || col.includes('title')) {
                            cssClass = 'col-name';
                        }
                        
                        tableHtml += `<td class="${cssClass}">${cellContent}</td>\n                    `;
                    });
                    
                    tableHtml += `</tr>\n                `;
                });
                
                tableHtml += `\n                            </tbody>\n                        </table>\n                    </div>\n                `;
                
                // 更改查询结果表格的HTML，直接在表格中添加colgroup
                let colgroupHtml = '<colgroup>';
                columns.forEach(col => {
                    let colClass = '';
                    if (col === 'id' || col.endsWith('_id')) {
                        colClass = 'col-id';
                    } else if (col.includes('date') || col.includes('time') || col.includes('created') || col.includes('updated')) {
                        colClass = 'col-date';
                    } else if (col.includes('type')) {
                        colClass = 'col-type';
                    } else if (col.includes('status') || col.includes('state')) {
                        colClass = 'col-status';
                    } else if (col.includes('is_') || col === 'active' || col === 'enabled') {
                        colClass = 'col-boolean';
                    } else if (col.includes('description') || col.includes('desc')) {
                        colClass = 'col-description';
                    } else if (col.includes('content') || col.includes('text')) {
                        colClass = 'col-text';
                    } else if (col.includes('comment')) {
                        colClass = 'col-comment';
                    } else if (col.includes('note')) {
                        colClass = 'col-note';
                    } else if (col.includes('count') || col.includes('num') || col.includes('amount') || col.includes('total')) {
                        colClass = 'col-count';
                    } else if (col.includes('price') || col.includes('cost')) {
                        colClass = 'col-price';
                    } else if (col.includes('quantity') || col.includes('qty')) {
                        colClass = 'col-quantity';
                    } else if (col.includes('name') || col.includes('title')) {
                        colClass = 'col-name';
                    } else if (col.includes('username') || col.includes('user_name')) {
                        colClass = 'col-username';
                    } else if (col.includes('icon') || col.includes('symbol')) {
                        colClass = 'col-icon';
                    }
                    
                    colgroupHtml += `<col class="${colClass}">`;
                });
                colgroupHtml += '</colgroup>';
                
                            // 修改查询结果表格的HTML，确保表格使用固定布局
            tableHtml = tableHtml.replace('<table class="table table-hover mb-0" style="table-layout: fixed; border-collapse: collapse;">', 
                '<table class="table table-hover table-fixed mb-0" style="table-layout: fixed !important; border-collapse: collapse;">' + colgroupHtml);
                
                // 设置表格为固定布局
                queryResultsContainer.innerHTML = tableHtml;
                
                queryRowCount.textContent = data.length;
            } else {
                // 查询操作无结果
                queryResultsContainer.innerHTML = `
                    <div class="alert alert-info m-3">
                        <i class="bi bi-info-circle-fill"></i> 查询执行成功，但没有返回数据
                    </div>
                `;
                queryRowCount.textContent = '0';
            }
        } else {
            // 查询失败
            queryResultStatus.textContent = '失败';
            queryResultStatus.className = 'badge bg-danger me-2';
            queryResultsContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <i class="bi bi-exclamation-triangle-fill"></i> 查询执行失败：${result.result}
                </div>
            `;
            queryRowCount.textContent = '0';
        }
    } catch (error) {
        queryResultsPanel.style.display = 'block';
        queryResultStatus.textContent = '错误';
        queryResultStatus.className = 'badge bg-danger me-2';
        queryResultsContainer.innerHTML = `
            <div class="alert alert-danger m-3">
                <i class="bi bi-exclamation-triangle-fill"></i> 查询执行错误：${error.message}
            </div>
        `;
        queryRowCount.textContent = '0';
    } finally {
        hideLoading();
    }
}

/**
 * 翻译字段名称
 * @param {string} fieldName - 要翻译的字段名
 * @returns {string} - 翻译后的字段名
 */
function translateField(fieldName) {
    // 如果有直接映射，使用映射
    if (fieldTranslations[fieldName]) {
        return fieldTranslations[fieldName];
    }
    
    // 处理带下划线的复合字段名
    if (fieldName.includes('_')) {
        const parts = fieldName.split('_');
        const translatedParts = parts.map(part => {
            return fieldTranslations[part] || part;
        });
        
        // 将翻译后的部分重新组合
        return translatedParts.join('_')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // 默认情况下，将下划线替换为空格，首字母大写
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 加载配置
    loadConfig();
    
    // 连接设置点击
    connectionSettings.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllPanels();
        connectionPanel.style.display = 'block';
    });
    
    // 连接表单提交
    connectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const config = {
            host: document.getElementById('host').value,
            port: parseInt(document.getElementById('port').value),
            user: document.getElementById('username').value,
            password: document.getElementById('password').value,
            database: document.getElementById('database').value
        };
        
        connectDatabase(config);
    });
    
    // 刷新连接按钮
    refreshConnection.addEventListener('click', (e) => {
        e.preventDefault();
        loadConfig();
        
        const config = {
            host: document.getElementById('host').value,
            port: parseInt(document.getElementById('port').value),
            user: document.getElementById('username').value,
            password: document.getElementById('password').value,
            database: document.getElementById('database').value
        };
        
        connectDatabase(config);
    });
    
    // 仪表盘链接点击
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllPanels();
        dashboardPanel.style.display = 'block';
        loadDashboard();
    });
    
    // 刷新仪表盘按钮
    refreshDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        loadDashboard();
    });
    
    // 刷新表列表按钮
    refreshTables.addEventListener('click', (e) => {
        e.preventDefault();
        loadTables();
    });
    
    // 刷新表数据按钮
    refreshTableData.addEventListener('click', (e) => {
        e.preventDefault();
        loadTableData();
    });
    
    // 显示表结构按钮
    showTableStructure.addEventListener('click', (e) => {
        e.preventDefault();
        structurePanel.style.display = 'block';
    });
    
    // 关闭表结构按钮
    closeStructure.addEventListener('click', (e) => {
        e.preventDefault();
        structurePanel.style.display = 'none';
    });
    
    // 上一页按钮
    prevPage.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 0) {
            currentPage--;
            loadTableData();
        }
    });
    
    // 下一页按钮
    nextPage.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage++;
        loadTableData();
    });
    
    // 自定义查询链接
    customQueryLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllPanels();
        customQueryPanel.style.display = 'block';
    });
    
    // 查询表单提交
    queryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executeCustomQuery(sqlQuery.value);
    });
    
    // 关闭查询结果按钮
    closeQueryResults.addEventListener('click', (e) => {
        e.preventDefault();
        queryResultsPanel.style.display = 'none';
    });
    
    // 导出查询结果按钮
    exportQueryResult.addEventListener('click', (e) => {
        e.preventDefault();
        exportQueryResultsToCSV();
    });
    
    // 导出数据按钮
    exportData.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentTable) {
            exportTableData(currentTable);
        } else {
            showAlert('请先选择一个表', 'warning');
        }
    });
    
    // 导入数据按钮
    importData.addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('数据导入功能尚未实现', 'info');
    });
});

/**
 * 隐藏所有面板
 */
function hideAllPanels() {
    dashboardPanel.style.display = 'none';
    connectionPanel.style.display = 'none';
    tablePanel.style.display = 'none';
    structurePanel.style.display = 'none';
    customQueryPanel.style.display = 'none';
    queryResultsPanel.style.display = 'none';
}

/**
 * 导出表数据为CSV
 * @param {string} tableName - 表名
 */
async function exportTableData(tableName) {
    try {
        showLoading();
        const result = await apiRequest(`/db_admin/api/table/${tableName}/data?limit=10000&offset=0`);
        
        if (result.success && result.data && result.data.length > 0) {
            const data = result.data;
            const columns = Object.keys(data[0]);
            
            // 创建CSV内容
            let csvContent = columns.join(',') + '\n';
            
            data.forEach(row => {
                const rowValues = columns.map(col => {
                    const value = row[col];
                    if (value === null) {
                        return '';
                    } else if (typeof value === 'object') {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    } else {
                        return `"${value.toString().replace(/"/g, '""')}"`;
                    }
                });
                csvContent += rowValues.join(',') + '\n';
            });
            
            // 创建下载链接
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert(`已导出 ${data.length} 条记录`, 'success');
        } else {
            showAlert('导出失败，没有数据', 'error');
        }
    } catch (error) {
        console.error('导出数据错误:', error);
        showAlert('导出数据失败', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * 导出查询结果为CSV
 */
function exportQueryResultsToCSV() {
    try {
        const table = queryResultsContainer.querySelector('table');
        
        if (!table) {
            showAlert('没有可导出的数据', 'warning');
            return;
        }
        
        // 获取表头
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push(th.textContent);
        });
        
        // 获取数据行
        const rows = [];
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach(td => {
                row.push(td.textContent);
            });
            rows.push(row);
        });
        
        // 创建CSV内容
        let csvContent = headers.join(',') + '\n';
        
        rows.forEach(row => {
            const rowValues = row.map(value => {
                return `"${value.replace(/"/g, '""')}"`;
            });
            csvContent += rowValues.join(',') + '\n';
        });
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `query_result_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert(`已导出 ${rows.length} 条记录`, 'success');
    } catch (error) {
        console.error('导出查询结果错误:', error);
        showAlert('导出查询结果失败', 'error');
    }
} 