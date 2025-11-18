# 🚀 GitHub Actions OIDC Setup - Step-by-Step Anleitung

## 🎯 Was du erreichen wirst

Nach dieser Anleitung hast du:
- ✅ 100% automatisiertes Deployment
- ✅ Kein manueller Klick in AWS Console mehr nötig
- ✅ Push to Branch → Automatisch deployed
- ✅ Sichere OIDC Authentifizierung (keine AWS Keys in GitHub!)

---

## 📋 Voraussetzungen

Bevor du startest, stelle sicher dass du hast:
- ✅ AWS CLI installiert und konfiguriert (`aws sso login`)
- ✅ Terraform installiert (v1.5+)
- ✅ GitHub Personal Access Token (wird gleich erstellt)
- ✅ Admin-Zugriff auf dein GitHub Repository
- ✅ AWS Berechtigungen für IAM (OIDC Provider + Roles erstellen)

---

## 🎬 Schritt-für-Schritt Anleitung

### 📍 **Schritt 1: AWS Login**

Öffne dein **Terminal auf dem Mac** und logge dich bei AWS ein:

```bash
# AWS SSO Login
aws sso login

# Verifiziere dass du eingeloggt bist
aws sts get-caller-identity
```

**Erwartete Ausgabe:**
```json
{
    "UserId": "AROA...",
    "Account": "729403197965",
    "Arn": "arn:aws:sts::729403197965:assumed-role/..."
}
```

✅ **Wenn das klappt, weiter zu Schritt 2!**

---

### 📍 **Schritt 2: GitHub OIDC Provider in AWS erstellen**

Jetzt erstellst du die AWS-Infrastruktur für GitHub Actions.

```bash
# Navigiere zum OIDC Setup Ordner
cd terraform/github-actions-setup

# Terraform initialisieren
terraform init

# Prüfe was erstellt wird (WICHTIG: Lies das durch!)
terraform plan

# Wenn alles gut aussieht, erstelle die Infrastruktur
terraform apply
```

**Was passiert hier?**
- 🔐 GitHub OIDC Provider wird in AWS IAM erstellt
- 👤 IAM Role `ecokart-github-actions-role` wird erstellt
- 📜 7 IAM Policies werden erstellt und angehängt (DynamoDB, Lambda, Amplify, etc.)

**Terraform fragt:** `Do you want to perform these actions?`
→ **Tippe:** `yes` und drücke Enter

⏱️ **Dauer:** ~30 Sekunden

**Erwartete Ausgabe am Ende:**
```
Apply complete! Resources: 15 added, 0 changed, 0 destroyed.

Outputs:

github_actions_role_arn = "arn:aws:iam::729403197965:role/ecokart-github-actions-role"
next_steps = <<EOT

  ✅ OIDC Setup erfolgreich!
  ...
EOT
```

🎉 **WICHTIG:** Kopiere die `github_actions_role_arn` - die brauchst du gleich!

✅ **Weiter zu Schritt 3!**

---

### 📍 **Schritt 3: GitHub Personal Access Token erstellen**

Jetzt erstellst du einen Token, damit Amplify auf dein GitHub Repo zugreifen kann.

**3.1 Gehe zu GitHub:**
https://github.com/settings/tokens/new

**3.2 Konfiguriere den Token:**
- **Note:** `Ecokart Amplify Deployment`
- **Expiration:** `No expiration` (oder 90 days wenn du es regelmäßig erneuern willst)
- **Select scopes:** ✅ Hake an:
  - `repo` (Full control of private repositories)
    - repo:status
    - repo_deployment
    - public_repo

**3.3 Klicke:** `Generate token`

