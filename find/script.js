// Get references to the HTML elements we'll be working with
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

// --- NEW: References for our Modal elements ---
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalSprite = document.getElementById('modalSprite');
const modalItemName = document.getElementById('modalItemName');
const modalItemId = document.getElementById('modalItemId');
const modalRarity = document.getElementById('modalRarity');
const modalActionType = document.getElementById('modalActionType');
const modalBreakHits = document.getElementById('modalBreakHits');


// An array to hold all our parsed item data
let allItems = [];

// --- Main function to load and process the data ---
// --- Main function to load and process the data ---
async function initializeDatabase() {
    try {
        const response = await fetch('../firefly_correcteds.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textData = await response.text();
        const lines = textData.split('\n');

        allItems = lines
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // THIS IS THE ONLY LINE THAT CHANGED!
                const parts = line.split('\\'); 

                const itemObject = {};
                itemObject.id = parseInt(parts[1]) || 0;
                itemObject.action_type = parts[4] || 'N/A';
                itemObject.name = parts[6] || 'Unknown';
                // Your example uses .rttex, but we assume the game folder has .png.
                // This line will change the extension to .png for the URL.
                itemObject.texture = (parts[7] || '').replace('.rttex', '.png');
                itemObject.textureX = parseInt(parts[11]) || 0;
                itemObject.textureY = parseInt(parts[12]) || 0;
                itemObject.break_hits = parseInt(parts[16]) / 6 || 0;
                itemObject.rarity = parseInt(parts[19]) || 0;
                return itemObject;
            });

        console.log(`Successfully loaded and parsed ${allItems.length} items.`);

    } catch (error) {
        console.error("Failed to load item database:", error);
        resultsContainer.innerHTML = `<p style="color: red;">Error: Could not load item data.</p>`;
    }
}

// --- Function to display items on the page ---
function displayItems(itemsToDisplay) {
    resultsContainer.innerHTML = '';
    const validItems = itemsToDisplay.filter(item => item.texture && item.texture.length > 0);

    if (validItems.length === 0) {
        if (searchInput.value.trim().length > 0) {
            resultsContainer.innerHTML = `<p>No items found with a valid image.</p>`;
        }
        return;
    }

    validItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const sprite = document.createElement('div');
        sprite.className = 'item-sprite';
        sprite.style.backgroundImage = `url('../game/${item.texture}')`;
        sprite.style.backgroundPosition = `-${item.textureX * 32}px -${item.textureY * 32}px`;

        const name = document.createElement('p');
        name.className = 'item-name';
        name.textContent = item.name.replace(/`/g, '');

        // --- NEW: Add a click event listener to each card ---
        card.addEventListener('click', () => {
            showItemDetails(item);
        });

        card.appendChild(sprite);
        card.appendChild(name);
        resultsContainer.appendChild(card);
    });
}

// --- NEW: Function to show the modal with item details ---
function showItemDetails(item) {
    // Populate the modal with the item's data
    modalItemName.textContent = item.name.replace(/`/g, '');
    modalItemId.textContent = item.id;
    modalRarity.textContent = item.rarity > 0 ? item.rarity : 'N/A';
    modalActionType.textContent = item.action_type;
    modalBreakHits.textContent = item.break_hits > 0 ? `${item.break_hits} hits` : 'N/A';

    // Set the sprite image and position
    modalSprite.style.backgroundImage = `url('../game/${item.texture}')`;
    modalSprite.style.backgroundPosition = `-${item.textureX * 32}px -${item.textureY * 32}px`;
    
    // Display the modal
    modalOverlay.style.display = 'flex';
}

// --- NEW: Function to hide the modal ---
function hideItemDetails() {
    modalOverlay.style.display = 'none';
}

// --- Event Listener for the search input ---
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    if (searchTerm === '') {
        resultsContainer.innerHTML = '';
        return;
    }
    const filteredItems = allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
    );
    displayItems(filteredItems);
});

// --- NEW: Event listeners for closing the modal ---
modalClose.addEventListener('click', hideItemDetails);
modalOverlay.addEventListener('click', (event) => {
    // Only close if the user clicks on the overlay itself, not the content inside
    if (event.target === modalOverlay) {
        hideItemDetails();
    }
});

// --- Start the application ---
initializeDatabase();