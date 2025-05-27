from flask import Flask, request
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'project'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('file')
    filename = file.filename
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    return f'Файл {filename} сохранён.', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)