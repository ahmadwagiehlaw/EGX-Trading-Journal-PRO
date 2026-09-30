const fs = require('fs');
let tc = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');
tc = tc.replace(/entryPrice: metrics\.avgEntry \|\| pos\.plan\?\.entryZone\.min \|\| 0,/g, "entryPrice: metrics.avgEntry || pos.plan?.entryZone?.min || 0,");
fs.writeFileSync('src/context/TradeContext.tsx', tc, 'utf8');
console.log('Fixed entryZone');
