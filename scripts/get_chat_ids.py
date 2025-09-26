import asyncio
from telegram import Bot

async def get_chat_ids():
    # 替换为你的Bot Token
    bot = Bot('你的Bot Token')

    print("🔍 获取最近的消息和群组ID...")

    try:
        updates = await bot.get_updates()
        print(f"找到 {len(updates)} 条消息记录\n")

        chat_ids = set()
        for update in updates[-10:]:  # 查看最近10条消息
            if update.message and update.message.chat:
                chat = update.message.chat
                chat_ids.add(chat.id)

                print(f"📱 群组信息:")
                print(f"   名称: {chat.title or chat.first_name}")
                print(f"   ID: {chat.id}")
                print(f"   类型: {chat.type}")
                print("---")

        if chat_ids:
            print("✅ 可用的群组ID:")
            for chat_id in chat_ids:
                print(f"   {chat_id}")
        else:
            print("❌ 未找到群组消息")
            print("💡 请确保:")
            print("   1. Bot已添加到群组")
            print("   2. Bot设为管理员")
            print("   3. 群组中有新消息")

    except Exception as e:
        print(f"❌ 获取失败: {e}")
        print("💡 请检查Bot Token是否正确")

if __name__ == "__main__":
    asyncio.run(get_chat_ids())