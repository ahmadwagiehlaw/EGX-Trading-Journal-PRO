const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

const newInterfaces = `
export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';
  date: number; // timestamp
  price: number;
  shares: number;
  amount: number;
  linkedBuyId?: string;
  portfolioType?: 'investment' | 'speculation';
  note?: string;
  stopAtTime?: number;
  
  // Journaling & Psychology per transaction
  entryReason?: string;
  exitReason?: string;
  emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
  mistakes?: string[];
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
  portfolioType: 'investment' | 'speculation';
  status: 'planning' | 'active' | 'closed';
  
  // Strategy & Planning
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

  // Execution (Ledger of buys & sells)
  transactions: Transaction[];

  // Trailing Stop Engine
  trailingStop?: TrailingStopState;

  // Journaling & Psychology
  journal?: {
    preTradeThoughts?: string;
    postTradeReview?: string;
    mistakes?: string[];
    lessonsLearned?: string;
    rating?: number;
    tags?: string[];
  };
  
  currentMarketPrice?: number;
  sector?: string;
  entryDate?: number;
  openedDate?: number;
  closedDate?: number;
  pnl?: number;
}

`;

// we just add it to the top of calculations.ts
c = newInterfaces + '\n' + c;
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed calculations.ts');
