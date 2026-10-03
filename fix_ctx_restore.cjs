const fs = require('fs');
let code = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Add getPath
const getPathDef = `
// Temporary getPath helper to support user isolation later
export function getPath(collectionName: string) {
  return collectionName;
}
`;
if (!code.includes('export function getPath')) {
    code = code.replace("export interface WeeklyReview", getPathDef + "\nexport interface WeeklyReview");
}

// 2. Add isSimulator and coreStats to TradeContextType
const typesToAdd = `  isSimulator: boolean;
  toggleSimulator: () => void;
  coreSatelliteTarget: number;
  setCoreSatelliteTarget: (val: number) => void;
  coreStats: { coreCapital: number; satelliteCapital: number; corePercent: number; satellitePercent: number; totalInvestmentCapital: number; isBalanced: boolean; };`;

if (!code.includes('isSimulator: boolean;')) {
    code = code.replace("portfolioFilter:", typesToAdd + "\n  portfolioFilter:");
}

// 3. Add simulator state and logic inside provider
const statesToAdd = `  const [isSimulator, setIsSimulator] = useState(false);
  const toggleSimulator = () => setIsSimulator(!isSimulator);
  const [coreSatelliteTarget, setCoreSatelliteTarget] = useState(75);

  const coreStats = useMemo(() => {
    const totalInvestmentCapital = capitalInvestment + depositedInvestment + totalOpenCapitalInvestment;
    const coreCapital = positions.filter(p => p.portfolioType === 'investment' && p.plan?.strategy === 'core').reduce((acc, p) => acc + computePositionMetrics(p, commissionRate).totalCost, 0);
    const satelliteCapital = positions.filter(p => p.portfolioType === 'investment' && p.plan?.strategy === 'satellite').reduce((acc, p) => acc + computePositionMetrics(p, commissionRate).totalCost, 0);
    
    const corePercent = totalInvestmentCapital > 0 ? (coreCapital / totalInvestmentCapital) * 100 : 0;
    const satellitePercent = totalInvestmentCapital > 0 ? (satelliteCapital / totalInvestmentCapital) * 100 : 0;
    
    return {
      coreCapital,
      satelliteCapital,
      corePercent,
      satellitePercent,
      totalInvestmentCapital,
      isBalanced: corePercent >= coreSatelliteTarget - 5
    };
  }, [positions, capitalInvestment, depositedInvestment, totalOpenCapitalInvestment, commissionRate, coreSatelliteTarget]);
`;

if (!code.includes('const [isSimulator, setIsSimulator]')) {
    code = code.replace("const [positions, setPositions] = useState<TickerPosition[]>([]);", "const [positions, setPositions] = useState<TickerPosition[]>([]);\n" + statesToAdd);
}

// 4. Update the contextValue exports
const exportsToAdd = `    isSimulator,
    toggleSimulator,
    coreSatelliteTarget,
    setCoreSatelliteTarget,
    coreStats,`;

if (!code.includes('isSimulator,\n    toggleSimulator,')) {
    code = code.replace("portfolioFilter, setPortfolioFilter,", exportsToAdd + "\n    portfolioFilter, setPortfolioFilter,");
}

fs.writeFileSync('src/context/TradeContext.tsx', code, 'utf8');
console.log('Restored missing features');
