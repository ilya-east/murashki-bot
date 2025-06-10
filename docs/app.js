// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBdmyEmyzp2eJK-wqkfCS-OSZrvQWy6Pg",
  authDomain: "murashki-6f04e.firebaseapp.com",
  databaseURL: "https://murashki-6f04e-default-rtdb.firebaseio.com",   
  projectId: "murashki-6f04e",
  storageBucket: "murashki-6f04e.appspot.com",
  messagingSenderId: "687056541772",
  appId: "1:687056541772:web:2a037f46311812719bce9"
};

firebase.initializeApp(firebaseConfig);

let tracks = [];

// === Загрузка треков ===
fetch("tracks.json")
  .then((res) => res.json())
  .then((data) => {
    tracks = data;

    const container = document.getElementById("players");

    tracks.forEach(track => {
      const wrapper = createTrackElement(track);
      container.appendChild(wrapper);
    });

    initPlayerLogic();
    initScrollLoop(); // Запуск автопрокрутки вниз/вверх
  })
  .catch((err) => console.error("Ошибка загрузки треков:", err));

// === Создаём элемент трека ===
function createTrackElement(track) {
  const wrapper = document.createElement("div");
  wrapper.className = "custom-player";
  wrapper.setAttribute("data-track-id", track.audio); // Для идентификации

  wrapper.innerHTML = `
    <img class="cover" src="${track.cover}" alt="cover">
    <div class="player-info">
      <div class="player-title">${track.title}</div>
      <div class="player-author">${track.author}</div>
    </div>
    <div class="player-controls">
      <button class="btn play-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="btn like-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                   2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
                   C13.09 3.81 14.76 3 16.5 3 
                   19.58 3 22 5.42 22 8.5
                   c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>
      <span class="like-count">0</span>
    </div>
    <audio src="${track.audio}"></audio>
  `;
  return wrapper;
}

// === Логика проигрывателя ===
function initPlayerLogic() {
  let currentAudio = null;
  let currentBtn = null;

  // Удаляем старые кнопки, чтобы избежать дублирования событий
  document.querySelectorAll(".play-btn").forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });

  document.querySelectorAll(".custom-player").forEach((player) => {
    const audio = player.querySelector("audio");
    const playBtn = player.querySelector(".play-btn");
    const likeBtn = player.querySelector(".like-btn");
    const likeCount = player.querySelector(".like-count");

    const trackId = audio.src.split("/").pop().split(".")[0];
    const dbRef = firebase.database().ref("likes/" + trackId);

    dbRef.on("value", (snapshot) => {
      likeCount.textContent = snapshot.val() || 0;
    });

    if (localStorage.getItem(`liked_${trackId}`)) {
      likeBtn.querySelector("svg").setAttribute("fill", "#ff0000");
    }

    playBtn.addEventListener("click", () => {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        if (currentBtn) {
          currentBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
        }
      }

      if (audio.paused) {
        audio.play().catch((err) => {
          console.error("Ошибка воспроизведения:", err);
          playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
        });
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        currentAudio = audio;
        currentBtn = playBtn;

        // Обновляем Media Session
        updateMediaSession({
          title: audio.parentElement.querySelector('.player-title').textContent,
          artworkUrl: audio.parentElement.querySelector('.cover').src
        });
      } else {
        audio.pause();
        playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
      }
    });

    audio.addEventListener("ended", () => {
      playBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
    });

    likeBtn.addEventListener("click", () => {
      const likedKey = `liked_${trackId}`;
      const alreadyLiked = localStorage.getItem(likedKey);

      dbRef.transaction((likes) => {
        if (alreadyLiked) {
          localStorage.removeItem(likedKey);
          likeBtn.querySelector("svg").setAttribute("fill", "#fff");
          return (likes || 1) - 1;
        } else {
          localStorage.setItem(likedKey, "true");
          likeBtn.querySelector("svg").setAttribute("fill", "#ff0000");
          return (likes || 0) + 1;
        }
      });
    });
  });
}

// === Автопрокрутка только на мобильных устройствах ===
function initScrollLoop() {
  const container = document.querySelector('.players-container');
  const playerGrid = document.querySelector('.player-grid');

  if (!container || !playerGrid || container.scrollHeight <= container.clientHeight) {
    console.log("Прокрутка не нужна");
    return;
  }

  let direction = 1; // 1 = вниз, -1 = вверх

  // Проверяем, мобильное ли устройство
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  function scrollLoop() {
    if (isMobile && !container.classList.contains('paused')) {
      container.scrollTop += direction;

      // Если достигли низа — меняем направление через 3 секунды
      if (direction === 1 && container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.classList.add('paused');
        setTimeout(() => {
          direction = -1;
          container.classList.remove('paused');
        }, 3000);
      }

      // Если достигли верха — меняем направление через 3 секунды
      if (direction === -1 && container.scrollTop <= 0) {
        container.classList.add('paused');
        setTimeout(() => {
          direction = 1;
          container.classList.remove('paused');
        }, 3000);
      }
    }

    requestAnimationFrame(scrollLoop);
  }

  // Только мобильные получают обработчики событий
  if (isMobile) {
    container.addEventListener('click', () => {
      container.classList.add('paused');
      setTimeout(() => {
        container.classList.remove('paused');
      }, 3000);
    });

    container.addEventListener('touchstart', () => {
      container.classList.add('paused');
      setTimeout(() => {
        container.classList.remove('paused');
      }, 3000);
    });
  }

  // Запуск прокрутки
  requestAnimationFrame(scrollLoop);
}

// === Функция для работы с шторкой ===
function updateMediaSession({ title, artworkUrl }) {
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: "Murashki",
        album: "Мурашки Плеер",
        artwork: [
          { src: artworkUrl, sizes: "96x96", type: "image/png" },
          { src: artworkUrl, sizes: "128x128", type: "image/png" },
          { src: artworkUrl, sizes: "192x192", type: "image/png" },
          { src: artworkUrl, sizes: "256x256", type: "image/png" },
          { src: artworkUrl, sizes: "512x512", type: "image/png" }
        ]
      });
    } catch (e) {
      console.warn("Не удалось обновить mediaSession:", e);
    }

    // Добавляем обработчики управления (можно расширить позже)
    navigator.mediaSession.setActionHandler('play', () => {
      if (currentAudio && currentAudio.paused) currentAudio.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (currentAudio && !currentAudio.paused) currentAudio.pause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log("Next track");
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log("Previous track");
    });
  }
}