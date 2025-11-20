# 🔐 Cognito Integration - API Gateway

## Übersicht

Das Lambda-Modul unterstützt jetzt optionale Cognito-Authentifizierung via API Gateway Authorizer.

## Wie funktioniert es?

### Ohne Cognito (Aktuell)
```
User → API Gateway → Lambda (prüft alles selbst)
```

### Mit Cognito (Nach Integration)
```
User → API Gateway (prüft Token!) → Lambda (bekommt User-Info)
                ↓
          Ungültiger Token?
          → 401 Unauthorized
          → Lambda wird NICHT aufgerufen
```

**Vorteil:** Günstiger + Sicherer!

## Aktivierung

### 1. Cognito User Pool erstellen

```hcl
# In deinem main.tf
module "cognito" {
  source       = "./modules/cognito"
  project_name = "ecokart"
  environment  = "development"
}
```

### 2. Lambda Modul mit Cognito ARN aufrufen

```hcl
module "lambda" {
  source = "./modules/lambda"

  # ... existing variables ...

  # NEU: Cognito Integration
  cognito_user_pool_arn = module.cognito.user_pool_arn
  enable_cognito_auth   = true  # Aktiviert Authorizer
}
```

### 3. Terraform Apply

```bash
terraform apply
```

## Welche Routes sind geschützt?

### Aktuell: Alle Routes offen (NONE)

```hcl
# main.tf - Line 140
authorization = "NONE"
```

### Phase 1: Öffentliche Produkt-API

**Öffentlich (kein Auth):**
- `GET /api/products` - Jeder kann Produkte sehen
- `GET /api/products/:id` - Jeder kann Details sehen

**Geschützt (Cognito):**
- `POST /api/cart` - Nur eingeloggte User
- `POST /api/orders` - Nur eingeloggte User
- `GET /api/users/me` - Nur eingeloggte User

**Admin (Cognito + Role Check im Lambda):**
- `POST /api/products` - Nur Admins
- `PUT /api/products/:id` - Nur Admins
- `DELETE /api/products/:id` - Nur Admins

### Wie Route schützen?

**Option A: Im API Gateway (empfohlen)**

```hcl
# Für geschützte Routes
resource "aws_api_gateway_method" "protected" {
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito[0].id
  # ...
}
```

**Problem:** Mit `{proxy+}` Route schwierig (catch-all)

**Option B: Im Lambda Code (einfacher für Showcase)**

Lambda prüft selbst ob Token vorhanden ist:

```typescript
// backend/src/middleware/auth.ts
export const requireAuth = (req, res, next) => {
  // User-Info von API Gateway Context
  const user = req.apiGateway?.event?.requestContext?.authorizer?.claims;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};

// In Routes:
router.post('/api/cart', requireAuth, cartController.addToCart);
```

**Vorteil:** Flexible, Route-by-Route Kontrolle

## Testing

### 1. User erstellen

```bash
aws cognito-idp sign-up \
  --client-id YOUR_CLIENT_ID \
  --username test@example.com \
  --password "Test1234!"
```

### 2. Token holen

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD="Test1234!"
```

### 3. API Call mit Token

```bash
# Token aus Schritt 2 kopieren
TOKEN="eyJraWQ..."

# Geschützte Route aufrufen
curl -H "Authorization: Bearer $TOKEN" \
  https://your-api.execute-api.eu-north-1.amazonaws.com/Prod/api/cart
```

**Erwartung:**
- Mit Token: 200 OK
- Ohne Token: 401 Unauthorized
- Ungültiger Token: 401 Unauthorized

## Empfohlene Strategie für Ecokart

### Phase 1: Hybrid (JETZT)
```
✅ Cognito Modul existiert
✅ API Gateway Authorizer konfiguriert
⏳ Aber noch nicht aktiv (authorization = NONE)
⏳ Lambda macht eigene Checks
```

### Phase 2: Selektiver Schutz
```
✅ Öffentliche Routes bleiben NONE
✅ Cart/Orders nutzen Cognito Authorizer
✅ Admin-Routes: Authorizer + Role-Check im Lambda
```

### Phase 3: Full Cognito
```
✅ Alle Routes (außer GET Products) nutzen Authorizer
✅ Lambda prüft nur noch Roles (admin vs. customer)
```

## Debugging

### Authorizer aktiv?

```bash
terraform output | grep cognito_authorizer
```

### Token validieren

Im AWS Console:
1. Cognito → User Pools
2. App Integration → App Client
3. Test Token

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/YOUR_FUNCTION --follow
```

## Kosten

**Ohne Authorizer:**
- API Gateway: $3.50 / 1M Requests
- Lambda: Bezahlt für ALLE Requests

**Mit Authorizer:**
- API Gateway: $3.50 / 1M Requests (gleich)
- Lambda: Bezahlt nur für VALIDE Requests
- **Ersparnis:** ~20-30% (weniger ungültige Requests)

## Migration von JWT zu Cognito

### 1. Alte JWT Routes behalten (Backwards Compatibility)

```typescript
// Beide Auth-Methoden parallel
router.post('/api/cart',
  (req, res, next) => {
    // Cognito Token?
    if (req.apiGateway?.event?.requestContext?.authorizer?.claims) {
      req.user = req.apiGateway.event.requestContext.authorizer.claims;
      return next();
    }

    // Alter JWT Token?
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        req.user = jwt.verify(token, SECRET);
        return next();
      } catch (err) {
        // Invalid JWT
      }
    }

    return res.status(401).json({ error: 'Unauthorized' });
  },
  cartController.addToCart
);
```

### 2. Schrittweise Migration

1. **Woche 1:** Beide Systeme parallel
2. **Woche 2:** Neue User nur Cognito
3. **Woche 3:** Alte User migrieren
4. **Woche 4:** JWT komplett entfernen

## Siehe auch

- [Cognito Module README](../cognito/README.md)
- [Cognito Implementation Guide](../../docs/guides/COGNITO_IMPLEMENTATION.md)
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)
