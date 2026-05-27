"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileAction = "forgot-password" | "sign-in" | "sign-up";

type TurnstileWidgetProps = {
  action: TurnstileAction;
  enabled: boolean;
  onTokenChange: (token: string) => void;
  resetKey: number;
};

type TurnstileRenderOptions = {
  action: TurnstileAction;
  callback: (token: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  sitekey: string;
};

type TurnstileApi = {
  remove: (widgetId: string) => void;
  render: (
    container: HTMLElement,
    options: TurnstileRenderOptions,
  ) => string | undefined;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

export function TurnstileWidget({
  action,
  enabled,
  onTokenChange,
  resetKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!enabled || !turnstileSiteKey || !containerRef.current) {
      onTokenChange("");
      return;
    }

    loadTurnstileScript()
      .then(() => {
        if (!isMounted || !containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const widgetId = window.turnstile.render(containerRef.current, {
          action,
          callback: onTokenChange,
          "error-callback": () => {
            onTokenChange("");
            return true;
          },
          "expired-callback": () => onTokenChange(""),
          sitekey: turnstileSiteKey,
        });

        widgetIdRef.current = widgetId ?? null;
      })
      .catch(() => {
        onTokenChange("");
      });

    return () => {
      isMounted = false;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, enabled, onTokenChange, resetKey]);

  if (!enabled || !turnstileSiteKey) {
    return null;
  }

  return <div ref={containerRef} />;
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");

    script.id = TURNSTILE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    document.head.append(script);
  });

  return turnstileScriptPromise;
}
