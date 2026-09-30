const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/export interface LedgerEntry \{\n  id: string;\n  date: number;\n  type: 'deposit' \| 'withdrawal';/g, "export interface LedgerEntry {\n  id: string;\n  date: number;\n  type: 'deposit' | 'withdrawal' | 'profit_distribution';");

c = c.replace(/if \(entry\.type === 'deposit'\) \{\n        if \(pType === 'investment'\) depInv \+= entry\.amount;\n        else depSpec \+= entry\.amount;\n      \} else \{\n        if \(pType === 'investment'\) depInv -= entry\.amount;\n        else depSpec -= entry\.amount;\n      \}/g, `if (entry.type === 'deposit') {
        if (pType === 'investment') depInv += entry.amount;
        else depSpec += entry.amount;
      } else {
        if (pType === 'investment') depInv -= entry.amount;
        else depSpec -= entry.amount;
      }`); // It just subtracts for both withdrawal and profit_distribution, which is correct for capital reduction.

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('Modified TradeContext.tsx for profit distribution');
