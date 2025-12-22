# Acquire Digital - Implementation Plan

## Document Information
- **Version:** 1.0
- **Created:** December 21, 2025
- **Estimated Duration:** 10-14 weeks
- **Status:** Ready to Execute

---

## Executive Summary

This document outlines the complete implementation plan for building a digital multiplayer version of the classic board game Acquire. The project is divided into 6 phases with clear milestones, deliverables, and acceptance criteria.

---

## Phase Overview

| Phase | Name | Duration | Key Deliverables |
|-------|------|----------|------------------|
| 1 | Foundation & Core Game Logic | 2 weeks | Game state, moves, pure logic |
| 2 | Single-Player Prototype | 2 weeks | Playable local game |
| 3 | UI/UX Development | 3 weeks | Complete visual interface |
| 4 | Multiplayer Integration | 2 weeks | Online multiplayer support |
| 5 | Polish & Testing | 2 weeks | Bug fixes, optimization |
| 6 | Deployment & Launch | 1 week | Production deployment |

---

## Phase 1: Foundation & Core Game Logic
**Duration:** 2 weeks

### Objectives
- Set up project infrastructure
- Implement all game logic as pure functions
- Create boardgame.io game definition
- Achieve 100% test coverage on game logic

### Week 1: Project Setup & Data Structures

#### Day 1-2: Project Initialization
- [ ] Initialize npm project with TypeScript
- [ ] Configure Vite for React + TypeScript
- [ ] Set up ESLint, Prettier, and testing framework (Vitest)
- [ ] Install boardgame.io dependencies
- [ ] Create directory structure per architecture doc

**Deliverable:** Empty project that builds and runs tests

#### Day 3-4: Type Definitions & Constants
- [ ] Define all TypeScript interfaces (see TECHNICAL_ARCHITECTURE.md)
- [ ] Create constants file with:
  - Tile IDs (108 tiles)
  - Chain names and colors
  - Price tables
  - Bonus tables
- [ ] Create utility functions for coordinate conversion

**Deliverable:** Complete type system with no `any` types

#### Day 5: Initial Game State
- [ ] Implement `setup()` function
- [ ] Create initial board state (empty 9x12)
- [ ] Generate and shuffle tile pool
- [ ] Initialize player states
- [ ] Initialize stock market

**Deliverable:** Game that initializes correctly for 2-6 players

### Week 2: Core Game Logic

#### Day 1-2: Board Logic
- [ ] `getAdjacentCells()` - find orthogonal neighbors
- [ ] `getTilePlacementOutcome()` - determine what happens when tile placed
- [ ] `isTilePlayable()` - check if tile can be played
- [ ] `getConnectedTiles()` - flood-fill for chain tiles
- [ ] Unit tests for all board logic

#### Day 3: Chain Logic
- [ ] `foundChain()` - create new chain from tiles
- [ ] `expandChain()` - add tile to existing chain
- [ ] `isChainSafe()` - check if 11+ tiles
- [ ] `getAvailableChains()` - list inactive chains
- [ ] Unit tests

#### Day 4: Stock & Pricing Logic
- [ ] `getStockPrice()` - price based on chain/size
- [ ] `getMajorityBonus()` - majority holder bonus
- [ ] `getMinorityBonus()` - minority holder bonus
- [ ] `calculateShareholderBonuses()` - handle ties
- [ ] `canAffordPurchase()` - validate cash
- [ ] Unit tests

#### Day 5: Merger Logic
- [ ] `analyzeMerger()` - determine survivor/defunct
- [ ] `getMergerResolutionOrder()` - shareholder order
- [ ] `processStockDecision()` - hold/sell/trade
- [ ] `completeMerger()` - finalize merger
- [ ] Unit tests for complex merger scenarios

### Phase 1 Acceptance Criteria
- [ ] All pure logic functions implemented
- [ ] 100% test coverage on logic functions
- [ ] All TypeScript strict mode passes
- [ ] Game can be initialized for any player count

