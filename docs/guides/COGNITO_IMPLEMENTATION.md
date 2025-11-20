# 🔐 Cognito Authentication - Implementierungsplan

**Ziel:** JWT Auth durch AWS Cognito ersetzen

**Warum Cognito?**
- ✅ Email Verification automatisch
- ✅ Password Reset Flow fertig
- ✅ MFA Support (optional)
- ✅ Social Login möglich (Google, Facebook)
- ✅ Production-ready Security
- ✅ Keine eigene Auth-Logik mehr nötig

---

## 🎯 Was sich ändert

### Vorher (JWT):
```
Frontend → POST /auth/login → Lambda prüft Password → JWT Token
Frontend → GET /api/products (Header: JWT) → Lambda prüft JWT → DynamoDB
```

### Nachher (Cognito):
```
Frontend → Cognito (Sign Up / Login) → Cognito JWT Token
Frontend → GET /api/products (Header: Cognito JWT)
    → API Gateway prüft Token (BEVOR Lambda!)
    → Lambda bekommt User-Info automatisch
    → DynamoDB
```

**Vorteil:** API Gateway prüft Token → Lambda wird nur bei gültigem Token aufgerufen → Sicherer + Günstiger!

---

## 📦 Komponenten

### 1. Cognito User Pool (Terraform)
**Was ist das?**
- Die "User-Datenbank" in AWS
- Speichert: Email, Password (gehashed), User-Attribute

**Was wir konfigurieren:**
```
- Email als Username
- Password Policy (min. 8 Zeichen)
- Email Verification (Code per Email)
- Auto-Verification für Email
```

### 2. Cognito User Pool Client
**Was ist das?**
- Wie ein "API-Key" für unsere App
- Frontend nutzt Client ID um mit Cognito zu sprechen

### 3. API Gateway Authorizer
**Was ist das?**
- Prüft JWT Token BEVOR Request zu Lambda geht
- Bei ungültigem Token → 401 Unauthorized (Lambda wird nicht aufgerufen)

### 4. Frontend Integration
**Was ändert sich?**
- Sign Up / Login über AWS Amplify Auth Library
- Kein selbst gebautes Login-Form mehr
- Token wird automatisch bei jedem Request mitgeschickt

### 5. Backend Integration
**Was ändert sich?**
- Kein JWT Middleware mehr nötig
- User-Info kommt von API Gateway im Request Context
- `req.requestContext.authorizer.claims` enthält User-Daten

---

## 🛠️ Schritt-für-Schritt Implementation

### Schritt 1: Terraform Cognito Module (30 Min)

**Dateien:**
```
terraform/modules/cognito/
├── main.tf           # Cognito User Pool + Client
├── variables.tf      # Input-Variablen
└── outputs.tf        # User Pool ID, Client ID
```

**Was wird erstellt:**
1. Cognito User Pool
2. User Pool Client (für Frontend)
3. User Pool Domain (für Hosted UI - optional)

---

### Schritt 2: API Gateway Authorizer (20 Min)

**Datei:** `terraform/modules/lambda/api_gateway.tf`

**Was hinzufügen:**
```hcl
# Cognito Authorizer für API Gateway
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  provider_arns = [var.cognito_user_pool_arn]
}

# Methode mit Authorizer
resource "aws_api_gateway_method" "proxy" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  # ...
}
```

---

### Schritt 3: Backend Anpassung (30 Min)

**Was entfernen:**
- ❌ `backend/src/routes/authRoutes.ts` (altes JWT Login)
- ❌ JWT Middleware
- ❌ bcrypt Password Checking

**Was hinzufügen:**
```typescript
// backend/src/middleware/cognitoAuth.ts
export const getCognitoUser = (event: any) => {
  // API Gateway schreibt Cognito User in event.requestContext
  const claims = event.requestContext?.authorizer?.claims;

  return {
    userId: claims?.sub,              // Cognito User ID
    email: claims?.email,
    role: claims?.['custom:role']     // Custom Attribute
  };
};
```

**In Lambda Handler:**
```typescript
// lambda.ts
export const handler = async (event: any, context: any) => {
  // User aus Cognito Context extrahieren
  const user = getCognitoUser(event);

  // User im Request verfügbar machen
  event.cognitoUser = user;

  // Express Handler aufrufen
  return serverlessHandler(event, context);
};
```

---

### Schritt 4: Frontend Integration (1-2h)

**Installation:**
```bash
cd frontend
npm install aws-amplify @aws-amplify/ui-react
```

**Konfiguration:**
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

**Sign Up Component:**
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

    // 2. User bekommt Email mit Code
    // 3. Code eingeben
    const code = prompt('Verification Code aus Email:');

    // 4. Bestätigen
    await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    alert('Account erstellt! Du kannst dich jetzt einloggen.');
  } catch (error) {
    console.error('Sign Up Error:', error);
  }
};
```

**Login Component:**
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
      router.push('/shop'); // Weiter zum Shop
    }
  } catch (error) {
    console.error('Login Error:', error);
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
const products = await fetchWithAuth('/api/products');
```

---

### Schritt 5: Testing (30 Min)

**Test Cases:**

1. **Sign Up Flow:**
```
✓ Email eingeben → Account erstellen
✓ Email mit Code erhalten
✓ Code eingeben → Account aktiviert
✓ Login möglich
```

2. **Login Flow:**
```
✓ Falsche Email → Error
✓ Falsches Password → Error
✓ Richtige Credentials → Token erhalten
✓ Token in API Call → Funktioniert
```

3. **API Protection:**
```
✓ Request ohne Token → 401 Unauthorized
✓ Request mit ungültigem Token → 401
✓ Request mit gültigem Token → 200 OK
```

4. **Password Reset:**
```
✓ "Forgot Password" → Email mit Code
✓ Code + Neues Password → Password geändert
✓ Login mit neuem Password → Funktioniert
```

---

## 🔄 Migration Plan

### Phase 1: Parallel Betrieb (Empfohlen)
```
Alte User (JWT) → behalten alten Login
Neue User → Cognito Sign Up
```

**Vorteil:** Keine Disruption, schrittweise Migration

### Phase 2: Cognito Only
```
Alle User müssen sich neu registrieren
Alte JWT-Logik wird entfernt
```

**Für unser Showcase:** Phase 2 (Clean Start)

---

## 📝 Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_USER_POOL_ID=eu-north-1_XXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXX
NEXT_PUBLIC_API_URL=https://xxx.execute-api.eu-north-1.amazonaws.com/Prod
```

**Backend:**
Keine neuen Env Vars nötig! Cognito User-Info kommt via API Gateway Event.

---

## 🎯 Success Criteria

Sprint ist fertig wenn:
- [ ] User kann sich registrieren (Sign Up)
- [ ] Email Verification funktioniert
- [ ] User kann sich einloggen
- [ ] API Calls mit Cognito Token funktionieren
- [ ] Ungültige Tokens werden abgelehnt (401)
- [ ] Password Reset Flow funktioniert
- [ ] Admin-User kann sich einloggen
- [ ] Stock Management funktioniert weiterhin

---

## 🚀 Los geht's!

**Nächster Schritt:** Terraform Cognito Module erstellen

Siehe: `terraform/modules/cognito/main.tf`

---

**Geschätzte Dauer:** 4-6 Stunden
**Schwierigkeit:** Mittel
**Priorität:** HIGH (Foundation für Payment)
