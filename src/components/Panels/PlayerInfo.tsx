// ============================================================================
// PlayerInfo - Player information panel
// ============================================================================

import { AcquireGameState } from '../../game/types';
import { CHAIN_NAMES, CHAIN_COLORS } from '../../game/constants';

interface PlayerInfoProps {
  state: AcquireGameState;
  playerId: string;
  isCurrentPlayer: boolean;
}

export function PlayerInfo({ state, playerId, isCurrentPlayer }: PlayerInfoProps) {
  const player = state.players[playerId];
  if (!player) return null;

  return (
    <div className={`card ${isCurrentPlayer ? 'current' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>{player.name || `Player ${playerId}`} (You)</h4>
        {isCurrentPlayer && <span style={{ color: 'var(--color-success)' }}>Your Turn</span>}
      </div>
      <div className="player-cash">${player.cash.toLocaleString()}</div>
      <div className="player-stocks" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {CHAIN_NAMES.map(chain => {
          const count = player.stocks[chain];
          if (count === 0) return null;
          return (
            <div key={chain} className="stock-item" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ background: CHAIN_COLORS[chain], width: 16, height: 16, borderRadius: 2 }} />
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

