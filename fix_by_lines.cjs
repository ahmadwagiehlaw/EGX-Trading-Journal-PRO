const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
const lines = c.split('\n');

const start = lines.findIndex(l => l.includes('const handleUpdateTrailingStop = '));
let end = start;
while (!lines[end].includes('setNewHighestPrice(\'\');')) {
  end++;
}
end++; // include the closing brace line

const newFunc = `  const handleUpdateTrailingStop = async () => {
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(\`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (\${currentHighest.toFixed(2)} EGP).\`);
      return false;
    }

    const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;

    // Rule: Stop Loss CANNOT move down (Steve Burns Rule #30)
    if (calculatedNewStop < currentStop) {
      setError("مخالفة قاعدة ستيف بيرنز: الوقف لا يتحرك للخلف أبداً. السعر الجديد يعطي وقف خسارة أقل من الحالي.");
      return false;
    }

    setError(null);
    await updateTrailingStop(position.id, highest, calculatedNewStop);
    setNewHighestPrice('');
    return true;
  };`;

lines.splice(start, end - start + 1, newFunc);
fs.writeFileSync('src/components/ActiveTrades.tsx', lines.join('\n'), 'utf8');
console.log('Replaced by lines');
