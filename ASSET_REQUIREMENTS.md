# Acquire Digital - Asset Requirements

## Document Information
- **Version:** 1.0
- **Created:** December 21, 2025
- **Status:** Ready for Production

---

## Visual Assets

### Color Palette

#### Hotel Chain Colors
| Chain | Primary Color | Hex | RGB | Usage |
|-------|--------------|-----|-----|-------|
| Tower | Yellow | #FFD700 | 255, 215, 0 | Tiles, markers, stocks |
| Luxor | Orange | #FF8C00 | 255, 140, 0 | Tiles, markers, stocks |
| American | Blue | #1E90FF | 30, 144, 255 | Tiles, markers, stocks |
| Worldwide | Brown | #8B4513 | 139, 69, 19 | Tiles, markers, stocks |
| Festival | Green | #32CD32 | 50, 205, 50 | Tiles, markers, stocks |
| Continental | Teal | #008080 | 0, 128, 128 | Tiles, markers, stocks |
| Imperial | Red | #DC143C | 220, 20, 60 | Tiles, markers, stocks |

#### UI Colors
| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background Primary | Dark Gray | #1a1a2e | Main background |
| Background Secondary | Navy | #16213e | Panels, cards |
| Surface | Slate | #0f3460 | Elevated elements |
| Text Primary | White | #ffffff | Headings, important |
| Text Secondary | Light Gray | #a0a0a0 | Body text |
| Accent Primary | Gold | #e94560 | CTA buttons, highlights |
| Success | Green | #4ade80 | Confirmations |
| Warning | Amber | #fbbf24 | Alerts |
| Error | Red | #f87171 | Errors |
| Safe Chain | Gold Border | #ffd700 | Safe chain indicator |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo | Playfair Display | Bold | 48px |
| Headings | Space Grotesk | Semibold | 24-32px |
| Body | Inter | Regular | 16px |
| Labels | Inter | Medium | 14px |
| Numbers | JetBrains Mono | Regular | 16px |
| Game Board | Roboto Mono | Medium | 12px |

---

## Image Assets

### Board & Grid

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Board Background | 1200x900 | PNG/SVG | Textured game board surface |
| Grid Lines | 1200x900 | SVG | Overlay grid (12x9) |
| Cell Highlight | 100x100 | SVG | Valid move indicator |
| Cell Hover | 100x100 | SVG | Hover state |

### Tiles

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Tile Base | 80x80 | SVG | Neutral tile appearance |
| Tile (per chain) | 80x80 | SVG | 7 colored variations |
| Tile Selected | 80x80 | SVG | Selection glow/border |
| Tile Unplayable | 80x80 | SVG | Grayed/crossed out |
| Tile in Hand | 60x60 | SVG | Smaller for hand display |

### Hotel Chain Markers

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Chain Marker (per chain) | 40x60 | SVG | Building-shaped marker |
| Chain Icon (per chain) | 32x32 | SVG | Icon for UI panels |
| Safe Badge | 24x24 | SVG | Shield/lock icon |

### Stock Certificates

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Stock Card (per chain) | 120x80 | SVG | Certificate visual |
| Stock Icon (per chain) | 24x24 | SVG | Small icon for lists |

### Money

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Bill $100 | 80x40 | SVG | Green bill |
| Bill $500 | 80x40 | SVG | Purple bill |
| Bill $1,000 | 80x40 | SVG | Gold bill |
| Bill $5,000 | 80x40 | SVG | Blue bill |
| Bill $10,000 | 80x40 | SVG | Red bill |
| Coin Stack | 32x32 | SVG | Generic money icon |

### UI Elements

| Asset | Dimensions | Format | Description |
|-------|------------|--------|-------------|
| Logo | 200x60 | SVG | Game logo |
| Button Primary | Variable | SVG/CSS | Primary action button |
| Button Secondary | Variable | SVG/CSS | Secondary action |
| Card Frame | Variable | SVG | Panel backgrounds |
| Modal Overlay | Full | CSS | Semi-transparent overlay |
| Loading Spinner | 48x48 | SVG/CSS | Loading animation |

