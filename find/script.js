// Get references to the HTML elements we'll be working with
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

// An array to hold all our parsed item data
let allItems = [];

// --- Main function to load and process the data ---
async function initializeDatabase() {
    try {
        // Fetch the item database file. The path is relative to the HTML file.
        // Since index.html is in /find/, we go up one level ('../') to the root.
        const response = await fetch('../firefly_correcteds.txt');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textData = await response.text();

        // Split the text file into individual lines
        const lines = textData.split('\n');

        // Define the structure of our data based on your provided format
        const dataKeys = [
            'add_item', 'id', 'editable_type', 'item_category', 'action_type',
            'hit_sound_type', 'name', 'texture', 'texture_hash', 'item_kind',
            'val1', 'texture_x', 'texture_y', 'spread_type', 'is_stripey_wallpaper',
            'collision_type', 'break_hits', 'drop_chance', 'clothing_type', 'rarity',
            'max_amount', 'extra_file', 'extra_file_hash', 'audio_volume', 'pet_name',
            'pet_prefix', 'pet_suffix', 'pet_ability', 'seed_base', 'seed_overlay',
            'tree_base', 'tree_leaves', 'seed_color', 'seed_overlay_color',
            'grow_time', 'val2', 'is_rayman', 'extra_options', 'texture2',
            'extra_options2', 'data_position_80', 'punch_options', 'data_version_12',
            'int_version_13', 'int_version_14', 'data_version_15', 'str_version_15',
            'str_version_16', 'int_version_17', 'int_version_18', 'int_version_19',
            'int_version_21', 'str_version_22'
        ];

        // Process each line and turn it into a structured object
        allItems = lines
            .map(line => line.trim())
            .filter(line => line.length > 0) // Ignore empty lines
            .map(line => {
                const parts = line.split('|');
                const itemObject = {};
                // We only need a few key pieces of data for this tool
                itemObject.name = parts[6] || 'Unknown';
                itemObject.texture = parts[7] || '';
                itemObject.textureX = parseInt(parts[11]) || 0;
                itemObject.textureY = parseInt(parts[12]) || 0;
                return itemObject;
            });

        console.log(`Successfully loaded and parsed ${allItems.length} items.`);

    } catch (error) {
        console.error("Failed to load item database:", error);
        resultsContainer.innerHTML = `<p style="color: red;">Error: Could not load item data. Please check the console for details.</p>`;
    }
}

// --- Function to display items on the page ---
function displayItems(itemsToDisplay) {
    // Clear any previous results first
    resultsContainer.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        resultsContainer.innerHTML = `<p>No items found.</p>`;
        return;
    }

    // Create and append an HTML element for each item
    itemsToDisplay.forEach(item => {
        // Create the main card container
        const card = document.createElement('div');
        card.className = 'item-card';

        // Create the sprite display element
        const sprite = document.createElement('div');
        sprite.className = 'item-sprite';
        
        // This is the magic part! We set the background image and position it.
        // We go up one directory ('../') to get to the root, then into '/game/'.
        sprite.style.backgroundImage = `url('../game/${item.texture}')`;
        // The position is negative because we are moving the IMAGE, not the container.
        // We multiply by 32 because each sprite is 32x32 pixels.
        sprite.style.backgroundPosition = `-${item.textureX * 32}px -${item.textureY * 32}px`;
        
        // Create the name paragraph
        const name = document.createElement('p');
        name.className = 'item-name';
        name.textContent = item.name.replace(/`/g, ''); // Remove backticks from name

        // Append the sprite and name to the card, and the card to the container
        card.appendChild(sprite);
        card.appendChild(name);
        resultsContainer.appendChild(card);
    });
}


// --- Event Listener for the search input ---
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();

    // If the search bar is empty, don't show any results
    if (searchTerm === '') {
        resultsContainer.innerHTML = '';
        return;
    }

    // Filter the 'allItems' array to find matches
    const filteredItems = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );

    // Display the filtered results
    displayItems(filteredItems);
});


// --- Start the application ---
initializeDatabase();