# Ecokart Terraform - Quick Start Guide

**Deployment in 5 Minuten! ⚡**

## Voraussetzungen

- ✅ Terraform >= 1.5.0 installiert
- ✅ AWS CLI >= 2.0 installiert
- ✅ Node.js >= 20.x installiert
- ✅ AWS SSO konfiguriert
- ✅ GitHub Personal Access Token erstellt ([Anleitung](../docs/AMPLIFY_GITHUB_TOKEN.md))

## Deployment-Befehle

```bash
# 1. AWS SSO Login
aws sso login --profile Teilnehmer-729403197965

# 2. Backend bauen
cd backend
npm install
npm run build
cd ..

# 3. Terraform vorbereiten
cd terraform/examples/basic
terraform init
cp terraform.tfvars.example terraform.tfvars

# 4. terraform.tfvars bearbeiten (jwt_secret + github_access_token eintragen)
nano terraform.tfvars

# 5. Infrastruktur deployen
terraform apply

# 6. Daten migrieren
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js
```

## Fertig! 🎉

**Frontend:** https://main.xxx.amplifyapp.com (Basic Auth: demo / test1234)

**API:** https://xxx.execute-api.eu-north-1.amazonaws.com/Prod/

**Login:** demo@ecokart.com / Demo1234!

## Nächste Schritte

- 📖 [Vollständige Dokumentation](./README.md)
- 📚 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 🐛 [Troubleshooting](./README.md#troubleshooting)

## Destroy & Re-Deploy

```bash
# Alles löschen
cd terraform/examples/basic
terraform destroy -auto-approve

# Neu deployen
terraform apply -auto-approve

# Daten wiederherstellen
cd ../../../backend
npm run dynamodb:migrate:single -- --region eu-north-1
node scripts/create-test-user.js
```

**Zeit:** ~10 Minuten für kompletten Re-Deploy
