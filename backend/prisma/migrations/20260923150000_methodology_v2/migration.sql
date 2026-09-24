-- New analyses use the audited methodology contract.
-- Existing analyses retain their historical methodology version.
ALTER TABLE "Analysis" ALTER COLUMN "methodology" SET DEFAULT 'v2';
