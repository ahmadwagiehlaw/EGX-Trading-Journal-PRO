const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('onClick={toggleTheme}'));
console.log(lines.slice(idx - 10, idx + 10).join('\n'));
