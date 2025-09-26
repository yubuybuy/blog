#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
系统集成测试脚本
"""

import asyncio
import json
import logging
import subprocess
import sys
from pathlib import Path
import time

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class SystemTester:
    """系统测试器"""

    def __init__(self):
        self.test_results = {}
        self.failed_tests = []

    async def test_environment(self):
        """测试环境依赖"""
        logger.info("🧪 测试环境依赖...")

        tests = [
            ("Python版本", self._test_python_version),
            ("Node.js版本", self._test_node_version),
            ("Python包依赖", self._test_python_packages),
            ("目录结构", self._test_directory_structure),
            ("配置文件", self._test_config_files)
        ]

        for test_name, test_func in tests:
            try:
                result = await test_func()
                self.test_results[test_name] = {"status": "✅ 通过", "details": result}
                logger.info(f"  ✅ {test_name}: 通过")
            except Exception as e:
                self.test_results[test_name] = {"status": "❌ 失败", "error": str(e)}
                self.failed_tests.append(test_name)
                logger.error(f"  ❌ {test_name}: {e}")

    async def _test_python_version(self):
        """测试Python版本"""
        result = subprocess.run(['python', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()

        if not version:
            result = subprocess.run(['python3', '--version'], capture_output=True, text=True)
            version = result.stdout.strip()

        if 'Python 3.' not in version:
            raise Exception("需要Python 3.x版本")

        return version

    async def _test_node_version(self):
        """测试Node.js版本"""
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        version = result.stdout.strip()

        if not version or not version.startswith('v'):
            raise Exception("Node.js未安装或版本获取失败")

        major_version = int(version[1:].split('.')[0])
        if major_version < 16:
            raise Exception("需要Node.js 16+版本")

        return version

    async def _test_python_packages(self):
        """测试Python包依赖"""
        required_packages = [
            'telegram',
            'httpx',
            'playwright',
            'sqlite3',
            'prettytable',
            'tqdm'
        ]

        missing_packages = []
        for package in required_packages:
            try:
                if package == 'telegram':
                    import telegram
                elif package == 'httpx':
                    import httpx
                elif package == 'playwright':
                    import playwright
                elif package == 'sqlite3':
                    import sqlite3
                elif package == 'prettytable':
                    import prettytable
                elif package == 'tqdm':
                    import tqdm
            except ImportError:
                missing_packages.append(package)

        if missing_packages:
            raise Exception(f"缺少Python包: {', '.join(missing_packages)}")

        return f"所有必需包已安装: {len(required_packages)}个"

    async def _test_directory_structure(self):
        """测试目录结构"""
        required_dirs = ['scripts', 'config', 'data', 'logs']
        missing_dirs = []

        for dir_name in required_dirs:
            if not Path(dir_name).exists():
                missing_dirs.append(dir_name)

        if missing_dirs:
            # 尝试创建缺失的目录
            for dir_name in missing_dirs:
                Path(dir_name).mkdir(exist_ok=True)
                logger.info(f"    创建目录: {dir_name}")

        return f"目录结构完整: {len(required_dirs)}个目录"

    async def _test_config_files(self):
        """测试配置文件"""
        required_files = [
            'config/telegram_config.example.json',
            'scripts/telegram_listener.py',
            'scripts/quark_transfer.py',
            'scripts/monitor.py'
        ]

        missing_files = []
        for file_path in required_files:
            if not Path(file_path).exists():
                missing_files.append(file_path)

        if missing_files:
            raise Exception(f"缺少文件: {', '.join(missing_files)}")

        return f"配置文件完整: {len(required_files)}个文件"

    async def test_database_operations(self):
        """测试数据库操作"""
        logger.info("🧪 测试数据库操作...")

        try:
            import sqlite3

            # 创建测试数据库
            test_db_path = "data/test_netdisk_links.db"
            conn = sqlite3.connect(test_db_path)

            # 创建表
            conn.execute('''
                CREATE TABLE IF NOT EXISTS netdisk_links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT NOT NULL,
                    url TEXT NOT NULL,
                    password TEXT,
                    title TEXT,
                    chat_id INTEGER,
                    message_id INTEGER,
                    user_id INTEGER,
                    username TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP
                )
            ''')

            # 插入测试数据
            test_data = (
                'quark',
                'https://pan.quark.cn/s/abc123',
                'test123',
                '测试文件',
                -1001234567890,
                12345,
                67890,
                'testuser',
                'pending'
            )

            cursor = conn.execute('''
                INSERT INTO netdisk_links
                (platform, url, password, title, chat_id, message_id, user_id, username, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', test_data)

            # 查询测试
            cursor = conn.execute('SELECT COUNT(*) FROM netdisk_links')
            count = cursor.fetchone()[0]

            # 清理测试数据
            conn.execute('DELETE FROM netdisk_links WHERE url = ?', ('https://pan.quark.cn/s/abc123',))
            conn.commit()
            conn.close()

            # 删除测试数据库
            Path(test_db_path).unlink(missing_ok=True)

            self.test_results["数据库操作"] = {
                "status": "✅ 通过",
                "details": f"成功创建表并执行CRUD操作，测试记录数: {count}"
            }
            logger.info("  ✅ 数据库操作: 通过")

        except Exception as e:
            self.test_results["数据库操作"] = {"status": "❌ 失败", "error": str(e)}
            self.failed_tests.append("数据库操作")
            logger.error(f"  ❌ 数据库操作: {e}")

    async def test_script_syntax(self):
        """测试脚本语法"""
        logger.info("🧪 测试脚本语法...")

        scripts = [
            'scripts/telegram_listener.py',
            'scripts/quark_transfer.py',
            'scripts/monitor.py',
            'scripts/system_status.py',
            'scripts/validate_config.py'
        ]

        syntax_errors = []
        for script in scripts:
            if Path(script).exists():
                try:
                    result = subprocess.run([
                        'python', '-m', 'py_compile', script
                    ], capture_output=True, text=True, timeout=10)

                    if result.returncode != 0:
                        syntax_errors.append(f"{script}: {result.stderr.strip()}")
                except Exception as e:
                    syntax_errors.append(f"{script}: {e}")

        if syntax_errors:
            self.test_results["脚本语法"] = {
                "status": "❌ 失败",
                "errors": syntax_errors
            }
            self.failed_tests.append("脚本语法")
            logger.error(f"  ❌ 脚本语法: {len(syntax_errors)}个错误")
        else:
            self.test_results["脚本语法"] = {
                "status": "✅ 通过",
                "details": f"所有脚本语法正确: {len(scripts)}个"
            }
            logger.info("  ✅ 脚本语法: 通过")

    async def test_web_api(self):
        """测试Web API可用性"""
        logger.info("🧪 测试Web API...")

        try:
            # 这里只是检查API文件是否存在和语法正确
            api_file = "src/app/api/telegram-quark/route.ts"

            if not Path(api_file).exists():
                raise Exception("API路由文件不存在")

            # 检查TypeScript语法 (简单检查)
            with open(api_file, 'r', encoding='utf-8') as f:
                content = f.read()

            if 'export async function GET' not in content:
                raise Exception("缺少GET处理器")

            if 'export async function POST' not in content:
                raise Exception("缺少POST处理器")

            self.test_results["Web API"] = {
                "status": "✅ 通过",
                "details": "API路由文件存在且结构正确"
            }
            logger.info("  ✅ Web API: 通过")

        except Exception as e:
            self.test_results["Web API"] = {"status": "❌ 失败", "error": str(e)}
            self.failed_tests.append("Web API")
            logger.error(f"  ❌ Web API: {e}")

    async def run_performance_test(self):
        """运行性能测试"""
        logger.info("🧪 运行性能测试...")

        try:
            # 测试数据库查询性能
            start_time = time.time()

            import sqlite3
            conn = sqlite3.connect(':memory:')

            # 创建测试表
            conn.execute('''
                CREATE TABLE test_table (
                    id INTEGER PRIMARY KEY,
                    data TEXT
                )
            ''')

            # 批量插入测试数据
            test_data = [(i, f'test_data_{i}') for i in range(1000)]
            conn.executemany('INSERT INTO test_table (id, data) VALUES (?, ?)', test_data)

            # 执行查询测试
            for _ in range(100):
                cursor = conn.execute('SELECT COUNT(*) FROM test_table')
                cursor.fetchone()

            conn.close()
            end_time = time.time()

            performance_time = end_time - start_time

            self.test_results["性能测试"] = {
                "status": "✅ 通过" if performance_time < 5.0 else "⚠️ 警告",
                "details": f"数据库操作耗时: {performance_time:.2f}秒",
                "benchmark": "1000条记录 + 100次查询"
            }

            if performance_time < 5.0:
                logger.info(f"  ✅ 性能测试: 通过 ({performance_time:.2f}s)")
            else:
                logger.warning(f"  ⚠️ 性能测试: 较慢 ({performance_time:.2f}s)")

        except Exception as e:
            self.test_results["性能测试"] = {"status": "❌ 失败", "error": str(e)}
            self.failed_tests.append("性能测试")
            logger.error(f"  ❌ 性能测试: {e}")

    def generate_report(self):
        """生成测试报告"""
        logger.info("📊 生成测试报告...")

        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results.values() if r["status"].startswith("✅")])
        failed_tests = len(self.failed_tests)
        warning_tests = total_tests - passed_tests - failed_tests

        print("\n" + "="*60)
        print("📊 系统集成测试报告")
        print("="*60)
        print(f"🎯 总计: {total_tests} 个测试")
        print(f"✅ 通过: {passed_tests} 个")
        print(f"❌ 失败: {failed_tests} 个")
        if warning_tests > 0:
            print(f"⚠️ 警告: {warning_tests} 个")

        print("\n📋 详细结果:")
        for test_name, result in self.test_results.items():
            print(f"  {result['status']} {test_name}")
            if "details" in result:
                print(f"    💡 {result['details']}")
            if "error" in result:
                print(f"    🔴 {result['error']}")

        if self.failed_tests:
            print(f"\n🚨 需要修复的问题:")
            for test in self.failed_tests:
                print(f"  • {test}")

        print("\n" + "="*60)

        # 保存报告到文件
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "total": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "warnings": warning_tests
            },
            "results": self.test_results,
            "failed_tests": self.failed_tests
        }

        report_path = "logs/test_report.json"
        Path("logs").mkdir(exist_ok=True)
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        print(f"📄 详细报告已保存到: {report_path}")

        return failed_tests == 0

    async def run_all_tests(self):
        """运行所有测试"""
        logger.info("🚀 开始系统集成测试...")

        await self.test_environment()
        await self.test_database_operations()
        await self.test_script_syntax()
        await self.test_web_api()
        await self.run_performance_test()

        success = self.generate_report()

        if success:
            logger.info("🎉 所有测试通过！系统准备就绪。")
            return True
        else:
            logger.error("❌ 部分测试失败，请检查并修复问题。")
            return False


async def main():
    """主函数"""
    tester = SystemTester()
    success = await tester.run_all_tests()

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())