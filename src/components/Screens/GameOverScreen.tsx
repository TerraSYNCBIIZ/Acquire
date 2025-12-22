// ============================================================================
// GameOverScreen - Game over display with final scoring
// ============================================================================

import { AcquireGameState } from '../../game/types';
import { PlayerConfig } from '../Setup';
import { CHAIN_NAMES, CHAIN_DISPLAY_NAMES, getStockPrice } from '../../game/constants';

interface GameOverScreenProps {
  state: AcquireGameState;
  playerConfigs: PlayerConfig[];
  onBack: () => void;
}

export function GameOverScreen({ state, playerConfigs, onBack }: GameOverScreenProps) {
  const winner = state.winner;
  const winnerConfig = playerConfigs.find(p => p.id === winner);
  
  // Use final scores if available, otherwise fall back to cash
  const finalScores = state.finalScores || {};
  
  // Sort players by final score (descending)
  const sortedPlayers = [...playerConfigs].sort((a, b) => {
    const scoreA = finalScores[a.id] || state.players[a.id]?.cash || 0;
    const scoreB = finalScores[b.id] || state.players[b.id]?.cash || 0;
    return scoreB - scoreA;
  });

  // Get active chains for showing stock values
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);

  return (
    <div className="modal-overlay">
      <div className="modal slide-up" style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Game Over!</h2>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.25rem' }}>
          {winnerConfig?.name || `Player ${winner}`} Wins!
        </h3>
        
        {/* Final Rankings */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            FINAL STANDINGS
          </h4>
          {sortedPlayers.map((config, rank) => {
            const player = state.players[config.id];
            const finalScore = finalScores[config.id] || player?.cash || 0;
            const isWinner = config.id === winner;
            
            return (
              <div key={config.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                marginBottom: '0.25rem',
                background: isWinner 
                  ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.2), transparent)' 
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                borderLeft: isWinner ? '3px solid var(--accent-gold)' : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: rank === 0 ? 'var(--accent-gold)' : 'var(--text-muted)',
                    minWidth: '24px'
                  }}>
                    #{rank + 1}
                  </span>
                  <span style={{ fontWeight: isWinner ? 'bold' : 'normal' }}>
                    {config.name}
                  </span>
                </div>
                <span className="mono" style={{ 
                  fontWeight: 'bold',
                  color: isWinner ? 'var(--accent-gold)' : 'inherit'
                }}>
                  ${finalScore.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Score Breakdown for winner */}
        {winner && (
          <div style={{ 
            marginBottom: '1.5rem', 
            textAlign: 'left',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '4px',
            fontSize: '0.85rem'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {winnerConfig?.name}'S BREAKDOWN
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
              <span>Cash on hand:</span>
              <span className="mono">${state.players[winner]?.cash?.toLocaleString() || 0}</span>
            </div>
            {activeChains.map(chain => {
              const stockCount = state.players[winner]?.stocks[chain] || 0;
              if (stockCount === 0) return null;
              const chainSize = state.chains[chain].tiles.length;
              const price = getStockPrice(chain, chainSize);
              return (
                <div key={chain} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>{CHAIN_DISPLAY_NAMES[chain]} ({stockCount} x ${price}):</span>
                  <span className="mono">${(stockCount * price).toLocaleString()}</span>
                </div>
              );
            })}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.25rem 0',
              color: 'var(--accent-gold)',
              fontStyle: 'italic'
            }}>
              <span>+ Shareholder bonuses</span>
              <span>(included)</span>
            </div>
          </div>
        )}
        
        <button className="btn btn-primary" onClick={onBack} style={{ width: '100%' }}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

