// ============================================================================
// ACQUIRE DIGITAL - AI Bot Engine
// ============================================================================

import { AcquireGameState, ChainName, TileId, StockPurchase } from '../types';
import { 
  CHAIN_NAMES, 
  getStockPrice, 
  tileIdToCoord,
  getAdjacentTileIds,
} from '../constants';
import { getTilePlacementOutcome, isTilePlayable } from '../logic/board';

// ============================================================================
// AI PERSONALITY TYPES
// ============================================================================

export type AIPersonality = 'aggressive' | 'conservative' | 'balanced';

export interface AIConfig {
  personality: AIPersonality;
  thinkingDelay: number; // milliseconds
}

// ============================================================================
// TILE PLACEMENT AI
// ============================================================================

interface TileScore {
  tileId: TileId;
  score: number;
  reason: string;
}

/**
 * Evaluate and rank playable tiles for the AI
 */
export function evaluateTiles(G: AcquireGameState, playerId: string): TileScore[] {
  const player = G.players[playerId];
  const scores: TileScore[] = [];
  
  for (const tileId of player.tiles) {
    if (!isTilePlayable(G, tileId)) {
      continue;
    }
    
    const outcome = getTilePlacementOutcome(G, tileId);
    let score = 0;
    let reason = '';
    
    switch (outcome.type) {
      case 'nothing':
        // Neutral - just places a tile
        score = 10;
        reason = 'Places standalone tile';
        break;
        
      case 'found':
        // Founding is great - we get free stock
        score = 80;
        reason = 'Founds new chain (free stock)';
        break;
        
      case 'expand':
        // Expanding chains we own is good
        const ownedStock = player.stocks[outcome.chain];
        if (ownedStock > 0) {
          score = 50 + ownedStock * 5;
          reason = `Expands ${outcome.chain} (own ${ownedStock} shares)`;
        } else {
          score = 20;
          reason = `Expands ${outcome.chain} (no shares)`;
        }
        break;
        
      case 'merge':
        // Mergers are complex - evaluate based on our holdings
        const ourBonusPotential = evaluateMergerBenefit(G, playerId, outcome.chains);
        score = 40 + ourBonusPotential;
        reason = `Triggers merger (potential: ${ourBonusPotential})`;
        break;
    }
    
    scores.push({ tileId, score, reason });
  }
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

/**
 * Evaluate how beneficial a merger would be for this player
 */
function evaluateMergerBenefit(
  G: AcquireGameState, 
  playerId: string, 
  chains: ChainName[]
): number {
  const player = G.players[playerId];
  let benefit = 0;
  
  // Find which chains would be defunct
  const sortedChains = [...chains].sort((a, b) => 
    G.chains[b].tiles.length - G.chains[a].tiles.length
  );
  
  const survivor = sortedChains[0];
  const defunct = sortedChains.slice(1);
  
  for (const chain of defunct) {
    const ourShares = player.stocks[chain];
    const chainSize = G.chains[chain].tiles.length;
    
    if (ourShares > 0) {
      // Check if we're majority/minority holder
      let rank = 1;
      for (const otherId of Object.keys(G.players)) {
        if (otherId !== playerId && G.players[otherId].stocks[chain] > ourShares) {
          rank++;
        }
      }
      
      if (rank === 1) {
        benefit += 30 + chainSize * 2; // Majority bonus
      } else if (rank === 2) {
        benefit += 15 + chainSize; // Minority bonus
      }
    }
  }
  
  // If we have shares in survivor, that's good
  if (player.stocks[survivor] > 0) {
    benefit += 10;
  }
  
  return benefit;
}

/**
 * AI chooses which tile to play
 */
export function chooseTileToPlay(G: AcquireGameState, playerId: string): TileId | null {
  const scores = evaluateTiles(G, playerId);
  
  if (scores.length === 0) {
    return null;
  }
  
  // Add some randomness - don't always pick the absolute best
  const topTiles = scores.slice(0, Math.min(3, scores.length));
  const weights = topTiles.map((_, i) => Math.pow(0.6, i)); // Prefer higher scored
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < topTiles.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return topTiles[i].tileId;
    }
  }
  
  return topTiles[0].tileId;
}

// ============================================================================
// CHAIN SELECTION AI (when founding)
// ============================================================================

/**
 * AI chooses which chain to found
 */
