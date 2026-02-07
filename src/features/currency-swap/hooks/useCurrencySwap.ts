"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatOutputAmmount } from "../utils/helper";
import debounce from 'debounce';

interface CurrencyState {
  from: {
    currency: string;
    amount: string;
  };
  to: {
    currency: string;
    amount: string;
  };
}

type Rates = Record<string, number>;

interface UseSwapCurrencyArgs {
  feePercent: number;
  initialFromCurrency: string;
  initialToCurrency: string;
  rates: Rates;
  onSwapSuccessCallback?: () => void;
  currencyOptions: string[];
}

interface UseSwapCurrencyReturn {
  fee: string;
  error: string | null;
  toCurrency: CurrencyState['to'];
  currentRate: number | null;
  fromCurrency: CurrencyState['from'];
  onHandleSwap: () => void;
  receiveAmount: string;
  onToAmountChange: (val: string) => void;
  onHandleExchange: () => void;
  onFromAmountChange: (val: string) => void;
  onToCurrencyChange: (currency: string) => void;
  onFromCurrencyChange: (currency: string) => void;
  isToAmountCalculating: boolean;
  isFromAmountCalculating: boolean;
}

export function useSwapCurrency(args: UseSwapCurrencyArgs): UseSwapCurrencyReturn {
  const {
    rates,
    feePercent,
    currencyOptions,
    initialToCurrency,
    initialFromCurrency,
    onSwapSuccessCallback,
  } = args;

  // =============== STATE
  const [currency, setCurrency] = useState<CurrencyState>({
    from: { currency: initialFromCurrency, amount: "" },
    to: { currency: initialToCurrency, amount: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const [isFromAmountCalculating, setIsFromAmountCalculating] = useState(false);
  const [isToAmountCalculating, setIsToAmountCalculating] = useState(false);

  // =============== HELPERS
  const getFallbackCurrency = (excludeCurrency: string): string => {
    return (
      currencyOptions.find((c) => c !== excludeCurrency) ?? currencyOptions[0]
    );
  };

  const getRate = useCallback((from: string, to: string) => {
    if (from === to) return 1;

    const fromRate = rates[from];
    const toRate = rates[to];

    if (!fromRate || !toRate) return null;

    return toRate / fromRate;
  }, [rates]);

  // =============== VARIABLES
  const fromCurrency = currency.from;
  const toCurrency = currency.to;
  const currentRate = getRate(fromCurrency.currency, toCurrency.currency);
  const feeRate = feePercent / 100;
  const output = Number(toCurrency.amount || 0)
  const fee = formatOutputAmmount(output * feeRate);
  const receiveAmount = formatOutputAmmount(output - Number(fee));

  // =============== HELPERS
  const computeToAmount = useCallback((
    fromAmount: string,
    fromCurrency: string,
    toCurrency: string
  ): string | null => {
    const fromAmountNumber = Number(fromAmount);
    const rate = getRate(fromCurrency, toCurrency);
    if (!rate) return null;
    return formatOutputAmmount(fromAmountNumber * rate);
  }, [getRate]);

  const computeFromAmount = useCallback((
    toAmount: string,
    fromCurrency: string,
    toCurrency: string
  ): string | null => {
    const toAmountNumber = Number(toAmount);
    const rate = getRate(fromCurrency, toCurrency);
    if (!rate) return null;
    return formatOutputAmmount(toAmountNumber / rate);
  }, [getRate]);

  // =============== DEBOUNCE
  const debouncedFromAmountCalculate = useMemo(() => debounce((val: string) => {
    setCurrency(prev => {
      const result = computeToAmount(val, prev.from.currency, prev.to.currency);
      if (result === null) return prev;
      return { ...prev, to: { ...prev.to, amount: result } };
    });
    setIsToAmountCalculating(false);
  }, 300), [computeToAmount]);

  const debouncedToAmountCalculate = useMemo(() => debounce((val: string) => {
    setCurrency(prev => {
      const result = computeFromAmount(val, prev.from.currency, prev.to.currency);
      if (result === null) return prev;
      return { ...prev, from: { ...prev.from, amount: result } };
    });
    setIsFromAmountCalculating(false);
  }, 300), [computeFromAmount]);

  // =============== EFFECTS
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("from", fromCurrency.currency);
    url.searchParams.set("to", toCurrency.currency);
    window.history.replaceState(null, "", url.toString());
  }, [fromCurrency.currency, toCurrency.currency]);

  useEffect(() => {
    return () => {
      debouncedFromAmountCalculate.clear();
      debouncedToAmountCalculate.clear();
    };
  }, [debouncedFromAmountCalculate, debouncedToAmountCalculate]);

  // =============== EVENTS
  const onFromAmountChange = (val: string) => {
    setCurrency(prev => ({ ...prev, from: { ...prev.from, amount: val } }))
    setIsToAmountCalculating(true);

    debouncedFromAmountCalculate(val);
  };

  const onToAmountChange = (val: string) => {
    setCurrency(prev => ({ ...prev, to: { ...prev.to, amount: val } }))
    setIsFromAmountCalculating(true);

    debouncedToAmountCalculate(val);

  };

  const onFromCurrencyChange = (currency: string) => {
    setCurrency((prev) => {
      const isCurrencySame = currency === prev.to.currency;
      const newCurrency = isCurrencySame
        ? getFallbackCurrency(currency)
        : prev.to.currency;
      const toAmount = computeToAmount(prev.from.amount, currency, newCurrency);
      if (toAmount === null) {
        setError("Rate not available");
        return {
          ...prev,
          from: { ...prev.from, currency },
        };
      }

      if (isCurrencySame) {
        return {
          from: { ...prev.from, currency },
          to: { currency: newCurrency, amount: toAmount },
        };
      }

      return {
        from: { ...prev.from, currency },
        to: { ...prev.to, amount: toAmount },
      };
    });
  };

  const onToCurrencyChange = (currency: string) => {
    console.log("currency", currency);
    setCurrency((prev) => {
      const isCurrencySame = currency === prev.from.currency;
      const newCurrency = isCurrencySame
        ? getFallbackCurrency(currency)
        : prev.from.currency;
      const toAmount = computeToAmount(prev.from.amount, newCurrency, currency);
      if (toAmount === null) {
        setError("Rate not available");
        return {
          ...prev,
          to: { ...prev.to, currency },
        };
      }

      if (isCurrencySame) {
        return {
          from: { ...prev.from, currency: newCurrency },
          to: { currency, amount: toAmount },
        };
      }

      return {
        ...prev,
        to: { currency, amount: toAmount },
      };
    });
  };

  const onHandleSwap = useCallback(() => {
    setCurrency((prev) => {
      const newFromCurrency = prev.to.currency;
      const newToCurrency = prev.from.currency;

      const newToAmount = computeToAmount(
        prev.from.amount,
        newFromCurrency,
        newToCurrency
      );

      if (newToAmount === null) {
        setError("Rate not available");
        return prev;
      }

      return {
        from: { currency: newFromCurrency, amount: prev.from.amount },
        to: { currency: newToCurrency, amount: newToAmount },
      };
    });
  }, [setCurrency, setError, computeToAmount]);

  const onHandleExchange = () => {
    onSwapSuccessCallback?.();
  };

  // =============== RETURN
  return {
    fee,
    error,
    toCurrency,
    currentRate,
    fromCurrency,
    onHandleSwap,
    receiveAmount,
    onToAmountChange,
    onHandleExchange,
    onFromAmountChange,
    onToCurrencyChange,
    onFromCurrencyChange,
    isToAmountCalculating,
    isFromAmountCalculating,
  };
}
