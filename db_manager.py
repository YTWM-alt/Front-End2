#!/usr/bin/env python3
"""
未决定AI平台 - 数据库可视化管理工具
==========================================
功能：
- 数据库概览和统计
- 用户管理
- 视频管理
- 问题管理
- 反馈管理
- 数据导出
- 数据库维护
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import json

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Rich库用于美观的命令行界面
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.prompt import Prompt, Confirm
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import print as rprint
except ImportError:
    print("请安装rich库: pip install rich")
    sys.exit(1)

# 导入数据库相关模块
try:
    from app.config.database import get_db_session, close_db_session
    from app.models.user import User
    from app.models.video import Video
    from app.models.question import Question
    from app.models.feedback import Feedback, FeedbackType, FeedbackStatus, FeedbackPriority
    from app.app_config import Config
except ImportError as e:
    print(f"导入模块失败: {e}")
    print("请确保在项目根目录运行此脚本")
    sys.exit(1)

console = Console()

class DatabaseManager:
    """数据库管理类"""
    
    def __init__(self):
        self.db_session = None
        self.console = console
    
    def connect_db(self):
        """连接数据库"""
        try:
            self.db_session = get_db_session()
            return True
        except Exception as e:
            self.console.print(f"[red]数据库连接失败: {e}[/red]")
            return False
    
    def disconnect_db(self):
        """断开数据库连接"""
        if self.db_session:
            close_db_session(self.db_session)
            self.db_session = None
    
    def get_database_overview(self):
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
            self.console.print(f"[red]获取数据库概览失败: {e}[/red]")
            return None
    
    def show_overview(self):
        """显示数据库概览"""
        overview = self.get_database_overview()
        if not overview:
            return
        
        stats = overview['stats']
        recent = overview['recent']
        
        # 创建主要统计表格
        main_table = Table(title="📊 数据库概览", show_header=True, header_style="bold magenta")
        main_table.add_column("数据类型", style="cyan", width=12)
        main_table.add_column("总数", justify="right", style="green", width=8)
        main_table.add_column("已删除", justify="right", style="red", width=8)
        main_table.add_column("本周新增", justify="right", style="yellow", width=10)
        
        main_table.add_row("👥 用户", str(stats['users']), str(stats['deleted_users']), str(recent['new_users']))
        main_table.add_row("🎬 视频", str(stats['videos']), str(stats['deleted_videos']), str(recent['new_videos']))
        main_table.add_row("❓ 问题", str(stats['questions']), str(stats['deleted_questions']), str(recent['new_questions']))
        main_table.add_row("💬 反馈", str(stats['feedbacks']), str(stats['deleted_feedbacks']), str(recent['new_feedbacks']))
        
        # 创建存储空间信息
        try:
            video_dir = Config.VIDEO_DIR
            if video_dir.exists():
                video_files = list(video_dir.glob('*.mp4'))
                total_size = sum(f.stat().st_size for f in video_files)
                size_mb = total_size / (1024 * 1024)
                
                storage_info = Panel(
                    f"📁 视频存储: {len(video_files)} 个文件\n💾 总大小: {size_mb:.1f} MB",
                    title="存储信息",
                    border_style="blue"
                )
            else:
                storage_info = Panel("📁 视频目录不存在", title="存储信息", border_style="red")
        except Exception as e:
            storage_info = Panel(f"❌ 获取存储信息失败: {e}", title="存储信息", border_style="red")
        
        # 显示概览
        self.console.print()
        self.console.print(main_table)
        self.console.print()
        self.console.print(storage_info)
        self.console.print()
    
    def show_users(self, limit=10):
        """显示用户列表"""
        if not self.db_session:
            return
        
        try:
            users = self.db_session.query(User).filter_by(is_deleted=False)\
                .order_by(User.created_at.desc()).limit(limit).all()
            
            if not users:
                self.console.print("[yellow]没有找到用户[/yellow]")
                return
            
            table = Table(title=f"👥 用户列表 (最近 {len(users)} 个)", show_header=True, header_style="bold blue")
            table.add_column("ID", style="cyan", width=6)
            table.add_column("用户名", style="green", width=15)
            table.add_column("邮箱", style="yellow", width=25)
            table.add_column("注册时间", style="magenta", width=20)
            table.add_column("最后登录", style="white", width=20)
            table.add_column("状态", style="green", width=8)
            
            for user in users:
                last_login = user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else "从未登录"
                created_at = user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else "未知"
                status = "✅ 活跃" if user.is_active else "❌ 禁用"
                
                table.add_row(
                    str(user.id),
                    user.username[:12] + "..." if len(user.username) > 12 else user.username,
                    user.email,
                    created_at,
                    last_login,
                    status
                )
            
            self.console.print()
            self.console.print(table)
            self.console.print()
            
        except Exception as e:
            self.console.print(f"[red]获取用户列表失败: {e}[/red]")
    
    def show_videos(self, limit=10):
        """显示视频列表"""
        if not self.db_session:
            return
        
        try:
            videos = self.db_session.query(Video).filter_by(is_deleted=False)\
                .order_by(Video.created_at.desc()).limit(limit).all()
            
            if not videos:
                self.console.print("[yellow]没有找到视频[/yellow]")
                return
            
            table = Table(title=f"🎬 视频列表 (最近 {len(videos)} 个)", show_header=True, header_style="bold blue")
            table.add_column("ID", style="cyan", width=6)
            table.add_column("标题", style="green", width=20)
            table.add_column("格式", style="yellow", width=8)
            table.add_column("大小", style="magenta", width=10)
            table.add_column("时长", style="white", width=10)
            table.add_column("上传时间", style="cyan", width=20)
            table.add_column("状态", style="green", width=10)
            
            for video in videos:
                size_mb = video.file_size / (1024 * 1024) if video.file_size else 0
                duration_str = f"{int(video.duration)}s" if video.duration else "未知"
                created_at = video.created_at.strftime('%Y-%m-%d %H:%M') if video.created_at else "未知"
                
                table.add_row(
                    str(video.id),
                    video.title[:17] + "..." if len(video.title) > 17 else video.title,
                    video.format.upper(),
                    f"{size_mb:.1f}MB",
                    duration_str,
                    created_at,
                    video.status or "未知"
                )
            
            self.console.print()
            self.console.print(table)
            self.console.print()
            
        except Exception as e:
            self.console.print(f"[red]获取视频列表失败: {e}[/red]")
    
    def show_questions(self, limit=10):
        """显示问题列表"""
        if not self.db_session:
            return
        
        try:
            questions = self.db_session.query(Question).filter_by(is_deleted=False)\
                .order_by(Question.created_at.desc()).limit(limit).all()
            
            if not questions:
                self.console.print("[yellow]没有找到问题[/yellow]")
                return
            
            table = Table(title=f"❓ 问题列表 (最近 {len(questions)} 个)", show_header=True, header_style="bold blue")
            table.add_column("ID", style="cyan", width=6)
            table.add_column("标题", style="green", width=25)
            table.add_column("状态", style="yellow", width=10)
            table.add_column("优先级", style="magenta", width=8)
            table.add_column("浏览次数", style="white", width=10)
            table.add_column("创建时间", style="cyan", width=20)
            
            for question in questions:
                created_at = question.created_at.strftime('%Y-%m-%d %H:%M') if question.created_at else "未知"
                priority_map = {0: "普通", 1: "重要", 2: "紧急"}
                priority_str = priority_map.get(question.priority, "未知")
                
                table.add_row(
                    str(question.id),
                    question.title[:22] + "..." if len(question.title) > 22 else question.title,
                    question.status,
                    priority_str,
                    str(question.view_count),
                    created_at
                )
            
            self.console.print()
            self.console.print(table)
            self.console.print()
            
        except Exception as e:
            self.console.print(f"[red]获取问题列表失败: {e}[/red]")
    
    def show_feedbacks(self, limit=10):
        """显示反馈列表"""
        if not self.db_session:
            return
        
        try:
            feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=False)\
                .order_by(Feedback.created_at.desc()).limit(limit).all()
            
            if not feedbacks:
                self.console.print("[yellow]没有找到反馈[/yellow]")
                return
            
            table = Table(title=f"💬 反馈列表 (最近 {len(feedbacks)} 个)", show_header=True, header_style="bold blue")
            table.add_column("ID", style="cyan", width=6)
            table.add_column("标题", style="green", width=20)
            table.add_column("类型", style="yellow", width=10)
            table.add_column("优先级", style="magenta", width=8)
            table.add_column("状态", style="white", width=10)
            table.add_column("创建时间", style="cyan", width=20)
            
            for feedback in feedbacks:
                created_at = feedback.created_at.strftime('%Y-%m-%d %H:%M') if feedback.created_at else "未知"
                
                # 类型映射
                type_map = {
                    FeedbackType.BUG: "🐛 Bug",
                    FeedbackType.FEATURE: "✨ 功能",
                    FeedbackType.COMPLAINT: "😠 投诉",
                    FeedbackType.PRAISE: "👍 表扬",
                    FeedbackType.OTHER: "📝 其他"
                }
                type_str = type_map.get(feedback.type, "未知")
                
                # 优先级映射
                priority_map = {
                    FeedbackPriority.LOW: "低",
                    FeedbackPriority.MEDIUM: "中",
                    FeedbackPriority.HIGH: "高", 
                    FeedbackPriority.URGENT: "紧急"
                }
                priority_str = priority_map.get(feedback.priority, "未知")
                
                # 状态映射
                status_map = {
                    FeedbackStatus.PENDING: "⏳ 待处理",
                    FeedbackStatus.PROCESSING: "🔄 处理中",
                    FeedbackStatus.RESOLVED: "✅ 已解决",
                    FeedbackStatus.CLOSED: "❌ 已关闭"
                }
                status_str = status_map.get(feedback.status, "未知")
                
                table.add_row(
                    str(feedback.id),
                    feedback.title[:17] + "..." if len(feedback.title) > 17 else feedback.title,
                    type_str,
                    priority_str,
                    status_str,
                    created_at
                )
            
            self.console.print()
            self.console.print(table)
            self.console.print()
            
        except Exception as e:
            self.console.print(f"[red]获取反馈列表失败: {e}[/red]")
    
    def export_data(self):
        """导出数据"""
        if not self.db_session:
            return
        
        export_type = Prompt.ask(
            "选择导出类型",
            choices=["users", "videos", "questions", "feedbacks", "all"],
            default="all"
        )
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=self.console,
            ) as progress:
                
                if export_type in ["users", "all"]:
                    task = progress.add_task("导出用户数据...", total=None)
                    users = self.db_session.query(User).filter_by(is_deleted=False).all()
                    users_data = []
                    for user in users:
                        users_data.append({
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'is_active': user.is_active,
                            'created_at': user.created_at.isoformat() if user.created_at else None,
                            'last_login': user.last_login.isoformat() if user.last_login else None
                        })
                    
                    with open(f'users_export_{timestamp}.json', 'w', encoding='utf-8') as f:
                        json.dump(users_data, f, ensure_ascii=False, indent=2)
                    progress.update(task, completed=True)
                
                if export_type in ["videos", "all"]:
                    task = progress.add_task("导出视频数据...", total=None)
                    videos = self.db_session.query(Video).filter_by(is_deleted=False).all()
                    videos_data = []
                    for video in videos:
                        videos_data.append({
                            'id': video.id,
                            'title': video.title,
                            'file_path': video.file_path,
                            'file_size': video.file_size,
                            'format': video.format,
                            'duration': video.duration,
                            'status': video.status,
                            'user_id': video.user_id,
                            'created_at': video.created_at.isoformat() if video.created_at else None
                        })
                    
                    with open(f'videos_export_{timestamp}.json', 'w', encoding='utf-8') as f:
                        json.dump(videos_data, f, ensure_ascii=False, indent=2)
                    progress.update(task, completed=True)
                
                if export_type in ["questions", "all"]:
                    task = progress.add_task("导出问题数据...", total=None)
                    questions = self.db_session.query(Question).filter_by(is_deleted=False).all()
                    questions_data = []
                    for question in questions:
                        questions_data.append({
                            'id': question.id,
                            'title': question.title,
                            'content': question.content,
                            'status': question.status,
                            'priority': question.priority,
                            'view_count': question.view_count,
                            'answer_count': question.answer_count,
                            'user_id': question.user_id,
                            'created_at': question.created_at.isoformat() if question.created_at else None
                        })
                    
                    with open(f'questions_export_{timestamp}.json', 'w', encoding='utf-8') as f:
                        json.dump(questions_data, f, ensure_ascii=False, indent=2)
                    progress.update(task, completed=True)
                
                if export_type in ["feedbacks", "all"]:
                    task = progress.add_task("导出反馈数据...", total=None)
                    feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=False).all()
                    feedbacks_data = []
                    for feedback in feedbacks:
                        feedbacks_data.append({
                            'id': feedback.id,
                            'title': feedback.title,
                            'content': feedback.content,
                            'type': feedback.type.value if feedback.type else None,
                            'status': feedback.status.value if feedback.status else None,
                            'priority': feedback.priority.value if feedback.priority else None,
                            'user_id': feedback.user_id,
                            'handler_id': feedback.handler_id,
                            'handle_note': feedback.handle_note,
                            'created_at': feedback.created_at.isoformat() if feedback.created_at else None,
                            'handle_time': feedback.handle_time.isoformat() if feedback.handle_time else None
                        })
                    
                    with open(f'feedbacks_export_{timestamp}.json', 'w', encoding='utf-8') as f:
                        json.dump(feedbacks_data, f, ensure_ascii=False, indent=2)
                    progress.update(task, completed=True)
            
            self.console.print(f"[green]✅ 数据导出完成！文件保存为 *_export_{timestamp}.json[/green]")
            
        except Exception as e:
            self.console.print(f"[red]导出数据失败: {e}[/red]")
    
    def cleanup_deleted_data(self):
        """清理软删除的数据"""
        if not self.db_session:
            return
        
        # 获取软删除数据统计
        deleted_users = self.db_session.query(User).filter_by(is_deleted=True).count()
        deleted_videos = self.db_session.query(Video).filter_by(is_deleted=True).count()
        deleted_questions = self.db_session.query(Question).filter_by(is_deleted=True).count()
        deleted_feedbacks = self.db_session.query(Feedback).filter_by(is_deleted=True).count()
        
        if deleted_users + deleted_videos + deleted_questions + deleted_feedbacks == 0:
            self.console.print("[green]✅ 没有需要清理的数据[/green]")
            return
        
        # 显示将要清理的数据
        cleanup_table = Table(title="🗑️ 待清理的数据", show_header=True, header_style="bold red")
        cleanup_table.add_column("数据类型", style="cyan")
        cleanup_table.add_column("数量", justify="right", style="red")
        
        if deleted_users > 0:
            cleanup_table.add_row("用户", str(deleted_users))
        if deleted_videos > 0:
            cleanup_table.add_row("视频", str(deleted_videos))
        if deleted_questions > 0:
            cleanup_table.add_row("问题", str(deleted_questions))
        if deleted_feedbacks > 0:
            cleanup_table.add_row("反馈", str(deleted_feedbacks))
        
        self.console.print()
        self.console.print(cleanup_table)
        
        # 确认清理
        if not Confirm.ask("[red]⚠️ 确定要永久删除这些数据吗？此操作不可恢复！[/red]"):
            self.console.print("[yellow]操作已取消[/yellow]")
            return
        
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=self.console,
            ) as progress:
                
                if deleted_users > 0:
                    task = progress.add_task("清理用户数据...", total=None)
                    self.db_session.query(User).filter_by(is_deleted=True).delete()
                    progress.update(task, completed=True)
                
                if deleted_videos > 0:
                    task = progress.add_task("清理视频数据...", total=None)
                    self.db_session.query(Video).filter_by(is_deleted=True).delete()
                    progress.update(task, completed=True)
                
                if deleted_questions > 0:
                    task = progress.add_task("清理问题数据...", total=None)
                    self.db_session.query(Question).filter_by(is_deleted=True).delete()
                    progress.update(task, completed=True)
                
                if deleted_feedbacks > 0:
                    task = progress.add_task("清理反馈数据...", total=None)
                    self.db_session.query(Feedback).filter_by(is_deleted=True).delete()
                    progress.update(task, completed=True)
                
                task = progress.add_task("提交事务...", total=None)
                self.db_session.commit()
                progress.update(task, completed=True)
            
            self.console.print("[green]✅ 数据清理完成！[/green]")
            
        except Exception as e:
            self.db_session.rollback()
            self.console.print(f"[red]数据清理失败: {e}[/red]")


def show_banner():
    """显示程序横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                    未决定AI平台                              ║
