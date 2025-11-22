# 🔐 AWS Cognito Authentication - Complete Guide

**Vollständige Dokumentation für Cognito Integration in Ecokart Webshop**

---

## 📊 Status

> **⚠️ DEPLOYMENT STATUS (22.11.2025):**
> - ✅ **Code vollständig implementiert** - alle Features fertig
> - ✅ **E2E Testing erfolgreich** - Login → Cart → Orders funktioniert
> - 🔴 **Deployment blocked** - AWS Organizations SCP verbietet Cognito
> - 📋 **Action Required:** Organization Admin muss SCP Policy updaten
> - 🔗 **Details:** Siehe [ACTION_PLAN.md - Known Issues](../ACTION_PLAN.md#known-issues--blockers)

---

## 🎯 Warum Cognito?

**Von Custom JWT zu AWS Cognito:**

### Vorher (Custom JWT):
```
Frontend → POST /auth/login → Lambda prüft Password → JWT Token
Frontend → GET /api/products (Header: JWT) → Lambda prüft JWT → DynamoDB
```

**Probleme:**
- ❌ Eigene Auth-Logik fehleranfällig
- ❌ Email Verification manuell
- ❌ Password Reset selbst bauen
- ❌ Security Patches selbst managen
- ❌ Token-Prüfung kostet Lambda-Zeit

### Nachher (Cognito):
```
Frontend → Cognito (Sign Up / Login) → Cognito JWT Token
Frontend → GET /api/products (Header: Cognito JWT)
    → API Gateway prüft Token (BEVOR Lambda!)
    → Lambda bekommt User-Info automatisch
    → DynamoDB
```

**Vorteile:**
- ✅ **Email Verification automatisch** - 6-stelliger Code per Email
- ✅ **Password Reset Flow fertig** - "Forgot Password" sofort nutzbar
- ✅ **Production-ready Security** - AWS managed, regelmäßige Updates
- ✅ **MFA Support** - TOTP (Google Authenticator) optional
- ✅ **Social Login möglich** - Google, Facebook, Apple (zukünftig)
- ✅ **API Gateway Authorizer** - Token-Prüfung vor Lambda → sicherer + günstiger
- ✅ **Keine eigene Auth-Logik** - weniger Code, weniger Bugs

---

## 📦 Architektur

### Komponenten

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - AWS Amplify Auth Library                              │
│  - Login/Register Pages                                  │
│  - Token Storage (localStorage)                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓ Cognito JWT Token
┌─────────────────────────────────────────────────────────┐
│              AWS Cognito User Pool                       │
│  - User Storage (Emails, Passwords)                      │
│  - Email Verification (6-digit code)                     │
│  - Password Reset Flow                                   │
│  - JWT Token Generation                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓ JWT Token
┌─────────────────────────────────────────────────────────┐
│              API Gateway Authorizer                      │
│  - Validates JWT Token                                   │
│  - Rejects invalid tokens (401) BEFORE Lambda            │
│  - Passes user info to Lambda                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓ User Info in Request Context
┌─────────────────────────────────────────────────────────┐
│              Lambda (Express Backend)                    │
│  - req.user available automatically                      │
│  - No token verification needed                          │
│  - Business logic only                                   │
└─────────────────────────────────────────────────────────┘
```

### Terraform Module

**Struktur:**
```
terraform/modules/cognito/
├── main.tf           # Cognito User Pool + Client + Domain
├── variables.tf      # Input-Variablen
├── outputs.tf        # User Pool ID, Client ID, ARN
└── README.md         # Module Documentation
```

**Was wird erstellt:**
1. **Cognito User Pool** - Die "User-Datenbank"
2. **User Pool Client** - API Key für Frontend
3. **User Pool Domain** - Für Hosted UI (optional)
4. **Custom Attributes** - `custom:role` (admin/customer)
5. **Email Configuration** - Verification Codes
6. **Password Policy** - Min. 8 Zeichen, Komplexität
7. **Lifecycle Protection** - Verhindert versehentliches Löschen

---

## 🛠️ Implementation

### 1. Terraform Configuration

**Included in Ecokart Terraform:**

```hcl
# terraform/main.tf
module "cognito" {
  source = "./modules/cognito"

  environment           = var.environment
  project_name          = var.project_name
  cognito_admin_email   = var.cognito_admin_email
  cognito_admin_temp_password = var.cognito_admin_temp_password
  enable_admin_provisioning = var.enable_admin_provisioning
}

# API Gateway Authorizer
module "lambda" {
  source = "./modules/lambda"

  cognito_user_pool_arn = module.cognito.user_pool_arn
  enable_cognito_auth   = true
  # ...
}
```

**Environment Variables (Terraform):**
```hcl
# terraform/environments/development.tfvars
cognito_admin_email         = "admin@ecokart.com"
cognito_admin_temp_password = "EcokartAdmin2025!"
enable_admin_provisioning   = true
```

### 2. Backend Integration

**Middleware Setup:**

```typescript
// backend/src/index.ts
import express from 'express';
import { attachCognitoUser } from './middleware/cognitoAuth';

const app = express();

// ... CORS, JSON parser, etc. ...

// ✅ Cognito User an ALLE Requests anhängen
app.use(attachCognitoUser);

// Routes
app.use('/api', routes);
```

**Route Protection:**

```typescript
// backend/src/routes/cartRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/cognitoAuth';

const router = Router();

// ✅ Öffentlich - kein Login nötig
router.get('/api/products', productController.list);

// ✅ Geschützt - nur eingeloggte User
router.post('/api/cart', requireAuth, cartController.addToCart);
router.get('/api/cart', requireAuth, cartController.getCart);

// ✅ Nur Admins
router.post('/api/products', requireAdmin, productController.create);

export default router;
```

**Controller Usage:**

```typescript
// backend/src/controllers/cartController.ts
import { Request, Response } from 'express';

export async function addToCart(req: Request, res: Response) {
  // req.user ist GARANTIERT gesetzt (wegen requireAuth middleware)
  const userId = req.user!.userId;
  const { productId, quantity } = req.body;

  await addItemToCart(userId, productId, quantity);
  res.json({ success: true });
}
```

**User Info Interface:**

```typescript
// backend/src/middleware/cognitoAuth.ts
interface AuthUser {
  userId: string;         // Cognito User ID (UUID)
  email: string;          // Email-Adresse
  role: string;           // "admin" oder "customer"
  emailVerified: boolean; // Email verifiziert?
}

// Verfügbar in allen Requests via req.user
```

### 3. Frontend Integration

**Installation:**

```bash
cd frontend  # oder admin-frontend
npm install aws-amplify @aws-amplify/ui-react
```

**Amplify Configuration:**

```typescript
// frontend/app/lib/amplify.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      region: 'eu-north-1'
    }
  }
});
```

**Environment Variables (.env.local):**

```bash
NEXT_PUBLIC_USER_POOL_ID=eu-north-1_XXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXX
NEXT_PUBLIC_API_URL=https://xxx.execute-api.eu-north-1.amazonaws.com/Prod
```

**Sign Up Flow:**

```typescript
// frontend/app/auth/signup/page.tsx
import { signUp, confirmSignUp } from 'aws-amplify/auth';

