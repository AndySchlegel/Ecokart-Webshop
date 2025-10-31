# 🚀 Quick Cheatsheet

Du bist hier: `terraform/examples/basic/`

## Deployment (3 Schritte)

```bash
# 1. Stack deployen
terraform apply -auto-approve

# 2. GitHub verbinden (Script ist HIER!)
./connect-github.sh

# 3. Daten befüllen
cd ../../../backend && npm run dynamodb:migrate:single -- --region eu-north-1 && node scripts/create-test-user.js
```

## Verfügbare Scripts

```bash
./connect-github.sh          # GitHub OAuth verbinden
terraform output             # Alle URLs anzeigen
terraform destroy            # Alles löschen
```

## URLs anzeigen

```bash
terraform output amplify_app_url        # Customer Frontend
terraform output admin_amplify_app_url  # Admin Frontend
terraform output api_gateway_url        # Backend API
```

---

Vollständige Anleitung: `../../../QUICKSTART.md`
