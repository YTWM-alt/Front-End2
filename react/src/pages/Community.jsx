// 社区页面组件
import React, { useState, useEffect } from 'react';
import './Community.css';

const Community = ({ authHook, showNotification, onNavigate }) => {
  // 社区数据状态
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'AI学习者',
      avatar: 'A',
      time: '2小时前',
      title: '如何更好地使用AI助手进行学习？',
      content: '最近在使用AI助手学习，想请教一下大家都有什么好的经验和技巧？特别是在学习效率方面...',
      likes: 15,
      comments: 8,
      tags: ['学习技巧', 'AI助手'],
      isLiked: false
    },
    {
      id: 2,
      author: '技术达人',
      avatar: '技',
      time: '4小时前',
      title: '分享一个AI视频生成的有趣案例',
      content: '今天用平台生成了一个很有意思的教学视频，效果超出预期！视频时长虽然不长，但内容很精准...',
      likes: 23,
      comments: 12,
      tags: ['视频生成', '案例分享'],
      isLiked: true
    },
    {
      id: 3,
      author: '新手小白',
      avatar: '新',
      time: '6小时前',
      title: '初次使用平台，有什么需要注意的吗？',
      content: '刚注册了账号，看到这个平台功能很强大，但是不太知道从哪里开始。希望有经验的朋友能给点建议～',
      likes: 9,
      comments: 18,
      tags: ['新手指南', '使用建议'],
      isLiked: false
    },
    {
      id: 4,
      author: '创意工作者',
      avatar: '创',
      time: '1天前',
      title: 'AI在创意工作中的应用心得',
      content: '作为一名设计师，AI工具极大地提升了我的工作效率。今天想和大家分享一些实际应用中的心得...',
      likes: 31,
      comments: 15,
      tags: ['创意应用', '工作效率'],
      isLiked: false
    },
    {
      id: 5,
      author: '求助学生',
      avatar: '求',
      time: '3小时前',
      title: '视频生成失败了，应该怎么解决？',
      content: '我在使用AI视频生成功能时遇到了问题，总是提示生成失败。请问有遇到过类似情况的朋友吗？应该如何解决？',
      likes: 5,
      comments: 12,
      tags: ['技术问题', '视频生成'],
      isLiked: false
    },
    {
      id: 6,
      author: '迷茫用户',
      avatar: '迷',
      time: '5小时前',
      title: '新用户应该如何快速上手这个平台？',
      content: '刚刚注册的新用户，看到功能很多但不知道从哪里开始。有没有详细的使用教程或者建议？',
      likes: 8,
      comments: 20,
      tags: ['新手问题', '使用指南'],
      isLiked: false
    },
    {
      id: 7,
      author: '技术小白',
      avatar: '技',
      time: '8小时前',
      title: '如何提高AI生成内容的质量？',
      content: '我发现我生成的内容质量不够理想，想请教一下有经验的用户，有什么技巧可以提高生成质量吗？',
      likes: 12,
      comments: 15,
      tags: ['使用技巧', '质量优化'],
      isLiked: false
    }
  ]);

  const [activeTab, setActiveTab] = useState('discussion');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // 处理点赞
  const handleLike = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked
            }
          : post
      )
    );
  };

  // 发布新帖子
  const handleSubmitPost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      showNotification('请填写标题和内容', 'error');
      return;
    }

    const newPost = {
      id: posts.length + 1,
      author: authHook.user.name || '用户',
      avatar: authHook.user.name ? authHook.user.name.charAt(0).toUpperCase() : 'U',
      time: '刚刚',
      title: newPostTitle,
      content: newPostContent,
      likes: 0,
      comments: 0,
      tags: ['讨论'],
      isLiked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostForm(false);
    showNotification('发布成功！', 'success');
  };

  // 过滤帖子
  const filteredPosts = posts.filter(post => {
    switch (activeTab) {
      case 'discussion':
        return true; // 显示所有讨论帖子
      case 'qa':
        return post.title.includes('？') || post.title.includes('?') || post.content.includes('？') || post.content.includes('?'); // 显示问答类帖子
      default:
        return true;
    }
  }).sort((a, b) => {
    // 按时间排序，最新的在前
    return 0; // 保持原顺序
  });

  // 处理返回并刷新
  const handleBackAndRefresh = () => {
    onNavigate('/');
    // 短暂延迟后刷新页面，确保导航完成
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="community-page">
      {/* 返回按钮 */}
      <button 
        className="back-btn"
        onClick={handleBackAndRefresh}
      >
        <i className="fas fa-arrow-left"></i>
        返回主页
      </button>

      {/* 页面标题 */}
      <div className="community-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="fas fa-users"></i>
            社区
          </h1>
          <p className="page-description">
            与其他用户交流分享，共同探索AI的无限可能
          </p>
        </div>
        <button 
          className="new-post-btn"
          onClick={() => setShowNewPostForm(!showNewPostForm)}
        >
          <i className="fas fa-plus"></i>
          发布新帖
        </button>
      </div>

      {/* 发布新帖表单 */}
      {showNewPostForm && (
        <div className="new-post-form">
          <div className="form-header">
            <h3>发布新帖子</h3>
            <button 
              className="close-form-btn"
              onClick={() => setShowNewPostForm(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="form-content">
            <input
              type="text"
              placeholder="请输入帖子标题..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              className="post-title-input"
            />
            <textarea
              placeholder="分享你的想法、经验或问题..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="post-content-input"
              rows="4"
            />
            <div className="form-actions">
              <button 
                className="submit-post-btn"
                onClick={handleSubmitPost}
              >
                <i className="fas fa-paper-plane"></i>
                发布帖子
              </button>
              <button 
                className="cancel-post-btn"
                onClick={() => setShowNewPostForm(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 社区导航标签 */}
      <div className="community-tabs">
        <button 
          className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussion')}
        >
          <i className="fas fa-comments"></i>
          讨论
        </button>
        <button 
          className={`tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
          onClick={() => setActiveTab('qa')}
        >
          <i className="fas fa-question-circle"></i>
          答疑
        </button>
      </div>

      {/* 帖子列表 */}
      <div className="posts-container">
        {filteredPosts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="author-info">
                <div className="author-avatar">
                  {post.avatar}
                </div>
                <div className="author-details">
                  <div className="author-name">{post.author}</div>
                  <div className="post-time">{post.time}</div>
                </div>
              </div>
            </div>
            
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-text">{post.content}</p>
              
              {post.tags && post.tags.length > 0 && (
                <div className="post-tags">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="post-actions">
              <button 
                className={`action-btn like-btn ${post.isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                <i className={post.isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                <span>{post.likes}</span>
              </button>
              
              <button className="action-btn comment-btn">
                <i className="far fa-comment"></i>
                <span>{post.comments}</span>
              </button>
              
              <button className="action-btn share-btn">
                <i className="fas fa-share"></i>
                分享
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 社区统计卡片 */}
      <div className="community-stats">
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>1,234</h3>
            <p>社区成员</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-comments"></i>
          </div>
          <div className="stat-info">
            <h3>5,678</h3>
            <p>讨论帖子</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stat-icon">
            <i className="fas fa-thumbs-up"></i>
          </div>
          <div className="stat-info">
            <h3>9,012</h3>
            <p>获得点赞</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community; 