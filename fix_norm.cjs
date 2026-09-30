const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/pnl: raw\.pnl !== undefined \? raw\.pnl : computeRealizedPnL\(raw\.transactions\),\n    \};\n  \}/g, "pnl: raw.pnl !== undefined ? raw.pnl : computeRealizedPnL(raw.transactions),\n      currentMarketPrice: raw.currentMarketPrice\n    };\n  }");

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
