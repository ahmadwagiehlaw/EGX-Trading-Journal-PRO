const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Add states
const stateOld = `  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);`;

const stateNew = `  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);
  const [isEditingAtr, setIsEditingAtr] = useState(false);
  const [atrInput, setAtrInput] = useState('');

  // Synchronize atrInput with the current atr whenever it opens
  useEffect(() => {
    if (isEditingAtr && position) {
      const currentAtr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
      setAtrInput(currentAtr.toString());
    }
  }, [isEditingAtr, position]);

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

c = c.replace(stateOld, stateNew);

const badgesOld = `<div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل سعر السوق يدوياً"
                    >
                      سعر السوق:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-20 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            await handleUpdateMarketPrice();
                            setIsEditingMarketPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); }}
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
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); }}
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
                          className="w-20 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={async () => {
                            const success = await handleUpdateTrailingStop();
                            if (success) setIsEditingHighestPrice(false);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}
                </div>`;

const badgesNew = `<div className="flex flex-wrap items-center gap-2">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل سعر السوق يدوياً"
                    >
                      سعر السوق:
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
                </div>`;

c = c.replace(badgesOld, badgesNew);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Added ATR badge');
