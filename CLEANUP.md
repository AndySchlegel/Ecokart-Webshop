# 🗑️ Ecokart - Komplette Cleanup Anleitung

**Datum:** 20.11.2025
**Zweck:** Alle AWS Ressourcen sauber löschen
**Warum:** Kosten sparen + frischer Start für morgen

---

## ⚠️ WICHTIG: Reihenfolge beachten!

**Die Reihenfolge ist wichtig, um Fehler zu vermeiden!**

1. ✅ Frontend Amplify App (optional)
2. ✅ Lambda Function + API Gateway (via GitHub Actions)
3. ✅ DynamoDB Tables (via GitHub Actions)
4. ❌ Cognito User Pools (MANUELL - wird NICHT automatisch gelöscht!)
5. ❌ CloudWatch Logs (optional - löschen sich automatisch nach 30 Tagen)
6. ❌ IAM Roles (werden von destroy.yml gelöscht)

---

## 🚀 Option 1: GitHub Actions Destroy Workflow (EMPFOHLEN)

### Was wird automatisch gelöscht?

Die `.github/workflows/destroy.yml` löscht:

- ✅ **DynamoDB Tables** (4x: products, users, carts, orders)
- ✅ **Lambda Function** (ecokart-development-api)
- ✅ **API Gateway** (ecokart-development-api-gateway)
- ✅ **IAM Roles** (für Lambda)
- ✅ **CloudWatch Log Groups**

### Was wird NICHT automatisch gelöscht?

- ❌ **Cognito User Pools** (11x!) → **MUSS MANUELL GELÖSCHT WERDEN!**
- ❌ **API Gateway Authorizers** (2x) → Werden mit API Gateway gelöscht

### Wie starte ich das Destroy Workflow?

1. Öffne GitHub: https://github.com/AndySchlegel/Ecokart-Webshop
2. Gehe zu **Actions** Tab
3. Wähle Workflow: **"Destroy Infrastructure"**
4. Klicke **"Run workflow"**
5. Wähle Branch: `develop` oder `main`
6. Klicke **"Run workflow"** (grüner Button)

**Dauer:** Ca. 2-3 Minuten

### Logs überprüfen

Nach dem Destroy Workflow:

```bash
# In den Workflow-Logs solltest du sehen:
✅ DynamoDB table 'ecokart-development-products' deleted
✅ DynamoDB table 'ecokart-development-users' deleted
✅ DynamoDB table 'ecokart-development-carts' deleted
✅ DynamoDB table 'ecokart-development-orders' deleted
✅ Lambda function 'ecokart-development-api' deleted
✅ API Gateway 'ecokart-development-api-gateway' deleted
✅ IAM roles deleted
✅ CloudWatch logs deleted
```

---

## 🧹 Option 2: Manuelle Cleanup (Falls GitHub Actions fehlschlägt)

### 1. Cognito User Pools löschen

**WICHTIG:** 11 User Pools müssen manuell gelöscht werden!

#### Aktiv genutzt (NICHT löschen wenn du testen willst):
```
User Pool ID: eu-north-1_byzwQwYQv
Client ID:    3uf7e7qlpr37t4sug63r6otnor
Region:       eu-north-1
```

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/cognito/v2/idp/user-pools
   - Region: **eu-north-1** (Stockholm)

2. **Alle User Pools löschen:**
   ```
   Für jeden User Pool:
   - Haken setzen neben "ecokart-development-users"
   - Klicke "Delete"
   - Tippe "delete" zur Bestätigung
   - Klicke "Delete"
   ```

3. **Liste der zu löschenden User Pools:**
   - `eu-north-1_byzwQwYQv` (der aktive - NUR löschen wenn wirklich alles weg soll!)
   - `eu-north-1_...` (10 weitere User Pools mit gleichem Namen)

**Dauer pro Pool:** Ca. 30 Sekunden
**Gesamt:** Ca. 5-6 Minuten

---

### 2. API Gateway löschen

**WICHTIG:** 3 API Gateways existieren!

#### Aktiv genutzt (Falls GitHub Actions nicht löscht):
```
API Gateway ID:   gyvnxackub
Name:             ecokart-development-api-gateway
Region:           eu-north-1
API URL:          https://gyvnxackub.execute-api.eu-north-1.amazonaws.com/Prod/
```

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/apigateway/main/apis
   - Region: **eu-north-1**

2. **API Gateway löschen:**
   ```
   Für jedes API Gateway mit Namen "ecokart-development-api-gateway":
   - Klicke auf den Namen
   - Klicke "Actions" → "Delete"
   - Bestätige mit dem Namen
   - Klicke "Delete"
   ```

**Hinweis:** API Gateway Authorizers werden automatisch mit dem Gateway gelöscht!

---

### 3. DynamoDB Tables löschen

