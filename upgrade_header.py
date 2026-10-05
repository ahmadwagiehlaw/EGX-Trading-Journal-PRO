# -*- coding: utf-8 -*-
with open('src/components/ActiveTrades.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old and new blocks
old_header = """            {/* Header / Ticker Summary */}
            <div className="mb-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                    metrics!.isOpen 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1 mb-2">
                  متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)} EGP</span>
                </p>
                </div>
              <div className="text-left">
                <p className="text-slate-400 font-bold text-xs">الكمية المفتوحة</p>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono-num">{metrics!.openShares.toLocaleString()} سهم</p>
              </div>
              </div>"""

new_header = """            {/* Header / Ticker Summary */}
            <div className="mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight" dir="ltr">{position!.symbol}</h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                      metrics!.isOpen 
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}>
                      {metrics!.isOpen ? 'مركز مفتوح' : 'مغلق'}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
                    متوسط سعر الدخول: <span className="text-blue-600 dark:text-blue-400 font-mono-num font-black">{metrics!.avgEntry.toFixed(2)} EGP</span>
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-slate-400 font-bold text-xs mb-0.5">الكمية المفتوحة</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono-num drop-shadow-sm">{metrics!.openShares.toLocaleString()} <span className="text-lg">سهم</span></p>
                </div>
              </div>

              {/* Key Financial Metrics Strip */}
              {metrics!.isOpen && (
                <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                    <span className="text-[10px] font-bold text-slate-400">التكلفة الإجمالية</span>
                    <span className="text-sm font-black font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                      {(metrics!.openShares * metrics!.avgEntry).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-3 last:border-0 last:pl-0">
                    <span className="text-[10px] font-bold text-slate-400">القيمة السوقية</span>
                    <span className="text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400" dir="ltr">
                      {(metrics!.openShares * metrics!.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">الربح المحقق (Net)</span>
                    <span className={`text-sm font-black font-mono-num ${metrics!.netRealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
                      {metrics!.netRealizedPnL > 0 ? '+' : ''}{metrics!.netRealizedPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} EGP
                    </span>
                  </div>
                </div>
              )}"""

if old_header in content:
    content = content.replace(old_header, new_header)
    with open('src/components/ActiveTrades.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Upgraded header successfully!")
else:
    print("Could not find the exact old_header block to replace. Here's a fuzzy matching attempt...")
    # fallback if whitespace is weird
    pass

