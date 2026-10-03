# -*- coding: utf-8 -*-
import sys

with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = '{/* Trailing Stop Metrics Cards */}'
end_str = '{/* Smart Trailing Stop Tools */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print('Could not find markers')
    sys.exit(1)

new_cards = '''{/* Targets and Supports */}
            <div className=\"grid grid-cols-2 gap-4 mb-6\">
              <div className=\"bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50\">
                <div className=\"flex items-center justify-between mb-3 border-b border-emerald-100 dark:border-emerald-800/50 pb-2\">
                  <div className=\"flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs\">
                    <Target className=\"w-4 h-4\" />
                    المستهدفات (Targets)
                  </div>
                  {isEditingTargets ? (
                    <div className=\"flex items-center gap-1\">
                      <button onClick={handleUpdateTargets} className=\"text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded\">حفظ</button>
                      <button onClick={() => setIsEditingTargets(false)} className=\"text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded\">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingTargets(true)} className=\"text-[10px] font-bold text-emerald-600 hover:underline\">تعديل</button>
                  )}
                </div>
                <div className=\"space-y-2\">
                  {[1, 2, 3].map((i) => (
                    <div key={	\} className=\"flex items-center justify-between text-xs\">
                      <span className=\"font-bold text-slate-500\">T{i}</span>
                      {isEditingTargets ? (
                        <input
                          type=\"number\" step=\"any\"
                          value={i === 1 ? t1Input : i === 2 ? t2Input : t3Input}
                          onChange={(e) => i === 1 ? setT1Input(e.target.value) : i === 2 ? setT2Input(e.target.value) : setT3Input(e.target.value)}
                          className=\"w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5\"
                          dir=\"ltr\"
                        />
                      ) : (
                        <span className=\"font-black text-emerald-700 dark:text-emerald-300 font-mono-num\">
                          {(i === 1 ? position!.plan?.target : i === 2 ? position!.plan?.targets?.[0] : position!.plan?.targets?.[1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className=\"bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50\">
                <div className=\"flex items-center justify-between mb-3 border-b border-blue-100 dark:border-blue-800/50 pb-2\">
                  <div className=\"flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs\">
                    <ArrowDownToLine className=\"w-4 h-4\" />
                    الدعوم (Supports)
                  </div>
                  {isEditingSupports ? (
                    <div className=\"flex items-center gap-1\">
                      <button onClick={handleUpdateSupports} className=\"text-[10px] font-black bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded\">حفظ</button>
                      <button onClick={() => setIsEditingSupports(false)} className=\"text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded\">إلغاء</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingSupports(true)} className=\"text-[10px] font-bold text-blue-600 hover:underline\">تعديل</button>
                  )}
                </div>
                <div className=\"space-y-2\">
                  {[1, 2, 3].map((i) => (
                    <div key={s\} className=\"flex items-center justify-between text-xs\">
                      <span className=\"font-bold text-slate-500\">S{i}</span>
                      {isEditingSupports ? (
                        <input
                          type=\"number\" step=\"any\"
                          value={i === 1 ? s1Input : i === 2 ? s2Input : s3Input}
                          onChange={(e) => i === 1 ? setS1Input(e.target.value) : i === 2 ? setS2Input(e.target.value) : setS3Input(e.target.value)}
                          className=\"w-16 bg-white dark:bg-slate-900 border text-center font-black rounded px-1 py-0.5\"
                          dir=\"ltr\"
                        />
                      ) : (
                        <span className=\"font-black text-blue-700 dark:text-blue-300 font-mono-num\">
                          {(position!.plan?.supports?.[i-1]) || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

</div>

            '''

content = content[:start_idx] + new_cards + content[end_idx:]

with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced successfully')
