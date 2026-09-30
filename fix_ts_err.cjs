const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/AlertTriangle,\s*/g, "");
c = c.replace(/Target\n\} from 'lucide-react';/g, "} from 'lucide-react';");
c = c.replace(/const \[transactionToEdit, setTransactionToEdit\] = useState<any>\(null\);\n/g, "");
c = c.replace(/const stopPercent = \[.*?\];\n/g, "");
c = c.replace(/const targetPercent = \[.*?\];\n/g, "");

// One more TS error:
// error TS2322: Type '"buy" | "sell" | "edit"' is not assignable to type '"split" | "buy" | "sell" | "dividend" | "bonus" | undefined'.
// Type '"edit"' is not assignable to type '"split" | "buy" | "sell" | "dividend" | "bonus" | undefined'.
// In TransactionFormModal defaultType

c = c.replace(/defaultType=\{txModalType === 'sellAll' \|\| txModalType === 'edit' \? 'sell' : txModalType \|\| 'buy'\}/g, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType || 'buy')}");
// Wait, txModalType can be 'edit'. If it's 'edit', it falls back to 'sell', which is fine.

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed TS errors');
