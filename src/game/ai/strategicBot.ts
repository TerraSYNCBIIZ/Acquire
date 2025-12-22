// ============================================================================
// ACQUIRE DIGITAL - Strategic AI Bot
// Sophisticated AI that plays like a skilled human player
// ============================================================================

import { AcquireGameState, ChainName, StockPurchase, TileId, PlayerState } from '../types';
import { 
  CHAIN_NAMES, 
  BOARD_ROWS, 
  BOARD_COLS,
  getStockPrice,
  tileIdToCoord,
  CHAIN_TIERS,
  getMajorityBonus,
  getMinorityBonus,
} from '../constants';
import { isTilePlayable } from '../logic/board';
import { GameAction } from '../reducer';

// ============================================================================
// STRATEGIC AI CONFIGURATION
// ============================================================================

export type AIStrategy = 
  | 'dominator'      // Tries to control one or two chains completely
  | 'diversifier'    // Spreads investments across many chains
  | 'opportunist'    // Looks for mergers and bonuses
  | 'accumulator'    // Hoards cash, buys at perfect moments
  | 'chaotic';       // Unpredictable, keeps opponents guessing

export interface StrategicAIConfig {
  strategy: AIStrategy;
  aggressiveness: number;   // 0-1: how much risk to take
  patience: number;         // 0-1: willingness to wait for better opportunities
  adaptability: number;     // 0-1: how much to adjust based on game state
  randomness: number;       // 0-1: unpredictability factor
  name?: string;
}

// Pre-built AI personalities
export const AI_PERSONALITIES: Record<string, StrategicAIConfig> = {
  'Warren Buffett': {
    strategy: 'accumulator',
    aggressiveness: 0.3,
    patience: 0.9,
    adaptability: 0.7,
    randomness: 0.1,
  },
  'George Soros': {
    strategy: 'opportunist',
    aggressiveness: 0.8,
    patience: 0.4,
    adaptability: 0.9,
    randomness: 0.3,
  },
  'Ray Dalio': {
    strategy: 'diversifier',
    aggressiveness: 0.5,
    patience: 0.7,
    adaptability: 0.8,
    randomness: 0.2,
  },
  'Carl Icahn': {
    strategy: 'dominator',
    aggressiveness: 0.9,
    patience: 0.3,
    adaptability: 0.6,
    randomness: 0.2,
  },
  'Peter Lynch': {
    strategy: 'opportunist',
    aggressiveness: 0.6,
    patience: 0.6,
    adaptability: 0.7,
    randomness: 0.25,
  },
  'Wildcard': {
    strategy: 'chaotic',
    aggressiveness: 0.5,
    patience: 0.5,
    adaptability: 0.5,
    randomness: 0.7,
  },
};

// ============================================================================
// GAME STATE ANALYSIS
// ============================================================================

interface GameAnalysis {
  // Board state
  activeChains: ChainName[];
  chainSizes: Record<ChainName, number>;
  safeChains: ChainName[];
  growingChains: ChainName[];
  vulnerableChains: ChainName[]; // Near merger size
  
  // Player position
  ourStockValue: number;
  ourMajorities: ChainName[];
  ourMinorities: ChainName[];
  potentialBonuses: { chain: ChainName; bonus: number; position: 'majority' | 'minority' }[];
  
  // Opponent analysis
  opponents: { id: string; netWorth: number; strategy: string; threat: number }[];
  stockCompetition: Record<ChainName, { leader: string; shares: number; ourShares: number }>;
  
  // Game phase
  gameProgress: number; // 0-1 how far through the game
  tilesRemaining: number;
  averageChainSize: number;
  
  // Opportunities
  mergerOpportunities: { tile: TileId; chains: ChainName[]; profit: number }[];
  foundingOpportunities: TileId[];
  expansionOpportunities: { tile: TileId; chain: ChainName; growth: number }[];
}

