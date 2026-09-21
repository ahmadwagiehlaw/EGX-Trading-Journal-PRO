import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, TrendingDown, Percent, BrainCircuit } from 'lucide-react';
import { useTrades } from '../context/TradeContext';

export default function Analytics() {
  const { trades } = useTrades();

  const closedTrades = trades.filter(t => t.status !== 'open');
  const wonTrades = closedTrades.filter(t => t.status === 'won');
  
  const winRate = closedTrades.length > 0 ? ((wonTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const totalPnL = closedTrades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
  
  const totalGain = wonTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalLoss = closedTrades.filter(t => t.status === 'lost').reduce((acc, t) => acc + Math.abs(t.pnl || 0), 0);
  const avgWin = wonTrades.length > 0 ? totalGain / wonTrades.length : 0;
  const avgLoss = closedTrades.filter(t => t.status === 'lost').length > 0 ? totalLoss / closedTrades.filter(t => t.status === 'lost').length : 0;
  const realRR = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? '∞' : '0.00');

  const ruleBreakerCount = closedTrades.filter(t => t.isRuleBreaker).length;
  const disciplineScore = closedTrades.length > 0 ? Math.max(0, 100 - (ruleBreakerCount * 10)) : 100;

  let currentEquity = 1000000;
  const equityData = closedTrades
    .sort((a, b) => (a.exitDate || 0) - (b.exitDate || 0))
    .map((t, idx) => {
      currentEquity += (t.pnl || 0);
      return { trade: `#${idx + 1}`, equity: currentEquity };
    });
  if (equityData.length === 0) equityData.push({ trade: 'بداية', equity: currentEquity });

  const statCards = [
    {
      icon: Percent,
      label: 'نسبة النجاح',
      sublabel: 'Win Rate',
      value: `${winRate}%`,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueCls: 'text-blue-700',
      borderColor: 'border-blue-200',
      highlight: 'bg-blue-50',
    },
    {
      icon: Target,
      label: 'العائد للمخاطرة',
      sublabel: 'Real R/R',
      value: `1:${realRR}`,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueCls: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      highlight: 'bg-emerald-50',
    },
    {
      icon: BrainCircuit,
      label: 'مؤشر الانضباط',
      sublabel: 'Discipline',
      value: `${disciplineScore}/100`,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueCls: disciplineScore >= 80 ? 'text-emerald-600' : disciplineScore >= 50 ? 'text-amber-600' : 'text-red-600',
      borderColor: 'border-purple-200',
      highlight: 'bg-purple-50',
    },
    {
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      label: 'صافي الأرباح',
      sublabel: 'Realized P&L',
      value: `${totalPnL > 0 ? '+' : ''}${totalPnL.toLocaleString()}`,
      iconBg: totalPnL >= 0 ? 'bg-emerald-100' : 'bg-red-100',
      iconColor: totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600',
      valueCls: totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600',
      borderColor: totalPnL >= 0 ? 'border-emerald-200' : 'border-red-200',
      highlight: totalPnL >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.highlight} rounded-3xl p-5 border ${card.borderColor} shadow-sm flex flex-col items-center text-center relative overflow-hidden`}
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
          >
            {/* Subtle ruled line in card */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_23px,rgba(200,216,232,0.3)_23px,rgba(200,216,232,0.3)_24px)] pointer-events-none"></div>
            <div className={`w-11 h-11 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-3 relative z-10`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-slate-500 font-bold mb-0.5 text-xs relative z-10">{card.label}</p>
            <p className="font-handwriting text-xs text-slate-400 mb-2 relative z-10">{card.sublabel}</p>
            <h3 className={`text-2xl font-black ${card.valueCls} relative z-10`} dir="ltr">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div className="rounded-[2rem] p-7 border border-slate-200 shadow-sm relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)' }}
      >
        {/* Ruled lines inside card */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_31px,rgba(200,216,232,0.25)_31px,rgba(200,216,232,0.25)_32px)] pointer-events-none rounded-[2rem]"></div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800">منحنى الأداء</h2>
            <p className="font-handwriting text-sm text-slate-400 mt-0.5">Equity Curve — تطور رأس المال</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 shadow-sm text-sm">
            محفظة الاستثمار
          </div>
        </div>

        <div className="h-[340px] w-full relative z-10" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="trade" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={8}/>
              <YAxis domain={['auto','auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-8} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 'bold', backgroundColor: '#fff' }}
                formatter={(value: any) => [`${value.toLocaleString()} EGP`, 'رأس المال']}
                labelStyle={{ color: '#64748b' }}
              />
              <Area type="monotone" dataKey="equity" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEquity)"
                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {closedTrades.length === 0 && (
        <div className="rounded-3xl p-12 border border-dashed border-slate-300 text-center"
          style={{ background: 'rgba(255,255,255,0.5)' }}
        >
          <p className="font-handwriting text-2xl text-slate-400">لا توجد صفقات مغلقة بعد...</p>
          <p className="text-sm font-bold text-slate-400 mt-2">أغلق صفقة من "سجل الصفقات" لرؤية منحنى الأداء</p>
        </div>
      )}

      {/* Psychological & Weekly Review */}
      {closedTrades.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* Smart Insights (Weekly Review) */}
          <div className="rounded-[2rem] p-6 border border-slate-200 shadow-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_23px,rgba(200,216,232,0.3)_23px,rgba(200,216,232,0.3)_24px)] pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-500" />
                المراجعة الذكية والدروس 🧠
              </h3>
              
              <div className="space-y-4">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-emerald-600 mb-1">أفضل صفقة (Best Trade)</p>
                  <p className="font-black text-emerald-800 text-lg">
                    {(() => {
                      const best = [...closedTrades].sort((a,b) => (b.pnl || 0) - (a.pnl || 0))[0];
                      return best && (best.pnl || 0) > 0 ? `${best.symbol} (+${best.pnl?.toFixed(0)})` : '—';
                    })()}
                  </p>
                </div>
                
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-red-600 mb-1">أسوأ صفقة (Worst Trade)</p>
                  <p className="font-black text-red-800 text-lg">
                    {(() => {
                      const worst = [...closedTrades].sort((a,b) => (a.pnl || 0) - (b.pnl || 0))[0];
                      return worst && (worst.pnl || 0) < 0 ? `${worst.symbol} (${worst.pnl?.toFixed(0)})` : '—';
                    })()}
                  </p>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-600 mb-1">أكثر خطأ متكرر</p>
                  <p className="font-bold text-amber-800 text-sm">
                    {(() => {
                      const mistakes = closedTrades.map(t => t.mistake).filter(Boolean);
                      if (!mistakes.length) return '—';
                      const freq:any = {};
                      let maxMistake = mistakes[0], maxCount = 1;
                      mistakes.forEach(m => {
                        freq[m!] = (freq[m!] || 0) + 1;
                        if (freq[m!] > maxCount) { maxCount = freq[m!]; maxMistake = m; }
                      });
                      return maxMistake;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lessons Learned Notebook */}
          <div className="rounded-[2rem] p-6 border border-slate-200 shadow-sm relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_31px,rgba(200,216,232,0.4)_31px,rgba(200,216,232,0.4)_32px)] pointer-events-none rounded-[2rem]"></div>
            <div className="absolute top-0 bottom-0 right-[40px] w-0.5 opacity-40 bg-red-400"></div>
            
            <div className="relative z-10 pr-[50px]">
              <h3 className="font-handwriting text-2xl text-blue-800 mb-4 mt-2">مذكرات المتداول (دروس مستفادة) 📝</h3>
              <ul className="space-y-4">
                {closedTrades.filter(t => t.lessonLearned).slice(-4).reverse().map((t, idx) => (
                  <li key={idx} className="relative">
                    <span className="absolute -right-[40px] font-handwriting text-slate-400 text-sm">{t.symbol}</span>
                    <p className="font-handwriting text-xl text-slate-700 leading-loose">
                      "{t.lessonLearned}"
                    </p>
                  </li>
                ))}
                {closedTrades.filter(t => t.lessonLearned).length === 0 && (
                  <li className="font-handwriting text-xl text-slate-400 leading-loose">لم تقم بتسجيل أي دروس بعد...</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
