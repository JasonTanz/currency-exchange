
export const formatWithCommas = (value: string): string => {
  if (!value) return "";
  const [integerPart, decimalPart] = value.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart !== undefined
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};

export const isWithinDigitLimits = (
  value: string,
  maxIntegerDigits?: number,
  maxDecimalDigits?: number
): boolean => {
  if (!value) return true;
  const [integerPart = "", decimalPart = ""] = value.split(".");
  if (maxIntegerDigits !== undefined && integerPart.length > maxIntegerDigits)
    return false;
  if (maxDecimalDigits !== undefined && decimalPart.length > maxDecimalDigits)
    return false;
  return true;
};

export const isValidNumericInput = (value: string): boolean => {
  if (value === "") return true;
  return /^(\d+)?(\.)?(\d*)?$/.test(value);
};

export const formatOutputAmmount = (value: number): string => {
  if (value === 0) return "";

  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(6).replace(/\.?0+$/, "");
};

