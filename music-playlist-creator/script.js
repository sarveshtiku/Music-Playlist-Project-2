// script.js
// Core logic for Music Playlist Explorer with media controls

document.addEventListener('DOMContentLoaded', () => {
  const DATA_URL       = 'data/data.json';
  const cardsContainer = document.querySelector('.playlist-cards');
  const overlay        = document.querySelector('.modal-overlay');
  const modalContent   = document.querySelector('.modal-content');
  const closeBtn       = document.querySelector('.modal-close');
  const shuffleBtn     = document.querySelector('.shuffle-button');

  let playlists = [];

  // 1) Fisher–Yates shuffle helper
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // 2) Build a card element for a playlist
  function makeCard(pl) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.dataset.id = pl.playlistID;
    card.innerHTML = `
      <img src="${pl.playlist_art}" alt="${pl.playlist_name}" class="playlist-cover">
      <div class="playlist-info">
        <h3 class="playlist-title">${pl.playlist_name}</h3>
        <p class="playlist-creator">${pl.playlist_author}</p>
        <div class="like-container">
          <span class="like-count">${pl.likes}</span>
          <button class="like-button" aria-label="Like playlist">
            <span class="like-icon">${pl.liked ? '♥' : '♡'}</span>
          </button>
        </div>
      </div>
    `;

    card.addEventListener('click', e => {
      if (!e.target.closest('.like-button')) showModal(pl);
    });

    card.querySelector('.like-button').addEventListener('click', e => {
      e.stopPropagation();
      pl.liked = !pl.liked;
      pl.likes += pl.liked ? 1 : -1;
      card.querySelector('.like-icon').textContent  = pl.liked ? '♥' : '♡';
      card.querySelector('.like-count').textContent = pl.likes;
    });

    return card;
  }

  // 3) Render grid of playlists
  function renderGrid() {
    cardsContainer.innerHTML = '';
    playlists.forEach(pl => cardsContainer.appendChild(makeCard(pl)));
  }

  // 4) Populate & show modal with media controls
  function showModal(pl) {
    modalContent.querySelector('.modal-cover').src           = pl.playlist_art;
    modalContent.querySelector('.modal-title').textContent   = pl.playlist_name;
    modalContent.querySelector('.modal-creator').textContent = pl.playlist_author;

    const ul = modalContent.querySelector('.song-list');
ul.innerHTML = pl.songs.map((song, idx) => `
  <li class="song">
    <div class="song-controls">
      <button class="btn-play" data-index="${idx}">▶️</button>
      <button class="btn-skip" data-index="${idx}">⏭️</button>
    </div>
    <div class="song-details">
      <span class="song-title">${song.title}</span>
      <span class="song-artist">${song.artist}</span>
    </div>
    <div class="song-extras">
      <span class="song-duration">${song.duration}</span>
      <button class="btn-add" data-index="${idx}">＋</button>
      <button class="btn-more" data-index="${idx}">⋯</button>
    </div>
  </li>
`).join('');


    // Attach basic play/pause toggle
    ul.querySelectorAll('.btn-play').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const playing = btn.textContent === '⏸️';
        btn.textContent = playing ? '▶️' : '⏸️';
      });
    });

    shuffleBtn.onclick = e => {
      e.stopPropagation();
      shuffle(pl.songs);
      showModal(pl);
    };

    overlay.hidden = false;
  }

  // 5) Close modal
  closeBtn.addEventListener('click', () => overlay.hidden = true);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.hidden = true;
  });

  // 6) Load data & start
  fetch(DATA_URL)
    .then(res => res.json())
    .then(json => {
      playlists = json.playlists.map(pl => ({ ...pl, liked: false }));
      renderGrid();
    })
    .catch(err => console.error(err));
});
