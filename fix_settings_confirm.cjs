const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!code.includes('import ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

const stateInsert = `
  const [confirmReset, setConfirmReset] = useState(false);
`;
const stateHookTarget = "const { theme, toggleTheme } = useTheme();";
code = code.replace(stateHookTarget, stateHookTarget + stateInsert);

// Find the handleClearData function
const clearStart = code.indexOf('const handleClearData = async () => {');
const clearEnd = code.indexOf('};', clearStart) + 2;

const newClearData = `
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
code = code.slice(0, clearStart) + newClearData + code.slice(clearEnd);

// Add the modal UI
const modalUI = `
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
const returnEnd = code.lastIndexOf('</div>');
code = code.slice(0, returnEnd) + modalUI + code.slice(returnEnd);

fs.writeFileSync('src/components/Settings.tsx', code, 'utf8');
console.log("Updated Settings.tsx");
