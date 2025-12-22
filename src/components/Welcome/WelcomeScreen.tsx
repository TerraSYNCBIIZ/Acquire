// ============================================================================
// ACQUIRE DIGITAL - Welcome Screen (Redesigned with Custom Art)
// A dramatic, luxurious entrance to the world of hotel empires
// ============================================================================

import React, { useState } from 'react';
import { Play, RotateCcw, HelpCircle } from '../Icons/ChainIcons';
import { Globe, Wifi, X } from 'lucide-react';
import { ChainName } from '../../game/types';
import { CHAIN_DISPLAY_NAMES } from '../../game/constants';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onNewGame: () => void;
  onResumeGame?: () => void;
  onPlayOnline: () => void;
  onRejoinOnline?: () => void;
  rejoinRoomCode?: string;
  onHowToPlay: () => void;
}

const CHAINS: ChainName[] = ['tower', 'luxor', 'american', 'worldwide', 'festival', 'continental', 'imperial'];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNewGame,
  onResumeGame,
  onPlayOnline,
  onRejoinOnline,
  rejoinRoomCode,
  onHowToPlay 
}) => {
  const [expandedChain, setExpandedChain] = useState<ChainName | null>(null);

  const handleChainClick = (chain: ChainName) => {
    setExpandedChain(chain);
  };

  const handleCloseLightbox = () => {
    setExpandedChain(null);
  };

  return (
    <div className="welcome-screen">
      {/* Skyline Background */}
      <div className="welcome-background">
        <img 
          src="/images/backgrounds/acquire-skyline.png" 
          alt="ACQUIRE Skyline" 
          className="skyline-bg"
        />
        <div className="skyline-overlay"></div>
      </div>
      
      <div className="welcome-content">
        {/* Spacer to let the background logo shine */}
        <div className="hero-spacer"></div>
        
        {/* Main Action Card */}
        <div className="welcome-card">
          <div className="welcome-buttons">
            {/* Rejoin Online Game - Show first if available */}
            {onRejoinOnline && rejoinRoomCode && (
              <button className="welcome-btn rejoin-online" onClick={onRejoinOnline}>
                <div className="btn-icon-wrap pulse">
                  <Wifi size={24} />
                </div>
                <div className="btn-content">
                  <span className="btn-title">Rejoin Online Game</span>
                  <span className="btn-desc">Room: {rejoinRoomCode}</span>
                </div>
              </button>
            )}
            
            {onResumeGame && (
              <button className="welcome-btn resume" onClick={onResumeGame}>
                <div className="btn-icon-wrap">
                  <RotateCcw size={24} />
                </div>
                <div className="btn-content">
                  <span className="btn-title">Resume Local Game</span>
                  <span className="btn-desc">Continue your empire</span>
                </div>
              </button>
            )}
            
            <button className="welcome-btn primary" onClick={onNewGame}>
              <div className="btn-icon-wrap">
                <Play size={24} />
              </div>
              <div className="btn-content">
                <span className="btn-title">New Game</span>
                <span className="btn-desc">Play locally with AI</span>
              </div>
            </button>
            
            <button className="welcome-btn online" onClick={onPlayOnline}>
              <div className="btn-icon-wrap">
                <Globe size={24} />
              </div>
              <div className="btn-content">
                <span className="btn-title">Play Online</span>
                <span className="btn-desc">Create or join a room</span>
              </div>
            </button>
            
            <button className="welcome-btn secondary" onClick={onHowToPlay}>
              <div className="btn-icon-wrap">
                <HelpCircle size={24} />
              </div>
              <div className="btn-content">
                <span className="btn-title">How to Play</span>
                <span className="btn-desc">Learn the rules</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Hotel Chains Preview with Images */}
        <div className="chains-showcase">
          <h3 className="showcase-title">Seven Hotel Chains to Control</h3>
          <p className="showcase-hint">Click any hotel to explore</p>
          <div className="chain-images-row">
            {CHAINS.map((chain, i) => (
              <div 
                key={chain} 
                className="chain-image-card"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => handleChainClick(chain)}
              >
                <img 
                  src={`/images/chains/${chain}.png`}
                  alt={CHAIN_DISPLAY_NAMES[chain]}
                  className="chain-hotel-image"
                />
                <div className="chain-name-overlay">
                  {CHAIN_DISPLAY_NAMES[chain]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox for expanded hotel image */}
        {expandedChain && (
          <div className="lightbox-overlay" onClick={handleCloseLightbox}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={handleCloseLightbox}>
                <X size={24} />
              </button>
              <img 
                src={`/images/chains/${expandedChain}.png`}
                alt={CHAIN_DISPLAY_NAMES[expandedChain]}
                className="lightbox-image"
              />
              <div className="lightbox-info">
                <h2 className="lightbox-title">{CHAIN_DISPLAY_NAMES[expandedChain]}</h2>
                <p className="lightbox-tier">
                  {['tower', 'luxor'].includes(expandedChain) && 'Budget Tier - Low cost stocks'}
                  {['american', 'worldwide', 'festival'].includes(expandedChain) && 'Mid Tier - Balanced value'}
                  {['continental', 'imperial'].includes(expandedChain) && 'Premium Tier - High value stocks'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="welcome-footer">
          <p>Based on the classic 1964 board game by Sid Sackson</p>
        </div>
      </div>
    </div>
  );
};
