// ============================================================================
// GameOverScreen - Game over display with final scoring
// ============================================================================

import { useState } from 'react';
import { AcquireGameState, ChainName } from '../../game/types';
import { PlayerConfig } from '../Setup';
import { CHAIN_NAMES, CHAIN_DISPLAY_NAMES, getStockPrice, getMajorityBonus, getMinorityBonus } from '../../game/constants';
import { ChevronDown, ChevronUp, Trophy, DollarSign, TrendingUp, Award } from 'lucide-react';

interface GameOverScreenProps {
  state: AcquireGameState;
  playerConfigs: PlayerConfig[];
  onBack: () => void;
}

interface ScoreBreakdown {
  cash: number;
  stockValue: number;
  bonuses: number;
  total: number;
  stockDetails: { chain: ChainName; count: number; price: number; value: number }[];
  bonusDetails: { chain: ChainName; type: 'majority' | 'minority'; amount: number }[];
}

function calculateDetailedScores(
  state: AcquireGameState,
  playerId: string
): ScoreBreakdown {
  const player = state.players[playerId];
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);
  
  const cash = player.cash;
  let stockValue = 0;
  let bonuses = 0;
  const stockDetails: ScoreBreakdown['stockDetails'] = [];
  const bonusDetails: ScoreBreakdown['bonusDetails'] = [];
  
  for (const chain of activeChains) {
    const chainSize = state.chains[chain].tiles.length;
    const price = getStockPrice(chain, chainSize);
    const stockCount = player.stocks[chain];
    
    if (stockCount > 0) {
      const value = stockCount * price;
      stockValue += value;
      stockDetails.push({ chain, count: stockCount, price, value });
    }
    
    // Calculate bonuses for this chain
    const stockholders: { playerId: string; count: number }[] = [];
    for (const pid of Object.keys(state.players)) {
      const count = state.players[pid].stocks[chain];
      if (count > 0) {
        stockholders.push({ playerId: pid, count });
      }
    }
    
    if (stockholders.length === 0) continue;
    stockholders.sort((a, b) => b.count - a.count);
    
    const majorityBonus = getMajorityBonus(chain, chainSize);
    const minorityBonus = getMinorityBonus(chain, chainSize);
    
    // Only one stockholder - gets both
    if (stockholders.length === 1 && stockholders[0].playerId === playerId) {
      bonuses += majorityBonus + minorityBonus;
      bonusDetails.push({ chain, type: 'majority', amount: majorityBonus + minorityBonus });
      continue;
    }
    
    // Check for majority
    const maxCount = stockholders[0].count;
    const majorityHolders = stockholders.filter(s => s.count === maxCount);
    
    if (majorityHolders.length > 1) {
      // Tie for majority - split majority + minority
      const isTied = majorityHolders.some(h => h.playerId === playerId);
      if (isTied) {
        const splitBonus = Math.ceil((majorityBonus + minorityBonus) / majorityHolders.length / 100) * 100;
        bonuses += splitBonus;
        bonusDetails.push({ chain, type: 'majority', amount: splitBonus });
      }
    } else {
      // Single majority holder
      if (majorityHolders[0].playerId === playerId) {
        bonuses += majorityBonus;
        bonusDetails.push({ chain, type: 'majority', amount: majorityBonus });
      } else {
        // Check for minority
        const remainingHolders = stockholders.slice(1);
        if (remainingHolders.length > 0) {
          const secondMaxCount = remainingHolders[0].count;
          const minorityHolders = remainingHolders.filter(s => s.count === secondMaxCount);
          
          if (minorityHolders.some(h => h.playerId === playerId)) {
            const splitBonus = minorityHolders.length > 1
              ? Math.ceil(minorityBonus / minorityHolders.length / 100) * 100
              : minorityBonus;
            bonuses += splitBonus;
            bonusDetails.push({ chain, type: 'minority', amount: splitBonus });
          }
        }
      }
    }
  }
  
  return {
    cash,
    stockValue,
    bonuses,
    total: cash + stockValue + bonuses,
    stockDetails,
    bonusDetails,
  };
}

