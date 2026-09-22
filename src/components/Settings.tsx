import { useState } from 'react';
import { 
  Save, 
  Download, 
  Trash2, 
  Wallet, 
  ShieldCheck, 
  Database, 
  Info, 
  CheckCircle,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { exportPositionsToCsv, exportPlansToCsv } from '../utils/exportCsv';

export default function Settings() {
  const { capitalInvestment, capitalSpeculation, updateCapital, positions, plans } = useTrades();
  
  const [investment, setInvestment] = useState(capitalInvestment.toString());
  const [speculation, setSpeculation] = useState(capitalSpeculation.toString());
  const [defaultRisk, setDefaultRisk] = useState('1');
  const [commission, setCommission] = useState('0.003');

  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    updateCapital(parseFloat(investment) || 0, parseFloat(speculation) || 0);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleExportJson = () => {
    const backupData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      capital: { investment: parseFloat(investment), speculation: parseFloat(speculation) },
      positions,
      plans,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EGX_Journal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('تحذير خطير: هل أنت متأكد من رغبتك في حذف جميع الصفقات والبيانات الخاصة بك؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      if (window.confirm('تأكيد نهائي: اضغط موافق لتصفير السجل.')) {
        localStorage.removeItem('egx_trades');
        window.location.reload();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" dir="rtl">
      
      {/* Save Button Row */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">إعدادات الحساب والمحفظة</h2>
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 text-sm active:scale-95"
        >
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          تم حفظ الإعدادات بنجاح.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Capital Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إعدادات المحفظة (رأس المال)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">رأس مال محفظة الاستثمار (EGP)</label>
              <input 
                type="number" 
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-blue-500 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">رأس مال محفظة المضاربة (EGP)</label>
              <input 
                type="number" 
                value={speculation}
                onChange={(e) => setSpeculation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-blue-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 leading-relaxed">
              يُستخدم رأس المال لحساب نسبة المخاطرة (1%) وسقف السيولة (25%) في كل عملية تداول وغرفة العمليات.
            </p>
          </div>
        </div>

        {/* Risk Management Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إدارة المخاطر والعمولات</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نسبة المخاطرة الافتراضية لكل صفقة (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={defaultRisk}
                onChange={(e) => setDefaultRisk(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-emerald-500 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">نسبة عمولة الوسيط والرسوم (0.003 = 0.3%)</label>
              <input 
                type="number" 
                step="0.0005"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-900 dark:text-white font-black text-sm focus:border-emerald-500 outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 leading-relaxed">
              تُحسب العمولات والدمغة تلقائياً لحساب صافي الأرباح المحققة بعد المصاريف (Net P&L).
            </p>
          </div>
        </div>

        {/* Data Export & Backup Management */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">إدارة البيانات، النسخ الاحتياطي وتصدير Excel</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Export to Excel (Positions) */}
            <button 
              onClick={() => exportPositionsToCsv(positions)}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">تصدير الصفقات Excel / CSV</span>
              <span className="text-[10px] text-slate-400 font-bold">كشف حساب صفقات متكامل</span>
            </button>

            {/* Export Watchlist Plans to CSV */}
            <button 
              onClick={() => exportPlansToCsv(plans)}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-700 hover:border-orange-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">تصدير خطط المراقبة CSV</span>
              <span className="text-[10px] text-slate-400 font-bold">حفظ قوائم المراقبة كملف</span>
            </button>

            {/* JSON Backup */}
            <button 
              onClick={handleExportJson}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-slate-800 dark:text-white">نسخة احتياطية كاملة (JSON)</span>
              <span className="text-[10px] text-slate-400 font-bold">حفظ قاعدة البيانات السحابية</span>
            </button>

            {/* Reset / Clear Data */}
            <button 
              onClick={handleClearData}
              className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 hover:border-red-300 rounded-2xl transition-all gap-2.5 group text-center"
            >
              <div className="w-11 h-11 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="font-black text-xs text-red-700 dark:text-red-400">تصفير سجل الصفقات</span>
              <span className="text-[10px] text-slate-400 font-bold">حذف البيانات وبدء سجل جديد</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
