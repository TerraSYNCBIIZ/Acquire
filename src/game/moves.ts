// ============================================================================
// ACQUIRE DIGITAL - Game Moves
// Clean implementation for boardgame.io 0.50+
// ============================================================================

import { AcquireGameState, ChainName, StockPurchase, TileId } from './types';
import { 
  getTilePlacementOutcome, 
  isTilePlayable, 
  placeTileOnBoard,
  setTilesChain,
  getChainTiles,
} from './logic/board';
import { 
  analyzeMerger, 
  calculateBonuses, 
  createMergerState,
  getShareholderOrder,
} from './logic/merger';
import { 
  getStockPrice, 
  MAX_STOCKS_PER_TURN,
  SAFE_CHAIN_SIZE,
  GAME_END_CHAIN_SIZE,
  CHAIN_NAMES,
} from './constants';
import { INVALID_MOVE } from 'boardgame.io/core';

// Type for move context in boardgame.io 0.50+
interface MoveContext {
  G: AcquireGameState;
  ctx: {
    numPlayers: number;
    turn: number;
    currentPlayer: string;
    playOrder: string[];
    playOrderPos: number;
    phase: string | null;
  };
  events: {
    endPhase: () => void;
    endTurn: () => void;
    setPhase: (phase: string) => void;
  };
  playerID?: string;
}

// ============================================================================
// PLACE TILE
// ============================================================================

export function placeTile({ G, ctx }: MoveContext, tileId: TileId) {
  const player = G.players[ctx.currentPlayer];
  console.log(`[MOVE] placeTile(${tileId}) by player ${ctx.currentPlayer}`);
  
  if (!player.tiles.includes(tileId)) {
    console.error(`[MOVE] INVALID: Tile ${tileId} not in hand`);
    return INVALID_MOVE;
  }
  
  if (!isTilePlayable(G, tileId)) {
    console.error(`[MOVE] INVALID: Tile ${tileId} is unplayable`);
    return INVALID_MOVE;
  }
  
  const outcome = getTilePlacementOutcome(G, tileId);
  console.log(`[MOVE] Tile outcome:`, outcome.type);
  
  // Remove tile from player's hand
  player.tiles = player.tiles.filter(t => t !== tileId);
  G.turnState.hasPlayedTile = true;
  G.log.push(`Player ${ctx.currentPlayer} placed tile ${tileId}`);
  
  switch (outcome.type) {
    case 'nothing':
      G.board = placeTileOnBoard(G.board, tileId);
      G.currentPhase = 'buyStocks';
      break;
      
    case 'expand':
      G.board = placeTileOnBoard(G.board, tileId, outcome.chain);
      G.chains[outcome.chain].tiles.push(tileId);
      G.chains[outcome.chain].isSafe = G.chains[outcome.chain].tiles.length >= SAFE_CHAIN_SIZE;
      G.log.push(`${outcome.chain} expanded to ${G.chains[outcome.chain].tiles.length} tiles`);
      G.currentPhase = 'buyStocks';
      break;
      
    case 'found':
      G.board = placeTileOnBoard(G.board, tileId);
      G.pendingFoundation = { tiles: outcome.tiles };
      G.currentPhase = 'foundChain';
      break;
      
    case 'merge':
      G.board = placeTileOnBoard(G.board, tileId);
      const analysis = analyzeMerger(G, outcome.chains);
      
      if (analysis.needsChoice) {
        G.mergerState = {
          triggeringTile: tileId,
          survivorChain: null,
          defunctChains: outcome.chains,
          currentDefunctIndex: 0,
          shareholderOrder: [],
          currentShareholderIndex: 0,
          bonusesPaid: false,
          pendingTiles: outcome.tiles,
        };
      } else {
        G.mergerState = createMergerState(G, tileId, analysis.survivor!, analysis.defunct, outcome.tiles);
        
        if (analysis.defunct.length > 0) {
          const defunctChain = analysis.defunct[0];
          const bonuses = calculateBonuses(G, defunctChain);
          for (const { playerId, bonus } of bonuses) {
            G.players[playerId].cash += bonus;
            G.log.push(`Player ${playerId} received $${bonus} bonus for ${defunctChain}`);
          }
          G.mergerState.bonusesPaid = true;
          G.mergerState.shareholderOrder = getShareholderOrder(G, defunctChain, ctx.currentPlayer);
        }
      }
      G.currentPhase = 'resolveMerger';
      break;
      
    default:
      return INVALID_MOVE;
  }
  
  console.log(`[MOVE] placeTile completed. Phase: ${G.currentPhase}`);
}

// ============================================================================
// FOUND CHAIN
// ============================================================================

