const fs = require('fs');
let an = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const anchor = `  const avgLoss = lostPositions.length > 0 ? totalLoss / lostPositions.length : 0;
  const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '\\u221E' : '0.00');`;

const replaceStr = `  const avgLoss = lostPositions.length > 0 ? totalLoss / lostPositions.length : 0;
  const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '\\u221E' : '0.00');
  const expectancy = ((winRate / 100) * avgWin) - ((1 - (winRate / 100)) * avgLoss);`;

// Wait, looking at line 81: (avgWin > 0 ? '∞' : '0.00');
const realAnchor = "const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '∞' : '0.00');";

an = an.replace(realAnchor, realAnchor + "\n  const expectancy = ((winRate / 100) * avgWin) - ((1 - (winRate / 100)) * avgLoss);");

fs.writeFileSync('src/components/Analytics.tsx', an, 'utf8');
console.log('Fixed');
