const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const coreStatsStart = code.indexOf('const coreStats = useMemo');
const coreStatsEnd = code.indexOf('}, [positions, capitalInvestment, depositedInvestment, totalOpenCapitalInvestment, commissionRate, coreSatelliteTarget]);') + 121;

const coreStatsBlock = code.slice(coreStatsStart, coreStatsEnd);
code = code.replace(coreStatsBlock, "");

const cv = code.indexOf('const contextValue = useMemo');
code = code.slice(0, cv) + coreStatsBlock + '\n\n  ' + code.slice(cv);

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Fixed coreStats placement again');
