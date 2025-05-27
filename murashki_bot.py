import os
import time
import zipfile
from datetime import datetime
from threading import Thread
from telegram import Bot
from telegram.ext import Updater, CommandHandler

# === НАСТРОЙКИ ===
TELEGRAM_TOKEN = '8057547167:AAG_GXS_QctYyIN-29JmlwWxOb5XY68I-Tk'  # <-- Вставь сюда свой токен вручную
CHAT_ID = None
PROJECT_FOLDER = './project'
BACKUP_FOLDER = './'
SEND_INTERVAL = 1800  # 30 минут

bot = Bot(token=TELEGRAM_TOKEN)

def make_backup():
    now = datetime.now().strftime('%Y-%m-%d_%H-%M')
    filename = f'backup_{now}.zip'
    zip_path = os.path.join(BACKUP_FOLDER, filename)

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for root, _, files in os.walk(PROJECT_FOLDER):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, PROJECT_FOLDER)
                zipf.write(file_path, arcname)
                file_count += 1
                total_size += os.path.getsize(file_path)

    return zip_path, file_count, total_size

def send_backup():
    global CHAT_ID
    while True:
        if CHAT_ID:
            zip_path, count, size = make_backup()
            now = datetime.now().strftime('%H:%M')
            caption = f"Murashki Bot: отправлен бекап\nФайлов: {count} | Размер: {round(size/1024/1024, 2)} MB | Время: {now}"
            bot.send_document(chat_id=CHAT_ID, document=open(zip_path, 'rb'), filename=os.path.basename(zip_path), caption=caption)
        time.sleep(SEND_INTERVAL)

def start(update, context):
    global CHAT_ID
    CHAT_ID = update.effective_chat.id
    context.bot.send_message(chat_id=CHAT_ID, text="Привет! Я — Murashki Bot. Бекапы будут приходить каждые 30 минут.")

def main():
    updater = Updater(token=TELEGRAM_TOKEN, use_context=True)
    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))

    Thread(target=send_backup, daemon=True).start()
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()