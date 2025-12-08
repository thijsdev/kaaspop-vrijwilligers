#!/bin/bash

# Deploy script voor Kaaspop Vrijwilligers Formulier
# Dit script deployt de infrastructuur en upload het formulier

set -e

echo "🚀 Kaaspop Vrijwilligers Formulier - AWS Deployment"
echo "=================================================="
echo ""

# Kleuren voor output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check of AWS CLI is geïnstalleerd
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is niet geïnstalleerd${NC}"
    echo "Installeer met: brew install awscli (macOS) of pip install awscli"
    exit 1
fi

# Check of Terraform is geïnstalleerd
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is niet geïnstalleerd${NC}"
    echo "Installeer met: brew install terraform (macOS)"
    exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials niet geconfigureerd${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: ${ACCOUNT_ID}${NC}"
echo ""

# Stap 1: Terraform initialiseren
echo -e "${YELLOW}📦 Stap 1: Terraform initialiseren...${NC}"
cd terraform
terraform init
echo -e "${GREEN}✅ Terraform geïnitialiseerd${NC}"
echo ""

# Stap 2: Terraform plan
echo -e "${YELLOW}📋 Stap 2: Terraform plan maken...${NC}"
terraform plan -out=tfplan
echo -e "${GREEN}✅ Plan gemaakt${NC}"
echo ""

# Bevestiging vragen
echo -e "${YELLOW}⚠️  Wil je doorgaan met de deployment?${NC}"
read -p "Type 'yes' om door te gaan: " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}❌ Deployment geannuleerd${NC}"
    exit 0
fi

# Stap 3: Terraform apply
echo -e "${YELLOW}🏗️  Stap 3: Infrastructuur aanmaken...${NC}"
echo "Dit kan 5-10 minuten duren (certificaat validatie)..."
terraform apply tfplan
echo -e "${GREEN}✅ Infrastructuur aangemaakt${NC}"
echo ""

# Haal outputs op
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
WEBSITE_URL=$(terraform output -raw website_url)

# Stap 4: HTML bestand uploaden
echo -e "${YELLOW}📤 Stap 4: Formulier uploaden naar S3...${NC}"
cd ..

# Hernoem het bestand naar index.html
cp persoonsgegevens-formulier.html index.html

# Upload naar S3
aws s3 cp index.html s3://${BUCKET_NAME}/index.html \
    --content-type "text/html" \
    --cache-control "max-age=3600"

echo -e "${GREEN}✅ Formulier geüpload${NC}"
echo ""

# Stap 5: CloudFront cache invalideren
echo -e "${YELLOW}🔄 Stap 5: CloudFront cache invalideren...${NC}"
aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_ID} \
    --paths "/*" \
    > /dev/null

echo -e "${GREEN}✅ Cache geïnvalideerd${NC}"
echo ""

# Cleanup
rm -f index.html

# Succesbericht
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment succesvol!${NC}"
echo "=================================================="
echo ""
echo -e "📍 Website URL: ${GREEN}${WEBSITE_URL}${NC}"
echo -e "🪣 S3 Bucket: ${BUCKET_NAME}"
echo -e "☁️  CloudFront ID: ${CLOUDFRONT_ID}"
echo ""
echo -e "${YELLOW}⏳ Let op: Het kan 5-10 minuten duren voordat de website beschikbaar is${NC}"
echo "   (DNS propagatie en CloudFront deployment)"
echo ""
echo "📝 Volgende stappen:"
echo "   1. Test de website: ${WEBSITE_URL}"
echo "   2. Configureer Google Apps Script (zie SETUP_INSTRUCTIES.md)"
echo "   3. Update de script URL in het formulier"
echo ""
