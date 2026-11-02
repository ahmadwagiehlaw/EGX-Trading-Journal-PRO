import { useEffect, useMemo, useState } from 'react';
import { Area, Bar, ComposedChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, Trash2, PiggyBank, HandCoins, Percent, ArrowRightLeft, RefreshCw, TrendingUp, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Card, ChartTip, Empty, Field, Segmented, inputCls, cx } from './ui';
import { useVault } from './VaultContext';
import type { PeriodRet } from './calc';
import { fmt, fmtCompact, fmtPct, monthLabel, MONTHS_EN } from './calc';

const monthNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

type ChartView = 'partner' | 'mine' | 'compare' | 'cumulative';

export interface ComputedProfitRow {
  id: string;
  // الشريك (لولو)
  rawRetainedPartner: number; // المجنب المسجل صراحةً في هذا الشهر
  distributedPartner: number; // الموزع للشريك في هذا الشهر
  carriedInPartner: number; // المرحل من الشهر السابق قبل الخصم
  paidFromReservePartner: number; // المسدد من رصيد المجنب المرحل
  effectiveRetainedPartner: number; // الرصيد المجنب المتبقي بعد خصم توزيع الشهر (يُرحل للشهر التالي)
  isCarriedPartner: boolean; // هل يحتوي الرصيد المتبقي على مبلغ مرحل تلقائياً؟
  newEarnedPartner: number; // صافي الربح الجديد المولّد للشريك في هذا الشهر (توزيع جديد خارج المرحل + تجنيب جديد)
  // حصتي (60% افتراضياً أو يدوي)
  rawRetainedMine: number;
  rawDistributedMine: number;
  effectiveRetainedMine: number;
  effectiveDistributedMine: number;
  totalMineMonth: number; // إجمالي حصتي المحققة في هذا الشهر (سواء معاد استثمارها أو موزعة)
  cumulativeMine: number; // التراكمي لحصتي عبر الشهور
  cumulativePartner: number; // التراكمي للشريك عبر الشهور
  isAutoMine: boolean; // هل تم حساب حصتي تلقائياً قياساً على الشريك؟
  manualMine?: boolean;
  note?: string;
}

