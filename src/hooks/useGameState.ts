// ============================================================================
// useGameState - Game state management with localStorage persistence
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { createInitialState, gameReducer, GameAction } from '../game/reducer';
import { AcquireGameState } from '../game/types';
import { PlayerConfig } from '../components/Setup';

const STORAGE_KEY = 'acquire-game-save';

interface SavedGame {
  gameState: AcquireGameState;
  playerConfigs: PlayerConfig[];
  savedAt: string;
}

function saveGame(gameState: AcquireGameState, playerConfigs: PlayerConfig[]) {
  const save: SavedGame = {
    gameState,
    playerConfigs,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

function loadSavedGame(): SavedGame | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as SavedGame;
  } catch {
    return null;
  }
}

function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useGameState() {
  const [gameState, setGameState] = useState<AcquireGameState | null>(null);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([]);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  // Check for saved game on mount
  useEffect(() => {
    const saved = loadSavedGame();
    if (saved && !saved.gameState.gameOver) {
      setHasSavedGame(true);
    }
  }, []);

  // Auto-save game state whenever it changes
  useEffect(() => {
    if (gameState && playerConfigs.length > 0) {
      saveGame(gameState, playerConfigs);
    }
  }, [gameState, playerConfigs]);

  const resumeGame = useCallback(() => {
    const saved = loadSavedGame();
    if (saved) {
      setGameState(saved.gameState);
      setPlayerConfigs(saved.playerConfigs);
      setHasSavedGame(false);
      console.log('[GAME] Resumed from save');
      return true;
    }
    return false;
  }, []);

  const startNewGame = useCallback((players: PlayerConfig[]) => {
    clearSavedGame();
    setPlayerConfigs(players);
    const names = players.map(p => p.name);
    const state = createInitialState(players.length, names);
    setGameState(state);
    setHasSavedGame(false);
    console.log('[GAME] Started with', players.length, 'players');
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    if (!gameState) return false;

    console.log('[ACTION]', action.type, action);
    const result = gameReducer(gameState, action);

    if (result.success) {
      setGameState(result.state);
      return true;
    } else {
      console.error('[ACTION FAILED]', result.error);
      return false;
    }
  }, [gameState]);

  const leaveGame = useCallback(() => {
    // Game stays saved for resume
    setGameState(null);
    setPlayerConfigs([]);
  }, []);

  const quitGame = useCallback(() => {
    clearSavedGame();
    setGameState(null);
    setPlayerConfigs([]);
    setHasSavedGame(false);
  }, []);

  return {
    gameState,
    playerConfigs,
    hasSavedGame,
    isPlaying: gameState !== null,
    resumeGame,
    startNewGame,
    dispatch,
    leaveGame,
    quitGame,
  };
}

