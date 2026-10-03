const fs = require('fs');
let code = fs.readFileSync('src/components/Analytics.tsx', 'utf8');

const insertionPoint = code.indexOf('<div className="grid md:grid-cols-2 gap-6">', code.indexOf('activeSubTab === \'psychology\' && ('));

const behavioralUI = `
          {/* Behavioral Deviations (Cost of Emotions) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-indigo-600" />
              التحليل السلوكي وتكلفة المشاعر (Process vs Outcome)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col justify-center">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">تكلفة التمسك بالأمل (Cost of Hope)</span>
                <span className="text-xl font-black text-red-700 dark:text-red-300 font-mono-num" dir="ltr">
                  -{formatEGP(behavioralDeviations.costOfHope)}
                </span>
                <p className="text-[10px] text-red-500 mt-2 font-medium">خسائر إضافية نتيجة عدم الالتزام بوقف الخسارة المحدد في الخطة.</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col justify-center">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">تكلفة الخوف (Cost of Fear)</span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono-num" dir="ltr">
                  -{formatEGP(behavioralDeviations.costOfFear)}
                </span>
                <p className="text-[10px] text-amber-500 mt-2 font-medium">أرباح ضائعة نتيجة الخروج المبكر وجني الربح قبل الهدف المحدد.</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">نسبة الانضباط (Discipline Rate)</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono-num">
                  {behavioralDeviations.disciplineRate.toFixed(0)}%
                </span>
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                  التزام تام بالخطة في {behavioralDeviations.disciplinedCount} من أصل {behavioralDeviations.totalAnalyzed} صفقة تم إغلاقها.
                </p>
              </div>

            </div>
          </div>\n\n          `;

code = code.slice(0, insertionPoint) + behavioralUI + code.slice(insertionPoint);
fs.writeFileSync('src/components/Analytics.tsx', code, 'utf8');
console.log('Injected Behavioral Deviations UI');
