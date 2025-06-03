import requests
import json

# Твой OAuth токен
TOKEN = "..."

HEADERS = {
    "Authorization": f"OAuth {TOKEN}"
}

# Папки в корне Диска
MUSIC_FOLDER = "disk:/music"
COVERS_FOLDER = "disk:/covers"

def list_files(path):
    url = f"https://cloud-api.yandex.net/v1/disk/resources"
    params = {"path": path}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()['_embedded']['items']

def get_direct_link(path):
    url = "https://cloud-api.yandex.net/v1/disk/resources/download"
    params = {"path": path}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()['href']

# Получение всех файлов из music/ и covers/
music_files = list_files(MUSIC_FOLDER)
cover_files = list_files(COVERS_FOLDER)

# Сопоставление по имени файла
music_map = {
    f['name'].rsplit('.', 1)[0]: get_direct_link(f['path'])
    for f in music_files if f['name'].lower().endswith('.mp3')
}

cover_map = {
    f['name'].rsplit('.', 1)[0]: get_direct_link(f['path'])
    for f in cover_files if f['name'].lower().endswith(('.jpg', '.jpeg', '.png'))
}

# Объединяем
tracks = []
for name in music_map:
    if name in cover_map:
        tracks.append({
            "title": name,
            "audio": music_map[name],
            "cover": cover_map[name]
        })

# Сохраняем JSON в эту же папку
with open("tracks.json", "w", encoding="utf-8") as f:
    json.dump(tracks, f, ensure_ascii=False, indent=2)

print(f"[✓] Сохранено {len(tracks)} треков в tracks.json")