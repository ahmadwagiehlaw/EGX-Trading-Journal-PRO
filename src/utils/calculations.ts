export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  date: number; // timestamp
  price: number;
  shares: number;
  amount: number;
  note?: string;
  stopAtTime?: number;
}

export interface TrailingStopState {
  initial: number;
  current: number;
  highestReached: number;
  atrAtEntry: number;
}

export interface TickerPosition {
  id: string;
  symbol: string;
  portfolioType: 'investment' | 'speculation';
  status: 'planning' | 'active' | 'closed';
  
  // Strategy & Planning
  plan?: {
    strategy: string;
    entryZone: { min: number; max: number };
    target: number;
    stop: number;
    atr: number;
    checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
    images?: string[];
    makerPlan?: string;
  };

  // Execution (Ledger of buys & sells)
  transactions: Transaction[];

  // Trailing Stop Engine
  trailingStop: TrailingStopState;

  // Journaling & Psychology
  journal?: {
    emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
    lessonLearned?: string;
    mistake?: string;
    tags?: string[];
    isRuleBreaker?: boolean;
    notes?: string;
    openedDate: number;
    closedDate?: number;
  };
  
  // Legacy compatibility fields if needed
  entryDate?: number;
  pnl?: number;
}

/**
 * Calculates the weighted average entry price for a set of transactions.
 */
export function computeWeightedAvgEntry(transactions: Transaction[] = []): number {
  const buyTxs = transactions.filter(t => t.type === 'buy' && t.shares > 0 && t.price > 0);
  if (buyTxs.length === 0) return 0;
  
  const totalCost = buyTxs.reduce((sum, t) => sum + (t.price * t.shares), 0);
  const totalShares = buyTxs.reduce((sum, t) => sum + t.shares, 0);
  
  return totalShares > 0 ? totalCost / totalShares : 0;
}

/**
 * Calculates the weighted average exit price for a set of transactions.
 */
export function computeWeightedAvgExit(transactions: Transaction[] = []): number {
  const sellTxs = transactions.filter(t => t.type === 'sell' && t.shares > 0 && t.price > 0);
  if (sellTxs.length === 0) return 0;
  
  const totalRevenue = sellTxs.reduce((sum, t) => sum + (t.price * t.shares), 0);
  const totalShares = sellTxs.reduce((sum, t) => sum + t.shares, 0);
  
  return totalShares > 0 ? totalRevenue / totalShares : 0;
}

/**
 * Calculates total bought shares.
 */
export function computeTotalBoughtShares(transactions: Transaction[] = []): number {
  return transactions
    .filter(t => t.type === 'buy')
    .reduce((sum, t) => sum + t.shares, 0);
}

/**
 * Calculates total sold shares.
 */
export function computeTotalSoldShares(transactions: Transaction[] = []): number {
  return transactions
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => sum + t.shares, 0);
}

/**
 * Calculates current remaining open shares.
 */
export function computeOpenShares(transactions: Transaction[] = []): number {
  const bought = computeTotalBoughtShares(transactions);
  const sold = computeTotalSoldShares(transactions);
  return Math.max(0, bought - sold);
}

/**
 * Calculates Gross Realized P&L across all closed transactions (FIFO / Weighted Avg basis).
 */
export function computeRealizedPnL(transactions: Transaction[] = []): number {
  const avgEntry = computeWeightedAvgEntry(transactions);
  const sellTxs = transactions.filter(t => t.type === 'sell');
  
  if (sellTxs.length === 0 || avgEntry === 0) return 0;
  
  return sellTxs.reduce((pnl, sell) => {
    return pnl + ((sell.price - avgEntry) * sell.shares);
  }, 0);
}

/**
 * Calculates Total Commission Fees for all transactions based on a rate (e.g. 0.003 = 0.3%).
 */
export function computeTotalCommission(transactions: Transaction[] = [], rate: number = 0.003): number {
  return transactions.reduce((sum, tx) => sum + (tx.amount * rate), 0);
}

/**
 * Calculates Net Realized P&L after deducting broker commission fees and taxes.
 */
export function computeNetRealizedPnL(transactions: Transaction[] = [], commissionRate: number = 0.003): number {
  const grossPnL = computeRealizedPnL(transactions);
  const totalFees = computeTotalCommission(transactions, commissionRate);
  return grossPnL - totalFees;
}

/**
 * Calculates open invested capital currently tied in open shares.
 */
export function computeOpenInvestedCapital(transactions: Transaction[] = []): number {
  const avgEntry = computeWeightedAvgEntry(transactions);
  const openShares = computeOpenShares(transactions);
  return avgEntry * openShares;
}

/**
 * Calculates open risk in EGP based on distance to current stop loss.
 */
export function computeOpenRisk(currentStop: number, avgEntry: number, openShares: number): number {
  if (openShares <= 0 || avgEntry <= 0 || currentStop <= 0) return 0;
  if (currentStop >= avgEntry) return 0; // Stop is above or at breakeven -> Zero risk!
  return (avgEntry - currentStop) * openShares;
}

/**
 * Computes full aggregated metrics for a single TickerPosition.
 */
export function computePositionMetrics(position: TickerPosition, commissionRate: number = 0.003) {
  const transactions = position.transactions || [];
  const avgEntry = computeWeightedAvgEntry(transactions);
  const avgExit = computeWeightedAvgExit(transactions);
  const totalBought = computeTotalBoughtShares(transactions);
  const totalSold = computeTotalSoldShares(transactions);
  const openShares = computeOpenShares(transactions);
  const realizedPnL = computeRealizedPnL(transactions);
  const totalCommission = computeTotalCommission(transactions, commissionRate);
  const netRealizedPnL = computeNetRealizedPnL(transactions, commissionRate);
  const openInvested = computeOpenInvestedCapital(transactions);
  
  const currentStop = position.trailingStop?.current || position.plan?.stop || 0;
  const openRisk = computeOpenRisk(currentStop, avgEntry, openShares);
  const isOpen = openShares > 0 && position.status !== 'closed';

  return {
    avgEntry,
    avgExit,
    totalBought,
    totalSold,
    openShares,
    realizedPnL,
    totalCommission,
    netRealizedPnL,
    openInvested,
    currentStop,
    openRisk,
    isOpen,
    isFullyClosed: !isOpen && totalSold > 0,
  };
}

/**
 * Format currency in Egyptian Pounds (EGP).
 */
export function formatEGP(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '0 EGP';
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} EGP`;
}

/**
 * Format price in 2 decimals.
 */
export function formatPrice(price: number): string {
  if (isNaN(price)) return '0.00';
  return price.toFixed(2);
}
