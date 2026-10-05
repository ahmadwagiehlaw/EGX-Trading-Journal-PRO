p='src/components/ActiveTrades.tsx'
s=open(p,encoding='utf-8',newline='').read()
a="Pin, TrendingUp, Zap"
assert s.count(a)==1
s=s.replace(a,"Pin, TrendingUp, TrendingDown, Zap, Wallet, Landmark, Banknote")
b="} from 'lucide-react';"
i=s.index(b)+len(b)
helper="""

// Compact Arabic number format: 371,505 -> "371.5 ألف", 2,400,000 -> "2.40 مليون"
const fmtCompact = (n: number): string => {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return sign + (a / 1_000_000).toFixed(2) + ' مليون';
  if (a >= 10_000) return sign + (a / 1_000).toFixed(1) + ' ألف';
  return sign + a.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
"""
s=s[:i]+helper+s[i:]
open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
