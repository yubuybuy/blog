#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置验证工具
"""

import json
import os
import sys
from pathlib import Path


class ConfigValidator:
    """配置验证器"""

    def __init__(self):
        self.errors = []
        self.warnings = []

    def validate_telegram_config(self):
        """验证Telegram配置"""
        config_path = "config/telegram_config.json"

        if not Path(config_path).exists():
            self.errors.append(f"❌ 配置文件不存在: {config_path}")
            return False

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            # 检查必需字段
            if not config.get('bot_token'):
                self.errors.append("❌ 缺少 bot_token")
            elif config['bot_token'] == "你的Telegram Bot Token":
                self.errors.append("❌ 请设置正确的 bot_token")

            if not config.get('chat_ids') or not isinstance(config['chat_ids'], list):
                self.errors.append("❌ 缺少 chat_ids 或格式错误")
            elif len(config['chat_ids']) == 0:
                self.warnings.append("⚠️ chat_ids 列表为空")

            # 检查设置
            settings = config.get('settings', {})
            if 'included_platforms' in settings and not settings['included_platforms']:
                self.warnings.append("⚠️ included_platforms 为空，将不会监听任何平台")

            return len(self.errors) == 0

        except json.JSONDecodeError:
            self.errors.append("❌ 配置文件JSON格式错误")
            return False
        except Exception as e:
            self.errors.append(f"❌ 读取配置文件失败: {e}")
            return False

    def validate_quark_config(self):
        """验证夸克配置"""
        config_path = "config/quark_config.json"

        if not Path(config_path).exists():
            self.warnings.append(f"⚠️ 夸克配置文件不存在: {config_path}，将使用默认设置")
            return True

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)

            # 检查浏览器设置
            browser = config.get('browser', {})
            if browser.get('headless') is None:
                self.warnings.append("⚠️ 建议设置 browser.headless")

            return True

        except json.JSONDecodeError:
            self.errors.append("❌ 夸克配置文件JSON格式错误")
            return False
        except Exception as e:
            self.errors.append(f"❌ 读取夸克配置文件失败: {e}")
            return False

    def validate_directories(self):
        """验证目录结构"""
        required_dirs = ['data', 'logs', 'config', 'scripts']

        for dir_name in required_dirs:
            if not Path(dir_name).exists():
                self.warnings.append(f"⚠️ 目录不存在: {dir_name}")

    def validate_dependencies(self):
        """验证依赖"""
        # 检查requirements.txt
        if not Path('requirements.txt').exists():
            self.errors.append("❌ requirements.txt 不存在")
            return False

        # 检查Python脚本
        scripts = ['scripts/telegram_listener.py', 'scripts/quark_transfer.py', 'scripts/monitor.py']
        for script in scripts:
            if not Path(script).exists():
                self.errors.append(f"❌ 脚本文件不存在: {script}")

        return len(self.errors) == 0

    def validate_environment(self):
        """验证环境变量"""
        env_file = '.env.local'

        if Path(env_file).exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()

                if 'TELEGRAM_BOT_TOKEN=' in content:
                    self.warnings.append("⚠️ 建议使用配置文件而不是环境变量存储Token")

    def run_validation(self):
        """运行完整验证"""
        print("🔍 开始配置验证...\n")

        # 验证各个组件
        self.validate_directories()
        self.validate_telegram_config()
        self.validate_quark_config()
        self.validate_dependencies()
        self.validate_environment()

        # 输出结果
        if self.errors:
            print("❌ 发现错误:")
            for error in self.errors:
                print(f"  {error}")
            print()

        if self.warnings:
            print("⚠️ 警告信息:")
            for warning in self.warnings:
                print(f"  {warning}")
            print()

        if not self.errors and not self.warnings:
            print("✅ 所有配置都正确!")
        elif not self.errors:
            print("✅ 基础配置正确，可以启动系统")
        else:
            print("❌ 请修复错误后重新验证")
            return False

        return True


def main():
    """主函数"""
    validator = ConfigValidator()
    success = validator.run_validation()

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()