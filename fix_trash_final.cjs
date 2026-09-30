const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');

const idx = lines.findIndex(l => l.includes('Target'));
lines.splice(idx + 1, 0, "  Trash2");
lines[idx] = lines[idx] + ",";

fs.writeFileSync('src/components/ActiveTrades.tsx', lines.join('\n'), 'utf8');
