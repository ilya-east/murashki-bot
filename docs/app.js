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

// === Загрузка треков ===
fetch("tracks.json")
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById("players");

    data.forEach(track => {
      const wrapper = document.createElement("div");
      wrapper.className = "custom-player";
      wrapper.innerHTML = `
        <img class="cover" src="${track.cover}" alt="cover">
        <div class="player-info">
          <div class="player-title">${track.title}</div>
          <div class="player-author">${track.author}</div>
        </div>
        <div class="player-controls">
          <button class="btn play-btn">▶</button>
          <button class="btn like-btn">❤</button>
          <span class="like-count">0</span>
        </div>
        <audio src="${track.audio}"></audio>
      `;
      container.appendChild(wrapper);
    });

    initPlayerLogic();
    initScrollLoop(); // Запуск автопрокрутки вниз/вверх
  })
  .catch((err) => console.error("Ошибка загрузки треков:", err));

// === Логика плеера и лайков ===
function initPlayerLogic() {
  let currentAudio = null;

  document.querySelectorAll(".custom-player").forEach((player) => {
    const audio = player.querySelector("audio");
    const playBtn = player.querySelector(".play-btn");
    const likeBtn = player.querySelector(".like-btn");
    const likeCount = player.querySelector(".like-count");

    playBtn.addEventListener("click", () => {
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        playBtn.textContent = "▶";
      }

      if (audio.paused) {
        audio.play().catch(() => {});
        playBtn.textContent = "❚❚";
        currentAudio = audio;
      } else {
        audio.pause();
        playBtn.textContent = "▶";
      }
    });

    likeBtn.addEventListener("click", () => {
      const trackId = audio.src.split("/").pop().split(".")[0];
      const dbRef = firebase.database().ref("likes/" + trackId);

      dbRef.transaction((likes) => {
        return (likes || 0) + 1;
      });

      likeCount.textContent = parseInt(likeCount.textContent) + 1;
      likeBtn.style.color = "#ff0000";
    });
  });
}

// === Автопрокрутка туда-обратно ===
function initScrollLoop() {
  const container = document.querySelector('.players-container');
  if (!container || container.scrollHeight <= container.clientHeight) return;

  let direction = 1; // 1 = вниз, -1 = вверх
  let isPaused = false;

  function scrollLoop() {
    if (!isPaused) {
      container.scrollTop += direction;

      // Если достигли низа — меняем направление на вверх через 5 сек
      if (direction === 1 && container.scrollTop >= container.scrollHeight - container.clientHeight) {
        isPaused = true;
        setTimeout(() => {
          direction = -1;
          isPaused = false;
        }, 5000);
      }

      // Если достигли верха — меняем направление на вниз через 5 сек
      if (direction === -1 && container.scrollTop <= 0) {
        isPaused = true;
        setTimeout(() => {
          direction = 1;
          isPaused = false;
        }, 5000);
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
    setTimeout(() => {
      isPaused = false;
      console.log("Прокрутка возобновлена");
    }, 5000);
  });

  requestAnimationFrame(scrollLoop);
}