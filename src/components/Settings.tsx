import { useState } from 'react';
import { Save, Download, Upload, Trash2, Wallet, ShieldCheck, Database, Info, CheckCircle } from 'lucide-react';
import { useTrades } from '../context/TradeContext';

export default function Settings() {
 const { capitalInvestment, capitalSpeculation, updateCapital } = useTrades();
 
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

 const handleExport = () => {
 const data = localStorage.getItem('egx_trades') || '[]';
 const blob = new Blob([data], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `EGX_Trades_Backup_${new Date().toISOString().split('T')[0]}.json`;
 a.click();
 URL.revokeObjectURL(url);
 };

 const handleClearData = () => {
 if (window.confirm('تحذير خطير: هل أنت متأكد من رغبتك في حذف جميع الصفقات والبيانات الخاصة بك؟ هذا الإجراء لا يمكن التراجع عنه!')) {
 if (window.confirm('تأكيد نهائي: اكتب "نعم" للمتابعة. (فقط اضغط موافق)')) {
 localStorage.removeItem('egx_trades');
 window.location.reload();
 }
 }
 };

 return (
 <div className="w-full max-w-5xl mx-auto space-y-6" dir="rtl">
 
  {/* Save Button Row */}
  <div className="flex justify-end mb-2">
    <button 
      onClick={handleSave}
      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
    >
      <Save className="w-5 h-5" />
      حفظ الإعدادات
    </button>
  </div>

 {savedMessage && (
 <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl font-bold flex items-center gap-2">
 <CheckCircle className="w-5 h-5" />
 تم حفظ الإعدادات بنجاح.
 </div>
 )}

 <div className="grid md:grid-cols-2 gap-8">
 
 {/* Capital Settings */}
 <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
 <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
 <Wallet className="w-6 h-6 text-blue-600 " />
 <h3 className="text-xl font-black text-slate-800 ">إعدادات المحفظة (رأس المال)</h3>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">رأس مال محفظة الاستثمار (EGP)</label>
 <input 
 type="number" 
 value={investment}
 onChange={(e) => setInvestment(e.target.value)}
 className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
 dir="ltr"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">رأس مال محفظة المضاربة (EGP)</label>
 <input 
 type="number" 
 value={speculation}
 onChange={(e) => setSpeculation(e.target.value)}
 className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
 dir="ltr"
 />
 </div>
 </div>
 
 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
 <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
 <p className="text-sm font-bold text-blue-800 ">
 يتم استخدام رأس المال المكتوب هنا لحساب المخاطرة في نافذة "لوحة القيادة" بشكل تلقائي عند كتابة رمز السهم.
 </p>
 </div>
 </div>

 {/* Risk Management Settings */}
 <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
 <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
 <ShieldCheck className="w-6 h-6 text-emerald-600 " />
 <h3 className="text-xl font-black text-slate-800 ">إدارة المخاطر والعمولات</h3>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">نسبة المخاطرة الافتراضية لكل صفقة (%)</label>
 <input 
 type="number" step="0.1"
 value={defaultRisk}
 onChange={(e) => setDefaultRisk(e.target.value)}
 className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
 dir="ltr"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">نسبة العمولة الافتراضية للوسيط (%)</label>
 <input 
 type="number" step="0.001"
 value={commission}
 onChange={(e) => setCommission(e.target.value)}
 className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
 dir="ltr"
 />
 </div>
 </div>
 </div>

 {/* Data Management */}
 <div className="md:col-span-2 bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
 <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
 <Database className="w-6 h-6 text-purple-600 " />
 <h3 className="text-xl font-black text-slate-800 ">إدارة البيانات والنسخ الاحتياطي</h3>
 </div>

 <div className="grid md:grid-cols-3 gap-4">
 <button 
 onClick={handleExport}
 className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-colors gap-3 group"
 >
 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
 <Download className="w-6 h-6" />
 </div>
 <span className="font-bold text-slate-700 ">تصدير نسخة احتياطية</span>
 <span className="text-xs text-slate-400 font-bold text-center">حفظ بيانات الصفقات كملف JSON</span>
 </button>

 <button className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl gap-3 group opacity-50 cursor-not-allowed">
 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
 <Upload className="w-6 h-6" />
 </div>
 <span className="font-bold text-slate-700 ">استيراد بيانات</span>
 <span className="text-xs text-slate-400 font-bold text-center">قريباً.. استعادة من ملف محلي</span>
 </button>

 <button 
 onClick={handleClearData}
 className="flex flex-col items-center justify-center p-6 bg-white border border-red-200 rounded-2xl hover:bg-red-50 hover:border-red-400 transition-colors gap-3 group"
 >
 <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
 <Trash2 className="w-6 h-6" />
 </div>
 <span className="font-bold text-red-700 ">حذف جميع البيانات</span>
 <span className="text-xs text-red-400 font-bold text-center">تصفير النظام وبدء سجل جديد</span>
 </button>
 </div>
 </div>

 </div>
 </div>
 );
}
