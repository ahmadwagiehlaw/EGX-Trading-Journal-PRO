p='src/components/TradesJournal.tsx'
s=open(p,encoding='utf-8',newline='').read()
nl='\r\n' if '\r\n' in s else '\n'
a="import ActiveTrades from './ActiveTrades';"
s=s.replace(a,a+nl+"import PortfolioSummary from './PortfolioSummary';",1)
b="      {/* Header Controls & Filters */}"
assert s.count(b)==1
s=s.replace(b,"      {/* Aggregated portfolio performance */}"+nl+"      <PortfolioSummary />"+nl+nl+b)
open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
