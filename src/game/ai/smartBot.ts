// ============================================================================
// ACQUIRE DIGITAL - Smart AI Bot
// Standalone AI logic for computer-controlled players
// ============================================================================

import { AcquireGameState, ChainName, StockPurchase, TileId } from '../types';
import { 
  CHAIN_NAMES, 
  BOARD_ROWS, 
  BOARD_COLS,
  getStockPrice,
  tileIdToCoord,
} from '../constants';
import { isTilePlayable } from '../logic/board';
import { GameAction } from '../reducer';

// ============================================================================
// AI PERSONALITY TYPES
// ============================================================================

export type AIPersonality = 'aggressive' | 'balanced' | 'conservative';

export interface AIConfig {
  personality: AIPersonality;
  thinkingDelay: number; // ms before AI acts
  name?: string;
}

// Default configs for each personality
export const AI_PRESETS: Record<AIPersonality, Partial<AIConfig>> = {
  aggressive: {
    thinkingDelay: 400,
  },
  balanced: {
    thinkingDelay: 600,
  },
  conservative: {
    thinkingDelay: 800,
  },
};

// ============================================================================
// MAIN AI DECISION FUNCTION
// ============================================================================

/**
 * Determine the best action for an AI player given the current game state.
 * Returns null if no action is available.
 */
export function getSmartAIAction(
  state: AcquireGameState, 
  playerId: string,
  config: AIConfig = { personality: 'balanced', thinkingDelay: 600 }
): GameAction | null {
  const player = state.players[playerId];
  if (!player) return null;
  
  switch (state.currentPhase) {
    case 'playTile':
      return chooseTileToPlay(state, playerId, config);
      
    case 'foundChain':
      return chooseChainToFound(state, playerId, config);
      
    case 'buyStocks':
      return chooseStocksToBuy(state, playerId, config);
      
    case 'resolveMerger':
      return handleMerger(state, playerId, config);
      
    default:
      return null;
  }
}

// ============================================================================
// TILE PLACEMENT STRATEGY
// ============================================================================

interface TileScore {
  tile: TileId;
  score: number;
  reason: string;
}

function chooseTileToPlay(
  state: AcquireGameState, 
  playerId: string,
  config: AIConfig
): GameAction | null {
  const player = state.players[playerId];
  const playableTiles = player.tiles.filter(t => isTilePlayable(state, t));
  
  if (playableTiles.length === 0) {
    console.log(`[AI:${playerId}] No playable tiles`);
    return null;
  }
  
  // Score each tile
  const scoredTiles: TileScore[] = playableTiles.map(tile => {
    const { row, col } = tileIdToCoord(tile);
    let score = 0;
    let reason = '';
    
    // Check adjacent cells
    const adjacentChains = new Set<ChainName>();
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let adjacentTileCount = 0;
    
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
        const cell = state.board[nr][nc];
        if (cell.chain) adjacentChains.add(cell.chain);
        if (cell.tile) adjacentTileCount++;
      }
    }
    
    // Scoring logic based on personality
    if (adjacentChains.size === 1) {
      // Expands a single chain
      const chain = Array.from(adjacentChains)[0];
      const ourStocks = player.stocks[chain];
      
      // Base score for expansion
      score = 10;
      
      // Bonus if we have stock in this chain
      if (config.personality === 'aggressive') {
        score += ourStocks * 8; // Aggressive players heavily favor their chains
      } else if (config.personality === 'balanced') {
        score += ourStocks * 5;
      } else {
        score += ourStocks * 3;
      }
      
      reason = `expands ${chain} (${ourStocks} shares)`;
      
    } else if (adjacentChains.size === 0 && adjacentTileCount > 0) {
      // Could found a new chain
      if (config.personality === 'aggressive') {
        score = 25; // Aggressive loves founding
      } else if (config.personality === 'balanced') {
        score = 20;
      } else {
        score = 15; // Conservative is cautious
      }
      reason = 'could found chain';
      
    } else if (adjacentChains.size > 1) {
      // Could trigger merger
      // Find which chain would survive (largest)
      let largestChain: ChainName | null = null;
      let largestSize = 0;
      
      for (const chain of adjacentChains) {
        const size = state.chains[chain].tiles.length;
        if (size > largestSize) {
          largestSize = size;
          largestChain = chain;
        }
      }
      
      // Score based on our position in the merger
      const ourSurvivorStock = largestChain ? player.stocks[largestChain] : 0;
      
      if (config.personality === 'aggressive') {
        score = 20 + ourSurvivorStock * 3;
      } else if (config.personality === 'balanced') {
        score = 15 + ourSurvivorStock * 2;
      } else {
        // Conservative avoids mergers unless they have a strong position
        score = ourSurvivorStock > 3 ? 15 : 5;
      }
      reason = `merger (${Array.from(adjacentChains).join(' vs ')})`;
      
    } else {
      // Isolated tile
      score = 1;
      reason = 'isolated';
    }
    
    return { tile, score, reason };
  });
  
  // Sort by score descending
  scoredTiles.sort((a, b) => b.score - a.score);
  
  const best = scoredTiles[0];
  console.log(`[AI:${playerId}] Chose tile ${best.tile} (score: ${best.score}, ${best.reason})`);
  
  return { type: 'PLACE_TILE', playerId, tileId: best.tile };
}

