// ============================================================================
// ACQUIRE DIGITAL - Pure Game Reducer
// No framework dependencies - just TypeScript
// ============================================================================

import { AcquireGameState, ChainName, StockPurchase, TileId, PlayerState, TurnState } from './types';
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
  getShareholderOrder,
} from './logic/merger';
import { 
  getStockPrice, 
  CHAIN_NAMES,
  SAFE_CHAIN_SIZE,
  GAME_END_CHAIN_SIZE,
  MAX_STOCKS_PER_TURN,
  STARTING_CASH,
  TILES_IN_HAND,
  generateAllTileIds,
  shuffleArray,
} from './constants';
import { createEmptyBoard } from './logic/board';

// ============================================================================
// ACTION TYPES
// ============================================================================

export type GameAction = 
  | { type: 'PLACE_TILE'; playerId: string; tileId: TileId }
  | { type: 'SELECT_CHAIN_TO_FOUND'; playerId: string; chain: ChainName }
  | { type: 'BUY_STOCKS'; playerId: string; purchases: StockPurchase[] }
  | { type: 'SKIP_BUY_STOCKS'; playerId: string }
  | { type: 'CHOOSE_MERGER_SURVIVOR'; playerId: string; chain: ChainName }
  | { type: 'HANDLE_DEFUNCT_STOCK'; playerId: string; hold: number; sell: number; trade: number }
  | { type: 'DECLARE_GAME_END'; playerId: string }
  | { type: 'EXCHANGE_DEAD_TILE'; playerId: string; tileId: TileId }
  | { type: 'PASS_TURN'; playerId: string }
  | { type: 'END_TURN' };

// ============================================================================
// RESULT TYPE
// ============================================================================

export type ActionResult = 
  | { success: true; state: AcquireGameState }
  | { success: false; error: string };

// ============================================================================
// INITIAL STATE CREATION
// ============================================================================

export function createInitialState(numPlayers: number, playerNames?: string[]): AcquireGameState {
  const allTiles = shuffleArray(generateAllTileIds());
  let tileIndex = 0;
  
  // Create players
  const players: Record<string, PlayerState> = {};
  for (let i = 0; i < numPlayers; i++) {
    const playerTiles = allTiles.slice(tileIndex, tileIndex + TILES_IN_HAND);
    tileIndex += TILES_IN_HAND;
    
    players[String(i)] = {
      id: String(i),
      name: playerNames?.[i] || `Player ${i + 1}`,
      tiles: playerTiles,
      cash: STARTING_CASH,
      stocks: {
        tower: 0, luxor: 0, american: 0, worldwide: 0,
        festival: 0, continental: 0, imperial: 0,
      },
    };
  }
  
  // Create chains
  const chains: Record<ChainName, { tiles: TileId[]; isActive: boolean; isSafe: boolean }> = {
    tower: { tiles: [], isActive: false, isSafe: false },
    luxor: { tiles: [], isActive: false, isSafe: false },
    american: { tiles: [], isActive: false, isSafe: false },
    worldwide: { tiles: [], isActive: false, isSafe: false },
    festival: { tiles: [], isActive: false, isSafe: false },
    continental: { tiles: [], isActive: false, isSafe: false },
    imperial: { tiles: [], isActive: false, isSafe: false },
  };
  
  // Create stock market
  const stockMarket: Record<ChainName, number> = {
    tower: 25, luxor: 25, american: 25, worldwide: 25,
    festival: 25, continental: 25, imperial: 25,
  };
  
  // Remaining tiles go to the pool
  const tilePool = allTiles.slice(tileIndex);
  
  return {
    board: createEmptyBoard(),
    players,
    chains,
    stockMarket,
    tilePool,
    currentPlayer: '0',
    currentPhase: 'playTile',
    turnState: {
      hasPlayedTile: false,
      hasBoughtStocks: false,
      stocksPurchasedThisTurn: 0,
      hasDrawnTile: false,
      hasExchangedDeadTile: false,
    },
    pendingFoundation: null,
    mergerState: null,
    gameOver: false,
    winner: null,
    log: ['Game started!'],
  };
}

