import { describe, it, expect } from 'vitest';
import { setupGame } from '../setup';
import { 
  placeTile, 
  selectChainToFound, 
  skipBuyStocks, 
  buyStocks,
  chooseMergerSurvivor,
  handleDefunctStock 
} from '../moves';
import { AcquireGameState, Ctx } from '../types';

describe('Acquire Game Mechanics', () => {
  // Create a mock context object that matches boardgame.io 0.50+ format
  const createMoveCtx = (G: AcquireGameState, currentPlayer: string = '0') => ({
    G,
    ctx: {
      numPlayers: 2,
      turn: 1,
      currentPlayer,
      playOrder: ['0', '1'],
      playOrderPos: currentPlayer === '0' ? 0 : 1,
      phase: null,
    },
    events: {
      endPhase: () => {},
      endTurn: () => {},
      setPhase: () => {},
    },
  });

  it('should place a tile and transition to buyStocks phase', () => {
    const G = setupGame({ ctx: { numPlayers: 2 } } as any);
    const tileId = G.players['0'].tiles[0];

    // In boardgame.io 0.50+, moves mutate G directly
    placeTile(createMoveCtx(G, '0'), tileId);
    
    expect(G.turnState.hasPlayedTile).toBe(true);
    expect(G.currentPhase).toBe('buyStocks');
    expect(G.board.some(row => row.some(cell => cell.tile === tileId))).toBe(true);
    expect(G.players['0'].tiles).not.toContain(tileId);
  });

  it('should found a chain when tiles are adjacent', () => {
    const G = setupGame({ ctx: { numPlayers: 2 } } as any);
    // Force 1A and 1B to be in hands
    G.players['0'].tiles = ['1A', '3A', '5A', '7A', '9A', '11A'];
    G.players['1'].tiles = ['1B', '3B', '5B', '7B', '9B', '11B'];
    
    // Player 0 plays 1A
    placeTile(createMoveCtx(G, '0'), '1A');
    skipBuyStocks(createMoveCtx(G, '0'));
    
    // Player 1 plays 1B (adjacent to 1A, triggers founding)
    placeTile(createMoveCtx(G, '1'), '1B');
    
    expect(G.currentPhase).toBe('foundChain');
    expect(G.pendingFoundation).not.toBeNull();
    expect(G.pendingFoundation?.tiles).toContain('1A');
    expect(G.pendingFoundation?.tiles).toContain('1B');

    // Player 1 selects 'tower'
    selectChainToFound(createMoveCtx(G, '1'), 'tower');
    
    expect(G.chains.tower.isActive).toBe(true);
    expect(G.chains.tower.tiles).toContain('1A');
    expect(G.chains.tower.tiles).toContain('1B');
    expect(G.players['1'].stocks.tower).toBe(1); // Founder's bonus
    expect(G.currentPhase).toBe('buyStocks');
  });

  it('should expand an existing chain', () => {
    const G = setupGame({ ctx: { numPlayers: 2 } } as any);
    G.players['0'].tiles = ['1A', '2A', '5A', '7A', '9A', '11A'];
    G.players['1'].tiles = ['1B', '3B', '5B', '7B', '9B', '11B'];
    
    // Player 0 plays 1A
    placeTile(createMoveCtx(G, '0'), '1A');
    skipBuyStocks(createMoveCtx(G, '0'));
    
    // Player 1 plays 1B (founds chain)
    placeTile(createMoveCtx(G, '1'), '1B');
    selectChainToFound(createMoveCtx(G, '1'), 'tower');
    skipBuyStocks(createMoveCtx(G, '1'));
    
    // Player 0 plays 2A (adjacent to 1A which is now tower)
    placeTile(createMoveCtx(G, '0'), '2A');
    
    expect(G.chains.tower.tiles).toContain('2A');
    expect(G.chains.tower.tiles.length).toBe(3);
    expect(G.currentPhase).toBe('buyStocks');
  });

  it('should allow buying stocks', () => {
    const G = setupGame({ ctx: { numPlayers: 2 } } as any);
    G.players['0'].tiles = ['1A', '2A', '5A', '7A', '9A', '11A'];
    G.players['1'].tiles = ['1B', '3B', '5B', '7B', '9B', '11B'];
    
    // Setup: tower founded by player 1
    placeTile(createMoveCtx(G, '0'), '1A');
    skipBuyStocks(createMoveCtx(G, '0'));
    placeTile(createMoveCtx(G, '1'), '1B');
    selectChainToFound(createMoveCtx(G, '1'), 'tower');
    
    // Player 1 buys 3 stocks of tower (price for size 2 is $200)
    buyStocks(createMoveCtx(G, '1'), [{ chain: 'tower', count: 3 }]);
    
    expect(G.players['1'].stocks.tower).toBe(4); // 1 bonus + 3 bought
    expect(G.players['1'].cash).toBe(6000 - 600);
    expect(G.stockMarket.tower).toBe(21);
  });

  it('should handle a simple merger', () => {
    const G = setupGame({ ctx: { numPlayers: 2 } } as any);
    
    // Setup tiles
    G.players['0'].tiles = ['1A', '2A', '1B', '4A', '5A', '6A'];
    G.players['1'].tiles = ['1C', '2C', '4C', '5C', '6C', '7C'];
    
    // Found tower (player 0)
    placeTile(createMoveCtx(G, '0'), '1A');
    skipBuyStocks(createMoveCtx(G, '0'));
    placeTile(createMoveCtx(G, '0'), '2A');
    selectChainToFound(createMoveCtx(G, '0'), 'tower');
    skipBuyStocks(createMoveCtx(G, '0'));
    
    // Found luxor (player 1)
    placeTile(createMoveCtx(G, '1'), '1C');
    skipBuyStocks(createMoveCtx(G, '1'));
    placeTile(createMoveCtx(G, '1'), '2C');
    selectChainToFound(createMoveCtx(G, '1'), 'luxor');
    skipBuyStocks(createMoveCtx(G, '1'));

    // Player 0 plays 1B - connects tower and luxor
    placeTile(createMoveCtx(G, '0'), '1B');
    
    expect(G.currentPhase).toBe('resolveMerger');
    expect(G.mergerState).not.toBeNull();
    // Since both are same size (2), mergemaker must choose survivor
    expect(G.mergerState?.survivorChain).toBeNull();

    // Player 0 chooses tower as survivor
    chooseMergerSurvivor(createMoveCtx(G, '0'), 'tower');
    expect(G.mergerState?.survivorChain).toBe('tower');
    expect(G.mergerState?.defunctChains).toContain('luxor');
    
    // Player 1 should have received bonus after choosing survivor
    expect(G.players['1'].cash).toBe(6000 + 3000); // 6000 + 3000 bonus
    
    // Resolve defunct stocks for luxor (Player 1 has 1 stock)
    handleDefunctStock(createMoveCtx(G, '1'), 0, 1, 0);
    
    // Now they should have the sell price too
    expect(G.players['1'].cash).toBe(6000 + 3000 + 200); 
    
    expect(G.currentPhase).toBe('buyStocks');
    expect(G.chains.luxor.isActive).toBe(false);
    expect(G.chains.tower.tiles.length).toBe(5); // 2 (tower) + 2 (luxor) + 1 (merger tile)
  });
});
