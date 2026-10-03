const fs = require('fs');
let at = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// Remove the old wrong toggle button
const oldToggle = `                  {position!.portfolioType === 'investment' && metrics!.isOpen && (
                    <button
                      onClick={async () => {
                        const newAlloc = position!.coreAllocation === 'satellite' ? 'core' : 'satellite';
                        await updatePosition(position!.id, { coreAllocation: newAlloc });
                      }}
                      className={\`px-2.5 py-0.5 rounded-lg text-xs font-black border transition-all \${
                        position!.coreAllocation === 'satellite'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                      }\`}
                      title="اضغط للتبديل بين Core (أساسي) وSatellite (تكتيكي)"
                    >
                      {position!.coreAllocation === 'satellite' ? '🛰 Satellite' : '🏛 Core'}
                    </button>
                  )}`;

if (at.includes(oldToggle)) {
  at = at.replace(oldToggle, '');
  console.log('✓ Old toggle removed');
} else {
  console.log('Toggle not found by exact match, doing partial...');
  at = at.replace(/\{position!\.portfolioType === 'investment' && metrics!\.isOpen && \(\s*<button[\s\S]*?🛰 Satellite.*?Core.*?<\/button>\s*\)\}\s*/g, '');
  console.log('✓ Partial remove done');
}

fs.writeFileSync('src/components/ActiveTrades.tsx', at, 'utf8');
