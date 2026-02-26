-- CreateTable
CREATE TABLE "resume_drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "content" JSONB NOT NULL,
    "template" TEXT DEFAULT 'professional',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_drafts_userId_idx" ON "resume_drafts"("userId");

-- CreateIndex
CREATE INDEX "resume_drafts_clientId_idx" ON "resume_drafts"("clientId");

-- AddForeignKey
ALTER TABLE "resume_drafts" ADD CONSTRAINT "resume_drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_drafts" ADD CONSTRAINT "resume_drafts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
