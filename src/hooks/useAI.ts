// ============================================================================
// useAI - AI player logic hook
// ============================================================================

import { useEffect, useRef } from 'react';
import { AcquireGameState } from '../game/types';
import { GameAction } from '../game/reducer';
import { getStrategicAIAction, StrategicAIConfig, AI_PERSONALITIES } from '../game/ai/strategicBot';
import { PlayerConfig } from '../components/Setup';

interface UseAIProps {
  state: AcquireGameState;
  playerConfigs: PlayerConfig[];
  onAction: (action: GameAction) => void;
  disabled?: boolean; // For online games where server handles AI
}

export function useAI({ state, playerConfigs, onAction, disabled = false }: UseAIProps) {
  const aiTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled || state.gameOver) return;

    // Determine who should be acting
    let aiActingPlayerId: string | null = null;
    
    // During merger stock decisions, check the current shareholder
    if (state.currentPhase === 'resolveMerger' && state.mergerState && state.mergerState.survivorChain !== null) {
      const currentShareholder = state.mergerState.shareholderOrder[state.mergerState.currentShareholderIndex];
      const shareholderConfig = playerConfigs.find(p => p.id === currentShareholder);
      if (shareholderConfig?.isAI) {
        aiActingPlayerId = currentShareholder;
      }
    } else {
      // Normal phases - check current player
      const currentConfig = playerConfigs.find(p => p.id === state.currentPlayer);
      if (currentConfig?.isAI && state.currentPlayer) {
        aiActingPlayerId = state.currentPlayer;
      }
    }

    if (!aiActingPlayerId) return;

    // Clear any pending AI action
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
    }

    const aiPlayerConfig = playerConfigs.find(p => p.id === aiActingPlayerId);
    const aiName = aiPlayerConfig?.name || `AI ${aiActingPlayerId}`;

    // Get strategic AI config
    const presetConfig = AI_PERSONALITIES[aiName];
    const aiConfig: StrategicAIConfig = presetConfig
      ? { ...presetConfig, name: aiName }
      : {
          strategy: aiPlayerConfig?.aiPersonality === 'aggressive' ? 'dominator' :
                    aiPlayerConfig?.aiPersonality === 'conservative' ? 'accumulator' : 'opportunist',
          aggressiveness: aiPlayerConfig?.aiPersonality === 'aggressive' ? 0.8 : 0.5,
          patience: aiPlayerConfig?.aiPersonality === 'conservative' ? 0.7 : 0.4,
          adaptability: 0.6,
          randomness: 0.25,
          name: aiName,
        };

    const delay = 600 + Math.random() * 400;

    console.log(`[AI] ${aiName} (${aiConfig.strategy}) thinking... (${Math.round(delay)}ms)`);

    aiTimeoutRef.current = window.setTimeout(() => {
      const action = getStrategicAIAction(state, aiActingPlayerId!, aiConfig);
      if (action) {
        onAction(action);
      } else {
        console.log(`[AI] ${aiName} has no valid action`);
      }
    }, delay);

    return () => {
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [state, playerConfigs, onAction, disabled]);

  // Return cleanup function for external use if needed
  return {
    cancelPendingAction: () => {
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    }
  };
}

