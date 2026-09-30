const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const \[txModalType, setTxModalType\] = useState<'buy' \| 'sell' \| null>\(null\);/, `const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);

  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);
  const [isEditingAtr, setIsEditingAtr] = useState(false);
  const [atrInput, setAtrInput] = useState('');

  useEffect(() => {
    if (isEditingAtr && position) {
      const currentAtr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
      setAtrInput(currentAtr.toString());
    }
  }, [isEditingAtr, position]);

  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };

  const handleUpdateAtr = async () => {
    const newAtr = parseFloat(atrInput);
    if (!isNaN(newAtr) && newAtr > 0 && position) {
      const updatedData: any = {};
      if (position.trailingStop) {
        updatedData.trailingStop = { ...position.trailingStop, atrAtEntry: newAtr };
      }
      if (position.plan) {
        updatedData.plan = { ...position.plan, atr: newAtr };
      }
      await updatePosition(position.id, updatedData);
    }
  };`);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Injected states properly');
