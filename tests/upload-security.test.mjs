import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES,
  validateFloorPlanFileUpload,
} from "../src/lib/validations/project.schema.ts";
import {
  MAX_PROJECT_DOCUMENT_UPLOAD_BODY_SIZE_BYTES,
  validateProjectDocumentFileUpload,
} from "../src/lib/validations/project-document.schema.ts";
import { isUploadBodyTooLarge } from "../src/lib/validations/upload-request.ts";

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function createFile({ bytes, name, type }) {
  return new File([Uint8Array.from(bytes)], name, { type });
}

const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const svgBytes = Array.from(new TextEncoder().encode("<svg></svg>"));
const htmlBytes = Array.from(new TextEncoder().encode("<!doctype html>"));
const jsBytes = Array.from(new TextEncoder().encode("alert(1)"));
const bogusBytes = [0x00, 0x01, 0x02, 0x03, 0x04];

test("floor plan upload validation accepts real PDF, PNG, and JPEG signatures", async () => {
  const cases = [
    {
      bytes: pdfBytes,
      extension: "pdf",
      mimeType: "application/pdf",
      name: "floor-plan.pdf",
    },
    {
      bytes: pngBytes,
      extension: "png",
      mimeType: "image/png",
      name: "floor-plan.png",
    },
    {
      bytes: jpegBytes,
      extension: "jpg",
      mimeType: "image/jpeg",
      name: "floor-plan.jpg",
    },
  ];

  for (const fileCase of cases) {
    assert.deepEqual(
      await validateFloorPlanFileUpload(
        createFile({
          bytes: fileCase.bytes,
          name: fileCase.name,
          type: fileCase.mimeType,
        }),
      ),
      {
        extension: fileCase.extension,
        mimeType: fileCase.mimeType,
        ok: true,
      },
    );
  }
});

test("floor plan upload validation rejects renamed or mismatched content", async () => {
  for (const file of [
    createFile({ bytes: svgBytes, name: "floor-plan.png", type: "image/png" }),
    createFile({
      bytes: htmlBytes,
      name: "floor-plan.pdf",
      type: "application/pdf",
    }),
    createFile({
      bytes: bogusBytes,
      name: "floor-plan.jpg",
      type: "image/jpeg",
    }),
    createFile({
      bytes: jsBytes,
      name: "floor-plan.jpg",
      type: "image/jpeg",
    }),
    createFile({ bytes: pngBytes, name: "floor-plan.pdf", type: "image/png" }),
    createFile({ bytes: pngBytes, name: "floor-plan.png", type: "image/jpeg" }),
  ]) {
    assert.deepEqual(await validateFloorPlanFileUpload(file), {
      error: {
        code: "unsupported_file_type",
        message: "Upload a PDF, PNG, JPG, or JPEG floor plan.",
      },
      ok: false,
    });
  }
});

test("project document upload validation accepts only real PDFs", async () => {
  assert.deepEqual(
    await validateProjectDocumentFileUpload(
      createFile({
        bytes: pdfBytes,
        name: "documentation.pdf",
        type: "application/pdf",
      }),
    ),
    {
      mimeType: "application/pdf",
      ok: true,
    },
  );

  for (const file of [
    createFile({
      bytes: htmlBytes,
      name: "documentation.pdf",
      type: "application/pdf",
    }),
    createFile({
      bytes: bogusBytes,
      name: "documentation.pdf",
      type: "application/pdf",
    }),
    createFile({
      bytes: pdfBytes,
      name: "documentation.png",
      type: "application/pdf",
    }),
  ]) {
    assert.deepEqual(await validateProjectDocumentFileUpload(file), {
      error: {
        code: "unsupported_file_type",
        message: "Upload a PDF project document.",
      },
      ok: false,
    });
  }
});

test("upload body size helper rejects oversized Content-Length only when present", () => {
  assert.equal(
    isUploadBodyTooLarge(
      new Headers({
        "content-length": String(MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES + 1),
      }),
      MAX_FLOOR_PLAN_UPLOAD_BODY_SIZE_BYTES,
    ),
    true,
  );
  assert.equal(
    isUploadBodyTooLarge(
      new Headers({
        "content-length": String(MAX_PROJECT_DOCUMENT_UPLOAD_BODY_SIZE_BYTES),
      }),
      MAX_PROJECT_DOCUMENT_UPLOAD_BODY_SIZE_BYTES,
    ),
    false,
  );
  assert.equal(
    isUploadBodyTooLarge(new Headers(), MAX_PROJECT_DOCUMENT_UPLOAD_BODY_SIZE_BYTES),
    false,
  );
});

test("upload routes check Content-Length before parsing multipart form data", () => {
  for (const routePath of [
    "src/app/api/projects/[projectId]/upload/route.ts",
    "src/app/api/projects/[projectId]/documents/upload/route.ts",
  ]) {
    const source = readSource(routePath);
    const contentLengthIndex = source.indexOf("isUploadBodyTooLarge");
    const formDataIndex = source.indexOf("request.formData()");

    assert.ok(contentLengthIndex > -1);
    assert.ok(formDataIndex > -1);
    assert.ok(contentLengthIndex < formDataIndex);
    assert.match(source, /status:\s*413/);
  }
});

test("upload services store detected content type instead of submitted file type", () => {
  const floorPlanService = readSource("src/server/services/project-service.ts");
  const documentService = readSource(
    "src/server/services/project-document-service.ts",
  );

  assert.match(floorPlanService, /validateFloorPlanFileUpload/);
  assert.match(floorPlanService, /contentType:\s*validatedFile\.mimeType/);
  assert.match(documentService, /validateProjectDocumentFileUpload/);
  assert.match(documentService, /mimeType:\s*validatedFile\.mimeType/);
  assert.match(documentService, /contentType:\s*validatedFile\.mimeType/);
});

test("deployment checklist documents reverse proxy upload body limits", () => {
  const checklist = readSource(".codex/DEPLOYMENT_CHECKLIST.md");

  assert.match(checklist, /client_max_body_size/);
  assert.match(checklist, /11m/);
  assert.match(checklist, /21m/);
});
