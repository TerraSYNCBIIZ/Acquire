// ============================================================================
// GameLog - Game action log panel
// ============================================================================

interface GameLogProps {
  log: string[];
}

export function GameLog({ log }: GameLogProps) {
  return (
    <div className="card">
      <h4 style={{ marginBottom: '0.5rem' }}>Game Log</h4>
      <div className="game-log" style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {log.slice().reverse().slice(0, 20).map((entry, i) => (
          <div key={i} className="log-entry" style={{ fontSize: '0.875rem', padding: '0.25rem 0' }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

