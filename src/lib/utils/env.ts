import "server-only";

export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return {
    supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey,
  };
}

export function getServerEnv() {
  return {
    databaseUrl: requiredEnv("DATABASE_URL"),
    nextAuthSecret: requiredEnv("NEXTAUTH_SECRET"),
  };
}

function requiredUrlEnv(name: string): string {
  const value = requiredEnv(name);

  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Invalid URL environment variable: ${name}`);
  }
}

export function getStripeBillingEnv() {
  return {
    appUrl: requiredUrlEnv("NEXT_PUBLIC_APP_URL"),
    stripeBasicPriceId: requiredEnv("STRIPE_BASIC_PRICE_ID"),
    stripeProPriceId: requiredEnv("STRIPE_PRO_PRICE_ID"),
    stripeSecretKey: requiredEnv("STRIPE_SECRET_KEY"),
  };
}

export function getStripeWebhookEnv() {
  return {
    stripeWebhookSecret: requiredEnv("STRIPE_WEBHOOK_SECRET"),
  };
}

export function getSupabaseServerEnv() {
  return {
    supabaseUrl: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseSecretKey: requiredEnv("SUPABASE_SECRET_KEY"),
  };
}

export function getAiServerEnv() {
  return {
    openAiAnalysisModel: process.env.OPENAI_ANALYSIS_MODEL ?? null,
    openAiApiKey: process.env.OPENAI_API_KEY ?? null,
  };
}
