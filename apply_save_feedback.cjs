const fs = require('fs');
let wl = fs.readFileSync('src/components/Watchlist.tsx', 'utf8');

// Insert useState
const stateAnchor = `  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);`;
wl = wl.replace(stateAnchor, stateAnchor + `\n  const [isSaved, setIsSaved] = useState(false);`);

// Update handleSavePlan
const handleSaveStr = `    const exists = plans.find(p => p.id === normalizedPlan.id);
    if (exists) {
      updatePlan(normalizedPlan.id, normalizedPlan);
    } else {
      addPlan(normalizedPlan);
    }
    setIsModalOpen(false);
  };`;

const newHandleSave = `    const exists = plans.find(p => p.id === normalizedPlan.id);
    if (exists) {
      updatePlan(normalizedPlan.id, normalizedPlan);
    } else {
      addPlan(normalizedPlan);
    }
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsModalOpen(false);
    }, 700);
  };`;
wl = wl.replace(handleSaveStr, newHandleSave);

// Update Save Button
const btnStr = `              <button 
                onClick={() => handleSavePlan(selectedPlan)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                حفظ الخطة
              </button>`;

const newBtnStr = `              <button 
                onClick={() => handleSavePlan(selectedPlan)}
                disabled={isSaved}
                className={\`\${isSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-black px-8 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm\`}
              >
                {isSaved ? <CheckSquare className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isSaved ? 'تم الحفظ بنجاح!' : 'حفظ الخطة'}
              </button>`;

wl = wl.replace(btnStr, newBtnStr);

fs.writeFileSync('src/components/Watchlist.tsx', wl, 'utf8');
console.log('✓ Added Save Feedback to Watchlist Modal');
