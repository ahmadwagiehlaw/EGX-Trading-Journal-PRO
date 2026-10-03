const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

// 1. Add State
const stateToAdd = `  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });`;

code = code.replace("const [symbol, setSymbol] = useState(initialData?.symbol || '');", stateToAdd + "\n  const [symbol, setSymbol] = useState(initialData?.symbol || '');");

// 2. Add UI for the Date field
const dateUI = `
        {/* Date Field */}
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">تاريخ ووقت فتح الخطة/التمركز</label>
          <input 
            type="datetime-local" 
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            dir="ltr"
          />
        </div>
`;

// Insert it inside the grid, right after the Stop Loss field
const targetField = '<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الوقف المتحرك (ATR)</label>';
const insertIdx = code.indexOf(targetField);
if(insertIdx > -1) {
    const blockStart = code.lastIndexOf('<div>', insertIdx);
    code = code.slice(0, blockStart) + dateUI + "\n        " + code.slice(blockStart);
}

// 3. Pass it to addPosition / updatePosition
// We need to inject openedDate into the journal
const handleSaveStart = code.indexOf('const handleSave = async () => {');
const addPosStart = code.indexOf('await addPosition({', handleSaveStart);
if (addPosStart > -1) {
    const journalStart = code.indexOf('journal: {', addPosStart);
    if (journalStart > -1) {
        code = code.slice(0, journalStart + 10) + "\n          openedDate: new Date(dateStr).getTime()," + code.slice(journalStart + 10);
    }
}

fs.writeFileSync('src/components/NewTradeForm.tsx', code, 'utf8');
console.log('Added Date field to NewTradeForm');
