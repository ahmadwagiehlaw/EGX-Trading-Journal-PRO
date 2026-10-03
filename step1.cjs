const fs = require('fs');
let c = fs.readFileSync('src/utils/calculations.ts', 'utf8');
c = c.replace("  atrAtEntry: number;\n}", "  atrAtEntry: number;\n  atrMultiplier?: number; // Chandelier multiplier (default 2)\n}");
if (!c.includes('atrMultiplier')) { console.log('interface patch failed'); process.exit(1); }
c += `

export type StopStatus = 'broken' | 'raise' | 'near' | 'locked' | 'ok' | 'none';

export interface StopAnalytics {
  initialStop: number;
  planIssue: string | null;
  rMultiple: number | null;
  rr: number | null;
  capitalAtRisk: number;
  capitalAtRiskPct: number;
  lockedProfit: number;
  givebackAtStop: number;
  stopDistanceAtr: number | null;
  stopDistancePct: number;
  drawdownFromPeak: number;
  peak: number;
  daysHeld: number | null;
  atr: number;
  atrMultiplier: number;
  chandelierStop: number | null;
  breakevenStop: number;
  status: StopStatus;
  maxSharesByRisk: number | null;
  riskAmountAllowed: number;
  isOversized: boolean;
  weightPct: number | null;
}

/**
 * Single source of truth for stop / risk indicators.
 * Everything here is DERIVED from transactions + plan + trailing stop. Nothing is stored.
 */
export function computeStopAnalytics(
  position: TickerPosition,
  metrics: ReturnType<typeof computePositionMetrics>,
  opts: { riskPct: number; capital: number; commissionRate?: number }
): StopAnalytics {
  const avg = metrics.avgEntry;
  const price = metrics.currentPrice;
  const stop = metrics.currentStop;
  const shares = metrics.openShares;
  const target = position.plan?.target || 0;
  const commission = opts.commissionRate ?? 0.003;

  const initialStop = position.plan?.stop || position.trailingStop?.initial || 0;
  let planIssue: string | null = null;
  if (initialStop > 0 && avg > 0 && initialStop >= avg) {
    planIssue = 'وقف الخطة المبدئي (' + initialStop.toFixed(2) + ') أعلى من أو يساوي متوسط الدخول (' + avg.toFixed(2) + ') — راجع الخطة.';
  } else if (target > 0 && avg > 0 && target <= avg) {
    planIssue = 'هدف الخطة (' + target.toFixed(2) + ') أقل من أو يساوي متوسط الدخول (' + avg.toFixed(2) + ') — راجع الخطة.';
  }

  const planValid = initialStop > 0 && initialStop < avg;
  const initialRiskPerShare = planValid ? avg - initialStop : 0;
  const rMultiple = initialRiskPerShare > 0 && price > 0 ? (price - avg) / initialRiskPerShare : null;
  const rr = target > price && price > stop && stop > 0 ? (target - price) / (price - stop) : null;

  const capitalAtRisk = stop > 0 && stop < avg ? (avg - stop) * shares : 0;
  const cost = avg * shares;
  const capitalAtRiskPct = cost > 0 ? (capitalAtRisk / cost) * 100 : 0;
  const lockedProfit = stop > avg ? (stop - avg) * shares : 0;
  const givebackAtStop = stop > 0 && price > stop ? (price - stop) * shares : 0;

  const atr = position.trailingStop?.atrAtEntry || position.plan?.atr || 0;
  const atrMultiplier = position.trailingStop?.atrMultiplier || 2;
  const stopDistanceAtr = atr > 0 && stop > 0 ? (price - stop) / atr : null;
  const stopDistancePct = price > 0 && stop > 0 ? ((price - stop) / price) * 100 : 0;

  const peak = Math.max(position.trailingStop?.highestReached || avg, price);
  const drawdownFromPeak = peak > 0 ? ((peak - price) / peak) * 100 : 0;

  const buyDates = (position.transactions || []).filter(t => t.type === 'buy').map(t => t.date).filter(Boolean);
  const daysHeld = buyDates.length > 0 ? Math.max(0, Math.floor((Date.now() - Math.min(...buyDates)) / 86400000)) : null;

  const chandelierStop = atr > 0 ? peak - atrMultiplier * atr : null;
  const breakevenStop = avg * (1 + 2 * commission);

  let status: StopStatus = 'ok';
  if (!(stop > 0)) status = 'none';
  else if (price > 0 && price <= stop) status = 'broken';
  else if (rMultiple !== null && rMultiple >= 1 && stop < avg) status = 'raise';
  else if ((stopDistanceAtr !== null && stopDistanceAtr < 1) || stopDistancePct < 2) status = 'near';
  else if (stop >= avg) status = 'locked';

  const riskAmountAllowed = opts.capital > 0 ? (opts.capital * opts.riskPct) / 100 : 0;
  const maxSharesByRisk = initialRiskPerShare > 0 && riskAmountAllowed > 0 ? Math.floor(riskAmountAllowed / initialRiskPerShare) : null;
  const isOversized = maxSharesByRisk !== null && shares > maxSharesByRisk * 1.25;
  const weightPct = opts.capital > 0 ? ((price * shares) / opts.capital) * 100 : null;

  return {
    initialStop, planIssue, rMultiple, rr, capitalAtRisk, capitalAtRiskPct, lockedProfit, givebackAtStop,
    stopDistanceAtr, stopDistancePct, drawdownFromPeak, peak, daysHeld, atr, atrMultiplier,
    chandelierStop, breakevenStop, status, maxSharesByRisk, riskAmountAllowed, isOversized, weightPct
  };
}
`;
fs.writeFileSync('src/utils/calculations.ts', c, 'utf8');
console.log('ok');
