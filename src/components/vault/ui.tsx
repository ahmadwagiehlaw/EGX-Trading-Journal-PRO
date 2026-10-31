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

