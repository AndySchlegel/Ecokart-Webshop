# ⚡ QUICKSTART: GitHub Actions Setup (5-10 Minuten)

## 🎯 Was passiert gleich?

Du wirst in wenigen Minuten ein **100% automatisiertes Deployment** haben!

**Keine manuellen Schritte in AWS Console mehr!** 🎉

---

## 📝 Checkliste (Abhaken während du arbeitest!)

- [ ] AWS SSO Login
- [ ] Terraform OIDC Setup ausführen
- [ ] GitHub Personal Access Token erstellen
- [ ] Token in AWS Parameter Store speichern
- [ ] GitHub Secret hinzufügen
- [ ] Code committen und pushen
- [ ] Ersten automatischen Deployment beobachten

---

## 🚀 LOS GEHT'S!

### ✅ Schritt 1: AWS Login (30 Sekunden)

```bash
# Terminal öffnen
aws sso login

# Verifizieren
aws sts get-caller-identity
```

**Erwarte:** Deine Account ID `729403197965` wird angezeigt

---

### ✅ Schritt 2: OIDC Setup (2 Minuten)

```bash
# Navigiere zum Setup
cd ~/Cloudhelden-Weiterbildung/Repositories/Ecokart\ Webshop/terraform/github-actions-setup

# Terraform ausführen
terraform init
terraform apply
```

**Bei "Do you want to perform these actions?"** → Tippe `yes`

**⏱️ Warte ~30 Sekunden...**

**WICHTIG:** Kopiere die Ausgabe:
```
github_actions_role_arn = "arn:aws:iam::729403197965:role/ecokart-github-actions-role"
```

---

### ✅ Schritt 3: GitHub Token erstellen (2 Minuten)

**Öffne im Browser:**
https://github.com/settings/tokens/new

**Einstellungen:**
- Note: `Ecokart Amplify Deployment`
- Expiration: `No expiration`
- Scope: ✅ `repo` (Full control)

**Klicke:** `Generate token`

**Kopiere den Token:** `ghp_xxxxxxxxxxxxx`

---

### ✅ Schritt 4: Token in AWS speichern (30 Sekunden)

```bash
# WICHTIG: Ersetze ghp_YOUR_TOKEN mit deinem echten Token!
aws ssm put-parameter \
  --name "/ecokart/github-token" \
  --value "ghp_YOUR_TOKEN_HERE" \
  --type "SecureString" \
  --region eu-north-1
```

**Teste:**
```bash
aws ssm get-parameter \
  --name "/ecokart/github-token" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text \
  --region eu-north-1
```

**Erwarte:** Dein Token wird angezeigt

---

### ✅ Schritt 5: GitHub Secret (1 Minute)

**Öffne im Browser:**
https://github.com/AndySchlegel/Ecokart-Webshop/settings/secrets/actions

**Klicke:** `New repository secret`

**Fülle aus:**
- Name: `AWS_ROLE_ARN`
- Secret: `arn:aws:iam::729403197965:role/ecokart-github-actions-role`

**Klicke:** `Add secret`

---

### ✅ Schritt 6: Code committen (1 Minute)

```bash
# Zurück zum Repository Root
cd ~/Cloudhelden-Weiterbildung/Repositories/Ecokart\ Webshop

# Status prüfen
git status

# Alles hinzufügen
git add .

# Commit
git commit -m "Add GitHub Actions OIDC setup for automated deployment

- Add Terraform OIDC module for GitHub Actions authentication
- Add automated deployment workflow
- Add detailed setup documentation
- Update .gitignore for Terraform files

This enables 100% automated deployment without manual AWS Console steps!"

# Push
git push origin claude/review-documentation-01Hi3Exv7MvFRzHEo57Edhek
```

---

### ✅ Schritt 7: Ersten Deployment beobachten! 🎉

**Öffne im Browser:**
https://github.com/AndySchlegel/Ecokart-Webshop/actions

**Du solltest sehen:**
- ✅ Workflow: `Deploy Ecokart Infrastructure`
- ✅ Status: Running... 🟡

**Klicke drauf und beobachte die Magie!** ✨

**Erwarte nach ~8-10 Minuten:**
- ✅ Alle Steps grün
- ✅ Summary mit URLs
- ✅ Deine App ist deployed!

---

## 🎉 GESCHAFFT!

Ab jetzt:
- Push zu `main` → Auto-Deploy zu Production
- Push zu `develop` → Auto-Deploy zu Development
- Push zu `staging` → Auto-Deploy zu Staging

**Kein manueller Klick mehr nötig!** 🚀

---

## 🆘 Probleme?

**Siehe:** `terraform/github-actions-setup/README.md` (Abschnitt Troubleshooting)

**Oder frag mich einfach!** 😊

---

## 📊 Was hast du gerade gebaut?

```
┌─────────────────────────────────────────────┐
│         GitHub Repository                   │
│  (Push Code)                                │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────┐
│         GitHub Actions                      │
│  (Workflow triggered)                       │
└───────────────┬─────────────────────────────┘
                │
                ↓ OIDC Authentication
┌─────────────────────────────────────────────┐
│         AWS IAM                             │
│  (Assume Role: ecokart-github-actions-role) │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────┐
│         Terraform                           │
│  (Deploy Infrastructure)                    │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────┐
│         AWS Services                        │
│  - Lambda                                   │
│  - DynamoDB                                 │
│  - API Gateway                              │
│  - Amplify                                  │
└─────────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────┐
│         🎉 DEPLOYED!                        │
└─────────────────────────────────────────────┘
```

**100% Automatisch. Keine manuellen Schritte. Immer.** ✨
