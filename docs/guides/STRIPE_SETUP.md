# 🧾 Stripe Setup Leitfaden

**Ziel:** Sicherstellen, dass jede Deployment-Umgebung die nötigen Stripe-Secrets besitzt. Ohne diese Keys schlägt die Checkout-Lambda fehl (HTTP 500). Diese Anleitung macht die Konfiguration 100 % reproduzierbar.

---

## 1. Stripe Test-Keys beschaffen
1. Melde dich bei [dashboard.stripe.com](https://dashboard.stripe.com) an.
2. Aktiviere **Testmodus** (oben rechts).
3. Navigiere zu **Developers → API keys**.
4. Notiere dir:
   - `sk_test_...` (Secret Key für Backend)
   - `whsec_...` (Webhook Signing Secret – erzeugst du unter **Developers → Webhooks**)

> 💡 Für dieses Projekt reicht Testmodus – Live-Keys fühlen sich genauso an, verursachen aber echte Kosten.

---

## 2. GitHub Actions Secrets befüllen
1. Repository öffnen → **Settings → Secrets and variables → Actions**.
2. Zwei Secrets anlegen/prüfen:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Nachdem die Werte gesetzt sind, **Deploy Workflow erneut ausführen** (`Actions → Deploy Ecokart Infrastructure → Run workflow`).  
   - Terraform bekommt die Secrets jetzt als Variablen (`-var stripe_secret_key=...`) und setzt sie als Lambda-Env-Variablen.
   - Fehlende Secrets führen dank Terraform-Validation sofort zu einem Plan-Fehler – kein stilles „leeres“ Deployment mehr.

---

## 3. Lokale Entwicklung
Damit `npm run dev` bzw. lokale Tests funktionieren, brauchst du ebenfalls gültige Keys:

```bash
cd backend
cp .env .env.local  # falls noch nicht geschehen
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

Für lokale Terraform-Läufe musst du die Variablen ebenfalls setzen:

```bash
export TF_VAR_stripe_secret_key="sk_test_..."
export TF_VAR_stripe_webhook_secret="whsec_..."
terraform -chdir=terraform plan -var-file="environments/development.tfvars"
```

> 📌 Vorteil: Jeder, der dieses Repo klont, weiß jetzt exakt, welche Variablen benötigt werden – kein Ratespiel mehr.

---

## 4. Smoke-Test nach neuer Konfiguration
1. Deployment auf `develop` pushen oder Workflow manuell triggern.
2. Checkout im Frontend öffnen (`https://develop.…/checkout`) und Bestellung starten.
3. DevTools → Network → `POST /api/checkout` muss `200` liefern und eine Stripe-URL zurückgeben.
4. Optional: `aws lambda get-function-configuration ...` prüfen – `STRIPE_SECRET_KEY` darf niemals leer sein.

---

## 5. Fehlerbilder & Lösungen
| Fehler | Ursache | Lösung |
|-------|---------|--------|
| `lambda: "STRIPE_SECRET_KEY is not set"` | Secret fehlt komplett | Secrets wie oben gesetzt? Workflow neu triggern |
| `Terraform plan` verlangt Eingaben | `TF_VAR_*` lokal nicht exportiert | `export TF_VAR_stripe_secret_key=…` setzen |
| Checkout leitet auf falsche Domain | `FRONTEND_URL` nicht korrekt gesetzt | Terraform `frontend_url` in passender `*.tfvars` anpassen |

---

**Ergebnis:** GitHub Actions können nur noch deployen, wenn Stripe korrekt konfiguriert ist. Gleichzeitig weiß jede:r Entwickler:in genau, welche lokalen Variablen nötig sind – reproduzierbarer geht’s nicht. 🛡️
