import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  X
} from 'lucide-react';
import { useTrades, type TickerPosition } from '../context/TradeContext';
import { computePositionMetrics, formatEGP } from '../utils/calculations';

interface DayTradeSummary {
  dateStr: string;
  dayNumber: number;
  positions: TickerPosition[];
  netPnL: number;
  tradesCount: number;
  wonCount: number;
  lostCount: number;
}

export default function PnLCalendar() {
  const { positions } = useTrades();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<DayTradeSummary | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNamesArabic = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // Group closed positions by date string (YYYY-MM-DD)
  const tradesByDay = useMemo(() => {
    const map: Record<string, TickerPosition[]> = {};

    positions.forEach((pos) => {
      const metrics = computePositionMetrics(pos);
      if (pos.status === 'closed' || metrics.isFullyClosed) {
        const closeDate = pos.journal?.closedDate || pos.journal?.openedDate || pos.entryDate;
        if (closeDate) {
          const d = new Date(closeDate);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!map[key]) map[key] = [];
          map[key].push(pos);
        }
      }
    });

    return map;
  }, [positions]);

  // Calendar matrix calculation
  const calendarData = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (DayTradeSummary | null)[] = [];

    // Prepend empty slots before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    let monthlyTotalPnL = 0;
    let monthlyTradesCount = 0;
    let greenDaysCount = 0;
    let redDaysCount = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayPositions = tradesByDay[dateKey] || [];
      
      let dayPnL = 0;
      let wonCount = 0;
      let lostCount = 0;

      dayPositions.forEach(p => {
        const pnl = computePositionMetrics(p).realizedPnL;
        dayPnL += pnl;
        if (pnl > 0) wonCount++;
        else if (pnl < 0) lostCount++;
      });

      if (dayPositions.length > 0) {
        monthlyTotalPnL += dayPnL;
        monthlyTradesCount += dayPositions.length;
        if (dayPnL > 0) greenDaysCount++;
        else if (dayPnL < 0) redDaysCount++;
      }

      days.push({
        dateStr: dateKey,
        dayNumber: day,
        positions: dayPositions,
        netPnL: dayPnL,
        tradesCount: dayPositions.length,
        wonCount,
        lostCount,
      });
    }

    return {
      days,
      monthlyTotalPnL,
      monthlyTradesCount,
      greenDaysCount,
      redDaysCount,
    };
  }, [year, month, tradesByDay]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="w-full space-y-6" dir="rtl">
      
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              تقويم الأرباح والخسائر اليومية (P&L Calendar)
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">
              خريطة بصرية للأيام الرابحة والخاسرة خلال الشهر
            </p>
          </div>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl transition-all"
            title="الشهر القادم"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-black text-sm text-slate-800 dark:text-white px-3 font-mono-num">
            {monthNamesArabic[month]} {year}
          </span>
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl transition-all"
            title="الشهر السابق"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">أرباح الشهر الصافية</span>
          <span className={`text-base font-black font-mono-num ${calendarData.monthlyTotalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
            {calendarData.monthlyTotalPnL > 0 ? '+' : ''}{formatEGP(calendarData.monthlyTotalPnL)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">الأيام الرابحة (Green Days)</span>
          <span className="text-base font-black text-emerald-600 font-mono-num">
            {calendarData.greenDaysCount} يوم ✓
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">الأيام الخاسرة (Red Days)</span>
          <span className="text-base font-black text-red-600 font-mono-num">
            {calendarData.redDaysCount} يوم ✕
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-0.5">إجمالي الصفقات المغلقة</span>
          <span className="text-base font-black text-blue-600 font-mono-num">
            {calendarData.monthlyTradesCount} صفقة
          </span>
        </div>
      </div>

      {/* Calendar Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {daysOfWeek.map((dayName, idx) => (
            <div key={dayName} className={`py-2 rounded-xl text-xs font-black ${
              idx === 5 || idx === 6 ? 'text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.days.map((dayItem, idx) => {
            if (!dayItem) {
              return (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-transparent" />
              );
            }

            const hasTrades = dayItem.tradesCount > 0;
            const isProfit = dayItem.netPnL > 0;
            const isLoss = dayItem.netPnL < 0;

            return (
              <div
                key={dayItem.dateStr}
                onClick={() => hasTrades && setSelectedDay(dayItem)}
                className={`h-20 sm:h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  hasTrades ? 'cursor-pointer hover:scale-[1.02] shadow-sm' : 'opacity-60'
                } ${
                  !hasTrades
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                    : isProfit
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : isLoss
                        ? 'bg-red-50/90 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black font-mono-num">{dayItem.dayNumber}</span>
                  {hasTrades && (
                    <span className="text-[10px] bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.2 rounded font-bold">
                      {dayItem.tradesCount}
                    </span>
                  )}
                </div>

                {hasTrades ? (
                  <div className="text-center my-auto">
                    <span className={`text-xs sm:text-sm font-black font-mono-num block leading-tight ${
                      isProfit ? 'text-emerald-700 dark:text-emerald-400' : isLoss ? 'text-red-700 dark:text-red-400' : 'text-slate-600'
                    }`} dir="ltr">
                      {dayItem.netPnL > 0 ? '+' : ''}{dayItem.netPnL.toFixed(0)}
                    </span>
                  </div>
                ) : (
                  <div className="h-4" />
                )}

                <div className="h-1" />
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Modal Details */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  صفقات يوم {selectedDay.dateStr}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  صافي الربح: <span className={selectedDay.netPnL >= 0 ? 'text-emerald-600' : 'text-red-600'} dir="ltr">{formatEGP(selectedDay.netPnL)}</span>
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {selectedDay.positions.map(pos => {
                const metrics = computePositionMetrics(pos);
                return (
                  <div key={pos.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white" dir="ltr">{pos.symbol}</span>
                        <span className="text-[11px] text-slate-500">{pos.plan?.strategy || 'صفقة'}</span>
                      </div>
                      {pos.journal?.lessonLearned && (
                        <p className="text-[11px] text-slate-400 font-handwriting mt-0.5">
                          "{pos.journal.lessonLearned}"
                        </p>
                      )}
                    </div>
                    <div className="text-left font-mono-num">
                      <span className={`text-sm font-black ${metrics.realizedPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                        {metrics.realizedPnL > 0 ? '+' : ''}{formatEGP(metrics.realizedPnL)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