// ============================================================================
// REDUCER
// ============================================================================

export function gameReducer(state: AcquireGameState, action: GameAction): ActionResult {
  // Clone state to avoid mutations
  const newState = JSON.parse(JSON.stringify(state)) as AcquireGameState;
  
  switch (action.type) {
    case 'PLACE_TILE':
      return handlePlaceTile(newState, action.playerId, action.tileId);
      
    case 'SELECT_CHAIN_TO_FOUND':
      return handleSelectChainToFound(newState, action.playerId, action.chain);
      
    case 'BUY_STOCKS':
      return handleBuyStocks(newState, action.playerId, action.purchases);
      
    case 'SKIP_BUY_STOCKS':
      return handleSkipBuyStocks(newState, action.playerId);
      
    case 'CHOOSE_MERGER_SURVIVOR':
      return handleChooseMergerSurvivor(newState, action.playerId, action.chain);
      
    case 'HANDLE_DEFUNCT_STOCK':
      return handleDefunctStock(newState, action.playerId, action.hold, action.sell, action.trade);
      
    case 'DECLARE_GAME_END':
      return handleDeclareGameEnd(newState, action.playerId);
      
    case 'EXCHANGE_DEAD_TILE':
      return handleExchangeDeadTile(newState, action.playerId, action.tileId);
      
    case 'PASS_TURN':
      return handlePassTurn(newState, action.playerId);
      
    case 'END_TURN':
      return handleEndTurn(newState);
      
    default:
      return { success: false, error: 'Unknown action type' };
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

function handlePlaceTile(state: AcquireGameState, playerId: string, tileId: TileId): ActionResult {
  // Validate it's this player's turn
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'playTile') {
    return { success: false, error: `Cannot place tile in ${state.currentPhase} phase` };
  }
  
  const player = state.players[playerId];
  if (!player.tiles.includes(tileId)) {
    return { success: false, error: `Tile ${tileId} not in player's hand` };
  }
  
  if (!isTilePlayable(state, tileId)) {
    return { success: false, error: `Tile ${tileId} is unplayable` };
  }
  
  const outcome = getTilePlacementOutcome(state, tileId);
  
  // Remove tile from hand
  player.tiles = player.tiles.filter(t => t !== tileId);
  state.turnState.hasPlayedTile = true;
  state.log.push(`${player.name} placed tile ${tileId}`);
  
  switch (outcome.type) {
    case 'nothing':
      state.board = placeTileOnBoard(state.board, tileId);
      state.currentPhase = 'buyStocks';
      break;
      
    case 'expand':
      state.board = placeTileOnBoard(state.board, tileId, outcome.chain);
      state.chains[outcome.chain].tiles.push(tileId);
      state.chains[outcome.chain].isSafe = state.chains[outcome.chain].tiles.length >= SAFE_CHAIN_SIZE;
      state.log.push(`${outcome.chain} expanded to ${state.chains[outcome.chain].tiles.length} tiles`);
      state.currentPhase = 'buyStocks';
      break;
      
    case 'found':
      state.board = placeTileOnBoard(state.board, tileId);
      
      // Check if all 7 chains are already active
      const inactiveChains = CHAIN_NAMES.filter(c => !state.chains[c].isActive);
      if (inactiveChains.length === 0) {
        // All chains active - tile stays unincorporated, skip founding
        state.log.push(`${state.players[playerId].name} placed ${tileId} but all chains are active - tiles remain unincorporated`);
        state.turnState.hasPlayedTile = true;
        state.currentPhase = 'buyStocks';
      } else {
        state.pendingFoundation = { tiles: outcome.tiles };
        state.currentPhase = 'foundChain';
      }
      break;
      
    case 'merge':
      state.board = placeTileOnBoard(state.board, tileId);
      const analysis = analyzeMerger(state, outcome.chains);
      
      if (analysis.needsChoice) {
        state.mergerState = {
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
        const firstDefunct = analysis.defunct[0];
        const shareholderOrder = getShareholderOrder(state, firstDefunct, playerId);
        
        state.mergerState = {
          triggeringTile: tileId,
          survivorChain: analysis.survivor!,
          defunctChains: analysis.defunct,
          currentDefunctIndex: 0,
          shareholderOrder,
          currentShareholderIndex: 0,
          bonusesPaid: false,
          pendingTiles: outcome.tiles,
        };
        
        // Pay bonuses for first defunct chain
        if (firstDefunct) {
          const bonuses = calculateBonuses(state, firstDefunct);
          for (const { playerId: pid, bonus } of bonuses) {
            state.players[pid].cash += bonus;
            state.log.push(`${state.players[pid].name} received $${bonus} bonus for ${firstDefunct}`);
          }
          state.mergerState.bonusesPaid = true;
        }
        
        // If no shareholders in first defunct chain, try to advance or finalize
        if (shareholderOrder.length === 0) {
          const advanceResult = advanceMergerToNextDefunctOrFinalize(state);
          if (advanceResult) {
            return advanceResult;
          }
        }
      }
      state.currentPhase = 'resolveMerger';
      break;
  }
  
  return { success: true, state };
}

function handleSelectChainToFound(state: AcquireGameState, playerId: string, chainName: ChainName): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'foundChain') {
    return { success: false, error: `Cannot found chain in ${state.currentPhase} phase` };
  }
  
  if (!state.pendingFoundation) {
    return { success: false, error: 'No pending foundation' };
  }
  
  if (state.chains[chainName].isActive) {
    return { success: false, error: `${chainName} is already active` };
  }
  
  const tiles = state.pendingFoundation.tiles;
  
  for (const tileId of tiles) {
    state.board = setTilesChain(state.board, [tileId], chainName);
  }
  
  state.chains[chainName].tiles = tiles;
  state.chains[chainName].isActive = true;
  state.chains[chainName].isSafe = tiles.length >= SAFE_CHAIN_SIZE;
  
  state.log.push(`${chainName} founded with ${tiles.length} tiles`);
  
  // Award founder's bonus stock
  if (state.stockMarket[chainName] > 0) {
    state.stockMarket[chainName] -= 1;
    state.players[playerId].stocks[chainName] += 1;
    state.log.push(`${state.players[playerId].name} received 1 free ${chainName} stock`);
  }
  
  state.pendingFoundation = null;
  state.currentPhase = 'buyStocks';
  
  return { success: true, state };
}