const handleSignUp = async (email: string, password: string) => {
  try {
    // 1. Sign Up
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: { email }
      }
    });

    console.log('User erstellt:', userId);

    // 2. User bekommt Email mit 6-stelligem Code
    // 3. Code Verification Page zeigen
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error('Sign Up Error:', error);
    setError('Registrierung fehlgeschlagen');
  }
};
```

**Email Verification:**

```typescript
// frontend/app/auth/verify/page.tsx
import { confirmSignUp, autoSignIn } from 'aws-amplify/auth';

const handleVerify = async (email: string, code: string) => {
  try {
    // 1. Code bestätigen
    await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    // 2. Auto-Login nach Verification
    await autoSignIn();

    // 3. Weiter zum Shop
    router.push('/shop');
  } catch (error) {
    console.error('Verification Error:', error);
    setError('Ungültiger Code');
  }
};
```

**Login Flow:**

```typescript
// frontend/app/auth/login/page.tsx
import { signIn } from 'aws-amplify/auth';

const handleLogin = async (email: string, password: string) => {
  try {
    const { isSignedIn } = await signIn({
      username: email,
      password
    });

    if (isSignedIn) {
      router.push('/shop');
    }
  } catch (error) {
    console.error('Login Error:', error);
    setError('Login fehlgeschlagen');
  }
};
```

**API Calls mit Token:**

```typescript
// frontend/app/lib/api.ts
import { fetchAuthSession } from 'aws-amplify/auth';

