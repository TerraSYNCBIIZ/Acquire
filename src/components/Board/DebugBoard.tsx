// ============================================================================
// DEBUG BOARD - Ultra-simple test to verify game engine works
// ============================================================================

import React from 'react';
import { BoardProps } from 'boardgame.io/react';
import { AcquireGameState, TileId } from '../../game/types';
import { isTilePlayable } from '../../game/logic/board';

export const DebugBoard: React.FC<BoardProps<AcquireGameState>> = ({ 
  G, 
  ctx, 
  moves, 
  playerID 
}) => {
  console.log('=== DEBUG BOARD RENDER ===');
  console.log('G.currentPhase:', G.currentPhase);
  console.log('ctx.phase:', ctx.phase);
  console.log('ctx.currentPlayer:', ctx.currentPlayer);
  console.log('playerID prop:', playerID);
  console.log('G.turnState:', G.turnState);
  console.log('moves available:', Object.keys(moves));

  const currentPlayer = G.players[ctx.currentPlayer];
  const playerTiles = currentPlayer?.tiles || [];

  console.log('Current player tiles:', playerTiles);

  // Find a playable tile
  const playableTiles = playerTiles.filter(t => isTilePlayable(G, t));
  console.log('Playable tiles:', playableTiles);

  const handlePlaceTile = (tileId: TileId) => {
    console.log('>>> ATTEMPTING TO PLACE TILE:', tileId);
    try {
      const result = moves.placeTile(tileId);
      console.log('>>> placeTile result:', result);
    } catch (err) {
      console.error('>>> placeTile ERROR:', err);
    }
  };

  const handleSkipBuy = () => {
    console.log('>>> ATTEMPTING TO SKIP BUY');
    try {
      const result = moves.skipBuyStocks();
      console.log('>>> skipBuyStocks result:', result);
    } catch (err) {
      console.error('>>> skipBuyStocks ERROR:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      background: '#1a1a2e',
      color: '#eee',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#0f0' }}>DEBUG MODE</h1>
      
      <div style={{ 
        background: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Game State</h2>
        <p><strong>G.currentPhase:</strong> <span style={{ color: '#ff0' }}>{G.currentPhase}</span></p>
        <p><strong>ctx.phase:</strong> <span style={{ color: '#ff0' }}>{ctx.phase || 'null'}</span></p>
        <p><strong>ctx.currentPlayer:</strong> <span style={{ color: '#0ff' }}>{ctx.currentPlayer}</span></p>
        <p><strong>playerID prop:</strong> <span style={{ color: '#0ff' }}>{playerID || 'null'}</span></p>
        <p><strong>hasPlayedTile:</strong> {String(G.turnState.hasPlayedTile)}</p>
        <p><strong>hasBoughtStocks:</strong> {String(G.turnState.hasBoughtStocks)}</p>
      </div>

      <div style={{ 
        background: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Player {ctx.currentPlayer}'s Tiles</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {playerTiles.map(tile => {
            const isPlayable = isTilePlayable(G, tile);
            return (
              <button
                key={tile}
                onClick={() => handlePlaceTile(tile)}
                style={{
                  padding: '15px 25px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  background: isPlayable ? '#0a0' : '#555',
                  color: '#fff',
                  border: '2px solid ' + (isPlayable ? '#0f0' : '#888'),
                  borderRadius: '8px',
                }}
              >
                {tile}
                {isPlayable && ' ✓'}
              </button>
            );
          })}
        </div>
        <p style={{ marginTop: '10px', color: '#888' }}>
          Click any tile to attempt placeTile move
        </p>
      </div>

      <div style={{ 
        background: '#333', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Actions</h2>
        <button
          onClick={handleSkipBuy}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#06b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            marginRight: '10px',
          }}
        >
          Skip Buy Stocks
        </button>
      </div>

      <div style={{ 
        background: '#222', 
        padding: '15px', 
        borderRadius: '8px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <h2>Game Log</h2>
        {G.log.map((entry, i) => (
          <div key={i} style={{ color: '#aaa', fontSize: '12px' }}>{entry}</div>
        ))}
      </div>

      <div style={{ 
        background: '#400', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2 style={{ color: '#f88' }}>Check Browser Console (F12)</h2>
        <p>All interactions are logged to the browser console.</p>
        <p>If clicking tiles does nothing, check console for errors.</p>
      </div>
    </div>
  );
};

