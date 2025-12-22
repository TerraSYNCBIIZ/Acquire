// ============================================================================
// ChainInfo - Hotel chain information panel with icons
// ============================================================================

import { AcquireGameState } from '../../game/types';
import { CHAIN_NAMES, CHAIN_COLORS, CHAIN_DISPLAY_NAMES, getStockPrice } from '../../game/constants';
import { ChainIcon } from '../Icons/ChainIcons';
import { Shield } from 'lucide-react';

interface ChainInfoProps {
  state: AcquireGameState;
}

export function ChainInfo({ state }: ChainInfoProps) {
  return (
    <div className="card chain-info-card">
      <h4>Hotel Chains</h4>
      <div className="chain-list">
        {CHAIN_NAMES.map(chain => {
          const chainState = state.chains[chain];
          const size = chainState.tiles.length;
          const price = size >= 2 ? getStockPrice(chain, size) : 0;
          const available = state.stockMarket[chain];

          return (
            <div
              key={chain}
              className={`chain-card ${chainState.isActive ? 'active' : 'inactive'}`}
              style={{ '--chain-color': CHAIN_COLORS[chain] } as React.CSSProperties}
            >
              <div className="chain-icon-wrap" style={{ background: CHAIN_COLORS[chain] }}>
                <ChainIcon chain={chain} size={16} />
              </div>
              <div className="chain-details">
                <div className="chain-name-row">
                  <span className="chain-name">{CHAIN_DISPLAY_NAMES[chain]}</span>
                  {chainState.isSafe && (
                    <span className="chain-safe-badge">
                      <Shield size={10} />
                      SAFE
                    </span>
                  )}
                </div>
                <div className="chain-stats">
                  {chainState.isActive ? (
                    <>
                      <span className="stat">{size} tiles</span>
                      <span className="stat-divider">•</span>
                      <span className="stat price">${price}</span>
                      <span className="stat-divider">•</span>
                      <span className="stat stock">{available} shares</span>
                    </>
                  ) : (
                    <span className="stat inactive-text">Not founded</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
