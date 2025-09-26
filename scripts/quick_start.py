#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网盘爬虫快速启动脚本
简化操作流程，一键完成爬取和转存
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# 添加脚本目录到路径
sys.path.append('scripts')

try:
    from comprehensive_crawler import run_comprehensive_crawl
    from batch_transfer import BatchTransferTool
except ImportError as e:
    print(f"❌ 导入模块失败: {e}")
    print("请确保在正确的项目目录中运行此脚本")
    sys.exit(1)


class QuickStart:
    """快速启动工具"""

    def __init__(self):
        self.csv_file = None

    def show_banner(self):
        """显示启动横幅"""
        print("="*60)
        print("🕷️  网盘资源爬虫 + 批量转存系统")
        print("="*60)
        print("📋 功能：自动爬取网盘资源并批量转存到夸克网盘")
        print("🚀 支持：夸克、百度、阿里云、天翼云、123网盘")
        print("="*60)

    def show_menu(self):
        """显示菜单"""
        print("\n📋 请选择操作:")
        print("1. 🕷️  运行爬虫收集资源")
        print("2. 📥  批量转存到夸克网盘")
        print("3. 🔄  一键爬取+转存")
        print("4. 📊  查看历史CSV文件")
        print("5. 🔧  系统检查")
        print("0. 🚪  退出")

    def list_csv_files(self):
        """列出可用的CSV文件"""
        csv_files = list(Path('.').glob('netdisk_resources_*.csv'))

        if not csv_files:
            print("❌ 未找到CSV文件，请先运行爬虫")
            return None

        print("\n📊 可用的CSV文件:")
        for i, file in enumerate(csv_files, 1):
            size = file.stat().st_size / 1024  # KB
            mtime = datetime.fromtimestamp(file.stat().st_mtime)
            print(f"{i}. {file.name} ({size:.1f}KB, {mtime.strftime('%Y-%m-%d %H:%M')})")

        try:
            choice = input("\n选择文件编号 (回车选择最新): ").strip()
            if not choice:
                # 选择最新的文件
                return max(csv_files, key=lambda f: f.stat().st_mtime)
            else:
                index = int(choice) - 1
                return csv_files[index]
        except (ValueError, IndexError):
            print("❌ 无效选择")
            return None

    async def run_crawler(self):
        """运行爬虫"""
        print("\n🚀 启动爬虫...")

        try:
            filename = await run_comprehensive_crawl()
            self.csv_file = filename

            if filename and Path(filename).exists():
                print(f"✅ 爬虫完成！资源保存在: {filename}")

                # 显示简要统计
                try:
                    import pandas as pd
                    df = pd.read_csv(filename)
                    print(f"📊 共收集 {len(df)} 个资源")
                    if len(df) > 0:
                        platform_stats = df['platform'].value_counts()
                        print("🗂️ 平台分布:")
                        for platform, count in platform_stats.items():
                            print(f"   {platform}: {count}")
                except Exception as e:
                    print(f"⚠️ 无法显示统计信息: {e}")

                return filename
            else:
                print("❌ 爬虫未生成有效文件")
                return None

        except Exception as e:
            print(f"❌ 爬虫运行失败: {e}")
            return None

    async def run_transfer(self, csv_file: str = None):
        """运行批量转存"""
        if not csv_file:
            csv_file = self.list_csv_files()
            if not csv_file:
                return False

        print(f"\n📥 开始批量转存: {csv_file}")

        # 询问转存数量
        try:
            max_count = input("输入最大转存数量 (默认10): ").strip()
            max_count = int(max_count) if max_count else 10
        except ValueError:
            max_count = 10

        print(f"🎯 将转存最多 {max_count} 个资源")
        confirm = input("确认开始? (y/N): ").strip().lower()

        if confirm != 'y':
            print("❌ 用户取消操作")
            return False

        try:
            tool = BatchTransferTool()
            await tool.batch_transfer(str(csv_file), max_count)

            print(f"\n🎉 批量转存完成!")
            print(f"✅ 成功: {tool.success_count}")
            print(f"❌ 失败: {tool.failed_count}")

            return True

        except Exception as e:
            print(f"❌ 批量转存失败: {e}")
            return False

    async def run_full_process(self):
        """运行完整流程：爬取 + 转存"""
        print("\n🔄 开始完整流程...")

        # 1. 运行爬虫
        csv_file = await self.run_crawler()
        if not csv_file:
            print("❌ 爬虫失败，无法继续")
            return

        # 2. 询问是否立即转存
        print(f"\n✅ 爬虫完成，是否立即转存?")
        confirm = input("立即转存? (Y/n): ").strip().lower()

        if confirm in ['y', 'yes', '']:
            await self.run_transfer(csv_file)
        else:
            print("ℹ️  您可以稍后手动运行转存")

    def check_system(self):
        """系统检查"""
        print("\n🔧 系统检查...")

        # 检查Python依赖
        required_modules = [
            'httpx', 'beautifulsoup4', 'pandas', 'playwright'
        ]

        print("📦 检查Python模块:")
        for module in required_modules:
            try:
                __import__(module)
                print(f"  ✅ {module}")
            except ImportError:
                print(f"  ❌ {module} (未安装)")

        # 检查目录结构
        print("\n📁 检查目录结构:")
        required_dirs = ['scripts', 'logs', 'config']
        for dir_name in required_dirs:
            if Path(dir_name).exists():
                print(f"  ✅ {dir_name}")
            else:
                print(f"  ❌ {dir_name} (不存在)")
                Path(dir_name).mkdir(exist_ok=True)
                print(f"  ✅ {dir_name} (已创建)")

        # 检查脚本文件
        print("\n📄 检查脚本文件:")
        required_scripts = [
            'scripts/netdisk_spider.py',
            'scripts/batch_transfer.py',
            'scripts/comprehensive_crawler.py'
        ]
        for script in required_scripts:
            if Path(script).exists():
                print(f"  ✅ {script}")
            else:
                print(f"  ❌ {script} (缺失)")

        print("\n✅ 系统检查完成")

    async def main(self):
        """主程序"""
        self.show_banner()

        while True:
            self.show_menu()

            try:
                choice = input("\n请输入选择 (0-5): ").strip()

                if choice == '0':
                    print("👋 再见!")
                    break
                elif choice == '1':
                    await self.run_crawler()
                elif choice == '2':
                    await self.run_transfer()
                elif choice == '3':
                    await self.run_full_process()
                elif choice == '4':
                    self.list_csv_files()
                elif choice == '5':
                    self.check_system()
                else:
                    print("❌ 无效选择，请输入0-5")

                input("\n按回车继续...")
                print("\n" + "="*60)

            except KeyboardInterrupt:
                print("\n👋 用户中断，再见!")
                break
            except Exception as e:
                print(f"❌ 程序错误: {e}")
                input("按回车继续...")


if __name__ == "__main__":
    print("💡 提示：确保你在项目根目录中运行此脚本")
    print("💡 首次使用请运行：pip install -r requirements.txt")

    quick_start = QuickStart()
    asyncio.run(quick_start.main())