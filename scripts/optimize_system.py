#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统性能优化工具
"""

import asyncio
import json
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path
import time


class SystemOptimizer:
    """系统优化器"""

    def __init__(self):
        self.db_path = "data/netdisk_links.db"
        self.optimization_results = {}

    async def optimize_database(self):
        """优化数据库"""
        print("🔧 优化数据库...")

        try:
            with sqlite3.connect(self.db_path) as conn:
                # 1. 分析数据库大小
                result = conn.execute("PRAGMA page_count").fetchone()
                page_count = result[0] if result else 0

                result = conn.execute("PRAGMA page_size").fetchone()
                page_size = result[0] if result else 0

                db_size_mb = (page_count * page_size) / 1024 / 1024

                # 2. 创建索引优化查询
                indexes = [
                    "CREATE INDEX IF NOT EXISTS idx_status ON netdisk_links(status)",
                    "CREATE INDEX IF NOT EXISTS idx_platform ON netdisk_links(platform)",
                    "CREATE INDEX IF NOT EXISTS idx_created_at ON netdisk_links(created_at)",
                    "CREATE INDEX IF NOT EXISTS idx_chat_id ON netdisk_links(chat_id)",
                    "CREATE INDEX IF NOT EXISTS idx_status_platform ON netdisk_links(status, platform)"
                ]

                for index_sql in indexes:
                    conn.execute(index_sql)

                # 3. 清理重复记录
                duplicate_query = '''
                    DELETE FROM netdisk_links
                    WHERE id NOT IN (
                        SELECT MIN(id)
                        FROM netdisk_links
                        GROUP BY url, platform
                    )
                '''
                cursor = conn.execute(duplicate_query)
                duplicates_removed = cursor.rowcount

                # 4. 清理过期失败记录
                cutoff_date = datetime.now() - timedelta(days=7)
                cleanup_query = '''
                    DELETE FROM netdisk_links
                    WHERE status = 'failed'
                    AND created_at < ?
                '''
                cursor = conn.execute(cleanup_query, (cutoff_date.isoformat(),))
                old_failed_removed = cursor.rowcount

                # 5. 重建数据库（压缩）
                conn.execute("VACUUM")

                # 6. 分析表统计信息
                conn.execute("ANALYZE")

                self.optimization_results["数据库优化"] = {
                    "原始大小MB": round(db_size_mb, 2),
                    "清理重复记录": duplicates_removed,
                    "清理过期失败记录": old_failed_removed,
                    "创建索引": len(indexes),
                    "状态": "✅ 完成"
                }

                print(f"  ✅ 数据库优化完成")
                print(f"    📊 原始大小: {db_size_mb:.2f}MB")
                print(f"    🗑️ 清理重复记录: {duplicates_removed}条")
                print(f"    🗑️ 清理过期失败记录: {old_failed_removed}条")
                print(f"    📈 创建索引: {len(indexes)}个")

        except Exception as e:
            self.optimization_results["数据库优化"] = {
                "状态": "❌ 失败",
                "错误": str(e)
            }
            print(f"  ❌ 数据库优化失败: {e}")

    async def optimize_logs(self):
        """优化日志文件"""
        print("🔧 优化日志文件...")

        try:
            logs_dir = Path("logs")
            if not logs_dir.exists():
                logs_dir.mkdir()

            total_size = 0
            cleaned_files = 0
            archived_files = 0

            for log_file in logs_dir.glob("*.log"):
                file_size = log_file.stat().st_size
                total_size += file_size

                # 如果日志文件超过10MB，进行归档
                if file_size > 10 * 1024 * 1024:  # 10MB
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    archive_name = f"{log_file.stem}_{timestamp}.log"
                    archive_path = logs_dir / "archive" / archive_name

                    # 创建归档目录
                    archive_path.parent.mkdir(exist_ok=True)

                    # 移动文件到归档
                    log_file.rename(archive_path)
                    archived_files += 1

            # 清理超过30天的归档文件
            archive_dir = logs_dir / "archive"
            if archive_dir.exists():
                cutoff_time = time.time() - (30 * 24 * 3600)  # 30天前

                for archive_file in archive_dir.glob("*.log"):
                    if archive_file.stat().st_mtime < cutoff_time:
                        archive_file.unlink()
                        cleaned_files += 1

            self.optimization_results["日志优化"] = {
                "总大小MB": round(total_size / 1024 / 1024, 2),
                "归档文件": archived_files,
                "清理文件": cleaned_files,
                "状态": "✅ 完成"
            }

            print(f"  ✅ 日志优化完成")
            print(f"    📊 总大小: {total_size / 1024 / 1024:.2f}MB")
            print(f"    📦 归档文件: {archived_files}个")
            print(f"    🗑️ 清理文件: {cleaned_files}个")

        except Exception as e:
            self.optimization_results["日志优化"] = {
                "状态": "❌ 失败",
                "错误": str(e)
            }
            print(f"  ❌ 日志优化失败: {e}")

    async def optimize_config(self):
        """优化配置文件"""
        print("🔧 优化配置文件...")

        try:
            optimizations = []

            # 检查Telegram配置
            config_path = "config/telegram_config.json"
            if Path(config_path).exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)

                # 优化设置
                settings = config.get('settings', {})

                # 建议优化项
                suggestions = {
                    'max_links_per_message': 5,  # 减少每条消息处理的链接数
                    'auto_extract_password': True,  # 自动提取密码
                    'batch_size': 3,  # 批量处理大小
                    'retry_failed_after_hours': 24  # 重试失败链接的间隔
                }

                updated = False
                for key, value in suggestions.items():
                    if key not in settings:
                        settings[key] = value
                        optimizations.append(f"添加{key}设置")
                        updated = True

                if updated:
                    config['settings'] = settings
                    with open(config_path, 'w', encoding='utf-8') as f:
                        json.dump(config, f, ensure_ascii=False, indent=2)

            # 创建性能配置文件
            performance_config = {
                "database": {
                    "connection_timeout": 30,
                    "query_timeout": 10,
                    "max_connections": 5
                },
                "transfer": {
                    "concurrent_transfers": 3,
                    "retry_attempts": 3,
                    "retry_delay_seconds": 5,
                    "batch_delay_seconds": 2
                },
                "monitoring": {
                    "health_check_interval": 300,
                    "log_rotation_days": 30,
                    "alert_thresholds": {
                        "failed_rate_percent": 50,
                        "memory_usage_mb": 500
                    }
                }
            }

            perf_config_path = "config/performance_config.json"
            with open(perf_config_path, 'w', encoding='utf-8') as f:
                json.dump(performance_config, f, ensure_ascii=False, indent=2)

            optimizations.append("创建性能配置文件")

            self.optimization_results["配置优化"] = {
                "优化项": optimizations,
                "状态": "✅ 完成"
            }

            print(f"  ✅ 配置优化完成")
            for opt in optimizations:
                print(f"    📝 {opt}")

        except Exception as e:
            self.optimization_results["配置优化"] = {
                "状态": "❌ 失败",
                "错误": str(e)
            }
            print(f"  ❌ 配置优化失败: {e}")

    async def create_maintenance_script(self):
        """创建维护脚本"""
        print("🔧 创建维护脚本...")

        try:
            maintenance_script = '''#!/bin/bash
# 系统维护脚本
# 定期运行此脚本进行系统维护

echo "🔧 开始系统维护..."

# 1. 数据库优化
echo "优化数据库..."
python3 scripts/optimize_system.py database

# 2. 清理日志
echo "清理日志..."
python3 scripts/optimize_system.py logs

# 3. 系统健康检查
echo "系统健康检查..."
python3 scripts/monitor.py check

# 4. 清理临时文件
echo "清理临时文件..."
find . -name "*.tmp" -delete
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "✅ 系统维护完成"
'''

            script_path = "scripts/maintenance.sh"
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(maintenance_script)

            # 设置执行权限 (Unix系统)
            import os
            os.chmod(script_path, 0o755)

            # 创建Windows批处理文件
            windows_script = '''@echo off
REM 系统维护脚本 - Windows版本

echo 🔧 开始系统维护...

REM 1. 数据库优化
echo 优化数据库...
python scripts\\optimize_system.py database

REM 2. 清理日志
echo 清理日志...
python scripts\\optimize_system.py logs

REM 3. 系统健康检查
echo 系统健康检查...
python scripts\\monitor.py check

REM 4. 清理临时文件
echo 清理临时文件...
del /S /Q *.tmp 2>nul
del /S /Q *.pyc 2>nul
for /D /R %%d in (__pycache__) do @if exist "%%d" rd /S /Q "%%d"

echo ✅ 系统维护完成
pause
'''

            windows_script_path = "scripts/maintenance.bat"
            with open(windows_script_path, 'w', encoding='utf-8') as f:
                f.write(windows_script)

            self.optimization_results["维护脚本"] = {
                "创建文件": [script_path, windows_script_path],
                "状态": "✅ 完成"
            }

            print(f"  ✅ 维护脚本创建完成")
            print(f"    📄 Linux/Mac: {script_path}")
            print(f"    📄 Windows: {windows_script_path}")

        except Exception as e:
            self.optimization_results["维护脚本"] = {
                "状态": "❌ 失败",
                "错误": str(e)
            }
            print(f"  ❌ 维护脚本创建失败: {e}")

    async def generate_optimization_report(self):
        """生成优化报告"""
        print("\n📊 生成优化报告...")

        report = {
            "timestamp": datetime.now().isoformat(),
            "optimizations": self.optimization_results
        }

        # 保存报告
        report_path = "logs/optimization_report.json"
        Path("logs").mkdir(exist_ok=True)

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        # 统计
        total_optimizations = len(self.optimization_results)
        successful = len([r for r in self.optimization_results.values()
                         if r.get("状态") == "✅ 完成"])

        print("="*50)
        print("📊 系统优化报告")
        print("="*50)
        print(f"🎯 总优化项: {total_optimizations}")
        print(f"✅ 成功: {successful}")
        print(f"❌ 失败: {total_optimizations - successful}")

        print("\n📋 详细结果:")
        for name, result in self.optimization_results.items():
            print(f"  {result['状态']} {name}")
            if "错误" in result:
                print(f"    🔴 {result['错误']}")

        print(f"\n📄 详细报告: {report_path}")
        print("="*50)

    async def run_optimization(self, mode="all"):
        """运行优化"""
        print("🚀 开始系统优化...")

        if mode == "all" or mode == "database":
            await self.optimize_database()

        if mode == "all" or mode == "logs":
            await self.optimize_logs()

        if mode == "all" or mode == "config":
            await self.optimize_config()

        if mode == "all":
            await self.create_maintenance_script()

        await self.generate_optimization_report()

        print("🎉 系统优化完成!")


async def main():
    """主函数"""
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    if mode not in ["all", "database", "logs", "config"]:
        print("用法:")
        print("  python optimize_system.py [all|database|logs|config]")
        sys.exit(1)

    optimizer = SystemOptimizer()
    await optimizer.run_optimization(mode)


if __name__ == "__main__":
    asyncio.run(main())