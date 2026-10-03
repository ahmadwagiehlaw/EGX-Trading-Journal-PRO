const fs = require('fs');
// 1. Add coreAllocation field to TickerPosition interface
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
calc = calc.replace(
  `  currentMarketPrice?: number;
  sector?: string;
  entryDate?: number;
  openedDate?: number;
  closedDate?: number;
  pnl?: number;
}`,
  `  currentMarketPrice?: number;
  sector?: string;
  coreAllocation?: 'core' | 'satellite'; // Core & Satellite strategy classification
  entryDate?: number;
  openedDate?: number;
  closedDate?: number;
  pnl?: number;
}`
);
fs.writeFileSync('src/utils/calculations.ts', calc, 'utf8');
console.log('✓ TickerPosition updated with coreAllocation');
