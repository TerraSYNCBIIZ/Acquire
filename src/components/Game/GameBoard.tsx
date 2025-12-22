// ============================================================================
// GameBoard - Main game board wrapper component
// ============================================================================

import { useState, useCallback } from 'react';
import { AcquireGameState, TileId } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { PlayerConfig } from '../Setup';
import { useAI } from '../../hooks/useAI';
import { CHAIN_COLORS } from '../../game/constants';

// Sub-components
import { Board } from './Board';
import { PlayerHand } from './PlayerHand';
import { StockPurchasePanel, PlayerInfo, ChainInfo, GameLog } from '../Panels';
import { 
  ChainSelectionModal, 
  ChooseSurvivorModal, 
  HandleDefunctStockModal,
  LeaveGameModal 
} from '../Modals';
import { GameOverScreen } from '../Screens';

interface GameBoardProps {
  state: AcquireGameState;
  playerConfigs: PlayerConfig[];
  humanPlayerId: string;
  onAction: (action: GameAction) => void;
  onBack: () => void;
  onEndGame: () => void;
  onShowHelp: () => void;
  isOnline?: boolean;
}

export function GameBoard({ 
  state, 
  playerConfigs, 
  humanPlayerId, 
  onAction, 
  onBack, 
  onEndGame, 
  onShowHelp,
  isOnline = false
}: GameBoardProps) {
  const [hoveredTile, setHoveredTile] = useState<TileId | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Use AI hook for automated player actions (only for local games)
  // In online mode, the server handles AI
  useAI({ state, playerConfigs, onAction, disabled: isOnline });

  const currentPlayerConfig = playerConfigs.find(p => p.id === state.currentPlayer);
  const isAITurn = currentPlayerConfig?.isAI ?? false;

  // Determine active human player
  const getActiveHumanId = useCallback((): string | null => {
    // In ONLINE mode: you can only act as yourself
    if (isOnline) {
      // During merger stock decisions, check if it's your turn to decide
      if (state.currentPhase === 'resolveMerger' && state.mergerState && state.mergerState.survivorChain !== null) {
        const activePlayer = state.mergerState.shareholderOrder[state.mergerState.currentShareholderIndex];
        // Only return your ID if you're the one who needs to act
        if (activePlayer === humanPlayerId) {
          return humanPlayerId;
        }
        return null;
      }

      // For all other phases, only you can act when it's your turn
      if (state.currentPlayer === humanPlayerId) {
        return humanPlayerId;
      }
      return null;
    }

    // LOCAL mode: hot-seat multiplayer where multiple humans take turns
    // During merger stock decisions, check who needs to act
    if (state.currentPhase === 'resolveMerger' && state.mergerState && state.mergerState.survivorChain !== null) {
      const activePlayer = state.mergerState.shareholderOrder[state.mergerState.currentShareholderIndex];
      const activeConfig = activePlayer ? playerConfigs.find(p => p.id === activePlayer) : null;
      if (activeConfig && !activeConfig.isAI) {
        return activePlayer;
      }
      return null;
    }

    // During choosing survivor, the current player decides
    if (state.currentPhase === 'resolveMerger' && state.mergerState && state.mergerState.survivorChain === null) {
      if (!isAITurn) {
        return state.currentPlayer ?? null;
      }
      return null;
    }

    // Normal phases - current player if they're human
    if (!isAITurn) {
      return state.currentPlayer ?? null;
    }
    return null;
  }, [state, playerConfigs, isAITurn, isOnline, humanPlayerId]);

  const activeHumanId = getActiveHumanId();
  const isHumanTurn = activeHumanId !== null;
  
  // In online mode, show your tiles (but only interact when it's your turn)
  const myTilesPlayerId = isOnline ? humanPlayerId : activeHumanId;

  // Render game over
  if (state.gameOver) {
    return (
      <div className="game-wrapper">
        <GameOverScreen state={state} playerConfigs={playerConfigs} onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="game-wrapper">
      {/* Header */}
      <header className="game-header">
        <div className="header-left">
          <button className="header-btn" onClick={() => setShowLeaveConfirm(true)}>← Menu</button>
          <h1 className="header-title">ACQUIRE</h1>
        </div>

        <div className="header-center">
          <div className="turn-indicator">
            <span className="turn-label">Turn:</span>
            <span className={`turn-player ${isAITurn ? 'ai' : 'human'}`}>
              {currentPlayerConfig?.name || `Player ${state.currentPlayer}`}
              {isAITurn && <span className="ai-badge">AI</span>}
            </span>
          </div>
          <div className="phase-indicator">
            Phase: <span className="phase-name">{formatPhase(state.currentPhase)}</span>
          </div>
        </div>

        <div className="header-right">
          <button className="header-btn" onClick={onShowHelp}>? Help</button>
        </div>
      </header>

      {/* All Players Overview */}
      <div className="all-players-bar">
        {playerConfigs.map(config => {
          const player = state.players[config.id];
          const isCurrent = state.currentPlayer === config.id;
          const isYou = config.id === humanPlayerId;

          return (
            <div key={config.id} className={`player-chip ${isCurrent ? 'current' : ''} ${isYou ? 'you' : ''}`}>
              <div className="player-chip-name">
                {config.name}
                {isYou && <span className="you-badge">YOU</span>}
                {config.isAI && <span className="ai-mini-badge">AI</span>}
              </div>
              <div className="player-chip-cash">${player?.cash?.toLocaleString() || 0}</div>
              <div className="player-chip-stocks">
                {Object.entries(player?.stocks || {}).map(([chain, count]) => {
                  if (count === 0) return null;
                  return (
                    <div
                      key={chain}
                      className="mini-stock"
                      style={{ background: CHAIN_COLORS[chain as keyof typeof CHAIN_COLORS] }}
                      title={`${count} ${chain}`}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Game Area - 3 Column Layout */}
      <div className="game-content">
        {/* Left: Board + Player Hand */}
        <div className="board-column">
          <Board state={state} hoveredTile={hoveredTile} />

          {/* Player Hand - In online: always show YOUR tiles. In local: show current player's tiles */}
          {myTilesPlayerId && (
            <PlayerHand
              state={state}
              playerId={myTilesPlayerId}
              onAction={onAction}
              onHover={setHoveredTile}
              disabled={!activeHumanId || state.currentPhase !== 'playTile'}
            />
          )}
        </div>

        {/* Center: Action Panel */}
        <div className="action-column">
          {/* Buy Stocks Panel */}
          {activeHumanId && state.currentPhase === 'buyStocks' && (
            <StockPurchasePanel state={state} playerId={activeHumanId} onAction={onAction} />
          )}

          {/* Found Chain */}
          {activeHumanId && state.currentPhase === 'foundChain' && state.pendingFoundation && (
            <ChainSelectionModal state={state} playerId={activeHumanId} onAction={onAction} inline />
          )}

          {/* Merger: Choose Survivor */}
          {activeHumanId && state.currentPhase === 'resolveMerger' &&
           state.mergerState && state.mergerState.survivorChain === null && (
            <ChooseSurvivorModal state={state} playerId={activeHumanId} onAction={onAction} inline />
          )}

          {/* Merger: Handle Defunct Stock */}
          {activeHumanId && state.currentPhase === 'resolveMerger' && state.mergerState &&
           state.mergerState.survivorChain !== null && (
            <HandleDefunctStockModal state={state} playerId={activeHumanId} onAction={onAction} inline />
          )}

          {/* Waiting state when AI is playing or no action needed */}
          {!activeHumanId && !state.gameOver && (
            <div className="waiting-panel">
              <div className="waiting-title">Waiting...</div>
              <div className="waiting-text">
                {currentPlayerConfig?.name || 'AI'} is thinking...
              </div>
            </div>
          )}

          {/* Idle state during playTile phase */}
          {activeHumanId && state.currentPhase === 'playTile' && (
            <div className="action-hint">
              <div className="hint-title">Your Turn</div>
              <div className="hint-text">Select a tile from your hand to place on the board</div>
            </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="side-panel">
          <PlayerInfo state={state} playerId={humanPlayerId} isCurrentPlayer={isHumanTurn} />
          <ChainInfo state={state} />
          <GameLog log={state.log} />
        </div>
      </div>

      {/* Leave Game Confirmation Modal */}
      {showLeaveConfirm && (
        <LeaveGameModal
          onCancel={() => setShowLeaveConfirm(false)}
          onLeave={onBack}
          onQuit={() => { onEndGame(); setShowLeaveConfirm(false); }}
        />
      )}
    </div>
  );
}

// Helper function
function formatPhase(phase: string): string {
  switch (phase) {
    case 'playTile': return 'Place Tile';
    case 'foundChain': return 'Found Chain';
    case 'resolveMerger': return 'Merger';
    case 'buyStocks': return 'Buy Stocks';
    case 'gameEnd': return 'Game Over';
    default: return phase;
  }
}

