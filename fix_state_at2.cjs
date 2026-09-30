const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const \[newHighestPrice, setNewHighestPrice\] = useState<string>\(''\);/,
  `const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  
  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };`);

// also inject updatePosition from useTrades
c = c.replace(/const \{ positions, updateTrailingStop,  \} = useTrades\(\);/,
  `const { positions, updateTrailingStop, updatePosition } = useTrades();`);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed ActiveTrades states');
