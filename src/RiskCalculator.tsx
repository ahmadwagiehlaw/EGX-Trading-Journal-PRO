import { useState } from 'react';
import { Calculator, Info, ShieldAlert, TrendingUp, AlertTriangle, Wallet, ArrowDownToLine, ArrowUpRight } from 'lucide-react';

const PORTFOLIOS = {
  investment: { name: 'محفظة الاستثمار', capital: 1000000 },
  speculation: { name: 'محفظة المضاربة', capital: 100000 },
};

function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-72 p-4 bg-slate-900/95 backdrop-blur-sm text-white text-sm rounded-2xl shadow-2xl z-50 text-center leading-relaxed font-bold border border-slate-700/50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  );
}

export default function RiskCalculator() {
  const [portfolioKey, setPortfolioKey] = useState<keyof typeof PORTFOLIOS>('investment');
  const [priceStr, setPriceStr] = useState('');
  const [atrStr, setAtrStr] = useState('');

  const capital = PORTFOLIOS[portfolioKey].capital;
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
    <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Capital Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-white/60 hover:shadow-md transition-all hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100">
              <Wallet className="w-8 h-8 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">رأس المال النشط</p>
              <h3 className="text-3xl font-black text-slate-900" dir="ltr">{capital.toLocaleString()} <span className="text-sm text-slate-400">EGP</span></h3>
            </div>
          </div>
        </div>

        {/* Max Risk Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-white/60 hover:shadow-md transition-all hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-inner border border-red-100">
              <ShieldAlert className="w-8 h-8 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-500 font-bold text-sm">أقصى مخاطرة (1%)</p>
                <Tooltip content="قاعدة 1%: الحد الأقصى للخسارة في صفقة واحدة.">
                  <Info className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-help" />
                </Tooltip>
              </div>
              <h3 className="text-3xl font-black text-slate-900" dir="ltr">{maxRiskAmount.toLocaleString()} <span className="text-sm text-slate-400">EGP</span></h3>
            </div>
          </div>
        </div>

        {/* Max Allocation Card */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-white/60 hover:shadow-md transition-all hover:-translate-y-1 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner border border-emerald-100">
              <TrendingUp className="w-8 h-8 drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-slate-500 font-bold text-sm">سقف السيولة (25%)</p>
                <Tooltip content="لا يسمح بوضع أكثر من 25% من المحفظة في سهم واحد لضمان التنوع.">
                  <Info className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-help" />
                </Tooltip>
              </div>
              <h3 className="text-3xl font-black text-slate-900" dir="ltr">{maxAllocationAmount.toLocaleString()} <span className="text-sm text-slate-400">EGP</span></h3>
            </div>
          </div>
        </div>

      </div>

      {/* Main Journal Notebook Card */}
      <div className="bg-white/40 backdrop-blur-lg rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/60 overflow-hidden relative z-10">
        
        {/* Header / Portfolio Toggle */}
        <div className="p-6 md:p-8 border-b border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">حاسبة الصفقات</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">تخطيط مبني على أسس احترافية</p>
            </div>
          </div>

          <div className="flex bg-slate-200/80 p-2 rounded-2xl w-full md:w-auto shadow-inner">
            {(Object.keys(PORTFOLIOS) as Array<keyof typeof PORTFOLIOS>).map((key) => (
              <button
                key={key}
                onClick={() => setPortfolioKey(key)}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                  portfolioKey === key 
                    ? 'bg-white text-blue-700 shadow-sm scale-105 ring-1 ring-slate-100' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {PORTFOLIOS[key].name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-10">
          
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Right Column: Inputs */}
            <div className="space-y-8 bg-transparent p-8 rounded-[2rem] border border-white/60 shadow-sm backdrop-blur-sm">
              <div className="space-y-3">
                <label className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block shadow-sm"></span>
                  سعر السهم المستهدف (ج.م)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full text-4xl font-black text-slate-900 py-4 px-6 border-b-2 border-slate-200 bg-transparent focus:border-blue-500 transition-colors text-left outline-none placeholder:text-slate-300"
                    placeholder="0.00"
                    dir="ltr"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xl pointer-events-none">EGP</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-lg font-black text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-slate-700 rounded-full inline-block shadow-sm"></span>
                    مؤشر التذبذب ATR
                  </div>
                  <Tooltip content="متوسط المدى الحقيقي بفاصل 15 يوماً. يستخدم لحساب مسافة الوقف.">
                    <button className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                      <Info className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={atrStr}
                    onChange={(e) => setAtrStr(e.target.value)}
                    className="w-full text-4xl font-black text-slate-900 py-4 px-6 border-b-2 border-slate-200 bg-transparent focus:border-blue-500 transition-colors text-left outline-none placeholder:text-slate-300"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Left Column: Output Cards */}
            <div className="space-y-6">
              {/* Stop Loss Result */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-red-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                      <ArrowDownToLine className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">سعر الوقف الحتمي</h4>
                      <p className="text-slate-500 text-sm font-bold mt-1">مسافة الوقف: <span className="text-red-500 font-black">{slDistance > 0 ? slDistance.toFixed(2) : '0'} EGP</span></p>
                    </div>
                  </div>
                </div>
                <div className="text-5xl font-black text-slate-900 text-left mt-2 tracking-tight" dir="ltr">
                  {slPrice > 0 ? slPrice.toFixed(2) : '0.00'}
                </div>
              </div>

              {/* Target Result */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">الهدف الأدنى (2:1)</h4>
                      <p className="text-slate-500 text-sm font-bold mt-1">الربح للسهم: <span className="text-emerald-500 font-black">{(slDistance * 2).toFixed(2)} EGP</span></p>
                    </div>
                  </div>
                </div>
                <div className="text-5xl font-black text-slate-900 text-left mt-2 tracking-tight" dir="ltr">
                  {minTarget > 0 ? minTarget.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Final Verdict / Position Sizing */}
          <div className="mt-10 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              
              <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full font-bold text-sm mb-6 border border-blue-500/20">
                  حجم الشراء المسموح
                </div>
                <div className="text-7xl font-black text-white mb-2 tracking-tighter">
                  {finalShares > 0 ? finalShares.toLocaleString() : '0'}
                </div>
                <div className="text-slate-400 font-bold text-lg">سهم كحد أقصى مسموح لشرائه</div>
              </div>
              
              <div className="w-full md:w-1/2 space-y-4">
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 flex justify-between items-center border border-slate-700/50">
                  <span className="text-slate-300 font-bold">السيولة المطلوبة:</span>
                  <span className="text-2xl font-black text-white" dir="ltr">{actualAllocation.toLocaleString()} EGP</span>
                </div>
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 flex justify-between items-center border border-slate-700/50">
                  <span className="text-slate-300 font-bold">الخسارة المحتملة:</span>
                  <span className="text-2xl font-black text-red-400" dir="ltr">{(finalShares * slDistance).toLocaleString()} EGP</span>
                </div>
              </div>

            </div>

            {hitAllocationCap && (
              <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-4 text-amber-100 items-start relative z-10">
                <div className="bg-amber-500/20 p-2 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h5 className="font-black text-amber-400 text-lg mb-1">تفعيل سقف السيولة (Allocation Cap)</h5>
                  <p className="text-sm font-bold leading-relaxed opacity-90">
                    تم تخفيض عدد الأسهم تلقائياً لتجنب تجاوز 25% من سيولة المحفظة في صفقة واحدة.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
