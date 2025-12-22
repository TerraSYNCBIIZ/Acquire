// ============================================================================
// ACQUIRE DIGITAL - Game Constants
// ============================================================================

import { ChainName, ChainTier, TileId } from './types';

// === BOARD DIMENSIONS ===
export const BOARD_ROWS = 9;  // A through I
export const BOARD_COLS = 12; // 1 through 12
export const TOTAL_TILES = BOARD_ROWS * BOARD_COLS; // 108

// === ROW/COLUMN LABELS ===
export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;

// === CHAIN DEFINITIONS ===
export const CHAIN_NAMES: ChainName[] = [
  'tower',
  'luxor',
  'american',
  'worldwide',
  'festival',
  'continental',
  'imperial',
];

export const CHAIN_TIERS: Record<ChainName, ChainTier> = {
  tower: 1,
  luxor: 1,
  american: 2,
  worldwide: 2,
  festival: 2,
  continental: 3,
  imperial: 3,
};

export const CHAIN_COLORS: Record<ChainName, string> = {
  tower: '#FFD700',      // Yellow
  luxor: '#FF8C00',      // Orange
  american: '#1E90FF',   // Blue
  worldwide: '#8B4513',  // Brown
  festival: '#32CD32',   // Green
  continental: '#008080', // Teal
  imperial: '#DC143C',   // Red
};

export const CHAIN_DISPLAY_NAMES: Record<ChainName, string> = {
  tower: 'Tower',
  luxor: 'Luxor',
  american: 'American',
  worldwide: 'Worldwide',
  festival: 'Festival',
  continental: 'Continental',
  imperial: 'Imperial',
};

// === PRICING TABLES ===

/** Stock price per share based on chain tier and size */
export const STOCK_PRICES: Record<ChainTier, Record<string, number>> = {
  1: { // Tower, Luxor
    '2': 200,
    '3': 300,
    '4': 400,
    '5': 500,
    '6-10': 600,
    '11-20': 700,
    '21-30': 800,
    '31-40': 900,
    '41+': 1000,
  },
  2: { // American, Worldwide, Festival
    '2': 300,
    '3': 400,
    '4': 500,
    '5': 600,
    '6-10': 700,
    '11-20': 800,
    '21-30': 900,
    '31-40': 1000,
    '41+': 1100,
  },
  3: { // Continental, Imperial
    '2': 400,
    '3': 500,
    '4': 600,
    '5': 700,
    '6-10': 800,
    '11-20': 900,
    '21-30': 1000,
    '31-40': 1100,
    '41+': 1200,
  },
};

// === GAME RULES ===
export const STARTING_CASH = 6000;
export const TILES_IN_HAND = 6;
export const MAX_STOCKS_PER_TURN = 3;
export const STOCKS_PER_CHAIN = 25;
export const SAFE_CHAIN_SIZE = 11;
export const GAME_END_CHAIN_SIZE = 41;
export const STOCK_TRADE_RATIO = 2; // 2 defunct = 1 survivor

// === MONEY DENOMINATIONS ===
export const MONEY_DENOMINATIONS = [100, 500, 1000, 5000, 10000] as const;

// === UTILITY FUNCTIONS ===

/**
 * Convert row and column indices to tile ID
 * @example coordToTileId(0, 0) => "1A"
 * @example coordToTileId(8, 11) => "12I"
 */
export function coordToTileId(row: number, col: number): TileId {
  return `${col + 1}${ROW_LABELS[row]}`;
}

/**
 * Convert tile ID to row and column indices
 * @example tileIdToCoord("1A") => { row: 0, col: 0 }
 * @example tileIdToCoord("12I") => { row: 8, col: 11 }
 */
export function tileIdToCoord(tileId: TileId): { row: number; col: number } {
  const match = tileId.match(/^(\d+)([A-I])$/);
  if (!match) {
    throw new Error(`Invalid tile ID: ${tileId}`);
  }
  const col = parseInt(match[1], 10) - 1;
  const row = ROW_LABELS.indexOf(match[2] as typeof ROW_LABELS[number]);
  return { row, col };
}

/**
 * Get the size range key for price lookup
 */
export function getSizeRangeKey(size: number): string {
  if (size <= 5) return size.toString();
  if (size <= 10) return '6-10';
  if (size <= 20) return '11-20';
  if (size <= 30) return '21-30';
  if (size <= 40) return '31-40';
  return '41+';
}

/**
 * Get stock price for a chain based on its size
 */
export function getStockPrice(chain: ChainName, size: number): number {
  if (size < 2) return 0;
  const tier = CHAIN_TIERS[chain];
  const sizeKey = getSizeRangeKey(size);
  return STOCK_PRICES[tier][sizeKey];
}

/**
 * Get majority shareholder bonus
 */
export function getMajorityBonus(chain: ChainName, size: number): number {
  return getStockPrice(chain, size) * 10;
}

/**
 * Get minority shareholder bonus
 */
export function getMinorityBonus(chain: ChainName, size: number): number {
  return getStockPrice(chain, size) * 5;
}

/**
 * Generate all 108 tile IDs
 */
export function generateAllTileIds(): TileId[] {
  const tiles: TileId[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      tiles.push(coordToTileId(row, col));
    }
  }
  return tiles;
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if two tiles are orthogonally adjacent
 */
export function areAdjacent(tile1: TileId, tile2: TileId): boolean {
  const coord1 = tileIdToCoord(tile1);
  const coord2 = tileIdToCoord(tile2);
  const rowDiff = Math.abs(coord1.row - coord2.row);
  const colDiff = Math.abs(coord1.col - coord2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Get all adjacent tile IDs for a given coordinate
 */
export function getAdjacentTileIds(row: number, col: number): TileId[] {
  const adjacent: TileId[] = [];
  if (row > 0) adjacent.push(coordToTileId(row - 1, col));
  if (row < BOARD_ROWS - 1) adjacent.push(coordToTileId(row + 1, col));
  if (col > 0) adjacent.push(coordToTileId(row, col - 1));
  if (col < BOARD_COLS - 1) adjacent.push(coordToTileId(row, col + 1));
  return adjacent;
}


