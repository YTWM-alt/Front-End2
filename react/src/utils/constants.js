// 应用常量定义

// 应用配置
export const APP_CONFIG = {
  name: '未决定',
  description: 'AI智能驱动，连接全球知识资源',
  version: '1.0.0',
  author: 'AI Platform Team'
};

// 颜色主题常量
export const THEME_COLORS = {
  primary: '#4a6fe3',
  primaryDark: '#3d5cc4',
  primaryLight: '#5c8aff',
  secondary: '#20b2aa',
  light: '#f7f9ff',
  dark: '#222a45',
  gray: '#6b7a8e',
  lightBorder: '#e0e7ff',
  success: '#48c774',
  error: '#ff3860',
  warning: '#ffa500'
};

// 本地存储键名
export const STORAGE_KEYS = {
  user: 'ai_platform_user',
  token: 'ai_platform_token',
  language: 'language',
  theme: 'ai_platform_theme',
  chatHistory: 'chatHistory',
  settings: 'ai_platform_settings'
};

// 用户状态常量
export const USER_STATUS = {
  LOGGED_OUT: 'logged_out',
  LOGGED_IN: 'logged_in',
  LOADING: 'loading'
};

// 模态框类型
export const MODAL_TYPES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password'
};

// 通知类型
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 消息类型
export const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system'
};

// 语言选项
export const LANGUAGES = {
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳'
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  }
};

// 导航菜单项
export const NAV_ITEMS = [
  { key: 'videos', label: '我的视频', path: '/videos' },
  { key: 'community', label: '社区', path: '/community' },
  { key: 'feedback', label: '问题反馈', path: '/feedback' }
];

// 用户下拉菜单项
export const USER_MENU_ITEMS = [
  { key: 'profile', label: '个人中心', icon: 'fas fa-user' },
  // { key: 'settings', label: '账户设置', icon: 'fas fa-cog' }, // 隐藏账户设置
  // { key: 'history', label: '历史记录', icon: 'fas fa-history' }, // 隐藏历史记录
  { key: 'logout', label: '退出登录', icon: 'fas fa-sign-out-alt', className: 'logout' }
];



// 搜索占位符文本
export const SEARCH_PLACEHOLDERS = [
  "输入主题如：三角形、函数、历史事件...",
  "尝试搜索：物理原理、数学公式、编程概念...",
  "探索知识：化学反应、生物进化、天文现象...",
  "学习内容：文学作品、历史人物、艺术技巧..."
];

// 视频示例数据
export const SAMPLE_VIDEO = {
  title: "三角形的基本性质",
  description: "三角形是由同一平面内不在同一直线上的三条线段首尾顺次连接所组成的封闭图形。它是几何学中最基本的图形之一，具有内角和为180度、任意两边之和大于第三边等重要性质。",
  duration: "02:42",
  currentTime: "0:00",
  thumbnail: "https://cdn.pixabay.com/photo/2017/01/25/17/35/background-2008590_1280.jpg",
  source: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
};

// 验证规则
export const VALIDATION_RULES = {
  email: {
    required: '请输入电子邮件',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: '请输入有效的电子邮件地址'
  },
  password: {
    required: '请输入密码',
    minLength: 6,
    minLengthMessage: '密码长度不能少于6位'
  },
  name: {
    required: '请输入用户名',
    minLength: 2,
    minLengthMessage: '用户名至少需要2个字符'
  }
};

// 动画配置
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 600
  },
  easing: {
    default: 'ease',
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
}; 