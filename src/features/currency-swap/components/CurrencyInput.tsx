"use client";
import CurrencyTextField from "./CurrencyTextField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select";

export type Props = {
  label: string;
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  currencyOptions: string[];
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CurrencyInput: React.FC<Props> = (props) => {
  const {
    label,
    selectedCurrency,
    onSelectCurrency,
    amount,
    onAmountChange,
    currencyOptions,
  } = props;

  // =============== VIEWS
  return (
    <div className="flex w-full flex-col items-start justify-between gap-3">
      <p className="text-sm font-medium text-white/70">{label}</p>
      <div className="flex w-full items-center justify-between gap-4">
        <Select value={selectedCurrency} onValueChange={onSelectCurrency}>
          <SelectTrigger
            size="sm"
            className="h-10 rounded-full border-white/10 bg-control px-4 text-sm text-white shadow-none hover:bg-white/10 cursor-pointer"
          >
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent className="bg-panel-alt text-white">
            {currencyOptions.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex min-w-0 flex-col items-end gap-1 overflow-hidden">
          <CurrencyTextField
            value={amount}
            onChange={onAmountChange}
            placeholder="0.00"
            size="md"
            className="placeholder:text-white/25"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CurrencyInput;
