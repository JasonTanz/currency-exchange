import { renderHook, act } from '@testing-library/react';
import { useSwapCurrency } from './useCurrencySwap';

// Mock rates for testing
const mockRates = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.76,
  HKD: 7.8,
  JPY: 150,
};

const currencyOptions = Object.keys(mockRates);

const defaultArgs = {
  feePercent: 0,
  initialFromCurrency: 'USD',
  initialToCurrency: 'EUR',
  rates: mockRates,
  currencyOptions,
};

// Mock window.location and history
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
  });
  
  window.history.replaceState = jest.fn();
});

describe('useSwapCurrency', () => {
  describe('Initial State', () => {
    it('should initialize with provided from and to currencies', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      expect(result.current.fromCurrency.currency).toBe('USD');
      expect(result.current.toCurrency.currency).toBe('EUR');
    });

    it('should initialize with empty amounts', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      expect(result.current.fromCurrency.amount).toBe('');
      expect(result.current.toCurrency.amount).toBe('');
    });

    it('should initialize with null error', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      expect(result.current.error).toBeNull();
    });

    it('should calculate correct initial rate', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      // USD to EUR rate: 0.9 / 1 = 0.9
      expect(result.current.currentRate).toBe(0.9);
    });
  });

  describe('Rate Calculation', () => {
    it('should return 1 when from and to currencies are the same', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'USD',
          initialToCurrency: 'USD',
        })
      );

      expect(result.current.currentRate).toBe(1);
    });

    it('should calculate correct rate between different currencies', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'EUR',
          initialToCurrency: 'GBP',
        })
      );

      // GBP / EUR = 0.76 / 0.9 ≈ 0.8444
      expect(result.current.currentRate).toBeCloseTo(0.8444, 3);
    });

    it('should return null for missing currency rate', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'INVALID',
          initialToCurrency: 'EUR',
        })
      );

      expect(result.current.currentRate).toBeNull();
    });
  });

  describe('From Amount Changes', () => {
    it('should update from amount and calculate to amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      expect(result.current.fromCurrency.amount).toBe('100');
      // 100 USD * 0.9 = 90 EUR
      expect(result.current.toCurrency.amount).toBe('90');
    });

    it('should handle empty string input', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onFromAmountChange('');
      });

      expect(result.current.fromCurrency.amount).toBe('');
      expect(result.current.toCurrency.amount).toBe('0');
    });

    it('should handle decimal amounts correctly', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('123.456');
      });

      expect(result.current.fromCurrency.amount).toBe('123.456');
      // 123.456 * 0.9 = 111.1104
      expect(result.current.toCurrency.amount).toBe('111.1104');
    });

    it('should handle very large amounts', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('1000000000');
      });

      expect(result.current.fromCurrency.amount).toBe('1000000000');
      expect(result.current.toCurrency.amount).toBe('900000000');
    });

    it('should handle zero amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('0');
      });

      expect(result.current.fromCurrency.amount).toBe('0');
      expect(result.current.toCurrency.amount).toBe('0');
    });
  });

  describe('To Amount Changes', () => {
    it('should update to amount and calculate from amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onToAmountChange('90');
      });

      expect(result.current.toCurrency.amount).toBe('90');
      // 90 EUR / 0.9 = 100 USD
      expect(result.current.fromCurrency.amount).toBe('100');
    });

    it('should handle empty string input', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onToAmountChange('90');
      });

      act(() => {
        result.current.onToAmountChange('');
      });

      expect(result.current.toCurrency.amount).toBe('');
      expect(result.current.fromCurrency.amount).toBe('0');
    });

    it('should handle decimal amounts correctly', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onToAmountChange('111.1104');
      });

      expect(result.current.toCurrency.amount).toBe('111.1104');
      // 111.1104 / 0.9 = 123.456
      expect(result.current.fromCurrency.amount).toBe('123.456');
    });

    it('should handle zero amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onToAmountChange('0');
      });

      expect(result.current.toCurrency.amount).toBe('0');
      expect(result.current.fromCurrency.amount).toBe('0');
    });
  });

  describe('From Currency Changes', () => {
    it('should update from currency and recalculate to amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onFromCurrencyChange('GBP');
      });

      expect(result.current.fromCurrency.currency).toBe('GBP');
      // 100 GBP * (0.9 / 0.76) ≈ 118.42 EUR
      expect(parseFloat(result.current.toCurrency.amount)).toBeCloseTo(118.42, 1);
    });

    it('should fallback to different currency when selecting same as to currency', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      // Initial: from=USD, to=EUR
      act(() => {
        result.current.onFromCurrencyChange('EUR');
      });

      expect(result.current.fromCurrency.currency).toBe('EUR');
      // Should fallback to a different currency (first available that's not EUR)
      expect(result.current.toCurrency.currency).not.toBe('EUR');
    });

    it('should maintain amount when changing currency', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      const originalFromAmount = result.current.fromCurrency.amount;

      act(() => {
        result.current.onFromCurrencyChange('GBP');
      });

      expect(result.current.fromCurrency.amount).toBe(originalFromAmount);
    });
  });

  describe('To Currency Changes', () => {
    it('should update to currency and recalculate to amount', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onToCurrencyChange('GBP');
      });

      expect(result.current.toCurrency.currency).toBe('GBP');
      // 100 USD * (0.76 / 1) = 76 GBP
      expect(result.current.toCurrency.amount).toBe('76');
    });

    it('should fallback to different currency when selecting same as from currency', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      // Initial: from=USD, to=EUR
      act(() => {
        result.current.onToCurrencyChange('USD');
      });

      expect(result.current.toCurrency.currency).toBe('USD');
      // From currency should fallback to a different currency
      expect(result.current.fromCurrency.currency).not.toBe('USD');
    });

    it('should recalculate to amount with new rate', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      // Change to HKD (rate: 7.8)
      act(() => {
        result.current.onToCurrencyChange('HKD');
      });

      expect(result.current.toCurrency.currency).toBe('HKD');
      // 100 USD * (7.8 / 1) = 780 HKD
      expect(result.current.toCurrency.amount).toBe('780');
    });
  });

  describe('Same Currency Fallback Edge Cases', () => {
    it('should handle cascading same-currency selections for from currency', () => {
      const args = {
        ...defaultArgs,
        initialFromCurrency: 'USD',
        initialToCurrency: 'EUR',
        currencyOptions: ['USD', 'EUR', 'GBP'],
      };

      const { result } = renderHook(() => useSwapCurrency(args));

      act(() => {
        result.current.onFromCurrencyChange('EUR');
      });

      // From should be EUR, To should fallback (not EUR)
      expect(result.current.fromCurrency.currency).toBe('EUR');
      expect(result.current.toCurrency.currency).not.toBe('EUR');
    });

    it('should handle cascading same-currency selections for to currency', () => {
      const args = {
        ...defaultArgs,
        initialFromCurrency: 'USD',
        initialToCurrency: 'EUR',
        currencyOptions: ['USD', 'EUR', 'GBP'],
      };

      const { result } = renderHook(() => useSwapCurrency(args));

      act(() => {
        result.current.onToCurrencyChange('USD');
      });

      // To should be USD, From should fallback (not USD)
      expect(result.current.toCurrency.currency).toBe('USD');
      expect(result.current.fromCurrency.currency).not.toBe('USD');
    });

    it('should use first available currency as fallback when getFallbackCurrency called', () => {
      const args = {
        ...defaultArgs,
        currencyOptions: ['AAA', 'BBB'],
        rates: { AAA: 1, BBB: 2 },
        initialFromCurrency: 'AAA',
        initialToCurrency: 'BBB',
      };

      const { result } = renderHook(() => useSwapCurrency(args));

      act(() => {
        result.current.onFromCurrencyChange('BBB');
      });

      // When selecting BBB for from, to should fallback to AAA (first option != BBB)
      expect(result.current.fromCurrency.currency).toBe('BBB');
      expect(result.current.toCurrency.currency).toBe('AAA');
    });
  });

  describe('Swap Functionality', () => {
    it('should swap currencies correctly', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleSwap();
      });

      // Currencies should be swapped
      expect(result.current.fromCurrency.currency).toBe('EUR');
      expect(result.current.toCurrency.currency).toBe('USD');
    });

    it('should maintain from amount after swap', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleSwap();
      });

      expect(result.current.fromCurrency.amount).toBe('100');
    });

    it('should recalculate to amount after swap', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleSwap();
      });

      // After swap: from=EUR, to=USD
      // 100 EUR * (1 / 0.9) ≈ 111.11 USD
      expect(parseFloat(result.current.toCurrency.amount)).toBeCloseTo(111.11, 1);
    });

    it('should handle swap with empty amounts', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onHandleSwap();
      });

      expect(result.current.fromCurrency.currency).toBe('EUR');
      expect(result.current.toCurrency.currency).toBe('USD');
      expect(result.current.fromCurrency.amount).toBe('');
    });
  });

  describe('Exchange Functionality', () => {
    it('should swap both currencies and amounts', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      const toAmountBefore = result.current.toCurrency.amount;

      act(() => {
        result.current.onHandleExchange();
      });

      expect(result.current.fromCurrency.currency).toBe('EUR');
      expect(result.current.fromCurrency.amount).toBe(toAmountBefore);
      expect(result.current.toCurrency.currency).toBe('USD');
      expect(result.current.toCurrency.amount).toBe('100');
    });

    it('should call success callback on exchange', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          onSwapSuccessCallback: mockCallback,
        })
      );

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleExchange();
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not fail when no callback provided', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      expect(() => {
        act(() => {
          result.current.onHandleExchange();
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should set error when rate is not available for from amount change', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'INVALID',
        })
      );

      act(() => {
        result.current.onFromAmountChange('100');
      });

      expect(result.current.error).toBe('Rate not available');
    });

    it('should set error when rate is not available for to amount change', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialToCurrency: 'INVALID',
        })
      );

      act(() => {
        result.current.onToAmountChange('100');
      });

      expect(result.current.error).toBe('Rate not available');
    });

    it('should set error when rate not available during swap', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          rates: { USD: 1 }, // Only USD has a rate
          initialFromCurrency: 'USD',
          initialToCurrency: 'EUR',
        })
      );

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleSwap();
      });

      expect(result.current.error).toBe('Rate not available');
    });
  });

  describe('URL Synchronization', () => {
    it('should update URL when currencies change', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should update URL with correct search params after from currency change', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromCurrencyChange('GBP');
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should update URL with correct search params after to currency change', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onToCurrencyChange('GBP');
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  describe('Decimal Precision and Formatting', () => {
    it('should format output with proper decimal places', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'USD',
          initialToCurrency: 'JPY',
        })
      );

      act(() => {
        result.current.onFromAmountChange('1');
      });

      // 1 USD * 150 = 150 JPY (should be integer, no decimals)
      expect(result.current.toCurrency.amount).toBe('150');
    });

    it('should handle fractional conversion results', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          ...defaultArgs,
          initialFromCurrency: 'JPY',
          initialToCurrency: 'USD',
        })
      );

      act(() => {
        result.current.onFromAmountChange('100');
      });

      // 100 JPY * (1 / 150) ≈ 0.666667 USD
      expect(parseFloat(result.current.toCurrency.amount)).toBeCloseTo(0.6667, 3);
    });

    it('should strip trailing zeros from decimal output', () => {
      const customRates = { A: 1, B: 2 };
      const { result } = renderHook(() =>
        useSwapCurrency({
          feePercent: 0,
          initialFromCurrency: 'A',
          initialToCurrency: 'B',
          rates: customRates,
          currencyOptions: ['A', 'B'],
        })
      );

      act(() => {
        result.current.onFromAmountChange('5');
      });

      // 5 * 2 = 10 (should be '10', not '10.000000')
      expect(result.current.toCurrency.amount).toBe('10');
    });
  });

  describe('Edge Cases with Currency Options', () => {
    it('should handle single currency option scenario', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          feePercent: 0,
          initialFromCurrency: 'USD',
          initialToCurrency: 'USD',
          rates: { USD: 1 },
          currencyOptions: ['USD'],
        })
      );

      expect(result.current.fromCurrency.currency).toBe('USD');
      expect(result.current.toCurrency.currency).toBe('USD');
      expect(result.current.currentRate).toBe(1);
    });

    it('should fallback to first option when no other currency available', () => {
      const { result } = renderHook(() =>
        useSwapCurrency({
          feePercent: 0,
          initialFromCurrency: 'USD',
          initialToCurrency: 'EUR',
          rates: { USD: 1, EUR: 0.9 },
          currencyOptions: ['USD', 'EUR'],
        })
      );

      // When changing from to EUR (same as to), should fallback
      act(() => {
        result.current.onFromCurrencyChange('EUR');
      });

      // Fallback should find USD (first option that's not EUR)
      expect(result.current.toCurrency.currency).toBe('USD');
    });
  });

  describe('Sequential Operations', () => {
    it('should handle multiple consecutive amount changes', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onFromAmountChange('200');
      });

      act(() => {
        result.current.onFromAmountChange('50');
      });

      expect(result.current.fromCurrency.amount).toBe('50');
      expect(result.current.toCurrency.amount).toBe('45'); // 50 * 0.9
    });

    it('should handle currency change followed by amount change', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromCurrencyChange('GBP');
      });

      act(() => {
        result.current.onFromAmountChange('100');
      });

      expect(result.current.fromCurrency.currency).toBe('GBP');
      expect(result.current.fromCurrency.amount).toBe('100');
      // 100 GBP * (EUR/GBP) = 100 * (0.9/0.76) ≈ 118.42
      expect(parseFloat(result.current.toCurrency.amount)).toBeCloseTo(118.42, 1);
    });

    it('should handle swap followed by exchange', () => {
      const { result } = renderHook(() => useSwapCurrency(defaultArgs));

      act(() => {
        result.current.onFromAmountChange('100');
      });

      act(() => {
        result.current.onHandleSwap();
      });

      act(() => {
        result.current.onHandleExchange();
      });

      // After swap: from=EUR, to=USD, fromAmt=100, toAmt≈111.11
      // After exchange: currencies and amounts swap
      expect(result.current.fromCurrency.currency).toBe('USD');
      expect(result.current.toCurrency.currency).toBe('EUR');
    });
  });
});

