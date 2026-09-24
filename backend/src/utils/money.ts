// Money is compared and calculated in integer paise, never in floating-point
// rupees. Amounts are validated to at most 2 decimal places, so converting
// them this way is exact.
export const toPaise = (value: number) => Math.round(value * 100);
export const fromPaise = (paise: number) => paise / 100;
