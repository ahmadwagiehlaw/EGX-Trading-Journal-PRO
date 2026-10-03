const fs = require('fs');

// --- 1. Settings.tsx ---
let sCode = fs.readFileSync('src/components/Settings.tsx', 'utf8');
sCode = "import ConfirmModal from './ConfirmModal';\n" + sCode;

const sMatch = sCode.match(/function Settings\s*\([^)]*\)\s*\{/);
if (sMatch) {
    sCode = sCode.replace(sMatch[0], sMatch[0] + "\n  const [confirmReset, setConfirmReset] = useState(false);");
}

const sHandleSearch = "const handleClearData = async () => {";
const sStart = sCode.indexOf(sHandleSearch);
if (sStart > -1) {
    const sEnd = sCode.indexOf('};', sStart) + 2;
    const sNewLogic = `const handleClearData = () => setConfirmReset(true);

  const executeClearData = async () => {
    try {
      await clearAllData();
      alert('تم مسح البيانات وتسجيل الخروج بنجاح.');
    } catch (error: any) {
      alert('حدث خطأ أثناء مسح البيانات: ' + error.message);
    } finally {
      setConfirmReset(false);
    }
  };`;
    sCode = sCode.slice(0, sStart) + sNewLogic + sCode.slice(sEnd);
}

const sModal = `
      <ConfirmModal
        isOpen={confirmReset}
        title="مسح جميع البيانات"
        message="تحذير: سيتم مسح جميع الصفقات والخطط والمراجعات من السحابة نهائياً. لا يمكن التراجع عن هذه الخطوة!"
        type="danger"
        confirmText="نعم، امسح كل شيء"
        onConfirm={executeClearData}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}`;
sCode = sCode.replace(/<\/div>\s*\);\s*}\s*$/, sModal);
fs.writeFileSync('src/components/Settings.tsx', sCode, 'utf8');

// --- 2. TransactionFormModal.tsx ---
let tCode = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');
tCode = "import ConfirmModal from './ConfirmModal';\n" + tCode;

const tMatch = tCode.match(/function TransactionFormModal\s*\([^)]*\)\s*\{/);
if (tMatch) {
    tCode = tCode.replace(tMatch[0], tMatch[0] + "\n  const [confirmInsufficient, setConfirmInsufficient] = useState(false);\n  const [pendingSavePayload, setPendingSavePayload] = useState<any>(null);");
}

const tConfSearch = "if (!window.confirm(`تحذير: السيولة المتاحة";
const tStart = tCode.indexOf(tConfSearch);
if (tStart > -1) {
    const startIf = tCode.lastIndexOf('if', tStart);
    const endIf = tCode.indexOf('}', tStart) + 1;
    tCode = tCode.slice(0, startIf) + `setPendingSavePayload({ type, payload });\n        setConfirmInsufficient(true);\n        return;` + tCode.slice(endIf);
}

const tHandle = "const handleSave = async (e: React.FormEvent) => {";
const tExec = `const executeSaveFromPending = () => {
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
tCode = tCode.replace(tHandle, tExec + tHandle);

const tModal = `
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
    </div>
  );
}`;
tCode = tCode.replace(/<\/div>\s*\);\s*}\s*$/, tModal);
fs.writeFileSync('src/components/TransactionFormModal.tsx', tCode, 'utf8');


// --- 3. ActiveTrades.tsx ---
let aCode = fs.readFileSync('src/components/ActiveTrades.tsx', 'utf8');
aCode = "import ConfirmModal from './ConfirmModal';\n" + aCode;

const aMatch = aCode.match(/function ActiveTrades\s*\([^)]*\)\s*\{/);
if (aMatch) {
    aCode = aCode.replace(aMatch[0], aMatch[0] + "\n  const [confirmTxId, setConfirmTxId] = useState<string | null>(null);");
}

const aConfSearch = "if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {";
const aStart = aCode.indexOf(aConfSearch);
if (aStart > -1) {
    const endIf = aCode.indexOf('}', aStart) + 1;
    aCode = aCode.slice(0, aStart) + "setConfirmTxId(tx.id);" + aCode.slice(endIf);
}

const aModal = `
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
    </div>
  );
}`;
aCode = aCode.replace(/<\/div>\s*\);\s*}\s*$/, aModal);
fs.writeFileSync('src/components/ActiveTrades.tsx', aCode, 'utf8');

console.log("All patches applied safely!");
