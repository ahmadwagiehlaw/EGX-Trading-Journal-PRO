const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// 1. Add state for dateStr
const stateToAdd = `  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  });`;

code = code.replace("const [priceStr, setPriceStr] = useState('');", stateToAdd + "\n  const [priceStr, setPriceStr] = useState('');");

// 2. Set dateStr when editing
const editLogicToAdd = `
      if (transactionToEdit.date) {
        const d = new Date(transactionToEdit.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDateStr(d.toISOString().slice(0, 16));
      }`;

code = code.replace("setNote(transactionToEdit.note || '');", "setNote(transactionToEdit.note || '');\n" + editLogicToAdd);

// 3. Reset dateStr when opening a new one
const resetLogic = `      if (isOpen && !transactionToEdit) {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDateStr(d.toISOString().slice(0,16));
      }`;

code = code.replace("setPriceStr('');", resetLogic + "\n        setPriceStr('');");

// 4. Update the submit logic
const submitStrStart = code.indexOf('const handleSubmit = async (e: React.FormEvent) => {');
const txPayloadStart = code.indexOf('const txPayload: any = {', submitStrStart);
const txPayloadEnd = code.indexOf('};', txPayloadStart) + 2;

let payloadBlock = code.slice(txPayloadStart, txPayloadEnd);
payloadBlock = payloadBlock.replace("date: transactionToEdit ? transactionToEdit.date : Date.now(),", "date: new Date(dateStr).getTime(),");
code = code.slice(0, txPayloadStart) + payloadBlock + code.slice(txPayloadEnd);

// 5. Add UI for the Date field
const dateUI = `
          {/* Date Field */}
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-slate-500">تاريخ ووقت التنفيذ</label>
            <input 
              type="datetime-local" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center"
              dir="ltr"
            />
          </div>
`;

// Insert it right after the Note field
const noteUIEnd = code.indexOf('</textarea>\n          </div>') + 29;
code = code.slice(0, noteUIEnd) + dateUI + code.slice(noteUIEnd);

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log('Added Date field to TransactionFormModal');