function analyzeGameState(state: AcquireGameState, playerId: string): GameAnalysis {
  const player = state.players[playerId];
  
  // Active chains analysis
  const activeChains = CHAIN_NAMES.filter(c => state.chains[c].isActive);
  const chainSizes: Record<ChainName, number> = {} as Record<ChainName, number>;
  const safeChains: ChainName[] = [];
  const growingChains: ChainName[] = [];
  const vulnerableChains: ChainName[] = [];
  
  for (const chain of CHAIN_NAMES) {
    chainSizes[chain] = state.chains[chain].tiles.length;
    if (state.chains[chain].isSafe) safeChains.push(chain);
    if (chainSizes[chain] >= 6 && chainSizes[chain] < 11) growingChains.push(chain);
    if (chainSizes[chain] >= 2 && chainSizes[chain] <= 5) vulnerableChains.push(chain);
  }
  
  // Calculate our stock value
  let ourStockValue = player.cash;
  const ourMajorities: ChainName[] = [];
  const ourMinorities: ChainName[] = [];
  const potentialBonuses: { chain: ChainName; bonus: number; position: 'majority' | 'minority' }[] = [];
  
  for (const chain of activeChains) {
    const size = chainSizes[chain];
    const price = getStockPrice(chain, size);
    ourStockValue += player.stocks[chain] * price;
    
    // Check our position in each chain
    const allHoldings = Object.entries(state.players)
      .map(([id, p]) => ({ id, shares: p.stocks[chain] }))
      .sort((a, b) => b.shares - a.shares);
    
    const ourRank = allHoldings.findIndex(h => h.id === playerId);
    if (ourRank === 0 && player.stocks[chain] > 0) {
      ourMajorities.push(chain);
      const majorityBonus = getMajorityBonus(chain, size);
      potentialBonuses.push({ chain, bonus: majorityBonus, position: 'majority' });
    } else if (ourRank === 1 && player.stocks[chain] > 0) {
      ourMinorities.push(chain);
      const minorityBonus = getMinorityBonus(chain, size);
      potentialBonuses.push({ chain, bonus: minorityBonus, position: 'minority' });
    }
  }
  
  // Opponent analysis
  const opponents = Object.entries(state.players)
    .filter(([id]) => id !== playerId)
    .map(([id, p]) => {
      let netWorth = p.cash;
      for (const chain of activeChains) {
        const size = chainSizes[chain];
        const price = getStockPrice(chain, size);
        netWorth += p.stocks[chain] * price;
      }
      
      // Guess opponent strategy based on their behavior
      const totalStocks = CHAIN_NAMES.reduce((sum, c) => sum + p.stocks[c], 0);
      const uniqueChains = CHAIN_NAMES.filter(c => p.stocks[c] > 0).length;
      const concentration = totalStocks > 0 ? 
        Math.max(...CHAIN_NAMES.map(c => p.stocks[c])) / totalStocks : 0;
      
      let strategy = 'unknown';
      if (concentration > 0.6) strategy = 'dominator';
      else if (uniqueChains >= 4) strategy = 'diversifier';
      else if (p.cash > 5000) strategy = 'accumulator';
      else strategy = 'opportunist';
      
      // Calculate threat level
      const threat = netWorth / ourStockValue;
      
      return { id, netWorth, strategy, threat };
    })
    .sort((a, b) => b.netWorth - a.netWorth);
  
  // Stock competition per chain
  const stockCompetition: Record<ChainName, { leader: string; shares: number; ourShares: number }> = 
    {} as Record<ChainName, { leader: string; shares: number; ourShares: number }>;
  
  for (const chain of CHAIN_NAMES) {
    const allHoldings = Object.entries(state.players)
      .map(([id, p]) => ({ id, shares: p.stocks[chain] }))
      .sort((a, b) => b.shares - a.shares);
    
    stockCompetition[chain] = {
      leader: allHoldings[0]?.id || '',
      shares: allHoldings[0]?.shares || 0,
      ourShares: player.stocks[chain],
    };
  }
  
  // Game progress
  const tilesRemaining = state.tilePool.length;
  const totalTiles = 108;
  const placedTiles = BOARD_ROWS * BOARD_COLS - 
    state.board.flat().filter(c => c.tile === null).length;
  const gameProgress = placedTiles / (totalTiles * 0.7); // Game usually ends around 70% tiles
  
  const averageChainSize = activeChains.length > 0 ?
    activeChains.reduce((sum, c) => sum + chainSizes[c], 0) / activeChains.length : 0;
  
  // Find opportunities
  const mergerOpportunities: { tile: TileId; chains: ChainName[]; profit: number }[] = [];
  const foundingOpportunities: TileId[] = [];
  const expansionOpportunities: { tile: TileId; chain: ChainName; growth: number }[] = [];
  
  for (const tile of player.tiles) {
    if (!isTilePlayable(state, tile)) continue;
    
    const { row, col } = tileIdToCoord(tile);
    const adjacentChains = new Set<ChainName>();
    let adjacentTiles = 0;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
        const cell = state.board[nr][nc];
        if (cell.chain) adjacentChains.add(cell.chain);
        if (cell.tile) adjacentTiles++;
      }
    }
    
    if (adjacentChains.size > 1) {
      // Merger opportunity
      const chains = Array.from(adjacentChains);
      let profit = 0;
      for (const chain of chains) {
        // Estimate profit from this merger
        const size = chainSizes[chain];
        const majority = getMajorityBonus(chain, size);
        const minority = getMinorityBonus(chain, size);
        const ourPosition = stockCompetition[chain].leader === playerId ? 
          majority : (stockCompetition[chain].ourShares > 0 ? minority / 2 : 0);
        profit += ourPosition;
      }
      mergerOpportunities.push({ tile, chains, profit });
    } else if (adjacentChains.size === 1) {
      // Expansion opportunity
      const chain = Array.from(adjacentChains)[0];
      const growth = player.stocks[chain]; // Value of expansion
      expansionOpportunities.push({ tile, chain, growth });
    } else if (adjacentTiles > 0) {
      // Founding opportunity
      foundingOpportunities.push(tile);
    }
  }
  
  return {
    activeChains,
    chainSizes,
    safeChains,
    growingChains,
    vulnerableChains,
    ourStockValue,
    ourMajorities,
    ourMinorities,
    potentialBonuses,
    opponents,
    stockCompetition,
    gameProgress,
    tilesRemaining,
    averageChainSize,
    mergerOpportunities,
    foundingOpportunities,
    expansionOpportunities,
  };
}

