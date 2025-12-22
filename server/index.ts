// ============================================================================
// ACQUIRE DIGITAL - Multiplayer Server
// ============================================================================

import { Server, Origins } from 'boardgame.io/server';
import { AcquireGame } from '../src/game/game';

const server = Server({
  games: [AcquireGame],
  origins: [Origins.LOCALHOST],
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

server.run(PORT, () => {
  console.log(`🎮 Acquire Digital server running on port ${PORT}`);
  console.log(`   Players can connect at http://localhost:3000`);
});

