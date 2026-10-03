const fs = require('fs');
let code = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');

if (!code.includes('import ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

// Add state for confirm modal
const stateHookTarget = "  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');";
const stateHookNew = `  const [coreSharesInput, setCoreSharesInput] = useState(position?.coreShares?.toString() || '');
  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);`;
code = code.replace(stateHookTarget, stateHookNew);

// Replace onClick for delete button
const oldClick = `if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {\n                                  deleteTransaction(position!.id, tx.id);\n                                }`;
const newClick = `setConfirmTxId(tx.id);`;
code = code.replace(oldClick, newClick);

// Add ConfirmModal to UI
const returnEnd = code.lastIndexOf('</div>');
const modalUI = `
      <ConfirmModal
        isOpen={!!confirmTxId}
        title="حذف المعاملة"
        message="هل أنت متأكد من حذف هذه المعاملة بشكل نهائي؟ سيتم إعادة حساب متوسطات السهم."
        type="danger"
        confirmText="حذف"
        onConfirm={() => {
          if (confirmTxId) {
            deleteTransaction(position!.id, confirmTxId);
            setConfirmTxId(null);
          }
        }}
        onCancel={() => setConfirmTxId(null)}
      />
`;
code = code.slice(0, returnEnd) + modalUI + code.slice(returnEnd);

fs.writeFileSync('src/components/ActiveTrades.tsx', code, 'utf8');
console.log("Updated ActiveTrades.tsx");
