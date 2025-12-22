// ============================================================================
// ACQUIRE DIGITAL - Full Game Simulation Test
// Tests the pure reducer without any UI framework
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInitialState, 
  gameReducer, 
  getValidActions,
  GameAction,
  ActionResult,
} from '../reducer';
import { AcquireGameState, ChainName } from '../types';
import { CHAIN_NAMES } from '../constants';

// Helper to apply action and assert success
function applyAction(state: AcquireGameState, action: GameAction): AcquireGameState {
  const result = gameReducer(state, action);
  if (!result.success) {
    throw new Error(`Action failed: ${result.error}`);
  }
  return result.state;
}

// Helper to get playable tiles for a player
function getPlayableTiles(state: AcquireGameState, playerId: string): string[] {
  const actions = getValidActions(state, playerId);
  return actions
    .filter(a => a.type === 'PLACE_TILE')
    .map(a => (a as any).tileId);
}

describe('Full Game Simulation', () => {
  
  describe('Initial State', () => {
    it('should create valid initial state for 4 players', () => {
      const state = createInitialState(4, ['Alice', 'Bob', 'Charlie', 'Diana']);
      
      expect(Object.keys(state.players)).toHaveLength(4);
      expect(state.players['0'].name).toBe('Alice');
      expect(state.players['0'].tiles).toHaveLength(6);
      expect(state.players['0'].cash).toBe(6000);
      expect(state.currentPlayer).toBe('0');
      expect(state.currentPhase).toBe('playTile');
      expect(state.gameOver).toBe(false);
      
      // All chains should be inactive
      for (const chain of CHAIN_NAMES) {
        expect(state.chains[chain].isActive).toBe(false);
      }
      
      // Stock market should have 25 of each
      for (const chain of CHAIN_NAMES) {
        expect(state.stockMarket[chain]).toBe(25);
      }
      
      console.log('Initial state created successfully');
      console.log('Player 0 tiles:', state.players['0'].tiles);
    });
  });
  
  describe('Tile Placement', () => {
    it('should place a tile and transition to buyStocks phase', () => {
      let state = createInitialState(2);
      const player0Tiles = state.players['0'].tiles;
      const tileToPlay = player0Tiles[0];
      
      console.log('Playing tile:', tileToPlay);
      
      state = applyAction(state, { 
        type: 'PLACE_TILE', 
        playerId: '0', 
        tileId: tileToPlay 
      });
      
      expect(state.players['0'].tiles).not.toContain(tileToPlay);
      expect(state.turnState.hasPlayedTile).toBe(true);
      // Phase should be buyStocks (or foundChain if adjacent tiles)
      expect(['buyStocks', 'foundChain']).toContain(state.currentPhase);
      
      console.log('After placement, phase:', state.currentPhase);
    });
    
    it('should reject tile placement when not player\'s turn', () => {
      const state = createInitialState(2);
      const player1Tiles = state.players['1'].tiles;
      
      const result = gameReducer(state, {
        type: 'PLACE_TILE',
        playerId: '1',
        tileId: player1Tiles[0],
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not player 1\'s turn');
    });
  });
  
  describe('Skip Buy Stocks', () => {
    it('should advance to next player after skipping', () => {
      let state = createInitialState(2);
      const tile = state.players['0'].tiles[0];
      
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: tile });
      
      // If we're in buyStocks phase, skip
      if (state.currentPhase === 'buyStocks') {
        state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
        
        expect(state.currentPlayer).toBe('1');
        expect(state.currentPhase).toBe('playTile');
        expect(state.turnState.hasPlayedTile).toBe(false);
        
        console.log('Turn advanced to player 1');
      }
    });
  });
  
  describe('Chain Founding', () => {
    it('should found a chain when tiles become adjacent', () => {
      // Create a custom state where we control tile positions
      let state = createInitialState(2);
      
      // Manually set up player tiles to be adjacent
      state.players['0'].tiles = ['1A', '2A', '3A', '4A', '5A', '6A'];
      state.players['1'].tiles = ['1B', '2B', '3B', '4B', '5B', '6B'];
      
      // Player 0 places 1A (isolated)
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: '1A' });
      expect(state.currentPhase).toBe('buyStocks');
      
      // Skip buy
      state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      expect(state.currentPlayer).toBe('1');
      
      // Player 1 places 1B (adjacent to 1A, should trigger founding)
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '1', tileId: '1B' });
      expect(state.currentPhase).toBe('foundChain');
      expect(state.pendingFoundation).not.toBeNull();
      
      console.log('Pending foundation tiles:', state.pendingFoundation?.tiles);
      
      // Select Tower as the new chain
      state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '1', chain: 'tower' });
      
      expect(state.chains.tower.isActive).toBe(true);
      expect(state.chains.tower.tiles).toHaveLength(2);
      expect(state.players['1'].stocks.tower).toBe(1); // Founder's bonus
      expect(state.stockMarket.tower).toBe(24);
      expect(state.currentPhase).toBe('buyStocks');
      
      console.log('Tower founded! Tiles:', state.chains.tower.tiles);
    });
  });
  
  describe('Stock Buying', () => {
    it('should allow buying stocks of active chains', () => {
      let state = createInitialState(2);
      
      // Set up with adjacent tiles
      state.players['0'].tiles = ['1A', '2A', '3A', '4A', '5A', '6A'];
      state.players['1'].tiles = ['1B', '2B', '3B', '4B', '5B', '6B'];
      
      // Place 1A, skip buy
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: '1A' });
      state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      
      // Place 1B, found tower
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '1', tileId: '1B' });
      state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '1', chain: 'tower' });
      
      // Now buy 3 tower stocks
      const towerPrice = 200; // Size 2, tier 1
      const initialCash = state.players['1'].cash;
      
      state = applyAction(state, { 
        type: 'BUY_STOCKS', 
        playerId: '1', 
        purchases: [{ chain: 'tower', count: 3 }]
      });
      
      expect(state.players['1'].stocks.tower).toBe(4); // 1 founder + 3 bought
      expect(state.players['1'].cash).toBe(initialCash - (towerPrice * 3));
      expect(state.stockMarket.tower).toBe(21); // 25 - 1 founder - 3 bought
      expect(state.currentPlayer).toBe('0');
      
      console.log('Bought 3 Tower stocks. Holdings:', state.players['1'].stocks.tower);
    });
    
    it('should reject buying more than 3 stocks', () => {
      let state = createInitialState(2);
      state.players['0'].tiles = ['1A', '2A', '3A', '4A', '5A', '6A'];
      state.players['1'].tiles = ['1B', '2B', '3B', '4B', '5B', '6B'];
      
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: '1A' });
      state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '1', tileId: '1B' });
      state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '1', chain: 'tower' });
      
      const result = gameReducer(state, {
        type: 'BUY_STOCKS',
        playerId: '1',
        purchases: [{ chain: 'tower', count: 4 }],
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot buy more than 3');
    });
  });
  
  describe('Full Turn Cycle', () => {
    it('should complete multiple turns with proper state transitions', () => {
      let state = createInitialState(3, ['Alice', 'Bob', 'Charlie']);
      
      console.log('\n=== STARTING FULL TURN CYCLE TEST ===\n');
      
      // Turn 1: Alice plays a tile, skips buying
      console.log('Turn 1: Alice');
      let aliceTile = state.players['0'].tiles[0];
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: aliceTile });
      if (state.currentPhase === 'foundChain' && state.pendingFoundation) {
        state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '0', chain: 'tower' });
      }
      if (state.currentPhase === 'buyStocks') {
        state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      }
      
      expect(state.currentPlayer).toBe('1');
      console.log('Alice done, now Bob\'s turn');
      
      // Turn 2: Bob plays a tile, skips buying
      console.log('Turn 2: Bob');
      let bobTile = state.players['1'].tiles[0];
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '1', tileId: bobTile });
      if (state.currentPhase === 'foundChain' && state.pendingFoundation) {
        state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '1', chain: 'luxor' });
      }
      if (state.currentPhase === 'buyStocks') {
        state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '1' });
      }
      
      expect(state.currentPlayer).toBe('2');
      console.log('Bob done, now Charlie\'s turn');
      
      // Turn 3: Charlie plays a tile, skips buying
      console.log('Turn 3: Charlie');
      let charlieTile = state.players['2'].tiles[0];
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '2', tileId: charlieTile });
      if (state.currentPhase === 'foundChain' && state.pendingFoundation) {
        state = applyAction(state, { type: 'SELECT_CHAIN_TO_FOUND', playerId: '2', chain: 'american' });
      }
      if (state.currentPhase === 'buyStocks') {
        state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '2' });
      }
      
      expect(state.currentPlayer).toBe('0'); // Back to Alice
      console.log('Charlie done, back to Alice');
      
      // Verify state
      expect(state.players['0'].tiles).toHaveLength(6); // Drew a new tile
      expect(state.players['1'].tiles).toHaveLength(6);
      expect(state.players['2'].tiles).toHaveLength(6);
      
      console.log('\n=== FULL TURN CYCLE COMPLETE ===');
      console.log('Game log:', state.log);
    });
  });
  
  describe('AI Simulation', () => {
    it('should simulate a simple AI playing through phases', () => {
      let state = createInitialState(2, ['Human', 'AI']);
      
      console.log('\n=== AI SIMULATION TEST ===\n');
      
      // Simulate AI's decision making
      function aiTakeTurn(state: AcquireGameState): AcquireGameState {
        const aiId = '1';
        const actions = getValidActions(state, aiId);
        
        console.log(`AI valid actions: ${actions.length}`);
        
        if (actions.length === 0) {
          console.log('AI has no valid actions');
          return state;
        }
        
        // Pick first valid action
        const action = actions[0];
        console.log(`AI action: ${action.type}`);
        
        const result = gameReducer(state, action);
        if (!result.success) {
          console.error('AI action failed:', result.error);
          return state;
        }
        
        return result.state;
      }
      
      // Human turn
      let humanTile = state.players['0'].tiles[0];
      state = applyAction(state, { type: 'PLACE_TILE', playerId: '0', tileId: humanTile });
      if (state.currentPhase === 'buyStocks') {
        state = applyAction(state, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      }
      
      expect(state.currentPlayer).toBe('1');
      console.log('Human done, AI turn');
      
      // AI turn - place tile
      state = aiTakeTurn(state);
      
      // If AI founded a chain, let it pick one
      if (state.currentPhase === 'foundChain') {
        state = aiTakeTurn(state);
      }
      
      // AI skips buying
      if (state.currentPhase === 'buyStocks') {
        state = aiTakeTurn(state);
      }
      
      // Should be back to human
      expect(state.currentPlayer).toBe('0');
      console.log('AI turn complete, back to human');
      
      console.log('\n=== AI SIMULATION COMPLETE ===');
    });
  });
  
  describe('Valid Actions API', () => {
    it('should return correct valid actions for each phase', () => {
      let state = createInitialState(2);
      
      // In playTile phase, should have tile placement actions
      let actions = getValidActions(state, '0');
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.every(a => a.type === 'PLACE_TILE')).toBe(true);
      
      // Wrong player should have no actions
      actions = getValidActions(state, '1');
      expect(actions).toHaveLength(0);
    });
  });
  
});

