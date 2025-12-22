// ============================================================================
// PlayerHand - Player's tile hand with hover preview and dead tile exchange
// ============================================================================

import { AcquireGameState, TileId } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { isTilePlayable, getTilePlacementOutcome } from '../../game/logic/board';

interface PlayerHandProps {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
  onHover: (tileId: TileId | null) => void;
  disabled?: boolean; // When true, tiles are shown but not interactive
}

export function PlayerHand({ state, playerId, onAction, onHover, disabled = false }: PlayerHandProps) {
  const player = state.players[playerId];
  if (!player) return null;

  const hasPlayableTiles = player.tiles.some(t => isTilePlayable(state, t));

  const handleTileClick = (tileId: TileId) => {
    if (disabled) return;
    if (!isTilePlayable(state, tileId)) return;
    onHover(null);
    onAction({ type: 'PLACE_TILE', playerId, tileId });
  };

  const handleExchangeDeadTile = (tileId: TileId) => {
    if (disabled) return;
    onAction({ type: 'EXCHANGE_DEAD_TILE', playerId, tileId });
  };

  const handlePassTurn = () => {
    if (disabled) return;
    onAction({ type: 'PASS_TURN', playerId });
  };

  const getTileStatus = (tileId: TileId) => {
    if (isTilePlayable(state, tileId)) return 'playable';
    const outcome = getTilePlacementOutcome(state, tileId);
    if (outcome.type === 'unplayable' && outcome.reason === 'dead') return 'dead';
    return 'unplayable';
  };

  const canExchange = !disabled && state.tilePool.length > 0 && !state.turnState.hasExchangedDeadTile;

  // Determine if this is "your" turn for messaging
  const isYourTurn = !disabled;

  return (
    <div className={`player-hand ${disabled ? 'disabled' : ''}`} style={{ marginTop: '1rem' }}>
      <h4>
        Your Tiles
        {!isYourTurn && (
          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal', fontSize: '0.85rem' }}>
            (Waiting for your turn...)
          </span>
        )}
        {isYourTurn && !hasPlayableTiles && (
          <span style={{ color: 'var(--color-warning)', marginLeft: '0.5rem' }}>
            (No playable tiles)
          </span>
        )}
      </h4>
      <div className="hand-tiles">
        {player.tiles.map(tileId => {
          const status = getTileStatus(tileId);
          const playable = status === 'playable' && !disabled;
          const isDead = status === 'dead';

          return (
            <div key={tileId} className="tile-wrapper">
              <button
                className={`hand-tile ${disabled ? 'disabled' : status}`}
                onClick={() => playable && handleTileClick(tileId)}
                onMouseEnter={() => playable && onHover(tileId)}
                onMouseLeave={() => onHover(null)}
                disabled={!playable}
                title={disabled ? 'Wait for your turn' : isDead ? 'Dead tile - would merge two safe chains' : undefined}
              >
                {tileId}
                {isDead && !disabled && <span className="dead-marker">X</span>}
              </button>
              {isDead && canExchange && (
                <button
                  className="exchange-btn"
                  onClick={() => handleExchangeDeadTile(tileId)}
                  title="Exchange dead tile for a new one"
                >
                  ↻
                </button>
              )}
            </div>
          );
        })}
      </div>
      {isYourTurn && !hasPlayableTiles && (
        <button 
          className="btn btn-secondary" 
          onClick={handlePassTurn} 
          style={{ marginTop: '0.5rem' }}
        >
          Pass Turn (No Playable Tiles)
        </button>
      )}
    </div>
  );
}
