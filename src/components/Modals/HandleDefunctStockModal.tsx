// ============================================================================
// HandleDefunctStockModal - Modal for handling defunct chain stock
// ============================================================================

import { useState } from 'react';
import { AcquireGameState } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { CHAIN_DISPLAY_NAMES, getStockPrice } from '../../game/constants';

interface HandleDefunctStockModalProps {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
  inline?: boolean;
}

export function HandleDefunctStockModal({ state, playerId, onAction, inline }: HandleDefunctStockModalProps) {
  const [sell, setSell] = useState(0);
  const [trade, setTrade] = useState(0);

  if (!state.mergerState || !state.mergerState.survivorChain) return null;

  const { defunctChains, currentDefunctIndex, survivorChain } = state.mergerState;
  const defunctChain = defunctChains[currentDefunctIndex];
  const player = state.players[playerId];
  const holdings = player.stocks[defunctChain];

  const hold = holdings - sell - (trade * 2);

  const maxTrade = Math.min(
    Math.floor(holdings / 2),
    state.stockMarket[survivorChain]
  );

  const chainSize = state.chains[defunctChain].tiles.length;
  const sellPrice = getStockPrice(defunctChain, chainSize);

  const handleConfirm = () => {
    onAction({ type: 'HANDLE_DEFUNCT_STOCK', playerId, hold, sell, trade });
  };

  const content = (
    <>
      <h3 className="action-title">Handle Stock</h3>
      <p style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        {CHAIN_DISPLAY_NAMES[defunctChain]} → {CHAIN_DISPLAY_NAMES[survivorChain]}
        <br />You have <strong>{holdings}</strong> stocks
      </p>

      <div className="stock-decisions">
        <div className="stock-decision-row">
          <span>Sell (${sellPrice})</span>
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => setSell(Math.max(0, sell - 1))} disabled={sell === 0}>-</button>
            <span className="qty-value">{sell}</span>
            <button className="qty-btn" onClick={() => setSell(Math.min(holdings - trade * 2, sell + 1))} disabled={sell + trade * 2 >= holdings}>+</button>
          </div>
        </div>

        <div className="stock-decision-row">
          <span>Trade 2:1</span>
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => setTrade(Math.max(0, trade - 1))} disabled={trade === 0}>-</button>
            <span className="qty-value">{trade}</span>
            <button className="qty-btn" onClick={() => setTrade(Math.min(maxTrade, trade + 1))} disabled={trade >= maxTrade || sell + (trade + 1) * 2 > holdings}>+</button>
          </div>
        </div>

        <div className="stock-decision-summary">
          Hold: {hold} | Sell: {sell} | Trade: {trade * 2}→{trade}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleConfirm} style={{ width: '100%', marginTop: '0.75rem' }}>
        Confirm
      </button>
    </>
  );

  if (inline) {
    return <div className="action-panel inline">{content}</div>;
  }

  return (
    <div className="modal-overlay">
      <div className="modal slide-up">{content}</div>
    </div>
  );
}
