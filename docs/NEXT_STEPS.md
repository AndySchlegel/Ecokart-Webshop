# Nächste Schritte - Admin-Frontend & Cognito Auth

**Stand:** 30. Oktober 2025
**Status:** Haupt-Deployment erfolgreich, 2 Features geplant

---

## ✅ Aktueller Stand

### Was funktioniert

**Backend (Lambda + API Gateway):**
- ✅ API läuft: `https://bv5vusjqlh.execute-api.eu-north-1.amazonaws.com/Prod/`
- ✅ DynamoDB mit 42 Items (31 Produkte, 3 User, 2 Carts, 7 Orders)
- ✅ JWT-Authentication mit eigenem System

**Frontend (Amplify):**
- ✅ Customer-Frontend deployed: `https://main.d3w31dvvvnf5s0.amplifyapp.com`
- ✅ Next.js SSR funktioniert
- ✅ Login mit: `demo@ecokart.com / Demo1234!`
- ✅ Warenkorb & Checkout funktionieren

**Terraform:**
- ✅ Komplett reproduzierbar (destroy → apply → migrate)
- ✅ Zeitaufwand: 8-12 Minuten
- ✅ Vollständig dokumentiert

---

## 🎯 Geplante Features

### Feature 1: Admin-Frontend deployen

**Ziel:** Admin-Dashboard für Produkt-Verwaltung (Hinzufügen/Löschen)

**Was existiert bereits:**
```
Repository-Struktur:
├── admin-frontend/          ← Next.js 14.2 Admin-Dashboard
│   ├── app/
│   │   ├── login/          ← Admin-Login
│   │   ├── dashboard/      ← Produkt-Verwaltung
│   │   └── api/            ← API-Routes
│   └── package.json
│
├── admin-backend/           ← Lambda Handler (Pure JS)
│   ├── src/
│   │   └── handler.js      ← DynamoDB CRUD Operations
│   └── package.json
```

**Funktionen (bereits lokal getestet):**
- Login-System mit JWT (jose Library)
- Produkte auflisten
- Neues Produkt hinzufügen
- Produkt löschen
- DynamoDB Integration

**Was zu deployen ist:**

1. **Admin-Backend (Lambda)**
   - Separate Lambda Function: `ecokart-admin-api`
   - Eigene API Gateway: `/admin/*`
   - IAM-Rolle: DynamoDB CRUD nur für Products Table
   - Terraform Module: `modules/lambda-admin/`

2. **Admin-Frontend (Amplify)**
   - Zweite Amplify App: `ecokart-admin-frontend`
   - Monorepo: `AMPLIFY_MONOREPO_APP_ROOT=admin-frontend`
   - Environment Variables: `NEXT_PUBLIC_ADMIN_API_URL`
   - Optional: Separate Basic Auth für Admin

**Terraform-Änderungen:**
```hcl
# In terraform/main.tf hinzufügen:

module "lambda_admin" {
  source = "./modules/lambda-admin"
  # ... ähnlich wie Lambda-Modul, aber admin-backend/
}

module "amplify_admin" {
  count  = var.enable_admin_frontend ? 1 : 0
  source = "./modules/amplify"
  app_name = "ecokart-admin-frontend"
  monorepo_app_root = "admin-frontend"
  # ...
}
```

**Geschätzte Zeit:** 50 Minuten
**Zusätzliche Kosten:** ~€2-3/Monat

---

### Feature 2: AWS Cognito Authentication

**Ziel:** Ersetze JWT-System durch AWS Cognito für echte User-Verwaltung

**Was ist AWS Cognito?**
- Managed Authentication Service
- User Pools (User-Datenbank)
- Email-Verification, Password-Reset
- MFA (Multi-Factor Authentication)
- Social Login (Google, Facebook, etc.)

**Amplify Gen2 Integration:**
- Amplify hat Cognito bereits integriert
- Terraform erstellt Cognito User Pool
- Frontend nutzt Amplify Auth UI Components
- Backend validiert Cognito JWT

**Was zu implementieren:**

1. **Cognito User Pools (Terraform)**
   ```hcl
   # Für Kunden (Customer Frontend)
   resource "aws_cognito_user_pool" "customers" {
     name = "ecokart-customers"

     password_policy {
       minimum_length    = 8
       require_uppercase = true
       require_numbers   = true
     }

     auto_verified_attributes = ["email"]
   }

   # Für Admins (Admin Frontend)
   resource "aws_cognito_user_pool" "admins" {
     name = "ecokart-admins"
     # ... strengere Policies
   }
   ```

