const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Remove the old coreAllocation-based toggle and replace with coreShares widget
const oldBlock = at.slice(at.indexOf("{position!.portfolioType === 'investment' && metrics!.isOpen && ("), at.indexOf("                  )}\r\n                </div>\r\n                <p") + 6);

const newBlock = `{position!.portfolioType === 'investment' && metrics!.isOpen && (() => {
                    const coreShares = position!.coreShares !== undefined
                      ? Math.min(position!.coreShares, metrics!.openShares)
                      : 0;
                    const satShares = Math.max(0, metrics!.openShares - coreShares);
                    return (
                      <button
                        onClick={() => { setIsEditingCoreShares(true); setCoreSharesInput(coreShares.toString()); }}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                        title="اضغط لتعديل كمية Core"
                      >
                        <span className="text-indigo-700 dark:text-indigo-300">🏛 {coreShares.toLocaleString()}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-amber-600 dark:text-amber-400">🛰 {satShares.toLocaleString()}</span>
                      </button>
                    );
                  })()}`;

if (at.includes("{position!.portfolioType === 'investment' && metrics!.isOpen && (")) {
  at = at.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
  console.log('✓ Replaced toggle with shares widget');
} else {
  console.log('Block not found');
}
