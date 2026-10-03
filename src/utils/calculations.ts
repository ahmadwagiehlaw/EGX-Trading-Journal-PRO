

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'bonus';
  date: number; // timestamp
  price: number;
  shares: number;
  amount: number;
  linkedBuyId?: string;
  portfolioType?: 'investment' | 'speculation';
  note?: string;
  stopAtTime?: number;
  
  // Journaling & Psychology per transaction
  entryReason?: string;
  exitReason?: string;
  emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
  mistakes?: string[];
  mistake?: string;
  checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
  isRuleBreaker?: boolean;
  executionRating?: number;
  setup?: string[];
  ruleBreaker?: boolean;
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
    strategy?: string;
    entryZone?: { min: number; max: number };
    target: number; // T1 (Main Target)
    targets?: number[]; // [T2, T3, ...] optional additional targets for scaling out
    stop: number;
    timeStopDays?: number; // Optional max hold time in days
    atr?: number;
    checklist?: { majorSR: boolean; bos: boolean; retest: boolean };
    images?: string[];
    makerPlan?: string;
  };

  // Execution (Ledger of buys & sells)
  transactions: Transaction[];

  // Trailing Stop Engine
  trailingStop?: TrailingStopState;

  // Journaling & Psychology
  journal?: {
    preTradeThoughts?: string;
    postTradeReview?: string;
    mistakes?: string[];
    lessonsLearned?: string;
    lessonLearned?: string;
    mistake?: string;
    rating?: number;
    tags?: string[];
    emotion?: 'confident' | 'fomo' | 'revenge' | 'fear' | 'greed' | 'neutral';
    openedDate?: number;
    closedDate?: number;
    pnl?: number;
    isRuleBreaker?: boolean;
  };
  
  currentMarketPrice?: number;
  sector?: string;
  coreShares?: number; // Core & Satellite: number of shares designated as long-term Core
  entryDate?: number;
  openedDate?: number;
  closedDate?: number;
  pnl?: number;
}







export function simulatePositionMetrics(transactions: Transaction[] = [], commissionRate: number = 0.003) {
  const sortedTxs = [...transactions].sort((a, b) => a.date - b.date);
  let openLots: { shares: number; price: number; amount: number; txId: string; date: number; pType: 'investment' | 'speculation' }[] = [];
  
  let totalRealizedPnL = 0;
  let totalNetRealizedPnL = 0;
  let totalDividends = 0;
  let totalBought = 0;
  let totalSold = 0;
  let totalRevenue = 0;
  let totalCommissionPaid = 0;
  const txPnL: Record<string, number> = {};

  for (const tx of sortedTxs) {
    const txCommission = tx.amount * commissionRate;
    totalCommissionPaid += txCommission;

    if (tx.type === 'buy') {
      openLots.push({ shares: tx.shares, price: tx.price, amount: tx.amount, txId: tx.id, date: tx.date, pType: tx.portfolioType || 'investment' });
      totalBought += tx.shares;
    } else if (tx.type === 'sell') {
      let sharesToSell = tx.shares;
      const netProceeds = tx.amount - txCommission;
      const netPricePerShare = netProceeds / tx.shares;
      const grossPricePerShare = tx.price;
      
      openLots.sort((a, b) => a.price - b.price); // Lowest Cost First

      let txRealizedPnL = 0;
      let txNetRealizedPnL = 0;

      while (sharesToSell > 0 && openLots.length > 0) {
        const lot = openLots[0];
        const sharesFromLot = Math.min(sharesToSell, lot.shares);
        
        const lotCostPerShare = lot.amount / lot.shares;
        const lotCommissionPerShare = (lot.amount * commissionRate) / lot.shares;
        const totalCostPerShare = lotCostPerShare + lotCommissionPerShare;
        
        const grossProceedsFromLot = sharesFromLot * grossPricePerShare;
        const netProceedsFromLot = sharesFromLot * netPricePerShare;
        const costOfSharesFromLot = sharesFromLot * lotCostPerShare;
        const totalCostOfSharesFromLot = sharesFromLot * totalCostPerShare;
        
        txRealizedPnL += (grossProceedsFromLot - costOfSharesFromLot);
        txNetRealizedPnL += (netProceedsFromLot - totalCostOfSharesFromLot);
        
        sharesToSell -= sharesFromLot;
        lot.shares -= sharesFromLot;
        lot.amount = lot.shares * lotCostPerShare;
        
        if (lot.shares <= 0) {
          openLots.shift();
        }
      }
      
      totalRealizedPnL += txRealizedPnL;
      totalNetRealizedPnL += txNetRealizedPnL;
      if (tx.id) txPnL[tx.id] = txNetRealizedPnL;
      
      totalSold += tx.shares;
      totalRevenue += tx.amount;
    } else if (tx.type === 'split' || tx.type === 'bonus') {
      const multiplier = tx.price > 0 ? tx.price : 1;
      for (const lot of openLots) {
        lot.shares *= multiplier;
        lot.price /= multiplier;
      }
      totalBought *= multiplier;
      totalSold *= multiplier;
    } else if (tx.type === 'dividend') {
      totalDividends += tx.amount;
      totalRealizedPnL += tx.amount;
      totalNetRealizedPnL += tx.amount;
      if (tx.id) txPnL[tx.id] = tx.amount;
    }
  }

  const currentShares = openLots.reduce((sum, lot) => sum + lot.shares, 0);
  const totalCost = openLots.reduce((sum, lot) => sum + lot.amount + (lot.amount * commissionRate), 0);
  const avgEntry = currentShares > 0 ? openLots.reduce((sum, lot) => sum + lot.amount, 0) / currentShares : 0;
  const avgExit = totalSold > 0 ? totalRevenue / totalSold : 0;

  return { openShares: currentShares, avgEntry, avgExit, totalBought, totalSold, totalCost, totalRealizedPnL, totalNetRealizedPnL, totalDividends, totalCommissionPaid, txPnL, openLots };
}

