const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

code = code.replace("positions, trades, profitFactor", "positions, profitFactor");

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log("Removed trades from useMemo dependencies");
