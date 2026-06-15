export type SignUpUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type SignUpErrorCode =
  | "invalid_input"
  | "email_already_exists"
  | "rate_limited"
  | "server_error"
  | "turnstile_failed";

export type SignUpError = {
  code: SignUpErrorCode;
  message: string;
};

export type SignUpResponse =
  | {
      devVerificationUrl?: string;
      ok: true;
      user: SignUpUser;
    }
  | {
      ok: false;
      error: SignUpError;
    };

export type ForgotPasswordErrorCode =
  | "invalid_input"
  | "rate_limited"
  | "server_error"
  | "turnstile_failed";

export type ForgotPasswordResponse =
  | {
      devResetUrl?: string;
      message: string;
      ok: true;
    }
  | {
      error: {
        code: ForgotPasswordErrorCode;
        message: string;
      };
      ok: false;
    };

export type ResetPasswordErrorCode =
  | "invalid_input"
  | "invalid_or_expired_token"
  | "rate_limited"
  | "server_error";

export type ResetPasswordResponse =
  | {
      message: string;
      ok: true;
    }
  | {
      error: {
        code: ResetPasswordErrorCode;
        message: string;
      };
      ok: false;
    };

export type ResendEmailVerificationSuccessCode = "already_verified" | "sent";

export type ResendEmailVerificationErrorCode =
  | "rate_limited"
  | "server_error";

export type ResendEmailVerificationResponse =
  | {
      code: ResendEmailVerificationSuccessCode;
      message: string;
      ok: true;
    }
  | {
      error: {
        code: ResendEmailVerificationErrorCode;
        message: string;
      };
      ok: false;
    };