---

## Phase 2: Single-Player Prototype
**Duration:** 2 weeks

### Objectives
- Implement all boardgame.io moves
- Create phase/turn flow
- Build minimal debug UI
- Have playable local game

### Week 3: Moves Implementation

#### Day 1: Tile Placement Move
- [ ] Implement `placeTile` move
- [ ] Server-side validation
- [ ] Trigger appropriate phase transitions
- [ ] Integration tests

#### Day 2: Chain Founding Move
- [ ] Implement `selectChainToFound` move
- [ ] Award founder's bonus
- [ ] Update chain state
- [ ] Integration tests

#### Day 3: Stock Purchase Move
- [ ] Implement `buyStocks` move
- [ ] Validate purchase limits (max 3)
- [ ] Process payment and stock transfer
- [ ] Implement `skipBuyStocks` move
- [ ] Integration tests

#### Day 4-5: Merger Resolution Moves
- [ ] Implement `chooseMergerSurvivor` move
- [ ] Implement `handleDefunctStock` move
- [ ] Handle complex multi-chain mergers
- [ ] Proper turn ordering during merger
- [ ] Integration tests for edge cases

### Week 4: Game Flow & Debug UI

#### Day 1-2: Phase Configuration
- [ ] Configure `playTile` phase
- [ ] Configure `foundChain` phase
- [ ] Configure `resolveMerger` phase
- [ ] Configure `buyStocks` phase
- [ ] Configure `gameEnd` phase
- [ ] Turn advancement logic
- [ ] End-of-turn tile draw

#### Day 3: End Game Logic
- [ ] Implement `declareGameEnd` move
- [ ] End condition validation
- [ ] Final scoring calculation
- [ ] Winner determination

#### Day 4-5: Debug UI
- [ ] Simple React component showing state
- [ ] Board grid visualization (colored cells)
- [ ] Player hand display
- [ ] Stock holdings table
- [ ] Action buttons for each move
- [ ] Game log display

### Phase 2 Acceptance Criteria
- [ ] Complete game playable locally
- [ ] All phases work correctly
- [ ] Mergers resolve properly
- [ ] End game scores calculated correctly
- [ ] No console errors during play

---

## Phase 3: UI/UX Development
**Duration:** 3 weeks

### Objectives
- Create polished visual design
- Build responsive layout
- Add animations
- Implement accessibility

### Week 5: Core Components

#### Day 1-2: Design System
- [ ] Color palette (chain colors, UI colors)
- [ ] Typography scale
- [ ] Component spacing system
- [ ] Create Tailwind config
- [ ] Icon set selection

#### Day 3-4: Board Component
- [ ] Responsive grid layout
- [ ] Cell rendering with states:
  - Empty
  - Unincorporated tile
  - Chain tile (7 colors)
- [ ] Hover effects for valid placements
- [ ] Board labels (1-12, A-I)

#### Day 5: Tile Components
- [ ] Player hand component
- [ ] Tile visual design
- [ ] Playable/unplayable states
- [ ] Selection interaction
- [ ] Drag-and-drop (optional)

### Week 6: Panels & Dialogs

#### Day 1-2: Side Panel
- [ ] Chain info cards
  - Chain name and color
  - Tile count
  - Current stock price
  - Safe indicator
  - Available stock count
- [ ] Collapsible sections
- [ ] Responsive for mobile

#### Day 3: Player Info Panel
- [ ] Current player highlight
- [ ] Cash display
- [ ] Stock holdings grid
- [ ] Turn indicator
- [ ] Ready/waiting status

#### Day 4: Stock Purchase Panel
- [ ] Active during buyStocks phase
- [ ] Chain selection dropdown/cards
- [ ] Quantity selectors
- [ ] Running total display
- [ ] Confirm/Skip buttons
- [ ] Validation feedback

#### Day 5: Merger Resolution Dialog
- [ ] Modal overlay
- [ ] Bonus display
- [ ] Hold/Sell/Trade interface
- [ ] Quantity inputs with validation
- [ ] Trade calculator (2:1 ratio)
- [ ] Submit button

