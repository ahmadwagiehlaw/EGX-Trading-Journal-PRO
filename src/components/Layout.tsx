import { useState, useEffect } from 'react';
import {
  Gamepad2,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Settings,
  TrendingUp,
  Target,
  Wallet,
  Wifi,
  WifiOff,
  ShieldCheck,
  Moon,
  Sun,
  Pin,
  PinOff,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTrades } from '../context/TradeContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { theme, toggleTheme } = useTheme();
  const { isSimulator, toggleSimulator } = useTrades();
  const [showTreasuryTab, setShowTreasuryTab] = useState(() => localStorage.getItem('egx_show_treasury_tab') !== 'false');

  // التحكم في ضم وتثبيت القائمة الجانبية على اللابتوب (مع التوسع التلقائي عند مرور الماوس)
  const [isPinned, setIsPinned] = useState<boolean>(() => localStorage.getItem('egx_sidebar_pinned') !== 'false');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isExpanded = isPinned || isHovered;

  const togglePin = () => {
    setIsPinned(prev => {
      const next = !prev;
      localStorage.setItem('egx_sidebar_pinned', String(next));
      if (!next) setIsHovered(false);
      return next;
    });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleNavChange = () => {
      setShowTreasuryTab(localStorage.getItem('egx_show_treasury_tab') !== 'false');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleNavChange);
    window.addEventListener('egx_nav_settings_changed', handleNavChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleNavChange);
      window.removeEventListener('egx_nav_settings_changed', handleNavChange);
    };
  }, []);

  const allNavigation = [
    { id: 'dashboard', name: 'لوحة القيادة', shortLabel: 'الرئيسية', icon: LayoutDashboard, color: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-600 text-white shadow-blue-500/20' },
    { id: 'journal', name: 'سجل الصفقات', shortLabel: 'الصفقات', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-500', activeBg: 'bg-emerald-600 text-white shadow-emerald-500/20' },
    { id: 'vault', name: 'الخزينة', shortLabel: 'الخزنة', icon: Wallet, color: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-600 text-white shadow-amber-500/20', isCenter: true },
    { id: 'plans', name: 'استراتيجيات التداول', shortLabel: 'الخطط', icon: Target, color: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-600 text-white shadow-orange-500/20' },
    { id: 'analytics', name: 'التحليلات', shortLabel: 'التحليلات', icon: BarChart2, color: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-600 text-white shadow-purple-500/20' },
    { id: 'settings', name: 'الإعدادات', shortLabel: 'الإعدادات', icon: Settings, color: 'text-slate-600 dark:text-slate-400', activeBg: 'bg-slate-800 dark:bg-slate-700 text-white', desktopOnly: true },
  ];

  const navigation = allNavigation.filter(item => item.name !== 'الخزينة' || showTreasuryTab);

  const activeItem = allNavigation.find(n => n.name === activeTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200" dir="rtl">
      
      {/* Desktop Sidebar (Collapsible with Auto-Hover & Pin Toggle) */}
      <aside
        onMouseEnter={() => { if (!isPinned) setIsHovered(true); }}
        onMouseLeave={() => { if (!isPinned) setIsHovered(false); }}
        className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 shrink-0 z-30 select-none transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'w-64 lg:w-72 shadow-xl'
            : 'w-20 shadow-sm'
        }`}
      >
        {/* Brand Header */}
        <div className={`border-b border-slate-100 dark:border-slate-800 flex items-center transition-all duration-300 ${
          isExpanded ? 'p-5 justify-between' : 'p-3 flex-col gap-2.5 justify-center'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={togglePin}
              title={isPinned ? 'ضم القائمة الجانبية (توسع تلقائي بالماوس)' : 'تثبيت القائمة الجانبية مفتوحة'}
              className="w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0 cursor-pointer hover:scale-105 transition-transform"
            >
              <TrendingUp className="w-5 h-5 text-blue-400 dark:text-white" />
            </div>
            {isExpanded && (
              <div className="min-w-0 animate-in fade-in duration-200">
                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">سجل التداول</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md truncate">
                    EGX Journal PRO
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center ${isExpanded ? 'gap-1' : 'flex-col gap-1.5'}`}>
            {/* Pin / Auto-Collapse Button */}
            <button
              onClick={togglePin}
              className={`p-2 rounded-xl transition-all ${
                isPinned
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isPinned ? 'القائمة مثبتة — اضغط للضم والتوسع التلقائي عند مرور الماوس' : 'تثبيت القائمة مفتوحة دائماً'}
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            {/* Simulator Toggle */}
            <button
              onClick={toggleSimulator}
              className={`p-2 rounded-xl transition-colors ${isSimulator ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={isSimulator ? 'إغلاق المحاكي التجريبي' : 'تفعيل المحاكي التجريبي'}
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            {/* Theme Toggle Button */}
            {isExpanded && (
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 overflow-y-auto space-y-1.5 transition-all duration-300 ${isExpanded ? 'p-4' : 'p-2.5'}`}>
          {isExpanded ? (
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">القوائم الرئيسية</p>
              {!isPinned && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                  تلقائي
                </span>
              )}
            </div>
          ) : (
            <div className="h-2" />
          )}
          
          {navigation.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                title={!isExpanded ? item.name : undefined}
                className={`w-full flex items-center rounded-2xl font-bold text-sm transition-all duration-150 ${
                  isExpanded ? 'gap-3.5 px-4 py-3' : 'justify-center p-3'
                } ${
                  isActive
                    ? `${item.activeBg} shadow-md`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                {isExpanded && <span className="flex-1 text-right truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Offline / Online Status Indicator */}
        <div className={`border-t border-slate-100 dark:border-slate-800 transition-all duration-300 ${isExpanded ? 'p-4' : 'p-2.5'}`}>
          <div
            title={!isExpanded ? (isOnline ? 'متصل بالسحابة (Sync)' : 'يعمل بدون إنترنت (Offline)') : undefined}
            className={`rounded-2xl border flex items-center text-xs font-bold ${
              isExpanded ? 'p-3 justify-between' : 'p-2.5 justify-center'
            } ${
              isOnline 
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" /> : <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />}
              {isExpanded && <span className="truncate">{isOnline ? 'متصل بالسحابة (Sync)' : 'يعمل بدون إنترنت (Offline)'}</span>}
            </div>
            {isExpanded && <ShieldCheck className="w-4 h-4 opacity-70 shrink-0" />}
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
              isOnline ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-500' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span>{isOnline ? 'مزامنة' : 'أوفلاين'}</span>
            </div>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 items-center justify-between px-8 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePin}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
              title={isPinned ? 'ضم القائمة الجانبية لتكبير مساحة الصفحة' : 'تثبيت القائمة الجانبية مفتوحة'}
            >
              {isPinned ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4 text-blue-500" />}
            </button>
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
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span>{isOnline ? 'متصل بالسحابة' : 'وضع غير متصل (Offline Ready)'}</span>
            </div>
          </div>
        </header>

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className={`mx-auto w-full transition-all duration-300 ${isPinned ? 'max-w-7xl' : 'max-w-[1600px]'}`}>
            {children}
          </div>
        </main>

      </div>

      {/* Mobile Bottom Navigation Bar with Perfectly Centered Vault Button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 pb-safe shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-5 items-end h-16 px-1 relative max-w-lg mx-auto">
          {navigation.filter((item: any) => !item.desktopOnly).map((item: any) => {
            const isActive = activeTab === item.name;
            const isCenter = item.isCenter;

            if (isCenter) {
              return (
                <div key={item.name} className="flex flex-col items-center justify-center -translate-y-3">
                  <button
                    onClick={() => setActiveTab(item.name)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl ${
                      isActive
                        ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white shadow-orange-500/50 ring-4 ring-white dark:ring-slate-900 scale-105"
                        : "bg-white dark:bg-slate-800 text-amber-500 border-2 border-amber-500/40 ring-4 ring-slate-100/80 dark:ring-slate-900 shadow-slate-900/10 hover:border-amber-500"
                    }`}
                    title="الخزنة والمركز المالي"
                  >
                    <item.icon className="w-6 h-6 drop-shadow-sm" />
                  </button>
                  <span className={`text-[11px] font-black mt-1 ${
                    isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {item.shortLabel}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex flex-col items-center justify-center h-full py-1 transition-all active:scale-95 ${
                  isActive ? item.color : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-slate-100 dark:bg-slate-800 scale-110" : ""}`}>
                  <item.icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className={`text-[11px] font-bold mt-0.5 tracking-tight ${isActive ? "font-black opacity-100" : "opacity-75"}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
