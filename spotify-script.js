const clientId = '43f735a675d04dc593023010c69937f3';
const redirectUri = 'http://localhost:5500/main.html';
const clientSecret = 'b210e084ecbc47acb8e401c2d91ef440';
const scopes = 'user-top-read playlist-read-private playlist-modify-private playlist-modify-public streaming user-read-playback-state user-modify-playback-state';

function loginWithSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = authUrl;
}




const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
const accessToken = params.get('access_token');




// Fetch and display top artists
fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    const topArtistsList = document.getElementById('top-artists');
    window.fullArtistsList = data.items;

    topArtistsList.innerHTML = data.items
      .slice(0, 3)
      .map(
        (artist) => `
        <li>
          <img src="${artist.images[0]?.url || 'default.jpg'}" alt="${artist.name}" class="artist-image" />
          <span>${artist.name}</span>
        </li>
      `
      )
      .join('');
  })
  .catch((error) => {
    console.error('Error fetching top artists:', error);
    document.getElementById('top-artists').innerHTML = '<li>Failed to load data</li>';
  });

// Fetch and display top songs
fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    const topSongsList = document.getElementById('top-songs');
    window.fullSongsList = data.items;

    topSongsList.innerHTML = data.items
      .slice(0, 3)
      .map(
        (track) => `
        <li>
          <img src="${track.album.images[0]?.url || 'default.jpg'}" alt="${track.name}" class="song-image" />
          <span>${track.name} by ${track.artists.map((artist) => artist.name).join(', ')}</span>
        </li>
      `
      )
      .join('');
  })
  .catch((error) => {
    console.error('Error fetching top songs:', error);
    document.getElementById('top-songs').innerHTML = '<li>Failed to load data</li>';
  });

// Fetch user's listening history summary
fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    const totalTracks = data.items.length;
    const favoriteArtist = data.items[0]?.artists[0]?.name || 'Unknown Artist';

    document.getElementById('listening-summary').innerHTML = `
      Total Tracks Played: ${totalTracks}<br>
      Favorite Artist: ${favoriteArtist}
    `;
  })
  .catch((error) => {
    console.error('Error fetching listening history summary:', error);
    document.getElementById('listening-summary').innerHTML = 'Failed to load listening history.';
  });

// Fetch user's top genres
fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    const genres = {};
    data.items.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genres[genre] = (genres[genre] || 0) + 1;
      });
    });

    const sortedGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topGenresList = document.getElementById('top-genres');
    topGenresList.innerHTML = sortedGenres
      .map(([genre]) => `<li>${genre}</li>`)
      .join('');
  })
  .catch((error) => {
    console.error('Error fetching top genres:', error);
    document.getElementById('top-genres').innerHTML = '<li>Failed to load genres</li>';
  });

// Fetch and display user playlists
fetch(`https://api.spotify.com/v1/me/playlists`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    const playlistsList = document.getElementById('user-playlists');
    playlistsList.innerHTML = data.items
      .map(
        (playlist) => `
        <li data-playlist-id="${playlist.id}">
          <img src="${playlist.images?.[0]?.url || 'default.jpg'}" alt="${playlist.name}" />
          <span title="${playlist.name}">${playlist.name}</span>
        </li>
      `
      )
      .join('');

    // Add event listener to playlist list items
    const playlistItems = document.querySelectorAll('#user-playlists li');
    playlistItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        const playlistId = event.target.closest('li').getAttribute('data-playlist-id');
        playPlaylist(playlistId);
      });
    });
  })
  .catch((error) => {
    console.error('Error fetching user playlists:', error);
    document.getElementById('user-playlists').innerHTML = '<li>Failed to load playlists</li>';
  });

// Function to play a playlist
function playPlaylist(playlistId) {
  const tracks = [];
  const limit = 100; // Fetch 100 tracks at a time
  let offset = 0;

  function fetchTracks() {
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        tracks.push(...data.items.map((item) => item.track));
        offset += limit;
        if (data.next) {
          fetchTracks(); // Fetch next page of tracks
        } else {
          playTracks(tracks);
        }
      })
      .catch((error) => {
        console.error('Error fetching playlist tracks:', error);
      });
  }

  fetchTracks(); // Call the fetchTracks function
}

// Function to play a list of tracks
function playTracks(tracks) {
  const player = new Spotify.Player({
    name: 'SpotifyPlay',
    getOAuthToken: (callback) => {
      callback(accessToken);
    },
  });

  player.connect().then(() => {
    player.play({
      uris: tracks.map((track) => track.uri),
    });
  });
}

