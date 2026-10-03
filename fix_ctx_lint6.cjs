const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// Fix openInvested
code = code.replace(/totalCost/g, "openInvested");

// Move coreStats down
const coreStatsStart = code.indexOf('const coreStats = useMemo');
const coreStatsEnd = code.indexOf('}, [positions, capitalInvestment, depositedInvestment, totalOpenCapitalInvestment, commissionRate, coreSatelliteTarget]);') + 121;

const coreStatsBlock = code.slice(coreStatsStart, coreStatsEnd);

// Remove from old place
code = code.replace(coreStatsBlock, "");

// Add to new place (after totalOpenCapitalInvestment is computed, around line 550)
const insertionPoint = code.indexOf('// Compute Capital (Deposits vs Equity)');
if (insertionPoint > -1) {
    code = code.slice(0, insertionPoint) + coreStatsBlock + '\n\n  ' + code.slice(insertionPoint);
} else {
    // just put it at the very bottom before contextValue
    const cv = code.indexOf('const contextValue = useMemo');
    code = code.slice(0, cv) + coreStatsBlock + '\n\n  ' + code.slice(cv);
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Fixed coreStats and openInvested');
