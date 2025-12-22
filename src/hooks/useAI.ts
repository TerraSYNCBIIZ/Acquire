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
    // First check if this AI has a preset personality by name (e.g., "Warren Buffett")
    const presetConfig = AI_PERSONALITIES[aiName];
    
    // Map the selected aiPersonality to the corresponding strategy
    const personalityToStrategy = (personality: string | undefined): StrategicAIConfig['strategy'] => {
      switch (personality) {
        case 'aggressive': return 'dominator';
        case 'conservative': return 'accumulator';
        case 'balanced': return 'opportunist';
        case 'dominator': return 'dominator';
        case 'diversifier': return 'diversifier';
        case 'opportunist': return 'opportunist';
        case 'accumulator': return 'accumulator';
        case 'chaotic': return 'chaotic';
        default: return 'opportunist';
      }
    };

    // Personality-specific config values
    const personalityConfigs: Record<string, Partial<StrategicAIConfig>> = {
      aggressive: { aggressiveness: 0.85, patience: 0.25, adaptability: 0.6, randomness: 0.2 },
      conservative: { aggressiveness: 0.2, patience: 0.85, adaptability: 0.5, randomness: 0.15 },
      balanced: { aggressiveness: 0.5, patience: 0.5, adaptability: 0.7, randomness: 0.25 },
      dominator: { aggressiveness: 0.9, patience: 0.3, adaptability: 0.6, randomness: 0.2 },
      diversifier: { aggressiveness: 0.5, patience: 0.7, adaptability: 0.8, randomness: 0.2 },
      opportunist: { aggressiveness: 0.7, patience: 0.4, adaptability: 0.9, randomness: 0.3 },
      accumulator: { aggressiveness: 0.3, patience: 0.9, adaptability: 0.7, randomness: 0.1 },
      chaotic: { aggressiveness: 0.5, patience: 0.5, adaptability: 0.5, randomness: 0.7 },
    };

    const selectedPersonality = aiPlayerConfig?.aiPersonality || 'balanced';
    const personalityConfig = personalityConfigs[selectedPersonality] || personalityConfigs.balanced;

    const aiConfig: StrategicAIConfig = presetConfig
      ? { ...presetConfig, name: aiName }
      : {
          strategy: personalityToStrategy(selectedPersonality),
          aggressiveness: personalityConfig.aggressiveness ?? 0.5,
          patience: personalityConfig.patience ?? 0.5,
          adaptability: personalityConfig.adaptability ?? 0.6,
          randomness: personalityConfig.randomness ?? 0.25,
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

