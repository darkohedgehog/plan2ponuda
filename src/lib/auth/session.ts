import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
