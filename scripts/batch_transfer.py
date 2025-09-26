#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量网盘转存工具
读取CSV文件，批量转存到夸克网盘
"""

import asyncio
import csv
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict

import pandas as pd
from playwright.async_api import async_playwright


class BatchTransferTool:
    """批量转存工具"""

    def __init__(self):
        self.browser = None
        self.page = None
        self.success_count = 0
        self.failed_count = 0
        self.skipped_count = 0
        self.transfer_log = []

        # 设置日志
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/batch_transfer.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    async def init_browser(self):
        """初始化浏览器"""
        playwright = await async_playwright().__aenter__()
        self.browser = await playwright.firefox.launch(
            headless=False,  # 显示浏览器，方便调试
            slow_mo=1000     # 减慢操作速度
        )
        self.page = await self.browser.new_page()

    async def login_quark(self):
        """登录夸克网盘"""
        self.logger.info("🔑 开始登录夸克网盘...")

        try:
            await self.page.goto('https://pan.quark.cn/', timeout=30000)

            # 等待登录
            self.logger.info("请在浏览器中完成登录...")
            self.logger.info("登录完成后，按回车继续...")

            # 等待用户手动登录
            input("按回车继续...")

            # 验证是否登录成功
            current_url = self.page.url
            if 'pan.quark.cn' in current_url and 'login' not in current_url.lower():
                self.logger.info("✅ 夸克网盘登录成功")
                return True
            else:
                self.logger.error("❌ 登录验证失败")
                return False

        except Exception as e:
            self.logger.error(f"❌ 登录过程出错: {e}")
            return False

    async def transfer_single_link(self, resource: Dict) -> bool:
        """转存单个链接"""
        url = resource['url']
        password = resource.get('password', '')
        title = resource.get('title', '未知资源')

        self.logger.info(f"📥 开始转存: {title}")
        self.logger.info(f"🔗 链接: {url}")

        try:
            # 在新标签页中打开链接
            new_page = await self.browser.new_page()

            await new_page.goto(url, timeout=30000)
            await new_page.wait_for_load_state('networkidle')

            # 根据不同平台处理
            platform = resource['platform']

            if platform == 'quark':
                success = await self._handle_quark_link(new_page, password)
            elif platform == 'baidu':
                success = await self._handle_baidu_link(new_page, password)
            elif platform == 'aliyun':
                success = await self._handle_aliyun_link(new_page, password)
            else:
                self.logger.warning(f"⚠️ 暂不支持平台: {platform}")
                success = False

            await new_page.close()

            if success:
                self.success_count += 1
                self.logger.info(f"✅ 转存成功: {title}")
            else:
                self.failed_count += 1
                self.logger.error(f"❌ 转存失败: {title}")

            # 记录日志
            self.transfer_log.append({
                'title': title,
                'url': url,
                'platform': platform,
                'password': password,
                'status': 'success' if success else 'failed',
                'timestamp': datetime.now().isoformat()
            })

            # 延迟避免频率限制
            await asyncio.sleep(3)

            return success

        except Exception as e:
            self.failed_count += 1
            self.logger.error(f"❌ 转存异常: {title} - {e}")
            return False

    async def _handle_quark_link(self, page, password: str) -> bool:
        """处理夸克网盘链接"""
        try:
            # 如果需要密码
            if password:
                password_input = await page.wait_for_selector('input[placeholder*="提取码"]', timeout=5000)
                if password_input:
                    await password_input.fill(password)
                    submit_btn = await page.wait_for_selector('button:has-text("确定")', timeout=3000)
                    if submit_btn:
                        await submit_btn.click()
                        await page.wait_for_load_state('networkidle')

            # 查找转存按钮
            save_btn = await page.wait_for_selector('button:has-text("保存")', timeout=10000)
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

                # 选择保存位置（默认根目录）
                confirm_btn = await page.wait_for_selector('button:has-text("确定")', timeout=5000)
                if confirm_btn:
                    await confirm_btn.click()
                    await asyncio.sleep(3)
                    return True

            return False

        except Exception as e:
            self.logger.error(f"处理夸克链接失败: {e}")
            return False

    async def _handle_baidu_link(self, page, password: str) -> bool:
        """处理百度网盘链接"""
        try:
            # 输入密码
            if password:
                password_input = await page.wait_for_selector('input.QKKaIhk', timeout=5000)
                if password_input:
                    await password_input.fill(password)
                    submit_btn = await page.wait_for_selector('.g2HqQu', timeout=3000)
                    if submit_btn:
                        await submit_btn.click()
                        await page.wait_for_load_state('networkidle')

            # 选择全部文件
            select_all = await page.wait_for_selector('.select-all', timeout=10000)
            if select_all:
                await select_all.click()

            # 点击转存按钮
            save_btn = await page.wait_for_selector('a:has-text("保存到网盘")', timeout=5000)
            if save_btn:
                await save_btn.click()
                await asyncio.sleep(2)

                # 确认保存
                confirm_btn = await page.wait_for_selector('.g2HqQu:has-text("确定")', timeout=5000)
                if confirm_btn:
                    await confirm_btn.click()
                    await asyncio.sleep(3)
                    return True

            return False

        except Exception as e:
            self.logger.error(f"处理百度链接失败: {e}")
            return False

    async def _handle_aliyun_link(self, page, password: str) -> bool:
        """处理阿里云盘链接"""
        try:
            # 阿里云盘通常需要登录，这里简化处理
            self.logger.info("阿里云盘需要手动处理")
            return False

        except Exception as e:
            self.logger.error(f"处理阿里云盘链接失败: {e}")
            return False

    def load_resources_from_csv(self, filename: str) -> List[Dict]:
        """从CSV文件加载资源"""
        try:
            df = pd.read_csv(filename, encoding='utf-8-sig')

            # 过滤有效链接
            df = df.dropna(subset=['url'])
            df = df[df['url'].str.contains('http', na=False)]

            resources = df.to_dict('records')
            self.logger.info(f"📊 从 {filename} 加载了 {len(resources)} 个资源")

            return resources

        except Exception as e:
            self.logger.error(f"❌ 加载CSV文件失败: {e}")
            return []

    def save_transfer_log(self):
        """保存转存日志"""
        log_file = f"logs/transfer_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        Path("logs").mkdir(exist_ok=True)

        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(self.transfer_log, f, ensure_ascii=False, indent=2)

        self.logger.info(f"📋 转存日志已保存: {log_file}")

    async def batch_transfer(self, csv_file: str, max_count: int = 10):
        """批量转存"""
        self.logger.info("🚀 开始批量转存...")

        # 加载资源
        resources = self.load_resources_from_csv(csv_file)
        if not resources:
            self.logger.error("❌ 没有找到有效资源")
            return

        # 限制转存数量
        if len(resources) > max_count:
            resources = resources[:max_count]
            self.logger.info(f"⚠️ 限制转存数量为 {max_count}")

        # 初始化浏览器
        await self.init_browser()

        # 登录夸克网盘
        if not await self.login_quark():
            self.logger.error("❌ 登录失败，无法继续")
            return

        # 批量转存
        for i, resource in enumerate(resources, 1):
            self.logger.info(f"📥 处理第 {i}/{len(resources)} 个资源")

            await self.transfer_single_link(resource)

            # 每处理几个资源就休息一下
            if i % 5 == 0:
                self.logger.info("😴 休息10秒...")
                await asyncio.sleep(10)

        # 关闭浏览器
        if self.browser:
            await self.browser.close()

        # 输出结果
        self.logger.info("🎉 批量转存完成！")
        self.logger.info(f"✅ 成功: {self.success_count}")
        self.logger.info(f"❌ 失败: {self.failed_count}")
        self.logger.info(f"⏭️ 跳过: {self.skipped_count}")

        # 保存日志
        self.save_transfer_log()


async def main():
    """主函数"""
    import sys

    if len(sys.argv) < 2:
        print("用法: python batch_transfer.py <CSV文件> [最大转存数量]")
        print("示例: python batch_transfer.py resources.csv 20")
        return

    csv_file = sys.argv[1]
    max_count = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    tool = BatchTransferTool()
    await tool.batch_transfer(csv_file, max_count)


if __name__ == "__main__":
    asyncio.run(main())