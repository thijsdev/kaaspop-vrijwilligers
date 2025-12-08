# AWS Deployment - Kaaspop Vrijwilligers Formulier

Deze Terraform configuratie zet automatisch de volgende AWS infrastructuur op:

## 📦 Wat wordt er aangemaakt?

- **S3 Bucket** (`vrijwilligers.kaaspop.nl`) - Voor website hosting
- **CloudFront Distributie** - CDN met SSL/TLS
- **ACM Certificaat** - Gratis SSL certificaat (in us-east-1)
- **Route53 Records** - DNS configuratie voor domein en certificaat validatie
- **Origin Access Control** - Beveiligde toegang van CloudFront naar S3

## 🌍 Regio

- **S3 Bucket**: `eu-west-1` (Ierland)
- **ACM Certificaat**: `us-east-1` (vereist voor CloudFront)
- **CloudFront**: Global (edge locations wereldwijd)

## 💰 Kosten (schatting)

Voor een klein formulier met ~1000 bezoekers/maand:

- **S3**: ~€0,02/maand (opslag + requests)
- **CloudFront**: ~€0,10/maand (data transfer)
- **Route53**: €0,50/maand (hosted zone)
- **ACM Certificaat**: Gratis

**Totaal: ~€0,60/maand** (€7/jaar)

## 🚀 Deployment

### Vereisten

1. **AWS CLI** geïnstalleerd en geconfigureerd
   ```bash
   brew install awscli
   aws configure
   ```

2. **Terraform** geïnstalleerd
   ```bash
   brew install terraform
   ```

3. **AWS Credentials** met de volgende permissies:
   - S3 (create bucket, put object)
   - CloudFront (create distribution)
   - ACM (request certificate)
   - Route53 (create records)

### Stap 1: Eerste deployment

```bash
# Maak deploy script executable
chmod +x terraform/deploy.sh

# Run deployment
./terraform/deploy.sh
```

Dit script:
1. ✅ Initialiseert Terraform
2. ✅ Maakt een deployment plan
3. ✅ Vraagt bevestiging
4. ✅ Maakt alle AWS resources aan
5. ✅ Upload het formulier naar S3
6. ✅ Invalideert CloudFront cache

**Duur: 5-10 minuten** (vooral certificaat validatie)

### Stap 2: Updates deployen

Na wijzigingen aan het formulier:

```bash
# Maak update script executable
chmod +x terraform/update.sh

# Upload nieuwe versie
./terraform/update.sh
```

Dit script:
1. ✅ Upload nieuwe versie naar S3
2. ✅ Invalideert CloudFront cache

**Duur: 1-2 minuten**

## 🔧 Handmatige Terraform commando's

Als je liever handmatig werkt:

```bash
cd terraform

# Initialiseren
terraform init

# Plan bekijken
terraform plan

# Infrastructuur aanmaken
terraform apply

# Outputs bekijken
terraform output

# Infrastructuur verwijderen
terraform destroy
```

## 📤 Handmatig uploaden naar S3

```bash
# Haal bucket naam op
BUCKET=$(cd terraform && terraform output -raw s3_bucket_name)

# Upload formulier
aws s3 cp persoonsgegevens-formulier.html s3://${BUCKET}/index.html \
    --content-type "text/html" \
    --cache-control "max-age=3600"

# Invalideer CloudFront cache
CLOUDFRONT_ID=$(cd terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_ID} \
    --paths "/*"
```

## 🔐 Beveiliging

- ✅ S3 bucket is **niet** publiek toegankelijk
- ✅ Alleen CloudFront heeft toegang via Origin Access Control
- ✅ HTTPS verplicht (HTTP wordt geredirect)
- ✅ TLS 1.2 minimum
- ✅ Moderne SSL certificaat

## 🌐 DNS Configuratie

De Terraform configuratie gaat uit van een bestaande Route53 hosted zone voor `kaaspop.nl`.

Als deze nog niet bestaat:
1. Maak een hosted zone aan in Route53
2. Update de nameservers bij je domain registrar

## 📊 Monitoring

### CloudFront metrics bekijken
```bash
aws cloudwatch get-metric-statistics \
    --namespace AWS/CloudFront \
    --metric-name Requests \
    --dimensions Name=DistributionId,Value=YOUR_DISTRIBUTION_ID \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Sum
```

### S3 bucket size
```bash
aws s3 ls s3://vrijwilligers.kaaspop.nl --summarize --human-readable --recursive
```

## 🗑️ Infrastructuur verwijderen

Als je alles wilt verwijderen:

```bash
cd terraform
terraform destroy
```

**Let op:** Dit verwijdert:
- S3 bucket (inclusief inhoud)
- CloudFront distributie
- ACM certificaat
- Route53 records

## 🔄 Rollback

Als er iets mis gaat:

```bash
# Bekijk Terraform state
cd terraform
terraform show

# Rollback naar vorige versie
terraform apply -target=aws_s3_bucket.website

# Of upload oude versie handmatig
aws s3 cp oude-versie.html s3://vrijwilligers.kaaspop.nl/index.html
```

## 📝 Variabelen aanpassen

Edit `terraform/main.tf` en pas de variabelen aan:

```hcl
variable "aws_region" {
  default = "eu-west-1"  # Wijzig regio
}

variable "domain_name" {
  default = "vrijwilligers.kaaspop.nl"  # Wijzig domein
}

variable "hosted_zone_name" {
  default = "kaaspop.nl"  # Wijzig hosted zone
}
```

## 🆘 Troubleshooting

### Certificaat validatie duurt lang
- Normaal: 5-10 minuten
- Check Route53 records zijn aangemaakt
- Wacht tot DNS is gepropageerd

### Website niet bereikbaar
- Check CloudFront deployment status (kan 15 min duren)
- Controleer Route53 A record
- Test CloudFront URL direct: `https://xxxxx.cloudfront.net`

### 403 Forbidden error
- Check S3 bucket policy
- Controleer Origin Access Control configuratie
- Verify bestand heet `index.html`

### Cache updates niet zichtbaar
- Invalideer CloudFront cache handmatig
- Wacht 1-2 minuten
- Test met incognito/private browsing

## 📚 Documentatie

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CloudFront Docs](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [ACM Certificate](https://docs.aws.amazon.com/acm/)

## 🎯 Best Practices

✅ **Gebruik versioning** - Enable S3 versioning voor rollback
✅ **Monitor kosten** - Set up AWS Budgets alerts
✅ **Backup** - Export Terraform state regelmatig
✅ **Security** - Review IAM policies periodiek
✅ **Performance** - Monitor CloudFront cache hit ratio

## 📞 Support

Vragen over de deployment? Check:
- AWS Console → CloudFormation voor stack status
- CloudWatch Logs voor errors
- Terraform state: `terraform show`
