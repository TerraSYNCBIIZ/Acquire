// ============================================================================
// ACQUIRE DIGITAL - Turn Timer Component
// Shows remaining time for current player's turn
// ============================================================================

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import './TurnTimer.css';

interface TurnTimerProps {
  remaining: number | null;
  isMyTurn: boolean;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({ remaining, isMyTurn }) => {
  if (remaining === null) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const isLow = remaining <= 10;
  const isCritical = remaining <= 5;

  return (
    <div className={`turn-timer ${isMyTurn ? 'my-turn' : ''} ${isLow ? 'low' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-icon">
        {isCritical ? <AlertTriangle size={18} /> : <Clock size={18} />}
      </div>
      <div className="timer-display">
        <span className="timer-value">{timeString}</span>
        <span className="timer-label">
          {isMyTurn ? 'Your turn' : 'Waiting...'}
        </span>
      </div>
      {isMyTurn && remaining > 0 && (
        <div 
          className="timer-progress"
          style={{ 
            width: `${Math.min(100, (remaining / 60) * 100)}%` 
          }}
        />
      )}
    </div>
  );
};

