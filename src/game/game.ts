// ============================================================================
// ACQUIRE DIGITAL - Main Game Definition
// Clean implementation using boardgame.io 0.50+ patterns
// ============================================================================

import { Game } from 'boardgame.io';
import { AcquireGameState } from './types';
import { setupGame } from './setup';
import { 
  placeTile, 
  selectChainToFound, 
  buyStocks, 
  skipBuyStocks,
  chooseMergerSurvivor,
  handleDefunctStock,
  declareGameEnd,
} from './moves';
import { calculateBonuses } from './logic/merger';
import { CHAIN_NAMES, getStockPrice } from './constants';

/**
 * Calculate final scores when game ends
 */
function calculateFinalScores(G: AcquireGameState): Record<string, number> {
  const scores: Record<string, number> = {};
  const activeChains = CHAIN_NAMES.filter(name => G.chains[name].isActive);
  
  for (const playerId of Object.keys(G.players)) {
    scores[playerId] = G.players[playerId].cash;
  }
  
  for (const chain of activeChains) {
    const chainSize = G.chains[chain].tiles.length;
    const stockPrice = getStockPrice(chain, chainSize);
    
    const bonuses = calculateBonuses(G, chain);
    for (const { playerId, bonus } of bonuses) {
      scores[playerId] += bonus;
    }
    
    for (const playerId of Object.keys(G.players)) {
      const stockCount = G.players[playerId].stocks[chain];
      scores[playerId] += stockCount * stockPrice;
    }
  }
  
  return scores;
}

function determineWinner(scores: Record<string, number>): string {
  let maxScore = -1;
  let winner = '';
  
  for (const [playerId, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      winner = playerId;
    }
  }
  
  return winner;
}

/**
 * The main Acquire game definition for boardgame.io
 */
export const AcquireGame: Game<AcquireGameState> = {
  name: 'acquire',
  
  setup: setupGame,
  
  moves: {
    placeTile,
    selectChainToFound,
    buyStocks,
    skipBuyStocks,
    chooseMergerSurvivor,
    handleDefunctStock,
    declareGameEnd,
  },
  
  turn: {
    // Turn ends when player has bought stocks (or skipped)
    endIf: ({ G }) => {
      // Only end turn if we've completed the buy phase
      // (not in the middle of founding a chain or resolving a merger)
      return G.turnState.hasBoughtStocks && 
             G.currentPhase === 'playTile'; // Phase resets to playTile after buying
    },
    
    onBegin: ({ G, ctx }) => {
      console.log(`[TURN] Player ${ctx.currentPlayer}'s turn begins`);
      // Reset turn state at the beginning of each turn
      G.turnState = {
        hasPlayedTile: false,
        hasBoughtStocks: false,
        stocksPurchasedThisTurn: 0,
        hasDrawnTile: false,
        hasExchangedDeadTile: false,
      };
      G.currentPhase = 'playTile';
    },
    
    onEnd: ({ G, ctx }) => {
      console.log(`[TURN] Player ${ctx.currentPlayer}'s turn ends`);
      // Draw a new tile for the player
      const player = G.players[ctx.currentPlayer];
      if (G.tilePool.length > 0 && player.tiles.length < 6) {
        const drawnTile = G.tilePool.pop()!;
        player.tiles.push(drawnTile);
        G.log.push(`Player ${ctx.currentPlayer} drew a tile`);
      }
    },
  },
  
  endIf: ({ G }) => {
    if (G.currentPhase === 'gameEnd') {
      const scores = calculateFinalScores(G);
      const winner = determineWinner(scores);
      return { winner, scores };
    }
    return undefined;
  },
};
