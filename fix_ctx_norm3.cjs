const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

code = code.replace('pnl: raw.pnl,\n  };', 'pnl: raw.pnl,\n    coreShares: raw.coreShares,\n  };');
fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Fixed legacy normalizePosition');
