// ============================================================================
// ACQUIRE DIGITAL - Board Logic
// ============================================================================

import { 
  AcquireGameState, 
  BoardCell, 
  ChainName, 
  TileId, 
  TilePlacementOutcome
} from '../types';
import { 
  BOARD_ROWS, 
  BOARD_COLS, 
  tileIdToCoord, 
  getAdjacentTileIds,
  CHAIN_NAMES
} from '../constants';

/**
 * Create an empty game board
 */
export function createEmptyBoard(): BoardCell[][] {
  const board: BoardCell[][] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_COLS; col++) {
      board[row][col] = { tile: null, chain: null };
    }
  }
  return board;
}

/**
 * Get the cell at the specified tile ID
 */
export function getCell(board: BoardCell[][], tileId: TileId): BoardCell {
  const { row, col } = tileIdToCoord(tileId);
  return board[row][col];
}

/**
 * Check if a tile is on the board
 */
export function isTileOnBoard(board: BoardCell[][], tileId: TileId): boolean {
  const cell = getCell(board, tileId);
  return cell.tile !== null;
}

/**
 * Get all adjacent cells that have tiles
 */
export function getAdjacentOccupiedCells(
  board: BoardCell[][], 
  tileId: TileId
): { tileId: TileId; cell: BoardCell }[] {
  const { row, col } = tileIdToCoord(tileId);
  const adjacentTileIds = getAdjacentTileIds(row, col);
  
  return adjacentTileIds
    .map(adjTileId => ({
      tileId: adjTileId,
      cell: getCell(board, adjTileId),
    }))
    .filter(({ cell }) => cell.tile !== null);
}

/**
 * Get unique chains adjacent to a tile position
 */
export function getAdjacentChains(board: BoardCell[][], tileId: TileId): ChainName[] {
  const adjacent = getAdjacentOccupiedCells(board, tileId);
  const chains = new Set<ChainName>();
  
  for (const { cell } of adjacent) {
    if (cell.chain) {
      chains.add(cell.chain);
    }
  }
  
  return Array.from(chains);
}

/**
 * Get adjacent tiles that are unincorporated (no chain)
 */
export function getAdjacentUnincorporated(board: BoardCell[][], tileId: TileId): TileId[] {
  const adjacent = getAdjacentOccupiedCells(board, tileId);
  return adjacent
    .filter(({ cell }) => cell.chain === null)
    .map(({ tileId }) => tileId);
}

/**
 * Flood fill to find all connected tiles starting from a tile
 */
export function getConnectedTiles(board: BoardCell[][], startTileId: TileId): TileId[] {
  const visited = new Set<TileId>();
  const stack = [startTileId];
  const connected: TileId[] = [];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    
    const cell = getCell(board, current);
    if (cell.tile === null) continue;
    
    visited.add(current);
    connected.push(current);
    
    const { row, col } = tileIdToCoord(current);
    const adjacentTileIds = getAdjacentTileIds(row, col);
    
    for (const adjTileId of adjacentTileIds) {
      if (!visited.has(adjTileId)) {
        const adjCell = getCell(board, adjTileId);
        if (adjCell.tile !== null) {
          stack.push(adjTileId);
        }
      }
    }
  }
  
  return connected;
}

/**
 * Determine the outcome of placing a tile
 */
export function getTilePlacementOutcome(
  G: AcquireGameState, 
  tileId: TileId
): TilePlacementOutcome {
  const adjacentChains = getAdjacentChains(G.board, tileId);
  const adjacentUnincorporated = getAdjacentUnincorporated(G.board, tileId);
  
  // No adjacent tiles - nothing happens
  if (adjacentChains.length === 0 && adjacentUnincorporated.length === 0) {
    return { type: 'nothing' };
  }
  
  // Adjacent to unincorporated only - found new chain
  if (adjacentChains.length === 0 && adjacentUnincorporated.length > 0) {
    // Check if we can found (need available chains)
    const availableChains = CHAIN_NAMES.filter(name => !G.chains[name].isActive);
    if (availableChains.length === 0) {
      return { type: 'unplayable', reason: 'eighth-corp' };
    }
    return { type: 'found', tiles: [tileId, ...adjacentUnincorporated] };
  }
  
  // Adjacent to exactly one chain - expand
  if (adjacentChains.length === 1) {
    return { type: 'expand', chain: adjacentChains[0] };
  }
  
  // Adjacent to multiple chains - merger
  // Check if any would merge two safe chains (dead tile)
  const safeChains = adjacentChains.filter(chain => G.chains[chain].isSafe);
  if (safeChains.length >= 2) {
    return { type: 'unplayable', reason: 'dead' };
  }
  
  // Valid merger
  return { 
    type: 'merge', 
    chains: adjacentChains,
    tiles: [tileId, ...adjacentUnincorporated]
  };
}

/**
 * Check if a tile is playable
 */
export function isTilePlayable(G: AcquireGameState, tileId: TileId): boolean {
  const outcome = getTilePlacementOutcome(G, tileId);
  return outcome.type !== 'unplayable';
}

/**
 * Place a tile on the board
 */
export function placeTileOnBoard(
  board: BoardCell[][], 
  tileId: TileId, 
  chain: ChainName | null = null
): BoardCell[][] {
  const { row, col } = tileIdToCoord(tileId);
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  newBoard[row][col] = { tile: tileId, chain };
  return newBoard;
}

/**
 * Set the chain for all tiles in a list
 */
export function setTilesChain(
  board: BoardCell[][], 
  tiles: TileId[], 
  chain: ChainName
): BoardCell[][] {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  for (const tileId of tiles) {
    const { row, col } = tileIdToCoord(tileId);
    if (newBoard[row][col].tile) {
      newBoard[row][col].chain = chain;
    }
  }
  return newBoard;
}

/**
 * Get all tiles belonging to a chain
 */
export function getChainTiles(board: BoardCell[][], chain: ChainName): TileId[] {
  const tiles: TileId[] = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const cell = board[row][col];
      if (cell.chain === chain && cell.tile) {
        tiles.push(cell.tile);
      }
    }
  }
  return tiles;
}

/**
 * Remove chain assignment from tiles (for defunct chains)
 */
export function removeChainFromBoard(
  board: BoardCell[][], 
  chain: ChainName
): BoardCell[][] {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (newBoard[row][col].chain === chain) {
        newBoard[row][col].chain = null;
      }
    }
  }
  return newBoard;
}