export function chooseChainToFound(G: AcquireGameState, playerId: string): ChainName {
  const availableChains = CHAIN_NAMES.filter(chain => !G.chains[chain].isActive);
  
  if (availableChains.length === 0) {
    throw new Error('No chains available to found');
  }
  
  // Prefer cheaper chains early game (easier to get majority)
  // Prefer expensive chains if we have more money
  const player = G.players[playerId];
  
  if (player.cash > 4000) {
    // Prefer tier 3 chains (Continental, Imperial)
    const tier3 = availableChains.filter(c => c === 'continental' || c === 'imperial');
    if (tier3.length > 0) {
      return tier3[Math.floor(Math.random() * tier3.length)];
    }
  }
  
  if (player.cash > 2500) {
    // Prefer tier 2 chains
    const tier2 = availableChains.filter(
      c => c === 'american' || c === 'worldwide' || c === 'festival'
    );
    if (tier2.length > 0) {
      return tier2[Math.floor(Math.random() * tier2.length)];
    }
  }
  
  // Otherwise prefer tier 1 (cheapest)
  const tier1 = availableChains.filter(c => c === 'tower' || c === 'luxor');
  if (tier1.length > 0) {
    return tier1[Math.floor(Math.random() * tier1.length)];
  }
  
  // Fallback to random available
  return availableChains[Math.floor(Math.random() * availableChains.length)];
}

// ============================================================================
// STOCK PURCHASE AI
// ============================================================================

interface StockEvaluation {
  chain: ChainName;
  score: number;
  maxBuy: number;
  price: number;
}

/**
 * AI decides which stocks to buy
 */
export function chooseStocksToBuy(
  G: AcquireGameState, 
  playerId: string,
  personality: AIPersonality = 'balanced'
): StockPurchase[] {
  const player = G.players[playerId];
  const activeChains = CHAIN_NAMES.filter(chain => G.chains[chain].isActive);
  
  if (activeChains.length === 0) {
    return [];
  }
  
  // Evaluate each chain
  const evaluations: StockEvaluation[] = [];
  
  for (const chain of activeChains) {
    const chainSize = G.chains[chain].tiles.length;
    const price = getStockPrice(chain, chainSize);
    const available = G.stockMarket[chain];
    const owned = player.stocks[chain];
    
    if (available === 0) continue;
    
    let score = 0;
    
    // Factor 1: How many shares do we already own?
    // Buying more in chains we already own helps secure majority
    score += owned * 10;
    
    // Factor 2: Chain size (larger chains are more stable)
    score += chainSize * 3;
    
    // Factor 3: Is chain safe? (safer = less merger risk)
    if (G.chains[chain].isSafe) {
      score += 20;
    }
    
    // Factor 4: Price efficiency (cheaper is better early game)
    score += Math.max(0, (1200 - price) / 50);
    
    // Factor 5: Majority position
    const maxOtherOwned = Math.max(
      ...Object.values(G.players)
        .filter(p => p.id !== playerId)
        .map(p => p.stocks[chain])
    );
    
    if (owned >= maxOtherOwned) {
      score += 25; // We're in the lead
    } else if (owned + 3 >= maxOtherOwned) {
      score += 40; // We could catch up
    }
    
    // Personality adjustments
    if (personality === 'aggressive') {
      // Prefer chains with potential for growth
      if (chainSize < 6) score += 15;
    } else if (personality === 'conservative') {
      // Prefer safe chains
      if (G.chains[chain].isSafe) score += 30;
    }
    
    const maxBuy = Math.min(3, available, Math.floor(player.cash / price));
    
    if (maxBuy > 0) {
      evaluations.push({ chain, score, maxBuy, price });
    }
  }
  
  // Sort by score
  evaluations.sort((a, b) => b.score - a.score);
  
  if (evaluations.length === 0) {
    return [];
  }
  
  // Decide how many stocks to buy (personality affects this)
  let stocksToBuy = 3;
  
  if (personality === 'conservative' && player.cash < 3000) {
    stocksToBuy = 1;
  } else if (player.cash < 1000) {
    stocksToBuy = 1;
  }
  
  // Build purchase list
  const purchases: StockPurchase[] = [];
  let remaining = stocksToBuy;
  let cashRemaining = player.cash;
  
  for (const evaluation of evaluations) {
    if (remaining <= 0) break;
    if (cashRemaining < evaluation.price) continue;
    
    const count = Math.min(
      remaining,
      evaluation.maxBuy,
      Math.floor(cashRemaining / evaluation.price)
    );
    
    if (count > 0) {
      purchases.push({ chain: evaluation.chain, count });
      remaining -= count;
      cashRemaining -= count * evaluation.price;
    }
  }
  
  return purchases;
}

