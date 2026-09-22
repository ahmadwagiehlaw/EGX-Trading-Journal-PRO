import { useState, useMemo } from 'react';
import { Calculator, Info, ShieldAlert, TrendingUp, AlertTriangle, Wallet, ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import { useTrades } from './context/TradeContext';
import { formatEGP } from './utils/calculations';

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-72 p-3 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-2xl shadow-2xl z-50 text-center leading-relaxed font-bold border border-slate-700/50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  );
}

export default function RiskCalculator() {
  const { capitalInvestment, capitalSpeculation } = useTrades();

  const [portfolioKey, setPortfolioKey] = useState<'investment' | 'speculation'>('investment');
  const [priceStr, setPriceStr] = useState('');
  const [atrStr, setAtrStr] = useState('');

  const portfolios = useMemo(() => ({
    investment: { name: 'محفظة الاستثمار', capital: capitalInvestment },
    speculation: { name: 'محفظة المضاربة', capital: capitalSpeculation },
  }), [capitalInvestment, capitalSpeculation]);

  const capital = portfolios[portfolioKey].capital;
  const price = parseFloat(priceStr) || 0;
  const atr = parseFloat(atrStr) || 0;

  // Calculations
  const slDistance = atr > 0 ? 2 * atr : 0;
  const slPrice = price > 0 && slDistance > 0 ? price - slDistance : 0;
  const minTarget = price > 0 && slDistance > 0 ? price + 2 * slDistance : 0;
  
  const maxRiskAmount = capital * 0.01;
  const sharesByRisk = slDistance > 0 ? Math.floor(maxRiskAmount / slDistance) : 0;
  
  const maxAllocationAmount = capital * 0.25;
  const sharesByAllocation = price > 0 ? Math.floor(maxAllocationAmount / price) : 0;
  
  const finalShares = Math.min(sharesByRisk, sharesByAllocation);
  const actualAllocation = finalShares * price;
  const hitAllocationCap = sharesByAllocation < sharesByRisk && price > 0 && slDistance > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Capital Card */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-xs mb-0.5">رأس المال النشط</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono-num" dir="ltr">
                {formatEGP(capital)}
              </h3>
            </div>
          </div>
        </div>

        {/* Max Risk Card */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-slate-500 font-bold text-xs">أقصى مخاطرة (1%)</p>
                <Tooltip content="قاعدة 1%: الحد الأقصى للخسارة في صفقة واحدة لحماية الحساب.">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </Tooltip>
              </div>
              <h3 className="text-2xl font-black text-red-600 font-mono-num" dir="ltr">
                {formatEGP(maxRiskAmount)}
              </h3>
            </div>
          </div>
        </div>

        {/* Max Allocation Card */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-slate-500 font-bold text-xs">سقف السيولة (25%)</p>
                <Tooltip content="لا يسمح بوضع أكثر من 25% من المحفظة في سهم واحد لضمان التنوع.">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                </Tooltip>
              </div>
              <h3 className="text-2xl font-black text-emerald-700 font-mono-num" dir="ltr">
                {formatEGP(maxAllocationAmount)}
              </h3>
            </div>
          </div>
        </div>

      </div>

      {/* Main Journal Notebook Card */}
      <div className="glass-card overflow-hidden">
        
        {/* Header / Portfolio Toggle */}
        <div className="p-6 border-b border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-md flex items-center justify-center shrink-0 text-white">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">حاسبة الصفقات وإدارة الحجم</h2>
              <p className="text-xs font-bold text-slate-500 mt-0.5">تخطيط دقيق لعدد الأسهم ووقف الخسارة</p>
            </div>
          </div>

          <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full md:w-auto">
            {(['investment', 'speculation'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setPortfolioKey(key)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black transition-all ${
                  portfolioKey === key 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {portfolios[key].name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                  سعر السهم المستهدف (ج.م)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full text-2xl font-black text-slate-900 py-3 px-4 border border-slate-200 bg-white rounded-xl focus:border-blue-500 outline-none text-left font-mono-num"
                    placeholder="0.00"
                    dir="ltr"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">EGP</div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-700 rounded-full inline-block"></span>
                    مؤشر التذبذب ATR (15)
                  </div>
                  <Tooltip content="متوسط المدى الحقيقي بفاصل 15 يوماً. يستخدم لحساب مسافة الوقف الحتمي.">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  </Tooltip>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    value={atrStr}
                    onChange={(e) => setAtrStr(e.target.value)}
                    className="w-full text-2xl font-black text-slate-900 py-3 px-4 border border-slate-200 bg-white rounded-xl focus:border-blue-500 outline-none text-left font-mono-num"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
              {/* Stop Loss Result */}
              <div className="bg-red-50/80 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">سعر الوقف الحتمي</h4>
                    <p className="text-slate-500 text-xs font-bold">مسافة الوقف: {slDistance > 0 ? `${slDistance.toFixed(2)} EGP` : '0'}</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-red-600 font-mono-num" dir="ltr">
                  {slPrice > 0 ? slPrice.toFixed(2) : '0.00'}
                </span>
              </div>

              {/* Target Result */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">الهدف الأدنى (2:1)</h4>
                    <p className="text-slate-500 text-xs font-bold">الربح للسهم: {(slDistance * 2).toFixed(2)} EGP</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-600 font-mono-num" dir="ltr">
                  {minTarget > 0 ? minTarget.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Position Sizing Verdict */}
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-bold text-xs mb-2 border border-blue-500/20">
                  حجم الشراء المسموح به
                </div>
                <div className="text-5xl font-black text-white font-mono-num" dir="ltr">
                  {finalShares > 0 ? `${finalShares.toLocaleString()} سهم` : '0 سهم'}
                </div>
              </div>
              
              <div className="w-full md:w-auto flex flex-col gap-2 text-xs">
                <div className="bg-slate-800 p-3 rounded-xl flex justify-between gap-8 border border-slate-700">
                  <span className="text-slate-300 font-bold">السيولة المطلوبة:</span>
                  <span className="font-black text-white font-mono-num" dir="ltr">{formatEGP(actualAllocation)}</span>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl flex justify-between gap-8 border border-slate-700">
                  <span className="text-slate-300 font-bold">الخسارة المحتملة:</span>
                  <span className="font-black text-red-400 font-mono-num" dir="ltr">{formatEGP(finalShares * slDistance)}</span>
                </div>
              </div>
            </div>

            {hitAllocationCap && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex gap-3 text-amber-200 text-xs items-center">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>تم تفعيل سقف السيولة (25%) لحماية المحفظة من التركيز العالي في سهم واحد.</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
