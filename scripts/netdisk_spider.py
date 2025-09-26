#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网盘资源爬虫系统
支持多个平台的资源收集
"""

import asyncio
import csv
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

import httpx
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
import pandas as pd


class NetdiskSpider:
    """网盘资源爬虫"""

    def __init__(self):
        self.session = None
        self.results = []
        self.platforms_patterns = {
            'quark': [
                r'https?://pan\.quark\.cn/s/[a-zA-Z0-9]+',
                r'夸克网盘',
                r'夸克链接'
            ],
            'baidu': [
                r'https?://pan\.baidu\.com/s/[a-zA-Z0-9_-]+',
                r'百度网盘',
                r'百度云'
            ],
            'aliyun': [
                r'https?://www\.aliyundrive\.com/s/[a-zA-Z0-9]+',
                r'阿里云盘',
                r'阿里网盘'
            ],
            'tianyi': [
                r'https?://cloud\.189\.cn/[tw]/[a-zA-Z0-9]+',
                r'天翼云盘',
                r'天翼网盘'
            ],
            '123pan': [
                r'https?://www\.123pan\.com/s/[a-zA-Z0-9_-]+',
                r'123网盘',
                r'123云盘'
            ]
        }

    def extract_netdisk_info(self, text: str) -> List[Dict]:
        """从文本中提取网盘信息"""
        results = []

        for platform, patterns in self.platforms_patterns.items():
            # 查找链接
            for pattern in patterns:
                if 'http' in pattern:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        # 尝试提取密码/提取码
                        password = self._extract_password(text, match)

                        results.append({
                            'platform': platform,
                            'url': match,
                            'password': password,
                            'title': self._extract_title(text, match),
                            'size': self._extract_size(text),
                            'source': 'crawler',
                            'crawl_time': datetime.now().isoformat()
                        })

        return results

    def _extract_password(self, text: str, url: str) -> str:
        """提取密码/提取码"""
        # 常见的密码模式
        patterns = [
            r'(?:提取码|密码|pwd|password)[:：]\s*([a-zA-Z0-9]{4,6})',
            r'([a-zA-Z0-9]{4,6})\s*(?:提取码|密码)',
            r'提取码\s*([a-zA-Z0-9]{4,6})',
            r'密码\s*([a-zA-Z0-9]{4,6})',
        ]

        # 在URL附近寻找密码
        url_index = text.find(url)
        if url_index != -1:
            # 搜索URL前后100个字符
            search_text = text[max(0, url_index-100):url_index+len(url)+100]

            for pattern in patterns:
                match = re.search(pattern, search_text, re.IGNORECASE)
                if match:
                    return match.group(1)

        return ''

    def _extract_title(self, text: str, url: str) -> str:
        """提取资源标题"""
        # 简单的标题提取逻辑
        lines = text.split('\n')
        for line in lines:
            if url in line:
                # 清理HTML标签和特殊字符
                clean_line = re.sub(r'<[^>]+>', '', line)
                clean_line = re.sub(r'https?://\S+', '', clean_line)
                clean_line = clean_line.strip()
                if len(clean_line) > 5 and len(clean_line) < 100:
                    return clean_line[:50]  # 限制长度

        return '未知资源'

    def _extract_size(self, text: str) -> str:
        """提取文件大小"""
        size_patterns = [
            r'(\d+(?:\.\d+)?\s*[KMGT]B)',
            r'大小[:：]\s*(\d+(?:\.\d+)?\s*[KMGT]B)',
            r'(\d+(?:\.\d+)?\s*(?:MB|GB|TB))'
        ]

        for pattern in size_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)

        return ''

    async def crawl_website(self, url: str, selector: str = None) -> List[Dict]:
        """爬取指定网站"""
        print(f"🕷️ 爬取网站: {url}")

        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            page = await browser.new_page()

            try:
                await page.goto(url, timeout=30000)
                await page.wait_for_load_state('networkidle')

                # 获取页面内容
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')

                # 提取文本内容
                if selector:
                    elements = soup.select(selector)
                    texts = [elem.get_text() for elem in elements]
                else:
                    texts = [soup.get_text()]

                # 从文本中提取网盘信息
                results = []
                for text in texts:
                    results.extend(self.extract_netdisk_info(text))

                print(f"✅ 从 {url} 提取到 {len(results)} 个资源")
                return results

            except Exception as e:
                print(f"❌ 爬取失败 {url}: {e}")
                return []
            finally:
                await browser.close()

    async def crawl_search_engine(self, keywords: List[str], max_pages: int = 5):
        """爬取网盘搜索引擎"""
        # 这里添加具体的搜索引擎爬取逻辑
        # 例如：盘搜搜、小白盘等
        pass

    def save_to_csv(self, filename: str = None):
        """保存结果到CSV"""
        if not filename:
            filename = f"netdisk_resources_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        df = pd.DataFrame(self.results)
        if not df.empty:
            # 去重
            df = df.drop_duplicates(subset=['url'])

            # 排序
            df = df.sort_values(['platform', 'crawl_time'])

            # 保存
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            print(f"📊 已保存 {len(df)} 个资源到 {filename}")

            # 显示统计信息
            platform_stats = df['platform'].value_counts()
            print("📈 平台统计:")
            for platform, count in platform_stats.items():
                print(f"  {platform}: {count} 个资源")

        return filename

    async def run_spider(self, config: Dict):
        """运行爬虫"""
        print("🚀 启动网盘资源爬虫...")

        # 爬取配置的网站
        for site in config.get('websites', []):
            results = await self.crawl_website(
                site['url'],
                site.get('selector')
            )
            self.results.extend(results)

            # 延迟避免被封
            await asyncio.sleep(config.get('delay', 2))

        # 保存结果
        filename = self.save_to_csv()
        return filename


async def main():
    """主函数"""
    spider = NetdiskSpider()

    # 爬虫配置
    config = {
        'websites': [
            # 示例网站（需要根据实际情况调整）
            {
                'url': 'https://example-resource-site.com',
                'selector': '.resource-item'
            }
        ],
        'delay': 3  # 请求间隔秒数
    }

    filename = await spider.run_spider(config)
    print(f"🎉 爬虫完成！结果保存在: {filename}")


if __name__ == "__main__":
    asyncio.run(main())