║                  数据库可视化管理工具                        ║
║                                                              ║
║  功能: 数据查看 • 用户管理 • 数据导出 • 系统维护            ║
╚══════════════════════════════════════════════════════════════╝
"""
    console.print(Panel(banner, style="bold blue"))


def show_menu():
    """显示主菜单"""
    menu_table = Table(show_header=False, box=None, padding=(0, 2))
    menu_table.add_column("选项", style="cyan", width=8)
    menu_table.add_column("功能", style="white")
    
    menu_table.add_row("1", "📊 数据库概览")
    menu_table.add_row("2", "👥 用户管理")
    menu_table.add_row("3", "🎬 视频管理") 
    menu_table.add_row("4", "❓ 问题管理")
    menu_table.add_row("5", "💬 反馈管理")
    menu_table.add_row("6", "📤 数据导出")
    menu_table.add_row("7", "🗑️ 数据清理")
    menu_table.add_row("0", "🚪 退出程序")
    
    console.print()
    console.print(Panel(menu_table, title="🔧 主菜单", border_style="green"))
    console.print()


def main():
    """主函数"""
    show_banner()
    
    # 初始化数据库管理器
    db_manager = DatabaseManager()
    
    # 连接数据库
    console.print("🔌 正在连接数据库...")
    if not db_manager.connect_db():
        console.print("[red]❌ 无法连接到数据库，程序退出[/red]")
        return
    
    console.print("[green]✅ 数据库连接成功[/green]")
    
    try:
        while True:
            show_menu()
            
            choice = Prompt.ask("请选择功能", choices=["0", "1", "2", "3", "4", "5", "6", "7"], default="1")
            
            if choice == "0":
                console.print("\n[green]👋 谢谢使用，再见！[/green]")
                break
            elif choice == "1":
                db_manager.show_overview()
            elif choice == "2":
                limit = Prompt.ask("显示用户数量", default="10")
                try:
                    limit = int(limit)
                    db_manager.show_users(limit)
                except ValueError:
                    console.print("[red]请输入有效的数字[/red]")
            elif choice == "3":
                limit = Prompt.ask("显示视频数量", default="10")
                try:
                    limit = int(limit)
                    db_manager.show_videos(limit)
                except ValueError:
                    console.print("[red]请输入有效的数字[/red]")
            elif choice == "4":
                limit = Prompt.ask("显示问题数量", default="10")
                try:
                    limit = int(limit)
                    db_manager.show_questions(limit)
                except ValueError:
                    console.print("[red]请输入有效的数字[/red]")
            elif choice == "5":
                limit = Prompt.ask("显示反馈数量", default="10")
                try:
                    limit = int(limit)
                    db_manager.show_feedbacks(limit)
                except ValueError:
                    console.print("[red]请输入有效的数字[/red]")
            elif choice == "6":
                db_manager.export_data()
            elif choice == "7":
                db_manager.cleanup_deleted_data()
            
            # 等待用户按键继续
            if choice != "0":
                console.print()
                Prompt.ask("按 [bold green]Enter[/bold green] 继续", default="")
    
    except KeyboardInterrupt:
        console.print("\n\n[yellow]👋 程序被用户中断，再见！[/yellow]")
    except Exception as e:
        console.print(f"\n[red]❌ 程序发生错误: {e}[/red]")
    finally:
        # 断开数据库连接
        db_manager.disconnect_db()
        console.print("[blue]🔌 数据库连接已断开[/blue]")


if __name__ == "__main__":
    main() 