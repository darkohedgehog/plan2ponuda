import { NextResponse } from "next/server";

import type { AuthenticatedAdminUser } from "@/lib/auth/admin";
import {
  getCurrentUser,
  type AuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isUserEmailVerified } from "@/server/services/auth-service";

type ApiAuthResult =
  | {
      ok: true;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type ApiAdminResult =
  | {
      ok: true;
      user: AuthenticatedAdminUser;
    }
  | {
      ok: false;
      response: NextResponse;
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

export async function requireApiVerifiedUser(): Promise<ApiAuthResult> {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth;
  }

  const emailVerified = await isUserEmailVerified(auth.user.id);

  if (!emailVerified) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: {
            code: "email_not_verified",
            message: "Verify your email address before using this feature.",
          },
        },
        { status: 403 },
      ),
    };
  }

  return auth;
}

export async function requireApiAdmin(): Promise<ApiAdminResult> {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth;
  }

  const user = await prisma.user.findUnique({
    select: {
      role: true,
    },
    where: {
      id: auth.user.id,
    },
  });

  if (user?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    user: {
      ...auth.user,
      role: "admin",
    },
  };
}
