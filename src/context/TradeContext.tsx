import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { type PlanUpdate } from '../components/PlanUpdatesFeed';

export interface Trade {
  id: string;
  symbol: string;
  portfolioType: 'investment' | 'speculation';
  status: 'open' | 'won' | 'lost' | 'breakeven';
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
  entryDate: number; // timestamp
  exitPrice?: number;
  exitDate?: number;
  pnl?: number;
  isRuleBreaker?: boolean;
  emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
  lessonLearned?: string;
  mistake?: string;
}

export interface Plan {
  id: string;
  symbol: string;
  strategy: string;
  entry: number;
  target: number;
  stop: number;
  status: 'waiting' | 'ready';
  updates: PlanUpdate[];
}

interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'entryDate'>) => void;
  updateTrade: (id: string, trade: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  closeTrade: (id: string, exitPrice: number, emotion?: string, lessonLearned?: string, mistake?: string) => void;
  updateTrailingStop: (id: string, highestPrice: number, newStopLoss: number) => void;
  capitalInvestment: number;
  capitalSpeculation: number;
  updateCapital: (inv: number, spec: number) => void;
  plans: Plan[];
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
}

const defaultCapital = { investment: 1000000, speculation: 100000 };

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [capitalInvestment, setCapitalInvestment] = useState<number>(defaultCapital.investment);
  const [capitalSpeculation, setCapitalSpeculation] = useState<number>(defaultCapital.speculation);
  const [loading, setLoading] = useState(true);

  // Real-time sync with Firestore
  useEffect(() => {
    const handleError = (err: any) => {
      console.error("Firestore sync error:", err);
      setLoading(false); // don't block the UI forever
    };

    const unsubTrades = onSnapshot(collection(db, 'trades'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Trade);
      setTrades(data.sort((a, b) => b.entryDate - a.entryDate));
      setLoading(false);
    }, handleError);

    const unsubPlans = onSnapshot(collection(db, 'plans'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Plan);
      setPlans(data);
    }, handleError);

    const unsubCapital = onSnapshot(doc(db, 'settings', 'capital'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
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

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'entryDate'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newTrade: Trade = { ...tradeData, id, entryDate: Date.now() };
    await setDoc(doc(db, 'trades', id), newTrade);
  };

  const updateTrade = async (id: string, data: Partial<Trade>) => {
    await updateDoc(doc(db, 'trades', id), data);
  };

  const deleteTrade = async (id: string) => {
    await deleteDoc(doc(db, 'trades', id));
  };

  const closeTrade = async (id: string, exitPrice: number, emotion?: any, lessonLearned?: string, mistake?: string) => {
    const trade = trades.find(t => t.id === id);
    if (!trade) return;
    
    const pnl = (exitPrice - trade.entryPrice) * trade.shares;
    let status: Trade['status'] = 'breakeven';
    if (pnl > 0) status = 'won';
    if (pnl < 0) status = 'lost';
    
    await updateDoc(doc(db, 'trades', id), {
      exitPrice, exitDate: Date.now(), pnl, status, emotion, lessonLearned, mistake
    });
  };

  const updateTrailingStop = async (id: string, highestPrice: number, newStopLoss: number) => {
    await updateDoc(doc(db, 'trades', id), { highestPrice, currentStopLoss: newStopLoss });
  };

  const updateCapital = async (investment: number, speculation: number) => {
    await setDoc(doc(db, 'settings', 'capital'), { investment, speculation }, { merge: true });
  };

  const addPlan = async (plan: Plan) => {
    await setDoc(doc(db, 'plans', plan.id), plan);
  };

  const updatePlan = async (id: string, planData: Partial<Plan>) => {
    await updateDoc(doc(db, 'plans', id), planData);
  };

  const deletePlan = async (id: string) => {
    await deleteDoc(doc(db, 'plans', id));
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-white text-blue-600 font-bold text-xl">جاري تحميل البيانات من السحابة...</div>;
  }

  return (
    <TradeContext.Provider value={{
      trades,
      addTrade,
      updateTrade,
      deleteTrade,
      closeTrade,
      updateTrailingStop,
      capitalInvestment,
      capitalSpeculation,
      updateCapital,
      plans,
      addPlan,
      updatePlan,
      deletePlan,
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
