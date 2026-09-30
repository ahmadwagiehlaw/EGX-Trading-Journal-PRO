const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(
  /capitalInvestment,[\s]*totalOpenCapital,/,
  'capitalInvestment,\n      capitalSpeculation,\n      totalOpenCapital,'
);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed analytics');
