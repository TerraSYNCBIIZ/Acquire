// ============================================================================
// Board - The game board grid with tile preview
// ============================================================================

import { AcquireGameState, TileId } from '../../game/types';
import { BOARD_ROWS, BOARD_COLS, ROW_LABELS, COL_LABELS, coordToTileId } from '../../game/constants';

interface BoardProps {
  state: AcquireGameState;
  hoveredTile: TileId | null;
}

export function Board({ state, hoveredTile }: BoardProps) {
  return (
    <div className="board-area">
      {/* Column labels */}
      <div className="col-labels">
        {COL_LABELS.map(label => (
          <div key={label} className="col-label">{label}</div>
        ))}
      </div>

      <div className="board-with-rows">
        {/* Row labels */}
        <div className="row-labels">
          {ROW_LABELS.map(label => (
            <div key={label} className="row-label">{label}</div>
          ))}
        </div>

        <div className="board-grid">
          {Array.from({ length: BOARD_ROWS }).map((_, row) =>
            Array.from({ length: BOARD_COLS }).map((_, col) => {
              const tileId = coordToTileId(row, col);
              const cell = state.board[row][col];
              const hasChain = cell.chain !== null;
              const hasTile = cell.tile !== null;
              const isHovered = hoveredTile === tileId;

              let className = 'board-cell';
              if (hasTile) className += ' has-tile';
              if (hasChain) className += ` chain-${cell.chain}`;
              if (isHovered) className += ' hover-preview';

              return (
                <div key={tileId} className={className} title={tileId}>
                  {tileId}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