### Week 7: Animation & Polish

#### Day 1-2: Animations
- [ ] Tile placement animation
- [ ] Chain founding animation
- [ ] Stock purchase feedback
- [ ] Merger visual effects
- [ ] Turn transition
- [ ] Victory celebration

#### Day 3: Sound Design
- [ ] Tile placement sound
- [ ] Chain founding chime
- [ ] Merger alert
- [ ] Cash register (purchase)
- [ ] Turn notification
- [ ] Victory fanfare
- [ ] Volume controls

#### Day 4: Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] High contrast mode
- [ ] Color blind mode (patterns)
- [ ] Focus indicators

#### Day 5: Responsive Design
- [ ] Desktop layout (1920x1080)
- [ ] Laptop layout (1366x768)
- [ ] Tablet layout (1024x768)
- [ ] Mobile layout (375x812)
- [ ] Touch interactions

### Phase 3 Acceptance Criteria
- [ ] Visually polished appearance
- [ ] Smooth 60fps animations
- [ ] Responsive on all screen sizes
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Sound effects (with mute)

---

## Phase 4: Multiplayer Integration
**Duration:** 2 weeks

### Objectives
- Implement lobby system
- Deploy game server
- Enable online play
- Add player authentication

### Week 8: Server & Lobby

#### Day 1-2: Server Setup
- [ ] Create Express server with boardgame.io
- [ ] Configure database connection
- [ ] Implement storage adapter
- [ ] Environment configuration
- [ ] Docker containerization

#### Day 3-4: Lobby System
- [ ] Lobby API integration
- [ ] Create game form
- [ ] Game list display
- [ ] Join game flow
- [ ] Player name handling
- [ ] Game settings (player count, rules)

#### Day 5: Authentication
- [ ] Simple username/password auth
- [ ] Session management
- [ ] Player profiles (optional)
- [ ] Guest play option

### Week 9: Real-time Features

#### Day 1-2: Multiplayer Testing
- [ ] Multi-client synchronization
- [ ] Turn notification
- [ ] Reconnection handling
- [ ] State recovery on disconnect
- [ ] Error handling

#### Day 3: Spectator Mode
- [ ] Watch live games
- [ ] Read-only view
- [ ] Spectator count display
- [ ] Chat for spectators

#### Day 4: Chat System
- [ ] In-game chat
- [ ] Player-to-player messages
- [ ] Chat moderation basics
- [ ] Emoji support

#### Day 5: Additional Features
- [ ] Game history/replay
- [ ] Rematch functionality
- [ ] Friend invites
- [ ] Private games (password)

### Phase 4 Acceptance Criteria
- [ ] 4+ players can play simultaneously
- [ ] Reconnection works smoothly
- [ ] Lobby shows active games
- [ ] Chat functional
- [ ] No desync issues

---

## Phase 5: Polish & Testing
**Duration:** 2 weeks

### Objectives
- Comprehensive testing
- Performance optimization
- Bug fixes
- User feedback integration

### Week 10: Testing

#### Day 1-2: Unit Test Coverage
- [ ] Increase coverage to 90%+
- [ ] Edge case testing
- [ ] Error path testing
- [ ] Mock external services

#### Day 3-4: Integration Testing
- [ ] Full game flow tests
- [ ] Multiplayer scenario tests
- [ ] Network failure tests
- [ ] State consistency tests

#### Day 5: End-to-End Testing
- [ ] Playwright/Cypress setup
- [ ] Critical path tests
- [ ] Cross-browser testing
- [ ] Mobile testing

### Week 11: Optimization & Bug Fixes

#### Day 1-2: Performance
- [ ] React profiling
- [ ] Bundle size optimization
- [ ] Lazy loading
- [ ] Image optimization
- [ ] WebSocket efficiency

