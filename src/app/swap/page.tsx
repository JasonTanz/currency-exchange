import CurrencySwapContainer from "@/features/currency-swap/containers/CurrencySwapContainer";

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

export default async function SwapPage({ searchParams }: Props) {
  const { from, to } = await searchParams;
  return <CurrencySwapContainer initialFrom={from} initialTo={to} />;
}
