"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { formControlClassName } from "@/components/ui/form-control";
import { Link } from "@/i18n/navigation";
import type {
  AccountDeletionBlockReason,
  DeleteAccountErrorCode,
  DeleteAccountResponse,
} from "@/types/account";

type DeleteAccountDangerZoneProps = {
  blockedReason: AccountDeletionBlockReason | null;
  email: string;
};

type DeleteAccountStatus = "deleted" | "deleting" | "idle";

async function parseDeleteAccountResponse(
  response: Response,
): Promise<DeleteAccountResponse | null> {
  return response.json().catch((): null => null) as Promise<
    DeleteAccountResponse | null
  >;
}

export function DeleteAccountDangerZone({
  blockedReason,
  email,
}: DeleteAccountDangerZoneProps) {
  const locale = useLocale();
  const t = useTranslations("Settings.dangerZone");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [confirmPermanentDeletion, setConfirmPermanentDeletion] =
    useState(false);
  const [status, setStatus] = useState<DeleteAccountStatus>("idle");
  const [errorCode, setErrorCode] = useState<DeleteAccountErrorCode | null>(
    null,
  );
  const emailMatches = confirmationEmail === email;
  const canSubmit =
    blockedReason === null &&
    emailMatches &&
    confirmPermanentDeletion &&
    status !== "deleting";

  function updateConfirmationEmail(event: ChangeEvent<HTMLInputElement>) {
    setErrorCode(null);
    setConfirmationEmail(event.target.value);
  }

  function updatePermanentConfirmation(event: ChangeEvent<HTMLInputElement>) {
    setErrorCode(null);
    setConfirmPermanentDeletion(event.target.checked);
  }

  async function submitDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setStatus("deleting");
    setErrorCode(null);

    const response = await fetch("/api/account", {
      body: JSON.stringify({
        confirmationEmail,
        confirmPermanentDeletion,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });
    const payload = await parseDeleteAccountResponse(response);

    if (!response.ok || !payload?.ok) {
      setStatus("idle");
      setErrorCode(payload && !payload.ok ? payload.error.code : "server_error");
      return;
    }

    setStatus("deleted");
    await signOut({
      callbackUrl: payload.redirectTo || `/${locale}/sign-in?account=deleted`,
    });
  }

  return (
    <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3 border-b border-red-100 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
          <AlertTriangle aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-red-900">{t("title")}</h2>
          <h3 className="mt-3 text-base font-semibold text-deep-twilight-950">
            {t("deleteAccount")}
          </h3>
          <p className="mt-1 text-sm leading-6 text-deep-twilight-700">
            {t("description")}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-red-800">
            {t("cannotBeUndone")}
          </p>
          <p className="mt-2 text-sm leading-6 text-deep-twilight-700">
            {t("legalRetention")}
          </p>
        </div>
      </div>

      {blockedReason === "active_subscription" ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium leading-6 text-amber-900">
            {t("activeSubscription")}
          </p>
          <Link
            className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 shadow-sm outline-none transition-colors hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2"
            href="/dashboard/billing"
          >
            {t("goToBilling")}
          </Link>
        </div>
      ) : null}

      {blockedReason === "admin_account" ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-900">
          {t("adminBlocked")}
        </div>
      ) : null}

      {blockedReason === null ? (
        <form className="mt-5 grid gap-4" onSubmit={submitDeleteAccount}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-deep-twilight-800">
              {t("typeEmailToConfirm", { email })}
            </span>
            <input
              autoComplete="off"
              className={formControlClassName}
              onChange={updateConfirmationEmail}
              type="email"
              value={confirmationEmail}
            />
          </label>

          <label className="flex items-start gap-3 rounded-md border border-red-100 bg-red-50 px-3 py-3">
            <input
              checked={confirmPermanentDeletion}
              className="mt-1 h-4 w-4 rounded border-red-300 text-red-700"
              onChange={updatePermanentConfirmation}
              type="checkbox"
            />
            <span className="text-sm font-medium leading-6 text-red-900">
              {t("confirmPermanentDeletion")}
            </span>
          </label>

          {errorCode ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {t(
                errorCode === "active_subscription"
                  ? "activeSubscription"
                  : errorCode === "admin_account"
                    ? "adminBlocked"
                    : "deleteFailed",
              )}
            </div>
          ) : null}

          {status === "deleted" ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {t("accountDeleted")}
            </div>
          ) : null}

          <div>
            <Button
              className="bg-red-700 hover:bg-red-800"
              disabled={!canSubmit}
              type="submit"
            >
              {status === "deleting" ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              )}
              {status === "deleting"
                ? t("deleting")
                : t("deletePermanently")}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
