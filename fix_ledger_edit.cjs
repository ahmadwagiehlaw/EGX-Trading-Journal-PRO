const fs = require('fs');
let c = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

c = c.replace("Trash2\n} from 'lucide-react';", "Trash2,\n  Pencil\n} from 'lucide-react';");

// Add editingTxId state
c = c.replace("const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);", 
  "const [txModalType, setTxModalType] = useState<'buy' | 'sell' | 'sellAll' | 'edit' | null>(null);\n  const [editingTxId, setEditingTxId] = useState<string | null>(null);");

// Update the modal
c = c.replace(/<TransactionFormModal[\s\S]*?\/>/, 
`<TransactionFormModal
        isOpen={!!txModalType}
        onClose={() => { setTxModalType(null); setEditingTxId(null); }}
        position={position}
        defaultType={txModalType === 'sellAll' || txModalType === 'edit' ? 'sell' : (txModalType as 'buy' | 'sell' | undefined) || 'buy'}
        defaultShares={txModalType === 'sellAll' ? metrics!.openShares.toString() : ''}
        transactionToEdit={editingTxId ? position!.transactions.find(t => t.id === editingTxId) : undefined}
      />`);

// Update the Ledger Table actions column
const actionsCode = `<td className="py-4 px-2 flex justify-center gap-1">
                            <button onClick={() => { setEditingTxId(tx.id); setTxModalType('edit'); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="تعديل">
                              <Pencil className="w-4 h-4"/>
                            </button>
                            <button className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="حذف">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </td>`;

c = c.replace(/<td className="py-4 px-2 flex justify-center">[\s\S]*?<\/td>/g, actionsCode);

fs.writeFileSync('src/components/ActiveTrades.tsx', c, 'utf8');
console.log('Added Edit button to Ledger');
