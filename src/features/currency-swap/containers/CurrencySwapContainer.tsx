'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { CurrencyInput } from '@/features/currency-swap/components/CurrencyInput';
import { ConversionDisplay } from '@/features/currency-swap/components/ConversionDisplay';
import { CurrencySwapButton } from '@/features/currency-swap/components/CurrencySwapButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { CURRENCY_OPTIONS, CURRENCY_RATE, FEE_PERCENT } from '@/features/currency-swap/utils/constant';
import { useCurrencySwap } from '../hooks/useCurrencySwap';
import { cn } from '@/lib/utils';
import { formatWithCommas } from '../utils/helper';

const getInitialCurrency = (param: string | null, fallback: string): string => {
  if (param && CURRENCY_OPTIONS.includes(param)) {
    return param;
  }
  return fallback;
};


/**
* ===========================
* MAIN
* ===========================
*/
export const CurrencySwapContainer = () => {
  // =============== HOOKS
  const searchParams = useSearchParams();
  const initialFrom = getInitialCurrency(searchParams.get('from'), 'MYR');
  const initialTo = getInitialCurrency(searchParams.get('to'), 'EUR');

  const {
    fee,
    error,
    toCurrency,
    currentRate,
    fromCurrency,
    receiveAmount,
    onFromAmountChange,
    onToAmountChange,
    onFromCurrencyChange,
    onHandleSwap,
    onToCurrencyChange,
    onHandleExchange,
    isToAmountCalculating,
    isFromAmountCalculating,
  } = useCurrencySwap({
    feePercent: FEE_PERCENT,
    initialFromCurrency: initialFrom,
    initialToCurrency: initialTo,
    rates: CURRENCY_RATE,
    currencyOptions: CURRENCY_OPTIONS,
    onSwapSuccessCallback: () => {
      setShowSuccess(true);
    }
  });


  // =============== STATE
  const [showSuccess, setShowSuccess] = useState(false);

  // =============== VARIABLES
  const fromError = error.find(err => err.field === 'from_amount');
  const toError = error.find(err => err.field === 'to_amount');
  const disabled = !fromCurrency.amount || !toCurrency.amount || Number(fromCurrency.amount) === 0 || Number(toCurrency.amount) === 0 || error.length > 0;

  const inputBoxStyles = cn(
    'rounded-xl border border-white/10 p-4 transition-all duration-200',
    'focus-within:border-primary focus-within:shadow-[0px_2px_16px_rgba(199,242,132,0.25)]'
  );

  // =============== RENDER
  const renderCurrencyInput = () => {
    return (
      <>
        <div className="relative flex flex-col gap-2">
          <div className={cn(inputBoxStyles, 'bg-panel-raised')}>
            <CurrencyInput
              label="From"
              selectedCurrency={fromCurrency.currency}
              onSelectCurrency={onFromCurrencyChange}
              amount={fromCurrency.amount}
              onAmountChange={onFromAmountChange}
              currencyOptions={CURRENCY_OPTIONS}
              isLoading={isFromAmountCalculating}
            />
          </div>
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <CurrencySwapButton onSwap={onHandleSwap} />
          </div>
          <div className={cn(inputBoxStyles, 'bg-panel')}>
            <CurrencyInput
              label="To"
              selectedCurrency={toCurrency.currency}
              onSelectCurrency={onToCurrencyChange}
              amount={toCurrency.amount}
              onAmountChange={onToAmountChange}
              currencyOptions={CURRENCY_OPTIONS}
              isLoading={isToAmountCalculating}
            />
          </div>
        </div>
        {(fromError || toError) && (
          <p className="text-xs text-right text-red-400 mt-4">
            {fromError?.message || toError?.message}
          </p>
        )}
      </>
    )
  }

  const renderSuccessDialog = () => {
    return (
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent onClose={() => setShowSuccess(false)}>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle>Exchange Successful!</DialogTitle>
            <DialogDescription>
              Your currency exchange has been completed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-3 rounded-xl bg-panel-raised p-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">You Exchanged</span>
              <span className="font-medium text-white">
                {formatWithCommas(fromCurrency.amount)} {fromCurrency.currency}
              </span>
            </div>
            <div className="border-t border-white/10" />
            <div className="flex justify-between text-sm">
              <span className="text-white/60">You Received</span>
              <span className="font-medium text-primary">
                {formatWithCommas(receiveAmount)} {toCurrency.currency}
              </span>
            </div>
          </div>
          <Button className="mt-6" onClick={() => setShowSuccess(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  // =============== VIEWS
  return (
    <div className="min-h-screen bg-app px-4 py-10 text-white flex items-center justify-center">
      <div className="mx-auto flex-col flex w-full max-w-md items-center justify-center gap-6">
        <div>
          <p className="text-2xl font-bold">Currency Exchange</p>
          <p className="text-sm text-white/70">Exchange your currency with ease</p>
        </div>
        <div className="w-full rounded-2xl border border-white/10 bg-panel p-4 shadow-lg sm:p-6">
          {renderCurrencyInput()}
          <div className="flex flex-col gap-2 pb-2 pt-4">
            <ConversionDisplay
              fromCurrency={fromCurrency.currency}
              toCurrency={toCurrency.currency}
              rate={currentRate}
            />
            <p className="text-sm text-white/60">
              Fee ({FEE_PERCENT}%): {error.length > 0 ? "-" : (formatWithCommas(fee) || "0")} {toCurrency.currency}
            </p>
            <p className="text-sm text-white/60">
              You Receive: {error.length > 0 ? "-" : (formatWithCommas(receiveAmount) || "0")} {toCurrency.currency}
            </p>
          </div>
          <Button className="mt-4" onClick={onHandleExchange} disabled={disabled}>
            Exchange
          </Button>
        </div>
      </div>
      {renderSuccessDialog()}
    </div>
  )
}

/**
* ===========================
* EXPORTS
* ===========================
*/
export default CurrencySwapContainer;