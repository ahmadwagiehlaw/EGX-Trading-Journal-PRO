const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

if (!code.includes('import ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

const hookTarget = "  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 16));";
const hookInsert = `  const [confirmInsufficient, setConfirmInsufficient] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);`;
if (!code.includes('setConfirmInsufficient')) {
    code = code.replace(hookTarget, hookTarget + "\n" + hookInsert);
}

// Find window.confirm and replace
const searchConfirm = "if (!window.confirm(";
const startIdx = code.indexOf(searchConfirm);
if (startIdx > -1) {
    const endIdx = code.indexOf("return;", startIdx) + 8; // includes return; }
    
    const newCheck = `setPendingSavePayload({ type, payload });
        setConfirmInsufficient(true);
        return;
      }`;
      
    code = code.slice(0, startIdx) + newCheck + code.slice(endIdx);
}

const execFunc = `
  const executeSaveFromPending = () => {
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
const fnTarget = "  const handleSave = () => {";
if (!code.includes('executeSaveFromPending')) {
    code = code.slice(0, code.indexOf(fnTarget)) + execFunc + code.slice(code.indexOf(fnTarget));
}

const modalUI = `
      <ConfirmModal
        isOpen={confirmInsufficient}
        title="سيولة غير كافية"
        message="السيولة المتاحة في المحفظة لا تكفي لإتمام هذه الصفقة بالكامل. هل تريد المتابعة والسماح برصيد سالب (Margin)؟"
        type="warning"
        confirmText="متابعة والسماح بالسالب"
        onConfirm={executeSaveFromPending}
        onCancel={() => {
          setConfirmInsufficient(false);
          setPendingSavePayload(null);
        }}
      />
`;
const endIdxC = code.lastIndexOf('</div>');
if (!code.includes('isOpen={confirmInsufficient}')) {
    code = code.slice(0, endIdxC) + modalUI + code.slice(endIdxC);
}

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Updated TransactionFormModal");