export async function fetchWithAuth(url: string, options = {}) {
  // Token automatisch holen
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}

// Nutzung:
const response = await fetchWithAuth('/api/cart', {
  method: 'POST',
  body: JSON.stringify({ productId, quantity })
});
```

**Auth Context (Optional):**

```typescript
// frontend/app/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 👤 Admin User Setup

### Automatisches Admin-Provisioning

**✅ Seit 20.11.2025: Automatische Admin-Erstellung beim Deployment!**

**Was passiert:**
1. Terraform deployed Cognito User Pool
2. Terraform Provisioner (`null_resource`) läuft automatisch
3. AWS CLI erstellt Admin User:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <pool-id> \
     --username admin@ecokart.com \
     --temporary-password "EcokartAdmin2025!" \
     --user-attributes Name=email,Value=admin@ecokart.com Name=email_verified,Value=true Name=custom:role,Value=admin
   ```
4. ✅ Admin User ist ready!

**Standard Admin Credentials:**
```
Email:    admin@ecokart.com
Password: EcokartAdmin2025! (muss beim ersten Login geändert werden)
Role:     admin
```

**Konfiguration:**
```hcl
# terraform/variables.tf
variable "cognito_admin_email" {
  default = "admin@ecokart.com"
}

variable "cognito_admin_temp_password" {
  default = "EcokartAdmin2025!"
  sensitive = true
}

variable "enable_admin_provisioning" {
  default = true
}
```

### Manuelle Admin-Erstellung (Fallback)

**Wann nötig:**
- Auto-Provisioning deaktiviert (`enable_admin_provisioning=false`)
- Auto-Provisioning Script fehlgeschlagen
- Zusätzliche Admin-User erstellen

**Schritte:**

```bash
# 1. AWS Console öffnen
# https://console.aws.amazon.com → Cognito → User Pools

# 2. User Pool auswählen
# ecokart-development-users (oder staging/production)

# 3. "Create user" klicken

# 4. Formular ausfüllen:
# Email: admin@ecokart.com
# Password: EcokartAdmin2025!
# ✅ Mark email address as verified

# 5. User erstellen

# 6. User öffnen → "User attributes" → Edit
# custom:role = admin

# 7. Fertig!
```

---

## 🧪 Testing

### Test Cases

**1. Sign Up Flow:**
```
✓ Email eingeben → Account erstellen
✓ Email mit 6-stelligem Code erhalten
✓ Code eingeben → Account aktiviert
✓ Auto-Login funktioniert
```

**2. Login Flow:**
```
✓ Falsche Email → Error "User does not exist"
✓ Falsches Password → Error "Incorrect username or password"
✓ Richtige Credentials → Token erhalten + Redirect
✓ Token in localStorage gespeichert
```

**3. API Protection:**
```
✓ Request ohne Token → 401 Unauthorized
✓ Request mit ungültigem Token → 401 Unauthorized
✓ Request mit gültigem Token → 200 OK
✓ req.user in Backend verfügbar
```

**4. Password Reset:**
```
✓ "Forgot Password" → Email mit Code
✓ Code + Neues Password → Password geändert
✓ Login mit neuem Password → Funktioniert
```

**5. Email Verification:**
```
✓ Sign Up → Email sent
✓ Code eingeben → Email verified
✓ Login ohne Verification → Funktioniert (email_verified=true forced)
```

**6. Admin Access:**
```
✓ Admin User Login → Funktioniert
✓ Admin API Call (POST /api/products) → 200 OK
✓ Customer API Call (POST /api/products) → 403 Forbidden
✓ req.user.role === "admin" in Backend
```

### Manuelle Tests via AWS CLI

```bash
# 1. User erstellen (Test-User)
aws cognito-idp admin-create-user \
  --user-pool-id eu-north-1_XXXXXXX \
  --username test@example.com \
  --temporary-password "Test1234!" \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true

