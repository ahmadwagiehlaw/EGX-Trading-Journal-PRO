const fs = require('fs');
let code = fs.readFileSync('src/components/WeeklyReviewTab.tsx', 'utf8');

if (!code.includes('Trash2')) {
    code = code.replace("Target, Edit2 } from 'lucide-react'", "Target, Edit2, Trash2 } from 'lucide-react'");
}

const editBtn = `title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>`;

const newBtns = `title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
                        // We need deleteWeeklyReview from context!
                        // Is it available?
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="حذف المراجعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>`;

// Wait, I should make sure deleteWeeklyReview is destructured from useTrades.
if (!code.includes('deleteWeeklyReview')) {
    code = code.replace('const { weeklyReviews } = useTrades();', 'const { weeklyReviews, deleteWeeklyReview } = useTrades();');
}

if (code.includes(editBtn)) {
    const finalBtns = `title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('هل أنت متأكد من حذف هذه المراجعة؟')) {
                        deleteWeeklyReview(review.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="حذف المراجعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>`;
    code = code.replace(editBtn, finalBtns);
    fs.writeFileSync('src/components/WeeklyReviewTab.tsx', code, 'utf8');
    console.log("Added delete button to WeeklyReviewTab");
} else {
    console.log("Could not find edit button string");
}
