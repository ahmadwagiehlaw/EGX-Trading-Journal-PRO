const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/interface ActiveTradesProps \{[\s\S]*?\}/, "interface ActiveTradesProps { position: any | null; updateTrailingStop: (id: string, highest: number, stop: number) => void; }");

c = c.replace(/const handleUpdateTrailingStop = async \(\) => \{[\s\S]*?return true;\n  \};/, `const handleUpdateTrailingStop = async (): Promise<boolean> => {
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

// But if the regex didn't match:
const lines = c.split('\n');
const idx = lines.findIndex(l => l.includes('const handleUpdateTrailingStop'));
let end = idx;
while (end < lines.length && !lines[end].includes('return true;') && !lines[end].includes('setNewHighestPrice(\'\');')) {
  end++;
}
lines.splice(idx, end - idx + 2, `  const handleUpdateTrailingStop = async (): Promise<boolean> => {
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

fs.writeFileSync('src/components/ActiveTrades.tsx', lines.join('\n'), 'utf8');