function handleBuyStocks(state: AcquireGameState, playerId: string, purchases: StockPurchase[]): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'buyStocks') {
    return { success: false, error: `Cannot buy stocks in ${state.currentPhase} phase` };
  }
  
  const player = state.players[playerId];
  const totalStocks = purchases.reduce((sum, p) => sum + p.count, 0);
  
  if (totalStocks > MAX_STOCKS_PER_TURN) {
    return { success: false, error: 'Cannot buy more than 3 stocks per turn' };
  }
  
  // Calculate total cost and validate
  let totalCost = 0;
  for (const purchase of purchases) {
    if (!state.chains[purchase.chain].isActive) {
      return { success: false, error: `${purchase.chain} is not active` };
    }
    if (state.stockMarket[purchase.chain] < purchase.count) {
      return { success: false, error: `Not enough ${purchase.chain} stocks available` };
    }
    const chainSize = state.chains[purchase.chain].tiles.length;
    totalCost += getStockPrice(purchase.chain, chainSize) * purchase.count;
  }
  
  if (player.cash < totalCost) {
    return { success: false, error: 'Not enough cash' };
  }
  
  // Execute purchases
  for (const purchase of purchases) {
    state.stockMarket[purchase.chain] -= purchase.count;
    player.stocks[purchase.chain] += purchase.count;
    if (purchase.count > 0) {
      const chainSize = state.chains[purchase.chain].tiles.length;
      const price = getStockPrice(purchase.chain, chainSize);
      state.log.push(`${player.name} bought ${purchase.count} ${purchase.chain} for $${price * purchase.count}`);
    }
  }
  
  player.cash -= totalCost;
  state.turnState.hasBoughtStocks = true;
  
  // End turn
  return advanceToNextTurn(state);
}

