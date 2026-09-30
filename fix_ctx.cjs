const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/strategy: string;\n    entry\?: number;/, 'strategy: string;\n    checklist?: Record<string, boolean>;\n    setupScore?: number;\n    entry?: number;');

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('Done');
