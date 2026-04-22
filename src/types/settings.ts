export type UserSettingsProfile = {
  companyAddress?: string;
  companyEmail?: string;
  companyName?: string;
  companyPhone?: string;
  currency: string;
  email: string;
  fullName?: string;
  laborFactor: string;
};

export type SaveSettingsResponse =
  | {
      ok: true;
      settings: UserSettingsProfile;
    }
  | {
      error: {
        code: "invalid_input" | "not_found" | "server_error";
        message: string;
      };
      ok: false;
    };
