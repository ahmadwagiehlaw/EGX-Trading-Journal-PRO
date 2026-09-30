const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

c = c.replace(/interface TradeContextType \{/, `export interface TradeContextType {
  portfolioFilter: 'all' | 'investment' | 'speculation';
  setPortfolioFilter: (f: 'all' | 'investment' | 'speculation') => void;
  activeCapital: number;
  activeDeposited: number;
  activeOpenCapital: number;
  activeOpenRisk: number;
  filteredPositions: TickerPosition[];`);

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');

let d = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
d = d.replace(/const equityData = useMemo\(/, 'const computedEquityData = useMemo(');
d = d.replace(/equityData\.push\(/g, 'computedEquityData.push(');
d = d.replace(/if \(equityData\.length === 0\)/, 'if (computedEquityData.length === 0)');
d = d.replace(/data=\{equityData\}/g, 'data={computedEquityData}');
d = d.replace(/depositedInvestment/g, 'activeDeposited'); // Fix missing variable

fs.writeFileSync('src/components/Dashboard.tsx', d, 'utf8');
console.log('Fixed typings');
