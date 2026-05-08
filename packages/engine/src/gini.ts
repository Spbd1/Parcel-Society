export const gini = (values: readonly number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);

  if (sum === 0) {
    return 0;
  }

  const weightedSum = sorted.reduce(
    (total, value, index) => total + (index + 1) * value,
    0,
  );

  return (
    (2 * weightedSum) / (sorted.length * sum) -
    (sorted.length + 1) / sorted.length
  );
};
