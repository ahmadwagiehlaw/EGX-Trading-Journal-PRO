const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/defaultValue=\{position\.currentMarketPrice \|\| metrics\.avgEntry\}/g, "defaultValue={Number((position.currentMarketPrice || metrics.avgEntry).toFixed(2))}");

c = c.replace(/onBlur=\{\(e\) => updateMarketPrice\(position\.id, parseFloat\(e\.target\.value\)\)\}/g, `onBlur={(e) => {
                      const price = parseFloat(e.target.value);
                      if (!isNaN(price) && price > 0) {
                        updateMarketPrice(position.id, price);
                        if (price > currentHighest) {
                          const calculatedNewStop = atr > 0 ? price - (2 * atr) : price * 0.95;
                          const finalStop = Math.max(calculatedNewStop, currentStop);
                          updateTrailingStop(position.id, price, finalStop);
                        }
                      }
                    }}`);

const blockRegex = /const calculatedNewStop = atr > 0 \? highest - \(2 \* atr\) : highest \* 0\.95;[\s\S]*?setNewHighestPrice\(''\);/;
const newStopBlock = `const calculatedNewStop = atr > 0 ? highest - (2 * atr) : highest * 0.95;
    const finalStop = Math.max(calculatedNewStop, currentStop);
    setError(null);
    await updateTrailingStop(position.id, highest, finalStop);
    setNewHighestPrice('');`;
c = c.replace(blockRegex, newStopBlock);

const h4Regex = /<h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">[\s\S]*?<\/h4>/;
const newH4 = `<div className="flex justify-between items-center w-full mb-3">
                  <h4 className="font-black text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    محرك الوقف المتحرك
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    القمة المسجلة: {currentHighest.toFixed(2)}
                  </span>
                </div>`;
c = c.replace(h4Regex, newH4);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Replaced successfully');
