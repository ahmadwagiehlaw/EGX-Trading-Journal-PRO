const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Fix defaultValue and onBlur for Live Market Pulse
const oldInput = `                      defaultValue={position.currentMarketPrice || metrics.avgEntry}
                      onBlur={(e) => updateMarketPrice(position.id, parseFloat(e.target.value))}`;

const newInput = `                      defaultValue={Number((position.currentMarketPrice || metrics.avgEntry).toFixed(2))}
                      onBlur={(e) => {
                        const price = parseFloat(e.target.value);
                        if (!isNaN(price) && price > 0) {
                          updateMarketPrice(position.id, price);
                          if (price > currentHighest) {
                            const calculatedNewStop = atr > 0 ? price - (2 * atr) : price * 0.95;
                            const finalStop = Math.max(calculatedNewStop, currentStop);
                            updateTrailingStop(position.id, price, finalStop);
                          }
                        }
                      }}`;
code = code.replace(oldInput, newInput);

// 2. Fix handleUpdateTrailingStop logic
const oldHandle = `    const handleUpdateTrailingStop = async () => {
      const highest = parseFloat(newHighestPrice);
      
      if (isNaN(highest) || highest <= currentHighest) {
        setError(\`يجب إدخال سعر أكبر من أعلى قمة مسجلة (\${currentHighest.toFixed(2)} EGP).\`);
        return;
      }
  
      const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;
  
      // Rule: Stop Loss CANNOT move down (Steve Burns Rule #30)
      if (calculatedNewStop < currentStop) {
        setError("مخالفة قاعدة ستيف بيرنز: الوقف لا يتحرك للخلف أبداً. السعر الجديد يعطي وقف خسارة أقل من الحالي.");
        return;
      }
  
      setError(null);
      await updateTrailingStop(position.id, highest, calculatedNewStop);
      setNewHighestPrice('');
    };`;

const newHandle = `    const handleUpdateTrailingStop = async () => {
      const highest = parseFloat(newHighestPrice);
      
      if (isNaN(highest) || highest <= currentHighest) {
        setError(\`يجب إدخال سعر أعلى من القمة المسجلة حالياً (\${currentHighest.toFixed(2)} EGP).\`);
        return;
      }
  
      const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;
      
      // Rule: Stop Loss CANNOT move down (Steve Burns Rule #30)
      // FIX: Instead of throwing an error, we just keep the current stop if the calculated one is lower!
      const finalStop = Math.max(calculatedNewStop, currentStop);
  
      setError(null);
      await updateTrailingStop(position.id, highest, finalStop);
      setNewHighestPrice('');
    };`;

// We will use regex to replace it because arabic text might be encoded differently in the dump
code = code.replace(/const handleUpdateTrailingStop = async \(\) => \{[\s\S]*?setNewHighestPrice\(''\);\n    \};/, newHandle);

// 3. Add label for current highest price
const oldHeader = `<h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  تحديث أعلى سعر وصل له السهم (Trailing Stop Engine)
                </h4>`;
                
const oldHeader2 = `<h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  محرك الوقف المتحرك (Trailing Stop Engine)
                </h4>`; // In case it was saved this way

const newHeader = `<div className="flex justify-between items-center">
                  <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    تحديث القمة التاريخية للسهم
                  </h4>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    القمة الحالية: {currentHighest.toFixed(2)} EGP
                  </span>
                </div>`;

if (code.includes('تحديث أعلى سعر وصل له السهم (Trailing Stop Engine)')) {
    code = code.replace(oldHeader, newHeader);
} else if (code.includes('محرك الوقف المتحرك (Trailing Stop Engine)')) {
    code = code.replace(oldHeader2, newHeader);
} else {
    // try generic replace
    code = code.replace(/<h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">[\s\S]*?<\/h4>/, newHeader);
}

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log('Done');
