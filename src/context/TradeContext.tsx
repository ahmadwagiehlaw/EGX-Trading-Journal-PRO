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
  computeRealizedPnL,
  computeRealizedPnLByPortfolio,
  computeOpenInvestedCapitalByPortfolio
} from '../utils/calculations';

export type { TickerPosition, Transaction };


// Temporary getPath helper to support user isolation later
export function getPath(collectionName: string) {
  return collectionName;
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: number;
  weekEndDate: number;
  pnl: number;
  winRate: number;
  tradesCount: number;
  openedCount?: number;
  closedCount?: number;
  whatWentWell: string;
  whatWentWrong: string;
  focusNextWeek: string;
  disciplineScore?: number;
  marketCondition?: 'bull' | 'bear' | 'sideways' | 'volatile';
  createdAt: number;
}

export interface Plan {
  id: string;
  symbol: string;
  strategy: string;
    checklist?: Record<string, boolean>;
    setupScore?: number;
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

export interface LedgerEntry {
  id: string;
  type: 'deposit' | 'withdrawal' | 'fixed_income_buy' | 'fixed_income_sell';
  amount: number;
  portfolioType: 'investment' | 'speculation';
  date: number;
  note?: string;
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

export interface TradeContextType {
    isSimulator: boolean;
  toggleSimulator: () => void;
  coreSatelliteTarget: number;
  setCoreSatelliteTarget: (val: number) => void;
  coreStats: { coreCapital: number; satelliteCapital: number; corePercent: number; satellitePercent: number; totalInvestmentCapital: number; isBalanced: boolean; };
  portfolioFilter: 'all' | 'investment' | 'speculation';
  setPortfolioFilter: (f: 'all' | 'investment' | 'speculation') => void;
  activeCapital: number;
  activeDeposited: number;
  activeOpenCapital: number;
  activeOpenRisk: number;
  filteredPositions: TickerPosition[];
  // Weekly Reviews
  weeklyReviews: WeeklyReview[];
  addWeeklyReview: (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => Promise<void>;
  updateWeeklyReview: (id: string, data: Partial<WeeklyReview>) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;
  
  stickyNotes: StickyNote[];
  addStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateStickyNote: (id: string, data: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (id: string) => Promise<void>;

  // Positions (Primary Ticker-centric model)
  positions: TickerPosition[];

  addPosition: (pos: Omit<TickerPosition, 'id'>) => Promise<string>;
  updatePosition: (id: string, data: Partial<TickerPosition>) => Promise<void>;
  updateMarketPrice: (id: string, price: number) => Promise<void>;
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
  updateTransaction: (positionId: string, txId: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (positionId: string, txId: string) => Promise<void>;

  // Trailing Stop
  updateTrailingStop: (id: string, highestPrice: number, newStopLoss: number) => Promise<void>;

  // Legacy aliases for seamless migration
  addTrade: (trade: any) => Promise<any>;
  updateTrade: (id: string, trade: any) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  closeTrade: (id: string, exitPrice: number, emotion?: any, lessonLearned?: string, mistake?: string) => Promise<void>;

  // Plans (Watchlist)
  plans: Plan[];
  addPlan: (plan: Plan) => Promise<void>;
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  convertPlanToPosition: (plan: Plan, initialPrice?: number, initialShares?: number) => Promise<string>;

  // Capital & Ledger
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  deleteLedgerEntry: (id: string) => Promise<void>;
  capitalInvestment: number; // Computed from Ledger + PnL
  capitalSpeculation: number; // Computed from Ledger + PnL
  depositedInvestment: number; // Pure deposits
  depositedSpeculation: number; // Pure deposits
  fixedIncome: number;
  updateFixedIncome: (amount: number) => Promise<void>;
  updateCapital: (inv: number, spec: number) => Promise<void>; // Legacy override if needed

  // Computed Aggregated Analytics
  totalRealizedPnL: number;
  totalNetRealizedPnL: number;
  totalCommissionPaid: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  equityData: { trade: string; equity: number; egx30: number; pnl: number; date: number }[];
  openPositionsCount: number;
  wonPositionsCount: number;
  lostPositionsCount: number;
  totalOpenCapital: number;
  totalOpenCapitalInvestment: number;
  totalOpenCapitalSpeculation: number;
  totalOpenRisk: number;
  disciplineScore: number;
  loading: boolean;
  commissionRate: number;
  updateCommissionRate: (rate: number) => Promise<void>;
}

const defaultCapital = { investment: 1000000, speculation: 100000 };
const defaultCommissionRate = 0.003;

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
      currentMarketPrice: raw.currentMarketPrice,
      coreShares: raw.coreShares
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
    entryPrice: metrics.avgEntry || pos.plan?.entryZone?.min || 0,
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
  const [isSimulator, setIsSimulator] = useState(false);
  const toggleSimulator = () => setIsSimulator(!isSimulator);
  const [coreSatelliteTarget, setCoreSatelliteTarget] = useState(75);

  

  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);

  const addWeeklyReview = async (review: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
    const colRef = collection(db, getPath('weekly_reviews'));
    const docRef = doc(colRef);
    const newReview = { ...review, createdAt: Date.now() };
    await setDoc(docRef, newReview);
  };

    const updateWeeklyReview = async (id: string, data: Partial<WeeklyReview>) => {
    await updateDoc(doc(db, getPath('weekly_reviews'), id), data);
  };

const deleteWeeklyReview = async (id: string) => {
    await deleteDoc(doc(db, getPath('weekly_reviews'), id));
  };

  const addStickyNote = async (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const colRef = collection(db, getPath('sticky_notes'));
    const docRef = doc(colRef);
    const newNote = { ...note, createdAt: Date.now(), updatedAt: Date.now() };
    await setDoc(docRef, newNote);
    return docRef.id;
  };
  
  const updateStickyNote = async (id: string, data: Partial<StickyNote>) => {
    await updateDoc(doc(db, getPath('sticky_notes'), id), { ...data, updatedAt: Date.now() });
  };
  
  const deleteStickyNote = async (id: string) => {
    await deleteDoc(doc(db, getPath('sticky_notes'), id));
  };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [legacyInvestmentCap, setLegacyInvestmentCap] = useState<number>(defaultCapital.investment);
  const [legacySpeculationCap, setLegacySpeculationCap] = useState<number>(defaultCapital.speculation);
  const [fixedIncome, setFixedIncomeState] = useState<number>(0);
  const [commissionRate, setCommissionRate] = useState<number>(defaultCommissionRate);
  const [loading, setLoading] = useState(true);
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'investment' | 'speculation'>('all');

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

    // 3. Listen to capital settings (Legacy fallback)
    const unsubCapital = onSnapshot(doc(db, 'settings', 'capital'), (d) => {
      if (d.exists()) {
        const data = d.data();
        setLegacyInvestmentCap(data.investment || defaultCapital.investment);
        setLegacySpeculationCap(data.speculation || defaultCapital.speculation);
        setFixedIncomeState(data.fixedIncome || 0);
        setCommissionRate(data.commissionRate !== undefined ? data.commissionRate : defaultCommissionRate);
      }
    }, handleError);

    // 4. Listen to Ledger entries
    const unsubLedger = onSnapshot(collection(db, 'ledger'), (snapshot) => {
      const entries = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as LedgerEntry));
      entries.sort((a, b) => b.date - a.date);
      setLedger(entries);
    }, handleError);