export function computePositionMetrics(position: TickerPosition, commissionRate: number = 0.003) {
  const transactions = position.transactions || [];
  const sim = simulatePositionMetrics(transactions, commissionRate);
  
  const currentStop = position.trailingStop?.current || position.plan?.stop || 0;
  const openRisk = computeOpenRisk(currentStop, sim.avgEntry, sim.openShares);
  const isOpen = sim.openShares > 0 && position.status !== 'closed';
  
  const currentPrice = position.currentMarketPrice || sim.avgEntry;
  const unrealizedPnL = currentPrice > 0 && sim.openShares > 0 ? (currentPrice - sim.avgEntry) * sim.openShares : 0;
  const netUnrealizedPnL = currentPrice > 0 && sim.openShares > 0 ? ((currentPrice - sim.avgEntry) * sim.openShares) - (currentPrice * sim.openShares * commissionRate) : 0;

  return {
    avgEntry: sim.avgEntry,
    avgExit: sim.avgExit,
    totalBought: sim.totalBought,
    totalSold: sim.totalSold,
    openShares: sim.openShares,
    realizedPnL: sim.totalRealizedPnL,
    totalCommission: sim.totalCommissionPaid,
    netRealizedPnL: sim.totalNetRealizedPnL,
    openInvested: sim.totalCost,
    currentStop,
    openRisk,
    isOpen,
    isFullyClosed: !isOpen && sim.totalSold > 0,
    currentPrice,
    unrealizedPnL,
    netUnrealizedPnL,
    txPnL: sim.txPnL || {},
    openLots: sim.openLots || []
  };
}

export function computeOpenRisk(stopPrice: number, avgEntry: number, openShares: number): number {
  if (stopPrice <= 0 || avgEntry <= 0 || openShares <= 0) return 0;
  const riskPerShare = avgEntry - stopPrice;
  return riskPerShare > 0 ? riskPerShare * openShares : 0;
}