export function ProfitsView({ monthRets, nav, netDeposits }: { monthRets: PeriodRet[]; nav: number; netDeposits: number }) {
  const { months, saveMonth, deleteMonth, settings } = useVault();
  const partner = settings.partner.enabled;
  const partnerName = settings.partner.name || 'لولو';

  // النسب الافتراضية: 60% لحصتي / 40% للشريك (أو حسب الإعدادات)
  const partnerSharePct = settings.partner.profitShare ?? 40;
  const mySharePct = 100 - partnerSharePct;
  const partnerToMineRatio = partnerSharePct > 0 ? mySharePct / partnerSharePct : 1.5; // 60 / 40 = 1.5
  const mineToPartnerRatio = mySharePct > 0 ? partnerSharePct / mySharePct : 2 / 3; // 40 / 60 = 0.6667

  const [month, setMonth] = useState(monthNow());
  const [chartView, setChartView] = useState<ChartView>('compare');
  const [autoSync, setAutoSync] = useState(true);
  const [manualMineOverride, setManualMineOverride] = useState(false);
  const [showRetained, setShowRetained] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [f, setF] = useState({
    retainedMine: '',
    retainedPartner: '',
    distributedMine: '',
    distributedPartner: '',
    note: '',
  });
  const n = (s: string) => parseFloat(s) || 0;

  // ───────── المحرك الذكي: الترحيل التلقائي للمجنب + القياس التلقائي 60/40 لحصتي ─────────
  const computedRows = useMemo<ComputedProfitRow[]>(() => {
    const sorted = [...months].sort((a, b) => a.id.localeCompare(b.id));
    let runningPartnerReserve = 0;
    let cumMine = 0;
    let cumPartner = 0;

    return sorted.map(m => {
      const carriedInPartner = runningPartnerReserve;
      const distP = m.distributedPartner || 0;
      const rawRetP = m.retainedPartner || 0;

      // خصم توزيع الشهر الحالي للشريك من المجنب المرحل من الشهر السابق مباشرةً
      const paidFromReservePartner = Math.min(carriedInPartner, distP);
      const remainingCarryAfterDist = Math.max(0, carriedInPartner - distP);

      // الرصيد المجنب الفعلي في نهاية الشهر = المتبقي من المرحل + أي مجنب جديد أضيف في هذا الشهر
      const effectiveRetainedPartner = remainingCarryAfterDist + rawRetP;
      const isCarriedPartner = remainingCarryAfterDist > 0 && rawRetP === 0;

      // صافي الربح الجديد المفرز للشريك في هذا الشهر:
      // - في الشهر المخصص فيه رصيد مجنب يدوي: ربح الشريك الإجمالي بالشهر = الموزع + المجنب اليدوي
      // - في شهور الترحيل التلقائي (بدون مجنب يدوي جديد): ربح الشريك الموزع = الموزع فقط
      const partnerEarnedBasis = distP + rawRetP;

      runningPartnerReserve = effectiveRetainedPartner;

  // حساب حصتي (60%) تلقائياً قياساً على حصة الشريك (40%):
      // وبما أنك تعيد استثمار أرباحك بالكامل، فإن أرباحك الشهرية في الشهر الذي جُنبت فيه أرباح لـ لولو
      // تساوي 60% مقابل (موزع لولو + مجنب لولو اليدوي معاً)، وفي شهور الترحيل التلقائي تساوي 60% مقابل الموزع فقط!
      const hasExplicitMine = Boolean(m.manualMine);
      const isAutoMine = !hasExplicitMine && (rawRetP > 0 || distP > 0 || effectiveRetainedPartner > 0);

      const effectiveDistributedMine = hasExplicitMine
        ? (m.distributedMine || 0)
        : Math.round(partnerEarnedBasis * partnerToMineRatio);

      const effectiveRetainedMine = hasExplicitMine
        ? (m.retainedMine || 0)
        : 0;

      // إجمالي حصتي المحققة والمعاد استثمارها في هذا الشهر
      const netFreshMine = effectiveDistributedMine + effectiveRetainedMine;

      cumMine += netFreshMine;
      cumPartner += partnerEarnedBasis;

      return {
        id: m.id,
        rawRetainedPartner: rawRetP,
        distributedPartner: distP,
        carriedInPartner,
        paidFromReservePartner,
        effectiveRetainedPartner,
        isCarriedPartner,
        newEarnedPartner: partnerEarnedBasis,
        rawRetainedMine: m.retainedMine || 0,
        rawDistributedMine: m.distributedMine || 0,
        effectiveRetainedMine,
        effectiveDistributedMine,
        totalMineMonth: netFreshMine,
        cumulativeMine: cumMine,
        cumulativePartner: cumPartner,
        isAutoMine,
        manualMine: m.manualMine,
        note: m.note,
      };
    });
  }, [months, partnerToMineRatio]);

  // حساب الرصيد المجنب المرحل للشهر المختصر حالياً في نموذج الإدخال (من الشهور السابقة له)
  const carryIntoSelectedMonth = useMemo(() => {
    const sorted = [...months].filter(x => x.id < month).sort((a, b) => a.id.localeCompare(b.id));
    let reserve = 0;
    for (const m of sorted) {
      const afterDist = Math.max(0, reserve - (m.distributedPartner || 0));
      reserve = afterDist + (m.retainedPartner || 0);
    }
    return reserve;
  }, [months, month]);

  // تحميل بيانات الشهر عند اختياره
  const load = (id: string) => {
    setMonth(id);
    const row = computedRows.find(x => x.id === id);
    const raw = months.find(x => x.id === id);
    if (raw && row) {
      setManualMineOverride(Boolean(raw.manualMine));
      setShowRetained(Boolean(raw.retainedPartner > 0 || raw.retainedMine > 0));
      setF({
        retainedMine: String(row.effectiveRetainedMine || ''),
        retainedPartner: String(raw.retainedPartner || ''),
        distributedMine: String(row.effectiveDistributedMine || ''),
        distributedPartner: String(raw.distributedPartner || ''),
        note: raw.note ?? '',
      });
    } else {
      setManualMineOverride(false);
      setShowRetained(false);
      setF({ retainedMine: '', retainedPartner: '', distributedMine: '', distributedPartner: '', note: '' });
    }
  };

  // تحميل الشهر الافتراضي عند أول فتح
  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.length]);

  // تحديث الحقول مع الحساب التبادلي التلقائي (60% لي ↔ 40% للشريك) مع احترام التعديل اليدوي
  // ملاحظة جوهرية: المجنب اليدوي للشريك هو جزء أصيل من ربح الشريك في ذلك الشهر قررنا عدم توزيعه ليرحل،
  // وبالتالي أرباحي (60%) في نفس الشهر تُحسب مقابل مجموع (الموزع لـ لولو + المجنب اليدوي لـ لولو) معاً!
  // أما في شهور الترحيل التلقائي (حيث المجنب اليدوي = 0) فتُحسب أرباحي (60%) مقابل الموزع فقط.
  const handleFieldChange = (
    k: 'retainedMine' | 'retainedPartner' | 'distributedMine' | 'distributedPartner',
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setF(prev => {
      const next = { ...prev, [k]: val };
      if (!partner || !autoSync) return next;

      if (k === 'distributedPartner' || k === 'retainedPartner') {
        const distP = k === 'distributedPartner' ? num : (parseFloat(prev.distributedPartner) || 0);
        const rawRetP = k === 'retainedPartner' ? num : (parseFloat(prev.retainedPartner) || 0);
        const totalPartnerMonth = distP + rawRetP;
        if (!manualMineOverride) {
          next.distributedMine = totalPartnerMonth > 0 ? String(Math.round(totalPartnerMonth * partnerToMineRatio)) : '';
        }
      } else if (k === 'distributedMine') {
        // إذا أدخل المستخدم حصته بيده: لو كان حقل الشريك فارغاً نحسب الشريك تلقائياً، وإلا نعتبره تخصيصاً يدوياً لحصته ونحترمه
        const curPartnerTotal = (parseFloat(prev.distributedPartner) || 0) + (parseFloat(prev.retainedPartner) || 0);
        if (curPartnerTotal === 0) {
          next.distributedPartner = num > 0 ? String(Math.round(num * mineToPartnerRatio)) : '';
        } else {
          setManualMineOverride(true);
        }
      } else if (k === 'retainedMine') {
        setManualMineOverride(true);
      }
      return next;
    });
  };

  const save = async () => {
    await saveMonth({
      id: month,
      retainedMine: n(f.retainedMine),
      retainedPartner: n(f.retainedPartner),
      distributedMine: n(f.distributedMine),
      distributedPartner: n(f.distributedPartner),
      manualMine: manualMineOverride,
      note: f.note || undefined,
    });
  };

  // زرار مزامنة وتوليد أرباحي القياسية لكل الشهور السابقة بضغطة واحدة في قاعدة البيانات
  const syncAllHistoricalMine = async () => {
    for (const row of computedRows) {
      if (!row.manualMine) {
        await saveMonth({
          id: row.id,
          retainedMine: row.effectiveRetainedMine,
          retainedPartner: row.rawRetainedPartner,
          distributedMine: row.effectiveDistributedMine,
          distributedPartner: row.distributedPartner,
          manualMine: false,
          note: row.note,
        });
      }
    }
  };

  // ملخص المؤشرات العليا (شاملة الترحيل والحصة القياسية 60%)
  const summary = useMemo(() => {
    const lastRow = computedRows[computedRows.length - 1];
    // الرصيد المجنب الحالي الفعلي للشريك (المرحل حتى آخر شهر)
    const activePartnerReserve = lastRow ? lastRow.effectiveRetainedPartner : 0;
    // إجمالي الموزع الفعلي للشريك عبر كل الشهور
    const totalDistPartner = computedRows.reduce((s, r) => s + r.distributedPartner, 0);
    // إجمالي أرباحي الشهرية المحققة (موزع + مجنب معاد استثماره قياساً بـ 60%)
    const totalMineEarned = lastRow ? lastRow.cumulativeMine : 0;
    const totalMineDistributedEq = computedRows.reduce((s, r) => s + r.effectiveDistributedMine, 0);
    const totalMineRetainedEq = computedRows.reduce((s, r) => s + r.effectiveRetainedMine, 0);
    const avgMonthlyMine = computedRows.length > 0 ? Math.round(totalMineEarned / computedRows.length) : 0;

    return {
      activePartnerReserve,
      totalDistPartner,
      totalMineEarned,
      totalMineDistributedEq,
      totalMineRetainedEq,
      avgMonthlyMine,
    };
  }, [computedRows]);

  // معاينة الترحيل الفوري للشهر المختار في الفورم
  const previewDistP = n(f.distributedPartner);
  const previewRawRetP = n(f.retainedPartner);
  const previewRemainingCarry = Math.max(0, carryIntoSelectedMonth - previewDistP) + previewRawRetP;

  return (
    <div className="space-y-4">
      {/* 4 كروت تنفيذية مدمجة بدون شرح مطول */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <K
          icon={<TrendingUp className="w-4 h-4" />}
          label={`أرباحي المحققة (${mySharePct}%)`}
          value={fmt(summary.totalMineEarned)}
          sub={`متوسط ${fmt(summary.avgMonthlyMine)} / شهر`}
          cls="text-emerald-500"
        />
        <K
          icon={<HandCoins className="w-4 h-4" />}
          label={`الموزع لـ ${partnerName} (${partnerSharePct}%)`}
          value={fmt(summary.totalDistPartner)}
          sub={`مقابل ${fmt(summary.totalMineDistributedEq)} لحصتي`}
          cls="text-amber-500"
        />
        <K
          icon={<PiggyBank className="w-4 h-4" />}
          label={`مجنب ${partnerName} المرحّل`}
          value={fmt(summary.activePartnerReserve)}
          sub="رصيد متاح للشهور القادمة"
          cls="text-violet-500"
        />
        <K
          icon={<Percent className="w-4 h-4" />}
          label="نسبة الأرباح من الإيداعات"
          value={netDeposits > 0 ? `${(((summary.totalMineEarned + summary.totalDistPartner + summary.activePartnerReserve) / netDeposits) * 100).toFixed(1)}%` : '—'}
          sub={nav > 0 ? `${(((summary.totalMineEarned + summary.totalDistPartner) / nav) * 100).toFixed(1)}% من السوقية` : ''}
          cls="text-sky-500"
        />
      </div>

      {/* جزآن متساويان في الارتفاع والحجم: تسجيل الشهر + الشارت التحليلي */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* الفورم الذكي المدمج لتسجيل الشهر */}
        <Card
          title="تسجيل الشهر"
          className="lg:col-span-2 flex flex-col justify-between"
          right={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={syncAllHistoricalMine}
                title="مزامنة وتثبيت حصة 60% لكل الشهور السابقة"
                className="flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-[10px] font-black transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>مزامنة 60%</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoSync(s => !s);
                  if (!autoSync) setManualMineOverride(false);
                }}
                className={cx(
                  'flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black border transition',
                  autoSync && !manualMineOverride
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                )}
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>{autoSync && !manualMineOverride ? `${mySharePct}/${partnerSharePct}` : 'يدوي'}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {/* اختيار الشهر + شارة المرحل إن وجد */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input type="month" value={month} onChange={e => load(e.target.value)} className={cx(inputCls, '!py-2 text-xs font-black')} />
              </div>
              {partner && carryIntoSelectedMonth > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-2 text-[10px] font-black text-violet-600 dark:text-violet-300 shrink-0" title="يُخصم منه توزيع الشهر تلقائياً">
                  <span>🔄 مرحّل: <b dir="ltr">{fmt(carryIntoSelectedMonth)}</b></span>
                  <span className="text-slate-400">←</span>
                  <span>متبقي: <b dir="ltr">{fmt(previewRemainingCarry)}</b></span>
                </div>
              )}
            </div>

            {/* الحقول الأساسية الدائمة: الموزع للشريك + الموزع/المعاد استثماره لي */}
            <div className="grid grid-cols-2 gap-2.5">
              <Field label={`ربحي (${mySharePct}%)`}>
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={f.distributedMine}
                  onChange={e => handleFieldChange('distributedMine', e.target.value)}
                  placeholder="0"
                  className={cx(inputCls, '!py-2 text-left tabular-nums font-black')}
                  style={{ borderTop: '3px solid #34d399' }}
                />
              </Field>
              {partner && (
                <Field label={`موزع لـ ${partnerName} (${partnerSharePct}%)`}>
                  <input
                    inputMode="decimal"
                    dir="ltr"
                    value={f.distributedPartner}
                    onChange={e => handleFieldChange('distributedPartner', e.target.value)}
                    placeholder="0"
                    className={cx(inputCls, '!py-2 text-left tabular-nums font-black')}
                    style={{ borderTop: '3px solid #fbbf24' }}
                  />
                </Field>
              )}
            </div>

            {/* أزرار قابلة للطي: 1) تخصيص مجنب جديد  2) حاسبة سريعة */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRetained(v => !v)}
                className={cx(
                  'flex-1 flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-black transition',
                  showRetained || n(f.retainedPartner) > 0 || n(f.retainedMine) > 0
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-violet-500" />
                  <span>الأرباح المجنبة</span>
                  {(n(f.retainedPartner) > 0 || n(f.retainedMine) > 0) && (
                    <b dir="ltr" className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px]">
                      {fmt(n(f.retainedPartner) + n(f.retainedMine))}
                    </b>
                  )}
                </span>
                {showRetained ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {partner && (
                <button
                  type="button"
                  onClick={() => setShowCalc(v => !v)}
                  className={cx(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition shrink-0',
                    showCalc
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  )}
                  title="حاسبة تقسيم إجمالي الربح"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                  <span>حاسبة</span>
                  {showCalc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* القسم القابل للطي 1: الأرباح المجنبة (يفتح عند الحاجة فقط) */}
            {showRetained && (
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-violet-500/25 bg-violet-500/[0.04] p-2.5 animate-in fade-in duration-150">
                <Field label={`مجنب لي (${mySharePct}%)`}>
                  <input
                    inputMode="decimal"
                    dir="ltr"
                    value={f.retainedMine}
                    onChange={e => handleFieldChange('retainedMine', e.target.value)}
                    placeholder="0"
                    className={cx(inputCls, '!py-1.5 text-left tabular-nums text-xs')}
                    style={{ borderTop: '3px solid #38bdf8' }}
                  />
                </Field>
                {partner && (
                  <Field label={`مجنب جديد لـ ${partnerName}`}>
                    <input
                      inputMode="decimal"
                      dir="ltr"
                      value={f.retainedPartner}
                      onChange={e => handleFieldChange('retainedPartner', e.target.value)}
                      placeholder={carryIntoSelectedMonth > 0 ? `مرحل: ${fmt(previewRemainingCarry)}` : '0'}
                      className={cx(inputCls, '!py-1.5 text-left tabular-nums text-xs')}
                      style={{ borderTop: '3px solid #a78bfa' }}
                    />
                  </Field>
                )}
              </div>
            )}

            {/* القسم القابل للطي 2: حاسبة التوزيع الفورية من إجمالي مبلغ */}
            {partner && showCalc && (() => {
              const curRet = monthRets.find(x => x.key === month);
              const autoGain = curRet && curRet.gain > 0 ? Math.round(curRet.gain) : 0;
              return (
                <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.04] p-2.5 space-y-2 animate-in fade-in duration-150">
                  {autoGain > 0 && (
                    <div className="flex items-center justify-between gap-1.5 text-[10px]">
                      <span className="font-bold text-slate-500">
                        ربح {monthLabel(month)}: <b dir="ltr" className="text-emerald-500">+{fmt(autoGain)}</b>
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setManualMineOverride(false);
                            setF(s => ({
                              ...s,
                              distributedMine: String(Math.round(autoGain * (mySharePct / 100))),
                              distributedPartner: String(Math.round(autoGain * (partnerSharePct / 100))),
                            }));
                          }}
                          className="rounded-md bg-emerald-600 text-white px-2 py-0.5 font-black"
                        >
                          ⚡ كموزع
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualMineOverride(false);
                            setShowRetained(true);
                            setF(s => ({
                              ...s,
                              retainedMine: String(Math.round(autoGain * (mySharePct / 100))),
                              retainedPartner: String(Math.round(autoGain * (partnerSharePct / 100))),
                            }));
                          }}
                          className="rounded-md bg-violet-600 text-white px-2 py-0.5 font-black"
                        >
                          ⚡ كمجنب
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="اكتب إجمالي ربح (100%)..."
                      id="quick_split_val"
                      className={cx(inputCls, '!py-1.5 text-xs text-left tabular-nums')}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                        const val = parseFloat(el?.value || '') || 0;
                        if (val > 0) {
                          setManualMineOverride(false);
                          setShowRetained(true);
                          setF(s => ({
                            ...s,
                            retainedMine: String(Math.round(val * (mySharePct / 100))),
                            retainedPartner: String(Math.round(val * (partnerSharePct / 100))),
                          }));
                        }
                      }}
                      className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 text-[10px] font-black"
                    >
                      كمجنب
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('quick_split_val') as HTMLInputElement | null;
                        const val = parseFloat(el?.value || '') || 0;
                        if (val > 0) {
                          setManualMineOverride(false);
                          setF(s => ({
                            ...s,
                            distributedMine: String(Math.round(val * (mySharePct / 100))),
                            distributedPartner: String(Math.round(val * (partnerSharePct / 100))),
                          }));
                        }
                      }}
                      className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-[10px] font-black"
                    >
                      كموزع
                    </button>
                  </div>
                </div>
              );
            })()}

            {manualMineOverride && (
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <span>✋ تعديل يدوي</span>
                <button
                  type="button"
                  onClick={() => {
                    setManualMineOverride(false);
                    setF(s => {
                      const totalP = n(s.distributedPartner) + n(s.retainedPartner);
                      return {
                        ...s,
                        retainedMine: '',
                        distributedMine: totalP > 0 ? String(Math.round(totalP * partnerToMineRatio)) : '',
                      };
                    });
                  }}
                  className="underline font-black"
                >
                  إعادة 60%
                </button>
              </div>
            )}

            {/* ملاحظة + زر الحفظ في سطر متناسق */}
            <div className="flex items-center gap-2 pt-1">
              <input
                value={f.note}
                onChange={e => setF(s => ({ ...s, note: e.target.value }))}
                className={cx(inputCls, '!py-2.5 text-xs flex-1')}
                placeholder="ملاحظة سريعة (اختياري)..."
              />
              <button
                onClick={save}
                className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:brightness-110 transition"
              >
                <Check className="w-4 h-4" />
                <span>حفظ {monthLabel(month)}</span>
              </button>
            </div>
          </div>
        </Card>

        {/* الشارت التحليلي الموازن بارتفاع متطابق */}
        <Card
          title="تحليل الأرباح"
          className="lg:col-span-3 flex flex-col justify-between"
          right={
            <Segmented
              size="sm"
              value={chartView}
              onChange={setChartView}
              options={[
                { v: 'compare', label: 'مقارنة' },
                { v: 'mine', label: `حصتي ${mySharePct}%` },
                { v: 'partner', label: `${partnerName} ${partnerSharePct}%` },
                { v: 'cumulative', label: 'التراكمي' },
              ]}
            />
          }
        >
          {!computedRows.length ? (
            <Empty text="لسه مفيش أرباح مسجلة" />
          ) : (
            <div className="space-y-2">
              {/* وسيلة إيضاح مختصرة جداً */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                {chartView === 'compare' && (
                  <>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400" />ربحي (60%)</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400" />موزع {partnerName} (40%)</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-violet-400" />مجنب {partnerName}</span>
                  </>
                )}
                {chartView === 'mine' && (
                  <>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400" />ربحي الشهري</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-400" />مجنب لي</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-teal-500" />التراكمي</span>
                  </>
                )}
                {chartView === 'partner' && (
                  <>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400" />موزع {partnerName}</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-violet-400" />الرصيد المجنب</span>
                  </>
                )}
                {chartView === 'cumulative' && (
                  <>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400" />تراكمي أرباحي (60%)</span>
                    <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400" />تراكمي {partnerName} (40%)</span>
                  </>
                )}
              </div>

              <div dir="ltr" className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={computedRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCumMine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCumPartner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.07} vertical={false} />
                    <XAxis
                      dataKey="id"
                      tickFormatter={(k: string) => `${MONTHS_EN[+k.slice(5, 7) - 1]} ${k.slice(2, 4)}`}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      orientation="right"
                      tickFormatter={fmtCompact}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                      content={
                        <ChartTip
                          labelFmt={monthLabel}
                          rows={raw => {
                            const p = raw as unknown as ComputedProfitRow;
                            if (chartView === 'mine') {
                              return [
                                { name: 'حصتي الموزعة/المعاد استثمارها', value: `${fmt(p.effectiveDistributedMine)} ج.م`, color: '#34d399' },
                                { name: 'مجنب لي (احتياطي)', value: `${fmt(p.effectiveRetainedMine)} ج.م`, color: '#38bdf8' },
                                { name: 'صافي ربحي الجديد بالشهر', value: `${fmt(p.totalMineMonth)} ج.م`, color: '#10b981' },
                                { name: 'تراكمي أرباحي حتى الشهر', value: `${fmt(p.cumulativeMine)} ج.م`, color: '#14b8a6' },
                              ];
                            }
                            if (chartView === 'partner') {
                              return [
                                { name: `موزع لـ ${partnerName}`, value: `${fmt(p.distributedPartner)} ج.م`, color: '#fbbf24' },
                                { name: 'مسدد من المجنب المرحل', value: `${fmt(p.paidFromReservePartner)} ج.م`, color: '#c084fc' },
                                { name: `رصيد مجنب ${partnerName} المتبقي`, value: `${fmt(p.effectiveRetainedPartner)} ج.م${p.isCarriedPartner ? ' (مرحل)' : ''}`, color: '#a78bfa' },
                              ];
                            }
                            if (chartView === 'cumulative') {
                              return [
                                { name: `تراكمي أرباحي (${mySharePct}%)`, value: `${fmt(p.cumulativeMine)} ج.م`, color: '#10b981' },
                                { name: `تراكمي أرباح ${partnerName} (${partnerSharePct}%)`, value: `${fmt(p.cumulativePartner)} ج.م`, color: '#f59e0b' },
                              ];
                            }
                            return [
                              { name: `ربحي المعاد استثماره (${mySharePct}%)`, value: `${fmt(p.effectiveDistributedMine)} ج.م`, color: '#34d399' },
                              { name: `موزع لـ ${partnerName} (${partnerSharePct}%)`, value: `${fmt(p.distributedPartner)} ج.م`, color: '#fbbf24' },
                              { name: `مجنب ${partnerName} المتبقي`, value: `${fmt(p.effectiveRetainedPartner)} ج.م${p.isCarriedPartner ? ' (مرحل)' : ''}`, color: '#a78bfa' },
                            ];
                          }}
                        />
                      }
                    />

                    {chartView === 'compare' && (
                      <>
                        <Bar dataKey="effectiveDistributedMine" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={24} />
                        <Bar dataKey="distributedPartner" stackId="p" fill="#fbbf24" maxBarSize={24} />
                        <Bar dataKey="effectiveRetainedPartner" stackId="p" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={24} />
                      </>
                    )}

                    {chartView === 'mine' && (
                      <>
                        <Bar dataKey="effectiveDistributedMine" stackId="m" fill="#34d399" maxBarSize={30} />
                        <Bar dataKey="effectiveRetainedMine" stackId="m" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={30} />
                        <Area type="monotone" dataKey="cumulativeMine" stroke="#14b8a6" strokeWidth={2} fill="url(#gCumMine)" />
                      </>
                    )}

                    {chartView === 'partner' && (
                      <>
                        <Bar dataKey="distributedPartner" stackId="p" fill="#fbbf24" maxBarSize={30} />
                        <Bar dataKey="effectiveRetainedPartner" stackId="p" fill="#a78bfa" radius={[6, 6, 0, 0]} maxBarSize={30} />
                      </>
                    )}

                    {chartView === 'cumulative' && (
                      <>
                        <Area type="monotone" dataKey="cumulativeMine" stroke="#10b981" strokeWidth={2.5} fill="url(#gCumMine)" />
                        <Area type="monotone" dataKey="cumulativePartner" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gCumPartner)" />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* جدول سجل الشهور الشامل */}
      <Card title="سجل الشهور" pad={false}>
        {!computedRows.length ? (
          <Empty text="لا توجد سجلات" />
        ) : (
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[740px] text-xs font-bold tabular-nums" dir="rtl">
              <thead>
                <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-2 py-2.5 text-right font-black">الشهر</th>
                  <th className="px-2 py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">ربحي ({mySharePct}%)</th>
                  <th className="px-2 py-2.5 text-right font-black text-sky-500">مجنب لي</th>
                  <th className="px-2 py-2.5 text-right font-black text-amber-500">موزع {partnerName} ({partnerSharePct}%)</th>
                  <th className="px-2 py-2.5 text-right font-black text-violet-500">مجنب {partnerName}</th>
                  <th className="px-2 py-2.5 text-right font-black">ربح التقويم</th>
                  <th className="px-2 py-2.5 text-right font-black"></th>
                </tr>
              </thead>
              <tbody>
                {[...computedRows].reverse().map(row => {
                  const r = monthRets.find(x => x.key === row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => load(row.id)}
                      className="cursor-pointer border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* الشهر */}
                      <td className="px-2 py-3 font-black text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{monthLabel(row.id)}</span>
                          {row.isAutoMine && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                              60% تلقائي
                            </span>
                          )}
                          {row.manualMine && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400">
                              يدوي
                            </span>
                          )}
                        </div>
                        {row.note && <div className="text-[10px] font-bold text-slate-400 mt-0.5">{row.note}</div>}
                      </td>

                      {/* حصتي الموزعة / المعاد استثمارها */}
                      <td className="px-2 py-3 text-emerald-600 dark:text-emerald-400" dir="ltr">
                        <span className="font-black">+{fmt(row.effectiveDistributedMine)}</span>
                      </td>

                      {/* مجنب لي */}
                      <td className="px-2 py-3 text-sky-500" dir="ltr">
                        {row.effectiveRetainedMine > 0 ? fmt(row.effectiveRetainedMine) : '0'}
                      </td>

                      {/* موزع للشريك + إشارة لو تم سحبه من المجنب المرحل */}
                      <td className="px-2 py-3 text-amber-500" dir="ltr">
                        <div className="flex flex-col items-end">
                          <span className="font-black">{fmt(row.distributedPartner)}</span>
                          {row.paidFromReservePartner > 0 && (
                            <span className="text-[9px] font-black text-violet-500" dir="rtl">
                              خصم {fmt(row.paidFromReservePartner)} من المجنب
                            </span>
                          )}
                        </div>
                      </td>

                      {/* رصيد مجنب الشريك الفعلي + شارة مرحل */}
                      <td className="px-2 py-3 text-violet-500" dir="ltr">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-black">{fmt(row.effectiveRetainedPartner)}</span>
                          {row.isCarriedPartner && (
                            <span className="rounded-md bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.5 text-[9px] font-black text-violet-600 dark:text-violet-300" dir="rtl">
                              مرحّل 🔄
                            </span>
                          )}
                          {!row.isCarriedPartner && row.carriedInPartner > 0 && row.effectiveRetainedPartner > 0 && (
                            <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-500" dir="rtl">
                              شامل مرحّل
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ربح الشهر في التقويم */}
                      <td className={cx('px-2 py-3', r ? (r.gain >= 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400')} dir="ltr">
                        {r ? `${fmt(r.gain)} (${fmtPct(r.pct, 1)})` : '—'}
                      </td>

                      {/* حذف */}
                      <td className="px-2 py-3">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteMonth(row.id);
                          }}
                          className="text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function K({ icon, label, value, sub, cls }: { icon: React.ReactNode; label: string; value: string; sub?: string; cls?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">{icon}{label}</div>
      <div dir="ltr" className={cx('text-xl font-black tabular-nums text-right', cls)}>{value}</div>
      {sub && <div className="text-[10px] font-bold text-slate-400">{sub}</div>}
    </div>
  );
}