### Icons

| Icon | Size | Format | Description |
|------|------|--------|-------------|
| Play | 24x24 | SVG | Start/confirm |
| Skip | 24x24 | SVG | Skip action |
| Trade | 24x24 | SVG | Trade stocks |
| Sell | 24x24 | SVG | Sell stocks |
| Hold | 24x24 | SVG | Keep stocks |
| Info | 24x24 | SVG | Information |
| Settings | 24x24 | SVG | Settings menu |
| Sound On | 24x24 | SVG | Volume on |
| Sound Off | 24x24 | SVG | Volume muted |
| Chat | 24x24 | SVG | Chat toggle |
| Leave | 24x24 | SVG | Exit game |
| Crown | 24x24 | SVG | Winner indicator |
| Clock | 24x24 | SVG | Timer |
| Users | 24x24 | SVG | Player count |

---

## Animation Assets

### Lottie/CSS Animations

| Animation | Duration | Format | Trigger |
|-----------|----------|--------|---------|
| Tile Placed | 0.3s | CSS | Tile placement |
| Chain Founded | 0.5s | Lottie | New chain created |
| Chain Expanded | 0.2s | CSS | Chain grows |
| Merger Effect | 0.8s | Lottie | Chains merge |
| Stock Purchased | 0.3s | CSS | Buy stocks |
| Bonus Received | 0.5s | Lottie | Cash awarded |
| Turn Change | 0.3s | CSS | Turn passes |
| Victory | 2s | Lottie | Game won |
| Confetti | 3s | Lottie | Victory celebration |

---

## Audio Assets

### Sound Effects

| Sound | Duration | Format | Trigger |
|-------|----------|--------|---------|
| tile_place.mp3 | 0.2s | MP3/OGG | Tile placed |
| chain_found.mp3 | 0.5s | MP3/OGG | New chain |
| chain_merge.mp3 | 0.8s | MP3/OGG | Merger occurs |
| stock_buy.mp3 | 0.3s | MP3/OGG | Stock purchased |
| cash_register.mp3 | 0.3s | MP3/OGG | Money received |
| turn_start.mp3 | 0.3s | MP3/OGG | Your turn |
| turn_end.mp3 | 0.2s | MP3/OGG | Turn passed |
| button_click.mp3 | 0.1s | MP3/OGG | Button pressed |
| error.mp3 | 0.3s | MP3/OGG | Invalid action |
| victory.mp3 | 2s | MP3/OGG | Game won |
| defeat.mp3 | 1s | MP3/OGG | Game lost |
| chat_message.mp3 | 0.2s | MP3/OGG | New message |

### Background Music (Optional)

| Track | Duration | Format | Usage |
|-------|----------|--------|-------|
| lobby_ambient.mp3 | Loop | MP3/OGG | Lobby screen |
| game_ambient.mp3 | Loop | MP3/OGG | During gameplay |
| tension.mp3 | Loop | MP3/OGG | Final turns |

---

## Asset Creation Strategy

### Option 1: Custom Design (Recommended)
- **Pros:** Unique, perfect fit, full ownership
- **Cons:** Time investment, skill required
- **Tools:** Figma, Adobe Illustrator, Affinity Designer

### Option 2: Asset Modification
- **Pros:** Faster, lower cost
- **Cons:** Less unique, licensing concerns
- **Sources:** 
  - Flaticon (icons)
  - Freepik (graphics)
  - OpenGameArt (game assets)

### Option 3: AI Generation
- **Pros:** Very fast, good quality
- **Cons:** May need refinement, licensing varies
- **Tools:**
  - Midjourney (visuals)
  - DALL-E (graphics)
  - Suno (music)

### Option 4: Commission
- **Pros:** Professional quality, unique
- **Cons:** Higher cost, time for revisions
- **Platforms:** Fiverr, Upwork, ArtStation

---

## Asset File Structure

