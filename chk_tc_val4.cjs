const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('const contextValue = useMemo(() => ({'));
console.log(lines.slice(idx, idx + 10).join('\n'));
