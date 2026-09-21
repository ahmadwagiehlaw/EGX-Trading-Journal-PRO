import { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden shadow-lg border-4 border-white select-none" dir="ltr" ref={containerRef}>
      {/* After Image (Background) */}
      <img src={afterImage} alt="شارت الخروج" className="w-full h-auto object-cover block pointer-events-none" />
      <div className="absolute top-4 right-4 bg-red-600/90 text-white font-black px-3 py-1 rounded-lg text-sm backdrop-blur-sm z-0">
        وقت الخروج (After)
      </div>

      {/* Before Image (Foreground) */}
      <div 
        className="absolute top-0 bottom-0 left-0 overflow-hidden z-10"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="شارت الدخول" 
          className="w-full h-full object-cover block pointer-events-none max-w-none"
          style={{ width: containerRef.current?.clientWidth || '100%' }}
        />
        <div className="absolute top-4 left-4 bg-emerald-600/90 text-white font-black px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
          وقت الدخول (Before)
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize flex items-center justify-center transition-shadow hover:shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
        onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
        onTouchStart={(e) => { setIsDragging(true); }}
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white -ml-[14px]">
          <ArrowLeftRight className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}
