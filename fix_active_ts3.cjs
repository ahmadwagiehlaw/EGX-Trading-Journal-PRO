const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/Target/g, 'TargetNode'); // just rename it to avoid unused
c = c.replace(/const stopPercent = 0;/g, '// const stopPercent = 0;');
c = c.replace(/const targetPercent = 100;/g, '// const targetPercent = 100;');
c = c.replace(/'sellAll'/g, "'sell'");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
