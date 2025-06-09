import os
import json

audio_folder = "audio"
cover_folder = "covers"
output_file = "tracks.json"

tracks = []

# Если tracks.json существует — загружаем его
if os.path.exists(output_file):
    with open(output_file, "r", encoding="utf-8") as f:
        try:
            tracks = json.load(f)
        except json.JSONDecodeError:
            print("[⚠️] Файл tracks.json повреждён или отсутствует — создаём новый")

# Собираем треки
updated_tracks = []

for filename in os.listdir(audio_folder):
    if not filename.endswith(".mp3"):
        continue

    name = os.path.splitext(filename)[0]
    cover_found = False
    cover_path = ""

    for ext in [".png", ".jpg", ".jpeg"]:
        candidate = os.path.join(cover_folder, f"{name}{ext}")
        if os.path.exists(candidate):
            cover_path = f"covers/{name}{ext}"
            cover_found = True
            break

    if not cover_found:
        print(f"[⚠️] Обложка для {filename} не найдена!")
        continue

    # Ищем существующий трек по имени файла
    existing_track = next((t for t in tracks if t["audio"] == f"audio/{filename}"), None)

    updated_tracks.append({
        "title": existing_track["title"] if existing_track else name,
        "author": existing_track["author"] if existing_track else "Murashki",
        "audio": f"audio/{filename}",
        "cover": cover_path
    })

# Сохраняем обновлённый список
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(updated_tracks, f, ensure_ascii=False, indent=2)

print(f"[✅] Сохранено {len(updated_tracks)} треков в {output_file}")