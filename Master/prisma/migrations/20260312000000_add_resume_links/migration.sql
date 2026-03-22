-- CreateEnum
CREATE TYPE "ResumeLinkResponse" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "resume_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "resumeDraftId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" "ResumeLinkResponse" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_links_token_key" ON "resume_links"("token");

-- CreateIndex
CREATE INDEX "resume_links_clientId_idx" ON "resume_links"("clientId");

-- CreateIndex
CREATE INDEX "resume_links_resumeDraftId_idx" ON "resume_links"("resumeDraftId");

-- CreateIndex
CREATE INDEX "resume_links_token_idx" ON "resume_links"("token");

-- AddForeignKey
ALTER TABLE "resume_links" ADD CONSTRAINT "resume_links_resumeDraftId_fkey" FOREIGN KEY ("resumeDraftId") REFERENCES "resume_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_links" ADD CONSTRAINT "resume_links_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