function handleSkipBuyStocks(state: AcquireGameState, playerId: string): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'buyStocks') {
    return { success: false, error: `Cannot skip buying in ${state.currentPhase} phase` };
  }
  
  state.turnState.hasBoughtStocks = true;
  state.log.push(`${state.players[playerId].name} skipped buying stocks`);
  
  // End turn
  return advanceToNextTurn(state);
}

function handleChooseMergerSurvivor(state: AcquireGameState, playerId: string, survivorChain: ChainName): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (!state.mergerState || state.mergerState.survivorChain !== null) {
    return { success: false, error: 'Cannot choose survivor now' };
  }
  
  const mergingChains = state.mergerState.defunctChains;
  if (!mergingChains.includes(survivorChain)) {
    return { success: false, error: `${survivorChain} is not part of this merger` };
  }
  
  // Set up merger resolution
  const defunctChains = mergingChains.filter(c => c !== survivorChain);
  defunctChains.sort((a, b) => state.chains[b].tiles.length - state.chains[a].tiles.length);
  
  state.log.push(`${survivorChain} selected as merger survivor`);
  
  const firstDefunct = defunctChains[0];
  const bonuses = calculateBonuses(state, firstDefunct);
  for (const { playerId: pid, bonus } of bonuses) {
    state.players[pid].cash += bonus;
    state.log.push(`${state.players[pid].name} received $${bonus} bonus for ${firstDefunct}`);
  }
  
  state.mergerState.survivorChain = survivorChain;
  state.mergerState.defunctChains = defunctChains;
  state.mergerState.currentDefunctIndex = 0;
  state.mergerState.shareholderOrder = getShareholderOrder(state, firstDefunct, playerId);
  state.mergerState.currentShareholderIndex = 0;
  state.mergerState.bonusesPaid = true;
  
  return { success: true, state };
}

function handleDefunctStock(state: AcquireGameState, playerId: string, hold: number, sell: number, trade: number): ActionResult {
  if (!state.mergerState || !state.mergerState.survivorChain) {
    return { success: false, error: 'No active merger' };
  }
  
  const { defunctChains, currentDefunctIndex, shareholderOrder, currentShareholderIndex, survivorChain } = state.mergerState;
  const defunctChain = defunctChains[currentDefunctIndex];
  const expectedPlayer = shareholderOrder[currentShareholderIndex];
  
  if (expectedPlayer !== playerId) {
    return { success: false, error: `Waiting for player ${expectedPlayer}` };
  }
  
  const player = state.players[playerId];
  const playerStocks = player.stocks[defunctChain];
  const tradeIn = trade * 2;
  
  if (hold + sell + tradeIn !== playerStocks) {
    return { success: false, error: 'Stock allocation does not match holdings' };
  }
  
  if (trade > state.stockMarket[survivorChain]) {
    return { success: false, error: 'Not enough survivor stocks available' };
  }
  
  // Execute the decision
  const chainSize = state.chains[defunctChain].tiles.length;
  const sellPrice = getStockPrice(defunctChain, chainSize) * sell;
  
  player.cash += sellPrice;
  player.stocks[defunctChain] = hold;
  player.stocks[survivorChain] += trade;
  
  state.stockMarket[defunctChain] += sell + tradeIn;
  state.stockMarket[survivorChain] -= trade;
  
  if (sell > 0) state.log.push(`${player.name} sold ${sell} ${defunctChain} for $${sellPrice}`);
  if (trade > 0) state.log.push(`${player.name} traded ${tradeIn} ${defunctChain} for ${trade} ${survivorChain}`);
  if (hold > 0) state.log.push(`${player.name} held ${hold} ${defunctChain}`);
  
  // Move to next shareholder or next defunct chain
  if (currentShareholderIndex < shareholderOrder.length - 1) {
    state.mergerState.currentShareholderIndex += 1;
  } else {
    // Done with this defunct chain, move to next or finalize
    const advanceResult = advanceMergerToNextDefunctOrFinalize(state);
    if (advanceResult) {
      return advanceResult;
    }
  }
  
  return { success: true, state };
}

/**
 * Helper to advance merger to next defunct chain or finalize
 * Handles edge case where a defunct chain has no shareholders
 */
