// ============================================================================
// ChooseSurvivorModal - Modal for choosing merger survivor
// ============================================================================

import { AcquireGameState } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { CHAIN_COLORS, CHAIN_DISPLAY_NAMES } from '../../game/constants';

interface ChooseSurvivorModalProps {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
  inline?: boolean;
}

export function ChooseSurvivorModal({ state, playerId, onAction, inline }: ChooseSurvivorModalProps) {
  if (!state.mergerState) return null;

  const chains = state.mergerState.defunctChains;

  const content = (
    <>
      <h3 className="action-title">Choose Survivor</h3>
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        Multiple chains tied. Choose which survives:
      </p>
      <div className="chain-options-inline">
        {chains.map(chain => (
          <button
            key={chain}
            className="chain-option-btn"
            onClick={() => onAction({ type: 'CHOOSE_MERGER_SURVIVOR', playerId, chain })}
          >
            <div
              className="chain-color"
              style={{ background: CHAIN_COLORS[chain], width: 24, height: 24, borderRadius: 4 }}
            />
            <span>{CHAIN_DISPLAY_NAMES[chain]}</span>
            <span className="chain-size">{state.chains[chain].tiles.length} tiles</span>
          </button>
        ))}
      </div>
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
