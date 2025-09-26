#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram 网盘链接监听器
基于 python-telegram-bot 监听群组消息并提取网盘链接
"""

import asyncio
import json
import re
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import logging
from dataclasses import dataclass

from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes
import httpx

# 配置日志
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

@dataclass
class NetdiskLink:
    """网盘链接数据结构"""
    id: Optional[int] = None
    platform: str = ""  # quark, baidu, aliyun, etc.
    url: str = ""
    password: str = ""
    title: str = ""
    chat_id: int = 0
    message_id: int = 0
    user_id: int = 0
    username: str = ""
    extracted_at: str = ""
    status: str = "pending"  # pending, processing, completed, failed

class NetdiskLinkExtractor:
    """网盘链接提取器"""

    # 支持的网盘平台正则表达式
    PATTERNS = {
        'quark': [
            r'https?://pan\.quark\.cn/s/[a-zA-Z0-9]+',
            r'https?://drive\.uc\.cn/s/[a-zA-Z0-9]+'
        ],
        'baidu': [
            r'https?://pan\.baidu\.com/s/[a-zA-Z0-9_-]+',
            r'https?://yun\.baidu\.com/s/[a-zA-Z0-9_-]+'
        ],
        'aliyun': [
            r'https?://www\.aliyundrive\.com/s/[a-zA-Z0-9]+',
            r'https?://www\.alipan\.com/s/[a-zA-Z0-9]+'
        ],
        'tianyi': [
            r'https?://cloud\.189\.cn/t/[a-zA-Z0-9]+',
            r'https?://cloud\.189\.cn/web/share\?[a-zA-Z0-9&=]+'
        ],
        '123pan': [
            r'https?://www\.123pan\.com/s/[a-zA-Z0-9]+'
        ]
    }

    # 密码提取正则
    PASSWORD_PATTERNS = [
        r'(?:密码|提取码|提取密码|访问码)[:：\s]*([a-zA-Z0-9]{4,8})',
        r'(?:pwd|password)[:：\s]*([a-zA-Z0-9]{4,8})',
        r'([a-zA-Z0-9]{4,8})',  # 4-8位字母数字组合，作为备选
    ]

    @classmethod
    def extract_links(cls, text: str) -> List[NetdiskLink]:
        """从文本中提取网盘链接"""
        links = []

        for platform, patterns in cls.PATTERNS.items():
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    link = NetdiskLink(
                        platform=platform,
                        url=match,
                        password=cls._extract_password(text, match),
                        title=cls._extract_title(text),
                        extracted_at=datetime.now().isoformat()
                    )
                    links.append(link)

        return links

    @classmethod
    def _extract_password(cls, text: str, url: str) -> str:
        """提取密码/提取码"""
        # 在链接附近查找密码
        url_index = text.find(url)
        if url_index == -1:
            return ""

        # 在链接前后200字符范围内查找密码
        start = max(0, url_index - 200)
        end = min(len(text), url_index + len(url) + 200)
        context = text[start:end]

        for pattern in cls.PASSWORD_PATTERNS:
            match = re.search(pattern, context, re.IGNORECASE)
            if match:
                password = match.group(1)
                # 验证密码格式
                if 4 <= len(password) <= 8 and re.match(r'^[a-zA-Z0-9]+$', password):
                    return password

        return ""

    @classmethod
    def _extract_title(cls, text: str) -> str:
        """提取资源标题"""
        # 简单的标题提取逻辑，可以根据需要优化
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) < 100:  # 假设标题不超过100字符
                # 排除纯链接行
                if not re.match(r'^https?://', line):
                    return line[:50]  # 限制标题长度

        return "未知资源"

class DatabaseManager:
    """数据库管理器"""

    def __init__(self, db_path: str = "netdisk_links.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """初始化数据库"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS netdisk_links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT NOT NULL,
                    url TEXT NOT NULL,
                    password TEXT DEFAULT '',
                    title TEXT DEFAULT '',
                    chat_id INTEGER,
                    message_id INTEGER,
                    user_id INTEGER,
                    username TEXT DEFAULT '',
                    extracted_at TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(url, chat_id)
                )
            """)

    def save_links(self, links: List[NetdiskLink]) -> int:
        """保存链接到数据库"""
        saved_count = 0
        with sqlite3.connect(self.db_path) as conn:
            for link in links:
                try:
                    conn.execute("""
                        INSERT OR IGNORE INTO netdisk_links
                        (platform, url, password, title, chat_id, message_id,
                         user_id, username, extracted_at, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        link.platform, link.url, link.password, link.title,
                        link.chat_id, link.message_id, link.user_id,
                        link.username, link.extracted_at, link.status
                    ))
                    if conn.total_changes > 0:
                        saved_count += 1
                except sqlite3.Error as e:
                    logger.error(f"保存链接失败: {e}")

        return saved_count

    def get_pending_links(self, limit: int = 50) -> List[Dict]:
        """获取待处理的链接"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM netdisk_links
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    def update_link_status(self, link_id: int, status: str, error_msg: str = ""):
        """更新链接状态"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE netdisk_links
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, link_id))

