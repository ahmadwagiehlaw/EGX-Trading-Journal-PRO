import { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowDownToLine, ArrowUpRight, CheckCircle, Plus, X, Maximize2 } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import StockAutocomplete from './StockAutocomplete';

export default function TradingDeskModal({ 
  isOpen, 
  onClose, 
  onStartTrade, 
  onAddToWatchlist,
  initialSymbol = 'COMI'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onStartTrade: (data: any) => void;
  onAddToWatchlist: (data: any) => void;
  initialSymbol?: string;
}) {
  const { capitalInvestment, capitalSpeculation } = useTrades();
  const { theme } = useTheme();

  const [portfolioKey, setPortfolioKey] = useState<'investment' | 'speculation'>('investment');
  const [symbol, setSymbol] = useState(initialSymbol);
  const [priceStr, setPriceStr] = useState('');
  const [atrStr, setAtrStr] = useState('');
  const [chartSymbol, setChartSymbol] = useState(initialSymbol);

  const portfolios = useMemo(() => ({
    investment: { name: 'محفظة الاستثمار', capital: capitalInvestment },
    speculation: { name: 'محفظة المضاربة', capital: capitalSpeculation },
  }), [capitalInvestment, capitalSpeculation]);

  // Sync state when initialSymbol prop changes
  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
      setChartSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Debounce symbol input for chart
  useEffect(() => {
    const handler = setTimeout(() => {
      if (symbol) setChartSymbol(symbol);
    }, 800);
    return () => clearTimeout(handler);
  }, [symbol]);

  const chartElement = useMemo(() => (
    <AdvancedRealTimeChart 
      symbol={`EGX:${chartSymbol || 'COMI'}`}
      interval="D"
      theme={theme === 'dark' ? 'dark' : 'light'}
      locale="ar_AE"
      autosize
      allow_symbol_change={true}
      hide_side_toolbar={false}
      details={true}
      save_image={true}
      timezone="Africa/Cairo"
      studies={["MACD@tv-basicstudies"]}
    />
  ), [chartSymbol, theme]);

  if (!isOpen) return null;

  const capital = portfolios[portfolioKey].capital;
  const price = parseFloat(priceStr) || 0;
  const atr = parseFloat(atrStr) || 0;

  // Calculations for position sizing & risk
  const slDistance = atr > 0 ? 2 * atr : 0;
  const slPrice = price > 0 && slDistance > 0 ? price - slDistance : 0;
  const minTarget = price > 0 && slDistance > 0 ? price + 2 * slDistance : 0;
  const maxRiskAmount = capital * 0.01;
  const sharesByRisk = slDistance > 0 ? Math.floor(maxRiskAmount / slDistance) : 0;
  const maxAllocationAmount = capital * 0.25;
  const sharesByAllocation = price > 0 ? Math.floor(maxAllocationAmount / price) : 0;
  const finalShares = Math.min(sharesByRisk, sharesByAllocation);

  const tradeData = { 
    symbol: symbol.toUpperCase(), 
    entryPrice: price, 
    atr15: atr, 
    initialStopLoss: slPrice, 
    currentStopLoss: slPrice, 
    highestPriceSinceEntry: price, 
    targetPrice: minTarget, 
    sharesCount: finalShares,
    portfolioType: portfolioKey,
    entryZone: { min: price, max: price }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black">غرفة العمليات وحاسبة المخاطر (Trading Desk)</h2>
            <p className="text-slate-400 text-xs font-bold">تخطيط مبني على قواعد إدارة رأس المال الاحترافية</p>
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
        
        {/* Risk Calculator Sidebar */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
          
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex-1 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                حاسبة المخاطر اللحظية
              </h2>
            </div>

            <div className="space-y-4">
              {/* Portfolio Select */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">المحفظة النشطة</label>
                <div className="flex bg-slate-800 p-1 rounded-xl">
                  {(['investment', 'speculation'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setPortfolioKey(key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        portfolioKey === key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {portfolios[key].name} ({Number(portfolios[key].capital / 1000).toFixed(0)}k)
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol & Price Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">السهم (ابحث بالاسم العربي أو الرمز)</label>
                  <StockAutocomplete 
                    value={symbol}
                    onChange={(sym) => setSymbol(sym)}
                    placeholder="COMI أو التجاري الدولي..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">السعر المستهدف (EGP)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white font-black text-sm focus:outline-none focus:border-blue-500 font-mono-num"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* ATR Input */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">مؤشر التذبذب ATR (15)</label>
                <input 
                  type="number" 
                  step="any"
                  value={atrStr}
                  onChange={(e) => setAtrStr(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white font-black text-sm focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>

              {/* Computed Outputs */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <ArrowDownToLine className="w-4 h-4 text-red-400" />
                    الوقف الحتمي
                  </div>
                  <span className="font-black text-base text-red-400" dir="ltr">
                    {slPrice > 0 ? `${slPrice.toFixed(2)} EGP` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    الهدف الأدنى (2:1)
                  </div>
                  <span className="font-black text-base text-emerald-400" dir="ltr">
                    {minTarget > 0 ? `${minTarget.toFixed(2)} EGP` : '--'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-blue-600/20 p-3.5 rounded-xl border border-blue-500/30">
                  <div className="text-blue-200 font-bold">
                    حجم الشراء الآمن (1% مخاطرة)
                  </div>
                  <span className="font-black text-xl text-blue-400" dir="ltr">
                    {finalShares > 0 ? `${finalShares.toLocaleString()} سهم` : '--'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {finalShares > 0 && price > 0 && slDistance > 0 && (
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                  <button 
                    onClick={() => {
                      onAddToWatchlist(tradeData);
                      onClose();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    حفظ كخطة مراقبة (Watchlist)
                  </button>
                  
                  <button 
                    onClick={() => {
                      onStartTrade(tradeData);
                      onClose();
                    }}
                    className="w-full bg-gradient-to-l from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-xs transition-all hover:-translate-y-0.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    تنفيذ وتوثيق الصفقة (Journal)
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
