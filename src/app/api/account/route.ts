import { NextResponse } from "next/server";

import { getLocaleFromRequest } from "@/i18n/request-locale";
import { requireApiUser } from "@/lib/auth/guards";
import { deleteAccountRequestSchema } from "@/lib/validations/account.schema";
import { deleteAccount } from "@/server/services/account-deletion-service";
import type {
  DeleteAccountErrorCode,
  DeleteAccountResponse,
} from "@/types/account";

const errorMessages: Record<DeleteAccountErrorCode, string> = {
  active_subscription:
    "Please cancel your subscription in Billing before deleting your account.",
  admin_account: "Admin accounts cannot be deleted from self-service settings.",
  confirmation_email_mismatch: "The confirmation email does not match.",
  confirmation_required: "Confirm that this action cannot be undone.",
  invalid_input: "Enter the required account deletion confirmation.",
  server_error: "Could not delete account.",
  user_not_found: "Account not found.",
};

function errorResponse(
  code: DeleteAccountErrorCode,
  status: number,
): NextResponse<DeleteAccountResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message: errorMessages[code],
      },
      ok: false,
    },
    { status },
  );
}

function getErrorStatus(code: DeleteAccountErrorCode): number {
  switch (code) {
    case "active_subscription":
      return 409;
    case "admin_account":
      return 403;
    case "user_not_found":
      return 404;
    case "server_error":
      return 500;
    case "confirmation_email_mismatch":
    case "confirmation_required":
    case "invalid_input":
      return 400;
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch((): unknown => null);
  const parsedInput = deleteAccountRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    const hasMissingConfirmation =
      typeof body === "object" &&
      body !== null &&
      "confirmPermanentDeletion" in body &&
      body.confirmPermanentDeletion !== true;

    return errorResponse(
      hasMissingConfirmation ? "confirmation_required" : "invalid_input",
      400,
    );
  }

  const result = await deleteAccount({
    authenticatedEmail: auth.user.email,
    request: parsedInput.data,
    userId: auth.user.id,
  }).catch((error: unknown) => {
    console.error("Account deletion failed", error);

    return {
      ok: false as const,
      reason: "server_error" as const,
    };
  });

  if (!result.ok) {
    return errorResponse(result.reason, getErrorStatus(result.reason));
  }

  const locale = getLocaleFromRequest(request);
  const response: DeleteAccountResponse = {
    ok: true,
    redirectTo: `/${locale}/sign-in?account=deleted`,
    storageCleanupWarning: result.storageCleanupFailed || undefined,
  };

  return NextResponse.json(response);
}
