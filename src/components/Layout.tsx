import { LayoutDashboard, BookOpen, BarChart2, Settings, Bell, UserCircle, PenTool, TrendingUp, Target } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Decorative SVG doodles for notebook feel
const RuledLineDoodle = () => (
  <svg width="120" height="20" viewBox="0 0 120 20" className="opacity-20 text-blue-400" fill="none">
    <path d="M2 10 Q30 6 60 10 Q90 14 118 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const StarDoodle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="opacity-30 text-amber-400" fill="currentColor">
    <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" />
  </svg>
);

const ArrowDoodle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-25 text-blue-500" fill="none">
    <path d="M5 12 Q12 8 19 12 M15 9 L19 12 L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CircleDoodle = () => (
  <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-10 text-red-400" fill="none">
    <ellipse cx="25" cy="25" rx="20" ry="18" stroke="currentColor" strokeWidth="2" transform="rotate(-5 25 25)"/>
  </svg>
);

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navigation = [
    { name: 'لوحة القيادة', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'قائمة المراقبة', icon: Target, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { name: 'سجل الصفقات', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { name: 'التحليلات', icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'الإعدادات', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  ];

  const activeItem = navigation.find(n => n.name === activeTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative" dir="rtl"
      style={{
        backgroundColor: '#ffffff',
        backgroundImage: `
          repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)
        `,
        backgroundSize: '100% 32px',
      }}
    >
      
      {/* Margin line decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Left margin line (right in RTL) */}
        <div className="absolute top-0 bottom-0 right-[280px] w-[1.5px] opacity-40" style={{ background: '#e07070' }}></div>
        {/* Decorative doodles scattered around */}
        <div className="absolute top-16 right-[260px] rotate-12 hidden md:block"><StarDoodle /></div>
        <div className="absolute top-48 right-[258px] hidden md:block"><CircleDoodle /></div>
        <div className="absolute bottom-40 right-[255px] -rotate-6 hidden md:block"><StarDoodle /></div>
        <div className="absolute top-1/3 right-[252px] hidden md:block">
          <svg width="30" height="60" viewBox="0 0 30 60" fill="none" className="opacity-15 text-blue-500">
            <path d="M15 5 Q20 20 10 30 Q5 40 15 55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Paper holes (rings) on the far right */}
        <div className="absolute top-24 right-6 w-4 h-4 rounded-full border-2 border-slate-300/40 hidden md:block"></div>
        <div className="absolute top-1/2 right-6 w-4 h-4 rounded-full border-2 border-slate-300/40 hidden md:block"></div>
        <div className="absolute bottom-24 right-6 w-4 h-4 rounded-full border-2 border-slate-300/40 hidden md:block"></div>
      </div>

      {/* Desktop Sidebar — styled as a notebook tab/divider */}
      <div className="hidden md:flex flex-col w-72 relative z-10"
        style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(200,216,232,0.8)',
          boxShadow: '6px 0 24px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo area */}
        <div className="p-7 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-400/20">
                <PenTool className="w-6 h-6" />
              </div>
              {/* Small doodle star */}
              <div className="absolute -top-1.5 -right-1.5"><StarDoodle /></div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 leading-tight">سجل التداول</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-handwriting text-sm text-blue-500 font-bold">إصدار المحترفين</span>
                <TrendingUp className="w-3 h-3 text-blue-400" />
              </div>
            </div>
          </div>
          {/* Handwritten underline */}
          <div className="mt-4">
            <RuledLineDoodle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Small handwriting label */}
          <p className="font-handwriting text-xs text-slate-400 px-3 mb-3 mt-1">القوائم الرئيسية ↓</p>
          
          {navigation.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold text-right relative ${
                  isActive
                    ? `${item.bg} ${item.color} shadow-sm border ${item.border}`
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full ${item.color.replace('text-', 'bg-')}`}></div>
                )}
                <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-400'} shrink-0`} />
                <span className="text-base">{item.name}</span>
                {isActive && (
                  <div className="mr-auto">
                    <ArrowDoodle />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom decoration */}
        <div className="p-5 border-t border-slate-200/50">
          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 relative overflow-hidden">
            {/* Yellow highlight strip */}
            <div className="absolute top-0 right-0 w-1 h-full bg-amber-400 rounded-l-full"></div>
            <p className="font-handwriting text-sm text-amber-700 leading-relaxed pr-2">
              "التداول بدون جورنال مثل الملاحة بدون خريطة"
            </p>
            <p className="font-handwriting text-xs text-amber-500 mt-1 pr-2">— ستيف بيرنز</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 sticky top-0 z-20"
          style={{ background: 'rgba(253,250,244,0.90)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #c8d8e8' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl text-white shadow-md">
              <PenTool className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-800">سجل التداول</h1>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 items-center justify-between px-10 shrink-0 sticky top-0 z-20"
          style={{ background: 'rgba(253,250,244,0.70)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #c8d8e8' }}
        >
          <div className="flex items-center gap-3">
            {/* Colored tab indicator */}
            <div className={`w-1.5 h-10 rounded-full ${activeItem?.color.replace('text-', 'bg-') || 'bg-blue-500'}`}></div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 leading-tight">{activeTab}</h2>
              <div className="flex items-center gap-1">
                <RuledLineDoodle />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl border border-slate-200 bg-white/70 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            </button>
            <div className="h-7 w-px bg-slate-200"></div>
            <button className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
              <span className="font-bold text-slate-700 text-sm">المتداول</span>
              <UserCircle className="w-7 h-7 text-blue-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
        style={{ background: 'rgba(253,250,244,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid #c8d8e8' }}
      >
        <div className="flex justify-around items-center h-[68px] px-2">
          {navigation.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${isActive ? item.color : 'text-slate-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${isActive ? `${item.bg} border ${item.border}` : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
