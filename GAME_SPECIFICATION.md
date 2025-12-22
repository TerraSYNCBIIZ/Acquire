# Acquire Digital - Complete Game Specification

## Document Information
- **Version:** 1.0
- **Created:** December 21, 2025
- **Status:** Research Complete - Ready for Implementation

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Game Components](#game-components)
3. [Hotel Chains](#hotel-chains)
4. [Stock Pricing Chart](#stock-pricing-chart)
5. [Game Setup](#game-setup)
6. [Turn Structure](#turn-structure)
7. [Tile Placement Rules](#tile-placement-rules)
8. [Merger Mechanics](#merger-mechanics)
9. [Stock Transactions](#stock-transactions)
10. [End Game Conditions](#end-game-conditions)
11. [Edge Cases & Special Rules](#edge-cases--special-rules)

---

## Game Overview

**Acquire** is a classic strategic board game designed by **Sid Sackson** and first published in **1964**. Players act as investors, founding and expanding hotel chains, buying and trading stocks, and strategically merging companies to accumulate wealth.

| Property | Value |
|----------|-------|
| Designer | Sid Sackson |
| Year | 1964 |
| Players | 2-6 |
| Playing Time | 60-90 minutes |
| Age | 12+ |
| Genre | Economic, Stock Trading |

**Objective:** Accumulate the most money through strategic stock purchases, well-timed mergers, and shrewd investment decisions. The player with the most money at the end of the game wins.

---

## Game Components

### Physical Components
| Component | Quantity | Description |
|-----------|----------|-------------|
| Game Board | 1 | 12x9 grid labeled 1A to 12I (108 spaces) |
| Building Tiles | 108 | Matching grid spaces (1A, 1B... 12I) |
| Hotel Chain Markers | 7 | Building-shaped markers for each chain |
| Stock Certificates | 175 total | 25 per hotel chain (7 chains) |
| Play Money | Various | Denominations: $100, $500, $1,000, $5,000, $10,000 |
| Information Cards | 6 | Stock price/bonus reference charts |
| Stock Market Tray | 1 | Holds stock certificates and money |

### Digital Equivalents
| Physical | Digital Representation |
|----------|----------------------|
| Game Board | Interactive 12x9 grid canvas |
| Building Tiles | Draggable/clickable tile objects |
| Hotel Chain Markers | Color-coded visual indicators |
| Stock Certificates | Digital counters per player/chain |
| Play Money | Numeric balance display |
| Information Cards | Always-visible sidebar/overlay |
| Stock Market Tray | Stock availability panel |

---

## Hotel Chains

### The Seven Chains
Acquire features **7 hotel chains** organized into **3 pricing tiers**:

| Tier | Chain Name | Color | Stock Price Tier |
|------|------------|-------|------------------|
| **TIER 1 (Budget)** | Tower | Yellow | Lowest |
| **TIER 1 (Budget)** | Luxor | Orange | Lowest |
| **TIER 2 (Standard)** | American | Blue | Medium |
| **TIER 2 (Standard)** | Worldwide | Brown | Medium |
| **TIER 2 (Standard)** | Festival | Green | Medium |
| **TIER 3 (Luxury)** | Continental | Teal | Highest |
| **TIER 3 (Luxury)** | Imperial | Red | Highest |

### Chain States
| State | Description | Visual Indicator |
|-------|-------------|------------------|
| **Inactive** | Not yet founded | Gray/muted in selector |
| **Active** | Founded and on board | Bright color with marker |
| **Safe** | 11+ tiles, cannot be acquired | Distinct border/icon |
| **Defunct** | Absorbed in merger | Removed from board |

---

## Stock Pricing Chart

### Stock Price Per Share (by Chain Size)

| Chain Size | Tier 1 (Tower/Luxor) | Tier 2 (American/Worldwide/Festival) | Tier 3 (Continental/Imperial) |
|------------|---------------------|--------------------------------------|------------------------------|
| 2 tiles | $200 | $300 | $400 |
| 3 tiles | $300 | $400 | $500 |
| 4 tiles | $400 | $500 | $600 |
| 5 tiles | $500 | $600 | $700 |
| 6-10 tiles | $600 | $700 | $800 |
| 11-20 tiles | $700 | $800 | $900 |
| 21-30 tiles | $800 | $900 | $1,000 |
| 31-40 tiles | $900 | $1,000 | $1,100 |
| 41+ tiles | $1,000 | $1,100 | $1,200 |

### Majority & Minority Shareholder Bonuses

| Chain Size | Tier 1 Majority/Minority | Tier 2 Majority/Minority | Tier 3 Majority/Minority |
|------------|--------------------------|--------------------------|--------------------------|
| 2 tiles | $2,000 / $1,000 | $3,000 / $1,500 | $4,000 / $2,000 |
| 3 tiles | $3,000 / $1,500 | $4,000 / $2,000 | $5,000 / $2,500 |
| 4 tiles | $4,000 / $2,000 | $5,000 / $2,500 | $6,000 / $3,000 |
| 5 tiles | $5,000 / $2,500 | $6,000 / $3,000 | $7,000 / $3,500 |
| 6-10 tiles | $6,000 / $3,000 | $7,000 / $3,500 | $8,000 / $4,000 |
| 11-20 tiles | $7,000 / $3,500 | $8,000 / $4,000 | $9,000 / $4,500 |
| 21-30 tiles | $8,000 / $4,000 | $9,000 / $4,500 | $10,000 / $5,000 |
| 31-40 tiles | $9,000 / $4,500 | $10,000 / $5,000 | $11,000 / $5,500 |
| 41+ tiles | $10,000 / $5,000 | $11,000 / $5,500 | $12,000 / $6,000 |

**Formula:** Majority Bonus = Stock Price × 10, Minority Bonus = Stock Price × 5

---

## Game Setup

### Initial Setup Steps

1. **Board Preparation**
   - Place game board in center
   - Shuffle all 108 tiles face-down in a pool

2. **Money Distribution**
   - Each player receives **$6,000** starting cash:
     - 4 × $1,000 bills
     - 3 × $500 bills
     - 5 × $100 bills

3. **Tile Distribution**
   - Each player draws **6 tiles** for their starting hand
   - Tiles remain hidden from other players

4. **First Player Determination**
   - Each player draws 1 tile and places it on the matching board space
   - Player with tile closest to **1A** goes first
   - Closeness: 9A is closer than 1B (column first, then row)
   - These tiles remain on the board as "unincorporated" tiles

5. **Stock Setup**
   - Place 25 stock certificates for each chain in the market
   - All chains start as "inactive"

### Player Configuration
| Players | Starting Cash | Tiles in Hand |
|---------|--------------|---------------|
| 2-6 | $6,000 | 6 tiles |

---

## Turn Structure

Each turn consists of **3 mandatory phases** in order:

### Phase 1: Play a Tile (REQUIRED)
The active player MUST play exactly one tile from their hand onto the matching board space.

**Possible Outcomes:**
| Outcome | Condition | Result |
|---------|-----------|--------|
| Nothing | Tile isolated (no adjacent tiles) | Tile placed, no chain affected |
| Expand Chain | Adjacent to existing chain | Chain grows by 1 tile |
| Found Chain | Adjacent to unincorporated tile(s) | New chain created |
| Merge Chains | Connects 2+ chains | Larger absorbs smaller |

### Phase 2: Buy Stocks (OPTIONAL)
- Player may purchase **0 to 3 stock certificates**
- Can buy from **any active chain(s)** in any combination
- Must have sufficient cash
- Chain must have stock available in the market

**Examples of valid purchases:**
- 0 stocks (skip buying)
- 3 stocks in one chain
- 2 in one chain, 1 in another
- 1 each in three different chains

### Phase 3: Draw a Tile (REQUIRED)
- Draw 1 tile from the pool to replenish hand to 6 tiles
- **Dead Tile Exchange:** If holding permanently unplayable tiles:
  - May exchange ONE dead tile for a new tile (once per turn)
  - Dead tiles that would form 8th corporation cannot be exchanged

---

## Tile Placement Rules

### Valid Tile Placement
- Every tile has a designated space (e.g., tile "5D" goes on space 5D)
- Players must play on the matching space
- Cannot skip playing a tile (if possible)

### Tile Placement Outcomes

#### 1. Isolated Placement
- Tile has no orthogonally adjacent tiles
- Tile becomes an "unincorporated" tile
- No further action required

#### 2. Founding a New Chain
**Trigger:** Tile placed adjacent to 1+ unincorporated tiles

**Process:**
1. Player selects any **inactive** chain marker
2. Place marker on the newly formed chain
3. Founder receives **1 FREE stock certificate** (Founder's Bonus)
   - Only if stock is available
4. All connected tiles become part of the new chain

**Restriction:** Cannot found an 8th chain (maximum 7 active)

#### 3. Expanding an Existing Chain
**Trigger:** Tile placed adjacent to an active chain

**Result:** The tile joins that chain, increasing its size by 1

#### 4. Merging Chains
**Trigger:** Tile placed connecting 2+ separate chains

See [Merger Mechanics](#merger-mechanics) section.

### Unplayable Tiles

| Type | Description | Resolution |
|------|-------------|------------|
| **Dead Tile** | Would merge 2+ safe chains | Can exchange once per turn |
| **8th Corp Tile** | Would create 8th active chain | Hold until chain space available; CANNOT exchange |

---

## Merger Mechanics

### Merger Trigger
A merger occurs when a tile connects two or more separate chains.

### Determining the Survivor
| Scenario | Survivor |
|----------|----------|
| Chains of different sizes | **Larger chain survives** |
| Chains of equal size | **Mergemaker (tile placer) chooses** |

### Safe Chain Rules
- A chain with **11+ tiles** is **SAFE**
- Safe chains **cannot be acquired**
- Safe chains **can acquire** smaller chains
- **Two safe chains CANNOT merge** (tile is dead)

### Merger Resolution Process

#### Step 1: Identify Chains
- Surviving chain (largest or chosen)
- Defunct chain(s) (absorbed)

#### Step 2: Shareholder Bonuses
For each defunct chain (largest to smallest if multiple):

1. **Reveal Holdings:** All players reveal their stock count in the defunct chain
2. **Determine Majority/Minority:**

| Situation | Bonus Distribution |
|-----------|-------------------|
| One majority holder | Gets full Majority Bonus |
| One minority holder | Gets full Minority Bonus |
| Only one shareholder | Gets BOTH bonuses |
| Tie for majority | Split (Majority + Minority), round up to $100 |
| Tie for minority (no tie for majority) | Split Minority bonus, round up to $100 |
| Tie for majority + others | Majority ties split combined bonus; no minority paid |

#### Step 3: Defunct Stock Resolution
Starting with the **mergemaker** and proceeding **clockwise**, each stockholder must decide for EACH of their defunct shares:

| Option | Description |
|--------|-------------|
| **HOLD** | Keep stock for potential future refounding |
| **SELL** | Sell at current price (based on defunct chain size) |
| **TRADE** | Exchange 2 defunct shares for 1 survivor share |

**Notes:**
- Players can mix options (hold some, sell some, trade some)
- Trading limited by available survivor stock
- Defunct chain price = size BEFORE merger

#### Step 4: Complete Merger
- Remove defunct chain marker (available for future)
- Merge all tiles into survivor chain
- Update chain size and stock prices

### Multiple Merger (3+ chains)
When a tile connects 3+ chains:

1. Largest chain survives (mergemaker breaks ties)
2. Process defunct chains **largest to smallest**
3. Each defunct chain resolved completely before next
4. Mergemaker breaks ties at each step

---

## Stock Transactions

### Buying Stock (During Turn)
- Maximum **3 shares per turn**
- From any **active chains**
- Pay price based on current chain size
- Receive stock certificate immediately

### Selling Stock (During Merger Only)
- Only during merger resolution
- Only defunct chain stock
- Price based on defunct chain size **before** merger

### Trading Stock (During Merger Only)
- **2 defunct shares = 1 survivor share**
- Only during merger resolution
- Limited by available survivor stock

### Founder's Bonus
- 1 free share when founding a new chain
- Only if stock is available in market
- Does not count toward 3-share purchase limit

---

## End Game Conditions

### Triggering Game End
A player may **declare the game over** on their turn if EITHER:

1. **Any chain has 41+ tiles**
2. **ALL active chains are safe (11+ tiles each)**

**Important:** Declaration is **optional** - player may continue if advantageous

### Game End Process

1. **Declaring player finishes their turn** (can still buy stocks)
2. **Final Bonuses:**
   - Majority/Minority bonuses paid for ALL active chains
3. **Stock Liquidation:**
   - All stocks sold at current prices
   - Inactive chain stocks are **worthless**
4. **Winner Determination:**
   - Player with most total money wins
   - Count: Cash + Stock sale proceeds + Bonuses

---

## Edge Cases & Special Rules

### Permanently Dead Tiles
- Would merge two safe chains
- Must be held until exchangeable
- Can exchange ONE per turn (at end of turn)

### Temporarily Unplayable Tiles
- Would create 8th active chain
- Cannot be exchanged
- May become playable if a chain becomes defunct

### Stock Shortage
- If chain has no stock remaining:
  - Cannot buy that chain's stock
  - Founder's bonus not given if founding
  - Trading into that chain limited

### Money Shortage
- Players with $0 cannot buy stock
- Must still place tiles and draw
- Wait for merger bonuses to get funds

### All Tiles Played
- If no tiles remain in pool, players continue with remaining tiles
- When all tiles played, game may end

### Open vs Hidden Information
- **Configurable:** Money and stocks can be open or hidden
- Open display recommended for new players
- Players may always ask how many stocks remain in market

---

## Appendix A: Quick Reference

### Turn Summary
1. ✅ **PLAY** - Place one tile from hand
2. 💰 **BUY** - Purchase 0-3 stocks (optional)
3. 🎴 **DRAW** - Draw one tile to refill hand

### Key Numbers
| Rule | Value |
|------|-------|
| Starting cash | $6,000 |
| Tiles in hand | 6 |
| Max stocks per turn | 3 |
| Safe chain size | 11+ tiles |
| Game-ending chain size | 41+ tiles |
| Max active chains | 7 |
| Stock trade ratio | 2:1 |

### Chain Tier Quick Reference
| Tier | Chains | Base Price (2 tiles) |
|------|--------|---------------------|
| Budget | Tower, Luxor | $200 |
| Standard | American, Worldwide, Festival | $300 |
| Luxury | Continental, Imperial | $400 |


