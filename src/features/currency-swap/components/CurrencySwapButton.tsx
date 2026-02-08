'use client'

import { memo, useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Props = {
  onSwap: () => void;
}

/**
* ===========================
* MAIN
* ===========================
*/
export const CurrencySwapButton: React.FC<Props> = memo((props) => {
  const { onSwap } = props;

  // =============== STATE
  const [isRotated, setIsRotated] = useState(false);

  // =============== EVENTS
  const onHandleClick = () => {
    setIsRotated(prev => !prev);
    onSwap();
  };

  // =============== VIEWS
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-panel-alt text-white/70',
        'shadow cursor-pointer hover:text-primary hover:border-primary hover:border-2'
      )}
      aria-label="Swap currencies"
      onClick={onHandleClick}
    >
      <ArrowDownUp
        className={cn(
          'h-4 w-4 transition-transform duration-300',
          isRotated && 'rotate-180'
        )}
      />
    </button>
  );
});

CurrencySwapButton.displayName = 'CurrencySwapButton';

/**
* ===========================
* EXPORTS
* ===========================
*/
export default CurrencySwapButton;