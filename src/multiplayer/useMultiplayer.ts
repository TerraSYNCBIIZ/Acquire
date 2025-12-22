// ============================================================================
// ACQUIRE DIGITAL - Multiplayer Hook
// React hook for managing WebSocket connection to Partykit server
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import PartySocket from 'partysocket';
import type { 
  LobbyState, 
  OnlinePlayer, 
  ClientMessage, 
  ServerMessage,
  MultiplayerConfig 
} from './types';
import type { AcquireGameState } from '../game/types';
import type { GameAction } from '../game/reducer';

// Partykit host - use localhost for dev, or deployed URL for production
const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';

interface UseMultiplayerReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Lobby state
  lobbyState: LobbyState | null;
  roomCode: string | null;
  
  // Game state
  gameState: AcquireGameState | null;
  turnTimeRemaining: number | null;
  
  // Player info
  playerId: string;
  isHost: boolean;
  myPlayer: OnlinePlayer | null;
  
  // Reconnection
  savedRoomCode: string | null;
  canRejoin: boolean;
  
  // Actions
  createRoom: () => void;
  joinRoom: (roomCode: string) => void;
  rejoinRoom: () => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  addAI: (personality: string) => void;
  removeAI: (aiId: string) => void;
  setTimer: (seconds: number) => void;
  startGame: () => void;
  sendGameAction: (action: GameAction) => void;
}

// Generate a unique player ID
function generatePlayerId(): string {
  const stored = localStorage.getItem('acquire_player_id');
  if (stored) return stored;
  const id = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('acquire_player_id', id);
  return id;
}

// Generate a room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get saved room code for reconnection
function getSavedRoomCode(): string | null {
  return localStorage.getItem('acquire_active_room');
}

// Save room code for reconnection
function saveRoomCode(code: string | null) {
  if (code) {
    localStorage.setItem('acquire_active_room', code);
  } else {
    localStorage.removeItem('acquire_active_room');
  }
}

export function useMultiplayer(playerName: string): UseMultiplayerReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<AcquireGameState | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number | null>(null);
  
  const socketRef = useRef<PartySocket | null>(null);
  const playerId = useRef(generatePlayerId());
  const roomCodeRef = useRef<string | null>(null);
  const gameActiveRef = useRef(false); // Track if game is active to prevent socket close
  
  // Check for saved room on mount
  const savedRoomCode = getSavedRoomCode();

  // Send message to server
  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect to a room
  const connect = useCallback((roomCode: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setIsConnecting(true);
    setError(null);
    roomCodeRef.current = roomCode;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode.toLowerCase(),
    });

    socket.addEventListener('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
      // Join the lobby
      send({ 
        type: 'JOIN_LOBBY', 
        playerId: playerId.current, 
        playerName: playerName || 'Player'
      });
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.addEventListener('error', () => {
      setError('Connection failed. Please try again.');
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage;
        handleServerMessage(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    socketRef.current = socket;
  }, [playerName, send]);

  // Handle server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'LOBBY_STATE':
        setLobbyState(message.state);
        if (message.state.gameState) {
          setGameState(message.state.gameState);
        }
        break;
        
      case 'GAME_STATE':
        setGameState(message.gameState);
        setTurnTimeRemaining(message.turnTimeRemaining);
        break;
        
      case 'TURN_TIMER_UPDATE':
        setTurnTimeRemaining(message.remaining);
        break;
        
      case 'ERROR':
        setError(message.message);
        break;
        
      case 'GAME_STARTED':
        console.log('[MULTIPLAYER] Game started!');
        gameActiveRef.current = true;
        // Save room code for reconnection
        if (roomCodeRef.current) {
          saveRoomCode(roomCodeRef.current);
        }
        break;
        
      case 'PLAYER_JOINED':
        console.log('[MULTIPLAYER] Player joined:', message.player.name);
        break;
        
      case 'PLAYER_LEFT':
        console.log('[MULTIPLAYER] Player left:', message.playerId);
        break;
        
      case 'TURN_SKIPPED':
        console.log('[MULTIPLAYER] Turn skipped for:', message.playerId);
        break;
        
      case 'PLAYER_BECAME_BOT':
        console.log('[MULTIPLAYER] Player became bot:', (message as any).playerName);
        break;
    }
    
    // Check if game ended - clear saved room
    if (message.type === 'LOBBY_STATE' && message.state.phase === 'finished') {
      console.log('[MULTIPLAYER] Game finished, clearing saved room');
      saveRoomCode(null);
    }
    
    // Also check gameState for gameOver
    if (message.type === 'GAME_STATE' && message.gameState?.gameOver) {
      console.log('[MULTIPLAYER] Game over, clearing saved room');
      saveRoomCode(null);
    }
  }, []);

  // No cleanup on unmount - the hook is at App level and persists
  // Socket cleanup happens via leaveRoom() action instead

  // Update player name when it changes
  useEffect(() => {
    if (isConnected && socketRef.current) {
      send({ 
        type: 'JOIN_LOBBY', 
        playerId: playerId.current, 
        playerName: playerName || 'Player'
      });
    }
  }, [playerName, isConnected, send]);

  // ============================================================================
  // Actions
  // ============================================================================

  const createRoom = useCallback(() => {
    const code = generateRoomCode();
    connect(code);
  }, [connect]);

  const joinRoom = useCallback((roomCode: string) => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length >= 4) {
      connect(cleanCode);
    } else {
      setError('Please enter a valid room code');
    }
  }, [connect]);

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_LOBBY', playerId: playerId.current });
    gameActiveRef.current = false;
    saveRoomCode(null); // Clear saved room
    if (socketRef.current) {
      socketRef.current.close();
    }
    setLobbyState(null);
    setGameState(null);
    setIsConnected(false);
    roomCodeRef.current = null;
  }, [send]);

  // Rejoin a previously saved room
  const rejoinRoom = useCallback(() => {
    const savedCode = getSavedRoomCode();
    if (savedCode) {
      console.log('[MULTIPLAYER] Rejoining room:', savedCode);
      connect(savedCode);
    }
  }, [connect]);

  const toggleReady = useCallback(() => {
    send({ type: 'TOGGLE_READY', playerId: playerId.current });
  }, [send]);

  const addAI = useCallback((personality: string) => {
    send({ type: 'ADD_AI', personality });
  }, [send]);

  const removeAI = useCallback((aiId: string) => {
    send({ type: 'REMOVE_AI', aiId });
  }, [send]);

  const setTimer = useCallback((seconds: number) => {
    send({ type: 'SET_TIMER', seconds });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'START_GAME' });
  }, [send]);

  const sendGameAction = useCallback((action: GameAction) => {
    console.log('[MULTIPLAYER] Sending game action:', action);
    console.log('[MULTIPLAYER] Socket state:', socketRef.current?.readyState);
    send({ type: 'GAME_ACTION', action });
  }, [send]);

  // Computed values
  const isHost = lobbyState?.hostId === playerId.current;
  const myPlayer = lobbyState?.players.find(p => p.id === playerId.current) || null;

  return {
    isConnected,
    isConnecting,
    error,
    lobbyState,
    roomCode: roomCodeRef.current,
    gameState,
    turnTimeRemaining,
    playerId: playerId.current,
    isHost,
    myPlayer,
    savedRoomCode,
    canRejoin: !!savedRoomCode && !isConnected,
    createRoom,
    joinRoom,
    rejoinRoom,
    leaveRoom,
    toggleReady,
    addAI,
    removeAI,
    setTimer,
    startGame,
    sendGameAction,
  };
}

