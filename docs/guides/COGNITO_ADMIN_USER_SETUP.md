# 👤 Cognito Admin User erstellen

**Anleitung**: Wie man einen Admin-Benutzer in AWS Cognito erstellt

---

## 🎯 Was du brauchst

Nach dem Deployment von Cognito hast du:
- ✅ Cognito User Pool (AWS Console)
- ✅ Customer Frontend (mit Login/Register Pages)
- ❌ **Noch KEINEN Admin User** (muss manuell erstellt werden)

---

## 📋 Schritt-für-Schritt Anleitung

### Schritt 1: AWS Console öffnen

1. Gehe zur **AWS Console**: https://console.aws.amazon.com
2. Region: **Stockholm (eu-north-1)** auswählen (oben rechts)
3. Service: **Cognito** suchen und öffnen

### Schritt 2: User Pool finden

1. Klicke auf **"User pools"** im linken Menü
2. Du siehst eine Liste mit allen User Pools
3. Suche nach: **`ecokart-development-users`** (oder `staging`/`production` je nach Environment)
4. **Klick auf den User Pool** um ihn zu öffnen

### Schritt 3: Neuen User erstellen

1. Im User Pool: Klicke auf **"Create user"** Button (oben rechts)
2. Fülle das Formular aus:

**Benutzer-Informationen:**
```
Email address (Username): admin@ecokart.com
```

**Temporary password:**
```
Ecokart2025!
```
✅ Checkboxen:
- ✅ "Mark email address as verified" - **WICHTIG! Aktivieren!**
- ✅ "Send an email invitation" - Optional (kannst du deaktivieren wenn du Kosten sparen willst)

**Wichtig**: Email muss als "verified" markiert werden, sonst kann sich der User nicht einloggen!

3. Klicke auf **"Create user"**

### Schritt 4: Admin-Role zuweisen

Jetzt hat der User noch die Standard-Role "customer". Wir müssen ihm die "admin"-Role geben:

1. In der User-Liste: **Klick auf den User** (`admin@ecokart.com`)
2. Im User-Detail: Scrolle runter zu **"User attributes"**
3. Klicke auf **"Edit"**
4. Suche das Attribut: **`custom:role`**
5. Falls es nicht existiert: Klicke auf **"Add attribute"**
   - Attribute name: `custom:role`
   - Attribute value: `admin`
6. Falls es existiert: Ändere den Wert zu **`admin`**
7. Klicke auf **"Save changes"**

### Schritt 5: Fertig! Erster Login testen

1. Gehe zum Customer Frontend (Amplify URL aus Terraform Output)
2. Klicke auf **"JETZT ANMELDEN"**
3. Login mit:
   ```
   Email: admin@ecokart.com
   Password: Ecokart2025!
   ```
4. Du wirst aufgefordert ein **neues Passwort** zu setzen (first login)
5. Wähle ein neues sicheres Passwort
6. ✅ **Fertig! Du bist als Admin eingeloggt**

---

## 🔐 Standard Admin Credentials

Nach dem Setup hast du folgende Test-User:

### Admin User
```
Email:    admin@ecokart.com
Password: <dein gewähltes Passwort nach first login>
Role:     admin
```

### Optional: Weitere Test-User erstellen

Du kannst weitere Test-User erstellen:

**Customer User (Standard):**
```
Email:    kunde@ecokart.com
Password: Test1234!
Role:     customer (automatisch)
```

**Weitere Admins:**
```
Email:    andy@ecokart.com
Password: Admin2025!
Role:     admin (manuell setzen)
```

---

## 🚨 Troubleshooting

### Problem: "User is not confirmed"
- ❌ Email wurde nicht als "verified" markiert
- ✅ Lösung: In AWS Console → User bearbeiten → "Email verified" Status auf "true" setzen

### Problem: "User hat keine Admin-Rechte"
- ❌ `custom:role` Attribut fehlt oder falsch
- ✅ Lösung: User Attribute bearbeiten → `custom:role` = `admin`

### Problem: "Temporary password expired"
- ❌ User wurde erstellt aber zu lange nicht eingeloggt
- ✅ Lösung: In AWS Console → User auswählen → "Reset password" → Neues Temp-Passwort vergeben

### Problem: "NotAuthorizedException"
- ❌ Falsches Passwort oder User existiert nicht
- ✅ Lösung: Credentials prüfen oder User neu erstellen

---

## 📊 User Pool Konfiguration (Info)

Dein Cognito User Pool hat folgende Einstellungen:

**Username:**
- ✅ Email als Username (kein separater Username nötig)

**Password Policy:**
- Mindestens 8 Zeichen
- Mindestens 1 Großbuchstabe
- Mindestens 1 Kleinbuchstabe
- Mindestens 1 Zahl
- Sonderzeichen: Optional

**Verification:**
- ✅ Automatische Email-Verification
- Code-Typ: 6-stelliger Zahlencode
- Gültigkeit: 24 Stunden

**Token Validity:**
- ID Token: 60 Minuten
- Access Token: 60 Minuten
- Refresh Token: 7 Tage

**Custom Attributes:**
- `custom:role` - String - "admin" oder "customer"

---

## 💡 Best Practices

1. **Admin Users sollten persönliche Emails haben**
   - ✅ `andy@ecokart.com`, `maria@ecokart.com`
   - ❌ Nicht: `admin@ecokart.com` für mehrere Personen teilen

2. **Starke Passwörter verwenden**
   - Mindestens 12 Zeichen
   - Mix aus Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
   - Passwort-Manager verwenden!

3. **MFA aktivieren** (für Production!)
   - Cognito unterstützt TOTP (Google Authenticator)
   - In `terraform/modules/cognito/main.tf` aktivieren

4. **Regelmäßig überprüfen wer Admin-Rechte hat**
   - AWS Console → User Pool → Filter by attribute `custom:role = admin`

---

## 🔗 Nächste Schritte

Nach dem Admin User Setup:
- ✅ Admin Frontend testen
- ✅ Stock Management Features testen
- ✅ Order Management testen
- ✅ Siehe: [COGNITO_TESTING.md](./COGNITO_TESTING.md) für Test-Plan
