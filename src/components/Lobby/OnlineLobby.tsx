// ============================================================================
// ACQUIRE DIGITAL - Online Lobby Component
// Create/Join rooms and wait for players
// ============================================================================

import React, { useState } from 'react';
import { 
  Globe, Users, Bot, Crown, Wifi, WifiOff, Clock, 
  Copy, Check, ArrowLeft, Plus, Minus, Zap, Shield
} from 'lucide-react';
import { TIMER_OPTIONS, OnlinePlayer } from '../../multiplayer';
import type { useMultiplayer } from '../../multiplayer';
import { AI_PERSONALITIES } from '../../game/ai';
import './OnlineLobby.css';

interface OnlineLobbyProps {
  multiplayer: ReturnType<typeof useMultiplayer>;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onBack: () => void;
  onGameStart: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ 
  multiplayer,
  playerName,
  onPlayerNameChange,
  onBack, 
  onGameStart 
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedAI, setSelectedAI] = useState('balanced');
  
  const {
    isConnected,
    isConnecting,
    error,
    lobbyState,
    gameState,
    isHost,
    myPlayer,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    addAI,
    removeAI,
    setTimer,
    startGame,
  } = multiplayer;

  // Copy room code
  const copyRoomCode = () => {
    if (lobbyState?.roomCode) {
      navigator.clipboard.writeText(lobbyState.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if game started
  React.useEffect(() => {
    if (gameState && lobbyState?.phase === 'playing') {
      onGameStart();
    }
  }, [gameState, lobbyState?.phase, onGameStart]);

  // Check if all humans ready and at least 2 players
  const canStart = lobbyState && 
    lobbyState.players.length >= 2 &&
    lobbyState.players.filter(p => !p.isAI).every(p => p.isReady);

  // ============================================================================
  // Render: Not connected - Create/Join screen
  // ============================================================================
  if (!isConnected && !isConnecting) {
    return (
      <div className="online-lobby">
        <div className="lobby-background">
          <div className="lobby-grid"></div>
        </div>
        
        <div className="lobby-container">
          <div className="lobby-header">
            <button className="back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="header-title">
              <Globe size={32} />
              <h1>Play Online</h1>
            </div>
          </div>

          {/* Name Input */}
          <div className="name-section">
            <label htmlFor="player-name">Your Name</label>
            <input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="name-input"
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Create/Join Options */}
          <div className="lobby-options">
            <div className="option-card create-card" onClick={() => playerName && createRoom()}>
              <div className="option-icon">
                <Crown size={40} />
              </div>
              <h2>Create Game</h2>
              <p>Host a new game and invite friends</p>
              <button 
                className="option-btn" 
                disabled={!playerName}
              >
                Create Room
              </button>
            </div>

            <div className="option-divider">
              <span>OR</span>
            </div>

            <div className="option-card join-card">
              <div className="option-icon">
                <Users size={40} />
              </div>
              <h2>Join Game</h2>
              <p>Enter a room code to join</p>
              <div className="join-input-group">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="code-input"
                />
                <button 
                  className="option-btn join-btn"
                  onClick={() => playerName && joinRoom(joinCode)}
                  disabled={!playerName || joinCode.length < 4}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Connecting
  // ============================================================================
  if (isConnecting) {
    return (
      <div className="online-lobby">
        <div className="lobby-background">
          <div className="lobby-grid"></div>
        </div>
        
        <div className="lobby-container">
          <div className="connecting-state">
            <div className="connecting-spinner"></div>
            <h2>Connecting...</h2>
            <p>Joining room {joinCode || 'new room'}...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: In Lobby - Waiting Room
  // ============================================================================
  return (
    <div className="online-lobby">
      <div className="lobby-background">
        <div className="lobby-grid"></div>
      </div>
      
      <div className="lobby-container in-lobby">
        <div className="lobby-header">
          <button className="back-btn" onClick={leaveRoom}>
            <ArrowLeft size={20} />
            <span>Leave</span>
          </button>
          <div className="header-title">
            <Users size={28} />
            <h1>Game Lobby</h1>
          </div>
          <div className="connection-status connected">
            <Wifi size={16} />
            <span>Connected</span>
          </div>
        </div>

        {/* Room Code Banner */}
        <div className="room-code-banner">
          <div className="room-code-label">Room Code</div>
          <div className="room-code-value">
            <span>{lobbyState?.roomCode}</span>
            <button className="copy-btn" onClick={copyRoomCode}>
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="room-code-hint">Share this code with friends to join!</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="lobby-content">
          {/* Players List */}
          <div className="players-section">
            <h2 className="section-title">
              <Users size={20} />
              Players ({lobbyState?.players.length}/{lobbyState?.maxPlayers})
            </h2>
            
            <div className="players-list">
              {lobbyState?.players.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={player}
                  isMe={player.id === multiplayer.playerId}
                  isHost={player.id === lobbyState.hostId}
                  canRemove={isHost && player.isAI}
                  onRemove={() => removeAI(player.id)}
                />
              ))}
              
              {/* Add AI Button */}
              {isHost && lobbyState && lobbyState.players.length < lobbyState.maxPlayers && (
                <div className="add-ai-card">
                  <div className="ai-select">
                    <Bot size={20} />
                    <select 
                      value={selectedAI} 
                      onChange={(e) => setSelectedAI(e.target.value)}
                    >
                      {Object.entries(AI_PERSONALITIES).map(([key, personality]) => (
                        <option key={key} value={key}>
                          {personality.name} AI
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="add-ai-btn" onClick={() => addAI(selectedAI)}>
                    <Plus size={18} />
                    Add AI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings (Host Only) */}
          {isHost && (
            <div className="settings-section">
              <h2 className="section-title">
                <Clock size={20} />
                Turn Timer
              </h2>
              
              <div className="timer-options">
                {TIMER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`timer-option ${lobbyState?.timerSeconds === option.value ? 'active' : ''}`}
                    onClick={() => setTimer(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ready / Start Controls */}
          <div className="lobby-actions">
            {!isHost && myPlayer && (
              <button 
                className={`ready-btn ${myPlayer.isReady ? 'is-ready' : ''}`}
                onClick={toggleReady}
              >
                <Shield size={20} />
                {myPlayer.isReady ? 'Ready!' : 'Click when Ready'}
              </button>
            )}
            
            {isHost && (
              <>
                <button 
                  className={`ready-btn ${myPlayer?.isReady ? 'is-ready' : ''}`}
                  onClick={toggleReady}
                >
                  <Shield size={20} />
                  {myPlayer?.isReady ? 'Ready!' : 'Click when Ready'}
                </button>
                
                <button 
                  className="start-btn"
                  onClick={startGame}
                  disabled={!canStart}
                >
                  <Zap size={22} />
                  <span>Start Game</span>
                </button>
                
                {!canStart && (
                  <p className="start-hint">
                    {lobbyState && lobbyState.players.length < 2 
                      ? 'Need at least 2 players'
                      : 'Waiting for all players to ready up'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Player Card Component
// ============================================================================

interface PlayerCardProps {
  player: OnlinePlayer;
  isMe: boolean;
  isHost: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isMe, 
  isHost, 
  canRemove, 
  onRemove 
}) => {
  const personality = player.aiPersonality 
    ? AI_PERSONALITIES[player.aiPersonality as keyof typeof AI_PERSONALITIES]
    : null;

  return (
    <div className={`player-card ${isMe ? 'is-me' : ''} ${!player.isConnected ? 'disconnected' : ''}`}>
      <div className="player-avatar">
        {player.isAI ? <Bot size={24} /> : <Users size={24} />}
      </div>
      
      <div className="player-info">
        <div className="player-name">
          {player.name}
          {isMe && <span className="you-tag">You</span>}
          {isHost && <Crown size={14} className="host-crown" />}
        </div>
        {player.isAI && personality && (
          <div className="player-type">
            {personality.name} AI
          </div>
        )}
        {!player.isAI && !player.isConnected && (
          <div className="player-status disconnected">
            <WifiOff size={12} />
            Reconnecting...
          </div>
        )}
      </div>
      
      <div className="player-ready-status">
        {player.isReady ? (
          <span className="ready-badge">
            <Check size={16} />
            Ready
          </span>
        ) : (
          <span className="waiting-badge">Waiting...</span>
        )}
      </div>
      
      {canRemove && (
        <button className="remove-btn" onClick={onRemove}>
          <Minus size={16} />
        </button>
      )}
    </div>
  );
};
