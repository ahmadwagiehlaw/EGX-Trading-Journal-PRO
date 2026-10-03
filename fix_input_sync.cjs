const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const useEffectCode = `  useEffect(() => {
    if (!isEditingMarketPrice && position?.currentMarketPrice) {
      setMarketPriceInput(position.currentMarketPrice.toString());
    }
  }, [position?.currentMarketPrice, isEditingMarketPrice]);`;

c = c.replace(/const \[isEditingMarketPrice, setIsEditingMarketPrice\] = useState\(false\);/, 
  "const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);\n\n" + useEffectCode);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed marketPriceInput sync');
