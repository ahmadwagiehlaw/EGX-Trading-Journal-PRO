const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

const typeRegex = /export interface TradeContextType \{/;
const newTypes = `export interface TradeContextType {
  portfolioFilter: 'all' | 'investment' | 'speculation';
  setPortfolioFilter: (f: 'all' | 'investment' | 'speculation') => void;
  activeCapital: number;
  activeDeposited: number;
  activeOpenCapital: number;
  activeOpenRisk: number;
  filteredPositions: TickerPosition[];`;
c = c.replace(typeRegex, newTypes);

const providerRegex = /const \[loading, setLoading\] = useState\(true\);/;
const newState = `const [loading, setLoading] = useState(true);
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'investment' | 'speculation'>('all');`;
c = c.replace(providerRegex, newState);

const contextValueRegex = /const contextValue = useMemo\(\(\) => \(\{/;
const newDynamic = `
  const filteredPositions = useMemo(() => {
    if (portfolioFilter === 'all') return positions;
    return positions.filter(p => p.portfolioType === portfolioFilter);
  }, [positions, portfolioFilter]);

  const { activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk } = useMemo(() => {
    if (portfolioFilter === 'investment') {
      return {
        activeCapital: capitalInvestment,
        activeDeposited: depositedInvestment,
        activeOpenCapital: totalOpenCapitalInvestment,
        activeOpenRisk: positions.filter(p => p.portfolioType === 'investment' && p.status === 'active').reduce((acc, p) => {
          const metrics = computePositionMetrics(p, commissionRate);
          const currentStop = metrics.currentStop;
          if (metrics.avgEntry > 0 && currentStop > 0 && currentStop < metrics.avgEntry) {
            return acc + ((metrics.avgEntry - currentStop) * metrics.openShares);
          }
          return acc;
        }, 0)
      };
    }
    if (portfolioFilter === 'speculation') {
      return {
        activeCapital: capitalSpeculation,
        activeDeposited: depositedSpeculation,
        activeOpenCapital: totalOpenCapitalSpeculation,
        activeOpenRisk: positions.filter(p => p.portfolioType === 'speculation' && p.status === 'active').reduce((acc, p) => {
          const metrics = computePositionMetrics(p, commissionRate);
          const currentStop = metrics.currentStop;
          if (metrics.avgEntry > 0 && currentStop > 0 && currentStop < metrics.avgEntry) {
            return acc + ((metrics.avgEntry - currentStop) * metrics.openShares);
          }
          return acc;
        }, 0)
      };
    }
    return {
      activeCapital: capitalInvestment + capitalSpeculation,
      activeDeposited: depositedInvestment + depositedSpeculation,
      activeOpenCapital: totalOpenCapital,
      activeOpenRisk: totalOpenRisk
    };
  }, [portfolioFilter, capitalInvestment, capitalSpeculation, depositedInvestment, depositedSpeculation, totalOpenCapital, totalOpenCapitalInvestment, totalOpenCapitalSpeculation, totalOpenRisk, positions, commissionRate]);

  const contextValue = useMemo(() => ({
    portfolioFilter, setPortfolioFilter,
    activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk,
    filteredPositions,
`;
c = c.replace(contextValueRegex, newDynamic);

const contextValueExportsRegex = /capitalInvestment, capitalSpeculation, fixedIncome,/;
const newExports = `capitalInvestment, capitalSpeculation, fixedIncome, portfolioFilter, setPortfolioFilter, activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk, filteredPositions,`;
c = c.replace(contextValueExportsRegex, newExports);

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('TradeContext updated');
