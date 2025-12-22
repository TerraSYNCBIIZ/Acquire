// ============================================================================
// ACQUIRE DIGITAL - Type Definitions
// ============================================================================

// === BASIC TYPES ===

/** Tile ID format: "1A" through "12I" */
export type TileId = string;

/** Row index 0-8 (representing A-I) */
export type RowIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Column index 0-11 (representing 1-12) */
export type ColIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Board coordinate */
export interface Coord {
  row: number;
  col: number;
}

// === CHAIN TYPES ===

/** The 7 hotel chain names */
export type ChainName = 
  | 'tower' 
  | 'luxor' 
  | 'american' 
  | 'worldwide' 
  | 'festival' 
  | 'continental' 
  | 'imperial';

/** Chain pricing tier */
export type ChainTier = 1 | 2 | 3;

/** Chain state */
export interface ChainState {
  tiles: TileId[];
  isActive: boolean;
  isSafe: boolean;
}

// === PLAYER TYPES ===

export interface PlayerState {
  id: string;
  name: string;
  cash: number;
  tiles: TileId[];
  stocks: Record<ChainName, number>;
}

// === BOARD TYPES ===

export interface BoardCell {
  tile: TileId | null;
  chain: ChainName | null;
}

// === GAME STATE ===

export type GamePhase = 
  | 'playTile' 
  | 'foundChain' 
  | 'resolveMerger' 
  | 'buyStocks' 
  | 'gameEnd';

export interface TurnState {
  hasPlayedTile: boolean;
  hasBoughtStocks: boolean;
  stocksPurchasedThisTurn: number;
  hasDrawnTile: boolean;
  hasExchangedDeadTile: boolean;
  currentPlayerId?: string;
}

export interface MergerState {
  triggeringTile: TileId;
  survivorChain: ChainName | null;
  defunctChains: ChainName[];
  currentDefunctIndex: number;
  shareholderOrder: string[];
  currentShareholderIndex: number;
  bonusesPaid: boolean;
  pendingTiles: TileId[]; // Tiles to merge into survivor
}

export interface StockDecision {
  hold: number;
  sell: number;
  trade: number;
}

export interface StockPurchase {
  chain: ChainName;
  count: number;
}

export interface GameConfig {
  openHoldings: boolean;
  turnTimeLimit: number | null;
}

// === MAIN GAME STATE ===

export interface AcquireGameState {
  // Board
  board: BoardCell[][];
  
  // Tiles
  tilePool: TileId[];
  
  // Players (keyed by player ID "0", "1", etc.)
  players: Record<string, PlayerState>;
  
  // Chains
  chains: Record<ChainName, ChainState>;
  
  // Stock market (remaining shares)
  stockMarket: Record<ChainName, number>;
  
  // Game flow
  currentPhase: GamePhase;
  turnState: TurnState;
  
  // Merger (null if not in merger)
  mergerState: MergerState | null;
  
  // Pending state for chain founding
  pendingFoundation: {
    tiles: TileId[];
  } | null;
  
  // Config
  config?: GameConfig;
  
  // Game log
  log: string[];
  
  // Current player (for non-boardgame.io mode)
  currentPlayer?: string;
  
  // Game over state (for non-boardgame.io mode)
  gameOver?: boolean;
  winner?: string | null;
  
  // Final scores (bonuses + stock values + cash)
  finalScores?: Record<string, number>;
}

// === TILE PLACEMENT OUTCOMES ===

export type TilePlacementOutcome = 
  | { type: 'nothing' }
  | { type: 'expand'; chain: ChainName }
  | { type: 'found'; tiles: TileId[] }
  | { type: 'merge'; chains: ChainName[]; tiles: TileId[] }
  | { type: 'unplayable'; reason: 'dead' | 'eighth-corp' };

// === BOARDGAME.IO CONTEXT ===

export interface Ctx {
  numPlayers: number;
  turn: number;
  currentPlayer: string;
  playOrder: string[];
  playOrderPos: number;
  phase: string | null;
  activePlayers: Record<string, string> | null;
  gameover?: {
    winner: string;
    scores: Record<string, number>;
  };
}

