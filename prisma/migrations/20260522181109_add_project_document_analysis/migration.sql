-- CreateEnum
CREATE TYPE "ProjectDocumentAnalysisStatus" AS ENUM ('pending', 'analyzing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "ProjectDocumentAnalysis" (
    "id" TEXT NOT NULL,
    "projectDocumentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "status" "ProjectDocumentAnalysisStatus" NOT NULL DEFAULT 'pending',
    "rawResponseJson" JSONB,
    "parsedResponseJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDocumentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectDocumentAnalysis_projectDocumentId_idx" ON "ProjectDocumentAnalysis"("projectDocumentId");

-- CreateIndex
CREATE INDEX "ProjectDocumentAnalysis_status_idx" ON "ProjectDocumentAnalysis"("status");

-- CreateIndex
CREATE INDEX "ProjectDocumentAnalysis_createdAt_idx" ON "ProjectDocumentAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "ProjectDocumentAnalysis" ADD CONSTRAINT "ProjectDocumentAnalysis_projectDocumentId_fkey" FOREIGN KEY ("projectDocumentId") REFERENCES "ProjectDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
