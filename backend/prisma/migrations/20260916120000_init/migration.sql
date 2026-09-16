CREATE TYPE "AnalysisStatus" AS ENUM ('QUEUED', 'COLLECTING', 'CALCULATING', 'COMPLETED', 'FAILED');
CREATE TYPE "AnalysisTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'REANALYSIS');
CREATE TYPE "RepositoryVisibility" AS ENUM ('PUBLIC', 'INTERNAL', 'PRIVATE');
CREATE TYPE "HealthCategory" AS ENUM ('SECURITY', 'ACTIVITY', 'DOCUMENTATION', 'CI_CD', 'ISSUES', 'CODE_HEALTH');
CREATE TYPE "DataStatus" AS ENUM ('AVAILABLE', 'NO_DATA', 'NOT_APPLICABLE', 'COLLECTION_ERROR', 'PERMISSION_DENIED');
CREATE TYPE "RecommendationPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "EvidenceKind" AS ENUM ('FILE', 'PIPELINE', 'VULNERABILITY', 'COMMIT', 'ISSUE', 'MERGE_REQUEST', 'RELEASE', 'METRIC');

CREATE TABLE "Repository" (
  "id" TEXT NOT NULL, "sourcecraftId" TEXT NOT NULL, "ownerSlug" TEXT NOT NULL,
  "slug" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "webUrl" TEXT NOT NULL,
  "visibility" "RepositoryVisibility" NOT NULL DEFAULT 'PUBLIC', "primaryLanguage" TEXT,
  "likesCount" INTEGER NOT NULL DEFAULT 0, "lastActivityAt" TIMESTAMP(3), "lastCollectedAt" TIMESTAMP(3),
  "latestScore" DOUBLE PRECISION, "latestPotentialScore" DOUBLE PRECISION, "latestDataCoverage" DOUBLE PRECISION,
  "lastAnalyzedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Analysis" (
  "id" TEXT NOT NULL, "repositoryId" TEXT NOT NULL, "status" "AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
  "trigger" "AnalysisTrigger" NOT NULL DEFAULT 'MANUAL', "score" DOUBLE PRECISION,
  "potentialScore" DOUBLE PRECISION, "dataCoverage" DOUBLE PRECISION, "methodology" TEXT NOT NULL DEFAULT 'v1',
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "errorCode" TEXT, "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CategoryResult" (
  "id" TEXT NOT NULL, "analysisId" TEXT NOT NULL, "category" "HealthCategory" NOT NULL,
  "score" DOUBLE PRECISION, "weight" DOUBLE PRECISION NOT NULL, "status" "DataStatus" NOT NULL DEFAULT 'AVAILABLE',
  "summary" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MetricResult" (
  "id" TEXT NOT NULL, "categoryResultId" TEXT NOT NULL, "key" TEXT NOT NULL, "rawValue" JSONB,
  "normalizedScore" DOUBLE PRECISION, "weight" DOUBLE PRECISION NOT NULL,
  "status" "DataStatus" NOT NULL DEFAULT 'AVAILABLE', "source" TEXT NOT NULL, "explanation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MetricResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Recommendation" (
  "id" TEXT NOT NULL, "analysisId" TEXT NOT NULL, "category" "HealthCategory" NOT NULL,
  "priority" "RecommendationPriority" NOT NULL, "title" TEXT NOT NULL, "problem" TEXT NOT NULL,
  "rationale" TEXT NOT NULL, "action" TEXT NOT NULL, "expectedScoreDelta" DOUBLE PRECISION,
  "confidence" DOUBLE PRECISION, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Evidence" (
  "id" TEXT NOT NULL, "metricResultId" TEXT, "recommendationId" TEXT, "kind" "EvidenceKind" NOT NULL,
  "label" TEXT NOT NULL, "url" TEXT, "value" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Repository_sourcecraftId_key" ON "Repository"("sourcecraftId");
CREATE INDEX "Repository_primaryLanguage_idx" ON "Repository"("primaryLanguage");
CREATE INDEX "Repository_likesCount_idx" ON "Repository"("likesCount");
CREATE INDEX "Repository_lastActivityAt_idx" ON "Repository"("lastActivityAt");
CREATE INDEX "Repository_latestScore_idx" ON "Repository"("latestScore");
CREATE UNIQUE INDEX "Repository_ownerSlug_slug_key" ON "Repository"("ownerSlug", "slug");
CREATE INDEX "Analysis_repositoryId_createdAt_idx" ON "Analysis"("repositoryId", "createdAt");
CREATE INDEX "Analysis_status_createdAt_idx" ON "Analysis"("status", "createdAt");
CREATE INDEX "CategoryResult_category_score_idx" ON "CategoryResult"("category", "score");
CREATE UNIQUE INDEX "CategoryResult_analysisId_category_key" ON "CategoryResult"("analysisId", "category");
CREATE UNIQUE INDEX "MetricResult_categoryResultId_key_key" ON "MetricResult"("categoryResultId", "key");
CREATE INDEX "Recommendation_analysisId_priority_idx" ON "Recommendation"("analysisId", "priority");
CREATE INDEX "Evidence_metricResultId_idx" ON "Evidence"("metricResultId");
CREATE INDEX "Evidence_recommendationId_idx" ON "Evidence"("recommendationId");

ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CategoryResult" ADD CONSTRAINT "CategoryResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetricResult" ADD CONSTRAINT "MetricResult_categoryResultId_fkey" FOREIGN KEY ("categoryResultId") REFERENCES "CategoryResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_metricResultId_fkey" FOREIGN KEY ("metricResultId") REFERENCES "MetricResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