**Normalerweise macht das GitHub Actions!**
Falls das Workflow fehlschlägt:

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/dynamodbv2/home?region=eu-north-1#tables
   - Region: **eu-north-1**

2. **Jede Tabelle löschen:**
   ```
   Zu löschende Tabellen:
   - ecokart-development-products
   - ecokart-development-users
   - ecokart-development-carts
   - ecokart-development-orders

   Für jede Tabelle:
   - Haken setzen
   - Klicke "Delete"
   - Checkbox "Create backup before deleting" DEAKTIVIEREN
   - Tippe "delete" zur Bestätigung
   - Klicke "Delete table"
   ```

**Dauer:** Ca. 2-3 Minuten für alle Tabellen

---

### 4. Lambda Functions löschen

**Normalerweise macht das GitHub Actions!**
Falls das Workflow fehlschlägt:

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/lambda/home?region=eu-north-1#/functions
   - Region: **eu-north-1**

2. **Lambda Function löschen:**
   ```
   Function Name: ecokart-development-api

   - Haken setzen
   - Klicke "Actions" → "Delete"
   - Bestätige mit dem Namen
   - Klicke "Delete"
   ```

---

### 5. IAM Roles löschen

**Normalerweise macht das GitHub Actions!**
Falls das Workflow fehlschlägt:

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://console.aws.amazon.com/iam/home#/roles
   - Region: **Global** (IAM ist nicht region-spezifisch)

2. **Ecokart Roles löschen:**
   ```
   Nach "ecokart" filtern und löschen:
   - ecokart-development-lambda-role
   - ecokart-development-api-role (falls vorhanden)

   Für jede Role:
   - Haken setzen
   - Klicke "Delete"
   - Bestätige mit dem Namen
   - Klicke "Delete"
   ```

---

### 6. CloudWatch Logs löschen (Optional)

**Das ist optional - Logs löschen sich automatisch nach 30 Tagen!**

Falls du sie trotzdem löschen willst:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/cloudwatch/home?region=eu-north-1#logsV2:log-groups
   - Region: **eu-north-1**

2. **Log Groups löschen:**
   ```
   Nach "/aws/lambda/ecokart" filtern und löschen:
   - /aws/lambda/ecokart-development-api

   Für jede Log Group:
   - Haken setzen
   - Klicke "Actions" → "Delete log group(s)"
   - Bestätige mit "Delete"
   ```

---

### 7. Amplify App löschen (Optional)

**NUR löschen wenn du das Frontend komplett neu aufsetzen willst!**

#### Aktiv genutzt:
```
App Name:     ecokart-webshop
Branch:       develop
URL:          https://develop.d1a8ydu4opo4tv.amplifyapp.com
Region:       eu-north-1
```

#### Schritte zum Löschen:

1. **AWS Console öffnen:**
   - https://eu-north-1.console.aws.amazon.com/amplify/home?region=eu-north-1#/
   - Region: **eu-north-1**

2. **App löschen:**
   ```
   - Klicke auf "ecokart-webshop"
   - Klicke "Actions" → "Delete app"
   - Tippe "delete" zur Bestätigung
   - Klicke "Delete"
   ```

**ACHTUNG:** Das löscht auch die Environment Variables (Cognito Config)!

---

## ✅ Verifizierung: Ist alles gelöscht?

### Checkliste nach Cleanup:

1. **Cognito User Pools:**
   - https://eu-north-1.console.aws.amazon.com/cognito/v2/idp/user-pools
   - ✅ Keine User Pools mit "ecokart" im Namen

2. **API Gateway:**
   - https://eu-north-1.console.aws.amazon.com/apigateway/main/apis
   - ✅ Keine APIs mit "ecokart" im Namen

3. **DynamoDB:**
   - https://eu-north-1.console.aws.amazon.com/dynamodbv2/home#tables
   - ✅ Keine Tabellen mit "ecokart-development" im Namen

4. **Lambda:**
   - https://eu-north-1.console.aws.amazon.com/lambda/home#/functions
   - ✅ Keine Functions mit "ecokart" im Namen

5. **IAM Roles:**
   - https://console.aws.amazon.com/iam/home#/roles
   - ✅ Keine Roles mit "ecokart" im Namen (nach "ecokart" filtern)

6. **CloudWatch Logs:**
   - https://eu-north-1.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups
   - ✅ Keine Log Groups mit "/aws/lambda/ecokart" im Namen

---

## 🔧 Destroy Workflow verbessern

### Problem: Cognito wird nicht gelöscht

Die aktuelle `destroy.yml` löscht keine Cognito User Pools!

### Lösung: Erweitere destroy.yml

