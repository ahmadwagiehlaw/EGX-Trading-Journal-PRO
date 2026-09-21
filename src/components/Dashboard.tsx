import { useState } from 'react';
import { Calculator, Wallet, TrendingUp, ShieldAlert, Activity, ArrowDownToLine, ArrowUpRight, CheckCircle } from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const PORTFOLIOS = {
  investment: { name: 'الاستثمار', capital: 1000000 },
  speculation: { name: 'المضاربة', capital: 100000 },
};

export default function Dashboard({ onStartTrade }: { onStartTrade: (data: any) => void }) {
  const [portfolioKey, setPortfolioKey] = useState<keyof typeof PORTFOLIOS>('investment');
  const [symbol, setSymbol] = useState('COMI');
  const [priceStr, setPriceStr] = useState('');
  const [atrStr, setAtrStr] = useState('');

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

  return (
    <div className="w-full h-full flex flex-col space-y-6" dir="rtl">
      
      {/* Top Global Stats (Portfolio Level) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-sm">القوة الشرائية (Cash)</p>
            <h3 className="text-2xl font-black text-slate-900" dir="ltr">{(capital * 0.4).toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Wallet className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-sm">إجمالي السيولة بالسوق</p>
            <h3 className="text-2xl font-black text-slate-900" dir="ltr">{(capital * 0.6).toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-sm">مخاطرة المحفظة المفتوحة</p>
            <h3 className="text-2xl font-black text-slate-900" dir="ltr">2.4%</h3>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><ShieldAlert className="w-6 h-6" /></div>
        </div>
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-bold text-sm">أداء اليوم</p>
            <h3 className="text-2xl font-black text-emerald-600" dir="ltr">+0.8%</h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><Activity className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        
        {/* TradingView Chart (Center/Right) */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] z-10 relative">
          <AdvancedRealTimeChart 
            symbol={`EGX:${symbol || 'COMI'}`}
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
        </div>

        {/* Professional Risk Calculator Sidebar (Left) */}
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

              {/* Outputs (Only show if calculated) */}
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

              {/* Start Trade Button */}
              {finalShares > 0 && price > 0 && slDistance > 0 && (
                <button 
                  onClick={() => onStartTrade({ symbol, entryPrice: price, atr15: atr, initialStopLoss: slPrice, currentStopLoss: slPrice, highestPriceSinceEntry: price, targetPrice: minTarget, sharesCount: finalShares })}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
                >
                  <CheckCircle className="w-5 h-5" />
                  تسجيل هذه الصفقة بالجورنال
                </button>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
