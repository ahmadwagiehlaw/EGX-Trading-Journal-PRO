import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('egx_trades');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('egx_trades', JSON.stringify(trades));
  }, [trades]);

  const addTrade = (tradeData: Omit<Trade, 'id' | 'entryDate'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: Math.random().toString(36).substring(2, 9),
      entryDate: Date.now(),
    };
    setTrades(prev => [newTrade, ...prev]);
  };

  const updateTrade = (id: string, data: Partial<Trade>) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const closeTrade = (id: string, exitPrice: number, emotion?: any, lessonLearned?: string, mistake?: string) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        const pnl = (exitPrice - t.entryPrice) * t.shares;
        let status: Trade['status'] = 'breakeven';
        if (pnl > 0) status = 'won';
        if (pnl < 0) status = 'lost';
        
        return { ...t, exitPrice, exitDate: Date.now(), pnl, status, emotion, lessonLearned, mistake };
      }
      return t;
    }));
  };

  const updateTrailingStop = (id: string, highestPrice: number, newStopLoss: number) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, highestPrice, currentStopLoss: newStopLoss };
      }
      return t;
    }));
  };

  const [capitalInvestment, setCapitalInvestment] = useState<number>(() => {
    const saved = localStorage.getItem('egx_capital_investment');
    return saved ? parseFloat(saved) : defaultCapital.investment;
  });

  const [capitalSpeculation, setCapitalSpeculation] = useState<number>(() => {
    const saved = localStorage.getItem('egx_capital_speculation');
    return saved ? parseFloat(saved) : defaultCapital.speculation;
  });

  useEffect(() => {
    localStorage.setItem('egx_capital_investment', capitalInvestment.toString());
    localStorage.setItem('egx_capital_speculation', capitalSpeculation.toString());
  }, [capitalInvestment, capitalSpeculation]);

  const updateCapital = (inv: number, spec: number) => {
    setCapitalInvestment(inv);
    setCapitalSpeculation(spec);
  };

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('egx_plans');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', symbol: 'COMI', strategy: 'اختراق مقاومة', entry: 75.00, target: 82.00, stop: 72.00, status: 'ready', updates: [{ id: 'u1', text: 'انتظار إغلاق شمعة ساعة فوق 75 للتأكيد...', image: '' }] },
      { id: '2', symbol: 'FAIT', strategy: 'ارتداد من دعم', entry: 1.50, target: 1.80, stop: 1.40, status: 'waiting', updates: [{ id: 'u2', text: 'السهم عند منطقة طلب قوية جداً على اليومي.', image: '' }] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('egx_plans', JSON.stringify(plans));
  }, [plans]);

  const addPlan = (plan: Plan) => {
    setPlans(prev => [plan, ...prev]);
  };

  const updatePlan = (id: string, planData: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...planData } : p));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

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
