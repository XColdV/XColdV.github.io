import os
import shutil

# --- CONFIGURATION ---
# 1. Where are your waifu pics currently? (Use r"" for raw string to handle backslashes)
SOURCE_FOLDER = r"F:\Firefly Pic"

# 2. Where should the website images go? (Automatically creates an 'images' folder here)
DEST_FOLDER = os.path.join(os.getcwd(), "images")

# 3. What file types should we look for?
VALID_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp')

def main():
    print(f"🔥 Firefly Protocol: Image Sync Initiated...")
    print(f"📂 Source: {SOURCE_FOLDER}")
    print(f"📂 Target: {DEST_FOLDER}")

    # 1. Check if source exists
    if not os.path.exists(SOURCE_FOLDER):
        print(f"❌ Error: Could not find folder: {SOURCE_FOLDER}")
        return

    # 2. Create destination folder if it doesn't exist
    if not os.path.exists(DEST_FOLDER):
        os.makedirs(DEST_FOLDER)
        print("✅ Created 'images' folder.")
    else:
        # Optional: Clear old website images so we don't have duplicates
        print("⚠️ 'images' folder exists. Cleaning it up for fresh import...")
        for file in os.listdir(DEST_FOLDER):
            os.remove(os.path.join(DEST_FOLDER, file))

    # 3. Get all image files from source
    files = [f for f in os.listdir(SOURCE_FOLDER) if f.lower().endswith(VALID_EXTENSIONS)]
    
    if not files:
        print("💀 No images found in source folder!")
        return

    print(f"📸 Found {len(files)} images. Processing...")

    # 4. Copy and Rename Loop
    count = 0
    for index, filename in enumerate(files, start=1):
        # Get extension (e.g., .jpg)
        _, ext = os.path.splitext(filename)
        
        # Define new name (e.g., 1.jpg)
        new_name = f"{index}{ext}"
        
        # Full paths
        src_path = os.path.join(SOURCE_FOLDER, filename)
        dst_path = os.path.join(DEST_FOLDER, new_name)
        
        # Copy the file
        shutil.copy2(src_path, dst_path)
        count += 1
        
        # Little progress bar effect
        if count % 10 == 0:
            print(f"   Processed {count} images...")

    print("-" * 30)
    print(f"✅ SUCCESS! {count} images copied and renamed.")
    print("-" * 30)
    print("👇 NOW UPDATE YOUR HTML FILE:")
    print(f"Find the line: const imageCount = 5;")
    print(f"Change it to:  const imageCount = {count};")
    print("-" * 30)

if __name__ == "__main__":
    main()