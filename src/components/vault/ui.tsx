import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Card({ title, right, children, className, pad = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx('rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm', className)}>
      {(title || right) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
          {right}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md', accent }: {
  value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode }[]; size?: 'sm' | 'md'; accent?: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5" dir="rtl">
      {options.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cx(
            'rounded-[10px] font-bold transition-all whitespace-nowrap',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
            value === o.v
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
          )}
          style={value === o.v && accent ? { color: accent } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 4);
      setV(a + (target - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target, ms]);
  return v;
}

export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format(v)}</>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cx('relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition';
export const labelCls = 'block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function Empty({ icon, text, action }: { icon?: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
      <p className="text-sm font-bold text-slate-400 max-w-xs">{text}</p>
      {action}
    </div>
  );
}

export function ChartTip({ active, payload, label, labelFmt, rows }: {
  active?: boolean; payload?: { payload: Record<string, number | string> }[]; label?: string | number;
  labelFmt?: (l: string) => string; rows: (p: Record<string, number | string>) => { name: string; value: string; color: string }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-2xl border border-white/10 bg-slate-950/95 px-3.5 py-2.5 shadow-2xl backdrop-blur text-white min-w-[160px]">
      <div className="text-[11px] font-bold text-slate-400 mb-1.5">{labelFmt ? labelFmt(String(label)) : label}</div>
      {rows(p).map(r => (
        <div key={r.name} className="flex items-center justify-between gap-4 text-xs font-bold py-0.5">
          <span className="flex items-center gap-1.5 text-slate-300"><i className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.name}</span>
          <span dir="ltr" className="tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const tone = (n: number) => (n > 0 ? 'text-emerald-500' : n < 0 ? 'text-rose-500' : 'text-slate-400');

/** أيقونة سبيكة ذهب ثلاثية الأبعاد بلمعة معدنية واضحة */
export function GoldBarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cx('inline-block shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="goldTop" x1="4" y1="6" x2="20" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="45%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="goldFront" x1="2" y1="12" x2="22" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="55%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="goldSide" x1="16" y1="9" x2="22" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
      {/* Top shining face of bullion bar */}
      <path d="M6.5 8.5L17.5 8.5L19.5 13L4.5 13L6.5 8.5Z" fill="url(#goldTop)" stroke="#B45309" strokeWidth="0.6" strokeLinejoin="round" />
      {/* Front bevel face */}
      <path d="M4.5 13H19.5L21.5 18.5H2.5L4.5 13Z" fill="url(#goldFront)" stroke="#92400E" strokeWidth="0.65" strokeLinejoin="round" />
      {/* Right metallic bevel shadow */}
      <path d="M17.5 8.5L19.5 13L21.5 18.5L19 18.5L17.2 13L15.8 8.5H17.5Z" fill="url(#goldSide)" opacity="0.42" />
      {/* Top specular highlight */}
      <path d="M7.6 10.2H14.5" stroke="#FFFBEB" strokeWidth="1.15" strokeLinecap="round" opacity="0.9" />
      {/* Small sparkle above bar */}
      <path d="M19.5 4.2L20 5.5L21.3 6L20 6.5L19.5 7.8L19 6.5L17.7 6L19 5.5L19.5 4.2Z" fill="#FDE047" />
    </svg>
  );
}

