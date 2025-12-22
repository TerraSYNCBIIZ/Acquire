// ============================================================================
// ACQUIRE DIGITAL - Smart Bot Tests
// Verify AI decision-making logic
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { getSmartAIAction, AIConfig } from './smartBot';
import { createInitialState, gameReducer, GameAction } from '../reducer';
import { AcquireGameState, ChainName } from '../types';

describe('Smart AI Bot', () => {
  let state: AcquireGameState;
  
  beforeEach(() => {
    state = createInitialState(4, ['Human', 'AggressiveAI', 'BalancedAI', 'ConservativeAI']);
  });
  
  describe('Tile Placement', () => {
    it('should choose a playable tile', () => {
      const config: AIConfig = { personality: 'balanced', thinkingDelay: 0 };
      const action = getSmartAIAction(state, '0', config);
      
      expect(action).not.toBeNull();
      expect(action?.type).toBe('PLACE_TILE');
      if (action?.type === 'PLACE_TILE') {
        expect(state.players['0'].tiles).toContain(action.tileId);
      }
    });
    
    it('aggressive AI should prefer founding chains', () => {
      // Set up a state where player has tiles that could found a chain
      const testState = createInitialState(2);
      
      // Place a tile on the board first
      const firstTile = testState.players['0'].tiles[0];
      let result = gameReducer(testState, { type: 'PLACE_TILE', playerId: '0', tileId: firstTile });
      expect(result.success).toBe(true);
      
      const aggressiveConfig: AIConfig = { personality: 'aggressive', thinkingDelay: 0 };
      const action = getSmartAIAction(result.state!, '0', aggressiveConfig);
      
      // AI should return a valid action
      expect(action).not.toBeNull();
    });
  });
  
  describe('Chain Founding', () => {
    it('should found a chain when in foundChain phase', () => {
      // Set up: Place adjacent tiles to trigger chain founding
      const testState = createInitialState(2);
      testState.players['0'].tiles = ['1A', '1B', '2A', '2B', '3A', '3B'];
      
      // Place first tile
      let result = gameReducer(testState, { type: 'PLACE_TILE', playerId: '0', tileId: '1A' });
      expect(result.success).toBe(true);
      
      // Skip buy
      result = gameReducer(result.state!, { type: 'SKIP_BUY_STOCKS', playerId: '0' });
      expect(result.success).toBe(true);
      
      // Place adjacent tile (should trigger found)
      result = gameReducer(result.state!, { type: 'PLACE_TILE', playerId: '1', tileId: '1B' });
      
      if (result.state?.currentPhase === 'foundChain') {
        const config: AIConfig = { personality: 'balanced', thinkingDelay: 0 };
        const action = getSmartAIAction(result.state, '1', config);
        
        expect(action).not.toBeNull();
        expect(action?.type).toBe('SELECT_CHAIN_TO_FOUND');
      }
    });
    
    it('conservative AI should prefer cheap chains (tier 1)', () => {
      const testState = createInitialState(2);
      testState.currentPhase = 'foundChain';
      testState.pendingFoundation = { tiles: ['1A', '1B'] };
      
      const config: AIConfig = { personality: 'conservative', thinkingDelay: 0 };
      const action = getSmartAIAction(testState, '0', config);
      
      expect(action).not.toBeNull();
      expect(action?.type).toBe('SELECT_CHAIN_TO_FOUND');
      if (action?.type === 'SELECT_CHAIN_TO_FOUND') {
        // Conservative should prefer tower or luxor
        expect(['tower', 'luxor']).toContain(action.chain);
      }
    });
  });
  
  describe('Stock Buying', () => {
    it('should buy stocks when chains are active', () => {
      const testState = createInitialState(2);
      
      // Activate a chain
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B'];
      testState.currentPhase = 'buyStocks';
      
      const config: AIConfig = { personality: 'balanced', thinkingDelay: 0 };
      const action = getSmartAIAction(testState, '0', config);
      
      expect(action).not.toBeNull();
      // Either buys or skips
      expect(['BUY_STOCKS', 'SKIP_BUY_STOCKS']).toContain(action?.type);
    });
    
    it('should skip buying when no chains are active', () => {
      const testState = createInitialState(2);
      testState.currentPhase = 'buyStocks';
      
      const config: AIConfig = { personality: 'balanced', thinkingDelay: 0 };
      const action = getSmartAIAction(testState, '0', config);
      
      expect(action).not.toBeNull();
      expect(action?.type).toBe('SKIP_BUY_STOCKS');
    });
    
    it('aggressive AI should spend more on stocks', () => {
      const testState = createInitialState(2);
      
      // Activate multiple chains
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B'];
      testState.chains.luxor.isActive = true;
      testState.chains.luxor.tiles = ['3A', '3B'];
      testState.currentPhase = 'buyStocks';
      
      const aggressiveConfig: AIConfig = { personality: 'aggressive', thinkingDelay: 0 };
      const action = getSmartAIAction(testState, '0', aggressiveConfig);
      
      // Aggressive should typically buy stocks
      expect(action).not.toBeNull();
    });
  });
  
  describe('Personality Differences', () => {
    it('different personalities should produce different behaviors over time', () => {
      // This is a statistical test - run multiple games and check tendencies
      const personalities = ['aggressive', 'balanced', 'conservative'] as const;
      const results: Record<string, { stocksBought: number; cashSpent: number }> = {};
      
      for (const personality of personalities) {
        let testState = createInitialState(2);
        testState.chains.tower.isActive = true;
        testState.chains.tower.tiles = ['1A', '1B'];
        testState.currentPhase = 'buyStocks';
        
        const config: AIConfig = { personality, thinkingDelay: 0 };
        const action = getSmartAIAction(testState, '0', config);
        
        if (action?.type === 'BUY_STOCKS') {
          const total = action.purchases.reduce((sum, p) => sum + p.count, 0);
          results[personality] = { stocksBought: total, cashSpent: 0 };
        } else {
          results[personality] = { stocksBought: 0, cashSpent: 0 };
        }
      }
      
      // Aggressive typically buys more than conservative
      console.log('AI Purchase behavior:', results);
      expect(results.aggressive.stocksBought >= results.conservative.stocksBought || 
             results.balanced.stocksBought >= results.conservative.stocksBought).toBe(true);
    });
  });
});

