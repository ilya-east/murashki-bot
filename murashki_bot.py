import time
import os
import zipfile
from threading import Thread
from telegram import Bot
from telegram.ext import Updater, CommandHandler

# ======= НАСТРОЙКИ =======
TELEGRAM_TOKEN = '8057547167:AAHi1-zckxWg_jVPXxG2PSy6mMTZVuu3Fgo'  # <-- Сюда вставь токен от BotFather
CHAT_ID = None  # Можно оставить None — бот сам запомнит при первом запуске
PROJECT_FOLDER = './site'  # Путь к папке с проектом (можно изменить)
BACKUP_FILENAME = 'murashki_backup.zip'

# ======= БОТ =======
bot = Bot(token=TELEGRAM_TOKEN)

def make_backup():
    with zipfile.ZipFile(BACKUP_FILENAME, 'w') as zipf:
        for root, dirs, files in os.walk(PROJECT_FOLDER):
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, PROJECT_FOLDER)
                zipf.write(filepath, arcname=arcname)
    return BACKUP_FILENAME

def start(update, context):
    global CHAT_ID
    CHAT_ID = update.effective_chat.id
    context.bot.send_message(chat_id=CHAT_ID, text="Привет! Я — Murashki Bot. Готов к работе.")

def status(update, context):
    context.bot.send_message(chat_id=update.effective_chat.id, text="Работа над сайтом продолжается. Всё под контролем.")

def backup(update, context):
    path = make_backup()
    context.bot.send_message(chat_id=update.effective_chat.id, text="Создаю бэкап...")
    context.bot.send_document(chat_id=update.effective_chat.id, document=open(path, 'rb'))

def auto_notify():
    while True:
        if CHAT_ID:
            bot.send_message(chat_id=CHAT_ID, text="[MurashkiBot] Прогресс продолжается. Работаю над сайтом.")
        time.sleep(1800)  # Каждые 30 минут

def main():
    updater = Updater(token=TELEGRAM_TOKEN, use_context=True)
    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("status", status))
    dp.add_handler(CommandHandler("backup", backup))

    # Запускаем авто-уведомления в фоне
    Thread(target=auto_notify, daemon=True).start()

    updater.start_polling()
    updater.idle()

if name == '__main__':
    main()
