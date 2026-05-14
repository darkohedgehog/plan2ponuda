import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import {
  getCurrentUser,
  type AuthenticatedUser,
} from "@/lib/auth/session";

export type AuthenticatedAdminUser = AuthenticatedUser & {
  role: "admin";
};

export async function getCurrentAdminUser(): Promise<AuthenticatedAdminUser | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      role: true,
    },
  });

  if (dbUser?.role !== "admin") {
    return null;
  }

  return {
    ...user,
    role: "admin",
  };
}

export async function requireAdmin(): Promise<AuthenticatedAdminUser> {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    notFound();
  }

  return admin;
}
