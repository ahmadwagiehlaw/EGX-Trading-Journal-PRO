const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');

c = c.replace(/isFullyClosed: !isOpen && totalSold > 0,?\s*\};/g, `isFullyClosed: !isOpen && totalSold > 0,
    currentPrice: position.currentMarketPrice || avgEntry,
    unrealizedPnL: (position.currentMarketPrice || avgEntry) > 0 && openShares > 0 ? ((position.currentMarketPrice || avgEntry) - avgEntry) * openShares : 0,
    netUnrealizedPnL: (position.currentMarketPrice || avgEntry) > 0 && openShares > 0 ? (((position.currentMarketPrice || avgEntry) - avgEntry) * openShares) - ((position.currentMarketPrice || avgEntry) * openShares * commissionRate) : 0,
  };`);

fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Forced return types');
