// script.js
// Music Playlist Explorer – unified logic for index.html & featured.html

document.addEventListener('DOMContentLoaded', () => {
  const DATA_URL      = 'data/data.json';
  const gridAll       = document.querySelector('.playlist-cards');
  const gridFeatured  = document.querySelector('.featured-container');
  const searchInput   = document.getElementById('search-input');
  const overlay       = document.querySelector('.modal-overlay');
  const modalContent  = document.querySelector('.modal-content');
  const closeBtn      = modalContent.querySelector('.modal-close');

  let playlists = [];  // will hold [{…}, …]

  // —— Helpers —————————————————————————————————————————

  // Fisher–Yates shuffle
  function shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // iTunes preview lookup
  async function fetchPreviewUrl(song) {
    const term = encodeURIComponent(`${song.title} ${song.artist}`);
    try {
      const res  = await fetch(`https://itunes.apple.com/search?term=${term}&limit=1`);
      const data = await res.json();
      return data.results?.[0]?.previewUrl || null;
    } catch {
      return null;
    }
  }

  // Inject songs into the modal’s <ul>
  function renderSongs(list) {
    const ul = modalContent.querySelector('.song-list');
    ul.innerHTML = list.map(s => `
      <li class="song">
        <div class="song-details">
          <span class="song-title">${s.title}</span>
          <span class="song-artist">${s.artist}</span>
        </div>
        ${s.preview
          ? `<audio controls src="${s.preview}"></audio>`
          : `<em>No preview available</em>`}
      </li>
    `).join('');
  }

  // Show the modal for one playlist
  async function showModal(pl) {
    modalContent.querySelector('.modal-cover').src         = pl.playlist_art;
    modalContent.querySelector('.modal-title').textContent = pl.playlist_name;

    let enriched = await Promise.all(
      pl.songs.map(async s => ({ ...s, preview: await fetchPreviewUrl(s) }))
    );

    renderSongs(enriched);

    const shuffleBtn = modalContent.querySelector('.shuffle-button');
    shuffleBtn.onclick = e => {
      e.stopPropagation();
      enriched = shuffleArr(enriched);
      renderSongs(enriched);
    };

    overlay.hidden = false;
  }

  // —— Card & Grid Rendering —————————————————————————

  function makeCard(pl) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `
      <img src="${pl.playlist_art}" class="playlist-cover" alt="">
      <div class="playlist-info">
        <h3 class="playlist-title">${pl.playlist_name}</h3>
        <div class="like-container">
          <span class="like-count">${pl.likes}</span>
          <button class="like-button">
            <span class="like-icon">${pl.liked ? '♥' : '♡'}</span>
          </button>
        </div>
      </div>
    `;

    // open modal
    card.addEventListener('click', e => {
      if (!e.target.closest('.like-button')) showModal(pl);
    });

    // like toggle
    card.querySelector('.like-button').addEventListener('click', e => {
      e.stopPropagation();
      pl.liked = !pl.liked;
      pl.likes += pl.liked ? 1 : -1;
      card.querySelector('.like-count').textContent = pl.likes;
      card.querySelector('.like-icon').textContent  = pl.liked ? '♥' : '♡';
    });

    return card;
  }

  function renderGrid(pls) {
    gridAll.innerHTML = '';
    pls.forEach(pl => gridAll.appendChild(makeCard(pl)));
  }

  // —— Featured Playlist ————————————————————————————

  async function renderFeatured(pl) {
    gridFeatured.innerHTML = `
      <div class="modal-content featured">
        <div class="modal-header">
          <img src="${pl.playlist_art}" class="modal-cover" alt="">
          <div class="modal-info">
            <h2 class="modal-title">${pl.playlist_name}</h2>
          </div>
        </div>
        <div class="modal-body">
          <h3>Songs</h3>
          <button class="shuffle-button">🔀 Shuffle</button>
          <ul class="song-list"></ul>
        </div>
      </div>
    `;

    // rebind modalContent & closeBtn
    const featuredModal = gridFeatured.querySelector('.modal-content');
    modalContent.innerHTML = featuredModal.innerHTML;
    await showModal(pl);

    // On featured.html only:
async function renderFeatured(pl) {
  // Optionally show a cover thumbnail in the page itself:
  document.querySelector('.featured-container').innerHTML = `
    <img src="${pl.playlist_art}" class="featured-thumb" alt="${pl.playlist_name}">
    <h2>${pl.playlist_name}</h2>
    <button class="shuffle-button">🔀 Shuffle</button>
  `;
  
  // Wire up that button to open the overlay:
  document.querySelector('.featured-container .shuffle-button')
    .onclick = () => showModal(pl);

  // Optionally open immediately:
  await showModal(pl);
}

// Initialization too:
fetch(DATA_URL)
  .then(r => r.json())
  .then(data => {
    const pls = data.playlists.map(pl => ({ ...pl, liked: false }));
    if (document.querySelector('.playlist-cards')) {
      renderGrid(pls);
    }
    if (document.querySelector('.featured-container')) {
      const pl = pls[Math.floor(Math.random() * pls.length)];
      renderFeatured(pl);
    }
  })
  .catch(console.error);

  }

  // —— Search Filtering ————————————————————————————

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = playlists.filter(pl =>
        pl.playlist_name.toLowerCase().includes(q) ||
        pl.playlist_author.toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });
  }

  // —— Modal Close Events ————————————————————————————

  closeBtn.addEventListener('click', () => overlay.hidden = true);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.hidden = true;
  });

  // —— Initialization ————————————————————————————

  fetch(DATA_URL)
    .then(r => r.json())
    .then(data => {
      playlists = data.playlists.map(pl => ({ ...pl, liked: false }));
      if (gridAll) {
        renderGrid(playlists);
      }
      if (gridFeatured) {
        const random = playlists[Math.floor(Math.random() * playlists.length)];
        renderFeatured(random);
      }
    })
    .catch(console.error);
});