# 2. Login (Token holen)
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id eu-north-1_XXXXXXX \
  --client-id YYYYYY \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=Test1234! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# 3. API Call mit Token
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR-API.execute-api.eu-north-1.amazonaws.com/Prod/api/cart

# Erwarte: 200 OK (falls Route mit requireAuth geschützt)
```

---

## 🚨 Troubleshooting

### "401 Unauthorized" trotz Login

**Symptome:**
- User ist eingeloggt (Frontend zeigt "Logged in")
- API Calls geben 401
- localStorage hat Tokens

**Debugging:**

```javascript
// Browser DevTools Console:
console.log(localStorage.getItem('idToken'));  // Sollte Token zeigen

// Check Token Expiry
const token = localStorage.getItem('idToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
console.log('Is Expired:', payload.exp * 1000 < Date.now());
```

**Mögliche Ursachen:**
1. ❌ Token expired (nach 60 Minuten)
   - Lösung: Refresh Token nutzen oder re-login
2. ❌ Token nicht im Authorization Header
   - Lösung: `fetchWithAuth` Utility nutzen
3. ❌ API Gateway Authorizer nicht konfiguriert
   - Lösung: Terraform Module prüfen

### "User is not confirmed"

**Problem:** User kann sich nicht einloggen

**Lösung:**
```bash
# Email als verified markieren
aws cognito-idp admin-update-user-attributes \
  --user-pool-id eu-north-1_XXXXXXX \
  --username test@example.com \
  --user-attributes Name=email_verified,Value=true
```

### "NotAuthorizedException: Incorrect username or password"

**Mögliche Ursachen:**
1. ❌ Falsches Passwort
2. ❌ Email falsch geschrieben
3. ❌ User existiert nicht
4. ❌ User Pool ID falsch in Frontend Config

**Debugging:**
```bash
# User existiert?
aws cognito-idp admin-get-user \
  --user-pool-id eu-north-1_XXXXXXX \
  --username test@example.com
```

### "AccessDeniedException: with an explicit deny in a service control policy"

**Problem:** AWS Organizations SCP blockiert Cognito

**Status:** AKTUELLES DEPLOYMENT-BLOCKER (22.11.2025)

**Lösung:**
1. Organization Admin kontaktieren
2. SCP Policy updaten (Cognito Services freigeben)
3. Nach Freigabe: `terraform apply`

**Code ist fertig** - nur Deployment blockiert!

### Frontend: Tokens nicht in localStorage

**Problem:** Nach Login sind localStorage/sessionStorage leer

**Symptome:**
```javascript
console.log(localStorage);  // Storage {length: 0}
```

**Debugging:**
```typescript
// In Auth Code (Login/SignUp):
import { fetchAuthSession } from 'aws-amplify/auth';

const session = await fetchAuthSession();
console.log('Tokens:', session.tokens);

// Tokens MANUELL speichern (sollte automatisch sein):
if (session.tokens?.idToken) {
  localStorage.setItem('idToken', session.tokens.idToken.toString());
  localStorage.setItem('accessToken', session.tokens.accessToken.toString());
  localStorage.setItem('refreshToken', session.tokens.refreshToken?.toString());
}
```

**Lesson Learned #18:** Frontend Auth Code muss Tokens explizit persistieren!

---

## 🔐 Security Best Practices

### Password Policy

**Konfiguriert in Terraform:**
```hcl
resource "aws_cognito_user_pool" "main" {
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
    temporary_password_validity_days = 7
  }
}
```

**Empfehlungen:**
- ✅ Mindestens 8 Zeichen (besser: 12+)
- ✅ Mix aus Groß-/Kleinbuchstaben, Zahlen
- ✅ Sonderzeichen optional (für bessere UX)
- ✅ Passwort-Manager verwenden

### Token Validity

**Konfiguriert:**
```hcl
resource "aws_cognito_user_pool_client" "client" {
  id_token_validity      = 60    # 60 Minuten
  access_token_validity  = 60    # 60 Minuten
  refresh_token_validity = 7     # 7 Tage
  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }
}
```

**Best Practice:**
- ID/Access Tokens: Kurz (60 Min) → Security
- Refresh Token: Länger (7 Tage) → UX

### MFA (Multi-Factor Authentication)

**Optional - für Production empfohlen:**

```hcl
resource "aws_cognito_user_pool" "main" {
  mfa_configuration = "OPTIONAL"  # OPTIONAL oder ON

  software_token_mfa_configuration {
    enabled = true  # TOTP (Google Authenticator)
  }
}
```

**Aktivieren:**
```typescript
// Frontend
import { setUpTOTP } from 'aws-amplify/auth';

