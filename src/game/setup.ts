// ============================================================================
// ACQUIRE DIGITAL - Game Setup
// ============================================================================

import { AcquireGameState, ChainName, ChainState, PlayerState, TurnState } from './types';
import { 
  CHAIN_NAMES, 
  STARTING_CASH, 
  TILES_IN_HAND, 
  STOCKS_PER_CHAIN,
  generateAllTileIds,
  shuffleArray 
} from './constants';
import { createEmptyBoard } from './logic/board';

/**
 * Create initial chain state
 */
function createInitialChains(): Record<ChainName, ChainState> {
  const chains: Partial<Record<ChainName, ChainState>> = {};
  
  for (const name of CHAIN_NAMES) {
    chains[name] = {
      tiles: [],
      isActive: false,
      isSafe: false,
    };
  }
  
  return chains as Record<ChainName, ChainState>;
}

/**
 * Create initial stock market
 */
function createInitialStockMarket(): Record<ChainName, number> {
  const market: Partial<Record<ChainName, number>> = {};
  
  for (const name of CHAIN_NAMES) {
    market[name] = STOCKS_PER_CHAIN;
  }
  
  return market as Record<ChainName, number>;
}

/**
 * Create initial player state
 */
function createPlayerState(playerId: string, playerName: string, tiles: string[]): PlayerState {
  const stocks: Record<ChainName, number> = {
    tower: 0,
    luxor: 0,
    american: 0,
    worldwide: 0,
    festival: 0,
    continental: 0,
    imperial: 0,
  };
  
  return {
    id: playerId,
    name: playerName,
    cash: STARTING_CASH,
    tiles,
    stocks,
  };
}

/**
 * Create initial turn state
 */
function createTurnState(): TurnState {
  return {
    hasPlayedTile: false,
    hasBoughtStocks: false,
    stocksPurchasedThisTurn: 0,
    hasDrawnTile: false,
    hasExchangedDeadTile: false,
  };
}

/**
 * Setup function for boardgame.io
 */
export function setupGame(setupCtx: { ctx: { numPlayers: number } }): AcquireGameState {
  // boardgame.io passes ctx nested inside an object
  const numPlayers = setupCtx.ctx?.numPlayers || 4;
  
  // Generate and shuffle all tiles
  const allTiles = shuffleArray(generateAllTileIds());
  
  // Create player states and distribute tiles
  const players: Record<string, PlayerState> = {};
  let tileIndex = 0;
  
  for (let i = 0; i < numPlayers; i++) {
    const playerId = String(i);
    const playerName = `Player ${i + 1}`;
    const playerTiles = allTiles.slice(tileIndex, tileIndex + TILES_IN_HAND);
    tileIndex += TILES_IN_HAND;
    players[playerId] = createPlayerState(playerId, playerName, playerTiles);
  }
  
  // Remaining tiles go to the pool
  const tilePool = allTiles.slice(tileIndex);
  
  return {
    board: createEmptyBoard(),
    tilePool,
    players,
    chains: createInitialChains(),
    stockMarket: createInitialStockMarket(),
    currentPhase: 'playTile',
    turnState: createTurnState(),
    mergerState: null,
    pendingFoundation: null,
    config: {
      openHoldings: true,
      turnTimeLimit: null,
    },
    log: ['Game started!'],
  };
}

