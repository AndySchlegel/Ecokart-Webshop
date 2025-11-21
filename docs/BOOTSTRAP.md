# Bootstrap - 100% Reproduzierbares System

## Das Bootstrap-Problem

**Frage:** Wenn ALLES gelöscht ist (inkl. IAM Role), wie baut man das System neu auf?

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow (deploy.yml)                       │
│  ↓                                                           │
│  Benötigt: IAM Role für OIDC Authentifizierung             │
│  ↓                                                           │
│  Ohne IAM Role → Keine AWS Auth → Workflow kann nicht laufen│
│  ↓                                                           │
│  ❌ DEADLOCK: Workflow kann die Role nicht erstellen!       │
└─────────────────────────────────────────────────────────────┘
```

**Das ist das klassische "Henne-Ei-Problem" der Infrastructure-as-Code.**

## Die Lösung: Bootstrap-Workflow

Wir haben **2 separate Workflows** für unterschiedliche Szenarien:

### 1. Bootstrap (Einmalig / Disaster Recovery)

**Workflow:** `bootstrap-oidc.yml`
**Auth:** AWS Credentials (aus Secrets)
**Zweck:** Erstellt die CI/CD Grundinfrastruktur

**Erstellt:**
- ✅ GitHub OIDC Provider
- ✅ IAM Role für GitHub Actions
- ✅ 10 IAM Policies (inkl. Terraform Backend)

### 2. Deploy (Normal)

**Workflow:** `deploy.yml`
**Auth:** OIDC (verwendet die Role aus Bootstrap)
**Zweck:** Deployed die Anwendung

**Erstellt:**
- ✅ S3 Backend (idempotent)
- ✅ Terraform Infrastructure
- ✅ Anwendungs-Ressourcen

## Reproduzierbarkeit: 100% Neu Aufbau

### Szenario: Alles ist gelöscht

```bash
# ❌ Gelöscht:
- IAM Role für GitHub Actions
- OIDC Provider
- S3 Backend
- Alle Terraform Ressourcen (DynamoDB, Lambda, etc.)
```

### Wiederaufbau in 3 Schritten:

#### Schritt 1: Bootstrap AWS Credentials (einmalig)

**Erstelle einen IAM User für Bootstrap:**

```bash
# Via AWS Console oder AWS CLI
aws iam create-user --user-name ecokart-bootstrap-user

# Policy erstellen (minimale Berechtigungen für Bootstrap)
cat > bootstrap-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateOpenIDConnectProvider",
        "iam:GetOpenIDConnectProvider",
        "iam:ListOpenIDConnectProviders",
        "iam:DeleteOpenIDConnectProvider",
        "iam:CreateRole",
        "iam:GetRole",
        "iam:CreatePolicy",
        "iam:GetPolicy",
        "iam:AttachRolePolicy"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name ecokart-bootstrap-user \
  --policy-name BootstrapPolicy \
  --policy-document file://bootstrap-policy.json

# Access Keys erstellen
aws iam create-access-key --user-name ecokart-bootstrap-user
```

**Füge Credentials zu GitHub Secrets hinzu:**

1. Gehe zu: GitHub Repository → Settings → Secrets → Actions
2. Erstelle:
   - `AWS_BOOTSTRAP_ACCESS_KEY_ID` = Access Key ID
   - `AWS_BOOTSTRAP_SECRET_ACCESS_KEY` = Secret Access Key

#### Schritt 2: Bootstrap Workflow ausführen

1. Gehe zu: GitHub Actions → Workflows
2. Wähle: **"Bootstrap OIDC Infrastructure"**
3. Klicke: **"Run workflow"**
4. Gib ein: `bootstrap`
5. Klicke: **"Run workflow"**

**Was passiert:**
- ✅ GitHub OIDC Provider wird erstellt
- ✅ IAM Role `ecokart-github-actions-role` wird erstellt
- ✅ 10 Policies werden erstellt und attached
- ✅ Role ARN wird im Summary angezeigt

**Duration:** ~2-3 Minuten

#### Schritt 3: Role ARN zu Secrets hinzufügen

1. Kopiere die Role ARN aus dem Workflow Summary:
   ```
   arn:aws:iam::729403197965:role/ecokart-github-actions-role
   ```

2. Füge zu GitHub Secrets hinzu:
   - Name: `AWS_ROLE_ARN`
   - Value: `arn:aws:iam::729403197965:role/ecokart-github-actions-role`

#### Schritt 4: Deploy Workflow ausführen

1. Gehe zu: GitHub Actions → Workflows
2. Wähle: **"Deploy Ecokart Infrastructure"**
3. Klicke: **"Run workflow"**
4. Wähle Environment: `development`
5. Klicke: **"Run workflow"**

**Was passiert:**
- ✅ Authentifizierung mit OIDC (verwendet die Bootstrap-Role)
- ✅ S3 Backend wird erstellt (idempotent)
- ✅ Terraform deployed alle Ressourcen
- ✅ Anwendung ist live!

**Duration:** ~8-12 Minuten

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 0: Bootstrap (Einmalig / Disaster Recovery)          │
│  ─────────────────────────────────────────────────────────   │
│  Workflow: bootstrap-oidc.yml                               │
│  Auth: AWS Credentials (Secrets)                            │
│  Erstellt: OIDC Provider + IAM Role                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Deploy Infrastructure (Normal)                     │
│  ─────────────────────────────────────────────────────────   │
│  Workflow: deploy.yml                                        │
│  Auth: OIDC (verwendet Layer 0 Role)                        │
│  Erstellt: S3 Backend + Terraform State                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Application Resources (Managed by Terraform)       │
│  ─────────────────────────────────────────────────────────   │
│  - DynamoDB Tables                                           │
│  - Lambda Functions                                          │
│  - API Gateway                                               │
│  - Cognito User Pools                                        │
│  - Amplify Apps                                              │
└─────────────────────────────────────────────────────────────┘
```

