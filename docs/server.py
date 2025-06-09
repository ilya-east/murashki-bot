import os
import http.server
import socketserver
import json
import subprocess

HOST = "localhost"
PORT = 8080

TRACKS_JSON_PATH = "tracks.json"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/update":
            print("🔄 Запускаю get_tracks.py...")
            try:
                # Выполняем get_tracks.py из текущей директории (docs/)
                result = subprocess.run(["python", "get_tracks.py"], check=True, capture_output=True, text=True)
                print(result.stdout)
                with open(TRACKS_JSON_PATH, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(content)

            except subprocess.CalledProcessError as e:
                print("❌ Ошибка при запуске get_tracks.py:", e.stderr)
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Error running get_tracks.py")

        elif self.path == "/tracks.json":
            try:
                with open(TRACKS_JSON_PATH, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                print("Ошибка чтения tracks.json:", e)
                self.send_response(500)
                self.end_headers()

        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/save":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            print("💾 Сохраняю tracks.json...")

            try:
                with open(TRACKS_JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"OK")
            except Exception as e:
                print("❌ Ошибка сохранения JSON:", e)
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Save failed")
        else:
            self.send_error(404, "Not Found")

# === Запуск сервера ===
if __name__ == "__main__":
    os.chdir(".")

    print(f"🚀 Локальный сервер запущен: http://{HOST}:{PORT}")
    server = socketserver.TCPServer((HOST, PORT), Handler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен.")
        server.shutdown()