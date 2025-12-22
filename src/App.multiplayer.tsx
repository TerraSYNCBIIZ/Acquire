// ============================================================================
// ACQUIRE DIGITAL - Multiplayer App Entry Point
// ============================================================================

import { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { AcquireGame } from './game/game';
import { AcquireBoard } from './components/Board/AcquireBoard';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Create the multiplayer client
const AcquireMultiplayerClient = Client({
  game: AcquireGame,
  board: AcquireBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: false,
});

// Lobby component for joining games
function Lobby({ 
  onJoin 
}: { 
  onJoin: (playerID: string, matchID: string, playerName: string) => void 
}) {
  const [matchID, setMatchID] = useState('');
  const [playerID, setPlayerID] = useState('0');
  const [playerName, setPlayerName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const handleCreateMatch = async () => {
    setCreating(true);
    try {
      const response = await fetch(`${SERVER_URL}/games/acquire/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numPlayers: 4 }),
      });
      const { matchID } = await response.json();
      setMatchID(matchID);
      setCreating(false);
    } catch (error) {
      console.error('Failed to create match:', error);
      setCreating(false);
    }
  };
  
  const handleJoin = async () => {
    if (!matchID || !playerName) return;
    
    try {
      const response = await fetch(
        `${SERVER_URL}/games/acquire/${matchID}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerID, playerName }),
        }
      );
      const { playerCredentials } = await response.json();
      // Store credentials in session storage
      sessionStorage.setItem('credentials', playerCredentials);
      onJoin(playerID, matchID, playerName);
    } catch (error) {
      console.error('Failed to join match:', error);
    }
  };
  
  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1 className="lobby-title">Acquire Digital</h1>
        <p className="lobby-subtitle">The classic stock trading board game</p>
        
        <div className="lobby-section">
          <h3>Create New Game</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateMatch}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Match'}
          </button>
        </div>
        
        <div className="lobby-divider">or</div>
        
        <div className="lobby-section">
          <h3>Join Existing Game</h3>
          
          <div className="form-group">
            <label>Match ID</label>
            <input
              type="text"
              value={matchID}
              onChange={(e) => setMatchID(e.target.value)}
              placeholder="Enter match ID"
            />
          </div>
          
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div className="form-group">
            <label>Player Seat</label>
            <select value={playerID} onChange={(e) => setPlayerID(e.target.value)}>
              <option value="0">Player 1</option>
              <option value="1">Player 2</option>
              <option value="2">Player 3</option>
              <option value="3">Player 4</option>
            </select>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleJoin}
            disabled={!matchID || !playerName}
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}

// Main multiplayer app
export function MultiplayerApp() {
  const [gameState, setGameState] = useState<{
    playerID: string;
    matchID: string;
    playerName: string;
  } | null>(null);
  
  if (!gameState) {
    return (
      <Lobby 
        onJoin={(playerID, matchID, playerName) => 
          setGameState({ playerID, matchID, playerName })
        } 
      />
    );
  }
  
  const credentials = sessionStorage.getItem('credentials') || undefined;
  
  return (
    <div className="app">
      <div className="game-header">
        <span className="game-title">Acquire Digital</span>
        <span className="player-name">Playing as: {gameState.playerName}</span>
        <span className="match-id">Match: {gameState.matchID}</span>
      </div>
      <div className="game-container">
        <AcquireMultiplayerClient
          playerID={gameState.playerID}
          matchID={gameState.matchID}
          credentials={credentials}
        />
      </div>
    </div>
  );
}

