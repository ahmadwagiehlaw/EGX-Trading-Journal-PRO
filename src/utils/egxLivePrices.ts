export interface EgxLiveQuote {
  symbol: string;
  close: number;
  change: number; // daily % change
  high: number;
  low: number;
  atr: number;
  rsi: number;
  ema50: number;
  rvol?: number; // relative volume vs 10d avg
  updatedAt: number;
}

const LIVE_QUOTES_CACHE_KEY = 'egx_live_quotes_v1';

export function loadCachedLiveQuotes(): Record<string, EgxLiveQuote> {
  try {
    const raw = localStorage.getItem(LIVE_QUOTES_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveCachedLiveQuotes(quotes: Record<string, EgxLiveQuote>) {
  try {
    localStorage.setItem(LIVE_QUOTES_CACHE_KEY, JSON.stringify(quotes));
  } catch {
    // ignore
  }
}

/**
 * يجلب الأسعار اللحظية والمؤشرات الفنية (Close, Change%, High, Low, ATR, RSI, EMA50)
 * لجميع الأسهم المصرية المطلوبة في طلب واحد مجاني بالكامل بدون API Key أو كوتا.
 */
export async function fetchEgxLiveQuotes(symbols: string[]): Promise<Record<string, EgxLiveQuote>> {
  const cleanSymbols = Array.from(
    new Set(
      symbols
        .map(s => s.trim().toUpperCase().replace(/^EGX:/, ''))
        .filter(Boolean)
    )
  );
  if (!cleanSymbols.length) return {};

  const tickers = cleanSymbols.map(s => `EGX:${s}`);
  const body = JSON.stringify({
    symbols: { tickers },
    columns: ['close', 'change', 'high', 'low', 'ATR', 'RSI', 'EMA50', 'relative_volume_10d_calc'],
  });

  // text/plain avoids CORS preflight and works directly from browser to TradingView Egypt scanner
  const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    throw new Error(`TradingView scanner HTTP ${res.status}`);
  }

  const json = await res.json();
  const rows: { s: string; d: (number | null)[] }[] = json?.data ?? [];
  const now = Date.now();
  const result: Record<string, EgxLiveQuote> = {};

  for (const row of rows) {
    const sym = (row.s || '').replace(/^EGX:/i, '').toUpperCase();
    const d = row.d || [];
    const close = typeof d[0] === 'number' && Number.isFinite(d[0]) ? d[0] : 0;
    if (!sym || close <= 0) continue;

    result[sym] = {
      symbol: sym,
      close,
      change: typeof d[1] === 'number' && Number.isFinite(d[1]) ? d[1] : 0,
      high: typeof d[2] === 'number' && Number.isFinite(d[2]) ? d[2] : close,
      low: typeof d[3] === 'number' && Number.isFinite(d[3]) ? d[3] : close,
      atr: typeof d[4] === 'number' && Number.isFinite(d[4]) ? Number(d[4].toFixed(2)) : 0,
      rsi: typeof d[5] === 'number' && Number.isFinite(d[5]) ? Number(d[5].toFixed(1)) : 0,
      ema50: typeof d[6] === 'number' && Number.isFinite(d[6]) ? Number(d[6].toFixed(2)) : 0,
      rvol: typeof d[7] === 'number' && Number.isFinite(d[7]) ? Number(d[7].toFixed(2)) : undefined,
      updatedAt: now,
    };
  }

  if (Object.keys(result).length > 0) {
    const merged = { ...loadCachedLiveQuotes(), ...result };
    saveCachedLiveQuotes(merged);
  }

  return result;
}
