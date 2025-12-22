// ============================================================================
// ACQUIRE DIGITAL - Main Game Board Component
// ============================================================================

import React, { useState } from 'react';
import { BoardProps } from 'boardgame.io/react';
import { AcquireGameState, ChainName, TileId, StockPurchase } from '../../game/types';
import { 
  BOARD_ROWS, 
  BOARD_COLS, 
  ROW_LABELS, 
  COL_LABELS,
  coordToTileId,
  CHAIN_NAMES,
  CHAIN_DISPLAY_NAMES,
  CHAIN_COLORS,
  getStockPrice,
} from '../../game/constants';
import { isTilePlayable } from '../../game/logic/board';
import { ChooseSurvivorDialog, StockDecisionDialog } from './MergerDialog';

// ============================================================================
// BOARD CELL COMPONENT
// ============================================================================

interface BoardCellProps {
  row: number;
  col: number;
  G: AcquireGameState;
  isPlayable: boolean;
  onCellClick: (tileId: TileId) => void;
}

const BoardCell: React.FC<BoardCellProps> = ({ row, col, G, isPlayable, onCellClick }) => {
  const tileId = coordToTileId(row, col);
  const cell = G.board[row][col];
  
  const hasChain = cell.chain !== null;
  const hasTile = cell.tile !== null;
  const isSafe = hasChain && G.chains[cell.chain!].isSafe;
  
  let className = 'board-cell';
  if (hasTile) className += ' has-tile';
  if (hasChain) className += ` chain-${cell.chain}`;
  if (isSafe) className += ' safe';
  if (isPlayable) className += ' playable';
  
  return (
    <div 
      className={className}
      onClick={() => isPlayable && onCellClick(tileId)}
      title={tileId}
    >
      {!hasTile && tileId}
      {hasTile && !hasChain && tileId}
      {hasChain && tileId}
    </div>
  );
};

// ============================================================================
// PLAYER HAND COMPONENT
// ============================================================================