class TelegramBot:
    """Telegram机器人"""

    def __init__(self, token: str, allowed_chats: List[int]):
        self.token = token
        self.allowed_chats = allowed_chats
        self.db = DatabaseManager()
        self.extractor = NetdiskLinkExtractor()

        # 统计信息
        self.stats = {
            'messages_processed': 0,
            'links_extracted': 0,
            'links_saved': 0
        }

    async def message_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """处理消息"""
        if not update.message or not update.message.text:
            return

        message = update.message
        chat_id = message.chat_id

        # 检查是否为允许的群组
        if chat_id not in self.allowed_chats:
            logger.warning(f"收到未授权群组 {chat_id} 的消息")
            return

        self.stats['messages_processed'] += 1

        # 提取网盘链接
        links = self.extractor.extract_links(message.text)

        if links:
            # 补充消息信息
            for link in links:
                link.chat_id = chat_id
                link.message_id = message.message_id
                link.user_id = message.from_user.id if message.from_user else 0
                link.username = message.from_user.username if message.from_user else ""

            # 保存到数据库
            saved_count = self.db.save_links(links)

            self.stats['links_extracted'] += len(links)
            self.stats['links_saved'] += saved_count

            if saved_count > 0:
                logger.info(f"从群组 {chat_id} 提取并保存了 {saved_count} 个新链接")

                # 可选：发送确认消息
                # await message.reply_text(f"✅ 已保存 {saved_count} 个网盘链接")

    async def start_bot(self):
        """启动机器人"""
        logger.info("正在启动 Telegram Bot...")

        application = Application.builder().token(self.token).build()

        # 添加消息处理器
        application.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self.message_handler)
        )

        # 启动机器人
        await application.initialize()
        await application.start()

        logger.info("Telegram Bot 启动成功！")
        logger.info(f"监听群组: {self.allowed_chats}")

        # 持续运行
        try:
            while True:
                await asyncio.sleep(60)  # 每分钟输出一次统计
                logger.info(f"统计: 处理消息 {self.stats['messages_processed']}, "
                          f"提取链接 {self.stats['links_extracted']}, "
                          f"保存链接 {self.stats['links_saved']}")
        except KeyboardInterrupt:
            logger.info("收到停止信号，正在关闭...")
        finally:
            await application.stop()

async def main():
    """主函数"""
    # 加载配置
    try:
        with open('config/telegram_config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        logger.error("配置文件 config/telegram_config.json 不存在")
        return

    bot_token = config.get('bot_token')
    chat_ids = config.get('chat_ids', [])

    if not bot_token:
        logger.error("Bot token 未配置")
        return

    if not chat_ids:
        logger.warning("未配置监听群组，将监听所有消息")

    # 启动机器人
    bot = TelegramBot(bot_token, chat_ids)
    await bot.start_bot()

if __name__ == "__main__":
    asyncio.run(main())