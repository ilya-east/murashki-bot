import os
import json

audio_folder = "audio"
cover_folder = "covers"
output_file = "tracks.json"

print("Starting scan...")

if not os.path.exists(audio_folder):
    print(f"Audio folder '{audio_folder}' not found!")
    exit()

if not os.path.exists(cover_folder):
    print(f"Covers folder '{cover_folder}' not found!")
    exit()

# === Загрузка существующих данных ===
try:
    with open(output_file, "r", encoding="utf-8") as f:
        existing_tracks = json.load(f)
except FileNotFoundError:
    existing_tracks = []

# Убираем дубликаты из старого списка
unique_tracks = {}
for track in existing_tracks:
    audio_path = track["audio"]
    unique_tracks[audio_path] = track  # Автоматически перезапишет при повторах

# === Сканирование новых треков ===
new_tracks = []

for filename in os.listdir(audio_folder):
    if filename.endswith(".mp3"):
        name = os.path.splitext(filename)[0]
        cover_found = False
        cover_path = ""

        # Ищем обложку
        for ext in [".png", ".jpg", ".jpeg"]:
            candidate = os.path.join(cover_folder, f"{name}{ext}")
            if os.path.exists(candidate):
                cover_path = f"covers/{name}{ext}"
                cover_found = True
                break

        if not cover_found:
            print(f"No cover found for {filename}")
            continue

        audio_path = f"audio/{filename}"

        # Добавляем в уникальный словарь
        if audio_path not in unique_tracks:
            unique_tracks[audio_path] = {
                "title": name,
                "author": "Murashki",
                "audio": audio_path,
                "cover": cover_path
            }

# === Сохраняем только уникальные треки ===
updated_tracks = list(unique_tracks.values())

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(updated_tracks, f, ensure_ascii=False, indent=2)

print(f"Saved {len(updated_tracks)} tracks to {output_file}")