const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Find where WeeklyReviewModal is rendered
const tIdx = code.indexOf('<WeeklyReviewModal');
const endIdx = code.indexOf('</div>', code.indexOf('إجراء المراجعة الآن', tIdx)) + 6;
const bannerBlock = code.slice(tIdx, endIdx);

const newBannerBlock = `      <WeeklyReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />

      {/* Quick Action Banner for Weekly Review */}
      {(!weeklyReviews || weeklyReviews.length === 0 || (Date.now() - weeklyReviews[0].createdAt > 4 * 24 * 60 * 60 * 1000)) && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-2xl shrink-0">
                 <Activity className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                 <h3 className="text-white font-black text-lg">حان وقت التقييم والمراجعة!</h3>
                 <p className="text-indigo-200 text-xs font-bold mt-1 max-w-lg leading-relaxed">
                   استمرارية النجاح تتطلب المراجعة. وثّق أداءك، صفقاتك، وأخطاءك للفترة المنقضية، وحدد نقطة تركيزك للمرحلة القادمة.
                 </p>
              </div>
           </div>
           <button 
             onClick={() => setIsReviewModalOpen(true)}
             className="shrink-0 w-full md:w-auto px-6 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-black text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
           >
             <Layers className="w-4 h-4" />
             إجراء المراجعة الآن
           </button>
        </div>
      )}`;

if (!code.includes('weeklyReviews[0].createdAt')) {
  // Need to extract weeklyReviews from context if not already done
  if (!code.includes('weeklyReviews,')) {
    code = code.replace("coreSatelliteTarget,", "coreSatelliteTarget,\n    weeklyReviews,");
  }
  
  code = code.replace(bannerBlock, newBannerBlock);
  fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
  console.log("Fixed Dashboard Banner hiding logic");
} else {
  console.log("Already has hiding logic");
}
