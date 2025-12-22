# Acquire Digital - Technical Architecture

## Document Information
- **Version:** 1.0
- **Created:** December 21, 2025
- **Status:** Architecture Defined - Ready for Implementation

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Game State Design](#game-state-design)
4. [Game Logic Implementation](#game-logic-implementation)
5. [Multiplayer Architecture](#multiplayer-architecture)
6. [UI/UX Components](#uiux-components)
7. [Data Flow](#data-flow)
8. [Security Considerations](#security-considerations)

---

## Technology Stack

### Recommended Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | boardgame.io | Purpose-built for turn-based games with multiplayer |
| **Frontend** | React 18+ with TypeScript | Modern, component-based, excellent ecosystem |
| **Build Tool** | Vite | Fast development, excellent TypeScript support |
| **Styling** | Tailwind CSS + CSS Modules | Utility-first with component scoping |
| **Animation** | Framer Motion | Smooth, declarative animations |
| **Backend** | Node.js + Express | Native boardgame.io server support |
| **Database** | PostgreSQL or SQLite | Game persistence, player accounts |
| **Real-time** | Socket.io (via boardgame.io) | Built-in WebSocket support |
| **Deployment** | Docker + Railway/Render | Easy containerized deployment |

### Why boardgame.io?

boardgame.io is a state-of-the-art framework specifically designed for turn-based games:

| Feature | Benefit for Acquire |
|---------|---------------------|
| State Management | Automatic sync between clients and server |
| Turn System | Built-in turn order, phases, stages |
| Multiplayer | WebSocket-based real-time multiplayer out-of-box |
| Game Logic | Server-authoritative game state |
| React Integration | First-class React component support |
| AI Support | Built-in AI/bot framework |
| Undo/Redo | Move history and undo support |
| Spectator Mode | Watch games without participating |

### Alternative Stacks Considered

| Alternative | Pros | Cons | Decision |
|-------------|------|------|----------|
| Unity WebGL | Rich graphics, cross-platform | Overkill for board game, longer dev time | ❌ |
| Phaser.js | Game engine for 2D | Manual multiplayer, more complexity | ❌ |
| Custom WebSockets | Full control | Significant development overhead | ❌ |
| boardgame.io | Purpose-built, batteries included | Learning curve | ✅ |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  Player 1   │  Player 2   │  Player 3   │  Player 4   │ Spectator│
│  (Browser)  │  (Browser)  │  (Browser)  │  (Browser)  │ (Browser)│
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬─────┘
       │             │             │             │           │
       └─────────────┴──────┬──────┴─────────────┴───────────┘
                            │ WebSocket (Socket.io)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BOARDGAME.IO SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Game Logic  │  │   Lobby     │  │  Match      │             │
│  │  (Acquire)  │  │  Management │  │  Management │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ G (Game State) │ ctx (Context) │ plugins │ matchData        ││
│  └─────────────────────────────────────────────────────────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL / SQLite                                             │
│  - Active Games                                                  │
│  - Completed Games (history)                                     │
│  - Player Profiles                                               │
│  - Lobby State                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
acquire-digital/
├── src/
│   ├── game/                    # boardgame.io game definition
│   │   ├── game.ts              # Main game configuration
│   │   ├── moves/               # Move implementations
│   │   │   ├── placeTile.ts
│   │   │   ├── foundChain.ts
│   │   │   ├── buyStocks.ts
│   │   │   ├── handleMerger.ts
│   │   │   └── index.ts
│   │   ├── phases/              # Phase configurations
│   │   │   ├── playTile.ts
│   │   │   ├── foundChain.ts
│   │   │   ├── resolveMerger.ts
│   │   │   └── buyStocks.ts
│   │   ├── logic/               # Pure game logic functions
│   │   │   ├── board.ts
│   │   │   ├── chains.ts
│   │   │   ├── stocks.ts
│   │   │   ├── mergers.ts
│   │   │   └── pricing.ts
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── constants.ts         # Game constants
│   ├── client/                  # React frontend
│   │   ├── components/
│   │   │   ├── Board/
│   │   │   ├── PlayerHand/
│   │   │   ├── StockPanel/
│   │   │   ├── ChainInfo/
│   │   │   ├── PlayerInfo/
│   │   │   ├── MergerDialog/
│   │   │   ├── Lobby/
│   │   │   └── Chat/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── App.tsx
│   └── server/                  # Express + boardgame.io server
│       ├── index.ts
│       └── database.ts
├── public/
│   └── assets/                  # Static assets
├── tests/
│   ├── game/                    # Game logic tests
│   └── integration/             # Integration tests
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

---

## Game State Design

### State Structure (G Object)

```typescript
interface AcquireGameState {
  // === BOARD STATE ===
  board: BoardCell[][];              // 9 rows x 12 cols
  
  // === TILE MANAGEMENT ===
  tilePool: TileId[];                // Undrawn tiles
  discardedTiles: TileId[];          // Dead tiles discarded
  
  // === PLAYER STATE ===
  players: {
    [playerId: string]: PlayerState;
  };
  
  // === CHAIN STATE ===
  chains: {
    [chainName: string]: ChainState;
  };
  availableChains: ChainName[];      // Chains not yet founded
  
  // === STOCK MARKET ===
  stockMarket: {
    [chainName: string]: number;     // Available shares
  };
  
  // === GAME FLOW ===
  currentPhase: GamePhase;
  turnState: TurnState;
  
  // === MERGER STATE (when applicable) ===
  mergerState: MergerState | null;
  
  // === GAME CONFIG ===
  config: GameConfig;
}

// Supporting Types
type TileId = string;                // e.g., "1A", "5D", "12I"
type ChainName = 'tower' | 'luxor' | 'american' | 'worldwide' | 'festival' | 'continental' | 'imperial';
type GamePhase = 'playTile' | 'foundChain' | 'resolveMerger' | 'buyStocks' | 'gameEnd';

interface BoardCell {
  tile: TileId | null;
  chain: ChainName | null;
}

interface PlayerState {
  cash: number;
  tiles: TileId[];                   // 6 tiles in hand
  stocks: { [chainName: string]: number };
  isActive: boolean;
}

interface ChainState {
  tiles: TileId[];
  isActive: boolean;
  isSafe: boolean;                   // 11+ tiles
  founderPlayerId: string | null;
}

interface TurnState {
  hasPlayedTile: boolean;
  hasBoughtStocks: boolean;
  stocksPurchasedThisTurn: number;
  hasDrawnTile: boolean;
}

interface MergerState {
  triggeringTile: TileId;
  survivorChain: ChainName;
  defunctChains: ChainName[];
  currentDefunctIndex: number;
  
  // For current defunct chain resolution
  shareholderOrder: string[];        // Player IDs in order
  currentShareholderIndex: number;
  bonusesPaid: boolean;
  
  // Track what each player has decided
  shareholderDecisions: {
    [playerId: string]: {
      hold: number;
      sell: number;
      trade: number;
    } | null;
  };
}

interface GameConfig {
  openHoldings: boolean;             // Show/hide player holdings
  timeLimit: number | null;          // Turn time limit (seconds)
}
```

### Context (ctx Object)

boardgame.io automatically manages ctx:

```typescript
interface Context {
  numPlayers: number;
  turn: number;
  currentPlayer: string;
  playOrder: string[];
  playOrderPos: number;
  phase: string | null;
  activePlayers: { [playerId: string]: string } | null;
  gameover?: { winner: string; finalScores: object };
}
```

---

## Game Logic Implementation

### Moves Definition

```typescript
// src/game/moves/index.ts

export const moves = {
  // Phase: playTile
  placeTile: {
    move: (G: AcquireGameState, ctx: Ctx, tileId: TileId) => {
      // 1. Validate tile is in player's hand
      // 2. Validate tile is playable (not dead)
      // 3. Place tile on board
      // 4. Determine outcome (nothing, expand, found, merge)
      // 5. Transition to appropriate phase
    },
    client: false, // Server-authoritative
  },

  // Phase: foundChain
  selectChainToFound: {
    move: (G: AcquireGameState, ctx: Ctx, chainName: ChainName) => {
      // 1. Validate chain is available
      // 2. Create chain with connected tiles
      // 3. Award founder's stock
      // 4. Transition to buyStocks phase
    },
    client: false,
  },

  // Phase: resolveMerger
  chooseMergerSurvivor: {
    move: (G: AcquireGameState, ctx: Ctx, chainName: ChainName) => {
      // Only called when chains are equal size
      // Set survivor and begin defunct resolution
    },
    client: false,
  },

  handleDefunctStock: {
    move: (G: AcquireGameState, ctx: Ctx, decision: StockDecision) => {
      // 1. Validate player has stocks
      // 2. Process hold/sell/trade
      // 3. Move to next shareholder or next defunct chain
    },
    client: false,
  },

  // Phase: buyStocks
  buyStocks: {
    move: (G: AcquireGameState, ctx: Ctx, purchases: StockPurchase[]) => {
      // 1. Validate total <= 3
      // 2. Validate chains are active
      // 3. Validate sufficient funds
      // 4. Validate stock availability
      // 5. Process purchases
    },
    client: false,
  },

  skipBuyStocks: {
    move: (G: AcquireGameState, ctx: Ctx) => {
      // End buying phase with no purchases
    },
    client: false,
  },

  // Special
  declareGameEnd: {
    move: (G: AcquireGameState, ctx: Ctx) => {
      // Validate end conditions met
      // Set phase to gameEnd
    },
    client: false,
  },

  exchangeDeadTile: {
    move: (G: AcquireGameState, ctx: Ctx, tileId: TileId) => {
      // Exchange one dead tile for new tile
      // Only once per turn
    },
    client: false,
  },
};
```

### Phases Configuration

```typescript
// src/game/phases/index.ts

export const phases = {
  playTile: {
    start: true,
    moves: ['placeTile', 'exchangeDeadTile', 'declareGameEnd'],
    next: (G: AcquireGameState) => {
      if (G.pendingChainFoundation) return 'foundChain';
      if (G.pendingMerger) return 'resolveMerger';
      return 'buyStocks';
    },
    turn: {
      order: TurnOrder.DEFAULT,
    },
  },

  foundChain: {
    moves: ['selectChainToFound'],
    next: 'buyStocks',
  },

  resolveMerger: {
    moves: ['chooseMergerSurvivor', 'handleDefunctStock'],
    next: (G: AcquireGameState) => {
      if (!G.mergerState || G.mergerState.resolved) return 'buyStocks';
      return 'resolveMerger';
    },
    turn: {
      activePlayers: {
        currentPlayer: 'resolveMerger',
      },
    },
  },

  buyStocks: {
    moves: ['buyStocks', 'skipBuyStocks', 'declareGameEnd'],
    endIf: (G: AcquireGameState) => G.turnState.hasBoughtStocks,
    onEnd: (G: AcquireGameState, ctx: Ctx) => {
      // Draw tile
      // Reset turn state
      // Check for game end
    },
    next: 'playTile',
  },

  gameEnd: {
    moves: [],
    onBegin: (G: AcquireGameState, ctx: Ctx) => {
      // Calculate final scores
      // Determine winner
    },
  },
};
```

### Pure Logic Functions

```typescript
// src/game/logic/board.ts

export function getAdjacentCells(row: number, col: number): Coord[] {
  const adjacent: Coord[] = [];
  if (row > 0) adjacent.push({ row: row - 1, col });
  if (row < 8) adjacent.push({ row: row + 1, col });
  if (col > 0) adjacent.push({ row, col: col - 1 });
  if (col < 11) adjacent.push({ row, col: col + 1 });
  return adjacent;
}

export function getTilePlacementOutcome(
  G: AcquireGameState,
  tileId: TileId
): TilePlacementOutcome {
  const { row, col } = tileIdToCoord(tileId);
  const adjacentChains = getAdjacentChains(G, row, col);
  const adjacentUnincorporated = getAdjacentUnincorporated(G, row, col);

  if (adjacentChains.length === 0 && adjacentUnincorporated.length === 0) {
    return { type: 'nothing' };
  }

  if (adjacentChains.length === 0 && adjacentUnincorporated.length > 0) {
    return { type: 'found', tiles: [tileId, ...adjacentUnincorporated] };
  }

  if (adjacentChains.length === 1) {
    return { type: 'expand', chain: adjacentChains[0] };
  }

  // Multiple chains - merger
  return analyzeMerger(G, adjacentChains);
}

export function isTilePlayable(G: AcquireGameState, tileId: TileId): boolean {
  const outcome = getTilePlacementOutcome(G, tileId);
  
  // Dead tile: would merge two safe chains
  if (outcome.type === 'merge') {
    const safeChains = outcome.chains.filter(c => G.chains[c].isSafe);
    if (safeChains.length >= 2) return false;
  }
  
  // Would create 8th chain
  if (outcome.type === 'found' && G.availableChains.length === 0) {
    return false;
  }
  
  return true;
}

// src/game/logic/pricing.ts

const CHAIN_TIERS: { [chain: string]: number } = {
  tower: 1, luxor: 1,
  american: 2, worldwide: 2, festival: 2,
  continental: 3, imperial: 3,
};

const PRICE_TABLE: { [tier: number]: { [sizeRange: string]: number } } = {
  1: { '2': 200, '3': 300, '4': 400, '5': 500, '6-10': 600, '11-20': 700, '21-30': 800, '31-40': 900, '41+': 1000 },
  2: { '2': 300, '3': 400, '4': 500, '5': 600, '6-10': 700, '11-20': 800, '21-30': 900, '31-40': 1000, '41+': 1100 },
  3: { '2': 400, '3': 500, '4': 600, '5': 700, '6-10': 800, '11-20': 900, '21-30': 1000, '31-40': 1100, '41+': 1200 },
};

export function getStockPrice(chain: ChainName, size: number): number {
  const tier = CHAIN_TIERS[chain];
  const sizeKey = getSizeRangeKey(size);
  return PRICE_TABLE[tier][sizeKey];
}

export function getMajorityBonus(chain: ChainName, size: number): number {
  return getStockPrice(chain, size) * 10;
}

export function getMinorityBonus(chain: ChainName, size: number): number {
  return getStockPrice(chain, size) * 5;
}

function getSizeRangeKey(size: number): string {
  if (size <= 5) return size.toString();
  if (size <= 10) return '6-10';
  if (size <= 20) return '11-20';
  if (size <= 30) return '21-30';
  if (size <= 40) return '31-40';
  return '41+';
}
```

---

## Multiplayer Architecture

### Lobby System

```typescript
// Using boardgame.io's built-in lobby

import { LobbyClient } from 'boardgame.io/client';

const lobbyClient = new LobbyClient({ server: 'https://your-server.com' });

// Create a new game
const { matchID } = await lobbyClient.createMatch('acquire', {
  numPlayers: 4,
});

// Join a game
const { playerCredentials } = await lobbyClient.joinMatch('acquire', matchID, {
  playerName: 'Alice',
});

// List available games
const { matches } = await lobbyClient.listMatches('acquire');
```

### Client Setup

```typescript
// src/client/App.tsx

import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { AcquireGame } from '../game/game';
import { AcquireBoard } from './components/Board';

const AcquireClient = Client({
  game: AcquireGame,
  board: AcquireBoard,
  multiplayer: SocketIO({ server: 'https://your-server.com' }),
});

export function App() {
  return (
    <AcquireClient
      matchID={matchID}
      playerID={playerID}
      credentials={credentials}
    />
  );
}
```

### Server Setup

```typescript
// src/server/index.ts

import { Server, Origins } from 'boardgame.io/server';
import { PostgresStore } from 'bgio-postgres';
import { AcquireGame } from '../game/game';

const server = Server({
  games: [AcquireGame],
  origins: [Origins.LOCALHOST],
  db: new PostgresStore(process.env.DATABASE_URL),
});

server.run(8000);
```

---

## UI/UX Components

### Component Hierarchy

```
<App>
├── <Router>
│   ├── <LobbyPage>
│   │   ├── <GameList>
│   │   ├── <CreateGameForm>
│   │   └── <JoinGameModal>
│   │
│   └── <GamePage>
│       ├── <GameBoard>
│       │   ├── <BoardGrid>
│       │   │   └── <BoardCell> (108 cells)
│       │   └── <ChainMarkers>
│       │
│       ├── <PlayerHand>
│       │   └── <Tile> (6 tiles)
│       │
│       ├── <SidePanel>
│       │   ├── <ChainInfo>
│       │   │   └── <ChainCard> (7 chains)
│       │   ├── <StockMarket>
│       │   └── <PriceChart>
│       │
│       ├── <PlayersPanel>
│       │   └── <PlayerCard> (per player)
│       │
│       ├── <ActionPanel>
│       │   ├── <BuyStocksPanel>
│       │   └── <MergerResolutionPanel>
│       │
│       ├── <Chat>
│       └── <GameLog>
```

### Key Component Specifications

#### GameBoard Component
- 12 columns x 9 rows grid
- Each cell: 60x60px minimum
- Responsive scaling
- Hover states for valid moves
- Click/drag to place tiles
- Chain colors clearly visible

#### PlayerHand Component
- Horizontal tile rack
- 6 tile slots
- Highlight playable tiles
- Dim unplayable tiles
- Click to select, click board to place

#### StockPanel Component
- Shows when in "buyStocks" phase
- Dropdown/buttons for each active chain
- Quantity selector (0-3 total)
- Running cost total
- Confirm/Cancel buttons

#### MergerDialog Component
- Modal overlay during mergers
- Shows bonus amounts
- Hold/Sell/Trade options
- Quantity selectors
- Stock trade calculator

---

## Data Flow

### Move Execution Flow

```
┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│    CLIENT    │─────►│    SERVER     │─────►│   DATABASE   │
│              │      │               │      │              │
│  1. User     │      │  3. Validate  │      │  5. Persist  │
│     clicks   │      │     move      │      │     state    │
│              │      │               │      │              │
│  2. Dispatch │      │  4. Update    │◄─────│  6. Confirm  │
│     move     │      │     state     │      │              │
└──────────────┘      └───────────────┘      └──────────────┘
       ▲                     │
       │                     │
       └─────────────────────┘
         7. Broadcast updated state to all clients
```

### State Synchronization

boardgame.io handles state sync automatically:

1. Client dispatches move
2. Server validates and applies
3. New state sent to ALL connected clients
4. React re-renders with new state

---

## Security Considerations

### Server Authority
- ALL moves validated server-side
- Clients cannot modify state directly
- Invalid moves rejected with error

### Input Validation
- Tile IDs validated against enum
- Chain names validated
- Stock counts validated
- Cash amounts validated

### Authentication
- Player credentials via boardgame.io lobby
- Match-specific access tokens
- Cannot join full games

### Rate Limiting
- Moves per second limits
- API endpoint rate limiting
- WebSocket message throttling

---

## Development Environment Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- PostgreSQL (for production)

### Quick Start

```bash
# Clone and install
git clone <repo>
cd acquire-digital
npm install

# Development (with hot reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

```env
# .env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/acquire
SERVER_PORT=8000
CLIENT_PORT=3000
```

