# 🌍 Ecokart - Multi-Environment Configurations

Dieses Verzeichnis enthält die **environment-spezifischen Terraform-Konfigurationen** für dein Ecokart-Projekt.

---

## 📂 Dateien & Zweck

| Datei | Environment | Branch | Zweck | AWS Kosten/Monat |
|-------|-------------|--------|-------|------------------|
| `development.tfvars` | Development | `develop` | Experimentieren & Features entwickeln | ~20-30 EUR |
| `staging.tfvars` | Staging | `staging` | Finale Tests vor Production | ~40-60 EUR |
| `production.tfvars` | Production | `main` | Echte Kunden, Live-Shop | ~100-150 EUR |

---

## 🎯 Wie funktioniert das?

### Automatisch via GitHub Actions (empfohlen!)

**Du machst:**
```bash
# Auf develop Branch arbeiten
git checkout develop
git add .
git commit -m "Neues Feature: User Profile"
git push origin develop
```

**GitHub Actions macht automatisch:**
1. ✅ Erkennt: "Ah, das ist der `develop` Branch!"
2. ✅ Lädt: `terraform/environments/development.tfvars`
3. ✅ Deployed: Mit Development-Einstellungen (klein, günstig)

**Gleiches Prinzip für alle Branches:**
- Push zu `develop` → nutzt `development.tfvars`
- Push zu `staging` → nutzt `staging.tfvars`
- Push zu `main` → nutzt `production.tfvars`

---

### Manuell (lokal testen)

Falls du lokal testen willst (ohne GitHub Actions):

```bash
# 1. In Terraform-Verzeichnis wechseln
cd terraform/examples/basic

# 2. Terraform initialisieren
terraform init

# 3. Deployment mit spezifischer Environment-Config
terraform plan -var-file="../../environments/development.tfvars" \
               -var="jwt_secret=dein-super-secret-mindestens-32-zeichen" \
               -var="github_access_token=ghp_deinGitHubToken"

# 4. Apply (wenn Plan OK aussieht)
terraform apply -var-file="../../environments/development.tfvars" \
                -var="jwt_secret=dein-super-secret" \
                -var="github_access_token=ghp_token"
```

**Wichtig:** `jwt_secret` und `github_access_token` können NICHT in `.tfvars` stehen (sind Secrets!). Die kommen entweder:
- ✅ Via GitHub Actions Secrets
- ✅ Via AWS Parameter Store (wie aktuell)
- ✅ Via CLI-Parameter (wie oben)

---

## 📊 Environment-Vergleich

### Development (Kleinwagen 🚗)
- **Lambda:** 256 MB (günstig, langsamer)
- **DynamoDB:** PAY_PER_REQUEST (zahlst nur bei Nutzung)
- **Backups:** AUS (Daten nicht kritisch)
- **Logging:** Minimal (weniger Kosten)
- **Passwörter:** Schwach OK (dev/dev1234)

**Für:** Schnelles Entwickeln, Features ausprobieren, kaputt machen erlaubt!

---

### Staging (Mittelklasse 🚙)
- **Lambda:** 512 MB (wie Production)
- **DynamoDB:** PROVISIONED mit 3/3 Capacity
- **Backups:** AN (Production-Test!)
- **Logging:** Voll aktiviert
- **Passwörter:** Mittel-stark

**Für:** Finale Tests VOR Production, QA-Team, Pre-Launch Testing

---

### Production (Ferrari 🏎️)
- **Lambda:** 1024 MB (volle Power!)
- **DynamoDB:** PROVISIONED mit 10/10 Capacity
- **Backups:** AN (PFLICHT!)
- **Logging:** Voll aktiviert + später: Alarms
- **Passwörter:** SEHR stark (bitte ändern!)

**Für:** Echte Kunden, echtes Geld, maximale Zuverlässigkeit

---

## 🔄 Workflow: Feature-Entwicklung

Hier siehst du, wie ein typischer Feature-Development-Flow aussieht:

