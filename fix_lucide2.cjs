const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/TargetNode/g, '');

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
