CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "yandexId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepositoryAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepositoryAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_yandexId_key" ON "User"("yandexId");
CREATE UNIQUE INDEX "RepositoryAccess_userId_repositoryId_key" ON "RepositoryAccess"("userId", "repositoryId");
CREATE INDEX "RepositoryAccess_repositoryId_idx" ON "RepositoryAccess"("repositoryId");

ALTER TABLE "RepositoryAccess" ADD CONSTRAINT "RepositoryAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepositoryAccess" ADD CONSTRAINT "RepositoryAccess_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
