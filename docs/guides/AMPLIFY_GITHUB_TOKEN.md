# GitHub Personal Access Token für Amplify erstellen

## Schritt-für-Schritt Anleitung

### 1. GitHub öffnen

Gehe zu: https://github.com/settings/tokens

### 2. "Generate new token" klicken

Wähle: **"Generate new token (classic)"**

### 3. Token konfigurieren

**Note:** `Terraform Amplify Deployment`

**Expiration:** `90 days` (oder länger)

**Select scopes:**
- ✅ **repo** (Full control of private repositories)
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo
  - ✅ repo:invite
  - ✅ security_events

### 4. Token generieren & kopieren

Klicke **"Generate token"**

⚠️ **WICHTIG:** Token wird nur EINMAL angezeigt!

Kopiere den Token sofort: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Token in terraform.tfvars speichern

```bash
cd terraform/examples/basic

# terraform.tfvars bearbeiten
nano terraform.tfvars
```

Füge hinzu:
```hcl
github_access_token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Sicherheitshinweise

⚠️ **NIEMALS in Git committen!**

`.gitignore` verhindert bereits:
- `*.tfvars` ✅
- `terraform.tfvars` ✅

Token ist nur lokal gespeichert.

---

## Token-Berechtigungen

Der Token braucht:
- ✅ **Lese-Zugriff** auf Repository Code
- ✅ **Deployment-Rechte** für Amplify Webhooks
- ❌ **KEINE** Schreib-Rechte auf Code (sicherer!)

---

## Troubleshooting

**Problem:** "Bad credentials"
→ Token abgelaufen oder falsch kopiert

**Problem:** "Repository not found"
→ Token hat keinen Zugriff auf Private Repos

**Lösung:** Neuen Token mit `repo` Scope erstellen