// ============================================================================
// MERGER RESOLUTION AI
// ============================================================================

/**
 * AI decides how to handle defunct stock
 */
export function chooseMergerStockAction(
  G: AcquireGameState,
  playerId: string,
  defunctChain: ChainName,
  survivorChain: ChainName,
  personality: AIPersonality = 'balanced'
): { hold: number; sell: number; trade: number } {
  const player = G.players[playerId];
  const stockCount = player.stocks[defunctChain];
  const chainSize = G.chains[defunctChain].tiles.length;
  const stockPrice = getStockPrice(defunctChain, chainSize);
  const availableSurvivorStock = G.stockMarket[survivorChain];
  
  // Calculate max trades possible
  const maxTrades = Math.min(
    Math.floor(stockCount / 2),
    availableSurvivorStock
  );
  
  let hold = 0;
  let sell = 0;
  let trade = 0;
  
  if (personality === 'aggressive') {
    // Trade as much as possible to stay invested
    trade = maxTrades;
    const afterTrade = stockCount - (trade * 2);
    // Sell the rest
    sell = afterTrade;
  } else if (personality === 'conservative') {
    // Sell everything for guaranteed cash
    sell = stockCount;
  } else {
    // Balanced: trade some, sell some
    trade = Math.floor(maxTrades * 0.6);
    const afterTrade = stockCount - (trade * 2);
    
    // Hold a small amount if chain might come back
    if (afterTrade > 2) {
      hold = 1;
      sell = afterTrade - 1;
    } else {
      sell = afterTrade;
    }
  }
  
  // Validate (should sum to stockCount)
  const total = hold + sell + (trade * 2);
  if (total !== stockCount) {
    // Fix: sell the difference
    sell = stockCount - hold - (trade * 2);
  }
  
  return { hold, sell, trade };
}

/**
 * AI chooses merger survivor when there's a tie
 */
export function chooseMergerSurvivor(
  G: AcquireGameState,
  playerId: string,
  chains: ChainName[]
): ChainName {
  const player = G.players[playerId];
  
  // Choose the chain where we have the most shares
  let bestChain = chains[0];
  let bestScore = -1;
  
  for (const chain of chains) {
    const score = player.stocks[chain] * 10 + G.chains[chain].tiles.length;
    if (score > bestScore) {
      bestScore = score;
      bestChain = chain;
    }
  }
  
  return bestChain;
}

// ============================================================================
// AI CONTROLLER
// ============================================================================

export interface AIAction {
  type: 'placeTile' | 'selectChainToFound' | 'buyStocks' | 'skipBuyStocks' | 
        'chooseMergerSurvivor' | 'handleDefunctStock' | 'endTurn';
  args: unknown[];
}

/**
 * Determine what action the AI should take given the current game state
 */
export function getAIAction(
  G: AcquireGameState,
  playerId: string,
  config: AIConfig
): AIAction | null {
  const phase = G.currentPhase;
  
  switch (phase) {
    case 'playTile': {
      const tile = chooseTileToPlay(G, playerId);
      if (tile) {
        return { type: 'placeTile', args: [tile] };
      }
      return null;
    }
    
    case 'foundChain': {
      if (G.pendingFoundation) {
        const chain = chooseChainToFound(G, playerId);
        return { type: 'selectChainToFound', args: [chain] };
      }
      return null;
    }
    
    case 'resolveMerger': {
      if (!G.mergerState) return null;
      
      // Need to choose survivor?
      if (G.mergerState.survivorChain === null) {
        const survivor = chooseMergerSurvivor(G, playerId, G.mergerState.defunctChains);
        return { type: 'chooseMergerSurvivor', args: [survivor] };
      }
      
      // Need to handle defunct stock?
      const currentShareholderId = G.mergerState.shareholderOrder[G.mergerState.currentShareholderIndex];
      if (currentShareholderId === playerId) {
        const defunctChain = G.mergerState.defunctChains[G.mergerState.currentDefunctIndex];
        const decision = chooseMergerStockAction(
          G, 
          playerId, 
          defunctChain, 
          G.mergerState.survivorChain,
          config.personality
        );
        return { 
          type: 'handleDefunctStock', 
          args: [decision.hold, decision.sell, decision.trade] 
        };
      }
      return null;
    }
    
    case 'buyStocks': {
      const purchases = chooseStocksToBuy(G, playerId, config.personality);
      if (purchases.length > 0) {
        return { type: 'buyStocks', args: [purchases] };
      }
      return { type: 'skipBuyStocks', args: [] };
    }
    
    default:
      return null;
  }
}