// ============================================================================
// WEIGHTED RANDOM SELECTION
// ============================================================================

interface WeightedOption<T> {
  option: T;
  weight: number;
  reason: string;
}

function weightedRandomSelect<T>(options: WeightedOption<T>[], randomness: number): T | null {
  if (options.length === 0) return null;
  
  // Sort by weight descending
  const sorted = [...options].sort((a, b) => b.weight - a.weight);
  
  // Apply randomness: higher randomness = more uniform distribution
  const adjustedWeights = sorted.map((opt, i) => {
    const baseWeight = opt.weight;
    const uniformWeight = 1 / sorted.length;
    // Blend between pure weight and uniform based on randomness
    return baseWeight * (1 - randomness) + uniformWeight * randomness * 100;
  });
  
  const totalWeight = adjustedWeights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return sorted[0].option;
  
  const random = Math.random() * totalWeight;
  let cumulative = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    cumulative += adjustedWeights[i];
    if (random <= cumulative) {
      console.log(`[AI] Selected: ${sorted[i].reason} (weight: ${sorted[i].weight.toFixed(1)})`);
      return sorted[i].option;
    }
  }
  
  return sorted[0].option;
}

// ============================================================================
// STRATEGIC TILE PLACEMENT
// ============================================================================

function chooseStrategicTile(
  state: AcquireGameState,
  playerId: string,
  config: StrategicAIConfig,
  analysis: GameAnalysis
): GameAction | null {
  const player = state.players[playerId];
  const playableTiles = player.tiles.filter(t => isTilePlayable(state, t));
  
  if (playableTiles.length === 0) return null;
  
  const options: WeightedOption<TileId>[] = [];
  
  for (const tile of playableTiles) {
    let weight = 10; // Base weight
    let reason = 'neutral placement';
    
    const { row, col } = tileIdToCoord(tile);
    const adjacentChains = new Set<ChainName>();
    let adjacentTiles = 0;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
        const cell = state.board[nr][nc];
        if (cell.chain) adjacentChains.add(cell.chain);
        if (cell.tile) adjacentTiles++;
      }
    }
    
    // MERGER PREVENTION: Check if this tile triggers a merger that benefits opponents
    if (adjacentChains.size > 1) {
      const chains = Array.from(adjacentChains);
      let ourMergerValue = 0;
      let opponentMergerValue = 0;
      
      for (const chain of chains) {
        const size = analysis.chainSizes[chain];
        const majorityBonus = getMajorityBonus(chain, size);
        const minorityBonus = getMinorityBonus(chain, size);
        
        // Calculate who gets bonuses
        const competition = analysis.stockCompetition[chain];
        if (competition.leader === playerId && competition.ourShares > 0) {
          ourMergerValue += majorityBonus;
        } else if (competition.ourShares > 0) {
          // We might get minority
          ourMergerValue += minorityBonus * 0.5; // Discount for uncertainty
        }
        
        // Estimate opponent gains
        if (competition.leader !== playerId && competition.shares > 0) {
          opponentMergerValue += majorityBonus;
        }
      }
      
      // Penalize mergers that benefit opponents significantly more than us
      if (opponentMergerValue > ourMergerValue * 1.5) {
        weight -= 20 * (1 - config.aggressiveness); // Less penalty for aggressive strategies
        reason = `avoiding merger that benefits opponents ($${opponentMergerValue} vs our $${ourMergerValue})`;
      } else if (ourMergerValue > opponentMergerValue) {
        weight += 15; // Bonus for favorable merger
        reason = `favorable merger ($${ourMergerValue} vs opponent $${opponentMergerValue})`;
      }
    }
    
    // Strategy-specific evaluation
    switch (config.strategy) {
      case 'dominator': {
        // Prefer expanding chains we dominate
        if (adjacentChains.size === 1) {
          const chain = Array.from(adjacentChains)[0];
          if (analysis.ourMajorities.includes(chain)) {
            weight = 50 + player.stocks[chain] * 5;
            reason = `expanding dominated chain ${chain}`;
          } else if (player.stocks[chain] > 0) {
            weight = 25 + player.stocks[chain] * 3;
            reason = `expanding partial stake in ${chain}`;
          }
        }
        // Love founding new chains to dominate
        if (adjacentTiles > 0 && adjacentChains.size === 0) {
          weight = 40 * config.aggressiveness;
          reason = 'founding new chain to dominate';
        }
        // STOCK HOARDING INCENTIVE: Expand chains we're buying into
        if (adjacentChains.size === 1) {
          const chain = Array.from(adjacentChains)[0];
          if (analysis.ourMajorities.includes(chain) && analysis.chainSizes[chain] < 11) {
            weight += 15; // Extra bonus for growing chain toward safety
            reason += ' (growing toward safety)';
          }
        }
        break;
      }
      
      case 'diversifier': {
        // Prefer expanding different chains
        if (adjacentChains.size === 1) {
          const chain = Array.from(adjacentChains)[0];
          const chainsWeOwn = CHAIN_NAMES.filter(c => player.stocks[c] > 0).length;
          if (player.stocks[chain] > 0) {
            weight = 30 - chainsWeOwn * 2; // Less value if we already own many
            reason = `expanding ${chain} (diversified)`;
          }
        }
        // Really love founding to diversify
        if (adjacentTiles > 0 && adjacentChains.size === 0) {
          weight = 45;
          reason = 'founding to diversify portfolio';
        }
        break;
      }
      
      case 'opportunist': {
        // Love mergers but be smart about them!
        if (adjacentChains.size > 1) {
          const chains = Array.from(adjacentChains);
          const merger = analysis.mergerOpportunities.find(m => m.tile === tile);
          if (merger && merger.profit > 0) {
            weight = 60 + merger.profit / 100;
            reason = `triggering merger ${chains.join(' + ')} for profit`;
          } else if (merger) {
            weight = 20; // Still consider it but lower priority
            reason = 'merger with low profit';
          }
        }
        // Also like expansion
        if (adjacentChains.size === 1) {
          const chain = Array.from(adjacentChains)[0];
          weight = 25 + player.stocks[chain] * 2;
          reason = `expanding ${chain}`;
        }
        break;
      }
      
      case 'accumulator': {
        // Conservative - prefer safe expansions
        if (adjacentChains.size === 1) {
          const chain = Array.from(adjacentChains)[0];
          const isSafe = analysis.safeChains.includes(chain);
          if (isSafe && player.stocks[chain] > 0) {
            weight = 40 + player.stocks[chain] * 3;
            reason = `safely expanding ${chain}`;
          } else if (player.stocks[chain] > 0) {
            weight = 25;
            reason = `expanding ${chain}`;
          }
        }
        // Strongly avoid risky mergers
        if (adjacentChains.size > 1) {
          const merger = analysis.mergerOpportunities.find(m => m.tile === tile);
          weight = merger && merger.profit > 2000 ? 25 : 3; // Even more conservative
          reason = 'cautious merger';
        }
        break;
      }
      
      case 'chaotic': {
        // Unpredictable - random but avoid truly bad moves
        weight = 20 + Math.random() * 30;
        if (adjacentChains.size > 1) {
          weight += 20; // Chaos loves mergers
          reason = 'chaotic merger!';
        } else if (adjacentTiles > 0) {
          weight += 15;
          reason = 'chaotic founding';
        } else {
          reason = 'chaotic placement';
        }
        break;
      }
    }
    
    // Game phase adjustments
    if (analysis.gameProgress > 0.7) {
      // Late game - prioritize cashing out mergers we win
      const merger = analysis.mergerOpportunities.find(m => m.tile === tile);
      if (merger && merger.profit > 0) {
        weight *= 1.5;
        reason += ' (late game cash-out)';
      }
    }
    
    // Early game: prioritize chain founding and building positions
    if (analysis.gameProgress < 0.3 && adjacentTiles > 0 && adjacentChains.size === 0) {
      weight += 10;
      reason += ' (early game founding bonus)';
    }
    
    options.push({ option: tile, weight: Math.max(1, weight), reason });
  }
  
  const selectedTile = weightedRandomSelect(options, config.randomness);
  if (!selectedTile) return null;
  
  return { type: 'PLACE_TILE', playerId, tileId: selectedTile };
}

