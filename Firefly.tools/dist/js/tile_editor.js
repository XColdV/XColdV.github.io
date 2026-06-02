document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageInput = document.getElementById("imageInput");
  const canvasContainer = document.querySelector(".canvas-container");
  const grid = document.querySelector(".grid");
  const tileSizeSelect = document.getElementById("tileSizeSelect");
  const customSizeInput = document.getElementById("customSizeInput");
  const tileXInput = document.getElementById("tileX");
  const tileYInput = document.getElementById("tileY");
  const tileInfo = document.getElementById("tileInfo");
  const tileSizeInfo = document.getElementById("tileSizeInfo");
  const canvasInfo = document.getElementById("canvasInfo");
  const blankWidthInput = document.getElementById("blankWidth");
  const blankHeightInput = document.getElementById("blankHeight");

  let tileSizeWidth = 256;
  let tileSizeHeight = 160;
  let hasCanvas = false;

  function notify(options) {
    if (window.Swal) {
      return Swal.fire(options);
    }

    if (!options.showCancelButton) {
      window.alert(`${options.title || ""}\n${options.text || ""}`.trim());
      return Promise.resolve({ isConfirmed: true });
    }

    return Promise.resolve({
      isConfirmed: window.confirm(`${options.title || ""}\n${options.text || ""}`.trim())
    });
  }

  function parseTileSize(value) {
    const match = String(value).trim().toLowerCase().match(/^(\d+)\s*x\s*(\d+)$/);
    if (!match) {
      return null;
    }

    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      return null;
    }

    return { width, height };
  }

  function selectedTile() {
    return {
      x: Math.max(0, Number.parseInt(tileXInput.value, 10) || 0),
      y: Math.max(0, Number.parseInt(tileYInput.value, 10) || 0)
    };
  }

  function setSelectedTile(x, y) {
    tileXInput.value = Math.max(0, Number.parseInt(x, 10) || 0);
    tileYInput.value = Math.max(0, Number.parseInt(y, 10) || 0);
    updateStatus();
  }

  function currentTileRect() {
    const tile = selectedTile();
    return {
      tileX: tile.x,
      tileY: tile.y,
      x: tile.x * tileSizeWidth,
      y: tile.y * tileSizeHeight,
      width: tileSizeWidth,
      height: tileSizeHeight
    };
  }

  function tileFits(rect = currentTileRect()) {
    return hasCanvas && rect.x < canvas.width && rect.y < canvas.height;
  }

  function updateStatus() {
    const tile = selectedTile();
    tileInfo.textContent = `Tile x ${tile.x} y ${tile.y}`;
    tileSizeInfo.textContent = `Tile ${tileSizeWidth}x${tileSizeHeight}`;

    if (hasCanvas) {
      const columns = Math.ceil(canvas.width / tileSizeWidth);
      const rows = Math.ceil(canvas.height / tileSizeHeight);
      canvasInfo.textContent = `${canvas.width}x${canvas.height} canvas, ${columns}x${rows} tiles`;
    } else {
      canvasInfo.textContent = "No image loaded";
    }
  }

  function syncCanvasShell() {
    canvasContainer.classList.toggle("empty", !hasCanvas);
    canvasContainer.style.setProperty("--tile-width", `${tileSizeWidth}px`);
    canvasContainer.style.setProperty("--tile-height", `${tileSizeHeight}px`);

    const width = hasCanvas ? canvas.width : 320;
    const height = hasCanvas ? canvas.height : 220;
    canvasContainer.style.width = `${width}px`;
    canvasContainer.style.height = `${height}px`;
    grid.style.width = `${width}px`;
    grid.style.height = `${height}px`;
  }

  function rebuildGridNumbers() {
    grid.innerHTML = "";

    if (!hasCanvas) {
      syncCanvasShell();
      updateStatus();
      return;
    }

    const columns = Math.ceil(canvas.width / tileSizeWidth);
    const rows = Math.ceil(canvas.height / tileSizeHeight);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const label = document.createElement("span");
        label.className = "grid-number";
        label.textContent = `x ${x} y ${y}`;
        label.style.left = `${x * tileSizeWidth + 6}px`;
        label.style.top = `${y * tileSizeHeight + 6}px`;
        grid.appendChild(label);
      }
    }

    syncCanvasShell();
    updateStatus();
  }

  function setTileSize(width, height) {
    tileSizeWidth = width;
    tileSizeHeight = height;
    rebuildGridNumbers();
  }

  function loadImageToCanvas(image) {
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    hasCanvas = true;
    rebuildGridNumbers();
  }

  function createBlankCanvas() {
    const width = Math.max(1, Number.parseInt(blankWidthInput.value, 10) || 1024);
    const height = Math.max(1, Number.parseInt(blankHeightInput.value, 10) || 1024);
    blankWidthInput.value = width;
    blankHeightInput.value = height;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    hasCanvas = true;
    rebuildGridNumbers();
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(image.src);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(image.src);
        reject(new Error("Could not load image"));
      };
      image.src = URL.createObjectURL(file);
    });
  }

  function ensureCanvas() {
    if (hasCanvas) {
      return true;
    }

    notify({
      title: "No Canvas Yet",
      text: "Choose an image or create a blank image first.",
      icon: "warning"
    });
    return false;
  }

  function ensureCanvasSize(width, height) {
    if (width <= canvas.width && height <= canvas.height) {
      return;
    }

    const oldCanvas = document.createElement("canvas");
    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;
    oldCanvas.getContext("2d").drawImage(canvas, 0, 0);

    canvas.width = Math.max(canvas.width, width);
    canvas.height = Math.max(canvas.height, height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(oldCanvas, 0, 0);
  }

  function downloadCanvas(downloadCanvas, filename) {
    const link = document.createElement("a");
    link.href = downloadCanvas.toDataURL("image/png");
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function cropSelectedTile() {
    if (!ensureCanvas()) {
      return;
    }

    const rect = currentTileRect();
    if (!tileFits(rect)) {
      notify({
        title: "Tile Outside Canvas",
        text: "The selected tile is outside the current image.",
        icon: "error"
      });
      return;
    }

    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d");
    cropCanvas.width = Math.min(rect.width, canvas.width - rect.x);
    cropCanvas.height = Math.min(rect.height, canvas.height - rect.y);
    cropCtx.drawImage(
      canvas,
      rect.x,
      rect.y,
      cropCanvas.width,
      cropCanvas.height,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height
    );

    downloadCanvas(cropCanvas, `tile_x${rect.tileX}_y${rect.tileY}.png`);
  }

  async function deleteSelectedTile() {
    if (!ensureCanvas()) {
      return;
    }

    const rect = currentTileRect();
    if (!tileFits(rect)) {
      notify({
        title: "Tile Outside Canvas",
        text: "The selected tile is outside the current image.",
        icon: "error"
      });
      return;
    }

    const result = await notify({
      title: "Delete Tile?",
      text: `This will clear tile x ${rect.tileX} y ${rect.tileY}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) {
      return;
    }

    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    rebuildGridNumbers();
    notify({
      title: "Deleted",
      text: `Tile x ${rect.tileX} y ${rect.tileY} was cleared.`,
      icon: "success"
    });
  }

  function selectImageForAdd() {
    if (!ensureCanvas()) {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.addEventListener("change", async () => {
      try {
        const image = await readImageFile(input.files[0]);
        const rect = currentTileRect();
        ensureCanvasSize(rect.x + image.width, rect.y + image.height);
        ctx.drawImage(image, rect.x, rect.y);
        hasCanvas = true;
        rebuildGridNumbers();
        notify({
          title: "Added",
          text: `Image added at tile x ${rect.tileX} y ${rect.tileY}.`,
          icon: "success"
        });
      } catch (error) {
        notify({
          title: "Image Error",
          text: error.message,
          icon: "error"
        });
      } finally {
        input.remove();
      }
    });
    document.body.appendChild(input);
    input.click();
  }

  imageInput.addEventListener("change", async (event) => {
    try {
      const image = await readImageFile(event.target.files[0]);
      loadImageToCanvas(image);
      imageInput.value = "";
    } catch (error) {
      notify({
        title: "Image Error",
        text: error.message,
        icon: "error"
      });
    }
  });

  document.getElementById("imageButton").addEventListener("click", () => {
    imageInput.click();
  });

  document.getElementById("downloadButton").addEventListener("click", () => {
    if (!ensureCanvas()) {
      return;
    }

    downloadCanvas(canvas, "tile_collection.png");
  });

  document.getElementById("newImageButton").addEventListener("click", createBlankCanvas);

  document.getElementById("refreshButton").addEventListener("click", rebuildGridNumbers);

  document.getElementById("applyCustomSize").addEventListener("click", () => {
    const size = parseTileSize(customSizeInput.value);
    if (!size) {
      notify({
        title: "Invalid Custom Size",
        text: 'Use the format "widthxheight", for example 32x32.',
        icon: "error"
      });
      return;
    }

    setTileSize(size.width, size.height);
  });

  tileSizeSelect.addEventListener("change", () => {
    const size = parseTileSize(tileSizeSelect.value);
    if (size) {
      setTileSize(size.width, size.height);
    }
  });

  tileXInput.addEventListener("input", updateStatus);
  tileYInput.addEventListener("input", updateStatus);

  canvas.addEventListener("click", (event) => {
    if (!hasCanvas) {
      return;
    }

    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = Math.floor(((event.clientX - bounds.left) * scaleX) / tileSizeWidth);
    const y = Math.floor(((event.clientY - bounds.top) * scaleY) / tileSizeHeight);
    setSelectedTile(x, y);
  });

  document.getElementById("cropButton").addEventListener("click", cropSelectedTile);
  document.getElementById("deleteButton").addEventListener("click", deleteSelectedTile);
  document.getElementById("addButton").addEventListener("click", selectImageForAdd);

  syncCanvasShell();
  updateStatus();
});
