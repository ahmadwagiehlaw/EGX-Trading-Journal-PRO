const fs = require('fs');
let c = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 1. Add to TradeContextType
c = c.replace(/export interface TradeContextType \{/, "export interface TradeContextType {\n  isSimulator: boolean;\n  toggleSimulator: () => void;");

// 2. Add state to TradeProvider
const providerStart = "export function TradeProvider({ children }: { children: ReactNode }) {";
const stateCode = `  const [isSimulator, setIsSimulator] = useState<boolean>(() => {
    const saved = localStorage.getItem('isSimulator');
    return saved === 'true';
  });

  const toggleSimulator = () => {
    setIsSimulator(prev => {
      const next = !prev;
      localStorage.setItem('isSimulator', next.toString());
      return next;
    });
  };

  const getPath = (base: string) => isSimulator ? \`simulator_\${base}\` : base;`;
c = c.replace(providerStart, providerStart + "\n" + stateCode);

// 3. Update collection references inside useEffect for fetchTrades
c = c.replace(/collection\(db, 'trades'\)/g, "collection(db, getPath('trades'))");
c = c.replace(/collection\(db, 'plans'\)/g, "collection(db, getPath('plans'))");
c = c.replace(/collection\(db, 'ledger'\)/g, "collection(db, getPath('ledger'))");

// 4. Update doc references
c = c.replace(/doc\(db, 'trades', /g, "doc(db, getPath('trades'), ");
c = c.replace(/doc\(db, 'plans', /g, "doc(db, getPath('plans'), ");
c = c.replace(/doc\(db, 'ledger', /g, "doc(db, getPath('ledger'), ");

// 5. Update collection reference in addPosition, addPlan, addLedgerEntry
c = c.replace(/collection\(db, 'trades'\)/g, "collection(db, getPath('trades'))"); // If any left

// Wait, the regex `doc(db, 'trades', ` might match differently if there are spaces. Let's be careful.
c = c.replace(/doc\(db,\s*'trades',\s*/g, "doc(db, getPath('trades'), ");
c = c.replace(/doc\(db,\s*'plans',\s*/g, "doc(db, getPath('plans'), ");
c = c.replace(/doc\(db,\s*'ledger',\s*/g, "doc(db, getPath('ledger'), ");
c = c.replace(/collection\(db,\s*'trades'\)/g, "collection(db, getPath('trades'))");
c = c.replace(/collection\(db,\s*'plans'\)/g, "collection(db, getPath('plans'))");
c = c.replace(/collection\(db,\s*'ledger'\)/g, "collection(db, getPath('ledger'))");

// Add to returned context
c = c.replace(/return \(\n\s*<TradeContext\.Provider value=\{\{/, "return (\n    <TradeContext.Provider value={{\n      isSimulator,\n      toggleSimulator,");

fs.writeFileSync('src/context/TradeContext.tsx', c, 'utf8');
console.log('TradeContext updated for Simulator');
