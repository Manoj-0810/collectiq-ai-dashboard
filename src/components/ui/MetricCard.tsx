import { useEffect, useRef, useState } from 'react';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
}

export function MetricCard({ label, value, delta, deltaPositive, icon: Icon, loading }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const valueRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (loading || hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const numericMatch = value.match(/[\d,.]+/);
    if (!numericMatch) {
      setDisplayValue(value);
      return;
    }

    const numericStr = numericMatch[0].replace(/,/g, '');
    const targetNum = parseFloat(numericStr);
    
    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    const prefix = value.substring(0, value.indexOf(numericMatch[0]));
    const suffix = value.substring(value.indexOf(numericMatch[0]) + numericMatch[0].length);
    const isDecimal = numericStr.includes('.');
    const decimalPlaces = isDecimal ? numericStr.split('.')[1].length : 0;

    const duration = 800;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;
      
      let formatted: string;
      if (isDecimal) {
        formatted = current.toFixed(decimalPlaces);
      } else if (targetNum >= 1000) {
        formatted = Math.round(current).toLocaleString('en-IN');
      } else {
        formatted = Math.round(current).toString();
      }
      
      setDisplayValue(`${prefix}${formatted}${suffix}`);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        hasAnimated.current = true;
      }
    }

    requestAnimationFrame(animate);
  }, [value, loading]);

  if (loading) {
    return (
      <div
        className="rounded-lg p-5"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #242830',
        }}
      >
        <div className="skeleton-shimmer h-3 w-24 rounded mb-3" />
        <div className="skeleton-shimmer h-8 w-32 rounded" />
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-5 relative overflow-hidden"
      style={{
        backgroundColor: '#111318',
        border: '1px solid #242830',
        borderLeft: delta
          ? `3px solid ${deltaPositive ? '#00E5A0' : '#FF4757'}`
          : '1px solid #242830',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span
          className="text-[12px] font-medium uppercase tracking-wider"
          style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
        >
          {label}
        </span>
        {Icon && (
          <Icon className="w-4 h-4" style={{ color: '#4E5464' }} />
        )}
      </div>
      
      <div
        ref={valueRef}
        className="text-[28px] font-semibold tracking-tight"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          color: '#E8EAF0',
        }}
      >
        {displayValue}
      </div>
      
      {delta && (
        <div
          className="text-[12px] font-medium mt-1"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: deltaPositive ? '#00E5A0' : '#FF4757',
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
