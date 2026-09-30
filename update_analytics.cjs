const fs = require('fs');
let c = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const oldUseTrades = `    positions, 
    capitalInvestment,
    capitalSpeculation,
    totalOpenCapital,
    totalOpenRisk,
    openPositionsCount,
    commissionRate,
    profitFactor,
    maxDrawdown
  } = useTrades();`;

const newUseTrades = `    positions, 
    filteredPositions,
    activeCapital,
    activeOpenCapital,
    activeOpenRisk,
    openPositionsCount,
    commissionRate,
    profitFactor,
    maxDrawdown
  } = useTrades();`;

c = c.replace(/positions,[\s\S]*?\} = useTrades\(\);/, newUseTrades);

// Fix availableLiquidity
c = c.replace(/const availableLiquidity = \(capitalInvestment \+ capitalSpeculation\) - totalOpenCapital;/g, 'const availableLiquidity = activeCapital - activeOpenCapital;');

// Replace totalOpenCapital and totalOpenRisk with their active variants
c = c.replace(/totalOpenCapital/g, 'activeOpenCapital');
c = c.replace(/totalOpenRisk/g, 'activeOpenRisk');
c = c.replace(/capitalInvestment/g, 'activeCapital'); // For formatting
c = c.replace(/capitalSpeculation/g, 'activeCapital'); // Remove unused

// Change positions.filter to filteredPositions.filter so it matches the toggle
c = c.replace(/positions\.filter\(/g, 'filteredPositions.filter(');

fs.writeFileSync('src/components/Analytics.tsx', c, 'utf8');
console.log('Analytics updated');
