const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

c = c.replace(
  '      capitalInvestment,\n      totalOpenCapital,',
  '      capitalInvestment,\n      capitalSpeculation,\n      totalOpenCapital,'
);

c = c.replace(
  'const availableLiquidity = capitalInvestment - totalOpenCapital;',
  'const availableLiquidity = (capitalInvestment + capitalSpeculation) - totalOpenCapital;'
);

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Fixed analytics');