function advanceMergerToNextDefunctOrFinalize(state: AcquireGameState): ActionResult | null {
  if (!state.mergerState) return null;
  
  const { defunctChains, currentDefunctIndex, shareholderOrder } = state.mergerState;
  const startingPlayer = shareholderOrder[0] || state.currentPlayer || '0';
  
  // Try to move to next defunct chain
  let nextIndex = currentDefunctIndex + 1;
  
  while (nextIndex < defunctChains.length) {
    const nextDefunct = defunctChains[nextIndex];
    
    // Pay bonuses for this chain
    const bonuses = calculateBonuses(state, nextDefunct);
    for (const { playerId: pid, bonus } of bonuses) {
      state.players[pid].cash += bonus;
      state.log.push(`${state.players[pid].name} received $${bonus} bonus for ${nextDefunct}`);
    }
    
    const nextShareholderOrder = getShareholderOrder(state, nextDefunct, startingPlayer);
    
    if (nextShareholderOrder.length > 0) {
      // Found a chain with shareholders
      state.mergerState.currentDefunctIndex = nextIndex;
      state.mergerState.shareholderOrder = nextShareholderOrder;
      state.mergerState.currentShareholderIndex = 0;
      return null; // Continue with merger, don't return ActionResult
    }
    
    // No shareholders for this chain, skip to next
    state.log.push(`No shareholders in ${nextDefunct}, skipping stock handling`);
    nextIndex++;
  }
  
  // No more defunct chains with shareholders, finalize
  return finalizeMerger(state);
}

function finalizeMerger(state: AcquireGameState): ActionResult {
  if (!state.mergerState || !state.mergerState.survivorChain) {
    return { success: false, error: 'No merger to finalize' };
  }
  
  const { survivorChain, defunctChains, pendingTiles } = state.mergerState;
  
  let allTiles = [...state.chains[survivorChain].tiles, ...pendingTiles];
  
  for (const defunctChain of defunctChains) {
    const defunctTiles = getChainTiles(state.board, defunctChain);
    allTiles = [...allTiles, ...defunctTiles];
    
    state.chains[defunctChain].tiles = [];
    state.chains[defunctChain].isActive = false;
    state.chains[defunctChain].isSafe = false;
  }
  
  allTiles = [...new Set(allTiles)];
  state.board = setTilesChain(state.board, allTiles, survivorChain);
  
  state.chains[survivorChain].tiles = allTiles;
  state.chains[survivorChain].isSafe = allTiles.length >= SAFE_CHAIN_SIZE;
  
  state.mergerState = null;
  state.currentPhase = 'buyStocks';
  state.log.push(`Merger complete. ${survivorChain} now has ${allTiles.length} tiles`);
  
  return { success: true, state };
}

function handleDeclareGameEnd(state: AcquireGameState, playerId: string): ActionResult {
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);
  
  const hasLargeChain = activeChains.some(
    chain => state.chains[chain].tiles.length >= GAME_END_CHAIN_SIZE
  );
  
  const allSafe = activeChains.length > 0 && 
    activeChains.every(chain => state.chains[chain].isSafe);
  
  if (!hasLargeChain && !allSafe) {
    return { success: false, error: 'Game end conditions not met' };
  }
  
  state.currentPhase = 'gameEnd';
  state.gameOver = true;
  state.log.push(`${state.players[playerId].name} declared game end!`);
  
  // Calculate final scores (includes bonuses + stock values + cash)
  const scores = calculateFinalScores(state);
  
  // Store final scores in state for UI
  state.finalScores = scores;
  
  let maxScore = -1;
  let winner = '';
  
  for (const [pid, score] of Object.entries(scores)) {
    state.log.push(`${state.players[pid].name} final score: $${score.toLocaleString()}`);
    if (score > maxScore) {
      maxScore = score;
      winner = pid;
    }
  }
  
  state.winner = winner;
  state.log.push(`${state.players[winner].name} wins with $${maxScore.toLocaleString()}!`);
  
  return { success: true, state };
}

