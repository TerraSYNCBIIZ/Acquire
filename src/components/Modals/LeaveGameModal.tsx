// ============================================================================
// LeaveGameModal - Confirmation modal for leaving the game
// ============================================================================

interface LeaveGameModalProps {
  onCancel: () => void;
  onLeave: () => void;
  onQuit: () => void;
}

export function LeaveGameModal({ onCancel, onLeave, onQuit }: LeaveGameModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 style={{ marginBottom: '1rem' }}>Leave Game?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your game will be saved automatically. You can resume it from the main menu.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onLeave}>
            Leave (Save Game)
          </button>
          <button
            className="btn btn-warning"
            onClick={onQuit}
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            Quit (Delete Save)
          </button>
        </div>
      </div>
    </div>
  );
}

