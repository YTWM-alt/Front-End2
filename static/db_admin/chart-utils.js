/**
 * 数据可视化工具函数
 */

/**
 * 创建一个渐变背景
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} colorStart - 起始颜色
 * @param {string} colorEnd - 结束颜色
 * @returns {CanvasGradient} - 渐变对象
 */
function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

/**
 * 创建柱状图
 * @param {string} canvasId - Canvas元素ID
 * @param {Array} labels - 标签数组
 * @param {Array} data - 数据数组
 * @param {string} title - 图表标题
 */
function createBarChart(canvasId, labels, data, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 检查是否已存在图表实例，如果有则销毁
    if (window[canvasId + 'Chart'] instanceof Chart) {
        window[canvasId + 'Chart'].destroy();
    }
    
    // 创建颜色数组
    const colors = [
        createGradient(ctx, 'rgba(78, 115, 223, 0.8)', 'rgba(78, 115, 223, 0.2)'),
        createGradient(ctx, 'rgba(28, 200, 138, 0.8)', 'rgba(28, 200, 138, 0.2)'),
        createGradient(ctx, 'rgba(54, 185, 204, 0.8)', 'rgba(54, 185, 204, 0.2)'),
        createGradient(ctx, 'rgba(246, 194, 62, 0.8)', 'rgba(246, 194, 62, 0.2)'),
        createGradient(ctx, 'rgba(231, 74, 59, 0.8)', 'rgba(231, 74, 59, 0.2)')
    ];
    
    // 创建新的图表
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0,
                borderRadius: 5,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * 创建折线图
 * @param {string} canvasId - Canvas元素ID
 * @param {Array} labels - 标签数组
 * @param {Array} datasets - 数据集数组，每个数据集包含label、data和borderColor
 * @param {string} title - 图表标题
 */
function createLineChart(canvasId, labels, datasets, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 检查是否已存在图表实例，如果有则销毁
    if (window[canvasId + 'Chart'] instanceof Chart) {
        window[canvasId + 'Chart'].destroy();
    }
    
    // 处理数据集
    const chartDatasets = datasets.map((dataset, index) => {
        const colors = [
            '#4e73df',
            '#1cc88a',
            '#36b9cc',
            '#f6c23e',
            '#e74a3b'
        ];
        
        return {
            label: dataset.label,
            data: dataset.data,
            borderColor: dataset.borderColor || colors[index % colors.length],
            backgroundColor: `rgba(${parseInt(colors[index % colors.length].slice(1, 3), 16)}, ${parseInt(colors[index % colors.length].slice(3, 5), 16)}, ${parseInt(colors[index % colors.length].slice(5, 7), 16)}, 0.05)`,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: dataset.borderColor || colors[index % colors.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });
    
    // 创建新的图表
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: title ? true : false,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * 创建饼图/环形图
 * @param {string} canvasId - Canvas元素ID
 * @param {Array} labels - 标签数组
 * @param {Array} data - 数据数组
 * @param {string} title - 图表标题
 * @param {boolean} isDoughnut - 是否为环形图
 */
function createPieChart(canvasId, labels, data, title, isDoughnut = false) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 检查是否已存在图表实例，如果有则销毁
    if (window[canvasId + 'Chart'] instanceof Chart) {
        window[canvasId + 'Chart'].destroy();
    }
    
    // 创建颜色数组
    const colors = [
        '#4e73df',
        '#1cc88a',
        '#36b9cc',
        '#f6c23e',
        '#e74a3b',
        '#858796',
        '#5a5c69',
        '#3d63d2',
        '#19b37e',
        '#2aa6b9'
    ];
    
    // 创建新的图表
    window[canvasId + 'Chart'] = new Chart(ctx, {
        type: isDoughnut ? 'doughnut' : 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                hoverOffset: 10,
                borderWidth: 5,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: title ? true : false,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            cutout: isDoughnut ? '70%' : 0
        }
    });
}

/**
 * 根据表数据生成图表
 * @param {string} canvasId - Canvas元素ID
 * @param {Array} data - 表数据
 * @param {string} labelField - 标签字段名
 * @param {string} valueField - 值字段名
 * @param {string} chartType - 图表类型 (bar, line, pie, doughnut)
 * @param {string} title - 图表标题
 */
function createTableDataChart(canvasId, data, labelField, valueField, chartType, title) {
    if (!data || data.length === 0) {
        return;
    }
    
    // 提取标签和数据
    const labels = data.map(item => item[labelField]);
    const values = data.map(item => item[valueField]);
    
    // 根据图表类型创建不同的图表
    switch (chartType) {
        case 'bar':
            createBarChart(canvasId, labels, values, title);
            break;
        case 'line':
            createLineChart(canvasId, labels, [{
                label: title,
                data: values
            }], title);
            break;
        case 'pie':
            createPieChart(canvasId, labels, values, title, false);
            break;
        case 'doughnut':
            createPieChart(canvasId, labels, values, title, true);
            break;
        default:
            console.error('未知的图表类型:', chartType);
    }
}

/**
 * 生成数据统计卡片
 * @param {string} containerId - 容器元素ID
 * @param {Array} stats - 统计数据数组，每个统计包含title、value、icon、color
 */
function createStatsCards(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
    container.innerHTML = '';
    
    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = `col-xl-3 col-md-6 mb-4`;
        
        card.innerHTML = `
            <div class="card stats-card ${stat.color || ''} h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">
                        <div class="col mr-2">
                            <div class="text-xs font-weight-bold text-${stat.color || 'primary'} text-uppercase mb-1">
                                ${stat.title}</div>
                            <div class="h5 mb-0 font-weight-bold text-gray-800">${stat.value}</div>
                        </div>
                        <div class="col-auto">
                            <i class="bi bi-${stat.icon || 'star-fill'} fa-2x text-gray-300" style="font-size: 2rem; color: #dddfeb;"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
} 