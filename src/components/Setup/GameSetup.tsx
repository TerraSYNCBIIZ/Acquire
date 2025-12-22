// ============================================================================
// ACQUIRE DIGITAL - Game Setup Screen (Redesigned)
// Luxurious player configuration with AI personality selection
// ============================================================================

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Bot, 
  Zap, 
  Shield, 
  Target, 
  Sparkles,
  TrendingUp,
  Briefcase,
  Crown,
  BarChart3,
} from '../Icons/ChainIcons';
import './GameSetup.css';

export type AIPersonality = 
  | 'aggressive' 
  | 'balanced' 
  | 'conservative'
  | 'dominator'
  | 'diversifier'
  | 'opportunist'
  | 'accumulator'
  | 'chaotic';

export interface PlayerConfig {
  id: string;
  name: string;
  isAI: boolean;
  aiPersonality: AIPersonality;
}

interface GameSetupProps {
  onStartGame: (players: PlayerConfig[]) => void;
  onBack: () => void;
}

interface PersonalityInfo {
  value: AIPersonality;
  label: string;
  desc: string;
  icon: React.FC<{ size?: number }>;
  color: string;
}

const PERSONALITIES: PersonalityInfo[] = [
  { value: 'aggressive', label: 'Aggressive', desc: 'High risk, high reward', icon: Zap, color: '#ef4444' },
  { value: 'balanced', label: 'Balanced', desc: 'Steady and adaptable', icon: BarChart3, color: '#3b82f6' },
  { value: 'conservative', label: 'Conservative', desc: 'Safe and patient', icon: Shield, color: '#22c55e' },
  { value: 'dominator', label: 'Dominator', desc: 'Controls key chains', icon: Crown, color: '#a855f7' },
  { value: 'diversifier', label: 'Diversifier', desc: 'Spreads investments', icon: Sparkles, color: '#06b6d4' },
  { value: 'opportunist', label: 'Opportunist', desc: 'Exploits mergers', icon: Target, color: '#f59e0b' },
  { value: 'accumulator', label: 'Accumulator', desc: 'Hoards valuable stock', icon: TrendingUp, color: '#10b981' },
  { value: 'chaotic', label: 'Chaotic', desc: 'Unpredictable moves', icon: Briefcase, color: '#ec4899' },
];

const AI_NAMES = [
  'Warren', 'Morgan', 'Rockefeller', 'Carnegie', 'Vanderbilt', 
  'Getty', 'Rothschild', 'Buffett'
];

const getRandomPersonality = (): AIPersonality => {
  const personalities: AIPersonality[] = ['aggressive', 'balanced', 'conservative', 'dominator', 'diversifier', 'opportunist', 'accumulator'];
  return personalities[Math.floor(Math.random() * personalities.length)];
};

export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, onBack }) => {
  const [numPlayers, setNumPlayers] = useState(4);
  const [players, setPlayers] = useState<PlayerConfig[]>(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      name: i === 0 ? 'You' : AI_NAMES[i - 1],
      isAI: i !== 0,
      aiPersonality: i === 0 ? 'balanced' : getRandomPersonality(),
    }))
  );
  
  const updatePlayerCount = (count: number) => {
    setNumPlayers(count);
  };
  
  const updatePlayer = (index: number, updates: Partial<PlayerConfig>) => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], ...updates };
      return newPlayers;
    });
  };
  
  const toggleAI = (index: number) => {
    updatePlayer(index, { 
      isAI: !players[index].isAI,
      name: players[index].isAI ? `Player ${index + 1}` : AI_NAMES[index % AI_NAMES.length],
      aiPersonality: players[index].isAI ? 'balanced' : getRandomPersonality(),
    });
  };
  
  const handleStart = () => {
    onStartGame(players.slice(0, numPlayers));
  };

  const getPersonalityInfo = (personality: AIPersonality): PersonalityInfo => {
    return PERSONALITIES.find(p => p.value === personality) || PERSONALITIES[1];
  };
  
  return (
    <div className="setup-screen">
      {/* Background */}
      <div className="setup-background">
        <img 
          src="/images/backgrounds/acquire-skyline.png" 
          alt="ACQUIRE Skyline" 
          className="setup-skyline-bg"
        />
        <div className="setup-grid-overlay"></div>
      </div>
      
      <div className="setup-container">
        {/* Header */}
        <div className="setup-header">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="header-title">
            <h1>New Game</h1>
            <p>Configure your opponents and start building your empire</p>
          </div>
        </div>
        
        <div className="setup-content">
          {/* Player Count Section */}
          <div className="setup-section">
            <h2 className="section-title">
              <User size={20} />
              Number of Players
            </h2>
            <div className="player-count-selector">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  className={`count-btn ${numPlayers === n ? 'active' : ''}`}
                  onClick={() => updatePlayerCount(n)}
                >
                  <span className="count-number">{n}</span>
                  <span className="count-label">Players</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Players Section */}
          <div className="setup-section">
            <h2 className="section-title">
              <Bot size={20} />
              Players &amp; AI Configuration
            </h2>
            <div className="players-grid">
              {players.slice(0, numPlayers).map((player, i) => {
                const personalityInfo = getPersonalityInfo(player.aiPersonality);
                const PersonalityIcon = personalityInfo.icon;
                
                return (
                  <div 
                    key={i} 
                    className={`player-card ${player.isAI ? 'ai' : 'human'}`}
                    style={{ '--accent-color': player.isAI ? personalityInfo.color : '#4ade80' } as React.CSSProperties}
                  >
                    {/* Player Header */}
                    <div className="player-card-header">
                      <div className="player-avatar" onClick={() => toggleAI(i)}>
                        {player.isAI ? <Bot size={24} /> : <User size={24} />}
                      </div>
                      <div className="player-seat-badge">#{i + 1}</div>
                    </div>
                    
                    {/* Player Name */}
                    <input
                      type="text"
                      className="player-name-input"
                      value={player.name}
                      onChange={(e) => updatePlayer(i, { name: e.target.value })}
                      placeholder={`Player ${i + 1}`}
                    />
                    
                    {/* Type Toggle */}
                    <button
                      className={`type-toggle-btn ${player.isAI ? 'ai' : 'human'}`}
                      onClick={() => toggleAI(i)}
                    >
                      {player.isAI ? 'AI Player' : 'Human'}
                    </button>
                    
                    {/* AI Personality Selector */}
                    {player.isAI && (
                      <div className="personality-section">
                        <div className="personality-current" style={{ borderColor: personalityInfo.color }}>
                          <PersonalityIcon size={16} />
                          <span>{personalityInfo.label}</span>
                        </div>
                        <select
                          className="personality-select"
                          value={player.aiPersonality}
                          onChange={(e) => updatePlayer(i, { aiPersonality: e.target.value as AIPersonality })}
                        >
                          {PERSONALITIES.map(p => (
                            <option key={p.value} value={p.value}>
                              {p.label} - {p.desc}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Hotel Chains Preview */}
          <div className="setup-section chains-preview-section">
            <h2 className="section-title">
              <Target size={20} />
              The Hotel Chains
            </h2>
            <div className="chains-preview-grid">
              {(['tower', 'luxor', 'american', 'worldwide', 'festival', 'continental', 'imperial'] as const).map(chain => (
                <div key={chain} className="chain-preview-item">
                  <img 
                    src={`/images/chains/${chain}.png`}
                    alt={chain}
                    className="chain-preview-img"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="setup-actions">
            <button className="start-game-btn" onClick={handleStart}>
              <span>Start Game</span>
              <Zap size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
