import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type PlanUpdate } from '../components/PlanUpdatesFeed';
import { 
  type TickerPosition, 
  type Transaction, 
  computePositionMetrics, 
  computeWeightedAvgEntry, 
  computeOpenShares, 
  computeRealizedPnL 
} from '../utils/calculations';

export type { TickerPosition, Transaction };

export interface Plan {
  id: string;
  symbol: string;
  strategy: string;
  entry?: number; // legacy single entry
  entryZone: {
    min: number;
    max: number;
  };
  target: number;
  stop: number;
  atr?: number;
  status: 'waiting' | 'ready';
  updates: PlanUpdate[];
  createdAt?: number;
}

// Backward-compatible Trade interface for legacy calls
export interface Trade extends Omit<TickerPosition, 'status'> {
  status: 'open' | 'won' | 'lost' | 'breakeven' | 'active' | 'closed';
  entryPrice: number;
  atrAtEntry: number;
  initialStopLoss: number;
  currentStopLoss: number;
  highestPrice: number;
  targetPrice: number;
  shares: number;
  makerPlan: string;
  checklist: { majorSR: boolean; bos: boolean; retest: boolean };
  images: string[];
  emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
  lessonLearned?: string;
  mistake?: string;
  tags?: string[];
  isRuleBreaker?: boolean;
  exitPrice?: number;
  exitDate?: number;
}

