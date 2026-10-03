const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// Import ConfirmModal
if (!code.includes('import ConfirmModal')) {
    code = code.replace("import WeeklyReviewModal from './WeeklyReviewModal';", "import WeeklyReviewModal from './WeeklyReviewModal';\nimport ConfirmModal from './ConfirmModal';");
}

// Add state
const stateHook = `  const [reviewToEdit, setReviewToEdit] = useState<any>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);`;
code = code.replace("  const [reviewToEdit, setReviewToEdit] = useState<any>(null);", stateHook);

// Replace button onClick
const badClick = `if (window.confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
                        deleteWeeklyReview(review.id);
                      }`;
const goodClick = `setReviewToDelete(review.id);`;
code = code.replace(badClick, goodClick);

// Add ConfirmModal to UI (end of component)
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
      
      <ConfirmModal
        isOpen={!!reviewToDelete}
        title="حذف المراجعة"
        message="هل أنت متأكد من حذف هذه المراجعة الأسبوعية؟"
        type="danger"
        confirmText="حذف"
        onConfirm={() => {
          if (reviewToDelete) {
            deleteWeeklyReview(reviewToDelete);
            setReviewToDelete(null);
          }
        }}
        onCancel={() => setReviewToDelete(null)}
      />
`;
const oldModalUI = `      {isModalOpen && (
        <WeeklyReviewModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setReviewToEdit(null);
          }}
          reviewToEdit={reviewToEdit}
        />
      )}`;
code = code.replace(oldModalUI, modalUI);

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Fixed WeeklyReviewTab to use ConfirmModal");
