let currentIndex = 0;
let preloadedArtworks = [];

//Fetching artworks from link
function preloadArtworks() {
  const url = 'https://api.artic.edu/api/v1/artworks?page=1&limit=100';

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const artworks = data.data;

      // Filter artworks with valid image URLs
      const filteredArtworks = artworks.filter(artwork => {
        return artwork.image_id || (artwork.thumbnail && artwork.thumbnail.lpiq);
      });

      const imageCheckPromises = filteredArtworks.map((artwork, index) => {
        const title = artwork.title || "Unknown Title";
        const artist = artwork.artist_title || "Unknown Artist";
        const altText = artwork.thumbnail ? artwork.thumbnail.alt_text : "No description available";
        const imageUrl = artwork.image_id
          ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/2000,/0/default.jpg`
          : artwork.thumbnail && artwork.thumbnail.lpiq;

        
        return fetch(imageUrl)
          .then(response => {
            if (response.ok) {
              return { title, artist, altText, imageUrl };
            } else {
              console.log(`Image not found for artwork: ${title} (Status code: ${response.status})`);
              return null; 
            }
          })
          .catch(error => {
            console.error('Error fetching image:', error);
            return null; 
          });
      });

      Promise.all(imageCheckPromises).then(results => {
        
        preloadedArtworks = results.filter(artwork => artwork !== null);

        
        if (preloadedArtworks.length > 0) {
          displayArtwork(preloadedArtworks[currentIndex]);
        }
        updatePaginationButtons();
      });
    })
    .catch(error => console.error('Error fetching data:', error));
}

//Display the artworks (function)
function displayArtwork(artworkData) {
  const container = document.getElementById('artwork-container');
  container.innerHTML = '';

  if (container) {
    const img = document.createElement('img');
    img.src = artworkData.imageUrl;
    img.alt = artworkData.altText;
    img.style.width = '50%';
    img.style.height = 'auto';

    img.onerror = () => {
      console.error('Error loading image:', artworkData.imageUrl);
    };

    const titleElement = document.createElement('h2');
    titleElement.textContent = artworkData.title;

    const artistElement = document.createElement('p');
    artistElement.textContent = `Artist: ${artworkData.artist}`;

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = artworkData.altText;

    container.appendChild(titleElement);
    container.appendChild(artistElement);
    container.appendChild(descriptionElement);
    container.appendChild(img);

    updatePaginationButtons();
  } else {
    console.error('Container not found');
  }
}

//For pagination buttons
function updatePaginationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === preloadedArtworks.length - 1;
}

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayArtwork(preloadedArtworks[currentIndex]);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentIndex < preloadedArtworks.length - 1) {
    currentIndex++;
    displayArtwork(preloadedArtworks[currentIndex]);
  }
});

preloadArtworks();