```yaml
# NACH DynamoDB Deletion (Zeile ~150):

- name: Delete Cognito User Pools
  run: |
    echo "🗑️ Deleting Cognito User Pools..."

    # Liste alle User Pools
    POOLS=$(aws cognito-idp list-user-pools --max-results 60 --region eu-north-1 --query "UserPools[?contains(Name, 'ecokart-development')].Id" --output text)

    if [ -z "$POOLS" ]; then
      echo "No Cognito User Pools found"
    else
      for POOL_ID in $POOLS; do
        echo "Deleting User Pool: $POOL_ID"
        aws cognito-idp delete-user-pool --user-pool-id "$POOL_ID" --region eu-north-1 || true
      done
      echo "✅ Cognito User Pools deleted"
    fi
  continue-on-error: true
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: eu-north-1
```

**Das fügt automatisches Löschen von Cognito User Pools hinzu!**

---

## 💡 Tipps für sauberes Destroy

### 1. Reihenfolge beachten

Immer in dieser Reihenfolge löschen:
1. Lambda Function (braucht API Gateway + DynamoDB)
2. API Gateway (braucht Lambda)
3. DynamoDB Tables
4. Cognito User Pools (keine Dependencies)
5. IAM Roles (werden zuletzt gelöscht)

### 2. GitHub Actions bevorzugen

- GitHub Actions Workflow ist SCHNELLER
- Weniger Fehleranfällig
- Automatische Logs

### 3. Manually cleanup nur wenn nötig

- Nur wenn GitHub Actions fehlschlägt
- Oder wenn du einzelne Ressourcen behalten willst

### 4. Kosten sparen

**Nach Destroy sollten KEINE AWS Kosten mehr anfallen!**

Außer:
- CloudWatch Logs (löschen sich automatisch nach 30 Tagen)
- S3 Buckets (falls vorhanden - aktuell keine)

---

## 🚀 Nächste Steps (für morgen)

Nach dem kompletten Cleanup:

### 1. Neues Setup mit Terraform

```bash
# Terraform initialisieren
cd terraform
terraform init

# Plan prüfen
terraform plan

# Deployen
terraform apply -auto-approve
```

**Vorteil:** Terraform erstellt UND löscht alle Ressourcen automatisch!

### 2. Destroy-Prozess testen

```bash
# Via GitHub Actions Destroy Workflow
# Danach manuell prüfen ob wirklich ALLES weg ist
```

### 3. Cart Auth fixen

- Backend JWT-Validierung implementieren
- ODER: Cart temporär ohne Auth (zum Testen)

---

## 📋 Quick Reference: Alle wichtigen Links

### AWS Console Links (eu-north-1)

```
Cognito:    https://eu-north-1.console.aws.amazon.com/cognito/v2/idp/user-pools
API GW:     https://eu-north-1.console.aws.amazon.com/apigateway/main/apis
DynamoDB:   https://eu-north-1.console.aws.amazon.com/dynamodbv2/home#tables
Lambda:     https://eu-north-1.console.aws.amazon.com/lambda/home#/functions
IAM:        https://console.aws.amazon.com/iam/home#/roles
CloudWatch: https://eu-north-1.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups
Amplify:    https://eu-north-1.console.aws.amazon.com/amplify/home#/
```

### GitHub

```
Repo:       https://github.com/AndySchlegel/Ecokart-Webshop
Actions:    https://github.com/AndySchlegel/Ecokart-Webshop/actions
```

---

## 🆘 Troubleshooting

### Problem: "Table does not exist"

**Ursache:** Tabelle wurde bereits gelöscht
**Lösung:** Einfach ignorieren - ist OK!

### Problem: "User pool does not exist"

**Ursache:** User Pool wurde bereits gelöscht
**Lösung:** Einfach ignorieren - ist OK!

### Problem: "Access denied"

**Ursache:** IAM Permissions fehlen
**Lösung:** Prüfe ob AWS Credentials korrekt sind

### Problem: "Cannot delete Lambda - attached to API Gateway"

**Ursache:** API Gateway muss zuerst gelöscht werden
**Lösung:** API Gateway löschen, dann Lambda

---

## 📊 Geschätzte Cleanup-Dauer

| Methode | Dauer | Aufwand |
|---------|-------|---------|
| **GitHub Actions Destroy** | 2-3 Min | Niedrig |
| **+ Cognito manuell löschen** | 5-6 Min | Mittel |
| **Komplett manuell** | 15-20 Min | Hoch |

**Empfehlung:** GitHub Actions + manuelles Cognito Cleanup = 7-9 Minuten

---

## ✅ Fertig!

Nach dem Cleanup:

- ✅ Keine AWS Kosten mehr (außer evtl. CloudWatch Logs für max. 30 Tage)
- ✅ Sauberer Zustand für neues Setup
- ✅ Keine Konflikte mit alten Ressourcen
- ✅ Bereit für Terraform Deployment

**Viel Erfolg! 🚀**
