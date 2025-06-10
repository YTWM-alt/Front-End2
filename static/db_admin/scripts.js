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
        
        if (data.length > 0) {
            // 创建表头
            const headerRow = document.createElement('tr');
            const columns = Object.keys(data[0]);
            
            columns.forEach(key => {
                const th = document.createElement('th');
                // 优化字段名显示，将下划线替换为空格，首字母大写
                const displayName = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
                th.textContent = displayName;
                // 添加字段名提示
                th.title = `字段名: ${key}`;
                
                // 根据列名添加特定的CSS类
                if (key === 'id' || key.endsWith('_id')) {
                    th.classList.add('col-id');
                } else if (key.includes('date') || key.includes('time') || key.includes('created') || key.includes('updated')) {
                    th.classList.add('col-date');
                } else if (key.includes('type')) {
                    th.classList.add('col-type');
                } else if (key.includes('status') || key.includes('state')) {
                    th.classList.add('col-status');
                } else if (key.includes('is_') || key === 'active' || key === 'enabled') {
                    th.classList.add('col-boolean');
                } else if (key.includes('description') || key.includes('desc')) {
                    th.classList.add('col-description');
                } else if (key.includes('content') || key.includes('text')) {
                    th.classList.add('col-text');
                } else if (key.includes('comment')) {
                    th.classList.add('col-comment');
                } else if (key.includes('note')) {
                    th.classList.add('col-note');
                } else if (key.includes('count') || key.includes('num') || key.includes('amount') || key.includes('total')) {
                    th.classList.add('col-count');
                } else if (key.includes('price') || key.includes('cost')) {
                    th.classList.add('col-price');
                } else if (key.includes('quantity') || key.includes('qty')) {
                    th.classList.add('col-quantity');
                } else if (key.includes('name') || key.includes('title')) {
                    th.classList.add('col-name');
                } else if (key.includes('username') || key.includes('user_name')) {
                    th.classList.add('col-username');
                } else if (key.includes('icon') || key.includes('symbol')) {
                    th.classList.add('col-icon');
                }
                
                headerRow.appendChild(th);
            });
            tableHeader.appendChild(headerRow);
            
            // 创建表体行
            data.forEach(row => {
                const tr = document.createElement('tr');
                
                columns.forEach(key => {
                    const value = row[key];
                    const td = document.createElement('td');
                    
                    // 根据列名添加相同的CSS类，确保与表头对齐
                    if (key === 'id' || key.endsWith('_id')) {
                        td.classList.add('col-id');
                    } else if (key.includes('date') || key.includes('time') || key.includes('created') || key.includes('updated')) {
                        td.classList.add('col-date');
                    } else if (key.includes('type')) {
                        td.classList.add('col-type');
                    } else if (key.includes('status') || key.includes('state')) {
                        td.classList.add('col-status');
                    } else if (key.includes('is_') || key === 'active' || key === 'enabled') {
                        td.classList.add('col-boolean');
                    } else if (key.includes('description') || key.includes('desc')) {
                        td.classList.add('col-description');
                    } else if (key.includes('content') || key.includes('text')) {
                        td.classList.add('col-text');
                    } else if (key.includes('comment')) {
                        td.classList.add('col-comment');
                    } else if (key.includes('note')) {
                        td.classList.add('col-note');
                    } else if (key.includes('count') || key.includes('num') || key.includes('amount') || key.includes('total')) {
                        td.classList.add('col-count');
                    } else if (key.includes('price') || key.includes('cost')) {
                        td.classList.add('col-price');
                    } else if (key.includes('quantity') || key.includes('qty')) {
                        td.classList.add('col-quantity');
                    } else if (key.includes('name') || key.includes('title')) {
                        td.classList.add('col-name');
                    } else if (key.includes('username') || key.includes('user_name')) {
                        td.classList.add('col-username');
                    } else if (key.includes('icon') || key.includes('symbol')) {
                        td.classList.add('col-icon');
                    }
                    
                    // 根据数据类型和内容优化显示
                    if (value === null) {
                        td.innerHTML = '<span class="null-value">NULL</span>';
                    } else if (typeof value === 'object') {
                        try {
                            const jsonStr = JSON.stringify(value, null, 2);
                            td.innerHTML = `<span class="text-secondary truncated-text" 
                                title="${jsonStr.replace(/"/g, '&quot;')}">${jsonStr.substring(0, 50)}${jsonStr.length > 50 ? '...' : ''}</span>`;
                        } catch (e) {
                            td.innerHTML = '<span class="badge bg-secondary">复杂对象</span>';
                        }
                    } else if (typeof value === 'boolean') {
                        td.innerHTML = value ? 
                            '<span class="badge bg-success">是</span>' : 
                            '<span class="badge bg-danger">否</span>';
                    } else if (key.includes('time') || key.includes('date') || key.includes('created') || key.includes('updated')) {
                        // 日期时间格式化
                        try {
                            const date = new Date(value);
                            if (!isNaN(date)) {
                                td.innerHTML = `<span class="text-muted" title="${date.toLocaleString()}">${date.toLocaleString()}</span>`;
                            } else {
                                td.textContent = value;
                            }
                        } catch (e) {
                            td.textContent = value;
                        }
                    } else if (key === 'id' || key.endsWith('_id')) {
                        // ID列格式化
                        td.innerHTML = `<span class="badge" style="background-color: var(--primary-color);">${value}</span>`;
                    } else if (key.includes('email')) {
                        // 邮箱格式化
                        td.innerHTML = `<a href="mailto:${value}" class="text-primary">${value}</a>`;
                    } else if (key.includes('status')) {
                        // 状态格式化
                        let statusClass = 'bg-secondary';
                        if (/active|enabled|success|1|true/i.test(String(value))) {
                            statusClass = 'bg-success';
                        } else if (/inactive|disabled|failed|0|false/i.test(String(value))) {
                            statusClass = 'bg-danger';
                        } else if (/pending|waiting/i.test(String(value))) {
                            statusClass = 'bg-warning';
                        }
                        td.innerHTML = `<span class="badge ${statusClass}">${value}</span>`;
                    } else if (key.includes('url') || key.includes('link') || key.includes('website')) {
                        // URL格式化
                        if (String(value).startsWith('http')) {
                            td.innerHTML = `<a href="${value}" target="_blank" class="text-primary">${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}</a>`;
                        } else {
                            td.textContent = value;
                        }
                    } else if (key.includes('count') || key.includes('num') || key.includes('amount') || key.includes('total')) {
                        // 数字格式化
                        if (!isNaN(value)) {
                            td.textContent = Number(value).toLocaleString();
                            td.style.fontWeight = 'bold';
                        } else {
                            td.textContent = value;
                        }
                    } else if (key.includes('price') || key.includes('cost')) {
                        // 价格格式化
                        if (!isNaN(value)) {
                            td.textContent = `¥${Number(value).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                            td.style.fontWeight = 'bold';
                        } else {
                            td.textContent = value;
                        }
                    } else if (String(value).length > 100) {
                        // 长文本截断显示
                        td.innerHTML = `<span class="truncated-text" title="${String(value).replace(/"/g, '&quot;')}">${String(value).substring(0, 100)}...</span>`;
                    } else {
                        // 默认显示
                        td.textContent = value;
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
        
        // 首先为表结构表格的表头添加特定的CSS类
        const structureHeaders = document.querySelectorAll('#structure-table th');
        if (structureHeaders.length > 0) {
            structureHeaders[0].classList.add('col-key');    // 字段名称
            structureHeaders[1].classList.add('col-type');   // 数据类型
            structureHeaders[2].classList.add('col-boolean'); // 允许为空
            structureHeaders[3].classList.add('col-key');    // 键类型
            structureHeaders[4].classList.add('col-type');   // 默认值
            structureHeaders[5].classList.add('col-type');   // 其他属性
        }
        
        if (columns.length > 0) {
            columns.forEach(column => {
                const tr = document.createElement('tr');
                
                // 字段名
                const tdName = document.createElement('td');
                tdName.classList.add('col-key');
                tdName.innerHTML = `<span class="field-key">${column.Field}</span>`;
                tr.appendChild(tdName);
                
                // 字段类型
                const tdType = document.createElement('td');
                tdType.classList.add('col-type');
                tdType.innerHTML = `<span class="field-type">${column.Type}</span>`;
                tr.appendChild(tdType);
                
                // 可为空
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
                    tdKey.innerHTML = `<span class="badge" style="background-color: var(--primary-color);">主键</span>`;
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
                    tdDefault.innerHTML = `<span class="null-value">NULL</span>`;
                } else {
                    tdDefault.textContent = column.Default;
                }
                tr.appendChild(tdDefault);
                
                // 额外属性
                const tdExtra = document.createElement('td');
                tdExtra.classList.add('col-type');
                if (column.Extra) {
                    if (column.Extra.includes('auto_increment')) {
                        tdExtra.innerHTML = `<span class="badge bg-secondary">自动递增</span>`;
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
                    <table class="table table-striped table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                ${columns.map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                data.forEach(row => {
                    tableHtml += '<tr>';
                    columns.forEach(col => {
                        const value = row[col];
                        if (value === null) {
                            tableHtml += '<td><span class="text-muted">NULL</span></td>';
                        } else if (typeof value === 'object') {
                            tableHtml += `<td>${JSON.stringify(value)}</td>`;
                        } else {
                            tableHtml += `<td>${value}</td>`;
                        }
                    });
                    tableHtml += '</tr>';
                });
                
                tableHtml += '</tbody></table>';
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