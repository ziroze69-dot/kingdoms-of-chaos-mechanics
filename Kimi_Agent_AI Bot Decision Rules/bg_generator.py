#!/usr/bin/env python3
"""
Generate background images for Kingdoms of Chaos AI Strategy Document.
Dark fantasy strategy game theme with geometric grid patterns.
"""
import asyncio
import os
from playwright.async_api import async_playwright

OUTPUT_DIR = "/mnt/agents/output/bg_images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Dark strategy game palette
COLORS = {
    "bg_dark": "#1a1a2e",
    "bg_mid": "#16213e",
    "accent_red": "#e94560",      # Aggressive
    "accent_gold": "#f5a623",     # Defensive
    "accent_purple": "#9b59b6",   # Chaotic
    "grid_line": "#2d3561",
    "highlight": "#0f3460",
    "text_gold": "#d4a574",
}

# Cover: Dark with grid pattern and colored accents
COVER_HTML = f"""
<!DOCTYPE html>
<html>
<head>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    width: 794px;
    height: 1123px;
    background: linear-gradient(135deg, {COLORS['bg_dark']} 0%, {COLORS['bg_mid']} 50%, {COLORS['highlight']} 100%);
    position: relative;
    overflow: hidden;
}}
.grid {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        linear-gradient(rgba(45, 53, 97, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 53, 97, 0.3) 1px, transparent 1px);
    background-size: 60px 60px;
}}
.corner-tl {{ position: absolute; top: 40px; left: 40px; width: 120px; height: 120px; border-top: 3px solid {COLORS['accent_red']}; border-left: 3px solid {COLORS['accent_red']}; }}
.corner-tr {{ position: absolute; top: 40px; right: 40px; width: 120px; height: 120px; border-top: 3px solid {COLORS['accent_gold']}; border-right: 3px solid {COLORS['accent_gold']}; }}
.corner-bl {{ position: absolute; bottom: 40px; left: 40px; width: 120px; height: 120px; border-bottom: 3px solid {COLORS['accent_purple']}; border-left: 3px solid {COLORS['accent_purple']}; }}
.corner-br {{ position: absolute; bottom: 40px; right: 40px; width: 120px; height: 120px; border-bottom: 3px solid {COLORS['accent_red']}; border-right: 3px solid {COLORS['accent_gold']}; }}
.glow {{
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
}}
.glow1 {{ top: 10%; left: 10%; width: 300px; height: 300px; background: {COLORS['accent_red']}; }}
.glow2 {{ top: 60%; right: 10%; width: 250px; height: 250px; background: {COLORS['accent_purple']}; }}
.glow3 {{ bottom: 10%; left: 40%; width: 200px; height: 200px; background: {COLORS['accent_gold']}; }}
.hex-pattern {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='52' height='90' viewBox='0 0 52 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M26 0l26 15v60L26 90 0 75V15L26 0z' fill='none' stroke='rgba(233,69,96,0.08)' stroke-width='1'/%3E%3C/svg%3E");
    background-size: 52px 90px;
    opacity: 0.5;
}}
.top-bar {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, {COLORS['accent_red']}, {COLORS['accent_gold']}, {COLORS['accent_purple']}, {COLORS['accent_red']});
}}
.bottom-bar {{
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, {COLORS['accent_purple']}, {COLORS['accent_gold']}, {COLORS['accent_red']}, {COLORS['accent_purple']});
}}
</style>
</head>
<body>
    <div class="grid"></div>
    <div class="hex-pattern"></div>
    <div class="glow glow1"></div>
    <div class="glow glow2"></div>
    <div class="glow glow3"></div>
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>
    <div class="top-bar"></div>
    <div class="bottom-bar"></div>
</body>
</html>
"""

# Body: Clean professional with subtle grid
BODY_HTML = f"""
<!DOCTYPE html>
<html>
<head>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    width: 794px;
    height: 1123px;
    background: linear-gradient(180deg, #fafbfc 0%, #f0f2f5 100%);
    position: relative;
    overflow: hidden;
}}
.subtle-grid {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        linear-gradient(rgba(45, 53, 97, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 53, 97, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
}}
.side-accent {{
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 5px;
    background: linear-gradient(180deg, {COLORS['accent_red']}, {COLORS['accent_gold']}, {COLORS['accent_purple']});
}}
.corner-dots {{
    position: absolute;
    top: 30px; right: 30px;
}}
.dot {{
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin: 0 4px;
}}
.dot-red {{ background: {COLORS['accent_red']}; }}
.dot-gold {{ background: {COLORS['accent_gold']}; }}
.dot-purple {{ background: {COLORS['accent_purple']}; }}
</style>
</head>
<body>
    <div class="subtle-grid"></div>
    <div class="side-accent"></div>
    <div class="corner-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-gold"></span>
        <span class="dot dot-purple"></span>
    </div>
</body>
</html>
"""

# Backcover: Dark with centered glow
BACK_HTML = f"""
<!DOCTYPE html>
<html>
<head>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
    width: 794px;
    height: 1123px;
    background: linear-gradient(135deg, {COLORS['bg_dark']} 0%, {COLORS['bg_mid']} 100%);
    position: relative;
    overflow: hidden;
}}
.grid {{
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
        linear-gradient(rgba(45, 53, 97, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(45, 53, 97, 0.2) 1px, transparent 1px);
    background-size: 60px 60px;
}}
.center-glow {{
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(233, 69, 96, 0.1) 0%, rgba(155, 89, 182, 0.08) 40%, transparent 70%);
    filter: blur(60px);
}}
.top-bar {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, {COLORS['accent_purple']}, {COLORS['accent_gold']}, {COLORS['accent_red']}, {COLORS['accent_purple']});
}}
.bottom-bar {{
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, {COLORS['accent_red']}, {COLORS['accent_gold']}, {COLORS['accent_purple']}, {COLORS['accent_red']});
}}
</style>
</head>
<body>
    <div class="grid"></div>
    <div class="center-glow"></div>
    <div class="top-bar"></div>
    <div class="bottom-bar"></div>
</body>
</html>
"""

async def generate_backgrounds():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 794, "height": 1123})
        
        backgrounds = [
            ("cover_bg.png", COVER_HTML),
            ("body_bg.png", BODY_HTML),
            ("backcover_bg.png", BACK_HTML),
        ]
        
        for filename, html in backgrounds:
            await page.set_content(html)
            path = os.path.join(OUTPUT_DIR, filename)
            await page.screenshot(path=path, clip={"x": 0, "y": 0, "width": 794, "height": 1123})
            print(f"Generated: {path}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(generate_backgrounds())
