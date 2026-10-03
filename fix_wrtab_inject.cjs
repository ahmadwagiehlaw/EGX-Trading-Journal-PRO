const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

// Ensure Edit2 is imported
if (!code.includes('Edit2')) {
    code = code.replace("Trash2", "Trash2, Edit2");
}

// Ensure WeeklyReviewModal is imported
if (!code.includes('import WeeklyReviewModal')) {
    code = "import WeeklyReviewModal from './WeeklyReviewModal';\n" + code;
}

// Add the edit button inside the map
const btnTarget = '<button\n                        onClick={() => {';
if (code.includes(btnTarget)) {
    const editBtn = `
                      <button
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
    code = code.replace(btnTarget, editBtn + btnTarget);
} else {
    // maybe it is single line?
    const btnTarget2 = 'onClick={() => {';
    const deleteBtnBlock = '<button';
    const splitIdx = code.indexOf(deleteBtnBlock, code.indexOf('deleteWeeklyReview(review.id)'));
    // Wait, let's just find the trash icon!
    const trashIdx = code.indexOf('<Trash2 className="w-4 h-4" />');
    if (trashIdx > -1) {
        const btnStart = code.lastIndexOf('<button', trashIdx);
        const editBtn = `
                      <button
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
        code = code.slice(0, btnStart) + editBtn + code.slice(btnStart);
    }
}

// Add Modal to bottom of return
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
const returnEnd = code.lastIndexOf('</div>\n    </div>');
code = code.slice(0, returnEnd) + modalUI + code.slice(returnEnd);

fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
console.log("Injected correctly");
