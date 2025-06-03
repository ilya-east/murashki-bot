const firebaseConfig = {
  apiKey: "AIzaSyBdmyEmyzp2eJK-wqkfCS-OSZrvQWy6Pg",
  authDomain: "murashki-6f04e.firebaseapp.com",
  databaseURL: "https://murashki-6f04e-default-rtdb.firebaseio.com",
  projectId: "murashki-6f04e",
  storageBucket: "murashki-6f04e.appspot.com",
  messagingSenderId: "687056541772",
  appId: "1:687056541772:web:2a037f46311812719bce9",
  measurementId: "G-8CCNCKGMQQ"
};
firebase.initializeApp(firebaseConfig);

fetch("tracks.json")
  .then((res) => res.json())
  .then((tracks) => {
    const container = document.getElementById("players");
    let currentAudio = null;
    let currentBtn = null;

    tracks.forEach((track) => {
      const el = document.createElement("div");
      el.className = "custom-player";
      el.innerHTML = `
        <img class="cover" src="${track.cover}" alt="cover">
        <div class="player-info">
          <div class="player-title">${track.title}</div>
          <div class="player-author">${track.author || "Murashki"}</div>
        </div>
        <div class="player-controls">
          <button class="btn play-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button class="btn like-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
            2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 
            19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <span class="like-count">0</span>
        </div>
        <audio src="${track.audio}" preload="none"></audio>
      `;
      container.appendChild(el);

      const audio = el.querySelector("audio");
      const btn = el.querySelector(".play-btn");
      const likeBtn = el.querySelector(".like-btn");
      const likeCount = el.querySelector(".like-count");
      const trackId = track.title.toLowerCase().replace(/\s/g, "_");

      const dbRef = firebase.database().ref("likes/" + trackId);
      dbRef.on("value", (snapshot) => {
        likeCount.textContent = snapshot.val() || 0;
      });

      btn.addEventListener("click", () => {
        if (currentAudio && currentAudio !== audio) {
          currentAudio.pause();
          currentBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
        }

        if (audio.paused) {
          audio.play().catch(() => {});
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
          currentAudio = audio;
          currentBtn = btn;
        } else {
          audio.pause();
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
        }
      });

      audio.addEventListener("ended", () => {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
      });

      likeBtn.addEventListener("click", () => {
        const liked = localStorage.getItem("liked_" + trackId);
        dbRef.transaction((likes) => {
          if (liked) {
            localStorage.removeItem("liked_" + trackId);
            likeBtn.querySelector("svg").setAttribute("fill", "#fff");
            return (likes || 1) - 1;
          } else {
            localStorage.setItem("liked_" + trackId, "true");
            likeBtn.querySelector("svg").setAttribute("fill", "#ff0000");
            return (likes || 0) + 1;
          }
        });
      });

      if (localStorage.getItem("liked_" + trackId)) {
        likeBtn.querySelector("svg").setAttribute("fill", "#ff0000");
      }
    });
  });
