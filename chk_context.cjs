const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
console.log('Includes LedgerEntry:', c.includes('LedgerEntry'));
console.log('Includes Vault:', c.includes('Vault'));
console.log('Includes Simulator:', c.includes('simulator'));
