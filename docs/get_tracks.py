import os
import json

# Пути к папкам (относительно текущей директории)
audio_folder = "docs/audio"
cover_folder = "docs/covers"
output_file = "docs/tracks.json"

tracks = []

for filename in os.listdir(audio_folder):
    if filename.endswith(".mp3"):
        name = os.path.splitext(filename)[0]

        # Ищем подходящую обложку
        cover = ""
        for ext in [".png", ".jpg", ".jpeg", ".PNG", ".JPG"]:
            candidate = os.path.join(cover_folder, name + ext)
            if os.path.exists(candidate):
                cover = f"covers/{name}{ext}"
                break

        track = {
            "title": name,
            "author": "Murashki",
            "audio": f"audio/{filename}",
            "cover": cover
        }
        tracks.append(track)

# Сохраняем JSON
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(tracks, f, ensure_ascii=False, indent=2)

print(f"[✅] Сохранено {len(tracks)} треков в {output_file}")