// Mock data for active time chart
const mockData = {
  labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  datasets: [{
    label: 'Active Time (hours)',
    data: [2, 3, 1.5, 4, 2.5, 3.5, 1],
    backgroundColor: [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#1DB954'
    ],
    borderColor: [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#1DB954'
    ],
    borderWidth: 1,
  }],
};

// Chart functionality
let chartInstance;
function renderChart(chartType = 'bar') {
  const ctx = document.getElementById('mock-data-chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: chartType,
    data: mockData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'white'
          }
        }
      },
      fontColor: 'white',
      scales: {
        x: {
          display: chartType !== 'pie' && chartType !== 'doughnut',
          ticks: {
            color: 'white'
          },
          title: {
            display: chartType !== 'pie' && chartType !== 'doughnut',
            color: 'white'
          }
        },
        y: {
          display: chartType !== 'pie' && chartType !== 'doughnut',
          beginAtZero: true,
          ticks: {
            color: 'white'
          },
          title: {
            display: chartType !== 'pie' && chartType !== 'doughnut',
            color: 'white'
          }
        }
      }
    },
  });
}
document.getElementById('chart-type-selector').addEventListener('change', (event) => {
  renderChart(event.target.value);
});
renderChart();

/*************  ✨ Windsurf Command 🌟  *************/
// Mood playlist generation
// List of valid Spotify genre seeds
const validGenres = [
  'acoustic', 'ambient', 'classical', 'country', 'dance', 
  'electronic', 'hip-hop', 'jazz', 'pop', 'rock', 'sleep'
];

