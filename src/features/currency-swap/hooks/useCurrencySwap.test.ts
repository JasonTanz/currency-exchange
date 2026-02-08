import { renderHook, act } from '@testing-library/react';
import { useCurrencySwap } from './useCurrencySwap';
import { CURRENCY_RATE } from '../utils/constant';



// MOCK DEBOUNCE
jest.mock('debounce', () => {
  return (fn: unknown) => {
    const debouncedFn = (...args: unknown[]) => (fn as (...args: unknown[]) => unknown)(...args);
    debouncedFn.clear = jest.fn();
    return debouncedFn;
  };
});

describe('useSwapCurrency', () => {
  const feePercent = 1;
  const currencyOptions = Object.keys(CURRENCY_RATE);

  const setup = () =>
    renderHook(() =>
      useCurrencySwap({
        rates: CURRENCY_RATE,
        feePercent,
        currencyOptions,
        initialFromCurrency: 'MYR',
        initialToCurrency: 'EUR',
      })
    );

  // ====== BASIC TESTS ======
  it('initializes correctly', () => {
    const { result } = setup();
    expect(result.current.fromCurrency.currency).toBe('MYR');
    expect(result.current.toCurrency.currency).toBe('EUR');
    expect(result.current.fromCurrency.amount).toBe('');
    expect(result.current.toCurrency.amount).toBe('');
    expect(result.current.fee).toBe('');
    expect(result.current.receiveAmount).toBe('');
  });

  it('calculates to from MYR to EUR amount with fee correctly', async () => {
    const { result } = setup();

    // Input 100 MYR
    act(() => {
      result.current.onFromAmountChange('100');
    });

    // wait for debounce (300ms)
    await new Promise((r) => setTimeout(r, 350));

    // raw calculation
    const fromToUsd = 100 / CURRENCY_RATE['MYR'];
    const toAmount = fromToUsd * CURRENCY_RATE['EUR'];

    const fee = toAmount * 0.01; // 1% fee
    const receiveAmount = toAmount - fee;


    expect(Number(result.current.toCurrency.amount)).toBeCloseTo(toAmount, 6);
    expect(Number(result.current.fee)).toBeCloseTo(fee, 6);
    expect(Number(result.current.receiveAmount)).toBeCloseTo(receiveAmount, 6);
  });

  it('calculates to from EUR to MYR amount with fee correctly', async () => {
    const { result } = setup();

    // Input 100 EUR
    act(() => {
      result.current.onToAmountChange('100');
    });
    await new Promise((r) => setTimeout(r, 350));

    // raw calculation
    const toUSD = 100 / CURRENCY_RATE['EUR'];
    const toFromAmount = toUSD * CURRENCY_RATE['MYR'];

    const toAmount = Number(result.current.toCurrency.amount);
    const fee = toAmount * 0.01;
    const receiveAmount = toAmount - fee;

    expect(Number(result.current.fromCurrency.amount)).toBeCloseTo(toFromAmount, 6);
    expect(Number(result.current.fee)).toBeCloseTo(fee, 6);
    expect(Number(result.current.receiveAmount)).toBeCloseTo(receiveAmount, 6);
  });

  it('handles swap currencies correctly', async () => {
    const { result } = setup();

    // Set initial from amount
    act(() => {
      result.current.onFromAmountChange('50'); // 50 MYR
    });
    await new Promise((r) => setTimeout(r, 350));

    // Swap
    act(() => {
      result.current.onHandleSwap();
    });

    // After swap, from = EUR, to = MYR
    expect(result.current.fromCurrency.currency).toBe('EUR');
    expect(result.current.toCurrency.currency).toBe('MYR');

    // Compute expected swapped amount
    const fromToUsd = 50 / CURRENCY_RATE['EUR'];
    const toAmount = fromToUsd * CURRENCY_RATE['MYR'];

    expect(Number(result.current.toCurrency.amount)).toBeCloseTo(toAmount, 6);
  });


  // ====== EDGE CASES ======
  it('handles very large amounts', async () => {
    const { result } = setup();

    act(() => {
      result.current.onFromAmountChange('1000000000'); // 1 billion MYR
    });

    await new Promise((r) => setTimeout(r, 350));

    expect(Number.isFinite(Number(result.current.toCurrency.amount))).toBe(true);
    expect(Number.isFinite(Number(result.current.fee))).toBe(true);
    expect(Number.isFinite(Number(result.current.receiveAmount))).toBe(true);
  });

  it('sets error when converted amount is below minimum exchangeable amount', async () => {
    const { result } = setup();

    // Input a very small amount that results in converted amount below 0.000001
    act(() => {
      result.current.onFromAmountChange('0.000001');
    });

    await new Promise((r) => setTimeout(r, 350));

    const fromAmountError = result.current.error.find(err => err.field === 'to_amount');

    expect(fromAmountError?.message).toBe('Amount to receive is too low');
  });

  it('clears error when converted amount is above minimum exchangeable amount', async () => {
    const { result } = setup();

    // First set a very small amount
    act(() => {
      result.current.onFromAmountChange('0.000001');
    });
    await new Promise((r) => setTimeout(r, 350));

    const toAmountError = result.current.error.find(err => err.field === 'to_amount');

    expect(toAmountError?.message).toBe('Amount to receive is too low');

    // Now set a valid amount
    act(() => {
      result.current.onFromAmountChange('100');
    });
    await new Promise((r) => setTimeout(r, 350));

    expect(result.current.error.length).toBe(0);
  });

  it('uses fallback when selecting same currency', () => {
    const { result } = setup();

    act(() => {
      result.current.onFromCurrencyChange('EUR');
    });

    expect(result.current.fromCurrency.currency).toBe('EUR');
    expect(result.current.toCurrency.currency).not.toBe('EUR');
  });

  it('handles empty input', async () => {
    const { result } = setup();

    act(() => {
      result.current.onFromAmountChange('');
    });

    await new Promise((r) => setTimeout(r, 350));

    expect(result.current.toCurrency.amount).toBe('');
  });

  it('handles zero input', async () => {
    const { result } = setup();

    act(() => {
      result.current.onFromAmountChange('0');
    });

    await new Promise((r) => setTimeout(r, 350));

    expect(result.current.toCurrency.amount).toBe('');
    expect(result.current.fee).toBe('');
    expect(result.current.receiveAmount).toBe('');
    const fromAmountError = result.current.error.find(err => err.field === 'from_amount');

    expect(fromAmountError?.message).toBe('Minimum amount is 0.000001');
  });

  it('sets error when amount exceeds max integer digits', async () => {
    const { result } = renderHook(() =>
      useCurrencySwap({
        rates: CURRENCY_RATE,
        feePercent: 1,
        currencyOptions: Object.keys(CURRENCY_RATE),
        initialFromCurrency: 'MYR',
        initialToCurrency: 'IDR',
      })
    );

    // Input a very large MYR amount that will result in IDR exceeding 17 digits
    // MYR to IDR rate is roughly 3552x, so this will create a huge IDR number
    act(() => {
      result.current.onFromAmountChange('12341234123412341');
    });

    await new Promise((r) => setTimeout(r, 350));

    // The converted IDR amount will exceed 17 integer digits
    const toAmountError = result.current.error.find(err => err.field === 'to_amount');
    expect(toAmountError?.message).toBe('Amount too large');
  });

});
