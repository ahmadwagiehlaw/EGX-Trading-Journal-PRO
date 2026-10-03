const fs = require('fs');
let an = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const oldExp = `const expectancy = ((winRate / 100) * avgWin) - ((1 - (winRate / 100)) * avgLoss);`;
const newExp = `const expectancy = ((parseFloat(winRate) / 100) * avgWin) - ((1 - (parseFloat(winRate) / 100)) * avgLoss);`;

an = an.replace(oldExp, newExp);

fs.writeFileSync('src/components/Analytics.tsx', an, 'utf8');
console.log('Fixed expectancy calc');