// ============================================================================
// STRATEGIC CHAIN FOUNDING
// ============================================================================

function chooseStrategicChain(
  state: AcquireGameState,
  playerId: string,
  config: StrategicAIConfig,
  analysis: GameAnalysis
): GameAction | null {
  const availableChains = CHAIN_NAMES.filter(c => !state.chains[c].isActive);
  if (availableChains.length === 0) return null;
  
  const options: WeightedOption<ChainName>[] = [];
  
  for (const chain of availableChains) {
    let weight = 10;
    let reason = `founding ${chain}`;
    
    const tier = CHAIN_TIERS[chain];
    
    switch (config.strategy) {
      case 'dominator': {
        // Prefer chains we can dominate - mid-tier for balance
        if (tier === 2) weight = 40;
        else if (tier === 1) weight = 30;
        else weight = 25;
        reason = `founding ${chain} to dominate (tier ${tier})`;
        break;
      }
      
      case 'diversifier': {
        // Prefer variety - pick a tier we don't have yet
        const ourTiers = analysis.ourMajorities.map(c => CHAIN_TIERS[c]);
        if (!ourTiers.includes(tier)) {
          weight = 35;
          reason = `founding ${chain} for tier diversity`;
        } else {
          weight = 20;
        }
        break;
      }
      
      case 'opportunist': {
        // Prefer expensive chains for bigger bonuses
        if (tier === 3) weight = 40;
        else if (tier === 2) weight = 30;
        else weight = 20;
        reason = `founding ${chain} (tier ${tier} for bigger payoffs)`;
        break;
      }
      
      case 'accumulator': {
        // Prefer cheap chains - lower stock cost
        if (tier === 1) weight = 45;
        else if (tier === 2) weight = 25;
        else weight = 15;
        reason = `founding ${chain} (tier ${tier} - cheap stocks)`;
        break;
      }
      
      case 'chaotic': {
        weight = 15 + Math.random() * 30;
        reason = `chaotically founding ${chain}`;
        break;
      }
    }
    
    options.push({ option: chain, weight, reason });
  }
  
  const selectedChain = weightedRandomSelect(options, config.randomness);
  if (!selectedChain) return null;
  
  return { type: 'SELECT_CHAIN_TO_FOUND', playerId, chain: selectedChain };
}

