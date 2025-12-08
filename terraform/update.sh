#!/bin/bash

# Update script voor Kaaspop Vrijwilligers Formulier
# Upload een nieuwe versie van het formulier naar S3

set -e

echo "🔄 Kaaspop Vrijwilligers Formulier - Update"
echo "=========================================="
echo ""

# Kleuren voor output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check of AWS CLI is geïnstalleerd
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is niet geïnstalleerd${NC}"
    exit 1
fi

# Check of Terraform outputs beschikbaar zijn
cd terraform
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${RED}❌ Terraform state niet gevonden. Run eerst deploy.sh${NC}"
    exit 1
fi

# Haal outputs op
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
WEBSITE_URL=$(terraform output -raw website_url)

echo -e "${GREEN}✅ Bucket: ${BUCKET_NAME}${NC}"
echo -e "${GREEN}✅ CloudFront: ${CLOUDFRONT_ID}${NC}"
echo ""

# Upload nieuwe versie
echo -e "${YELLOW}📤 Uploading nieuwe versie...${NC}"
cd ..

# Hernoem het bestand naar index.html
cp persoonsgegevens-formulier.html index.html

# Upload naar S3
aws s3 cp index.html s3://${BUCKET_NAME}/index.html \
    --content-type "text/html" \
    --cache-control "max-age=3600"

# Upload favicon
if [ -f "favicon.svg" ]; then
    aws s3 cp favicon.svg s3://${BUCKET_NAME}/favicon.svg \
        --content-type "image/svg+xml" \
        --cache-control "max-age=86400"
fi

echo -e "${GREEN}✅ Formulier geüpload${NC}"
echo ""

# CloudFront cache invalideren
echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_ID} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ Cache invalidation gestart (ID: ${INVALIDATION_ID})${NC}"
echo ""

# Cleanup
rm -f index.html

# Succesbericht
echo "=========================================="
echo -e "${GREEN}🎉 Update succesvol!${NC}"
echo "=========================================="
echo ""
echo -e "📍 Website URL: ${GREEN}${WEBSITE_URL}${NC}"
echo ""
echo -e "${YELLOW}⏳ Het kan 1-2 minuten duren voordat de wijzigingen zichtbaar zijn${NC}"
echo ""
