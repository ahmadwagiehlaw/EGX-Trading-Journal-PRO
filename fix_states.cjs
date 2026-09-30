const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Fix states
const stateMatch = c.match(/const \[txModalType, setTxModalType\] = useState<.*?null>\(null\);\n\s*const \[transactionToEdit, setTransactionToEdit\] = useState<any>\(null\);/);
if (stateMatch) {
  c = c.replace(stateMatch[0], `const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);`);
}

const stateRegex = /const \[newHighestPrice, setNewHighestPrice\] = useState<string>\(''\);[\s\S]*?const handleUpdateMarketPrice = async \(\) => \{[\s\S]*?updatePosition\(position\.id, \{ currentMarketPrice: p \}\);\n\s*\}\n\s*\};/;
const newState = `const [newHighestPrice, setNewHighestPrice] = useState<string>('');
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
  };`;
c = c.replace(stateRegex, newState);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed states');