// ============================================================================
// CHAIN FOUNDING STRATEGY
// ============================================================================

function chooseChainToFound(
  state: AcquireGameState, 
  playerId: string,
  config: AIConfig
): GameAction | null {
  const availableChains = CHAIN_NAMES.filter(c => !state.chains[c].isActive);
  
  if (availableChains.length === 0) {
    console.log(`[AI:${playerId}] No chains available to found`);
    return null;
  }
  
  // Strategy based on personality
  let preferredChain: ChainName;
  
  if (config.personality === 'aggressive') {
    // Aggressive prefers expensive chains (higher bonuses)
    const tier2or3 = availableChains.find(c => 
      c === 'american' || c === 'worldwide' || c === 'festival' || 
      c === 'continental' || c === 'imperial'
    );
    preferredChain = tier2or3 || availableChains[0];
  } else if (config.personality === 'conservative') {
    // Conservative prefers cheap chains (lower risk)
    const tier1 = availableChains.find(c => c === 'tower' || c === 'luxor');
    preferredChain = tier1 || availableChains[0];
  } else {
    // Balanced picks somewhat randomly but prefers tier 1-2
    const preferred = availableChains.find(c => 
      c === 'tower' || c === 'luxor' || c === 'american' || c === 'worldwide'
    );
    preferredChain = preferred || availableChains[0];
  }
  
  console.log(`[AI:${playerId}] Founding ${preferredChain}`);
  return { type: 'SELECT_CHAIN_TO_FOUND', playerId, chain: preferredChain };
}

// ============================================================================
// STOCK BUYING STRATEGY
// ============================================================================

interface ChainEvaluation {
  chain: ChainName;
  score: number;
  price: number;
  reason: string;
}

