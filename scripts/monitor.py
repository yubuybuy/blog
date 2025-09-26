#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统健康检查和监控工具
"""

import asyncio
import json
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

class SystemMonitor:
    """系统监控器"""

    def __init__(self):
        self.db_path = "data/netdisk_links.db"
        self.config_path = "config/telegram_config.json"

    def check_database(self):
        """检查数据库状态"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # 检查表是否存在
                cursor = conn.execute("""
                    SELECT name FROM sqlite_master
                    WHERE type='table' AND name='netdisk_links'
                """)
                if not cursor.fetchone():
                    return False, "数据库表不存在"

                # 检查最近的数据
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM netdisk_links
                    WHERE created_at > datetime('now', '-24 hours')
                """)
                recent_count = cursor.fetchone()[0]

                # 检查各状态统计
                cursor = conn.execute("""
                    SELECT status, COUNT(*) FROM netdisk_links
                    GROUP BY status
                """)
                status_stats = dict(cursor.fetchall())

                return True, {
                    "recent_24h": recent_count,
                    "status_stats": status_stats
                }

        except Exception as e:
            return False, f"数据库错误: {e}"

    def check_config(self):
        """检查配置文件"""
        try:
            if not Path(self.config_path).exists():
                return False, "配置文件不存在"

            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            required_keys = ['bot_token', 'chat_ids']
            missing_keys = [key for key in required_keys if not config.get(key)]

            if missing_keys:
                return False, f"缺少配置项: {missing_keys}"

            return True, "配置文件正常"

        except Exception as e:
            return False, f"配置文件错误: {e}"

    def check_services(self):
        """检查服务运行状态"""
        import psutil

        processes = {
            'telegram_listener': False,
            'web_server': False
        }

        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or [])

                if 'telegram_listener.py' in cmdline:
                    processes['telegram_listener'] = proc.info['pid']
                elif 'npm run dev' in cmdline or 'next dev' in cmdline:
                    processes['web_server'] = proc.info['pid']

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return processes

    def get_system_stats(self):
        """获取系统统计"""
        import psutil

        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('.').percent,
            "uptime": psutil.boot_time()
        }

    async def run_health_check(self):
        """运行健康检查"""
        print("🔍 系统健康检查开始...")
        print("=" * 50)

        # 检查数据库
        db_ok, db_result = self.check_database()
        if db_ok:
            print(f"✅ 数据库: 正常")
            if isinstance(db_result, dict):
                print(f"   📊 最近24小时: {db_result['recent_24h']} 条链接")
                for status, count in db_result['status_stats'].items():
                    print(f"   📈 {status}: {count} 条")
        else:
            print(f"❌ 数据库: {db_result}")

        # 检查配置
        config_ok, config_result = self.check_config()
        if config_ok:
            print(f"✅ 配置文件: 正常")
        else:
            print(f"❌ 配置文件: {config_result}")

        # 检查服务
        services = self.check_services()
        print(f"\n📊 服务状态:")
        for service, pid in services.items():
            if pid:
                print(f"   ✅ {service}: 运行中 (PID: {pid})")
            else:
                print(f"   ❌ {service}: 未运行")

        # 系统资源
        try:
            stats = self.get_system_stats()
            print(f"\n💻 系统资源:")
            print(f"   CPU: {stats['cpu_percent']:.1f}%")
            print(f"   内存: {stats['memory_percent']:.1f}%")
            print(f"   磁盘: {stats['disk_usage']:.1f}%")
        except ImportError:
            print(f"   ⚠️ 需要安装 psutil 查看系统资源")

        print("=" * 50)
        print("🎉 健康检查完成!")

    async def cleanup_old_data(self, days=30):
        """清理旧数据"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cutoff_date = datetime.now() - timedelta(days=days)

                cursor = conn.execute("""
                    DELETE FROM netdisk_links
                    WHERE created_at < ? AND status != 'pending'
                """, (cutoff_date.isoformat(),))

                deleted_count = cursor.rowcount
                conn.execute("VACUUM")

                print(f"🧹 清理完成: 删除了 {deleted_count} 条旧记录")

        except Exception as e:
            print(f"❌ 清理失败: {e}")

async def main():
    """主函数"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
    else:
        command = "check"

    monitor = SystemMonitor()

    if command == "check":
        await monitor.run_health_check()
    elif command == "cleanup":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        await monitor.cleanup_old_data(days)
    else:
        print("用法:")
        print("  python monitor.py check    # 健康检查")
        print("  python monitor.py cleanup [天数]  # 清理旧数据")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 监控程序退出")
    except Exception as e:
        print(f"❌ 程序异常: {e}")
        sys.exit(1)