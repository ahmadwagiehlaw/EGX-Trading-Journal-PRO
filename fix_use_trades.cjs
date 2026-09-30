const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/const \{ positions, updateTrailingStop, closePosition \} = useTrades\(\);/, "const { positions, updateTrailingStop, closePosition, updatePosition } = useTrades();");

// Fix TS1345 in handleUpdateTrailingStop again just in case
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

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed useTrades and return type');
