import re
p='src/components/ActiveTrades.tsx'
s=open(p,encoding='utf-8',newline='').read().replace('\r\n','\n')

# 1) Amt component (keeps Arabic unit order correct inside RTL)
old=s[s.index('// Compact Arabic number format'):s.index('};\n',s.index('const fmtCompact'))+3]
new='''// Compact Arabic number format: 371,505 -> ["371.5", "ألف"], 2,400,000 -> ["2.40", "مليون"]
const fmtParts = (n: number): [string, string] => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return [sign + (a / 1_000_000).toFixed(2), 'مليون'];
  if (a >= 10_000) return [sign + (a / 1_000).toFixed(1), 'ألف'];
  return [sign + a.toLocaleString(undefined, { maximumFractionDigits: 0 }), ''];
};
const Amt = ({ v, plus = false }: { v: number; plus?: boolean }) => {
  const [num, unit] = fmtParts(v);
  return (
    <span className="whitespace-nowrap">
      <span dir="ltr" className="inline-block">{plus && v > 0 ? '+' : ''}{num}</span>{unit && <span className="mr-1">{unit}</span>}
    </span>
  );
};
'''
s=s.replace(old,new)

# 2) replace usages
s=s.replace('<span dir="ltr">{u > 0 ? \'+\' : \'\'}{fmtCompact(u)} ({u > 0 ? \'+\' : \'\'}{uPct.toFixed(1)}%)</span>',
            '<span className="inline-flex items-center gap-1"><Amt v={u} plus /><span dir="ltr">({u > 0 ? \'+\' : \'\'}{uPct.toFixed(1)}%)</span></span>')
s=s.replace('<span className="text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{fmtCompact(totalCost)}</span>','<span className="text-sm font-black text-slate-800 dark:text-slate-100"><Amt v={totalCost} /></span>')
s=s.replace('<span className="text-sm font-black text-slate-800 dark:text-slate-100" dir="ltr">{fmtCompact(marketValue)}</span>','<span className="text-sm font-black text-slate-800 dark:text-slate-100"><Amt v={marketValue} /></span>')
s=s.replace('<span className={`text-sm font-black ${rTone}`} dir="ltr">{rp > 0 ? \'+\' : \'\'}{fmtCompact(rp)}</span>','<span className={`text-sm font-black ${rTone}`}><Amt v={rp} plus /></span>')
assert 'fmtCompact(' not in s, 'leftover'

# 3) insight chips under avg entry
anchor='''{metrics!.avgEntry.toFixed(2)} EGP</span>
                  </p>
'''
assert anchor in s
chips='''{metrics!.avgEntry.toFixed(2)} EGP</span>
                  </p>
                  {metrics!.isOpen && analytics && (() => {
                    const days = analytics.daysHeld;
                    const cost = metrics!.openShares * metrics!.avgEntry;
                    const uPct = cost > 0 ? (metrics!.netUnrealizedPnL / cost) * 100 : 0;
                    const perDay = days && days > 0 ? uPct / days : null;
                    const R = analytics.rMultiple;
                    const chip = 'inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-black';
                    const tone = (good: boolean | null) => good === null ? 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      : good ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400';
                    const overTime = position!.plan?.timeStopDays && days !== null && days > position!.plan.timeStopDays;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {days !== null && (
                          <span className={`${chip} ${overTime ? tone(false) : tone(null)}`} title="مدة الاحتفاظ ومتوسط العائد غير المحقق لكل يوم">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{days === 0 ? 'اليوم' : days + ' يوم'}</span>
                            {perDay !== null && <span dir="ltr" className={perDay >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>({perDay > 0 ? '+' : ''}{perDay.toFixed(2)}%/يوم)</span>}
                          </span>
                        )}
                        {R !== null && (
                          <span className={`${chip} ${tone(R >= 0)}`} title="الربح أو الخسارة مقاسة بوحدات المخاطرة الأولية (R)">
                            <Target className="w-3.5 h-3.5" />
                            <span dir="ltr">{R > 0 ? '+' : ''}{R.toFixed(2)}R</span>
                          </span>
                        )}
                        {analytics.stopDistancePct > 0 && (
                          <span className={`${chip} ${tone(analytics.status === 'near' ? false : null)}`} title="المسافة بين السعر الحالي والوقف">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>الوقف يبعد</span>
                            <span dir="ltr">{analytics.stopDistancePct.toFixed(1)}%</span>
                          </span>
                        )}
                      </div>
                    );
                  })()}
'''
s=s.replace(anchor,chips,1)
# 4) Clock icon import
if 'Clock' not in s.split("from 'lucide-react'")[0]:
    s=s.replace('Wallet, Landmark, Banknote','Wallet, Landmark, Banknote, Clock',1)
open(p,'w',encoding='utf-8',newline='').write(s.replace('\n','\r\n'))
print('ok')
