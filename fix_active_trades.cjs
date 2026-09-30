const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace(/metrics\.realizedPnL/g, 'metrics.netRealizedPnL');

// Replace the Market Price Input block with a controlled component + Save button
const marketPriceRegex = /<div className="flex items-center gap-2">[\s\S]*?<input[\s\S]*?defaultValue=\{Number\(\(position\.currentMarketPrice \|\| metrics\.avgEntry\)\.toFixed\(2\)\)\}[\s\S]*?onBlur=\{\(e\) => \{[\s\S]*?\}\}[\s\S]*?\/>[\s\S]*?<\/div>/;

// We need to inject a state for this if it doesn't exist, but we can just use a local ref or simple inline button.
// Actually, an inline button that calls `updateMarketPrice` reading the input value is easiest using an id.
// Wait, `ActiveTrades.tsx` already imports `useState` so we can just add a state at the top.
// Let's just use `onKeyDown` to listen for Enter, and add a small button.

const newMarketPriceBlock = `
                    <div className="flex items-center gap-2">
                      <input 
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
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                      >
                        حفظ
                      </button>
                    </div>`;

c = c.replace(marketPriceRegex, newMarketPriceBlock);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Fixed ActiveTrades');
