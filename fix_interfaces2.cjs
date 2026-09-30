const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/import \{ Transaction, TickerPosition \} from '\.\.\/context\/TradeContext';/, `
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
  emotion?: string;
  executionRating?: number;
  setup?: string[];
  ruleBreaker?: boolean;
}

export interface TickerPosition {
  id: string;
  symbol: string;
  status: 'active' | 'closed';
  portfolioType: 'investment' | 'speculation';
  transactions?: Transaction[];
  trailingStop?: {
    initial: number;
    current: number;
    highestReached: number;
  };
  plan?: {
    target: number;
    stop: number;
  };
  currentMarketPrice?: number;
  sector?: string;
}
`);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Restored interfaces');
