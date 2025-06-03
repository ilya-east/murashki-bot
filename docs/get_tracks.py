import os
import json

# Пути к папкам
audio_folder = "docs/audio"
cover_folder = "docs/covers"

# Основной список треков
tracks = []

for filename in os.listdir(audio_folder):
    if filename.lower().endswith(".mp3"):
        name = os.path.splitext(filename)[0]

        audio_url = f"https://ilya-east.github.io/murashki-bot/docs/audio/{filename}"

        # Проверка на обложку
        cover_url = ""
        if os.path.exists(os.path.join(cover_folder, f"{name}.jpg")):
            cover_url = f"https://ilya-east.github.io/murashki-bot/docs/covers/{name}.jpg"
        elif os.path.exists(os.path.join(cover_folder, f"{name}.png")):
            cover_url = f"https://ilya-east.github.io/murashki-bot/docs/covers/{name}.png"

        tracks.append({
            "title": name,
            "author": "Murashki",
            "audio": audio_url,
            "cover": cover_url
        })

# Сохранение в JSON
with open("docs/tracks.json", "w", encoding="utf-8") as f:
    json.dump(tracks, f, ensure_ascii=False, indent=2)

print(f"[✓] Сохранено {len(tracks)} треков в tracks.json")