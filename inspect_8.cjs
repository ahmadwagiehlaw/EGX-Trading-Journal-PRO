const fs = require('fs');
// Check NewTradeForm to see how portfolioType is set
const ntf = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = ntf.split('\n');
const idx = lines.findIndex(l => l.includes('portfolioType'));
console.log(lines.slice(Math.max(0, idx-3), idx+10).join('\n'));
