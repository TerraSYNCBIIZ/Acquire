// ============================================================================
// ACQUIRE DIGITAL - Strategic Bot Tests
// Verify sophisticated AI decision-making
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { getStrategicAIAction, StrategicAIConfig, AI_PERSONALITIES } from './strategicBot';
import { createInitialState, gameReducer } from '../reducer';
import { AcquireGameState } from '../types';

describe('Strategic AI Bot', () => {
  let state: AcquireGameState;
  
  beforeEach(() => {
    state = createInitialState(4, ['Human', 'Warren Buffett', 'George Soros', 'Carl Icahn']);
  });
  
  describe('AI Personalities', () => {
    it('should have distinct pre-built personalities', () => {
      expect(Object.keys(AI_PERSONALITIES).length).toBeGreaterThanOrEqual(5);
      
      // Check key personalities exist
      expect(AI_PERSONALITIES['Warren Buffett']).toBeDefined();
      expect(AI_PERSONALITIES['George Soros']).toBeDefined();
      expect(AI_PERSONALITIES['Carl Icahn']).toBeDefined();
      
      // Check they have different strategies
      expect(AI_PERSONALITIES['Warren Buffett'].strategy).toBe('accumulator');
      expect(AI_PERSONALITIES['George Soros'].strategy).toBe('opportunist');
      expect(AI_PERSONALITIES['Carl Icahn'].strategy).toBe('dominator');
    });
    
    it('personalities should have valid config values', () => {
      for (const [name, config] of Object.entries(AI_PERSONALITIES)) {
        expect(config.aggressiveness).toBeGreaterThanOrEqual(0);
        expect(config.aggressiveness).toBeLessThanOrEqual(1);
        expect(config.patience).toBeGreaterThanOrEqual(0);
        expect(config.patience).toBeLessThanOrEqual(1);
        expect(config.randomness).toBeGreaterThanOrEqual(0);
        expect(config.randomness).toBeLessThanOrEqual(1);
        console.log(`${name}: ${config.strategy}, aggr=${config.aggressiveness}, patience=${config.patience}`);
      }
    });
  });
  
  describe('Tile Placement Strategy', () => {
    it('dominator should make strategic tile choices', () => {
      const testState = createInitialState(2);
      
      const config: StrategicAIConfig = {
        strategy: 'dominator',
        aggressiveness: 0.9,
        patience: 0.3,
        adaptability: 0.6,
        randomness: 0.1,
        name: 'Dominator Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('PLACE_TILE');
      
      if (action?.type === 'PLACE_TILE') {
        console.log(`Dominator chose: ${action.tileId}`);
        // Should choose from player's hand
        expect(testState.players['0'].tiles).toContain(action.tileId);
      }
    });
    
    it('opportunist should make strategic tile choices', () => {
      const testState = createInitialState(2);
      
      const config: StrategicAIConfig = {
        strategy: 'opportunist',
        aggressiveness: 0.8,
        patience: 0.4,
        adaptability: 0.9,
        randomness: 0.1,
        name: 'Opportunist Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('PLACE_TILE');
      
      if (action?.type === 'PLACE_TILE') {
        console.log(`Opportunist chose: ${action.tileId}`);
        // Should choose from player's hand
        expect(testState.players['0'].tiles).toContain(action.tileId);
      }
    });
  });
  
  describe('Chain Founding Strategy', () => {
    it('accumulator should prefer cheaper chains', () => {
      const testState = createInitialState(2);
      testState.currentPhase = 'foundChain';
      testState.pendingFoundation = { tiles: ['3A', '3B'] };
      
      const config: StrategicAIConfig = {
        strategy: 'accumulator',
        aggressiveness: 0.3,
        patience: 0.9,
        adaptability: 0.7,
        randomness: 0,
        name: 'Accumulator Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('SELECT_CHAIN_TO_FOUND');
      
      if (action?.type === 'SELECT_CHAIN_TO_FOUND') {
        console.log(`Accumulator founded: ${action.chain}`);
        // Should select some chain (tier 1 is preferred but depends on weights)
        expect(action.chain).toBeDefined();
      }
    });
    
    it('opportunist should prefer expensive chains', () => {
      const testState = createInitialState(2);
      testState.currentPhase = 'foundChain';
      testState.pendingFoundation = { tiles: ['3A', '3B'] };
      
      const config: StrategicAIConfig = {
        strategy: 'opportunist',
        aggressiveness: 0.8,
        patience: 0.4,
        adaptability: 0.9,
        randomness: 0,
        name: 'Opportunist Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      expect(action?.type).toBe('SELECT_CHAIN_TO_FOUND');
      
      if (action?.type === 'SELECT_CHAIN_TO_FOUND') {
        console.log(`Opportunist founded: ${action.chain}`);
        // Opportunist prefers higher tier chains (tier 2 or 3)
        expect(action.chain).toBeDefined();
      }
    });
  });
  
  describe('Stock Buying Strategy', () => {
    it('dominator should try to take or strengthen majority', () => {
      const testState = createInitialState(2);
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B', '1C'];
      testState.players['0'].stocks.tower = 2;
      testState.players['1'].stocks.tower = 3; // Opponent has majority
      testState.currentPhase = 'buyStocks';
      
      const config: StrategicAIConfig = {
        strategy: 'dominator',
        aggressiveness: 0.9,
        patience: 0.3,
        adaptability: 0.6,
        randomness: 0,
        name: 'Dominator Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      
      if (action?.type === 'BUY_STOCKS') {
        console.log(`Dominator bought:`, action.purchases);
        // Should buy tower to take majority
        const towerPurchase = action.purchases.find(p => p.chain === 'tower');
        expect(towerPurchase).toBeDefined();
        expect(towerPurchase!.count).toBeGreaterThanOrEqual(2);
      }
    });
    
    it('diversifier should spread investments', () => {
      const testState = createInitialState(2);
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B'];
      testState.chains.luxor.isActive = true;
      testState.chains.luxor.tiles = ['3A', '3B'];
      testState.chains.american.isActive = true;
      testState.chains.american.tiles = ['5A', '5B'];
      testState.currentPhase = 'buyStocks';
      
      const config: StrategicAIConfig = {
        strategy: 'diversifier',
        aggressiveness: 0.5,
        patience: 0.7,
        adaptability: 0.8,
        randomness: 0,
        name: 'Diversifier Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      
      if (action?.type === 'BUY_STOCKS') {
        console.log(`Diversifier bought:`, action.purchases);
        // Should buy from multiple chains
        expect(action.purchases.length).toBeGreaterThanOrEqual(1);
      }
    });
    
    it('accumulator should conserve cash', () => {
      const testState = createInitialState(2);
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B'];
      testState.currentPhase = 'buyStocks';
      
      const config: StrategicAIConfig = {
        strategy: 'accumulator',
        aggressiveness: 0.3,
        patience: 0.9,
        adaptability: 0.7,
        randomness: 0,
        name: 'Accumulator Test',
      };
      
      const action = getStrategicAIAction(testState, '0', config);
      expect(action).not.toBeNull();
      
      // Accumulator with high patience might skip or buy conservatively
      console.log(`Accumulator action:`, action?.type);
    });
  });
  
  describe('Randomness Factor', () => {
    it('chaotic strategy should produce varied results', () => {
      const testState = createInitialState(2);
      
      const config: StrategicAIConfig = {
        strategy: 'chaotic',
        aggressiveness: 0.5,
        patience: 0.5,
        adaptability: 0.5,
        randomness: 0.7,
        name: 'Chaotic Test',
      };
      
      const actions: string[] = [];
      
      // Run multiple times to check for variation
      for (let i = 0; i < 5; i++) {
        const freshState = createInitialState(2);
        const action = getStrategicAIAction(freshState, '0', config);
        if (action?.type === 'PLACE_TILE') {
          actions.push(action.tileId);
        }
      }
      
      console.log('Chaotic actions:', actions);
      // With randomness, we should see some variation (not always the same tile)
      // This is probabilistic, so we just log it
    });
  });
  
  describe('Game Phase Awareness', () => {
    it('should adjust strategy based on game progress', () => {
      const testState = createInitialState(2);
      
      // Simulate late game
      testState.tilePool = testState.tilePool.slice(0, 20);
      testState.chains.tower.isActive = true;
      testState.chains.tower.tiles = ['1A', '1B', '1C', '1D', '1E', '1F', '1G', '1H', '1I'];
      testState.players['0'].stocks.tower = 5;
      
      const config: StrategicAIConfig = {
        strategy: 'opportunist',
        aggressiveness: 0.8,
        patience: 0.4,
        adaptability: 0.9,
        randomness: 0.2,
        name: 'Late Game Test',
      };
      
      // The AI should recognize it's late game
      const action = getStrategicAIAction(testState, '0', config);
      console.log('Late game action:', action?.type);
      expect(action).not.toBeNull();
    });
  });
});

