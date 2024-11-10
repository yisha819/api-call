let currentIndex = 0;
let artworksMetadata = []; 
let preloadedArtworks = [];

// Function to preload only metadata
async function preloadArtworksMetadata() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) loadingMessage.style.display = 'block';

  const url = 'https://api.artic.edu/api/v1/artworks?page=1&limit=100';

  try {
    const response = await fetch(url);

    // Check if response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check if data has the expected structure
    if (!data || !data.data) {
      throw new Error('Invalid data format received from the API');
    }

    artworksMetadata = data.data.filter(artwork => artwork.image_id || (artwork.thumbnail && artwork.thumbnail.lpiq));

    if (artworksMetadata.length > 0) {
      loadArtworkImage(currentIndex);
    }

    updatePaginationButtons();
    if (loadingMessage) loadingMessage.style.display = 'none';
  } catch (error) {
    console.error('Error fetching data:', error);
    if (loadingMessage) loadingMessage.style.display = 'none';

    // Error message
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = 'Sorry, there was an error loading the artworks. Please try again later.';
      errorMessage.style.display = 'block';
    }
  }
}

// Function to load a single artwork image with lazy loading
async function loadArtworkImage(index) {
  const artwork = artworksMetadata[index];
  if (!artwork) return;

  const title = artwork.title || "Unknown Title";
  const artist = artwork.artist_title || "Unknown Artist";
  const altText = artwork.thumbnail ? artwork.thumbnail.alt_text : "No description available";

  const thumbnailUrl = artwork.thumbnail ? artwork.thumbnail.lpiq : null;
  const fullImageUrl = artwork.image_id
    ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/2000,/0/default.jpg`
    : thumbnailUrl;

  try {
    const artworkData = { title, artist, altText, fullImageUrl, thumbnailUrl };
    preloadedArtworks[index] = artworkData;
    displayArtwork(artworkData);

    if (index + 1 < artworksMetadata.length && !preloadedArtworks[index + 1]) {
      loadArtworkImage(index + 1);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

// Function to display an artwork with lazy loading
function displayArtwork(artworkData) {
  const container = document.getElementById('artwork-container');
  container.innerHTML = '';

  const img = document.createElement('img');
  img.src = artworkData.thumbnailUrl || artworkData.fullImageUrl;
  img.alt = artworkData.altText;
  img.style.width = '50%';
  img.style.height = '90%';

  img.onerror = () => {
    console.error('Error loading image:', artworkData.fullImageUrl);
  };

  // Use a higher resolution image when the image enters the viewport
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = artworkData.fullImageUrl;
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: '50px' } 
  );
  observer.observe(img);

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
}

// Function to update pagination buttons
function updatePaginationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === artworksMetadata.length - 1;
}

// Event listeners for pagination buttons
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayOrLoadArtwork(currentIndex);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentIndex < artworksMetadata.length - 1) {
    currentIndex++;
    displayOrLoadArtwork(currentIndex);
  }
});

function displayOrLoadArtwork(index) {
  if (preloadedArtworks[index]) {
    displayArtwork(preloadedArtworks[index]);
  } else {
    loadArtworkImage(index);
  }
}

// Start preloading artwork metadata when the script runs
preloadArtworksMetadata();
