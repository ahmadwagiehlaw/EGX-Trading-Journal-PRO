const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// 1. Remove the trailing executeSaveFromPending
const execStart = code.lastIndexOf('  const executeSaveFromPending = () => {');
if (execStart > -1) {
    code = code.slice(0, execStart);
}

// 2. Fix the extra brace
const extraBraceStr = `setPendingSavePayload({ type, payload });
        setConfirmInsufficient(true);
        return;
      }`;
const correctStr = `setPendingSavePayload({ type, payload });
        setConfirmInsufficient(true);
        return;`;
code = code.replace(extraBraceStr, correctStr);

// 3. Inject executeSaveFromPending inside the component correctly
const hookTarget = "const handleSave = async (e: React.FormEvent) => {";
const newFunc = `  const executeSaveFromPending = () => {
    if (pendingSavePayload) {
      if (editingTx) {
        updateTransaction(positionId, editingTx.id, pendingSavePayload.payload);
      } else {
        addTransaction(positionId, pendingSavePayload.type, pendingSavePayload.payload);
      }
      setConfirmInsufficient(false);
      setPendingSavePayload(null);
      onClose();
    }
  };

  `;
code = code.replace(hookTarget, newFunc + hookTarget);

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Fixed TransactionFormModal");
