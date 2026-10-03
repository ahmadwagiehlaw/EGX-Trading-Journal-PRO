const fs = require('fs');
let code = fs.readFileSync('src/components/NewTradeForm.tsx', 'utf8');

const dateUI = `
      {/* Date Field */}
      <div className="mt-4">
        <label className="text-xs font-black text-slate-500 dark:text-slate-400 block mb-2 text-center">تاريخ ووقت فتح الخطة/التمركز</label>
        <input 
          type="datetime-local" 
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="w-full text-base font-black text-slate-700 dark:text-slate-300 py-3 px-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl focus:border-blue-500 focus:outline-none text-center shadow-inner"
          dir="ltr"
        />
      </div>
`;

// Find `</div>` on line 234 and insert right after it
const splitIdx = code.indexOf('        </div>\n      </div>');
if (splitIdx > -1) {
    code = code.slice(0, splitIdx + 29) + "\n" + dateUI + "\n" + code.slice(splitIdx + 29);
    fs.writeFileSync('src/components/NewTradeForm.tsx', code, 'utf8');
    console.log("Injected Date field in NewTradeForm perfectly!");
}