**3.4 Kopiere den Token!** (Sieht aus wie: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **WICHTIG:** Du siehst diesen Token nur EINMAL! Kopiere ihn jetzt!

✅ **Token kopiert? Weiter zu Schritt 4!**

---

### 📍 **Schritt 4: GitHub Token in AWS Parameter Store speichern**

Jetzt speicherst du den GitHub Token sicher in AWS.

```bash
# Ersetze ghp_YOUR_TOKEN_HERE mit deinem echten Token!
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --region eu-north-1
```

**Erwartete Ausgabe:**
```json
{
    "Version": 1,
    "Tier": "Standard"
}
```

**Teste ob es funktioniert:**
```bash
aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1
```

**Erwartete Ausgabe:** Dein GitHub Token wird angezeigt

✅ **Token gespeichert? Weiter zu Schritt 5!**

---

### 📍 **Schritt 5: GitHub Secret für AWS Role ARN hinzufügen**

Jetzt sagst du GitHub, welche AWS Role es nutzen soll.

**5.1 Gehe zu GitHub Repository Settings:**
https://github.com/AndySchlegel/Ecokart-Webshop/settings/secrets/actions

**5.2 Klicke:** `New repository secret`

**5.3 Fülle aus:**
- **Name:** `AWS_ROLE_ARN`
- **Secret:** (Füge die ARN aus Schritt 2 ein)
  ```
  arn:aws:iam::729403197965:role/ecokart-github-actions-role
  ```

**5.4 Klicke:** `Add secret`

✅ **Secret hinzugefügt? Weiter zu Schritt 6!**

---

### 📍 **Schritt 6: GitHub Actions Workflow committen und pushen**

Jetzt pushen wir die neuen Dateien zu GitHub!

```bash
# Zurück zum Repository Root
cd /path/to/Ecokart-Webshop

# Prüfe welche neuen Dateien erstellt wurden
git status

# Füge alle neuen Dateien hinzu
git add terraform/github-actions-setup/
git add .github/workflows/deploy.yml

# Commit
git commit -m "Add GitHub Actions OIDC setup for automated deployment"

# Push zu main Branch
git push origin main
```

✅ **Gepusht? Weiter zu Schritt 7!**

---

### 📍 **Schritt 7: Ersten automatischen Deployment testen! 🎉**

Jetzt kommt der Moment der Wahrheit!

**7.1 Gehe zu GitHub Actions:**
https://github.com/AndySchlegel/Ecokart-Webshop/actions

**7.2 Du solltest sehen:**
- ✅ Ein neuer Workflow: `Deploy Ecokart Infrastructure`
- ✅ Der Workflow läuft bereits (wegen dem Push in Schritt 6!)

**7.3 Klicke auf den laufenden Workflow** und beobachte die Logs

**7.4 Was du sehen solltest:**
```
📥 Checkout Repository
🎯 Determine Environment
🔐 Configure AWS Credentials (OIDC)
✅ Verify AWS Authentication
🏗️ Setup Terraform
📦 Setup Node.js
🔑 Get GitHub Token from Parameter Store
🔧 Terraform Init
📋 Terraform Plan
🚀 Terraform Apply
📊 Deployment Summary
```

⏱️ **Dauer:** ~8-10 Minuten für erstes Deployment

**7.5 Wenn alles durchgelaufen ist:**
- ✅ Alle Steps sind grün ✓
- ✅ Du siehst eine Summary mit den URLs
- ✅ Deine Infrastruktur ist deployed!

---

### 📍 **Schritt 8: Deployment testen**

Öffne die URLs aus der GitHub Actions Summary:

```bash
# Oder hol sie dir via Terraform
cd terraform/examples/basic
terraform output
```

**Teste:**
- 🌐 **Customer Frontend:** Öffne URL im Browser
- 🔐 **Basic Auth:** demo / test1234
- 👤 **Login:** testuser@example.com / SecurePass123!
- 🛒 **Add to Cart:** Funktioniert?

✅ **Alles funktioniert? GLÜCKWUNSCH! 🎉**

---

## 🎯 Wie geht es jetzt weiter?

### Automatisches Deployment bei jedem Push

Ab jetzt wird **automatisch** deployed wenn du pushst zu:
- `main` Branch → Production
- `staging` Branch → Staging Environment
- `develop` Branch → Development Environment

**Workflow:**
```bash
# Feature entwickeln
git checkout -b feature/new-feature
# ... Code schreiben ...
git commit -m "Add new feature"

# Merge zu develop
git checkout develop
git merge feature/new-feature
git push origin develop

# 🚀 GitHub Actions deployed automatisch!
```

### Manuelles Deployment

Du kannst auch manuell deployen:

**Gehe zu:**
https://github.com/AndySchlegel/Ecokart-Webshop/actions/workflows/deploy.yml

**Klicke:** `Run workflow`

**Wähle:**
- Environment: `development` / `staging` / `production`
- Destroy: `false` (für Deployment) oder `true` (für Destroy)

**Klicke:** `Run workflow`

---

## 🚨 Troubleshooting

### Problem: "Error assuming role"

**Ursache:** GitHub Actions kann die AWS Role nicht annehmen

**Lösung:**
```bash
# Prüfe ob OIDC Provider existiert
aws iam list-open-id-connect-providers

# Prüfe ob Role existiert
aws iam get-role --role-name ecokart-github-actions-role

# Falls nicht: Nochmal Schritt 2 ausführen
cd terraform/github-actions-setup
terraform apply
```

### Problem: "GitHub token not found in Parameter Store"

**Ursache:** GitHub Token wurde nicht korrekt gespeichert

**Lösung:**
```bash
# Prüfe ob Parameter existiert
aws ssm get-parameter --name "/ecokart/github-token" --region eu-north-1

# Falls nicht gefunden: Nochmal Schritt 4 ausführen
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --region eu-north-1
```

### Problem: "Terraform state locked"

**Ursache:** Ein vorheriger Terraform-Lauf wurde abgebrochen

**Lösung:**
```bash
# State unlock (NUR wenn du sicher bist, dass kein anderer Terraform läuft!)
cd terraform/examples/basic
terraform force-unlock <LOCK_ID>
```

### Problem: Workflow läuft nicht bei Push

**Ursache:** Workflow-Datei ist nicht im main Branch

**Lösung:**
```bash
# Stelle sicher, dass deploy.yml im main Branch ist
git checkout main
ls -la .github/workflows/deploy.yml

# Falls nicht vorhanden:
git add .github/workflows/deploy.yml
git commit -m "Add deployment workflow"
git push origin main
```

---

## 📊 Kosten

Diese Lösung verursacht **KEINE zusätzlichen Kosten**!

- ✅ GitHub Actions: Free Tier (2000 Minuten/Monat für private Repos)
- ✅ AWS OIDC Provider: **0€**
- ✅ IAM Roles & Policies: **0€**
- ✅ Parameter Store: **0€** (bis 10,000 Parameter)

**Nur die normalen AWS Kosten für:**
- Lambda, DynamoDB, API Gateway, Amplify (wie bisher)

---

## 🎓 Was du gelernt hast

- ✅ AWS IAM OIDC Provider Setup
- ✅ GitHub Actions Workflows
- ✅ Sichere Credential-Verwaltung (OIDC statt Access Keys!)
- ✅ Infrastructure as Code (Terraform)
- ✅ CI/CD Best Practices

---

## 🚀 Nächste Schritte

Jetzt, wo das Deployment automatisiert ist, kannst du:
1. 🎯 **Roadmap Phase 1 starten** (Branching Strategy)
2. 🔐 **Cognito Integration** (OAuth, MFA)
3. 💳 **Stripe Payment** implementieren
4. 📧 **Email Notifications** (SES) einrichten

---

## 📞 Support

Bei Fragen oder Problemen:
- 📖 Lies die Terraform Outputs: `terraform output`
- 🔍 Prüfe GitHub Actions Logs
- 🐛 Check AWS CloudWatch Logs

---

**🎉 Viel Erfolg! Du schaffst das!**
