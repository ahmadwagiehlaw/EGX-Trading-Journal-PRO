import ConfirmModal from './ConfirmModal';
import { useState, useMemo } from 'react';
import { 
  Lock, 
  Maximize2,
  Minimize2,
  ShieldAlert, 
  CheckCircle, 
  Target,
  Trash2,
  RotateCcw, RefreshCw, X, Pencil, Sparkles, Pin, TrendingUp, TrendingDown, Zap, Layers, History, LineChart
} from 'lucide-react';

// Compact Arabic number format: 371,505 -> ["371.5", "ألف"], 2,400,000 -> ["2.40", "مليون"]
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

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { useTrades } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { computePositionMetrics, computeOpenLotsLowestPriceFirst, computeStopAnalytics, computePositionCycles, formatEGP, type TrailingStopState } from '../utils/calculations';
import { fetchEgxLiveQuotes } from '../utils/egxLivePrices';
import TransactionFormModal from './TransactionFormModal';

export default function ActiveTrades({ tradeId, onClose }: { tradeId: string; onClose?: () => void }) {

  const { positions, updateTrailingStop, updatePosition, deletePosition, deleteTransaction, archivePositionRound, coreStats, capitalInvestment, capitalSpeculation, commissionRate, activeCapital } = useTrades();
  const [archivingRound, setArchivingRound] = useState(false);
  const [showArchivedRounds, setShowArchivedRounds] = useState(false);
  const { theme } = useTheme();
  
  const position = positions.find(p => p.id === tradeId);
  const metrics = useMemo(() => {
    if (!position) return null;
    return computePositionMetrics(position, commissionRate);
  }, [position, commissionRate]);

  const cycles = useMemo(() => {
    if (!position?.transactions) return [];
    return computePositionCycles(position.transactions, commissionRate, position.symbol);
  }, [position?.transactions, commissionRate, position?.symbol]);

  const [newHighestPrice, setNewHighestPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [rightPaneView, setRightPaneView] = useState<'lots' | 'ledger' | 'chart'>('lots');
  const [leftTab, setLeftTab] = useState<'risk' | 'notes'>('risk');
  const [showPlanTools, setShowPlanTools] = useState(false);
  const [syncingSingle, setSyncingSingle] = useState(false);
  const openLots = useMemo(() => (position?.transactions ? computeOpenLotsLowestPriceFirst(position.transactions) : []), [position?.transactions]);
  const [stockNote, setStockNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  const [marketPriceInput, setMarketPriceInput] = useState(position?.currentMarketPrice?.toString() || '');
  const [isEditingMarketPrice, setIsEditingMarketPrice] = useState(false);
  const [isEditingHighestPrice, setIsEditingHighestPrice] = useState(false);
  const [isEditingAtr, setIsEditingAtr] = useState(false);
  const [atrInput, setAtrInput] = useState('');
  
  const [isEditingRsi, setIsEditingRsi] = useState(false);
  
  
  
  
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
    // Auto-trail: a new peak raises the stop (Chandelier) â€” never lowers it
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

  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetTransactions = async () => {
    if (!position) return;
    setIsResetting(true);
    try {
      await updatePosition(position.id, {
        transactions: [],
        coreShares: 0,
        status: 'active'
      });
      setIsResetModalOpen(false);
      // Automatically open the buy transaction modal so the user can immediately enter their clean open lot
      setTxModalType('buy');
    } catch (err) {
      console.error('Failed to reset transactions:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeletePosition = async () => {
    if (!position) return;
    try {
      await deletePosition(position.id);
      setIsDeleteModalOpen(false);
      onClose?.();
    } catch (err) {
      console.error('Failed to delete position:', err);
    }
  };
  const [isEditingCoreShares, setIsEditingCoreShares] = useState(false);
  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  const [mountTime] = useState(() => Date.now());

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
      const daysHeld = (mountTime - position.journal.openedDate) / (1000 * 60 * 60 * 24);
      if (daysHeld > 14 && pnlPercent < 2) {
        insights.push({ type: 'warning', text: `هذا التمركز المضاربي مستمر منذ ${Math.floor(daysHeld)} يوم بدون ربح يذكر. انتبه لتكلفة الفرصة البديلة (Cash Drag).` });
      }
    }

    // --- Technical rules driven by the values the user updates (price / RSI / targets / supports) ---
    const px = metrics.currentPrice;
    const rsiVal = position.plan?.rsi || 0;
    if (rsiVal > 0) {
      if (rsiVal >= 70) {
        insights.push({ type: pnlPercent > 0 ? 'success' : 'warning', text: 'مؤشر القوة النسبية RSI عند ' + rsiVal.toFixed(1) + ' (تشبع شرائي فوق 70): احتمال تصحيح قريب — لا تضف كمية جديدة، وفكّر في جني جزء من الربح وشدّ الوقف المتحرك.', action: pnlPercent > 0 ? 'بيع جزئي' : undefined });
      } else if (rsiVal <= 30) {
        insights.push({ type: 'info', text: 'مؤشر القوة النسبية RSI عند ' + rsiVal.toFixed(1) + ' (تشبع بيعي تحت 30): قد يقترب ارتداد، لكن لا تتخذ قرار البيع بدافع الذعر ولا تعزز المركز إلا إذا كانت الخطة تسمح وبقي الوقف سليماً.' });
      } else if (rsiVal >= 60 && (analytics?.rMultiple ?? 0) >= 1) {
        insights.push({ type: 'info', text: 'الزخم قوي (RSI ' + rsiVal.toFixed(1) + ') مع ربح يتجاوز 1R — الاتجاه في صالحك، ارفع الوقف تدريجياً ولا تسبق السعر بالبيع.' });
      }
    }

    // Targets: T1 = plan.target, T2/T3 = plan.targets[0/1]
    const tList = [position.plan?.target || 0, position.plan?.targets?.[0] || 0, position.plan?.targets?.[1] || 0];
    if (px > 0 && metrics.isOpen) {
      let hit = -1;
      tList.forEach((t, i) => { if (t > 0 && px >= t) hit = i; });
      if (hit >= 0) {
        insights.push({ type: 'success', text: 'السعر (' + px.toFixed(2) + ') بلغ الهدف T' + (hit + 1) + ' (' + tList[hit].toFixed(2) + '): نفّذ جني الأرباح المخطط له وارفع الوقف إلى مستوى الهدف السابق أو نقطة التعادل.', action: 'بيع جزئي' });
      } else {
        const nextIdx = tList.findIndex(t => t > px);
        if (nextIdx >= 0) {
          const dist = ((tList[nextIdx] - px) / px) * 100;
          if (dist <= 2) insights.push({ type: 'info', text: 'السعر قريب من الهدف T' + (nextIdx + 1) + ' (' + tList[nextIdx].toFixed(2) + ') — يبعد ' + dist.toFixed(1) + '% فقط. جهّز أمر البيع الجزئي.' });
        }
      }
    }

    // Supports: S1..S3 = plan.supports[0..2]
    const sList = [position.plan?.supports?.[0] || 0, position.plan?.supports?.[1] || 0, position.plan?.supports?.[2] || 0];
    if (px > 0 && metrics.isOpen && analytics?.status !== 'broken') {
      let lost = -1;
      sList.forEach((s, i) => { if (s > 0 && px < s) lost = i; });
      if (lost >= 0) {
        insights.push({ type: 'warning', text: 'السعر (' + px.toFixed(2) + ') كسر الدعم S' + (lost + 1) + ' (' + sList[lost].toFixed(2) + '): الدعم المكسور يتحول لمقاومة — راجع الوقف وتأكد أن الاتجاه ما زال سليماً.' });
      } else {
        const nearIdx = sList.findIndex(s => s > 0 && ((px - s) / px) * 100 <= 1.5);
        if (nearIdx >= 0) insights.push({ type: 'info', text: 'السعر يختبر الدعم S' + (nearIdx + 1) + ' (' + sList[nearIdx].toFixed(2) + ') — راقب رد فعل السعر هنا: الارتداد يدعم الاحتفاظ والكسر يستدعي الحذر.' });
      }
    }

    // Stop proximity (status 'near' previously had no message)
    if (analytics && analytics.status === 'near') {
      insights.push({ type: 'warning', text: 'السعر قريب جداً من الوقف (' + analytics.stopDistancePct.toFixed(1) + '% فقط' + (analytics.stopDistanceAtr !== null ? '، ' + analytics.stopDistanceAtr.toFixed(1) + ' ATR' : '') + '). جهّز نفسك للتنفيذ ولا تحرّك الوقف للأسفل.' });
    }
    if (analytics && analytics.status === 'locked' && metrics.isOpen) {
      insights.push({ type: 'success', text: 'الوقف أعلى من سعر الدخول: الربح المحمي ' + formatEGP(analytics.lockedProfit) + ' — صفقة بلا مخاطرة على رأس المال.' });
    }
    if (analytics && analytics.status === 'none' && metrics.isOpen) {
      insights.push({ type: 'warning', text: 'لا يوجد وقف خسارة محدد لهذا المركز. حدد الوقف الآن قبل أي قرار آخر.' });
    }

    // If the stop is broken, drop optimistic tips so the exit signal is the only message that matters
    let result: any[] = insights;
    if (analytics?.status === 'broken') {
      result = insights.filter((i: any) => i.type === 'warning');
    }
    if (result.length === 0) {
      result.push({ type: 'info', text: 'التمركز مستقر ضمن النطاق الآمن حالياً. حافظ على التزامك بالخطة المحددة وراقب مستويات الدعم والمقاومة.' });
    }
    // Severity order: warnings first, then success, then info
    const order: Record<string, number> = { warning: 0, success: 1, info: 2 };
    return result.sort((a: any, b: any) => (order[a.type] ?? 3) - (order[b.type] ?? 3));
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


  const isAnomalousStop = metrics!.isOpen && (currentStop > metrics!.currentPrice * 1.15 || currentHighest > metrics!.currentPrice * 1.4);

  const handleResetAnomalousStop = async () => {
    const safeHigh = Math.max(metrics!.currentPrice, metrics!.avgEntry);
    const atrVal = position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0;
    const baseStop = position!.plan?.stop && position!.plan.stop < metrics!.currentPrice
      ? position!.plan.stop
      : atrVal > 0 ? +(safeHigh - 2 * atrVal).toFixed(2) : +(safeHigh * 0.94).toFixed(2);
    await updatePosition(position!.id, {
      trailingStop: {
        initial: position!.trailingStop?.initial || baseStop,
        atrAtEntry: atrVal,
        atrMultiplier: position!.trailingStop?.atrMultiplier || 2,
        highestReached: safeHigh,
        current: baseStop,
      } as TrailingStopState,
    });
  };

  const handleQuickLiveSync = async () => {
    if (syncingSingle) return;
    setSyncingSingle(true);
    try {
      const map = await fetchEgxLiveQuotes([position!.symbol]);
      const q = map[position!.symbol.toUpperCase()];
      if (q && q.close > 0) {
        const prevHigh = position!.trailingStop?.highestReached || 0;
        const newHigh = Math.max(prevHigh, q.close);
        const mult = position!.trailingStop?.atrMultiplier || 2;
        const atrVal = q.atr || position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0;
        const nextUpdates: any = { currentMarketPrice: q.close };
        if (q.atr || q.rsi) {
          nextUpdates.plan = {
            ...(position!.plan || {}),
            ...(q.atr ? { atr: q.atr } : {}),
            ...(q.rsi ? { rsi: q.rsi } : {}),
          };
        }
        if (q.close > prevHigh && atrVal > 0) {
          const ratcheted = Math.max(position!.trailingStop?.current || 0, +(newHigh - mult * atrVal).toFixed(2));
          nextUpdates.trailingStop = {
            initial: position!.trailingStop?.initial || ratcheted,
            atrMultiplier: mult,
            highestReached: newHigh,
            current: ratcheted,
            atrAtEntry: atrVal,
          };
        }
        await updatePosition(position!.id, nextUpdates);
      }
    } finally {
      setSyncingSingle(false);
    }
  };

  // --- Plan gauge layout: scale always covers ALL markers; clustered labels are stacked ---
  const gaugeStop = position!.plan?.stop || 0;
  const gaugeTarget = position!.plan?.target || 0;
  const gaugeValid = gaugeStop > 0 && gaugeTarget > 0;
  const trailIsSane = currentStop > 0 && (!gaugeTarget || currentStop <= gaugeTarget * 1.35) && currentStop <= metrics!.currentPrice * 1.35;
  const gaugeVals = [gaugeStop, gaugeTarget, metrics!.avgEntry, trailIsSane ? currentStop : 0, metrics!.currentPrice].filter(v => v > 0);
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
  const trailDistinct = trailIsSane && Math.abs(currentStop - gaugeStop) > 0.005;
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
      <div className={isChartExpanded ? "flex flex-col" : "grid lg:grid-cols-2 gap-6 items-start"}>
        
        {/* Right Column: Tabbed Open Lots | Transaction Ledger | Live Chart */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 ${isChartExpanded ? 'h-[82vh]' : ''}`}>
          
          {/* Integrated Top Bar: 3 Crisp Tabs + Expand */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRightPaneView('lots')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  rightPaneView === 'lots'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>سلم الدفعات</span>
                {metrics!.isOpen && (
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono-num">
                    {openLots.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setRightPaneView('ledger')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  rightPaneView === 'ledger'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>سجل العمليات</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-500/15 text-slate-600 dark:text-slate-300 text-[10px] font-mono-num">
                  {position!.transactions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRightPaneView('chart')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  rightPaneView === 'chart'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>الشارت</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsChartExpanded(!isChartExpanded)}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"
              title={isChartExpanded ? "تصغير" : "تكبير"}
            >
              {isChartExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary Buy / Sell Action Strip (only on Lots / Ledger views) */}
          {rightPaneView !== 'chart' && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 bg-white dark:bg-slate-900">
              <button onClick={() => setTxModalType('buy')} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5">
                + {metrics!.isOpen ? 'شراء دفعة' : 'بدء دورة شراء'}
              </button>
              {metrics!.isOpen && (
                <button onClick={() => setTxModalType('sell')} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5">
                  ↙ بيع جزئي (جني ربح)
                </button>
              )}
            </div>
          )}

          {/* TAB 1: OPEN LOTS (LOWEST-PRICE FIRST) */}
          {rightPaneView === 'lots' && (
            <div className={`flex-1 overflow-y-auto px-4 pb-4 pt-2 ${isChartExpanded ? '' : 'max-h-[560px]'}`}>
              {metrics!.unmatchedSellShares > 0 && (
                <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 flex items-center gap-2 text-[11px] font-black text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>تنبيه: {metrics!.unmatchedSellShares.toLocaleString()} سهم بيع بدون شراء سابق — راجع السجل أو أرشف الجولة.</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">الدفعات المفتوحة ({openLots.length})</span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/50">
                  الأقل سعراً يُباع أولاً
                </span>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-center">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-2">التاريخ</th>
                      <th className="py-2.5 px-2">سعر الدفعة</th>
                      <th className="py-2.5 px-2">الكمية</th>
                      <th className="py-2.5 px-2">الربح/الخسارة</th>
                      <th className="py-2.5 px-2">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {openLots.map((lot, lotIdx) => {
                      const lotValue = lot.remainingShares * metrics!.currentPrice;
                      const lotCost = lot.remainingShares * lot.price;
                      const lotPnL = lotValue - lotCost;
                      const lotPnLPercent = lotCost > 0 ? (lotPnL / lotCost) * 100 : 0;
                      const isWinning = lotPnL > 0;
                      const isNextToSell = lotIdx === 0;
                      return (
                        <tr key={lot.id} className={`transition-colors font-mono-num text-xs font-bold text-slate-700 dark:text-slate-300 ${isNextToSell ? 'bg-emerald-500/[0.07] dark:bg-emerald-500/[0.09]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                          <td className="py-2.5 px-2 text-[11px] text-slate-500 dark:text-slate-400">{new Date(lot.date).toLocaleDateString('en-GB')}</td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-blue-600 dark:text-blue-400 font-black">{lot.price.toFixed(2)}</span>
                              {isNextToSell && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  التالية
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2">{lot.remainingShares.toLocaleString()}</td>
                          <td className={`py-2.5 px-2 ${isWinning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                            {lotPnL > 0 ? '+' : ''}{formatEGP(lotPnL)} ({lotPnLPercent.toFixed(1)}%)
                          </td>
                          <td className="py-2.5 px-2">
                            <button
                              onClick={() => setTxModalType('sell')}
                              className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800/50"
                            >
                              بيع
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {openLots.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-slate-400 text-xs font-bold">لا توجد دفعات مفتوحة حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TRADING CYCLES & ARCHIVE */}
          {rightPaneView === 'ledger' && (
            <div className={`flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3 ${isChartExpanded ? '' : 'max-h-[560px]'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                  دورات التداول ({cycles.length})
                </span>
                {position!.transactions.length > 0 && (
                  <button
                    type="button"
                    disabled={archivingRound}
                    onClick={async () => {
                      if (window.confirm(`هل تريد أرشفة جميع معاملات ${position!.symbol} الحالية في الأرشيف وبدء جولة جديدة نظيفة؟ (لن تُفقد أرباحك التاريخية)`)) {
                        setArchivingRound(true);
                        try {
                          await archivePositionRound(position!.id);
                        } finally {
                          setArchivingRound(false);
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black transition disabled:opacity-50"
                    title="حفظ السجل الحالي كأرشيف مغلق وبدء دورة جديدة على بياض"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{archivingRound ? 'جاري الأرشفة...' : 'أرشفة وبدء جولة نظيفة'}</span>
                  </button>
                )}
              </div>

              {cycles.map((cycle) => {
                const isActiveCycle = cycle.status === 'active';
                return (
                  <div
                    key={cycle.cycleIndex}
                    className={`rounded-2xl border p-3 ${
                      isActiveCycle
                        ? 'bg-white dark:bg-slate-900 border-blue-200/80 dark:border-blue-900/60'
                        : 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          isActiveCycle
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          دورة {cycle.cycleIndex} {isActiveCycle ? '● نشطة' : '✓ مغلقة'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {new Date(cycle.startDate).toLocaleDateString('en-GB')} ({cycle.durationDays} يوم)
                        </span>
                      </div>
                      <span className={`text-xs font-black font-mono-num ${cycle.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                        {cycle.netRealizedPnL > 0 ? '+' : ''}{formatEGP(cycle.netRealizedPnL)} EGP
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] text-center">
                        <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold text-[10px]">
                          <tr>
                            <th className="py-2 px-1.5 rounded-r-lg">العملية</th>
                            <th className="py-2 px-1.5">التاريخ</th>
                            <th className="py-2 px-1.5">الكمية</th>
                            <th className="py-2 px-1.5">السعر</th>
                            <th className="py-2 px-1.5">المحقق</th>
                            <th className="py-2 px-1.5 rounded-l-lg">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {[...cycle.transactions].sort((a, b) => b.date - a.date).map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors font-mono-num">
                              <td className="py-2 px-1.5">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  tx.type === 'buy'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                }`}>
                                  {tx.type === 'buy' ? 'شراء' : 'بيع'}
                                </span>
                              </td>
                              <td className="py-2 px-1.5 font-bold text-slate-600 dark:text-slate-300">
                                {new Date(tx.date).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-2 px-1.5 font-black text-slate-800 dark:text-white">
                                {tx.shares.toLocaleString()}
                              </td>
                              <td className="py-2 px-1.5 font-black text-slate-800 dark:text-white">
                                {tx.price.toFixed(2)}
                              </td>
                              <td className="py-2 px-1.5">
                                {tx.type === 'sell' && tx.id ? (
                                  <span className={`font-black ${(metrics!.txPnL?.[tx.id] || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                                    {(metrics!.txPnL?.[tx.id] || 0) >= 0 ? '+' : ''}{formatEGP(metrics!.txPnL?.[tx.id] || 0)}
                                  </span>
                                ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                              </td>
                              <td className="py-2 px-1.5 flex justify-center gap-1">
                                <button
                                  onClick={() => { setTxModalType('edit'); setEditingTx(tx); }}
                                  className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                  title="تعديل"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setConfirmTxId(tx.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {(position!.archivedRounds?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowArchivedRounds(v => !v)}
                    className="w-full flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-300"
                  >
                    <span>📦 الجولات المؤرشفة ({position!.archivedRounds!.length})</span>
                    <span dir="ltr" className="text-[11px] font-mono-num">
                      <b className={position!.archivedRounds!.reduce((a, r) => a + r.netRealizedPnL, 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {formatEGP(position!.archivedRounds!.reduce((a, r) => a + r.netRealizedPnL, 0))} EGP
                      </b>
                    </span>
                  </button>
                  {showArchivedRounds && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                      {position!.archivedRounds!.map((ar, idx) => (
                        <div key={ar.id} className="flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 border border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                          <span className="text-slate-700 dark:text-slate-200">
                            أرشيف #{position!.archivedRounds!.length - idx} · {new Date(ar.startDate).toLocaleDateString('en-GB')} ← {new Date(ar.endDate).toLocaleDateString('en-GB')} ({ar.transactions.length})
                          </span>
                          <span dir="ltr" className={`font-black font-mono-num ${ar.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {ar.netRealizedPnL > 0 ? '+' : ''}{formatEGP(ar.netRealizedPnL)} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE TRADINGVIEW CHART */}
          {rightPaneView === 'chart' && (
            <div className={`w-full ${isChartExpanded ? 'flex-1' : 'h-[560px]'}`}>
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
            </div>
          )}
        </div>

        {/* Left Column: Hero Price, Executive Summary & Focused Risk Panel */}
        <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 flex-col space-y-4 shadow-sm ${isChartExpanded ? 'hidden' : 'flex'}`}>

          {/* HERO HEADER: Ticker + Dominant Live Market Price + Open Position */}
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>

                {/* Dominant Live Market Price Box */}
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-3 py-1.5 shadow-sm">
                  <div
                    onClick={() => { setIsEditingMarketPrice(true); setIsEditingHighestPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); }}
                    className="cursor-text flex items-baseline gap-1"
                    title="اضغط لتعديل سعر السوق يدوياً"
                  >
                    {isEditingMarketPrice ? (
                      <input
                        type="number" step="any"
                        value={marketPriceInput}
                        onChange={(e) => setMarketPriceInput(e.target.value)}
                        onBlur={handleUpdateMarketPrice}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateMarketPrice()}
                        className="w-20 bg-transparent text-xl font-black outline-none text-left font-mono-num"
                        dir="ltr" autoFocus
                        placeholder={metrics!.currentPrice.toFixed(2)}
                      />
                    ) : (
                      <span className="text-xl font-black font-mono-num tracking-tight" dir="ltr">
                        {metrics!.currentPrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-[10px] font-bold opacity-70">EGP</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickLiveSync}
                    disabled={syncingSingle}
                    title="تحديث السعر والمؤشرات لحظياً"
                    className="p-1 rounded-lg bg-white/15 dark:bg-slate-900/10 hover:bg-white/25 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingSingle ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                  metrics!.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {metrics!.isOpen ? 'مفتوح' : 'مغلق'}
                </span>
              </div>
            </div>

            <div className="text-left flex flex-col items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono-num">{metrics!.openShares.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400">سهم</span>
              </div>
              {metrics!.isOpen && (() => {
                const u = metrics!.netUnrealizedPnL;
                const cost = metrics!.openShares * metrics!.avgEntry;
                const uPct = cost > 0 ? (u / cost) * 100 : 0;
                const tone = u > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                  : u < 0 ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';
                return (
                  <div className={`mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[11px] font-black ${tone}`} title="صافي الربح/الخسارة غير المحققة بعد العمولات">
                    {u < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    <Amt v={u} plus />
                    <span dir="ltr">({u > 0 ? '+' : ''}{uPct.toFixed(1)}%)</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 4-METRIC EXECUTIVE STRIP */}
          {metrics!.isOpen && (() => {
            const marketValue = metrics!.openShares * metrics!.currentPrice;
            const totalCost = metrics!.openShares * metrics!.avgEntry;
            const costPct = activeCapital > 0 ? (totalCost / activeCapital) * 100 : 0;
            const rp = metrics!.netRealizedPnL;
            const rTone = rp > 0 ? 'text-emerald-600 dark:text-emerald-400' : rp < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200';
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 block">متوسط الدفعات</span>
                  <span className="text-sm font-black font-mono-num text-blue-600 dark:text-blue-400" dir="ltr">{metrics!.avgEntry.toFixed(2)}</span>
                </div>
                <div className="min-w-0" title="نقطة التعادل الحقيقية بعد خصم الأرباح المحققة من المضاربة">
                  <span className="text-[10px] font-bold text-slate-500 block">التعادل الحقيقي</span>
                  <span className="text-sm font-black font-mono-num text-amber-600 dark:text-amber-400" dir="ltr">
                    {(metrics!.effectiveBreakEven > 0 ? metrics!.effectiveBreakEven : metrics!.avgEntry).toFixed(2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 block">القيمة السوقية</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100"><Amt v={marketValue} /></span>
                    {costPct > 0 && <span className="text-[9px] font-bold text-slate-400" dir="ltr">({costPct.toFixed(0)}%)</span>}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 block">الربح المحقق</span>
                  <span className={`text-sm font-black ${rTone}`}><Amt v={rp} plus /></span>
                </div>
              </div>
            );
          })()}

          {/* SLIM TECHNICAL STRIP (Peak / ATR / RSI) */}
          {metrics!.isOpen && (
            <div className="grid grid-cols-3 gap-2">
              <div
                className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-800/50 rounded-xl px-2.5 py-1.5 cursor-text"
                onClick={() => { setIsEditingHighestPrice(true); setIsEditingMarketPrice(false); setIsEditingAtr(false); setIsEditingRsi(false); }}
              >
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> القمة
                </span>
                {isEditingHighestPrice ? (
                  <input
                    type="number" step="any"
                    value={newHighestPrice}
                    onChange={(e) => { setNewHighestPrice(e.target.value); setError(null); }}
                    onBlur={handleUpdateTrailingStop}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateTrailingStop()}
                    className="w-14 bg-transparent text-xs font-black outline-none text-left text-blue-900 dark:text-blue-100 font-mono-num"
                    dir="ltr" autoFocus
                    placeholder={currentHighest.toFixed(2)}
                  />
                ) : (
                  <span className="text-xs font-black text-blue-800 dark:text-blue-200 font-mono-num" dir="ltr">
                    {currentHighest.toFixed(2)}
                  </span>
                )}
              </div>

              <div
                className="flex items-center justify-between bg-purple-50/70 dark:bg-purple-900/20 border border-purple-200/70 dark:border-purple-800/50 rounded-xl px-2.5 py-1.5 cursor-text"
                onClick={() => { setIsEditingAtr(true); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); setIsEditingRsi(false); }}
              >
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">ATR</span>
                {isEditingAtr ? (
                  <input
                    type="number" step="any"
                    value={atrInput}
                    onChange={(e) => setAtrInput(e.target.value)}
                    onBlur={handleUpdateAtr}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateAtr()}
                    className="w-14 bg-transparent text-xs font-black outline-none text-left text-purple-900 dark:text-purple-100 font-mono-num"
                    dir="ltr" autoFocus
                    placeholder={((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                  />
                ) : (
                  <span className="text-xs font-black text-purple-800 dark:text-purple-200 font-mono-num" dir="ltr">
                    {((position!.trailingStop?.atrAtEntry || position!.plan?.atr || 0)).toFixed(2)}
                  </span>
                )}
              </div>

              <div
                className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-200/70 dark:border-indigo-800/50 rounded-xl px-2.5 py-1.5 cursor-text"
                onClick={() => { setIsEditingRsi(true); setIsEditingAtr(false); setIsEditingHighestPrice(false); setIsEditingMarketPrice(false); }}
              >
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">RSI</span>
                {isEditingRsi ? (
                  <input
                    type="number" step="any"
                    value={rsiInput}
                    onChange={(e) => setRsiInput(e.target.value)}
                    onBlur={handleUpdateRsi}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateRsi()}
                    className="w-14 bg-transparent text-xs font-black outline-none text-left text-indigo-900 dark:text-indigo-100 font-mono-num"
                    dir="ltr" autoFocus
                    placeholder={((position!.plan?.rsi || 0)).toFixed(1)}
                  />
                ) : (
                  <span className="text-xs font-black text-indigo-800 dark:text-indigo-200 font-mono-num" dir="ltr">
                    {((position!.plan?.rsi || 0)).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && isEditingHighestPrice && (
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1.5 rounded-lg">
              {error}
            </p>
          )}

          {/* ANOMALOUS STALE STOP GUARD */}
          {isAnomalousStop && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-black text-amber-800 dark:text-amber-200">
              <span>⚠️ القمة المسجلة ({currentHighest.toFixed(2)}) أو الوقف ({currentStop.toFixed(2)}) غير متسقة مع سعر السوق الحالي.</span>
              <button
                type="button"
                onClick={handleResetAnomalousStop}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black transition"
              >
                إعادة ضبط
              </button>
            </div>
          )}

          {/* 2 CLEAN TABS HEADER */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setLeftTab('risk')}
              className={`pb-2.5 px-3 font-black text-xs whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                leftTab === 'risk'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> المخاطرة والخطة
            </button>
            <button
              onClick={() => setLeftTab('notes')}
              className={`pb-2.5 px-3 font-black text-xs whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                leftTab === 'notes'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> الملاحظات والتنبيهات
              {insights.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-mono-num">
                  {insights.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: FOCUSED RISK & PLAN */}
          {leftTab === 'risk' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 4 Essential Risk KPIs */}
              {analytics && metrics!.isOpen && (() => {
                const R = analytics.rMultiple;
                const tone = {
                  good: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
                  bad: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300',
                  warn: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
                  neutral: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200',
                } as const;
                const cards: { label: string; value: string; tone: keyof typeof tone; hint: string }[] = [
                  { label: 'R الحالي', value: R === null ? '—' : (R >= 0 ? '+' : '') + R.toFixed(2) + 'R', tone: R === null ? 'neutral' : R >= 1 ? 'good' : R < 0 ? 'bad' : 'neutral', hint: '(السوق − الدخول) ÷ مخاطرة الخطة' },
                  (!isAnomalousStop && analytics.lockedProfit > 0)
                    ? { label: 'ربح مؤمَّن 🔒', value: '+' + formatEGP(analytics.lockedProfit), tone: 'good', hint: 'الوقف أعلى من متوسط الدخول' }
                    : { label: 'مخاطرة الوقف', value: analytics.capitalAtRisk > 0 ? formatEGP(analytics.capitalAtRisk) : (metrics!.currentStop > 0 ? '🔒 صفر' : '—'), tone: analytics.capitalAtRisk > analytics.riskAmountAllowed && analytics.riskAmountAllowed > 0 ? 'bad' : 'neutral', hint: 'الخسارة لو ضُرب الوقف' },
                  { label: 'وزن المحفظة', value: analytics.weightPct === null ? '—' : analytics.weightPct.toFixed(1) + '%', tone: analytics.weightPct !== null && analytics.weightPct > 25 ? 'warn' : 'neutral', hint: 'قيمة المركز ÷ رأس المال' },
                  { label: 'أيام الاحتفاظ', value: analytics.daysHeld === null ? '—' : analytics.daysHeld + ' يوم', tone: position!.plan?.timeStopDays && analytics.daysHeld !== null && analytics.daysHeld > position!.plan.timeStopDays ? 'warn' : 'neutral', hint: 'منذ أول شراء في الدورة' },
                ];
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {cards.map(c => (
                      <div key={c.label} className={`rounded-xl border px-2.5 py-2 text-center ${tone[c.tone]}`} title={c.hint}>
                        <div className="text-[10px] font-bold opacity-75">{c.label}</div>
                        <div className="text-xs font-black tracking-tight mt-0.5 font-mono-num" dir="ltr">{c.value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Clean Price-to-Plan Visual Gauge */}
              <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-7 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="relative h-12 w-full flex items-center" style={{ marginTop: gauge.mt - 10, marginBottom: gauge.mb }}>
                  <div className="absolute w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    {position!.plan?.target && position!.plan?.stop ? (
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-400 to-rose-500 opacity-90 w-full" />
                    ) : null}
                  </div>

                  {gauge.valid ? (
                    <>
                      {gauge.top.map(m => (
                        <div key={m.key} className="absolute flex flex-col items-center" style={{ right: `${m.pct}%`, transform: 'translateX(50%)', bottom: '100%', marginBottom: '10px' }}>
                          <div className="flex flex-col items-center" style={{ transform: `translateY(-${m.level * 32}px)` }}>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${m.text}`}>{m.label}</span>
                            <span className="text-xs font-mono-num font-black text-slate-800 dark:text-slate-200">{m.value.toFixed(2)}</span>
                          </div>
                          <div className={`w-0.5 absolute ${m.dot}`} style={{ height: 12 + m.level * 32, bottom: -12 }} />
                          <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 absolute -bottom-4 ${m.dot}`} />
                        </div>
                      ))}
                      {gauge.bottom.map(m => (
                        <div key={m.key} className="absolute flex flex-col items-center" style={{ right: `${m.pct}%`, transform: 'translateX(50%)', top: '100%', marginTop: '10px' }}>
                          <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 absolute -top-4 ${m.dot}`} />
                          <div className={`w-0.5 absolute ${m.dot}`} style={{ height: 12 + m.level * 32, top: -12 }} />
                          <div className="flex flex-col items-center" style={{ transform: `translateY(${m.level * 32}px)` }}>
                            <span className={`text-[10px] font-black ${m.text}`}>{m.label}</span>
                            <span className="text-xs font-mono-num font-black text-slate-800 dark:text-slate-200">{m.value.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center w-full text-[11px] text-slate-500 font-bold mt-6">أضف هدفاً ووقف خسارة من إعدادات الخطة بالأسفل</div>
                  )}
                </div>
              </div>

              {/* Collapsible Plan Tools (Targets, Supports, Chandelier Stop, Core Shares) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPlanTools(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    إعدادات الأهداف والوقف المتحرك والكور
                  </span>
                  <span className="text-[10px] text-slate-400">{showPlanTools ? 'إخفاء ▲' : 'تعديل ▼'}</span>
                </button>

                {showPlanTools && (
                  <div className="p-4 pt-2 space-y-4 border-t border-slate-200/70 dark:border-slate-800">
                    {/* Risk % per trade */}
                    {analytics && (
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>المخاطرة المسموحة: {riskPct}% ≈ {formatEGP(analytics.riskAmountAllowed)}</span>
                        {isEditingRisk ? (
                          <span className="flex items-center gap-1">
                            <input type="number" step="0.1" value={riskInput} onChange={e => setRiskInput(e.target.value)} className="w-12 text-center px-1 py-0.5 rounded border bg-white dark:bg-slate-900 font-black" dir="ltr" autoFocus />
                            <button onClick={handleSaveRisk} className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold text-[10px]">حفظ</button>
                            <button onClick={() => setIsEditingRisk(false)} className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">إلغاء</button>
                          </span>
                        ) : (
                          <button onClick={() => { setRiskInput(String(riskPct)); setIsEditingRisk(true); }} className="underline text-blue-600 dark:text-blue-400">تعديل %</button>
                        )}
                      </div>
                    )}

                    {/* Targets & Supports */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">المستهدفات والدعوم</span>
                      <button onClick={handleAutoCalculate} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-200 dark:border-indigo-800">
                        <Zap className="w-3 h-3" /> حساب تلقائي
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50/70 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-700 dark:text-emerald-400 font-black text-[11px]">الأهداف</span>
                          {isEditingTargets ? (
                            <div className="flex gap-1">
                              <button onClick={handleUpdateTargets} className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">حفظ</button>
                              <button onClick={() => setIsEditingTargets(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">إلغاء</button>
                            </div>
                          ) : (
                            <button onClick={() => setIsEditingTargets(true)} className="text-[10px] font-bold text-emerald-600 hover:underline">تعديل</button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {[1, 2, 3].map((i) => (
                            <div key={`t${i}`} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-500">T{i}</span>
                              {isEditingTargets ? (
                                <input type="number" step="any" value={i === 1 ? t1Input : i === 2 ? t2Input : t3Input} onChange={(e) => i === 1 ? setT1Input(e.target.value) : i === 2 ? setT2Input(e.target.value) : setT3Input(e.target.value)} className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5" dir="ltr" />
                              ) : (
                                <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono-num">{(i === 1 ? position!.plan?.target : i === 2 ? position!.plan?.targets?.[0] : position!.plan?.targets?.[1]) || '—'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50/70 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-700 dark:text-blue-400 font-black text-[11px]">الدعوم</span>
                          {isEditingSupports ? (
                            <div className="flex gap-1">
                              <button onClick={handleUpdateSupports} className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded">حفظ</button>
                              <button onClick={() => setIsEditingSupports(false)} className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">إلغاء</button>
                            </div>
                          ) : (
                            <button onClick={() => setIsEditingSupports(true)} className="text-[10px] font-bold text-blue-600 hover:underline">تعديل</button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {[1, 2, 3].map((i) => (
                            <div key={`s${i}`} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-500">S{i}</span>
                              {isEditingSupports ? (
                                <input type="number" step="any" value={i === 1 ? s1Input : i === 2 ? s2Input : s3Input} onChange={(e) => i === 1 ? setS1Input(e.target.value) : i === 2 ? setS2Input(e.target.value) : setS3Input(e.target.value)} className="w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5" dir="ltr" />
                              ) : (
                                <span className="font-black text-blue-700 dark:text-blue-300 font-mono-num">{(position!.plan?.supports?.[i - 1]) || '—'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Smart Chandelier Stop */}
                    {metrics!.isOpen && analytics && (
                      <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">الوقف المتحرك (Chandelier)</span>
                          <div className="flex items-center gap-1">
                            {[1.5, 2, 2.5, 3].map(m => (
                              <button key={m} onClick={() => handleSetMultiplier(m)} className={`text-[10px] font-black px-2 py-0.5 rounded-md border transition-colors ${analytics.atrMultiplier === m ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                                {m}×
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-center">
                            <div className="text-[10px] font-bold text-slate-500">وقف القمة − {analytics.atrMultiplier}×ATR</div>
                            <div className="text-sm font-black text-orange-600 dark:text-orange-400 font-mono-num" dir="ltr">{analytics.chandelierStop !== null ? analytics.chandelierStop.toFixed(2) : '—'}</div>
                            <button
                              disabled={analytics.chandelierStop === null || analytics.chandelierStop <= metrics!.currentStop || analytics.chandelierStop >= metrics!.currentPrice}
                              onClick={() => analytics.chandelierStop !== null && handleApplyStop(analytics.chandelierStop, 'وقف Chandelier')}
                              className="mt-1 text-[10px] font-black bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white px-2.5 py-0.5 rounded-md"
                            >
                              تطبيق
                            </button>
                          </div>
                          <div className="bg-white dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-center">
                            <div className="text-[10px] font-bold text-slate-500">وقف التعادل</div>
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono-num" dir="ltr">{analytics.breakevenStop.toFixed(2)}</div>
                            <button
                              disabled={analytics.breakevenStop <= metrics!.currentStop || analytics.breakevenStop >= metrics!.currentPrice}
                              onClick={() => handleApplyStop(analytics.breakevenStop, 'وقف التعادل')}
                              className="mt-1 text-[10px] font-black bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white px-2.5 py-0.5 rounded-md"
                            >
                              تطبيق
                            </button>
                          </div>
                        </div>
                        {stopError && <p className="text-[10px] font-black text-rose-600 dark:text-rose-400">{stopError}</p>}
                        {stopNote && <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">{stopNote}</p>}
                      </div>
                    )}

                    {/* Core / Satellite Split */}
                    {metrics!.isOpen && (
                      <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-200">توزيع الكور ({position?.coreShares || 0} / {metrics!.openShares})</span>
                          {isEditingCoreShares ? (
                            <div className="flex items-center gap-1">
                              <input type="number" className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-black px-2 py-0.5 text-center" value={coreSharesInput} onChange={e => setCoreSharesInput(e.target.value)} autoFocus dir="ltr" />
                              <button onClick={handleSaveCoreShares} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"><CheckCircle className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setIsEditingCoreShares(false)} className="p-1 text-rose-600 hover:bg-rose-100 rounded"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <button onClick={() => setIsEditingCoreShares(true)} className="text-[10px] font-bold text-blue-600 hover:underline">تعديل الكور</button>
                          )}
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all" style={{ width: `${position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0}%` }} />
                          <div className="h-full bg-amber-400 transition-all" style={{ width: `${100 - (position?.coreShares ? (position.coreShares / metrics!.openShares) * 100 : 0)}%` }} />
                        </div>
                        {coreError && <p className="text-[10px] font-black text-rose-600 mt-1">{coreError}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SMART ALERTS & STOCK NOTES */}
          {leftTab === 'notes' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {insights.length > 0 && (
                <div className="space-y-2">
                  {insights.map((insight, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-bold leading-relaxed ${
                      insight.type === 'warning' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/50' :
                      insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50' :
                      'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex-1">{insight.text}</div>
                      {insight.action && (
                        <button onClick={() => setTxModalType('sell')} className="text-[10px] font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 shrink-0">
                          {insight.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/60 dark:border-yellow-800/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-yellow-900 dark:text-yellow-500 text-xs flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    ملاحظات حول {position!.symbol}
                  </h3>
                  {isEditingNote ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={handleUpdateNote} className="px-2.5 py-1 bg-yellow-600 text-white rounded-lg text-[11px] font-black">حفظ</button>
                      <button onClick={() => { setIsEditingNote(false); setStockNote(position!.plan?.makerPlan || ''); }} className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingNote(true)} className="px-2.5 py-1 bg-white dark:bg-slate-800 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-[11px] font-black">تعديل</button>
                  )}
                </div>
                {isEditingNote ? (
                  <textarea
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="اكتب ملاحظاتك الفنية أو خطة السهم..."
                    className="w-full bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-3 text-xs font-bold text-slate-700 dark:text-slate-300 min-h-[140px] focus:ring-2 focus:ring-yellow-500 outline-none leading-relaxed resize-none"
                  />
                ) : (
                  <div className="bg-white/70 dark:bg-slate-900/60 border border-white dark:border-slate-800 rounded-xl p-3 min-h-[110px]">
                    {stockNote ? (
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{stockNote}</p>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-6">
                        <Pin className="w-5 h-5 mb-1.5" />
                        <p className="text-[11px] font-bold">لا توجد ملاحظات مسجلة.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPACT SINGLE-ROW FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            {metrics!.isOpen && (
              <button
                onClick={() => setTxModalType('sellAll')}
                className="flex-1 min-w-[120px] bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-black py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px]"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                إغلاق المركز
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="py-2 px-3 rounded-xl border border-amber-300/80 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-black text-[11px] flex items-center justify-center gap-1 transition"
              title="مسح المعاملات وبدء السهم من جديد"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تصفير</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="py-2 px-3 rounded-xl border border-rose-300/80 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-black text-[11px] flex items-center justify-center gap-1 transition"
              title="حذف السهم نهائياً"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف</span>
            </button>
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

      <ConfirmModal
        isOpen={isResetModalOpen}
        title={`تصفير معاملات سهم ${position?.symbol || ''}`}
        message={`هل أنت متأكد من مسح جميع المعاملات والدورات المسجلة لهذا السهم؟ سيتم تصفير السجل تماماً لتتمكن من إضافة مركزك الحالي الفعلي على نظيف.`}
        type="warning"
        confirmText={isResetting ? "جاري التصفير..." : "تصفير وبدء مركز جديد"}
        cancelText="إلغاء"
        onConfirm={handleResetTransactions}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={`حذف سهم ${position?.symbol || ''} نهائياً`}
        message={`هل أنت متأكد من حذف هذا السهم بجميع معاملاته وخطة تداوله بشكل نهائي من المحفظة؟ لا يمكن التراجع عن هذا الإجراء.`}
        type="danger"
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={handleDeletePosition}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

    </div>
  );
}

