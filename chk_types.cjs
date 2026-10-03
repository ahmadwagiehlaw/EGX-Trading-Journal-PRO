const fs = require('fs');

const planTypes = fs.readFileSync('src/types/index.ts', 'utf8');
const lines = planTypes.split('\n');
lines.forEach((l, i) => {
    if (l.includes('TradingPlan') || l.includes('target') || l.includes('stop') || l.includes('riskReward')) {
        console.log(`${i+1}: ${l}`);
    }
});
