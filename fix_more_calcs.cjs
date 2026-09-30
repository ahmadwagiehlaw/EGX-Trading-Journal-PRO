const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/status: 'planning' \| 'active' \| 'closed';\n  currentMarketPrice\?: number;/g, `status: 'planning' | 'active' | 'closed';
  currentMarketPrice?: number;
  sector?: string;`);

const badReturn = `    isOpen,
    isFullyClosed: !isOpen && totalSold > 0,
  };`;

const goodReturn = `    isOpen,
    isFullyClosed: !isOpen && totalSold > 0,
    currentPrice: position.currentMarketPrice || avgEntry,
    unrealizedPnL: (position.currentMarketPrice || avgEntry) > 0 && openShares > 0 ? ((position.currentMarketPrice || avgEntry) - avgEntry) * openShares : 0,
    netUnrealizedPnL: (position.currentMarketPrice || avgEntry) > 0 && openShares > 0 ? (((position.currentMarketPrice || avgEntry) - avgEntry) * openShares) - ((position.currentMarketPrice || avgEntry) * openShares * commissionRate) : 0,
  };`;

c = c.replace(badReturn, goodReturn);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Fixed more calculations.ts');
