const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// I need to import Pencil or Edit icon
if (!code.includes('Edit2')) {
    code = code.replace("Trash2 }", "Trash2, Edit2 }");
}

// Add state for editing
const sIdx = code.indexOf('const { weeklyReviews');
const stateInsert = `
  const [reviewToEdit, setReviewToEdit] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
`;
code = code.slice(0, sIdx) + stateInsert + code.slice(sIdx);

// Ensure WeeklyReviewModal is imported
if (!code.includes('import WeeklyReviewModal')) {
    const importStr = "import WeeklyReviewModal from './WeeklyReviewModal';\n";
    code = importStr + code;
}

// Add edit button in UI
const uiIdx = code.indexOf('<button\n                      onClick={() => {');
const editBtn = `                      <button
                        onClick={() => {
                          setReviewToEdit(review);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                        title="تعديل المراجعة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
`;
code = code.slice(0, uiIdx) + editBtn + code.slice(uiIdx);

// Add the Modal
const endIdx = code.indexOf('</div>\n    </div>');
const modalUI = `
      {isModalOpen && (
        <WeeklyReviewModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setReviewToEdit(null);
          }}
          reviewToEdit={reviewToEdit}
        />
      )}
`;
code = code.slice(0, endIdx) + modalUI + code.slice(endIdx);

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Added edit button to WeeklyReviewTab");
