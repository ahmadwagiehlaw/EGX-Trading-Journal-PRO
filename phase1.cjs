const fs = require('fs');
let content = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Imports
content = content.replace("import { useState, useMemo } from 'react';", "import { useState, useMemo, useEffect } from 'react';");
content = content.replace("import { \n  ArrowDownToLine, \n  Lock, \n  Maximize2,\n  Minimize2,\n  ShieldAlert, \n  AlertTriangle, \n  CheckCircle, \n  Plus,\n  ArrowDownLeft,\n  LineChart,\n  Target\n} from 'lucide-react';", 
"import { \n  ArrowDownToLine, \n  Lock, \n  Maximize2,\n  Minimize2,\n  ShieldAlert, \n  CheckCircle, \n  Plus,\n  ArrowDownLeft,\n  LineChart,\n  Target,\n  Trash2\n} from 'lucide-react';");

// 2. Destructured Props
content = content.replace("export default function ActiveTrades({ tradeId, onClose }: { tradeId: string; onClose: () => void }) {\n  const { positions, updateTrailingStop, closePosition } = useTrades();", 
"export default function ActiveTrades({ tradeId }: { tradeId: string; onClose?: () => void }) {\n  const { positions, updateTrailingStop, updatePosition } = useTrades();");

// 3. States
const stateIdx = content.indexOf('const [newHighestPrice, setNewHighestPrice] = useState<string>(\'\');');
const stateEndIdx = content.indexOf('const currentHighest = position.trailingStop?.highestReached || metrics.avgEntry;');
const newStates = `const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | 'ledger' | null>(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

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
      setIsEditingMarketPrice(false);
    }
  };

  const handleUpdateAtr = async () => {
    const newAtr = parseFloat(atrInput);
    if (!isNaN(newAtr) && newAtr > 0 && position) {
      const updatedData: any = {};
      
      const highest = position.trailingStop?.highestReached || metrics.avgEntry;
      let newStop = highest - (2 * newAtr);
      newStop = Math.max(newStop, metrics.currentStop);

      if (position.trailingStop) {
        updatedData.trailingStop = { ...position.trailingStop, atrAtEntry: newAtr, current: newStop };
      } else {
        updatedData.trailingStop = { initial: metrics.currentStop, current: newStop, highestReached: highest, atrAtEntry: newAtr };
      }
      
      if (position.plan) {
        updatedData.plan = { ...position.plan, atr: newAtr };
      }
      
      await updatePosition(position.id, updatedData);
      setIsEditingAtr(false);
    }
  };

  `;
content = content.slice(0, stateIdx) + newStates + content.slice(stateEndIdx);

// 4. Update Trailing Stop Function
const funcIdx = content.indexOf('const handleUpdateTrailingStop = async () => {');
const funcEndIdx = content.indexOf('};', funcIdx) + 2;
const newFunc = `const handleUpdateTrailingStop = async (): Promise<boolean> => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(\`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (\${currentHighest.toFixed(2)} EGP).\`);
      return false;
    }

    const atr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
    const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;
    const finalStop = Math.max(calculatedNewStop, currentStop);

    setError(null);
    await updateTrailingStop(position.id, highest, finalStop);
    setNewHighestPrice('');
    setIsEditingHighestPrice(false);
    return true;
  };`;
content = content.slice(0, funcIdx) + newFunc + content.slice(funcEndIdx);

fs.writeFileSync('src/components/ActiveTrades.tsx', content, 'utf8');
console.log('Phase 1 done');
