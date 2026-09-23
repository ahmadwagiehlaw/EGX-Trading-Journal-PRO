import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  Settings, 
  TrendingUp, 
  Target, 
  Wifi, 
  WifiOff, 
  ShieldCheck,
  Moon,
  Sun,
  Landmark
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigation = [
    { name: 'لوحة القيادة', icon: LayoutDashboard, color: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-600 text-white shadow-blue-500/20' },
    { name: 'قائمة المراقبة', icon: Target, color: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-600 text-white shadow-orange-500/20' },
    { name: 'سجل الصفقات', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-600 text-white shadow-emerald-500/20' },
    { name: 'الخزينة', icon: Landmark, color: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-600 text-white shadow-indigo-500/20' },
    { name: 'التحليلات', icon: BarChart2, color: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-600 text-white shadow-purple-500/20' },
    { name: 'الإعدادات', icon: Settings, color: 'text-slate-600 dark:text-slate-400', activeBg: 'bg-slate-800 dark:bg-slate-700 text-white' },
  ];

  const activeItem = navigation.find(n => n.name === activeTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200" dir="rtl">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shadow-sm shrink-0 z-30 select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/10">
              <TrendingUp className="w-5 h-5 text-blue-400 dark:text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">سجل التداول</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  EGX Journal PRO
                </span>
              </div>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-3 mb-2">القوائم الرئيسية</p>
          
          {navigation.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-150 ${
                  isActive
                    ? `${item.activeBg} shadow-md`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                <span className="flex-1 text-right">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Offline / Online Status Indicator */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            isOnline 
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />}
              <span>{isOnline ? 'متصل بالسحابة (Sync)' : 'يعمل بدون إنترنت (Offline)'}</span>
            </div>
            <ShieldCheck className="w-4 h-4 opacity-70" />
          </div>
        </div>

      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 text-white rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400 dark:text-white" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${
              isOnline ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span>{isOnline ? 'مزامنة' : 'أوفلاين'}</span>
            </div>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-7 rounded-full ${activeItem?.color.replace('text-', 'bg-').split(' ')[0] || 'bg-blue-600'}`}></div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm"
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </button>

            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              isOnline 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span>{isOnline ? 'متصل بالسحابة' : 'وضع غير متصل (Offline Ready)'}</span>
            </div>
          </div>
        </header>

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg">
        <div className="flex items-center justify-around h-16 px-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive ? item.color : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 scale-110' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black mt-0.5 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
