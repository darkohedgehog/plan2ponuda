-- CreateEnum
CREATE TYPE "ProjectDocumentCandidateType" AS ENUM ('material', 'labor');

-- CreateEnum
CREATE TYPE "ProjectDocumentCandidateStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "ProjectDocumentCandidate" (
    "id" TEXT NOT NULL,
    "projectDocumentAnalysisId" TEXT NOT NULL,
    "type" "ProjectDocumentCandidateType" NOT NULL,
    "status" "ProjectDocumentCandidateStatus" NOT NULL DEFAULT 'pending',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(65,30),
    "unitPrice" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2),
    "sourceReference" TEXT,
    "confidence" DECIMAL(4,3),
    "notes" TEXT,
    "originalJson" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocumentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectDocumentCandidate_projectDocumentAnalysisId_idx" ON "ProjectDocumentCandidate"("projectDocumentAnalysisId");

-- CreateIndex
CREATE INDEX "ProjectDocumentCandidate_type_idx" ON "ProjectDocumentCandidate"("type");

-- CreateIndex
CREATE INDEX "ProjectDocumentCandidate_status_idx" ON "ProjectDocumentCandidate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDocumentCandidate_projectDocumentAnalysisId_type_sor_key" ON "ProjectDocumentCandidate"("projectDocumentAnalysisId", "type", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProjectDocumentCandidate" ADD CONSTRAINT "ProjectDocumentCandidate_projectDocumentAnalysisId_fkey" FOREIGN KEY ("projectDocumentAnalysisId") REFERENCES "ProjectDocumentAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
