#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统状态API服务
"""

import asyncio
import json
import sqlite3
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path


class SystemStatusAPI:
    """系统状态API"""

    def __init__(self):
        self.db_path = "data/netdisk_links.db"
        self.config_path = "config/telegram_config.json"

    async def get_system_status(self):
        """获取系统状态"""
        status = {
            "timestamp": datetime.now().isoformat(),
            "database": await self._check_database(),
            "services": await self._check_services(),
            "config": await self._check_config(),
            "statistics": await self._get_statistics()
        }
        return status

    async def _check_database(self):
        """检查数据库状态"""
        try:
            if not Path(self.db_path).exists():
                return {"status": "error", "message": "数据库文件不存在"}

            with sqlite3.connect(self.db_path) as conn:
                # 检查表结构
                cursor = conn.execute("SELECT sql FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()

                if not tables:
                    return {"status": "error", "message": "数据库表为空"}

                # 检查最近活动
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM netdisk_links
                    WHERE created_at > datetime('now', '-1 hour')
                """)
                recent_activity = cursor.fetchone()[0]

                return {
                    "status": "healthy",
                    "tables_count": len(tables),
                    "recent_activity": recent_activity
                }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def _check_services(self):
        """检查服务状态"""
        try:
            # 使用psutil检查进程
            import psutil

            services = {
                "telegram_listener": {"status": "stopped", "pid": None},
                "web_server": {"status": "stopped", "pid": None}
            }

            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = ' '.join(proc.info['cmdline'] or [])

                    if 'telegram_listener.py' in cmdline:
                        services['telegram_listener'] = {
                            "status": "running",
                            "pid": proc.info['pid'],
                            "memory_mb": round(proc.memory_info().rss / 1024 / 1024, 1)
                        }
                    elif 'next dev' in cmdline or 'node' in cmdline:
                        services['web_server'] = {
                            "status": "running",
                            "pid": proc.info['pid'],
                            "memory_mb": round(proc.memory_info().rss / 1024 / 1024, 1)
                        }

                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            return services

        except ImportError:
            return {"error": "需要安装psutil: pip install psutil"}

    async def _check_config(self):
        """检查配置状态"""
        config_status = {}

        # 检查Telegram配置
        try:
            if Path(self.config_path).exists():
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                config_status["telegram"] = {
                    "status": "configured" if config.get('bot_token') and config.get('chat_ids') else "incomplete",
                    "chat_count": len(config.get('chat_ids', [])),
                    "platforms": config.get('settings', {}).get('included_platforms', [])
                }
            else:
                config_status["telegram"] = {"status": "missing"}

        except Exception as e:
            config_status["telegram"] = {"status": "error", "message": str(e)}

        return config_status

    async def _get_statistics(self):
        """获取统计数据"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # 总数统计
                cursor = conn.execute("SELECT COUNT(*) FROM netdisk_links")
                total = cursor.fetchone()[0]

                # 状态统计
                cursor = conn.execute("""
                    SELECT status, COUNT(*) FROM netdisk_links
                    GROUP BY status
                """)
                status_stats = dict(cursor.fetchall())

                # 平台统计
                cursor = conn.execute("""
                    SELECT platform, COUNT(*) FROM netdisk_links
                    GROUP BY platform
                """)
                platform_stats = dict(cursor.fetchall())

                # 今日统计
                cursor = conn.execute("""
                    SELECT COUNT(*) FROM netdisk_links
                    WHERE created_at > datetime('now', '-1 day')
                """)
                today_count = cursor.fetchone()[0]

                return {
                    "total": total,
                    "status": status_stats,
                    "platforms": platform_stats,
                    "today": today_count
                }

        except Exception as e:
            return {"error": str(e)}


async def main():
    """主函数"""
    if len(sys.argv) > 1 and sys.argv[1] == "json":
        # 输出JSON格式的状态
        api = SystemStatusAPI()
        status = await api.get_system_status()
        print(json.dumps(status, ensure_ascii=False, indent=2))
    else:
        # 输出友好格式的状态
        from scripts.monitor import SystemMonitor
        monitor = SystemMonitor()
        await monitor.run_health_check()


if __name__ == "__main__":
    asyncio.run(main())