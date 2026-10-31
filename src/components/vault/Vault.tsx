import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Layers, LineChart, PiggyBank, Plus, ScrollText, Settings2, Landmark } from 'lucide-react';
import { VaultProvider, useVault } from './VaultContext';
import { buildSeries, computeStats, partnerSplit } from './calc';
import { Hero, MainChart, KpiGrid, Insights } from './OverviewView';
import { CalendarView } from './CalendarView';
import { PortfoliosView } from './PortfoliosView';
import { FlowsView } from './FlowsView';
import { ProfitsView } from './ProfitsView';
import { SnapshotModal, CashflowModal } from './EntryModals';
import { SettingsModal } from './SettingsModal';
import { Card, cx } from './ui';
import type { VaultCashflow } from './types';

type Tab = 'overview' | 'calendar' | 'portfolios' | 'flows' | 'profits';
type Lens = 'total' | 'mine' | 'partner';

const TABS: { v: Tab; label: string; icon: React.ReactNode }[] = [
  { v: 'overview', label: 'نظرة عامة', icon: <LineChart className="w-4 h-4" /> },
  { v: 'calendar', label: 'التقويم', icon: <CalendarDays className="w-4 h-4" /> },
  { v: 'portfolios', label: 'المحافظ والأصول', icon: <Layers className="w-4 h-4" /> },
  { v: 'flows', label: 'الحركات والسجل', icon: <ScrollText className="w-4 h-4" /> },
  { v: 'profits', label: 'الأرباح', icon: <PiggyBank className="w-4 h-4" /> },
];