interface PlayerHandProps {
  tiles: TileId[];
  selectedTile: TileId | null;
  G: AcquireGameState;
  onTileSelect: (tileId: TileId) => void;
  canPlay: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ tiles, selectedTile, G, onTileSelect, canPlay }) => {
  return (
    <div className="player-hand">
      <h4>Your Tiles</h4>
      <div className="hand-tiles">
        {tiles.map(tileId => {
          const playable = canPlay && isTilePlayable(G, tileId);
          let className = 'hand-tile';
          if (selectedTile === tileId) className += ' selected';
          if (!playable) className += ' unplayable';
          
          return (
            <button
              key={tileId}
              className={className}
              onClick={() => playable && onTileSelect(tileId)}
              disabled={!playable}
              aria-label={`Play tile ${tileId}`}
            >
              {tileId}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// CHAIN INFO COMPONENT
// ============================================================================

interface ChainInfoProps {
  G: AcquireGameState;
}

const ChainInfo: React.FC<ChainInfoProps> = ({ G }) => {
  return (
    <div className="card">
      <h4 style={{ marginBottom: '0.75rem' }}>Hotel Chains</h4>
      <div className="chain-list">
        {CHAIN_NAMES.map(chain => {
          const chainState = G.chains[chain];
          const size = chainState.tiles.length;
          const price = size >= 2 ? getStockPrice(chain, size) : 0;
          const available = G.stockMarket[chain];
          
          return (
            <div 
              key={chain} 
              className={`chain-card ${chainState.isActive ? 'active' : 'inactive'}`}
              style={{ color: CHAIN_COLORS[chain] }}
            >
              <div 
                className="chain-color" 
                style={{ background: CHAIN_COLORS[chain] }}
              />
              <div className="chain-details">
                <div className="chain-name">{CHAIN_DISPLAY_NAMES[chain]}</div>
                <div className="chain-stats">
                  {chainState.isActive ? (
                    <>
                      {size} tiles • ${price} • {available} left
                    </>
                  ) : (
                    'Not founded'
                  )}
                </div>
              </div>
              {chainState.isSafe && (
                <span className="chain-safe-badge">SAFE</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// PLAYER INFO COMPONENT
// ============================================================================

interface PlayerInfoProps {
  G: AcquireGameState;
  playerId: string;
  isCurrentPlayer: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ G, playerId, isCurrentPlayer }) => {
  const player = G.players[playerId];
  if (!player) return null;
  
  return (
    <div className={`player-info ${isCurrentPlayer ? 'current' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Player {playerId} {isCurrentPlayer && '(You)'}</h4>
        {isCurrentPlayer && <span style={{ color: 'var(--color-success)' }}>Your Turn</span>}
      </div>
      <div className="player-cash">${player.cash.toLocaleString()}</div>
      <div className="player-stocks">
        {CHAIN_NAMES.map(chain => {
          const count = player.stocks[chain];
          if (count === 0) return null;
          return (
            <div key={chain} className="stock-item">
              <div 
                className="chain-color" 
                style={{ 
                  background: CHAIN_COLORS[chain],
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                }}
              />
              <span className="stock-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// STOCK PURCHASE COMPONENT
// ============================================================================

interface StockPurchaseProps {
  G: AcquireGameState;
  playerCash: number;
  onPurchase: (purchases: StockPurchase[]) => void;
  onSkip: () => void;
}

const StockPurchasePanel: React.FC<StockPurchaseProps> = ({ G, playerCash, onPurchase, onSkip }) => {
  const [quantities, setQuantities] = useState<Record<ChainName, number>>({
    tower: 0, luxor: 0, american: 0, worldwide: 0, festival: 0, continental: 0, imperial: 0,
  });
  
  const activeChains = CHAIN_NAMES.filter(chain => G.chains[chain].isActive);
  const totalStocks = Object.values(quantities).reduce((a, b) => a + b, 0);
  
  const calculateTotal = () => {
    let total = 0;
    for (const chain of activeChains) {
      const size = G.chains[chain].tiles.length;
      const price = getStockPrice(chain, size);
      total += quantities[chain] * price;
    }
    return total;
  };
  
  const totalCost = calculateTotal();
  const canAfford = totalCost <= playerCash;
  const canBuyMore = totalStocks < 3;
  
  const updateQuantity = (chain: ChainName, delta: number) => {
    const newQty = Math.max(0, Math.min(
      quantities[chain] + delta,
      G.stockMarket[chain], // Max available
      3 - totalStocks + quantities[chain], // Max 3 total
    ));
    setQuantities({ ...quantities, [chain]: newQty });
  };
  
  const handleConfirm = () => {
    const purchases: StockPurchase[] = [];
    for (const chain of activeChains) {
      if (quantities[chain] > 0) {
        purchases.push({ chain, count: quantities[chain] });
      }
    }
    onPurchase(purchases);
  };
  
  return (
    <div className="action-panel slide-up">
      <div className="action-title">Buy Stocks (max 3)</div>
      <div className="stock-purchase">
        {activeChains.map(chain => {
          const size = G.chains[chain].tiles.length;
          const price = getStockPrice(chain, size);
          const available = G.stockMarket[chain];
          const disabled = available === 0;
          
          return (
            <div key={chain} className={`stock-option ${disabled ? 'disabled' : ''}`}>
              <div 
                className="chain-color" 
                style={{ 
                  background: CHAIN_COLORS[chain],
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                }}
              />
              <span style={{ flex: 1, textTransform: 'capitalize' }}>{chain}</span>
              <div className="stock-quantity">
                <button 
                  className="qty-btn" 
                  onClick={() => updateQuantity(chain, -1)}
                  disabled={quantities[chain] === 0}
                >
                  -
                </button>
                <span className="qty-value">{quantities[chain]}</span>
                <button 
                  className="qty-btn" 
                  onClick={() => updateQuantity(chain, 1)}
                  disabled={!canBuyMore || quantities[chain] >= available}
                >
                  +
                </button>
              </div>
              <span className="stock-price">${price}</span>
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
            onClick={handleConfirm}
            disabled={!canAfford || totalStocks === 0}
          >
            Buy
          </button>
          <button className="btn btn-secondary" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CHAIN SELECTION MODAL
// ============================================================================

interface ChainSelectionProps {
  G: AcquireGameState;
  onSelect: (chain: ChainName) => void;
}

const ChainSelectionModal: React.FC<ChainSelectionProps> = ({ G, onSelect }) => {
  const availableChains = CHAIN_NAMES.filter(chain => !G.chains[chain].isActive);
  
  return (
    <div className="modal-overlay">
      <div className="modal slide-up">
        <h3>Found a New Hotel Chain!</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Choose which chain to establish:
        </p>
        <div className="chain-options">
          {CHAIN_NAMES.map(chain => {
            const isAvailable = availableChains.includes(chain);
            return (
              <div
                key={chain}
                className={`chain-option ${!isAvailable ? 'disabled' : ''}`}
                onClick={() => isAvailable && onSelect(chain)}
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
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {chain}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {isAvailable ? 'Available' : 'In use'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GAME LOG COMPONENT
// ============================================================================

interface GameLogProps {
  log: string[];
}

const GameLog: React.FC<GameLogProps> = ({ log }) => {
  return (
    <div className="card">
      <h4 style={{ marginBottom: '0.5rem' }}>Game Log</h4>
      <div className="game-log">
        {log.slice().reverse().map((entry, i) => (
          <div key={i} className="log-entry">{entry}</div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN BOARD COMPONENT
// ============================================================================

export const AcquireBoard: React.FC<BoardProps<AcquireGameState>> = ({ 
  G, 
  ctx, 
  moves, 
  playerID 
}) => {
  const [selectedTile, setSelectedTile] = useState<TileId | null>(null);
  
  const currentPhase = G.currentPhase;
  
  // Get player - use playerID if available, otherwise fall back to first player
  const playerKeys = Object.keys(G.players);
  let effectivePlayerID = playerID;
  
  // If no valid playerID or it doesn't exist in players, use first player
  if (!effectivePlayerID || !G.players[effectivePlayerID]) {
    effectivePlayerID = playerKeys[0] || '0';
  }
  
  const player = G.players[effectivePlayerID] || null;
  
  // Get playable positions for selected tile
  const getPlayablePositions = (): Set<TileId> => {
    // If it's my turn and we're in playTile phase, allow playing selected tile
    // Note: We use effectivePlayerID for the turn check to be more robust
    const isCurrentTurn = ctx.currentPlayer === effectivePlayerID;
    
    if (!selectedTile || !isCurrentTurn || currentPhase !== 'playTile') {
      return new Set();
    }
    // The selected tile itself is the playable position
    return new Set([selectedTile]);
  };
  
  const playablePositions = getPlayablePositions();
  const isActuallyMyTurn = ctx.currentPlayer === effectivePlayerID;
  
  // Handlers
  const handleTileSelect = (tileId: TileId) => {
    // If it's my turn and we're in playTile phase, just play the tile!
    if (isActuallyMyTurn && currentPhase === 'playTile') {
      moves.placeTile(tileId);
      setSelectedTile(null);
    } else {
      // Just select it visually if it's not our turn or wrong phase
      if (selectedTile === tileId) {
        setSelectedTile(null);
      } else {
        setSelectedTile(tileId);
      }
    }
  };
  
  const handleCellClick = (tileId: TileId) => {
    if (selectedTile && selectedTile === tileId) {
      moves.placeTile(tileId);
      setSelectedTile(null);
    }
  };
  
  const handleQuickPlace = () => {
    if (selectedTile) {
      moves.placeTile(selectedTile);
      setSelectedTile(null);
    }
  };

  const handleChainSelect = (chain: ChainName) => {
    moves.selectChainToFound(chain);
  };
  
  const handleStockPurchase = (purchases: StockPurchase[]) => {
    moves.buyStocks(purchases);
  };
  
  const handleSkipBuy = () => {
    moves.skipBuyStocks();
  };
  
  // Loading state - wait for game to initialize
  if (playerKeys.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'var(--text-secondary)',
        gap: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎲</div>
          <div>Setting up game...</div>
        </div>
      </div>
    );
  }
  
  // Render game over state
  if (ctx.gameover) {
    return (
      <div className="modal-overlay">
        <div className="modal slide-up" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Game Over!</h2>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
            Player {ctx.gameover.winner} Wins!
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            {Object.entries(ctx.gameover.scores).map(([id, score]) => (
              <div key={id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span>Player {id}</span>
                <span className="mono">${(score as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
      {/* Main game area */}
      <div style={{ flex: 1 }}>
        {/* Column labels */}
        <div className="col-labels">
          {COL_LABELS.map(label => (
            <div key={label} className="col-label">{label}</div>
          ))}
        </div>
        
        {/* Board with row labels */}
        <div className="board-container">
          <div className="row-labels">
            {ROW_LABELS.map(label => (
              <div key={label} className="row-label">{label}</div>
            ))}
          </div>
          
          <div className="board-grid">
            {Array.from({ length: BOARD_ROWS }).map((_, row) =>
              Array.from({ length: BOARD_COLS }).map((_, col) => {
                const tileId = coordToTileId(row, col);
                return (
                  <BoardCell
                    key={tileId}
                    row={row}
                    col={col}
                    G={G}
                    isPlayable={playablePositions.has(tileId)}
                    onCellClick={handleCellClick}
                  />
                );
              })
            )}
          </div>
        </div>
        
        {/* Player hand */}
        {player && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <PlayerHand
              tiles={player.tiles}
              selectedTile={selectedTile}
              G={G}
              onTileSelect={handleTileSelect}
              canPlay={isActuallyMyTurn && currentPhase === 'playTile'}
            />
            
            {selectedTile && isActuallyMyTurn && currentPhase === 'playTile' && (
              <div className="action-panel slide-up" style={{ marginTop: 0, padding: '1rem', flex: 1 }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleQuickPlace}
                  style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
                >
                  PLACE TILE {selectedTile}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Action panel for buying stocks */}
        {isActuallyMyTurn && currentPhase === 'buyStocks' && player && (
          <StockPurchasePanel
            G={G}
            playerCash={player.cash}
            onPurchase={handleStockPurchase}
            onSkip={handleSkipBuy}
          />
        )}
      </div>
      
      {/* Side panel */}
      <div className="side-panel">
        {player && (
          <PlayerInfo
            G={G}
            playerId={effectivePlayerID}
            isCurrentPlayer={isActuallyMyTurn}
          />
        )}
        <ChainInfo G={G} />
        <GameLog log={G.log} />
      </div>
      
      {/* Modals */}
      {isActuallyMyTurn && currentPhase === 'foundChain' && G.pendingFoundation && (
        <ChainSelectionModal G={G} onSelect={handleChainSelect} />
      )}
      
      {/* Merger: Choose Survivor (when tied) */}
      {isActuallyMyTurn && currentPhase === 'resolveMerger' && G.mergerState && 
       G.mergerState.survivorChain === null && (
        <ChooseSurvivorDialog 
          G={G} 
          chains={G.mergerState.defunctChains}
          onChoose={(chain) => moves.chooseMergerSurvivor(chain)}
        />
      )}
      
      {/* Merger: Handle Defunct Stock */}
      {currentPhase === 'resolveMerger' && G.mergerState && 
       G.mergerState.survivorChain !== null &&
       G.mergerState.shareholderOrder[G.mergerState.currentShareholderIndex] === effectivePlayerID && (
        <StockDecisionDialog
          G={G}
          mergerState={G.mergerState}
          playerId={effectivePlayerID}
          onDecide={(hold, sell, trade) => moves.handleDefunctStock(hold, sell, trade)}
        />
      )}
    </div>
  );
};

