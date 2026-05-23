-- AlterTable
ALTER TABLE "ProjectDocumentCandidate" ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "importedLaborItemId" TEXT,
ADD COLUMN     "importedProjectMaterialId" TEXT;

-- CreateIndex
CREATE INDEX "ProjectDocumentCandidate_importedAt_idx" ON "ProjectDocumentCandidate"("importedAt");

-- CreateIndex
CREATE INDEX "ProjectDocumentCandidate_importedProjectMaterialId_idx" ON "ProjectDocumentCandidate"("importedProjectMaterialId");
