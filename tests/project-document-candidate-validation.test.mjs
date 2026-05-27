import assert from "node:assert/strict";
import test from "node:test";

import {
  projectDocumentCandidateStatusSchema,
  saveProjectDocumentCandidateReviewSchema,
} from "../src/lib/validations/project-document-candidate.schema.ts";

const validCandidateReview = {
  category: "cable",
  description: null,
  id: "candidate_1",
  name: "NYM cable",
  notes: "Check final run length before import.",
  quantity: 12.5,
  status: "accepted",
  unit: "m",
  unitPrice: 3.25,
};

test("candidate review validation rejects negative quantity and unit price", () => {
  assert.equal(
    saveProjectDocumentCandidateReviewSchema.safeParse({
      candidates: [
        {
          ...validCandidateReview,
          quantity: -1,
        },
      ],
    }).success,
    false,
  );

  assert.equal(
    saveProjectDocumentCandidateReviewSchema.safeParse({
      candidates: [
        {
          ...validCandidateReview,
          unitPrice: -0.01,
        },
      ],
    }).success,
    false,
  );
});

test("candidate review validation does not accept immutable audit fields", () => {
  const result = saveProjectDocumentCandidateReviewSchema.safeParse({
    candidates: [
      {
        ...validCandidateReview,
        confidence: 0.99,
        originalJson: {
          name: "Tampered",
        },
        sourceReference: "Page 999",
      },
    ],
  });

  assert.equal(result.success, false);
});

test("candidate review validation accepts partial changed-candidate payloads", () => {
  assert.equal(
    saveProjectDocumentCandidateReviewSchema.safeParse({
      candidates: [],
    }).success,
    true,
  );

  assert.equal(
    saveProjectDocumentCandidateReviewSchema.safeParse({
      candidates: [validCandidateReview],
    }).success,
    true,
  );
});

test("candidate review validation accepts all review statuses", () => {
  assert.deepEqual(projectDocumentCandidateStatusSchema.options, [
    "pending",
    "accepted",
    "rejected",
  ]);

  for (const status of projectDocumentCandidateStatusSchema.options) {
    const result = saveProjectDocumentCandidateReviewSchema.safeParse({
      candidates: [
        {
          ...validCandidateReview,
          status,
        },
      ],
    });

    assert.equal(result.success, true);
  }
});
