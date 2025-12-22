// ============================================================================
// ACQUIRE DIGITAL - Merger Logic
// ============================================================================

import { 
  AcquireGameState, 
  ChainName, 
  MergerState,
  TileId 
} from '../types';
import { getMajorityBonus, getMinorityBonus } from '../constants';

/**
 * Determine the survivor and defunct chains in a merger
 * Returns null if mergemaker needs to choose (equal size)
 */
export function analyzeMerger(
  G: AcquireGameState,
  chains: ChainName[]
): { survivor: ChainName | null; defunct: ChainName[]; needsChoice: boolean } {
  // Sort chains by size (descending)
  const sortedChains = [...chains].sort((a, b) => {
    return G.chains[b].tiles.length - G.chains[a].tiles.length;
  });
  
  const largestSize = G.chains[sortedChains[0]].tiles.length;
  const largestChains = sortedChains.filter(
    chain => G.chains[chain].tiles.length === largestSize
  );
  
  if (largestChains.length > 1) {
    // Tie - mergemaker must choose
    return {
      survivor: null,
      defunct: [],
      needsChoice: true,
    };
  }
  
  return {
    survivor: sortedChains[0],
    defunct: sortedChains.slice(1),
    needsChoice: false,
  };
}

/**
 * Create initial merger state
 */
export function createMergerState(
  G: AcquireGameState,
  triggeringTile: TileId,
  survivor: ChainName,
  defunct: ChainName[],
  pendingTiles: TileId[]
): MergerState {
  // Sort defunct chains by size (largest first)
  const sortedDefunct = [...defunct].sort((a, b) => {
    return G.chains[b].tiles.length - G.chains[a].tiles.length;
  });
  
  return {
    triggeringTile,
    survivorChain: survivor,
    defunctChains: sortedDefunct,
    currentDefunctIndex: 0,
    shareholderOrder: [],
    currentShareholderIndex: 0,
    bonusesPaid: false,
    pendingTiles,
  };
}

/**
 * Get shareholders of a chain sorted by stock count (descending)
 */
export function getShareholderOrder(
  G: AcquireGameState,
  chain: ChainName,
  startingPlayerId: string
): string[] {
  const players = Object.keys(G.players);
  const shareholderCounts: { playerId: string; count: number }[] = [];
  
  for (const playerId of players) {
    const count = G.players[playerId].stocks[chain];
    if (count > 0) {
      shareholderCounts.push({ playerId, count });
    }
  }
  
  if (shareholderCounts.length === 0) {
    return [];
  }
  
  // Start with the mergemaker and go clockwise
  const startIndex = players.indexOf(startingPlayerId);
  const orderedPlayers: string[] = [];
  
  for (let i = 0; i < players.length; i++) {
    const idx = (startIndex + i) % players.length;
    const playerId = players[idx];
    if (G.players[playerId].stocks[chain] > 0) {
      orderedPlayers.push(playerId);
    }
  }
  
  return orderedPlayers;
}

/**
 * Calculate shareholder bonuses for a defunct chain
 */
export function calculateBonuses(
  G: AcquireGameState,
  chain: ChainName
): { playerId: string; bonus: number }[] {
  const chainSize = G.chains[chain].tiles.length;
  const majorityBonus = getMajorityBonus(chain, chainSize);
  const minorityBonus = getMinorityBonus(chain, chainSize);
  
  // Get all stockholders and their counts
  const stockholders: { playerId: string; count: number }[] = [];
  for (const playerId of Object.keys(G.players)) {
    const count = G.players[playerId].stocks[chain];
    if (count > 0) {
      stockholders.push({ playerId, count });
    }
  }
  
  if (stockholders.length === 0) {
    return [];
  }
  
  // Sort by stock count (descending)
  stockholders.sort((a, b) => b.count - a.count);
  
  const bonuses: { playerId: string; bonus: number }[] = [];
  
  // Only one stockholder - gets both bonuses
  if (stockholders.length === 1) {
    bonuses.push({
      playerId: stockholders[0].playerId,
      bonus: majorityBonus + minorityBonus,
    });
    return bonuses;
  }
  
  // Find majority holders (could be tied)
  const maxCount = stockholders[0].count;
  const majorityHolders = stockholders.filter(s => s.count === maxCount);
  
  if (majorityHolders.length > 1) {
    // Tie for majority - split majority + minority
    const totalBonus = majorityBonus + minorityBonus;
    const splitBonus = roundUpToNearest100(totalBonus / majorityHolders.length);
    
    for (const holder of majorityHolders) {
      bonuses.push({
        playerId: holder.playerId,
        bonus: splitBonus,
      });
    }
    return bonuses;
  }
  
  // Single majority holder
  bonuses.push({
    playerId: majorityHolders[0].playerId,
    bonus: majorityBonus,
  });
  
  // Find minority holders (excluding majority)
  const remainingHolders = stockholders.slice(1);
  if (remainingHolders.length === 0) {
    return bonuses;
  }
  
  const secondMaxCount = remainingHolders[0].count;
  const minorityHolders = remainingHolders.filter(s => s.count === secondMaxCount);
  
  if (minorityHolders.length > 1) {
    // Tie for minority - split minority bonus
    const splitBonus = roundUpToNearest100(minorityBonus / minorityHolders.length);
    for (const holder of minorityHolders) {
      bonuses.push({
        playerId: holder.playerId,
        bonus: splitBonus,
      });
    }
  } else {
    bonuses.push({
      playerId: minorityHolders[0].playerId,
      bonus: minorityBonus,
    });
  }
  
  return bonuses;
}

/**
 * Round up to nearest $100
 */
function roundUpToNearest100(amount: number): number {
  return Math.ceil(amount / 100) * 100;
}

/**
 * Process a player's stock decision for defunct shares
 */
export function processStockDecision(
  G: AcquireGameState,
  playerId: string,
  chain: ChainName,
  survivor: ChainName,
  hold: number,
  sell: number,
  trade: number
): AcquireGameState {
  const newG = { ...G };
  const player = { ...newG.players[playerId] };
  const currentStocks = player.stocks[chain];
  
  // Validate decision
  const tradeIn = trade * 2; // 2 defunct = 1 survivor
  const total = hold + sell + tradeIn;
  
  if (total !== currentStocks) {
    throw new Error(`Stock decision doesn't match holdings: ${total} != ${currentStocks}`);
  }
  
  // Process sell
  if (sell > 0) {
    const chainSize = G.chains[chain].tiles.length;
    const { getStockPrice } = require('../constants');
    const sellPrice = getStockPrice(chain, chainSize) * sell;
    player.cash += sellPrice;
  }
  
  // Process trade
  if (trade > 0) {
    // Check if survivor has enough stock
    const availableSurvivor = newG.stockMarket[survivor];
    if (trade > availableSurvivor) {
      throw new Error(`Not enough ${survivor} stock to trade`);
    }
    player.stocks[survivor] += trade;
    newG.stockMarket = {
      ...newG.stockMarket,
      [survivor]: newG.stockMarket[survivor] - trade,
    };
  }
  
  // Process hold - just keep the defunct stock
  player.stocks = {
    ...player.stocks,
    [chain]: hold,
  };
  
  // Return sold/traded stocks to market
  newG.stockMarket = {
    ...newG.stockMarket,
    [chain]: newG.stockMarket[chain] + sell + tradeIn,
  };
  
  newG.players = {
    ...newG.players,
    [playerId]: player,
  };
  
  return newG;
}