export function GameOverScreen({ state, playerConfigs, onBack }: GameOverScreenProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const winner = state.winner;
  const winnerConfig = playerConfigs.find(p => p.id === winner);
  
  // Calculate detailed scores for all players
  const playerScores = playerConfigs.map(config => ({
    config,
    breakdown: calculateDetailedScores(state, config.id),
  }));
  
  // Sort by total score (descending)
  playerScores.sort((a, b) => b.breakdown.total - a.breakdown.total);

  return (
    <div className="modal-overlay">
      <div className="modal slide-up" style={{ textAlign: 'center', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Trophy size={28} color="var(--accent-gold)" />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Game Over!</h2>
        </div>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          {winnerConfig?.name || `Player ${winner}`} Wins!
        </h3>
        
        {/* Final Rankings with Expandable Breakdowns */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Final Standings &amp; Score Breakdown
          </h4>
          
          {playerScores.map(({ config, breakdown }, rank) => {
            const isWinner = config.id === winner;
            const isExpanded = expandedPlayer === config.id;
            
            return (
              <div key={config.id} style={{
                marginBottom: '0.5rem',
                background: isWinner 
                  ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05))' 
                  : 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: isWinner ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
              }}>
                {/* Player Header - Always Visible */}
                <div 
                  onClick={() => setExpandedPlayer(isExpanded ? null : config.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      color: rank === 0 ? 'var(--accent-gold)' : rank === 1 ? '#C0C0C0' : rank === 2 ? '#CD7F32' : 'var(--text-muted)',
                      minWidth: '32px',
                    }}>
                      #{rank + 1}
                    </span>
                    <span style={{ fontWeight: isWinner ? 'bold' : 'normal', fontSize: '1rem' }}>
                      {config.name}
                      {config.isAI && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>(AI)</span>}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="mono" style={{ 
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: isWinner ? 'var(--accent-gold)' : 'inherit'
                    }}>
                      ${breakdown.total.toLocaleString()}
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                
                {/* Expanded Breakdown */}
                {isExpanded && (
                  <div style={{ 
                    padding: '0 1rem 1rem 1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.85rem',
                  }}>
                    {/* Summary Row */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      padding: '0.75rem 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '0.5rem',
                    }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <DollarSign size={16} style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }} />
                        <div className="mono" style={{ fontWeight: 'bold' }}>${breakdown.cash.toLocaleString()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Cash</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <TrendingUp size={16} style={{ marginBottom: '0.25rem', color: 'var(--text-muted)' }} />
                        <div className="mono" style={{ fontWeight: 'bold' }}>${breakdown.stockValue.toLocaleString()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Stock Value</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <Award size={16} style={{ marginBottom: '0.25rem', color: 'var(--accent-gold)' }} />
                        <div className="mono" style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>${breakdown.bonuses.toLocaleString()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Bonuses</div>
                      </div>
                    </div>
                    
                    {/* Stock Details */}
                    {breakdown.stockDetails.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem' }}>STOCK HOLDINGS</div>
                        {breakdown.stockDetails.map(detail => (
                          <div key={detail.chain} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '0.2rem 0',
                          }}>
                            <span style={{ color: `var(--chain-${detail.chain})` }}>
                              {CHAIN_DISPLAY_NAMES[detail.chain]} ({detail.count} × ${detail.price})
                            </span>
                            <span className="mono">${detail.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Bonus Details */}
                    {breakdown.bonusDetails.length > 0 && (
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.25rem' }}>SHAREHOLDER BONUSES</div>
                        {breakdown.bonusDetails.map((detail, i) => (
                          <div key={`${detail.chain}-${i}`} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '0.2rem 0',
                          }}>
                            <span>
                              <span style={{ color: `var(--chain-${detail.chain})` }}>{CHAIN_DISPLAY_NAMES[detail.chain]}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                ({detail.type === 'majority' ? 'Majority' : 'Minority'})
                              </span>
                            </span>
                            <span className="mono" style={{ color: 'var(--accent-gold)' }}>+${detail.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {breakdown.stockDetails.length === 0 && breakdown.bonusDetails.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        Cash only - no stocks or bonuses
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <button className="btn btn-primary" onClick={onBack} style={{ width: '100%' }}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

