const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const targetBtn = `<button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete coming soon">
                              <Trash2 className="w-4 h-4"/>
                            </button>`;
const newBtn = `<button 
                              onClick={() => setConfirmTxId(tx.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف المعاملة"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>`;

if (code.includes(targetBtn)) {
    code = code.replace(targetBtn, newBtn);
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Fixed delete button!");
} else {
    console.log("Could not find the target button");
}