## Warum 2 Workflows?

**Option A (was wir NICHT wollen):**
```
deploy.yml verwendet AWS Credentials aus Secrets
→ Alle Workflows benötigen AWS Keys
→ Sicherheitsrisiko!
→ Keys müssen rotiert werden
→ Compliance-Problem
```

**Option B (was wir haben):**
```
bootstrap-oidc.yml: AWS Credentials (nur für Bootstrap)
deploy.yml: OIDC (keine Keys!)
→ Nur Bootstrap braucht Keys
→ Deploy ist keyless (sicherer!)
→ OIDC ist Best Practice
```

## Maintenance Workflows

### Normale Deployments

**Verwendung:** `deploy.yml` (OIDC)
**Häufigkeit:** Täglich/Wöchentlich
**Auth:** OIDC (keine Keys)

### Bootstrap Refresh

**Verwendung:** `bootstrap-oidc.yml` (Credentials)
**Häufigkeit:** Nur bei Disaster Recovery
**Auth:** AWS Credentials (aus Secrets)

**Wann nötig:**
- ❌ IAM Role wurde versehentlich gelöscht
- ❌ OIDC Provider fehlt
- ❌ Policies wurden gelöscht
- ❌ Kompletter AWS Account Reset

### Destroy Infrastructure

**Verwendung:** `destroy.yml` (OIDC)
**Häufigkeit:** Bei Bedarf
**Auth:** OIDC

**Löscht:**
- ✅ Application Resources (Terraform managed)
- ✅ DynamoDB Tables
- ✅ Cognito User Pools
- ✅ API Gateways
- ❌ IAM Role (bleibt erhalten für Re-Deploy!)
- ❌ S3 Backend (bleibt erhalten für State History!)

## Best Practices

### 1. Bootstrap User Berechtigungen minimieren

Der Bootstrap User braucht NUR:
- `iam:CreateOpenIDConnectProvider`
- `iam:CreateRole`
- `iam:CreatePolicy`
- `iam:AttachRolePolicy`

**NICHT:**
- Keine DynamoDB Permissions
- Keine Lambda Permissions
- Keine Amplify Permissions

### 2. Bootstrap Credentials sicher aufbewahren

Die AWS Credentials für Bootstrap:
- ✅ Nur in GitHub Secrets
- ✅ Nicht im Code
- ✅ Nicht lokal speichern
- ✅ Regelmäßig rotieren

### 3. IAM Role niemals manuell löschen

Die `ecokart-github-actions-role` ist kritisch:
- ❌ Nicht im destroy.yml löschen
- ❌ Nicht manuell in AWS Console löschen
- ✅ Terraform kann sie verwalten (aber nicht löschen)

### 4. Terraform managed die Role nach Bootstrap

Nach dem Bootstrap:
- ✅ Terraform importiert die Role
- ✅ Terraform verwaltet Policy Changes
- ✅ Terraform aktualisiert Trust Policy
- ❌ Terraform löscht die Role NICHT (lifecycle protection)

## Troubleshooting

### "OIDC Provider already exists"

```bash
# Option 1: Workflow mit force_recreate=true ausführen
# Option 2: Manuell löschen
aws iam delete-open-id-connect-provider \
  --open-id-connect-provider-arn arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com
```

### "Role already exists"

```bash
# Prüfen ob Role korrekt konfiguriert ist
aws iam get-role --role-name ecokart-github-actions-role

# Trust Policy prüfen
aws iam get-role --role-name ecokart-github-actions-role \
  --query 'Role.AssumeRolePolicyDocument'

# Falls Trust Policy falsch: Bootstrap mit force_recreate=true
```

### "Bootstrap Credentials nicht vorhanden"

1. Erstelle Bootstrap User (siehe oben)
2. Füge Credentials zu GitHub Secrets hinzu
3. Workflow erneut ausführen

### "Deploy Workflow: Unable to assume role"

**Mögliche Ursachen:**
1. `AWS_ROLE_ARN` Secret fehlt → Zu Secrets hinzufügen
2. Trust Policy erlaubt falsches Repository → Bootstrap erneut ausführen
3. OIDC Provider fehlt → Bootstrap ausführen

## Kosten

**Bootstrap Infrastructure:**
- ✅ GitHub OIDC Provider: **$0** (kostenlos)
- ✅ IAM Role: **$0** (kostenlos)
- ✅ IAM Policies: **$0** (kostenlos)

**Gesamt: $0/Monat für CI/CD Infrastruktur!**

## Summary

✅ **100% Reproduzierbar:** Komplettes System kann neu aufgebaut werden
✅ **Sicher:** OIDC statt AWS Keys für normale Deployments
✅ **Kostenlos:** Bootstrap-Infrastruktur kostet nichts
✅ **Best Practice:** Folgt AWS empfohlenen Patterns
✅ **Disaster Recovery:** System kann nach kompletter Löschung wiederhergestellt werden
