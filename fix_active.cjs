const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/metrics\.realizedPnL/g, 'metrics.netRealizedPnL');

const oldInput = `<input 
                      type="number" step="any"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-2 text-lg font-black font-mono-num text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-blue-300"
                      defaultValue={Number((position.currentMarketPrice || metrics.avgEntry).toFixed(2))}
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
                      }}
                      dir="ltr"
                      title="سعر السوق الفعلي (تحديث يدوي)"
                    />`;

const newInput = `<input 
                      id={\`market-price-\${position.id}\`}
                      type="number" step="any"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-2 text-lg font-black font-mono-num text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-blue-300"
                      defaultValue={Number((position.currentMarketPrice || metrics.avgEntry).toFixed(2))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const price = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(price) && price > 0) {
                            updateMarketPrice(position.id, price);
                            if (price > currentHighest) {
                              const calculatedNewStop = atr > 0 ? price - (2 * atr) : price * 0.95;
                              const finalStop = Math.max(calculatedNewStop, currentStop);
                              updateTrailingStop(position.id, price, finalStop);
                            }
                          }
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      dir="ltr"
                      title="اضغط Enter للحفظ"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(\`market-price-\${position.id}\`) as HTMLInputElement;
                        if (el) {
                          const price = parseFloat(el.value);
                          if (!isNaN(price) && price > 0) {
                            updateMarketPrice(position.id, price);
                            if (price > currentHighest) {
                              const calculatedNewStop = atr > 0 ? price - (2 * atr) : price * 0.95;
                              const finalStop = Math.max(calculatedNewStop, currentStop);
                              updateTrailingStop(position.id, price, finalStop);
                            }
                          }
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
                    >
                      حفظ
                    </button>`;

if (c.includes('onBlur={(e) => {')) {
  c = c.replace(oldInput, newInput);
} else {
  console.log("Could not find the input to replace!");
}

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed input');
