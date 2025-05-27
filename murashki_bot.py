import os
import time
import zipfile
import requests
from datetime import datetime

TELEGRAM_TOKEN = os.environ.get("8057547167:AAG_GXS_QctYyIN-29JmlwWxOb5XY68I-Tk")
TELEGRAM_CHAT_ID = os.environ.get("1043974866")

FOLDER_TO_BACKUP = "project"
BACKUP_FOLDER = "backups"
DELAY_SECONDS = 60 * 30  # 30 минут

def create_backup():
    if not os.path.exists(BACKUP_FOLDER):
        os.makedirs(BACKUP_FOLDER)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    zip_filename = f"backup_{timestamp}.zip"
    zip_path = os.path.join(BACKUP_FOLDER, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(FOLDER_TO_BACKUP):
            for file in files:
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, FOLDER_TO_BACKUP)
                zipf.write(filepath, arcname)

    return zip_path

def send_to_telegram(file_path):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
    with open(file_path, "rb") as file:
        response = requests.post(url, data={
            "chat_id": TELEGRAM_CHAT_ID,
            "caption": f"Бекап сайта: {os.path.basename(file_path)}"
        }, files={"document": file})
    return response.ok, response.text

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def main_loop():
    log("Запущен Murashki Backup Bot.")
    while True:
        log("Создание архива...")
        archive_path = create_backup()
        log(f"Архив создан: {archive_path}")

        log("Отправка в Telegram...")
        success, response = send_to_telegram(archive_path)

        if success:
            log("Бекап успешно отправлен.")
        else:
            log(f"Ошибка при отправке: {response}")

        log(f"Ожидание {DELAY_SECONDS // 60} минут...")
        time.sleep(DELAY_SECONDS)

if __name__ == "__main__":
    main_loop()