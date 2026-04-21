export type SignUpUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type SignUpErrorCode =
  | "invalid_input"
  | "email_already_exists"
  | "server_error";

export type SignUpError = {
  code: SignUpErrorCode;
  message: string;
};

export type SignUpResponse =
  | {
      ok: true;
      user: SignUpUser;
    }
  | {
      ok: false;
      error: SignUpError;
    };
