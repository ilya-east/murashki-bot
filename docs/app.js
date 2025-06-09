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

    // Добавляем несколько копий треков для бесконечности
    const trackCount = Math.max(6, Math.floor(container.clientHeight / 80) * 2); // Минимум 6 треков
    for (let i = 0; i < trackCount; i++) {
      const track = tracks[i % tracks.length]; // Зацикливаем треки
      const wrapper = createTrackElement(track);
      container.appendChild(wrapper);
    }

    initPlayerLogic();
    initInfiniteScroll();
  })
  .catch((err) => console.error("Ошибка загрузки треков:", err));

// === Создаём элемент трека ===
function createTrackElement(track) {
  const wrapper = document.createElement("div");
  wrapper.className = "custom-player";
  wrapper.setAttribute("data-track-id", track.audio);
  wrapper.style.opacity = '1';

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

// === Бесконечная прокрутка без скачков ===
function initInfiniteScroll() {
  const container = document.querySelector('.players-container');
  const playerGrid = document.querySelector('.player-grid');

  if (!container || !playerGrid || container.scrollHeight <= container.clientHeight) {
    console.log("Прокрутка не нужна");
    return;
  }

  let isPaused = false;
  const trackHeight = getTrackHeight(); // Точная высота трека

  function scrollLoop() {
    if (!isPaused) {
      container.scrollTop += 1;

      // Когда достигли ~50% прокрутки — начинаем подготовку
      if (container.scrollTop >= container.scrollHeight / 2) {
        const firstPlayer = playerGrid.firstElementChild;
        if (firstPlayer) {
          firstPlayer.style.opacity = '0'; // Скрываем первый трек
          setTimeout(() => {
            playerGrid.appendChild(firstPlayer); // Перемещаем в конец
            container.scrollTop -= trackHeight; // Корректируем scrollTop
            firstPlayer.style.opacity = '1'; // Показываем снова
            initPlayerLogic(); // Обновляем логику
          }, 150);
        }
      }
    }

    requestAnimationFrame(scrollLoop);
  }

  // Остановка при клике или тапе
  container.addEventListener('click', () => {
    isPaused = true;
    console.log("Прокрутка остановлена");
    setTimeout(() => {
      isPaused = false;
      console.log("Прокрутка возобновлена");
    }, 5000);
  });

  container.addEventListener('touchstart', () => {
    isPaused = true;
    console.log("Прокрутка остановлена");
    setTimeout(() => {
      isPaused = false;
      console.log("Прокрутка возобновлена");
    }, 5000);
  });

  // Запуск прокрутки
  requestAnimationFrame(scrollLoop);
}