function chooseStocksToBuy(
  state: AcquireGameState, 
  playerId: string,
  config: AIConfig
): GameAction | null {
  const player = state.players[playerId];
  const activeChains = CHAIN_NAMES.filter(c => state.chains[c].isActive);
  
  if (activeChains.length === 0) {
    console.log(`[AI:${playerId}] Skipping buy (no active chains)`);
    return { type: 'SKIP_BUY_STOCKS', playerId };
  }
  
  // Evaluate each chain
  const evaluations: ChainEvaluation[] = activeChains.map(chain => {
    const size = state.chains[chain].tiles.length;
    const price = getStockPrice(chain, size);
    const available = state.stockMarket[chain];
    const currentHolding = player.stocks[chain];
    
    let score = 0;
    let reason = '';
    
    // Can't afford it
    if (price > player.cash) {
      return { chain, score: -1, price, reason: 'too expensive' };
    }
    
    // No stock available
    if (available === 0) {
      return { chain, score: -1, price, reason: 'sold out' };
    }
    
    // Score factors
    
    // 1. Growth potential (smaller chains grow more)
    const growthScore = Math.max(0, 15 - size);
    
    // 2. Existing holdings (majority play)
    const holdingScore = currentHolding * 4;
    
    // 3. Price efficiency
    const priceScore = Math.max(0, (600 - price) / 30);
    
    // 4. Scarcity penalty (low stock)
    const scarcityPenalty = available < 5 ? (5 - available) * 2 : 0;
    
    // Personality adjustments
    if (config.personality === 'aggressive') {
      // Aggressive values growth and existing holdings highly
      score = growthScore * 1.5 + holdingScore * 1.5 + priceScore - scarcityPenalty;
      reason = `aggressive: growth=${growthScore}, holdings=${holdingScore}`;
    } else if (config.personality === 'conservative') {
      // Conservative values price and scarcity concerns
      score = growthScore + holdingScore + priceScore * 1.5 - scarcityPenalty * 1.5;
      reason = `conservative: price=${priceScore}, scarcity=${scarcityPenalty}`;
    } else {
      // Balanced
      score = growthScore + holdingScore + priceScore - scarcityPenalty;
      reason = `balanced`;
    }
    
    return { chain, score, price, reason };
  }).filter(e => e.score >= 0);
  
  if (evaluations.length === 0) {
    console.log(`[AI:${playerId}] Skipping buy (can't afford any)`);
    return { type: 'SKIP_BUY_STOCKS', playerId };
  }
  
  // Sort by score descending
  evaluations.sort((a, b) => b.score - a.score);
  
  // Determine spending willingness based on personality
  let maxSpendRatio: number;
  if (config.personality === 'aggressive') {
    maxSpendRatio = 0.8; // Spend up to 80% of cash
  } else if (config.personality === 'conservative') {
    maxSpendRatio = 0.4; // Only spend 40%
  } else {
    maxSpendRatio = 0.6; // Balanced spends 60%
  }
  
  const maxSpend = player.cash * maxSpendRatio;
  
  // Build purchase list
  const purchases: StockPurchase[] = [];
  let totalCost = 0;
  let totalStocks = 0;
  
  for (const { chain, price } of evaluations) {
    if (totalStocks >= 3) break;
    
    const available = state.stockMarket[chain];
    const canBuy = Math.min(
      3 - totalStocks,
      available,
      Math.floor((maxSpend - totalCost) / price)
    );
    
    if (canBuy > 0) {
      purchases.push({ chain, count: canBuy });
      totalCost += canBuy * price;
      totalStocks += canBuy;
    }
  }
  
  if (purchases.length > 0 && totalStocks > 0) {
    console.log(`[AI:${playerId}] Buying:`, purchases.map(p => `${p.count}x ${p.chain}`).join(', '));
    return { type: 'BUY_STOCKS', playerId, purchases };
  } else {
    console.log(`[AI:${playerId}] Skipping buy (below threshold)`);
    return { type: 'SKIP_BUY_STOCKS', playerId };
  }
}

// ============================================================================
// MERGER HANDLING STRATEGY
// ============================================================================

function handleMerger(
  state: AcquireGameState, 
  playerId: string,
  config: AIConfig
): GameAction | null {
  if (!state.mergerState) return null;
  
  const player = state.players[playerId];
  
  // Choose survivor
  if (state.mergerState.survivorChain === null) {
    const chains = state.mergerState.defunctChains;
    
    // Pick the chain we have most stock in
    let bestChain = chains[0];
    let bestHolding = player.stocks[bestChain];
    
    for (const chain of chains) {
      if (player.stocks[chain] > bestHolding) {
        bestHolding = player.stocks[chain];
        bestChain = chain;
      }
    }
    
    console.log(`[AI:${playerId}] Choosing survivor: ${bestChain} (${bestHolding} shares)`);
    return { type: 'CHOOSE_MERGER_SURVIVOR', playerId, chain: bestChain };
  }
  
  // Handle defunct stock
  const expectedPlayer = state.mergerState.shareholderOrder[state.mergerState.currentShareholderIndex];
  if (expectedPlayer !== playerId) return null;
  
  const defunctChain = state.mergerState.defunctChains[state.mergerState.currentDefunctIndex];
  const survivorChain = state.mergerState.survivorChain;
  const holdings = player.stocks[defunctChain];
  const maxTrade = Math.min(Math.floor(holdings / 2), state.stockMarket[survivorChain]);
  
  let hold = 0;
  let sell = 0;
  let trade = 0;
  
  if (config.personality === 'aggressive') {
    // Aggressive trades as much as possible for survivor stock
    trade = maxTrade;
    sell = holdings - (trade * 2);
    hold = 0;
  } else if (config.personality === 'conservative') {
    // Conservative sells everything for cash
    trade = 0;
    sell = holdings;
    hold = 0;
  } else {
    // Balanced trades half, sells rest
    trade = Math.floor(maxTrade / 2);
    sell = holdings - (trade * 2);
    hold = 0;
  }
  
  console.log(`[AI:${playerId}] Defunct stock: hold=${hold}, sell=${sell}, trade=${trade}`);
  return { type: 'HANDLE_DEFUNCT_STOCK', playerId, hold, sell, trade };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getSmartAIAction as getAIAction };

