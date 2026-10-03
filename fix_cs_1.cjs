const fs = require('fs');

// 1. Fix TickerPosition interface - replace coreAllocation with coreShares
let calc = fs.readFileSync('src/utils/calculations.ts', 'utf8');
calc = calc.replace(
  `  coreAllocation?: 'core' | 'satellite'; // Core & Satellite strategy classification`,
  `  coreShares?: number; // Core & Satellite: number of shares designated as long-term Core`
);
fs.writeFileSync('src/utils/calculations.ts', calc, 'utf8');
console.log('✓ TickerPosition interface fixed');