```
1. Feature entwickeln in Development
   ├─ Branch: develop
   ├─ Config: development.tfvars
   ├─ Push → Auto-Deploy zu Development Environment
   └─ Testen, kaputt machen, fixen, repeat...

2. Feature ist fertig → Merge zu Staging
   ├─ Pull Request: develop → staging
   ├─ Config: staging.tfvars
   ├─ Merge → Auto-Deploy zu Staging Environment
   └─ QA-Tests, finale Prüfung

3. Alles OK in Staging → Merge zu Production
   ├─ Pull Request: staging → main
   ├─ Config: production.tfvars
   ├─ Merge → Auto-Deploy zu Production Environment
   └─ LIVE für echte Kunden! 🎉
```

**WICHTIG:** Niemals direkt von `develop` zu `main`! Immer über `staging`!

---

## ⚙️ Config-Werte anpassen

### Wann solltest du die Configs ändern?

**Development:**
- ✅ Fast nie! Ist bewusst klein & günstig gehalten

**Staging:**
- ✅ Wenn du Production-ähnlichere Tests brauchst
- ✅ Z.B. DynamoDB Capacity erhöhen für Load-Tests

**Production:**
- ✅ Bei mehr Traffic: `dynamodb_read_capacity` erhöhen
- ✅ Bei langsamen Responses: `lambda_memory_size` erhöhen
- ✅ Bei neuen Features: Neue Variablen hinzufügen

### Wie ändern?

```bash
# 1. Datei bearbeiten
vim terraform/environments/production.tfvars

# 2. Wert ändern (z.B. Lambda Memory)
lambda_memory_size = 2048  # Vorher: 1024

# 3. Commit & Push
git add terraform/environments/production.tfvars
git commit -m "Increase production lambda memory to 2048 MB"
git push origin main

# 4. GitHub Actions deployed automatisch mit neuen Werten! 🚀
```

---

## 🔐 Secrets Management

**Was NICHT in `.tfvars` Dateien gehört:**
- ❌ `jwt_secret` (wird in GitHub Actions generiert)
- ❌ `github_access_token` (steht in AWS Parameter Store)
- ❌ Passwörter (später via AWS Secrets Manager)
- ❌ API Keys (später via AWS Secrets Manager)

**Was IN `.tfvars` Dateien gehört:**
- ✅ Environment-Name
- ✅ Lambda/DynamoDB Sizes
- ✅ Feature Flags (true/false)
- ✅ Branch-Namen
- ✅ Tags

---

## 📚 Nächste Schritte

Nach Multi-Environment Setup kommen laut Roadmap:

1. **AWS Cognito** → Dann `enable_cognito = true` in Configs
2. **Stripe Payment** → Dann `stripe_publishable_key` in Configs
3. **Email (SES)** → Dann `ses_from_email` in Configs
4. **Monitoring** → Dann `enable_cloudwatch_alarms = true`

Jedes neue Feature bekommt seine eigenen Config-Variablen!

---

## 🆘 Troubleshooting

### Problem: "Variable not defined"

**Fehler:**
```
Error: Variable not defined: enable_cognito
```

**Lösung:**
- Du versuchst eine Variable zu nutzen die noch nicht in `variables.tf` definiert ist
- Entweder: Variable in `terraform/variables.tf` hinzufügen
- Oder: Aus `.tfvars` Datei entfernen

---

### Problem: Deployment geht in falsches Environment

**Symptom:**
```
Development code deployed to Production! 😱
```

**Lösung:**
- Check: Bist du auf dem richtigen Branch? (`git branch`)
- Check: GitHub Actions Workflow Log → welche `.tfvars` wurde geladen?
- Check: Environment Variable in Workflow richtig gesetzt?

---

### Problem: Kosten zu hoch

**Lösung:**
```bash
# 1. Check welche Resources am meisten kosten
# → AWS Cost Explorer anschauen

# 2. In production.tfvars reduzieren:
lambda_memory_size = 512  # Statt 1024
dynamodb_read_capacity = 5  # Statt 10

# 3. Oder: DynamoDB auf PAY_PER_REQUEST umstellen (bei wenig Traffic günstiger)
dynamodb_billing_mode = "PAY_PER_REQUEST"
```

---

**Erstellt:** 19. November 2025
**Für:** Andy's Portfolio-Projekt
**Roadmap:** Von Demo zu Production-Ready E-Commerce Platform 🚀
