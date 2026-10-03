const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('export const TradeContext = createContext'));
console.log(lines.slice(idx - 5, idx + 40).join('\n'));
