const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

const targetBtn = `<button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="حذف">`;
const newBtn = `<button 
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
                                  deleteTransaction(position!.id, tx.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" 
                              title="حذف"
                            >`;
if (code.includes(targetBtn)) {
    code = code.replace(targetBtn, newBtn);
    fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
    console.log("Added onClick to delete button");
}
