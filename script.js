let currentIndex = 0;
let preloadedArtworks = [];

// Function to preload artworks
async function preloadArtworks() {
  // Show loading message while fetching data
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.style.display = 'block';  // Show loading message
  }

  const url = 'https://api.artic.edu/api/v1/artworks?page=1&limit=100';

  try {
    // Fetch the list of artworks from the API
    const response = await fetch(url);
    const data = await response.json();  // Parse the response into JSON
    const artworks = data.data;

    // Filter artworks to include only those with valid image URLs
    const filteredArtworks = artworks.filter(artwork => {
      return artwork.image_id || (artwork.thumbnail && artwork.thumbnail.lpiq);
    });

    // Create an array of image fetch promises for each artwork, preload images concurrently
    const imagePromises = filteredArtworks.map((artwork, index) => loadArtwork(artwork, index));

    // Wait for all image fetches to complete concurrently (Promise.all for faster loading)
    const results = await Promise.all(imagePromises);

    // Filter out null results (failed image fetches)
    preloadedArtworks = results.filter(artwork => artwork !== null);

    // Display the first artwork if available
    if (preloadedArtworks.length > 0) {
      displayArtwork(preloadedArtworks[currentIndex]);
    }

    updatePaginationButtons(); // Update pagination buttons after loading

    // Hide loading message once data is loaded
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
  } catch (error) {
    // Handle any errors during the fetch operation
    console.error('Error fetching data:', error);
    if (loadingMessage) {
      loadingMessage.style.display = 'none'; // Hide loading message on error
    }
  }
}

// Function to load a single artwork
async function loadArtwork(artwork, index) {
  const title = artwork.title || "Unknown Title";
  const artist = artwork.artist_title || "Unknown Artist";
  const altText = artwork.thumbnail ? artwork.thumbnail.alt_text : "No description available";
  
  // Determine the image URL based on the available data (image_id or thumbnail)
  const imageUrl = artwork.image_id
    ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/2000,/0/default.jpg`
    : artwork.thumbnail && artwork.thumbnail.lpiq;

  try {
    // Fetch the image for the artwork (in parallel with other image requests)
    const response = await fetch(imageUrl);
    
    // If the image is successfully fetched, return its data
    if (response.ok) {
      return { title, artist, altText, imageUrl };
    } else {
      // Log error if the image fetch fails (invalid URL or image not found)
      console.log(`Image not found for artwork: ${title} (Status code: ${response.status})`);
      return null; // Indicate that the artwork image is not valid
    }
  } catch (error) {
    // Handle errors during the image fetch operation
    console.error('Error fetching image:', error);
    return null; // Return null if there's an error fetching the image
  }
}

// Function to display an artwork
function displayArtwork(artworkData) {
  const container = document.getElementById('artwork-container');
  container.innerHTML = ''; // Clear the container before displaying new artwork

  if (container) {
    // Create the image element and set its attributes
    const img = document.createElement('img');
    img.src = artworkData.imageUrl;
    img.alt = artworkData.altText;
    img.style.width = '50%';
    img.style.height = '90%';

    img.onerror = () => {
      // Handle any errors with image loading (e.g., broken link)
      console.error('Error loading image:', artworkData.imageUrl);
    };

    // Create the title, artist, and description elements
    const titleElement = document.createElement('h2');
    titleElement.textContent = artworkData.title;

    const artistElement = document.createElement('p');
    artistElement.textContent = `Artist: ${artworkData.artist}`;

    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = artworkData.altText;

    // Append the elements to the container
    container.appendChild(titleElement);
    container.appendChild(artistElement);
    container.appendChild(descriptionElement);
    container.appendChild(img);

    updatePaginationButtons(); // Update pagination buttons based on artwork
  } else {
    console.error('Container not found');
  }
}

// Function to update pagination buttons
function updatePaginationButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Disable the "previous" button if at the first artwork
  prevBtn.disabled = currentIndex === 0;

  // Disable the "next" button if at the last artwork
  nextBtn.disabled = currentIndex === preloadedArtworks.length - 1;
}

// Event listeners for pagination buttons
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--; // Go to the previous artwork
    displayArtwork(preloadedArtworks[currentIndex]);
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentIndex < preloadedArtworks.length - 1) {
    currentIndex++; // Go to the next artwork
    displayArtwork(preloadedArtworks[currentIndex]);
  }
});

// Start preloading artworks when the script runs
preloadArtworks();
