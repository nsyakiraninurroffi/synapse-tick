'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface CountdownTimerProps {
  expiresAt: string; // ISO string
  onExpire?: () => void;
  className?: string;
  compact?: boolean;
}

export default function CountdownTimer({ expiresAt, onExpire, className, compact = false }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(diff / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 60;
  const isCritical = remaining <= 30;

  if (compact) {
    return (
      <span className={clsx(
        'font-mono font-bold tabular-nums',
        isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-emerald-500',
        className
      )}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <div className={clsx(
        'flex items-center gap-1 px-3 py-1.5 rounded-xl font-mono font-bold text-lg tabular-nums transition-all duration-500',
        isCritical
          ? 'bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse'
          : isUrgent
          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
      )}>
        <span>{String(minutes).padStart(2, '0')}</span>
        <span className="opacity-60">:</span>
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-[hsl(var(--text-muted))]">tersisa</span>
    </div>
  );
}
