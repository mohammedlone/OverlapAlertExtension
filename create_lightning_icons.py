#!/usr/bin/env python3
"""
Create lightning bolt icons using PIL only
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_lightning_icon(size):
    """Create a lightning bolt icon at specified size"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    center = size // 2
    radius = int(size * 0.45)
    
    # Draw background circle
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=(26, 26, 26, 255), outline=(51, 51, 51, 255), width=max(1, size//64))
    
    # Lightning bolt coordinates (scaled to size)
    scale = size / 128
    
    # Main lightning bolt path
    lightning_points = [
        (int(45 * scale), int(25 * scale)),  # Top left
        (int(85 * scale), int(65 * scale)),  # Bottom right
        (int(65 * scale), int(65 * scale)),  # Middle right
        (int(75 * scale), int(103 * scale)), # Bottom point
        (int(35 * scale), int(63 * scale)),  # Bottom left
        (int(55 * scale), int(63 * scale)),  # Middle left
    ]
    
    # Draw lightning bolt with gradient effect (using multiple colors)
    draw.polygon(lightning_points, fill=(255, 215, 0, 255))  # Gold
    
    # Add highlight
    highlight_points = [
        (int(48 * scale), int(30 * scale)),
        (int(82 * scale), int(60 * scale)),
        (int(62 * scale), int(60 * scale)),
        (int(70 * scale), int(95 * scale)),
        (int(40 * scale), int(65 * scale)),
        (int(58 * scale), int(65 * scale)),
    ]
    
    draw.polygon(highlight_points, fill=(255, 255, 0, 100))  # Yellow highlight
    
    return img

def main():
    """Generate all required icon sizes"""
    sizes = [16, 32, 48, 128]
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    for size in sizes:
        print(f"Creating {size}x{size} lightning icon...")
        icon = create_lightning_icon(size)
        icon.save(f'icons/icon{size}.png', 'PNG')
        print(f"Saved icons/icon{size}.png")
    
    print("All lightning bolt icons created successfully!")

if __name__ == "__main__":
    main()
