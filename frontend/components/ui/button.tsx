import { ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export function Button({ className, variant = 'primary', size = 'md', asChild = false, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const variants: Record<typeof variant, string> = {
    primary: 'bg-brand-500 text-slate-900 shadow-brand-500/40 shadow-lg hover:bg-brand-600 focus-visible:outline-brand-500',
    secondary: 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50 focus-visible:outline-brand-500',
    ghost: 'text-brand-600 hover:bg-brand-100 focus-visible:outline-brand-500',
  };
  const sizes: Record<typeof size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const Component = asChild ? Slot : 'button';

  return <Component className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