function handleExchangeDeadTile(state: AcquireGameState, playerId: string, tileId: TileId): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'playTile') {
    return { success: false, error: 'Can only exchange dead tiles during tile placement phase' };
  }
  
  const player = state.players[playerId];
  const tileIndex = player.tiles.indexOf(tileId);
  
  if (tileIndex === -1) {
    return { success: false, error: 'Player does not have this tile' };
  }
  
  // Check if tile is actually dead (would merge two safe chains)
  const outcome = getTilePlacementOutcome(state, tileId);
  if (outcome.type !== 'unplayable' || outcome.reason !== 'dead') {
    return { success: false, error: 'Tile is not a dead tile' };
  }
  
  // Check if there are tiles in the pool
  if (state.tilePool.length === 0) {
    return { success: false, error: 'No tiles left to exchange' };
  }
  
  // Remove dead tile from player's hand
  player.tiles.splice(tileIndex, 1);
  
  // Draw new tile
  const newTile = state.tilePool.pop()!;
  player.tiles.push(newTile);
  
  // Put dead tile back in pool (shuffled)
  state.tilePool.unshift(tileId);
  
  state.turnState.hasExchangedDeadTile = true;
  state.log.push(`${player.name} exchanged dead tile ${tileId} for ${newTile}`);
  
  return { success: true, state };
}

function handlePassTurn(state: AcquireGameState, playerId: string): ActionResult {
  if (state.currentPlayer !== playerId) {
    return { success: false, error: `Not player ${playerId}'s turn` };
  }
  
  if (state.currentPhase !== 'playTile') {
    return { success: false, error: 'Can only pass during tile placement phase' };
  }
  
  const player = state.players[playerId];
  
  // Check if player truly has no playable tiles
  const hasPlayableTile = player.tiles.some(t => isTilePlayable(state, t));
  if (hasPlayableTile) {
    return { success: false, error: 'You have playable tiles - cannot pass' };
  }
  
  state.log.push(`${player.name} has no playable tiles - passing turn`);
  
  // Skip to buy stocks or end turn
  state.turnState.hasPlayedTile = true; // Treat as having played
  state.currentPhase = 'buyStocks';
  
  return { success: true, state };
}

function handleEndTurn(state: AcquireGameState): ActionResult {
  return advanceToNextTurn(state);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function advanceToNextTurn(state: AcquireGameState): ActionResult {
  const playerIds = Object.keys(state.players);
  const currentPlayerId = state.currentPlayer || '0';
  const currentIndex = playerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  const nextPlayer = playerIds[nextIndex];
  
  // Draw tile for current player
  const currentPlayer = state.players[currentPlayerId];
  if (currentPlayer && state.tilePool.length > 0 && currentPlayer.tiles.length < 6) {
    const drawnTile = state.tilePool.pop()!;
    currentPlayer.tiles.push(drawnTile);
  }
  
  // Check for automatic game end conditions
  // 1. Tile pool is empty and current player has no tiles
  const allPlayersOutOfTiles = Object.values(state.players).every(p => p.tiles.length === 0);
  if (state.tilePool.length === 0 && allPlayersOutOfTiles) {
    state.log.push('All tiles have been played - game ending automatically');
    return endGameAndCalculateWinner(state);
  }
  
  // 2. Check if game end conditions are met (optional auto-end)
  const canDeclareEnd = checkGameEndConditions(state);
  
  // Advance to next player
  state.currentPlayer = nextPlayer;
  state.currentPhase = 'playTile';
  state.turnState = {
    hasPlayedTile: false,
    hasBoughtStocks: false,
    stocksPurchasedThisTurn: 0,
    hasDrawnTile: false,
    hasExchangedDeadTile: false,
  };
  
  return { success: true, state };
}

function checkGameEndConditions(state: AcquireGameState): boolean {
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);
  
  // Condition 1: Any chain has 41+ tiles
  const hasLargeChain = activeChains.some(
    chain => state.chains[chain].tiles.length >= GAME_END_CHAIN_SIZE
  );
  
  // Condition 2: All active chains are safe (11+ tiles)
  const allSafe = activeChains.length > 0 && 
    activeChains.every(chain => state.chains[chain].isSafe);
  
  return hasLargeChain || allSafe;
}

