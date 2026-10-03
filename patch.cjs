const fs = require('fs');

// --- Settings.tsx ---
let settingsCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
settingsCode = "import ConfirmModal from './ConfirmModal';\n" + settingsCode;

// Add confirmReset state
const stTarget = "const { theme, toggleTheme } = useTheme();";
settingsCode = settingsCode.replace(stTarget, stTarget + "\n  const [confirmReset, setConfirmReset] = useState(false);");

// Replace handleClearData logic
const clearDataOld = `
  const handleClearData = async () => {
    if (window.confirm('تحذير: سيتم مسح جميع الصفقات والخطط والمراجعات من السحابة نهائياً. لا يمكن التراجع عن هذه الخطوة!')) {
      if (window.confirm('تأكيد نهائي: هل أنت متأكد؟')) {
        try {
          await clearAllData();
          alert('تم مسح البيانات وتسجيل الخروج بنجاح.');
        } catch (error: any) {
          alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
        }
      }
    }
  };
`;
const clearDataNew = `
  const handleClearData = async () => {
    setConfirmReset(true);
  };

  const executeClearData = async () => {
    try {
      await clearAllData();
      alert('تم مسح البيانات وتسجيل الخروج بنجاح.');
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setConfirmReset(false);
    }
  };
`;
if (settingsCode.includes("window.confirm('تحذير:")) {
   const startIdx = settingsCode.indexOf('  const handleClearData = async () => {');
   const endIdx = settingsCode.indexOf('};', startIdx) + 2;
   settingsCode = settingsCode.slice(0, startIdx) + clearDataNew + settingsCode.slice(endIdx);
}

// Add UI at end of Settings.tsx
const setModalUI = `
      <ConfirmModal
        isOpen={confirmReset}
        title="مسح جميع البيانات"
        message="تحذير: سيتم مسح جميع الصفقات والخطط والمراجعات من السحابة نهائياً. لا يمكن التراجع عن هذه الخطوة!"
        type="danger"
        confirmText="نعم، امسح كل شيء"
        onConfirm={executeClearData}
        onCancel={() => setConfirmReset(false)}
      />
`;
// find the LAST `    </div>\n  );\n}`
const lastIdxS = settingsCode.lastIndexOf('    </div>\n  );\n}');
settingsCode = settingsCode.slice(0, lastIdxS) + setModalUI + settingsCode.slice(lastIdxS);
fs.writeFileSync('src/components/Settings.tsx', settingsCode, 'utf8');

// --- TransactionFormModal.tsx ---
let txCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
txCode = "import ConfirmModal from './ConfirmModal';\n" + txCode;

const hookTarget = "  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().slice(0, 16));";
txCode = txCode.replace(hookTarget, hookTarget + "\n  const [confirmInsufficient, setConfirmInsufficient] = useState(false);\n  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);");

const txConfirmSearch = "if (!window.confirm(`تحذير: السيولة المتاحة";
const txStartIdx = txCode.indexOf(txConfirmSearch);
if (txStartIdx > -1) {
    const startIf = txCode.lastIndexOf('if', txStartIdx);
    const endIf = txCode.indexOf('}', txStartIdx) + 1;
    const newCheck = `
        setPendingSavePayload({ type, payload });
        setConfirmInsufficient(true);
        return;
`;
    txCode = txCode.slice(0, startIf) + newCheck + txCode.slice(endIf);
}

const execSave = `
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
txCode = txCode.replace("const handleSave = async (e: React.FormEvent) => {", execSave + "\n  const handleSave = async (e: React.FormEvent) => {");

const txModalUI = `
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
// The file ends with:
//     </div>
//   );
// }
const lastIdxT = txCode.lastIndexOf('    </div>\n  );\n}');
txCode = txCode.slice(0, lastIdxT) + txModalUI + txCode.slice(lastIdxT);
fs.writeFileSync('src/components/TransactionFormModal.tsx', txCode, 'utf8');

console.log("Successfully patched both files safely");
