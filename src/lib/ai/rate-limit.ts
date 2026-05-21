import "server-only";

import { RATE_LIMIT_POLICIES } from "@/server/services/rate-limit-service";

export const AI_RATE_LIMIT = {
  limit: RATE_LIMIT_POLICIES.aiAnalysis.limit,
  windowSeconds: RATE_LIMIT_POLICIES.aiAnalysis.windowSeconds,
} as const;

export {
  checkRateLimitOrThrow,
  createAiRateLimitKey,
  getRateLimitHeaders,
  RATE_LIMIT_SCOPES,
  RateLimitExceededError,
} from "@/server/services/rate-limit-service";
