// script.js
// Unified logic for index.html & featured.html

document.addEventListener("DOMContentLoaded", () => {
  const DATA_URL      = "data/data.json";
  const gridAll       = document.querySelector(".playlist-cards");
  const gridFeatured  = document.querySelector(".featured-container");
  const overlay       = document.querySelector(".modal-overlay");
  const modalContent  = document.querySelector(".modal-content");
  const closeModalBtn = modalContent?.querySelector(".modal-close");

  // Optional controls on index.html
  const searchInput   = document.getElementById("search-input");
  const btnSearch     = document.getElementById("btn-search");
  const btnClear      = document.getElementById("btn-clear");
  const sortSelect    = document.getElementById("sort-select");

  // Add/Edit modal elements (only exist on index.html)
  const addBtn        = document.getElementById("btn-add-playlist");
  const addModal      = document.getElementById("add-modal");
  const addCloseBtn   = addModal?.querySelector(".modal-close");
  const addForm       = document.getElementById("add-form");
  const songsList     = document.getElementById("songs-list");
  const addSongBtn    = document.getElementById("add-song-btn");
  const formTitle     = document.getElementById("form-title");
  const formSubmitBtn = document.getElementById("form-submit-btn");

  let playlists = [];

  // —— Helpers ——————————————————————————————————

  function shuffleArr(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function fetchPreviewUrl({ title, artist }) {
    try {
      const term = encodeURIComponent(`${title} ${artist}`);
      const res  = await fetch(`https://itunes.apple.com/search?term=${term}&limit=1`);
      const { results } = await res.json();
      return results?.[0]?.previewUrl || null;
    } catch {
      return null;
    }
  }

  // —— Modal detail rendering —————————————————————

  function renderSongs(list) {
    const ul = modalContent.querySelector(".song-list");
    ul.innerHTML = list.map(s => `
      <li class="song">
        <div class="song-details">
          <span class="song-title">${s.title}</span>
          <span class="song-artist-duration">${s.artist} • ${s.duration || "—"}</span>
        </div>
        ${s.preview
          ? `<audio controls src="${s.preview}"></audio>`
          : `<em>No preview available</em>`}
      </li>
    `).join("");
  }

  async function showModal(pl) {
    modalContent.querySelector(".modal-cover").src = pl.playlist_art;
    modalContent.querySelector(".modal-title").textContent = pl.playlist_name;

    let enriched = await Promise.all(pl.songs.map(async s => ({
      ...s, preview: await fetchPreviewUrl(s)
    })));

    renderSongs(enriched);
    modalContent.querySelector(".shuffle-button").onclick = e => {
      e.stopPropagation();
      enriched = shuffleArr(enriched);
      renderSongs(enriched);
    };
    overlay.hidden = false;
  }

  if (closeModalBtn) {
    closeModalBtn.onclick = () => overlay.hidden = true;
    overlay.onclick = e => {
      if (e.target === overlay) overlay.hidden = true;
    };
  }

  // —— Card & Grid rendering —————————————————————

  function makeCard(pl, idx) {
    const card = document.createElement("div");
    card.className = "playlist-card";
    card.innerHTML = `
      <img src="${pl.playlist_art}" class="playlist-cover" alt="">
      <div class="playlist-info">
        <h3 class="playlist-title">${pl.playlist_name}</h3>
        <div class="like-container">
          <span class="playlist-author">${pl.playlist_author}</span>
          <span class="like-count">${pl.likes}</span>
          <button class="like-button"><span class="like-icon">${pl.liked ? "♥":"♡"}</span></button>
        </div>
        <button class="edit-button" aria-label="Edit playlist">✏️</button>
        <button class="delete-button" aria-label="Delete playlist">🗑️</button>
      </div>
    `;

    card.addEventListener("click", e => {
      if (
        !e.target.closest(".like-button") &&
        !e.target.closest(".delete-button") &&
        !e.target.closest(".edit-button")
      ) {
        showModal(pl);
      }
    });

    // like
    card.querySelector(".like-button").onclick = e => {
      e.stopPropagation();
      pl.liked = !pl.liked;
      pl.likes += pl.liked ? 1 : -1;
      renderGrid(currentList());
    };

    // delete
    card.querySelector(".delete-button").onclick = e => {
      e.stopPropagation();
      playlists.splice(idx,1);
      renderGrid(currentList());
    };

    // edit
    card.querySelector(".edit-button").onclick = e => {
      e.stopPropagation();
      openEditModal(pl, idx);
    };

    return card;
  }

  function renderGrid(list) {
    if (!gridAll) return;
    gridAll.innerHTML = "";
    list.forEach((pl,i) => gridAll.appendChild(makeCard(pl,i)));
  }

  // —— Featured Page —————————————————————————

  async function renderFeatured(pl) {
    if (!gridFeatured) return;
    gridFeatured.innerHTML = `
      <img src="${pl.playlist_art}" class="featured-thumb" alt="">
      <h2>${pl.playlist_name}</h2>
      <button class="shuffle-button">🔀 Shuffle Songs</button>
    `;
    gridFeatured.querySelector(".shuffle-button").onclick = () => showModal(pl);
    await showModal(pl);
  }

  // —— Search / Clear / Sort (index only) ——————————————————

  function currentList() {
    let list = [...playlists];
    if (sortSelect && sortSelect.value) {
      switch (sortSelect.value) {
        case "name":
          list.sort((a,b)=>a.playlist_name.localeCompare(b.playlist_name));
          break;
        case "likes":
          list.sort((a,b)=>b.likes - a.likes);
          break;
        case "date":
          list.sort((a,b)=>b.dateAdded - a.dateAdded);
          break;
      }
    }
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      list = list.filter(pl =>
        pl.playlist_name.toLowerCase().includes(q) ||
        pl.playlist_author.toLowerCase().includes(q)
      );
    }
    return list;
  }

  if (searchInput && btnSearch && btnClear && sortSelect) {
    btnSearch.onclick = () => renderGrid(currentList());
    searchInput.onkeydown = e => {
      if (e.key === "Enter") { e.preventDefault(); btnSearch.click(); }
    };
    btnClear.onclick = () => {
      searchInput.value = "";
      sortSelect.value = "";
      renderGrid(currentList());
    };
    sortSelect.onchange = () => renderGrid(currentList());
  }

  // —— Add / Edit modal (index only) ——————————————————

  function addSongInput(song={title:"",artist:"",duration:""}) {
    const row = document.createElement("div");
    row.className = "song-input-row";
    const i = songsList.children.length;
    row.innerHTML = `
      <label>Title:<input name="song-title-${i}" value="${song.title}" required></label>
      <label>Artist:<input name="song-artist-${i}" value="${song.artist}" required></label>
      <label>Duration:<input name="song-duration-${i}" value="${song.duration}" placeholder="3:45"></label>
    `;
    songsList.appendChild(row);
  }

  function setupAddMode() {
    formTitle.textContent = "Add New Playlist";
    formSubmitBtn.textContent = "Create Playlist";
    addForm.onsubmit = e => {
      e.preventDefault();
      const art = addForm.cover.value.trim() || "assets/img/default-cover.jpg";
      const pl = {
        playlist_name: addForm.name.value.trim(),
        playlist_author: addForm.author.value.trim(),
        playlist_art: art,
        likes: 0,
        liked: false,
        songs: Array.from(songsList.children).map((r,i)=>({
          title:  addForm[`song-title-${i}`].value.trim(),
          artist: addForm[`song-artist-${i}`].value.trim(),
          duration: addForm[`song-duration-${i}`].value.trim()||"—"
        })),
        dateAdded: Date.now()
      };
      playlists.push(pl);
      addForm.reset();
      addModal.hidden = true;
      renderGrid(currentList());
    };
  }

  function openEditModal(pl, idx) {
    formTitle.textContent = "Edit Playlist";
    formSubmitBtn.textContent = "Save Changes";
    addForm.name.value   = pl.playlist_name;
    addForm.author.value = pl.playlist_author;
    addForm.cover.value  = "";
    songsList.innerHTML  = "";
    pl.songs.forEach(addSongInput);
    addModal.hidden = false;
    addForm.onsubmit = e => {
      e.preventDefault();
      pl.playlist_name   = addForm.name.value.trim();
      pl.playlist_author = addForm.author.value.trim();
      pl.songs = Array.from(songsList.children).map((r,i)=>({
        title: addForm[`song-title-${i}`].value.trim(),
        artist:addForm[`song-artist-${i}`].value.trim(),
        duration:addForm[`song-duration-${i}`].value.trim()||"—"
      }));
      addForm.reset();
      addModal.hidden = true;
      setupAddMode();
      renderGrid(currentList());
    };
  }

  if (addBtn && addModal && addForm && songsList && formTitle && formSubmitBtn) {
    addBtn.onclick = () => {
      addForm.reset();
      songsList.innerHTML = "";
      addSongInput();
      setupAddMode();
      addModal.hidden = false;
    };
    addCloseBtn.onclick = () => addModal.hidden = true;
    addModal.onclick = e => { if(e.target===addModal) addModal.hidden=true; };
    addSongBtn.onclick = e => { e.preventDefault(); addSongInput(); };
  }

  // —— Initialization ————————————————————————————

  fetch(DATA_URL)
    .then(r=>r.json())
    .then(data=>{
      playlists = data.playlists.map(pl=>({
        ...pl, liked:false, dateAdded: Date.now()
      }));
      // if index.html
      if (gridAll) renderGrid(currentList());
      // if featured.html
      if (gridFeatured) {
        const pick = playlists[Math.floor(Math.random()*playlists.length)];
        renderFeatured(pick);
      }
    })
    .catch(console.error);
});
