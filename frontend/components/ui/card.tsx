import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('rounded-3xl bg-white/80 backdrop-blur border border-white/60 shadow-lg shadow-brand-900/5 p-6 text-slate-900', className)}>
      {children}
    </div>
  );
}
