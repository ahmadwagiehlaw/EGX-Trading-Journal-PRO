const fs = require('fs');
let c = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Replace the destructuring block for useTrades in Dashboard to extract the new variables
const oldUseTrades = `    capitalInvestment, 
    positions, 
    totalOpenRisk,
    depositedInvestment,
    fixedIncome,
    totalOpenCapital,
    totalRealizedPnL,
    maxDrawdown,
    openPositionsCount,
    wonPositionsCount,
    lostPositionsCount,
    winRate,
    profitFactor,
    equityData,
    plans,
  } = useTrades();`;

const newUseTrades = `    positions, 
    fixedIncome,
    totalRealizedPnL,
    maxDrawdown,
    openPositionsCount,
    wonPositionsCount,
    lostPositionsCount,
    winRate,
    profitFactor,
    equityData,
    plans,
    portfolioFilter,
    setPortfolioFilter,
    activeCapital,
    activeDeposited,
    activeOpenCapital,
    activeOpenRisk,
    filteredPositions,
  } = useTrades();`;
c = c.replace(/capitalInvestment,[\s\S]*?\} = useTrades\(\);/, newUseTrades);

// 2. Replace the variables used in Dashboard calculations
c = c.replace(/const availableLiquidity = Math\.max\(0, capitalInvestment - totalOpenCapital\);/g, 'const availableLiquidity = Math.max(0, activeCapital - activeOpenCapital);');
c = c.replace(/\{formatEGP\(capitalInvestment\)\}/g, '{formatEGP(activeCapital)}');
c = c.replace(/\{formatEGP\(depositedInvestment, 0\)\}/g, '{formatEGP(activeDeposited, 0)}');
c = c.replace(/capitalInvestment \|\| 1/g, 'activeCapital || 1');
c = c.replace(/totalOpenCapital/g, 'activeOpenCapital');
c = c.replace(/totalOpenRisk/g, 'activeOpenRisk');

// 3. Add the toggle switch to the top of Dashboard
const headerRegex = /<h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">[\s\S]*?<\/h1>/;
const newHeader = `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          لوحة القيادة
        </h1>
        
        {/* Global Portfolio Filter Toggle */}
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => setPortfolioFilter('all')}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition-all \${portfolioFilter === 'all' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
          >
            المحفظة الكلية
          </button>
          <button 
            onClick={() => setPortfolioFilter('investment')}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition-all \${portfolioFilter === 'investment' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
          >
            الاستثمار
          </button>
          <button 
            onClick={() => setPortfolioFilter('speculation')}
            className={\`px-4 py-2 rounded-xl text-xs font-black transition-all \${portfolioFilter === 'speculation' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
          >
            المضاربة
          </button>
        </div>
      </div>`;

c = c.replace(headerRegex, newHeader);

// 4. Update the positions filtered to use filteredPositions instead of all positions
c = c.replace(/const activePositions = positions\.filter/g, 'const activePositions = filteredPositions.filter');

fs.writeFileSync('src/components/Dashboard.tsx', c, 'utf8');
console.log('Dashboard updated');
