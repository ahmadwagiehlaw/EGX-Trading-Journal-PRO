import ConfirmModal from './ConfirmModal';
import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Lock, 
  Maximize2,
  Minimize2,
  ShieldAlert, 
   
  CheckCircle, 
    
  Target
,
  Trash2
, X, Pencil, Sparkles, Pin, TrendingUp, Zap
} from 'lucide-react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { computePositionMetrics, computeOpenLotsLowestPriceFirst, computeStopAnalytics, formatEGP, type TrailingStopState } from '../utils/calculations';
import TransactionFormModal from './TransactionFormModal';

export default function ActiveTrades({ tradeId }: { tradeId: string; onClose?: () => void }) {


  const { positions, updateTrailingStop, updatePosition, deleteTransaction, coreStats, capitalInvestment, capitalSpeculation, commissionRate } = useTrades();
  const { theme } = useTheme();
  
  const position = positions.find(p => p.id === tradeId);
  const metrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position, commissionRate);
  }, [position, commissionRate]);

  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');
  const [leftTab, setLeftTab] = useState<'advisor' | 'plan' | 'risk' | 'notes'>('advisor');
  const [stockNote, setStockNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);
  const [isEditingAtr, setIsEditingAtr] = useState(false);
  const [atrInput, setAtrInput] = useState('');
  
  const [isEditingRsi, setIsEditingRsi] = useState(false);
  const [fairValueInput, setFairValueInput] = useState('');
  const [isEditingFairValue, setIsEditingFairValue] = useState(false);
  const [analystTargetInput, setAnalystTargetInput] = useState('');
  const [isEditingAnalystTarget, setIsEditingAnalystTarget] = useState(false);
  const [rsiInput, setRsiInput] = useState('');

  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [t1Input, setT1Input] = useState('');
  const [t2Input, setT2Input] = useState('');
  const [t3Input, setT3Input] = useState('');

  const [isEditingSupports, setIsEditingSupports] = useState(false);
  const [s1Input, setS1Input] = useState('');
  const [s2Input, setS2Input] = useState('');
  const [s3Input, setS3Input] = useState('');

  
  
  const [stopError, setStopError] = useState<string | null>(null);
  const [stopNote, setStopNote] = useState<string | null>(null);
  const [coreError, setCoreError] = useState<string | null>(null);
  
  
  const [riskPct, setRiskPct] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem('egx_risk_per_trade_pct') || '');
    return v > 0 ? v : 1;
  });
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [riskInput, setRiskInput] = useState('');

  // Single source of truth for all stop / risk indicators (derived, never stored)
  const analytics = useMemo(() => {
    if (!position || !metrics) return null;
    const capital = position.portfolioType === 'investment' ? capitalInvestment : capitalSpeculation;
    return computeStopAnalytics(position, metrics, { riskPct, capital, commissionRate });
  }, [position, metrics, riskPct, capitalInvestment, capitalSpeculation, commissionRate]);

  
  // Builds a complete trailingStop object (never undefined fields -> safe for Firestore)
  const buildTrailing = (over: Partial<TrailingStopState> = {}): TrailingStopState => {
    const ts = position!.trailingStop;
    return {
      initial: ts?.initial ?? position!.plan?.stop ?? metrics!.currentStop ?? 0,
      current: ts?.current ?? metrics!.currentStop ?? 0,
      highestReached: ts?.highestReached ?? metrics!.avgEntry ?? 0,
      atrAtEntry: ts?.atrAtEntry ?? position!.plan?.atr ?? 0,
      ...(ts?.atrMultiplier ? { atrMultiplier: ts.atrMultiplier } : {}),
      ...over,
    };
  };

  const commitStop = async (newStop: number, over: Partial<TrailingStopState> = {}, extra: any = {}) => {
    await updatePosition(position!.id, {
      trailingStop: buildTrailing({ current: newStop, ...over }),
      currentStopLoss: newStop,
      ...extra,
    } as any);
  };

  // A trailing stop only ratchets UP and must stay below the market price
  const safeRatchet = (calc: number) => {
    const cur = metrics!.currentStop;
    return calc > cur && calc < metrics!.currentPrice ? calc : cur;
  };

  

  const handleApplyStop = async (value: number, label: string) => {
    if (!position || !metrics) return;
    if (value >= metrics.currentPrice) {
      setStopError('لا يمكن تطبيق ' + label + ' (' + value.toFixed(2) + ') لأنه أعلى من سعر السوق الحالي.');
      return;
    }
    if (value <= metrics.currentStop) {
      setStopError('الوقف الحالي (' + metrics.currentStop.toFixed(2) + ') أعلى بالفعل من ' + label + '. الوقف لا ينخفض تلقائياً.');
      return;
    }
    setStopError(null);
    await commitStop(value);
    setStopNote('تم رفع الوقف إلى ' + value.toFixed(2) + ' (' + label + ').');
  };

  const handleSetMultiplier = async (m: number) => {
    if (!position || !metrics || !analytics) return;
    let ns = metrics.currentStop;
    if (analytics.atr > 0) ns = safeRatchet(analytics.peak - m * analytics.atr);
    setStopError(null);
    await commitStop(ns, { atrMultiplier: m });
    setStopNote('مضاعف ATR = ' + m + (ns > metrics.currentStop ? ' — تم رفع الوقف إلى ' + ns.toFixed(2) : ' — الوقف الحالي لم يتغير.'));
  };

  

  const handleSaveRisk = () => {
    const v = parseFloat(riskInput);
    if (!isNaN(v) && v > 0 && v <= 10) {
      setRiskPct(v);
      localStorage.setItem('egx_risk_per_trade_pct', String(v));
      setIsEditingRisk(false);
    }
  };

  const handleUpdateMarketPrice = async () => {
    if (!metrics || !position) return;
    const p = parseFloat(marketPriceInput);
    if (isNaN(p) || p <= 0) return;
    const data: any = { currentMarketPrice: p };
    // Auto-trail: a new peak raises the stop (Chandelier) — never lowers it
    if (metrics.isOpen) {
      const peak = position.trailingStop?.highestReached || metrics.avgEntry;
      if (p > peak) {
        const atr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
        const mult = position.trailingStop?.atrMultiplier || 2;
        const calc = atr > 0 ? p - mult * atr : p * 0.95;
        const newStop = calc > metrics.currentStop && calc < p ? calc : metrics.currentStop;
        data.trailingStop = buildTrailing({ highestReached: p, current: newStop });
        data.highestPrice = p;
        data.currentStopLoss = newStop;
        if (newStop > metrics.currentStop) {
          setStopNote('قمة جديدة ' + p.toFixed(2) + ' — تم رفع الوقف المتحرك تلقائياً إلى ' + newStop.toFixed(2));
        }
      }
    }
    await updatePosition(position.id, data);
    setIsEditingMarketPrice(false);
  };

  const handleUpdateAtr = async () => {
    if (!metrics || !position) return;
    const newAtr = parseFloat(atrInput);
    if (isNaN(newAtr) || newAtr <= 0) return;
    const highest = position.trailingStop?.highestReached || metrics.avgEntry;
    const mult = position.trailingStop?.atrMultiplier || 2;
    const newStop = safeRatchet(highest - mult * newAtr);
    const updatedData: any = {
      trailingStop: buildTrailing({
        atrAtEntry: newAtr,
        current: newStop,
        initial: position.trailingStop?.initial ?? position.plan?.stop ?? metrics.currentStop,
      }),
    };
    if (position.plan) updatedData.plan = { ...position.plan, atr: newAtr };
    await updatePosition(position.id, updatedData);
    setIsEditingAtr(false);
  };

  const handleUpdateFairValue = async () => {
    if (!position) return;
    const val = parseFloat(fairValueInput);
    await updatePosition(position.id, { plan: { ...position.plan, fairValue: isNaN(val) ? undefined : val } } as any);
    setIsEditingFairValue(false);
  };

  const handleUpdateAnalystTarget = async () => {
    if (!position) return;
    const val = parseFloat(analystTargetInput);
    await updatePosition(position.id, { plan: { ...position.plan, analystTarget: isNaN(val) ? undefined : val } } as any);
    setIsEditingAnalystTarget(false);
  };

  const handleUpdateRsi = async () => {
    if (!position) return;
    const newRsi = parseFloat(rsiInput);
    if (!isNaN(newRsi)) {
      await updatePosition(position.id, { plan: { ...position.plan, rsi: newRsi } } as any);
    }
    setIsEditingRsi(false);
  };

  const handleUpdateTargets = async () => {
    if (!position) return;
    const t1 = parseFloat(t1Input) || position.plan?.target || 0;
    const t2 = parseFloat(t2Input) || position.plan?.targets?.[0] || 0;
    const t3 = parseFloat(t3Input) || position.plan?.targets?.[1] || 0;
    await updatePosition(position.id, { plan: { ...position.plan, target: t1, targets: [t2, t3] } } as any);
    setIsEditingTargets(false);
  };

  const handleUpdateNote = async () => {
    if (!position) return;
    await updatePosition(position.id, { plan: { ...position.plan, makerPlan: stockNote } } as any);
    setIsEditingNote(false);
  };

  const handleAutoCalculate = async () => {
    if (!position || !metrics) return;
    const currentAtr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
    if (currentAtr <= 0) {
      alert("الرجاء إدخال قيمة ATR صحيحة أولاً!");
      return;
    }
    const currentPrice = metrics.currentPrice;
    const avgEntry = metrics.avgEntry || currentPrice;
    
    // Calculate Supports
    const s1 = currentPrice - (currentAtr * 1);
    const s2 = currentPrice - (currentAtr * 2);
    const s3 = currentPrice - (currentAtr * 3);
    
    // Calculate Targets
    const t1 = avgEntry + (currentAtr * 1.5);
    const t2 = avgEntry + (currentAtr * 3);
    const t3 = avgEntry + (currentAtr * 5);
    
    await updatePosition(position.id, {
      plan: {
        ...position.plan,
        target: Number(t1.toFixed(2)),
        targets: [Number(t2.toFixed(2)), Number(t3.toFixed(2))],
        supports: [Number(s1.toFixed(2)), Number(s2.toFixed(2)), Number(s3.toFixed(2))]
      }
    } as any);
  };

  const handleUpdateSupports = async () => {
    if (!position) return;
    const s1 = parseFloat(s1Input) || position.plan?.supports?.[0] || 0;
    const s2 = parseFloat(s2Input) || position.plan?.supports?.[1] || 0;
    const s3 = parseFloat(s3Input) || position.plan?.supports?.[2] || 0;
    await updatePosition(position.id, { plan: { ...position.plan, supports: [s1, s2, s3] } } as any);
    setIsEditingSupports(false);
  };

  useEffect(() => {
    if (position) {
      if (!isEditingNote) setStockNote(position.plan?.makerPlan || '');
      if (isEditingAtr) setAtrInput((position.trailingStop?.atrAtEntry || position.plan?.atr || 0).toString());
      if (isEditingRsi) setRsiInput((position.plan?.rsi || 0).toString());
      if (!isEditingFairValue) setFairValueInput((position.plan?.fairValue || '').toString());
      if (!isEditingAnalystTarget) setAnalystTargetInput((position.plan?.analystTarget || '').toString());
      if (isEditingTargets) {
        setT1Input((position.plan?.target || 0).toString());
        setT2Input((position.plan?.targets?.[0] || 0).toString());
        setT3Input((position.plan?.targets?.[1] || 0).toString());
      }
      if (isEditingSupports) {
        setS1Input((position.plan?.supports?.[0] || 0).toString());
        setS2Input((position.plan?.supports?.[1] || 0).toString());
        setS3Input((position.plan?.supports?.[2] || 0).toString());
      }
    }
  }, [isEditingAtr, isEditingRsi, isEditingTargets, isEditingSupports, position]);





  
  
  
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  
  useEffect(() => {
    if (!isEditingCoreShares && position) {
      setCoreSharesInput(position.coreShares?.toString() || '');
    }
  }, [position?.coreShares, isEditingCoreShares, position]);

  const handleSaveCoreShares = async () => {
    if (!position || !metrics) return;
    const val = parseInt(coreSharesInput);
    if (isNaN(val) || val < 0 || val > metrics.openShares) {
      setCoreError('يجب أن تكون كمية الكور رقماً صحيحاً بين 0 والكمية المفتوحة (' + metrics.openShares + ')');
      return;
    }
    setCoreError(null);
    await updatePosition(position.id, { coreShares: val });
    setIsEditingCoreShares(false);
  };

  const generateInsights = () => {
    if (!position || !metrics) return [];
    const insights = [];
    const pnlPercent = metrics.avgEntry > 0 ? (metrics.unrealizedPnL / (metrics.avgEntry * metrics.openShares)) * 100 : 0;

    if (analytics) {
      const R = analytics.rMultiple;
      if (analytics.status === 'broken') {
        insights.push({ type: 'warning', text: 'الوقف مكسور: السعر (' + metrics.currentPrice.toFixed(2) + ') عند أو تحت الوقف (' + metrics.currentStop.toFixed(2) + '). نفّذ الخروج وفق خطتك أو راجع الوقف بوعي — لا تترك القرار للأمل.', action: 'خروج' });
      }
      if (analytics.planIssue) {
        insights.push({ type: 'warning', text: analytics.planIssue });
      }
      if (analytics.status === 'raise' && R !== null) {
        insights.push({ type: 'info', text: 'حققت ' + R.toFixed(2) + 'R والوقف ما زال تحت الدخول: ارفع الوقف إلى نقطة التعادل (' + analytics.breakevenStop.toFixed(2) + ') لتصبح الصفقة بلا مخاطرة على رأس المال.' });
      }
      if (R !== null && R >= 2) {
        insights.push({ type: 'success', text: 'وصلت إلى ' + R.toFixed(2) + 'R — قاعدة شائعة: بِع ثلث الكمية (من الدفعات الأرخص أولاً) واترك الباقي بوقف متحرك.', action: 'بيع جزئي' });
      }
      if (analytics.rr !== null && analytics.rr < 1.5 && R !== null && R > 0) {
        insights.push({ type: 'info', text: 'نسبة الربح/المخاطرة المتبقية ' + analytics.rr.toFixed(2) + ' (أقل من 1.5): العائد المتبقي لا يبرر المخاطرة — فكّر في جني جزء الآن.', action: 'بيع جزئي' });
      }
      if (analytics.isOversized && analytics.maxSharesByRisk !== null) {
        insights.push({ type: 'warning', text: 'حجم المركز (' + metrics.openShares.toLocaleString() + ' سهم) أكبر من الحد المسموح بمخاطرة ' + riskPct + '% من رأس المال (' + analytics.maxSharesByRisk.toLocaleString() + ' سهم). قلّل الحجم أو ارفع الوقف.' });
      }
      if (analytics.drawdownFromPeak > 8 && metrics.unrealizedPnL > 0) {
        insights.push({ type: 'info', text: 'السعر تراجع ' + analytics.drawdownFromPeak.toFixed(1) + '% من القمة (' + analytics.peak.toFixed(2) + ') — الوقف المتحرك هو حمايتك، تأكد أنه مضبوط.' });
      }
      const tsd = position.plan?.timeStopDays;
      if (tsd && analytics.daysHeld !== null && analytics.daysHeld > tsd) {
        insights.push({ type: 'warning', text: 'تجاوزت مدة الاحتفاظ المخططة (' + tsd + ' يوم) — الآن ' + analytics.daysHeld + ' يوم. قيّم تكلفة الفرصة البديلة.' });
      }
    }

    
    if (pnlPercent > 15) {
      insights.push({ type: 'success', text: `أنت محقق ربح ممتاز بحوالي ${pnlPercent.toFixed(1)}% في هذا التمركز. يوصى بجني جزء من الأرباح (بيع جزئي) لتأمين المكسب.`, action: 'بيع جزئي' });
    } else if (pnlPercent < -8) {
      insights.push({ type: 'warning', text: `التمركز خاسر بنسبة ${Math.abs(pnlPercent).toFixed(1)}%. راقب وقف الخسارة بصرامة ولا تترك الخسارة تتفاقم.` });
    }

    const riskPercent = metrics.avgEntry > 0 ? ((metrics.avgEntry - metrics.currentStop) / metrics.avgEntry) * 100 : 0;
    if (pnlPercent > 5 && riskPercent > 0) {
      insights.push({ type: 'info', text: 'السعر ارتفع بشكل جيد لكن وقف الخسارة لا يزال تحت سعر الدخول. يوصى برفع وقف الخسارة (Trailing Stop) لنقطة الدخول أو أعلى لحماية رأس المال.' });
    }

    if (position.portfolioType === 'investment') {
      const coreAmount = position.coreShares ? position.coreShares * (position.currentMarketPrice || 0) : 0;
      const totalCap = coreStats?.totalInvestmentCapital || 1;
      const coreWeight = (coreAmount / totalCap) * 100;
      
      if (coreAmount === 0 && position.plan?.strategy === 'core') {
         insights.push({ type: 'info', text: 'هذا السهم مصنف كـ (Core) لكنك لم تحدد كمية الكور المحتفظ بها. قم بتحديد أسهم الكور لحمايتها من البيع العاطفي.' });
      } else if (coreWeight > 30) {
         insights.push({ type: 'warning', text: `وزن هذا السهم الأساسي يشكل ${coreWeight.toFixed(1)}% من إجمالي محفظة الاستثمار. هذا تركز عالي وقد يزيد المخاطرة، فكر في إعادة التوازن.` });
      }
    }

    if (position.portfolioType === 'speculation' && position.journal?.openedDate) {
      const daysHeld = (Date.now() - position.journal.openedDate) / (1000 * 60 * 60 * 24);
      if (daysHeld > 14 && pnlPercent < 2) {
        insights.push({ type: 'warning', text: `هذا التمركز المضاربي مستمر منذ ${Math.floor(daysHeld)} يوم بدون ربح يذكر. انتبه لتكلفة الفرصة البديلة (Cash Drag).` });
      }
    }

    if (insights.length === 0) {
      insights.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    return insights;
  };
  const insights = generateInsights();

if (!position || !metrics) return null;

  const currentHighest = position!.trailingStop?.highestReached || metrics!.avgEntry;
  const currentStop = metrics!.currentStop;
  

  const handleUpdateTrailingStop = async (): Promise<boolean> => {
    if (!metrics) return false;
    const highest = parseFloat(newHighestPrice);
    
    if (isNaN(highest) || highest <= currentHighest) {
      setError(`يجب إدخال سعر أعلى من أعلى سعر مسجل سابقاً (${currentHighest.toFixed(2)} EGP).`);
      return false;
    }

    const atrVal = position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0;
    const calculatedNewStop = atrVal > 0 ? highest - ((position!.trailingStop?.atrMultiplier || 2) * atrVal) : highest * 0.95;
    const finalStop = Math.max(calculatedNewStop, currentStop);

    setError(null);
    await updateTrailingStop(position!.id, highest, finalStop);
    setNewHighestPrice('');
    setIsEditingHighestPrice(false);
    return true;
  };


  // --- Plan gauge layout: scale always covers ALL markers; clustered labels are stacked ---
  const gaugeStop = position!.plan?.stop || 0;
  const gaugeTarget = position!.plan?.target || 0;
  const gaugeValid = gaugeStop > 0 && gaugeTarget > 0;
  const gaugeVals = [gaugeStop, gaugeTarget, metrics!.avgEntry, currentStop, metrics!.currentPrice].filter(v => v > 0);
  const gLo = Math.min(...gaugeVals);
  const gHi = Math.max(...gaugeVals);
  const gPad = (gHi - gLo) * 0.04 || 1;
  const gPct = (v: number) => Math.max(0, Math.min(100, ((v - (gLo - gPad)) / ((gHi + gPad) - (gLo - gPad))) * 100));
  type GaugeItem = { key: string; label: string; value: number; pct: number; level: number; dot: string; text: string };
  const stackItems = (items: Omit<GaugeItem, 'pct' | 'level'>[]): GaugeItem[] => {
    const list: GaugeItem[] = items.map(i => ({ ...i, pct: gPct(i.value), level: 0 })).sort((a, b) => a.pct - b.pct);
    let prev = -100;
    let lvl = 0;
    list.forEach(i => {
      if (i.pct - prev < 18) lvl = Math.min(lvl + 1, 2); else lvl = 0;
      i.level = lvl;
      prev = i.pct;
    });
    return list;
  };
  const gaugeTop = stackItems([
    { key: 'stop', label: 'الوقف', value: gaugeStop, dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
    { key: 'target', label: 'الهدف', value: gaugeTarget, dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'entry', label: 'الدخول', value: metrics!.avgEntry, dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  ]);
  const trailDistinct = currentStop > 0 && Math.abs(currentStop - gaugeStop) > 0.005;
  const gaugeBottom = stackItems([
    ...(trailDistinct ? [{ key: 'trail', label: 'وقف متحرك', value: currentStop, dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' }] : []),
    { key: 'price', label: 'السوق', value: metrics!.currentPrice, dot: 'bg-slate-800 dark:bg-white', text: 'text-slate-600 dark:text-slate-300' },
  ]);
  const gauge = {
    valid: gaugeValid,
    top: gaugeTop,
    bottom: gaugeBottom,
    mt: 32 + Math.max(0, ...gaugeTop.map(i => i.level)) * 36,
    mb: 16 + Math.max(0, ...gaugeBottom.map(i => i.level)) * 36,
  };

  return (
    <div className="w-full space-y-6" dir="rtl">
      <div className={isChartExpanded ? "flex flex-col" : "grid lg:grid-cols-2 gap-6 items-stretch"}>
        
        {/* Right Column: Live TradingView Chart OR Ledger */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${isChartExpanded ? 'h-[80vh]' : 'min-h-[520px]'}`}>
          
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button 
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2"
              title={isChartExpanded ? "تصغير" : "تكبير"}
            >
              {isChartExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setRightPaneView(rightPaneView === 'ledger' ? 'chart' : 'ledger')}
              className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 transition-all flex items-center gap-2 font-black text-xs"
            >
              {rightPaneView === 'ledger' ? 'الشارت الفني' : 'سجل صفقات السهم'}
            </button>
          </div>

          {rightPaneView === 'ledger' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 mt-14">
               

               
             <div className="flex flex-wrap gap-2 mb-8">
                 <button onClick={() => setTxModalType('buy')} className="flex-1 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl font-black text-xs border border-blue-200 dark:border-blue-800">+ تمركز إضافي</button>
                 <button onClick={() => setTxModalType('sell')} className="flex-1 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl font-black text-xs border border-emerald-200 dark:border-emerald-800">↙ بيع جزئي</button>
                 <button className="flex-1 py-2 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl font-black text-xs border border-amber-200 dark:border-amber-800 opacity-50 cursor-not-allowed">توزيع نقدي</button>
                 <button className="flex-1 py-2 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-xl font-black text-xs border border-purple-200 dark:border-purple-800 opacity-50 cursor-not-allowed">تجزئة/مجاني</button>
               </div>

             {/* Open Lots (Lowest Price First / FIFO) Table */}
             <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <Target className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">الدفعات المفتوحة (Open Lots)</h3>
                 </div>
                 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800/50">
                   قاعدة: الأقل سعراً أولاً (Lowest-Price First)
                 </span>
               </div>
               
               <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">تاريخ الشراء</th>
                       <th className="py-3 px-2">سعر الشراء</th>
                       <th className="py-3 px-2">الكمية المتبقية</th>
                       <th className="py-3 px-2">الربح/الخسارة</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراء</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {computeOpenLotsLowestPriceFirst(position!.transactions).map(lot => {
                       const lotValue = lot.remainingShares * metrics!.currentPrice;
                       const lotCost = lot.remainingShares * lot.price;
                       const lotPnL = lotValue - lotCost;
                       const lotPnLPercent = lotCost > 0 ? (lotPnL / lotCost) * 100 : 0;
                       const isWinning = lotPnL > 0;
                       
                       return (
                         <tr key={lot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300">
                           <td className="py-3 px-2">{new Date(lot.date).toLocaleDateString('en-GB')}</td>
                           <td className="py-3 px-2 text-blue-600 dark:text-blue-400">{lot.price.toFixed(2)}</td>
                           <td className="py-3 px-2">{lot.remainingShares.toLocaleString()} سهم</td>
                           <td className={`py-3 px-2 ${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                             {lotPnL > 0 ? '+' : ''}{lotPnL.toFixed(2)} ({lotPnLPercent.toFixed(1)}%)
                           </td>
                           <td className="py-3 px-2">
                             <button 
                               onClick={() => setTxModalType('sell')}
                               className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                             >
                               جني ربح
                             </button>
                           </td>
                         </tr>
                       );
                     })}
                     {computeOpenLotsLowestPriceFirst(position!.transactions).length === 0 && (
                       <tr>
                         <td colSpan={5} className="py-8 text-slate-400 text-xs font-bold">لا توجد دفعات مفتوحة حالياً.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
             
             <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-slate-400" />
                سجل الحركات الكامل
             </h3>

               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-center">
                   <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                     <tr>
                       <th className="py-3 px-2 rounded-r-xl">العملية</th>
                       <th className="py-3 px-2">التاريخ</th>
                       <th className="py-3 px-2">الكمية</th>
                       <th className="py-3 px-2">السعر</th>
                       <th className="py-3 px-2">الإجمالي</th>
                       <th className="py-3 px-2">الربح المحقق</th>
                       <th className="py-3 px-2 rounded-l-xl">إجراءات</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {[...position!.transactions].sort((a,b)=>b.date - a.date).map(tx => (
                       <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors font-mono-num">
                         <td className="py-4 px-2">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${tx.type === 'buy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                             {tx.type === 'buy' ? 'شراء' : 'بيع (جني ربح)'}
                           </span>
                         </td>
                         <td className="py-4 px-2 font-bold text-slate-600 dark:text-slate-300 text-xs">
                           {new Date(tx.date).toLocaleDateString('en-GB')}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.shares.toLocaleString()}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.price.toFixed(2)}
                         </td>
                         <td className="py-4 px-2 font-black text-slate-800 dark:text-white">
                           {tx.amount.toFixed(2)}
                         </td>
                         <td className="py-4 px-2">
                           {tx.type === 'sell' && tx.id ? (
                             <span className={`font-black ${(metrics!.txPnL?.[tx.id] || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                               {(metrics!.txPnL?.[tx.id] || 0) >= 0 ? '+' : ''}{(metrics!.txPnL?.[tx.id] || 0).toFixed(2)}
                             </span>
                           ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                         </td>
                         <td className="py-4 px-2 flex justify-center gap-1">
                            <button 
                              onClick={() => { setTxModalType('edit'); setEditingTx(tx); }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                              title="تعديل المعاملة"
                            >
                              <Pencil className="w-4 h-4"/>
                            </button>
                            <button 
                              onClick={() => setConfirmTxId(tx.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف المعاملة"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            <AdvancedRealTimeChart 
              symbol={`EGX:${position!.symbol}`}
              interval="D"
              theme={theme === 'dark' ? 'dark' : 'light'}
              locale="ar_AE"
              autosize
              allow_symbol_change={false}
              hide_side_toolbar={false}
              details={true}
              save_image={true}
              timezone="Africa/Cairo"
            />
          )}
        </div>

        {/* Left Column: Trailing Stop Engine & Ledger Control */}
        <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 flex-col justify-between shadow-sm ${isChartExpanded ? 'hidden' : 'flex'}`}>

          <div>
            {/* Header / Ticker Summary */}
            <div className="mb-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                    metrics!.isOpen 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)} EGP</span>
                </p>
                </div>
              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics!.openShares.toLocaleString()} سهم</p>
              </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
                  {/* Market Price Pill */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingMarketPrice(!isEditingMarketPrice); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="تعديل سعر السوق يدوياً"
                    >
                      سعر السوق:
                    </button>
                    {isEditingMarketPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={marketPriceInput}
                          onChange={(e) => setMarketPriceInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-slate-900 dark:text-white"
                          dir="ltr"
                          autoFocus
                          placeholder={metrics!.currentPrice.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateMarketPrice}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-mono-num"
                        onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل السعر"
                      >
                        {metrics!.currentPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Highest Price Pill (Trailing Stop) */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingHighestPrice(!isEditingHighestPrice); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                      title="تحديث أعلى سعر لتفعيل الوقف المتحرك"
                    >
                      <Lock className="w-3 h-3" />
                      أقصى سعر:
                    </button>
                    {isEditingHighestPrice ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={newHighestPrice}
                          onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-blue-900 dark:text-blue-100"
                          dir="ltr"
                          autoFocus
                          placeholder={currentHighest.toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateTrailingStop}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-blue-800 dark:text-blue-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); }}
                        dir="ltr"
                        title="انقر لتعديل أقصى سعر"
                      >
                        {currentHighest.toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* ATR Pill */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingAtr(!isEditingAtr); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة ATR لحساب الوقف الميكانيكي"
                    >
                      ATR:
                    </button>
                    {isEditingAtr ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={atrInput}
                          onChange={(e) => setAtrInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-purple-900 dark:text-purple-100"
                          dir="ltr"
                          autoFocus
                          placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                        />
                        <button 
                          onClick={handleUpdateAtr}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-purple-800 dark:text-purple-200 cursor-pointer hover:text-purple-600 dark:hover:text-purple-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); }}
                        dir="ltr"
                        title="انقر لتعديل ATR"
                      >
                        {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                      </div>
                    )}
                  </div>
                  )}

                  {/* RSI Pill */}
                  {metrics!.isOpen && (
                  <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      onClick={() => { setIsEditingRsi(!isEditingRsi); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                      className="px-2 py-1.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
                      title="تعديل قيمة RSI"
                    >
                      RSI:
                    </button>
                    {isEditingRsi ? (
                      <div className="flex items-center">
                        <input 
                          type="number" step="any"
                          value={rsiInput}
                          onChange={(e) => setRsiInput(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-indigo-900 dark:text-indigo-100"
                          dir="ltr"
                          autoFocus
                          placeholder={((position!.plan?.rsi || 0)).toFixed(1)}
                        />
                        <button 
                          onClick={handleUpdateRsi}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1.5 text-[10px] font-bold transition-colors"
                        >حفظ</button>
                      </div>
                    ) : (
                      <div 
                        className="px-3 py-1.5 text-xs font-black text-indigo-800 dark:text-indigo-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors font-mono-num"
                        onClick={() => { setIsEditingRsi(true); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
                        dir="ltr"
                        title="انقر لتعديل RSI"
                      >
                        {((position!.plan?.rsi || 0)).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  )}

                  {/* Fair Value Pill */}
                  <div className="flex items-center bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden shadow-sm">
                    <button onClick={() => { setIsEditingFairValue(!isEditingFairValue); setIsEditingAnalystTarget(false); setIsEditingMarketPrice(false); }} className="px-2 py-1.5 text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors">السعر العادل:</button>
                    {isEditingFairValue ? (
                      <div className="flex items-center"><input type="number" step="any" value={fairValueInput} onChange={e => setFairValueInput(e.target.value)} className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-teal-900 dark:text-teal-100" dir="ltr" autoFocus placeholder="-" /><button onClick={handleUpdateFairValue} className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-1.5 text-[10px] font-bold">حفظ</button></div>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-black text-teal-800 dark:text-teal-200 cursor-pointer hover:text-teal-600 transition-colors font-mono-num" onClick={() => setIsEditingFairValue(true)} dir="ltr">{position!.plan?.fairValue ? position!.plan.fairValue.toFixed(2) : '-'}</div>
                    )}
                  </div>

                  {/* Analyst Target Pill */}
                  <div className="flex items-center bg-fuchsia-50 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-800 rounded-lg overflow-hidden shadow-sm">
                    <button onClick={() => { setIsEditingAnalystTarget(!isEditingAnalystTarget); setIsEditingFairValue(false); setIsEditingMarketPrice(false); }} className="px-2 py-1.5 text-[10px] font-bold text-fuchsia-700 dark:text-fuchsia-400 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors">مستهدف المحللين:</button>
                    {isEditingAnalystTarget ? (
                      <div className="flex items-center"><input type="number" step="any" value={analystTargetInput} onChange={e => setAnalystTargetInput(e.target.value)} className="w-16 bg-white dark:bg-slate-900 text-xs font-black px-2 py-1 outline-none text-center text-fuchsia-900 dark:text-fuchsia-100" dir="ltr" autoFocus placeholder="-" /><button onClick={handleUpdateAnalystTarget} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-2 py-1.5 text-[10px] font-bold">حفظ</button></div>
                    ) : (
                      <div className="px-3 py-1.5 text-xs font-black text-fuchsia-800 dark:text-fuchsia-200 cursor-pointer hover:text-fuchsia-600 transition-colors font-mono-num" onClick={() => setIsEditingAnalystTarget(true)} dir="ltr">{position!.plan?.analystTarget ? position!.plan.analystTarget.toFixed(2) : '-'}</div>
                    )}
                  </div>

                </div>
                {error && isEditingHighestPrice && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded inline-block w-full max-w-sm">
                    {error}
                  </p>
                )}
              </div>



            </div> {/* CLOSE INNER DIV FOR HEADER/PILLS */}

          {/* TABS HEADER */}
          <div className="flex overflow-x-auto items-center gap-4 mt-0 mb-4 border-b border-slate-200 dark:border-slate-800 w-full [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <button onClick={() => setLeftTab('advisor')} className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab === 'advisor' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Sparkles className="w-4 h-4 inline-block ml-1" /> المستشار الذكي
            </button>
                        <button onClick={() => setLeftTab('risk')} className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab === 'risk' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <TrendingUp className="w-4 h-4 inline-block ml-1" /> المخاطرة والأداء
            </button>
<button onClick={() => setLeftTab('plan')} className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab === 'plan' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Target className="w-4 h-4 inline-block ml-1" /> إدارة الصفقة
            </button>
            <button onClick={() => setLeftTab('notes')} className={`pb-3 px-2 md:px-4 font-black text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors ${leftTab === 'notes' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2'}`}>
              <Pencil className="w-4 h-4 inline-block ml-1" /> الملاحظات
            </button>
          </div>

          {/* ADVISOR TAB */}
          {leftTab === 'advisor' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {insights.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="font-bold text-slate-500 text-sm">لا توجد توصيات حالياً من المستشار الذكي.</p>
                </div>
              )}
             {/* Smart Insights Panel (AI Advisor) */}
             {insights.length > 0 && (
               <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 mb-2 shadow-sm">
                 <div className="flex items-center gap-2 mb-3">
                   <Sparkles className="w-5 h-5 text-indigo-500" />
                   <h3 className="font-black text-indigo-900 dark:text-indigo-300 text-sm">المستشار الذكي (AI) والتوصيات</h3>
                 </div>
                 <div className="grid gap-2">
                   {insights.map((insight, idx) => (
                     <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${
                       insight.type === 'warning' ? 'bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                       insight.type === 'success' ? 'bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                       'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                     }`}>
                       <div className="flex-1 text-xs font-bold leading-relaxed">{insight.text}</div>
                       {insight.action && (
                         <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:scale-105 transition-transform flex-shrink-0">
                           {insight.action}
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}


              {/* Targets and Supports */}
                          <div className="flex justify-between items-center mb-3 mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                <h3 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  المستهدفات والدعوم
                </h3>
                <button onClick={handleAutoCalculate} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black transition-colors border border-indigo-200 dark:border-indigo-800 shadow-sm" title="حساب ديناميكي بناءً على ATR وسعر الدخول">
                  <Zap className="w-3.5 h-3.5" /> حساب تلقائي ⚡
                </button>
              </div>
<div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-100 dark:border-emerald-800/50 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Target className="w-4 h-4" />
                    المستهدفات (Targets)
                  </div>
                  {isEditingTargets ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleUpdateTargets} className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">حفظ</button>
                      <button onClick={() => setIsEditingTargets(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingTargets(true)} className="text-[10px] font-bold text-emerald-600 hover:underline">تعديل</button>
                  )}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`t${i}`} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">T{i}</span>
                      {isEditingTargets ? (
                        <input
                          type="number" step="any"
                          value={i === 1 ? t1Input : i === 2 ? t2Input : t3Input}
                          onChange={(e) => i === 1 ? setT1Input(e.target.value) : i === 2 ? setT2Input(e.target.value) : setT3Input(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5"
                          dir="ltr"
                        />
                      ) : (
                        <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono-num">
                          {(i === 1 ? position!.plan?.target : i === 2 ? position!.plan?.targets?.[0] : position!.plan?.targets?.[1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-3 border-b border-blue-100 dark:border-blue-800/50 pb-2">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <ArrowDownToLine className="w-4 h-4" />
                    الدعوم (Supports)
                  </div>
                  {isEditingSupports ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleUpdateSupports} className="text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">حفظ</button>
                      <button onClick={() => setIsEditingSupports(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingSupports(true)} className="text-[10px] font-bold text-blue-600 hover:underline">تعديل</button>
                  )}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={`s${i}`} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">S{i}</span>
                      {isEditingSupports ? (
                        <input
                          type="number" step="any"
                          value={i === 1 ? s1Input : i === 2 ? s2Input : s3Input}
                          onChange={(e) => i === 1 ? setS1Input(e.target.value) : i === 2 ? setS2Input(e.target.value) : setS3Input(e.target.value)}
                          className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5"
                          dir="ltr"
                        />
                      ) : (
                        <span className="font-black text-blue-700 dark:text-blue-300 font-mono-num">
                          {(position!.plan?.supports?.[i-1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            
            </div>
          )}

                    {/* RISK TAB */}
          {leftTab === 'risk' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">مؤشرات المخاطرة والأداء المالي</h3>
                </div>
{/* Decision indicators strip */}
            {analytics && metrics!.isOpen && (() => {
              const R = analytics.rMultiple;
              const tone = {
                good: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
                bad: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300',
                warn: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
                neutral: 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200',
              } as const;
              const cards: { label: string; value: string; tone: keyof typeof tone; hint: string }[] = [
                { label: 'R الحالي', value: R === null ? '—' : (R >= 0 ? '+' : '') + R.toFixed(2) + 'R', tone: R === null ? 'neutral' : R >= 1 ? 'good' : R < 0 ? 'bad' : 'neutral', hint: '(السوق − الدخول) ÷ مخاطرة الخطة' },
                { label: 'ربح/مخاطرة (RR)', value: analytics.rr === null ? '—' : analytics.rr.toFixed(2), tone: analytics.rr === null ? 'neutral' : analytics.rr >= 2 ? 'good' : analytics.rr < 1.5 ? 'warn' : 'neutral', hint: '(الهدف − السوق) ÷ (السوق − الوقف)' },
                analytics.lockedProfit > 0
                  ? { label: 'ربح مؤمَّن 🔒', value: '+' + formatEGP(analytics.lockedProfit), tone: 'good', hint: 'الوقف أعلى من متوسط الدخول' }
                  : { label: 'مخاطرة رأس المال', value: analytics.capitalAtRisk > 0 ? formatEGP(analytics.capitalAtRisk) + ' (' + analytics.capitalAtRiskPct.toFixed(1) + '%)' : (metrics!.currentStop > 0 ? '🔒 صفر' : '—'), tone: analytics.capitalAtRisk > analytics.riskAmountAllowed && analytics.riskAmountAllowed > 0 ? 'bad' : 'neutral', hint: 'الخسارة لو ضُرب الوقف مقابل الدخول' },
                { label: 'مسافة الوقف', value: analytics.stopDistanceAtr !== null ? analytics.stopDistanceAtr.toFixed(1) + ' ATR' : analytics.stopDistancePct.toFixed(1) + '%', tone: analytics.stopDistanceAtr !== null && analytics.stopDistanceAtr < 1 ? 'warn' : 'neutral', hint: analytics.stopDistancePct.toFixed(1) + '% تحت السعر' },
                { label: 'تراجع من القمة', value: analytics.drawdownFromPeak.toFixed(1) + '%', tone: analytics.drawdownFromPeak > 8 ? 'warn' : 'neutral', hint: 'القمة ' + analytics.peak.toFixed(2) },
                { label: 'أيام الاحتفاظ', value: analytics.daysHeld === null ? '—' : String(analytics.daysHeld), tone: position!.plan?.timeStopDays && analytics.daysHeld !== null && analytics.daysHeld > position!.plan.timeStopDays ? 'warn' : 'neutral', hint: position!.plan?.timeStopDays ? 'المخطط ' + position!.plan.timeStopDays + ' يوم' : 'منذ أول شراء' },
                { label: 'الحد الأقصى للحجم', value: analytics.maxSharesByRisk === null ? '—' : analytics.maxSharesByRisk.toLocaleString() + ' سهم', tone: analytics.isOversized ? 'bad' : 'neutral', hint: 'مخاطرة ' + riskPct + '% من رأس المال' },
                { label: 'وزن المحفظة', value: analytics.weightPct === null ? '—' : analytics.weightPct.toFixed(1) + '%', tone: analytics.weightPct !== null && analytics.weightPct > 25 ? 'warn' : 'neutral', hint: 'قيمة المركز ÷ رأس المال' },
              ];
              return (
                <div className="mt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {cards.map(c => (
                      <div key={c.label} className={`rounded-xl border px-3 py-2 text-center ${tone[c.tone]}`} title={c.hint}>
                        <div className="text-[10px] font-bold opacity-70">{c.label}</div>
                        <div className="text-sm font-black font-mono-num mt-0.5" dir="ltr">{c.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-2 px-1">
                    <span>المخاطرة المسموحة لكل صفقة: {riskPct}% ≈ {formatEGP(analytics.riskAmountAllowed)}</span>
                    {isEditingRisk ? (
                      <span className="flex items-center gap-1">
                        <input type="number" step="0.1" value={riskInput} onChange={e => setRiskInput(e.target.value)} className="w-14 text-center px-1 py-0.5 rounded border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-black" dir="ltr" autoFocus />
                        <button onClick={handleSaveRisk} className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold">حفظ</button>
                        <button onClick={() => setIsEditingRisk(false)} className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">إلغاء</button>
                      </span>
                    ) : (
                      <button onClick={() => { setRiskInput(String(riskPct)); setIsEditingRisk(true); }} className="underline text-blue-600 dark:text-blue-400">تعديل النسبة</button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Plan vs Reality Visual Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-10 rounded-3xl border border-slate-200 dark:border-slate-700/60 mb-2 relative mt-6 shadow-inner">
              <div className={`absolute -top-4 left-4 z-10 px-3 py-1.5 rounded-xl text-sm font-black flex items-center gap-1.5 border shadow-sm ${
                metrics!.realizedPnL > 0 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-300' 
                  : metrics!.realizedPnL < 0 
                    ? 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/60 dark:border-rose-700 dark:text-rose-300' 
                    : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}>
                صافي الأرباح المحققة: {metrics!.realizedPnL > 0 ? '+' : ''}{metrics!.realizedPnL.toFixed(2)} EGP
              </div>
              
              <div className="relative h-16 w-full flex items-center" style={{ marginTop: gauge.mt, marginBottom: gauge.mb }}>
                {/* Track */}
                <div className="absolute w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full shadow-inner overflow-hidden">
                  {position!.plan?.target && position!.plan?.stop ? (
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-400 to-rose-500 opacity-90"
                      style={{ width: '100%' }}
                    />
                  ) : null}
                </div>

                {/* Markers */}
                {gauge.valid ? (
                  <>
                    {gauge.top.map(m => (
                      <div key={m.key} className="absolute flex flex-col items-center" style={{ right: `${m.pct}%`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '14px' }}>
                        <div className="flex flex-col items-center" style={{ transform: `translateY(-${m.level * 36}px)` }}>
                          <span className={`text-[10px] font-black flex items-center gap-1 ${m.text}`}>
                            {m.key === 'stop' && <ShieldAlert className="w-3 h-3" />}
                            {m.key === 'target' && <Target className="w-3 h-3" />}
                            {m.label}
                          </span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{m.value.toFixed(2)}</span>
                        </div>
                        <div className={`w-0.5 absolute ${m.dot}`} style={{ height: 16 + m.level * 36, bottom: -16 }}></div>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 absolute -bottom-5 ${m.dot}`}></div>
                      </div>
                    ))}
                    {gauge.bottom.map(m => (
                      <div key={m.key} className="absolute flex flex-col items-center" style={{ right: `${m.pct}%`, transform: 'translateX(50%)', top: '100%', marginTop: '14px' }}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 absolute -top-5 ${m.dot}`}></div>
                        <div className={`w-0.5 absolute ${m.dot}`} style={{ height: 16 + m.level * 36, top: -16 }}></div>
                        <div className="flex flex-col items-center" style={{ transform: `translateY(${m.level * 36}px)` }}>
                          <span className={`text-[10px] font-black ${m.text}`}>{m.label}</span>
                          <span className="text-sm font-mono-num font-black text-slate-800 dark:text-slate-200">{m.value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center w-full text-[10px] text-slate-500 font-bold mt-8">الخطة غير مكتملة (يرجى إضافة هدف ووقف)</div>
                )}

              </div>
            </div>

          
              </div>
            
            </div>
          )}

{/* NOTES TAB */}
          {leftTab === 'notes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-yellow-900 dark:text-yellow-500 text-sm flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    ملاحظات حول السهم
                  </h3>
                  {isEditingNote ? (
                    <div className="flex items-center gap-2">
                      <button onClick={handleUpdateNote} className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-black hover:bg-yellow-700 transition-colors shadow-sm">حفظ</button>
                      <button onClick={() => { setIsEditingNote(false); setStockNote(position!.plan?.makerPlan || ''); }} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingNote(true)} className="px-3 py-1.5 bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 rounded-lg text-xs font-black transition-colors shadow-sm">تعديل الملاحظات</button>
                  )}
                </div>
                
                {isEditingNote ? (
                  <textarea
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="اكتب أفكارك وملاحظاتك الفنية أو الأخبار الخاصة بهذا السهم هنا..."
                    className="w-full bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 text-sm font-bold text-slate-700 dark:text-slate-300 min-h-[200px] focus:ring-2 focus:ring-yellow-500 outline-none leading-relaxed resize-none"
                  />
                ) : (
                  <div className="bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-800 rounded-xl p-4 min-h-[200px]">
                    {stockNote ? (
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{stockNote}</p>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 pt-10">
                        <Pin className="w-8 h-8 mb-3" />
                        <p className="text-xs font-bold">لا توجد ملاحظات مسجلة.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLAN TAB */}
          {leftTab === 'plan' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* Smart Trailing Stop Tools */}
            {metrics!.isOpen && analytics && (
              <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">الوقف المتحرك الذكي (Chandelier)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">المضاعف × ATR</span>
                    {[1.5, 2, 2.5, 3].map(m => (
                      <button
                        key={m}
                        onClick={() => handleSetMultiplier(m)}
                        className={`text-[11px] font-black px-2 py-1 rounded-lg border transition-colors ${analytics.atrMultiplier === m ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                    <div className="text-[10px] font-bold text-slate-500 mb-0.5">وقف القمة − {analytics.atrMultiplier}×ATR</div>
                    <div className="text-base font-black font-mono-num text-orange-600 dark:text-orange-400" dir="ltr">{analytics.chandelierStop !== null ? analytics.chandelierStop.toFixed(2) : '—'}</div>
                    <button
                      disabled={analytics.chandelierStop === null || analytics.chandelierStop <= metrics!.currentStop || analytics.chandelierStop >= metrics!.currentPrice}
                      onClick={() => analytics.chandelierStop !== null && handleApplyStop(analytics.chandelierStop, 'وقف Chandelier')}
                      className="mt-2 text-[10px] font-black bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg"
                    >
                      تطبيق
                    </button>
                  </div>
                  <div className="bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                    <div className="text-[10px] font-bold text-slate-500 mb-0.5">وقف التعادل (شامل العمولة)</div>
                    <div className="text-base font-black font-mono-num text-emerald-600 dark:text-emerald-400" dir="ltr">{analytics.breakevenStop.toFixed(2)}</div>
                    <button
                      disabled={analytics.breakevenStop <= metrics!.currentStop || analytics.breakevenStop >= metrics!.currentPrice}
                      onClick={() => handleApplyStop(analytics.breakevenStop, 'وقف التعادل')}
                      className="mt-2 text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
                {analytics.atr <= 0 && (
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-2">أدخل قيمة ATR (الشريحة البنفسجية بالأعلى) لتفعيل الوقف الديناميكي.</p>
                )}
                {stopError && <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2 mb-2">{stopError}</p>}
                {stopNote && <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 mb-2">{stopNote}</p>}
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">يرتفع الوقف تلقائياً عند تحديث سعر السوق إلى قمة جديدة، ولا ينخفض أبداً إلا بتعديل يدوي منك.</p>
              </div>
            )}

            {/* Core / Satellite Advanced Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">توزيع التمركز (Core vs Satellite)</span>
                </div>
                {isEditingCoreShares ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-black px-2 py-1 outline-none text-center shadow-inner"
                      value={coreSharesInput}
                      onChange={e => setCoreSharesInput(e.target.value)}
                      autoFocus
                      dir="ltr"
                    />
                    <button onClick={handleSaveCoreShares} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"><CheckCircle className="w-4 h-4"/></button>
                    <button onClick={() => setIsEditingCoreShares(false)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditingCoreShares(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <Pencil className="w-3 h-3" />
                    تعديل الكور
                  </button>
                )}
              </div>
              
              {/* Progress Bar Split */}
              <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden shadow-inner mt-4 mb-2 relative">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-center relative overflow-hidden"
                  style={{ width: `${position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0}%` }}
                  title="أسهم الكور (Core)"
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }}></div>
                </div>
                <div 
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${100 - (position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0)}%` }}
                  title="أسهم الساتلايت (Satellite)"
                />
              </div>
              
              <div className="flex justify-between items-center text-xs font-black">
                <div className="text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  الكور: {position?.coreShares || 0} سهم 
                  <span className="opacity-60">({((position?.coreShares || 0) / metrics!.openShares * 100).toFixed(0)}%)</span>
                </div>
                <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  الساتلايت: {metrics!.openShares - (position?.coreShares || 0)} سهم
                  <span className="opacity-60">({(100 - ((position?.coreShares || 0) / metrics!.openShares * 100)).toFixed(0)}%)</span>
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                </div>
              </div>

              {coreError && <p className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2 mt-3">{coreError}</p>}
              {(() => {
                if (!analytics) return null;
                const strat = position!.plan?.strategy;
                let pct = position!.portfolioType === 'investment' ? (strat === 'core' ? 70 : strat === 'satellite' ? 30 : 50) : 20;
                const reasons: string[] = [strat === 'core' ? 'سهم أساسي' : strat === 'satellite' ? 'سهم ساتلايت' : position!.portfolioType === 'investment' ? 'استثمار' : 'مضاربة'];
                if (analytics.weightPct !== null && analytics.weightPct > 25) { pct = Math.round(pct * 0.7); reasons.push('وزن المحفظة مرتفع'); }
                if (analytics.status === 'broken') { pct = Math.min(pct, 20); reasons.push('الوقف مكسور'); }
                const suggested = Math.round((metrics!.openShares * pct) / 100);
                if (suggested === (position!.coreShares || 0)) return null;
                return (
                  <div className="mt-3 flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      💡 الكور المقترح: <b className="font-mono-num text-blue-600 dark:text-blue-400">{suggested.toLocaleString()} سهم ({pct}%)</b> — {reasons.join(' · ')}
                    </span>
                    <button
                      onClick={async () => { await updatePosition(position!.id, { coreShares: suggested }); setCoreError(null); }}
                      className="shrink-0 text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                    >
                      تطبيق
                    </button>
                  </div>
                );
              })()}

            </div>

            </div>
          )}

          
          {/* Close Position (Full Exit) Section */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {metrics!.isOpen && (
              <button 
                onClick={() => setTxModalType('sellAll')}
                className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
              >
                <CheckCircle className="w-4 h-4" />
                إغلاق وتصفية كامل المركز المالي
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Partial Transaction Modal */}
      <TransactionFormModal
        isOpen={!!txModalType}
        onClose={() => { setTxModalType(null); setEditingTx(null); }}
        position={position}
        defaultType={txModalType === 'sellAll' ? 'sell' : txModalType === 'edit' && editingTx ? editingTx.type : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}
        defaultShares={txModalType === 'sellAll' ? metrics!.openShares.toString() : ''}
        transactionToEdit={txModalType === 'edit' ? editingTx : null}
      />
    
      <ConfirmModal
        isOpen={!!confirmTxId}
        title="حذف المعاملة"
        message="هل أنت متأكد من حذف هذه المعاملة بشكل نهائي؟ سيتم إعادة حساب متوسطات السهم."
        type="danger"
        confirmText="حذف"
        onConfirm={() => {
          if (confirmTxId) {
            deleteTransaction(position!.id, confirmTxId);
            setConfirmTxId(null);
          }
        }}
        onCancel={() => setConfirmTxId(null)}
      />

    </div>
  );
}