/**
 * AI平台 - 数据库管理系统JavaScript脚本
 */

// 全局变量
let currentTable = '';
let currentPage = 0;
let pageSize = 100;
let isConnected = false;
let tableStats = {};
let currentEditCell = null; // 当前正在编辑的单元格
let editingCellValue = null; // 编辑前的单元格值

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
const enableEditButton = document.getElementById('enable-edit-mode'); // 编辑模式按钮

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
 * @param {string} url - 请求URL
 * @param {string} method - 请求方法（GET, POST等）
 * @param {object} data - 请求数据（可选）
 * @returns {Promise} - 响应Promise
 */
async function apiRequest(url, method = 'GET', data = null) {
    showLoading();
    try {
        // 处理URL前缀
        // 如果URL不是以/db_admin开头，添加前缀
        if (!url.startsWith('/db_admin')) {
            url = '/db_admin' + url;
        }
        
        console.log(`发送请求: ${method} ${url}`, data);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa('admin:admin123')
            },
            // 确保fetch不会随意跟随重定向
            redirect: 'follow',
            // 确保fetch发送凭据
            credentials: 'same-origin'
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            // 超时处理
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
            options.signal = controller.signal;
            
            const response = await fetch(url, options);
            clearTimeout(timeoutId); // 清除超时
            
            // 检查响应状态
            if (!response.ok) {
                console.error(`HTTP错误: ${response.status} ${response.statusText}`);
                // 尝试解析错误响应
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || `HTTP错误: ${response.status}`;
                } catch (e) {
                    errorMessage = `HTTP错误: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            // 解析响应JSON
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('JSON解析错误:', jsonError);
                throw new Error(`无法解析响应: ${jsonError.message}`);
            }

            console.log(`收到响应: ${url}`, result);
            
            // 检查结果中是否有错误信息
            if (result.error) {
                throw new Error(result.error);
            }

            return result;
        } catch (fetchError) {
            // 处理请求中断的特殊情况
            if (fetchError.name === 'AbortError') {
                console.error('请求超时');
                throw new Error('请求超时，请稍后重试');
            }
            
            console.error('Fetch错误:', fetchError);
            throw fetchError;
        }
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
        const result = await apiRequest('/api/connect', 'POST', config);
        
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
        const result = await apiRequest('/api/disconnect', 'POST');
        
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
        const config = await apiRequest('/api/config');
        
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
        const result = await apiRequest('/api/tables');
        
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
        
        // 预先销毁图表，避免Canvas重用错误
        // 先通过Chart.js内置方法检查并销毁
        const distributionCanvas = document.getElementById('distributionChart');
        const growthCanvas = document.getElementById('growthChart');
        
        if (distributionCanvas) {
            const distributionChartInstance = Chart.getChart(distributionCanvas);
            if (distributionChartInstance) {
                distributionChartInstance.destroy();
            }
        }
        
        if (growthCanvas) {
            const growthChartInstance = Chart.getChart(growthCanvas);
            if (growthChartInstance) {
                growthChartInstance.destroy();
            }
        }
        
        // 再确保全局变量被清理
        if (distributionChart) {
            try {
                distributionChart.destroy();
            } catch (e) {
                console.warn('销毁分布图表失败:', e);
            }
            distributionChart = null;
        }
        
        if (growthChart) {
            try {
                growthChart.destroy();
            } catch (e) {
                console.warn('销毁增长图表失败:', e);
            }
            growthChart = null;
        }
        
        // 使用串行请求而非并行请求，避免连接池耗尽
        let successCount = 0;
        let failedCount = 0;
        
        // 1. 加载用户数量
        try {
            const usersResult = await apiRequest('/api/query', 'POST', { 
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
            const videosResult = await apiRequest('/api/query', 'POST', { 
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
            const questionsResult = await apiRequest('/api/query', 'POST', { 
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
            const answersResult = await apiRequest('/api/query', 'POST', { 
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
            const feedbacksResult = await apiRequest('/api/query', 'POST', { 
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
        
        // 更新图表 - 增加延迟确保DOM更新和旧图表完全清除
        setTimeout(() => {
            try {
                updateDistributionChart();
                updateGrowthChart();
                console.log('所有图表更新完成');
            } catch (error) {
                console.error('更新图表失败:', error);
            }
        }, 200); // 增加延迟时间
        
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
        
        // 首先检查并清理Canvas上的旧Chart
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // 再次确保distributionChart全局变量被清理
        if (distributionChart) {
            distributionChart.destroy();
            distributionChart = null;
        }
        
        // 确保Canvas干净
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
        
        // 首先检查并清理Canvas上的旧Chart
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // 再次确保growthChart全局变量被清理
        if (growthChart) {
            growthChart.destroy();
            growthChart = null;
        }
        
        // 确保Canvas干净
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
        
        const result = await apiRequest(`/api/table/${currentTable}/data?limit=${pageSize}&offset=${currentPage * pageSize}`);
        
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
                    tr.dataset.rowIndex = rowIndex; // 添加行索引，用于编辑功能
                    const isOdd = rowIndex % 2 === 0;
                    
                    columns.forEach((col, index) => {
                        const value = row[col];
                        // 使用createTableCell函数创建单元格
                        const td = createTableCell(currentTable, col, value, dataTable.classList.contains('edit-mode'));
                        
                        // 使用与表头和colgroup相同的类名保持宽度一致
                        if (columnClassMap[index]) {
                            // 保留已有的类
                            const existingClasses = td.className.split(' ').filter(c => c !== '');
                            td.className = columnClassMap[index] + (existingClasses.length > 0 ? ' ' + existingClasses.join(' ') : '');
                            
                            // 为编辑模式添加事件监听器
                            if (dataTable.classList.contains('edit-mode')) {
                                td.addEventListener('click', cellClickHandler);
                            }
                            
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
        
        const result = await apiRequest(`/api/table/${currentTable}/info`);
        console.log('表结构API返回结果:', result);
        
        if (!result.success) {
            throw new Error(result.error || '加载表结构失败');
        }
        
        const columns = result.data || [];
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
        console.error('加载表结构错误详情:', error);
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
        const result = await apiRequest('/api/query', 'POST', { query });
        
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

/**
 * 判断字符串是否为日期格式
 * @param {string} str - 要检查的字符串
 * @returns {boolean} - 是否为日期格式
 */
function isDateString(str) {
    if (typeof str !== 'string') return false;
    
    // 检查常见的日期格式
    const dateRegexes = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO格式 YYYY-MM-DDThh:mm:ss
        /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
        /^\d{4}年\d{1,2}月\d{1,2}日/ // 中文日期格式
    ];
    
    // 检查是否符合任一日期格式
    if (dateRegexes.some(regex => regex.test(str))) {
        return true;
    }
    
    // 尝试用Date对象解析
    const d = new Date(str);
    return !isNaN(d) && d.toString() !== 'Invalid Date';
}

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间
 * @returns {string} - 格式化后的日期时间
 */
function formatDateTime(dateTime) {
    if (!dateTime) return '';
    
    try {
        const date = new Date(dateTime);
        if (isNaN(date)) return dateTime;
        
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return dateTime;
    }
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
        structureTableName.textContent = currentTable; // 设置表名
        loadTableStructure(); // 调用加载表结构的函数
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
    
    // 启用编辑模式按钮
    if (enableEditButton) {
        enableEditButton.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEditMode();
        });
    }
    
    // 文档点击事件，用于处理点击其他区域时取消编辑
    document.addEventListener('click', (e) => {
        // 如果点击的不是编辑框内的元素，且存在正在编辑的单元格，则取消编辑
        if (currentEditCell && !e.target.closest('.cell-editor') && !e.target.closest('.editable-cell')) {
            cancelCellEdit();
        }
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
        const result = await apiRequest(`/api/table/${tableName}/data?limit=10000&offset=0`);
        
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

/**
 * 将文本转换为安全的HTML字符串
 * @param {string} text - 要转换的文本
 * @returns {string} - 安全的HTML字符串
 */
function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 打开弹出编辑窗口
 * @param {HTMLElement} cell - 要编辑的单元格
 * @param {string} tableName - 表名
 * @param {number} rowIndex - 行索引
 * @param {string} columnName - 列名
 * @param {*} value - 单元格当前值
 */
function enterCellEditMode(cell, tableName, rowIndex, columnName, value) {
    // 如果已经在编辑其他单元格，先结束编辑
    if (currentEditCell !== null) {
        cancelCellEdit();
    }
    
    // 保存当前编辑单元格信息
    currentEditCell = {
        cell: cell,
        tableName: tableName,
        rowIndex: rowIndex,
        columnName: columnName,
        originalHTML: cell.innerHTML
    };
    editingCellValue = value;
    
    // 创建弹出窗口
    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'edit-popup';
    
    // 创建弹出窗口内容
    const popupContent = document.createElement('div');
    popupContent.className = 'edit-popup-content';
    
    // 创建弹出窗口头部
    const popupHeader = document.createElement('div');
    popupHeader.className = 'edit-popup-header';
    
    // 创建标题
    const popupTitle = document.createElement('div');
    popupTitle.className = 'edit-popup-title';
    popupTitle.textContent = `编辑字段: ${translateField(columnName)}`;
    
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'edit-popup-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', cancelCellEdit);
    
    // 组装头部
    popupHeader.appendChild(popupTitle);
    popupHeader.appendChild(closeButton);
    
    // 创建表单 - 改进表单创建和提交方式
    const form = document.createElement('form');
    form.className = 'edit-popup-form';
    // 重要：设置表单提交方式，确保它不会直接提交
    form.setAttribute('action', 'javascript:void(0);');
    form.setAttribute('method', 'post');
    form.setAttribute('novalidate', 'true');
    
    // 表单提交事件处理
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // 阻止默认提交
        e.stopPropagation(); // 阻止事件冒泡
        saveCellEdit(); // 调用保存函数
        return false; // 确保不会实际提交
    });
    
    // 字段组
    const formGroup = document.createElement('div');
    formGroup.className = 'edit-form-group';
    
    // 标签
    const label = document.createElement('label');
    label.className = 'edit-form-label';
    label.textContent = translateField(columnName);
    label.htmlFor = 'edit-field-input';
    
    // 输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'edit-field-input';
    input.name = 'edit-field-input'; // 添加name属性
    input.className = 'edit-form-input';
    input.value = value !== null ? value : '';
    
    // 字段信息
    const fieldInfo = document.createElement('div');
    fieldInfo.className = 'edit-form-info';
    fieldInfo.textContent = `表: ${tableName}, 行索引: ${rowIndex}, 字段: ${columnName}`;
    fieldInfo.style.fontSize = '12px';
    fieldInfo.style.color = '#888';
    fieldInfo.style.marginTop = '5px';
    
    // 组装表单组
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    formGroup.appendChild(fieldInfo);
    
    // 按钮组
    const buttonsGroup = document.createElement('div');
    buttonsGroup.className = 'edit-popup-buttons';
    
    // 保存按钮
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'edit-popup-save-btn';
    saveButton.textContent = '保存';
    
    // 取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'edit-popup-cancel-btn';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', cancelCellEdit);
    
    // 组装按钮组
    buttonsGroup.appendChild(cancelButton);
    buttonsGroup.appendChild(saveButton);
    
    // 组装表单
    form.appendChild(formGroup);
    form.appendChild(buttonsGroup);
    
    // 组装内容
    popupContent.appendChild(popupHeader);
    popupContent.appendChild(form);
    
    // 组装弹出窗口
    popup.appendChild(popupContent);
    
    // 添加到页面
    document.body.appendChild(popup);
    
    // 聚焦到输入框
    input.focus();
    
    // 添加键盘事件监听
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // 触发表单提交而不是直接调用saveCellEdit
            form.dispatchEvent(new Event('submit'));
        } else if (e.key === 'Escape') {
            cancelCellEdit();
        }
    });
    
    // 点击弹出窗口背景关闭
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            cancelCellEdit();
        }
    });
}

/**
 * 保存单元格编辑
 */
async function saveCellEdit() {
    if (!currentEditCell) {
        console.error('无法保存：currentEditCell为空');
        showAlert('编辑失败：无法获取编辑单元格信息', 'error');
        return;
    }
    
    // 获取弹出窗口
    const popup = document.getElementById('edit-popup');
    if (!popup) {
        console.error('无法保存：找不到编辑弹窗');
        showAlert('编辑失败：找不到编辑窗口', 'error');
        return;
    }
    
    // 获取输入框中的新值
    const input = popup.querySelector('#edit-field-input');
    if (!input) {
        console.error('无法保存：找不到输入框');
        showAlert('编辑失败：找不到输入框', 'error');
        return;
    }
    
    const newValue = input.value;
    
    console.log('保存编辑 - 当前单元格信息:', {
        tableName: currentEditCell.tableName,
        rowIndex: currentEditCell.rowIndex,
        columnName: currentEditCell.columnName,
        originalValue: currentEditCell.originalValue,
        newValue: newValue
    });
    
    // 显示表单提交状态
    const saveButton = popup.querySelector('.edit-popup-save-btn');
    const cancelButton = popup.querySelector('.edit-popup-cancel-btn');
    if (saveButton) saveButton.disabled = true;
    if (saveButton) saveButton.textContent = '保存中...';
    if (cancelButton) cancelButton.disabled = true;
    
    try {
        // 显示加载指示器
        showLoading();
        console.log(`开始保存编辑: 表=${currentEditCell.tableName}, 行=${currentEditCell.rowIndex}, 列=${currentEditCell.columnName}, 新值=${newValue}`);
        
        // 获取主键信息以构建更新条件
        const result = await apiRequest(`/api/table/${currentEditCell.tableName}/info`);
        console.log('获取表结构结果:', result);
        
        if (!result.success) {
            throw new Error(result.error || '获取表结构失败');
        }
        
        // 查找主键
        const primaryKeyColumn = result.data.find(col => col.Key === 'PRI');
        console.log('主键列:', primaryKeyColumn);
        
        if (!primaryKeyColumn) {
            throw new Error('无法更新：找不到主键');
        }
        
        // 获取当前行的主键值
        const rowResult = await apiRequest(`/api/table/${currentEditCell.tableName}/row/${currentEditCell.rowIndex}`);
        console.log('获取行数据结果:', rowResult);
        
        if (!rowResult.success || !rowResult.data) {
            throw new Error('获取行数据失败');
        }
        
        const primaryKeyValue = rowResult.data[primaryKeyColumn.Field];
        console.log('主键值:', primaryKeyValue);
        
        if (primaryKeyValue === undefined) {
            throw new Error('无法获取主键值');
        }
        
        // 构建更新请求
        const updateData = {
            table: currentEditCell.tableName,
            column: currentEditCell.columnName,
            value: newValue,
            primaryKey: primaryKeyColumn.Field,
            primaryKeyValue: primaryKeyValue
        };
        
        console.log('发送更新请求:', updateData);
        
        // 发送更新请求
        try {
            const updateResult = await apiRequest('/api/update', 'POST', updateData);
            console.log('更新结果:', updateResult);
            
            if (!updateResult.success) {
                throw new Error(updateResult.error || '更新失败');
            }
            
            // 更新成功，更新单元格显示
            showAlert(`数据已更新: ${updateResult.message || ''}`, 'success');
            
            // 使用与原单元格相同的显示逻辑，但更新值
            currentEditCell.cell.innerHTML = `<span class="fixed-width-content">${escapeHtml(newValue)}</span>`;
            currentEditCell.cell.classList.add('updated-cell');
            
            // 在控制台显示单元格状态
            console.log('更新后的单元格:', currentEditCell.cell);
            
            // 移除弹出窗口
            if (popup && popup.parentNode) {
                document.body.removeChild(popup);
            }
            
            // 重置编辑状态
            currentEditCell = null;
            editingCellValue = null;
            
            // 刷新表格数据以确保显示最新数据
            setTimeout(() => {
                console.log('刷新表格数据...');
                loadTableData();
            }, 1000);
        } catch (error) {
            console.error('更新请求失败:', error);
            throw error;  // 继续向上传递错误以便在外层catch中处理
        }
    } catch (error) {
        console.error('保存单元格编辑错误详情:', error);
        showAlert(`更新失败: ${error.message}`, 'error');
        
        // 恢复按钮状态
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '保存';
        }
        if (cancelButton) cancelButton.disabled = false;
        
        // 如果是连接或服务器错误，保留弹窗让用户重试
        if (error.message.includes('连接') || error.message.includes('网络') || error.message.includes('服务器')) {
            // 不关闭弹窗，让用户可以重试
            return;
        }
        
        // 其他错误则关闭弹窗
        if (popup && popup.parentNode) {
            document.body.removeChild(popup);
        }
        
        // 恢复原始内容
        if (currentEditCell) {
            currentEditCell.cell.innerHTML = currentEditCell.originalHTML;
            currentEditCell = null;
            editingCellValue = null;
        }
    } finally {
        hideLoading();
    }
}

/**
 * 取消单元格编辑
 */
function cancelCellEdit() {
    if (!currentEditCell) return;
    
    // 获取并移除弹出窗口
    const popup = document.getElementById('edit-popup');
    if (popup) {
        document.body.removeChild(popup);
    }
    
    // 恢复原始内容
    currentEditCell.cell.innerHTML = currentEditCell.originalHTML;
    
    // 重置编辑状态
    currentEditCell = null;
    editingCellValue = null;
}

/**
 * 启用/禁用表格编辑模式
 */
function toggleEditMode() {
    const isEditMode = dataTable.classList.contains('edit-mode');
    
    if (isEditMode) {
        // 禁用编辑模式
        dataTable.classList.remove('edit-mode');
        if (enableEditButton) {
            enableEditButton.textContent = '启用编辑';
            enableEditButton.classList.remove('btn-danger');
            enableEditButton.classList.add('btn-primary');
        }
        
        // 如果有正在编辑的单元格，取消编辑
        if (currentEditCell) {
            cancelCellEdit();
        }
        
        // 移除单元格点击事件
        document.querySelectorAll('#table-body td').forEach(cell => {
            cell.removeEventListener('click', cellClickHandler);
            cell.classList.remove('editable-cell');
        });
        
        showAlert('已退出编辑模式', 'info');
    } else {
        // 启用编辑模式
        dataTable.classList.add('edit-mode');
        if (enableEditButton) {
            enableEditButton.textContent = '退出编辑';
            enableEditButton.classList.remove('btn-primary');
            enableEditButton.classList.add('btn-danger');
        }
        
        // 添加单元格点击事件
        document.querySelectorAll('#table-body td').forEach(cell => {
            cell.classList.add('editable-cell');
            cell.addEventListener('click', cellClickHandler);
        });
        
        showAlert('已进入编辑模式，点击单元格可以编辑内容', 'success');
    }
}

/**
 * 单元格点击事件处理函数
 * @param {Event} e - 点击事件
 */
function cellClickHandler(e) {
    const cell = e.currentTarget;
    const rowIndex = cell.parentNode.dataset.rowIndex;
    const columnName = cell.dataset.column;
    const tableName = currentTable;
    
    // 获取单元格原始值
    let value = '';
    
    // 尝试从span.fixed-width-content中获取内容
    const contentSpan = cell.querySelector('.fixed-width-content');
    if (contentSpan) {
        value = contentSpan.textContent;
    } else {
        value = cell.textContent;
    }
    
    // 进入编辑模式
    enterCellEditMode(cell, tableName, rowIndex, columnName, value);
}

/**
 * 显示弹出提示
 * @param {string} message - 提示信息
 * @param {string} type - 提示类型
 */
function showPopup(message, type) {
    // 在这里添加显示弹出提示的逻辑
    console.log(`提示: ${message} (${type})`);
}

/**
 * 创建表格单元格
 * @param {string} tableName - 表名
 * @param {string} column - 列名
 * @param {any} value - 单元格值
 * @param {boolean} isEditMode - 是否处于编辑模式
 * @returns {HTMLTableCellElement} - 表格单元格元素
 */
function createTableCell(tableName, column, value, isEditMode) {
    const td = document.createElement('td');
    td.dataset.column = column;
    
    // 特殊处理空值
    if (value === null || value === undefined) {
        td.innerHTML = '<span class="text-muted">NULL</span>';
        return td;
    }
    
    // 处理视频表的file_path字段，添加播放按钮
    if (tableName === 'videos' && column === 'file_path') {
        // 创建视频播放按钮
        const videoPath = value;
        
        // 创建容器
        const container = document.createElement('div');
        container.className = 'd-flex align-items-center';
        
        // 创建路径显示元素 - 使用更短的显示
        const filename = videoPath.split('/').pop(); // 只显示文件名部分
        const pathDisplay = document.createElement('span');
        pathDisplay.className = 'video-path';
        pathDisplay.textContent = filename;
        pathDisplay.title = videoPath; // 完整路径显示为提示
        
        // 创建播放按钮
        const playBtn = document.createElement('button');
        playBtn.className = 'btn btn-sm btn-primary ms-2 video-btn';
        playBtn.innerHTML = '<i class="bi bi-play-circle"></i> 播放';
        playBtn.onclick = function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            openVideoPlayer(videoPath);
        };
        
        // 组装单元格内容
        container.appendChild(pathDisplay);
        container.appendChild(playBtn);
        td.appendChild(container);
    } else {
        // 处理其他字段
        // 数字类型右对齐
        if (typeof value === 'number') {
            td.className = 'text-end';
            td.innerHTML = `<span class="fixed-width-content">${value}</span>`;
        }
        // 日期类型格式化
        else if (value instanceof Date || (typeof value === 'string' && isDateString(value))) {
            td.innerHTML = `<span class="fixed-width-content">${formatDateTime(value)}</span>`;
        }
        // 布尔类型显示为是/否
        else if (typeof value === 'boolean') {
            const booleanClass = value ? 'text-success' : 'text-danger';
            const booleanText = value ? '是' : '否';
            td.innerHTML = `<span class="fixed-width-content ${booleanClass}"><i class="bi ${value ? 'bi-check-circle' : 'bi-x-circle'}"></i> ${booleanText}</span>`;
        }
        // JSON对象美化展示
        else if (typeof value === 'object') {
            td.innerHTML = `<span class="fixed-width-content">${JSON.stringify(value)}</span>`;
        }
        // 默认字符串显示
        else {
            td.innerHTML = `<span class="fixed-width-content">${escapeHtml(String(value))}</span>`;
        }
    }
    
    // 如果表格处于编辑模式，添加可编辑类
    if (isEditMode) {
        td.classList.add('editable-cell');
    }
    
    return td;
}

/**
 * 打开视频播放器
 * @param {string} videoPath - 视频文件路径
 */
function openVideoPlayer(videoPath) {
    // 创建视频播放弹窗
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'videoPlayerModal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'videoPlayerModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    // 从文件路径中提取文件名
    const filename = videoPath.replace(/^.*[\\\/]/, '');
    // 构建完整的视频URL
    const fullVideoPath = `/db_admin/videos/${filename}`;
    
    // 获取视频标题（如果可能）
    let videoTitle = "视频播放";
    // 尝试从当前选中的表格行获取视频标题
    if (currentTable === 'videos') {
        try {
            const selectedRow = document.querySelector(`#table-body tr[data-row-index="${currentEditCell?.rowIndex || 0}"]`);
            if (selectedRow) {
                const titleCell = selectedRow.querySelector('td[data-column="title"]');
                if (titleCell) {
                    const titleSpan = titleCell.querySelector('.fixed-width-content');
                    if (titleSpan) {
                        videoTitle = titleSpan.textContent || "视频播放";
                    }
                }
            }
        } catch (e) {
            console.error('获取视频标题失败:', e);
        }
    }
    
    // 创建弹窗内容
    modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="videoPlayerModalLabel">${videoTitle}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>
                </div>
                <div class="modal-body">
                    <div class="ratio ratio-16x9">
                        <video id="videoPlayer" controls autoplay>
                            <source src="${fullVideoPath}" type="video/mp4">
                            您的浏览器不支持HTML5视频播放。
                        </video>
                    </div>
                    <div class="video-controls mt-3">
                        <div>
                            <button type="button" class="btn btn-sm btn-outline-primary" id="playPauseBtn">
                                <i class="bi bi-pause-fill"></i> 暂停
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="muteBtn">
                                <i class="bi bi-volume-up-fill"></i> 静音
                            </button>
                        </div>
                        <div>
                            <span class="badge bg-info" id="currentTime">00:00 / 00:00</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="d-flex justify-content-between w-100">
                        <div>
                            <button type="button" class="btn btn-primary" id="downloadBtn">
                                <i class="bi bi-download"></i> 下载视频
                            </button>
                        </div>
                        <div>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 初始化Bootstrap模态框
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // 获取视频元素
    const videoPlayer = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const currentTimeDisplay = document.getElementById('currentTime');
    
    // 播放/暂停按钮事件
    if (playPauseBtn && videoPlayer) {
        playPauseBtn.addEventListener('click', function() {
            if (videoPlayer.paused) {
                videoPlayer.play();
                playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> 暂停';
            } else {
                videoPlayer.pause();
                playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i> 播放';
            }
        });
    }
    
    // 静音按钮事件
    if (muteBtn && videoPlayer) {
        muteBtn.addEventListener('click', function() {
            videoPlayer.muted = !videoPlayer.muted;
            if (videoPlayer.muted) {
                muteBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i> 取消静音';
            } else {
                muteBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i> 静音';
            }
        });
    }
    
    // 时间更新事件
    if (videoPlayer && currentTimeDisplay) {
        videoPlayer.addEventListener('timeupdate', function() {
            const currentMinutes = Math.floor(videoPlayer.currentTime / 60);
            const currentSeconds = Math.floor(videoPlayer.currentTime % 60);
            const durationMinutes = Math.floor(videoPlayer.duration / 60);
            const durationSeconds = Math.floor(videoPlayer.duration % 60);
            
            currentTimeDisplay.textContent = `${currentMinutes.toString().padStart(2, '0')}:${currentSeconds.toString().padStart(2, '0')} / ${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
        });
    }
    
    // 为下载按钮添加事件
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            window.open(fullVideoPath, '_blank');
        });
    }
    
    // 模态框关闭后清除
    modal.addEventListener('hidden.bs.modal', function() {
        if (videoPlayer) {
            videoPlayer.pause();
        }
        document.body.removeChild(modal);
    });
}