// ============================================================================
// STRATEGIC STOCK BUYING
// ============================================================================

function chooseStrategicStocks(
  state: AcquireGameState,
  playerId: string,
  config: StrategicAIConfig,
  analysis: GameAnalysis
): GameAction | null {
  const player = state.players[playerId];
  const { activeChains, chainSizes, stockCompetition, gameProgress } = analysis;
  
  if (activeChains.length === 0) {
    return { type: 'SKIP_BUY_STOCKS', playerId };
  }
  
  // Calculate how much to spend based on strategy
  let spendRatio: number;
  switch (config.strategy) {
    case 'dominator': spendRatio = 0.8 * config.aggressiveness; break; // More aggressive
    case 'diversifier': spendRatio = 0.5; break;
    case 'opportunist': spendRatio = 0.7; break; // More aggressive
    case 'accumulator': spendRatio = 0.3 * (1 - config.patience) + 0.1; break;
    case 'chaotic': spendRatio = 0.2 + Math.random() * 0.5; break;
    default: spendRatio = 0.5;
  }
  
  // Late game: spend more aggressively
  if (gameProgress > 0.7) {
    spendRatio = Math.min(0.95, spendRatio * 1.5);
  }
  
  // STOCK HOARDING: If we have majority in any chain, aggressively buy to cement position
  const majorityChains = analysis.ourMajorities;
  if (majorityChains.length > 0) {
    spendRatio = Math.max(spendRatio, 0.7); // Always spend at least 70% when protecting lead
  }
  
  const budget = player.cash * spendRatio;
  
  // Evaluate each chain for purchase
  const chainOptions: WeightedOption<{ chain: ChainName; maxBuy: number }>[] = [];
  
  for (const chain of activeChains) {
    const size = chainSizes[chain];
    const price = getStockPrice(chain, size);
    const available = state.stockMarket[chain];
    
    if (price > budget || available === 0) continue;
    
    const maxBuy = Math.min(3, available, Math.floor(budget / price));
    if (maxBuy === 0) continue;
    
    let weight = 10;
    let reason = `buying ${chain}`;
    
    const competition = stockCompetition[chain];
    const sharesNeededForMajority = competition.leader === playerId ? 
      0 : competition.shares - competition.ourShares + 1;
    const canTakeMajority = maxBuy >= sharesNeededForMajority && sharesNeededForMajority > 0;
    
    // STOCK HOARDING: Calculate how close opponent is to taking our majority
    const opponentCloseToMajority = analysis.ourMajorities.includes(chain) && 
      competition.shares >= competition.ourShares - 2;
    
    switch (config.strategy) {
      case 'dominator': {
        // Focus on chains we can dominate
        if (analysis.ourMajorities.includes(chain)) {
          weight = 50 + player.stocks[chain] * 3; // Strengthen position
          reason = `strengthening majority in ${chain}`;
          
          // HOARDING: If opponent is close, buy aggressively to maintain lead
          if (opponentCloseToMajority) {
            weight += 30;
            reason = `HOARDING to protect majority in ${chain}!`;
          }
        } else if (canTakeMajority) {
          weight = 70; // Higher priority for taking majority
          reason = `taking majority in ${chain}!`;
        } else if (player.stocks[chain] > 0) {
          weight = 25;
          reason = `building position in ${chain}`;
        }
        break;
      }
      
      case 'diversifier': {
        // Prefer chains we don't own yet
        if (player.stocks[chain] === 0) {
          weight = 45;
          reason = `diversifying into ${chain}`;
        } else if (player.stocks[chain] < 3) {
          weight = 25;
          reason = `small position in ${chain}`;
        } else {
          weight = 10;
        }
        break;
      }
      
      case 'opportunist': {
        // Focus on chains likely to merge (vulnerable + valuable)
        if (analysis.vulnerableChains.includes(chain)) {
          const bonusValue = analysis.potentialBonuses
            .find(b => b.chain === chain)?.bonus || 0;
          weight = 40 + bonusValue / 100;
          reason = `merger target ${chain}`;
        } else if (canTakeMajority) {
          weight = 55;
          reason = `opportunistic majority in ${chain}`;
        }
        // HOARDING: Protect positions that will pay out
        if (analysis.ourMajorities.includes(chain) && opponentCloseToMajority) {
          weight += 25;
          reason = `protecting bonus in ${chain}`;
        }
        break;
      }
      
      case 'accumulator': {
        // Buy cheap, growing chains
        if (price <= 400 && analysis.growingChains.includes(chain)) {
          weight = 40;
          reason = `value buy: cheap & growing ${chain}`;
        } else if (analysis.safeChains.includes(chain) && player.stocks[chain] > 0) {
          weight = 35;
          reason = `safe hold: ${chain}`;
        } else if (price <= 300) {
          weight = 25;
          reason = `cheap ${chain}`;
        }
        // Even accumulators protect their positions
        if (analysis.ourMajorities.includes(chain) && opponentCloseToMajority) {
          weight += 15;
          reason = `protecting value in ${chain}`;
        }
        break;
      }
      
      case 'chaotic': {
        weight = 15 + Math.random() * 35;
        reason = `chaotic buy: ${chain}`;
        break;
      }
    }
    
    // Growth potential bonus
    if (size < 6) weight += (6 - size) * 2;
    
    chainOptions.push({ option: { chain, maxBuy }, weight, reason });
  }
  
  if (chainOptions.length === 0) {
    // Maybe skip based on patience
    if (Math.random() < config.patience) {
      console.log('[AI] Patiently skipping stock purchase');
      return { type: 'SKIP_BUY_STOCKS', playerId };
    }
  }
  
  // Select chains to buy
  const purchases: StockPurchase[] = [];
  let totalSpent = 0;
  let totalBought = 0;
  const remainingOptions = [...chainOptions];
  
  while (totalBought < 3 && remainingOptions.length > 0) {
    const selected = weightedRandomSelect(remainingOptions, config.randomness);
    if (!selected) break;
    
    const { chain, maxBuy } = selected;
    const price = getStockPrice(chain, chainSizes[chain]);
    const canBuy = Math.min(
      maxBuy,
      3 - totalBought,
      Math.floor((budget - totalSpent) / price)
    );
    
    if (canBuy > 0) {
      purchases.push({ chain, count: canBuy });
      totalSpent += canBuy * price;
      totalBought += canBuy;
    }
    
    // Remove from options
    const idx = remainingOptions.findIndex(o => o.option.chain === chain);
    if (idx !== -1) remainingOptions.splice(idx, 1);
  }
  
  if (purchases.length > 0) {
    console.log(`[AI] Buying: ${purchases.map(p => `${p.count}x ${p.chain}`).join(', ')}`);
    return { type: 'BUY_STOCKS', playerId, purchases };
  }
  
  return { type: 'SKIP_BUY_STOCKS', playerId };
}

