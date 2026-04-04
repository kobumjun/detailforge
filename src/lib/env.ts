export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const appUrl = () =>
  process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const textGenProvider = () =>
  (process.env.TEXT_GEN_PROVIDER || "mock").toLowerCase();

export const imageGenProvider = () =>
  (process.env.IMAGE_GEN_PROVIDER || "mock").toLowerCase();

export const paymentProvider = () =>
  (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
