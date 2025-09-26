#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
特定网站爬虫示例
针对常见的网盘资源分享网站
"""

import asyncio
import re
from netdisk_spider import NetdiskSpider


class SpecificSiteCrawler(NetdiskSpider):
    """特定网站爬虫"""

    def __init__(self):
        super().__init__()

    async def crawl_telegram_channels(self, channels: list):
        """爬取公开的Telegram频道"""
        for channel in channels:
            print(f"🔍 爬取Telegram频道: {channel}")

            # Telegram Web版链接
            url = f"https://t.me/s/{channel}"

            try:
                results = await self.crawl_website(url, ".tgme_widget_message_text")
                self.results.extend(results)
                await asyncio.sleep(3)
            except Exception as e:
                print(f"❌ 爬取失败 {channel}: {e}")

    async def crawl_resource_forums(self):
        """爬取资源论坛（示例）"""
        forums = [
            # 示例论坛（需要根据实际情况调整）
            {
                'name': '示例论坛1',
                'url': 'https://example-forum1.com/resources',
                'selector': '.post-content'
            },
            {
                'name': '示例论坛2',
                'url': 'https://example-forum2.com/share',
                'selector': '.resource-item'
            }
        ]

        for forum in forums:
            print(f"🔍 爬取论坛: {forum['name']}")
            try:
                results = await self.crawl_website(forum['url'], forum['selector'])
                self.results.extend(results)
                await asyncio.sleep(5)  # 论坛通常需要更长的间隔
            except Exception as e:
                print(f"❌ 爬取失败 {forum['name']}: {e}")

    async def crawl_baidu_tieba(self, tieba_names: list, max_pages: int = 5):
        """爬取百度贴吧资源贴"""
        for tieba_name in tieba_names:
            print(f"🔍 爬取贴吧: {tieba_name}")

            for page in range(1, max_pages + 1):
                url = f"https://tieba.baidu.com/f?kw={tieba_name}&pn={page*50}"

                try:
                    # 爬取贴吧帖子列表
                    results = await self.crawl_website(url, ".t_con")
                    self.results.extend(results)
                    await asyncio.sleep(2)
                except Exception as e:
                    print(f"❌ 爬取失败 {tieba_name} 第{page}页: {e}")
                    break

    def create_search_keywords_config(self):
        """创建搜索关键词配置"""
        return {
            '影视资源': [
                '4K电影', '高清电影', '蓝光原盘', '电视剧', '纪录片',
                '动漫', '综艺', '最新电影', '经典电影'
            ],
            '学习资源': [
                '编程教程', 'Python教程', 'Web开发', '数据科学',
                '考研资料', '英语学习', '职场技能', '设计教程'
            ],
            '软件工具': [
                'Adobe全家桶', 'Office套件', '开发工具', '系统工具',
                '设计软件', '音视频工具', '绿色软件'
            ],
            '其他资源': [
                '音乐专辑', '电子书', '素材资源', '字体库',
                '游戏', '手机应用', '源码'
            ]
        }


async def run_comprehensive_crawl():
    """运行综合爬虫"""
    crawler = SpecificSiteCrawler()

    print("🚀 开始综合资源爬取...")

    # 1. 爬取公开Telegram频道
    telegram_channels = [
        # 示例频道（需要根据实际情况调整）
        'example_resources',
        'example_movies',
        'example_software'
    ]

    if telegram_channels:
        print("📱 爬取Telegram频道...")
        await crawler.crawl_telegram_channels(telegram_channels)

    # 2. 爬取百度贴吧
    tieba_names = [
        # 示例贴吧（需要根据实际情况调整）
        '资源分享', '电影分享', '软件分享'
    ]

    if tieba_names:
        print("🐻 爬取百度贴吧...")
        await crawler.crawl_baidu_tieba(tieba_names, max_pages=3)

    # 3. 爬取资源论坛
    print("🏛️ 爬取资源论坛...")
    await crawler.crawl_resource_forums()

    # 保存结果
    filename = crawler.save_to_csv()

    print(f"\n🎉 爬取完成！")
    print(f"📊 总共收集到 {len(crawler.results)} 个资源")
    print(f"💾 结果保存在: {filename}")

    return filename


if __name__ == "__main__":
    # 运行爬虫
    filename = asyncio.run(run_comprehensive_crawl())

    print(f"\n💡 接下来可以运行:")
    print(f"python scripts/batch_transfer.py {filename} 10")