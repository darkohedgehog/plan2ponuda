import assert from "node:assert/strict";
import test from "node:test";

import { deleteAccountRequestSchema } from "../src/lib/validations/account.schema.ts";
import {
  getAccountDeletionConfirmationError,
  isAccountDeletionSubscriptionBlocked,
} from "../src/server/services/account-deletion-policy.ts";
import { getProjectStoragePathsToDelete } from "../src/server/services/project-storage-paths.ts";

const now = new Date("2026-05-29T12:00:00.000Z");

test("delete account request requires exact email confirmation and permanent checkbox", () => {
  assert.equal(
    deleteAccountRequestSchema.safeParse({
      confirmationEmail: "user@example.com",
      confirmPermanentDeletion: true,
    }).success,
    true,
  );

  assert.equal(
    deleteAccountRequestSchema.safeParse({
      confirmationEmail: "user@example.com",
      confirmPermanentDeletion: false,
    }).success,
    false,
  );

  assert.equal(
    getAccountDeletionConfirmationError({
      authenticatedEmail: "user@example.com",
      confirmationEmail: "USER@example.com",
      confirmPermanentDeletion: true,
    }),
    "confirmation_email_mismatch",
  );

  assert.equal(
    getAccountDeletionConfirmationError({
      authenticatedEmail: "user@example.com",
      confirmationEmail: "user@example.com",
      confirmPermanentDeletion: false,
    }),
    "confirmation_required",
  );
});

test("active paid subscriptions block self-service account deletion", () => {
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        plan: "basic",
        status: "active",
      },
      now,
    ),
    true,
  );
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        plan: "pro",
        status: "trialing",
      },
      now,
    ),
    true,
  );
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        plan: "basic",
        status: "past_due",
      },
      now,
    ),
    true,
  );
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date("2026-05-30T12:00:00.000Z"),
        plan: "basic",
        status: "canceled",
      },
      now,
    ),
    true,
  );
});

test("free and inactive paid subscriptions allow self-service account deletion", () => {
  assert.equal(isAccountDeletionSubscriptionBlocked(null, now), false);
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        plan: "free",
        status: "active",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date("2026-05-28T12:00:00.000Z"),
        plan: "pro",
        status: "canceled",
      },
      now,
    ),
    false,
  );
  assert.equal(
    isAccountDeletionSubscriptionBlocked(
      {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        plan: "basic",
        status: "unpaid",
      },
      now,
    ),
    false,
  );
});

test("account deletion storage cleanup accepts only validated project-owned paths", () => {
  assert.deepEqual(
    getProjectStoragePathsToDelete({
      documentFilePaths: [
        "projects/project-1/documents/document-1/source.pdf",
        "projects/project-2/documents/document-2/source.pdf",
        "projects/project-1/%2e%2e/project-2/secret.pdf",
      ],
      previewPath: "projects/project-1/preview.png",
      projectId: "project-1",
      sourceFilePath: "projects/project-1/floor-plan.pdf",
    }),
    [
      "projects/project-1/floor-plan.pdf",
      "projects/project-1/preview.png",
      "projects/project-1/documents/document-1/source.pdf",
    ],
  );
});
