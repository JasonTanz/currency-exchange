'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const Button: React.FC<Props> = memo((props) => {
  const { children, className, ...rest } = props;

  return (
    <button
      type="button"
      className={cn(
        'w-full rounded-xl bg-primary py-3 text-center text-base font-semibold text-accent-foreground shadow cursor-pointer',
        'hover:bg-primary-hover',
        'disabled:bg-primary/30 disabled:cursor-not-allowed',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default Button;

