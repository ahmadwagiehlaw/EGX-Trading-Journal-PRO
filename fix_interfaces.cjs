const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/type: 'buy' \| 'sell';/, "type: 'buy' | 'sell' | 'split' | 'bonus' | 'dividend';");

c = c.replace(/stopAtTime\?: number;/, `stopAtTime?: number;
  linkedBuyId?: string;
  portfolioType?: 'investment' | 'speculation';
  executionRating?: number;`);

c = c.replace(/status: 'planning' \| 'active' \| 'closed';/, `status: 'planning' | 'active' | 'closed';
  currentMarketPrice?: number;`);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed interfaces');
