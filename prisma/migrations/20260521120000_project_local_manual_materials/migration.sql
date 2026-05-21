ALTER TABLE "ProjectMaterial" ADD COLUMN "manualName" TEXT;
ALTER TABLE "ProjectMaterial" ADD COLUMN "manualUnit" "MaterialUnit";
ALTER TABLE "ProjectMaterial" ADD COLUMN "manualCategory" "MaterialCategory";
ALTER TABLE "ProjectMaterial" ALTER COLUMN "materialId" DROP NOT NULL;

-- Existing source='manual' rows keep their current Material relation for
-- backwards-compatible project display/export. New manual rows should use the
-- ProjectMaterial manual* snapshot columns and leave materialId NULL.
-- TODO(data-cleanup): Review old code-less Material rows created by the
-- previous manual quote flow and remove or migrate them only after confirming
-- they are not system catalog entries.
