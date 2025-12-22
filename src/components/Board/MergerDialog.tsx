// ============================================================================
// ACQUIRE DIGITAL - Merger Resolution Dialog
// ============================================================================

import React, { useState } from 'react';
import { AcquireGameState, ChainName, MergerState } from '../../game/types';
import { 
  CHAIN_DISPLAY_NAMES, 
  CHAIN_COLORS, 
  getStockPrice,
} from '../../game/constants';

// ============================================================================
// CHOOSE SURVIVOR DIALOG
// ============================================================================

interface ChooseSurvivorProps {
  G: AcquireGameState;
  chains: ChainName[];
  onChoose: (chain: ChainName) => void;
}

export const ChooseSurvivorDialog: React.FC<ChooseSurvivorProps> = ({ 
  G, 
  chains, 
  onChoose 
}) => {
  // Find largest chains (these are the ones tied for size)
  const maxSize = Math.max(...chains.map(c => G.chains[c].tiles.length));
  const largestChains = chains.filter(c => G.chains[c].tiles.length === maxSize);
  
  return (
    <div className="modal-overlay">
      <div className="modal slide-up">
        <h3>Choose Merger Survivor</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Multiple chains are tied at {maxSize} tiles. Select which chain survives:
        </p>
        <div className="chain-options">
          {largestChains.map(chain => (
            <div
              key={chain}
              className="chain-option"
              onClick={() => onChoose(chain)}
            >
              <div 
                className="chain-color" 
                style={{ 
                  background: CHAIN_COLORS[chain],
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {CHAIN_DISPLAY_NAMES[chain]}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {G.chains[chain].tiles.length} tiles
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DEFUNCT STOCK DECISION DIALOG
// ============================================================================

interface StockDecisionProps {
  G: AcquireGameState;
  mergerState: MergerState;
  playerId: string;
  onDecide: (hold: number, sell: number, trade: number) => void;
}

export const StockDecisionDialog: React.FC<StockDecisionProps> = ({
  G,
  mergerState,
  playerId,
  onDecide,
}) => {
  const defunctChain = mergerState.defunctChains[mergerState.currentDefunctIndex];
  const survivorChain = mergerState.survivorChain!;
  const playerStocks = G.players[playerId].stocks[defunctChain];
  const chainSize = G.chains[defunctChain].tiles.length;
  const stockPrice = getStockPrice(defunctChain, chainSize);
  const availableSurvivorStock = G.stockMarket[survivorChain];
  
  const [hold, setHold] = useState(0);
  const [sell, setSell] = useState(0);
  const [trade, setTrade] = useState(0);
  
  const tradeIn = trade * 2; // 2 defunct = 1 survivor
  const total = hold + sell + tradeIn;
  const remaining = playerStocks - total;
  const isValid = remaining === 0;
  const sellValue = sell * stockPrice;
  
  const maxTradeable = Math.min(
    Math.floor((playerStocks - hold - sell) / 2),
    availableSurvivorStock
  );
  
  const updateHold = (delta: number) => {
    const newVal = Math.max(0, Math.min(hold + delta, playerStocks - sell - tradeIn));
    setHold(newVal);
  };
  
  const updateSell = (delta: number) => {
    const newVal = Math.max(0, Math.min(sell + delta, playerStocks - hold - tradeIn));
    setSell(newVal);
  };
  
  const updateTrade = (delta: number) => {
    const newVal = Math.max(0, Math.min(trade + delta, maxTradeable));
    setTrade(newVal);
  };
  
  const handleConfirm = () => {
    if (isValid) {
      onDecide(hold, sell, trade);
    }
  };
  
  // Quick actions
  const handleSellAll = () => {
    setHold(0);
    setTrade(0);
    setSell(playerStocks);
  };
  
  const handleHoldAll = () => {
    setSell(0);
    setTrade(0);
    setHold(playerStocks);
  };
  
  const handleTradeAll = () => {
    setHold(0);
    setSell(0);
    const maxPairs = Math.floor(playerStocks / 2);
    const actualTrade = Math.min(maxPairs, availableSurvivorStock);
    setTrade(actualTrade);
    // Hold any remaining odd share
    if (playerStocks % 2 === 1 && actualTrade === maxPairs) {
      setHold(1);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal slide-up" style={{ maxWidth: '550px' }}>
        <h3>Handle Defunct Stock</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          <span style={{ color: CHAIN_COLORS[defunctChain], fontWeight: 600 }}>
            {CHAIN_DISPLAY_NAMES[defunctChain]}
          </span>
          {' '}is being absorbed by{' '}
          <span style={{ color: CHAIN_COLORS[survivorChain], fontWeight: 600 }}>
            {CHAIN_DISPLAY_NAMES[survivorChain]}
          </span>
        </p>
        
        <div style={{ 
          background: 'var(--bg-elevated)', 
          padding: '1rem', 
          borderRadius: 'var(--border-radius)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Your {CHAIN_DISPLAY_NAMES[defunctChain]} shares:</span>
            <span className="mono" style={{ fontWeight: 600 }}>{playerStocks}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Stock price:</span>
            <span className="mono">${stockPrice}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Hold */}
          <div className="stock-option">
            <span style={{ flex: 1 }}>Hold (keep shares)</span>
            <div className="stock-quantity">
              <button className="qty-btn" onClick={() => updateHold(-1)} disabled={hold === 0}>-</button>
              <span className="qty-value">{hold}</span>
              <button className="qty-btn" onClick={() => updateHold(1)} disabled={remaining === 0}>+</button>
            </div>
          </div>
          
          {/* Sell */}
          <div className="stock-option">
            <span style={{ flex: 1 }}>
              Sell (${stockPrice}/share)
              {sell > 0 && <span style={{ color: 'var(--color-success)' }}> = ${sellValue}</span>}
            </span>
            <div className="stock-quantity">
              <button className="qty-btn" onClick={() => updateSell(-1)} disabled={sell === 0}>-</button>
              <span className="qty-value">{sell}</span>
              <button className="qty-btn" onClick={() => updateSell(1)} disabled={remaining === 0}>+</button>
            </div>
          </div>
          
          {/* Trade */}
          <div className="stock-option">
            <span style={{ flex: 1 }}>
              Trade 2:1 for {CHAIN_DISPLAY_NAMES[survivorChain]}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {' '}({availableSurvivorStock} available)
              </span>
            </span>
            <div className="stock-quantity">
              <button className="qty-btn" onClick={() => updateTrade(-1)} disabled={trade === 0}>-</button>
              <span className="qty-value">{trade}</span>
              <button className="qty-btn" onClick={() => updateTrade(1)} disabled={trade >= maxTradeable || remaining < 2}>+</button>
            </div>
          </div>
          
          {trade > 0 && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              paddingLeft: '1rem' 
            }}>
              Trading {tradeIn} {CHAIN_DISPLAY_NAMES[defunctChain]} for {trade} {CHAIN_DISPLAY_NAMES[survivorChain]}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleHoldAll} style={{ flex: 1 }}>
            Hold All
          </button>
          <button className="btn btn-secondary" onClick={handleSellAll} style={{ flex: 1 }}>
            Sell All
          </button>
          <button className="btn btn-secondary" onClick={handleTradeAll} style={{ flex: 1 }}>
            Trade All
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '0.75rem 0',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '1rem'
        }}>
          <span>Remaining to allocate:</span>
          <span style={{ 
            color: remaining === 0 ? 'var(--color-success)' : 'var(--color-error)',
            fontWeight: 600
          }}>
            {remaining}
          </span>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleConfirm}
          disabled={!isValid}
          style={{ width: '100%' }}
        >
          Confirm Decision
        </button>
      </div>
    </div>
  );
};


