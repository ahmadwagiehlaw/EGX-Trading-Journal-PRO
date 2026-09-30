const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');
c = c.replace(/import \{ Transaction, TickerPosition \} from '\.\.\/context\/TradeContext';\n/g, "");
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('Removed circular import');
