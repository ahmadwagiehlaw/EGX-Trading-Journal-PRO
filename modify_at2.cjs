const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const newBlock = `
            {/* Current Market Price & Unrealized PnL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                <p className="text-xs font-black text-rose-600 dark:text-rose-400 mb-1 flex items-center justify-center gap-1">أرباح/خسائر عائمة (Unrealized PnL)</p>
                <div className="flex items-center justify-center gap-2">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netUnrealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`} dir="ltr">
                    {metrics.netUnrealizedPnL >= 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)} EGP
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2 text-center">السعر (تحديث يدوي)</p>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="any"
                    value={marketPriceInput}
                    onChange={(e) => setMarketPriceInput(e.target.value)}
                    placeholder={metrics.currentPrice.toFixed(2)}
                    className="flex-1 text-sm font-black text-slate-900 dark:text-white py-2 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                    dir="ltr"
                  />
                  <button
                    onClick={handleUpdateMarketPrice}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-lg text-xs transition-colors shrink-0"
                  >
                    حفظ السعر
                  </button>
                </div>
              </div>
            </div>
`;

// Insert states
c = c.replace(/const \[newHighestPrice, setNewHighestPrice\] = useState<string>\(''\);/,
  `const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  
  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };`);

// add updatePosition
c = c.replace(/const \{ positions, updateTrailingStop, capitalInvestment, capitalSpeculation \} = useTrades\(\);/,
  `const { positions, updateTrailingStop, updatePosition, capitalInvestment, capitalSpeculation } = useTrades();`);

// Insert the UI block before the Trailing Stop Engine
c = c.replace(/\{\/\* Trailing Stop Adjustment Input \*\/\}/, newBlock + '\n            {/* Trailing Stop Adjustment Input */}');

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Modified ActiveTrades.tsx');
