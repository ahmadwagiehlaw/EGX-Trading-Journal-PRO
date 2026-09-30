const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

content = content.replace(/useState<'buy' \| 'sell' \| 'sellAll' \| 'edit' \| 'ledger' \| null>\(null\);/, "useState<'buy' | 'sell' | 'sellAll' | 'edit' | 'ledger' | null>('ledger');");

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
