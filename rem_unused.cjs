const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const stopPercent =[\s\S]*?;/g, "");
c = c.replace(/const targetPercent =[\s\S]*?;/g, "");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
