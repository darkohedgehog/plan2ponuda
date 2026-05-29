import { randomUUID } from "node:crypto";

import { hashPassword } from "../../lib/auth/password";
import { prisma } from "../../lib/db/prisma";
import type { DeleteAccountRequestInput } from "../../lib/validations/account.schema";
import type {
  AccountDeletionStatus,
  DeleteAccountErrorCode,
} from "../../types/account";
import {
  getAccountDeletionConfirmationError,
  isAccountDeletionSubscriptionBlocked,
  type AccountDeletionSubscription,
} from "./account-deletion-policy";
import {
  collectAccountDeletionStoragePaths,
  type AccountDeletionProject,
} from "./account-deletion-storage-policy";

const PROJECT_FILES_BUCKET = "project-files";
const STORAGE_REMOVE_BATCH_SIZE = 1000;

type AccountDeletionUser = {
  email: string;
  id: string;
  projects: AccountDeletionProject[];
  role: "admin" | "user";
  subscription: AccountDeletionSubscription | null;
};

export type DeleteAccountInput = {
  authenticatedEmail: string;
  request: DeleteAccountRequestInput;
  userId: string;
};

export type DeleteAccountResult =
  | {
      ok: true;
      storageCleanupFailed: boolean;
    }
  | {
      ok: false;
      reason: DeleteAccountErrorCode;
    };

export async function getAccountDeletionStatus(
  userId: string,
): Promise<AccountDeletionStatus | null> {
  const user = await prisma.user.findUnique({
    select: {
      role: true,
      subscription: {
        select: {
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
          plan: true,
          status: true,
        },
      },
    },
    where: {
      id: userId,
    },
  });

  if (!user) {
    return null;
  }

  if (user.role === "admin") {
    return {
      blockedReason: "admin_account",
    };
  }

  if (isAccountDeletionSubscriptionBlocked(user.subscription)) {
    return {
      blockedReason: "active_subscription",
    };
  }

  return {
    blockedReason: null,
  };
}

export async function deleteAccount({
  authenticatedEmail,
  request,
  userId,
}: DeleteAccountInput): Promise<DeleteAccountResult> {
  const confirmationError = getAccountDeletionConfirmationError({
    authenticatedEmail,
    confirmationEmail: request.confirmationEmail,
    confirmPermanentDeletion: request.confirmPermanentDeletion,
  });

  if (confirmationError) {
    return {
      ok: false,
      reason: confirmationError,
    };
  }

  const user = await getAccountDeletionUser(userId);

  if (!user) {
    return {
      ok: false,
      reason: "user_not_found",
    };
  }

  if (user.role === "admin") {
    return {
      ok: false,
      reason: "admin_account",
    };
  }

  if (user.email !== authenticatedEmail) {
    return {
      ok: false,
      reason: "confirmation_email_mismatch",
    };
  }

  if (isAccountDeletionSubscriptionBlocked(user.subscription)) {
    return {
      ok: false,
      reason: "active_subscription",
    };
  }

  const storagePaths = collectAccountDeletionStoragePaths(user.projects);
  const deletedPasswordHash = await hashPassword(randomUUID());
  const deletedEmail = `deleted+${user.id}@deleted.local`;

  await prisma.$transaction(async (transaction) => {
    await transaction.project.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.usageCounter.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.rateLimitBucket.deleteMany({
      where: {
        key: getUserScopedRateLimitKey(user.id),
      },
    });
    await transaction.billingProfile.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.subscription.deleteMany({
      where: {
        userId: user.id,
      },
    });
    await transaction.userSettings.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Keep InvoiceTask and BillingEvent records for legal/accounting retention.
    // The user row becomes an anonymized tombstone so retained invoice tasks keep
    // a valid foreign key without preserving the deleted account email/name.
    await transaction.user.update({
      data: {
        companyName: null,
        email: deletedEmail,
        emailVerifiedAt: null,
        fullName: null,
        passwordHash: deletedPasswordHash,
        role: "user",
      },
      where: {
        id: user.id,
      },
    });
  });

  const storageCleanupFailed = await removeAccountStorageFiles(storagePaths);

  return {
    ok: true,
    storageCleanupFailed,
  };
}

async function getAccountDeletionUser(
  userId: string,
): Promise<AccountDeletionUser | null> {
  return prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      projects: {
        select: {
          documents: {
            select: {
              filePath: true,
            },
          },
          id: true,
          previewPath: true,
          sourceFilePath: true,
        },
      },
      role: true,
      subscription: {
        select: {
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
          plan: true,
          status: true,
        },
      },
    },
    where: {
      id: userId,
    },
  });
}

function getUserScopedRateLimitKey(userId: string): string {
  return `user:${userId}`;
}

async function removeAccountStorageFiles(filePaths: string[]): Promise<boolean> {
  if (filePaths.length === 0) {
    return false;
  }

  let cleanupFailed = false;

  try {
    const { createSupabaseServerClient } = await import(
      "../../lib/supabase/server-client"
    );
    const supabase = createSupabaseServerClient();

    for (
      let index = 0;
      index < filePaths.length;
      index += STORAGE_REMOVE_BATCH_SIZE
    ) {
      const batch = filePaths.slice(index, index + STORAGE_REMOVE_BATCH_SIZE);
      const { error } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .remove(batch);

      if (error) {
        cleanupFailed = true;
        console.error("Account storage cleanup failed", error);
      }
    }
  } catch (error) {
    cleanupFailed = true;
    console.error("Account storage cleanup failed", error);
  }

  return cleanupFailed;
}
