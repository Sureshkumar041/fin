// Postgres returns NUMERIC as a string to avoid precision loss. Two decimal
// places fit safely in a JS number, so convert for convenience.
// Lives outside the entity files so entities that import each other can share it.
export const decimalToNumber = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
