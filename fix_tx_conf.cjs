const fs = require('fs');
let code = fs.readFileSync('src/components/TransactionFormModal.tsx', 'utf8');

// Import ConfirmModal
if (!code.includes('import ConfirmModal')) {
    code = "import ConfirmModal from './ConfirmModal';\n" + code;
}

// Add state
const stateHook = `  const [pendingSaveData, setPendingSaveData] = useState<any>(null);`;
code = code.replace("  const [price, setPrice] = useState('');", "  const [price, setPrice] = useState('');\n" + stateHook);

// Refactor handleSubmit
const handleStart = code.indexOf('const handleSubmit = (e: React.FormEvent) => {');
const handleEnd = code.indexOf('onClose();\n  };', handleStart) + 14;

const newHandle = `  const proceedWithSave = (dataToSave: any) => {
    if (transactionToEdit) {
      updateTransaction(position!.id, transactionToEdit.id, dataToSave);
    } else {
      addTransaction(position!.id, dataToSave);
    }
    
    // Update openedDate/closedDate automatically based on tx history
    // (Existing logic inside TradeContext's addTransaction/updateTransaction handles this)

    setShares('');
    setPrice('');
    setPendingSaveData(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(shares);
    const p = parseFloat(price);
    if (!s || !p || s <= 0 || p <= 0) return;

    if (type === 'sell' && s > (position?.journal?.openShares || 0) && !transactionToEdit) {
      alert('لا يمكنك بيع كمية أكبر من المتاحة!');
      return;
    }

    const payload = {
      type,
      shares: s,
      price: p,
      date: date ? new Date(date).getTime() : Date.now()
    };

    if (type === 'buy' && position) {
      const amount = s * p;
      const portfolioType = position.portfolioType || 'speculation';
      
      const totalOpenCapitalInvestment = positions
        .filter(p => p.portfolioType === 'investment' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const totalOpenCapitalSpeculation = positions
        .filter(p => p.portfolioType === 'speculation' && p.status === 'active')
        .reduce((sum, p) => sum + (p.journal?.totalInvested || 0), 0);
        
      const availablePower = portfolioType === 'investment' 
        ? (capitalInvestment - totalOpenCapitalInvestment) 
        : (capitalSpeculation - totalOpenCapitalSpeculation);
      
      if (amount > availablePower && !transactionToEdit) {
        setPendingSaveData({
           payload,
           msg: \`تحذير: سيولة الـ \${portfolioType === 'investment' ? 'استثمار' : 'مضاربة'} المتاحة (\${formatEGP(availablePower)}) لا تكفي لهذه الصفقة (\${formatEGP(amount)}). هل أنت متأكد من الاستمرار (قد يؤدي ذلك لسالب في السيولة)؟\`
        });
        return;
      }
    }

    proceedWithSave(payload);
  };`;

code = code.slice(0, handleStart) + newHandle + code.slice(handleEnd);

// Add modal to UI
const modalUI = `
      <ConfirmModal
        isOpen={!!pendingSaveData}
        title="تجاوز السيولة المتاحة"
        message={pendingSaveData?.msg || ''}
        type="warning"
        confirmText="تأكيد الشراء"
        onConfirm={() => {
          if (pendingSaveData?.payload) {
             proceedWithSave(pendingSaveData.payload);
          }
        }}
        onCancel={() => setPendingSaveData(null)}
      />
    </div>
  );
}`;
code = code.replace("    </div>\n  );\n}", modalUI);

fs.writeFileSync('src/components/TransactionFormModal.tsx', code, 'utf8');
console.log("Fixed TransactionFormModal window.confirm");
