const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /totalRealizedPnL,[\s\S]*?equityData,/g;
c = c.replace(regex, '');

fs.writeFileSync('src/components/Dashboard.tsx', c, 'utf8');
console.log('Cleaned unused');
