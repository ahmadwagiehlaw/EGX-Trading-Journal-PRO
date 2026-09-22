import { useState, useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';
import { searchEGXStocks, getStockBySymbol, type EGXStock } from '../data/egxStocks';

interface StockAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (stock: EGXStock) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function StockAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'ابحث بالرمز أو اسم الشركة (مثال: COMI أو التجاري)...',
  className = '',
  autoFocus = false,
}: StockAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<EGXStock[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      const filtered = searchEGXStocks(query);
      setResults(filtered);
      setSelectedIndex(0);
    }
  }, [query, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: EGXStock) => {
    onChange(stock.symbol);
    setQuery(stock.symbol);
    onSelect?.(stock);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const currentStock = getStockBySymbol(value);

  return (
    <div ref={containerRef} className="relative w-full" dir="rtl">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          autoFocus={autoFocus}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val.toUpperCase());
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all ${className}`}
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        
        {currentStock && !isOpen && (
          <span className="absolute left-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none hidden sm:inline-block">
            {currentStock.nameAr}
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs font-bold text-slate-400">
              لا يوجد سهم يطابق البحث — يمكنك كتابة الرمز مباشرة.
            </div>
          ) : (
            results.map((stock, idx) => {
              const isSelected = idx === selectedIndex;
              const isCurrent = stock.symbol.toUpperCase() === value.toUpperCase();

              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelect(stock)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center font-black text-xs font-mono-num shrink-0">
                      {stock.symbol}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{stock.nameAr}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">
                          {stock.sector}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block font-medium" dir="ltr">
                        {stock.symbol} • {stock.nameEn}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
