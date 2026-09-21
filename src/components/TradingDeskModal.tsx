import { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowDownToLine, ArrowUpRight, CheckCircle, Plus, X, Maximize2 } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const PORTFOLIOS = {
  investment: { name: 'الاستثمار', capital: 1000000 },
  speculation: { name: 'المضاربة', capital: 100000 },
};

export default function TradingDeskModal({ 
  isOpen, 
  onClose, 
  onStartTrade,
  onAddToWatchlist,
  initialSymbol = 'COMI'
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onStartTrade: (data: any) => void,
  onAddToWatchlist: (data: any) => void,
  initialSymbol?: string
}) {
  const [portfolioKey, setPortfolioKey] = useState<keyof typeof PORTFOLIOS>('investment');
  const [symbol, setSymbol] = useState(initialSymbol);
  const [priceStr, setPriceStr] = useState('');
  const [atrStr, setAtrStr] = useState('');
  const [chartSymbol, setChartSymbol] = useState(initialSymbol);

  // Sync state when initialSymbol prop changes
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
      setChartSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Debounce the symbol input so the chart doesn't reload on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      if (symbol) setChartSymbol(symbol);
    }, 1000);
    return () => clearTimeout(handler);
  }, [symbol]);

  const chartElement = useMemo(() => (
    <AdvancedRealTimeChart 
      symbol={`EGX:${chartSymbol || 'COMI'}`}
      interval="D"
      theme="light"
      locale="ar_AE"
      autosize
      allow_symbol_change={true}
      hide_side_toolbar={false}
      details={true}
      save_image={true}
      timezone="Africa/Cairo"
      studies={["MACD@tv-basicstudies"]}
    />
  ), [chartSymbol]);

  if (!isOpen) return null;

  const capital = PORTFOLIOS[portfolioKey].capital;
  const price = parseFloat(priceStr) || 0;
  const atr = parseFloat(atrStr) || 0;

  // Calculations for the widget
  const slDistance = atr > 0 ? 2 * atr : 0;
  const slPrice = price > 0 && slDistance > 0 ? price - slDistance : 0;
  const minTarget = price > 0 && slDistance > 0 ? price + 2 * slDistance : 0;
  const maxRiskAmount = capital * 0.01;
  const sharesByRisk = slDistance > 0 ? Math.floor(maxRiskAmount / slDistance) : 0;
  const maxAllocationAmount = capital * 0.25;
  const sharesByAllocation = price > 0 ? Math.floor(maxAllocationAmount / price) : 0;
  const finalShares = Math.min(sharesByRisk, sharesByAllocation);

  const tradeData = { 
    symbol, 
    entryPrice: price, 
    atr15: atr, 
    initialStopLoss: slPrice, 
    currentStopLoss: slPrice, 
    highestPriceSinceEntry: price, 
    targetPrice: minTarget, 
    sharesCount: finalShares 
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">غرفة العمليات (Trading Desk)</h2>
            <p className="text-slate-400 text-xs font-bold mt-0.5">جهز صفقتك واحسب مخاطرتك بدقة</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content (Chart + Calculator) */}
      <div className="flex flex-col lg:flex-row gap-6 p-6 flex-1 min-h-0 overflow-y-auto">
        
        {/* Professional Risk Calculator Sidebar */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex-1 border border-slate-800">
            <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                حاسبة المخاطر السريعة
              </h2>
            </div>

            <div className="space-y-5">
              {/* Setup Inputs */}
              <div>
                <label className="text-sm font-bold text-slate-400 mb-1.5 block">المحفظة</label>
                <div className="flex bg-slate-800 p-1 rounded-xl">
                  {(Object.keys(PORTFOLIOS) as Array<keyof typeof PORTFOLIOS>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setPortfolioKey(key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        portfolioKey === key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {PORTFOLIOS[key].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-400 mb-1.5 block">السهم</label>
                  <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white font-black focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="COMI"
                    dir="ltr"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-400 mb-1.5 block">السعر (EGP)</label>
                  <input 
                    type="number" 
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white font-black focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-400 mb-1.5 block">مؤشر ATR</label>
                <input 
                  type="number" 
                  value={atrStr}
                  onChange={(e) => setAtrStr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white font-black focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              {/* Outputs */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-800">
                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <ArrowDownToLine className="w-4 h-4 text-red-400" />
                    الوقف الحتمي
                  </div>
                  <span className="font-black text-xl text-white" dir="ltr">{slPrice > 0 ? slPrice.toFixed(2) : '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    الهدف (2:1)
                  </div>
                  <span className="font-black text-xl text-white" dir="ltr">{minTarget > 0 ? minTarget.toFixed(2) : '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-600/20 p-4 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2 text-blue-200 font-bold text-sm">
                    الكمية الآمنة (أسهم)
                  </div>
                  <span className="font-black text-2xl text-blue-400" dir="ltr">{finalShares > 0 ? finalShares.toLocaleString() : '--'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {finalShares > 0 && price > 0 && slDistance > 0 && (
                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => {
                      onAddToWatchlist(tradeData);
                      onClose();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    حفظ في خطة التداول (Watchlist)
                  </button>
                  
                  <button 
                    onClick={() => {
                      onStartTrade(tradeData);
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                  >
                    <CheckCircle className="w-5 h-5" />
                    تنفيذ الصفقة الآن (Journal)
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* TradingView Chart */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
          {chartElement}
        </div>

      </div>
    </div>
  );
}
