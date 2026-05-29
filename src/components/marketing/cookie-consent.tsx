"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/components/marketing/cookie-settings-button";
import { Link } from "@/i18n/navigation";
import {
  AcceptAll,
  createCookieConsentPreferences,
  getCookieConsentFromDocument,
  necessaryOnlyConsent,
  type CookieConsentPreferences,
  writeCookieConsentToDocument,
} from "@/lib/cookie-consent/storage";
import { cn } from "@/lib/utils/helpers";

type ConsentDraft = Pick<
  CookieConsentPreferences,
  "analytics" | "marketing"
>;

const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function CookieConsentProvider() {
  const t = useTranslations("CookieConsent");
  const tFooter = useTranslations("Footer");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentDraft>({
    analytics: false,
    marketing: false,
  });
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedConsent = getCookieConsentFromDocument();

      if (storedConsent) {
        setDraft({
          analytics: storedConsent.analytics,
          marketing: storedConsent.marketing,
        });
      } else {
        setIsBannerVisible(true);
      }

      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function openPreferences() {
      const storedConsent = getCookieConsentFromDocument();

      if (storedConsent) {
        setDraft({
          analytics: storedConsent.analytics,
          marketing: storedConsent.marketing,
        });
      }

      setIsModalOpen(true);
    }

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);

    return () => {
      window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setSavedMessage(""), 4000);

    return () => window.clearTimeout(timeoutId);
  }, [savedMessage]);

  function saveConsent(
    preferences: Omit<CookieConsentPreferences, "updatedAt">,
  ) {
    const consentPreferences = createCookieConsentPreferences(preferences);

    writeCookieConsentToDocument(consentPreferences);
    setDraft({
      analytics: consentPreferences.analytics,
      marketing: consentPreferences.marketing,
    });
    setIsBannerVisible(false);
    setIsModalOpen(false);
    setSavedMessage(t("messages.saved"));
  }

  if (!isReady) {
    return null;
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {savedMessage}
      </div>

      {isBannerVisible ? (
        <section
          aria-label={t("banner.title")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-frosted-blue-200 bg-white/96 px-4 py-4 shadow-[0_-18px_44px_rgba(1,2,35,0.12)] backdrop-blur sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-deep-twilight-950">
                {t("banner.title")}
              </h2>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-deep-twilight-700">
                {t("banner.description")}{" "}
                <Link
                  className="font-semibold text-bright-teal-blue-700 outline-none hover:text-bright-teal-blue-800 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-500 focus-visible:ring-offset-2"
                  href="/cookies"
                >
                  {tFooter("links.cookies")}
                </Link>
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:shrink-0">
              <button
                className={cn(
                  buttonBaseClass,
                  "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                onClick={() => saveConsent(necessaryOnlyConsent)}
                type="button"
              >
                {t("banner.acceptNecessary")}
              </button>
              <button
                className={cn(
                  buttonBaseClass,
                  "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                onClick={() => setIsModalOpen(true)}
                type="button"
              >
                {t("banner.settings")}
              </button>
              <button
                className={cn(
                  buttonBaseClass,
                  "bg-deep-twilight-950 text-white hover:bg-deep-twilight-800",
                )}
                onClick={() => saveConsent(AcceptAll)}
                type="button"
              >
                {t("banner.acceptAll")}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isModalOpen ? (
        <div
          aria-labelledby="cookie-preferences-title"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-end bg-deep-twilight-950/45 p-3 sm:items-center sm:justify-center sm:p-6"
          role="dialog"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-frosted-blue-200 bg-white shadow-[0_28px_80px_rgba(1,2,35,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-frosted-blue-100 px-5 py-4">
              <div className="min-w-0">
                <h2
                  className="text-lg font-semibold text-deep-twilight-950"
                  id="cookie-preferences-title"
                >
                  {t("modal.title")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
                  {t("modal.description")}
                </p>
              </div>
              <button
                aria-label={t("actions.close")}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-deep-twilight-700 outline-none transition-colors hover:bg-frosted-blue-100 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2"
                onClick={() => setIsModalOpen(false)}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <PreferenceRow
                checked
                description={t("categories.necessary.description")}
                disabled
                label={t("categories.necessary.alwaysActive")}
                title={t("categories.necessary.title")}
              />
              <PreferenceRow
                checked={draft.analytics}
                description={t("categories.analytics.description")}
                label={t("categories.analytics.notUsed")}
                onChange={(checked) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    analytics: checked,
                  }))
                }
                title={t("categories.analytics.title")}
              />
              <PreferenceRow
                checked={draft.marketing}
                description={t("categories.marketing.description")}
                label={t("categories.marketing.notUsed")}
                onChange={(checked) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    marketing: checked,
                  }))
                }
                title={t("categories.marketing.title")}
              />
            </div>

            <div className="grid gap-2 border-t border-frosted-blue-100 px-5 py-4 sm:grid-cols-3">
              <button
                className={cn(
                  buttonBaseClass,
                  "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                onClick={() => saveConsent(necessaryOnlyConsent)}
                type="button"
              >
                {t("actions.rejectOptional")}
              </button>
              <button
                className={cn(
                  buttonBaseClass,
                  "border border-frosted-blue-200 bg-white text-deep-twilight-900 hover:bg-frosted-blue-50",
                )}
                onClick={() =>
                  saveConsent({
                    necessary: true,
                    analytics: draft.analytics,
                    marketing: draft.marketing,
                  })
                }
                type="button"
              >
                {t("actions.save")}
              </button>
              <button
                className={cn(
                  buttonBaseClass,
                  "bg-deep-twilight-950 text-white hover:bg-deep-twilight-800",
                )}
                onClick={() => saveConsent(AcceptAll)}
                type="button"
              >
                {t("banner.acceptAll")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type PreferenceRowProps = {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
  title: string;
};

function PreferenceRow({
  checked,
  description,
  disabled = false,
  label,
  onChange,
  title,
}: PreferenceRowProps) {
  return (
    <label className="grid min-w-0 gap-4 rounded-xl border border-frosted-blue-200 bg-frosted-blue-50/70 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-deep-twilight-950">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-6 text-deep-twilight-700">
          {description}
        </span>
        <span className="mt-2 block text-xs font-semibold uppercase tracking-normal text-bright-teal-blue-700">
          {label}
        </span>
      </span>
      <input
        checked={checked}
        className="h-6 w-6 rounded border-frosted-blue-300 text-bright-teal-blue-600 focus-visible:ring-2 focus-visible:ring-bright-teal-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}
