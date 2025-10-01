document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const imageInput = document.getElementById('imageInput');
    let tileSizeWidth = 256;
    let tileSizeHeight = 160;
    let img = null;
    let tiles = []; 
    let created_canvas = false;
    const mainContent = document.querySelector('.main-content');
    const tileSizeSelect = document.getElementById('tileSizeSelect');
	document.getElementById('applyCustomSize').addEventListener('click', applyCustomSize);

    tileSizeSelect.addEventListener('change', handleTileSizeChange);
	function applyCustomSize() {
		if (created_canvas) {
			Swal.fire({
				title: 'Canvas Already Created',
				text: 'You have already uploaded an image, please refresh the page to change the tile size.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		const customSizeValue = document.getElementById('customSizeInput').value;
		const [customWidth, customHeight] = customSizeValue.split('x').map(Number);

		if (isNaN(customWidth) || isNaN(customHeight) || customWidth <= 0 || customHeight <= 0) {
			Swal.fire({
				title: 'Invalid Custom Size',
				text: 'Please enter a valid custom size in the format "widthxheight" (e.g., 100x50).',
				icon: 'error'
			});
			return;
		}

		tileSizeWidth = customWidth;
		tileSizeHeight = customHeight;

		resizeCanvas();
	}
    function handleTileSizeChange() {
        if (created_canvas) {
            Swal.fire({
                title: 'Canvas Already Created',
                text: 'You have already uploaded an image, please refresh the page to change the tile size.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
        const selectedSize = tileSizeSelect.value.split('x');
        tileSizeWidth = parseInt(selectedSize[0], 10);
        tileSizeHeight = parseInt(selectedSize[1], 10);
        resizeCanvas();
    }
    function handleImageUpload(event) {
        if (created_canvas) {
            Swal.fire({
                title: 'Canvas Already Created',
                text: 'You have already uploaded an image.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            img = new Image();
            img.onload = function() {
                // Calculate the aspect ratio to adjust canvas dimensions
                // Set canvas actual size to maintain aspect ratio
                canvas.width = img.width;
                canvas.height = img.height;
    
                // Draw image with original dimensions
                ctx.drawImage(img, 0, 0);
    
                redrawCanvas();
                created_canvas = true;
    
                const gridContainer = document.querySelector('.canvas-container');
                gridContainer.style.width = displayWidth + 'px';
                gridContainer.style.height = displayHeight + 'px';
    
                const numTilesX = Math.floor(displayWidth / tileSizeWidth);
                const numTilesY = Math.floor(displayHeight / tileSizeHeight);
    
                
                for (let y = 0; y < numTilesY; y++) {
                    for (let x = 0; x < numTilesX; x++) {
                        const tileX = x * tileSizeWidth;
                        const tileY = y * tileSizeHeight;
                        const tileImageData = ctx.getImageData(tileX, tileY, tileSizeWidth, tileSizeHeight);
                        if (!isImageDataBlank(tileImageData)) { 
                            const tileImage = imageDataToImage(tileImageData);
                            addTileToCanvas(x, y, tileImage); 
                        }
                    }
                }
            };
            img.src = event.target.result;
            addGridNumbers();
        };
        
        reader.readAsDataURL(file);
    }
    
   function createNewBlankImage() {
		if (created_canvas) {
			Swal.fire({
				title: 'Canvas Already Created',
				text: 'You have already uploaded an image.',
				icon: 'warning',
				confirmButtonText: 'OK'
			});
			return;
		}

		// Create a new blank image
		img = new Image();
		img.onload = function() {
			// Set canvas dimensions to 1024x1024
			canvas.width = 1024;
			canvas.height = 1024;

			// Clear the canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Draw the blank image
			ctx.drawImage(img, 0, 0);

			// Redraw canvas and add grid numbers
			redrawCanvas();
			addGridNumbers();
			created_canvas = true;

			const gridContainer = document.querySelector('.canvas-container');
			gridContainer.style.width = displayWidth + 'px';
			gridContainer.style.height = displayHeight + 'px';

			const numTilesX = Math.floor(displayWidth / tileSizeWidth);
			const numTilesY = Math.floor(displayHeight / tileSizeHeight);

			// Loop to add tiles based on the display dimensions
			for (let y = 0; y < numTilesY; y++) {
				for (let x = 0; x < numTilesX; x++) {
					const tileX = x * tileSizeWidth;
					const tileY = y * tileSizeHeight;
					const tileImageData = ctx.getImageData(tileX, tileY, tileSizeWidth, tileSizeHeight);
					if (!isImageDataBlank(tileImageData)) {
						const tileImage = imageDataToImage(tileImageData);
						addTileToCanvas(x, y, tileImage);
					}
				}
			}
		};

		// Set the source of the blank image
		img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAwAB/5+e5gAAAABJRU5ErkJggg==';

		// Add grid numbers after setting image source
		addGridNumbers();
	}
    
    
    function addGridNumbers() {
        const gridContainer = document.querySelector('.grid');
        const numTilesX = Math.floor(img.width / tileSizeWidth);
        const numTilesY = Math.floor(img.height / tileSizeHeight);
    
        for (let y = 0; y < numTilesY; y++) {
            for (let x = 0; x < numTilesX; x++) {
                const gridNumber = document.createElement('span');
                gridNumber.className = 'grid-number';
                gridNumber.textContent = `${x}-${y}`;
                gridNumber.style.left = `${x * tileSizeWidth}px`;
                gridNumber.style.top = `${y * tileSizeHeight}px`;
                gridContainer.appendChild(gridNumber);
            }
        }
    }
    
    function isImageDataBlank(imageData) {
        const { data } = imageData;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] !== 0) {
                return false; 
            }
        }
        return true;
    }
    
    
    function imageDataToImage(imageData) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);
        const image = new Image();
        image.src = tempCanvas.toDataURL();
        return image;
    }
    function cropImageAndDownload(image, x, y, width, height) {
        Swal.fire({
            title: 'Crop Image and Download',
            text: 'Are you sure you want to crop and download the image?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, crop and download',
            cancelButtonText: 'No, cancel',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
            
                tempCanvas.width = width;
                tempCanvas.height = height;
        
                tempCtx.drawImage(image, x, y, width, height, 0, 0, width, height);
        
                const dataURL = tempCanvas.toDataURL('image/png');
            
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = 'cropped_image.png';
            
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
    
    
    function removeTile(tileIndex) {
		const tile = tiles[tileIndex];
		
		// Calculate the exact pixel coordinates and dimensions for the tile
		const tilePixelX = tile.x * tileSizeWidth;
		const tilePixelY = tile.y * tileSizeHeight;
		
		// Clear the area occupied by the removed tile
		ctx.clearRect(tilePixelX, tilePixelY, tileSizeWidth, tileSizeHeight);
		
		// Remove the tile from the tiles array
		tiles.splice(tileIndex, 1);
		
		// Set img to ctx to update the canvas content
		img = new Image();
		img.src = canvas.toDataURL(); // Set img to the current canvas content
		
		console.log("Removing tile at index:", tileIndex);
		redrawCanvas();
	}

    
    
    
    function addTileToCanvas(tileX, tileY, tileImage) {
        const existingTileIndex = tiles.findIndex(tile => tile.x === tileX * tileSizeWidth && tile.y === tileY * tileSizeHeight);
        if (existingTileIndex !== -1) {
            Swal.fire({
                title: 'Success!',
                text: 'Tile added successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            const existingTile = tiles[existingTileIndex];
            existingTile.image = tileImage;
            redrawCanvas();
            return; 
        }
        tileImage.onload = function() {
            const tile = { x: tileX * tileSizeWidth, y: tileY * tileSizeHeight, width: tileSizeWidth, height: tileSizeHeight, image: tileImage };
            tiles.push(tile);
            redrawCanvas();
            Swal.fire({
                title: 'Success!',
                text: 'Tile added successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        };
        if (tileImage.complete) {
            tileImage.onload();
        }
    }
    
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        tiles.forEach(tile => {
            ctx.drawImage(tile.image, tile.x, tile.y, tile.width, tile.height);
        });
    }
    
    imageInput.addEventListener('change', handleImageUpload);

    document.getElementById('cropButton').addEventListener('click', () => {
        const tileX = parseInt(document.getElementById('tileX').value);
        const tileY = parseInt(document.getElementById('tileY').value);

        if (img && !isNaN(tileX) && !isNaN(tileY)) {
            cropImageAndDownload(img, tileX * tileSizeWidth, tileY * tileSizeHeight, tileSizeWidth, tileSizeHeight);
        }else {
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please select an image and enter valid tile coordinates.',
                icon: 'error'
            });
        }
    });


    document.getElementById('deleteButton').addEventListener('click', () => {
        const tileX = parseInt(document.getElementById('tileX').value);
        const tileY = parseInt(document.getElementById('tileY').value);
    
        if (img && !isNaN(tileX) && !isNaN(tileY)) {
            let tileIndex = tiles.findIndex(tile => tile.x === tileX * tileSizeWidth && tile.y === tileY * tileSizeHeight);
            if (tileIndex !== -1) {
                Swal.fire({
                    title: 'Are you sure?',
                    text: "You are about to delete this tile. This action cannot be undone.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        removeTile(tileIndex);
                        Swal.fire(
                            'Deleted!',
                            'The tile has been deleted.',
                            'success'
                        );
                    }
                });
            } else {
                Swal.fire(
                    'Tile Not Found',
                    'Tile not found at the specified coordinates.',
                    'error'
                );
            }
        } else {
            Swal.fire({
                title: 'Invalid Coordinates',
                text: 'Please enter valid tile coordinates.',
                icon: 'error'
            });
        }
    });

    document.getElementById('addButton').addEventListener('click', () => {
        const tileX = parseInt(document.getElementById('tileX').value);
        const tileY = parseInt(document.getElementById('tileY').value);
    
        if (img && !isNaN(tileX) && !isNaN(tileY)) {
            selectImageFile(tileX, tileY);
        } else {
            Swal.fire({
                title: 'Invalid Input',
                text: 'Please select an image and enter valid tile coordinates.',
                icon: 'error'
            });
        }
    });
    document.getElementById('newImageButton').addEventListener('click', createNewBlankImage);

    function selectImageFile(startTileX, startTileY) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/png';

        fileInput.onchange = function(evt) {
            const file = evt.target.files[0];
            const image = new Image();
            image.onload = function() {
                const offscreenCanvas = document.createElement('canvas');
                const offscreenCtx = offscreenCanvas.getContext('2d');
                offscreenCanvas.width = image.width;
                offscreenCanvas.height = image.height;
                offscreenCtx.drawImage(image, 0, 0);
                
                const numTilesX = Math.ceil(image.width / tileSizeWidth);
                const numTilesY = Math.ceil(image.height / tileSizeHeight);
            
                for (let y = 0; y < numTilesY; y++) {
                    for (let x = 0; x < numTilesX; x++) {
                        const tileX = x * tileSizeWidth;
                        const tileY = y * tileSizeHeight;
                        const tileW = Math.min(tileSizeWidth, image.width - tileX);
                        const tileH = Math.min(tileSizeHeight, image.height - tileY);
                        const tileData = offscreenCtx.getImageData(tileX, tileY, tileW, tileH);
                        if (!isImageDataBlank(tileData)) {
                            const tileImage = imageDataToImage(tileData);
                            addTileToCanvas(startTileX + x, startTileY + y, tileImage);
                        }
                    }
                }
            
                offscreenCanvas.remove();
            };
            
            image.src = URL.createObjectURL(file);
        };

        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput); 

    }
    
    
    document.getElementById("imageButton").addEventListener("click", function() {
        document.getElementById("imageInput").click();
    });
    
    document.getElementById('downloadButton').addEventListener('click', () => {
        Swal.fire({
            title: 'Download Image',
            text: 'Are you sure you want to download the tile collection?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, download it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const imageDataURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = imageDataURL;
                link.download = 'tile_collection.png';
                link.click();
            }
        });
    });
});
