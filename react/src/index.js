import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

// 获取根元素并创建React根实例
const root = ReactDOM.createRoot(document.getElementById('root'));

// 渲染App组件到根元素
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 