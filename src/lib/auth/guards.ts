import { NextResponse } from "next/server";

import type { AuthenticatedAdminUser } from "@/lib/auth/admin";
import {
  getCurrentUser,
  type AuthenticatedUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type ApiAuthResult =
  | {
      ok: true;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      response: NextResponse<{ error: string }>;
    };

type ApiAdminResult =
  | {
      ok: true;
      user: AuthenticatedAdminUser;
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
