const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Add imports if missing
if (!c.includes('useEffect')) {
  c = c.replace(/import \{ useState, useMemo \} from 'react';/, "import { useState, useMemo, useEffect } from 'react';");
}

// 2. Add states and handle functions
const oldState = `  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  
  const handleUpdateMarketPrice = async () => {
    const p = parseFloat(marketPriceInput);
    if (!isNaN(p) && p > 0 && position) {
      await updatePosition(position.id, { currentMarketPrice: p });
    }
  };`;

const newState = `  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
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
    }
  };

  const handleUpdateAtr = async () => {
    const newAtr = parseFloat(atrInput);
    if (!isNaN(newAtr) && newAtr > 0 && position) {
      const updatedData: any = {};
      if (position.trailingStop) {
        updatedData.trailingStop = { ...position.trailingStop, atrAtEntry: newAtr };
      }
      if (position.plan) {
        updatedData.plan = { ...position.plan, atr: newAtr };
      }
      await updatePosition(position.id, updatedData);
    }
  };`;

c = c.replace(oldState, newState);

// 3. Fix handleUpdateTrailingStop
const oldTrailingStopFunc = /const handleUpdateTrailingStop = async \(\) => \{[\s\S]*?setNewHighestPrice\(''\);\n  \};/;
const newTrailingStopFunc = `const handleUpdateTrailingStop = async () => {
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
  };`;
c = c.replace(oldTrailingStopFunc, newTrailingStopFunc);

// 4. Replace Header and Add Badges
const oldHeader = /<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">[\s\S]*?<\/p>\s*<\/div>/;
const newHeader = `<p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics.avgEntry.toFixed(2)} EGP</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل السعر يدوياً"
                    >
                      السعر:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            await handleUpdateMarketPrice();
                            setIsEditingMarketPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل السعر"
                      >
                        {metrics.currentPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Highest Price Pill (Trailing Stop) */}
                  {metrics.isOpen && (
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      title="تحديث أعلى سعر لتفعيل الوقف المتحرك"
                    >
                      <Lock className="w-3 h-3" />
                      أقصى سعر:
                    </button>
                    {isEditingHighestPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={newHighestPrice}
                          onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            const success = await handleUpdateTrailingStop();
                            if (success) setIsEditingHighestPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* ATR Pill */}
                  {metrics.isOpen && (
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingAtr(!isEditingAtr); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة ATR لحساب الوقف الميكانيكي"
                    >
                      ATR:
                    </button>
                    {isEditingAtr ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={atrInput}
                          onChange={(e) => setAtrInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-purple-900 dark:text-purple-100"
                          dir="ltr"
                          autoFocus
                          placeholder={atr.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            await handleUpdateAtr();
                            setIsEditingAtr(false);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-purple-800 dark:text-purple-200 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل ATR"
                      >
                        {atr.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}
                </div>
                {error && isEditingHighestPrice && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block w-full max-w-sm">
                    {error}
                  </p>
                )}
              </div>`;
c = c.replace(oldHeader, newHeader);

// 5. Replace Grid (to have separated Unrealized vs Realized PnL and NO Current Market Price inline input)
const oldGrid = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Unrealized PnL (الأرباح العائمة) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">أرباح/خسائر عائمة (ورقية)</p>
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netUnrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                    {metrics.netUnrealizedPnL >= 0 ? '+' : ''}{metrics.netUnrealizedPnL.toFixed(2)} EGP
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold">بناءً على السعر الحالي ({metrics.currentPrice.toFixed(2)})</span>
                </div>
              </div>

              {/* Realized PnL (الأرباح المحققة) */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-0"></div>
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 mb-1 flex items-center justify-center gap-1 relative z-10">الأرباح المحققة (فعلية)</p>
                <div className="flex flex-col items-center justify-center gap-1 relative z-10">
                  <span className={\`text-2xl font-black font-mono-num \${metrics.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}\`} dir="ltr">
                    {metrics.netRealizedPnL >= 0 ? '+' : ''}{metrics.netRealizedPnL.toFixed(2)} EGP
                  </span>
                  <span className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 font-bold">
                    ناتجة عن إجمالي {position.transactions?.filter(t => t.type === 'sell').length || 0} عملية بيع و {metrics.totalSold.toLocaleString()} سهم
                  </span>
                </div>
              </div>
            </div>`;
c = c.replace(oldGrid, newGrid);

// 6. Delete Trailing Stop Adjustment Input Blue Box safely
const blueBoxRegex = /\{\/\* Trailing Stop Adjustment Input \*\/\}\s*\{metrics\.isOpen && \(\s*<div className="bg-blue-50\/60[\s\S]*?<\/p>\s*<\/div>\s*\)\}/;
c = c.replace(blueBoxRegex, "");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('All updates applied successfully!');
