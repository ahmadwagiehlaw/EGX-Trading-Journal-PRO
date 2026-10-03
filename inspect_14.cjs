const fs = require('fs');
// Check Dashboard.tsx for investment portfolio display
const dash = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = dash.split('\n');
const idx = lines.findIndex(l => l.includes('portfolioFilter') || l.includes('investment'));
console.log(lines.slice(Math.max(0,idx-2), idx+20).join('\n'));