    // 5. Listen to weekly reviews
    const unsubWeekly = onSnapshot(collection(db, getPath('weekly_reviews')), (snapshot) => {
      const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WeeklyReview));
      reviews.sort((a, b) => b.weekEndDate - a.weekEndDate);
      setWeeklyReviews(reviews);
    }, handleError);
    
    const unsubNotes = onSnapshot(collection(db, getPath('sticky_notes')), (snapshot) => {
      const notes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StickyNote));
      notes.sort((a, b) => b.updatedAt - a.updatedAt);
      setStickyNotes(notes);
    }, handleError);

    return () => {
      unsubTrades();
      unsubPlans();
      unsubCapital();
      unsubWeekly();
      unsubNotes();
      unsubLedger();
    };
  }, []);

  // Backwards compatibility legacy `trades`
  const trades = useMemo(() => {
    return positions.map(positionToLegacyTrade);
  }, [positions]);

  const {
    totalRealizedPnL,
    totalNetRealizedPnL,
    totalCommissionPaid,
    winRate,
    profitFactor,
    maxDrawdown,
    equityData,
    openPositionsCount,
    wonPositionsCount,
    lostPositionsCount,
    totalOpenCapital,
    totalOpenCapitalInvestment,
    totalOpenCapitalSpeculation,
    totalOpenRisk,
    disciplineScore,
  } = useMemo(() => {
    let sumPnL = 0;
    let sumNetPnL = 0;
    let sumCommission = 0;
    let wonCount = 0;
    let lostCount = 0;
    let closedCount = 0;
    let openCount = 0;
    let openCapital = 0;
    let openCapitalInv = 0;
    let openCapitalSpec = 0;
    let openRisk = 0;
    let ruleBreakerCount = 0;

    positions.forEach(pos => {
      const metrics = computePositionMetrics(pos, commissionRate);
      
      // Commission applies to ALL transactions, even if position is still active
      sumCommission += metrics.totalCommission;

      if (pos.status === 'active' && metrics.openShares > 0) {
        openCount++;
        openCapital += metrics.openInvested;
        const openSplit = computeOpenInvestedCapitalByPortfolio(pos.transactions, pos.portfolioType, commissionRate);
        openCapitalInv += openSplit.investment;
        openCapitalSpec += openSplit.speculation;
        openRisk += metrics.openRisk;
      }

      if (pos.status === 'closed' || metrics.isFullyClosed) {
        closedCount++;
        sumPnL += metrics.realizedPnL;
        sumNetPnL += metrics.netRealizedPnL;
        
        // Decide win/loss based on Net PnL is more accurate
        if (metrics.netRealizedPnL > 0) wonCount++;
        else if (metrics.netRealizedPnL < 0) lostCount++;
        
        if (pos.journal?.isRuleBreaker) ruleBreakerCount++;
      } else if (metrics.realizedPnL !== 0) {
        // If partially closed, add its realized PnL too!
        sumPnL += metrics.realizedPnL;
        sumNetPnL += metrics.netRealizedPnL;
      }
    });

    // Compute Profit Factor
    let grossProfit = 0;
    let grossLoss = 0;
    positions.forEach(pos => {
      const metrics = computePositionMetrics(pos, commissionRate);
      if (metrics.netRealizedPnL > 0) grossProfit += metrics.netRealizedPnL;
      else if (metrics.netRealizedPnL < 0) grossLoss += Math.abs(metrics.netRealizedPnL);
    });
    const computedProfitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);

    const calculatedWinRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;
    const score = closedCount > 0 ? Math.max(0, 100 - (ruleBreakerCount * 12)) : 100;

    // Compute Equity Curve & Max Drawdown
    let allTx: { trade: string, pnl: number, date: number }[] = [];
    positions.forEach(pos => {
      // Very rough timeline using the sell dates. 
      // A more exact simulation would reconstruct the exact net PnL event by event.
      // But for a fast equity curve, we just record the PnL at the time of each 'sell' or 'dividend'
      if (!pos.transactions) return;
      const metrics = computePositionMetrics(pos, commissionRate);
      // Fallback: just put the whole position PnL on its last transaction date
      if (metrics.netRealizedPnL !== 0 && pos.transactions.length > 0) {
        const lastTxDate = pos.transactions[pos.transactions.length - 1].date;
        allTx.push({ trade: pos.symbol, pnl: metrics.netRealizedPnL, date: lastTxDate });
      }
    });

    allTx.sort((a, b) => a.date - b.date);

    let currentEquity = 100000; // Starting baseline just for charting % changes
    let peakEquity = currentEquity;
    let maxDD = 0;
    
    // Mock EGX30 start
    let currentEGX30 = 100000; 

    const computedEquityData = allTx.map((tx, i) => {
      currentEquity += tx.pnl;
      if (currentEquity > peakEquity) peakEquity = currentEquity;
      const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
      if (drawdown > maxDD) maxDD = drawdown;
      
      // Simulate random market movement for EGX30 benchamrk (between -1.5% and +2%)
      const marketMove = (Math.random() * 0.035) - 0.015;
      if (i > 0) {
        currentEGX30 = currentEGX30 * (1 + marketMove);
      }

      return { trade: tx.trade, equity: currentEquity, egx30: currentEGX30, pnl: tx.pnl, date: tx.date };
    });

    return {
      totalRealizedPnL: sumPnL,
      totalNetRealizedPnL: sumNetPnL,
      totalCommissionPaid: sumCommission,
      winRate: calculatedWinRate,
      profitFactor: computedProfitFactor,
      maxDrawdown: maxDD,
      equityData: computedEquityData,
      openPositionsCount: openCount,
      wonPositionsCount: wonCount,
      lostPositionsCount: lostCount,
      totalOpenCapital: openCapital,
      totalOpenCapitalInvestment: openCapitalInv,
      totalOpenCapitalSpeculation: openCapitalSpec,
      totalOpenRisk: openRisk,
      disciplineScore: score,
    };
  }, [positions, commissionRate]);

  

  // Compute Capital (Deposits vs Equity)
  const { depositedInvestment, depositedSpeculation, capitalInvestment, capitalSpeculation } = useMemo(() => {
    // 1. Calculate pure deposited capital from ledger
    let depInv = 0;
    let depSpec = 0;
    
    if (ledger.length > 0) {
      ledger.forEach(entry => {
        if (entry.portfolioType === 'investment') {
          if (entry.type === 'deposit') depInv += entry.amount;
          if (entry.type === 'withdrawal') depInv -= entry.amount;
        } else {
          if (entry.type === 'deposit') depSpec += entry.amount;
          if (entry.type === 'withdrawal') depSpec -= entry.amount;
        }
      });
    } else {
      // Fallback to legacy if ledger is empty
      depInv = legacyInvestmentCap;
      depSpec = legacySpeculationCap;
    }

    // 2. Calculate PnL per portfolio
    let pnlInv = 0;
    let pnlSpec = 0;
    positions.forEach(pos => {
      // Aggregate Realized PnL based on transaction-level portfolio attribution
      const pnlSplit = computeRealizedPnLByPortfolio(pos.transactions || [], pos.portfolioType, commissionRate);
      pnlInv += pnlSplit.investment;
      pnlSpec += pnlSplit.speculation;
    });

    // 3. Total Equity = Deposited + PnL
    return {
      depositedInvestment: depInv,
      depositedSpeculation: depSpec,
      capitalInvestment: depInv + pnlInv,
      capitalSpeculation: depSpec + pnlSpec,
    };
  }, [ledger, positions, legacyInvestmentCap, legacySpeculationCap]);

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

  const updateMarketPrice = async (id: string, price: number) => {
    await updatePosition(id, { currentMarketPrice: price });
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

    // If this is the FIRST transaction, sync the openedDate to the transaction date
    if ((!pos.transactions || pos.transactions.length === 0) && newTx.type === 'buy') {
      updatePayload['journal.openedDate'] = newTx.date;
    }

    // If position closed, sync the closedDate to the transaction date
    if (newStatus === 'closed') {
      updatePayload['journal.closedDate'] = newTx.date;
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

  // Update a transaction
  const updateTransaction = async (positionId: string, txId: string, data: Partial<Transaction>) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const updatedTransactions = (pos.transactions || []).map(t => {
      if (t.id === txId) {
        const updatedTx = { ...t, ...data };
        // Recalculate amount if shares or price changed
        if (data.shares !== undefined || data.price !== undefined) {
          updatedTx.amount = updatedTx.shares * updatedTx.price;
        }
        return updatedTx;
      }
      return t;
    });

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

  // Legacy aliases omitted here as they are provided in context value directly

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
  
  const updateCommissionRate = async (rate: number) => {
    await setDoc(doc(db, 'settings', 'capital'), { commissionRate: rate }, { merge: true });
  };

  // Ledger CRUD
  const addLedgerEntry = async (entry: Omit<LedgerEntry, 'id'>) => {
    const id = 'ldg_' + Math.random().toString(36).substring(2, 9);
    await setDoc(doc(db, 'ledger', id), { ...entry, id });
  };

  const deleteLedgerEntry = async (id: string) => {
    await deleteDoc(doc(db, 'ledger', id));
  };

  const updateFixedIncome = async (amount: number) => {
    await setDoc(doc(db, 'settings', 'capital'), { fixedIncome: amount }, { merge: true });
  };

  
  const filteredPositions = useMemo(() => {
    if (portfolioFilter === 'all') return positions;
    return positions.filter(p => p.portfolioType === portfolioFilter);
  }, [positions, portfolioFilter]);

  const { activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk } = useMemo(() => {
    if (portfolioFilter === 'investment') {
      return {
        activeCapital: capitalInvestment,
        activeDeposited: depositedInvestment,
        activeOpenCapital: totalOpenCapitalInvestment,
        activeOpenRisk: positions.filter(p => p.portfolioType === 'investment' && p.status === 'active').reduce((acc, p) => {
          const metrics = computePositionMetrics(p, commissionRate);
          const currentStop = metrics.currentStop;
          if (metrics.avgEntry > 0 && currentStop > 0 && currentStop < metrics.avgEntry) {
            return acc + ((metrics.avgEntry - currentStop) * metrics.openShares);
          }
          return acc;
        }, 0)
      };
    }
    if (portfolioFilter === 'speculation') {
      return {
        activeCapital: capitalSpeculation,
        activeDeposited: depositedSpeculation,
        activeOpenCapital: totalOpenCapitalSpeculation,
        activeOpenRisk: positions.filter(p => p.portfolioType === 'speculation' && p.status === 'active').reduce((acc, p) => {
          const metrics = computePositionMetrics(p, commissionRate);
          const currentStop = metrics.currentStop;
          if (metrics.avgEntry > 0 && currentStop > 0 && currentStop < metrics.avgEntry) {
            return acc + ((metrics.avgEntry - currentStop) * metrics.openShares);
          }
          return acc;
        }, 0)
      };
    }
    return {
      activeCapital: capitalInvestment + capitalSpeculation,
      activeDeposited: depositedInvestment + depositedSpeculation,
      activeOpenCapital: totalOpenCapital,
      activeOpenRisk: totalOpenRisk
    };
  }, [portfolioFilter, capitalInvestment, capitalSpeculation, depositedInvestment, depositedSpeculation, totalOpenCapital, totalOpenCapitalInvestment, totalOpenCapitalSpeculation, totalOpenRisk, positions, commissionRate]);

  const coreStats = useMemo(() => {
    const totalInvestmentCapital = capitalInvestment + depositedInvestment + totalOpenCapitalInvestment;
    const coreCapital = positions.filter(p => p.portfolioType === 'investment' && p.plan?.strategy === 'core').reduce((acc, p) => acc + computePositionMetrics(p, commissionRate).openInvested, 0);
    const satelliteCapital = positions.filter(p => p.portfolioType === 'investment' && p.plan?.strategy === 'satellite').reduce((acc, p) => acc + computePositionMetrics(p, commissionRate).openInvested, 0);
    
    const corePercent = totalInvestmentCapital > 0 ? (coreCapital / totalInvestmentCapital) * 100 : 0;
    const satellitePercent = totalInvestmentCapital > 0 ? (satelliteCapital / totalInvestmentCapital) * 100 : 0;
    
    return {
      coreCapital,
      satelliteCapital,
      corePercent,
      satellitePercent,
      totalInvestmentCapital,
      isBalanced: corePercent >= coreSatelliteTarget - 5
    };
  }, [positions, capitalInvestment, depositedInvestment, totalOpenCapitalInvestment, commissionRate, coreSatelliteTarget]);

  const contextValue = useMemo(() => ({
        isSimulator,
    toggleSimulator,
    coreSatelliteTarget,
    setCoreSatelliteTarget,
    coreStats,
    portfolioFilter, setPortfolioFilter,
    activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk,
    filteredPositions,
    weeklyReviews,
    addWeeklyReview,
    updateWeeklyReview,
    deleteWeeklyReview,
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,

    positions,
    trades,
    profitFactor,
    maxDrawdown,
    equityData,
    addPosition,
    updatePosition,
    updateMarketPrice,
    deletePosition,
    closePosition,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateTrailingStop,
    
    // Ledger
    ledger,
    addLedgerEntry,
    deleteLedgerEntry,
    depositedInvestment,
    depositedSpeculation,
    
    // Legacy Aliases
    addTrade: addPosition,
    updateTrade: updatePosition,
    deleteTrade: deletePosition,
    closeTrade: closePosition,
    
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    convertPlanToPosition,
    
    capitalInvestment,
    capitalSpeculation,
    fixedIncome,
    updateFixedIncome,
    updateCapital,
    
    totalRealizedPnL,
    totalNetRealizedPnL,
    totalCommissionPaid,
    winRate,
    openPositionsCount,
    wonPositionsCount,
    lostPositionsCount,
    totalOpenCapital,
    totalOpenCapitalInvestment,
    totalOpenCapitalSpeculation,
    totalOpenRisk,
    disciplineScore,
    loading,
    commissionRate,
    updateCommissionRate
  }), [
    positions, trades, profitFactor, maxDrawdown, equityData, ledger,
    depositedInvestment, depositedSpeculation, plans,
    capitalInvestment, capitalSpeculation, fixedIncome, portfolioFilter, setPortfolioFilter, activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk, filteredPositions, weeklyReviews, stickyNotes,
    totalRealizedPnL, totalNetRealizedPnL, totalCommissionPaid,
    winRate, openPositionsCount, wonPositionsCount, lostPositionsCount,
    totalOpenCapital, totalOpenCapitalInvestment, totalOpenCapitalSpeculation,
    totalOpenRisk, disciplineScore, loading, commissionRate, isSimulator, coreStats, coreSatelliteTarget
  ]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 gap-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-lg text-slate-600">جاري مزامنة بيانات التداول مع السحابة...</p>
      </div>
    );
  }
  return (
    <TradeContext.Provider value={contextValue}>
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
    // 5. Listen to weekly reviews