function VaultInner() {
  const { settings, snapshots, cashflows, months, loading } = useVault();
  const [tab, setTab] = useState<Tab>('overview');
  const [scope, setScope] = useState<string>('all');
  const [lens, setLens] = useState<Lens>('total');
  const [snapOpen, setSnapOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState<null | 'deposit' | 'withdrawal'>(null);
  const [setOpen, setSetOpen] = useState(false);
  const [editFlow, setEditFlow] = useState<VaultCashflow | null>(null);
  const [editSnap, setEditSnap] = useState<{ pid: string; date: string } | null>(null);

  const active = useMemo(() => settings.portfolios.filter(p => p.active), [settings.portfolios]);
  const scopeIds = useMemo(() => (scope === 'all' || !active.some(p => p.id === scope) ? active.map(p => p.id) : [scope]), [scope, active]);
  const scopeP = active.find(p => p.id === scope);

  const base = useMemo(() => buildSeries(snapshots, cashflows, scopeIds), [snapshots, cashflows, scopeIds]);

  const partnerFlows = useMemo(() => cashflows.filter(c => c.partner && scopeIds.includes(c.portfolioId)), [cashflows, scopeIds]);
  const split = useMemo(() => partnerSplit(base, partnerFlows), [base, partnerFlows]);
  const partnerOn = settings.partner.enabled && split.hasPartner;
  const effLens: Lens = partnerOn ? lens : 'total';
  const pts = effLens === 'total' ? base : effLens === 'partner' ? split.partner : split.mine;
  const lastNav = base[base.length - 1]?.nav ?? 0;
  const pShare = lastNav > 0 ? Math.min(1, (split.partner[split.partner.length - 1]?.nav ?? 0) / lastNav) : 0;
  const f = pShare;
  const factor = effLens === 'total' ? 1 : effLens === 'partner' ? pShare : 1 - pShare;
  const stats = useMemo(() => computeStats(pts), [pts]);
  const baseStats = useMemo(() => computeStats(buildSeries(snapshots, cashflows, active.map(p => p.id))), [snapshots, cashflows, active]);

  const lensLabel = effLens === 'total' ? 'إجمالي' : effLens === 'mine' ? 'حصتي' : `حصة ${settings.partner.name}`;
  const hasData = snapshots.length > 0 || cashflows.length > 0;

  if (loading) return <div className="py-24 text-center text-sm font-bold text-slate-400">جاري تحميل الخزنة...</div>;

  return (
    <div dir="rtl" className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"><Landmark className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">الخزنة</h1>
            <p className="text-[11px] font-bold text-slate-400">المركز المالي</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSnapOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:brightness-110 transition"><BarChart3 className="w-4 h-4" />تسجيل قيمة سوقية</button>
          <button onClick={() => setFlowOpen('deposit')} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"><ArrowDownLeft className="w-4 h-4" />إيداع</button>
          <button onClick={() => setFlowOpen('withdrawal')} className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"><ArrowUpRight className="w-4 h-4" />سحب</button>
          <button onClick={() => setSetOpen(true)} title="إعدادات الخزنة" className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"><Settings2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Scope + lens */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setScope('all')} className={cx('rounded-xl border px-4 py-2 text-xs font-black transition-all', scope === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow' : 'border-slate-200 dark:border-slate-700 text-slate-500')}>المحفظة المجمعة</button>
          {active.map(p => (
            <button key={p.id} onClick={() => setScope(p.id)} className={cx('flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition-all', scope === p.id ? 'text-white shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300')} style={scope === p.id ? { background: p.color, borderColor: p.color } : undefined}>
              <i className="w-2 h-2 rounded-full" style={{ background: scope === p.id ? '#fff' : p.color }} />{p.name}
            </button>
          ))}
          <button onClick={() => setSetOpen(true)} className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white" title="إضافة محفظة"><Plus className="w-4 h-4" /></button>
        </div>
        {partnerOn && (
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5">
            {([['total', 'الإجمالي'], ['mine', 'حصتي'], ['partner', settings.partner.name]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setLens(v)} className={cx('rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition', lens === v ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500')}>{l}{v !== 'total' && <span className="mr-1 text-[10px] text-slate-400">{((v === 'partner' ? f : 1 - f) * 100).toFixed(0)}%</span>}</button>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <Card>
          <div className="mx-auto max-w-md py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/30"><Landmark className="w-8 h-8" /></div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">ابدأ خزنتك</h2>
            <ol className="text-right space-y-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <li>١. سجّل رأس المال الأساسي لكل محفظة من الإعدادات.</li>
              <li>٢. سجّل القيمة السوقية بالتاريخ.</li>
              <li>٣. أي إيداع أو سحب بعد كده سجّله بتصنيفه.</li>
            </ol>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setSetOpen(true)} className="rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-black text-white dark:text-slate-900">رأس المال الأساسي</button>
              <button onClick={() => setSnapOpen(true)} className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white">قيمة سوقية</button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 dark:bg-slate-800/60 p-1">
            {TABS.map(t => (
              <button key={t.v} onClick={() => setTab(t.v)} className={cx('flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black transition-all', tab === t.v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}>
                {t.icon}{t.label}
              </button>
            ))}
          </nav>

          {tab === 'overview' && (
            <div className="space-y-4">
              <Hero pts={pts} stats={stats} scopeLabel={scopeP?.name ?? 'المحفظة المجمعة'} lensLabel={lensLabel} />
              <MainChart pts={pts} accent={scopeP?.color ?? '#f97316'} dir={settings.chartDirection ?? 'rtl'} />
              <KpiGrid stats={stats} />
              <Insights stats={stats} />
            </div>
          )}
          {tab === 'calendar' && <CalendarView pts={pts} />}
          {tab === 'portfolios' && <PortfoliosView factor={factor} scopeIds={scopeIds} onFocus={id => { setScope(id); setTab('overview'); }} />}
          {tab === 'flows' && <FlowsView scopeIds={scopeIds} onEditFlow={setEditFlow} onEditSnap={(pid, date) => setEditSnap({ pid, date })} />}
          {tab === 'profits' && <ProfitsView monthRets={baseStats.months} nav={baseStats.nav} netDeposits={baseStats.netDeposits} />}
        </>
      )}

      <SnapshotModal open={snapOpen || editSnap !== null} onClose={() => { setSnapOpen(false); setEditSnap(null); }} initialPortfolio={editSnap?.pid ?? scopeP?.id} editDate={editSnap?.date} />
      <CashflowModal open={flowOpen !== null || editFlow !== null} onClose={() => { setFlowOpen(null); setEditFlow(null); }} initialType={flowOpen ?? 'deposit'} editing={editFlow ?? undefined} />
      <SettingsModal open={setOpen} onClose={() => setSetOpen(false)} />
      <span className="hidden">{months.length}</span>
    </div>
  );
}

export default function Vault() {
  return (
    <VaultProvider>
      <VaultInner />
    </VaultProvider>
  );
}

