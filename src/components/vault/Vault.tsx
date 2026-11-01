import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Layers, LineChart, PiggyBank, Plus, ScrollText, Settings2, Landmark } from 'lucide-react';
import { VaultProvider, useVault } from './VaultContext';
import { buildSeries, computeStats, partnerSplit } from './calc';
import { Hero, MainChart, WealthGrowthDecomposition, KpiGrid, Insights } from './OverviewView';
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

  const split = useMemo(() => partnerSplit(base, settings.partner), [base, settings.partner]);
  const partnerOn = settings.partner.enabled;
  const effLens: Lens = partnerOn ? lens : 'total';
  const pts = effLens === 'total' ? base : effLens === 'partner' ? split.partner : split.mine;
  const lastNav = base[base.length - 1]?.nav ?? 0;
  const pShare = lastNav > 0 ? Math.min(1, (split.partner[split.partner.length - 1]?.nav ?? 0) / lastNav) : 0;
  const factor = effLens === 'total' ? 1 : effLens === 'partner' ? pShare : 1 - pShare;
  const stats = useMemo(() => computeStats(pts), [pts]);
  const baseStats = useMemo(() => computeStats(buildSeries(snapshots, cashflows, active.map(p => p.id))), [snapshots, cashflows, active]);

  const lensLabel = effLens === 'total' ? 'إجمالي' : effLens === 'mine' ? 'حصتي' : `حصة ${settings.partner.name}`;
  const hasData = snapshots.length > 0 || cashflows.length > 0;

  if (loading) return <div className="py-24 text-center text-sm font-bold text-slate-400">جاري تحميل الخزنة...</div>;

  return (
    <div dir="rtl" className="space-y-5 pb-24">
      {/* Header Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">الخزنة</h1>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400">المركز المالي</p>
          </div>
        </div>

        {/* Desktop Actions / Mobile Settings Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setSnapOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:brightness-110 transition"><BarChart3 className="w-4 h-4" />تسجيل قيمة سوقية</button>
            <button onClick={() => setFlowOpen('deposit')} className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"><ArrowDownLeft className="w-4 h-4" />إيداع</button>
            <button onClick={() => setFlowOpen('withdrawal')} className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"><ArrowUpRight className="w-4 h-4" />سحب</button>
          </div>
          <button onClick={() => setSetOpen(true)} title="إعدادات الخزنة" className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 sm:p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"><Settings2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Mobile Action Buttons Bar (Clean 3-Column Grid) */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <button
          onClick={() => setSnapOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 py-2.5 px-2 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:brightness-110 transition active:scale-95"
        >
          <BarChart3 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">قيمة سوقية</span>
        </button>
        <button
          onClick={() => setFlowOpen('deposit')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 py-2.5 px-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
          <span>إيداع</span>
        </button>
        <button
          onClick={() => setFlowOpen('withdrawal')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 py-2.5 px-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition active:scale-95"
        >
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          <span>سحب</span>
        </button>
      </div>

      {/* Scope + lens */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <button
            onClick={() => setScope('all')}
            className={cx(
              'rounded-xl border px-3 py-1.5 text-xs font-black transition-all shrink-0',
              scope === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow'
                : 'border-slate-200 dark:border-slate-700 text-slate-500'
            )}
          >
            الكل
          </button>
          {active.map(p => (
            <button
              key={p.id}
              onClick={() => setScope(p.id)}
              className={cx(
                'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black transition-all shrink-0',
                scope === p.id
                  ? 'text-white shadow-md'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300'
              )}
              style={scope === p.id ? { background: p.color, borderColor: p.color } : undefined}
            >
              <i className="w-2 h-2 rounded-full" style={{ background: scope === p.id ? '#fff' : p.color }} />
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setSetOpen(true)}
            className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
            title="إضافة محفظة"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {partnerOn && (
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 shrink-0 self-start sm:self-auto">
            {([['total', 'الإجمالي'], ['mine', 'حصتي'], ['partner', settings.partner.name]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setLens(v)}
                className={cx(
                  'rounded-[10px] px-2.5 sm:px-3 py-1 text-xs font-bold transition',
                  lens === v
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500'
                )}
              >
                {l}
              </button>
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
              <li>١. سجّل أول قيمة سوقية لمحافظك بالتاريخ (تُعتمد تلقائياً كأصل رأس المال).</li>
              <li>٢. سجّل أي إيداع أو سحب لاحق بتصنيفه.</li>
              <li>٣. راقب تطور أرباحك الصافية ومؤشرات النمو لحظياً.</li>
            </ol>
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => setSetOpen(true)} className="rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-xs font-black text-white dark:text-slate-900">إعدادات الخزنة</button>
              <button onClick={() => setSnapOpen(true)} className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white">قيمة سوقية</button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 dark:bg-slate-800/60 p-1 no-scrollbar">
            {TABS.map(t => (
              <button key={t.v} onClick={() => setTab(t.v)} className={cx('flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition-all shrink-0', tab === t.v ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}>
                {t.icon}{t.label}
              </button>
            ))}
          </nav>

          {tab === 'overview' && (
            <div className="space-y-4">
              <Hero pts={pts} stats={stats} scopeLabel={scopeP?.name ?? 'الكل'} lensLabel={lensLabel} />
              <MainChart pts={pts} accent={scopeP?.color ?? '#f97316'} dir={settings.chartDirection ?? 'rtl'} />
              <WealthGrowthDecomposition
                stats={stats}
                lensLabel={`${scopeP?.name ?? 'الكل'} · ${lensLabel}`}
                scopeIds={scopeIds}
                factor={factor}
                onFocusPortfolio={pid => setScope(pid)}
              />
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

