// ============================================================================
// ACQUIRE DIGITAL - Hotel Chain Icons
// Uses Lucide React icons for each hotel chain
// ============================================================================

import React from 'react';
import {
  Building2,    // Tower - modern skyscraper
  Pyramid,      // Luxor - Egyptian theme
  Star,         // American - classic American
  Globe,        // Worldwide - global reach
  PartyPopper,  // Festival - celebration
  Landmark,     // Continental - European elegance
  Crown,        // Imperial - royal luxury
} from 'lucide-react';
import { ChainName } from '../../game/types';

interface ChainIconProps {
  chain: ChainName;
  size?: number;
  className?: string;
}

const CHAIN_ICON_MAP: Record<ChainName, React.FC<{ size?: number; className?: string }>> = {
  tower: Building2,
  luxor: Pyramid,
  american: Star,
  worldwide: Globe,
  festival: PartyPopper,
  continental: Landmark,
  imperial: Crown,
};

export const ChainIcon: React.FC<ChainIconProps> = ({ chain, size = 24, className = '' }) => {
  const IconComponent = CHAIN_ICON_MAP[chain];
  return <IconComponent size={size} className={className} />;
};

// Export individual icons for direct use
export { Building2 as TowerIcon } from 'lucide-react';
export { Pyramid as LuxorIcon } from 'lucide-react';
export { Star as AmericanIcon } from 'lucide-react';
export { Globe as WorldwideIcon } from 'lucide-react';
export { PartyPopper as FestivalIcon } from 'lucide-react';
export { Landmark as ContinentalIcon } from 'lucide-react';
export { Crown as ImperialIcon } from 'lucide-react';

// Also export common UI icons we'll use
export {
  Play,
  RotateCcw,
  HelpCircle,
  ArrowLeft,
  Users,
  Bot,
  User,
  DollarSign,
  TrendingUp,
  Briefcase,
  Hotel,
  Coins,
  BarChart3,
  Zap,
  Shield,
  Target,
  Sparkles,
  Crown,
} from 'lucide-react';

