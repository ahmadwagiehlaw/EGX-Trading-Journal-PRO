const fs = require('fs');
let ctx = fs.readFileSync('src/context/TradeContext.tsx', 'utf8');

// 3. Add state + memoized computation inside TradeProvider
// We need to insert after the toggleSimulator declaration
const insertAfter = `  const toggleSimulator = () => {
    setIsSimulator(prev => {
      const next = !prev;
      localStorage.setItem('isSimulator', next.toString());
      return next;
    });
  };`;

const newCode = `

  // --- Core & Satellite State ---
  const [coreSatelliteTarget, setCoreSatelliteTargetState] = useState<number>(() => {
    const saved = localStorage.getItem('coreSatelliteTarget');
    return saved ? parseFloat(saved) : 75;
  });

  const setCoreSatelliteTarget = (val: number) => {
    const clamped = Math.max(50, Math.min(95, val));
    setCoreSatelliteTargetState(clamped);
    localStorage.setItem('coreSatelliteTarget', clamped.toString());
  };`;

ctx = ctx.replace(insertAfter, insertAfter + newCode);
fs.writeFileSync('src/context/TradeContext.tsx', ctx, 'utf8');
console.log('✓ Core & Satellite state added');