function endGameAndCalculateWinner(state: AcquireGameState): ActionResult {
  state.currentPhase = 'gameEnd';
  state.gameOver = true;
  
  // Calculate final scores (includes bonuses + stock values + cash)
  const scores = calculateFinalScores(state);
  
  // Store the final scores in state so UI can display them
  state.finalScores = scores;
  
  let maxScore = -1;
  let winner = '';
  
  for (const [pid, score] of Object.entries(scores)) {
    state.log.push(`${state.players[pid].name} final score: $${score.toLocaleString()}`);
    if (score > maxScore) {
      maxScore = score;
      winner = pid;
    }
  }
  
  state.winner = winner;
  state.log.push(`${state.players[winner].name} wins with $${maxScore.toLocaleString()}!`);
  
  return { success: true, state };
}

function calculateFinalScores(state: AcquireGameState): Record<string, number> {
  const scores: Record<string, number> = {};
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);
  
  for (const playerId of Object.keys(state.players)) {
    scores[playerId] = state.players[playerId].cash;
  }
  
  for (const chain of activeChains) {
    const chainSize = state.chains[chain].tiles.length;
    const stockPrice = getStockPrice(chain, chainSize);
    
    const bonuses = calculateBonuses(state, chain);
    for (const { playerId, bonus } of bonuses) {
      scores[playerId] += bonus;
    }
    
    for (const playerId of Object.keys(state.players)) {
      const stockCount = state.players[playerId].stocks[chain];
      scores[playerId] += stockCount * stockPrice;
    }
  }
  
  return scores;
}

// ============================================================================
// UTILITY: GET VALID ACTIONS
// ============================================================================

export function getValidActions(state: AcquireGameState, playerId: string): GameAction[] {
  const actions: GameAction[] = [];
  
  if (state.gameOver) return actions;
  
  // Only current player can act (except during merger stock decisions)
  if (state.currentPhase === 'resolveMerger' && state.mergerState?.survivorChain) {
    const expectedPlayer = state.mergerState.shareholderOrder[state.mergerState.currentShareholderIndex];
    if (expectedPlayer !== playerId) return actions;
  } else if (state.currentPlayer !== playerId) {
    return actions;
  }
  
  const player = state.players[playerId];
  
  switch (state.currentPhase) {
    case 'playTile':
      let hasPlayableTile = false;
      for (const tileId of player.tiles) {
        if (isTilePlayable(state, tileId)) {
          actions.push({ type: 'PLACE_TILE', playerId, tileId });
          hasPlayableTile = true;
        } else {
          // Check if this is a dead tile that can be exchanged
          const outcome = getTilePlacementOutcome(state, tileId);
          if (outcome.type === 'unplayable' && outcome.reason === 'dead' && 
              state.tilePool.length > 0 && !state.turnState.hasExchangedDeadTile) {
            actions.push({ type: 'EXCHANGE_DEAD_TILE', playerId, tileId });
          }
        }
      }
      // If no playable tiles, player can pass
      if (!hasPlayableTile) {
        actions.push({ type: 'PASS_TURN', playerId });
      }
      break;
      
    case 'foundChain':
      for (const chain of CHAIN_NAMES) {
        if (!state.chains[chain].isActive) {
          actions.push({ type: 'SELECT_CHAIN_TO_FOUND', playerId, chain });
        }
      }
      break;
      
    case 'buyStocks':
      actions.push({ type: 'SKIP_BUY_STOCKS', playerId });
      // Check if game end can be declared
      if (checkGameEndConditions(state)) {
        actions.push({ type: 'DECLARE_GAME_END', playerId });
      }
      // Note: Could enumerate all buy combinations, but skip is always valid
      break;
      
    case 'resolveMerger':
      if (state.mergerState?.survivorChain === null) {
        for (const chain of state.mergerState.defunctChains) {
          actions.push({ type: 'CHOOSE_MERGER_SURVIVOR', playerId, chain });
        }
      }
      // For defunct stock, the valid combinations depend on holdings
      break;
  }
  
  return actions;
}

