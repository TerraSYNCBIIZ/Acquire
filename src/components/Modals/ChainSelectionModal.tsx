// ============================================================================
// ChainSelectionModal - Modal for founding a new chain
// ============================================================================

import { AcquireGameState, ChainName } from '../../game/types';
import { GameAction } from '../../game/reducer';
import { CHAIN_NAMES, CHAIN_COLORS, CHAIN_DISPLAY_NAMES } from '../../game/constants';

interface ChainSelectionModalProps {
  state: AcquireGameState;
  playerId: string;
  onAction: (action: GameAction) => void;
  inline?: boolean;
}

export function ChainSelectionModal({ state, playerId, onAction, inline }: ChainSelectionModalProps) {
  const availableChains = CHAIN_NAMES.filter(chain => !state.chains[chain].isActive);

  const handleSelect = (chain: ChainName) => {
    onAction({ type: 'SELECT_CHAIN_TO_FOUND', playerId, chain });
  };

  const content = (
    <>
      <h3 className="action-title">Found a New Chain!</h3>
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        Choose which chain to establish:
      </p>
      <div className="chain-options-inline">
        {availableChains.map(chain => (
          <button
            key={chain}
            className="chain-option-btn"
            onClick={() => handleSelect(chain)}
          >
            <div
              className="chain-color"
              style={{ background: CHAIN_COLORS[chain], width: 24, height: 24, borderRadius: 4 }}
            />
            <span>{CHAIN_DISPLAY_NAMES[chain]}</span>
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
