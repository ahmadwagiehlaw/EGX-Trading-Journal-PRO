import { useState } from 'react';
import { Layers, Plus, Calendar as CalendarIcon, CheckCircle, AlertOctagon, Target, Edit2, Trash2 } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { formatEGP } from '../utils/calculations';
import WeeklyReviewModal from './WeeklyReviewModal';
import ConfirmModal from './ConfirmModal';

export default function WeeklyReviewTab() {
  
  const { weeklyReviews, deleteWeeklyReview } = useTrades();
  const [reviewToEdit, setReviewToEdit] = useState<any>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Header & CTA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-l from-indigo-900 to-indigo-800 rounded-3xl p-6 shadow-md text-white">
        <div>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300"/>
            المراجعة الدورية الأسبوعية
          </h2>
          <p className="text-xs text-indigo-200 font-bold max-w-lg leading-relaxed">
            المتداول المحترف لا يقيس نجاحه بصفقة واحدة، بل بالاستمرارية. خصص وقتاً كل أسبوع لمراجعة أدائك بموضوعية، تدوين ما تعلمته، وضبط التركيز للأسبوع القادم.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-black text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          إجراء مراجعة جديدة
        </button>
      </div>

      <WeeklyReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* History List */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
           <CalendarIcon className="w-5 h-5 text-slate-400" />
           سجل المراجعات السابقة
        </h3>
        
        {weeklyReviews.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">لا يوجد أي مراجعات محفوظة. ابدأ بتسجيل مراجعتك الأولى!</p>
          </div>
        )}

        {weeklyReviews.map(review => (
          <div key={review.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5 transition-all hover:shadow-md hover:-translate-y-1">
            
            <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                من {new Date(review.weekStartDate).toLocaleDateString('ar-EG')} إلى {new Date(review.weekEndDate).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-mono-num font-black">
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300">إغلاق {review.tradesCount} | فتح {(review as any).openedCount || 0}</span>
                <span className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400">{review.winRate.toFixed(0)}% Win</span>
                <span className={`px-3 py-1.5 rounded-lg ${review.pnl >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`} dir="ltr">
                  {review.pnl > 0 ? '+' : ''}{formatEGP(review.pnl)}
                </span>
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 mr-1">
                  <button
                    onClick={() => {
                      setReviewToEdit(review);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="تعديل المراجعة"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setReviewToDelete(review.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                    title="حذف المراجعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> الإيجابيات
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.whatWentWell}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-500 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" /> التحديات والأخطاء
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.whatWentWrong}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-blue-700 dark:text-blue-500 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> التركيز القادم
                </h4>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{review.focusNextWeek}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>



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

    </div>
  );
}