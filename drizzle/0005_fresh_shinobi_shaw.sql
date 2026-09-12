ALTER TABLE "admin_settings" ALTER COLUMN "require_captcha" SET DEFAULT false;
UPDATE "admin_settings" SET "require_captcha" = false WHERE "id" = true;
