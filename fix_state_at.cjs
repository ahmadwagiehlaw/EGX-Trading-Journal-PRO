const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const \[newHighestPrice, setNewHighestPrice\] = useState\(\w*\);/,
  `const [newHighestPrice, setNewHighestPrice] = useState('');
  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  
  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };`);

if (c.includes('handleUpdateMarketPrice')) {
  console.log('Successfully added states');
} else {
  // force inject right after `const [txModalType, setTxModalType] = useState`
  c = c.replace(/const \[txModalType, setTxModalType\] = useState<.*?\(null\);/,
    `const [txModalType, setTxModalType] = useState<'buy' | 'sell' | null>(null);
  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };`);
  console.log('Force injected states');
}

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
