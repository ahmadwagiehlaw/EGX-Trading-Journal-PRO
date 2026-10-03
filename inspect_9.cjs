const fs = require('fs');
const ntf = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');
const lines = ntf.split('\n');
// Find the form for selecting investment type
const idx = lines.findIndex(l => l.includes('investment') && l.includes('speculation'));
console.log(lines.slice(Math.max(0, idx-5), idx+20).join('\n'));
