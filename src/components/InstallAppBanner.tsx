import { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('egx_dismiss_install') === 'true';
    } catch {
      return false;
    }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone window
    try {
      if (localStorage.getItem('egx_app_installed') === 'true') {
        setIsInstalled(true);
        return;
      }
    } catch {
      // ignore
    }

    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
      try {
        localStorage.setItem('egx_app_installed', 'true');
      } catch {
        // ignore
      }
      return;
    }

    // 2. Detect iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for native browser PWA prompt (Chrome, Edge, Android)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('egx_app_installed', 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        try {
          localStorage.setItem('egx_app_installed', 'true');
        } catch {
          // ignore
        }
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  const handleNeverShowAgain = () => {
    try {
      localStorage.setItem('egx_dismiss_install', 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  // If already installed or user dismissed it
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {/* Centered Top Banner */}
      <div 
        className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-amber-500/30 backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300" 
        dir="rtl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-500/25">
            <Download className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white truncate">تثبيت التطبيق على جهازك</h4>
            <p className="text-[10px] text-amber-300 font-bold flex items-center gap-1.5 mt-0.5 truncate">
              <Smartphone className="w-3 h-3 text-amber-400 shrink-0" /> تطبيق مستقل سريع بدون شريط المتصفح
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>تثبيت</span>
          </button>

          <button
            onClick={handleNeverShowAgain}
            className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors px-1.5 py-1 rounded hover:bg-white/5 whitespace-nowrap"
            title="عدم الظهور مجدداً"
          >
            عدم الظهور مجدداً
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-white/10"
            title="إغلاق مؤقتاً"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop & Android In-App Guide Modal (replaces browser alert) */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">طريقة تثبيت التطبيق</h3>
                  <p className="text-[11px] font-bold text-slate-400">على الكمبيوتر أو المتصفح</p>
                </div>
              </div>
              <button onClick={() => setShowDesktopGuide(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200">على الكمبيوتر (Chrome أو Edge):</span>
                  <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    ستجد أيقونة تثبيت صغيرة <span className="inline-block px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">🖥️ تثبيت التطبيق</span> في أقصى يمين أو يسار شريط عنوان الموقع (Address Bar) بالأعلى.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200">أو من قائمة المتصفح (⋮):</span>
                  <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    اضغط على الثلاث نقاط بالأعلى ثم اختر <b>"تثبيت EGX Journal PRO"</b> أو <b>"حفظ ومشاركة ⬅️ تثبيت"</b>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <span className="font-black text-slate-800 dark:text-slate-200">على هاتف أندرويد:</span>
                  <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                    اضغط على قائمة المتصفح (⋮) ثم اختر <b>"إضافة إلى الشاشة الرئيسية" (Add to Home screen)</b>.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 py-2.5 rounded-xl font-black text-xs shadow-md shadow-orange-500/20"
              >
                فهمت ذلك
              </button>
              <button
                onClick={() => {
                  setShowDesktopGuide(false);
                  handleNeverShowAgain();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                عدم الظهور مجدداً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">تثبيت التطبيق على الآيفون</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <ol className="space-y-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-black flex items-center justify-center shrink-0">1</span>
                <span>اضغط على زر <b>المشاركة (Share)</b> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> في أسفل شاشة متصفح Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-black flex items-center justify-center shrink-0">2</span>
                <span>مرر للأسفل واضغط على <b>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</b> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-500" />.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 font-black flex items-center justify-center shrink-0">3</span>
                <span>اضغط على <b>إضافة (Add)</b> بأعلى الشاشة، وسيظهر التطبيق على شاشتك الرئيسية كأي تطبيق رسمي!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl font-black text-xs"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </>
  );
}
