#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
夸克网盘转存管理器
基于 QuarkPanTool 实现批量转存功能
"""

import asyncio
import json
import re
import sqlite3
import random
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import logging

import httpx
from playwright.async_api import async_playwright, Browser, Page

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QuarkTransferManager:
    """夸克网盘转存管理器"""

    def __init__(self, headless: bool = True, slow_mo: int = 1000):
        self.headless = headless
        self.slow_mo = slow_mo
        self.cookies = ""
        self.headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
            'origin': 'https://pan.quark.cn',
            'referer': 'https://pan.quark.cn/',
            'accept-language': 'zh-CN,zh;q=0.9',
        }
        self.db_path = "data/netdisk_links.db"

    async def login_quark(self) -> bool:
        """自动登录夸克网盘"""
        try:
            async with async_playwright() as p:
                browser = await p.firefox.launch(
                    headless=self.headless,
                    slow_mo=self.slow_mo
                )

                context = await browser.new_context()
                page = await context.new_page()

                # 访问夸克网盘
                await page.goto('https://pan.quark.cn')
                await page.wait_for_load_state('networkidle')

                # 检查是否已登录
                try:
                    await page.wait_for_selector('[data-testid="user-avatar"]', timeout=5000)
                    logger.info("检测到用户已登录")

                    # 获取cookies
                    cookies = await context.cookies()
                    self.cookies = '; '.join([f"{c['name']}={c['value']}" for c in cookies])
                    self.headers['cookie'] = self.cookies

                    await browser.close()
                    return True

                except:
                    logger.info("未检测到登录状态，请手动登录...")
                    print("请在打开的浏览器中完成登录，登录后按回车键继续...")
                    input()

                    # 再次检查登录状态
                    try:
                        await page.wait_for_selector('[data-testid="user-avatar"]', timeout=5000)
                        cookies = await context.cookies()
                        self.cookies = '; '.join([f"{c['name']}={c['value']}" for c in cookies])
                        self.headers['cookie'] = self.cookies

                        # 保存cookies到文件
                        with open('config/quark_cookies.json', 'w') as f:
                            json.dump(cookies, f, indent=2)

                        logger.info("登录成功，cookies已保存")
                        await browser.close()
                        return True

                    except:
                        logger.error("登录验证失败")
                        await browser.close()
                        return False

        except Exception as e:
            logger.error(f"登录过程出错: {e}")
            return False

    def load_cookies(self) -> bool:
        """从文件加载cookies"""
        try:
            with open('config/quark_cookies.json', 'r') as f:
                cookies = json.load(f)
                self.cookies = '; '.join([f"{c['name']}={c['value']}" for c in cookies])
                self.headers['cookie'] = self.cookies
                logger.info("Cookies加载成功")
                return True
        except FileNotFoundError:
            logger.info("未找到saved cookies文件")
            return False
        except Exception as e:
            logger.error(f"加载cookies失败: {e}")
            return False

    @staticmethod
    def get_pwd_id(share_url: str) -> str:
        """从分享链接中提取pwd_id"""
        return share_url.split('?')[0].split('/s/')[-1]

    async def get_stoken(self, pwd_id: str, password: str = '') -> Optional[str]:
        """获取分享token"""
        params = {
            'pr': 'ucpro',
            'fr': 'pc',
            'uc_param_str': '',
            '__dt': random.randint(100, 9999),
            '__t': int(datetime.now().timestamp() * 1000),
        }

        api = "https://drive-pc.quark.cn/1/clouddrive/share/sharepage/token"
        data = {"pwd_id": pwd_id, "passcode": password}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    api,
                    json=data,
                    params=params,
                    headers=self.headers,
                    timeout=30.0
                )
                json_data = response.json()

                if json_data.get('status') == 200 and json_data.get('data'):
                    return json_data["data"]["stoken"]
                else:
                    logger.error(f"获取stoken失败: {json_data.get('message', '未知错误')}")
                    return None

        except Exception as e:
            logger.error(f"请求stoken时出错: {e}")
            return None

    async def get_file_list(self, pwd_id: str, stoken: str, pdir_fid: str = '0') -> Tuple[str, List[Dict]]:
        """获取分享文件列表"""
        api = "https://drive-pc.quark.cn/1/clouddrive/share/sharepage/detail"

        params = {
            'pr': 'ucpro',
            'fr': 'pc',
            'uc_param_str': '',
            "pwd_id": pwd_id,
            "stoken": stoken,
            'pdir_fid': pdir_fid,
            'force': '0',
            "_page": "1",
            '_size': '50',
            '_sort': 'file_type:asc,updated_at:desc',
            '__dt': random.randint(200, 9999),
            '__t': int(datetime.now().timestamp() * 1000),
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    api,
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                json_data = response.json()

                if json_data.get('status') == 200:
                    data = json_data.get('data', {})
                    return data.get('title', ''), data.get('list', [])
                else:
                    logger.error(f"获取文件列表失败: {json_data.get('message', '未知错误')}")
                    return '', []

        except Exception as e:
            logger.error(f"请求文件列表时出错: {e}")
            return '', []

    async def save_to_netdisk(self, pwd_id: str, stoken: str, fid_list: List[str],
                             fid_token_list: List[str], to_pdir_fid: str = '0') -> bool:
        """转存文件到网盘"""
        api = "https://drive-pc.quark.cn/1/clouddrive/share/sharepage/save"

        params = {
            'pr': 'ucpro',
            'fr': 'pc',
            'uc_param_str': '',
            '__dt': random.randint(200, 9999),
            '__t': int(datetime.now().timestamp() * 1000),
        }

        data = {
            "fid_list": fid_list,
            "fid_token_list": fid_token_list,
            "to_pdir_fid": to_pdir_fid,
            "pwd_id": pwd_id,
            "stoken": stoken,
            "pdir_fid": "0",
            "scene": "link"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    api,
                    json=data,
                    params=params,
                    headers=self.headers,
                    timeout=60.0
                )
                json_data = response.json()

                if json_data.get('status') == 200:
                    logger.info("文件转存成功")
                    return True
                else:
                    logger.error(f"文件转存失败: {json_data.get('message', '未知错误')}")
                    return False

        except Exception as e:
            logger.error(f"转存请求时出错: {e}")
            return False

    async def transfer_single_link(self, link_data: Dict) -> bool:
        """转存单个链接"""
        url = link_data['url']
        password = link_data.get('password', '')

        logger.info(f"开始转存: {url}")

        try:
            # 提取pwd_id
            pwd_id = self.get_pwd_id(url)

            # 获取stoken
            stoken = await self.get_stoken(pwd_id, password)
            if not stoken:
                return False

            # 获取文件列表
            title, file_list = await self.get_file_list(pwd_id, stoken)
            if not file_list:
                logger.warning(f"未找到文件: {url}")
                return False

            # 准备转存数据
            fid_list = []
            fid_token_list = []

            for file_info in file_list:
                fid_list.append(file_info['fid'])
                fid_token_list.append(file_info['share_fid_token'])

            # 执行转存
            success = await self.save_to_netdisk(pwd_id, stoken, fid_list, fid_token_list)

            if success:
                logger.info(f"转存成功: {title} ({len(file_list)}个文件)")
                return True
            else:
                return False

        except Exception as e:
            logger.error(f"转存链接时出错: {e}")
            return False

    async def batch_transfer(self, max_count: int = 5) -> Dict:
        """批量转存待处理链接"""
        # 获取待处理链接
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM netdisk_links
                WHERE status = 'pending' AND platform = 'quark'
                ORDER BY created_at DESC
                LIMIT ?
            """, (max_count,))
            links = [dict(row) for row in cursor.fetchall()]

        if not links:
            logger.info("没有待处理的夸克链接")
            return {'success': 0, 'failed': 0, 'total': 0}

        logger.info(f"开始批量转存 {len(links)} 个链接...")

        success_count = 0
        failed_count = 0

        for link in links:
            # 更新状态为处理中
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "UPDATE netdisk_links SET status = 'processing' WHERE id = ?",
                    (link['id'],)
                )

            # 执行转存
            try:
                result = await self.transfer_single_link(link)
                if result:
                    success_count += 1
                    status = 'completed'
                else:
                    failed_count += 1
                    status = 'failed'

                # 更新最终状态
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute(
                        "UPDATE netdisk_links SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (status, link['id'])
                    )

                # 添加延迟避免频率限制
                await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"处理链接 {link['id']} 时出错: {e}")
                failed_count += 1

                with sqlite3.connect(self.db_path) as conn:
                    conn.execute(
                        "UPDATE netdisk_links SET status = 'failed' WHERE id = ?",
                        (link['id'],)
                    )

        result = {
            'success': success_count,
            'failed': failed_count,
            'total': len(links)
        }

        logger.info(f"批量转存完成: {result}")
        return result

async def main():
    """主函数 - 用于测试"""
    manager = QuarkTransferManager(headless=False)

    # 尝试加载cookies，失败则重新登录
    if not manager.load_cookies():
        if not await manager.login_quark():
            logger.error("登录失败，退出程序")
            return

    # 执行批量转存
    result = await manager.batch_transfer(max_count=3)
    print(f"转存结果: {result}")

if __name__ == "__main__":
    asyncio.run(main())