#!/usr/bin/env bash
# Provision the dedicated S3 bucket for the video editor.
# Idempotent — safe to re-run.
#
# Usage:
#   AWS_REGION=us-east-1 AWS_S3_VIDEO_BUCKET=agora-video-renders \
#     ./infra/setup-video-bucket.sh
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
BUCKET="${AWS_S3_VIDEO_BUCKET:?AWS_S3_VIDEO_BUCKET is required}"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "→ Region: $REGION"
echo "→ Bucket: $BUCKET"

# 1) Create the bucket if it doesn't exist. us-east-1 is a special case
#    that does NOT take --create-bucket-configuration.
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "✓ Bucket already exists"
else
  echo "→ Creating bucket…"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=$REGION"
  fi
fi

# 2) Block all public access — renders are delivered via signed URLs only.
echo "→ Blocking public access…"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# 3) 24h expiration lifecycle — every object is deleted automatically.
#    Aborts incomplete multipart uploads after 1 day to keep storage clean.
echo "→ Applying 24h lifecycle rule…"
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET" \
  --lifecycle-configuration "file://$HERE/s3-video-bucket-lifecycle.json"

# 4) CORS — needed for direct browser PUT uploads via presigned URLs.
echo "→ Applying CORS configuration…"
aws s3api put-bucket-cors --bucket "$BUCKET" \
  --cors-configuration "file://$HERE/s3-video-bucket-cors.json"

# 5) Server-side encryption — defense in depth (free).
echo "→ Enabling default encryption…"
aws s3api put-bucket-encryption --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo
echo "✅ Bucket $BUCKET is ready."
echo "   Set AWS_S3_VIDEO_BUCKET=$BUCKET in your Railway env vars."
