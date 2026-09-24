// NEXT_PUBLIC_* values are inlined at build time, so they must be referenced literally.
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'INR',
};
