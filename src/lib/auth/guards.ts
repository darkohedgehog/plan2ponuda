import { NextResponse } from "next/server";

import {
  getCurrentUser,
  type AuthenticatedUser,
} from "@/lib/auth/session";

type ApiAuthResult =
  | {
      ok: true;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      response: NextResponse<{ error: string }>;
    };

export async function requireApiUser(): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    user,
  };
}
