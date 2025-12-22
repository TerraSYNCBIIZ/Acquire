// ============================================================================
// ACQUIRE DIGITAL - Partykit Server
// Handles real-time multiplayer: lobbies, game sync, turn timers
// ============================================================================

import type * as Party from "partykit/server";
import { createInitialState, gameReducer } from "../src/game/reducer";
import type { AcquireGameState, GameAction } from "../src/game/types";
import { getStrategicAIAction, AI_PERSONALITIES } from "../src/game/ai/strategicBot";

// ============================================================================
// Types
// ============================================================================

interface Player {
  id: string;
  name: string;
  isAI: boolean;
  aiPersonality?: string;
  isReady: boolean;
  isConnected: boolean;
  connectionId?: string;
}

interface LobbyState {
  phase: 'lobby' | 'playing' | 'finished';
  roomCode: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  timerSeconds: number; // 0 = unlimited, 60 = 1min, 300 = 5min
  gameState: AcquireGameState | null;
  turnStartTime: number | null;
  turnTimeRemaining: number | null;
}

type ClientMessage = 
  | { type: 'JOIN_LOBBY'; playerId: string; playerName: string }
  | { type: 'LEAVE_LOBBY'; playerId: string }
  | { type: 'TOGGLE_READY'; playerId: string }
  | { type: 'ADD_AI'; personality: string }
  | { type: 'REMOVE_AI'; aiId: string }
  | { type: 'SET_TIMER'; seconds: number }
  | { type: 'START_GAME' }
  | { type: 'GAME_ACTION'; action: GameAction }
  | { type: 'REQUEST_STATE' };

type ServerMessage =
  | { type: 'LOBBY_STATE'; state: LobbyState }
  | { type: 'GAME_STATE'; gameState: AcquireGameState; turnTimeRemaining: number | null }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYER_READY'; playerId: string; isReady: boolean }
  | { type: 'GAME_STARTED' }
  | { type: 'TURN_TIMER_UPDATE'; remaining: number }
  | { type: 'TURN_SKIPPED'; playerId: string }
  | { type: 'ERROR'; message: string };

// ============================================================================
// Server
// ============================================================================

