const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

if (!code.includes('import ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

const hookTarget = "  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 16));";
const hookInsert = `  const [confirmInsufficient, setConfirmInsufficient] = useState(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);`;
code = code.replace(hookTarget, hookTarget + "\n" + hookInsert);

// Replace the if (window.confirm)
const oldCheck = `if (!window.confirm(\`تحذير: السيولة المتاحة في ${portfolioType === 'investment' ? 'الاستثمار' : 'المضاربة'} (${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (${formatEGP(amount)}). هل تريد المتابعة والسماح بالسالب (Margin)؟\`)) {
          return;
        }`;
const newCheck = `setPendingSavePayload({ type, payload });
        setConfirmInsufficient(true);
        return;`;
code = code.replace(oldCheck, newCheck);

// And we need to extract the actual save logic into an executeSave function...
// Wait, handleSave calls addTransaction or updateTransaction.
// Let's modify the newCheck to pass what it needs to execute.
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
code = code.slice(0, code.indexOf(fnTarget)) + execFunc + code.slice(code.indexOf(fnTarget));

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
const endIdx = code.lastIndexOf('</div>');
code = code.slice(0, endIdx) + modalUI + code.slice(endIdx);

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Updated TransactionFormModal");
