const fs = require('fs');
let settings = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Add coreSatelliteTarget to the destructured useTrades call
settings = settings.replace(
  `const { capitalInvestment, capitalSpeculation, positions, plans, commissionRate, updateCommissionRate } = useTrades();`,
  `const { capitalInvestment, capitalSpeculation, positions, plans, commissionRate, updateCommissionRate, coreSatelliteTarget, setCoreSatelliteTarget } = useTrades();`
);

// Find where to insert the Core & Satellite settings section — before the commission section or danger zone
// Let's insert it before the export/danger zone. Find a unique anchor.
const insertBefore = `{/* Danger Zone */}`;

const coreSatSection = `{/* Core & Satellite Strategy Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">استراتيجية Core & Satellite</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">حدد نسبة الأسهم الاستراتيجية طويلة الأمد (Core) مقابل أسهم التكتيك والنمو (Satellite)</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">نسبة Core المستهدفة</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{coreSatelliteTarget}%</span>
              <span className="text-xs text-slate-400">Core</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-lg font-black text-amber-500">{100 - coreSatelliteTarget}%</span>
              <span className="text-xs text-slate-400">Satellite</span>
            </div>
          </div>

          <input
            type="range"
            min={50} max={90} step={5}
            value={coreSatelliteTarget}
            onChange={e => setCoreSatelliteTarget(parseInt(e.target.value))}
            className="w-full h-2 rounded-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex justify-between text-xs text-slate-400">
            <span>50% (متوازن)</span>
            <span>75% (موصى به)</span>
            <span>90% (محافظ جداً)</span>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/40">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold leading-relaxed">
              💡 النسبة المختارة <strong>{coreSatelliteTarget}%</strong> تعني أن {coreSatelliteTarget}% من محفظة الاستثمار يجب أن تكون في أسهم أساسية مستقرة (Core)،
              والـ {100 - coreSatelliteTarget}% المتبقية مسموح بها لأسهم النمو والمخاطرة المحسوبة (Satellite).
              التطبيق سينبهك تلقائياً إذا اختل هذا التوازن.
            </p>
          </div>
        </div>
      </div>

      `;

settings = settings.replace(insertBefore, coreSatSection + insertBefore);

// Make sure Target icon is imported
if (!settings.includes('Target,') && !settings.includes('Target }')) {
  settings = settings.replace(`import {`, `import { Target,`);
}

fs.writeFileSync('src/components/Settings.tsx', settings, 'utf8');
console.log('✓ Settings updated with Core & Satellite section');
