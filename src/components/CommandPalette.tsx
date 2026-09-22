import { useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, PenTool, LayoutDashboard, Target, BookOpen, BarChart2, Settings as SettingsIcon } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  setActiveTab: (tab: string) => void;
  onStartTrade: () => void;
}

export default function CommandPalette({ open, setOpen, setActiveTab, onStartTrade }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev: boolean) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh] bg-slate-900/60 backdrop-blur-sm" dir="rtl" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <Command className="w-full h-full flex flex-col" label="لوحة الأوامر السريعة">
          <div className="flex items-center border-b border-slate-100 dark:border-slate-800 px-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="ابحث عن أمر أو سهم (مثال: صفقة جديدة)..." 
              className="w-full py-4 px-3 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-bold"
            />
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              <span className="font-sans">ESC</span>
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 font-bold">لم نجد أي نتائج.</Command.Empty>

            <Command.Group heading="إجراءات سريعة" className="text-xs font-black text-slate-400 dark:text-slate-500 px-2 py-1.5 mt-2">
              <Command.Item 
                onSelect={() => { onStartTrade(); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/60 aria-selected:text-blue-700 dark:aria-selected:text-blue-300 text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                <div className="bg-blue-100 dark:bg-blue-900/40 p-1.5 rounded-lg"><PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                تسجيل صفقة جديدة
              </Command.Item>
            </Command.Group>

            <Command.Group heading="الانتقال إلى" className="text-xs font-black text-slate-400 dark:text-slate-500 px-2 py-1.5 mt-2">
              {[
                { name: 'لوحة القيادة', icon: LayoutDashboard, color: 'blue' },
                { name: 'قائمة المراقبة', icon: Target, color: 'orange' },
                { name: 'سجل الصفقات', icon: BookOpen, color: 'emerald' },
                { name: 'التحليلات', icon: BarChart2, color: 'purple' },
                { name: 'الإعدادات', icon: SettingsIcon, color: 'slate' }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Command.Item 
                    key={tab.name}
                    onSelect={() => { setActiveTab(tab.name); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white text-slate-700 dark:text-slate-300 font-bold transition-colors"
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg"><Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" /></div>
                    الذهاب إلى {tab.name}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
