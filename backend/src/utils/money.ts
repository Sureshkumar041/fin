// Money is compared and calculated in integer paise, never in floating-point
// rupees. Amounts are validated to at most 2 decimal places, so converting
// them this way is exact.
export const toPaise = (value: number) => Math.round(value * 100);
export const fromPaise = (paise: number) => paise / 100;

// Money sums arrive from Postgres as strings like "1234.50". Round to cents to
// clear any floating-point noise after conversion.
export const toMoney = (value: string | number) => Math.round(Number(value) * 100) / 100;

// Adds money values in integer paise, not floating-point rupees.
export const sumMoney = (values: (string | number)[]) =>
  fromPaise(values.reduce<number>((sum, v) => sum + toPaise(Number(v)), 0));

// numeratorPaise / denominatorPaise as a percentage, to 2 decimal places
// (half away from zero), or null when the denominator is 0. Paise x 10000 can
// pass Number.MAX_SAFE_INTEGER, so the division is done in BigInt.
function percentage(numeratorPaise: number, denominatorPaise: number): number | null {
  const denominator = BigInt(denominatorPaise);
  if (denominator <= 0n) return null;
  // Hundredths of a percent: numerator / denominator x 100 x 100.
  const scaled = BigInt(numeratorPaise) * 10000n;
  // BigInt division truncates toward zero; adding half the divisor away from
  // zero first turns that into rounding.
  const rounded = (2n * scaled + (scaled < 0n ? -denominator : denominator)) / (2n * denominator);
  return Number(rounded) / 100;
}

// Percentage change from `previous` to `current`, or null when previous is 0:
// there is nothing to compare against.
export const percentChange = (current: number, previous: number) =>
  percentage(toPaise(current) - toPaise(previous), toPaise(previous));

// `part` as a percentage of `whole`, or null when whole is 0.
export const percentOf = (part: number, whole: number) => percentage(toPaise(part), toPaise(whole));

// Difference between two money values, in paise, with its percentage.
export const moneyChange = (current: number, previous: number) => ({
  amount: fromPaise(toPaise(current) - toPaise(previous)),
  percentage: percentChange(current, previous),
});
