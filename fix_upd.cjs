const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
if (!c.includes('useTradeContext')) {
  c = c.replace(/import \{ AlertTriangle,/, "import { useTradeContext } from '../context/TradeContext';\nimport { AlertTriangle,");
  c = c.replace(/export default function ActiveTrades\(\{ position, onClose, closePosition, updateTrailingStop \}: ActiveTradesProps\) \{/, "export default function ActiveTrades({ position, onClose, closePosition, updateTrailingStop }: ActiveTradesProps) {\n  const { updatePosition } = useTradeContext();");
}
// Also fix error TS1345 in line 214 by changing handleUpdateTrailingStop to return true/false
c = c.replace(/const handleUpdateTrailingStop = async \(\) => \{[\s\S]*?setNewHighestPrice\(''\);\n  \};/, `const handleUpdateTrailingStop = async () => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(\`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (\${currentHighest.toFixed(2)} EGP).\`);
      return false;
    }

    const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;

    if (calculatedNewStop < currentStop) {
      setError("مخالفة قاعدة ستيف بيرنز: الوقف لا يتحرك للخلف أبداً. السعر الجديد يعطي وقف خسارة أقل من الحالي.");
      return false;
    }

    setError(null);
    await updateTrailingStop(position.id, highest, calculatedNewStop);
    setNewHighestPrice('');
    return true;
  };`);

// And fix type error TS2322 for defaultType in TransactionFormModal
c = c.replace(/defaultType=\{txModalType === 'sellAll' \? 'sell' : txModalType \|\| 'buy'\}/, "defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : txModalType || 'buy'}");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed updatePosition and return type');
