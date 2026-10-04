# -*- coding: utf-8 -*-
with open('src/context/TradeContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the dependency array of contextValue
old_deps = """  }), [
    positions, trades, profitFactor, maxDrawdown, equityData, ledger,
    depositedInvestment, depositedSpeculation, plans,
    capitalInvestment, capitalSpeculation, fixedIncome, portfolioFilter, setPortfolioFilter, activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk, filteredPositions, weeklyReviews,
    totalRealizedPnL, totalNetRealizedPnL, totalCommissionPaid,
    winRate, openPositionsCount, wonPositionsCount, lostPositionsCount,
    totalOpenCapital, totalOpenCapitalInvestment, totalOpenCapitalSpeculation,
    totalOpenRisk, disciplineScore, loading, commissionRate
  ]);"""

new_deps = """  }), [
    positions, trades, profitFactor, maxDrawdown, equityData, ledger,
    depositedInvestment, depositedSpeculation, plans,
    capitalInvestment, capitalSpeculation, fixedIncome, portfolioFilter, setPortfolioFilter, activeCapital, activeDeposited, activeOpenCapital, activeOpenRisk, filteredPositions, weeklyReviews, stickyNotes,
    totalRealizedPnL, totalNetRealizedPnL, totalCommissionPaid,
    winRate, openPositionsCount, wonPositionsCount, lostPositionsCount,
    totalOpenCapital, totalOpenCapitalInvestment, totalOpenCapitalSpeculation,
    totalOpenRisk, disciplineScore, loading, commissionRate, isSimulator, coreStats, coreSatelliteTarget
  ]);"""

content = content.replace(old_deps, new_deps)

with open('src/context/TradeContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed dependencies in TradeContext.tsx")
