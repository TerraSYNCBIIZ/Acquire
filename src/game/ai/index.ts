// ============================================================================
// ACQUIRE DIGITAL - AI Module
// Export all AI-related functionality
// ============================================================================

// Strategic AI Bot (primary - sophisticated decision-making)
export {
  getStrategicAIAction,
  getAIAction,
  type StrategicAIConfig,
  type AIStrategy,
  AI_PERSONALITIES,
} from './strategicBot';

// Smart AI Bot (simpler, faster)
export { 
  getSmartAIAction,
  type AIConfig,
  type AIPersonality,
  AI_PRESETS,
} from './smartBot';

// Legacy bot (for reference)
export { getAIAction as getLegacyAIAction } from './bot';
