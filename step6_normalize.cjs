const fs = require('fs');

// 6. Update normalizePosition to pass coreAllocation field through
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
ctx = ctx.replace(
  `      currentMarketPrice: raw.currentMarketPrice\n    };\n  }`,
  `      currentMarketPrice: raw.currentMarketPrice,\n      coreAllocation: raw.coreAllocation || undefined,\n    };\n  }`
);
fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ normalizePosition updated');
