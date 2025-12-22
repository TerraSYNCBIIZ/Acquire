// ============================================================================
// StockPurchasePanel - UI for buying stocks
// ============================================================================

import { useState } from 'react';
import { AcquireGameState, ChainName, StockPurchase } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { CHAIN_NAMES, CHAIN_COLORS, getStockPrice } from '../../game/constants';

interface StockPurchasePanelProps {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
}

export function StockPurchasePanel({ state, playerId, onAction }: StockPurchasePanelProps) {
  const [quantities, setQuantities] = useState<Record<ChainName, number>>({
    tower: 0, luxor: 0, american: 0, worldwide: 0, festival: 0, continental: 0, imperial: 0,
  });

  const player = state.players[playerId];
  if (!player) return null;

  const activeChains = CHAIN_NAMES.filter(chain => state.chains[chain].isActive);
  const totalStocks = Object.values(quantities).reduce((a, b) => a + b, 0);

  const calculateTotal = () => {
    let total = 0;
    for (const chain of activeChains) {
      const size = state.chains[chain].tiles.length;
      const price = getStockPrice(chain, size);
      total += quantities[chain] * price;
    }
    return total;
  };

  const totalCost = calculateTotal();
  const canAfford = totalCost <= player.cash;

  const updateQuantity = (chain: ChainName, delta: number) => {
    const newQty = Math.max(0, Math.min(
      quantities[chain] + delta,
      state.stockMarket[chain],
      3 - totalStocks + quantities[chain],
    ));
    setQuantities({ ...quantities, [chain]: newQty });
  };

  const handleBuy = () => {
    const purchases: StockPurchase[] = [];
    for (const chain of activeChains) {
      if (quantities[chain] > 0) {
        purchases.push({ chain, count: quantities[chain] });
      }
    }
    onAction({ type: 'BUY_STOCKS', playerId, purchases });
  };

  const handleSkip = () => {
    onAction({ type: 'SKIP_BUY_STOCKS', playerId });
  };

  if (activeChains.length === 0) {
    return (
      <div className="action-panel inline">
        <h3 className="action-title">No Active Chains</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          No chains have been founded yet.
        </p>
        <button className="btn btn-primary" onClick={handleSkip}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="action-panel inline">
      <h3 className="action-title">Buy Stocks (max 3)</h3>
      <div className="stock-purchase">
        {activeChains.map(chain => {
          const size = state.chains[chain].tiles.length;
          const price = getStockPrice(chain, size);
          const available = state.stockMarket[chain];

          return (
            <div key={chain} className="stock-option">
              <div
                className="chain-color"
                style={{ background: CHAIN_COLORS[chain], width: 20, height: 20, borderRadius: 4 }}
              />
              <span style={{ flex: 1, textTransform: 'capitalize' }}>{chain}</span>
              <div className="stock-quantity">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(chain, -1)}
                  disabled={quantities[chain] === 0}
                >-</button>
                <span className="qty-value">{quantities[chain]}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(chain, 1)}
                  disabled={totalStocks >= 3 || quantities[chain] >= available}
                >+</button>
              </div>
              <span className="stock-price">${price} ({available} left)</span>
            </div>
          );
        })}

        <div className="purchase-total">
          <span>Total ({totalStocks}/3)</span>
          <span style={{ color: canAfford ? 'var(--color-success)' : 'var(--color-error)' }}>
            ${totalCost.toLocaleString()}
          </span>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={handleBuy}
            disabled={!canAfford || totalStocks === 0}
          >
            Buy
          </button>
          <button className="btn btn-secondary" onClick={handleSkip}>
            Skip
          </button>
        </div>
        <GameEndButton state={state} playerId={playerId} onAction={onAction} />
      </div>
    </div>
  );
}

// Game End Declaration Button
function GameEndButton({ state, playerId, onAction }: {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
}) {
  const activeChains = CHAIN_NAMES.filter(name => state.chains[name].isActive);

  const hasLargeChain = activeChains.some(
    chain => state.chains[chain].tiles.length >= 41
  );
  const allSafe = activeChains.length > 0 &&
    activeChains.every(chain => state.chains[chain].isSafe);

  const canDeclareEnd = hasLargeChain || allSafe;

  if (!canDeclareEnd) return null;

  return (
    <div className="game-end-option" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ color: 'var(--color-warning)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        {hasLargeChain
          ? 'A chain has reached 41+ tiles - you may declare game end!'
          : 'All chains are safe (11+ tiles) - you may declare game end!'}
      </div>
      <button
        className="btn btn-warning"
        onClick={() => onAction({ type: 'DECLARE_GAME_END', playerId })}
        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
      >
        Declare Game End
      </button>
    </div>
  );
}