interface TradeContextType {
  // Positions (Primary Ticker-centric model)
  positions: TickerPosition[];
  trades: Trade[]; // Legacy backward-compatibility alias
  addPosition: (pos: Omit<TickerPosition, 'id'>) => Promise<string>;
  updatePosition: (id: string, data: Partial<TickerPosition>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  closePosition: (
    id: string, 
    exitPrice: number, 
    emotion?: string, 
    lessonLearned?: string, 
    mistake?: string
  ) => Promise<void>;
  
  // Transactions
  addTransaction: (positionId: string, tx: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (positionId: string, txId: string) => Promise<void>;

  // Trailing Stop
  updateTrailingStop: (id: string, highestPrice: number, newStopLoss: number) => Promise<void>;

  // Legacy aliases for seamless migration
  addTrade: (trade: any) => Promise<void>;
  updateTrade: (id: string, trade: any) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  closeTrade: (id: string, exitPrice: number, emotion?: any, lessonLearned?: string, mistake?: string) => Promise<void>;

  // Plans (Watchlist)
  plans: Plan[];
  addPlan: (plan: Plan) => Promise<void>;
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  convertPlanToPosition: (plan: Plan, initialPrice?: number, initialShares?: number) => Promise<string>;

  // Capital & Settings
  capitalInvestment: number;
  capitalSpeculation: number;
  updateCapital: (inv: number, spec: number) => Promise<void>;

  // Computed Aggregated Analytics
  totalRealizedPnL: number;
  winRate: number;
  openPositionsCount: number;
  wonPositionsCount: number;
  lostPositionsCount: number;
  totalOpenCapital: number;
  totalOpenRisk: number;
  disciplineScore: number;
  loading: boolean;
}

const defaultCapital = { investment: 1000000, speculation: 100000 };

const TradeContext = createContext<TradeContextType | undefined>(undefined);

// Helper to normalize any incoming Firestore document into a standardized TickerPosition
function normalizePosition(raw: any, id: string): TickerPosition {
  // If already in new format with transactions array
  if (Array.isArray(raw.transactions) && raw.transactions.length > 0) {
    return {
      id: raw.id || id,
      symbol: (raw.symbol || '').toUpperCase(),
      portfolioType: raw.portfolioType || 'investment',
      status: raw.status || 'active',
      plan: raw.plan || {
        strategy: raw.makerPlan || '',
        entryZone: { min: raw.entryPrice || 0, max: raw.entryPrice || 0 },
        target: raw.targetPrice || 0,
        stop: raw.initialStopLoss || 0,
        atr: raw.atrAtEntry || 0,
        checklist: raw.checklist,
        images: raw.images || [],
        makerPlan: raw.makerPlan || '',
      },
      transactions: raw.transactions,
      trailingStop: raw.trailingStop || {
        initial: raw.initialStopLoss || 0,
        current: raw.currentStopLoss || raw.initialStopLoss || 0,
        highestReached: raw.highestPrice || raw.entryPrice || 0,
        atrAtEntry: raw.atrAtEntry || 0,
      },
      journal: raw.journal || {
        emotion: raw.emotion || 'neutral',
        lessonLearned: raw.lessonLearned || '',
        mistake: raw.mistake || '',
        tags: raw.tags || [],
        isRuleBreaker: raw.isRuleBreaker || false,
        openedDate: raw.entryDate || Date.now(),
        closedDate: raw.exitDate,
      },
      entryDate: raw.entryDate || (raw.transactions[0]?.date) || Date.now(),
      pnl: raw.pnl !== undefined ? raw.pnl : computeRealizedPnL(raw.transactions),
    };
  }

  // Legacy format: Single trade document
  const entryPrice = Number(raw.entryPrice) || 0;
  const shares = Number(raw.shares) || Number(raw.sharesCount) || 0;
  const entryDate = Number(raw.entryDate) || Date.now();
  const exitPrice = raw.exitPrice ? Number(raw.exitPrice) : undefined;
  const exitDate = raw.exitDate ? Number(raw.exitDate) : undefined;

  const legacyTransactions: Transaction[] = [];
  if (entryPrice > 0 && shares > 0) {
    legacyTransactions.push({
      id: 'init_buy_' + id,
      type: 'buy',
      date: entryDate,
      price: entryPrice,
      shares: shares,
      amount: entryPrice * shares,
      note: 'دخول مبدئي',
    });
  }

  if (exitPrice && exitPrice > 0 && shares > 0 && raw.status !== 'open') {
    legacyTransactions.push({
      id: 'exit_sell_' + id,
      type: 'sell',
      date: exitDate || Date.now(),
      price: exitPrice,
      shares: shares,
      amount: exitPrice * shares,
      note: 'إغلاق الصفقة',
    });
  }

  const initialSL = Number(raw.initialStopLoss) || 0;
  const currentSL = Number(raw.currentStopLoss) || initialSL;
  const highestP = Number(raw.highestPrice) || entryPrice;
  const targetP = Number(raw.targetPrice) || 0;
  const atr = Number(raw.atrAtEntry) || Number(raw.atr15) || 0;

  return {
    id: raw.id || id,
    symbol: (raw.symbol || '').toUpperCase(),
    portfolioType: raw.portfolioType || 'investment',
    status: raw.status === 'open' ? 'active' : 'closed',
    plan: {
      strategy: raw.makerPlan || '',
      entryZone: { min: entryPrice, max: entryPrice },
      target: targetP,
      stop: initialSL,
      atr: atr,
      checklist: raw.checklist,
      images: raw.images || [],
      makerPlan: raw.makerPlan || '',
    },
    transactions: legacyTransactions,
    trailingStop: {
      initial: initialSL,
      current: currentSL,
      highestReached: highestP,
      atrAtEntry: atr,
    },
    journal: {
      emotion: raw.emotion || 'neutral',
      lessonLearned: raw.lessonLearned || '',
      mistake: raw.mistake || '',
      tags: raw.tags || [],
      isRuleBreaker: raw.isRuleBreaker || false,
      openedDate: entryDate,
      closedDate: exitDate,
    },
    entryDate: entryDate,
    pnl: raw.pnl,
  };
}

// Helper to convert normalized position back into legacy Trade shape for older UI components
function positionToLegacyTrade(pos: TickerPosition): Trade {
  const metrics = computePositionMetrics(pos);
  const isRuleBreaker = pos.journal?.isRuleBreaker || false;

  let legacyStatus: Trade['status'] = 'open';
  if (pos.status === 'closed' || metrics.isFullyClosed) {
    if (metrics.realizedPnL > 0) legacyStatus = 'won';
    else if (metrics.realizedPnL < 0) legacyStatus = 'lost';
    else legacyStatus = 'breakeven';
  }

  return {
    ...pos,
    entryPrice: metrics.avgEntry || pos.plan?.entryZone.min || 0,
    atrAtEntry: pos.trailingStop?.atrAtEntry || pos.plan?.atr || 0,
    initialStopLoss: pos.trailingStop?.initial || pos.plan?.stop || 0,
    currentStopLoss: pos.trailingStop?.current || pos.plan?.stop || 0,
    highestPrice: pos.trailingStop?.highestReached || metrics.avgEntry || 0,
    targetPrice: pos.plan?.target || 0,
    shares: metrics.openShares > 0 ? metrics.openShares : metrics.totalBought,
    makerPlan: pos.plan?.makerPlan || pos.plan?.strategy || '',
    checklist: pos.plan?.checklist || { majorSR: false, bos: false, retest: false },
    images: pos.plan?.images || [],
    emotion: pos.journal?.emotion,
    lessonLearned: pos.journal?.lessonLearned,
    mistake: pos.journal?.mistake,
    tags: pos.journal?.tags || [],
    isRuleBreaker,
    status: legacyStatus,
    entryDate: pos.journal?.openedDate || pos.entryDate || Date.now(),
    exitDate: pos.journal?.closedDate,
    pnl: metrics.realizedPnL,
  };
}

export function TradeProvider({ children }: { children: ReactNode }) {
  const [positions, setPositions] = useState<TickerPosition[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [capitalInvestment, setCapitalInvestment] = useState<number>(defaultCapital.investment);
  const [capitalSpeculation, setCapitalSpeculation] = useState<number>(defaultCapital.speculation);
  const [loading, setLoading] = useState(true);

  // Real-time sync with Firestore
  useEffect(() => {
    const handleError = (err: any) => {
      console.error("Firestore sync error:", err);
      setLoading(false);
    };

    // 1. Listen to trades / positions collection
    const unsubTrades = onSnapshot(collection(db, 'trades'), (snapshot) => {
      const data = snapshot.docs.map(d => normalizePosition(d.data(), d.id));
      // Sort newest opened first
      data.sort((a, b) => (b.journal?.openedDate || 0) - (a.journal?.openedDate || 0));
      setPositions(data);
      setLoading(false);
    }, handleError);

    // 2. Listen to plans
    const unsubPlans = onSnapshot(collection(db, 'plans'), (snapshot) => {
      const rawPlans = snapshot.docs.map(d => {
        const p = d.data();
        // Ensure entryZone exists
        const entryVal = p.entry !== undefined ? Number(p.entry) : 0;
        const entryZone = p.entryZone || {
          min: entryVal,
          max: entryVal,
        };
        return {
          id: d.id,
          ...p,
          entryZone,
        } as Plan;
      });
      setPlans(rawPlans);
    }, handleError);

    // 3. Listen to capital settings
    const unsubCapital = onSnapshot(doc(db, 'settings', 'capital'), (d) => {
      if (d.exists()) {
        const data = d.data();
        setCapitalInvestment(data.investment || defaultCapital.investment);
        setCapitalSpeculation(data.speculation || defaultCapital.speculation);
      }
    }, handleError);

    return () => {
      unsubTrades();
      unsubPlans();
      unsubCapital();
    };
  }, []);

  // Backwards compatibility legacy `trades`
  const trades = useMemo(() => {
    return positions.map(positionToLegacyTrade);
  }, [positions]);

  // Aggregate Metrics Computation
  const {
    totalRealizedPnL,
    winRate,
    openPositionsCount,
    wonPositionsCount,
    lostPositionsCount,
    totalOpenCapital,
    totalOpenRisk,
    disciplineScore,
  } = useMemo(() => {
    let sumPnL = 0;
    let wonCount = 0;
    let lostCount = 0;
    let closedCount = 0;
    let openCount = 0;
    let openCapital = 0;
    let openRisk = 0;
    let ruleBreakerCount = 0;

    positions.forEach(pos => {
      const metrics = computePositionMetrics(pos);
      if (pos.status === 'active' && metrics.openShares > 0) {
        openCount++;
        openCapital += metrics.openInvested;
        openRisk += metrics.openRisk;
      }

      if (pos.status === 'closed' || metrics.isFullyClosed) {
        closedCount++;
        sumPnL += metrics.realizedPnL;
        if (metrics.realizedPnL > 0) wonCount++;
        else if (metrics.realizedPnL < 0) lostCount++;
        
        if (pos.journal?.isRuleBreaker) ruleBreakerCount++;
      }
    });

    const calculatedWinRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;
    const score = closedCount > 0 ? Math.max(0, 100 - (ruleBreakerCount * 12)) : 100;

    return {
      totalRealizedPnL: sumPnL,
      winRate: calculatedWinRate,
      openPositionsCount: openCount,
      wonPositionsCount: wonCount,
      lostPositionsCount: lostCount,
      totalOpenCapital: openCapital,
      totalOpenRisk: openRisk,
      disciplineScore: score,
    };
  }, [positions]);

  // CRUD for Positions
  const addPosition = async (posData: Omit<TickerPosition, 'id'>): Promise<string> => {
    const id = Math.random().toString(36).substring(2, 9);
    const newPos: TickerPosition = {
      ...posData,
      id,
      symbol: posData.symbol.toUpperCase(),
      journal: {
        openedDate: Date.now(),
        ...posData.journal,
      }
    };
    await setDoc(doc(db, 'trades', id), newPos);
    return id;
  };

  const updatePosition = async (id: string, data: Partial<TickerPosition>) => {
    await updateDoc(doc(db, 'trades', id), data);
  };

  const deletePosition = async (id: string) => {
    await deleteDoc(doc(db, 'trades', id));
  };

  // Add Buy / Sell partial transaction to a Position
  const addTransaction = async (positionId: string, tx: Omit<Transaction, 'id'>) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const newTxId = 'tx_' + Math.random().toString(36).substring(2, 8);
    const newTx: Transaction = {
      ...tx,
      id: newTxId,
      amount: tx.shares * tx.price,
    };

    const updatedTransactions = [...(pos.transactions || []), newTx];
    
    // Check if after this transaction all shares are sold
    const openShares = computeOpenShares(updatedTransactions);
    const newStatus: TickerPosition['status'] = openShares === 0 ? 'closed' : 'active';
    const realizedPnL = computeRealizedPnL(updatedTransactions);

    const updatePayload: any = {
      transactions: updatedTransactions,
      status: newStatus,
      pnl: realizedPnL,
    };

    if (newStatus === 'closed') {
      updatePayload['journal.closedDate'] = Date.now();
    }

    await updateDoc(doc(db, 'trades', positionId), updatePayload);
  };

  // Delete a transaction from a Position
  const deleteTransaction = async (positionId: string, txId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const updatedTransactions = (pos.transactions || []).filter(t => t.id !== txId);
    const openShares = computeOpenShares(updatedTransactions);
    const newStatus: TickerPosition['status'] = openShares === 0 && updatedTransactions.length > 0 ? 'closed' : 'active';
    const realizedPnL = computeRealizedPnL(updatedTransactions);

    await updateDoc(doc(db, 'trades', positionId), {
      transactions: updatedTransactions,
      status: newStatus,
      pnl: realizedPnL,
    });
  };

  // Close Position completely by selling all remaining shares
  const closePosition = async (
    id: string, 
    exitPrice: number, 
    emotion?: string, 
    lessonLearned?: string, 
    mistake?: string
  ) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;

    const openShares = computeOpenShares(pos.transactions);
    const exitDate = Date.now();

    const sellTx: Transaction = {
      id: 'exit_' + Math.random().toString(36).substring(2, 8),
      type: 'sell',
      date: exitDate,
      price: exitPrice,
      shares: openShares > 0 ? openShares : computeWeightedAvgEntry(pos.transactions),
      amount: exitPrice * (openShares > 0 ? openShares : 1),
      note: 'إغلاق وتصفية المركز',
    };

    const updatedTransactions = [...pos.transactions, sellTx];
    const realizedPnL = computeRealizedPnL(updatedTransactions);

    await updateDoc(doc(db, 'trades', id), {
      status: 'closed',
      transactions: updatedTransactions,
      pnl: realizedPnL,
      'journal.emotion': emotion || pos.journal?.emotion || 'neutral',
      'journal.lessonLearned': lessonLearned || pos.journal?.lessonLearned || '',
      'journal.mistake': mistake || pos.journal?.mistake || '',
      'journal.closedDate': exitDate,
      exitPrice,
      exitDate,
    });
  };

  const updateTrailingStop = async (id: string, highestPrice: number, newStopLoss: number) => {
    await updateDoc(doc(db, 'trades', id), {
      'trailingStop.highestReached': highestPrice,
      'trailingStop.current': newStopLoss,
      highestPrice,
      currentStopLoss: newStopLoss,
    });
  };

  // Convert Watchlist Plan into an Active Ticker Position
  const convertPlanToPosition = async (plan: Plan, initialPrice?: number, initialShares?: number): Promise<string> => {
    const price = initialPrice || plan.entryZone.min || plan.entry || 0;
    const shares = initialShares || 100;
    
    const initialTx: Transaction = {
      id: 'tx_init_' + Math.random().toString(36).substring(2, 8),
      type: 'buy',
      date: Date.now(),
      price,
      shares,
      amount: price * shares,
      note: 'تنفيذ خطة المراقبة (شراء أولي)',
    };

    const posId = await addPosition({
      symbol: plan.symbol,
      portfolioType: 'investment',
      status: 'active',
      plan: {
        strategy: plan.strategy,
        entryZone: plan.entryZone,
        target: plan.target,
        stop: plan.stop,
        atr: plan.atr || 0,
      },
      transactions: [initialTx],
      trailingStop: {
        initial: plan.stop,
        current: plan.stop,
        highestReached: price,
        atrAtEntry: plan.atr || 0,
      },
      journal: {
        openedDate: Date.now(),
        tags: [plan.strategy].filter(Boolean),
        isRuleBreaker: false,
      },
    });

    return posId;
  };

  // Legacy wrappers for existing callers
  const addTrade = async (tradeData: any) => {
    const entry = Number(tradeData.entryPrice) || 0;
    const shares = Number(tradeData.shares) || 0;
    const sl = Number(tradeData.initialStopLoss) || 0;
    const target = Number(tradeData.targetPrice) || 0;
    const atr = Number(tradeData.atrAtEntry) || 0;

    const initialTx: Transaction = {
      id: 'tx_init_' + Math.random().toString(36).substring(2, 8),
      type: 'buy',
      date: Date.now(),
      price: entry,
      shares: shares,
      amount: entry * shares,
      note: 'شراء أولي',
    };

    await addPosition({
      symbol: tradeData.symbol,
      portfolioType: tradeData.portfolioType || 'investment',
      status: 'active',
      plan: {
        strategy: tradeData.makerPlan || '',
        entryZone: { min: entry, max: entry },
        target,
        stop: sl,
        atr,
        checklist: tradeData.checklist,
        images: tradeData.images || [],
        makerPlan: tradeData.makerPlan || '',
      },
      transactions: [initialTx],
      trailingStop: {
        initial: sl,
        current: tradeData.currentStopLoss || sl,
        highestReached: tradeData.highestPrice || entry,
        atrAtEntry: atr,
      },
      journal: {
        openedDate: Date.now(),
        emotion: tradeData.emotion || 'neutral',
        lessonLearned: tradeData.lessonLearned || '',
        mistake: tradeData.mistake || '',
        tags: tradeData.tags || [],
        isRuleBreaker: tradeData.isRuleBreaker || false,
      }
    });
  };

  const updateTrade = async (id: string, data: any) => {
    await updateDoc(doc(db, 'trades', id), data);
  };

  const deleteTrade = async (id: string) => {
    await deletePosition(id);
  };

  const closeTrade = async (id: string, exitPrice: number, emotion?: any, lessonLearned?: string, mistake?: string) => {
    await closePosition(id, exitPrice, emotion, lessonLearned, mistake);
  };

  // Plan CRUD
  const addPlan = async (plan: Plan) => {
    const id = plan.id || Math.random().toString(36).substring(2, 9);
    await setDoc(doc(db, 'plans', id), {
      ...plan,
      id,
      symbol: plan.symbol.toUpperCase(),
      createdAt: Date.now(),
    });
  };

  const updatePlan = async (id: string, planData: Partial<Plan>) => {
    await updateDoc(doc(db, 'plans', id), planData);
  };

  const deletePlan = async (id: string) => {
    await deleteDoc(doc(db, 'plans', id));
  };

  const updateCapital = async (investment: number, speculation: number) => {
    await setDoc(doc(db, 'settings', 'capital'), { investment, speculation }, { merge: true });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 gap-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-lg text-slate-600">جاري مزامنة بيانات التداول مع السحابة...</p>
      </div>
    );
  }

  return (
    <TradeContext.Provider value={{
      positions,
      trades,
      addPosition,
      updatePosition,
      deletePosition,
      closePosition,
      addTransaction,
      deleteTransaction,
      updateTrailingStop,
      addTrade,
      updateTrade,
      deleteTrade,
      closeTrade,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
      convertPlanToPosition,
      capitalInvestment,
      capitalSpeculation,
      updateCapital,
      totalRealizedPnL,
      winRate,
      openPositionsCount,
      wonPositionsCount,
      lostPositionsCount,
      totalOpenCapital,
      totalOpenRisk,
      disciplineScore,
      loading,
    }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
}
