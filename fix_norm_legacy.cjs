const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/pnl: exitPrice \? \(exitPrice - entryPrice\) \* shares : 0,\n  \};/g, "pnl: exitPrice ? (exitPrice - entryPrice) * shares : 0,\n    currentMarketPrice: raw.currentMarketPrice\n  };");

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
