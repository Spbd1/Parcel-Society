export type DecimalValue = number | string | { toString(): string } | null | undefined;

export const numberValue = (value: DecimalValue): number => Number(value ?? 0);

export const formatNumber = (value: DecimalValue, digits = 0) =>
  numberValue(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatMoney = (value: DecimalValue) => `$${formatNumber(value, 2)}`;

export const formatPercent = (value: DecimalValue) => `${(numberValue(value) * 100).toFixed(1)}%`;

export const formatDate = (value: Date | string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "—";

export const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");

export const gini = (values: number[]) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const sum = sorted.reduce((total, value) => total + value, 0);
  if (sum === 0) return 0;
  const weighted = sorted.reduce((total, value, index) => total + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * sum) - (sorted.length + 1) / sorted.length;
};
