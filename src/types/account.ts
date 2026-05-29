export type AccountDeletionBlockReason =
  | "active_subscription"
  | "admin_account";

export type AccountDeletionStatus = {
  blockedReason: AccountDeletionBlockReason | null;
};

export type DeleteAccountErrorCode =
  | "active_subscription"
  | "admin_account"
  | "confirmation_email_mismatch"
  | "confirmation_required"
  | "invalid_input"
  | "server_error"
  | "user_not_found";

export type DeleteAccountResponse =
  | {
      ok: true;
      redirectTo: string;
      storageCleanupWarning?: boolean;
    }
  | {
      error: {
        code: DeleteAccountErrorCode;
        message: string;
      };
      ok: false;
    };
