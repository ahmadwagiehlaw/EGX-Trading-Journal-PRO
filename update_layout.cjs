const fs = require('fs');
let c = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!c.includes('useTrades')) {
  c = c.replace(/import \{ useTheme \} from '\.\.\/context\/ThemeContext';/, "import { useTheme } from '../context/ThemeContext';\nimport { useTrades } from '../context/TradeContext';");
}

c = c.replace(/const \{ theme, toggleTheme \} = useTheme\(\);/, "const { theme, toggleTheme } = useTheme();\n  const { isSimulator, toggleSimulator } = useTrades();");

if (!c.includes('Gamepad2')) {
  c = c.replace(/import \{ /, "import { Gamepad2, ");
}

const themeToggleButton = `{/* Simulator Toggle */}
          <button
            onClick={toggleSimulator}
            className={\`p-2 rounded-xl transition-colors \${isSimulator ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
            title={isSimulator ? 'إغلاق المحاكي التجريبي' : 'تفعيل المحاكي التجريبي'}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          {/* Theme Toggle Button */}`;

c = c.replace(/\{\/\* Theme Toggle Button \*\/\}/, themeToggleButton);

const bannerCode = `{/* Simulator Banner */}
        {isSimulator && (
          <div className="bg-amber-500 text-amber-950 font-black text-xs py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm z-50 animate-pulse-slow">
            <Gamepad2 className="w-4 h-4" />
            أنت الآن في وضع المحاكي التجريبي (Paper Trading) - جميع العمليات معزولة تماماً عن بياناتك الحقيقية
          </div>
        )}
        
        {/* Offline Banner */}`;

c = c.replace(/\{\/\* Offline Banner \*\/\}/, bannerCode);

fs.writeFileSync('src/components/Layout.tsx', c, 'utf8');
console.log('Layout updated for Simulator');