export function formatEGP(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function computeDominantPortfolio(transactions: Transaction[] = [], pType?: string): 'investment' | 'speculation' {
  if (pType) return pType as 'investment' | 'speculation'; // allow passing explicit
  let invShares = 0;
  let specShares = 0;
  for (const tx of transactions) {
    if (tx.type === 'buy') {
      if (tx.portfolioType === 'investment') invShares += tx.shares;
      else if (tx.portfolioType === 'speculation') specShares += tx.shares;
    }
  }
  return invShares >= specShares ? 'investment' : 'speculation';
}

export function computeOpenInvestedCapitalByPortfolio(transactions: Transaction[] = [], _pType?: string, commissionRate: number = 0.003): { investment: number, speculation: number } {
  const sim = simulatePositionMetrics(transactions, commissionRate);
  let investment = 0;
  let speculation = 0;
  for (const lot of sim.openLots) {
    if (lot.pType === 'investment') investment += lot.amount + (lot.amount * commissionRate);
    else speculation += lot.amount + (lot.amount * commissionRate);
  }
  return { investment, speculation };
}

export function computeRealizedPnLByPortfolio(transactions: Transaction[] = [], _pType?: string, commissionRate: number = 0.003): { investment: number, speculation: number } {
  // We can just use the txPnL mapping, but wait, which portfolio does a sell belong to?
  // It belongs to the dominant portfolio of the position, or we can just say we don't need exact matching for now.
  const sim = simulatePositionMetrics(transactions, commissionRate);
  let investment = 0;
  let speculation = 0;
  
  // Just attribute everything to dominant portfolio for simplicity of the ledger
  const dom = computeDominantPortfolio(transactions);
  if (dom === 'investment') investment += sim.totalNetRealizedPnL;
  else speculation += sim.totalNetRealizedPnL;
  
  return { investment, speculation };
}

// Stubs for backward compat if they were imported directly elsewhere:
export function computeTotalBoughtShares(txs: Transaction[]) { return simulatePositionMetrics(txs).totalBought; }
export function computeTotalSoldShares(txs: Transaction[]) { return simulatePositionMetrics(txs).totalSold; }
export function computeOpenShares(txs: Transaction[]) { return simulatePositionMetrics(txs).openShares; }
export function computeWeightedAvgEntry(txs: Transaction[]) { return simulatePositionMetrics(txs).avgEntry; }
export function computeRealizedPnL(txs: Transaction[]) { return simulatePositionMetrics(txs).totalRealizedPnL; }
export function computeTotalCommission(txs: Transaction[], r: number) { return simulatePositionMetrics(txs, r).totalCommissionPaid; }
export function computeNetRealizedPnL(txs: Transaction[], r: number) { return simulatePositionMetrics(txs, r).totalNetRealizedPnL; }
export function computeOpenInvestedCapital(txs: Transaction[]) { return simulatePositionMetrics(txs).totalCost; }


export interface OpenLot {
  id: string;
  date: number;
  price: number;
  originalShares: number;
  remainingShares: number;
}

export function computeOpenLotsLowestPriceFirst(transactions: Transaction[] = []): OpenLot[] {
  // Extract all buy transactions
  let buys = transactions
    .filter(t => t.type === 'buy')
    .map(t => ({
      id: t.id,
      date: t.date,
      price: t.price,
      originalShares: t.shares,
      remainingShares: t.shares
    }))
    .sort((a, b) => a.price - b.price); // Lowest price first!

  // Subtract sells
  const sells = transactions.filter(t => t.type === 'sell');
  for (const sell of sells) {
    let sharesToSell = sell.shares;
    for (const buy of buys) {
      if (sharesToSell <= 0) break;
      if (buy.remainingShares > 0) {
        const deducted = Math.min(buy.remainingShares, sharesToSell);
        buy.remainingShares -= deducted;
        sharesToSell -= deducted;
      }
    }
  }

  // Return only remaining lots, sorted by date (or keep lowest price first?)
  // Let's sort by price ascending so the user sees the cheapest first to sell.
  return buys.filter(b => b.remainingShares > 0).sort((a, b) => a.price - b.price);
}