const totpSetup = await setUpTOTP();
// QR Code zeigen → User scannt mit Authenticator App
```

### Lifecycle Protection

**Verhindert versehentliches Löschen:**

```hcl
resource "aws_cognito_user_pool" "main" {
  lifecycle {
    prevent_destroy = true
  }
}
```

**⚠️ WICHTIG:**
- Production: IMMER aktiviert
- Development: Kann deaktiviert werden für Testing
- Vor Destroy: Lifecycle Block kommentieren

---

## 📋 Migration from Old JWT Auth

### Phase 1: Code implementieren ✅

**Backend:**
- [x] Cognito Middleware implementiert
- [x] Routes mit requireAuth/requireAdmin geschützt
- [x] Alte JWT Middleware NOCH aktiv (parallel)

**Frontend:**
- [x] Amplify Auth Library integriert
- [x] Login/Register Pages erstellt
- [x] Email Verification Flow implementiert

**Terraform:**
- [x] Cognito Module erstellt
- [x] API Gateway Authorizer konfiguriert
- [x] Admin Auto-Provisioning implementiert

### Phase 2: Deployment ⏳ BLOCKED

**Status:** AWS Organizations SCP blockiert Cognito
**Action:** Warten auf SCP-Update

### Phase 3: Migration (Nach SCP-Fix)

**Schritte:**
```bash
# 1. Deploy Cognito
terraform apply

# 2. Admin User automatisch erstellt ✅

# 3. Alte JWT Auth BEHALTEN (Parallel-Betrieb)
# → Bestehende User können sich noch einloggen

# 4. Neue User nutzen Cognito
# → Sign Up Flow zeigt Cognito Registration

# 5. Nach 2-4 Wochen: Alte Auth entfernen
# → Migration für alte User (Email senden: "Bitte neu registrieren")
```

### Phase 4: Cleanup (Zukünftig)

**Was löschen:**
```typescript
// ❌ Entfernen:
backend/src/routes/authRoutes.ts       // Alte JWT Login
backend/src/middleware/auth.ts         // JWT Middleware
backend/src/utils/jwt.ts               // JWT Signing/Verification

// ❌ Dependencies entfernen:
npm uninstall jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
```

---

## 📖 Weitere Referenzen

### Terraform Module
- **Module README:** [terraform/modules/cognito/README.md](../../terraform/modules/cognito/README.md)
- **Lambda Integration:** [terraform/modules/lambda/COGNITO_INTEGRATION.md](../../terraform/modules/lambda/COGNITO_INTEGRATION.md)

### AWS Dokumentation
- **Cognito User Pools:** https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html
- **API Gateway Authorizers:** https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html

### Amplify Dokumentation
- **Amplify Auth (Next.js):** https://docs.amplify.aws/nextjs/build-a-backend/auth/
- **Auth API Reference:** https://docs.amplify.aws/javascript/build-a-backend/auth/

### Ecokart Docs
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Lessons Learned:** [../LESSONS_LEARNED.md](../LESSONS_LEARNED.md) (Lessons #15-22)
- **Action Plan:** [../ACTION_PLAN.md](../ACTION_PLAN.md)

---

**Erstellt:** 22. November 2025
**Letzte Aktualisierung:** 22. November 2025
**Autor:** Andy Schlegel & Claude
**Status:** Code Complete - Deployment Blocked by AWS SCP
