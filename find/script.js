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
            .filter(line => line.startsWith('add_item\\'))
            .map(line => {
                const parts = line.split('\\');
                const itemObject = {};
                
                let breakHits = 0;
                const breakHitsRaw = parts[16] || '0';
                if (breakHitsRaw.includes('r')) {
                    breakHits = parseInt(breakHitsRaw) || 0;
                } else {
                    breakHits = (parseInt(breakHitsRaw) || 0) / 6;
                }

                const rttexName = parts[7] || '';

                itemObject.id = parseInt(parts[1]) || 0;
                itemObject.action_type = parts[4] || 'N/A';
                itemObject.name = parts[6] || 'Unknown';
                // NEW: We now create two texture properties
                itemObject.baseTexture = rttexName.replace('.rttex', '.png');
                itemObject.iconTexture = rttexName.replace('.rttex', '_icon.png');
                itemObject.textureX = parseInt(parts[11]) || 0;
                itemObject.textureY = parseInt(parts[12]) || 0;
                itemObject.break_hits = breakHits;
                itemObject.rarity = parseInt(parts[19]) || 0;
                return itemObject;
            });

        console.log(`Successfully loaded and parsed ${allItems.length} items.`);

    } catch (error) {
        console.error("Failed to load item database:", error);
        resultsContainer.innerHTML = `<p style="color: red;">Error: Could not load item data.</p>`;
    }
}

// REPLACE your old displayItems function with this one.
function displayItems(itemsToDisplay) {
    resultsContainer.innerHTML = '';

    if (itemsToDisplay.length === 0 && searchInput.value.trim().length > 0) {
        resultsContainer.innerHTML = `<p>No items found matching your search.</p>`;
        return;
    }
    
    const validItems = itemsToDisplay.filter(item => item.baseTexture && item.baseTexture.length > 0);

    if (validItems.length === 0 && itemsToDisplay.length > 0) {
        resultsContainer.innerHTML = `<p>Found matching items, but they are missing image data in the database.</p>`;
        return;
    }

    validItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const sprite = document.createElement('div');
        sprite.className = 'item-sprite';
        
        // THE MAGIC TRICK:
        // This tells CSS to try loading the icon texture first. If it fails (404 error),
        // it will automatically load the base texture as a fallback.
        sprite.style.backgroundImage = `url('../game/${item.iconTexture}'), url('../game/${item.baseTexture}')`;
        
        sprite.style.backgroundPosition = `-${item.textureX * 32}px -${item.textureY * 32}px`;

        const name = document.createElement('p');
        name.className = 'item-name';
        name.textContent = item.name.replace(/`/g, '');

        card.addEventListener('click', () => {
            // We need to update this function call as well
            showItemDetails(item); 
        });

        card.appendChild(sprite);
        card.appendChild(name);
        resultsContainer.appendChild(card);
    });
}

// ALSO, make a small update to showItemDetails to use the new texture logic
function showItemDetails(item) {
    modalItemName.textContent = item.name.replace(/`/g, '');
    modalItemId.textContent = item.id;
    modalRarity.textContent = item.rarity > 0 ? item.rarity : 'N/A';
    modalActionType.textContent = item.action_type;
    modalBreakHits.textContent = item.break_hits > 0 ? `${item.break_hits.toFixed(2)} hits` : 'N/A';
    
    // UPDATE THIS LINE:
    modalSprite.style.backgroundImage = `url('../game/${item.iconTexture}'), url('../game/${item.baseTexture}')`;
    
    modalSprite.style.backgroundPosition = `-${item.textureX * 32}px -${item.textureY * 32}px`;
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