```
public/
├── assets/
│   ├── images/
│   │   ├── board/
│   │   │   ├── background.png
│   │   │   ├── grid.svg
│   │   │   └── highlight.svg
│   │   ├── tiles/
│   │   │   ├── tile-base.svg
│   │   │   ├── tile-tower.svg
│   │   │   ├── tile-luxor.svg
│   │   │   ├── tile-american.svg
│   │   │   ├── tile-worldwide.svg
│   │   │   ├── tile-festival.svg
│   │   │   ├── tile-continental.svg
│   │   │   └── tile-imperial.svg
│   │   ├── chains/
│   │   │   ├── marker-tower.svg
│   │   │   ├── marker-luxor.svg
│   │   │   └── ... (7 total)
│   │   ├── stocks/
│   │   │   ├── stock-tower.svg
│   │   │   └── ... (7 total)
│   │   ├── money/
│   │   │   ├── bill-100.svg
│   │   │   ├── bill-500.svg
│   │   │   ├── bill-1000.svg
│   │   │   ├── bill-5000.svg
│   │   │   └── bill-10000.svg
│   │   ├── ui/
│   │   │   ├── logo.svg
│   │   │   ├── card-frame.svg
│   │   │   └── patterns/
│   │   └── icons/
│   │       ├── play.svg
│   │       ├── skip.svg
│   │       └── ... (all icons)
│   ├── audio/
│   │   ├── sfx/
│   │   │   ├── tile_place.mp3
│   │   │   ├── chain_found.mp3
│   │   │   └── ... (all sounds)
│   │   └── music/
│   │       ├── lobby_ambient.mp3
│   │       └── game_ambient.mp3
│   └── animations/
│       ├── chain-founded.json
│       ├── merger.json
│       └── victory.json
└── favicon.ico
```

---

## Responsive Asset Considerations

### Resolution Targets

| Device | Resolution | Scale Factor |
|--------|------------|--------------|
| Mobile | 375x812 | 1x |
| Tablet | 768x1024 | 1.5x |
| Desktop | 1920x1080 | 2x |
| Retina | 3840x2160 | 2x-3x |

### Image Optimization

- Use SVG for all icons and UI elements
- Use WebP for photographs/textures
- Provide 1x, 2x, 3x variants for raster images
- Lazy load non-critical assets
- Total initial bundle < 500KB images

---

## Accessibility Considerations

### Color Blind Modes

| Chain | Standard Color | Pattern Alternative |
|-------|---------------|-------------------|
| Tower | Yellow | Solid |
| Luxor | Orange | Dots |
| American | Blue | Stripes |
| Worldwide | Brown | Crosshatch |
| Festival | Green | Diagonal lines |
| Continental | Teal | Checkers |
| Imperial | Red | Diamonds |

### High Contrast Mode

- Increase border widths to 3px
- Use black/white text only
- Add outlines to all interactive elements
- Increase minimum touch target to 48px

---

## Legal & Licensing

### Asset Licensing Checklist

- [ ] All fonts properly licensed for web use
- [ ] Sound effects royalty-free or licensed
- [ ] Music properly licensed (Creative Commons or purchased)
- [ ] Icons free for commercial use or created custom
- [ ] No trademarked imagery used
- [ ] Attribution requirements documented

### Recommended License Sources

| Resource Type | Recommended Source | License Type |
|---------------|-------------------|--------------|
| Fonts | Google Fonts | Open Font License |
| Icons | Heroicons, Lucide | MIT |
| Sound Effects | Freesound, Zapsplat | CC0/Royalty-free |
| Music | Incompetech | Attribution |
| UI Components | Custom | Own |

---

## Asset Production Timeline

| Week | Assets to Complete |
|------|-------------------|
| Week 5 Day 1-2 | Color palette, typography, design system |
| Week 5 Day 3-4 | Board background, grid, cell states |
| Week 5 Day 5 | All tile variations (8 total) |
| Week 6 Day 1 | Chain markers and icons (7 chains) |
| Week 6 Day 2 | Stock certificates, money |
| Week 6 Day 3 | UI panels and cards |
| Week 6 Day 4 | All icons (15+) |
| Week 6 Day 5 | Sound effects (12+) |
| Week 7 Day 1-2 | Animations (8+) |