// ============================================================================
// STRATEGIC MERGER HANDLING
// ============================================================================

function handleStrategicMerger(
  state: AcquireGameState,
  playerId: string,
  config: StrategicAIConfig,
  analysis: GameAnalysis
): GameAction | null {
  if (!state.mergerState) return null;
  
  const player = state.players[playerId];
  
  // Choose survivor
  if (state.mergerState.survivorChain === null) {
    const chains = state.mergerState.defunctChains;
    
    const options: WeightedOption<ChainName>[] = chains.map(chain => {
      const ourShares = player.stocks[chain];
      const size = analysis.chainSizes[chain];
      const isMajority = analysis.ourMajorities.includes(chain);
      
      let weight = ourShares * 10;
      let reason = `${chain}: ${ourShares} shares`;
      
      if (isMajority) {
        weight += 30;
        reason += ' (we have majority!)';
      }
      
      // Prefer larger chains
      weight += size * 2;
      
      return { option: chain, weight, reason };
    });
    
    const selectedChain = weightedRandomSelect(options, config.randomness);
    if (!selectedChain) return null;
    
    console.log(`[AI] Choosing survivor: ${selectedChain}`);
    return { type: 'CHOOSE_MERGER_SURVIVOR', playerId, chain: selectedChain };
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
  
  // Strategy-based decisions
  const survivorIsMajority = analysis.stockCompetition[survivorChain]?.leader === playerId;
  
  switch (config.strategy) {
    case 'dominator': {
      // Trade to strengthen survivor position
      if (survivorIsMajority) {
        trade = maxTrade;
        sell = holdings - trade * 2;
      } else {
        // Trade to try to take majority
        trade = Math.min(maxTrade, Math.ceil((analysis.stockCompetition[survivorChain]?.shares || 0) / 2));
        sell = holdings - trade * 2;
      }
      break;
    }
    
    case 'diversifier': {
      // Sell most for cash to reinvest
      trade = Math.floor(maxTrade / 2);
      sell = holdings - trade * 2;
      break;
    }
    
    case 'opportunist': {
      // Trade everything - survivor will be big
      trade = maxTrade;
      sell = holdings - trade * 2;
      break;
    }
    
    case 'accumulator': {
      // Cash is king
      trade = Math.floor(maxTrade / 3);
      sell = holdings - trade * 2;
      break;
    }
    
    case 'chaotic': {
      const r = Math.random();
      if (r < 0.33) {
        trade = maxTrade;
        sell = holdings - trade * 2;
      } else if (r < 0.66) {
        sell = holdings;
      } else {
        hold = Math.min(holdings, 3);
        sell = holdings - hold;
      }
      break;
    }
  }
  
  // Ensure valid values
  hold = Math.max(0, holdings - sell - trade * 2);
  
  console.log(`[AI] Defunct stock (${defunctChain}): hold=${hold}, sell=${sell}, trade=${trade * 2}→${trade}`);
  return { type: 'HANDLE_DEFUNCT_STOCK', playerId, hold, sell, trade };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

export function getStrategicAIAction(
  state: AcquireGameState,
  playerId: string,
  config: StrategicAIConfig
): GameAction | null {
  // Analyze current game state
  const analysis = analyzeGameState(state, playerId);
  
  console.log(`[AI:${config.name || playerId}] Strategy: ${config.strategy}, Progress: ${(analysis.gameProgress * 100).toFixed(0)}%`);
  
  switch (state.currentPhase) {
    case 'playTile':
      return chooseStrategicTile(state, playerId, config, analysis);
      
    case 'foundChain':
      return chooseStrategicChain(state, playerId, config, analysis);
      
    case 'buyStocks':
      return chooseStrategicStocks(state, playerId, config, analysis);
      
    case 'resolveMerger':
      return handleStrategicMerger(state, playerId, config, analysis);
      
    default:
      return null;
  }
}

// Export for use
export { getStrategicAIAction as getAIAction };

