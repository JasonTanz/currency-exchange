'use client';
import { Input } from '@/components/common/input';
import { cn } from '@/lib/utils';
import { useLayoutEffect, useRef } from 'react';
import { formatWithCommas, isValidNumericInput, isWithinDigitLimits } from '../utils/helper';

type Size = 'sm' | 'md' | 'lg';

export type Props = Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'size'> & {
  value: string | number;
  onChange: (value: string) => void;
  maxIntegerDigits?: number;
  maxDecimalDigits?: number;
  size?: Size;
}


const getFontSizeClass = (characterCount: number, size: Size): string => {
  const baseMap: Record<Size, string[]> = {
    sm: ['text-2xl', 'text-xl', 'text-lg', 'text-base'],
    md: ['text-4xl', 'text-3xl', 'text-2xl', 'text-xl'],
    lg: ['text-5xl', 'text-4xl', 'text-3xl', 'text-2xl'],
  };
  const sizes = baseMap[size];
  if (characterCount <= 6) return sizes[0];
  if (characterCount <= 9) return sizes[1];
  if (characterCount <= 12) return sizes[2];
  return sizes[3];
};

// returns the real number of characters in the value (excluding commas) before the caret
const countValueChars = (value: string): number => {
  let count = 0;
  for (const char of value) {
    if (char >= '0' && char <= '9') {
      count += 1;
      continue;
    }
    if (char === '.') {
      count += 1;
    }
  }
  return count;
};

// returns the index of the caret position
const getCaretPosition = (formattedValue: string, targetCount: number): number => {
  if (targetCount <= 0) return 0;
  let count = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    const char = formattedValue[index];
    if ((char >= '0' && char <= '9') || char === '.') {
      count += 1;
      if (count >= targetCount) {
        return index + 1;
      }
    }
  }
  return formattedValue.length;
};


/**
* ===========================
* MAIN
* ===========================
*/
export const CurrencyTextField: React.FC<Props> = (props) => {
  const {
    value,
    onChange,
    maxIntegerDigits = 17,
    maxDecimalDigits = 6,
    size = 'md',
    className,
    ...rest
  } = props;

  // =============== REF
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  // =============== VARIABLES
  const displayValue = formatWithCommas(String(value).replace(/,/g, ''));
  const visibleLength = (displayValue || '0').length;
  const textSizeClass = getFontSizeClass(visibleLength, size);

  // =============== EVENTS
  const onHandleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const raw = event.target.value;
    const selectionStart = event.target.selectionStart ?? raw.length;
    const nextValue = raw.replace(/,/g, '');

    if (!isValidNumericInput(nextValue)) return;
    if (!isWithinDigitLimits(nextValue, maxIntegerDigits, maxDecimalDigits)) return;

    const targetCount = countValueChars(raw.slice(0, selectionStart));
    const nextDisplayValue = formatWithCommas(nextValue);
    pendingCaretRef.current = getCaretPosition(nextDisplayValue, targetCount);

    onChange(nextValue);
  };


  useLayoutEffect(() => {
    if (!inputRef.current) return;
    if (pendingCaretRef.current === null) return;
    const caretPosition = pendingCaretRef.current;
    pendingCaretRef.current = null;
    inputRef.current.setSelectionRange(caretPosition, caretPosition);
  }, [displayValue]);

  // =============== VIEWS
  return (
    <div className="flex justify-center">
      <div className="inline-flex max-w-full items-center justify-center">
        <Input
          ref={inputRef}
          {...rest}
          value={displayValue}
          onChange={onHandleChange}
          inputMode="decimal"
          type="text"
          className={cn(
            'min-w-0 text-right border-0 bg-transparent shadow-none text-white',
            'focus-visible:ring-0 focus-visible:border-transparent',
            textSizeClass,
            className,
          )}
        />
      </div>
    </div>
  );
}

/**
* ===========================
* EXPORTS
* ===========================
*/
export default CurrencyTextField;