export function selectChainToFound({ G, ctx }: MoveContext, chainName: ChainName) {
  console.log(`[MOVE] selectChainToFound(${chainName})`);
  
  if (!G.pendingFoundation) {
    return INVALID_MOVE;
  }
  
  if (G.chains[chainName].isActive) {
    return INVALID_MOVE;
  }
  
  const tiles = G.pendingFoundation.tiles;
  
  for (const tileId of tiles) {
    G.board = setTilesChain(G.board, [tileId], chainName);
  }
  
  G.chains[chainName].tiles = tiles;
  G.chains[chainName].isActive = true;
  G.chains[chainName].isSafe = tiles.length >= SAFE_CHAIN_SIZE;
  
  G.log.push(`${chainName} founded with ${tiles.length} tiles`);
  
  // Award founder's bonus
  if (G.stockMarket[chainName] > 0) {
    G.stockMarket[chainName] -= 1;
    G.players[ctx.currentPlayer].stocks[chainName] += 1;
    G.log.push(`Player ${ctx.currentPlayer} received 1 free ${chainName} stock`);
  }
  
  G.pendingFoundation = null;
  G.currentPhase = 'buyStocks';
}

// ============================================================================
// BUY STOCKS
// ============================================================================

export function buyStocks({ G, ctx }: MoveContext, purchases: StockPurchase[]) {
  console.log(`[MOVE] buyStocks`, purchases);
  
  const player = G.players[ctx.currentPlayer];
  const totalStocks = purchases.reduce((sum, p) => sum + p.count, 0);
  
  if (totalStocks > MAX_STOCKS_PER_TURN) {
    return INVALID_MOVE;
  }
  
  let totalCost = 0;
  for (const purchase of purchases) {
    if (!G.chains[purchase.chain].isActive) {
      return INVALID_MOVE;
    }
    if (G.stockMarket[purchase.chain] < purchase.count) {
      return INVALID_MOVE;
    }
    const chainSize = G.chains[purchase.chain].tiles.length;
    totalCost += getStockPrice(purchase.chain, chainSize) * purchase.count;
  }
  
  if (player.cash < totalCost) {
    return INVALID_MOVE;
  }
  
  for (const purchase of purchases) {
    G.stockMarket[purchase.chain] -= purchase.count;
    player.stocks[purchase.chain] += purchase.count;
    if (purchase.count > 0) {
      const chainSize = G.chains[purchase.chain].tiles.length;
      const price = getStockPrice(purchase.chain, chainSize);
      G.log.push(`Player ${ctx.currentPlayer} bought ${purchase.count} ${purchase.chain} for $${price * purchase.count}`);
    }
  }
  
  player.cash -= totalCost;
  G.turnState.hasBoughtStocks = true;
  G.turnState.stocksPurchasedThisTurn = totalStocks;
  G.currentPhase = 'playTile'; // Reset phase - turn.endIf will trigger turn end
  
  console.log(`[MOVE] buyStocks completed. Turn should end.`);
}

export function skipBuyStocks({ G, ctx }: MoveContext) {
  console.log(`[MOVE] skipBuyStocks by player ${ctx.currentPlayer}`);
  
  G.turnState.hasBoughtStocks = true;
  G.currentPhase = 'playTile'; // Reset phase - turn.endIf will trigger turn end
  G.log.push(`Player ${ctx.currentPlayer} skipped buying stocks`);
  
  console.log(`[MOVE] skipBuyStocks completed. Turn should end.`);
}

// ============================================================================
// MERGER RESOLUTION
// ============================================================================

export function chooseMergerSurvivor({ G, ctx }: MoveContext, survivorChain: ChainName) {
  console.log(`[MOVE] chooseMergerSurvivor(${survivorChain})`);
  
  if (!G.mergerState || G.mergerState.survivorChain !== null) {
    return INVALID_MOVE;
  }
  
  const mergingChains = G.mergerState.defunctChains;
  if (!mergingChains.includes(survivorChain)) {
    return INVALID_MOVE;
  }
  
  const defunctChains = mergingChains.filter(c => c !== survivorChain);
  defunctChains.sort((a, b) => G.chains[b].tiles.length - G.chains[a].tiles.length);
  
  G.log.push(`${survivorChain} selected as merger survivor`);
  
  const firstDefunct = defunctChains[0];
  const bonuses = calculateBonuses(G, firstDefunct);
  for (const { playerId, bonus } of bonuses) {
    G.players[playerId].cash += bonus;
    G.log.push(`Player ${playerId} received $${bonus} bonus for ${firstDefunct}`);
  }
  
  G.mergerState.survivorChain = survivorChain;
  G.mergerState.defunctChains = defunctChains;
  G.mergerState.currentDefunctIndex = 0;
  G.mergerState.shareholderOrder = getShareholderOrder(G, firstDefunct, ctx.currentPlayer);
  G.mergerState.currentShareholderIndex = 0;
  G.mergerState.bonusesPaid = true;
}

