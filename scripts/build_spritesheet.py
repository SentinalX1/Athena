import os
from PIL import Image

TOTAL_FRAMES = 91
COLS = 10
ROWS = 10
FRAME_SIZE = 150  # 150x150px per frame

loader_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "Loader")
output_path = os.path.join(loader_dir, "spritesheet.png")

spritesheet = Image.new("RGBA", (COLS * FRAME_SIZE, ROWS * FRAME_SIZE), (0, 0, 0, 0))

print("Generating 91-frame transparent sprite sheet...")

for i in range(TOTAL_FRAMES):
    filename = f"frame_{str(i).zfill(2)}_delay-0.03s.png"
    filepath = os.path.join(loader_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"Warning: {filename} not found!")
        continue

    img = Image.open(filepath).convert("RGBA")
    w, h = img.size
    
    # 48% center crop
    crop_size = min(w, h) * 0.48
    left = (w - crop_size) / 2
    top = (h - crop_size) / 2
    right = left + crop_size
    bottom = top + crop_size
    
    cropped = img.crop((left, top, right, bottom))
    resized = cropped.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
    
    # Process alpha channel: key out black background and create smooth white dots
    datas = resized.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        lum = r * 0.299 + g * 0.587 + b * 0.114
        if lum < 25:
            new_data.append((0, 0, 0, 0))
        else:
            alpha = min(255, int((lum / 220.0) * 255))
            new_data.append((255, 255, 255, alpha))
    
    resized.putdata(new_data)
    
    col = i % COLS
    row = i // COLS
    
    spritesheet.paste(resized, (col * FRAME_SIZE, row * FRAME_SIZE), resized)

spritesheet.save(output_path, "PNG", optimize=True)
file_size_kb = os.path.getsize(output_path) / 1024.0
print(f"Success! Spritesheet saved to: {output_path}")
print(f"Total size: {file_size_kb:.2f} KB (Grid: {COLS}x{ROWS}, Frame: {FRAME_SIZE}x{FRAME_SIZE}px)")
