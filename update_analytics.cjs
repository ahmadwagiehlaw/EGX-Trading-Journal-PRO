const fs = require('fs');
let an = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const anchor = `const averageLoss = lostPositions.length > 0 ? (totalLosses / lostPositions.length) : 0;
  const realRR = averageLoss !== 0 ? Math.abs(averageWin / averageLoss).toFixed(2) : '100+';`;

const expectancy = `const averageLoss = lostPositions.length > 0 ? (totalLosses / lostPositions.length) : 0;
  const realRR = averageLoss !== 0 ? Math.abs(averageWin / averageLoss).toFixed(2) : '100+';
  const expectancy = ((winRate / 100) * averageWin) - ((1 - (winRate / 100)) * Math.abs(averageLoss));`;

an = an.replace(anchor, expectancy);

const cardsAnchor = `            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 flex items-center justify-center mb-2">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">عائد المخاطرة (Real RR)</p>
              <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-500 font-mono-num mt-1" dir="ltr">1 : {realRR}</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">الربح / الخسارة</span>
            </div>`;

const newCards = `            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className={\`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 \${expectancy > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'}\`}>
                <Target className="w-5 h-5" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">توقع الربح (Expectancy)</p>
              <h3 className={\`text-xl font-black font-mono-num mt-1 \${expectancy > 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}\`} dir="ltr">{expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)}</h3>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5" title={\`Real RR: 1:\${realRR}\`}>م. الربح - م. الخسارة للمتوسط</span>
            </div>`;

an = an.replace(cardsAnchor, newCards);
fs.writeFileSync('src/components/Analytics.tsx', an, 'utf8');
console.log('✓ Added Expectancy to Analytics');
