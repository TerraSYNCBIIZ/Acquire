# Acquire Digital

A modern, multiplayer digital implementation of the classic Sid Sackson board game **Acquire**.

## About the Game

Acquire is a strategic board game about hotel chain mergers and stock trading. Players place tiles on a 12x9 board to found and grow hotel chains, buy stocks, and profit from mergers. The player with the most money at the end wins.

## Features

- **Complete Game Logic**: All rules from the original board game implemented
  - Tile placement and chain formation
  - 7 hotel chains with tiered pricing
  - Stock purchasing (up to 3 per turn)
  - Chain mergers with shareholder bonuses
  - Safe chains (11+ tiles cannot be acquired)
  - Game end conditions (41+ tile chain or all chains safe)

- **Beautiful UI**: Modern dark theme with chain-colored tiles
- **Multiplayer Support**: Play online with friends via WebSocket
- **Local Play**: Also supports local hot-seat multiplayer

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Game Engine**: boardgame.io
- **Multiplayer**: WebSocket via boardgame.io server

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd studio/projects/acquire-digital
npm install
```

### Development (Local Play)

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Multiplayer Server

```bash
# Terminal 1: Start the game server
npm run dev:server

# Terminal 2: Start the frontend
npm run dev
```

## Game Rules Summary

### Setup
- Each player starts with $6,000 and 6 tiles
- 108 tiles (12 columns x 9 rows: 1A through 12I)

### Turn Structure
1. **Play a Tile**: Place one tile from your hand onto the board
2. **Buy Stocks**: Purchase 0-3 stocks from active chains
3. **Draw a Tile**: Draw a replacement tile

### Chain Formation
- Place a tile adjacent to another standalone tile = found a new chain
- Founder receives 1 free stock
- Chains grow by placing adjacent tiles

### Mergers
- When a tile connects two or more chains, the larger chain absorbs the smaller
- Stockholders in defunct chains receive bonuses based on holdings
- Can choose to: Hold, Sell, or Trade (2:1) defunct stocks

### Pricing Tiers
| Tier | Chains | Base Price |
|------|--------|------------|
| 1 | Tower, Luxor | $200-1000 |
| 2 | American, Worldwide, Festival | $300-1100 |
| 3 | Continental, Imperial | $400-1200 |

### Game End
Game ends when:
- Any chain reaches 41+ tiles, OR
- All active chains are "safe" (11+ tiles)

Winner is the player with the most money after final stock liquidation.

## Project Structure

```
acquire-digital/
├── src/
│   ├── game/
│   │   ├── types.ts          # TypeScript type definitions
│   │   ├── constants.ts      # Game constants and pricing
│   │   ├── setup.ts          # Game initialization
│   │   ├── moves.ts          # All game actions/moves
│   │   ├── game.ts           # boardgame.io game definition
│   │   └── logic/
│   │       ├── board.ts      # Board manipulation logic
│   │       └── merger.ts     # Merger resolution logic
│   ├── components/
│   │   └── Board/
│   │       ├── AcquireBoard.tsx   # Main game board
│   │       └── MergerDialog.tsx   # Merger resolution UI
│   ├── styles/
│   │   ├── index.css         # Main styles
│   │   └── lobby.css         # Lobby styles
│   ├── App.tsx               # Local play entry
│   └── App.multiplayer.tsx   # Online multiplayer entry
├── server/
│   └── index.ts              # Multiplayer game server
└── package.json
```

## Multiplayer & Deployment

### Backend (PartyKit)
The real-time multiplayer backend is powered by **PartyKit**.
- **Deployed URL**: `https://acquire-digital.terrasyncbiiz.partykit.dev`

### Frontend (Netlify)
The frontend is deployed on **Netlify**.
- Ensure the `VITE_PARTYKIT_HOST` environment variable is set to your PartyKit URL.

## Future Enhancements (Roadmap)

### Version 1.1 - Multiplayer Refinement & Bots ✅
- [x] **AI Bot Optimization**: Bots no longer affected by turn timers in multiplayer.
- [x] **Instant AI Conversion**: Bots immediately take their turn when a player disconnects.
- [x] **Challenging AI**: Enhanced strategic logic with stock hoarding and merger prevention.
- [x] **Scoring Clarity**: Expandable score breakdown for all players on Game Over screen.
- [x] **Scoring Audit**: Edge cases for bonus calculations verified and documented.

### Version 1.2 - Complete Rule Implementation & Smarter AI ✅
- [x] **AI Game End Declaration**: Bots now declare game end when winning and conditions are met.
- [x] **Dead Tile Exchange**: Players can discard tiles that connect two safe chains and draw new ones.
- [x] **Unplayable Hand Handling**: Players with no playable tiles can now pass their tile placement phase.
- [x] **Enhanced Merger AI**: Improved survivor selection logic for 3+ chain equal-size mergers.
- [x] **Strategy-Aware End Game**: Each AI personality uses different criteria for when to end the game.

### Version 1.3+
- [ ] Sound effects and animations
- [ ] Game history/replay
- [ ] Persistent accounts and rankings
- [ ] Mobile-responsive layout
- [ ] Spectator mode
- [ ] AI opponents for single-player (dedicated mode)
- [ ] Tournament mode
- [ ] Leaderboards

## Credits

- Original game designed by Sid Sackson (1964)
- Digital implementation using boardgame.io framework