2. **Lambda Authorizer (API Gateway)**
   - Validiert Cognito JWT Token
   - Ersetzt aktuelles JWT-System
   - Zugriff auf User-Informationen

3. **Frontend-Integration**
   - Amplify UI Components für Login/Register
   - `useAuthenticator()` Hook
   - Token automatisch in API-Calls

4. **Backend-Anpassungen**
   - User-ID aus Cognito statt aus eigenem JWT
   - User-Management entfernen (Cognito übernimmt)
   - Orders/Carts mit Cognito-User-ID verknüpfen

**Vorteile:**
- ✅ Email-Verification automatisch
- ✅ Password-Reset automatisch
- ✅ Sichere Token-Verwaltung
- ✅ Skalierbar (bis 50.000 MAU kostenlos)
- ✅ MFA-Ready

**Terraform-Struktur:**
```
terraform/
├── modules/
│   ├── cognito/                    ← NEU
│   │   ├── main.tf                ← User Pools
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── lambda-authorizer/          ← NEU
│   │   └── main.tf                ← JWT Validation
│   └── ...
```

**Geschätzte Zeit:** 2-3 Stunden
**Komplexität:** Mittel-Hoch (viele Moving Parts)
**Zusätzliche Kosten:** Free Tier (50.000 MAU kostenlos)

---

## 🚦 Empfohlene Reihenfolge

### Session 2 (Nächstes Mal):
**Admin-Frontend deployen**
- Klarer Scope
- Nutzt bestehendes System
- Schneller Erfolg
- Gut testbar

### Session 3 (Danach):
**Cognito Authentication**
- Fokussierte Session
- Mehr Zeit für Testing
- Kann auf beide Frontends angewendet werden

**Warum getrennt?**
- Token-Limit-Management
- Klare Milestones
- Einfacheres Debugging
- Bessere Dokumentation pro Feature

---

## 📝 Offene Fragen für nächste Session

**Admin-Frontend:**
1. Soll Admin-Frontend auch Basic Auth haben? (Empfehlung: Ja)
2. Separate Domain gewünscht? (z.B. `admin.ecokart.com`)
3. Welche Admin-User sollen initial angelegt werden?

**Cognito:**
1. Email-Provider für Verification (SES oder Default?)
2. Social Login gewünscht? (Google/Facebook)
3. MFA pflicht für Admins?
4. Custom Domain für Cognito Hosted UI?

---

## 🔧 Vorbereitung für nächste Session

**Nichts zu tun!** Alle Voraussetzungen sind bereits da:

- ✅ admin-frontend/ Code vorhanden
- ✅ admin-backend/ Code vorhanden
- ✅ Terraform-Struktur etabliert
- ✅ AWS SSO funktioniert
- ✅ GitHub Token gültig

**Einfach starten mit:**
```bash
aws sso login --profile Teilnehmer-729403197965
cd terraform/examples/basic
```

---

## 📚 Relevante Dokumentation

**Für Admin-Frontend:**
- [Amplify Monorepo Docs](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)
- Bestehende Amplify-Module als Vorlage

**Für Cognito:**
- [AWS Cognito Terraform Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool)
- [Amplify Auth Docs](https://docs.amplify.aws/react/build-a-backend/auth/)
- [Lambda Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)

---

## 💾 Backup-Status

**Aktueller Terraform-State:**
- Gesichert in: `terraform/examples/basic/terraform.tfstate`
- Reproduzierbar via: `terraform apply`

**DynamoDB-Daten:**
- Migration-Script: `backend/scripts/migrate-to-dynamodb-single.js`
- Testuser-Script: `backend/scripts/create-test-user.js`

**GitHub Repository:**
- Alle Änderungen committed
- Branch: `main`
- Letzter Commit: Terraform-Dokumentation

---

**Zusammenfassung:**
- 🎉 Heute: Komplette Infrastruktur deployed & dokumentiert
- 📋 Nächstes Mal: Admin-Frontend deployen (Feature 1)
- 🔐 Danach: Cognito Integration (Feature 2)

**Bis zur nächsten Session!** 🚀
