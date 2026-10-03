const fs = require('fs');

// 2. Add coreSatelliteTarget to TradeContextType + coreStats computed value
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// Add to TradeContextType interface
ctx = ctx.replace(
  `  isSimulator: boolean;
  toggleSimulator: () => void;`,
  `  isSimulator: boolean;
  toggleSimulator: () => void;
  coreSatelliteTarget: number; // target % for Core (default 75)
  setCoreSatelliteTarget: (val: number) => void;
  coreStats: { coreCapital: number; satelliteCapital: number; corePercent: number; satellitePercent: number; totalInvestmentCapital: number; isBalanced: boolean; };`
);
fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ TradeContextType updated');
