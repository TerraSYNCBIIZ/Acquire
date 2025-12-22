// ============================================================================
// ACQUIRE DIGITAL - Multiplayer Types
// Shared types between client and server
// ============================================================================

import type { AcquireGameState } from '../game/types';
import type { GameAction } from '../game/reducer';

export interface OnlinePlayer {
  id: string;
  name: string;
  isAI: boolean;
  aiPersonality?: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface LobbyState {
  phase: 'lobby' | 'playing' | 'finished';
  roomCode: string;
  hostId: string;
  players: OnlinePlayer[];
  maxPlayers: number;
  timerSeconds: number;
  gameState: AcquireGameState | null;
  turnStartTime: number | null;
  turnTimeRemaining: number | null;
}

export type ClientMessage = 
  | { type: 'JOIN_LOBBY'; playerId: string; playerName: string }
  | { type: 'LEAVE_LOBBY'; playerId: string }
  | { type: 'TOGGLE_READY'; playerId: string }
  | { type: 'ADD_AI'; personality: string }
  | { type: 'REMOVE_AI'; aiId: string }
  | { type: 'SET_TIMER'; seconds: number }
  | { type: 'START_GAME' }
  | { type: 'GAME_ACTION'; action: GameAction }
  | { type: 'REQUEST_STATE' };

export type ServerMessage =
  | { type: 'LOBBY_STATE'; state: LobbyState }
  | { type: 'GAME_STATE'; gameState: AcquireGameState; turnTimeRemaining: number | null }
  | { type: 'PLAYER_JOINED'; player: OnlinePlayer }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYER_READY'; playerId: string; isReady: boolean }
  | { type: 'GAME_STARTED' }
  | { type: 'TURN_TIMER_UPDATE'; remaining: number }
  | { type: 'TURN_SKIPPED'; playerId: string }
  | { type: 'PLAYER_BECAME_BOT'; playerId: string; playerName: string }
  | { type: 'ERROR'; message: string };

export interface MultiplayerConfig {
  host: string;
  roomId: string;
  playerId: string;
  playerName: string;
}

// Timer options
export const TIMER_OPTIONS = [
  { label: 'No Limit', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
] as const;