#### Day 3-4: Bug Fixing
- [ ] Address all known bugs
- [ ] Validate all edge cases
- [ ] Memory leak detection
- [ ] Error boundary implementation

#### Day 5: User Testing
- [ ] Internal playtest sessions
- [ ] Gather feedback
- [ ] Prioritize fixes
- [ ] Document known issues

### Phase 5 Acceptance Criteria
- [ ] 90%+ test coverage
- [ ] No critical bugs
- [ ] <100ms response time
- [ ] <2MB bundle size
- [ ] Clean error handling

---

## Phase 6: Deployment & Launch
**Duration:** 1 week

### Objectives
- Production deployment
- Monitoring setup
- Documentation
- Soft launch

### Week 12: Go Live

#### Day 1-2: Infrastructure
- [ ] Production server setup
- [ ] Database provisioning
- [ ] SSL certificates
- [ ] Domain configuration
- [ ] CDN for static assets

#### Day 3: Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Analytics integration
- [ ] Log aggregation

#### Day 4: Documentation
- [ ] User guide/tutorial
- [ ] FAQ page
- [ ] API documentation
- [ ] Contribution guidelines
- [ ] License file

#### Day 5: Launch
- [ ] Final testing on production
- [ ] Soft launch to limited users
- [ ] Monitor for issues
- [ ] Prepare for wider release

### Phase 6 Acceptance Criteria
- [ ] Production stable
- [ ] Monitoring active
- [ ] Documentation complete
- [ ] Support channels ready

---

## Resource Requirements

### Development Tools
| Tool | Purpose | Cost |
|------|---------|------|
| VS Code | IDE | Free |
| Vite | Build tool | Free |
| Vitest | Testing | Free |
| Playwright | E2E testing | Free |
| PostgreSQL | Database | Free (self-hosted) |
| Docker | Containerization | Free |

### Hosting (Estimated Monthly)
| Service | Purpose | Cost |
|---------|---------|------|
| Railway/Render | Server hosting | $5-20/mo |
| PostgreSQL | Database | $5-15/mo |
| Cloudflare | CDN + DNS | Free |
| Domain | acquire.game | $15/year |

### External Services
| Service | Purpose | Cost |
|---------|---------|------|
| Sentry | Error tracking | Free tier |
| Google Analytics | Analytics | Free |
| GitHub | Source control | Free |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex merger edge cases | Medium | High | Extensive unit testing |
| Multiplayer sync issues | Medium | High | boardgame.io handles most |
| Performance on mobile | Low | Medium | Progressive enhancement |
| Player abandonment | Medium | Medium | AI replacement option |
| Legal (IP) concerns | Low | High | Rename if needed |

---

## Success Metrics

### Technical
- [ ] 99.9% uptime
- [ ] <100ms move latency
- [ ] <2s initial load time
- [ ] 0 critical bugs in production

### User Experience
- [ ] Complete game in <60 minutes
- [ ] <5% abandonment rate
- [ ] Positive feedback from testers

---

## Post-Launch Roadmap

### Version 1.1 (Month 2)
- AI opponents for single-player
- Tournament mode
- Leaderboards

### Version 1.2 (Month 3)
- Mobile app (React Native)
- Push notifications
- Achievements

### Version 2.0 (Month 6)
- Alternative rule variants
- Custom board sizes
- Skins/themes

---

## Appendix: Daily Standup Template

```
## Date: YYYY-MM-DD

### Yesterday
- [Completed task 1]
- [Completed task 2]

### Today
- [Planned task 1]
- [Planned task 2]

### Blockers
- [Any blockers]

### Notes
- [Observations, decisions made]
```

---

## Appendix: Git Workflow

```bash
# Feature branches
git checkout -b feature/board-logic

# Commit messages
feat: Add tile placement logic
fix: Correct merger bonus calculation
test: Add unit tests for stock pricing
docs: Update implementation plan
style: Format code with prettier
refactor: Extract pricing to separate module

# Pull request required for main
# CI must pass before merge
```