function generateMoodPlaylist() {
  // Check for valid token
  if (!accessToken) {
    alert('Please login again - your session has expired');
    loginWithSpotify();
    return;
  }

  const selectedMood = document.getElementById('mood-selector').value;
  const playlistLength = parseInt(document.getElementById('playlist-length').value, 10) || 10;

  // Validate genre
  if (!validGenres.includes(selectedMood)) {
    alert(`"${selectedMood}" is not a valid Spotify genre. Please choose from the list.`);
    return;
  }

  fetch(`https://api.spotify.com/v1/recommendations?limit=${playlistLength}&seed_genres=${selectedMood}`, {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        console.error('API Error:', text);
        throw new Error(`Spotify API Error: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.tracks || data.tracks.length === 0) {
      throw new Error('No tracks found for this genre');
    }

    const moodPlaylistList = document.getElementById('mood-playlist');
    moodPlaylistList.innerHTML = data.tracks.map(track => `
      <li>
        <span>${track.name} by ${track.artists.map(a => a.name).join(', ')}</span>
      </li>
    `).join('');
    
    window.generatedPlaylist = data.tracks;
  })
  .catch(error => {
    console.error('Playlist generation failed:', error);
    document.getElementById('mood-playlist').innerHTML = `
      <li class="error">Failed to generate playlist: ${error.message}</li>
    `;
  });
}
/*******  cf6e7611-28b4-4f1c-b1db-180505c4235d  *******/  

function savePlaylist() {
  if (!window.generatedPlaylist || window.generatedPlaylist.length === 0) {
    alert('Please generate a playlist first!');
    return;
  }

  const playlistName = prompt('Enter a name for your playlist:', 'My Mood Playlist');
  if (!playlistName) return;

  // First get user ID
  fetch('https://api.spotify.com/v1/me', {
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  })
  .then((response) => {
    if (!response.ok) throw new Error('Failed to get user info');
    return response.json();
  })
  .then((userData) => {
    // Create the playlist
    return fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: playlistName,
        description: 'Generated by Mood-Based Playlist Generator',
        public: false,
      }),
    });
  })
  .then((response) => {
    if (!response.ok) throw new Error('Failed to create playlist');
    return response.json();
  })
  .then((playlistData) => {
    // Add tracks to the playlist
    const trackUris = window.generatedPlaylist.map(track => track.uri);
    return fetch(`https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    });
  })
  .then((response) => {
    if (!response.ok) throw new Error('Failed to add tracks to playlist');
    alert('Playlist saved successfully!');
  })
  .catch((error) => {
    console.error('Error saving playlist:', error);
    alert(`Failed to save playlist: ${error.message}`);
  });
}
// Modal functionality
function viewFullList(type) {
  const list = type === 'artists' ? window.fullArtistsList : window.fullSongsList;
  const fullListHtml = list
    .map(
      (item) => `
        <li>
          <img src="${item.images ? item.images[0]?.url : item.album.images[0]?.url || 'default.jpg'}" 
               alt="${item.name}" class="song-image" />
          <span class="song-info">${item.name} ${item.artists ? `by ${item.artists.map((artist) => artist.name).join(', ')}` : ''}</span>
          <button class="play-button" data-song-url="${item.preview_url}">Play</button>
        </li>`
    )
    .join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h3>Your Top ${type === 'artists' ? 'Artists' : 'Songs'}</h3>
      <button id="modal-close-button" class="close-button">Close</button>
    </div>
    <ul class="song-list">${fullListHtml}</ul>
  `;
  document.getElementById('modal').style.display = 'flex';

  // Add event listener to close modal when clicking outside
  document.getElementById('modal').addEventListener('click', (event) => {
    if (event.target === document.getElementById('modal')) {
      closeModal();
    }
  });

  // Add event listener to close modal when clicking close button
  document.getElementById('modal-close-button').addEventListener('click', closeModal);

  // Add event listener to play music when clicking play button
  document.querySelectorAll('.play-button').forEach((button) => {
    button.addEventListener('click', (event) => {
      const songUrl = event.target.getAttribute('data-song-url');
      playMusic(songUrl);
    });
  });
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function playMusic(songUrl) {
  const audioPlayer = document.getElementById('audio-player');
  if (!audioPlayer) {
    const audioElement = document.createElement('audio');
    audioElement.id = 'audio-player';
    audioElement.src = songUrl;
    document.body.appendChild(audioElement);
    audioElement.play();
  } else {
    audioPlayer.src = songUrl;
    audioPlayer.play();
  }
}

// Initialize Spotify Player
window.onSpotifyWebPlaybackSDKReady = () => {
  const player = new Spotify.Player({
    name: 'SpotifyPlay',
    getOAuthToken: (cb) => cb(accessToken),
    volume: 0.5,
  });

  player.connect().then((success) => {
    if (success) console.log('Connected to Spotify!');
  });

  player.addListener('ready', ({ device_id }) => {
    window.spotifyDeviceId = device_id;
  });
};
// Genre mappings for each playlist type
const playlistTypeGenres = {
  sleeping: ['ambient', 'classical', 'piano', 'sleep'],
  workout: ['work-out', 'fitness', 'hip-hop', 'edm', 'pop'],
  dining: ['jazz', 'dinner', 'acoustic', 'soul', 'lounge'],
  meditation: ['ambient', 'meditation', 'new-age', 'nature'],
  roadtrip: ['road-trip', 'rock', 'country', 'pop', 'indie']
};

// Function to generate a special playlist based on type and duration
function generateSpecialPlaylist() {
  const playlistType = document.getElementById('playlist-type').value;
  const playlistLength = parseInt(document.getElementById('playlist-duration').value, 10);
  
  // First get user's top genres to find the best match
  fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
    .then(response => response.json())
    .then(artistData => {
      // Analyze user's top genres
      const userGenres = {};
      artistData.items.forEach(artist => {
        artist.genres.forEach(genre => {
          userGenres[genre] = (userGenres[genre] || 0) + 1;
        });
      });
      
      // Find the best matching genre for this playlist type
      const suitableGenres = playlistTypeGenres[playlistType];
      let bestGenre = suitableGenres[0]; // default to first option
      
      // Check if user has any of the suitable genres in their top genres
      for (const genre of suitableGenres) {
        if (userGenres[genre]) {
          bestGenre = genre;
          break;
        }
      }
      
      // Now get recommendations based on the best genre
      return fetch(`https://api.spotify.com/v1/recommendations?limit=${playlistLength}&seed_genres=${bestGenre}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    })
    .then(response => response.json())
    .then(data => {
      const moodPlaylistList = document.getElementById('mood-playlist');
      const playlist = data.tracks || [];
      
      moodPlaylistList.innerHTML = playlist.map(
        ({ name, artists }) => `<li><span>${name} by ${artists.map(artist => artist.name).join(', ')}</span></li>`
      ).join('');
      
      window.generatedPlaylist = playlist;
    })
    .catch(error => {
      console.error('Error generating playlist:', error);
      document.getElementById('mood-playlist').innerHTML = '<li>Failed to generate playlist</li>';
    });
}