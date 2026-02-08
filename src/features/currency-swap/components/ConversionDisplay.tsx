'use client'

import { memo } from "react";
import { formatOutputAmmount, formatWithCommas } from "../utils/helper";

export type Props = {
  fromCurrency: string;
  toCurrency: string;
  rate: number | null;
  className?: string;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const ConversionDisplay: React.FC<Props> = memo((props) => {
  const { fromCurrency, toCurrency, rate, className } = props;

  // =============== VARIABLES
  const rateDisplay =
    rate === null ? null : formatWithCommas(formatOutputAmmount(rate));

  // =============== RENDER
  const renderRates = () => {
    if (!rateDisplay)
      return <span className="text-white/60">Rate not available</span>;
    return (
      <>
        <span className="font-medium text-white">1 {fromCurrency}</span>
        <span className="mx-2 text-white/50">=</span>
        <span className="font-medium text-white">
          {rateDisplay} {toCurrency}
        </span>
      </>
    );
  };

  // =============== RETURN
  return (
    <div className={className}>
      <p className="text-left text-sm">{renderRates()}</p>
    </div>
  );
});

ConversionDisplay.displayName = "ConversionDisplay";

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default ConversionDisplay;
