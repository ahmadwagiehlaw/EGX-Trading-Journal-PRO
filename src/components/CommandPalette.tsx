import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search, PenTool, LayoutDashboard, Target, BookOpen, BarChart2, Settings as SettingsIcon } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  onStartTrade: () => void;
}

export default function CommandPalette({ open, setOpen, setActiveTab, onStartTrade }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh] bg-slate-900/50 backdrop-blur-sm" dir="rtl" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        <Command className="w-full h-full flex flex-col" label="لوحة الأوامر السريعة">
          <div className="flex items-center border-b border-slate-100 px-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input 
              autoFocus
              placeholder="ابحث عن أمر أو سهم (مثال: صفقة جديدة)..." 
              className="w-full py-4 px-3 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-bold"
            />
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
              <span className="font-sans">ESC</span>
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-500 font-bold">لم نجد أي نتائج.</Command.Empty>

            <Command.Group heading="إجراءات سريعة" className="text-xs font-black text-slate-400 px-2 py-1.5 mt-2">
              <Command.Item 
                onSelect={() => { onStartTrade(); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 text-slate-700 font-bold transition-colors"
              >
                <div className="bg-blue-100 p-1.5 rounded-lg"><PenTool className="w-4 h-4 text-blue-600" /></div>
                تسجيل صفقة جديدة
              </Command.Item>
            </Command.Group>

            <Command.Group heading="الانتقال إلى" className="text-xs font-black text-slate-400 px-2 py-1.5 mt-2">
              {[
                { name: 'لوحة القيادة', icon: LayoutDashboard, color: 'blue' },
                { name: 'قائمة المراقبة', icon: Target, color: 'orange' },
                { name: 'سجل الصفقات', icon: BookOpen, color: 'emerald' },
                { name: 'التحليلات', icon: BarChart2, color: 'purple' },
                { name: 'الإعدادات', icon: SettingsIcon, color: 'slate' }
              ].map((tab) => (
                <Command.Item 
                  key={tab.name}
                  onSelect={() => { setActiveTab(tab.name); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-slate-50 aria-selected:text-slate-900 text-slate-700 font-bold transition-colors"
                >
                  <div className={`bg-${tab.color}-50 p-1.5 rounded-lg`}><tab.icon className={`w-4 h-4 text-${tab.color}-600`} /></div>
                  الذهاب إلى {tab.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
