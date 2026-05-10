import "server-only";

import OpenAI from "openai";

import { getAiServerEnv } from "@/lib/utils/env";

export type AiProvider = "openai";

export const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-4.1-mini";

export type AiClientConfig = {
  analysisModel: string;
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

export type OpenAiClientResult =
  | {
      client: OpenAI;
      config: AiClientConfig;
      ok: true;
    }
  | {
      ok: false;
      reason: "missing_api_key";
    };

let cachedOpenAiClient:
  | {
      apiKey: string;
      client: OpenAI;
    }
  | null = null;

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
      analysisModel: getAnalysisModel(env.openAiAnalysisModel),
      apiKey: env.openAiApiKey,
      provider: "openai",
    },
    ok: true,
  };
}

export function getOpenAiClient(): OpenAiClientResult {
  const config = getAiClientConfig();

  if (!config.ok) {
    return config;
  }

  if (cachedOpenAiClient?.apiKey !== config.config.apiKey) {
    cachedOpenAiClient = {
      apiKey: config.config.apiKey,
      client: new OpenAI({
        apiKey: config.config.apiKey,
      }),
    };
  }

  return {
    client: cachedOpenAiClient.client,
    config: config.config,
    ok: true,
  };
}

function getAnalysisModel(envModel: string | null): string {
  const trimmedModel = envModel?.trim();

  return trimmedModel && trimmedModel.length > 0
    ? trimmedModel
    : DEFAULT_OPENAI_ANALYSIS_MODEL;
}
