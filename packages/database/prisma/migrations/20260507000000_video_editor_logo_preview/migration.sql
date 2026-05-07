-- Logo overlay + preview mode for the video editor
ALTER TABLE "video_editor_jobs"
  ADD COLUMN "logoEnabled"     BOOLEAN          NOT NULL DEFAULT false,
  ADD COLUMN "logoKey"         TEXT,
  ADD COLUMN "logoPosition"    TEXT             NOT NULL DEFAULT 'bottom-right',
  ADD COLUMN "logoSizePercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
  ADD COLUMN "logoOpacity"     DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  ADD COLUMN "previewMode"     BOOLEAN          NOT NULL DEFAULT false;
