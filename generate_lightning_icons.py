#!/usr/bin/env python3
"""
Generate lightning bolt icons for Chrome extension
Requires: pip install cairosvg pillow
"""

import os
from PIL import Image
import cairosvg
from io import BytesIO

def generate_icon(size):
    """Generate icon at specified size"""
    # SVG content with dynamic size
    svg_content = f'''<svg width="{size}" height="{size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#1a1a1a" stroke="#333" stroke-width="2"/>
  
  <!-- Lightning bolt -->
  <path d="M45 25 L85 65 L65 65 L75 103 L35 63 L55 63 Z" 
        fill="url(#lightningGradient)" 
        stroke="#FF8C00" 
        stroke-width="2" 
        stroke-linejoin="round"/>
  
  <!-- Highlight -->
  <path d="M48 30 L82 60 L62 60 L70 95 L40 65 L58 65 Z" 
        fill="#FFFF00" 
        opacity="0.3"/>
</svg>'''
    
    # Convert SVG to PNG
    png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'))
    
    # Convert to PIL Image and resize
    img = Image.open(BytesIO(png_data))
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    return img

def main():
    """Generate all required icon sizes"""
    sizes = [16, 32, 48, 128]
    
    # Ensure icons directory exists
    os.makedirs('icons', exist_ok=True)
    
    for size in sizes:
        print(f"Generating {size}x{size} icon...")
        icon = generate_icon(size)
        icon.save(f'icons/icon{size}.png', 'PNG')
        print(f"Saved icons/icon{size}.png")
    
    print("All icons generated successfully!")

if __name__ == "__main__":
    main()
