import { Wallet, TrendingUp, ShieldAlert, Activity, BookOpen, Target, Clock, Flame } from 'lucide-react';
import { useTrades } from '../context/TradeContext';

export default function Dashboard({ 
  onOpenTradingDesk,
  onNavigate 
}: { 
  onOpenTradingDesk?: (symbol?: string) => void;
  onNavigate?: (tab: string) => void;
}) {
  const { capitalInvestment, trades, plans } = useTrades();
  
  // Stats
  const openTradesCount = trades.filter(t => t.status === 'open').length;
  const wonTradesCount = trades.filter(t => t.status === 'won').length;
  
  // Latest 4 plans
  const recentPlans = [...plans].slice(0, 4);
  // Latest 4 trades
  const recentTrades = [...trades].slice(0, 4);

  return (
    <div className="w-full h-full flex flex-col space-y-8" dir="rtl">
      {/* Market Heat Banner */}
      {plans.filter(p => p.status === 'ready').length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 shadow-lg text-white flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">🔥 حرارة السوق عالية!</h3>
              <p className="text-orange-50 text-sm font-medium">
                لديك ({plans.filter(p => p.status === 'ready').length}) خطط جاهزة للتنفيذ. لا تفوت الفرصة!
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate?.('قائمة المراقبة')}
            className="bg-white text-orange-600 px-4 py-2 rounded-xl font-black text-sm hover:shadow-md hover:bg-orange-50 transition-all active:scale-95"
          >
            استعرض الخطط الآن
          </button>
        </div>
      )}

      {/* Top Global Stats (Portfolio Level) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-400 group-hover:w-2 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 font-bold text-sm">القوة الشرائية</p>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><Wallet className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-900" dir="ltr">{(capitalInvestment * 0.4).toLocaleString()}</h3>
        </div>
        
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-400 group-hover:w-2 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 font-bold text-sm">إجمالي السيولة</p>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-900" dir="ltr">{(capitalInvestment).toLocaleString()}</h3>
        </div>
        
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-400 group-hover:w-2 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 font-bold text-sm">الصفقات المفتوحة</p>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"><Activity className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-900" dir="ltr">{openTradesCount}</h3>
        </div>
        
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-purple-400 group-hover:w-2 transition-all"></div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 font-bold text-sm">الصفقات الرابحة</p>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100"><ShieldAlert className="w-5 h-5" /></div>
          </div>
          <h3 className="text-3xl font-black text-slate-900" dir="ltr">{wonTradesCount}</h3>
        </div>
      </div>

      {/* Main Dashboard Areas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        
        {/* Watchlist Plans */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 lg:p-8 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              أحدث خطط التداول (Watchlist)
            </h2>
            <button onClick={() => onNavigate?.('قائمة المراقبة')} className="text-sm font-bold text-blue-600 hover:underline">عرض الكل</button>
          </div>
          
          <div className="space-y-4">
            {recentPlans.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-300/50 rounded-2xl bg-white/20">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-bold">لا توجد خطط تداول حالياً.</p>
              </div>
            ) : (
              recentPlans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => onOpenTradingDesk?.(plan.symbol)}
                  className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 rounded-full bg-orange-400"></div>
                    <div>
                      <h4 className="font-black text-lg text-slate-800 group-hover:text-orange-600 transition-colors" dir="ltr">{plan.symbol}</h4>
                      <p className="font-handwriting text-slate-500 font-medium text-sm mt-0.5">{plan.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 border ${plan.status === 'ready' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {plan.status === 'ready' ? <Target className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {plan.status === 'ready' ? 'جاهز للتنفيذ' : 'قيد المتابعة'}
                    </span>
                    <p className="text-xs font-bold text-slate-400 mt-1" dir="ltr">Entry: {plan.entry}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-6 lg:p-8 border border-white/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              أحدث الصفقات (Journal)
            </h2>
            <button onClick={() => onNavigate?.('سجل الصفقات')} className="text-sm font-bold text-blue-600 hover:underline">عرض الكل</button>
          </div>
          
          <div className="space-y-4">
            {recentTrades.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-300/50 rounded-2xl bg-white/20">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 font-bold">لم تقم بتسجيل أي صفقات بعد.</p>
              </div>
            ) : (
              recentTrades.map(trade => (
                <div 
                  key={trade.id}
                  onClick={() => onNavigate?.('سجل الصفقات')}
                  className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-10 rounded-full ${trade.status === 'open' ? 'bg-blue-400' : trade.status === 'won' ? 'bg-emerald-400' : trade.status === 'lost' ? 'bg-red-400' : 'bg-slate-400'}`}></div>
                    <div>
                      <h4 className="font-black text-lg text-slate-800 group-hover:text-emerald-600 transition-colors" dir="ltr">{trade.symbol}</h4>
                      <p className="text-slate-500 font-bold text-xs mt-0.5">
                        {new Date(trade.entryDate).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 border ${trade.status === 'open' ? 'bg-blue-50 text-blue-600 border-blue-100' : trade.status === 'won' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : trade.status === 'lost' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {trade.status === 'open' ? 'مفتوحة' : trade.status === 'won' ? 'ربح' : trade.status === 'lost' ? 'خسارة' : 'تعادل'}
                    </span>
                    {trade.pnl !== undefined && (
                      <p className={`text-xs font-black mt-1 ${trade.pnl > 0 ? 'text-emerald-500' : trade.pnl < 0 ? 'text-red-500' : 'text-slate-500'}`} dir="ltr">
                        {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(0)} EGP
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
