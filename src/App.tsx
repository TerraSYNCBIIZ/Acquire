// ============================================================================
// ACQUIRE DIGITAL - Main Application
// Clean, modular React implementation with Online Multiplayer Support
// ============================================================================

import { useState, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { WelcomeScreen } from './components/Welcome';
import { GameSetup, PlayerConfig, AIPersonality } from './components/Setup';
import { GameBoard } from './components/Game';
import { HowToPlay } from './components/HowToPlay';
import { OnlineLobby } from './components/Lobby';
import { TurnTimer } from './components/Timer';
import { useMultiplayer } from './multiplayer';

type AppScreen = 'welcome' | 'setup' | 'online-lobby' | 'playing';
type GameMode = 'local' | 'online';

function App() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [playerName, setPlayerName] = useState(() => 
    localStorage.getItem('acquire_player_name') || ''
  );
  
  // Local game state
  const {
    gameState: localGameState,
    playerConfigs: localPlayerConfigs,
    hasSavedGame,
    resumeGame,
    startNewGame,
    dispatch,
    leaveGame,
    quitGame,
  } = useGameState();

  // Multiplayer state - hoisted to App level so it persists across screens
  const multiplayer = useMultiplayer(playerName);
  const { 
    gameState: onlineGameState, 
    lobbyState, 
    turnTimeRemaining,
    sendGameAction,
    playerId,
    leaveRoom,
    canRejoin,
    rejoinRoom,
    savedRoomCode
  } = multiplayer;

  // ============================================================================
  // Local Game Handlers
  // ============================================================================

  const handleNewGame = () => {
    setGameMode('local');
    setScreen('setup');
  };

  const handleResumeGame = () => {
    if (resumeGame()) {
      setGameMode('local');
      setScreen('playing');
    }
  };

  const handleStartGame = (players: PlayerConfig[]) => {
    startNewGame(players);
    setScreen('playing');
  };

  const handleBackToMenu = () => {
    if (gameMode === 'online') {
      leaveRoom();
    } else {
      leaveGame();
    }
    setScreen('welcome');
  };

  const handleEndGame = () => {
    if (gameMode === 'online') {
      leaveRoom();
    } else {
      quitGame();
    }
    setScreen('welcome');
  };

  // ============================================================================
  // Online Game Handlers
  // ============================================================================

  const handlePlayOnline = () => {
    setGameMode('online');
    setScreen('online-lobby');
  };

  const handleRejoinOnline = () => {
    setGameMode('online');
    rejoinRoom();
    // If successfully rejoined, go straight to game or lobby
    setScreen('online-lobby');
  };

  const handleOnlineGameStart = useCallback(() => {
    setScreen('playing');
  }, []);

  const handleOnlineBackToLobby = () => {
    setScreen('online-lobby');
  };

  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('acquire_player_name', name);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="app">
      {screen === 'welcome' && (
        <WelcomeScreen
          onNewGame={handleNewGame}
          onResumeGame={hasSavedGame ? handleResumeGame : undefined}
          onPlayOnline={handlePlayOnline}
          onRejoinOnline={canRejoin ? handleRejoinOnline : undefined}
          rejoinRoomCode={savedRoomCode || undefined}
          onHowToPlay={() => setShowHowToPlay(true)}
        />
      )}

      {screen === 'setup' && (
        <GameSetup
          onStartGame={handleStartGame}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'online-lobby' && (
        <OnlineLobby
          multiplayer={multiplayer}
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          onBack={() => setScreen('welcome')}
          onGameStart={handleOnlineGameStart}
        />
      )}

      {/* Local Game */}
      {screen === 'playing' && gameMode === 'local' && localGameState && (
        <GameBoard
          state={localGameState}
          playerConfigs={localPlayerConfigs}
          humanPlayerId="0"
          onAction={dispatch}
          onBack={handleBackToMenu}
          onEndGame={handleEndGame}
          onShowHelp={() => setShowHowToPlay(true)}
        />
      )}

      {/* Online Game */}
      {screen === 'playing' && gameMode === 'online' && onlineGameState && (
        <OnlineGameWrapper
          gameState={onlineGameState}
          lobbyState={lobbyState}
          turnTimeRemaining={turnTimeRemaining}
          sendGameAction={sendGameAction}
          playerId={playerId}
          onBack={handleOnlineBackToLobby}
          onEndGame={handleEndGame}
          onShowHelp={() => setShowHowToPlay(true)}
        />
      )}

      {showHowToPlay && (
        <HowToPlay onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}

// ============================================================================
// Online Game Wrapper Component
// ============================================================================

interface OnlineGameWrapperProps {
  gameState: any;
  lobbyState: any;
  turnTimeRemaining: number | null;
  sendGameAction: (action: any) => void;
  playerId: string;
  onBack: () => void;
  onEndGame: () => void;
  onShowHelp: () => void;
}

function OnlineGameWrapper({ 
  gameState, 
  lobbyState, 
  turnTimeRemaining, 
  sendGameAction, 
  playerId,
  onBack, 
  onEndGame, 
  onShowHelp 
}: OnlineGameWrapperProps) {
  
  // Find my player index - this becomes my player ID in the game
  const myPlayerIndex = lobbyState?.players.findIndex((p: any) => p.id === playerId) ?? -1;
  const humanPlayerId = myPlayerIndex >= 0 ? String(myPlayerIndex) : '0';

  // Check if it's my turn (game uses "0", "1", "2" as player IDs)
  const isMyTurn = gameState.currentPlayer === humanPlayerId;

  // Build player configs from lobby state
  const playerConfigs: PlayerConfig[] = lobbyState?.players.map((p: any, i: number) => ({
    id: String(i),
    name: p.name,
    isAI: p.isAI,
    aiPersonality: (p.aiPersonality || 'balanced') as AIPersonality,
  })) || [];

  return (
    <div className="online-game-wrapper">
      {/* Turn Timer */}
      {turnTimeRemaining !== null && (
        <div className="online-timer-overlay">
          <TurnTimer 
            remaining={turnTimeRemaining} 
            isMyTurn={isMyTurn}
          />
        </div>
      )}

      {/* Game Board */}
      <GameBoard
        state={gameState}
        playerConfigs={playerConfigs}
        humanPlayerId={humanPlayerId}
        onAction={sendGameAction}
        onBack={onBack}
        onEndGame={onEndGame}
        onShowHelp={onShowHelp}
        isOnline={true}
      />
    </div>
  );
}

export default App;