export default class AcquirePartyServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  private state: LobbyState = {
    phase: 'lobby',
    roomCode: '',
    hostId: '',
    players: [],
    maxPlayers: 6,
    timerSeconds: 60, // Default 1 minute
    gameState: null,
    turnStartTime: null,
    turnTimeRemaining: null,
  };

  private turnTimer: ReturnType<typeof setInterval> | null = null;
  private isProcessingTimeout = false; // Prevent re-entry
  private aiNames = ['Warren', 'Morgan', 'Rockefeller', 'Carnegie', 'Vanderbilt', 'Getty'];
  private aiIndex = 0;

  // Called when room is first created
  async onStart() {
    // Generate room code from room ID (first 6 chars uppercase)
    this.state.roomCode = this.room.id.substring(0, 6).toUpperCase();
    
    // Try to load persisted state
    const stored = await this.room.storage.get<LobbyState>('state');
    if (stored) {
      this.state = stored;
    }
  }

  // Save state to storage
  async saveState() {
    await this.room.storage.put('state', this.state);
  }

  // Broadcast message to all connections
  broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }

  // Send message to specific connection
  send(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  // Handle new connection
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Send current state to new connection
    this.send(conn, { 
      type: 'LOBBY_STATE', 
      state: this.state 
    });
  }

  // Handle disconnection
  async onClose(conn: Party.Connection) {
    // Find player by connection ID
    const player = this.state.players.find(p => p.connectionId === conn.id);
    
    if (player && !player.isAI) {
      console.log('[SERVER] Player disconnected:', player.name, 'phase:', this.state.phase);
      player.isConnected = false;
      
      // If in lobby phase, remove player after short delay
      if (this.state.phase === 'lobby') {
        setTimeout(async () => {
          // Check if still disconnected
          const currentPlayer = this.state.players.find(p => p.id === player.id);
          if (currentPlayer && !currentPlayer.isConnected) {
            this.state.players = this.state.players.filter(p => p.id !== player.id);
            await this.saveState();
            this.broadcast({ type: 'PLAYER_LEFT', playerId: player.id });
            this.broadcast({ type: 'LOBBY_STATE', state: this.state });
          }
        }, 5000); // 5 second grace period
      }
      
      // If in game, convert to bot after 30 seconds of disconnection
      if (this.state.phase === 'playing') {
        this.broadcast({ type: 'LOBBY_STATE', state: this.state });
        
        setTimeout(async () => {
          const currentPlayer = this.state.players.find(p => p.id === player.id);
          if (currentPlayer && !currentPlayer.isConnected && !currentPlayer.isAI) {
            console.log('[SERVER] Converting disconnected player to bot:', currentPlayer.name);
            await this.convertPlayerToBot(currentPlayer.id);
          }
        }, 30000); // 30 second grace period before becoming a bot
      }
      
      this.broadcast({ type: 'LOBBY_STATE', state: this.state });
    }
  }

  // Convert a player to a bot (when they disconnect during game)
  async convertPlayerToBot(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    
    const playerIndex = this.state.players.indexOf(player);
    const gamePlayerId = String(playerIndex);
    
    player.isAI = true;
    player.aiPersonality = 'balanced';
    player.name = `${player.name} (Bot)`;
    
    // Notify all players
    this.broadcast({ 
      type: 'PLAYER_BECAME_BOT', 
      playerId: player.id,
      playerName: player.name 
    } as any);
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
    
    // Check if all humans are gone
    const remainingHumans = this.state.players.filter(p => !p.isAI && p.isConnected);
    if (remainingHumans.length === 0) {
      console.log('[SERVER] All humans left, ending game');
      this.state.phase = 'finished';
      if (this.state.gameState) {
        this.state.gameState.gameOver = true;
      }
      this.stopTurnTimer();
      this.broadcast({ type: 'LOBBY_STATE', state: this.state });
      if (this.state.gameState) {
        this.broadcast({ 
          type: 'GAME_STATE', 
          gameState: this.state.gameState,
          turnTimeRemaining: null
        });
      }
    } else {
      // Check if this newly converted bot needs to take their turn immediately
      if (this.state.gameState && this.state.gameState.currentPlayer === gamePlayerId) {
        console.log('[SERVER] Converting player who is current - bot will play immediately');
        this.stopTurnTimer(); // Stop any running timer for the now-bot player
        // Small delay to let the UI update, then play
        setTimeout(() => {
          this.checkAndPlayAITurn();
        }, 500);
      }
      
      // Also check if we're in merger resolution and this player needs to act
      if (this.state.gameState?.mergerState?.survivorChain !== null) {
        const expectedPlayer = this.state.gameState.mergerState.shareholderOrder[
          this.state.gameState.mergerState.currentShareholderIndex
        ];
        if (expectedPlayer === gamePlayerId) {
          console.log('[SERVER] Converting player who needs to handle merger stocks - bot will act immediately');
          this.stopTurnTimer();
          setTimeout(() => {
            this.checkAndPlayAITurn();
          }, 500);
        }
      }
    }
    
    await this.saveState();
  }

  // Handle messages
  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message) as ClientMessage;
      
      switch (msg.type) {
        case 'JOIN_LOBBY':
          await this.handleJoinLobby(msg.playerId, msg.playerName, sender);
          break;
          
        case 'LEAVE_LOBBY':
          await this.handleLeaveLobby(msg.playerId);
          break;
          
        case 'TOGGLE_READY':
          await this.handleToggleReady(msg.playerId);
          break;
          
        case 'ADD_AI':
          await this.handleAddAI(msg.personality);
          break;
          
        case 'REMOVE_AI':
          await this.handleRemoveAI(msg.aiId);
          break;
          
        case 'SET_TIMER':
          await this.handleSetTimer(msg.seconds);
          break;
          
        case 'START_GAME':
          await this.handleStartGame();
          break;
          
        case 'GAME_ACTION':
          await this.handleGameAction(msg.action, sender);
          break;
          
        case 'REQUEST_STATE':
          this.send(sender, { type: 'LOBBY_STATE', state: this.state });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.send(sender, { type: 'ERROR', message: 'Invalid message format' });
    }
  }

  // ============================================================================
  // Lobby Handlers
  // ============================================================================

  async handleJoinLobby(playerId: string, playerName: string, conn: Party.Connection) {
    // Check if room is full
    if (this.state.players.length >= this.state.maxPlayers) {
      this.send(conn, { type: 'ERROR', message: 'Room is full' });
      return;
    }
    
    // Check if game already started
    if (this.state.phase !== 'lobby') {
      // Allow reconnection
      const existingPlayer = this.state.players.find(p => p.id === playerId);
      if (existingPlayer && !existingPlayer.isAI) {
        existingPlayer.isConnected = true;
        existingPlayer.connectionId = conn.id;
        await this.saveState();
        this.send(conn, { type: 'LOBBY_STATE', state: this.state });
        if (this.state.gameState) {
          this.send(conn, { 
            type: 'GAME_STATE', 
            gameState: this.state.gameState,
            turnTimeRemaining: this.state.turnTimeRemaining
          });
        }
        return;
      }
      this.send(conn, { type: 'ERROR', message: 'Game already in progress' });
      return;
    }
    
    // Check if player already exists
    const existingPlayer = this.state.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      existingPlayer.connectionId = conn.id;
      existingPlayer.name = playerName;
    } else {
      // First player becomes host
      if (this.state.players.filter(p => !p.isAI).length === 0) {
        this.state.hostId = playerId;
      }
      
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        isAI: false,
        isReady: false,
        isConnected: true,
        connectionId: conn.id,
      };
      
      this.state.players.push(newPlayer);
      this.broadcast({ type: 'PLAYER_JOINED', player: newPlayer });
    }
    
    await this.saveState();
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
  }

  async handleLeaveLobby(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    
    if (this.state.phase === 'playing' && player) {
      // During a game, convert to bot instead of removing
      console.log('[SERVER] Player leaving during game, converting to bot:', player.name);
      await this.convertPlayerToBot(playerId);
      return;
    }
    
    // In lobby, just remove the player
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    
    // If host left, assign new host
    if (this.state.hostId === playerId) {
      const humanPlayers = this.state.players.filter(p => !p.isAI);
      this.state.hostId = humanPlayers[0]?.id || '';
    }
    
    await this.saveState();
    this.broadcast({ type: 'PLAYER_LEFT', playerId });
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
  }

  async handleToggleReady(playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (player && !player.isAI) {
      player.isReady = !player.isReady;
      await this.saveState();
      this.broadcast({ type: 'PLAYER_READY', playerId, isReady: player.isReady });
      this.broadcast({ type: 'LOBBY_STATE', state: this.state });
    }
  }

  async handleAddAI(personality: string) {
    if (this.state.players.length >= this.state.maxPlayers) return;
    
    const aiPlayer: Player = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: this.aiNames[this.aiIndex % this.aiNames.length],
      isAI: true,
      aiPersonality: personality,
      isReady: true,
      isConnected: true,
    };
    
    this.aiIndex++;
    this.state.players.push(aiPlayer);
    await this.saveState();
    this.broadcast({ type: 'PLAYER_JOINED', player: aiPlayer });
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
  }

  async handleRemoveAI(aiId: string) {
    this.state.players = this.state.players.filter(p => p.id !== aiId);
    await this.saveState();
    this.broadcast({ type: 'PLAYER_LEFT', playerId: aiId });
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
  }

  async handleSetTimer(seconds: number) {
    this.state.timerSeconds = seconds;
    await this.saveState();
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
  }

  // ============================================================================
  // Game Handlers
  // ============================================================================

  async handleStartGame() {
    // Validate: at least 2 players, all humans ready
    const humanPlayers = this.state.players.filter(p => !p.isAI);
    if (this.state.players.length < 2) {
      return;
    }
    if (!humanPlayers.every(p => p.isReady)) {
      return;
    }
    
    // Create game state
    const playerNames = this.state.players.map(p => p.name);
    this.state.gameState = createInitialState(this.state.players.length, playerNames);
    
    // Keep player IDs as "0", "1", "2" etc. (matching the index)
    // The client will map lobby players to these indices
    
    this.state.phase = 'playing';
    this.state.turnStartTime = Date.now();
    
    await this.saveState();
    this.broadcast({ type: 'GAME_STARTED' });
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
    
    if (this.state.gameState) {
      this.broadcast({ 
        type: 'GAME_STATE', 
        gameState: this.state.gameState,
        turnTimeRemaining: this.state.timerSeconds > 0 ? this.state.timerSeconds : null
      });
    }
    
    // Start turn timer if configured
    this.startTurnTimer();
    
    // Check if first player is AI
    this.checkAndPlayAITurn();
  }

  async handleGameAction(action: GameAction, sender: Party.Connection) {
    console.log('[SERVER] Received action:', JSON.stringify(action));
    console.log('[SERVER] Current player:', this.state.gameState?.currentPlayer);
    console.log('[SERVER] Game phase:', this.state.gameState?.currentPhase);
    
    if (!this.state.gameState || this.state.phase !== 'playing') {
      console.log('[SERVER] ERROR: Game not in progress');
      this.send(sender, { type: 'ERROR', message: 'Game not in progress' });
      return;
    }
    
    // Apply action to game state
    const result = gameReducer(this.state.gameState, action);
    console.log('[SERVER] Reducer result success:', result.success, result.success ? '' : ('error' in result ? result.error : ''));
    
    if (!result.success) {
      this.send(sender, { type: 'ERROR', message: ('error' in result ? result.error : 'Invalid action') });
      return;
    }
    
    this.state.gameState = result.state;
    this.state.turnStartTime = Date.now();
    
    // Check for game end
    if (this.state.gameState.gameOver) {
      this.state.phase = 'finished';
      this.stopTurnTimer();
    }
    
    await this.saveState();
    this.broadcast({ 
      type: 'GAME_STATE', 
      gameState: this.state.gameState,
      turnTimeRemaining: this.state.timerSeconds > 0 ? this.state.timerSeconds : null
    });
    this.broadcast({ type: 'LOBBY_STATE', state: this.state });
    
    // Restart turn timer for next player
    if (this.state.phase === 'playing') {
      this.startTurnTimer();
      // Check if next player is an AI and play for them
      this.checkAndPlayAITurn();
    }
  }

  // Check if current player is AI and play for them
  async checkAndPlayAITurn() {
    if (!this.state.gameState || this.state.phase !== 'playing' || this.state.gameState.gameOver) return;
    
    const currentPlayerId = this.state.gameState.currentPlayer;
    const currentPlayerIndex = this.state.players.findIndex((_, i) => String(i) === currentPlayerId);
    const lobbyPlayer = this.state.players[currentPlayerIndex];
    
    if (!lobbyPlayer || !lobbyPlayer.isAI) return;
    
    console.log('[SERVER] AI turn for:', lobbyPlayer.name, 'personality:', lobbyPlayer.aiPersonality);
    
    // Add delay to feel natural
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Get AI action
    const personality = AI_PERSONALITIES[lobbyPlayer.aiPersonality || 'balanced'] || AI_PERSONALITIES.balanced;
    const aiAction = getStrategicAIAction(this.state.gameState, currentPlayerId, personality);
    
    if (aiAction) {
      console.log('[SERVER] AI action:', aiAction.type);
      const result = gameReducer(this.state.gameState, aiAction);
      
      if (result.success) {
        this.state.gameState = result.state;
        this.state.turnStartTime = Date.now();
        
        // Check for game end
        if (this.state.gameState.gameOver) {
          this.state.phase = 'finished';
          this.stopTurnTimer();
        }
        
        await this.saveState();
        this.broadcast({ 
          type: 'GAME_STATE', 
          gameState: this.state.gameState,
          turnTimeRemaining: this.state.timerSeconds > 0 ? this.state.timerSeconds : null
        });
        this.broadcast({ type: 'LOBBY_STATE', state: this.state });
        
        // Continue checking for more AI turns
        if (this.state.phase === 'playing') {
          this.startTurnTimer();
          this.checkAndPlayAITurn();
        }
      } else {
        console.error('[SERVER] AI action failed:', 'error' in result ? result.error : 'unknown');
      }
    }
  }

  // ============================================================================
  // Turn Timer
  // ============================================================================

  startTurnTimer() {
    this.stopTurnTimer();
    
    if (this.state.timerSeconds <= 0) return; // Unlimited time
    
    // Skip timer for AI players - they don't need time limits
    if (this.state.gameState) {
      const currentPlayerId = this.state.gameState.currentPlayer;
      const currentPlayerIndex = this.state.players.findIndex((_, i) => String(i) === currentPlayerId);
      const currentLobbyPlayer = this.state.players[currentPlayerIndex];
      
      if (currentLobbyPlayer?.isAI) {
        console.log('[SERVER] Skipping timer for AI player:', currentLobbyPlayer.name);
        this.state.turnTimeRemaining = null;
        return;
      }
    }
    
    this.state.turnTimeRemaining = this.state.timerSeconds;
    console.log('[SERVER] Starting timer:', this.state.timerSeconds, 'seconds');
    
    this.turnTimer = setInterval(() => {
      if (this.state.turnTimeRemaining !== null && this.state.turnTimeRemaining > 0) {
        this.state.turnTimeRemaining--;
        
        // Broadcast timer update every 5 seconds or when low
        if (this.state.turnTimeRemaining % 5 === 0 || this.state.turnTimeRemaining <= 10) {
          this.broadcast({ 
            type: 'TURN_TIMER_UPDATE', 
            remaining: this.state.turnTimeRemaining 
          });
        }
        
        // Time's up - skip turn
        if (this.state.turnTimeRemaining === 0) {
          // CRITICAL: Stop the timer FIRST to prevent race conditions
          this.stopTurnTimer();
          this.handleTurnTimeout();
        }
      }
    }, 1000);
  }

  stopTurnTimer() {
    if (this.turnTimer) {
      clearInterval(this.turnTimer);
      this.turnTimer = null;
    }
  }

  async handleTurnTimeout() {
    // Prevent re-entry
    if (this.isProcessingTimeout) {
      console.log('[SERVER] Already processing timeout, skipping');
      return;
    }
    this.isProcessingTimeout = true;
    
    if (!this.state.gameState) {
      this.isProcessingTimeout = false;
      return;
    }
    
    const currentPlayerId = this.state.gameState.currentPlayer;
    console.log('[SERVER] Turn timeout for player:', currentPlayerId, 'phase:', this.state.gameState.currentPhase);
    
    // Auto-skip based on current phase
    let skipAction: GameAction | null = null;
    
    switch (this.state.gameState.currentPhase) {
      case 'playTile':
        // Find a valid tile to play - players is a Record, not an array!
        const player = this.state.gameState.players[currentPlayerId];
        if (player && player.tiles.length > 0) {
          // Pick a random tile from their hand
          const randomIndex = Math.floor(Math.random() * player.tiles.length);
          const randomTile = player.tiles[randomIndex];
          console.log('[SERVER] Auto-playing tile:', randomTile, 'for player:', currentPlayerId);
          skipAction = { type: 'PLACE_TILE', playerId: currentPlayerId, tileId: randomTile };
        }
        break;
        
      case 'buyStocks':
        console.log('[SERVER] Auto-skipping buy stocks for player:', currentPlayerId);
        skipAction = { type: 'SKIP_BUY_STOCKS', playerId: currentPlayerId };
        break;
        
      case 'foundChain':
        // Pick first available chain
        const availableChains = Object.entries(this.state.gameState.chains)
          .filter(([_, chain]) => !chain.isActive)
          .map(([name]) => name);
        if (availableChains.length > 0) {
          console.log('[SERVER] Auto-founding chain:', availableChains[0], 'for player:', currentPlayerId);
          skipAction = { 
            type: 'SELECT_CHAIN_TO_FOUND', 
            playerId: currentPlayerId, 
            chainName: availableChains[0] as any 
          };
        }
        break;
        
      case 'resolveMerger':
        // Hold all stock
        console.log('[SERVER] Auto-holding stock for player:', currentPlayerId);
        skipAction = { 
          type: 'HANDLE_DEFUNCT_STOCK', 
          playerId: currentPlayerId, 
          sell: 0, 
          trade: 0 
        };
        break;
    }
    
    if (skipAction) {
      console.log('[SERVER] Executing timeout action:', skipAction.type);
      const result = gameReducer(this.state.gameState, skipAction);
      if (result.success) {
        console.log('[SERVER] Timeout action succeeded, broadcasting update');
        this.state.gameState = result.state;
        this.broadcast({ type: 'TURN_SKIPPED', playerId: currentPlayerId });
        this.broadcast({ 
          type: 'GAME_STATE', 
          gameState: this.state.gameState,
          turnTimeRemaining: this.state.timerSeconds
        });
        await this.saveState();
        
        // Reset flag before starting new timer
        this.isProcessingTimeout = false;
        
        // Start timer for next turn
        this.startTurnTimer();
        
        // Check if next player is AI
        this.checkAndPlayAITurn();
      } else {
        console.log('[SERVER] Timeout action FAILED:', 'error' in result ? result.error : 'unknown');
        this.isProcessingTimeout = false;
      }
    } else {
      console.log('[SERVER] No skip action generated for phase:', this.state.gameState.currentPhase);
      this.isProcessingTimeout = false;
    }
  }
}

