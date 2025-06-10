#!/usr/bin/env python3
"""
数据库GUI管理工具
===============
提供浮动窗口界面来管理数据库
"""

import tkinter as tk
from tkinter import ttk, messagebox
import json
from datetime import datetime, timedelta
from rich.console import Console
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.models.user import User
from app.models.video import Video
from app.models.question import Question
from app.models.feedback import Feedback
from app.config.database import DatabaseConfig, init_database

class DatabaseGUIManager:
    """数据库GUI管理器"""
    
    def __init__(self):
        """初始化GUI管理器"""
        self.console = Console()
        self.db_session = None
        
        # 创建主窗口
        self.root = tk.Tk()
        self.root.title("数据库管理工具")
        self.root.geometry("800x600")
        
        # 设置窗口样式
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # 创建主框架
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 创建菜单栏
        self.create_menu()
        
        # 创建主界面组件
        self.create_widgets()
        
        # 连接数据库
        self.connect_db()

    def create_menu(self):
        """创建菜单栏"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # 文件菜单
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="文件", menu=file_menu)
        file_menu.add_command(label="导出数据", command=self.export_data)
        file_menu.add_separator()
        file_menu.add_command(label="退出", command=self.root.quit)
        
        # 视图菜单
        view_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="视图", menu=view_menu)
        view_menu.add_command(label="刷新", command=self.refresh_data)
        
        # 工具菜单
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="工具", menu=tools_menu)
        tools_menu.add_command(label="数据清理", command=self.clean_data)
        
        # 帮助菜单
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="帮助", menu=help_menu)
        help_menu.add_command(label="关于", command=self.show_about)

    def create_widgets(self):
        """创建主界面组件"""
        # 创建选项卡
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # 概览选项卡
        self.overview_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.overview_frame, text="数据库概览")
        self.create_overview_widgets()
        
        # 用户管理选项卡
        self.users_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.users_frame, text="用户管理")
        self.create_users_widgets()
        
        # 视频管理选项卡
        self.videos_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.videos_frame, text="视频管理")
        self.create_videos_widgets()
        
        # 问题管理选项卡
        self.questions_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.questions_frame, text="问题管理")
        self.create_questions_widgets()
        
        # 反馈管理选项卡
        self.feedback_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.feedback_frame, text="反馈管理")
        self.create_feedback_widgets()

    def create_overview_widgets(self):
        """创建概览选项卡的组件"""
        # 统计信息框架
        stats_frame = ttk.LabelFrame(self.overview_frame, text="数据统计", padding="10")
        stats_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 统计信息标签
        self.stats_labels = {}
        stats = ["用户总数", "视频总数", "问题总数", "反馈总数",
                "已删除用户", "已删除视频", "已删除问题", "已删除反馈"]
        
        for i, stat in enumerate(stats):
            row = i // 2
            col = i % 2
            label = ttk.Label(stats_frame, text=f"{stat}:")
            label.grid(row=row, column=col*2, padx=5, pady=2, sticky=tk.E)
            value_label = ttk.Label(stats_frame, text="0")
            value_label.grid(row=row, column=col*2+1, padx=5, pady=2, sticky=tk.W)
            self.stats_labels[stat] = value_label
        
        # 最近活动框架
        recent_frame = ttk.LabelFrame(self.overview_frame, text="最近7天活动", padding="10")
        recent_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 最近活动标签
        self.recent_labels = {}
        recent = ["新增用户", "新增视频", "新增问题", "新增反馈"]
        
        for i, stat in enumerate(recent):
            label = ttk.Label(recent_frame, text=f"{stat}:")
            label.grid(row=i, column=0, padx=5, pady=2, sticky=tk.E)
            value_label = ttk.Label(recent_frame, text="0")
            value_label.grid(row=i, column=1, padx=5, pady=2, sticky=tk.W)
            self.recent_labels[stat] = value_label

    def create_users_widgets(self):
        """创建用户管理选项卡的组件"""
        # 创建工具栏
        toolbar = ttk.Frame(self.users_frame)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(toolbar, text="刷新", command=lambda: self.refresh_table("users")).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="导出", command=lambda: self.export_table("users")).pack(side=tk.LEFT, padx=2)
        
        # 创建表格
        columns = ("ID", "用户名", "邮箱", "注册时间", "最后登录", "状态")
        self.users_tree = ttk.Treeview(self.users_frame, columns=columns, show="headings")
        
        # 设置列标题
        for col in columns:
            self.users_tree.heading(col, text=col)
            self.users_tree.column(col, width=100)
        
        # 添加滚动条
        scrollbar = ttk.Scrollbar(self.users_frame, orient=tk.VERTICAL, command=self.users_tree.yview)
        self.users_tree.configure(yscrollcommand=scrollbar.set)
        
        # 放置组件
        self.users_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def create_videos_widgets(self):
        """创建视频管理选项卡的组件"""
        # 创建工具栏
        toolbar = ttk.Frame(self.videos_frame)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(toolbar, text="刷新", command=lambda: self.refresh_table("videos")).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="导出", command=lambda: self.export_table("videos")).pack(side=tk.LEFT, padx=2)
        
        # 创建表格
        columns = ("ID", "标题", "格式", "大小", "时长", "上传时间", "状态")
        self.videos_tree = ttk.Treeview(self.videos_frame, columns=columns, show="headings")
        
        # 设置列标题
        for col in columns:
            self.videos_tree.heading(col, text=col)
            self.videos_tree.column(col, width=100)
        
        # 添加滚动条
        scrollbar = ttk.Scrollbar(self.videos_frame, orient=tk.VERTICAL, command=self.videos_tree.yview)
        self.videos_tree.configure(yscrollcommand=scrollbar.set)
        
        # 放置组件
        self.videos_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def create_questions_widgets(self):
        """创建问题管理选项卡的组件"""
        # 创建工具栏
        toolbar = ttk.Frame(self.questions_frame)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(toolbar, text="刷新", command=lambda: self.refresh_table("questions")).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="导出", command=lambda: self.export_table("questions")).pack(side=tk.LEFT, padx=2)
        
        # 创建表格
        columns = ("ID", "标题", "状态", "优先级", "浏览次数", "创建时间")
        self.questions_tree = ttk.Treeview(self.questions_frame, columns=columns, show="headings")
        
        # 设置列标题
        for col in columns:
            self.questions_tree.heading(col, text=col)
            self.questions_tree.column(col, width=100)
        
        # 添加滚动条
        scrollbar = ttk.Scrollbar(self.questions_frame, orient=tk.VERTICAL, command=self.questions_tree.yview)
        self.questions_tree.configure(yscrollcommand=scrollbar.set)
        
        # 放置组件
        self.questions_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def create_feedback_widgets(self):
        """创建反馈管理选项卡的组件"""
        # 创建工具栏
        toolbar = ttk.Frame(self.feedback_frame)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Button(toolbar, text="刷新", command=lambda: self.refresh_table("feedback")).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="导出", command=lambda: self.export_table("feedback")).pack(side=tk.LEFT, padx=2)
        
        # 创建表格
        columns = ("ID", "标题", "类型", "优先级", "状态", "创建时间")
        self.feedback_tree = ttk.Treeview(self.feedback_frame, columns=columns, show="headings")
        
        # 设置列标题
        for col in columns:
            self.feedback_tree.heading(col, text=col)
            self.feedback_tree.column(col, width=100)
        
        # 添加滚动条
        scrollbar = ttk.Scrollbar(self.feedback_frame, orient=tk.VERTICAL, command=self.feedback_tree.yview)
        self.feedback_tree.configure(yscrollcommand=scrollbar.set)
        
        # 放置组件
        self.feedback_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def connect_db(self):
        """连接数据库"""
        try:
            _, SessionLocal = init_database()
            self.db_session = SessionLocal()
            self.refresh_data()
            messagebox.showinfo("成功", "数据库连接成功！")
        except Exception as e:
            messagebox.showerror("错误", f"数据库连接失败：{str(e)}")

    def refresh_data(self):
        """刷新所有数据"""
        if not self.db_session:
            return
        
        try:
            # 更新概览数据
            overview_data = self.get_database_overview()
            if overview_data:
                # 更新统计数据
                stats = overview_data['stats']
                self.stats_labels["用户总数"].config(text=str(stats['users']))
                self.stats_labels["视频总数"].config(text=str(stats['videos']))
                self.stats_labels["问题总数"].config(text=str(stats['questions']))
                self.stats_labels["反馈总数"].config(text=str(stats['feedbacks']))
                self.stats_labels["已删除用户"].config(text=str(stats['deleted_users']))
                self.stats_labels["已删除视频"].config(text=str(stats['deleted_videos']))
                self.stats_labels["已删除问题"].config(text=str(stats['deleted_questions']))
                self.stats_labels["已删除反馈"].config(text=str(stats['deleted_feedbacks']))
                
                # 更新最近活动数据
                recent = overview_data['recent']
                self.recent_labels["新增用户"].config(text=str(recent['new_users']))
                self.recent_labels["新增视频"].config(text=str(recent['new_videos']))
                self.recent_labels["新增问题"].config(text=str(recent['new_questions']))
                self.recent_labels["新增反馈"].config(text=str(recent['new_feedbacks']))
            
            # 刷新所有表格
            self.refresh_table("users")
            self.refresh_table("videos")
            self.refresh_table("questions")
            self.refresh_table("feedback")
            
        except Exception as e:
            messagebox.showerror("错误", f"刷新数据失败：{str(e)}")

    def refresh_table(self, table_name: str):
        """刷新指定表格的数据"""
        if not self.db_session:
            return
            
        try:
            if table_name == "users":
                # 清空现有数据
                for item in self.users_tree.get_children():
                    self.users_tree.delete(item)
                    
                # 获取用户数据
                users = self.db_session.query(User).filter_by(is_deleted=False).all()
                for user in users:
                    self.users_tree.insert("", tk.END, values=(
                        user.id,
                        user.username,
                        user.email,
                        user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else "从未登录",
                        "活跃" if user.is_active else "禁用"
                    ))
                    
            elif table_name == "videos":
                # 清空现有数据
                for item in self.videos_tree.get_children():
                    self.videos_tree.delete(item)
                    
                # 获取视频数据
                videos = self.db_session.query(Video).filter_by(is_deleted=False).all()
                for video in videos:
                    self.videos_tree.insert("", tk.END, values=(
                        video.id,
                        video.title,
                        video.format,
                        f"{video.size / 1024 / 1024:.2f}MB",
                        f"{video.duration:.2f}秒",
                        video.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        video.status
                    ))
                    
            elif table_name == "questions":
                # 清空现有数据
                for item in self.questions_tree.get_children():
                    self.questions_tree.delete(item)
                    
                # 获取问题数据
                questions = self.db_session.query(Question).filter_by(is_deleted=False).all()
                for question in questions:
                    self.questions_tree.insert("", tk.END, values=(
                        question.id,
                        question.title,
                        question.status,
                        question.priority,
                        question.view_count,
                        question.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    ))
                    
            elif table_name == "feedback":
                # 清空现有数据
                for item in self.feedback_tree.get_children():
                    self.feedback_tree.delete(item)
                    
                # 获取反馈数据
                feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=False).all()
                for feedback in feedbacks:
                    self.feedback_tree.insert("", tk.END, values=(
                        feedback.id,
                        feedback.title,
                        feedback.type,
                        feedback.priority,
                        feedback.status,
                        feedback.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    ))
                    
        except Exception as e:
            messagebox.showerror("错误", f"刷新{table_name}表格失败：{str(e)}")

    def get_database_overview(self) -> Optional[Dict[str, Any]]:
        """获取数据库概览"""
        if not self.db_session:
            return None
        
        try:
            stats = {
                'users': self.db_session.query(User).filter_by(is_deleted=False).count(),
                'videos': self.db_session.query(Video).filter_by(is_deleted=False).count(),
                'questions': self.db_session.query(Question).filter_by(is_deleted=False).count(),
                'feedbacks': self.db_session.query(Feedback).filter_by(is_deleted=False).count(),
                'deleted_users': self.db_session.query(User).filter_by(is_deleted=True).count(),
                'deleted_videos': self.db_session.query(Video).filter_by(is_deleted=True).count(),
                'deleted_questions': self.db_session.query(Question).filter_by(is_deleted=True).count(),
                'deleted_feedbacks': self.db_session.query(Feedback).filter_by(is_deleted=True).count(),
            }
            
            # 获取最近7天的活动统计
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_stats = {
                'new_users': self.db_session.query(User).filter(
                    User.created_at >= week_ago, 
                    User.is_deleted == False
                ).count(),
                'new_videos': self.db_session.query(Video).filter(
                    Video.created_at >= week_ago,
                    Video.is_deleted == False
                ).count(),
                'new_questions': self.db_session.query(Question).filter(
                    Question.created_at >= week_ago,
                    Question.is_deleted == False
                ).count(),
                'new_feedbacks': self.db_session.query(Feedback).filter(
                    Feedback.created_at >= week_ago,
                    Feedback.is_deleted == False
                ).count(),
            }
            
            return {'stats': stats, 'recent': recent_stats}
        except Exception as e:
            messagebox.showerror("错误", f"获取数据库概览失败：{str(e)}")
            return None

    def export_data(self):
        """导出所有数据"""
        try:
            data = {
                'users': self.export_table_data("users"),
                'videos': self.export_table_data("videos"),
                'questions': self.export_table_data("questions"),
                'feedback': self.export_table_data("feedback")
            }
            
            filename = f"database_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            messagebox.showinfo("成功", f"数据已导出到文件：{filename}")
        except Exception as e:
            messagebox.showerror("错误", f"导出数据失败：{str(e)}")

    def export_table(self, table_name: str):
        """导出指定表格的数据"""
        try:
            data = self.export_table_data(table_name)
            
            filename = f"{table_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            messagebox.showinfo("成功", f"数据已导出到文件：{filename}")
        except Exception as e:
            messagebox.showerror("错误", f"导出{table_name}数据失败：{str(e)}")

    def export_table_data(self, table_name: str) -> list:
        """获取指定表格的数据用于导出"""
        if not self.db_session:
            return []
            
        try:
            if table_name == "users":
                users = self.db_session.query(User).filter_by(is_deleted=False).all()
                return [{
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'created_at': user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    'last_login': user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else None,
                    'is_active': user.is_active
                } for user in users]
                
            elif table_name == "videos":
                videos = self.db_session.query(Video).filter_by(is_deleted=False).all()
                return [{
                    'id': video.id,
                    'title': video.title,
                    'format': video.format,
                    'size': video.size,
                    'duration': video.duration,
                    'created_at': video.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    'status': video.status
                } for video in videos]
                
            elif table_name == "questions":
                questions = self.db_session.query(Question).filter_by(is_deleted=False).all()
                return [{
                    'id': question.id,
                    'title': question.title,
                    'status': question.status,
                    'priority': question.priority,
                    'view_count': question.view_count,
                    'created_at': question.created_at.strftime("%Y-%m-%d %H:%M:%S")
                } for question in questions]
                
            elif table_name == "feedback":
                feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=False).all()
                return [{
                    'id': feedback.id,
                    'title': feedback.title,
                    'type': feedback.type,
                    'priority': feedback.priority,
                    'status': feedback.status,
                    'created_at': feedback.created_at.strftime("%Y-%m-%d %H:%M:%S")
                } for feedback in feedbacks]
                
            return []
        except Exception as e:
            messagebox.showerror("错误", f"获取{table_name}数据失败：{str(e)}")
            return []

    def clean_data(self):
        """清理已删除的数据"""
        if not self.db_session:
            return
            
        try:
            # 获取待清理的数据数量
            deleted_users = self.db_session.query(User).filter_by(is_deleted=True).count()
            deleted_videos = self.db_session.query(Video).filter_by(is_deleted=True).count()
            deleted_questions = self.db_session.query(Question).filter_by(is_deleted=True).count()
            deleted_feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=True).count()
            
            # 确认是否清理
            message = f"即将永久删除以下数据：\n\n" \
                     f"用户：{deleted_users}条\n" \
                     f"视频：{deleted_videos}条\n" \
                     f"问题：{deleted_questions}条\n" \
                     f"反馈：{deleted_feedbacks}条\n\n" \
                     f"此操作不可恢复，是否继续？"
                     
            if messagebox.askyesno("确认清理", message):
                # 执行清理
                self.db_session.query(User).filter_by(is_deleted=True).delete()
                self.db_session.query(Video).filter_by(is_deleted=True).delete()
                self.db_session.query(Question).filter_by(is_deleted=True).delete()
                self.db_session.query(Feedback).filter_by(is_deleted=True).delete()
                self.db_session.commit()
                
                messagebox.showinfo("成功", "数据清理完成！")
                self.refresh_data()
                
        except Exception as e:
            self.db_session.rollback()
            messagebox.showerror("错误", f"清理数据失败：{str(e)}")

    def show_about(self):
        """显示关于对话框"""
        about_text = """数据库可视化管理工具 v1.0.0

为"未决定AI平台"量身定制的数据库管理工具，
提供美观的图形界面来管理MySQL数据库中的数据。

© 2024 未决定AI平台团队"""
        messagebox.showinfo("关于", about_text)

    def run(self):
        """运行GUI程序"""
        self.root.mainloop()
        
        # 关闭数据库连接
        if self.db_session:
            self.db_session.close()


def main():
    """主函数"""
    app = DatabaseGUIManager()
    app.run()


if __name__ == "__main__":
    main() 