const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');
c = c.replace('    activeDeposited,\n', '');
fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Removed activeDeposited');
