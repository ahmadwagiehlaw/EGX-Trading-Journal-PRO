const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const newInterfaces = `
export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';
  shares: number;
  price: number;
  amount: number;
  date: number;
  linkedBuyId?: string;
  portfolioType?: 'investment' | 'speculation';
  note?: string;
  stopAtTime?: number;
  
  // Journaling & Psychology per transaction
  entryReason?: string;
  exitReason?: string;
  emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
  mistake?: string;
  checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
  isRuleBreaker?: boolean;
  executionRating?: number;
  setup?: string[];
  ruleBreaker?: boolean;
}

export interface TrailingStopState {
  initial: number;
  current: number;
  highestReached: number;
  atrAtEntry: number;
}

export interface TickerPosition {
  id: string;
  symbol: string;
  status: 'planning' | 'active' | 'closed';
  portfolioType: 'investment' | 'speculation';
  transactions: Transaction[];
  trailingStop?: TrailingStopState;
  plan?: {
    strategy?: string;
    entryZone?: { min: number; max: number };
    target: number;
    stop: number;
    atr?: number;
    checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
    images?: string[];
    makerPlan?: string;
  };
  currentMarketPrice?: number;
  sector?: string;
  journal?: {
    preTradeThoughts?: string;
    postTradeReview?: string;
    mistakes?: string[];
    lessonsLearned?: string;
    rating?: number;
    tags?: string[];
  };
  entryDate?: number;
}
`;

c = c.replace(/export interface Transaction \{[\s\S]*?\}\n\nexport interface TickerPosition \{[\s\S]*?\}\n/, newInterfaces);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Restored rich interfaces');
