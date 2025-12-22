// ============================================================================
// ACQUIRE DIGITAL - How to Play Instructions
// ============================================================================

import React, { useState } from 'react';
import './HowToPlay.css';

interface HowToPlayProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    content: `
      <p><strong>Acquire</strong> is a game of strategy where players compete to become the wealthiest through building hotel chains and trading stocks.</p>
      
      <h4>Goal</h4>
      <p>Have the most money when the game ends. Money is earned through:</p>
      <ul>
        <li>Shareholder bonuses when chains merge</li>
        <li>Selling stocks at the right time</li>
        <li>Holding valuable stocks at game end</li>
      </ul>
      
      <h4>Components</h4>
      <ul>
        <li><strong>108 tiles</strong> labeled 1A through 12I</li>
        <li><strong>7 hotel chains</strong> with different values</li>
        <li><strong>Stock certificates</strong> for each chain</li>
        <li><strong>Money</strong> - each player starts with $6,000</li>
      </ul>
    `,
  },
  {
    id: 'turn',
    title: 'Your Turn',
    content: `
      <p>Each turn has 3 phases:</p>
      
      <div class="turn-phase">
        <span class="phase-number">1</span>
        <div class="phase-content">
          <h4>Place a Tile</h4>
          <p>Click a tile from your hand, then click the matching board position. Tiles can:</p>
          <ul>
            <li><strong>Stand alone</strong> - just sits on the board</li>
            <li><strong>Found a chain</strong> - connects to existing tile(s), you pick which chain</li>
            <li><strong>Expand a chain</strong> - added to an existing chain</li>
            <li><strong>Trigger a merger</strong> - connects two or more chains</li>
          </ul>
        </div>
      </div>
      
      <div class="turn-phase">
        <span class="phase-number">2</span>
        <div class="phase-content">
          <h4>Buy Stocks</h4>
          <p>Purchase up to <strong>3 stocks</strong> from active chains. Prices increase as chains grow larger.</p>
        </div>
      </div>
      
      <div class="turn-phase">
        <span class="phase-number">3</span>
        <div class="phase-content">
          <h4>Draw a Tile</h4>
          <p>Automatically draw a new tile to maintain 6 in hand. Then your turn ends.</p>
        </div>
      </div>
    `,
  },
  {
    id: 'chains',
    title: 'Hotel Chains',
    content: `
      <p>There are 7 hotel chains in 3 pricing tiers:</p>
      
      <div class="chain-tier">
        <h4>Tier 1 - Budget</h4>
        <div class="tier-chains">
          <span class="chain-badge tower">Tower</span>
          <span class="chain-badge luxor">Luxor</span>
        </div>
        <p>Cheapest stocks ($200-$1,000)</p>
      </div>
      
      <div class="chain-tier">
        <h4>Tier 2 - Standard</h4>
        <div class="tier-chains">
          <span class="chain-badge american">American</span>
          <span class="chain-badge worldwide">Worldwide</span>
          <span class="chain-badge festival">Festival</span>
        </div>
        <p>Mid-range stocks ($300-$1,100)</p>
      </div>
      
      <div class="chain-tier">
        <h4>Tier 3 - Premium</h4>
        <div class="tier-chains">
          <span class="chain-badge continental">Continental</span>
          <span class="chain-badge imperial">Imperial</span>
        </div>
        <p>Most expensive stocks ($400-$1,200)</p>
      </div>
      
      <h4>Safe Chains</h4>
      <p>Chains with <strong>11 or more tiles</strong> become "safe" and cannot be acquired in a merger. Look for the ★ indicator.</p>
    `,
  },
  {
    id: 'mergers',
    title: 'Mergers',
    content: `
      <p>When you place a tile connecting two or more chains, a <strong>merger</strong> occurs!</p>
      
      <h4>Which Chain Survives?</h4>
      <ul>
        <li>The <strong>larger chain</strong> absorbs smaller chains</li>
        <li>If tied, the player who caused the merger chooses</li>
        <li>"Safe" chains (11+ tiles) cannot be absorbed</li>
      </ul>
      
      <h4>Shareholder Bonuses</h4>
      <p>When a chain is absorbed, stockholders receive bonuses:</p>
      <ul>
        <li><strong>Majority holder</strong>: 10× stock price</li>
        <li><strong>Minority holder</strong>: 5× stock price</li>
        <li>Ties split the combined bonus</li>
      </ul>
      
      <h4>Defunct Stock Options</h4>
      <p>After bonuses, stockholders must decide what to do with defunct shares:</p>
      <ul>
        <li><strong>Hold</strong> - Keep shares (chain might reform later)</li>
        <li><strong>Sell</strong> - Cash out at current price</li>
        <li><strong>Trade</strong> - Exchange 2 defunct for 1 survivor</li>
      </ul>
    `,
  },
  {
    id: 'endgame',
    title: 'Game End',
    content: `
      <h4>When Does the Game End?</h4>
      <p>Any player can declare game end when:</p>
      <ul>
        <li>A chain reaches <strong>41 or more tiles</strong>, OR</li>
        <li>All active chains are <strong>safe</strong> (11+ tiles)</li>
      </ul>
      
      <h4>Final Scoring</h4>
      <p>When the game ends:</p>
      <ol>
        <li>Bonuses are paid for ALL active chains</li>
        <li>All stocks are sold at current prices</li>
        <li>Player with the most total cash wins!</li>
      </ol>
      
      <div class="tip-box">
        <strong>💡 Strategy Tip</strong>
        <p>Sometimes it's better to end the game early if you have a strong position, rather than letting opponents catch up!</p>
      </div>
    `,
  },
  {
    id: 'interface',
    title: 'Controls',
    content: `
      <h4>Playing Tiles</h4>
      <ol>
        <li>Click a tile in your hand (bottom of screen)</li>
        <li>Click the matching position on the board</li>
        <li>Playable positions glow green</li>
      </ol>
      
      <h4>Buying Stocks</h4>
      <ol>
        <li>After placing a tile, the stock purchase panel appears</li>
        <li>Use + and - buttons to select quantities</li>
        <li>Maximum 3 stocks per turn</li>
        <li>Click "Buy" to confirm or "Skip" to pass</li>
      </ol>
      
      <h4>Game Information</h4>
      <ul>
        <li><strong>Side Panel</strong> - Shows your cash, stocks, and chain info</li>
        <li><strong>Chain Cards</strong> - Display current size, price, and availability</li>
        <li><strong>Game Log</strong> - Record of all actions</li>
      </ul>
    `,
  },
];

export const HowToPlay: React.FC<HowToPlayProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');
  
  const currentSection = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
  
  return (
    <div className="how-to-play-overlay">
      <div className="how-to-play-modal">
        <div className="how-to-play-header">
          <h2>How to Play</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="how-to-play-content">
          <nav className="section-nav">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                className={`nav-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.title}
              </button>
            ))}
          </nav>
          
          <div className="section-content">
            <h3>{currentSection.title}</h3>
            <div 
              className="content-body"
              dangerouslySetInnerHTML={{ __html: currentSection.content }}
            />
          </div>
        </div>
        
        <div className="how-to-play-footer">
          <button className="got-it-btn" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

