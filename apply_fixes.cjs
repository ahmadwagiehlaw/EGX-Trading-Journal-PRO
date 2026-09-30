const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

// 1. Separate Right Pane State
c = c.replace(/const \[txModalType, setTxModalType\] = useState<'buy' \| 'sell' \| 'sellAll' \| 'edit' \| 'ledger' \| null>\('ledger'\);/, 
  "const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);\n  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');");
c = c.replace(/const \[txModalType, setTxModalType\] = useState<'buy' \| 'sell' \| 'sellAll' \| 'edit' \| 'ledger' \| null>\(null\);/, 
  "const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);\n  const [rightPaneView, setRightPaneView] = useState<'ledger' | 'chart'>('ledger');");

// 2. Right Pane rendering logic
const rightPaneRegex = /\{txModalType === 'ledger' \? \([\s\S]*?\} \/\* Right Column: Live TradingView Chart OR Ledger \*\//;
c = c.replace(/\{txModalType === 'ledger' \? \(/g, "{rightPaneView === 'ledger' ? (");
c = c.replace(/onClick=\{.*?setTxModalType.*?txModalType === 'ledger'.*?\}/, "onClick={() => setRightPaneView(rightPaneView === 'ledger' ? 'chart' : 'ledger')}");
c = c.replace(/\{txModalType === 'ledger' \? 'الشارت الفني' : 'سجل صفقات السهم'\}/, "{rightPaneView === 'ledger' ? 'الشارت الفني' : 'سجل صفقات السهم'}");

// 3. Reverse Plan vs Reality Chart (RTL)
c = c.replace(/left: '0%'/g, "right: '0%'");
c = c.replace(/left: '100%'/g, "right: '100%'");
c = c.replace(/left: `\$\{entryPercent\}%`/g, "right: `${entryPercent}%`");
c = c.replace(/left: `\$\{trailingStopPercent\}%`/g, "right: `${trailingStopPercent}%`");
c = c.replace(/left: `\$\{currentPercent\}%`/g, "right: `${currentPercent}%`");
c = c.replace(/bg-gradient-to-l/g, "bg-gradient-to-r");

// 4. Add Manual Trailing Stop Override Feature
const stopState = `const [isEditingStop, setIsEditingStop] = useState(false);
  const [manualStopInput, setManualStopInput] = useState('');
  
  const handleManualStopUpdate = async () => {
    const val = parseFloat(manualStopInput);
    if (!isNaN(val) && val > 0 && position) {
      const updatedData: any = { trailingStop: { ...position.trailingStop, current: val } };
      await updatePosition(position.id, updatedData);
      setIsEditingStop(false);
    }
  };`;
c = c.replace(/const \[atrInput, setAtrInput\] = useState\(''\);/, "const [atrInput, setAtrInput] = useState('');\n  " + stopState);

// Add the edit button and input to the Trailing Stop card
const redCard = `<div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-100 dark:border-red-900/60 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 rounded-r-2xl"></div>
                <div className="flex items-center justify-center gap-1.5 mb-1 text-red-600 dark:text-red-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  الوقف المتحرك الحالي
                </div>
                {isEditingStop ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <input type="number" step="any" value={manualStopInput} onChange={e => setManualStopInput(e.target.value)} className="w-20 text-center px-2 py-1 rounded bg-white dark:bg-slate-900 border text-red-600 dark:text-red-400 font-black text-sm" dir="ltr" autoFocus placeholder={currentStop.toFixed(2)} />
                    <button onClick={handleManualStopUpdate} className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold">حفظ</button>
                    <button onClick={() => setIsEditingStop(false)} className="text-[10px] bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold">إلغاء</button>
                  </div>
                ) : (
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono-num flex items-center justify-center gap-2" dir="ltr">
                    {currentStop.toFixed(2)}
                    <button onClick={() => setIsEditingStop(true)} className="text-[10px] text-red-500 hover:text-red-700 underline" title="تعديل يدوي للوقف (تراجع عن خطأ)">تعديل</button>
                  </div>
                )}
              </div>`;

c = c.replace(/<div className="bg-red-50 dark:bg-red-950\/40 p-4 rounded-2xl border border-red-100 dark:border-red-900\/60 text-center relative overflow-hidden">[\s\S]*?<\/div>\s*<\/div>/, redCard);


// Fix modal defaultType
c = c.replace(/txModalType === 'ledger' \? 'buy' : \(txModalType as 'buy' \| 'sell' \| undefined\)/g, "txModalType as 'buy' | 'sell' | undefined");

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
