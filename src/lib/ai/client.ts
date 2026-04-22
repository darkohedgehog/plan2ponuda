import "server-only";

import { getAiServerEnv } from "@/lib/utils/env";

export type AiProvider = "openai";

export type AiClientConfig = {
  apiKey: string;
  provider: AiProvider;
};

export type AiClientConfigResult =
  | {
      config: AiClientConfig;
      ok: true;
    }
  | {
      ok: false;
      reason: "missing_api_key";
    };

export function getAiClientConfig(): AiClientConfigResult {
  const env = getAiServerEnv();

  if (!env.openAiApiKey) {
    return {
      ok: false,
      reason: "missing_api_key",
    };
  }

  return {
    config: {
      apiKey: env.openAiApiKey,
      provider: "openai",
    },
    ok: true,
  };
}