export function handleDefunctStock({ G, ctx }: MoveContext, hold: number, sell: number, trade: number) {
  console.log(`[MOVE] handleDefunctStock(hold=${hold}, sell=${sell}, trade=${trade})`);
  
  if (!G.mergerState || !G.mergerState.survivorChain) {
    return INVALID_MOVE;
  }
  
  const { defunctChains, currentDefunctIndex, shareholderOrder, currentShareholderIndex, survivorChain } = G.mergerState;
  const defunctChain = defunctChains[currentDefunctIndex];
  const playerId = shareholderOrder[currentShareholderIndex];
  
  if (playerId !== ctx.currentPlayer) {
    return INVALID_MOVE;
  }
  
  const playerStocks = G.players[playerId].stocks[defunctChain];
  const tradeIn = trade * 2;
  
  if (hold + sell + tradeIn !== playerStocks) {
    return INVALID_MOVE;
  }
  
  if (trade > G.stockMarket[survivorChain]) {
    return INVALID_MOVE;
  }
  
  const chainSize = G.chains[defunctChain].tiles.length;
  const sellPrice = getStockPrice(defunctChain, chainSize) * sell;
  
  G.players[playerId].cash += sellPrice;
  G.players[playerId].stocks[defunctChain] = hold;
  G.players[playerId].stocks[survivorChain] += trade;
  
  G.stockMarket[defunctChain] += sell + tradeIn;
  G.stockMarket[survivorChain] -= trade;
  
  if (sell > 0) G.log.push(`Player ${playerId} sold ${sell} ${defunctChain} for $${sellPrice}`);
  if (trade > 0) G.log.push(`Player ${playerId} traded ${tradeIn} ${defunctChain} for ${trade} ${survivorChain}`);
  if (hold > 0) G.log.push(`Player ${playerId} held ${hold} ${defunctChain}`);
  
  if (currentShareholderIndex < shareholderOrder.length - 1) {
    G.mergerState.currentShareholderIndex += 1;
  } else if (currentDefunctIndex < defunctChains.length - 1) {
    G.mergerState.currentDefunctIndex += 1;
    const nextDefunct = defunctChains[currentDefunctIndex + 1];
    
    const bonuses = calculateBonuses(G, nextDefunct);
    for (const { playerId: pid, bonus } of bonuses) {
      G.players[pid].cash += bonus;
      G.log.push(`Player ${pid} received $${bonus} bonus for ${nextDefunct}`);
    }
    
    G.mergerState.shareholderOrder = getShareholderOrder(G, nextDefunct, shareholderOrder[0]);
    G.mergerState.currentShareholderIndex = 0;
  } else {
    finalizeMerger(G);
  }
}

function finalizeMerger(G: AcquireGameState) {
  if (!G.mergerState || !G.mergerState.survivorChain) return;
  
  const { survivorChain, defunctChains, pendingTiles } = G.mergerState;
  
  let allTiles = [...G.chains[survivorChain].tiles, ...pendingTiles];
  
  for (const defunctChain of defunctChains) {
    const defunctTiles = getChainTiles(G.board, defunctChain);
    allTiles = [...allTiles, ...defunctTiles];
    
    G.chains[defunctChain].tiles = [];
    G.chains[defunctChain].isActive = false;
    G.chains[defunctChain].isSafe = false;
  }
  
  allTiles = [...new Set(allTiles)];
  G.board = setTilesChain(G.board, allTiles, survivorChain);
  
  G.chains[survivorChain].tiles = allTiles;
  G.chains[survivorChain].isSafe = allTiles.length >= SAFE_CHAIN_SIZE;
  
  G.mergerState = null;
  G.currentPhase = 'buyStocks';
  G.log.push(`Merger complete. ${survivorChain} now has ${allTiles.length} tiles`);
}

// ============================================================================
// END GAME
// ============================================================================

export function declareGameEnd({ G, ctx }: MoveContext) {
  console.log(`[MOVE] declareGameEnd`);
  
  const activeChains = CHAIN_NAMES.filter(name => G.chains[name].isActive);
  
  const hasLargeChain = activeChains.some(
    chain => G.chains[chain].tiles.length >= GAME_END_CHAIN_SIZE
  );
  
  const allSafe = activeChains.length > 0 && 
    activeChains.every(chain => G.chains[chain].isSafe);
  
  if (!hasLargeChain && !allSafe) {
    return INVALID_MOVE;
  }
  
  G.currentPhase = 'gameEnd';
  G.log.push(`Player ${ctx.currentPlayer} declared game end!`);
}
